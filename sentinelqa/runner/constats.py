"""Les failles prouvées du banc, écrites dans la table `constats` : n8n (W3) en fait un ticket GitHub et un e-mail.

Une ligne ne porte jamais de donnée de l'application testée : un chemin, une méthode, des catégories de données
et les raisons de la règle de gravité. Ni ce que l'agent a vu, ni le marqueur écrit, ni le lien du replay.

Usage :
  python constats.py rapports/rapport-….json             (publie les failles prouvées d'un audit passé)
  python constats.py rapports/rapport-….json --limite 1  (une seule, pour un premier essai de bout en bout)
  python constats.py rapports/rapport-….json --essai     (affiche les lignes, sans rien écrire)
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
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
