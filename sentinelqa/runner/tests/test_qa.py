"""Le volet QA sans réseau : l'agent H simulé, des pages servies simulées, et les vrais événements d'une session
(tests/fixtures/session-bachelor.json : accueil Eugenia → Programmes → Bachelor, le 18/11 à 6 h 33)."""

import copy
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace

import httpx
from hai_agents.core.api_error import ApiError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qa_agent
import qa_moteur
from qa_moteur import Controle, Lectures, chemin_cible, executer_qa, lire_trajectoire, retrouver, valider_mission, verifier

FIXTURE = json.loads((Path(__file__).parent / "fixtures" / "session-bachelor.json").read_text())
CIBLE = qa_moteur.trouver_cible("eugenia-public")
MENU = "<nav><a href='/processus-admission'>Processus d'admission <span>4 étapes, hors Parcoursup</span></a></nav>"
BACHELOR = ("<html><body>" + MENU + "<main><div>Bachelor · Bac+3</div><h1>Bachelor<br><em>AI Applied to Business</em></h1>"
            "<p>L'entrepreneuriat, l'IA et l'automatisation te branchent ? Eugenia est l'école IA, tech et growth, hors Parcoursup, "
            "où tu construis ta trajectoire : un projet déployé dès le semestre 1, des hackathons avec des entreprises, un diplôme "
            "reconnu par l'État. Trois années pour apprendre à concevoir, déployer et vendre des solutions d'intelligence artificielle "
            "au service des entreprises, avec une alternance possible en troisième année.</p>"
            "<a href='/candidature'>Candidater →</a></main><footer>Mentions légales</footer></body></html>")
ACCUEIL = "<html><body><h1>L’école de l’IA<br>appliquée au business.</h1><a href='/programme/bachelor-ia-business'>Bachelor</a></body></html>"


def transport(pages):
    """Un site simulé : chemin → (statut, HTML). Toute autre adresse répond 404."""
    def repondre(request):
        statut, corps = pages.get(request.url.path, (404, "<h1>Page introuvable</h1>"))
        return httpx.Response(statut, headers={"content-type": "text/html; charset=utf-8"}, text=corps)
    return httpx.MockTransport(repondre)


def mission(criteres, pilotage="guide"):
    plan = {"titre": "Essai", "etapes": ["Ouvrir le menu"], "criteres": criteres} if pilotage == "guide" else None
    return valider_mission({"schema_version": 3, "mode": "qa", "target_id": "eugenia-public", "pilotage": pilotage,
                            "instruction": "Essai", "plan": plan})[0]


class CatalogueH:
    """Le catalogue d'agents H simulé : comme le vrai, il renvoie ses valeurs par défaut en toutes lettres."""

    def __init__(self, derive=False, refus=None):
        self.agents, self.appels, self.derive, self.refus = {}, [], derive, refus

    def _complet(self, spec):
        spec = copy.deepcopy(spec)
        for env in spec.get("environments", []):
            env.setdefault("headless", False)
            env.setdefault("lazy", False)
            env.setdefault("settle_s", 1.0)
            env["mode"].setdefault("markdown", False)
        if self.derive:  # un serveur qui n'enregistre pas ce qu'on lui envoie
            spec["instructions"] = "autre chose"
        return spec

    def get_agent(self, nom):
        self.appels.append(("GET", nom))
        if self.refus:
            raise ApiError(status_code=self.refus, body={"detail": "refus"})
        if nom not in self.agents:
            raise ApiError(status_code=404, body={"detail": "absent"})
        return SimpleNamespace(model_dump=lambda: copy.deepcopy(self.agents[nom]))

    def create_agent(self, **spec):
        self.appels.append(("POST", spec["name"]))
        self.agents[spec["name"]] = self._complet(spec)

    def patch_agent(self, nom, **champs):
        self.appels.append(("PATCH", nom))
        self.agents[nom] = self._complet({**self.agents[nom], **champs, "name": nom})


class AgentQATest(unittest.TestCase):
    def test_creation_confirmee_malgre_les_valeurs_par_defaut_de_h(self):
        # Le bug du 18/11 à 6 h 29 : l'égalité stricte échouait toujours sur headless, lazy, settle_s et markdown.
        h = CatalogueH()
        self.assertEqual(qa_agent.assurer_agent(SimpleNamespace(agents=h))["action"], "créé")
        self.assertEqual(qa_agent.assurer_agent(SimpleNamespace(agents=h))["action"], "à jour")
        self.assertEqual([m for m, _ in h.appels].count("PATCH"), 0)

    def test_une_derive_est_corrigee_puis_une_derive_persistante_bloque(self):
        h = CatalogueH()
        qa_agent.assurer_agent(SimpleNamespace(agents=h))
        h.agents[qa_agent.NOM]["instructions"] = "ancienne consigne"
        self.assertEqual(qa_agent.assurer_agent(SimpleNamespace(agents=h))["action"], "mis à jour")
        h.agents[qa_agent.NOM]["instructions"] = "ancienne consigne"
        h.derive = True  # le serveur n'enregistre plus ce qu'on lui envoie
        with self.assertRaises(RuntimeError):
            qa_agent.assurer_agent(SimpleNamespace(agents=h))

    def test_un_coffre_herite_n_est_jamais_accepte(self):
        h = CatalogueH()
        qa_agent.assurer_agent(SimpleNamespace(agents=h))
        h.agents[qa_agent.NOM]["environments"][0]["vault_id"] = "coffre-ancien"
        self.assertEqual(qa_agent.assurer_agent(SimpleNamespace(agents=h))["action"], "mis à jour")
        self.assertFalse(h.agents[qa_agent.NOM]["environments"][0].get("vault_id"))

    def test_un_refus_ne_cree_jamais_d_agent(self):
        h = CatalogueH(refus=401)
        with self.assertRaises(ApiError):
            qa_agent.assurer_agent(SimpleNamespace(agents=h))
        self.assertNotIn("POST", [m for m, _ in h.appels])


class MissionTest(unittest.TestCase):
    def test_perimetre_des_adresses(self):
        self.assertEqual(chemin_cible(CIBLE, "https://www.eugeniaschool.com/programme/bachelor-ia-business/?x=1#a"),
                         "/programme/bachelor-ia-business")
        self.assertEqual(chemin_cible(CIBLE, "/contact"), "/contact")
        self.assertIsNone(chemin_cible(CIBLE, "https://eugeniaschool.com.evil.test/"))
        self.assertIsNone(chemin_cible(CIBLE, "https://user:pass@www.eugeniaschool.com/"))
        self.assertIsNone(chemin_cible(CIBLE, "https://www.google.com/"))

    def test_le_plan_est_revalide_et_renumerote(self):
        m = mission([{"type": "texte", "description": "Un texte sans valeur", "valeur": ""},
                     {"type": "page", "description": "Une page hors site", "valeur": "https://ailleurs.test/x"},
                     {"type": "page", "description": "Le Bachelor", "valeur": "https://www.eugeniaschool.com/programme/bachelor-ia-business"}])
        self.assertEqual([(c["id"], c["type"], c["valeur"]) for c in m["plan"]["criteres"]],
                         [("C1", "constat", ""), ("C2", "page", ""), ("C3", "page", "/programme/bachelor-ia-business")])

    def test_les_formes_inconnues_sont_refusees(self):
        base = {"schema_version": 3, "mode": "qa", "target_id": "eugenia-public", "pilotage": "guide", "instruction": "x",
                "plan": {"criteres": [{"type": "page", "description": "d", "valeur": "/"}]}}
        for defaut in ({"url": "https://ailleurs.test"}, {"pilotage": "pentest"}, {"target_id": "inconnue"}, {"plan": None},
                       {"modele_h": "gpt"}, {"instruction": "x" * 2001}):
            with self.assertRaises(ValueError, msg=defaut):
                valider_mission({**base, **defaut})
        with self.assertRaises(ValueError):
            valider_mission({**base, "plan": {"criteres": [{"type": "requete_sql", "description": "d"}]}})
        exploration = valider_mission({**base, "pilotage": "exploration", "plan": None})[0]
        self.assertIsNone(exploration["plan"])


class CitationTest(unittest.TestCase):
    def test_normalisation_et_correspondances(self):
        page = ["Bachelor · Bac+3\n\n*AI Applied to Business*", "L’école de l’IA appliquée au business."]
        self.assertEqual(retrouver("L'ECOLE DE L'IA", page), "exacte")
        self.assertEqual(retrouver("BACHELOR AI APPLIED TO BUSINESS", page), "approchee")
        self.assertIsNone(retrouver("Bachelor Master", page))  # deux mots : jamais d'approximation
        self.assertIsNone(retrouver("Master of Science en finance", page))
        self.assertIsNone(retrouver("", page))

    def test_nombres_en_lettres(self):
        page = ["Quelles sont les étapes pour candidater ? Quatre étapes : l'envoi de la candidature, puis la décision finale."]
        self.assertEqual(retrouver("4 étapes", page), "exacte")
        self.assertIsNone(retrouver("3 étapes", page))
        self.assertEqual(retrouver("un bâtiment neuf", ["Un bâtiment neuf, livré en 2025"]), "exacte")  # « un » et « neuf » restent des mots

    def test_citation_assemblee_par_fragments(self):
        # Le cas réel du 18/11 à 7 h 06 : trois intitulés exacts, non contigus, assemblés par l'agent.
        page = ["01 Envoyez votre candidature Élève en terminale générale, avec ou sans spé maths… "
                "02 Interview avec un membre du jury d’Eugenia School Les candidats dont le profil… 03 Admission Si votre dévouement"]
        self.assertEqual(qa_moteur.retrouver_citation(
            "01 - Envoyez votre candidature / 02 - Interview avec un membre du jury d'Eugenia School / 03 - Admission", page), "par fragments")
        self.assertIsNone(qa_moteur.retrouver_citation("01 - Envoyez votre candidature / 04 - Inscription définitive", page))


class VerificationTest(unittest.TestCase):
    def verifier(self, criteres, reponse=None, pages=None, evenements=None):
        m = mission(criteres)
        obs, gestes, _ = lire_trajectoire(evenements or FIXTURE["evenements"])
        lectures = Lectures(CIBLE, Controle(30), transport(pages or {"/": (200, ACCUEIL), "/programme/bachelor-ia-business": (200, BACHELOR)}))
        try:
            return verifier(m, CIBLE, reponse if reponse is not None else FIXTURE["reponse"], obs, gestes, lectures)[0]
        finally:
            lectures.close()

    def test_les_deux_sens_de_chaque_regle(self):
        r = self.verifier([
            {"type": "page", "description": "Bachelor atteint", "valeur": "/programme/bachelor-ia-business"},
            {"type": "texte", "description": "Mention Bac+3", "valeur": "Bac+3"},
            {"type": "texte", "description": "Un texte absent", "valeur": "Doctorat en astrophysique"},
            {"type": "constat", "description": "Le titre du Bachelor est affiché", "valeur": ""},
        ])
        statuts = {x["id"]: (x["status"], x["verification"]) for x in r}
        self.assertEqual(statuts["C1"], ("passed", "code"))
        self.assertEqual(statuts["C2"], ("passed", "code"))
        self.assertEqual(statuts["C3"], ("failed", "code"))
        self.assertEqual(statuts["C4"][0], "inconclusive")  # C4 de l'agent n'existe pas : aucune citation

    def test_un_texte_present_seulement_dans_le_menu_n_est_pas_dans_la_page(self):
        r = self.verifier([{"type": "texte", "description": "Les 4 étapes", "valeur": "4 étapes"}])
        self.assertEqual((r[0]["status"], r[0]["reason_code"]), ("failed", "text_missing"))
        self.assertIn("que dans le menu", r[0]["observe"])

    def test_un_agent_qui_cite_un_equivalent_empeche_l_ecart(self):
        reponse = copy.deepcopy(FIXTURE["reponse"])
        reponse["criteres"] = [{"id": "C1", "statut": "conforme", "constat": "La page dit trois ans de formation.",
                                "url": "https://www.eugeniaschool.com/programme/bachelor-ia-business",
                                "citation": "Trois années pour apprendre à concevoir"}]
        r = self.verifier([{"type": "texte", "description": "La durée", "valeur": "3 ans de formation"}], reponse=reponse)
        self.assertEqual((r[0]["status"], r[0]["reason_code"]), ("inconclusive", "agent_disagrees"))

    def test_absence_sans_empreinte_reste_non_concluante(self):
        # La page servie ne ressemble pas à ce que le navigateur a vu (mur, page vide) : aucune absence n'est affirmée.
        r = self.verifier([{"type": "texte", "description": "Un texte absent", "valeur": "Doctorat"}],
                          pages={"/": (200, ACCUEIL), "/programme/bachelor-ia-business": (200, "<h1>Vérification en cours</h1>")})
        self.assertEqual(r[0]["status"], "inconclusive")

    def test_citation_de_l_agent(self):
        reponse = copy.deepcopy(FIXTURE["reponse"])
        reponse["criteres"] = [{**reponse["criteres"][1], "id": "C1"},
                               {**reponse["criteres"][1], "id": "C2", "citation": "Inscription au doctorat ouverte"},
                               {**reponse["criteres"][1], "id": "C3", "statut": "ecart"}]
        r = self.verifier([{"type": "constat", "description": f"Constat {i}", "valeur": ""} for i in range(3)], reponse=reponse)
        self.assertEqual([(x["status"], x["reason_code"]) for x in r[:3]],
                         [("passed", "citation_found"), ("inconclusive", "citation_not_found"), ("inconclusive", "agent_reported_gap")])

    def test_page_en_erreur_et_page_ouverte_par_son_adresse(self):
        r = self.verifier([{"type": "page", "description": "Bachelor", "valeur": "/programme/bachelor-ia-business"}],
                          pages={"/": (200, ACCUEIL), "/programme/bachelor-ia-business": (500, "<h1>Erreur</h1>")})
        self.assertEqual((r[0]["status"], r[0]["reason_code"]), ("failed", "page_http_error"))
        evenements = copy.deepcopy(FIXTURE["evenements"])
        for e in evenements:
            for req in (e["data"].get("tool_reqs") or []):
                if "Bachelor" in str(req["args"].get("element", "")):
                    req["tool_name"], req["args"] = "go_to_web", {"url": "https://www.eugeniaschool.com/programme/bachelor-ia-business"}
        r = self.verifier([{"type": "page", "description": "Bachelor", "valeur": "/programme/bachelor-ia-business"}], evenements=evenements)
        self.assertEqual((r[0]["status"], r[0]["reason_code"]), ("inconclusive", "reached_by_address"))

    def test_texte_anormal_releve_sans_l_agent(self):
        evenements = copy.deepcopy(FIXTURE["evenements"])
        derniere = [e for e in evenements if e["data"].get("kind") == "observation_event"][-1]
        derniere["data"]["metadata"]["text"] += "\nPrix : undefined €"
        r = self.verifier([{"type": "page", "description": "Bachelor", "valeur": "/programme/bachelor-ia-business"}], evenements=evenements)
        anormaux = [x for x in r if x["type"] == "texte_anormal"]
        self.assertEqual([(x["status"], x["chemin"]) for x in anormaux], [("failed", "/programme/bachelor-ia-business")])


class DifficulteTest(unittest.TestCase):
    def test_clics_repetes_sans_changer_de_page(self):
        obs = [{"i": 0, "url": "https://www.eugeniaschool.com/certification-architecte-ia", "texte": "", "titre": "", "image": None, "quand": None}]
        gestes = [{"i": i, "outil": "click_web", "args": {"element": e}, "pensee": "", "quand": None}
                  for i, e in enumerate(["L'ÉCOLE avec l'icône +", "Notre ADN - lien de sous-menu", "L'ÉCOLE texte", "Notre ADN lien",
                                         "L'ÉCOLE pour l'expandre", "Notre ADN"], 1)]
        d = qa_moteur.difficultes(CIBLE, obs, gestes)
        self.assertEqual(d, [{"chemin": "/certification-architecte-ia", "clics": 6,
                              "cibles": [("L'ÉCOLE avec l'icône +", 3), ("Notre ADN - lien de sous-menu", 3)]}])
        self.assertEqual(qa_moteur.difficultes(CIBLE, obs, gestes[:5]), [])  # cinq clics : en dessous du seuil

    def test_un_parcours_normal_n_est_pas_signale(self):
        obs, gestes = lire_trajectoire(FIXTURE["evenements"])[:2]
        self.assertEqual(qa_moteur.difficultes(CIBLE, obs, gestes), [])


class ClientH:
    """Un client H simulé qui rejoue les événements de la fixture, page par page."""

    def __init__(self, arret_au_tour=None):
        self.agents = CatalogueH()
        self.tours, self.arret_au_tour, self.annulee = 0, arret_au_tour, False
        evenements = [SimpleNamespace(model_dump=lambda mode=None, e=e: e) for e in FIXTURE["evenements"]]
        reponse = FIXTURE["reponse"]
        client = self

        class Sessions:
            def get_session_changes(self, sid, from_index=0, include_events=True, wait_for_seconds=0):
                client.tours += 1
                fin = from_index + 4
                statut = "idle" if fin >= len(evenements) else "running"
                return SimpleNamespace(status=statut, new_events=evenements[from_index:fin], first_index=from_index)

            def list_session_events(self, sid, page=1, size=100):
                items = [e.model_dump() for e in evenements] if page == 1 else []
                return SimpleNamespace(model_dump=lambda mode=None: {"items": items})

            def get_session(self, sid):
                return SimpleNamespace(status="interrupted" if client.annulee else "idle",
                                       latest_answer=None if client.annulee else reponse)

            def get_session_status(self, sid):
                return SimpleNamespace(steps=4, error_code=None, usage_per_model=[SimpleNamespace(
                    input_tokens=48730, cached_tokens=21120, output_tokens=1025, reasoning_tokens=349)])

            def cancel_session(self, sid):
                client.annulee = True

        self.sessions = Sessions()

    def start_session(self, **params):
        self.params = params
        return SimpleNamespace(id="session-test", get=lambda: SimpleNamespace(agent_view_url="https://platform.hcompany.ai/agents/sessions/session-test"))


class ExecutionTest(unittest.TestCase):
    DEMANDE = {"schema_version": 3, "mode": "qa", "target_id": "eugenia-public", "pilotage": "guide", "appareil": "mobile",
               "instruction": "Menu Programmes puis Bachelor", "source": "voix",
               "plan": {"titre": "Bachelor", "etapes": ["Ouvrir Programmes"],
                        "criteres": [{"type": "page", "description": "Bachelor atteint", "valeur": "/programme/bachelor-ia-business"},
                                     {"type": "texte", "description": "Bac+3", "valeur": "Bac+3"}]}}

    def test_mission_complete_avec_mesures_et_fil(self):
        client, fil = ClientH(), []
        rapport = executer_qa(self.DEMANDE, client, lambda m, t="info", **d: fil.append((t, m)),
                              transport=transport({"/": (200, ACCUEIL), "/programme/bachelor-ia-business": (200, BACHELOR)}))
        self.assertEqual(rapport["summary"]["passed"], 3)  # C1, C2 et le contrôle automatique de l'accueil
        self.assertEqual(rapport["sessions"][0]["cout_dollars"], 0.010967)  # arrondi au millionième de dollar
        self.assertEqual(rapport["summary_criteres"]["passed"], 2)  # C1 et C2 ; le contrôle automatique est compté à part
        self.assertEqual(rapport["sessions"][0]["tokens"]["entree"], 48730)
        self.assertEqual(client.params["overrides"]["agent.environments[kind=web].mode"]["width"], 390)  # mobile
        self.assertIn(("action", "Clic · Icône de menu hamburger (trois traits) en haut à droite"), fil)
        self.assertTrue(any(t == "page" for t, _ in fil))
        self.assertTrue(all(p["id"].startswith(("obs-", "http-")) for p in rapport["evidence"]))
        self.assertEqual(rapport["violations"], [])

    def test_arret_demande_annule_la_session_et_garde_les_preuves(self):
        client = ClientH()
        rapport = executer_qa(self.DEMANDE, client, arret=lambda: client.tours >= 1,
                              transport=transport({"/": (200, ACCUEIL), "/programme/bachelor-ia-business": (200, BACHELOR)}))
        self.assertTrue(client.annulee)
        self.assertEqual(rapport["interruption"], "cancelled")
        self.assertIn(rapport["results"][0]["status"], ("passed", "skipped"))  # jamais « écart » faute de preuve
        self.assertNotIn("failed", [r["status"] for r in rapport["results"]])


if __name__ == "__main__":
    unittest.main()
