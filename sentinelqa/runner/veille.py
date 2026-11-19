"""La veille des mises à jour (D-43) : savoir qu'un site a changé, sans rien installer chez le client.

Toutes les 15 minutes, deux requêtes HTTP sur la page d'entrée de chaque application suivie, sans agent.
L'empreinte réunit ce qui est identique dans les deux lectures :
- l'identifiant de compilation : Next.js le publie dans /_next/static/<buildId>/ (Pages Router)
  ou dans les données de rendu, « "b":"<buildId>" » (App Router, Next 13 à 16) ;
- les ressources JS et CSS (leurs noms portent une empreinte de leur contenu) ;
- les titres h1 à h3 de la page.
Ce qui change d'une requête à l'autre (jeton, paramètre anti-cache, compteur) n'y entre donc jamais.

Quand l'empreinte change, une mission QA d'exploration est créée ; le worker l'exécute, et un écart prouvé
devient un ticket (D-42). Un site connecté (compte requis) n'a pas de mission automatique : la mise à jour
est notée, le parcours connecté reste à relancer par l'équipe.
"""

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import httpx

INTERVALLE_S = int(os.environ.get("HSENTINEL_VEILLE_S", 15 * 60))
CATALOGUE_QA = json.loads((Path(__file__).resolve().parents[1] / "contrats" / "qa.json").read_text())
BUILD = (re.compile(r"/_next/static/([A-Za-z0-9_-]{6,})/_(?:buildManifest|ssgManifest)"),  # Pages Router
         re.compile(r'\\"b\\":\\"([A-Za-z0-9_-]{10,40})\\"'))                     # App Router (self.__next_f)
PREFIXE = "Mise à jour détectée"


class Releve(HTMLParser):
    """Les ressources JS et CSS d'une page et ses titres h1 à h3."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ressources, self.titres, self._titre = set(), [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and a.get("src"):
            self.ressources.add(a["src"])
        elif tag == "link" and "stylesheet" in (a.get("rel") or "").split() and a.get("href"):
            self.ressources.add(a["href"])
        elif tag in ("h1", "h2", "h3"):
            self._titre = []

    def handle_endtag(self, tag):
        if tag in ("h1", "h2", "h3") and self._titre is not None:
            texte = " ".join("".join(self._titre).split())
            if texte:
                self.titres.append(texte)
            self._titre = None

    def handle_data(self, data):
        if self._titre is not None:
            self._titre.append(data)


def lecture(page, adresse):
    """Ce qu'une lecture de la page révèle de sa version : compilation, ressources, titres."""
    releve = Releve()
    releve.feed(page)
    build = next((m for m in (motif.search(page) for motif in BUILD) if m), None)
    return {"build": build.group(1) if build else None,
            "ressources": {urljoin(adresse, r) for r in releve.ressources},
            "titres": set(releve.titres)}


def empreinte(premiere, seconde):
    """L'empreinte stable de deux lectures : seulement ce qu'elles ont en commun. Rend (valeur, détail)."""
    stable = {"build": premiere["build"] if premiere["build"] == seconde["build"] else None,
              "ressources": sorted(premiere["ressources"] & seconde["ressources"]),
              "titres": sorted(premiere["titres"] & seconde["titres"])}
    valeur = hashlib.sha256(json.dumps(stable, ensure_ascii=False, sort_keys=True).encode()).hexdigest()
    detail = {"build": stable["build"], "ressources": len(stable["ressources"]), "titres": len(stable["titres"]),
              "ressources_hash": hashlib.sha256("\n".join(stable["ressources"]).encode()).hexdigest()[:12],
              "titres_hash": hashlib.sha256("\n".join(stable["titres"]).encode()).hexdigest()[:12]}
    return valeur, detail


def ce_qui_change(avant, apres):
    """Ce qui a bougé entre deux détails d'empreinte, en mots."""
    avant = avant or {}
    if avant.get("build") != apres.get("build") and apres.get("build"):
        return "nouvelle compilation"
    if avant.get("ressources_hash") != apres.get("ressources_hash"):
        return "nouvelles ressources JS ou CSS"
    if avant.get("titres_hash") != apres.get("titres_hash"):
        return "titres de la page modifiés"
    return "page modifiée"


def relever(adresse, transport=None):
    """Deux lectures de la page d'entrée, puis leur empreinte stable."""
    with httpx.Client(timeout=20, follow_redirects=True, transport=transport,
                      headers={"User-Agent": "HSentinel-veille/1.0 (+https://hsentinel-console.vercel.app)"}) as http:
        lectures = []
        for _ in range(2):
            reponse = http.get(adresse)
            if reponse.status_code >= 400:
                raise RuntimeError(f"HTTP {reponse.status_code}")
            lectures.append(lecture(reponse.text, str(reponse.url)))
    return empreinte(*lectures)


def maintenant():
    return datetime.now(timezone.utc).isoformat()


def mission_exploration(cible, resume):
    """La mission d'une mise à jour détectée : une exploration bornée, comme W1."""
    return {"schema_version": 3, "mode": "qa", "target_id": cible["id"], "pilotage": "exploration", "appareil": "ordinateur",
            "instruction": f"{PREFIXE} ({resume}) : exploration bornée du site.", "source": "texte", "modele_h": "holo4-35b-a3b",
            "preparation_humaine_s": None, "plan": None}


def observer(base, journal=print, transport=None):
    """Un tour de veille : chaque application suivie, comparée à sa dernière empreinte. Rend les missions créées."""
    creees = []
    cibles = {c["id"]: c for c in CATALOGUE_QA["cibles"]}
    for app in base.lire("applications", observation_active="eq.true", select="id,nom,cible_qa,observation_empreinte,observation_detail"):
        cible = cibles.get(app.get("cible_qa") or app["id"])
        if not cible:
            continue
        try:
            valeur, detail = relever(cible["entree"], transport)
        except Exception as erreur:
            # Une erreur de lecture ne vaut ni changement ni stabilité : l'empreinte connue est conservée.
            journal(f"Veille · {app['nom']} : lecture impossible ({erreur.__class__.__name__} {erreur}).")
            base.modifier("applications", {"observee_le": maintenant()}, id=f"eq.{app['id']}")
            continue
        maj = {"observee_le": maintenant(), "observation_empreinte": valeur, "observation_detail": detail}
        if app.get("observation_empreinte") is None:
            base.modifier("applications", maj, id=f"eq.{app['id']}")
            journal(f"Veille · {app['nom']} : empreinte initiale relevée.")
            continue
        if valeur == app["observation_empreinte"]:
            base.modifier("applications", {"observee_le": maj["observee_le"]}, id=f"eq.{app['id']}")
            continue
        resume = ce_qui_change(app.get("observation_detail"), detail)
        maj["mise_a_jour_le"] = maj["observee_le"]
        base.modifier("applications", maj, id=f"eq.{app['id']}")
        if cible.get("connexion") or "exploration" not in cible["limites"]:
            journal(f"Veille · {app['nom']} : mise à jour détectée ({resume}). Site à compte : parcours connecté à relancer par l'équipe.")
            continue
        en_attente = base.lire("qa_missions", statut="eq.en_attente", cible=f"eq.{cible['id']}", select="id,demande")
        if any(str((m.get("demande") or {}).get("instruction", "")).startswith(PREFIXE) for m in en_attente):
            journal(f"Veille · {app['nom']} : mise à jour détectée ({resume}) ; une exploration attend déjà.")
            continue
        ligne = base.ajouter("qa_missions", {"cible": cible["id"], "demande": mission_exploration(cible, resume)})
        creees.append(ligne["id"])
        journal(f"Veille · {app['nom']} : mise à jour détectée ({resume}) → mission QA {ligne['id']}.")
    return creees
