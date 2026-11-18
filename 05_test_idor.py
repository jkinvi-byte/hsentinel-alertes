"""Démo approfondie : test d'une fuite au niveau OBJET (IDOR multi-tenant), en lecture seule.

Déroulé, fidèle à l'architecture (volet QA, boîte noire) :
  1. L'Explorateur, connecté en A, ouvre quelques objets en détail (ex : une candidature) et
     capture leur ADRESSE EXACTE + identifiant, et une signature (entreprise / nom affiché).
  2. Pour chaque objet qui a une adresse propre, le Vérificateur, connecté en B, ouvre cette
     même adresse et rapporte ce qu'il voit.
  3. NOTRE CODE décide (pas l'agent) : si la signature de l'objet de A réapparaît chez B,
     c'est une fuite. Sinon, cloisonnement OK. (Stand-in du rejeu HTTP tant qu'il n'est pas branché.)

Usage : python 05_test_idor.py cadence A B [--max-objets 3]
Lecture seule : le périmètre interdit de cibles.json bloque toute écriture.
"""
import argparse, datetime as dt, json, unicodedata
from typing import Optional

from hai_agents import Client
from pydantic import BaseModel

from config import PREFIXE, RESULTATS, bornes, cibles, coffres, mesurer, overrides


class ObjetA(BaseModel):
    url: str                      # l'adresse exacte dans la barre d'adresse
    identifiant: Optional[str] = None
    url_a_change: bool            # True si ouvrir l'objet change l'URL (donc un objet adressable)
    signature: str                # entreprise ou nom affiché, qui identifie l'objet
    details: str


class CaptureA(BaseModel):
    les_objets_sont_adressables: bool   # False = ils s'ouvrent dans un panneau sans changer d'URL
    remarque: str
    objets: list[ObjetA]


class VueB(BaseModel):
    url_ouverte: str
    acces_refuse: bool            # True si refus / redirection vers la connexion
    texte_visible: str
    noms_ou_entreprises_vus: list[str]


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return "".join(ch for ch in s if ch.isalnum() or ch == " ")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("cible"); p.add_argument("compte_a"); p.add_argument("compte_b")
    p.add_argument("--max-objets", type=int, default=3)
    a = p.parse_args()

    c = cibles()[a.cible]
    co = coffres().get(a.cible, {})
    client = Client()
    interdit = ", ".join(c["perimetre_interdit"])

    # --- 1. CAPTURE, connecté en A ---
    ca = c["comptes"][a.compte_a]
    consigne_a = (
        f"Application : {c['nom']} ({c['url']}). Connecte-toi d'abord avec le compte {ca['email']} "
        f"par le formulaire (remplissage sécurisé), et vérifie que tu es bien connecté. "
        f"Puis ouvre la rubrique qui liste des objets personnels (candidatures, documents...). "
        f"Clique sur {a.max_objets} éléments l'un après l'autre pour les ouvrir EN DÉTAIL, "
        f"en lecture seulement. Pour chacun, relève : l'adresse exacte dans la barre d'adresse, "
        f"si cette adresse a changé en ouvrant l'objet (sinon il s'ouvre dans un panneau), "
        f"son identifiant si visible, et une signature qui l'identifie (nom d'entreprise ou de personne). "
        f"Ne clique sur AUCUN bouton d'action (étoile, modifier, envoyer). Périmètre interdit : {interdit}.")
    print(f"① Capture des objets, connecté en {a.compte_a} ({ca['email']})…")
    debut = dt.datetime.now()
    res = client.run_session(agent=f"{PREFIXE}-explorateur", messages=consigne_a, answer_schema=CaptureA,
                             overrides=overrides(c["page_connexion"], co.get(a.compte_a)),
                             **bornes(client, 45, 300))
    mesurer(res.id, debut, a.cible, f"{PREFIXE}-explorateur", a.compte_a, res.status, note="capture objets")
    if res.answer is None:
        print("Pas de réponse structurée. Statut:", res.status); return
    capture = res.answer.model_dump() if hasattr(res.answer, "model_dump") else res.answer
    (RESULTATS / f"objets_{a.cible}_{a.compte_a}_{debut:%H%M%S}.json").write_text(
        json.dumps(capture, indent=2, ensure_ascii=False), encoding="utf-8")

    adressables = [o for o in capture["objets"] if o.get("url_a_change") and o.get("url")]
    print(f"\nObjets adressables par leur URL : {len(adressables)} / {len(capture['objets'])}")
    print(f"Remarque de l'agent : {capture['remarque']}")
    if not adressables:
        print("\n⇒ Les objets ne sont pas adressables par une URL propre (panneaux / modales).\n"
              "   Pas d'IDOR par l'URL à ce niveau : le test IDOR passera par l'API, via le rejeu HTTP (Aurian).")
        return

    # --- 2. RETENTE, connecté en B, sur les adresses exactes de A ---
    cb = c["comptes"][a.compte_b]
    rapport = []
    for o in adressables[: a.max_objets]:
        consigne_b = (
            f"Application : {c['nom']}. Connecte-toi d'abord avec le compte {cb['email']} par le formulaire "
            f"(remplissage sécurisé) et vérifie que tu es bien connecté en tant que {cb['email']}. "
            f"PUIS ouvre exactement cette adresse en la tapant dans la barre d'adresse : {o['url']} . "
            f"Ne clique sur rien d'autre. Dis si l'accès est refusé (ou renvoyé vers la connexion), "
            f"ce que la page affiche, et la liste des noms ou entreprises visibles. Périmètre interdit : {interdit}.")
        print(f"\n② {a.compte_b} tente {o['url']} (objet de {a.compte_a} : « {o['signature']} »)…")
        d2 = dt.datetime.now()
        rb = client.run_session(agent=f"{PREFIXE}-verificateur", messages=consigne_b, answer_schema=VueB,
                                overrides=overrides(c["page_connexion"], co.get(a.compte_b)),
                                **bornes(client, 15, 300))
        mesurer(rb.id, d2, a.cible, f"{PREFIXE}-verificateur", a.compte_b, rb.status, note=o["url"])
        vue = rb.answer.model_dump() if rb.answer is not None and hasattr(rb.answer, "model_dump") else {}

        # NOTRE CODE décide : la signature de l'objet de A réapparaît-elle chez B ?
        sig = _norm(o.get("signature", ""))
        corpus = _norm(" ".join(vue.get("noms_ou_entreprises_vus", [])) + " " + vue.get("texte_visible", ""))
        fuite = bool(sig) and not vue.get("acces_refuse", False) and sig in corpus
        verdict = "FUITE" if fuite else ("refus/redirection" if vue.get("acces_refuse") else "pas la donnée de A")
        print(f"   → {verdict}")
        rapport.append({"objet_de_A": o, "vue_de_B": vue, "verdict": verdict, "session_B": rb.id})

    f = RESULTATS / f"idor_{a.cible}_{a.compte_a}_vs_{a.compte_b}_{dt.datetime.now():%H%M%S}.json"
    f.write_text(json.dumps(rapport, indent=2, ensure_ascii=False), encoding="utf-8")
    fuites = [r for r in rapport if r["verdict"] == "FUITE"]
    print(f"\n===== VERDICT : {len(fuites)} fuite(s) sur {len(rapport)} objet(s) testé(s) → {f.name} =====")
    if fuites:
        print("⚠️  Suspicion de fuite. À confirmer par le rejeu HTTP déterministe (règle D-05) avant de l'affirmer.")


if __name__ == "__main__":
    main()
