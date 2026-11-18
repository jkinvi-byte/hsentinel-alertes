"""Contrat du vrai SDK H avec un serveur HTTP simulé, sans réseau ni secret."""

import copy
import json
import sys
import unittest
from pathlib import Path

import httpx
from hai_agents import Client
from hai_agents.core.api_error import ApiError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agents_missions import NOMS, assurer_agent_mission, definition


class Catalogue:
    def __init__(self):
        self.agents, self.calls = {}, []

    def handle(self, request):
        self.calls.append((request.method, request.url.path))
        name = request.url.path.rsplit("/", 1)[-1]
        if request.method == "POST":
            data = json.loads(request.content)
            name = data["name"]
            self.agents[name] = {**data, "revision": 1}
        elif request.method == "PATCH":
            self.agents[name].update(json.loads(request.content))
            self.agents[name]["revision"] += 1
        if name not in self.agents:
            return httpx.Response(404, json={"detail": "Absent"})
        return httpx.Response(200, json=self.agents[name])

    def client(self):
        return Client(api_key="local-test-only", max_retries=0,
                      httpx_client=httpx.Client(transport=httpx.MockTransport(self.handle)))


class AgentsMissionsTest(unittest.TestCase):
    def test_creation_des_deux_agents_et_relecture_sans_doublon(self):
        server = Catalogue()
        client = server.client()
        for mode, name in NOMS.items():
            result = assurer_agent_mission(client, mode)
            self.assertEqual(result, {"name": name, "reference": name + ":1", "revision": 1, "action": "créé"})
            self.assertEqual(server.calls[-1], ("GET", "/api/v2/agents/" + name))
            self.assertEqual(assurer_agent_mission(client, mode)["action"], "à jour")
        self.assertEqual(sum(method == "POST" for method, _ in server.calls), 2)
        self.assertFalse(any(method == "PATCH" for method, _ in server.calls))
        self.assertEqual(set(server.agents), set(NOMS.values()))

    def test_modification_confirmee_et_suppression_du_profil_herite(self):
        server = Catalogue()
        spec = copy.deepcopy(definition("security"))
        spec["environments"][0].update(browser_profile_id="unwanted", vault_id="unwanted",
                                        use_default_browser_profile=True)
        spec["instructions"] = "Ancienne consigne"
        spec["revision"] = 4
        server.agents[spec["name"]] = spec
        result = assurer_agent_mission(server.client(), "security")
        self.assertEqual(result["action"], "mis à jour")
        self.assertEqual(result["reference"], NOMS["security"] + ":5")
        env = server.agents[spec["name"]]["environments"][0]
        self.assertFalse(env["use_default_browser_profile"])
        self.assertFalse(env["persist_browser_profile"])
        self.assertFalse(env.get("vault_id"))
        self.assertFalse(env.get("browser_profile_id"))
        self.assertEqual(assurer_agent_mission(server.client(), "security")["action"], "à jour")

    def test_erreur_auth_et_erreur_service_ne_creent_pas_d_agent(self):
        for code in (401, 403, 503):
            calls = []
            def refuse(request):
                calls.append(request.method)
                return httpx.Response(code, json={"detail": "Refus"})
            client = Client(api_key="local-test-only", max_retries=0,
                            httpx_client=httpx.Client(transport=httpx.MockTransport(refuse)))
            with self.subTest(code=code), self.assertRaises(ApiError):
                assurer_agent_mission(client, "qa")
            self.assertEqual(calls, ["GET"])

    def test_ecriture_non_relue_ne_devient_pas_un_succes(self):
        server = Catalogue()
        def non_confirme(request):
            response = server.handle(request)
            if request.method == "GET" and response.status_code == 200:
                data = response.json()
                data["instructions"] = "Configuration inattendue"
                return httpx.Response(200, json=data)
            return response
        client = Client(api_key="local-test-only", max_retries=0,
                        httpx_client=httpx.Client(transport=httpx.MockTransport(non_confirme)))
        with self.assertRaisesRegex(RuntimeError, "non confirmée"):
            assurer_agent_mission(client, "qa")


if __name__ == "__main__":
    unittest.main()
