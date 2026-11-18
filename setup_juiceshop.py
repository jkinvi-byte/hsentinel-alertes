"""Prépare la cible Juice Shop : crée 2 comptes de test (A, B) et leurs coffres H.
Cible = instance volontairement vulnérable, déployée par l'équipe (aucune donnée réelle).
Mots de passe = test, générés ici (jamais des vrais identifiants).
Usage : python setup_juiceshop.py <url_juiceshop>
"""
import json, secrets, sys

import httpx

from config import BASE_URL, ICI, entetes

COMPTES = {"A": "hsentinel-a@juice.test", "B": "hsentinel-b@juice.test"}


def main(base):
    base = base.rstrip("/")
    page_login = base + "/#/login"
    coffres_path = ICI / "coffres.json"
    coffres = json.loads(coffres_path.read_text(encoding="utf-8")) if coffres_path.exists() else {}
    coffres.setdefault("juiceshop", {})

    for lettre, email in COMPTES.items():
        mdp = "JsTest!" + secrets.token_hex(5)
        # 1) créer le compte (API Juice Shop) — idempotent : si déjà pris, on tente juste la connexion
        r = httpx.post(base + "/api/Users", timeout=30,
                       json={"email": email, "password": mdp, "passwordRepeat": mdp,
                             "securityQuestion": {"id": 2}, "securityAnswer": "test"})
        cree = r.status_code in (200, 201)
        # 2) vérifier la connexion
        lr = httpx.post(base + "/rest/user/login", timeout=30, json={"email": email, "password": mdp})
        if lr.status_code != 200:
            print(f"❌ {lettre} ({email}) : compte créé={cree} mais connexion KO ({lr.status_code}) — "
                  f"le compte existe peut-être déjà avec un autre mot de passe. Supprime-le ou change l'e-mail.")
            continue
        # 3) coffre H (créds de test de NOTRE instance vulnérable)
        v = httpx.post(BASE_URL + "/vaults", headers=entetes(), timeout=30,
                       json={"name": f"hsentinel-juiceshop-{lettre}".lower(),
                             "provider_config": {"provider": "internal"}})
        v.raise_for_status()
        vid = v.json()["id"]
        it = httpx.post(BASE_URL + f"/vaults/{vid}/items", headers=entetes(), timeout=30,
                        json={"name": f"Compte {lettre}", "urls": [page_login, base],
                              "values": {"username": email, "email": email, "password": mdp}})
        it.raise_for_status()
        coffres["juiceshop"][lettre] = vid
        coffres_path.write_text(json.dumps(coffres, indent=2), encoding="utf-8")
        print(f"✅ {lettre} : compte {email} prêt (créé={cree}, connexion OK) · coffre {vid}")

    print("\nComptes et coffres Juice Shop prêts.")


if __name__ == "__main__":
    main(sys.argv[1])
