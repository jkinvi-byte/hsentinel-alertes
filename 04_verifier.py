"""Le Vérificateur, connecté avec un AUTRE compte (B), ouvre les pages relevées pour A et décrit ce qu'il voit.
⚠️  C'est un test des agents, pas un verdict : chez HSentinel, une faille n'est prouvée qu'avec le rejeu HTTP
(code d'Aurian) PUIS cette preuve à l'écran (règle D-05).
Usage : python 04_verifier.py paie B resultats/carto_paie_A_xxxx.json [--max 5]
"""
import argparse, datetime as dt, json, pathlib

from hai_agents import Client
from pydantic import BaseModel

from config import PREFIXE, RESULTATS, bornes, cibles, coffres, mesurer, overrides


# Format imposé par l'architecture (07 §3.1) : le Vérificateur confirme ou non, décrit, nomme le propriétaire.
class Constat(BaseModel):
    confirme: bool
    ce_qui_est_visible: str
    proprietaire: str


def main():
    p = argparse.ArgumentParser()
    p.add_argument("cible"); p.add_argument("lettre"); p.add_argument("carto")
    p.add_argument("--max", type=int, default=5)
    a = p.parse_args()

    c = cibles()[a.cible]
    compte = c["comptes"][a.lettre]
    pages = json.loads(pathlib.Path(a.carto).read_text(encoding="utf-8"))["pages"][: a.max]
    agent = f"{PREFIXE}-verificateur"
    client = Client()
    constats = []
    for page in pages:
        consigne = (f"Tu es connecté en tant que {compte['email']} ({compte['role']}). "
                    f"Ouvre exactement cette adresse : {page['url']} . Ne clique sur rien d'autre, puis décris la page.")
        debut = dt.datetime.now()
        res = client.run_session(agent=agent, messages=consigne, answer_schema=Constat,
                                 overrides=overrides(c["page_connexion"], coffres().get(a.cible, {}).get(a.lettre)),
                                 **bornes(client, 15, 300))
        rep = res.answer.model_dump() if res.answer is not None and hasattr(res.answer, "model_dump") else res.answer
        constats.append({"page_de_A": page, "constat": rep, "session": res.id, "statut": res.status})
        print(f"\n{page['url']}\n  {rep}")
        mesurer(res.id, debut, a.cible, agent, a.lettre, res.status, note=page["url"])
    f = RESULTATS / f"constats_{a.cible}_{a.lettre}_{dt.datetime.now():%H%M%S}.json"
    f.write_text(json.dumps(constats, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n→ {f.name}")


if __name__ == "__main__":
    main()
