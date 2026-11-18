"""La base Supabase de SentinelQA, vue du runner.

Les clés viennent de ~/.config/sentinelqa/.env (hors du dépôt, droits 600) et ne s'affichent jamais.
Le runner parle à Supabase avec la clé secrète, par l'API REST ; le schéma s'applique par le pooler Postgres.

Usage : python base.py schema    (applique sentinelqa/supabase/schema.sql)
"""

import os
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

import httpx

FICHIER_CLES = Path.home() / ".config/sentinelqa/.env"
SCHEMA = Path(__file__).resolve().parent.parent / "supabase" / "schema.sql"


def lire_cles():
    if not FICHIER_CLES.exists():
        sys.exit(f"Fichier de clés introuvable : {FICHIER_CLES} (modèle : sentinelqa/.env.example).")
    cles = {}
    for ligne in FICHIER_CLES.read_text().splitlines():
        if "=" in ligne and not ligne.lstrip().startswith("#"):
            nom, valeur = ligne.split("=", 1)
            cles[nom.strip()] = valeur.strip()
    return cles


def env_postgres(cles):
    """Les identifiants du pooler passent à psql par l'environnement : le mot de passe n'apparaît dans aucune commande."""
    url = urlsplit(cles["SUPABASE_SESSIONPOOL_URL"])
    return {**os.environ, "PGHOST": url.hostname, "PGPORT": str(url.port or 5432), "PGUSER": unquote(url.username or ""),
            "PGPASSWORD": unquote(url.password or ""), "PGDATABASE": url.path.lstrip("/") or "postgres", "PGCONNECT_TIMEOUT": "15"}


def appliquer_schema():
    resultat = subprocess.run(["psql", "-v", "ON_ERROR_STOP=1", "-q", "-f", str(SCHEMA)], env=env_postgres(lire_cles()),
                              capture_output=True, text=True)
    if resultat.returncode != 0:
        sys.exit(f"Le schéma n'a pas pu s'appliquer : {resultat.stderr.strip()}")
    print("Schéma appliqué :", SCHEMA.name)


class Base:
    """Les appels REST dont le runner a besoin, avec la clé secrète (elle passe outre le RLS)."""

    def __init__(self, cles=None):
        cles = cles or lire_cles()
        self.http = httpx.Client(base_url=f"{cles['SUPABASE_URL']}/rest/v1", timeout=30,
                                 headers={"apikey": cles["SUPABASE_SECRET_KEY"], "Content-Type": "application/json"})

    def lire(self, table, **filtres):
        reponse = self.http.get(f"/{table}", params={"select": "*", **filtres})
        reponse.raise_for_status()
        return reponse.json()

    def ajouter(self, table, ligne):
        reponse = self.http.post(f"/{table}", json=ligne, headers={"Prefer": "return=representation"})
        reponse.raise_for_status()
        return reponse.json()[0]

    def modifier(self, table, valeurs, **filtres):
        reponse = self.http.patch(f"/{table}", params=filtres, json=valeurs, headers={"Prefer": "return=representation"})
        reponse.raise_for_status()
        return reponse.json()

    def fermer(self):
        self.http.close()


if __name__ == "__main__" and sys.argv[1:] == ["schema"]:
    appliquer_schema()
