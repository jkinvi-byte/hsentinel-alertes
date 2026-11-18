"""Contrat et exécution des premiers scénarios réels (D-26).

Les lectures HTTP sont bornées par le catalogue partagé avec la web app.
Le navigateur H natif suit des consignes : ce n'est pas un pare-feu d'écriture.
Ce lot n'ouvre que deux parcours anonymes, sans coffre ni connexion.
"""

import copy
import hashlib
import html
import json
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

import httpx
from pydantic import BaseModel, Field

CATALOGUE = json.loads((Path(__file__).resolve().parents[1] / "contrats/catalogue.json").read_text())
VERSION = 2
STATUTS = ("passed", "failed", "inconclusive", "skipped")


def maintenant():
    return datetime.now(timezone.utc).isoformat()


def valider_demande(d):
    """Revalider dans le runner, même si la demande vient de notre API."""
    if not isinstance(d, dict) or set(d) - {"target_id", "scenario_id", "mode", "instruction"}:
        raise ValueError("Champs de mission non pris en charge.")
    scenario = next((s for s in CATALOGUE["scenarios"] if s["id"] == d.get("scenario_id")), None)
    if not scenario or scenario["target_id"] != d.get("target_id") or scenario["mode"] != d.get("mode"):
        raise ValueError("La cible, le scénario et le volet ne correspondent pas au catalogue.")
    instruction = d.get("instruction", "")
    if not isinstance(instruction, str) or len(instruction) > 2000:
        raise ValueError("La consigne doit être un texte de 2 000 caractères au maximum.")
    target = next(t for t in CATALOGUE["targets"] if t["id"] == scenario["target_id"])
    return {"target_id": target["id"], "scenario_id": scenario["id"], "mode": scenario["mode"],
            "instruction": instruction.strip()}, copy.deepcopy(target), copy.deepcopy(scenario)


class Interruption(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


class Controle:
    def __init__(self, limite, arret=lambda: False):
        self.deadline = time.monotonic() + limite
        self.arret = arret

    def verifier(self):
        if self.arret():
            raise Interruption("cancelled")
        if time.monotonic() >= self.deadline:
            raise Interruption("budget_exceeded")

    def restant(self):
        self.verifier()
        return max(0.1, self.deadline - time.monotonic())


def url_autorisee(target, url, navigation=False):
    """Origine exacte, pas d'identifiants, paramètres ou chemin implicite hors liste."""
    if not isinstance(url, str) or any(ord(c) < 33 for c in url) or "\\" in url:
        raise Interruption("out_of_scope")
    resolved = urljoin(target["origin"] + "/", url)
    parts = urlsplit(resolved)
    if (f"{parts.scheme}://{parts.netloc}" != target["origin"] or parts.username or parts.password or parts.query):
        raise Interruption("out_of_scope")
    path = parts.path.rstrip("/") or "/"
    if path not in target["navigation_paths" if navigation else "read_paths"]:
        raise Interruption("out_of_scope")
    return urlunsplit((parts.scheme, parts.netloc, parts.path or "/", "", ""))


class Lectures:
    def __init__(self, target, controle, preuves, transport=None):
        self.target, self.controle, self.preuves = target, controle, preuves
        self.nombre = 0
        # Aucune session héritée, ni proxy implicite du poste, ni redirection automatique.
        self.http = httpx.Client(transport=transport, follow_redirects=False, trust_env=False,
                                 headers={"User-Agent": "HSentinel/0.2 (authorized read-only check)"})

    def get(self, url):
        self.controle.verifier()
        url = url_autorisee(self.target, url)
        self.nombre += 1
        if self.nombre > self.target["limits"]["max_reads"]:
            raise Interruption("read_budget_exceeded")
        chunks, taille = [], 0
        with self.http.stream("GET", url, timeout=min(15, self.controle.restant())) as stream:
            for chunk in stream.iter_bytes():
                self.controle.verifier()
                taille += len(chunk)
                if taille > self.target["limits"]["max_response_bytes"]:
                    raise Interruption("response_too_large")
                chunks.append(chunk)
            headers = {k: v for k, v in stream.headers.items() if k not in ("content-encoding", "content-length")}
            response = httpx.Response(stream.status_code, headers=headers, content=b"".join(chunks),
                                      request=httpx.Request("GET", url))
        # Ni cookies, ni corps privé, ni en-têtes d'authentification dans les preuves.
        preuve = {"id": f"http-{len(self.preuves) + 1}", "kind": "http", "url": url, "method": "GET",
                  "status_code": response.status_code, "bytes": taille,
                  "sha256": hashlib.sha256(response.content).hexdigest(), "captured_at": maintenant()}
        if response.is_redirect and response.headers.get("location"):
            # Vérifier avant toute éventuelle lecture du lien de redirection.
            preuve["location"] = url_autorisee(self.target, urljoin(url, response.headers["location"]))
        self.preuves.append(preuve)
        return response

    def close(self):
        self.http.close()


class Titres(HTMLParser):
    def __init__(self):
        super().__init__()
        self.actif = False
        self.textes = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "h1":
            self.actif = True

    def handle_endtag(self, tag):
        if tag.lower() == "h1":
            self.actif = False

    def handle_data(self, data):
        if self.actif:
            self.textes.append(data)


class Observation(BaseModel):
    final_url: str = Field(max_length=2048)
    visible_title: str = Field(max_length=200)
    actions: list[str] = Field(max_length=20)
    blocked: bool
    reason: str = Field(max_length=500)


class NavigateurH:
    """Une session vierge par mission ; aucun accès aux coffres du cobaye."""
    def __init__(self, client):
        self.client = client
        self.sessions = []

    def observer(self, demande, target, scenario, controle, journal):
        from agents_missions import assurer_agent_mission
        from hai_agents.polling import SETTLED_SESSION_STATUSES

        controle.verifier()
        if callable(self.client):
            self.client = self.client()
        debut, handle, termine = time.monotonic(), None, False
        mesure = {"role": "Anonyme", "cible": scenario["id"], "statut": "running", "steps": None,
                  "tokens": None, "cout_dollars": None, "replay": None}
        message = json.dumps({"scenario": scenario["instruction"], "precisions": demande["instruction"],
                              "urls_autorisees": [target["origin"] + p for p in target["navigation_paths"]],
                              "attendu": scenario["expected"]},
                             ensure_ascii=False)
        try:
            agent = assurer_agent_mission(self.client, demande["mode"])
            controle.verifier()
            mesure.update(agent=agent["name"], agent_revision=agent["revision"])
            journal(f"Catalogue H · {agent['name']} · {agent['action']}", "info", agent=agent["name"])
            handle = self.client.start_session(
                agent=agent["reference"],
                overrides={"agent.environments[kind=web].start_url": target["entry_url"]},
                messages=message, answer_schema=Observation, max_steps=target["limits"]["max_steps"],
                max_time_s=max(1, int(controle.restant())),
            )
            mesure["session"] = handle.id
            self.sessions.append(mesure)
            mesure["replay"] = handle.get().agent_view_url
            journal(f"Agent H · {scenario['title']}", "session", session=handle.id, replay=mesure["replay"])
            while True:
                controle.verifier()
                statut = handle.status().status
                if statut in SETTLED_SESSION_STATUSES:
                    termine = True
                    break
                if statut in ("awaiting_tool_results", "awaiting_approval"):
                    raise Interruption("agent_blocked")
                time.sleep(min(1, controle.restant()))
            result = handle.wait_for_completion(timeout_seconds=min(15, controle.restant()), wait_for_seconds=0)
            mesure["statut"] = result.status
            if result.status not in ("idle", "completed") or result.answer is None:
                raise Interruption("agent_incomplete")
            observation = Observation.model_validate(result.answer).model_dump()
            # Le texte final du modèle n'est pas la preuve qu'une page a été visitée.
            urls = []
            for page in range(1, 11):
                controle.verifier()
                items = self.client.sessions.list_session_events(handle.id, page=page, size=100).model_dump().get("items", [])
                if not items:
                    break
                for event in items:
                    url = ((event.get("data") or {}).get("metadata") or {}).get("url")
                    if url and url != "about:blank":
                        urls.append(url_autorisee(target, url, navigation=True))
            else:
                raise Interruption("evidence_incomplete")
            observation["observed_urls"] = list(dict.fromkeys(urls))
            observation["session"] = handle.id
            observation["replay"] = mesure["replay"]
            return observation
        finally:
            if handle and not termine:
                try:
                    handle.cancel()
                    mesure["statut"] = "interrupted"
                except Exception:
                    mesure["cancellation_unconfirmed"] = True
                    journal("L’arrêt de la session H n’a pas pu être confirmé ; son plafond de durée reste actif.", "erreur")
            mesure["duree_s"] = round(time.monotonic() - debut, 2)
            if handle:
                try:
                    changes = handle.changes(include_events=False)
                    metrics = changes.metrics if changes else None
                    if metrics:
                        mesure.update(steps=metrics.steps, cout_dollars=metrics.total_cost,
                                      tokens=sum(m.input_tokens + m.output_tokens for m in (metrics.cost_per_model or [])))
                except Exception:
                    pass  # Une métrique manquante reste non mesurée ; elle ne change pas le résultat.


def verdict_gate(response, target):
    if response.status_code in (401, 403):
        return "passed", "anonymous_denied", "Le serveur refuse cette requête anonyme."
    if response.is_redirect and response.headers.get("location"):
        location = url_autorisee(target, urljoin(str(response.url), response.headers["location"]))
        if location.rstrip("/") == target["login_url"].rstrip("/"):
            return "passed", "login_redirect", "Le serveur redirige cette requête anonyme vers la connexion."
    return "inconclusive", "private_content_unverified", f"HTTP {response.status_code} : ce statut ne permet pas de conclure à l’accès au contenu privé."


def evaluer_acces(autorise, interdit, *, identites_verifiees, regle_connue, marqueur):
    """Assertion S-PEER-02 prête pour un futur adaptateur authentifié.

Le marqueur est une valeur témoin propre à une ressource de test, jamais un
nom de menu ou une coquille HTML. Il n'est pas conservé dans le rapport.
"""
    if not identites_verifiees or not regle_connue or not marqueur:
        return "inconclusive", "missing_preconditions"
    if autorise.status_code != 200 or marqueur not in autorise.text:
        return "inconclusive", "positive_control_failed"
    if marqueur in interdit.text:
        return "failed", "protected_content_received"
    if interdit.status_code in (403, 404):
        return "passed", "access_denied"
    # 401 peut indiquer une session B expirée ; un 200 différent n'est pas un refus prouvé.
    return "inconclusive", "denial_unverified"


def executer_mission(demande, navigateur, journal=lambda *a, **k: None, arret=lambda: False, transport=None):
    demande, target, scenario = valider_demande(demande)
    debut = time.monotonic()
    controle = Controle(target["limits"]["max_time_s"], arret)
    preuves, sessions = [], []
    resultat = {"scenario_id": scenario["id"], "status": "inconclusive", "reason_code": "not_started",
                "expected": scenario["expected"], "observed": "", "evidence_references": [],
                "limitations": scenario["limitations"]}
    rapport = {"schema_version": VERSION, "phase": "completed", "request": demande,
               "scenario_version": scenario["version"], "scenario_title": scenario["title"],
               "scope_snapshot": target, "started_at": maintenant(), "results": [resultat],
               "evidence": preuves, "sessions": sessions, "cost_hf": None, "human_minutes": None}
    lectures = Lectures(target, controle, preuves, transport)
    try:
        journal("0/4 Vérification du scénario et du périmètre", "etape")
        controle.verifier()
        if not scenario["available"]:
            resultat.update(status="skipped", reason_code="missing_preconditions",
                            observed=" ; ".join(scenario["missing_preconditions"]))
            return rapport
        if demande["mode"] == "security":
            journal("1/4 Contrôle HTTP sans session", "etape")
            response = lectures.get(target["entry_url"])
            status, code, observed = verdict_gate(response, target)
            resultat.update(status=status, reason_code=code, observed=observed)
        else:
            journal("1/4 Préparation du parcours QA public", "etape")
        journal("2/4 Parcours visuel de l’agent H", "etape")
        observation = navigateur.observer(demande, target, scenario, controle, journal)
        controle.verifier()
        final = url_autorisee(target, observation["final_url"], navigation=True)
        urls = [url_autorisee(target, u, navigation=True) for u in observation.get("observed_urls", [])]
        if final not in urls or observation["blocked"]:
            raise Interruption("browser_observation_unverified")
        preuves.append({"id": "browser-1", "kind": "browser", "session": observation["session"],
                        "replay": observation.get("replay"), "url": final,
                        "visible_title": observation["visible_title"], "actions": observation["actions"]})
        journal("3/4 Vérification des critères et des preuves", "etape")
        if demande["mode"] == "qa":
            if urlsplit(final).path.rstrip("/") != scenario["expected_path"]:
                raise Interruption("expected_page_not_reached")
            response = lectures.get(final)
            if response.is_redirect:
                raise Interruption("page_changed_before_check")
            if response.status_code >= 400:
                resultat.update(status="failed", reason_code="page_http_error", observed=f"La page atteinte renvoie HTTP {response.status_code}.")
            elif response.status_code == 200 and "text/html" in response.headers.get("content-type", ""):
                titres = Titres()
                titres.feed(response.text)
                heading = " ".join(" ".join(titres.textes).split())
                expected = scenario["expected_heading"].casefold()
                if expected in heading.casefold() and expected in observation["visible_title"].casefold():
                    resultat.update(status="passed", reason_code="navigation_verified",
                                    observed=f"Page atteinte par H et titre principal confirmé dans la réponse HTTP : {heading[:200]}")
                else:
                    resultat.update(status="inconclusive", reason_code="heading_unverified",
                                    observed="La page a été atteinte, mais le titre attendu n’a pas été confirmé par les deux observations.")
            else:
                raise Interruption("unexpected_response")
        elif resultat["status"] == "passed" and final != target["login_url"] and response.is_redirect:
            raise Interruption("browser_http_disagreement")
    except Interruption as erreur:
        raisons = {"cancelled": "Arrêt demandé. Les preuves déjà recueillies sont conservées.",
                   "budget_exceeded": "Le budget de durée a été atteint.",
                   "out_of_scope": "Une URL sort du périmètre autorisé ; la lecture a été refusée.",
                   "expected_page_not_reached": "L’agent n’a pas atteint la page attendue ; aucun bug du site n’est affirmé."}
        resultat.update(status="inconclusive", reason_code=erreur.code,
                        observed=raisons.get(erreur.code, "Le contrôle n’a pas réuni toutes les preuves nécessaires."))
    except (Exception, SystemExit) as erreur:
        # Pas de str(erreur) : les erreurs de fournisseurs peuvent contenir des URL signées ou des secrets.
        resultat.update(status="inconclusive", reason_code="execution_error",
                        observed=f"Exécution non concluante ({erreur.__class__.__name__}).")
    finally:
        lectures.close()
        sessions.extend(getattr(navigateur, "sessions", []))
        resultat["evidence_references"] = [p["id"] for p in preuves]
        rapport["finished_at"] = maintenant()
        rapport["duration_s"] = round(time.monotonic() - debut, 2)
        couts = [s.get("cout_dollars") for s in sessions]
        rapport["cost_h"] = sum(couts) if couts and all(c is not None for c in couts) else None
        rapport["summary"] = {s: int(resultat["status"] == s) for s in STATUTS}
        journal(f"4/4 Rapport · {resultat['status']}", "etape")
        journal(resultat["observed"], "resultat", status=resultat["status"], reason_code=resultat["reason_code"])
    return rapport


def rapport_html(rapport):
    escape = lambda x: html.escape(str(x))
    result = rapport["results"][0]
    return ("<!doctype html><html lang='fr'><meta charset='utf-8'><title>HSentinel · Rapport</title>"
            "<style>body{font:17px system-ui;max-width:900px;margin:50px auto;padding:20px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>"
            f"<h1>{escape(rapport['scenario_title'])}</h1><p>{escape(result['status'])}</p>"
            f"<h2>Attendu</h2><p>{escape(result['expected'])}</p><h2>Observé</h2><p>{escape(result['observed'])}</p>"
            f"<p>{escape(result['limitations'])}</p><h2>Preuves et mesures</h2>"
            f"<pre>{escape(json.dumps(rapport, ensure_ascii=False, indent=2))}</pre></html>")
