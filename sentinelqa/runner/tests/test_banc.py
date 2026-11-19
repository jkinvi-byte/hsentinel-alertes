"""S-BANC-01 (D-46) : le banc lancé depuis la console, sans H ni réseau."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import constats
import sentinelqa
from missions import CATALOGUE, valider_demande

DEMANDE = {"target_id": "paie-express", "scenario_id": "S-BANC-01", "mode": "security", "instruction": ""}
BANC = next(t for t in CATALOGUE["targets"] if t["id"] == "paie-express")
PEER = next(t for t in CATALOGUE["targets"] if t["id"] == "peer-review")
# Un chemin réel par faille injectée, tiré de l'audit en ligne du 19/11 : chacun répond au motif de VERITE_TERRAIN.json.
CHEMINS = {"F1": ("lecture", "/fiches-de-paie/1041"), "F2": ("lecture", "/api/fiches-de-paie/1041"),
           "F3": ("lecture", "/salaries?entreprise=alpha"), "F4": ("ecriture", "/api/fiches-de-paie/1041"),
           "F5": ("admin", "/administration"), "F6": ("admin", "/fiches-de-paie/1042")}


def audit_du_banc(manquee=None, faux_positif=False):
    """Les données d'un audit du banc, comme les rend auditer() : une preuve par faille prouvée."""
    verite = json.loads(sentinelqa.VERITE_COBAYE.read_text())
    preuves = [{"theme": th, "chemin": ch, "prouvee": True, "http": 200, "session": f"s-{fid}",
                "gravite": {"niveau": "critique" if th == "lecture" else "élevée"}}
               for fid, (th, ch) in CHEMINS.items() if fid != manquee]
    if faux_positif:
        preuves.append({"theme": "lecture", "chemin": "/factures/FA-2026-031", "prouvee": True, "http": 200, "session": "s-fp"})
    score = sentinelqa.noter(verite, [{"theme": p["theme"], "chemin": p["chemin"]} for p in preuves] +
                             [{"theme": c["theme"], "chemin": ch} for c, ch in zip(verite["controles_sains"],
                              ("/factures/FA-2026-031", "/api/factures/FA-2026-031", "/administration/parametres", "/salaries"))],
                             preuves)
    return {"cible": BANC["entry_url"], "preuves": preuves, "score": score, "cout_dollars": 0.215, "cout_hf_dollars": None,
            "duree_totale_s": 283.0, "tokens_totaux": 1341448,
            "sessions": [{"role": "Compte A", "cible": "cartographie", "session": "s-a", "statut": "idle", "cout_dollars": 0.07, "replay": None}]}


class BancTest(unittest.TestCase):
    def test_le_catalogue_accepte_le_banc_et_lui_seul(self):
        mission, cible, scenario = valider_demande(DEMANDE)
        self.assertEqual((cible["id"], cible["business_writes"], scenario["assertion_type"]), ("paie-express", True, "idor_bench"))
        with self.assertRaises(ValueError):
            valider_demande({**DEMANDE, "target_id": "peer-review"})
        self.assertFalse(PEER["business_writes"])

    def test_la_garde_d_ecriture_dans_les_deux_sens(self):
        with patch.object(sentinelqa, "cle_api", side_effect=AssertionError("aucun appel H avant la garde")):
            with self.assertRaisesRegex(ValueError, "D-24"):
                sentinelqa.auditer(PEER["entry_url"], {}, sentinelqa.SANS_VERITE)
        with patch.object(sentinelqa, "cle_api", side_effect=RuntimeError("garde franchie")):
            with self.assertRaisesRegex(RuntimeError, "garde franchie"):
                sentinelqa.auditer(BANC["entry_url"], {}, sentinelqa.SANS_VERITE)
        with self.assertRaisesRegex(ValueError, "écritures de test"):
            sentinelqa.auditer_banc(DEMANDE, copy.deepcopy(PEER), {}, lambda: False)

    def test_six_failles_sur_six(self):
        mission, cible, scenario = valider_demande(DEMANDE)
        r = sentinelqa.rapport_banc(mission, cible, scenario, audit_du_banc(), "2026-11-19T06:00:00+01:00", 283.0)
        self.assertEqual(r["summary"], {"passed": 4, "failed": 6, "inconclusive": 0, "skipped": 0})
        self.assertEqual([x["id"] for x in r["results"]], ["F1", "F2", "F3", "F4", "F5", "F6", "C1", "C2", "C3", "C4"])
        f6 = next(x for x in r["results"] if x["id"] == "F6")
        self.assertEqual((f6["status"], f6["reason_code"], f6["type"]), ("failed", "vulnerability_proven", "admin"))
        self.assertIn("/fiches-de-paie/1042", f6["observed"])
        self.assertFalse(f6["description"].startswith("F6"))  # la console affiche l'id à côté : pas de « F6 F6 · »
        ecriture = next(e for e in r["evidence"] if e["titre"].startswith("Écriture"))
        self.assertIn("l'écriture de B est acceptée (HTTP 200) et visible chez A", ecriture["titre"])
        self.assertTrue(all(e in {p["id"] for p in r["evidence"]} for x in r["results"] for e in x["evidence_references"]))
        self.assertEqual((r["cost_h"], r["duration_s"], r["schema_version"], r["phase"]), (0.215, 283.0, 2, "completed"))
        self.assertEqual(r["request"], mission)
        self.assertIn("banc", r)

    def test_une_faille_manquee_et_un_faux_positif(self):
        mission, cible, scenario = valider_demande(DEMANDE)
        r = sentinelqa.rapport_banc(mission, cible, scenario, audit_du_banc(manquee="F3", faux_positif=True), "t", 1.0)
        self.assertEqual(r["summary"]["failed"], 5)  # le faux positif n'est jamais compté comme une faille
        f3 = next(x for x in r["results"] if x["id"] == "F3")
        self.assertEqual((f3["status"], f3["reason_code"]), ("inconclusive", "not_proven"))
        c1 = next(x for x in r["results"] if x["id"] == "C1")
        self.assertEqual((c1["status"], c1["reason_code"]), ("inconclusive", "false_positive"))
        self.assertTrue(c1["evidence_references"])

    def test_arret_avant_la_cartographie(self):
        mission, cible, scenario = valider_demande(DEMANDE)
        with patch.object(sentinelqa, "cle_api", return_value="k"), patch.object(sentinelqa, "Client", MagicMock()), \
                patch.object(sentinelqa, "assurer_agents", return_value={}), \
                patch.object(sentinelqa, "preparer_coffres", return_value={"A": "a", "B": "b", "C": "c"}), \
                patch.object(sentinelqa, "cartographier", side_effect=AssertionError("pas de cartographie après l'arrêt")):
            r = sentinelqa.auditer_banc(mission, cible, scenario, lambda: True)
        self.assertEqual((r["interruption"], r["summary"]["skipped"], r["results"][0]["reason_code"]), ("cancelled", 1, "cancelled"))
        self.assertNotIn("banc", r)

    def test_le_worker_lance_le_banc_et_publie_ses_constats(self):
        row = {"id": "a-banc", "application": BANC["name"], "cible": BANC["entry_url"], "comptes": [], "ecriture_autorisee": False,
               "secrets_chiffres": None, "rapport": {"schema_version": 2, "phase": "queued", "request": DEMANDE}}
        updates, publies = [], []
        base = SimpleNamespace(lire=lambda *a, **k: [], ajouter=lambda *a, **k: None,
                               modifier=lambda table, value, **k: updates.append(value))
        with tempfile.TemporaryDirectory() as dossier, patch.object(sentinelqa, "ecrire_rapport_local", return_value=Path(dossier) / "r.html"), \
                patch.object(sentinelqa, "auditer", side_effect=lambda *a, **k: audit_du_banc()) as auditer, \
                patch.object(sentinelqa, "executer_mission", side_effect=AssertionError("le banc ne passe pas par executer_mission")), \
                patch.object(sentinelqa, "publier_constats", side_effect=lambda b, d, i: publies.append(d)):
            sentinelqa.traiter_demande(base, None, copy.deepcopy(row))
        self.assertEqual(auditer.call_args.kwargs["ecriture"], True)
        self.assertTrue({"A", "B", "C"} <= set(auditer.call_args.args[1]))  # les comptes fictifs du banc, jamais ceux d'un site réel
        fini = next(u for u in updates if u.get("statut") == "termine")
        self.assertEqual(fini["rapport"]["summary"]["failed"], 6)
        self.assertEqual(publies[0]["application"], "Paie Express")
        self.assertEqual({l["application_id"] for l in constats.lignes_constats(publies[0], "a-banc", None)}, {"paie-express"})
        self.assertEqual(updates[-1], {"secrets_chiffres": None})

    def test_le_rapport_local_du_banc_est_le_rapport_detaille(self):
        mission, cible, scenario = valider_demande(DEMANDE)
        r = sentinelqa.rapport_banc(mission, cible, scenario, audit_du_banc(), "t", 1.0)
        with tempfile.TemporaryDirectory() as dossier, patch.object(sentinelqa, "ICI", Path(dossier) / "runner"), \
                patch.object(sentinelqa, "rapport_html", return_value="<html>banc</html>") as detaille:
            page = sentinelqa.ecrire_rapport_local(r)
            self.assertEqual(page.read_text(), "<html>banc</html>")
        detaille.assert_called_once_with(r["banc"])


if __name__ == "__main__":
    unittest.main()
