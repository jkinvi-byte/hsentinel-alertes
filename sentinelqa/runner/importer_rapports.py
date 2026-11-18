"""Importe dans Supabase les rapports d'audit déjà écrits dans sentinelqa/rapports/*.json.

Un audit déjà importé (même date, même cible) n'est pas réimporté. Aucun mot de passe n'est envoyé :
les comptes sont décrits par leur e-mail, leur entreprise et leur rôle.

Usage : python importer_rapports.py
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

from base import Base

ICI = Path(__file__).resolve().parent
PARIS = timezone(timedelta(hours=1))  # heure de Paris en novembre (UTC+1)


def comptes_sans_secret(cles_utilisees):
    comptes = json.loads((ICI / "comptes-demo.json").read_text())
    return [{"cle": k, "email": comptes[k]["email"], "nom": comptes[k]["nom"], "entreprise": comptes[k]["entreprise"],
             "acces": comptes[k].get("acces", "admin")} for k in cles_utilisees]


def main():
    base = Base()
    deja = {(a["rapport"] or {}).get("date") for a in base.lire("audits", application="eq.Paie Express")}
    importes = 0
    for fichier in sorted((ICI.parent / "rapports").glob("rapport-*.json")):
        d = json.loads(fichier.read_text())
        if d["date"] in deja:
            continue
        fin = datetime.strptime(d["date"], "%d/%m/%Y %H:%M").replace(tzinfo=PARIS)
        debut = fin - timedelta(seconds=d["duree_totale_s"])
        cles = sorted(d.get("comptes", {"A": None, "B": None}))
        base.ajouter("audits", {
            "cree_le": debut.isoformat(), "debut": debut.isoformat(), "fin": fin.isoformat(), "statut": "termine",
            "application": "Paie Express", "cible": d["cible"], "comptes": comptes_sans_secret(cles),
            "ecriture_autorisee": bool(d.get("ecriture_autorisee")), "rapport": d,
        })
        importes += 1
        print(f"importé : {fichier.name}")
    print(f"{importes} rapport(s) importé(s), {len(base.lire('audits'))} audit(s) dans Supabase")
    base.fermer()


if __name__ == "__main__":
    main()
