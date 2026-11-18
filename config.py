"""Configuration commune : clés, cibles, tarifs, mesures."""
import csv, datetime as dt, inspect, json, os, pathlib

import httpx
from dotenv import load_dotenv

ICI = pathlib.Path(__file__).parent
load_dotenv(ICI / ".env")

BASE_URL = os.getenv("HAI_BASE_URL", "https://agp.eu.hcompany.ai/api/v2").rstrip("/")
PREFIXE = os.getenv("HS_PREFIXE", "sentinelqa")
MODELE = os.getenv("HS_MODELE", "holo4-35b-a3b")
RESULTATS = ICI / "resultats"
RESULTATS.mkdir(exist_ok=True)

# USD par million de tokens : entrée, entrée en cache, sortie (page Models API, lue le 17/11/2026).
# Hypothèse : les sessions Agents sont facturées à ces tarifs. À recouper avec la console H.
TARIFS = {
    "holo4-35b-a3b": (0.30, 0.03, 2.00),
    "holo4-27b": (0.40, 0.04, 3.00),
    "holo3-1-35b-a3b": (0.25, 0.025, 1.80),
}


def entetes():
    return {"Authorization": f"Bearer {os.environ['HAI_API_KEY']}", "Content-Type": "application/json"}


def cibles():
    return json.loads((ICI / "cibles.json").read_text(encoding="utf-8"))


def coffres():
    f = ICI / "coffres.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}


def overrides(start_url, vault_id=None):
    o = {"agent.environments[kind=web].start_url": start_url}
    if vault_id:
        o["agent.environments[kind=web].vault_id"] = vault_id
    return o


def bornes(client, max_steps, max_time_s):
    """Passe max_steps / max_time_s seulement si la version du SDK les accepte (non confirmé dans la doc)."""
    p = inspect.signature(client.run_session).parameters
    kw = {k: v for k, v in (("max_steps", max_steps), ("max_time_s", max_time_s)) if k in p}
    if len(kw) < 2:
        print(f"⚠️  run_session n'accepte pas {set(['max_steps','max_time_s']) - set(kw)} : "
              "la limite repose sur la consigne. Vérifier avec help(client.run_session).")
    return kw


def _cherche(obj, cle):
    if isinstance(obj, dict):
        if cle in obj:
            return obj[cle]
        for v in obj.values():
            r = _cherche(v, cle)
            if r is not None:
                return r
    elif isinstance(obj, list):
        for v in obj:
            r = _cherche(v, cle)
            if r is not None:
                return r
    return None


def mesurer(session_id, debut, cible, agent, compte, statut, note=""):
    """Lit la session (REST), estime le coût, ajoute une ligne à resultats/mesures.csv."""
    duree = round((dt.datetime.now() - debut).total_seconds(), 1)
    steps, cout, tokens, replay = None, 0.0, {}, f"https://platform.hcompany.ai/agents/sessions/{session_id}"
    try:
        s = httpx.get(f"{BASE_URL}/sessions/{session_id}", headers=entetes(), timeout=30).json()
        steps = _cherche(s, "steps")
        replay = _cherche(s, "agent_view_url") or replay
        for u in _cherche(s, "usage_per_model") or []:
            ti, tc, to = TARIFS.get(u.get("name") or u.get("model"), TARIFS["holo4-35b-a3b"])
            entree = (u.get("input_tokens") or 0) - (u.get("cached_tokens") or 0)
            sortie = (u.get("output_tokens") or 0) + (u.get("reasoning_tokens") or 0)  # hypothèse : raisonnement facturé en sortie
            cout += (entree * ti + (u.get("cached_tokens") or 0) * tc + sortie * to) / 1e6
            tokens = u
    except Exception as e:  # la mesure ne doit jamais faire échouer le test
        note += f" | lecture session impossible : {e}"
    f = RESULTATS / "mesures.csv"
    neuf = not f.exists()
    with f.open("a", newline="", encoding="utf-8") as h:
        w = csv.writer(h)
        if neuf:
            w.writerow(["date", "cible", "agent", "compte", "statut", "steps", "duree_s", "cout_usd_estime", "tokens", "replay", "note"])
        w.writerow([debut.isoformat(timespec="seconds"), cible, agent, compte, statut, steps, duree,
                    round(cout, 4), json.dumps(tokens), replay, note.strip()])
    print(f"→ {statut} · {steps} steps · {duree} s · ~{cout:.4f} $ · {replay}")
