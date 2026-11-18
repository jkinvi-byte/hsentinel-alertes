"""Crée un coffre H (provider internal) par compte de test, et y range son identifiant.
Le mot de passe est saisi au clavier (getpass) et part directement chez H : il n'est écrit nulle part ici.
coffres.json ne garde que les identifiants des coffres.
Usage : python 02_creer_coffres.py paie   |   python 02_creer_coffres.py juice
"""
import getpass, json, sys

import httpx

from config import BASE_URL, ICI, PREFIXE, cibles, coffres, entetes


def main(nom_cible):
    c = cibles()[nom_cible]
    tous = coffres()
    tous.setdefault(nom_cible, {})
    for lettre, compte in c["comptes"].items():
        if lettre in tous[nom_cible]:
            print(f"ℹ️  {nom_cible}/{lettre} : coffre déjà créé ({tous[nom_cible][lettre]})")
            continue
        mdp = getpass.getpass(f"Mot de passe du compte {lettre} ({compte['email']}) : ")
        r = httpx.post(f"{BASE_URL}/vaults", headers=entetes(), timeout=30,
                       json={"name": f"{PREFIXE}-{nom_cible}-{lettre}".lower(), "provider_config": {"provider": "internal"}})
        r.raise_for_status()
        vid = r.json()["id"]
        # Un coffre par compte : l'agent choisit l'entrée par l'adresse de la page, deux comptes sur la même page entreraient en conflit.
        r = httpx.post(f"{BASE_URL}/vaults/{vid}/items", headers=entetes(), timeout=30,
                       json={"name": f"Compte {lettre}", "urls": [c["page_connexion"], c["url"]],
                             "values": {"username": compte["email"], "email": compte["email"], "password": mdp}})
        r.raise_for_status()
        del mdp
        tous[nom_cible][lettre] = vid
        (ICI / "coffres.json").write_text(json.dumps(tous, indent=2), encoding="utf-8")
        print(f"✅ {nom_cible}/{lettre} : coffre {vid}")


if __name__ == "__main__":
    main(sys.argv[1])
