"""Livrable 5 — banc de comparaison des modèles de guidage (autonome, Hugging Face).
Moyenne sur plusieurs passages par modèle : latence, tokens, coût estimé, pertinence (+ variance).
Pertinence = les priorités ciblent-elles les VRAIES zones privées de Cadence plutôt que les rubriques partagées.
Usage : python comparer_guidage.py [nb_runs]   (défaut 5)
"""
import datetime as dt, glob, json, os, statistics as st, sys, time

import httpx

import config  # charge le .env (HF_TOKEN)
import guidage_hf

MODELES = ["moonshotai/Kimi-K3", "moonshotai/Kimi-K2-Instruct", "Qwen/Qwen2.5-72B-Instruct"]
PRIVE = ("candidatures", "mon-espace", "profil", "entretien", "point", "sessions")
PARTAGE = ("guide", "documentation", "outils", "offres")
# Tarifs indicatifs USD/million (entrée, sortie) — à CONFIRMER sur la facturation HF.
TARIFS = {"moonshotai/Kimi-K3": (0.60, 2.50), "moonshotai/Kimi-K2-Instruct": (0.60, 2.50),
          "Qwen/Qwen2.5-72B-Instruct": (0.40, 1.20)}


def _pertinence(prio):
    cible = sum(any(k in p.get("zone", "").lower() for k in PRIVE) for p in prio)
    faux = sum(any(k in p.get("zone", "").lower() for k in PARTAGE)
               and not any(k in p.get("zone", "").lower() for k in PRIVE) for p in prio)
    return cible, faux


def _un_run(m, prompt, tok):
    t0 = time.time()
    r = httpx.post(guidage_hf.ROUTEUR, timeout=120, headers={"Authorization": "Bearer " + tok},
                   json={"model": m, "temperature": 0.2, "max_tokens": 2500,
                         "messages": [{"role": "user", "content": prompt}]})
    lat = time.time() - t0
    j = r.json()
    content = (j["choices"][0]["message"].get("content") or "") if r.status_code == 200 else ""
    u = j.get("usage", {}) or {}
    prio = guidage_hf._extraire_json(content)
    cible, faux = _pertinence(prio)
    ti, to = TARIFS.get(m, (0, 0))
    cout = ((u.get("prompt_tokens") or 0) * ti + (u.get("completion_tokens") or 0) * to) / 1e6
    return {"lat": lat, "tin": u.get("prompt_tokens"), "tout": u.get("completion_tokens"),
            "cout": cout, "prio": len(prio), "cible": cible, "faux": faux}


def main():
    runs = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    carto = json.load(open(sorted(glob.glob("resultats/carto_cadence_*.json"))[-1], encoding="utf-8"))
    prompt = guidage_hf.CONSIGNE % (guidage_hf._playbook(), json.dumps(carto.get("pages", carto), ensure_ascii=False)[:4000])
    tok = os.environ["HF_TOKEN"]
    resume = []
    for m in MODELES:
        essais = []
        for _ in range(runs):
            try:
                essais.append(_un_run(m, prompt, tok))
            except Exception as e:
                print("  (échec run", m, ":", str(e)[:60], ")")
        if not essais:
            continue
        agg = {"modele": m, "runs": len(essais),
               "latence_moy_s": round(st.mean(e["lat"] for e in essais), 1),
               "cout_moy_usd": round(st.mean(e["cout"] for e in essais), 5),
               "prio_moy": round(st.mean(e["prio"] for e in essais), 1),
               "cible_prive_moy": round(st.mean(e["cible"] for e in essais), 1),
               "cible_prive_min": min(e["cible"] for e in essais),
               "cible_prive_max": max(e["cible"] for e in essais),
               "faux_leads_moy": round(st.mean(e["faux"] for e in essais), 1)}
        resume.append(agg)
    f = __import__("pathlib").Path("resultats") / f"comparaison_moyenne_{dt.datetime.now():%H%M%S}.json"
    f.write_text(json.dumps(resume, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nMoyenne sur {runs} passages par modèle\n")
    print(f"{'MODÈLE':<34}{'lat.moy':>9}{'$ moy':>9}{'prio':>6}{'privé(min-max)':>16}{'faux':>6}")
    for a in resume:
        print(f"{a['modele']:<34}{str(a['latence_moy_s'])+'s':>9}{a['cout_moy_usd']:>9}{a['prio_moy']:>6}"
              f"{str(a['cible_prive_moy'])+' ('+str(a['cible_prive_min'])+'-'+str(a['cible_prive_max'])+')':>16}{a['faux_leads_moy']:>6}")
    print(f"\n→ {f.name}  ·  'privé' = priorités ciblant les vraies zones privées (moy + min-max = variance) ; "
          "'faux' = fausses pistes (rubriques partagées) ; coût indicatif, à confirmer.")


if __name__ == "__main__":
    main()
