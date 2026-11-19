"""Le worker QA et un site connecté lancé depuis la web : le mot de passe arrive chiffré, va au coffre, puis tout s'efface."""

import base64
import json
import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import qa_worker

MOT_DE_PASSE = "s3cr3t-essai-worker"
CLE = rsa.generate_private_key(public_exponent=65537, key_size=2048)


def chiffrer_comme_le_navigateur(texte):
    """RSA-OAEP avec SHA-256, comme WebCrypto dans le formulaire."""
    oaep = padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)
    return base64.b64encode(CLE.public_key().encrypt(texte.encode(), oaep)).decode()


def demande(target_id="peer-review", avec_compte=True):
    d = {"schema_version": 3, "mode": "qa", "target_id": target_id, "pilotage": "guide", "appareil": "ordinateur",
         "instruction": "Vérifie l'espace étudiant", "source": "texte", "modele_h": "holo4-35b-a3b", "preparation_humaine_s": None,
         "plan": {"titre": "Espace", "etapes": ["Ouvrir"], "criteres": [{"id": "C1", "type": "constat", "description": "Titre", "valeur": ""}]}}
    if avec_compte:
        d["compte"] = {"identifiant": "etudiant@example.test", "identite": ["Camille Martin"],
                       "secret_chiffre": chiffrer_comme_le_navigateur(json.dumps({"mot_de_passe": MOT_DE_PASSE}))}
    return d


class FausseBase:
    def __init__(self):
        self.modifications, self.ajouts = [], []

    def modifier(self, table, valeurs, **filtres):
        self.modifications.append((table, json.loads(json.dumps(valeurs)), filtres))
        return [valeurs]

    def ajouter(self, table, ligne):
        self.ajouts.append((table, ligne))
        return {"id": len(self.ajouts), **ligne}

    def lire(self, table, **filtres):
        return [{"arret_demande": False}]


class FauxClient:
    def __init__(self):
        self.coffres, self.elements, self.supprimes = [], [], []
        client = self

        class Coffres:
            def create_vault(self, name, provider_config):
                client.coffres.append(name)
                return SimpleNamespace(id="11111111-2222-3333-4444-555555555555")

            def create_vault_item(self, coffre, name, urls, values):
                client.elements.append(values)

            def list_vault_items(self, coffre, limit=100):
                return SimpleNamespace(items=[SimpleNamespace(id="e1")])

            def delete_vault_item(self, coffre, item_id):
                pass

            def delete_vault(self, coffre):
                client.supprimes.append(coffre)

        self.vaults = Coffres()


class WorkerConnecteTest(unittest.TestCase):
    def lancer(self, ligne, executer=None):
        base, client, recu = FausseBase(), FauxClient(), {}

        def executer_qa(d, *args, **kwargs):
            recu["demande"] = json.loads(json.dumps(d))
            if executer:
                executer()
            return {"schema_version": 3, "results": []}

        with mock.patch.object(qa_worker, "cle_privee", return_value=CLE), mock.patch.object(qa_worker, "executer_qa", executer_qa), \
                mock.patch.object(qa_worker, "ecrire_rapport", return_value="rapport.json"):
            qa_worker.traiter(base, client, ligne)
        return base, client, recu

    def test_le_mot_de_passe_va_au_coffre_et_nulle_part_ailleurs(self):
        base, client, recu = self.lancer({"id": "m1", "demande": demande()})
        premiere = base.modifications[0]
        self.assertEqual(premiere[0], "qa_missions")
        self.assertNotIn("compte", premiere[1]["demande"])  # le texte chiffré quitte la base avant tout
        self.assertEqual(client.elements[0]["password"], MOT_DE_PASSE)  # seul le coffre reçoit le mot de passe
        self.assertEqual(recu["demande"]["coffre"], "11111111-2222-3333-4444-555555555555")
        self.assertEqual(recu["demande"]["identite"], ["Camille Martin"])
        self.assertNotIn("compte", recu["demande"])
        tout = json.dumps([base.modifications, base.ajouts, recu], ensure_ascii=False)
        self.assertNotIn(MOT_DE_PASSE, tout)
        self.assertEqual(client.supprimes, ["11111111-2222-3333-4444-555555555555"])  # le coffre ne survit pas à la mission
        self.assertEqual(base.modifications[-1][1]["statut"], "termine")

    def test_le_coffre_est_supprime_meme_si_la_mission_echoue(self):
        def panne():
            raise RuntimeError("H injoignable")
        base, client, _ = self.lancer({"id": "m2", "demande": demande()}, executer=panne)
        self.assertEqual(base.modifications[-1][1]["statut"], "echec")
        self.assertEqual(client.supprimes, ["11111111-2222-3333-4444-555555555555"])

    def test_un_site_public_ne_recoit_aucun_compte(self):
        base, client, recu = self.lancer({"id": "m3", "demande": demande("eugenia-public")})
        self.assertEqual(base.modifications[-1][1]["statut"], "echec")
        self.assertEqual((client.coffres, recu), ([], {}))  # ni coffre ni mission
        self.assertNotIn("compte", base.modifications[0][1]["demande"])  # le texte chiffré a tout de même quitté la base

    def test_une_mission_publique_reste_inchangee(self):
        base, client, recu = self.lancer({"id": "m4", "demande": demande("eugenia-public", avec_compte=False)})
        self.assertEqual(client.coffres, [])
        self.assertEqual(recu["demande"]["target_id"], "eugenia-public")
        self.assertEqual(base.modifications[-1][1]["statut"], "termine")


    def test_un_ecart_prouve_devient_un_constat_sans_jamais_faire_echouer_la_mission(self):
        ecart = {"schema_version": 3, "request": {"target_id": "eugenia-public"},
                 "results": [{"id": "C1", "type": "texte", "status": "failed", "attendu": "Bac+5", "chemin": "/programme"}]}
        base, client, fil = FausseBase(), FauxClient(), []
        with mock.patch.object(qa_worker, "executer_qa", lambda *a, **k: ecart), mock.patch.object(qa_worker, "ecrire_rapport", return_value="r.json"):
            qa_worker.traiter(base, client, {"id": "m5", "demande": demande("eugenia-public", avec_compte=False)})
        self.assertEqual([t for t, _ in base.ajouts if t == "constats"], ["constats"])
        self.assertEqual(base.modifications[-1][1]["statut"], "termine")

        class BaseSansAlertes(FausseBase):
            def ajouter(self, table, ligne):
                if table == "constats":
                    raise RuntimeError("table absente")
                return super().ajouter(table, ligne)
        base = BaseSansAlertes()
        with mock.patch.object(qa_worker, "executer_qa", lambda *a, **k: ecart), mock.patch.object(qa_worker, "ecrire_rapport", return_value="r.json"):
            qa_worker.traiter(base, client, {"id": "m6", "demande": demande("eugenia-public", avec_compte=False)})
        self.assertEqual(base.modifications[-1][1]["statut"], "termine")  # l'alerte échoue, la mission reste terminée


if __name__ == "__main__":
    unittest.main()
