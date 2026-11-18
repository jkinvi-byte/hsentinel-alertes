"""HSentinel — audit complet de bout en bout, volet QA (architecture §2).
Un seul lanceur qui enchaîne les six étapes :
  1. Cartographie des objets PRIVÉS du propriétaire (Explorateur H).
  2. Re-test par l'intrus (Vérificateur H, authentifié).
  3. Verdict déterministe : notre code décide (similarité ≥ 0,95, règle de propriété).
  4. Gravité par règle écrite (gravite.py, sans IA).
  5. Explication en clair (Hugging Face, marquée « rédigé par IA »).
  6. Relevé : rapport JSON + lisible + mesures.

Usage : python auditer.py cadence --proprietaire A --intrus B [--max-objets 3]
Lecture seule : aucune écriture (périmètre interdit de cibles.json).
"""
import argparse, datetime as dt, json
from typing import Optional

from hai_agents import Client
from pydantic import BaseModel

import gravite
import verdict as V
from config import PREFIXE, RESULTATS, bornes, cibles, coffres, mesurer, overrides
from explication_hf import expliquer


class ObjetPrive(BaseModel):
    url: str
    identifiant: Optional[str] = None
    signature: str                 # ce qui identifie l'objet (nom, intitulé)
    texte: str                     # le contenu visible, qui sert de référence au verdict


class CartoPrivee(BaseModel):
    objets_adressables: bool
    remarque: str
    objets: list[ObjetPrive]


class VueIntrus(BaseModel):
    acces_refuse: bool
    texte_visible: str


def _carto_proprietaire(client, c, co, lettre, rubriques, max_objets, interdit):
    compte = c["comptes"][lettre]
    consigne = (
        f"Application : {c['nom']} ({c['url']}). Connecte-toi avec {compte['email']} (remplissage sécurisé) "
        f"et vérifie que tu es bien connecté. Va dans une rubrique de données PERSONNELLES parmi : "
        f"{', '.join(rubriques)}.\n"
        f"Ton but : obtenir l'ADRESSE PROPRE (avec identifiant) de {max_objets} de TES objets. Procédure pour CHAQUE objet :\n"
        f"1) clique sur la ligne de l'objet. 2) Regarde la barre d'adresse : si l'URL a changé et contient un "
        f"identifiant après le nom de la rubrique, c'est bon. 3) SINON (un panneau latéral s'est ouvert sans changer "
        f"l'URL), cherche dans ce panneau le titre cliquable ou un lien « ouvrir / voir le détail » qui mène à la page "
        f"complète de l'objet, et clique-le ; l'URL doit alors contenir un identifiant. 4) Ne conclus PAS qu'il n'y a "
        f"pas d'URL tant que tu n'as pas essayé le lien de détail du panneau.\n"
        f"Pour chaque objet, relève : l'URL exacte (barre d'adresse), objets_adressables=true si l'URL contient un "
        f"identifiant, cet identifiant, une signature (intitulé/nom) et le texte visible. Lecture seule, aucun bouton "
        f"d'action. Périmètre interdit : {interdit}.")
    debut = dt.datetime.now()
    res = client.run_session(agent=f"{PREFIXE}-explorateur", messages=consigne, answer_schema=CartoPrivee,
                             overrides=overrides(c["page_connexion"], co.get(lettre)),
                             **bornes(client, 45, 300))
    mesurer(res.id, debut, c["nom"], f"{PREFIXE}-explorateur", lettre, res.status, note="carto privée")
    ans = res.answer.model_dump() if res.answer is not None and hasattr(res.answer, "model_dump") else None
    return ans, res.id


def _vue_intrus(client, c, co, lettre, url, interdit):
    compte = c["comptes"][lettre]
    consigne = (
        f"Application : {c['nom']}. Connecte-toi avec {compte['email']} (remplissage sécurisé) et vérifie que "
        f"tu es bien connecté en tant que {compte['email']}. PUIS ouvre exactement cette adresse : {url} . "
        f"Ne clique sur rien d'autre. Dis si l'accès est refusé ou renvoyé vers la connexion (acces_refuse), "
        f"et rapporte fidèlement le texte visible. Périmètre interdit : {interdit}.")
    debut = dt.datetime.now()
    res = client.run_session(agent=f"{PREFIXE}-verificateur", messages=consigne, answer_schema=VueIntrus,
                             overrides=overrides(c["page_connexion"], co.get(lettre)),
                             **bornes(client, 15, 300))
    mesurer(res.id, debut, c["nom"], f"{PREFIXE}-verificateur", lettre, res.status, note=url)
    ans = res.answer.model_dump() if res.answer is not None and hasattr(res.answer, "model_dump") else {"acces_refuse": True, "texte_visible": ""}
    return ans, res.id


def main():
    p = argparse.ArgumentParser()
    p.add_argument("cible")
    p.add_argument("--proprietaire", default="A")
    p.add_argument("--intrus", default="B")
    p.add_argument("--max-objets", type=int, default=3)
    a = p.parse_args()

    c = cibles()[a.cible]
    co = coffres().get(a.cible, {})
    partagees = c.get("rubriques_partagees", [])
    privees = c.get("rubriques_privees", [])
    interdit = ", ".join(c["perimetre_interdit"])
    client = Client()
    t0 = dt.datetime.now()
    print(f"=== Audit {c['nom']} · propriétaire {a.proprietaire} / intrus {a.intrus} ===\n")

    # 1. Cartographie des objets privés du propriétaire
    print(f"① Cartographie des objets privés ({a.proprietaire})…")
    carto, sid_carto = _carto_proprietaire(client, c, co, a.proprietaire, privees, a.max_objets, interdit)
    if not carto or not carto.get("objets"):
        print("Aucun objet relevé. Statut de cartographie à revoir."); return
    objets = [o for o in carto["objets"] if o.get("url") and not V.est_partagee(o["url"], partagees)][: a.max_objets]
    print(f"   {len(objets)} objet(s) privé(s) adressable(s). Remarque : {carto.get('remarque','')}")
    if not carto.get("objets_adressables") or not objets:
        print("\n⇒ Les objets privés ne sont pas adressables par une URL propre (panneaux/API).")
        print("   Pas d'IDOR par l'URL ici : le test passera par l'API (rejeu httpx) côté orchestrateur.")
        return

    # 2+3+4+5. Pour chaque objet : re-test intrus, verdict, gravité, explication
    constats = []
    for o in objets:
        print(f"\n② {a.intrus} tente {o['url']}  (objet privé : « {o['signature']} »)…")
        vue, sid_v = _vue_intrus(client, c, co, a.intrus, o["url"], interdit)
        verd = V.juger(o["url"], o.get("texte", ""), vue, partagees)
        ligne = {"url": o["url"], "signature": o["signature"], "objet_de": a.proprietaire,
                 "verdict": verd["verdict"], "similarite": verd["similarite"], "raison": verd["raison"],
                 "session_verif": sid_v, "replay": f"https://platform.hcompany.ai/agents/sessions/{sid_v}"}
        print(f"   → {verd['verdict']}  ({verd['raison']})")
        if verd["verdict"] == "fuite":
            niveau, raisons = gravite.evaluer("autre_entreprise", "lecture", vue.get("texte_visible", ""))
            faits = {"intrus": a.intrus, "proprietaire": a.proprietaire, "verdict": "fuite",
                     "similarite": verd["similarite"], "gravite": niveau,
                     "ce_qui_est_visible": vue.get("texte_visible", "")[:400]}
            exp = expliquer(faits)
            ligne.update({"gravite": niveau, "raisons_gravite": raisons,
                          "explication": exp["texte"], "explication_par_ia": exp["par_ia"], "modele_hf": exp["modele"]})
            print(f"      gravité : {niveau} ({', '.join(raisons)})")
            print(f"      explication ({'IA '+exp['modele'] if exp['par_ia'] else exp['modele']}) : {exp['texte'][:200]}")
        constats.append(ligne)

    # 6. Relevé
    fuites = [x for x in constats if x["verdict"] == "fuite"]
    rapport = {"cible": c["nom"], "proprietaire": a.proprietaire, "intrus": a.intrus,
               "date": t0.isoformat(timespec="seconds"),
               "resume": {"objets_testes": len(constats), "fuites": len(fuites),
                          "refus_attendus": sum(x["verdict"] == "refus_attendu" for x in constats),
                          "sans_fuite": sum(x["verdict"] in ("pas_de_fuite", "partage_sain") for x in constats),
                          "non_concluants": sum(x["verdict"] == "non_concluant" for x in constats)},
               "constats": constats}
    f = RESULTATS / f"audit_{a.cible}_{a.proprietaire}_vs_{a.intrus}_{t0:%H%M%S}.json"
    f.write_text(json.dumps(rapport, indent=2, ensure_ascii=False), encoding="utf-8")
    print("\n" + "=" * 60)
    print(f"RELEVÉ : {rapport['resume']}")
    print(f"→ {f.name}  ·  durée totale {round((dt.datetime.now()-t0).total_seconds())} s")
    if fuites:
        print("⚠️  Suspicion(s) de fuite. Le verdict est fait par règle écrite sur le contenu reçu ;")
        print("    sur le cobaye, il est doublé par le rejeu HTTP pur (D-05).")


if __name__ == "__main__":
    main()
