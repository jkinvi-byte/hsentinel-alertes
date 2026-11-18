"""Contrôles de résultat, de périmètre et d'arrêt, sans compte ni réseau externe."""
import copy
import gzip
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from missions import (CATALOGUE, Controle, Interruption, NavigateurH, Observation, evaluer_acces,
                      executer_mission, rapport_html, url_autorisee, valider_demande)


def demande(mode="qa", scenario=None):
    return {"target_id": "eugenia-public" if mode == "qa" else "peer-review", "mode": mode,
            "scenario_id": scenario or ("Q-PUB-01" if mode == "qa" else "S-PEER-01"), "instruction": ""}


class Browser:
    def __init__(self, url=None, blocked=False, observed=True):
        self.url, self.blocked, self.observed = url, blocked, observed
        self.sessions, self.calls = [], 0

    def observer(self, req, target, scenario, control, journal):
        self.calls += 1
        url = self.url or target["origin"] + (scenario.get("expected_path") or "/connexion")
        self.sessions.append({"session": "fake-h", "cout_dollars": 0.01, "steps": 3, "tokens": 42})
        return {"final_url": url, "visible_title": "Bachelor AI Applied to Business", "actions": ["Ouvrir le menu", "Ouvrir le Bachelor"],
                "observed_urls": [url] if self.observed else [], "blocked": self.blocked, "reason": "",
                "session": "fake-h", "replay": "https://platform.hcompany.ai/fake"}


class MissionsTest(unittest.TestCase):
    def run_mission(self, req, code=200, body="<h1>Bachelor</h1>", headers=None, browser=None, **options):
        self.calls = []
        def handle(request):
            self.calls.append(request)
            return httpx.Response(code, text=body, headers=headers or {"content-type": "text/html"})
        return executer_mission(req, browser or Browser(), transport=httpx.MockTransport(handle), **options)

    def test_qa_public_sans_compte_et_preuves(self):
        report = self.run_mission(demande())
        self.assertEqual(report["results"][0]["status"], "passed")
        self.assertEqual(len(self.calls), 1)
        self.assertEqual(self.calls[0].method, "GET")
        self.assertNotIn("cookie", self.calls[0].headers)
        self.assertNotIn("authorization", self.calls[0].headers)
        self.assertEqual({p["kind"] for p in report["evidence"]}, {"http", "browser"})
        self.assertEqual(report["cost_h"], 0.01)

    def test_qa_url_inventee_par_agent_ne_vaut_pas_preuve(self):
        report = self.run_mission(demande(), browser=Browser(observed=False))
        self.assertEqual(report["results"][0]["status"], "inconclusive")
        self.assertEqual(self.calls, [])

    def test_html_compresse_decode_une_seule_fois(self):
        transport = httpx.MockTransport(lambda req: httpx.Response(
            200, content=gzip.compress(b'<h1>Bachelor</h1>'),
            headers={'content-type': 'text/html', 'content-encoding': 'gzip'}))
        report = executer_mission(demande(), Browser(), transport=transport)
        self.assertEqual(report['results'][0]['status'], 'passed')

    def test_qa_titre_dans_menu_seul_ne_suffit_pas(self):
        report = self.run_mission(demande(), body="<nav>Bachelor</nav><h1>Accueil</h1>")
        self.assertEqual(report["results"][0]["status"], "inconclusive")

    def test_page_qa_http_error_et_erreur_reseau_distinctes(self):
        report = self.run_mission(demande(), code=500)
        self.assertEqual(report["results"][0]["status"], "failed")
        def timeout(req):
            raise httpx.ReadTimeout("ne pas publier cette chaîne")
        report = executer_mission(demande(), Browser(), transport=httpx.MockTransport(timeout))
        self.assertEqual(report["results"][0]["status"], "inconclusive")
        self.assertNotIn("ne pas publier", json.dumps(report))

    def test_redirection_connexion_constatee_sans_suivi_implicite(self):
        report = self.run_mission(demande("security"), code=307, headers={"location": "/connexion"})
        self.assertEqual(report["results"][0]["status"], "passed")
        self.assertIn("barrière", report["results"][0]["limitations"])
        self.assertEqual(len(self.calls), 1)
        self.assertNotIn("body", report["evidence"][0])

    def test_shell_200_404_et_500_ne_sont_pas_des_refus_prouves(self):
        for code in (200, 404, 500):
            with self.subTest(code=code):
                report = self.run_mission(demande("security"), code=code, body="<div id='app'></div>")
                self.assertEqual(report["results"][0]["status"], "inconclusive")

    def test_refus_http_401_et_403_sans_session(self):
        for code in (401, 403):
            with self.subTest(code=code):
                report = self.run_mission(demande("security"), code=code)
                self.assertEqual(report["results"][0]["status"], "passed")

    def test_redirection_hors_perimetre_non_suivie(self):
        report = self.run_mission(demande("security"), code=307, headers={"location": "https://evil.example/private"})
        self.assertEqual(report["results"][0]["reason_code"], "out_of_scope")
        self.assertEqual(len(self.calls), 1)

    def test_cible_inventee_et_elargissement_refuses(self):
        for d in ({**demande(), "target_id": "inconnu"}, {**demande(), "mode": "security"},
                  {**demande(), "ecriture_autorisee": True}, {**demande(), "cible": "http://localhost"}):
            with self.subTest(d=d), self.assertRaises(ValueError):
                valider_demande(d)

    def test_url_contournements(self):
        target = CATALOGUE["targets"][0]
        for url in ("https://www.eugeniaschool.com.evil.example/", "http://www.eugeniaschool.com/",
                    "https://user@www.eugeniaschool.com/", "//localhost/", "/api/delete", "/?action=delete",
                    "/programme/%2e%2e/admin", "/\\evil.example", "https://www.eugeniaschool.com:443/"):
            with self.subTest(url=url), self.assertRaises(Interruption):
                url_autorisee(target, url)

    def test_prerequis_manquants_sans_appel(self):
        browser = Browser()
        report = self.run_mission(demande("security", "S-PEER-02"), browser=browser)
        self.assertEqual(report["results"][0]["status"], "skipped")
        self.assertEqual(report["summary"]["skipped"], 1)
        self.assertEqual(browser.calls, 0)
        self.assertEqual(self.calls, [])

    def test_arret_avant_execution_sans_appel(self):
        browser = Browser()
        report = self.run_mission(demande("security"), browser=browser, arret=lambda: True)
        self.assertEqual(report["results"][0]["reason_code"], "cancelled")
        self.assertEqual(browser.calls, 0)
        self.assertEqual(self.calls, [])

    def test_preuves_conservees_si_agent_echoue(self):
        browser = Browser()
        browser.observer = lambda *a: (_ for _ in ()).throw(RuntimeError("erreur avec secret"))
        report = self.run_mission(demande("security"), code=307, headers={"location": "/connexion"}, browser=browser)
        self.assertEqual(report["results"][0]["status"], "inconclusive")
        self.assertEqual(len(report["evidence"]), 1)
        self.assertNotIn("erreur avec secret", json.dumps(report))

    def test_volume_reponse_borne(self):
        report = self.run_mission(demande("security"), body="x" * 1000001)
        self.assertEqual(report["results"][0]["reason_code"], "response_too_large")

    def test_rapport_html_echappe_texte(self):
        report = self.run_mission({**demande(), "instruction": "<script>alert(1)</script>"})
        self.assertNotIn("<script>", rapport_html(report))


class AccessTest(unittest.TestCase):
    def check(self, positive, negative, **options):
        return evaluer_acces(positive, negative, identites_verifiees=options.get("identites", True),
                            regle_connue=True, marqueur="DONNEE-TEMOIN-42")

    def test_fuite_et_refus_prouves(self):
        a = httpx.Response(200, text="DONNEE-TEMOIN-42")
        self.assertEqual(self.check(a, httpx.Response(200, text="DONNEE-TEMOIN-42"))[0], "failed")
        self.assertEqual(self.check(a, httpx.Response(403))[0], "passed")

    def test_coquilles_identiques_session_expiree_controle_positif_absent(self):
        a = httpx.Response(200, text="DONNEE-TEMOIN-42")
        for b in (httpx.Response(200, text="coquille"), httpx.Response(401), httpx.Response(500)):
            self.assertEqual(self.check(a, b)[0], "inconclusive")
        self.assertEqual(self.check(httpx.Response(200, text="coquille"), httpx.Response(403))[0], "inconclusive")
        self.assertEqual(self.check(a, httpx.Response(403), identites=False)[0], "inconclusive")


class HandleTest(unittest.TestCase):
    def test_annulation_effective_de_session_h(self):
        calls = []
        handle = SimpleNamespace(id="fake", get=lambda: SimpleNamespace(agent_view_url="https://platform.hcompany.ai/fake"),
                                 cancel=lambda: calls.append("cancel"), changes=lambda **k: None)
        def status():
            calls.append("status")
            return SimpleNamespace(status="running")
        handle.status = status
        client = SimpleNamespace(start_session=lambda **k: handle)
        controle = Controle(60, arret=lambda: "status" in calls)
        browser = NavigateurH(client)
        req, target, scenario = valider_demande(demande())
        agent = {"name": "sentinelqa-qa", "reference": "sentinelqa-qa:1", "revision": 1, "action": "à jour"}
        with patch('missions.time.sleep'), patch('agents_missions.assurer_agent_mission', return_value=agent), self.assertRaises(Interruption):
            browser.observer(req, target, scenario, controle, lambda *a, **k: None)
        self.assertEqual(calls.count("cancel"), 1)
        self.assertEqual(browser.sessions[0]["statut"], "interrupted")

    def test_session_reference_le_catalogue_pour_les_deux_volets(self):
        from agents_missions import NOMS
        for mode, nom in NOMS.items():
            with self.subTest(mode=mode):
                calls = []
                handle = SimpleNamespace(
                    id="fake", get=lambda: SimpleNamespace(agent_view_url=None),
                    cancel=lambda: None, changes=lambda **k: None,
                    status=lambda: SimpleNamespace(status="awaiting_approval"))
                def start(**kwargs):
                    calls.append(kwargs)
                    return handle
                client = SimpleNamespace(start_session=start)
                req, target, scenario = valider_demande(demande(mode))
                agent = {"name": nom, "reference": nom + ":3", "revision": 3, "action": "à jour"}
                with patch('agents_missions.assurer_agent_mission', return_value=agent) as register, self.assertRaises(Interruption):
                    NavigateurH(client).observer(req, target, scenario, Controle(60), lambda *a, **k: None)
                register.assert_called_once_with(client, mode)
                self.assertEqual(calls[0]["agent"], nom + ":3")
                self.assertEqual(calls[0]["overrides"], {"agent.environments[kind=web].start_url": target["entry_url"]})
                self.assertEqual(calls[0]["answer_schema"], Observation)
                self.assertNotIn("password", calls[0]["messages"])


class QueueTest(unittest.TestCase):
    def test_demande_sans_secret_traverse_le_worker_et_ecrit_rapport(self):
        import sentinelqa
        req = demande()
        row = {"id": "local-test", "application": "Eugenia", "cible": CATALOGUE["targets"][0]["entry_url"],
               "comptes": [], "ecriture_autorisee": False, "secrets_chiffres": None,
               "rapport": {"schema_version": 2, "phase": "queued", "request": req}}
        updates = []
        base = SimpleNamespace(lire=lambda *a, **k: [], ajouter=lambda *a, **k: None,
                               modifier=lambda table, value, **k: updates.append(value))
        actual = sentinelqa.executer_mission
        transport = httpx.MockTransport(lambda r: httpx.Response(200, text="<h1>Bachelor</h1>", headers={"content-type": "text/html"}))
        with tempfile.TemporaryDirectory() as directory, patch.object(sentinelqa, 'ICI', Path(directory) / 'runner'), \
                patch.object(sentinelqa, 'NavigateurH', return_value=Browser()), \
                patch.object(sentinelqa, 'dechiffrer', side_effect=AssertionError('ne pas déchiffrer')), \
                patch.object(sentinelqa, 'executer_mission', side_effect=lambda *a, **k: actual(*a, **k, transport=transport)):
            sentinelqa.traiter_demande(base, None, copy.deepcopy(row))
            files = list((Path(directory) / 'rapports').glob('*.json'))
            self.assertEqual(len(files), 1)
            self.assertEqual(json.loads(files[0].read_text())["summary"]["passed"], 1)
        self.assertTrue(any(u.get("statut") == "termine" for u in updates))
        self.assertEqual(updates[-1], {"secrets_chiffres": None})


if __name__ == '__main__':
    unittest.main()
