"""Reclasse la gravité des audits déjà faits avec la règle déterministe (gravite.py), dans Supabase et dans rapports/.

Les audits faits avant la règle n'ont pas gardé la page reçue au rejeu. Avec --cobaye, chaque page prouvée est relue
sur le cobaye avec le compte qui attaquait (les données de test sont fixes) : c'est l'entrée qu'aurait eue la règle.
Sans --cobaye, on se rabat sur le constat écrit par l'agent H, qui varie d'un audit à l'autre. La source est notée.
Une copie de chaque rapport est gardée avant modification (--sauvegarde).

    python3 sentinelqa/runner/regraver.py --sauvegarde /chemin/vers/dossier --cobaye http://localhost:3000
"""

import argparse
import json
from pathlib import Path

from base import Base
from gravite import REGLE, classer, detecter
from sentinelqa import contenu, session_http

ICI = Path(__file__).resolve().parent
RAPPORTS = ICI.parent / "rapports"


QUI_ATTAQUE = {"lecture": "B", "admin": "C", "ecriture": "A"}  # pour l'écriture : la page de la victime


def relecteur(base):
    """Relit une page sur le cobaye avec le compte qui attaquait ; renvoie les catégories détectées (en cache)."""
    comptes = json.loads((ICI / "comptes-demo.json").read_text())
    http = {k: session_http(base, comptes[k]) for k in ("A", "B", "C")}
    cache = {}

    def lire(theme, chemin):
        if (theme, chemin) not in cache:
            reponse = http[QUI_ATTAQUE[theme]].get(chemin)
            cache[(theme, chemin)] = detecter(contenu(reponse)) if reponse.status_code == 200 else []
        return cache[(theme, chemin)]
    return lire, http


def regraver(rapport, lire=None):
    """Reclasse chaque faille prouvée d'un rapport ; renvoie le nombre de gravités écrites."""
    if not rapport or not rapport.get("preuves"):
        return 0
    n = 0
    for p in rapport["preuves"]:
        if not p.get("prouvee"):
            continue
        theme = p.get("theme", "lecture")
        if p.get("donnees") is not None:
            donnees, source = p["donnees"], "page reçue au rejeu"
        elif lire:
            donnees, source = lire(theme, p.get("visible_par_a") or p["chemin"]), "page du cobaye relue le 17/11 (données de test fixes)"
        else:
            donnees, source = detecter(((p.get("constat") or {}).get("ce_qui_est_visible")) or ""), "constat de l'agent"
        p["gravite"] = {**classer(theme, donnees), "source": source}
        n += 1
    rapport["gravite"] = {"regle": REGLE, "source": "reclassement du 17/11"}
    return n


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--sauvegarde", required=True, help="dossier où copier les rapports avant modification")
    parser.add_argument("--cobaye", help="URL du cobaye, pour relire les pages prouvées des anciens audits")
    args = parser.parse_args()
    lire, sessions = relecteur(args.cobaye) if args.cobaye else (None, {})
    sauvegarde = Path(args.sauvegarde)
    sauvegarde.mkdir(parents=True, exist_ok=True)

    for fichier in sorted(RAPPORTS.glob("rapport-*.json")):
        rapport = json.loads(fichier.read_text())
        if not (sauvegarde / fichier.name).exists():
            (sauvegarde / fichier.name).write_text(fichier.read_text())
        n = regraver(rapport, lire)
        fichier.write_text(json.dumps(rapport, ensure_ascii=False, indent=2))
        print(f"{fichier.name} : {n} gravité(s)")

    base = Base()
    try:
        lignes = base.lire("audits", select="id,rapport")
        if not (sauvegarde / "supabase-audits.json").exists():
            (sauvegarde / "supabase-audits.json").write_text(json.dumps(lignes, ensure_ascii=False))
        for ligne in lignes:
            n = regraver(ligne["rapport"], lire)
            if n:
                base.modifier("audits", {"rapport": ligne["rapport"]}, id=f"eq.{ligne['id']}")
            print(f"Supabase {ligne['id'][:8]} : {n} gravité(s)")
    finally:
        base.fermer()
        for h in sessions.values():
            h.close()


if __name__ == "__main__":
    main()
