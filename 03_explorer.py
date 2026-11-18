"""Lance l'Explorateur avec un compte, récupère une cartographie structurée et mesure la session.
Usage : python 03_explorer.py paie A    |   python 03_explorer.py juice A [--steps 45 --temps 300]
"""
import argparse, datetime as dt, json
from typing import Optional

from hai_agents import Client
from pydantic import BaseModel

from config import PREFIXE, RESULTATS, bornes, cibles, coffres, mesurer, overrides


class PageVue(BaseModel):
    url: str
    titre: str
    type_ressource: str
    identifiant: Optional[str] = None
    proprietaire_visible: Optional[str] = None


class Cartographie(BaseModel):
    compte_connecte: str
    pages: list[PageVue]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("cible"); p.add_argument("lettre")
    p.add_argument("--steps", type=int, default=45); p.add_argument("--temps", type=int, default=300)
    a = p.parse_args()

    c = cibles()[a.cible]
    compte = c["comptes"][a.lettre]
    consigne = (f"Application : {c['nom']}, à l'adresse {c['url']}. Tu es connecté en tant que {compte['email']} "
                f"({compte['role']}). Périmètre interdit : {', '.join(c['perimetre_interdit'])}. "
                f"Tu as au plus {a.steps} actions : cartographie l'essentiel, puis réponds.")
    agent = f"{PREFIXE}-explorateur"
    client = Client()
    debut = dt.datetime.now()
    res = client.run_session(agent=agent, messages=consigne, answer_schema=Cartographie,
                             overrides=overrides(c["page_connexion"], coffres().get(a.cible, {}).get(a.lettre)),
                             **bornes(client, a.steps, a.temps))
    print(f"Statut : {res.status}")
    if res.answer is not None:
        carto = res.answer.model_dump() if hasattr(res.answer, "model_dump") else res.answer
        f = RESULTATS / f"carto_{a.cible}_{a.lettre}_{debut:%H%M%S}.json"
        f.write_text(json.dumps(carto, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"{len(carto['pages'])} pages relevées → {f.name}")
    mesurer(res.id, debut, a.cible, agent, a.lettre, res.status)


if __name__ == "__main__":
    main()
