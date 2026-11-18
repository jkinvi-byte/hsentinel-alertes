"""La gravité, par règle écrite, SANS IA (architecture 07 §3.3, décision D-11).
La même page reçoit toujours la même gravité, avec des raisons défendables.
Le niveau dépend de : qui accède, lecture ou écriture, et la nature des données détectées
dans le contenu réellement reçu.
"""
import re

NIVEAUX = ["faible", "moyenne", "élevée", "critique"]

# Catégories de données, détectées par motifs fixes dans le texte reçu.
MOTIFS = {
    "coordonnees_bancaires": r"\b(iban|rib|bic|[A-Z]{2}\d{2}[\sA-Z0-9]{11,30})\b",
    "salaire": r"\b(salaire|rémunération|net à payer|brut mensuel|\d[\d\s.,]*€\s*(brut|net))",
    "identite_contact": r"\b([\w.+-]+@[\w-]+\.[\w.-]+|0[1-9](\s?\d{2}){4})\b",
    "carriere_perso": r"\b(cv|curriculum|lettre de motivation|candidature|entretien|poste visé)\b",
    "droits_acces": r"(administrat(eur|ion)|rôles?|droits|réservé aux|gestion des (rôles|utilisateurs)|permissions)",
}


def _detecter(texte):
    t = (texte or "").lower()
    return [cat for cat, mot in MOTIFS.items() if re.search(mot, t, re.I)]


def evaluer(qui_accede, action, texte_recu):
    """qui_accede : 'autre_entreprise' | 'salarie' ; action : 'lecture' | 'ecriture'.
    Renvoie (niveau, raisons[]). Reproductible, sans aléa.
    """
    cats = _detecter(texte_recu)
    raisons = []

    # Base
    i = 2 if qui_accede == "autre_entreprise" else 1  # élevée / moyenne
    raisons.append("une autre entreprise accède" if qui_accede == "autre_entreprise"
                   else "un utilisateur sans droits entre dans une zone réservée")
    if action == "ecriture":
        i += 1
        raisons.append("accès en écriture (modification possible)")

    # + un cran : données financières ou personnelles sensibles
    if {"coordonnees_bancaires", "salaire"} & set(cats):
        i += 1
        raisons.append("données financières personnelles exposées")
    elif {"identite_contact", "carriere_perso"} & set(cats):
        i += 1
        raisons.append("données personnelles identifiantes exposées")

    # + un cran : la gestion des droits est atteinte
    if "droits_acces" in cats and qui_accede == "salarie":
        i += 1
        raisons.append("accès à la gestion des droits")

    # - un cran : aucune donnée personnelle ni droit détecté
    if not cats:
        i -= 1
        raisons.append("aucune donnée personnelle détectée")

    i = max(0, min(len(NIVEAUX) - 1, i))
    return NIVEAUX[i], raisons


if __name__ == "__main__":  # petit banc de contrôle
    cas = [
        ("autre_entreprise", "lecture", "CV de Noah, email noah47300@gmail.com, candidature V.I.E"),
        ("autre_entreprise", "lecture", "Facture n°12, 1 200 € HT"),
        ("salarie", "lecture", "Administration — gestion des rôles des utilisateurs"),
        ("salarie", "lecture", "Tableau de bord"),
    ]
    for q, a, t in cas:
        print(evaluer(q, a, t))
