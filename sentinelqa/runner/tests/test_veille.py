"""La veille des mises à jour : une empreinte stable, et une mission QA seulement quand le site a vraiment changé."""

import itertools
import sys
import unittest
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qa_moteur
import veille


def page(build, titre="Bachelor IA"):
    """Une page Next.js : sa compilation, ses ressources, ses titres, et un script anti-cache qui change à chaque requête."""
    jeton = next(COMPTEUR)
    return (f'<html><head><link rel="stylesheet" href="/_next/static/css/a1b2.css">'
            f'<script src="/_next/static/{build}/_buildManifest.js"></script>'
            f'<script src="https://analytics.example/tag.js?v={jeton}"></script></head>'
            f'<body><h1>{titre}</h1><h2>Admissions</h2><p>Visiteurs en ligne : {jeton}</p></body></html>')


COMPTEUR = itertools.count()


class FauxSite:
    """Un site dont on choisit la version ; « panne » renvoie une erreur 503."""

    def __init__(self):
        self.build, self.titre, self.panne = "build-1", "Bachelor IA", False

    def transport(self):
        def repondre(requete):
            if self.panne:
                return httpx.Response(503, text="indisponible")
            return httpx.Response(200, text=page(self.build, self.titre), headers={"content-type": "text/html"})
        return httpx.MockTransport(repondre)


class FausseBase:
    def __init__(self, applications):
        self.applications = {a["id"]: dict(a) for a in applications}
        self.missions = []

    def lire(self, table, **filtres):
        if table == "applications":
            return [dict(a) for a in self.applications.values() if a.get("observation_active")]
        if table == "qa_missions":
            cible = filtres.get("cible", "").removeprefix("eq.")
            return [m for m in self.missions if m["statut"] == "en_attente" and m["cible"] == cible]
        raise AssertionError(table)

    def modifier(self, table, valeurs, **filtres):
        assert table == "applications"
        self.applications[filtres["id"].removeprefix("eq.")].update(valeurs)
        return [valeurs]

    def ajouter(self, table, ligne):
        assert table == "qa_missions"
        mission = {"id": f"m{len(self.missions) + 1}", "statut": "en_attente", **ligne}
        self.missions.append(mission)
        return mission


def application(id_, cible=None):
    return {"id": id_, "nom": id_, "cible_qa": cible or id_, "observation_active": True, "observation_empreinte": None,
            "observation_detail": None}


class VeilleTest(unittest.TestCase):
    def setUp(self):
        self.site, self.fil = FauxSite(), []
        self.base = FausseBase([application("eugenia-public")])

    def tour(self):
        return veille.observer(self.base, journal=self.fil.append, transport=self.site.transport())

    def test_l_empreinte_ignore_ce_qui_change_a_chaque_requete(self):
        premiere = veille.relever("https://www.eugeniaschool.com/", self.site.transport())
        seconde = veille.relever("https://www.eugeniaschool.com/", self.site.transport())
        self.assertEqual(premiere[0], seconde[0])  # le script anti-cache et le compteur n'y entrent pas
        self.assertEqual(premiere[1]["build"], "build-1")
        self.assertEqual((premiere[1]["ressources"], premiere[1]["titres"]), (2, 2))

    def test_premier_releve_puis_aucun_changement_puis_une_mise_en_ligne(self):
        self.assertEqual(self.tour(), [])  # empreinte initiale : pas de mission
        self.assertIn("empreinte initiale", self.fil[-1])
        self.assertEqual(self.tour(), [])  # rien n'a changé
        self.site.build = "build-2"
        self.assertEqual(self.tour(), ["m1"])
        demande = self.base.missions[0]["demande"]
        self.assertEqual((demande["pilotage"], demande["target_id"]), ("exploration", "eugenia-public"))
        self.assertTrue(demande["instruction"].startswith("Mise à jour détectée (nouvelle compilation)"))
        qa_moteur.valider_mission(demande)  # la mission créée passe la validation du moteur QA
        self.assertIsNotNone(self.base.applications["eugenia-public"]["mise_a_jour_le"])
        self.assertEqual(self.tour(), [])  # la nouvelle version est désormais la référence

    def test_un_titre_modifie_compte_comme_une_mise_a_jour(self):
        self.tour()
        self.site.titre = "Bachelor IA & Business"
        self.assertEqual(self.tour(), ["m1"])
        self.assertIn("titres de la page modifiés", self.base.missions[0]["demande"]["instruction"])

    def test_pas_de_seconde_mission_si_une_exploration_attend_deja(self):
        self.tour()
        self.site.build = "build-2"
        self.tour()
        self.site.build = "build-3"
        self.assertEqual(self.tour(), [])
        self.assertEqual(len(self.base.missions), 1)
        self.assertIn("attend déjà", self.fil[-1])

    def test_une_panne_ne_vaut_ni_changement_ni_mission(self):
        self.tour()
        connue = self.base.applications["eugenia-public"]["observation_empreinte"]
        self.site.panne = True
        self.assertEqual(self.tour(), [])
        self.assertEqual(self.base.applications["eugenia-public"]["observation_empreinte"], connue)
        self.assertIn("lecture impossible", self.fil[-1])

    def test_l_identifiant_de_compilation_de_l_app_router(self):
        rendu = lambda build: ('<html><head><script src="/_next/static/chunks/main-1.js"></script></head><body><h1>Console</h1>'
                               '<script>self.__next_f.push([1,"0:{\\"b\\":\\"' + build + '\\",\\"c\\":[]}"])</script></body></html>')
        self.assertEqual(veille.lecture(rendu("5vWPIpZhlRR1vG6Jvc9K7"), "https://x.test/")["build"], "5vWPIpZhlRR1vG6Jvc9K7")
        avant = veille.empreinte(veille.lecture(rendu("ancien-build-01"), "https://x.test/"), veille.lecture(rendu("ancien-build-01"), "https://x.test/"))
        apres = veille.empreinte(veille.lecture(rendu("nouveau-build-02"), "https://x.test/"), veille.lecture(rendu("nouveau-build-02"), "https://x.test/"))
        self.assertNotEqual(avant[0], apres[0])  # même code côté navigateur, nouvelle compilation : la veille la voit
        self.assertEqual(veille.ce_qui_change(avant[1], apres[1]), "nouvelle compilation")

    def test_un_site_a_compte_est_signale_sans_mission(self):
        base = FausseBase([application("peer-review")])
        veille.observer(base, journal=self.fil.append, transport=self.site.transport())
        self.site.build = "build-2"
        self.assertEqual(veille.observer(base, journal=self.fil.append, transport=self.site.transport()), [])
        self.assertIn("parcours connecté à relancer", self.fil[-1])
        self.assertEqual(base.missions, [])


if __name__ == "__main__":
    unittest.main()
