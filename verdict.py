"""Le verdict déterministe (le « rejeu » qui décide), SANS IA.
Architecture D-05 : le code décide, les agents montrent.

Entrée : la ressource privée telle que vue par son propriétaire (A), et telle que vue par l'intrus (B).
Sortie : fuite / refus_attendu / partage_sain / non_concluant, avec la similarité mesurée.

Note d'architecture : sur le cobaye, le re-test se fait en rejeu HTTP pur (httpx, session de B).
Sur une app tierce à auth maison, le contenu de B est rapporté par l'agent authentifié,
mais la DÉCISION reste ici, par règle écrite, et la similarité se mesure sur le texte reçu.
"""
from difflib import SequenceMatcher
import unicodedata

SEUIL = 0.95


def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return " ".join("".join(c if c.isalnum() else " " for c in s).split())


def similarite(a, b):
    return SequenceMatcher(None, _norm(a), _norm(b)).ratio()


def est_partagee(url, rubriques_partagees):
    u = (url or "").lower()
    return any(r.lower() in u for r in rubriques_partagees)


def juger(url, texte_proprietaire, vue_intrus, rubriques_partagees):
    """vue_intrus : dict {acces_refuse: bool, texte_visible: str}.
    Renvoie dict {verdict, similarite, raison}.
    """
    # 1. Ressource déclarée partagée au cadrage -> jamais une fuite.
    if est_partagee(url, rubriques_partagees):
        return {"verdict": "partage_sain", "similarite": None,
                "raison": "ressource d'une rubrique déclarée partagée au cadrage"}

    # 2. L'intrus est refusé -> cloisonnement OK.
    if vue_intrus.get("acces_refuse"):
        return {"verdict": "refus_attendu", "similarite": None,
                "raison": "accès refusé ou renvoi vers la connexion"}

    # 3. On compare ce que voit l'intrus à ce que voit le propriétaire.
    sim = similarite(texte_proprietaire, vue_intrus.get("texte_visible", ""))
    if sim >= SEUIL:
        return {"verdict": "fuite", "similarite": round(sim, 3),
                "raison": f"l'intrus reçoit la même ressource privée (similarité {sim:.2f} ≥ {SEUIL})"}
    if sim >= 0.60:
        return {"verdict": "non_concluant", "similarite": round(sim, 3),
                "raison": f"contenu partiellement semblable (similarité {sim:.2f}), à vérifier"}
    return {"verdict": "pas_de_fuite", "similarite": round(sim, 3),
            "raison": f"l'intrus ne reçoit pas la ressource du propriétaire (similarité {sim:.2f})"}
