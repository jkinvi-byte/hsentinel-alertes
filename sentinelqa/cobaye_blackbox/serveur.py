"""Banc HTTP local : toutes les données sont fictives et toutes les failles sont intentionnelles."""

import argparse
import html
import json
import sqlite3
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

MARQUEURS = {
    "known": "HSENTINEL-KNOWN-PRIVATE",
    "cors": "HSENTINEL-CORS-PRIVATE",
    "sql": "HSENTINEL-PRIVATE-ROW",
    "source": "HSENTINEL-SOURCE-PRIVATE",
}
ACCES_MARQUEUR = "HSENTINEL-DOCUMENT-PRIVE-A"
IDENTITES = {"A": "HSENTINEL-IDENTITE-A", "B": "HSENTINEL-IDENTITE-B"}
SESSIONS = {"session-A": "A", "session-B": "B"}
JETONS = {"jeton-A": "A", "jeton-B": "B"}


def page(titre, contenu):
    return f"<!doctype html><html lang='fr'><head><title>{titre}</title><script src='/assets/app.js'></script></head><body><h1>{titre}</h1>{contenu}</body></html>".encode()


class Banc(ThreadingHTTPServer):
    def __init__(self, adresse=("127.0.0.1", 0), *, acces=False):
        super().__init__(adresse, Gestionnaire)
        self.acces = acces
        self.expiration_utilisee = False
        self.db = sqlite3.connect(":memory:", check_same_thread=False)
        self.db.execute("CREATE TABLE products(name TEXT)")
        self.db.executemany("INSERT INTO products VALUES (?)", [("Apple",), ("Orange",), (MARQUEURS["sql"],)])
        self.mutations = 0
        self.requetes = []
        self.authorizations = []


class Gestionnaire(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def repondre(self, corps=b"", statut=200, type_="text/html; charset=utf-8", headers=None):
        self.send_response(statut)
        self.send_header("Content-Type", type_)
        self.send_header("Content-Length", str(len(corps)))
        for nom, valeur in (headers or {}).items():
            self.send_header(nom, valeur)
        self.end_headers()
        try:
            self.wfile.write(corps)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def json(self, valeur, statut=200, headers=None):
        self.repondre(json.dumps(valeur).encode(), statut, "application/json", headers)

    def do_POST(self):
        self.server.requetes.append(("POST", self.path))
        if self.server.acces and self.path == "/connexion":
            try:
                taille = min(int(self.headers.get("Content-Length", "0")), 8192)
                champs = parse_qs(self.rfile.read(taille).decode(), keep_blank_values=True)
            except (ValueError, UnicodeError):
                self.json({"error": "invalid_login"}, 400)
                return
            role = champs.get("email", [""])[0].upper()
            if role in SESSIONS.values() and champs.get("password", [""])[0] == "mot-de-passe-" + role.lower() + "-fictif":
                self.json({"ok": True}, 303, {"Location": "/compte", "Set-Cookie": f"lab_session=session-{role}; Path=/; HttpOnly; SameSite=Lax"})
            else:
                self.json({"error": "invalid_login"}, 401)
            return
        self.json({"error": "Banc : soumission non attendue"}, 403)

    def role(self):
        from http.cookies import SimpleCookie
        cookies = SimpleCookie()
        try:
            cookies.load(self.headers.get("Cookie", ""))
        except Exception:
            pass
        session = cookies["lab_session"].value if "lab_session" in cookies else ""
        jeton = self.headers.get("Authorization", "").removeprefix("Bearer ")
        return SESSIONS.get(session) or JETONS.get(jeton)

    def controle_acces(self, u):
        if u.path == "/connexion":
            self.repondre(b"<form method='post' action='/connexion'><input type='hidden' name='csrf' value='fictif'><input name='email'><input type='password' name='password'></form>")
            return True
        if u.path == "/compte":
            role = self.role()
            if role:
                self.json({"identity": IDENTITES[role], "resource": "/access/discovered"})
            else:
                self.json({"error": "login_required"}, 401)
            return True
        if not u.path.startswith("/access/"):
            return False
        role = self.role()
        if u.path == "/access/shell" and role is None:
            self.repondre(b"", 302, headers={"Location": "/connexion"})
            return True
        if role is None:
            self.json({"error": "login_required"}, 401)
            return True
        if role == "B" and u.path == "/access/expired" and not self.server.expiration_utilisee:
            self.server.expiration_utilisee = True
            self.json({"error": "expired"}, 401, {"Set-Cookie": "lab_session=; Path=/; Max-Age=0"})
            return True
        if u.path == "/access/missing" or role == "A" and u.path == "/access/no-marker":
            self.json({"error": "not_found"} if u.path == "/access/missing" else {"content": "generic"}, 404 if u.path == "/access/missing" else 200)
            return True
        if role == "A":
            self.json({"owner": "A", "private": ACCES_MARQUEUR})
            return True
        if u.path == "/access/leak500":
            self.json({"private": ACCES_MARQUEUR}, 500)
            return True
        if u.path == "/access/shell":
            self.json({"status": "empty"})
            return True
        self.json({"error": "denied"}, 403)
        return True

    def do_GET(self):
        self.server.requetes.append(("GET", self.path))
        if self.server.acces:
            self.server.authorizations.append(self.headers.get("Authorization"))
        u = urlsplit(self.path)
        if self.server.acces and self.controle_acces(u):
            return
        q = parse_qs(u.query, keep_blank_values=True).get("q", [""])[0]
        if u.path == "/":
            contenu = """
              <nav><a href='/search?q=apple'>Recherche</a><a href='/safe-search?q=apple'>Recherche saine</a>
              <a href='/rest/products/search?q=apple'>Produits</a><a href='/rest/safe-products/search?q=apple'>Produits sains</a>
              <a href='/private/known'>Document privé</a><a href='/private/safe'>Document protégé</a>
              <a href='/cors-private'>CORS privé</a><a href='/cors-public'>CORS public</a><a href='/headers/secure'>En-têtes sains</a></nav>
              <form action='/reviews' method='post'><input name='review' value='ne-jamais-envoyer'></form>
              <form action='/rest/products/search' method='get'><input name='q' value='apple'></form>
            """
            if self.server.acces:
                contenu += "<a href='/access/discovered'>Route découverte</a>"
            self.repondre(page("Banc HSentinel", contenu))
        elif u.path == "/search":
            self.repondre(page("Recherche", f"<p id='result'>Résultat : {q}</p>"))
        elif u.path == "/safe-search":
            self.repondre(page("Recherche saine", f"<p id='result'>Résultat : {html.escape(q)}</p>"))
        elif u.path in ("/rest/products/search", "/rest/safe-products/search"):
            try:
                if u.path == "/rest/products/search":
                    lignes = self.server.db.execute("SELECT name FROM products WHERE name LIKE '%" + q + "%'").fetchall()
                else:
                    lignes = self.server.db.execute("SELECT name FROM products WHERE name LIKE ?", (f"%{q}%",)).fetchall()
            except sqlite3.Error:
                self.json({"error": "invalid_query"}, 500)
            else:
                self.json({"data": [{"name": ligne[0]} for ligne in lignes]})
        elif u.path == "/private/known":
            self.repondre(f"Incident de démonstration. {MARQUEURS['known']}".encode(), 500, "text/plain")
        elif u.path == "/private/safe":
            self.json({"error": "denied"}, 403)
        elif u.path == "/cors-private":
            origine = self.headers.get("Origin", "")
            self.json({"private": MARQUEURS["cors"]}, headers={"Access-Control-Allow-Origin": origine} if origine else {})
        elif u.path == "/cors-public":
            self.json({"public": "documentation"}, headers={"Access-Control-Allow-Origin": "*"})
        elif u.path == "/headers/secure":
            self.repondre(page("Sain", "<p>OK</p>"), headers={
                "Content-Security-Policy": "default-src 'self'", "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer", "Strict-Transport-Security": "max-age=31536000",
            })
        elif u.path == "/cookie":
            self.repondre(page("Cookie", "OK"), headers={"Set-Cookie": "demo=fictif; Path=/"})
        elif u.path == "/assets/app.js":
            self.repondre(b"fetch('/rest/products/search?q=apple');\n//# sourceMappingURL=/assets/safe.js.map\n", type_="application/javascript")
        elif u.path == "/assets/safe.js.map":
            self.json({"version": 3, "sources": ["safe.ts"], "sourcesContent": ["export const safe = true;"]})
        elif u.path == "/assets/private.js.map":
            self.json({"version": 3, "sources": ["private.ts"], "sourcesContent": [f"// {MARQUEURS['source']}\n"]})
        elif u.path == "/mutate":
            self.server.mutations += 1
            self.json({"mutations": self.server.mutations})
        elif u.path == "/logout":
            self.server.mutations += 1
            self.json({"logged_out": True})
        elif u.path == "/redirect-external":
            self.repondre(b"", 302, headers={"Location": "https://example.com/"})
        elif u.path == "/large":
            self.repondre(b"x" * 2_000_000, type_="text/plain")
        else:
            self.json({"error": "not_found"}, 404)


def servir_en_thread():
    banc = Banc()
    thread = threading.Thread(target=banc.serve_forever, daemon=True)
    thread.start()
    return banc, thread


def main():
    parser = argparse.ArgumentParser(description="Laboratoire HSentinel, exclusivement sur 127.0.0.1.")
    parser.add_argument("--port", type=int, default=0)
    parser.add_argument("--acces", action="store_true", help="Active les comptes fictifs et les scénarios IDOR.")
    args = parser.parse_args()
    banc = Banc(("127.0.0.1", args.port), acces=args.acces)
    print(json.dumps({"origin": f"http://127.0.0.1:{banc.server_port}", "markers": MARQUEURS}), flush=True)
    try:
        banc.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        banc.server_close()
        banc.db.close()


if __name__ == "__main__":
    main()
