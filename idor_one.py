"""Test IDOR ponctuel : faire ouvrir par le compte <intrus> l'URL exacte d'un objet d'un autre compte.
Usage : python idor_one.py cadence A "https://.../candidatures/<id-de-B>"
L'agent H (intrus) se connecte via son coffre, ouvre l'URL et décrit ce qu'il voit. Lecture seule.
"""
import datetime as dt, sys

from hai_agents import Client
from pydantic import BaseModel

from config import PREFIXE, bornes, cibles, coffres, mesurer, overrides


class Vue(BaseModel):
    acces_refuse: bool
    entreprise_ou_titre_vu: str
    texte_visible: str


def main(cible, intrus, url):
    c = cibles()[cible]
    co = coffres()[cible]
    compte = c["comptes"][intrus]
    consigne = (f"Connecte-toi à {c['url']} avec {compte['email']} (remplissage sécurisé) et vérifie que tu es "
                f"connecté en tant que {compte['email']}. PUIS ouvre exactement cette adresse : {url} . "
                "Ne clique sur rien d'autre. Dis si l'accès est refusé ou donne une page 404 (acces_refuse), "
                "l'entreprise ou le titre affiché, et le texte visible. Lecture seule.")
    cl = Client()
    debut = dt.datetime.now()
    r = cl.run_session(agent=f"{PREFIXE}-verificateur", messages=consigne, answer_schema=Vue,
                       overrides=overrides(c["page_connexion"], co[intrus]), **bornes(cl, 15, 240))
    print("STATUT:", r.status)
    ans = r.answer.model_dump() if r.answer is not None and hasattr(r.answer, "model_dump") else r.answer
    print("ANSWER:", ans)
    print("REPLAY:", f"https://platform.hcompany.ai/agents/sessions/{r.id}")
    mesurer(r.id, debut, c["nom"], f"{PREFIXE}-verificateur", intrus, r.status, note="IDOR " + url)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
