"""Hugging Face : un LLM lit la cartographie et propose les attaques à tenter. Il ne décide JAMAIS du verdict :
rejeu et agent restent les seuls juges. À la fin, on recoupe ses propositions avec les failles réellement prouvées :
précision (propositions justes) et rappel (failles vues venir).

La gravité n'est plus classée par le LLM depuis le 17/11 : elle varie d'un audit à l'autre pour la même faille
(mesuré sur 5 audits). Elle suit désormais une règle écrite et déterministe : voir gravite.py.

Chaque appel mesure sa latence et ses tokens, pour comparer les modèles. Sans jeton ou si le service ne répond pas,
le résultat vaut None (non mesuré) et l'audit continue.
"""

import json
import re
import time

import httpx

from base import lire_cles

ROUTEUR = "https://router.huggingface.co/v1/chat/completions"
MODELE = "Qwen/Qwen2.5-72B-Instruct"

CONSIGNE_HYPOTHESES = (
    "Tu es un pentester applicatif. Tu reçois la cartographie d'une application web partagée par plusieurs entreprises : "
    "les pages vues par un administrateur A, celles vues par un salarié C de la même entreprise, et les formulaires "
    "d'enregistrement trouvés dans les pages de A. Propose les attaques à tenter, uniquement parmi ces pages et ces formulaires, "
    "sans en inventer : (1) « ecritures » : les formulaires qu'un compte d'une autre entreprise pourrait soumettre pour modifier "
    "les données de A ; (2) « pages_admin » : les pages réservées aux administrateurs qu'un salarié pourrait ouvrir ; "
    "(3) « lectures » : les pages dont l'identifiant pourrait laisser une autre entreprise lire les données de A. "
    'Réponds uniquement en JSON : {"ecritures": [{"chemin": "...", "raison": "..."}], "pages_admin": [{"chemin": "...", '
    '"raison": "..."}], "lectures": [{"chemin": "...", "raison": "..."}]}. Chaque raison tient en une phrase, en français.'
)

def _appeler(modele, consigne, donnees):
    jeton = lire_cles().get("HF_TOKEN")
    if not jeton:
        return None
    debut = time.monotonic()
    reponse = httpx.post(ROUTEUR, timeout=90, headers={"Authorization": f"Bearer {jeton}"}, json={
        "model": modele, "temperature": 0, "max_tokens": 1200,
        "messages": [{"role": "system", "content": consigne}, {"role": "user", "content": json.dumps(donnees, ensure_ascii=False)}],
    })
    reponse.raise_for_status()
    corps = reponse.json()
    texte = corps["choices"][0]["message"]["content"] or ""
    bloc = re.search(r"\{.*\}", texte, re.S)
    return {"modele": modele, "latence_s": round(time.monotonic() - debut, 2), "usage": corps.get("usage"),
            "reponse": json.loads(bloc.group(0)) if bloc else None}


def hypotheses(pages_a, pages_c, formulaires, modele=MODELE):
    """Les attaques proposées par le LLM, avant les rejeux. None si le service n'a pas répondu."""
    try:
        appel = _appeler(modele, CONSIGNE_HYPOTHESES, {"pages_administrateur_A": pages_a, "pages_salarie_C": pages_c,
                                                        "formulaires": [f["action"] for f in formulaires]})
    except (httpx.HTTPError, ValueError) as erreur:
        return {"modele": modele, "erreur": erreur.__class__.__name__}
    if not appel or not isinstance(appel["reponse"], dict):
        return None if not appel else {**appel, "erreur": "réponse sans JSON"}
    propositions = {cle: [p for p in appel["reponse"].get(cle, []) if isinstance(p, dict) and isinstance(p.get("chemin"), str)]
                    for cle in ("ecritures", "pages_admin", "lectures")}
    return {**{k: v for k, v in appel.items() if k != "reponse"}, "propositions": propositions}


def recouper(hyp, preuves):
    """Précision et rappel des propositions du LLM, face aux failles réellement prouvées, thème par thème."""
    if not hyp or "propositions" not in hyp:
        return None
    correspondance = {"ecritures": "ecriture", "pages_admin": "admin", "lectures": "lecture"}
    resultat = {}
    for cle, theme in correspondance.items():
        proposees = {p["chemin"] for p in hyp["propositions"][cle]}
        prouvees = {p["chemin"] for p in preuves if p["prouvee"] and p["theme"] == theme}
        communes = proposees & prouvees
        resultat[theme] = {"proposees": len(proposees), "prouvees": len(prouvees), "communes": len(communes),
                           "precision": round(len(communes) / len(proposees), 2) if proposees else None,
                           "rappel": round(len(communes) / len(prouvees), 2) if prouvees else None}
    return resultat
