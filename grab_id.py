"""Utilitaire ponctuel : récupérer via l'agent H un identifiant de candidature du compte donné.
Usage : python grab_id.py cadence A
"""
import datetime as dt, sys

from hai_agents import Client
from pydantic import BaseModel

from config import PREFIXE, bornes, cibles, coffres, mesurer, overrides  # config charge .env


class Cand(BaseModel):
    url_detail: str
    entreprise: str


def main(cible, lettre):
    c = cibles()[cible]
    co = coffres()[cible]
    compte = c["comptes"][lettre]
    consigne = (
        f"Connecte-toi à {c['url']} avec le compte {compte['email']} (remplissage sécurisé) et vérifie que tu es "
        f"connecté. Va sur la page Candidatures (liste). Ton but : OUVRIR UNE candidature précise pour obtenir "
        f"l'adresse de sa page de détail, qui doit ressembler à {c['url']}/candidatures/<identifiant>.\n"
        f"Procédure : 1) clique sur la ligne d'une candidature (le nom de l'entreprise). 2) Regarde la barre "
        f"d'adresse : si l'URL a changé et contient un identifiant après /candidatures/, c'est bon. 3) Sinon, un "
        f"lien de détail est apparu : clique dessus pour ouvrir la page de la candidature. 4) Vérifie que la page "
        f"affiche bien le détail d'UNE candidature (entreprise, poste, étape), pas la liste.\n"
        f"Renvoie l'URL EXACTE de la barre d'adresse (elle DOIT contenir un identifiant après /candidatures/ et ne "
        f"doit PAS être .../candidatures tout court) et le nom de l'entreprise affichée. "
        f"Lecture seule : ne clique sur aucun bouton d'action (étoile, modifier, enregistrer, supprimer).")
    cl = Client()
    debut = dt.datetime.now()
    r = cl.run_session(agent=f"{PREFIXE}-explorateur", messages=consigne, answer_schema=Cand,
                       overrides=overrides(c["page_connexion"], co[lettre]), **bornes(cl, 25, 240))
    print("STATUT:", r.status)
    ans = r.answer.model_dump() if r.answer is not None and hasattr(r.answer, "model_dump") else r.answer
    print("ANSWER:", ans)
    url = (ans or {}).get("url_detail", "") if isinstance(ans, dict) else ""
    import re
    ok = bool(re.search(r"/candidatures/[^/?#]{6,}", url))
    print("CAPTURE_ID:", "OK — identifiant capturé" if ok else "ÉCHEC — pas d'identifiant dans l'URL (l'agent est resté sur la liste)")
    mesurer(r.id, debut, c["nom"], f"{PREFIXE}-explorateur", lettre, r.status, note="grab id candidature")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
