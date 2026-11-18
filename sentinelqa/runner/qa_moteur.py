"""Le moteur du volet QA : une consigne (ou aucune) devient une mission, l'agent H la joue dans un vrai navigateur,
puis le code vérifie chaque critère sur ce que H a enregistré (pages, gestes, texte affiché) et sur les pages servies.

Règle des verdicts, les mêmes mots que la web :
- conforme (passed) : seulement avec une preuve relevée par le code : la page atteinte dans les événements H,
  le texte ou la citation de l'agent retrouvés dans la page affichée ou servie ;
- écart (failed) : seulement avec une preuve d'écart relevée par le code : erreur HTTP, texte absent de la page
  servie alors que c'est bien la page vue, texte anormal affiché ;
- non concluant (inconclusive) : tout le reste, y compris un écart signalé par l'agent seul, avec sa capture ;
- non exécuté (skipped) : la mission s'est arrêtée avant d'atteindre ce critère.

Usage :
  python qa_moteur.py --consigne "Va dans Programmes et ouvre le Bachelor"     (parcours guidé, plan préparé par HF)
  python qa_moteur.py --exploration [--mobile]                                 (exploration bornée, sans consigne)
  python qa_moteur.py --consigne "…" --preparer-seulement                      (affiche le plan, sans lancer H)
  python qa_moteur.py --cible peer-review --email … --identite Nom --consigne "…" (site connecté ; le mot de passe est lu
                                                                                sur l'entrée standard et ne va qu'au coffre H)
"""

import argparse
import copy
import getpass
import hashlib
import html
import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import httpx
from hai_agents import VaultCreateRequestProviderConfig_Internal

from qa_agent import APPAREILS, MODELE, ReponseQA, assurer_agent

ICI = Path(__file__).resolve().parent
CATALOGUE = json.loads((ICI.parent / "contrats" / "qa.json").read_text())
VERSION = 3
STATUTS = ("passed", "failed", "inconclusive", "skipped")
PILOTAGES = tuple(CATALOGUE["pilotages"])
TYPES_CRITERES = ("page", "texte", "constat")
MODELES_H = (MODELE, "holo4-27b")
CHAMPS = {"schema_version", "mode", "target_id", "pilotage", "appareil", "instruction", "source", "plan", "modele_h",
          "preparation_humaine_s", "coffre", "identite"}
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
# Sur une cible connectée, hors de la page de connexion : un clic dont le libellé porte l'un de ces mots peut écrire
# (noter, envoyer…). Le code arrête alors la session ; H a peut-être déjà exécuté ce clic : l'arrêt borne les suites.
VERBES_A_RISQUE = {"envoyer", "enregistrer", "sauvegarder", "valider", "soumettre", "confirmer", "publier", "supprimer", "modifier",
                   "noter", "evaluer", "commenter", "voter", "activer", "desactiver", "reinitialiser",
                   "commencer", "demarrer", "reprendre", "repondre", "ajouter", "creer",  # ouvrent ou remplissent un formulaire
                   "submit", "send", "save", "confirm", "delete", "rate", "publish", "start", "begin", "reply", "add", "create"}
FINIS = {"completed", "idle", "failed", "timed_out", "interrupted"}
# H passe la session à « idle » avant d'y attacher la réponse (AgentCompletionEvent jusqu'à 2 s plus tard, 18/11) :
# lue trop tôt, une réponse bien donnée paraissait absente (1 essai sur 10, session d58b6def).
ATTENTE_REPONSE_S = 10
ROUTEUR_HF = "https://router.huggingface.co/v1/chat/completions"
# Textes qui trahissent une page cassée quand ils s'affichent tels quels : le code les reconnaît sans l'agent.
ANOMALIES = ("lorem ipsum", "undefined", "object object", "page introuvable", "page not found", "404 not found",
             "erreur 500", "internal server error")


def anomalie(texte):
    """Le premier texte anormal présent mot pour mot (après normalisation), ou None."""
    n = f" {normaliser(texte)} "
    return next((a for a in ANOMALIES if f" {a} " in n), None)


def maintenant():
    return datetime.now(timezone.utc).isoformat()


class Interruption(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


class Controle:
    """Un budget de durée et un arrêt demandé, vérifiés à chaque tour d'attente."""

    def __init__(self, limite_s, arret=lambda: False):
        self.deadline = time.monotonic() + limite_s
        self.arret = arret

    def verifier(self):
        if self.arret():
            raise Interruption("cancelled")
        if time.monotonic() >= self.deadline:
            raise Interruption("budget_exceeded")

    def restant(self):
        self.verifier()
        return max(0.5, self.deadline - time.monotonic())


# ── La mission : ce que l'utilisateur demande, revalidé ici même si la web l'a déjà fait ──────────────────────

def trouver_cible(target_id):
    cible = next((c for c in CATALOGUE["cibles"] if c["id"] == target_id), None)
    if not cible:
        raise ValueError("Cette cible n'est pas enregistrée pour le QA.")
    return copy.deepcopy(cible)


def chemin_cible(cible, url):
    """Le chemin d'une URL de l'origine de la cible, sans paramètres ; None si elle sort du périmètre."""
    if not isinstance(url, str) or not url or any(ord(c) < 32 for c in url) or "\\" in url:
        return None
    parts = urlsplit(urljoin(cible["origine"] + "/", url.strip()))
    if f"{parts.scheme}://{parts.netloc}" != cible["origine"] or parts.username or parts.password:
        return None
    chemin = (parts.path.rstrip("/") or "/")
    return None if chemin_exclu(cible, chemin) else chemin


def chemin_exclu(cible, chemin):
    """Un chemin que le contrat interdit (chemins_exclus) : sur un site connecté, une page où l'on écrit, comme la review du soir."""
    return any(chemin == x or chemin.startswith(x.rstrip("/") + "/") for x in cible.get("chemins_exclus", []))


def _texte(valeur, maxi, nom):
    if valeur is None:
        valeur = ""
    if not isinstance(valeur, str):
        raise ValueError(f"{nom} doit être un texte.")
    valeur = " ".join(valeur.split())
    if len(valeur) > maxi:
        raise ValueError(f"{nom} dépasse {maxi} caractères.")
    return valeur


def valider_plan(plan, cible):
    """Le plan relu par l'utilisateur. Le serveur garde les formes connues et numérote lui-même les critères."""
    if not isinstance(plan, dict):
        raise ValueError("Le plan est illisible.")
    regles = CATALOGUE["preparation"]
    etapes = [e for e in (_texte(x, 300, "Une étape") for x in plan.get("etapes") or []) if e][: regles["max_etapes"]]
    criteres = []
    for brut in plan.get("criteres") or []:
        if not isinstance(brut, dict) or brut.get("type") not in TYPES_CRITERES:
            raise ValueError("Un critère a un type inconnu.")
        description = _texte(brut.get("description"), 300, "La description d'un critère")
        valeur = _texte(brut.get("valeur"), 200, "La valeur d'un critère")
        if not description:
            continue
        type_ = brut["type"]
        if type_ == "page" and valeur:
            valeur = chemin_cible(cible, valeur) or ""
        if type_ == "texte" and not valeur:
            type_ = "constat"  # sans texte exact, seul un constat cité peut être vérifié
        criteres.append({"id": f"C{len(criteres) + 1}", "type": type_, "description": description, "valeur": valeur})
    criteres = criteres[: regles["max_criteres"]]
    if not criteres:
        raise ValueError("Le plan doit contenir au moins un critère vérifiable.")
    hors = [h for h in (_texte(x, 300, "Une mention hors périmètre") for x in plan.get("hors_perimetre") or []) if h]
    if cible.get("connexion"):
        # L'agent se connecte lui-même avec le coffre : « Se connecter » hors périmètre contredirait sa mission
        # (plan Hugging Face du 18/11 à 18 h 50, pour « Une fois connecté, vérifie… »).
        hors = [h for h in hors if not re.search(r"\b(se connecter|connexion|s identifier|login|log in|sign in)\b", normaliser(h))]
    propre = {
        "titre": _texte(plan.get("titre"), 120, "Le titre") or "Parcours QA",
        "etapes": etapes, "criteres": criteres,
        "hors_perimetre": hors[:6],
        "inconnues": [h for h in (_texte(x, 300, "Une inconnue") for x in plan.get("inconnues") or []) if h][:6],
    }
    prep = plan.get("preparation")
    if isinstance(prep, dict):
        propre["preparation"] = {k: prep[k] for k in ("modele", "fournisseur") if isinstance(prep.get(k), str)}
        propre["preparation"].update({k: prep[k] for k in ("latence_s", "tokens") if isinstance(prep.get(k), (int, float))})
    return propre


def valider_mission(d):
    """Revalider dans le runner, même si la demande vient de notre web : seules les formes connues passent."""
    if not isinstance(d, dict) or d.get("schema_version") != VERSION or d.get("mode") != "qa" or set(d) - CHAMPS:
        raise ValueError("Le format de la mission QA est invalide.")
    cible = trouver_cible(d.get("target_id"))
    pilotage, appareil = d.get("pilotage"), d.get("appareil", "ordinateur")
    if pilotage not in PILOTAGES or appareil not in APPAREILS:
        raise ValueError("Le pilotage ou l'appareil est inconnu.")
    if pilotage not in cible["limites"]:
        raise ValueError("Ce pilotage n'est pas ouvert sur cette cible.")
    # Une cible connectée reçoit un coffre H propre à l'essai ; une cible publique, jamais.
    coffre, identite = d.get("coffre"), d.get("identite") or []
    if cible.get("connexion") and not (isinstance(coffre, str) and UUID.fullmatch(coffre)):
        raise ValueError("Cette cible se teste connectée : il faut un coffre H propre à l'essai.")
    if not cible.get("connexion") and (coffre is not None or identite):
        raise ValueError("Une cible publique ne reçoit ni coffre ni identité.")
    if not isinstance(identite, list) or len(identite) > 3 or not all(isinstance(x, str) and 0 < len(x.strip()) <= 120 for x in identite):
        raise ValueError("L'identité attendue est invalide.")
    source = d.get("source", "texte")
    if source not in ("texte", "voix"):
        raise ValueError("La source de la consigne est inconnue.")
    modele_h = d.get("modele_h") or MODELE
    if modele_h not in MODELES_H:
        raise ValueError("Ce modèle H n'est pas proposé.")
    humain = d.get("preparation_humaine_s")
    if humain is not None and (not isinstance(humain, (int, float)) or isinstance(humain, bool) or not 0 <= humain <= 7200):
        raise ValueError("La durée de préparation est invalide.")
    mission = {
        "schema_version": VERSION, "mode": "qa", "target_id": cible["id"], "pilotage": pilotage, "appareil": appareil,
        "instruction": _texte(d.get("instruction"), 2000, "La consigne"), "source": source, "modele_h": modele_h,
        "preparation_humaine_s": humain, "plan": None,
    }
    if cible.get("connexion"):
        mission.update(coffre=coffre, identite=[" ".join(x.split()) for x in identite])
    if pilotage == "guide":
        if d.get("plan") is None:
            raise ValueError("Un parcours guidé demande un plan relu.")
        mission["plan"] = valider_plan(d["plan"], cible)
    return mission, cible


# ── Les pages servies : des lectures HTTP bornées, sur l'origine de la cible uniquement ─────────────────────────

class _TexteHTML(HTMLParser):
    """Le texte visible d'une page servie (sans scripts ni styles) et son titre principal."""

    IGNORES = {"script", "style", "noscript", "svg", "template"}
    CADRE = {"nav", "header", "footer"}  # le menu et le pied de page, présents sur chaque page

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pile, self.morceaux, self.contenu, self.h1, self.dans_h1, self.cadre = [], [], [], [], 0, 0

    def handle_starttag(self, tag, attrs):
        if tag in self.IGNORES:
            self.pile.append(tag)
        if tag in self.CADRE:
            self.cadre += 1
        if tag == "h1":
            self.dans_h1 += 1
        if tag in ("br", "p", "div", "li", "h1", "h2", "h3", "a", "span", "em", "strong"):
            self.morceaux.append(" ")
            self.contenu.append(" ")
            if self.dans_h1:
                self.h1.append(" ")

    def handle_endtag(self, tag):
        if self.pile and self.pile[-1] == tag:
            self.pile.pop()
        if tag in self.CADRE and self.cadre:
            self.cadre -= 1
        if tag == "h1" and self.dans_h1:
            self.dans_h1 -= 1
            self.h1.append(" | ")

    def handle_data(self, data):
        if not self.pile:
            self.morceaux.append(data)
            if not self.cadre:
                self.contenu.append(data)
            if self.dans_h1:
                self.h1.append(data)


def texte_html(source, avec_contenu=False):
    """Le texte visible d'une page servie et ses titres ; avec_contenu ajoute le texte hors menu, en-tête et pied de page."""
    lecteur = _TexteHTML()
    lecteur.feed(source)
    titres = [t for t in (" ".join(x.split()) for x in "".join(lecteur.h1).split(" | ")) if t]
    texte = " ".join("".join(lecteur.morceaux).split())
    return (texte, titres, " ".join("".join(lecteur.contenu).split())) if avec_contenu else (texte, titres)


class Lectures:
    """Une seule lecture par chemin (cache), redirections suivies sur l'origine, budget de lectures et d'octets."""

    def __init__(self, cible, controle, transport=None):
        self.cible, self.controle = cible, controle
        self.limites = cible["limites"]
        self.preuves, self.cache, self.nombre = [], {}, 0
        self.privees = set()  # les chemins qu'une lecture anonyme ne voit pas : elle est renvoyée à la connexion
        self.http = httpx.Client(transport=transport, follow_redirects=False, trust_env=False, timeout=15,
                                 headers={"User-Agent": "HSentinel-QA/0.3 (authorized read-only QA check)"})

    def lire(self, url):
        chemin = chemin_cible(self.cible, url)
        if chemin is None:
            raise Interruption("out_of_scope")
        if chemin in self.cache:
            return self.cache[chemin]
        if chemin in self.privees:
            raise Interruption("private_page")
        courant = self.cible["origine"] + chemin
        for _ in range(4):
            self.controle.verifier()
            self.nombre += 1
            if self.nombre > self.limites["lectures_http"]:
                raise Interruption("read_budget_exceeded")
            corps, taille = [], 0
            with self.http.stream("GET", courant, timeout=min(15, self.controle.restant())) as flux:
                for morceau in flux.iter_bytes():
                    taille += len(morceau)
                    if taille > self.limites["octets_par_lecture"]:
                        raise Interruption("response_too_large")
                    corps.append(morceau)
                statut, entetes = flux.status_code, flux.headers
            suivant = entetes.get("location") if 300 <= statut < 400 else None
            vers = chemin_cible(self.cible, urljoin(courant, suivant)) if suivant else None
            if vers and vers != chemin and vers == (self.cible.get("connexion") or {}).get("chemin"):
                # Une page privée : sa réponse anonyme est la connexion, pas la page que le navigateur connecté a vue.
                self.privees.add(chemin)
                raise Interruption("private_page")
            if vers:
                courant = self.cible["origine"] + vers
                continue
            break
        brut = b"".join(corps)
        texte, titres, contenu, source = "", [], "", ""
        if "text/html" in entetes.get("content-type", ""):
            source = brut.decode(flux.encoding or "utf-8", errors="replace")
            texte, titres, contenu = texte_html(source, avec_contenu=True)
        page = {"id": f"http-{len(self.preuves) + 1}", "kind": "http", "url": self.cible["origine"] + chemin,
                "url_finale": courant, "method": "GET", "status_code": statut, "bytes": taille,
                "sha256": hashlib.sha256(brut).hexdigest(), "h1": titres[:3], "captured_at": maintenant()}
        self.preuves.append(page)
        self.cache[chemin] = {**page, "texte": texte, "contenu": contenu, "html": source}
        return self.cache[chemin]

    def essayer(self, url):
        """Une lecture dont l'échec rend la vérification non concluante, jamais une conclusion."""
        try:
            return self.lire(url)
        except (Interruption, httpx.HTTPError):
            return None

    def close(self):
        self.http.close()


# ── Retrouver un texte : la citation de l'agent ou la valeur attendue, dans la page affichée ou servie ─────────

_SIGNES = str.maketrans({"’": "'", "‘": "'", "«": '"', "»": '"', "“": '"', "”": '"', " ": " ", " ": " "})


# « Quatre étapes » et « 4 étapes » disent la même chose (faux écart du 18/11 à 7 h 11). « un », « une » et « neuf »
# restent des mots : ce sont aussi un article et un adjectif.
_NOMBRES = {"deux": "2", "trois": "3", "quatre": "4", "cinq": "5", "six": "6", "sept": "7", "huit": "8", "dix": "10",
            "onze": "11", "douze": "12", "treize": "13", "quatorze": "14", "quinze": "15", "seize": "16", "vingt": "20"}


def normaliser(texte):
    texte = unicodedata.normalize("NFKD", (texte or "").translate(_SIGNES))
    texte = "".join(c for c in texte if not unicodedata.combining(c)).casefold()
    return " ".join(_NOMBRES.get(mot, mot) for mot in re.sub(r"[^0-9a-z]+", " ", texte).split())


def _dans_l_ordre(mots, jetons, ecart=3):
    for depart, jeton in enumerate(jetons):
        if jeton != mots[0]:
            continue
        position, trouve = depart, 1
        for mot in mots[1:]:
            suite = next((p for p in range(position + 1, min(len(jetons), position + 2 + ecart)) if jetons[p] == mot), None)
            if suite is None:
                break
            position, trouve = suite, trouve + 1
        if trouve == len(mots):
            return True
    return False


def retrouver(citation, sources):
    """« exacte », « approchee » (les mêmes mots dans l'ordre, au plus 3 mots intercalés) ou None."""
    cherche = normaliser(citation)
    if not cherche:
        return None
    normalisees = [normaliser(s) for s in sources if s]
    if any(f" {cherche} " in f" {s} " for s in normalisees):
        return "exacte"
    mots = cherche.split()
    if len(mots) >= 3 and any(_dans_l_ordre(mots, s.split()) for s in normalisees):
        return "approchee"
    return None


def retrouver_citation(citation, sources):
    """La citation de l'agent : entière, ou fragment par fragment quand il en assemble plusieurs (« 01 … / 02 … / 03 … »).

    Vécu le 18/11 à 7 h 06 : trois intitulés exacts, séparés par « / », rejetés comme une seule citation introuvable.
    Chaque fragment de deux mots ou plus doit se retrouver ; un seul fragment absent annule la citation.
    """
    entiere = retrouver(citation, sources)
    if entiere:
        return entiere
    fragments = [f for f in re.split(r"\s+[/|;—]\s+|…|\.\.\.|\n", citation or "") if len(normaliser(f).split()) >= 2]
    if len(fragments) >= 2 and all(retrouver(f, sources) for f in fragments):
        return "par fragments"
    return None


def titre_tronque(citation, textes):
    """Le texte relevé par H ne garde d'un titre à styles mêlés que sa partie en italique : « Bonne *soirée*, Alec »
    y devient la ligne « *soirée* » (Peer Review, 18/11 à 18 h 37, capture à l'appui). Ce fragment, s'il appartient
    à la citation de l'agent ; sinon None. Il explique une citation introuvable, il ne la prouve jamais."""
    cherche = f" {normaliser(citation)} "
    for texte in textes:
        for fragment in re.findall(r"^\s*\*([^*\n]{1,80})\*\s*$", texte or "", re.M):
            mots = normaliser(fragment)
            if len(mots) >= 4 and f" {mots} " in cherche:
                return fragment.strip()
    return None


def meme_page(textes_affiches, texte_servi):
    """Empreinte positive : une ligne affichée par le navigateur se retrouve dans la page servie."""
    servi = f" {normaliser(texte_servi)} "
    for texte in textes_affiches:
        for ligne in texte.splitlines():
            ligne = normaliser(re.sub(r"\]\([^)]*\)", "", ligne))
            if len(ligne) >= 20 and f" {ligne} " in servi:
                return True
    return False


# ── La trajectoire H : pages vues, gestes, mesures ─────────────────────────────────────────────────────────────

GESTES = {"web_fetch": "Lecture directe (hors interface)", "click_web": "Clic", "go_to_web": "Adresse ouverte", "scroll_web": "Défilement", "move_mouse_web": "Survol",
          "write": "Saisie de texte", "fill_secret_at": "Saisie d'un secret", "select_option": "Choix dans une liste",
          "press_keys_web": "Touches", "go_back_web": "Retour", "refresh_web": "Rechargement", "wait_web": "Attente",
          "switch_tab_web": "Changement d'onglet", "close_tab_web": "Fermeture d'onglet", "ctrl_f_web": "Recherche dans la page",
          "reader_mode": "Lecture du contenu", "list_secrets": "Liste des champs du coffre"}


def decrire_geste(outil, args):
    detail = args.get("element") or args.get("url") or args.get("query") or args.get("keys") or args.get("direction") or ""
    if outil == "write":
        detail = args.get("element") or ""  # le texte saisi n'est jamais recopié
    nom = GESTES.get(outil, outil)
    return f"{nom} · {str(detail)[:160]}" if detail else nom


def lire_trajectoire(evenements):
    observations, gestes, metriques = [], [], None
    for i, e in enumerate(evenements):
        data = e.get("data") or {}
        if e.get("type") == "AgentEvent" and data.get("kind") == "observation_event":
            meta, image = data.get("metadata") or {}, data.get("image") or {}
            observations.append({"i": i, "quand": e.get("timestamp"), "url": meta.get("url") or "", "titre": meta.get("title") or "",
                                 "texte": meta.get("text") or "", "image": image.get("source") if image.get("type") == "url" else None})
        elif e.get("type") == "AgentEvent" and data.get("kind") == "policy_event":
            for req in data.get("tool_reqs") or []:
                if req.get("tool_name") != "answer":
                    gestes.append({"i": i, "quand": e.get("timestamp"), "outil": req.get("tool_name"), "args": req.get("args") or {},
                                   "pensee": (data.get("content") or "")[:300]})
        elif e.get("type") == "MetricsUpdateEvent":
            metriques = data.get("metrics") or metriques
    return observations, gestes, metriques


def visites(cible, observations, gestes):
    """Chaque chemin de l'origine vu par le navigateur, dans l'ordre, avec la façon d'y arriver."""
    parcours, precedent = {}, None
    for obs in observations:
        chemin = chemin_cible(cible, obs["url"])
        if chemin is None:
            continue
        if chemin not in parcours:
            entre = [g for g in gestes if (precedent["i"] if precedent else -1) < g["i"] < obs["i"]]
            if precedent is None:
                mode, geste = "depart", None
            elif any(g["outil"] == "go_to_web" for g in entre):
                mode, geste = "adresse", next(g for g in entre if g["outil"] == "go_to_web")
            else:
                mode, geste = "interface", (entre[-1] if entre else None)
            parcours[chemin] = {"chemin": chemin, "mode": mode, "geste": decrire_geste(geste["outil"], geste["args"]) if geste else None,
                                "observations": []}
        parcours[chemin]["observations"].append(obs)
        precedent = obs
    return parcours


# ── La vérification par le code ─────────────────────────────────────────────────────────────────────────────

def _resultat(id_, type_, description, attendu, statut, code, observe, verification=None, agent=None, chemin=None, preuves=()):
    return {"id": id_, "type": type_, "description": description, "attendu": attendu, "status": statut, "reason_code": code,
            "verification": verification, "observe": observe, "agent": agent, "chemin": chemin, "preuves": list(preuves)}


def _capture(parcours, chemin):
    """La dernière capture d'un chemin, comme référence de preuve."""
    obs = [o for o in parcours.get(chemin, {}).get("observations", []) if o.get("image")]
    return f"obs-{obs[-1]['i']}" if obs else None


# ── Une cible connectée : la connexion par le coffre, l'identité, et les gestes qui peuvent écrire ────────────────

def page_de(cible, observations, i):
    """L'URL affichée au moment de l'événement i : la dernière vue avant lui, sinon la page de départ."""
    vues = [o["url"] for o in observations if o["i"] < i and o["url"]]
    return vues[-1] if vues else cible["entree"]


def risque_d_ecriture(cible, outil, args, url_page):
    """Sur une cible connectée : un geste qui peut écrire. Le formulaire de connexion est le seul autorisé, rempli par le coffre."""
    if chemin_cible(cible, url_page) == cible["connexion"]["chemin"]:
        return outil == "write"
    mots = set(normaliser(str(args.get("element") or "")).split())
    return outil in ("write", "fill_secret_at", "select_option") or (outil == "click_web" and bool(VERBES_A_RISQUE & mots))


def violation(cible, outil, args, url_page):
    """Un geste contraire aux règles de l'agent, relevé dans le rapport."""
    if cible.get("connexion") and risque_d_ecriture(cible, outil, args, url_page):
        return True
    if outil == "write" or (outil == "fill_secret_at" and not cible.get("connexion")):
        return True
    return outil == "go_to_web" and chemin_cible(cible, args.get("url", "")) != chemin_cible(cible, cible["entree"])


def garde_connectee(evenement, cible, etat):
    """En direct, sur une cible connectée : (code, motif) pour arrêter la session, ou None.

    Un geste qui peut écrire, ou une page que le contrat interdit, quel que soit le libellé qui y a mené. H a déjà exécuté
    le geste quand son événement arrive, souvent par lots de plusieurs pas : l'arrêt borne la suite, il n'empêche pas ce geste.
    """
    data = evenement.get("data") or {}
    if evenement.get("type") != "AgentEvent":
        return None
    if data.get("kind") == "observation_event":
        parts = urlsplit((data.get("metadata") or {}).get("url") or "")
        if f"{parts.scheme}://{parts.netloc}" == cible["origine"] and chemin_exclu(cible, parts.path.rstrip("/") or "/"):
            return "forbidden_page", f"Page interdite sur un site connecté : {parts.path}"
        return None
    if data.get("kind") != "policy_event":
        return None
    for req in data.get("tool_reqs") or []:
        outil, args = req.get("tool_name"), req.get("args") or {}
        if outil != "answer" and risque_d_ecriture(cible, outil, args, etat.get("url") or cible["entree"]):
            return "write_risk", f"Geste qui peut écrire sur un site connecté : {decrire_geste(outil, args)}"
    return None


def controles_connexion(mission, cible, observations, gestes, arret_code=None):
    """La connexion, puis l'identité du compte, prouvées par la trajectoire H : jamais par l'avis de l'agent."""
    login = cible["connexion"]["chemin"]
    manque = "skipped" if arret_code in ("cancelled", "budget_exceeded") else "inconclusive"
    remplis = [g for g in gestes if g["outil"] == "fill_secret_at" and chemin_cible(cible, page_de(cible, observations, g["i"])) == login]
    apres = next((o for o in observations if remplis and o["i"] > remplis[-1]["i"]
                  and chemin_cible(cible, o["url"]) not in (None, login)), None)
    base = dict(id_="K1", type_="connexion", description="Connexion avec le compte du coffre",
                attendu="La page de connexion mène à l'espace du compte")
    if apres:
        chemin = chemin_cible(cible, apres["url"])
        resultats = [_resultat(**base, statut="passed", code="logged_in", verification="code", chemin=chemin,
                               observe=f"Le coffre a rempli {len(remplis)} champ(s) sur {login}, puis le navigateur affiche {chemin}.",
                               preuves=[f"obs-{apres['i']}"] if apres["image"] else [])]
    elif remplis:
        vue = [o for o in observations if chemin_cible(cible, o["url"]) == login and o["image"]]
        resultats = [_resultat(**base, statut="inconclusive", code=arret_code or "login_not_completed", verification="code", chemin=login,
                               observe=f"Le coffre a rempli {len(remplis)} champ(s), mais le navigateur est resté sur {login} : identifiants "
                                       "refusés, message d'erreur ou bouton sans effet. À confirmer sur la capture.",
                               preuves=[f"obs-{vue[-1]['i']}"] if vue else [])]
    else:
        resultats = [_resultat(**base, statut=manque, code=arret_code or "vault_not_used",
                               observe="Le coffre n'a rempli aucun champ de la page de connexion.")]
    marqueurs = [m for m in mission.get("identite") or [] if normaliser(m)]
    if marqueurs:
        base = dict(id_="K2", type_="identite", description="Le compte affiché est celui du coffre",
                    attendu="Le nom du compte de test apparaît après la connexion")
        vue = next((o for o in observations if apres and o["i"] >= apres["i"] and chemin_cible(cible, o["url"]) not in (None, login)
                    and any(retrouver(m, [o["texte"]]) for m in marqueurs)), None)
        if vue:
            resultats.append(_resultat(**base, statut="passed", code="identity_shown", verification="code", chemin=chemin_cible(cible, vue["url"]),
                                       observe=f"Le nom du compte attendu apparaît à l'écran sur {chemin_cible(cible, vue['url'])} "
                                               "(marqueur fourni au lancement, non recopié dans le rapport).",
                                       preuves=[f"obs-{vue['i']}"] if vue["image"] else []))
        elif apres:
            resultats.append(_resultat(**base, statut="inconclusive", code="identity_not_shown", verification="code",
                                       observe="Aucun marqueur du compte attendu n'apparaît à l'écran après la connexion : identité non vérifiée."))
        else:
            resultats.append(_resultat(**base, statut=manque, code=arret_code or "not_logged_in",
                                       observe="Sans connexion prouvée, l'identité ne peut pas être vérifiée."))
    return resultats


def verifier(mission, cible, reponse, observations, gestes, lectures, arret_code=None):
    """Les résultats, critère par critère, puis les contrôles automatiques des pages visitées."""
    parcours = visites(cible, observations, gestes)
    affiches = {ch: [o["texte"] for o in p["observations"]] for ch, p in parcours.items()}
    dernier = list(parcours)[-1] if parcours else None

    def sources(chemin):
        page = lectures.essayer(cible["origine"] + chemin) if chemin else None
        return affiches.get(chemin, []) + ([page["texte"]] if page and page.get("texte") else []), page

    def preuves_de(chemin, page):
        return [p for p in (_capture(parcours, chemin), page["id"] if page else None) if p]

    resultats = controles_connexion(mission, cible, observations, gestes, arret_code) if cible.get("connexion") else []
    reponses = {str(c.get("id") or "").strip().upper(): c for c in (reponse or {}).get("criteres", []) if isinstance(c, dict)}
    manque = "skipped" if arret_code in ("cancelled", "budget_exceeded") else "inconclusive"
    for crit in (mission["plan"] or {}).get("criteres", []):
        a = reponses.get(crit["id"])
        agent = None
        if a:
            agent = {"statut": a.get("statut"), "constat": str(a.get("constat") or "")[:400],
                     "citation": str(a.get("citation") or "")[:300], "url": str(a.get("url") or "")[:300]}
        chemin_agent = chemin_cible(cible, agent["url"]) if agent else None
        chemin_agent = chemin_agent if chemin_agent in parcours else None
        base = dict(id_=crit["id"], type_=crit["type"], description=crit["description"], attendu=crit["valeur"], agent=agent)
        if not parcours and arret_code:
            resultats.append(_resultat(**base, statut=manque, code=arret_code, observe="La mission s'est arrêtée avant ce contrôle."))
            continue

        if crit["type"] == "page" and crit["valeur"]:
            arrivee = parcours.get(crit["valeur"])
            if arrivee and arrivee["mode"] != "adresse":
                _, page = sources(crit["valeur"])
                comment = "c'est la page de départ" if arrivee["mode"] == "depart" else f"par l'interface ({arrivee['geste'] or 'navigation'})"
                if page is None and crit["valeur"] in lectures.privees:
                    resultats.append(_resultat(**base, statut="passed", code="page_reached", verification="code", chemin=crit["valeur"],
                                               observe=f"Page {crit['valeur']} atteinte {comment}. Page privée : une lecture anonyme "
                                                       "est renvoyée à la connexion ; la preuve est la trajectoire du navigateur connecté.",
                                               preuves=preuves_de(crit["valeur"], None)))
                elif page is None:
                    resultats.append(_resultat(**base, statut="inconclusive", code="http_unavailable", chemin=crit["valeur"],
                                               observe="La page a été atteinte, mais sa réponse n'a pas pu être relue.",
                                               preuves=preuves_de(crit["valeur"], None)))
                elif page["status_code"] >= 400:
                    resultats.append(_resultat(**base, statut="failed", code="page_http_error", verification="code", chemin=crit["valeur"],
                                               observe=f"La page atteinte répond HTTP {page['status_code']}.",
                                               preuves=preuves_de(crit["valeur"], page)))
                else:
                    resultats.append(_resultat(**base, statut="passed", code="page_reached", verification="code", chemin=crit["valeur"],
                                               observe=f"Page {crit['valeur']} atteinte {comment} ; elle répond HTTP {page['status_code']}.",
                                               preuves=preuves_de(crit["valeur"], page)))
            elif arrivee:
                resultats.append(_resultat(**base, statut="inconclusive", code="reached_by_address", chemin=crit["valeur"],
                                           observe="L'agent a ouvert la page en tapant son adresse : le parcours par l'interface n'est pas prouvé.",
                                           preuves=preuves_de(crit["valeur"], None)))
            else:
                page = lectures.essayer(cible["origine"] + crit["valeur"])
                if page and page["status_code"] >= 400:
                    resultats.append(_resultat(**base, statut="failed", code="expected_page_missing", verification="code",
                                               chemin=crit["valeur"], observe=f"La page attendue répond HTTP {page['status_code']}.",
                                               preuves=[page["id"]]))
                else:
                    explication = f" L'agent indique : {agent['constat']}" if agent and agent["constat"] else ""
                    resultats.append(_resultat(**base, statut=manque, code=arret_code or "page_not_reached", chemin=crit["valeur"],
                                               observe="Le navigateur n'a pas atteint cette page." + explication,
                                               preuves=[page["id"]] if page else []))
            continue

        if crit["type"] == "texte":
            # La page servie fait foi quand elle est fiable (même page que l'écran, vrai contenu) : son texte hors menu,
            # car le menu de chaque page cite d'autres pages (« 4 étapes » sur toutes les pages d'Eugenia, 18/11).
            # Sinon (page rendue côté navigateur), l'écran seul peut prouver une présence, jamais une absence.
            v = crit["valeur"]
            trouve, manquant = None, None
            for chemin in [c for c in dict.fromkeys([chemin_agent, dernier]) if c]:
                page = lectures.essayer(cible["origine"] + chemin)
                ecran = affiches.get(chemin, [])
                fiable = bool(page and page["status_code"] < 400 and len((page.get("contenu") or "").split()) >= 50
                              and meme_page(ecran, page["texte"]))
                correspondance = retrouver(v, [page["contenu"]]) if fiable else retrouver(v, ecran)
                if correspondance:
                    ou = "dans le contenu de" if fiable else "à l'écran sur"
                    trouve = (chemin, page, f"« {v} » apparaît {ou} {chemin} (correspondance {correspondance}).")
                    break
                if fiable and manquant is None:
                    menu = " Il n'apparaît que dans le menu ou le pied de page du site." if retrouver(v, [page["texte"]]) else ""
                    manquant = (chemin, page, f"« {v} » n'apparaît pas dans le contenu de {chemin}.{menu}")
            desaccord = None
            if not trouve and manquant and agent and agent["statut"] == "conforme" and agent["citation"]:
                # L'agent voit l'équivalent et le cite : une absence littérale ne suffit plus à prouver un écart.
                textes_agent, _ = sources(manquant[0])
                desaccord = retrouver_citation(agent["citation"], textes_agent)
            if trouve:
                chemin, page, texte = trouve
                resultats.append(_resultat(**base, statut="passed", code="text_found", verification="code", chemin=chemin,
                                           observe=texte, preuves=preuves_de(chemin, page)))
            elif desaccord:
                chemin, page, texte = manquant
                resultats.append(_resultat(**base, statut="inconclusive", code="agent_disagrees", verification="citation", chemin=chemin,
                                           observe=f"{texte} L'agent juge pourtant le critère conforme et cite un passage retrouvé sur la page "
                                                   f"(correspondance {desaccord}) : à confirmer.", preuves=preuves_de(chemin, page)))
            elif manquant:
                chemin, page, texte = manquant
                resultats.append(_resultat(**base, statut="failed", code="text_missing", verification="code", chemin=chemin,
                                           observe=texte, preuves=preuves_de(chemin, page)))
            else:
                chemin = chemin_agent or dernier
                resultats.append(_resultat(**base, statut=manque, code=arret_code or "text_unverified", chemin=chemin,
                                           observe="Le texte n'a pas été retrouvé à l'écran, et la page servie ne permet pas de conclure.",
                                           preuves=preuves_de(chemin, None) if chemin else []))
            continue

        # constat (et page sans chemin connu) : la citation de l'agent doit se retrouver sur la page qu'il a vue.
        if agent and agent["citation"] and chemin_agent:
            textes, page = sources(chemin_agent)
            correspondance = retrouver_citation(agent["citation"], textes)
            if correspondance and agent["statut"] == "conforme":
                resultats.append(_resultat(**base, statut="passed", code="citation_found", verification="citation", chemin=chemin_agent,
                                           observe=f"La citation de l'agent est retrouvée sur {chemin_agent} (correspondance {correspondance}).",
                                           preuves=preuves_de(chemin_agent, page)))
            elif not correspondance and (tronque := titre_tronque(agent["citation"], textes)):
                resultats.append(_resultat(**base, statut="inconclusive", code="h_text_partial", chemin=chemin_agent,
                                           preuves=preuves_de(chemin_agent, page),
                                           observe=f"Citation absente du texte relevé par H, qui ne garde d'un titre à styles mêlés que sa "
                                                   f"partie en italique (« {tronque} ») : à confirmer sur la capture."))
            elif correspondance and agent["statut"] == "ecart":
                resultats.append(_resultat(**base, statut="inconclusive", code="agent_reported_gap", verification="citation",
                                           chemin=chemin_agent, preuves=preuves_de(chemin_agent, page),
                                           observe=f"L'agent signale un écart et sa citation est retrouvée sur {chemin_agent} "
                                                   f"(correspondance {correspondance}) ; le code ne peut pas prouver une absence : à confirmer sur la capture."))
            else:
                resultats.append(_resultat(**base, statut="inconclusive", code="citation_not_found" if not correspondance else "agent_not_verified",
                                           chemin=chemin_agent, preuves=preuves_de(chemin_agent, page),
                                           observe="La citation de l'agent n'a pas été retrouvée sur la page : son constat n'est pas recoupé."
                                           if not correspondance else "L'agent n'a pas pu vérifier ce critère."))
        else:
            explication = f" L'agent indique : {agent['constat']}" if agent and agent["constat"] else ""
            resultats.append(_resultat(**base, statut=manque, code=arret_code or "no_citation",
                                       observe="Aucune citation vérifiable n'a été fournie pour ce constat." + explication))

    if mission["pilotage"] == "exploration":
        resultats += explorer_resultats(cible, reponse, parcours, affiches, lectures, sources, preuves_de)

    for n, d in enumerate(difficultes(cible, observations, gestes), 1):
        cibles = ", ".join(f"« {c} » ×{k}" for c, k in d["cibles"])
        resultats.append(_resultat(f"D{n}", "difficulte", f"Parcours difficile sur {d['chemin']}", "Quelques gestes suffisent",
                                   "inconclusive", "repeated_attempts",
                                   f"{d['clics']} clics sans changer de page ({cibles}) : un élément qui ne réagit pas, ou un agent "
                                   "qui se trompe de cible. À confirmer sur le replay.", verification="code", chemin=d["chemin"],
                                   preuves=[p for p in [_capture(parcours, d["chemin"])] if p]))

    # Contrôle automatique : chaque page visitée doit répondre sans erreur.
    deja = {r["chemin"] for r in resultats if r["type"] in ("page", "page_visitee") and r["status"] != "inconclusive"}
    for n, chemin in enumerate([c for c in parcours if c not in deja], 1):
        page = lectures.essayer(cible["origine"] + chemin)
        if page is None:
            continue
        ok = page["status_code"] < 400
        resultats.append(_resultat(f"A{n}", "auto", f"La page visitée {chemin} répond sans erreur", "HTTP < 400",
                                   "passed" if ok else "failed", "page_ok" if ok else "page_http_error", f"HTTP {page['status_code']}.",
                                   verification="code", chemin=chemin, preuves=[page["id"]]))
    # Contrôle automatique : un texte anormal affiché à l'écran (« undefined », « lorem ipsum »…), relevé sans l'agent.
    for n, (chemin, textes) in enumerate(affiches.items(), 1):
        trouve = next((a for a in map(anomalie, textes) if a), None)
        if trouve:
            resultats.append(_resultat(f"T{n}", "texte_anormal", f"Texte anormal affiché sur {chemin}", "Aucun texte provisoire ou d'erreur",
                                       "failed", "anomalous_text", f"Le navigateur affiche « {trouve} ».", verification="code",
                                       chemin=chemin, preuves=preuves_de(chemin, None)))
    return resultats, parcours


_GENERIQUES = {"lien", "texte", "bouton", "icone", "avec", "l", "le", "la", "les", "de", "du", "des", "sous", "menu", "pour", "dans",
               "en", "haut", "a", "droite", "gauche", "entree", "section", "expandre", "deplier", "ouvrir", "sur", "et", "un", "une"}


def difficultes(cible, observations, gestes, seuil=6):
    """Les moments où l'agent clique encore et encore sans changer de page : un menu qui ne réagit pas, ou un agent perdu.

    Vécu en mobile le 18/11 à 7 h 17 : 12 clics sur « L'ÉCOLE » et « Notre ADN » sans atteindre la page. Le code relève
    le fait (les gestes enregistrés par H) ; il ne tranche pas entre le site et l'agent.
    """
    reperes = sorted([(o["i"], "page", o) for o in observations] + [(g["i"], "geste", g) for g in gestes], key=lambda x: x[0])
    episodes, url, clics = [], None, []

    def clore():
        if len(clics) >= seuil:
            compte, libelles = {}, {}
            for g in clics:
                element = " ".join(str(g["args"].get("element") or "élément sans nom").split())[:60]
                cle = " ".join([m for m in normaliser(element).split() if m not in _GENERIQUES][:2]) or element
                compte[cle] = compte.get(cle, 0) + 1
                libelles.setdefault(cle, element)  # le libellé de l'agent, tel qu'il l'a écrit la première fois
            principaux = [(libelles[c], k) for c, k in sorted(compte.items(), key=lambda x: -x[1])[:2]]
            episodes.append({"chemin": chemin_cible(cible, url) or url, "clics": len(clics), "cibles": principaux})

    for _, sorte, objet in reperes:
        if sorte == "page":
            if objet["url"] != url:
                clore()
                url, clics = objet["url"], []
        elif objet["outil"] == "click_web":
            clics.append(objet)
    clore()
    return episodes


def liens_affiches(cible, textes):
    """Les liens internes visibles à l'écran : le navigateur les rend en markdown, [libellé](chemin)."""
    liens = {}
    for texte in textes:
        for libelle, cible_lien in re.findall(r"\[([^\]\n]{1,120})\]\(([^)\s]+)\)", texte):
            chemin = chemin_cible(cible, cible_lien)
            if chemin and not re.search(r"\.(pdf|png|jpe?g|svg|webp|woff2?|css|js)$", chemin, re.I):
                liens.setdefault(chemin, " ".join(libelle.replace("*", "").split())[:80])
    return liens


def explorer_resultats(cible, reponse, parcours, affiches, lectures, sources, preuves_de):
    """L'exploration : une ligne par page ouverte, les problèmes signalés, puis les liens visibles vérifiés."""
    resultats = []
    pages_agent = {chemin_cible(cible, p.get("url", "")): p for p in (reponse or {}).get("pages", []) if isinstance(p, dict)}
    for n, (chemin, arrivee) in enumerate(parcours.items(), 1):
        textes, page = sources(chemin)
        if page is None:
            continue
        p = pages_agent.get(chemin) or {}
        titre = str(p.get("titre_cite") or "")[:200]
        cite = retrouver_citation(titre, textes) if titre else None
        titre_txt = f" Titre cité par l'agent : « {titre} »" + (f", retrouvé ({cite})." if cite else ", non retrouvé.") if titre else ""
        ok = page["status_code"] < 400
        resultats.append(_resultat(f"P{n}", "page_visitee", f"Page {chemin}", "La page s'ouvre sans erreur", "passed" if ok else "failed",
                                   "page_ok" if ok else "page_http_error",
                                   f"Ouverte {'au départ' if arrivee['mode'] == 'depart' else 'par ' + (arrivee['geste'] or 'navigation')} ; HTTP {page['status_code']}.{titre_txt}",
                                   verification="code", chemin=chemin, preuves=preuves_de(chemin, page)))
        for m, probleme in enumerate(p.get("problemes") or [], 1):
            if not isinstance(probleme, dict):
                continue
            description, citation = str(probleme.get("description") or "")[:300], str(probleme.get("citation") or "")[:300]
            trouve = retrouver_citation(citation, textes) if citation else None
            anormal = anomalie(citation) if trouve else None
            resultats.append(_resultat(f"P{n}.{m}", "probleme", description or "Problème signalé", "Aucun problème visible",
                                       "failed" if anormal else "inconclusive", "anomalous_text" if anormal else "agent_reported_problem",
                                       f"Texte anormal affiché : « {citation} »." if anormal else
                                       f"Signalé par l'agent{' (citation retrouvée)' if trouve else ''} ; à confirmer sur la capture.",
                                       verification="code" if anormal else ("citation" if trouve else "agent"), chemin=chemin,
                                       preuves=preuves_de(chemin, page)))
    liens = liens_affiches(cible, [t for textes in affiches.values() for t in textes])
    casses, verifies = [], 0
    for chemin, libelle in liens.items():
        if chemin in parcours:
            continue
        page = lectures.essayer(cible["origine"] + chemin)
        if page is None:
            break  # budget de lectures atteint : les liens restants ne sont pas comptés
        verifies += 1
        if page["status_code"] >= 400:
            casses.append((chemin, libelle, page))
    for n, (chemin, libelle, page) in enumerate(casses, 1):
        resultats.append(_resultat(f"L{n}", "lien", f"Lien « {libelle} » → {chemin}", "Le lien mène à une page existante", "failed",
                                   "broken_link", f"La page liée répond HTTP {page['status_code']}.", verification="code", chemin=chemin,
                                   preuves=[page["id"]]))
    if verifies:
        resultats.append(_resultat("L0", "liens", f"{verifies} liens visibles à l'écran vérifiés", "Chaque lien mène à une page existante",
                                   "failed" if casses else "passed", "links_checked",
                                   f"{verifies - len(casses)} répondent sans erreur, {len(casses)} sont cassés.", verification="code"))
    return resultats


# ── La session H ────────────────────────────────────────────────────────────────────────────────────────────

def message_mission(mission, cible):
    commun = {"origine_autorisee": cible["origine"], "page_de_depart": cible["entree"], "pilotage": mission["pilotage"],
              "appareil": mission["appareil"]}
    if cible.get("connexion"):
        commun["connexion"] = ("Commence par te connecter, une seule fois, en remplissant les champs avec fill_secret_at (le coffre), "
                               "puis suis la mission en consultation seule.")
    if cible.get("interdits"):
        commun["interdits_du_site"] = cible["interdits"]
    if mission["pilotage"] == "exploration":
        limite = cible["limites"]["exploration"]["max_pages"]
        return json.dumps({**commun, "max_pages": limite, "criteres": [],
                           "objectif": f"Ouvre une à une les entrées du menu principal, au plus {limite} pages, et relève sur chacune "
                                       "le titre principal (citation) et chaque problème visible."}, ensure_ascii=False)
    plan = mission["plan"]
    return json.dumps({**commun, "demande_utilisateur": mission["instruction"], "etapes": plan["etapes"],
                       "criteres": [{"id": c["id"], "description": c["description"], **({"valeur_attendue": c["valeur"]} if c["valeur"] else {})}
                                    for c in plan["criteres"]],
                       "a_ne_pas_faire": plan["hors_perimetre"]}, ensure_ascii=False)


def raconter(evenement, journal, cible, etat):
    """Le fil en direct : chaque geste de l'agent et chaque nouvelle page, au moment où H les enregistre."""
    data = evenement.get("data") or {}
    if evenement.get("type") != "AgentEvent":
        return
    if data.get("kind") == "policy_event":
        for req in data.get("tool_reqs") or []:
            if req.get("tool_name") == "answer":
                journal("L'agent rend son constat.", "action", outil="answer")
            else:
                journal(decrire_geste(req.get("tool_name"), req.get("args") or {}), "action", outil=req.get("tool_name"),
                        pensee=(data.get("content") or "")[:240])
    elif data.get("kind") == "observation_event":
        meta, image = data.get("metadata") or {}, data.get("image") or {}
        url = meta.get("url") or ""
        if url and url != etat.get("url"):
            etat["url"] = url
            chemin = chemin_cible(cible, url)
            journal(f"Page {chemin or url} · {(meta.get('title') or '')[:90]}", "page", url=url, hors_perimetre=chemin is None,
                    capture=image.get("source") if image.get("type") == "url" else None)


def preparer_coffre(client, cible, identifiant, mot_de_passe):
    """Un coffre H propre à l'essai, avec une seule entrée : l'agent remplit les champs sans jamais lire les valeurs."""
    nom = f"hsentinel-qa-{cible['id']}-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}"
    coffre = client.vaults.create_vault(name=nom, provider_config=VaultCreateRequestProviderConfig_Internal()).id
    try:
        client.vaults.create_vault_item(coffre, name=f"{cible['nom']} · compte de test", urls=[cible["origine"]],
                                        values={"username": identifiant, "email": identifiant, "password": mot_de_passe})
    except Exception:
        client.vaults.delete_vault(coffre)
        raise
    return coffre


def supprimer_coffre(client, coffre):
    """Le coffre de l'essai est supprimé à la fin, entrées comprises."""
    for item in client.vaults.list_vault_items(coffre, limit=100).items:
        client.vaults.delete_vault_item(coffre, item.id)
    client.vaults.delete_vault(coffre)


def lire_fin(client, session_id):
    """La session finale et sa réponse : tant qu'elle est « idle » sans réponse, H n'a pas fini de l'écrire."""
    limite = time.monotonic() + ATTENTE_REPONSE_S
    while True:
        final = client.sessions.get_session(session_id)
        etat = getattr(final.status, "status", final.status)
        if final.latest_answer is not None or str(getattr(etat, "value", etat)) != "idle" or time.monotonic() >= limite:
            return final
        time.sleep(0.5)


def jouer_session(client, mission, cible, controle, journal):
    """Lancer l'agent, suivre ses gestes en direct, l'arrêter si besoin, puis relever toute sa trajectoire."""
    connectee = bool(cible.get("connexion"))
    agent = assurer_agent(client, connecte=connectee)
    journal(f"Agent {agent['name']} confirmé dans H ({agent['action']})", "info")
    limites = cible["limites"][mission["pilotage"]]
    overrides = {"agent.environments[kind=web].start_url": cible["entree"],
                 "agent.environments[kind=web].mode": APPAREILS[mission["appareil"]]}
    if connectee:
        overrides["agent.environments[kind=web].vault_id"] = mission["coffre"]  # le coffre de cet essai, jamais dans la définition
    if mission["modele_h"] != MODELE:
        overrides["agent.model"] = mission["modele_h"]
    debut = time.monotonic()
    handle = client.start_session(agent=agent["name"], messages=message_mission(mission, cible), answer_schema=ReponseQA,
                                  overrides=overrides, max_steps=limites["max_steps"],
                                  max_time_s=max(30, min(limites["max_time_s"], int(controle.restant()))))
    session = {"agent": agent["name"], "modele": mission["modele_h"], "session": handle.id, "replay": None, "statut": "running",
               "steps": None, "tokens": None, "cout_dollars": None, "duree_s": None}
    try:
        session["replay"] = handle.get().agent_view_url
    except Exception:
        pass
    journal("2/4 Parcours de l'agent dans le navigateur", "etape")
    journal("L'agent H ouvre le navigateur", "session", session=handle.id, replay=session["replay"])
    index, termine, interruption, etat = 0, False, None, {}
    try:
        while True:
            controle.verifier()
            changes = client.sessions.get_session_changes(handle.id, from_index=index, include_events=True,
                                                          wait_for_seconds=int(min(5, controle.restant())))
            if changes is None:
                continue
            nouveaux = [e.model_dump(mode="json") if hasattr(e, "model_dump") else e for e in changes.new_events or []]
            for e in nouveaux:
                raconter(e, journal, cible, etat)
                arret = garde_connectee(e, cible, etat) if connectee else None
                if arret:
                    journal(f"{arret[1]}. Session arrêtée.", "erreur")
                    raise Interruption(arret[0])
            index = (changes.first_index if changes.first_index is not None else index) + len(nouveaux)
            statut_courant = getattr(changes.status, "value", changes.status)
            if statut_courant in FINIS:
                termine = True
                break
            if statut_courant in ("awaiting_tool_results", "awaiting_approval"):
                raise Interruption("agent_blocked")
    except Interruption as erreur:
        interruption = erreur.code
    finally:
        if not termine:
            try:
                client.sessions.cancel_session(handle.id)
                journal("Session H arrêtée ; les preuves déjà recueillies sont conservées.", "info")
            except Exception:
                session["annulation_non_confirmee"] = True
                journal("L'arrêt de la session H n'a pas pu être confirmé ; son plafond de durée reste actif.", "erreur")
    evenements = []
    for page in range(1, 40):
        items = client.sessions.list_session_events(handle.id, page=page, size=100).model_dump(mode="json").get("items", [])
        if not items:
            break
        evenements += items
    final = lire_fin(client, handle.id)
    statut = client.sessions.get_session_status(handle.id)
    etat_final = getattr(final.status, "status", final.status)  # Session.status est un objet SessionStatus
    session["statut"] = str(getattr(etat_final, "value", etat_final))
    session["duree_s"] = round(time.monotonic() - debut, 2)
    usage = statut.usage_per_model or []
    session["steps"] = statut.steps
    session["tokens"] = {"entree": sum(u.input_tokens or 0 for u in usage), "cache": sum(u.cached_tokens or 0 for u in usage),
                         "sortie": sum(u.output_tokens or 0 for u in usage), "raisonnement": sum(u.reasoning_tokens or 0 for u in usage)}
    _, _, metriques = lire_trajectoire(evenements)
    cout = (metriques or {}).get("total_cost")
    session["cout_dollars"] = round(cout, 6) if isinstance(cout, (int, float)) else None
    if statut.error_code:
        session["erreur"] = str(statut.error_code)
    reponse = None
    if final.latest_answer is not None:
        try:
            brut = final.latest_answer if isinstance(final.latest_answer, dict) else json.loads(final.latest_answer)
            reponse = ReponseQA.model_validate(brut).model_dump()
        except Exception:
            session["reponse_illisible"] = True
    return reponse, evenements, session, interruption


# ── La préparation du plan par Hugging Face (le CLI ; la web a la même, en JavaScript, avec la même consigne) ───

def liens_connus(cible, lectures):
    page = lectures.essayer(cible["entree"])
    if not page:
        return []
    liens = {}
    for href, libelle in re.findall(r'<a[^>]+href="([^"#]+)"[^>]*>(.*?)</a>', page["html"], re.S):
        chemin = chemin_cible(cible, html.unescape(href))
        texte = " ".join(html.unescape(re.sub(r"<[^>]+>", " ", libelle)).split())
        if chemin and texte and not chemin.startswith("/_"):
            liens.setdefault(chemin, texte[:80])
    return [{"chemin": c, "libelle": t} for c, t in list(liens.items())[:80]]


def preparer_plan(instruction, cible, jeton, lectures, http=None):
    regles = CATALOGUE["preparation"]
    donnees = {"consigne": instruction, "site": cible["origine"], "liens_connus": liens_connus(cible, lectures)}
    debut = time.monotonic()
    with (http or httpx.Client(timeout=60, trust_env=False)) as client_http:
        reponse = client_http.post(ROUTEUR_HF, headers={"Authorization": f"Bearer {jeton}"}, json={
            "model": regles["modele"], "temperature": 0, "max_tokens": 900, "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": "\n".join(regles["consigne_systeme"])},
                         {"role": "user", "content": json.dumps(donnees, ensure_ascii=False)}]})
    reponse.raise_for_status()
    corps = reponse.json()
    bloc = re.search(r"\{.*\}", corps["choices"][0]["message"]["content"] or "", re.S)
    if not bloc:
        raise ValueError("Le modèle de préparation n'a pas rendu de JSON.")
    plan = json.loads(bloc.group(0))
    plan["preparation"] = {"modele": regles["modele"], "latence_s": round(time.monotonic() - debut, 2),
                           "tokens": (corps.get("usage") or {}).get("total_tokens"),
                           "fournisseur": reponse.headers.get("x-inference-provider") or ""}
    return valider_plan(plan, cible)


# ── La mission complète ─────────────────────────────────────────────────────────────────────────────────────

def executer_qa(demande, client, journal=lambda *a, **k: None, arret=lambda: False, transport=None):
    mission, cible = valider_mission(demande)
    debut = time.monotonic()
    limites = cible["limites"][mission["pilotage"]]
    plan = mission["plan"]
    # Le marqueur d'identité sert à la vérification, jamais au rapport : il est masqué dans la demande enregistrée.
    demande_lisible = {**mission, "identite": ["•••"] * len(mission["identite"])} if mission.get("identite") else mission
    rapport = {"schema_version": VERSION, "phase": "completed", "mode": "qa", "request": demande_lisible,
               "titre": plan["titre"] if plan else "Exploration bornée du site", "scope_snapshot": cible, "started_at": maintenant(),
               "results": [], "parcours": [], "evidence": [], "sessions": [], "violations": [], "hors_origine": [],
               "cost_h": None, "cost_hf": None, "preparation": (plan or {}).get("preparation"), "interruption": None}
    controle = Controle(limites["max_time_s"] + 30, arret)
    lectures = None
    reponse, evenements = None, []
    try:
        journal("0/4 Mission vérifiée", "etape")
        journal("1/4 Préparation de l'agent H", "etape")
        reponse, evenements, session, interruption = jouer_session(client, mission, cible, controle, journal)
        rapport["sessions"].append(session)
        rapport["interruption"] = interruption
        rapport["agent"] = {"bloque": (reponse or {}).get("bloque"), "raison": str((reponse or {}).get("raison") or "")[:500],
                            "etapes": (reponse or {}).get("etapes", [])[:20]}
        journal("3/4 Vérification par le code", "etape")
        lectures = Lectures(cible, Controle(60), transport)  # son propre budget, qui court même après un arrêt demandé
        observations, gestes, _ = lire_trajectoire(evenements)
        resultats, parcours = verifier(mission, cible, reponse, observations, gestes, lectures,
                                       arret_code=interruption or ("agent_incomplete" if reponse is None else None))
        rapport["results"] = resultats
        rapport["parcours"] = [{"n": n, "quand": g["quand"], "geste": decrire_geste(g["outil"], g["args"]), "outil": g["outil"],
                                "pensee": g["pensee"]} for n, g in enumerate(gestes, 1)]
        rapport["visites"] = [{"chemin": p["chemin"], "mode": p["mode"], "geste": p["geste"], "titre": p["observations"][-1]["titre"],
                               "capture": f"obs-{p['observations'][-1]['i']}"} for p in parcours.values()]
        rapport["hors_origine"] = sorted({o["url"] for o in observations if o["url"] not in ("", "about:blank") and chemin_cible(cible, o["url"]) is None})
        rapport["lectures_directes"] = [str(g["args"].get("url") or "")[:300] for g in gestes if g["outil"] == "web_fetch"]
        rapport["violations"] = [decrire_geste(g["outil"], g["args"]) for g in gestes
                                 if violation(cible, g["outil"], g["args"], page_de(cible, observations, g["i"]))]
        captures = {r for res in resultats for r in res["preuves"] if r.startswith("obs-")} | {v["capture"] for v in rapport["visites"]}
        rapport["evidence"] = [{"id": f"obs-{o['i']}", "kind": "capture", "session": session["session"], "url": o["url"], "titre": o["titre"],
                                "quand": o["quand"], "image": o["image"]} for o in observations if f"obs-{o['i']}" in captures and o["image"]]
        for r in resultats:
            journal(f"{r['id']} · {r['description']}", "critere", status=r["status"], reason_code=r["reason_code"],
                    verification=r["verification"], observe=r["observe"])
    except Interruption as erreur:
        rapport["interruption"] = erreur.code
        journal(f"Mission interrompue : {erreur.code}", "erreur")
    except Exception as erreur:  # le rapport dit toujours ce qui a pu être établi, et pourquoi le reste manque
        rapport["interruption"] = "execution_error"
        rapport["erreur"] = f"{erreur.__class__.__name__} : {erreur}"[:300]
        journal(f"Exécution non concluante : {erreur.__class__.__name__}", "erreur")
    finally:
        if lectures:
            lectures.close()
            rapport["evidence"] += lectures.preuves
        if not rapport["results"] and plan:
            rapport["results"] = [_resultat(c["id"], c["type"], c["description"], c["valeur"], "skipped",
                                            rapport["interruption"] or "not_started", "La mission s'est arrêtée avant ce contrôle.")
                                  for c in plan["criteres"]]
        rapport["finished_at"] = maintenant()
        rapport["duration_s"] = round(time.monotonic() - debut, 2)
        couts = [s.get("cout_dollars") for s in rapport["sessions"]]
        rapport["cost_h"] = round(sum(couts), 4) if couts and all(c is not None for c in couts) else None
        rapport["summary"] = {s: sum(r["status"] == s for r in rapport["results"]) for s in STATUTS}
        # Le bilan lu en premier : les critères et les constats, sans les contrôles automatiques des pages visitées.
        rapport["summary_criteres"] = {s: sum(r["status"] == s for r in rapport["results"] if r["type"] != "auto") for s in STATUTS}
        bilan = rapport["summary_criteres"]
        journal(f"4/4 Rapport · {bilan['passed']} conforme(s), {bilan['failed']} écart(s), {bilan['inconclusive']} non concluant(s)",
                "etape", summary=bilan)
    return rapport


# ── Le rapport local du CLI ─────────────────────────────────────────────────────────────────────────────────

LIBELLES = {"passed": "Conforme", "failed": "Écart constaté", "inconclusive": "Non concluant", "skipped": "Non exécuté"}


def rapport_html(rapport):
    e = lambda x: html.escape(str(x if x is not None else "non mesuré"))
    lignes = "".join(f"<tr><td>{e(r['id'])}</td><td>{e(r['description'])}</td><td><b>{e(LIBELLES[r['status']])}</b>"
                     f"<br><small>{e(r['verification'] or '')}</small></td><td>{e(r['observe'])}</td></tr>" for r in rapport["results"])
    gestes = "".join(f"<li>{e(g['geste'])}</li>" for g in rapport["parcours"])
    s = rapport["sessions"][0] if rapport["sessions"] else {}
    return (f"<!doctype html><html lang='fr'><meta charset='utf-8'><title>HSentinel · QA</title><style>body{{font:16px system-ui;"
            f"max-width:980px;margin:40px auto;padding:0 20px}}td{{border-top:1px solid #ddd;padding:8px;vertical-align:top}}</style>"
            f"<h1>{e(rapport['titre'])}</h1><p>{e(rapport['request']['instruction'] or 'Exploration sans consigne')}</p>"
            f"<p>Durée {e(rapport['duration_s'])} s · H {e(rapport['cost_h'])} $ · {e(s.get('steps'))} steps · session {e(s.get('session'))}</p>"
            f"<table>{lignes}</table><h2>Gestes de l'agent</h2><ol>{gestes}</ol></html>")


def reverifier(rapport, client, transport=None):
    """Rejouer la vérification d'une mission passée avec le moteur actuel : mêmes événements H, aucun agent relancé."""
    mission, cible = valider_mission(rapport["request"])
    session = rapport["sessions"][0]["session"]
    evenements, page = [], 1
    while True:
        items = client.sessions.list_session_events(session, page=page, size=100).model_dump(mode="json").get("items", [])
        if not items:
            break
        evenements, page = evenements + items, page + 1
    final = client.sessions.get_session(session)
    brut = final.latest_answer if isinstance(final.latest_answer, dict) else json.loads(final.latest_answer or "null")
    reponse = ReponseQA.model_validate(brut).model_dump() if brut else None
    observations, gestes, _ = lire_trajectoire(evenements)
    lectures = Lectures(cible, Controle(60), transport)
    try:
        return verifier(mission, cible, reponse, observations, gestes, lectures)[0]
    finally:
        lectures.close()


def ecrire_rapport(rapport):
    dossier = ICI.parent / "rapports"
    dossier.mkdir(exist_ok=True)
    nom = datetime.now().strftime("qa-%Y%m%d-%H%M%S")
    (dossier / f"{nom}.json").write_text(json.dumps(rapport, ensure_ascii=False, indent=2))
    (dossier / f"{nom}.html").write_text(rapport_html(rapport))
    return dossier / f"{nom}.json"


def main():
    parser = argparse.ArgumentParser(description="Lancer une mission QA HSentinel depuis le terminal.")
    parser.add_argument("--cible", default="eugenia-public")
    parser.add_argument("--consigne", default="", help="Le parcours à vérifier ; vide = exploration bornée")
    parser.add_argument("--exploration", action="store_true")
    parser.add_argument("--mobile", action="store_true")
    parser.add_argument("--modele-h", default=MODELE, choices=MODELES_H)
    parser.add_argument("--plan", help="Un plan JSON déjà relu, au lieu de la préparation par Hugging Face")
    parser.add_argument("--preparer-seulement", action="store_true", help="Afficher le plan préparé, sans lancer H")
    parser.add_argument("--reverifier", metavar="RAPPORT_JSON", help="Rejouer la vérification d'un rapport avec le moteur actuel")
    parser.add_argument("--email", help="Site connecté : l'adresse du compte de test (le mot de passe est lu sur l'entrée standard)")
    parser.add_argument("--identite", action="append", default=[], help="Site connecté : un nom attendu à l'écran après la connexion")
    parser.add_argument("--repetitions", type=int, default=1, choices=range(1, 11), metavar="1-10",
                        help="Rejouer la même mission, avec le même plan et le même coffre")
    args = parser.parse_args()
    if args.reverifier:
        from hai_agents import Client
        ancien = json.loads(Path(args.reverifier).read_text())
        avant = {r["id"]: r["status"] for r in ancien["results"]}
        for r in reverifier(ancien, Client(timeout=30, max_retries=1)):
            marque = "" if avant.get(r["id"]) == r["status"] else f"   (avant : {avant.get(r['id'])})"
            print(f"{r['id']:5s} {r['status']:12s} {r['reason_code']:22s} {r['observe'][:150]}{marque}")
        return
    from base import lire_cles
    from hai_agents import Client
    cible = trouver_cible(args.cible)
    pilotage = "exploration" if args.exploration or not args.consigne.strip() else "guide"
    plan = None
    if pilotage == "guide":
        if args.plan:
            plan = json.loads(Path(args.plan).read_text())
        else:
            lectures = Lectures(cible, Controle(60))
            try:
                plan = preparer_plan(args.consigne, cible, lire_cles()["HF_TOKEN"], lectures)
            finally:
                lectures.close()
        print(json.dumps(plan, ensure_ascii=False, indent=2), flush=True)
        if args.preparer_seulement:
            return
    demande = {"schema_version": VERSION, "mode": "qa", "target_id": cible["id"], "pilotage": pilotage,
               "appareil": "mobile" if args.mobile else "ordinateur", "instruction": args.consigne, "source": "texte",
               "modele_h": args.modele_h, "plan": plan}

    def journal(message, type="info", **donnees):
        extra = f" · {donnees['replay']}" if donnees.get("replay") else ""
        print(f"[{time.strftime('%H:%M:%S')}] {type:8s} {message}{extra}", flush=True)

    client = Client(timeout=30, max_retries=1)
    coffre = None
    if cible.get("connexion"):
        if not args.email:
            parser.error("Ce site se teste connecté : --email est obligatoire.")
        # Le mot de passe va droit au coffre H : jamais en argument (visible dans ps), jamais dans un fichier ni un journal.
        mot_de_passe = getpass.getpass("Mot de passe du compte de test : ") if sys.stdin.isatty() else sys.stdin.readline().rstrip("\r\n")
        if not mot_de_passe:
            parser.error("Aucun mot de passe reçu.")
        valider_mission({**demande, "coffre": "00000000-0000-0000-0000-000000000000", "identite": args.identite})  # avant de créer le coffre
        coffre = preparer_coffre(client, cible, args.email, mot_de_passe)
        demande.update(coffre=coffre, identite=args.identite)
        print(f"Coffre de l'essai créé : {coffre}", flush=True)
    try:
        for n in range(1, args.repetitions + 1):
            if args.repetitions > 1:
                print(f"── Répétition {n}/{args.repetitions}", flush=True)
            rapport = executer_qa(demande, client, journal)
            if coffre:
                rapport["coffre"] = {"id": coffre, "etat": "créé pour cet essai, supprimé à la fin"}
            print(f"Rapport : {ecrire_rapport(rapport)}", flush=True)
    finally:
        if coffre:
            try:
                supprimer_coffre(client, coffre)
                print(f"Coffre de l'essai supprimé : {coffre}", flush=True)
            except Exception as erreur:
                print(f"Suppression du coffre {coffre} non confirmée ({erreur.__class__.__name__}) : à supprimer à la main.", flush=True)


if __name__ == "__main__":
    main()
