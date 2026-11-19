"""Monter les workflows HSentinel (W1, W3, W4, W5) dans une instance n8n, par son API, en une commande.

Crée ou met à jour les identifiants n8n, importe les trois exports de `import/` avec ces identifiants,
active W3, W4 et W5 (W1 reste inactif tant que le webhook GitHub n'existe pas), puis vérifie l'activation.
Aucune clé n'est affichée : elles viennent de ~/.config/sentinelqa/.env (N8N_URL, N8N_API_KEY,
SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_ACCESS_TOKEN, GITHUB_N8N_TOKEN, HSENTINEL_EMAIL_EQUIPE). Le secret du webhook W3
est lu dans le coffre de notre Supabase : l'en-tête attendu par n8n est donc, par construction, celui
que la base envoie (le 403 « Authorization data is wrong! » du 19/11 venait d'un écart entre les deux).

Usage :
  python sentinelqa/n8n/monter.py --verifier   (lit l'instance et les exports, n'écrit rien)
  python sentinelqa/n8n/monter.py              (monte et active)
  python sentinelqa/n8n/monter.py --seul w5    (ne monte que ce workflow, sans toucher aux autres)
"""

import argparse
import json
import os
import sys
from pathlib import Path

import httpx

ICI = Path(__file__).resolve().parent
EXPORTS = {"w1": "w1-mise-en-ligne-audit-qa.json", "w3": "w3-faille-prouvee-alertes.json", "w4": "w4-pentest-regulier.json",
           "w5": "w5-demandes-acces.json"}
A_ACTIVER = ("w3", "w4", "w5")
PROJET_SUPABASE = "auaitjryhgwdbczwkdef"
GMAIL = "HSentinel · Gmail"  # créé à la main dans n8n (Connect Google) : l'API ne sait pas faire le consentement OAuth
REGLAGES_PERMIS = {"executionOrder", "timezone", "saveDataErrorExecution", "saveDataSuccessExecution", "saveManualExecutions",
                   "saveExecutionProgress", "executionTimeout", "callerPolicy", "errorWorkflow"}


def lire_env():
    valeurs = {}
    for fichier in ("~/.config/sentinelqa/.env", "~/.config/hai/.env"):
        for ligne in Path(os.path.expanduser(fichier)).read_text().splitlines():
            if "=" in ligne and not ligne.lstrip().startswith("#"):
                nom, valeur = ligne.split("=", 1)
                valeurs[nom.strip()] = valeur.strip().strip("'\"")
    # HSENTINEL_EMAIL_EQUIPE : le destinataire des alertes (D-41). Une adresse personnelle n'a rien à faire dans un dépôt public.
    manquants = [n for n in ("N8N_URL", "N8N_API_KEY", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "SUPABASE_ACCESS_TOKEN", "GITHUB_N8N_TOKEN",
                             "HSENTINEL_EMAIL_EQUIPE")
                 if not valeurs.get(n)]
    if manquants:
        sys.exit(f"Clés absentes de ~/.config/sentinelqa/.env : {', '.join(manquants)}")
    return valeurs


def secret_w3(env):
    """Le secret du webhook W3, lu dans le coffre de notre base (jamais affiché)."""
    r = httpx.post(f"https://api.supabase.com/v1/projects/{PROJET_SUPABASE}/database/query", timeout=30,
                   headers={"Authorization": f"Bearer {env['SUPABASE_ACCESS_TOKEN']}"},
                   json={"query": "select decrypted_secret from vault.decrypted_secrets where name = 'hsentinel_w3_secret';"})
    r.raise_for_status()
    lignes = r.json()
    if not lignes:
        sys.exit("Le secret hsentinel_w3_secret est absent du coffre Supabase.")
    return lignes[0]["decrypted_secret"]


class N8n:
    def __init__(self, env):
        racine = env["N8N_URL"].split("/home")[0].rstrip("/")
        self.racine = racine
        self.http = httpx.Client(base_url=f"{racine}/api/v1", timeout=30, headers={"X-N8N-API-KEY": env["N8N_API_KEY"]})

    def appel(self, methode, chemin, **kwargs):
        r = self.http.request(methode, chemin, **kwargs)
        if r.status_code >= 400:
            # Le message de n8n, jamais le corps envoyé (il peut contenir une clé).
            raise RuntimeError(f"{methode} {chemin} → HTTP {r.status_code} : {r.text[:300]}")
        return r.json() if r.content else {}

    def workflows(self):
        return self.appel("GET", "/workflows", params={"limit": 250}).get("data", [])


def identifiants(env, secret):
    """Les identifiants n8n dont les exports ont besoin, par type de nœud."""
    return {
        "supabaseApi": ("HSentinel · Supabase (clé secrète)", "supabaseApi",
                        {"host": env["SUPABASE_URL"], "serviceRole": env["SUPABASE_SECRET_KEY"]}),
        "httpHeaderAuth": ("HSentinel · Secret webhook W3", "httpHeaderAuth", {"name": "x-hsentinel-secret", "value": secret}),
        "githubApi": ("HSentinel · GitHub hsentinel-alertes", "githubApi",
                      {"server": "https://api.github.com", "user": "CodeurFort", "accessToken": env["GITHUB_N8N_TOKEN"]}),
    }


def preparer(export, ids, email_equipe):
    """Un export n8n réduit aux champs que l'API accepte, branché sur les identifiants de cette instance."""
    w = json.loads((ICI / "import" / export).read_text())
    for noeud in w["nodes"]:
        for type_, ref in list((noeud.get("credentials") or {}).items()):
            if type_ in ids:
                noeud["credentials"][type_] = {"id": ids[type_][0], "name": ids[type_][1]}
            else:
                # Un identifiant d'une autre instance : n8n refuse le workflow (« not shared with you »).
                # Sans identifiant, le nœud échoue à l'exécution et suit sa sortie d'erreur.
                del noeud["credentials"][type_]
        if noeud["name"] == "Constat et réglages":
            for a in noeud["parameters"]["assignments"]["assignments"]:
                if a["name"] == "email_equipe":
                    a["value"] = email_equipe
        # Les e-mails d'échec de W1 et W4 portaient l'adresse de Jahdiel en dur : ils vont au même destinataire (D-41).
        envoi = noeud.get("parameters", {}).get("sendTo")
        if noeud["type"].endswith(".gmail") and envoi and not envoi.startswith("="):
            noeud["parameters"]["sendTo"] = email_equipe
    reglages = {k: v for k, v in (w.get("settings") or {}).items() if k in REGLAGES_PERMIS}
    return {"name": w["name"], "nodes": w["nodes"], "connections": w["connections"], "settings": reglages}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--verifier", action="store_true", help="Lire l'instance et les exports sans rien écrire")
    parser.add_argument("--seul", choices=sorted(EXPORTS), help="Ne monter que ce workflow")
    args = parser.parse_args()
    env = lire_env()
    n8n = N8n(env)
    existants = {w["name"]: w for w in n8n.workflows()}
    print(f"Instance {n8n.racine} : API joignable, {len(existants)} workflow(s) existant(s).")
    if args.verifier:
        for cle, export in EXPORTS.items():
            print(f"  {cle} : {json.loads((ICI / 'import' / export).read_text())['name']}")
        return

    secret = secret_w3(env)
    ids = {}
    deja = {(c["type"], c["name"]): c["id"] for c in n8n.appel("GET", "/credentials", params={"limit": 250}).get("data", [])}
    for type_, (nom, type_n8n, donnees) in identifiants(env, secret).items():
        if (type_n8n, nom) in deja:  # relancer le script ne crée pas de doublon
            ids[type_] = (deja[(type_n8n, nom)], nom)
            print(f"Identifiant repris : {nom}")
            continue
        cree = n8n.appel("POST", "/credentials", json={"name": nom, "type": type_n8n, "data": donnees})
        ids[type_] = (cree["id"], nom)
        print(f"Identifiant créé : {nom}")
    gmail = [(i, nom) for (type_, nom), i in deja.items() if type_ == "gmailOAuth2"]
    if ("gmailOAuth2", GMAIL) in deja or len(gmail) == 1:  # le nom exact importe peu s'il n'y en a qu'un
        ids["gmailOAuth2"] = (deja[("gmailOAuth2", GMAIL)], GMAIL) if ("gmailOAuth2", GMAIL) in deja else gmail[0]
        print(f"Identifiant repris : {ids['gmailOAuth2'][1]}")
    else:
        print(f"Gmail pas encore connecté : les e-mails échoueront proprement. Créer « {GMAIL} » dans n8n (Connect Google), puis relancer ce script.")

    for cle, export in EXPORTS.items():
        if args.seul and cle != args.seul:
            continue
        corps = preparer(export, ids, env["HSENTINEL_EMAIL_EQUIPE"])
        if corps["name"] in existants:
            wf = n8n.appel("PUT", f"/workflows/{existants[corps['name']]['id']}", json=corps)
            print(f"Workflow mis à jour : {corps['name']}")
        else:
            wf = n8n.appel("POST", "/workflows", json=corps)
            print(f"Workflow créé : {corps['name']}")
        if cle in A_ACTIVER:
            n8n.appel("POST", f"/workflows/{wf['id']}/activate")
            actif = n8n.appel("GET", f"/workflows/{wf['id']}").get("active")
            print(f"  actif : {actif}")
    print(f"Webhook W3 : {n8n.racine}/webhook/hsentinel-w3-constat")


if __name__ == "__main__":
    main()
