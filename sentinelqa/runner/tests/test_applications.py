"""D-56 : une application ajoutée par un client. Le runner la relit, refuse tout profil trafiqué ou non vérifié, ne lit
jamais une adresse privée, et verse le mot de passe d'un compte enregistré dans un coffre H propre à la mission."""

import json
import sys
import unittest

import httpx
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import applications
import qa_moteur
import qa_worker
from tests.test_qa import COFFRE, geste, vue
from tests.test_qa_worker import CLE, MOT_DE_PASSE, FauxClient, chiffrer_comme_le_navigateur

ORIGINE = "https://ardoise-demo.vercel.app"


def profil(**modifs):
    """Le profil que construit profilClient (web/lib/applications-contrat.mjs) pour une application connectée."""
    p = {"id": "ardoise-demo-vercel-app", "nom": "Ardoise", "origine": ORIGINE, "client": True, "entree": f"{ORIGINE}/connexion",
         "autorisation": "D-56 : contrôle du site prouvé", "consultation_seule": True, "connexion": {"chemin": "/connexion"},
         "chemins_exclus": ["/api", "/logout", "/log-out", "/signout", "/sign-out", "/deconnexion"],
         "interdits": ["Consultation seule.", "Ne te déconnecte pas."],
         "limites": {"guide": {"max_steps": 30, "max_time_s": 300}, "exploration": {"max_steps": 40, "max_time_s": 420, "max_pages": 6},
                     "lectures_http": 30, "octets_par_lecture": 3000000}}
    p.update(modifs)
    return p


class BaseClient:
    """Supabase vu du runner : une application ajoutée et ses comptes de test."""

    def __init__(self, app=None, comptes=()):
        self.app, self.comptes = app, list(comptes)
        self.modifications, self.ajouts, self.lectures = [], [], []

    def lire(self, table, **filtres):
        self.lectures.append((table, filtres))
        if table == "applications":
            return [self.app] if self.app and filtres.get("id") == f"eq.{self.app['id']}" else []
        if table == "comptes_test":
            return [c for c in self.comptes if filtres.get("id") == f"eq.{c['id']}" and filtres.get("application_id") == f"eq.{c['application_id']}"]
        return [{"arret_demande": False}]

    def modifier(self, table, valeurs, **filtres):
        self.modifications.append((table, json.loads(json.dumps(valeurs)), filtres))
        return [valeurs]

    def ajouter(self, table, ligne):
        self.ajouts.append((table, ligne))
        return {"id": len(self.ajouts), **ligne}


COMPTE_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"


def application(**modifs):
    a = {"id": "ardoise-demo-vercel-app", "nom": "Ardoise", "autorisee": True, "verifiee_le": "2026-11-20T08:00:00Z", "profil_qa": profil()}
    a.update(modifs)
    return a


def compte(**modifs):
    c = {"id": COMPTE_ID, "application_id": "ardoise-demo-vercel-app", "libelle": "Compte A · gérante", "identifiant": "camille@ardoise.test",
         "secret_chiffre": chiffrer_comme_le_navigateur(json.dumps({"mot_de_passe": MOT_DE_PASSE})), "identite": ["Camille Martin"]}
    c.update(modifs)
    return c


def demande_client(**modifs):
    d = {"schema_version": 3, "mode": "qa", "target_id": "ardoise-demo-vercel-app", "pilotage": "guide", "appareil": "ordinateur",
         "instruction": "Vérifie la page Factures", "source": "texte", "modele_h": "holo4-35b-a3b", "preparation_humaine_s": None,
         "plan": {"titre": "Factures", "etapes": ["Ouvrir Factures"], "criteres": [{"id": "C1", "type": "constat", "description": "Liste", "valeur": ""}]},
         "compte_id": COMPTE_ID}
    d.update(modifs)
    return d


class AdressesTest(unittest.TestCase):
    def test_les_adresses_privees_et_reservees_sont_refusees(self):
        for ip in ("10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.5.4", "192.168.1.1", "100.64.0.1", "0.0.0.0", "::1",
                   "::ffff:127.0.0.1", "fd00::1", "fe80::1", "224.0.0.1", "pas-une-ip"):
            self.assertTrue(applications.adresse_privee(ip), ip)

    def test_les_adresses_publiques_passent(self):
        for ip in ("8.8.8.8", "76.76.21.21", "2606:4700::6810:84e5"):
            self.assertFalse(applications.adresse_privee(ip), ip)

    def test_un_nom_qui_mene_a_une_adresse_privee_arrete_tout(self):
        with mock.patch.object(applications.socket, "getaddrinfo", return_value=[(2, 1, 6, "", ("10.1.2.3", 443))]):
            with self.assertRaises(applications.ApplicationRefusee):
                applications.garder_hote("interne.example")
        with mock.patch.object(applications.socket, "getaddrinfo", return_value=[(2, 1, 6, "", ("76.76.21.21", 443))]):
            applications.garder_hote("ardoise-demo.vercel.app")


class ProfilTest(unittest.TestCase):
    def test_le_profil_construit_par_notre_serveur_passe(self):
        cible = applications.valider_profil(profil(), "ardoise-demo-vercel-app", "Ardoise")
        self.assertEqual((cible["origine"], cible["connexion"], cible["client"]), (ORIGINE, {"chemin": "/connexion"}, True))

    def test_un_profil_trafique_est_refuse(self):
        trafiques = [
            profil(origine="http://ardoise-demo.vercel.app"), profil(origine=f"{ORIGINE}/admin"), profil(client=False),
            profil(consultation_seule=False), profil(entree="https://autre.example/connexion"),
            profil(limites={**profil()["limites"], "guide": {"max_steps": 500, "max_time_s": 300}}),
            profil(limites={**profil()["limites"], "lectures_http": 1000}), profil(connexion={"chemin": "https://autre.example"}),
            profil(chemins_exclus=["../etc"]), "pas un profil",
        ]
        for p in trafiques:
            with self.assertRaises(applications.ApplicationRefusee, msg=str(p)[:80]):
                applications.valider_profil(p, "ardoise-demo-vercel-app", "Ardoise")

    def test_une_application_non_verifiee_ou_inconnue_ne_se_teste_pas(self):
        with mock.patch.object(applications, "garder_hote"):
            for app in (application(verifiee_le=None), application(autorisee=False), None):
                with self.assertRaises(applications.ApplicationRefusee):
                    applications.cible_client(BaseClient(app), "ardoise-demo-vercel-app")
            self.assertEqual(applications.cible_client(BaseClient(application()), "ardoise-demo-vercel-app")["id"], "ardoise-demo-vercel-app")


class WorkerApplicationAjouteeTest(unittest.TestCase):
    def lancer(self, base, ligne):
        client, recu = FauxClient(), {}

        def executer_qa(d, *args, **kwargs):
            recu["demande"], recu["cible"] = json.loads(json.dumps(d)), kwargs.get("cible")
            return {"schema_version": 3, "results": []}

        with mock.patch.object(qa_worker, "cle_privee", return_value=CLE), mock.patch.object(qa_worker, "executer_qa", executer_qa), \
                mock.patch.object(qa_worker, "ecrire_rapport", return_value="rapport.json"), mock.patch.object(applications, "garder_hote"):
            qa_worker.traiter(base, client, ligne)
        return client, recu

    def test_le_compte_enregistre_va_au_coffre_de_la_mission_et_reste_chiffre(self):
        base = BaseClient(application(), [compte()])
        client, recu = self.lancer(base, {"id": "m1", "demande": demande_client()})
        self.assertEqual(client.elements[0]["password"], MOT_DE_PASSE)  # seul le coffre reçoit le mot de passe
        self.assertEqual(recu["demande"]["coffre"], "11111111-2222-3333-4444-555555555555")
        self.assertEqual((recu["demande"]["identite"], recu["demande"]["compte_libelle"]), (["Camille Martin"], "Compte A · gérante"))
        self.assertNotIn("compte_id", recu["demande"])
        self.assertEqual(recu["cible"]["id"], "ardoise-demo-vercel-app")
        self.assertIn(("comptes_test", f"eq.{COMPTE_ID}"), [(t, f.get("id")) for t, _, f in base.modifications])  # utilise_le
        self.assertNotIn(MOT_DE_PASSE, json.dumps([base.modifications, base.ajouts, recu], ensure_ascii=False))
        self.assertEqual(client.supprimes, ["11111111-2222-3333-4444-555555555555"])
        self.assertEqual(base.modifications[-1][1]["statut"], "termine")

    def test_une_application_non_verifiee_ne_recoit_ni_coffre_ni_mission(self):
        base = BaseClient(application(verifiee_le=None), [compte()])
        client, recu = self.lancer(base, {"id": "m2", "demande": demande_client()})
        self.assertEqual((client.coffres, recu), ([], {}))
        self.assertEqual(base.modifications[-1][1]["statut"], "echec")

    def test_le_compte_d_une_autre_application_est_refuse(self):
        base = BaseClient(application(), [compte(application_id="autre-application")])
        client, recu = self.lancer(base, {"id": "m3", "demande": demande_client()})
        self.assertEqual((client.coffres, recu), ([], {}))
        self.assertIn("n'existe plus", base.modifications[-1][1]["erreur"])



class ExplorationConnecteeTest(unittest.TestCase):
    """L'exploration d'un SaaS avec connexion : ses pages privées ont une ligne, et un texte anormal y est prouvé par le code."""

    def test_page_privee_vue_connectee_et_texte_anormal_prouve(self):
        cible = applications.valider_profil(profil(), "ardoise-demo-vercel-app", "Ardoise")
        evenements = [vue(f"{ORIGINE}/connexion", "Connexion · Adresse e-mail · Mot de passe · Se connecter"),
                      geste("fill_secret_at", element="Champ Adresse e-mail"), geste("fill_secret_at", element="Champ Mot de passe"),
                      geste("click_web", element="Bouton Se connecter"),
                      vue(f"{ORIGINE}/tableau-de-bord", "Bonjour Camille Martin · 3 factures en retard"),
                      geste("click_web", element="Lien Clients"), vue(f"{ORIGINE}/clients", "Clients · Imprimerie Faure · undefined · 4 factures")]
        demande = {"schema_version": 3, "mode": "qa", "target_id": "ardoise-demo-vercel-app", "pilotage": "exploration",
                   "coffre": COFFRE, "identite": ["Camille Martin"]}
        mission, c = qa_moteur.valider_mission(demande, cible)
        observations, gestes, _ = qa_moteur.lire_trajectoire(evenements)

        def repondre(request):  # Ardoise simulée : la connexion est publique, toute autre page renvoie à la connexion
            if request.url.path == "/connexion":
                return httpx.Response(200, headers={"content-type": "text/html"}, text="<h1>Connexion</h1>")
            return httpx.Response(307, headers={"location": f"/connexion?suite={request.url.path}"})

        with mock.patch.object(qa_moteur, "garder_hote") as garde:
            lectures = qa_moteur.Lectures(c, qa_moteur.Controle(30), httpx.MockTransport(repondre))
            try:
                r = qa_moteur.verifier(mission, c, {"pages": [], "etapes": [], "bloque": False, "raison": ""}, observations, gestes, lectures)[0]
            finally:
                lectures.close()
        self.assertTrue(garde.called)  # chaque lecture d'une application ajoutée passe par la garde réseau
        pages = {x["chemin"]: (x["status"], x["reason_code"]) for x in r if x["type"] == "page_visitee"}
        self.assertEqual(pages["/clients"], ("passed", "page_seen_connected"))
        self.assertEqual(pages["/tableau-de-bord"], ("passed", "page_seen_connected"))
        self.assertEqual([(x["chemin"], x["status"], x["reason_code"]) for x in r if x["type"] == "texte_anormal"],
                         [("/clients", "failed", "anomalous_text")])
        self.assertEqual({x["id"]: x["status"] for x in r if x["id"] in ("K1", "K2")}, {"K1": "passed", "K2": "passed"})

        # Le même défaut, signalé et cité par l'agent : une seule ligne en écart pour la page, pas un doublon du contrôle T.
        reponse = {"etapes": [], "bloque": False, "raison": "", "pages": [{"url": f"{ORIGINE}/clients", "titre_cite": "Clients",
                   "problemes": [{"description": "La ville affiche undefined", "citation": "Imprimerie Faure · undefined"}]}]}
        with mock.patch.object(qa_moteur, "garder_hote"):
            lectures = qa_moteur.Lectures(c, qa_moteur.Controle(30), httpx.MockTransport(repondre))
            try:
                r = qa_moteur.verifier(mission, c, reponse, observations, gestes, lectures)[0]
            finally:
                lectures.close()
        ecarts = [(x["chemin"], x["type"], x["reason_code"]) for x in r if x["status"] == "failed"]
        self.assertEqual(ecarts, [("/clients", "probleme", "anomalous_text")])


    def test_un_ecart_signale_et_cite_sur_une_page_privee_est_dit_jamais_prouve(self):
        cible = applications.valider_profil(profil(), "ardoise-demo-vercel-app", "Ardoise")
        evenements = [vue(f"{ORIGINE}/connexion", "Connexion"), geste("fill_secret_at", element="Champ e-mail"),
                      geste("fill_secret_at", element="Champ mot de passe"), geste("click_web", element="Bouton Se connecter"),
                      vue(f"{ORIGINE}/tableau-de-bord", "Bonjour Camille Martin · 3 factures en retard"),
                      geste("click_web", element="Lien Factures"), vue(f"{ORIGINE}/factures", "14 factures · 2 factures en retard · 2 870 € à relancer.")]
        plan = {"titre": "Factures", "etapes": ["Ouvrir Factures"], "criteres": [{"type": "texte", "description": "Retards annoncés", "valeur": "3 factures en retard"}]}
        demande = {"schema_version": 3, "mode": "qa", "target_id": "ardoise-demo-vercel-app", "pilotage": "guide", "instruction": "Factures",
                   "plan": plan, "coffre": COFFRE, "identite": ["Camille Martin"]}
        mission, c = qa_moteur.valider_mission(demande, cible)
        observations, gestes, _ = qa_moteur.lire_trajectoire(evenements)

        def repondre(request):
            if request.url.path == "/connexion":
                return httpx.Response(200, headers={"content-type": "text/html"}, text="<h1>Connexion</h1>")
            return httpx.Response(307, headers={"location": "/connexion"})

        def c1(citation):
            reponse = {"etapes": [], "pages": [], "bloque": False, "raison": "", "criteres": [{"id": "C1", "statut": "ecart",
                       "constat": "La page Factures affiche 2 factures en retard, le tableau de bord 3", "citation": citation, "url": f"{ORIGINE}/factures"}]}
            with mock.patch.object(qa_moteur, "garder_hote"):
                lectures = qa_moteur.Lectures(c, qa_moteur.Controle(30), httpx.MockTransport(repondre))
                try:
                    return next(x for x in qa_moteur.verifier(mission, c, reponse, observations, gestes, lectures)[0] if x["id"] == "C1")
                finally:
                    lectures.close()

        r = c1("2 factures en retard · 2 870 € à relancer.")
        self.assertEqual((r["status"], r["reason_code"], r["verification"]), ("inconclusive", "agent_reported_gap", "citation"))
        self.assertIn("2 factures en retard", r["observe"])
        self.assertIn("le tableau de bord 3. Sa citation", r["observe"])  # le constat de l'agent finit par un point
        r = c1("5 factures en retard")  # une citation que l'écran ne montre pas : rien n'est recoupé
        self.assertEqual((r["status"], r["reason_code"]), ("inconclusive", "text_unverified"))


if __name__ == "__main__":
    unittest.main()
