"""Les failles prouvées et les écarts QA, écrits dans la table `constats` : n8n (W3) en fait un ticket GitHub et un e-mail.

Trois sources (D-42) : les failles prouvées du banc, les écarts QA prouvés par le code (`lignes_qa`) et les failles
prouvées d'une mission pentest (`lignes_mission`).

Une ligne ne porte jamais de donnée de l'application testée : un chemin, une méthode, des catégories de données
et les raisons de la règle de gravité. Ni ce que l'agent a vu, ni le marqueur écrit, ni le lien du replay.

Usage :
  python constats.py rapports/rapport-….json             (publie les failles prouvées d'un audit passé)
  python constats.py rapports/rapport-….json --limite 1  (une seule, pour un premier essai de bout en bout)
  python constats.py rapports/rapport-….json --essai     (affiche les lignes, sans rien écrire)
"""

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit
from zoneinfo import ZoneInfo

# Les applications connues de la table `applications` (supabase/alertes.sql), par le nom qu'en donne le rapport.
APPLICATIONS = {"Paie Express": "paie-express"}

# Une piste par type de faille, écrite d'avance : jamais générée, toujours la même pour la même faille.
PISTES = {
    "lecture": "Vérifier côté serveur que la ressource appartient à l'entreprise de l'utilisateur connecté avant de la renvoyer, "
               "sur la page comme dans l'API.",
    "ecriture": "Vérifier côté serveur que la ressource modifiée appartient à l'entreprise de l'utilisateur connecté avant "
                "d'enregistrer la modification.",
    "admin": "Vérifier le rôle de l'utilisateur côté serveur avant d'afficher ou de renvoyer une partie réservée : "
             "masquer le lien ne suffit pas.",
}
METHODES = {"lecture": "GET", "admin": "GET", "ecriture": "POST"}
PARIS = ZoneInfo("Europe/Paris")

# Les applications de la table `applications`, par l'identifiant de cible d'une mission (contrats/).
CIBLES = {"eugenia-public": "eugenia-public", "peer-review": "peer-review"}
CATALOGUE_QA = json.loads((Path(__file__).resolve().parents[1] / "contrats" / "qa.json").read_text())
# K1 et K2 décrivent la mise en place du test (le compte, le nom attendu), pas une régression du site.
TYPES_QA_EXCLUS = {"connexion", "identite"}
# Une faille prouvée d'une mission pentest, par scénario. S-PEER-01 ne rend jamais « failed » : il ne peut pas prouver
# l'accès au contenu privé (missions.verdict_gate). S-PEER-02 le peut, une fois raccordé au runner.
SCENARIOS_PENTEST = {"S-PEER-02": "compte"}


def date_audit(texte):
    """« 17/11/2026 08:51 » (heure de Paris) → ISO 8601 avec fuseau ; None si illisible."""
    try:
        return datetime.strptime(texte, "%d/%m/%Y %H:%M").replace(tzinfo=PARIS).isoformat()
    except (TypeError, ValueError):
        return None


def lignes_constats(donnees, audit_id=None, version=None):
    """Une ligne par faille prouvée du rapport ; [] pour une application inconnue de la table `applications`."""
    application = APPLICATIONS.get(donnees.get("application"))
    if not application:
        return []
    quand = date_audit(donnees.get("date"))
    lignes = []
    for p in donnees.get("preuves") or []:
        if not p.get("prouvee") or p.get("theme") not in PISTES:
            continue
        gravite = p.get("gravite") or {}
        ligne = {
            "application_id": application,
            "audit_id": audit_id,
            "version": version,
            "theme": p["theme"],
            "methode": METHODES[p["theme"]],
            "chemin": p["chemin"],
            "gravite": gravite.get("niveau") or "moyenne",
            "raisons": list(gravite.get("raisons") or []),
            "donnees": list(gravite.get("donnees") or p.get("donnees") or []),
            "similarite": p.get("similarite"),
            "confirme_ecran": bool((p.get("constat") or {}).get("confirme")),
            "session_h": p.get("session"),
            "piste": PISTES[p["theme"]],
        }
        if quand:
            ligne["audit_le"] = quand
        lignes.append(ligne)
    return lignes


def ecart_qa(resultat, connectee):
    """Le critère, les raisons, la preuve, la piste et la gravité d'un écart QA ; jamais une donnée du site testé.

    La gravité suit une règle écrite : une page qui répond 5xx est « élevée », un lien cassé « faible », le reste
    « moyenne ». Sur un site connecté, le texte attendu n'est pas recopié (il peut être un nom) : une référence courte
    le remplace, stable d'une mission à l'autre.
    """
    http = re.search(r"HTTP (\d{3})", resultat.get("observe") or "")
    code = int(http.group(1)) if http else None
    type_ = resultat.get("type")
    if type_ == "texte":
        attendu = str(resultat.get("attendu") or "")
        critere = (f"Texte attendu absent (réf. {hashlib.sha256(attendu.encode()).hexdigest()[:8]})" if connectee
                   else f"Texte attendu « {attendu} » absent")
        raison, preuve = "le texte attendu n'est plus sur la page servie", "la page servie, relue par une requête HTTP, ne contient pas le texte attendu."
        piste = "Comparer la page à la version précédente : le texte attendu a disparu ou a changé."
    elif type_ in ("page", "auto", "page_visitee"):
        critere = "Page en erreur"
        raison = f"la page répond HTTP {code}" if code else "la page répond en erreur"
        preuve = f"une requête HTTP sur la page reçoit le statut {code}." if code else "une requête HTTP sur la page reçoit une erreur."
        piste = "Vérifier la mise en ligne de cette page : route, déploiement et journaux du serveur."
    elif type_ == "lien":
        critere, raison = "Lien cassé", "un lien visible mène à une page en erreur"
        preuve = "le lien visible à l'écran mène à une page qui répond en erreur à une requête HTTP."
        piste = "Corriger ou retirer le lien, ou rétablir la page qu'il vise."
    elif type_ in ("texte_anormal", "probleme"):
        critere, raison = "Texte provisoire ou d'erreur affiché", "la page affiche un texte provisoire ou d'erreur"
        preuve = "le texte affiché par le navigateur contient un marqueur provisoire ou d'erreur."
        piste = "Retrouver le composant qui affiche ce texte, et la donnée manquante qui le provoque."
    else:
        critere, raison = "Critère du parcours non tenu", "un critère du parcours n'est pas tenu"
        preuve, piste = "le code constate l'écart sur la page servie.", "Comparer le parcours à la version précédente."
    gravite = "élevée" if code and code >= 500 else "faible" if type_ == "lien" else "moyenne"
    return critere[:200], [raison, "écart prouvé par le code, pas par l'avis de l'agent"], preuve, piste, gravite


def lignes_qa(rapport):
    """Un constat par écart QA prouvé par le code (statut failed) ; [] pour une cible sans application suivie."""
    requete = rapport.get("request") or {}
    application = CIBLES.get(requete.get("target_id"))
    if not application:
        return []
    cible = next((c for c in CATALOGUE_QA["cibles"] if c["id"] == requete.get("target_id")), {})
    session = ((rapport.get("sessions") or [{}])[0] or {}).get("session")
    lignes = []
    for r in rapport.get("results") or []:
        if r.get("status") != "failed" or r.get("type") in TYPES_QA_EXCLUS:
            continue
        critere, raisons, preuve, piste, gravite = ecart_qa(r, bool(cible.get("connexion")))
        vu = any(str(p).startswith("obs-") for p in r.get("preuves") or [])
        chemin = str(r.get("chemin") or "/")
        ligne = {"application_id": application, "theme": "qa", "methode": "GET",
                 "chemin": (chemin if chemin.startswith("/") else "/")[:300], "gravite": gravite, "raisons": raisons,
                 "donnees": [], "critere": critere, "confirme_ecran": vu, "session_h": session, "piste": piste,
                 "preuve": "1. **Vérification par le code :** " + preuve + (
                     "\n2. **Parcours de l'agent :** la page a été atteinte par l'interface ; la capture est dans le rapport de la mission."
                     if vu else "")}
        if rapport.get("started_at"):
            ligne["audit_le"] = rapport["started_at"]
        lignes.append(ligne)
    return lignes


def lignes_mission(rapport, audit_id=None):
    """Un constat par faille prouvée d'une mission pentest (statut failed), pour les scénarios qui savent la prouver."""
    requete = rapport.get("request") or {}
    application = CIBLES.get(requete.get("target_id"))
    lignes = []
    for r in rapport.get("results") or []:
        theme = SCENARIOS_PENTEST.get(r.get("scenario_id"))
        if r.get("status") != "failed" or not theme or not application:
            continue
        chemin = urlsplit(str(r.get("url") or (rapport.get("scope_snapshot") or {}).get("entry_url") or "/")).path or "/"
        ligne = {"application_id": application, "audit_id": audit_id, "theme": theme, "methode": "GET", "chemin": chemin[:300],
                 "gravite": "élevée", "raisons": ["un autre compte reçoit le contenu protégé d'une ressource qui ne lui appartient pas"],
                 "donnees": [], "confirme_ecran": False, "session_h": ((rapport.get("sessions") or [{}])[0] or {}).get("session"),
                 "preuve": "1. **Contrôle HTTP :** le compte B reçoit la valeur témoin de la ressource du compte A ; le témoin n'est pas recopié.",
                 "piste": "Vérifier côté serveur que la ressource appartient au compte connecté avant de la renvoyer, sur la page comme dans l'API."}
        if rapport.get("started_at"):
            ligne["audit_le"] = rapport["started_at"]
        lignes.append(ligne)
    return lignes


def publier_lignes(base, lignes):
    """Écrire des constats déjà préparés ; chaque insertion appelle W3, si le coffre de la base est réglé."""
    return [base.ajouter("constats", ligne)["id"] for ligne in lignes]


def publier(base, donnees, audit_id=None, version=None, limite=None):
    """Écrire les failles prouvées dans `constats`. Chaque insertion appelle W3, si le coffre de la base est réglé."""
    lignes = lignes_constats(donnees, audit_id, version)[:limite]
    return [base.ajouter("constats", ligne)["id"] for ligne in lignes]


def main():
    parser = argparse.ArgumentParser(description="Publier les failles prouvées d'un audit du banc dans la table constats.")
    parser.add_argument("rapport", help="Le rapport JSON d'un audit du banc")
    parser.add_argument("--audit-id", help="L'identifiant de l'audit dans Supabase, pour le lien du relevé")
    parser.add_argument("--version", help="Le commit ou la version testée")
    parser.add_argument("--limite", type=int, help="Ne publier que les N premières failles")
    parser.add_argument("--essai", action="store_true", help="Afficher les lignes sans rien écrire")
    args = parser.parse_args()
    donnees = json.loads(Path(args.rapport).read_text())
    if args.essai:
        for ligne in lignes_constats(donnees, args.audit_id, args.version)[:args.limite]:
            print(json.dumps(ligne, ensure_ascii=False))
        return
    from base import Base
    base = Base()
    try:
        ids = publier(base, donnees, args.audit_id, args.version, args.limite)
    finally:
        base.fermer()
    print(f"{len(ids)} constat(s) publié(s)" + ("" if ids else " : aucune faille prouvée, ou application inconnue"), file=sys.stderr)


if __name__ == "__main__":
    main()
