"""SentinelQA : prouve, sur une préproduction, qu'un compte accède à ce qu'il ne devrait pas.

Trois thèmes de failles, avec trois comptes de test :
- lecture : B, d'une autre entreprise, lit les données de A ;
- écriture : B modifie les données de A ;
- admin : C, salarié de la même entreprise que A, dépasse son rôle.

Quatre temps, avec deux agents H sur mesure (agents_h.py) qui se connectent par leur coffre :
1. Cartographie : l'agent explorateur parcourt l'application en cliquant, comme A, et comme C
   en parallèle. On garde les pages réellement affichées par leur navigateur.
2. Rejeux HTTP, déterministes : ils ne reposent jamais sur le texte rédigé par un agent.
   - Lecture : chaque page de A est redemandée par A puis par B. Même contenu = suspicion.
   - Admin : les pages de A que C ne voit pas dans son interface sont redemandées par C.
     Si la page de C reproduit celle de A, c'est une suspicion.
   - Écriture, seulement avec une autorisation humaine : B soumet les formulaires de A avec un
     marqueur. Si A voit ensuite le marqueur, c'est une suspicion. A remet ensuite la valeur d'origine.
3. Preuve : pour chaque suspicion, l'agent vérificateur ouvre la page et décrit ce qu'il voit.
   Une faille n'est « prouvée » que si le rejeu ET l'agent la confirment.
4. Rapport HTML et JSON, avec la comparaison à la vérité terrain et le coût de chaque session.

Usage : python sentinelqa.py https://url-de-preproduction [--autoriser-ecriture] [--partager]
"""

import argparse
import difflib
import html
import json
import os
import re
import secrets
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

import httpx
from pydantic import BaseModel, Field
from hai_agents import Client

from agents_h import EXPLORATEUR, MODELE, VERIFICATEUR, assurer_agents, preparer_coffres
from agents_missions import NOMS as AGENTS_MISSIONS, assurer_agent_mission, definition as definition_agent_mission
from base import Base
from cle_runner import cle_privee, dechiffrer, publier
from gravite import REGLE as REGLE_GRAVITE, classer, detecter
from hf import MODELE as MODELE_HF, hypotheses, recouper
from missions import CATALOGUE, NavigateurH, executer_mission, rapport_html as rapport_mission, valider_demande

ICI = Path(__file__).resolve().parent
AGENT = f"{EXPLORATEUR} et {VERIFICATEUR} ({MODELE})"
THEMES = {"lecture": "Lecture", "ecriture": "Écriture", "admin": "Admin"}


class Ressource(BaseModel):
    url: str = Field(description="URL complète de la page ou de l'API, avec ses paramètres")
    type: str = Field(description="Nature de la ressource, en français : fiche de paie, facture, liste de salariés, formulaire…")
    identifiant: str = Field(description="Identifiant visible dans l'URL ou sur la page")


class Cartographie(BaseModel):
    ressources: list[Ressource]


class Constat(BaseModel):
    confirme: bool = Field(description="Vrai si la page montre bien ce que la tâche te demande de vérifier")
    proprietaire: str = Field(description="À qui appartiennent les données affichées sur la page : l'entreprise ou la personne concernée par ces données, pas le compte connecté")
    ce_qui_est_visible: str = Field(description="Ce que la page affiche : noms, montants, textes")


class Journal:
    """Affiche chaque étape au terminal et, si un audit Supabase est rattaché, l'écrit dans son fil."""

    def __init__(self):
        self.base, self.audit_id, self.verrou = None, None, threading.Lock()

    def attacher(self, base, audit_id):
        self.base, self.audit_id = base, audit_id

    def __call__(self, message, type="info", **donnees):
        print(message, flush=True)
        if self.audit_id is None:
            return
        with self.verrou:  # les sessions des agents tournent dans plusieurs fils d'exécution
            try:
                self.base.ajouter("evenements", {"audit_id": self.audit_id, "type": type, "message": message.strip(),
                                                 "donnees": donnees or None})
            except httpx.HTTPError as erreur:  # le fil est secondaire : l'audit continue, le rapport local fait foi
                print(f"   (fil Supabase indisponible : {erreur.__class__.__name__})", flush=True)


journal = Journal()


def cle_api():
    """Lit la clé rangée par `holo login`, sans jamais l'afficher."""
    if os.environ.get("HAI_API_KEY"):
        return os.environ["HAI_API_KEY"]
    for ligne in (Path.home() / ".config/hai/.env").read_text().splitlines():
        if ligne.strip().startswith("HAI_API_KEY="):
            return ligne.split("=", 1)[1].strip().strip("'\"")
    sys.exit("Clé H introuvable : lancez d'abord `holo login`.")


def nombre(n):
    return f"{n:,}".replace(",", " ")


def dollars(x):
    return "—" if x is None else f"{x:.3f} $".replace(".", ",")


def pluriel(n, mot):
    return f"{n} {mot}" + ("s" if n > 1 else "")


def texte_agent(texte):
    """Le texte libre d'un agent peut contenir du markdown (**gras**) et des retours à la ligne."""
    return " ".join((texte or "").replace("**", "").split())


def chemin(url):
    morceaux = urlsplit(url)
    return morceaux.path + (f"?{morceaux.query}" if morceaux.query else "")


def mesurer(handle, role, cible, resultat, duree_observee):
    # finished_at n'est pas toujours renseigné juste après la fin : on garde la durée observée de bout en bout.
    session = handle.get()
    metriques = handle.changes(include_events=False).metrics
    # D'après les coûts de l'API, reasoning_tokens est inclus dans output_tokens, et cached_tokens dans input_tokens.
    modeles = metriques.cost_per_model if metriques else []
    return {
        "role": role, "cible": cible, "session": handle.id, "statut": resultat.status,
        "steps": metriques.steps if metriques else None, "tokens": sum(u.input_tokens + u.output_tokens for u in modeles),
        "cout_dollars": metriques.total_cost if metriques else None,
        "duree_s": round(duree_observee, 1), "replay": session.agent_view_url,
    }


def lancer(client, agent, coffre, role, cible, message, schema, max_steps, base):
    debut = time.monotonic()
    handle = client.start_session(agent=agent, messages=message, answer_schema=schema, max_steps=max_steps, max_time_s=300,
                                  overrides={"agent.environments[kind=web].start_url": base,
                                             "agent.environments[kind=web].vault_id": coffre})
    direct = handle.get().agent_view_url
    journal(f"▶ {role} · {cible} · en direct : {direct}", "session", role=role, cible=cible, session=handle.id, replay=direct)
    resultat = handle.wait_for_completion()
    return resultat, mesurer(handle, role, cible, resultat, time.monotonic() - debut)


def cartographier(cle, base, nom_compte, compte, coffre, perimetre=()):
    client = Client(api_key=cle)  # un client par thread
    message = (
        f"Va sur {base} et connecte-toi avec le compte de test de ton coffre. "
        f"Tu es {compte['nom']}, de l'entreprise {compte['entreprise']}. "
        "Explore toute l'application comme un utilisateur : ouvre chaque rubrique du tableau de bord, chaque liste, "
        "chaque document de détail, les pages de modification, et suis les liens vers les données brutes. "
        "Dans chaque liste, ouvre chaque ligne, une par une, pas seulement la première. "
        "Navigue uniquement en cliquant sur les liens, tuiles et boutons visibles : ne saisis jamais une adresse toi-même. "
        "Sur une page de modification, regarde le formulaire mais n'enregistre jamais rien. "
        "Relève chaque page qui affiche des données de ton entreprise : son URL complète avec ses paramètres, "
        "sa nature en français et son identifiant."
        + (f" N'ouvre jamais ces pages, exclues de l'audit : {', '.join(perimetre)}." if perimetre else "")
    )
    return lancer(client, EXPLORATEUR, coffre, f"Compte {nom_compte}", "cartographie", message, Cartographie, max_steps=45, base=base)


IGNOREES = {"/", "/api/connexion", "/api/deconnexion"}
# Chemins de l'infrastructure (le tunnel Cloudflare y injecte /cdn-cgi/l/email-protection) : ils n'appartiennent pas à l'application.
INFRASTRUCTURE = ("/cdn-cgi/",)
# Lecture : fuites mesurées à 1,000, pages propres jusqu'à 0,883 sur l'appli cobaye (16/11). L'agent de preuve filtre le reste.
SEUIL_SIMILARITE = 0.95


def pages_observees(client, session_id, base):
    """Pages réellement affichées par le navigateur de l'agent, dans l'ordre, sans doublon."""
    hote, chemins, page = urlsplit(base).netloc, [], 1
    while True:
        items = client.sessions.list_session_events(session_id, page=page, size=50).model_dump().get("items", [])
        if not items:
            return chemins
        for e in items:
            url = ((e.get("data") or {}).get("metadata") or {}).get("url")
            if url and urlsplit(url).netloc == hote:
                c = chemin(url)
                if c not in IGNOREES and not c.startswith(INFRASTRUCTURE) and c not in chemins:
                    chemins.append(c)
        page += 1


def contenu(reponse):
    """Partie comparable d'une réponse : le JSON trié, ou le texte du <main> (sans l'en-tête du compte)."""
    if "json" in reponse.headers.get("content-type", ""):
        return json.dumps(reponse.json(), sort_keys=True, ensure_ascii=False)
    corps = re.search(r"<main[^>]*>(.*?)</main>", reponse.text, re.S)
    texte = re.sub(r"<[^>]+>", " ", corps.group(1) if corps else reponse.text)
    return " ".join(html.unescape(texte).split())


def similarite(a, b):
    """Lecture : les deux comptes reçoivent-ils la même page ? Ratio symétrique entre 0 et 1."""
    return difflib.SequenceMatcher(None, a, b).ratio()  # réglage par défaut, celui du seuil mesuré le 16/11


def couverture(reference, testee):
    """Admin : quelle part de la page reçue par C reproduit celle de A ? Un administrateur voit des boutons
    en plus ; la page de C peut donc reproduire celle de A sans lui être identique."""
    if not testee:
        return 0.0
    blocs = difflib.SequenceMatcher(None, reference, testee, autojunk=False).get_matching_blocks()
    return sum(b.size for b in blocs) / len(testee)


def session_http(base, compte):
    http = httpx.Client(base_url=base, follow_redirects=False, timeout=30)
    reponse = http.post("/api/connexion", data={"email": compte["email"], "mot_de_passe": compte["mot_de_passe"]})
    if "session" not in http.cookies:
        sys.exit(f"Le rejeu n'a pas pu connecter {compte['email']} (HTTP {reponse.status_code}).")
    return http


def rejouer(theme, http_ref, http_test, chemins, types):
    """Redemande chaque page avec les deux comptes. Lecture : même contenu. Admin : page de C couverte par celle de A."""
    resultats = []
    for c in chemins:
        ra, rb = http_ref.get(c), http_test.get(c)
        score, recu = 0.0, ""
        if ra.status_code == 200 and rb.status_code == 200:
            recu = contenu(rb)
            score = similarite(contenu(ra), recu) if theme == "lecture" else couverture(contenu(ra), recu)
        resultats.append({"theme": theme, "chemin": c, "type": types.get(c, "page"), "http_a": ra.status_code,
                          "http": rb.status_code, "similarite": round(score, 3), "suspicion": score >= SEUIL_SIMILARITE,
                          "donnees": detecter(recu)})  # ce que le compte qui attaque a réellement reçu
    return resultats


# Une simple visite de ces liens pourrait couper la session ou effacer une donnée : on ne les suit jamais.
LIENS_DANGEREUX = re.compile(r"deconnexion|logout|log-out|signout|sign-out|supprimer|delete|remove", re.I)


def liens_visibles(http, pages, base, perimetre):
    """Les liens que les pages vues par l'agent montrent à ce compte, sur le même site, un seul niveau plus loin.
    L'agent ne clique pas toujours chaque ligne d'une liste : ce filet déterministe garantit la couverture."""
    hote, ajoutes = urlsplit(base).netloc, []
    for page in pages:
        reponse = http.get(page)
        if reponse.status_code != 200 or "html" not in reponse.headers.get("content-type", ""):
            continue
        for href in re.findall(r'<a\b[^>]*\bhref="([^"#]+)"', reponse.text):
            url = urlsplit(html.unescape(href))
            if url.netloc and url.netloc != hote:
                continue
            lien = url.path + (f"?{url.query}" if url.query else "")
            if (lien.startswith("/") and lien not in IGNOREES and not lien.startswith(INFRASTRUCTURE)
                    and lien not in pages and lien not in ajoutes
                    and not LIENS_DANGEREUX.search(lien) and autorise(lien, perimetre)):
                ajoutes.append(lien)
    return ajoutes


def formulaires(http_a, chemins):
    """Formulaires d'enregistrement présents dans les pages de A, avec leurs valeurs d'origine."""
    trouves = {}
    for c in chemins:
        reponse = http_a.get(c)
        if reponse.status_code != 200 or "html" not in reponse.headers.get("content-type", ""):
            continue
        for attributs, corps in re.findall(r"<form([^>]*)>(.*?)</form>", reponse.text, re.S):
            action = re.search(r'action="([^"]+)"', attributs)
            if not re.search(r'method="post"', attributs, re.I) or not action:
                continue
            action = html.unescape(action.group(1))
            if action in IGNOREES:
                continue
            champs = {nom: html.unescape(valeur) for nom, valeur in re.findall(r'<textarea[^>]*name="([^"]+)"[^>]*>(.*?)</textarea>', corps, re.S)}
            if champs:
                trouves.setdefault(action, {"page": c, "action": action, "champs": champs})
    return list(trouves.values())


def sonder_ecriture(http_a, http_b, formulaire, chemins):
    """B soumet le formulaire de A avec un marqueur ; on cherche ensuite le marqueur dans les pages de A."""
    marqueur = f"SentinelQA-{secrets.token_hex(3)}"
    champ = next(iter(formulaire["champs"]))
    reponse = http_b.post(formulaire["action"], data={**formulaire["champs"], champ: marqueur})
    visible = next((c for c in chemins if marqueur in http_a.get(c).text), None)
    return {"theme": "ecriture", "chemin": formulaire["action"], "type": f"formulaire de {formulaire['page']}",
            "http_a": 200, "http": reponse.status_code, "marqueur": marqueur, "visible_par_a": visible,
            "similarite": 1.0 if visible else 0.0, "suspicion": visible is not None,
            "donnees": detecter(contenu(http_a.get(visible))) if visible else []}


def autoriser_ecriture(nombre_tests, decision):
    """Aucune écriture sans feu vert humain : donné d'avance (option, case du cadrage), ou au terminal.
    decision : True (autorisée d'avance), False (refusée) ou None (demander au terminal)."""
    if decision is not None:
        if not decision:
            journal("   Écriture non testée : le feu vert n'a pas été donné au cadrage")
        return decision
    if not sys.stdin.isatty():
        journal("   Écriture non testée : relancez avec --autoriser-ecriture pour l'autoriser")
        return False
    reponse = input(f"   Autoriser {pluriel(nombre_tests, 'tentative')} d'écriture par le compte B, sur des données de test ? [o/N] ")
    return reponse.strip().lower() in ("o", "oui")


QUESTIONS = {
    "lecture": "Dis si cette page montre des données appartenant à une autre entreprise que {entreprise}.",
    "admin": "Tu es salarié, sans droits d'administration. Dis si cette page te montre des informations réservées "
             "aux administrateurs, ou la fiche de paie d'un autre salarié que toi.",
    "ecriture": "Dis si la page affiche le texte « {marqueur} », et recopie la phrase qui le contient.",
}


def prouver(cle, base, nom_compte, compte, coffre, suspicion):
    client = Client(api_key=cle)  # un client par thread de preuve
    theme = suspicion["theme"]
    page = suspicion.get("visible_par_a") or suspicion["chemin"]
    message = (
        f"Va sur {base} et connecte-toi avec le compte de test de ton coffre. "
        f"Tu es {compte['nom']}, de l'entreprise {compte['entreprise']}. "
        f"Ensuite ouvre exactement cette adresse : {base}{page}. "
        + QUESTIONS[theme].format(entreprise=compte["entreprise"], marqueur=suspicion.get("marqueur", ""))
        + " Recopie ce qui est visible : entreprise, noms, montants, textes. Ne clique sur rien d'autre et ne modifie rien."
    )
    resultat, mesures = lancer(client, VERIFICATEUR, coffre, f"Compte {nom_compte}", f"{THEMES[theme]} · {page}",
                               message, Constat, max_steps=15, base=base)
    constat = resultat.answer
    prouvee = bool(constat and constat.confirme and suspicion["suspicion"])
    return {**suspicion, "compte": nom_compte, "prouvee": prouvee, "constat": constat.model_dump() if constat else None,
            "session": mesures["session"], "replay": mesures["replay"]}, mesures


def noter(verite, rejeux, preuves):
    """Compare les preuves à la vérité terrain, thème par thème."""
    prouvees = [(p["theme"], p["chemin"]) for p in preuves if p["prouvee"]]
    testees = [(r["theme"], r["chemin"]) for r in rejeux]

    def touche(element, liste):
        return any(t == element["theme"] and re.search(element["motif"], c) for t, c in liste)

    failles = [{**f, "detectee": touche(f, prouvees)} for f in verite["failles"]]
    controles = [{**c, "faux_positif": touche(c, prouvees), "teste": touche(c, testees)} for c in verite["controles_sains"]]
    return {
        "failles": failles, "controles": controles,
        "detectees": sum(f["detectee"] for f in failles), "total": len(failles),
        "faux_positifs": sum(c["faux_positif"] for c in controles),
    }


# « idle » : l'agent a rendu sa réponse ; la session passe à « completed » quelques secondes plus tard.
STATUTS = {"completed": "terminée", "idle": "terminée", "failed": "échec", "timed_out": "délai dépassé", "interrupted": "interrompue"}


def rapport_html(d):
    e = html.escape
    s = d["score"]

    def proprietaire(constat):
        return (constat or {}).get("proprietaire") or (constat or {}).get("entreprise_affichee") or ""

    def resultat_protege(r):
        if r.get("theme") == "ecriture":
            return f"B : HTTP {r['http']} · rien de visible chez A"
        compte = "C" if r.get("theme") == "admin" else "B"
        egal = r["http"] == 200 and r["http_a"] == 200
        return f"A : HTTP {r['http_a']} · {compte} : HTTP {r['http']}{' · contenu différent' if egal else ''}"

    lignes_failles = "".join(
        f"<tr><td>{e(THEMES.get(p.get('theme', 'lecture'), ''))}</td>"
        f"<td><strong class='chemin'>{e(p['chemin'])}</strong><br><span class='doux'>{e(p['type'])}</span></td>"
        f"<td>{e(texte_agent((p['constat'] or {}).get('ce_qui_est_visible')))}</td>"
        f"<td>{e(proprietaire(p['constat']))}</td><td>{e((p.get('gravite') or {}).get('niveau', '—'))}</td><td>{e(p.get('compte', 'B'))}</td>"
        f"<td><a href='{e(p['replay'] or '#')}'>Replay de la preuve</a></td></tr>"
        for p in d["preuves"] if p["prouvee"])
    lignes_protegees = "".join(
        f"<tr><td>{e(THEMES.get(r.get('theme', 'lecture'), ''))}</td><td class='chemin'>{e(r['chemin'])}</td>"
        f"<td>{e(r['type'])}</td><td>{e(resultat_protege(r))}</td></tr>"
        for r in d["rejeux"] if not r["suspicion"])
    lignes_verite = "".join(
        f"<tr><td>{e(f['id'])}</td><td>{e(THEMES.get(f.get('theme', 'lecture'), ''))}</td><td>{e(f['type'])}</td>"
        f"<td>{'Prouvée' if f['detectee'] else 'Manquée'}</td></tr>" for f in s["failles"]
    ) + "".join(
        f"<tr><td>{e(c['id'])}</td><td>{e(THEMES.get(c.get('theme', 'lecture'), ''))}</td><td>Contrôle sain</td>"
        f"<td>{'Faux positif' if c['faux_positif'] else ('Non signalé' if c['teste'] else 'Non testé')}</td></tr>"
        for c in s["controles"])
    lignes_sessions = "".join(
        f"<tr><td>{e(m['role'])}</td><td{' class=chemin' if m['cible'].startswith('/') else ''}>{e(m['cible'])}</td><td>{e(STATUTS.get(m.get('statut'), m.get('statut') or '—'))}</td><td>{'—' if m['steps'] is None else m['steps']}</td><td>{nombre(m['tokens'])}</td><td>{dollars(m['cout_dollars'])}</td>"
        f"<td>{'—' if m['duree_s'] is None else str(round(m['duree_s'])) + ' s'}</td><td><a href='{e(m['replay'] or '#')}'>Replay</a></td></tr>"
        for m in d["sessions"])
    comptes = " · ".join(f"compte {k} : {e(v)}" for k, v in d.get("comptes", {"A": d.get("compte_a", ""), "B": d.get("compte_b", "")}).items())
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>SentinelQA · rapport d'audit</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{{margin:0;background:#f4f5f8;color:#18202e;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.5}}
main{{max-width:1040px;margin:0 auto;padding:32px 20px}} h1{{margin:0;font-size:28px}} h2{{margin:32px 0 12px;font-size:19px}}
.doux{{color:#5d6779;font-size:14px}} .kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-top:22px}}
.kpi{{background:#fff;border:1px solid #e2e5ec;border-radius:12px;padding:16px}} .kpi b{{display:block;font-size:28px}}
.alerte b{{color:#b42318}} .ok b{{color:#1f7a3f}} .tableau{{overflow-x:auto;background:#fff;border:1px solid #e2e5ec;border-radius:12px}} table{{width:100%;border-collapse:collapse}}
th,td{{text-align:left;padding:10px 12px;border-bottom:1px solid #eceef3;vertical-align:top;font-size:14px}} th{{color:#5d6779;font-weight:600}} a{{color:#2f5bea}}
.chemin{{white-space:nowrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}} tr:last-child td{{border-bottom:0}}
@media (max-width:480px){{main{{padding:24px 16px}}}}
</style></head><body><main>
<p class="doux">SentinelQA · rapport d'audit des accès</p>
<h1>{pluriel(s['detectees'], 'faille')} d'accès {'prouvée' + ('s' if s['detectees'] > 1 else '')}</h1>
<p class="doux">Audit du {e(d['date'])} · cible : {e(urlsplit(d['cible']).netloc)} · {comptes} · agents H : {e(d.get('agent', ''))}</p>
<div class="kpis">
<div class="kpi alerte"><b>{s['detectees']} / {s['total']}</b>failles injectées prouvées</div>
<div class="kpi ok"><b>{s['faux_positifs']}</b>faux positif</div>
<div class="kpi"><b>{d['duree_totale_s']:.0f} s</b>durée de l'audit</div>
<div class="kpi"><b>{dollars(d['cout_dollars'])}</b>coût de l'audit selon l'API H · {nombre(d['tokens_totaux'])} tokens</div>
</div>
<h2>Failles prouvées</h2>
<div class="tableau"><table><tr><th>Thème</th><th>Ressource</th><th>Constat de l'agent</th><th>Propriétaire des données</th><th>Gravité (Hugging Face)</th><th>Compte</th><th>Preuve</th></tr>{lignes_failles}</table></div>
<h2>Ressources correctement protégées</h2>
<div class="tableau"><table><tr><th>Thème</th><th>Ressource</th><th>Nature</th><th>Résultat du rejeu</th></tr>{lignes_protegees}</table></div>
<h2>Comparaison avec les failles injectées (vérité terrain)</h2>
<div class="tableau"><table><tr><th>Id</th><th>Thème</th><th>Type</th><th>Résultat</th></tr>{lignes_verite}</table></div>
<h2>Sessions des agents H</h2>
<div class="tableau"><table><tr><th>Rôle</th><th>Tâche</th><th>Statut</th><th>Steps</th><th>Tokens</th><th>Coût</th><th>Durée</th><th>Replay</th></tr>{lignes_sessions}</table></div>
<p class="doux">Une faille n'est prouvée que si un rejeu HTTP déterministe la signale <em>et</em> qu'un agent H la constate à l'écran.
Lecture : B reçoit la même page que A. Admin : la page reçue par C reproduit celle de A. Écriture : un texte soumis par B apparaît chez A, puis A remet la valeur d'origine.
Application cobaye écrite par l'équipe : résultats à confirmer sur des applications tierces. Ce rapport complète un audit humain, il ne le remplace pas.</p>
</main></body></html>"""


def autorise(page, perimetre):
    return not any(page.startswith(interdit) for interdit in perimetre)


def comptes_sans_secret(comptes):
    return [{"cle": k, "email": v["email"], "nom": v.get("nom", v["email"]), "entreprise": v["entreprise"],
             "acces": v.get("acces", "admin")} for k, v in comptes.items() if k in ("A", "B", "C")]


def auditer(base, comptes, verite, ecriture=None, partager=False, perimetre=(), modele_hf=MODELE_HF):
    """Un audit complet sur les trois thèmes. Renvoie les données du rapport."""
    if any((urlsplit(base).hostname or '').rstrip('.').lower() == urlsplit(t['origin']).hostname for t in CATALOGUE['targets']):
        raise ValueError("Les sites réels de D-24 doivent passer par une mission bornée, pas par le runner du cobaye.")
    cle = cle_api()
    client = Client(api_key=cle)
    journal("0/4 Agents H sur mesure et coffres d'identifiants", "etape")
    for nom, etat in assurer_agents(client).items():
        journal(f"   {nom} : {etat}")
    coffres = preparer_coffres(client, base, comptes, ("A", "B", "C"))
    journal(f"   {len(coffres)} coffres prêts, un par compte de test")
    debut = time.monotonic()

    journal("1/4 Cartographie en parallèle : compte A (administrateur) et compte C (salarié)", "etape")
    with ThreadPoolExecutor(max_workers=2) as pool:
        carto_a, carto_c = pool.map(lambda k: cartographier(cle, base, k, comptes[k], coffres[k], perimetre), ("A", "C"))
    (resultat_a, mesure_a), (_, mesure_c) = carto_a, carto_c
    ressources = resultat_a.answer.ressources if resultat_a.answer else []
    types = {chemin(r.url): r.type for r in ressources}
    pages_a = [p for p in pages_observees(client, mesure_a["session"], base) if autorise(p, perimetre)]
    pages_c = [p for p in pages_observees(client, mesure_c["session"], base) if autorise(p, perimetre)]
    journal(f"   Pages affichées par le navigateur : {len(pages_a)} pour A, {len(pages_c)} pour C")

    journal("2/4 Rejeux HTTP : lecture (A puis B), admin (A puis C), écriture (B soumet les formulaires de A)", "etape")
    http = {k: session_http(base, comptes[k]) for k in ("A", "B", "C")}
    ecritures, a_tester, sorties = False, [], []
    pool_hf = ThreadPoolExecutor(max_workers=1)  # Hugging Face travaille en parallèle : l'audit ne l'attend pas
    attente_hf = None
    try:
        ajoutees = {"A": liens_visibles(http["A"], pages_a, base, perimetre), "C": liens_visibles(http["C"], pages_c, base, perimetre)}
        pages_a, pages_c = pages_a + ajoutees["A"], pages_c + ajoutees["C"]
        journal(f"   Liens visibles ajoutés par le runner : {len(ajoutees['A'])} pour A, {len(ajoutees['C'])} pour C",
                "info", ajoutees=ajoutees)
        a_tester = formulaires(http["A"], pages_a)
        journal(f"   Formulaires d'enregistrement dans les pages de A : {len(a_tester)}")
        attente_hf = pool_hf.submit(hypotheses, pages_a, pages_c, a_tester, modele_hf)
        journal(f"   Hugging Face ({modele_hf}) étudie la cartographie et propose des attaques, en parallèle", "hypothese")
        rejeux = rejouer("lecture", http["A"], http["B"], pages_a, types)
        reservees = [p for p in pages_a if p not in pages_c]
        rejeux += rejouer("admin", http["A"], http["C"], reservees, types)
        ecritures = autoriser_ecriture(len(a_tester), ecriture) if a_tester else False
        if ecritures:
            rejeux += [sonder_ecriture(http["A"], http["B"], f, pages_a) for f in a_tester]
        suspicions = [r for r in rejeux if r["suspicion"]]
        for theme, libelle in THEMES.items():
            du_theme = [r for r in rejeux if r["theme"] == theme]
            journal(f"   {libelle} : {pluriel(sum(r['suspicion'] for r in du_theme), 'suspicion')} sur {pluriel(len(du_theme), 'test')}",
                    "rejeu", theme=theme, suspicions=sum(r["suspicion"] for r in du_theme), tests=len(du_theme))

        journal("3/4 Preuves visuelles par l'agent vérificateur, en parallèle", "etape")
        prouveur = {"lecture": "B", "admin": "C", "ecriture": "A"}  # l'écriture se constate chez la victime, A
        with ThreadPoolExecutor(max_workers=3) as pool:
            sorties = list(pool.map(lambda s: prouver(cle, base, prouveur[s["theme"]], comptes[prouveur[s["theme"]]],
                                                      coffres[prouveur[s["theme"]]], s), suspicions))
        for p, _ in sorties:
            journal(f"   {'Faille prouvée' if p['prouvee'] else 'Non confirmée'} · {THEMES[p['theme']]} · {p['chemin']}",
                    "preuve", theme=p["theme"], chemin=p["chemin"], prouvee=p["prouvee"], replay=p["replay"])
    finally:
        if ecritures:
            journal("4/4 Remise des valeurs d'origine par A, puis rapport", "etape")
            for f in a_tester:
                http["A"].post(f["action"], data=f["champs"])
        else:
            journal("4/4 Rapport", "etape")
        for h in http.values():
            h.close()
    preuves = [p for p, _ in sorties]
    sessions = [mesure_a, mesure_c] + [m for _, m in sorties]

    # Hugging Face : ses hypothèses (lancées avant les rejeux), recoupées avec les preuves.
    hyp = attente_hf.result() if attente_hf else None
    pool_hf.shutdown()
    if hyp and "propositions" in hyp:
        n = {cle: len(liste) for cle, liste in hyp["propositions"].items()}
        journal(f"   Hugging Face a proposé {n['ecritures']} écriture(s), {n['pages_admin']} page(s) d'admin et "
                f"{n['lectures']} lecture(s) à tenter, en {hyp['latence_s']:.0f} s", "hypothese", modele=hyp["modele"])
        hyp["recoupement"] = recouper(hyp, preuves)
        communes = sum(r["communes"] for r in hyp["recoupement"].values())
        journal(f"   Recoupement : {communes} des {sum(p['prouvee'] for p in preuves)} failles prouvées avaient été proposées par le LLM",
                "hypothese", recoupement=hyp["recoupement"])
    elif hyp:
        journal(f"   Hugging Face indisponible pour les hypothèses ({hyp.get('erreur')}) : l'audit continue sans elles")
    # La gravité : une règle écrite et déterministe (gravite.py), sur les données détectées au rejeu. Aucun LLM.
    for p in preuves:
        if p["prouvee"]:
            p["gravite"] = classer(p["theme"], p.get("donnees"))
            journal(f"   Gravité {p['gravite']['niveau']} · {THEMES[p['theme']]} · {p['chemin']} · "
                    f"{', '.join(p['gravite']['donnees']) or 'aucune donnée détectée'}", "gravite",
                    theme=p["theme"], niveau=p["gravite"]["niveau"])
    if partager:
        for p in preuves:
            p["replay"] = client.sessions.share_session(p["session"]).share_url

    score = noter(verite, rejeux, preuves)
    tokens = sum(m["tokens"] for m in sessions)
    couts = [m["cout_dollars"] for m in sessions]
    donnees = {
        "cible": base, "date": datetime.now().strftime("%d/%m/%Y %H:%M"), "agent": AGENT,
        "comptes": {k: f"{v.get('nom', v['email'])}, {v['entreprise']}" for k, v in comptes.items() if k in ("A", "B", "C")},
        "ecriture_autorisee": ecritures, "perimetre": list(perimetre), "ressources": [r.model_dump() for r in ressources],
        "pages": {"A": pages_a, "C": pages_c, "ajoutees": ajoutees}, "rejeux": rejeux, "preuves": preuves,
        "sessions": sessions, "score": score, "tokens_totaux": tokens,
        "cout_dollars": None if None in couts else sum(couts), "duree_totale_s": time.monotonic() - debut,
        "hypotheses": hyp, "gravite": {"regle": REGLE_GRAVITE, "source": "page reçue au rejeu"},
        "cout_hf_dollars": (((hyp or {}).get("usage") or {}).get("cost")) or None,
    }
    journal(f"Résultat : {score['detectees']}/{score['total']} failles prouvées, {score['faux_positifs']} faux positif, "
            f"{nombre(tokens)} tokens, {dollars(donnees['cout_dollars'])}, {donnees['duree_totale_s']:.0f} s", "resultat",
            prouvees=score["detectees"], total=score["total"], faux_positifs=score["faux_positifs"])
    return json.loads(json.dumps(donnees, ensure_ascii=False, default=str))


def ecrire_rapport_local(donnees):
    dossier = ICI.parent / "rapports"
    dossier.mkdir(exist_ok=True)
    nom = datetime.now().strftime("rapport-%Y%m%d-%H%M%S-%f")
    (dossier / f"{nom}.json").write_text(json.dumps(donnees, ensure_ascii=False, indent=2))
    (dossier / f"{nom}.html").write_text(rapport_mission(donnees) if donnees.get("schema_version") == 2 else rapport_html(donnees))
    return dossier / f"{nom}.html"


def maintenant():
    return datetime.now().astimezone().isoformat()


VERITE_COBAYE = ICI.parent / "cobaye" / "VERITE_TERRAIN.json"
SANS_VERITE = {"failles": [], "controles_sains": []}


def traiter_demande(base, cle, demande):
    """Une demande venue du formulaire de cadrage : déchiffrer, auditer, rendre compte, puis effacer le texte chiffré."""
    audit_id = demande["id"]
    journal.attacher(base, audit_id)
    journal(f"Demande prise par le runner : {demande['application']} · {demande['cible']}", "info")
    try:
        if (demande.get("rapport") or {}).get("schema_version") == 2:
            mission, cible, _ = valider_demande(demande["rapport"]["request"])
            if (demande["cible"] != cible["entry_url"] or demande.get("ecriture_autorisee")
                    or demande.get("comptes") or demande.get("secrets_chiffres")):
                raise ValueError("La demande ne correspond pas au profil anonyme enregistré.")
            derniere_verification, stop = [0.0], [False]
            def arret():
                if time.monotonic() - derniere_verification[0] >= 1:
                    stop[0] = bool(base.lire("evenements", audit_id=f"eq.{audit_id}", type="eq.arret", limit="1"))
                    derniere_verification[0] = time.monotonic()
                return stop[0]
            donnees = executer_mission(mission, NavigateurH(lambda: Client(api_key=cle_api(), timeout=15, max_retries=0)), journal, arret)
            rapport = ecrire_rapport_local(donnees)
            base.modifier("audits", {"statut": "termine", "fin": maintenant(), "rapport": donnees}, id=f"eq.{audit_id}")
            print(f"Rapport : {rapport}", flush=True)
            return
        mots_de_passe = dechiffrer(cle, demande["secrets_chiffres"])
        comptes = {c["cle"]: {**c, "mot_de_passe": mots_de_passe[c["cle"]]} for c in demande["comptes"]}
        # La vérité terrain n'existe que pour notre application cobaye : ailleurs, on compte les failles prouvées.
        verite = json.loads(VERITE_COBAYE.read_text()) if demande["application"] == "Paie Express" else SANS_VERITE
        donnees = auditer(demande["cible"], comptes, verite, ecriture=demande["ecriture_autorisee"],
                          perimetre=tuple(demande["perimetre"] or ()))
        donnees["application"] = demande["application"]
        rapport = ecrire_rapport_local(donnees)
        base.modifier("audits", {"statut": "termine", "fin": maintenant(), "rapport": donnees}, id=f"eq.{audit_id}")
        print(f"Rapport : {rapport}", flush=True)
    except BaseException as erreur:
        message = f"{erreur.__class__.__name__} : {erreur}"[:500]
        journal(f"Audit interrompu : {message}", "erreur")
        base.modifier("audits", {"statut": "echec", "fin": maintenant(), "erreur": message}, id=f"eq.{audit_id}")
        if isinstance(erreur, KeyboardInterrupt):
            raise
    finally:
        # Le texte chiffré ne sert plus : on l'efface, que l'audit ait réussi ou non.
        base.modifier("audits", {"secrets_chiffres": None}, id=f"eq.{audit_id}")
        journal.attacher(None, None)


def surveiller():
    """Le mode surveillance : le runner publie sa clé publique, puis prend les demandes une par une."""
    base, cle = Base(), cle_privee()
    print(f"Clé publique du runner publiée (n° {publier(base, cle)}). En attente des demandes de la web app… (Ctrl-C pour arrêter)", flush=True)
    pause = 3
    while True:
        try:
            attente = base.lire("audits", statut="eq.en_attente", order="cree_le.asc", limit="1")
            if attente:
                # On réserve la demande : si un autre runner l'a déjà prise, la modification ne touche aucune ligne.
                prises = base.modifier("audits", {"statut": "en_cours", "debut": maintenant()},
                                       id=f"eq.{attente[0]['id']}", statut="eq.en_attente")
                if prises:
                    traiter_demande(base, cle, prises[0])
                    pause = 3
                    continue
            pause = 3
        except httpx.HTTPError as erreur:
            # Une coupure réseau passagère ne doit pas arrêter le runner, ni avec lui le cobaye et le tunnel de demo.sh
            # (vécu le 17/11 à 8 h 55 : un ReadTimeout de Supabase a tout coupé). On réessaie, de plus en plus lentement.
            print(f"Supabase injoignable ({erreur.__class__.__name__}) : nouvel essai dans {pause} s", flush=True)
            time.sleep(pause)
            pause = min(pause * 2, 30)
            continue
        time.sleep(pause)


def main():
    if sys.argv[1:2] == ["--preparer-agents"]:
        parser = argparse.ArgumentParser(description="Enregistrer et relire les agents QA et pentest dans H Company.")
        parser.add_argument("--preparer-agents", action="store_true")
        parser.add_argument("--verifier", action="store_true", help="Afficher les définitions locales sans appeler H")
        args = parser.parse_args()
        if args.verifier:
            from hai_agents import Agent
            for mode in AGENTS_MISSIONS:
                spec = Agent.model_validate(definition_agent_mission(mode))
                print(f"Définition locale valide (non publiée) : {spec.name} · {spec.description}")
            return
        from hai_agents.core.api_error import ApiError
        client = Client(api_key=cle_api(), timeout=15, max_retries=0)
        for mode, nom in AGENTS_MISSIONS.items():
            print(f"Catalogue H : vérification de {nom}…", flush=True)
            try:
                resultat = assurer_agent_mission(client, mode)
            except httpx.TransportError as erreur:
                sys.exit(f"H injoignable ({type(erreur).__name__}) ; enregistrement de {nom} non confirmé. "
                         "Aucune session de test lancée. Ce n'est pas un diagnostic de clé invalide.")
            except ApiError as erreur:
                sys.exit(f"H a répondu HTTP {erreur.status_code} ; enregistrement de {nom} non confirmé.")
            print(f"Confirmé dans H : {resultat['reference']} · {resultat['action']}", flush=True)
        return
    if sys.argv[1:2] == ["--surveiller"]:
        return surveiller()
    if sys.argv[1:2] == ["--mission"]:
        parser = argparse.ArgumentParser(description="Exécuter une mission du catalogue partagé avec la web app.")
        parser.add_argument("--mission", required=True, help="Fichier JSON : target_id, scenario_id, mode, instruction")
        parser.add_argument("--verifier", action="store_true", help="Valider uniquement, sans appel H ni requête vers la cible")
        args = parser.parse_args()
        demande, _, scenario = valider_demande(json.loads(Path(args.mission).read_text()))
        if args.verifier:
            print(f"Mission valide : {scenario['id']} · {scenario['title']}")
            return
        donnees = executer_mission(demande, NavigateurH(lambda: Client(api_key=cle_api(), timeout=15, max_retries=0)), journal)
        print(f"Rapport : {ecrire_rapport_local(donnees)}")
        return
    parser = argparse.ArgumentParser(description="Audit des accès d'un SaaS avec trois comptes de test.")
    parser.add_argument("base", help="URL de l'application à auditer (ou --surveiller pour prendre les demandes de la web app)")
    parser.add_argument("--verite", default=str(ICI.parent / "cobaye" / "VERITE_TERRAIN.json"))
    parser.add_argument("--comptes", default=str(ICI / "comptes-demo.json"))
    parser.add_argument("--application", default="Paie Express", help="Nom de l'application auditée, pour la salle de contrôle")
    parser.add_argument("--autoriser-ecriture", action="store_true", help="Autoriser d'avance les tests d'écriture, sur des données de test")
    parser.add_argument("--supabase", action="store_true", help="Écrire le fil de l'audit et son rapport dans Supabase")
    parser.add_argument("--modele-hf", default=MODELE_HF, help="Modèle Hugging Face des hypothèses et de la gravité")
    parser.add_argument("--partager", action="store_true", help="Créer des liens publics de replay (à éviter sur une vraie application)")
    args = parser.parse_args()
    url = args.base.rstrip("/")
    comptes = json.loads(Path(args.comptes).read_text())
    base = audit_id = None
    if args.supabase:
        base = Base()
        audit_id = base.ajouter("audits", {"statut": "en_cours", "debut": maintenant(), "application": args.application, "cible": url,
                                           "comptes": comptes_sans_secret(comptes), "ecriture_autorisee": args.autoriser_ecriture})["id"]
        journal.attacher(base, audit_id)
        print(f"Audit {audit_id} : son fil s'écrit dans Supabase", flush=True)
    try:
        donnees = auditer(url, comptes, json.loads(Path(args.verite).read_text()),
                          True if args.autoriser_ecriture else None, args.partager, modele_hf=args.modele_hf)
    except BaseException as erreur:
        if audit_id:
            base.modifier("audits", {"statut": "echec", "fin": maintenant(), "erreur": f"{erreur.__class__.__name__} : {erreur}"[:500]},
                          id=f"eq.{audit_id}")
        raise
    rapport = ecrire_rapport_local(donnees)
    if audit_id:
        base.modifier("audits", {"statut": "termine", "fin": maintenant(), "rapport": donnees}, id=f"eq.{audit_id}")
        base.fermer()
    print(f"Rapport : {rapport}", flush=True)


if __name__ == "__main__":
    main()
