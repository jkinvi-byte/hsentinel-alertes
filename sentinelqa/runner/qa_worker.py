"""Le worker du volet QA : il prend dans Supabase les missions QA déposées par la web, une par une, écrit leur fil
en direct puis leur rapport. Il ne lit jamais la table audits du pentest : chaque volet a sa file.

Usage :
  python qa_worker.py --schema       applique supabase/qa.sql (tables qa_missions et qa_evenements)
  python qa_worker.py                attend les missions QA (Ctrl-C pour arrêter)
"""

import os
import subprocess
import sys
import threading
import time
from pathlib import Path

import httpx
from hai_agents import Client

from base import Base, env_postgres, lire_cles
from qa_moteur import ecrire_rapport, executer_qa, maintenant

SCHEMA_QA = Path(__file__).resolve().parent.parent / "supabase" / "qa.sql"


def cle_h():
    """La clé rangée par `holo login`, jamais affichée."""
    if os.environ.get("HAI_API_KEY"):
        return os.environ["HAI_API_KEY"]
    for ligne in (Path.home() / ".config/hai/.env").read_text().splitlines():
        if ligne.strip().startswith("HAI_API_KEY="):
            # `holo login` écrit la clé entre guillemets : envoyée telle quelle, H répond 403 (vécu le 18/11 à 7 h 03).
            return ligne.split("=", 1)[1].strip().strip("'\"")
    sys.exit("Clé H introuvable : lancez `holo login`.")


class JournalQA:
    """Le fil d'une mission : au terminal et dans qa_evenements. Une coupure du fil n'arrête pas la mission."""

    def __init__(self, base, mission_id):
        self.base, self.mission_id, self.verrou = base, mission_id, threading.Lock()

    def __call__(self, message, type="info", **donnees):
        print(f"[{time.strftime('%H:%M:%S')}] {type:8s} {message}", flush=True)
        with self.verrou:
            try:
                self.base.ajouter("qa_evenements", {"mission_id": self.mission_id, "type": type, "message": message.strip()[:1000],
                                                    "donnees": donnees or None})
            except httpx.HTTPError as erreur:
                print(f"   (fil Supabase indisponible : {erreur.__class__.__name__})", flush=True)


def traiter(base, client, ligne):
    mission_id = ligne["id"]
    journal = JournalQA(base, mission_id)
    derniere, arret_lu = [0.0], [False]

    def arret():
        # L'opérateur demande l'arrêt depuis la web : relu au plus une fois par seconde et demie.
        if not arret_lu[0] and time.monotonic() - derniere[0] >= 1.5:
            derniere[0] = time.monotonic()
            try:
                arret_lu[0] = bool(base.lire("qa_missions", id=f"eq.{mission_id}", select="arret_demande")[0]["arret_demande"])
            except (httpx.HTTPError, IndexError, KeyError):
                pass
        return arret_lu[0]

    try:
        rapport = executer_qa(ligne["demande"], client, journal, arret)
        print(f"Rapport local : {ecrire_rapport(rapport)}", flush=True)
        base.modifier("qa_missions", {"statut": "termine", "fin": maintenant(), "rapport": rapport}, id=f"eq.{mission_id}")
    except BaseException as erreur:
        message = f"{erreur.__class__.__name__} : {erreur}"[:500]
        journal(f"Mission interrompue : {message}", "erreur")
        base.modifier("qa_missions", {"statut": "echec", "fin": maintenant(), "erreur": message}, id=f"eq.{mission_id}")
        if isinstance(erreur, KeyboardInterrupt):
            raise


def surveiller():
    base, client = Base(), Client(api_key=cle_h(), timeout=30, max_retries=1)
    print("Worker QA prêt : en attente des missions de la web (Ctrl-C pour arrêter)…", flush=True)
    pause = 2
    while True:
        try:
            attente = base.lire("qa_missions", statut="eq.en_attente", order="cree_le.asc", limit="1")
            if attente:
                # Réservation atomique : si un autre worker l'a prise, la modification ne touche aucune ligne.
                prises = base.modifier("qa_missions", {"statut": "en_cours", "debut": maintenant()},
                                       id=f"eq.{attente[0]['id']}", statut="eq.en_attente")
                if prises:
                    traiter(base, client, prises[0])
                    continue
            pause = 2
        except httpx.HTTPError as erreur:
            print(f"Supabase injoignable ({erreur.__class__.__name__}) : nouvel essai dans {pause} s", flush=True)
            pause = min(pause * 2, 30)
        time.sleep(pause)


def appliquer_schema():
    resultat = subprocess.run(["psql", "-v", "ON_ERROR_STOP=1", "-q", "-f", str(SCHEMA_QA)], env=env_postgres(lire_cles()),
                              capture_output=True, text=True)
    if resultat.returncode != 0:
        sys.exit(f"Le schéma QA n'a pas pu s'appliquer : {resultat.stderr.strip()}")
    print("Schéma QA appliqué :", SCHEMA_QA.name)


if __name__ == "__main__":
    if sys.argv[1:] == ["--schema"]:
        appliquer_schema()
    else:
        surveiller()
