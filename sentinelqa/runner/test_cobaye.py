"""Banc de la vérité terrain : vérifie que l'application cobaye se comporte comme VERITE_TERRAIN.json le dit.

Chaque faille injectée doit être ouverte, chaque contrôle sain fermé, et les accès légitimes doivent marcher.
Sans ce banc, un audit « 6 sur 6 » pourrait mesurer un cobaye qui ne contient plus ses failles.

Usage, application cobaye lancée : python sentinelqa/runner/test_cobaye.py [http://localhost:3000]
"""

import json
import sys
from pathlib import Path

import httpx

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
COMPTES = json.loads((Path(__file__).parent / "comptes-demo.json").read_text())


def session(cle):
    http = httpx.Client(base_url=BASE, follow_redirects=False, timeout=30)
    compte = COMPTES[cle]
    http.post("/api/connexion", data={"email": compte["email"], "mot_de_passe": compte["mot_de_passe"]})
    assert "session" in http.cookies, f"connexion impossible pour le compte {cle}"
    return http


echecs = []


def verifier(nom, condition):
    print(("  ok  " if condition else "  ÉCHEC ") + nom)
    if not condition:
        echecs.append(nom)


A, B, C = session("A"), session("B"), session("C")  # admin Alpha, admin Bêta, salariée Alpha
try:
    A.post("/api/reinitialiser")

    print("Lecture (B lit les données de A)")
    verifier("F1 ouverte : B lit la fiche 1041 d'Alpha", "Léa Fontaine" in B.get("/fiches-de-paie/1041").text)
    verifier("F2 ouverte : B lit l'API de la fiche 1041", B.get("/api/fiches-de-paie/1041").status_code == 200)
    verifier("F3 ouverte : B lit les salariés d'Alpha par le paramètre", "Karim Haddad" in B.get("/salaries?entreprise=alpha").text)
    verifier("C1 fermé : B reçoit 404 sur la facture d'Alpha", B.get("/factures/FA-2026-031").status_code == 404)
    verifier("légitime : A lit sa facture", A.get("/factures/FA-2026-031").status_code == 200)

    print("Écriture (B modifie les données de A)")
    verifier("formulaire protégé : B reçoit 404 sur le formulaire de la fiche 1041", B.get("/fiches-de-paie/1041/modifier").status_code == 404)
    verifier("légitime : A ouvre le formulaire de la fiche 1041", "Commentaire RH" in A.get("/fiches-de-paie/1041/modifier").text)
    r = B.post("/api/fiches-de-paie/1041", data={"commentaire": "banc-F4"})
    verifier("F4 ouverte : l'enregistrement de B est accepté (303)", r.status_code == 303)
    verifier("F4 ouverte : A voit le commentaire écrit par B", "banc-F4" in A.get("/fiches-de-paie/1041").text)
    r = B.post("/api/factures/FA-2026-031", data={"note": "banc-C2"})
    verifier("C2 fermé : l'enregistrement de B sur la facture d'Alpha reçoit 404", r.status_code == 404)
    verifier("C2 fermé : A ne voit aucune note de B", "banc-C2" not in A.get("/factures/FA-2026-031").text)
    A.post("/api/factures/FA-2026-031", data={"note": "banc-legitime"})
    verifier("légitime : A enregistre une note sur sa facture", "banc-legitime" in A.get("/factures/FA-2026-031").text)
    A.post("/api/reinitialiser")
    verifier("remise à zéro : le commentaire de B a disparu", "banc-F4" not in A.get("/fiches-de-paie/1041").text)

    print("Admin (un salarié dépasse son rôle)")
    verifier("interface : le tableau de bord de C n'a pas de lien vers l'administration", "/administration" not in C.get("/tableau-de-bord").text)
    verifier("interface : C ne liste que sa fiche", "1041" in C.get("/fiches-de-paie").text and "1042" not in C.get("/fiches-de-paie").text)
    verifier("F5 ouverte : C entre dans l'administration", "Comptes de l" in C.get("/administration").text)
    verifier("F6 ouverte : C lit la fiche 1042 de son collègue", "Karim Haddad" in C.get("/fiches-de-paie/1042").text)
    verifier("C3 fermé : C reçoit 404 sur les paramètres de paie", C.get("/administration/parametres").status_code == 404)
    verifier("C4 fermé : C reçoit 404 sur les salariés", C.get("/salaries?entreprise=alpha").status_code == 404)
    verifier("C4 fermé : C reçoit 404 sur les factures", C.get("/factures").status_code == 404)
    verifier("légitime : A ouvre les paramètres de paie", A.get("/administration/parametres").status_code == 200)
finally:
    for http in (A, B, C):
        http.close()

print(f"\n{'Banc vert' if not echecs else str(len(echecs)) + ' échec(s)'}")
sys.exit(1 if echecs else 0)
