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

import constats
import veille
from base import Base, env_postgres, lire_cles
from cle_runner import cle_privee, dechiffrer, publier
from qa_moteur import ecrire_rapport, executer_qa, maintenant, preparer_coffre, supprimer_coffre, trouver_cible

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


def publier_ecarts(base, rapport, journal):
    """Chaque écart prouvé par le code devient un constat, donc un ticket (W3, D-42).
    Une alerte qui échoue ne fait jamais échouer la mission : elle est journalisée."""
    try:
        ids = constats.publier_lignes(base, constats.lignes_qa(rapport))
        if ids:
            journal(f"{len(ids)} écart(s) prouvé(s) transmis aux alertes (W3).", "info")
    except Exception as erreur:
        journal(f"Alertes non transmises : {erreur.__class__.__name__}", "erreur")


def preparer_compte(base, client, mission_id, demande, journal):
    """Site connecté : le mot de passe, chiffré par le navigateur avec la clé publique du runner, quitte la base avant tout,
    est déchiffré en mémoire, puis versé dans un coffre H propre à la mission. Il n'est jamais écrit ni journalisé."""
    compte = demande.pop("compte", None)
    if compte is None:
        return None
    base.modifier("qa_missions", {"demande": demande}, id=f"eq.{mission_id}")
    cible = trouver_cible(demande.get("target_id"))
    if not cible.get("connexion"):
        raise ValueError("Un site public ne reçoit aucun compte.")
    mot_de_passe = dechiffrer(cle_privee(), compte["secret_chiffre"])["mot_de_passe"]
    coffre = preparer_coffre(client, cible, compte["identifiant"], mot_de_passe)
    demande.update(coffre=coffre, identite=compte.get("identite") or [])
    journal("Coffre H créé pour la mission : l'agent se connectera sans voir le mot de passe.", "info")
    return coffre


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

    demande, coffre = dict(ligne["demande"]), None
    try:
        coffre = preparer_compte(base, client, mission_id, demande, journal)
        rapport = executer_qa(demande, client, journal, arret)
        print(f"Rapport local : {ecrire_rapport(rapport)}", flush=True)
        base.modifier("qa_missions", {"statut": "termine", "fin": maintenant(), "rapport": rapport}, id=f"eq.{mission_id}")
        publier_ecarts(base, rapport, journal)
    except BaseException as erreur:
        message = f"{erreur.__class__.__name__} : {erreur}"[:500]
        journal(f"Mission interrompue : {message}", "erreur")
        base.modifier("qa_missions", {"statut": "echec", "fin": maintenant(), "erreur": message}, id=f"eq.{mission_id}")
        if isinstance(erreur, KeyboardInterrupt):
            raise
    finally:
        if coffre:
            try:
                supprimer_coffre(client, coffre)
                journal("Coffre H de la mission supprimé.", "info")
            except Exception as erreur:
                journal(f"Coffre {coffre} non supprimé ({erreur.__class__.__name__}) : à supprimer à la main.", "erreur")


def surveiller():
    base, client = Base(), Client(api_key=cle_h(), timeout=30, max_retries=1)
    # La clé publique du runner, avec laquelle la web chiffre le mot de passe d'un site connecté.
    print(f"Clé publique du runner publiée (cles_runner n° {publier(base, cle_privee())})", flush=True)
    print("Worker QA prêt : en attente des missions de la web (Ctrl-C pour arrêter)…", flush=True)
    print(f"Veille des mises à jour : un tour toutes les {veille.INTERVALLE_S} s (D-43).", flush=True)
    pause, prochaine_veille = 2, 0.0
    while True:
        try:
            if time.monotonic() >= prochaine_veille:
                prochaine_veille = time.monotonic() + veille.INTERVALLE_S
                try:
                    veille.observer(base, journal=lambda m: print(f"{time.strftime('%H:%M:%S')} {m}", flush=True))
                except Exception as erreur:  # un tour de veille raté n'arrête jamais le traitement des missions
                    print(f"Veille interrompue ({erreur.__class__.__name__}) : nouvel essai au prochain tour.", flush=True)
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
