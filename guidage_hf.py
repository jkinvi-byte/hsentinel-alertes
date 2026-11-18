"""Le guidage Hugging Face du volet Pentest (architecture 07 §3.4, D-23).
Rôle CAIO (Mohamed, livrable 5).

À partir de la cartographie (et, si fourni, des routes du code), Hugging Face classe
OÙ CHERCHER EN PRIORITÉ pour vérifier le cloisonnement multi-tenant. Il ne décide rien :
chaque priorité est ensuite rejouée. On mesure les failles trouvées grâce à lui.

Sortie : liste de priorités JSON [{zone, ressource, raison, type_test}], de la plus
prometteuse à la moins. Sans HF_TOKEN, repli déterministe (sans IA) pour que ça tourne.
"""
import datetime as dt, json, os, re

import httpx

import pathlib

ROUTEUR = "https://router.huggingface.co/v1/chat/completions"
# Kimi K3 (choix CTO) : plus rapide et plus actionnable que Qwen pour le guidage d'attaque (mesuré le 18/11).
MODELE_DEFAUT = "moonshotai/Kimi-K3"


def _playbook():
    """Charge les schémas de failles connus (sans la section 'Enseignements')."""
    f = pathlib.Path(__file__).parent / "playbook_attaque.md"
    if not f.exists():
        return "(aucun playbook)"
    txt = f.read_text(encoding="utf-8")
    return txt.split("### Enseignements")[0].strip()
TYPES = {"idor_id", "parametre_url", "api", "role"}

CONSIGNE = """Tu es un auditeur de CONTRÔLE D'ACCÈS multi-tenant pour un SaaS. On te donne la liste des pages
qu'un compte voit. Ta seule tâche : classer où vérifier EN PRIORITÉ qu'un compte ne peut pas atteindre les
données PRIVÉES d'un autre compte. Concentre-toi sur : les objets adressables par un identifiant (idor_id),
les listes qui font confiance à un paramètre d'URL (parametre_url), les points d'API (api), et les zones
réservées par rôle (role). Ignore les ressources manifestement partagées (guides, documentation, offres).

Appuie-toi sur les SCHÉMAS DE FAILLES CONNUS ci-dessous (l'expérience des audits passés) pour raisonner et
choisir les tests les plus prometteurs sur CETTE cartographie.

Réponds UNIQUEMENT par un tableau JSON, sans texte autour, au format :
[{"zone":"...", "ressource":"...", "raison":"...", "type_test":"idor_id|parametre_url|api|role"}]
Classe du plus au moins prometteur. Au plus 6 entrées.

SCHÉMAS DE FAILLES CONNUS :
%s

Cartographie de la cible :
%s
"""


def _extraire_json(txt):
    data = []
    m = re.search(r"\[.*\]", txt, re.S)
    if m:
        try:
            data = json.loads(m.group(0))
        except Exception:
            data = []
    if not data:
        # tableau tronqué (modèles de raisonnement coupés) : récupérer les objets complets un par un
        for mo in re.finditer(r"\{[^{}]*\}", txt, re.S):
            try:
                data.append(json.loads(mo.group(0)))
            except Exception:
                pass
    out = []
    for d in data if isinstance(data, list) else []:
        if isinstance(d, dict) and d.get("zone"):
            d["type_test"] = d.get("type_test") if d.get("type_test") in TYPES else "idor_id"
            out.append({k: d.get(k, "") for k in ("zone", "ressource", "raison", "type_test")})
    return out


def _repli(carto):
    """Sans IA : priorise les pages privées qui ressemblent à des listes d'objets."""
    prio = []
    for p in carto:
        u = (p.get("url", "") + " " + p.get("type_ressource", "")).lower()
        if any(k in u for k in ("candidature", "entretien", "profil", "espace", "point")):
            prio.append({"zone": p.get("url", ""), "ressource": p.get("type_ressource", p.get("titre", "")),
                         "raison": "page de données personnelles : chercher un objet par identifiant ou une API",
                         "type_test": "idor_id"})
    return prio[:6]


def prioriser(cartographie, modele=MODELE_DEFAUT):
    """cartographie : liste de pages (dicts). Renvoie (priorites, meta)."""
    pages = cartographie.get("pages", cartographie) if isinstance(cartographie, dict) else cartographie
    token = os.getenv("HF_TOKEN")
    if not token:
        return _repli(pages), {"modele": "aucun (repli sans IA)", "latence_s": 0.0, "par_ia": False}
    debut = dt.datetime.now()
    try:
        r = httpx.post(ROUTEUR, timeout=120, headers={"Authorization": f"Bearer {token}"},
                       json={"model": modele, "temperature": 0.2, "max_tokens": 2500,
                             "messages": [{"role": "user", "content": CONSIGNE % (_playbook(), json.dumps(pages, ensure_ascii=False)[:4000])}]})
        r.raise_for_status()
        prio = _extraire_json(r.json()["choices"][0]["message"]["content"])
        lat = round((dt.datetime.now() - debut).total_seconds(), 1)
        return (prio or _repli(pages)), {"modele": modele, "latence_s": lat, "par_ia": bool(prio)}
    except Exception as e:
        return _repli(pages), {"modele": f"repli ({e})", "latence_s": 0.0, "par_ia": False}


if __name__ == "__main__":
    import sys, glob
    f = sys.argv[1] if len(sys.argv) > 1 else sorted(glob.glob("resultats/carto_*.json"))[-1]
    prio, meta = prioriser(json.load(open(f, encoding="utf-8")))
    print("meta:", meta)
    print(json.dumps(prio, indent=2, ensure_ascii=False))
