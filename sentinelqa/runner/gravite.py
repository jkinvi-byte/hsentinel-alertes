"""La gravité d'une faille prouvée : une règle écrite, déterministe et rejouable. Aucun LLM n'intervient.

1. Les données exposées sont détectées par des motifs fixes, dans la page réellement reçue par le compte qui attaque
   (rejeu HTTP) ; pour l'écriture, dans la page de la victime où la modification apparaît. Même page, mêmes données.
2. Le niveau se calcule à partir de trois critères, chacun écrit en toutes lettres dans les raisons :
   - la portée : une autre entreprise (lecture, écriture) ou un salarié de la même entreprise (admin) ;
   - la nature : lire, modifier, ou entrer dans une partie réservée ;
   - les données : financières personnelles (salaires, coordonnées bancaires), personnelles, droits d'accès.

   Base : lecture ou écriture par une autre entreprise = élevée ; salarié dans une partie réservée = moyenne.
   +1 si des données financières personnelles sont exposées ou modifiables.
   +1 si un salarié peut toucher aux droits d'accès.
   -1 si aucune donnée personnelle ni aucun droit d'accès n'est détecté.
   Le niveau reste entre faible et critique.
"""

import re

REGLE = "v1"
NIVEAUX = {1: "faible", 2: "moyenne", 3: "élevée", 4: "critique"}

# Les catégories de données, dans l'ordre d'affichage, avec leurs motifs (français et JSON)
CATEGORIES = {
    "salaires": re.compile(r"salaire|net à payer|net imposable|rémunération|fiche de paie|bulletin de (?:paie|salaire)|cotisations?|\"brut\"|\"net\"", re.I),
    "coordonnées bancaires": re.compile(r"\bIBAN\b|\bBIC\b|\bRIB\b|\bFR\d{2}[ ]?\d{4}|coordonnées bancaires|carte bancaire", re.I),
    # Un nom suivi de « : », une clé JSON, ou l'en-tête d'un tableau de personnes (« Nom Poste », « Nom E-mail »...)
    "identité": re.compile(r"\b(?:nom|noms|prénom|salariée?)\s*:|\"(?:nom|prenom|prénom)\"\s*:|\bnoms?\s+(?:prénom|poste|e-mail|fonction|service|accès)\b"
                           r"|date de naissance|sécurité sociale|\bNIR\b|matricule", re.I),
    "coordonnées": re.compile(r"[\w.+-]+@[\w-]+\.[\w.]{2,}|(?:\+33|\b0)[1-9](?:[ .-]?\d{2}){4}\b|adresse\s*:", re.I),
    "droits d'accès": re.compile(r"\b(?:rôles?|droits? d'accès|permissions?|réservé aux administrateurs|administration)\b", re.I),
    "données d'entreprise": re.compile(r"entreprise\s*:|\"entreprise\"\s*:|facture|devis|contrat|SIRET|SIREN|chiffre d'affaires", re.I),
}
FINANCIERES = {"salaires", "coordonnées bancaires"}
PERSONNELLES = {"salaires", "coordonnées bancaires", "identité", "coordonnées"}

PORTEE = {
    "lecture": "une autre entreprise peut lire ces données",
    "ecriture": "une autre entreprise peut modifier ces données",
    "admin": "un salarié sans droits entre dans une partie réservée",
}
BASE = {"lecture": 3, "ecriture": 3, "admin": 2}


def detecter(texte):
    """Les catégories de données présentes dans un texte, par motifs fixes."""
    return [nom for nom, motif in CATEGORIES.items() if texte and motif.search(texte)]


def classer(theme, donnees):
    """Le niveau et ses raisons, pour une faille prouvée de ce thème qui expose ces catégories de données."""
    donnees = set(donnees or ())
    points, raisons = BASE[theme], [PORTEE[theme]]
    financieres = [d for d in CATEGORIES if d in donnees and d in FINANCIERES]
    if financieres:
        points += 1
        raisons.append(f"données financières personnelles : {', '.join(financieres)}")
    if theme == "admin" and "droits d'accès" in donnees:
        points += 1
        raisons.append("accès à la gestion des droits")
    if not donnees & PERSONNELLES and "droits d'accès" not in donnees:
        points -= 1
        raisons.append("aucune donnée personnelle détectée")
    elif not financieres and donnees & PERSONNELLES:
        raisons.append(f"données personnelles : {', '.join(d for d in CATEGORIES if d in donnees & PERSONNELLES)}")
    niveau = NIVEAUX[max(1, min(4, points))]
    return {"niveau": niveau, "raisons": raisons, "donnees": [d for d in CATEGORIES if d in donnees], "regle": REGLE}


if __name__ == "__main__":
    # Le banc de la règle : chaque cas a son niveau attendu (python3 gravite.py)
    cas = [
        ("lecture", "Fiche de paie n° 1041 — Entreprise : Alpha Conseil. Nom : Léa Fontaine. Salaire brut : 4 850,00 €.", "critique"),
        ("lecture", '{"id":"1041","entreprise":"Alpha Conseil","salarie":{"nom":"Léa Fontaine"},"brut":4850,"net":3790}', "critique"),
        ("lecture", "Entreprise : Alpha Conseil. Noms : Léa Fontaine (Consultante senior), Karim Haddad (Chef de projet).", "élevée"),
        ("lecture", "Entreprise : Alpha Conseil. Facture n° 12, 1 200 € HT.", "moyenne"),
        ("lecture", "Salariés Alpha Conseil Nom Poste Léa Fontaine Consultante senior Karim Haddad Chef de projet", "élevée"),
        ("ecriture", "Fiche de paie n° 1042 — Alpha Conseil. Salaire brut : 5 320,00 €. Commentaire RH : SentinelQA-ab12cd", "critique"),
        ("admin", "Administration — Alpha Conseil · réservé aux administrateurs. Rôles des utilisateurs.", "élevée"),
        ("admin", "Fiche de paie n° 1042. Nom : Karim Haddad. Salaire brut : 5 320,00 €.", "élevée"),
        ("admin", "Tableau de bord", "faible"),
    ]
    echecs = 0
    for theme, texte, attendu in cas:
        g = classer(theme, detecter(texte))
        ok = g["niveau"] == attendu
        echecs += not ok
        print(f"{'ok ' if ok else 'ÉCHEC'} {theme:8} {g['niveau']:8} (attendu {attendu:8}) · {' ; '.join(g['raisons'])}")
    print(f"{len(cas) - echecs}/{len(cas)} cas conformes")
    raise SystemExit(1 if echecs else 0)
