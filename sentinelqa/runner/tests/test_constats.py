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


RAPPORT_QA = {
    "request": {"target_id": "eugenia-public"}, "started_at": "2026-11-19T03:30:00+00:00",
    "sessions": [{"session": "s-qa"}],
    "results": [
        {"id": "C1", "type": "texte", "status": "failed", "reason_code": "text_missing", "attendu": "Bac+5",
         "chemin": "/programme/bachelor-ia-business", "observe": "Le texte attendu n'est pas sur la page servie.", "preuves": ["obs-3", "http-1"]},
        {"id": "A1", "type": "auto", "status": "failed", "reason_code": "page_http_error", "chemin": "/", "observe": "HTTP 503.",
         "preuves": ["http-2"]},
        {"id": "L1", "type": "lien", "status": "failed", "reason_code": "broken_link", "chemin": "/ancienne-page", "observe": "HTTP 404."},
        {"id": "C2", "type": "page", "status": "passed", "chemin": "/programme"},
        {"id": "C3", "type": "constat", "status": "inconclusive", "reason_code": "agent_reported_gap"},
        {"id": "K2", "type": "identite", "status": "failed", "reason_code": "identity_missing"},
    ],
}


class EcartsEtMissionsTest(unittest.TestCase):
    def test_un_constat_par_ecart_prouve_par_le_code(self):
        lignes = constats.lignes_qa(RAPPORT_QA)
        self.assertEqual([(l["chemin"], l["gravite"], l["critere"]) for l in lignes],
                         [("/programme/bachelor-ia-business", "moyenne", "Texte attendu « Bac+5 » absent"),
                          ("/", "élevée", "Page en erreur"), ("/ancienne-page", "faible", "Lien cassé")])
        self.assertTrue(all(l["theme"] == "qa" and l["application_id"] == "eugenia-public" and l["donnees"] == [] for l in lignes))
        self.assertEqual([l["confirme_ecran"] for l in lignes], [True, False, False])  # une capture de l'agent sur la page en écart
        self.assertIn("**Vérification par le code :**", lignes[0]["preuve"])
        self.assertEqual(lignes[0]["audit_le"], "2026-11-19T03:30:00+00:00")

    def test_un_site_connecte_ne_recopie_jamais_le_texte_attendu(self):
        rapport = {**RAPPORT_QA, "request": {"target_id": "peer-review"},
                   "results": [{"id": "C1", "type": "texte", "status": "failed", "attendu": "Camille Martin", "chemin": "/etudiant"}]}
        ligne = constats.lignes_qa(rapport)[0]
        self.assertNotIn("Camille", json.dumps(ligne, ensure_ascii=False))
        self.assertRegex(ligne["critere"], r"^Texte attendu absent \(réf\. [0-9a-f]{8}\)$")
        self.assertEqual(ligne["critere"], constats.lignes_qa(rapport)[0]["critere"])  # stable : le même texte, le même ticket

    def test_cible_inconnue_et_mission_pentest(self):
        self.assertEqual(constats.lignes_qa({**RAPPORT_QA, "request": {"target_id": "cadence"}}), [])
        passe = {"request": {"target_id": "peer-review"}, "results": [{"scenario_id": "S-PEER-01", "status": "passed"}]}
        self.assertEqual(constats.lignes_mission(passe), [])
        # S-PEER-01 ne sait pas prouver une faille : même un « failed » inattendu ne devient pas un ticket.
        self.assertEqual(constats.lignes_mission({**passe, "results": [{"scenario_id": "S-PEER-01", "status": "failed"}]}), [])
        faille = {"request": {"target_id": "peer-review"}, "scope_snapshot": {"entry_url": "https://peer-review-black.vercel.app/etudiant"},
                  "results": [{"scenario_id": "S-PEER-02", "status": "failed", "reason_code": "protected_content_received"}]}
        ligne = constats.lignes_mission(faille, audit_id="a1")[0]
        self.assertEqual((ligne["theme"], ligne["gravite"], ligne["chemin"], ligne["audit_id"]), ("compte", "élevée", "/etudiant", "a1"))

    def test_publier_lignes(self):
        base = FakeBase()
        self.assertEqual(constats.publier_lignes(base, constats.lignes_qa(RAPPORT_QA)), ["c1", "c2", "c3"])


RAPPORT_SCAN = {
    "request": {"target_id": "blackbox-local", "scenario_id": "S-GEN-ACTIVE-01"}, "started_at": "2026-11-19T05:50:00+00:00",
    "results": [
        {"id": "xss-op1-q", "status": "failed", "classification": "demonstrated_vulnerability", "reason_code": "reflected",
         "url": "http://127.0.0.1:8765/search?q=x", "observed": "La valeur témoin revient non échappée.", "evidence_references": ["browser-1"]},
        {"id": "sqli-op2-q", "status": "failed", "classification": "demonstrated_vulnerability", "reason_code": "differential",
         "url": "http://127.0.0.1:8765/rest/products/search?q=x", "observed": "Réponse différentielle."},
        {"id": "private-1", "status": "failed", "classification": "demonstrated_vulnerability",
         "reason_code": "protected_content_received", "url": "http://127.0.0.1:8765/private/known"},
        {"id": "zap-1", "status": "failed", "classification": "tool_candidate", "reason_code": "zap_alert"},
        {"id": "headers", "status": "failed", "classification": "configuration_weakness", "reason_code": "missing_security_headers"},
        {"id": "private-2", "status": "passed", "classification": "demonstrated_vulnerability", "reason_code": "anonymous_denied"},
    ],
}


class ScannerTest(unittest.TestCase):
    def test_seules_les_failles_demontrees_deviennent_des_constats(self):
        lignes = constats.lignes_scan(RAPPORT_SCAN)
        self.assertEqual([(l["chemin"], l["gravite"], l["critere"]) for l in lignes],
                         [("/search", "élevée", "XSS réfléchi (paramètre q)"),
                          ("/rest/products/search", "critique", "Injection SQL (paramètre q)"),
                          ("/private/known", "élevée", "Ressource privée lisible sans session")])
        self.assertTrue(all(l["theme"] == "http" and l["application_id"] == "blackbox-local" for l in lignes))
        self.assertEqual([l["confirme_ecran"] for l in lignes], [True, False, False])
        self.assertNotIn("?q=", json.dumps(lignes))  # le chemin seul : ni paramètre, ni charge injectée

    def test_une_cible_inconnue_ne_donne_rien(self):
        self.assertEqual(constats.lignes_scan({**RAPPORT_SCAN, "request": {"target_id": "juice-shop-local"}}), [])


if __name__ == "__main__":
    unittest.main()
