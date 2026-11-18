"""Les constats publiés pour W3 : seulement les failles prouvées, et jamais de donnée de l'application testée."""

import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import constats

RAPPORT = {
    "application": "Paie Express", "date": "17/11/2026 08:51",
    "preuves": [
        {"theme": "lecture", "chemin": "/fiches-de-paie/1041", "type": "Fiche de paie n° 1041 - Léa Fontaine", "similarite": 1.0,
         "prouvee": True, "session": "dd3568d9", "replay": "https://platform.hcompany.ai/agents/sessions/dd3568d9",
         "constat": {"confirme": True, "proprietaire": "Alpha Conseil", "ce_qui_est_visible": "Salaire brut : 4 850,00 €"},
         "gravite": {"niveau": "critique", "raisons": ["une autre entreprise peut lire ces données",
                                                       "données financières personnelles : salaires"], "donnees": ["salaires"]}},
        {"theme": "ecriture", "chemin": "/api/fiches-de-paie/1042", "similarite": 1.0, "prouvee": True, "marqueur": "SentinelQA-595970",
         "constat": {"confirme": True}, "gravite": {"niveau": "critique", "raisons": ["une autre entreprise peut modifier ces données"],
                                                    "donnees": ["salaires"]}},
        {"theme": "admin", "chemin": "/administration", "similarite": 0.97, "prouvee": True, "constat": {"confirme": False},
         "gravite": {"niveau": "élevée", "raisons": ["un salarié sans droits entre dans une partie réservée"], "donnees": ["droits d'accès"]}},
        {"theme": "lecture", "chemin": "/factures/12", "similarite": 0.4, "prouvee": False, "gravite": {"niveau": "moyenne"}},
    ],
}


class FakeBase:
    def __init__(self):
        self.lignes = []

    def ajouter(self, table, ligne):
        assert table == "constats"
        self.lignes.append(ligne)
        return {"id": f"c{len(self.lignes)}", **ligne}


class ConstatsTest(unittest.TestCase):
    def test_seules_les_failles_prouvees_deviennent_des_constats(self):
        lignes = constats.lignes_constats(RAPPORT, audit_id="a1", version="abc1234")
        self.assertEqual([(l["theme"], l["methode"], l["chemin"]) for l in lignes],
                         [("lecture", "GET", "/fiches-de-paie/1041"), ("ecriture", "POST", "/api/fiches-de-paie/1042"),
                          ("admin", "GET", "/administration")])
        premiere = lignes[0]
        self.assertEqual((premiere["application_id"], premiere["audit_id"], premiere["version"]), ("paie-express", "a1", "abc1234"))
        self.assertEqual((premiere["gravite"], premiere["donnees"], premiere["similarite"], premiere["confirme_ecran"]),
                         ("critique", ["salaires"], 1.0, True))
        self.assertEqual(premiere["audit_le"], "2026-11-17T08:51:00+01:00")  # l'heure de Paris, avec son fuseau
        self.assertEqual(lignes[1]["piste"], constats.PISTES["ecriture"])
        self.assertFalse(lignes[2]["confirme_ecran"])

    def test_aucune_donnee_de_l_application_testee(self):
        texte = json.dumps(constats.lignes_constats(RAPPORT), ensure_ascii=False)
        for interdit in ("Léa Fontaine", "Alpha Conseil", "4 850", "SentinelQA-595970", "platform.hcompany.ai", "Fiche de paie n°"):
            self.assertNotIn(interdit, texte)

    def test_application_inconnue_ou_date_illisible(self):
        self.assertEqual(constats.lignes_constats({**RAPPORT, "application": "Inconnue"}), [])
        self.assertNotIn("audit_le", constats.lignes_constats({**RAPPORT, "date": "hier"})[0])  # la base met alors l'heure d'insertion

    def test_publier_ecrit_chaque_constat_et_respecte_la_limite(self):
        base = FakeBase()
        self.assertEqual(constats.publier(base, RAPPORT, limite=1), ["c1"])
        self.assertEqual(len(base.lignes), 1)
        self.assertEqual(constats.publier(FakeBase(), RAPPORT), ["c1", "c2", "c3"])

    def test_une_alerte_qui_echoue_ne_fait_jamais_echouer_l_audit(self):
        import sentinelqa

        class BaseSansTable:
            def ajouter(self, table, ligne):
                raise RuntimeError("relation constats absente")  # le SQL des alertes n'est pas encore appliqué

        sentinelqa.publier_constats(BaseSansTable(), RAPPORT, "a1")  # aucune exception ne remonte


if __name__ == "__main__":
    unittest.main()
