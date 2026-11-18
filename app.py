"""HSentinel — console d'audit (web app locale).
Lance les volets QA (auditer.py) et Pentest (pentest.py) sur une cible, puis affiche le relevé.
Backend Python (les audits durent 2-4 min, donc hors d'une fonction serverless). Autonome : pilote tes agents H.
Lancer :  .venv/bin/python app.py   →  http://127.0.0.1:8750
"""
import glob, json, os, subprocess, time, uuid
from pathlib import Path

from flask import Flask, jsonify, request

ICI = Path(__file__).parent
PY = str(ICI / ".venv" / "bin" / "python")
RES = ICI / "resultats"
app = Flask(__name__)
JOBS = {}  # id -> {volet, cible, debut, proc, log}


def _cibles():
    return json.loads((ICI / "cibles.json").read_text(encoding="utf-8"))


@app.get("/api/cibles")
def api_cibles():
    c = {k: v.get("nom", k) for k, v in _cibles().items() if not k.startswith("_")}
    return jsonify(c)


@app.post("/api/lancer")
def api_lancer():
    d = request.get_json(force=True)
    cible, volet = d.get("cible"), d.get("volet")
    prop, intr = d.get("proprietaire", "B"), d.get("intrus", "A")
    if volet == "pentest":
        cmd = [PY, "pentest.py", cible, "--proprietaire", prop, "--intrus", intr, "--budget", "80"]
    else:
        cmd = [PY, "auditer.py", cible, "--proprietaire", prop, "--intrus", intr, "--max-objets", "2"]
    jid = uuid.uuid4().hex[:8]
    log = RES / f"job_{jid}.log"
    proc = subprocess.Popen(cmd, cwd=str(ICI), stdout=open(log, "w"), stderr=subprocess.STDOUT)
    JOBS[jid] = {"volet": volet, "cible": cible, "debut": time.time(), "proc": proc, "log": str(log)}
    return jsonify({"job": jid})


@app.get("/api/jobs")
def api_jobs():
    out = []
    for jid, j in JOBS.items():
        fini = j["proc"].poll() is not None
        tail = ""
        try:
            tail = Path(j["log"]).read_text(encoding="utf-8").strip().splitlines()[-1][:140]
        except Exception:
            pass
        out.append({"job": jid, "volet": j["volet"], "cible": j["cible"],
                    "duree_s": round(time.time() - j["debut"]), "fini": fini, "ligne": tail})
    return jsonify(sorted(out, key=lambda x: x["job"]))


@app.get("/api/audits")
def api_audits():
    items = []
    for f in sorted(glob.glob(str(RES / "audit_*.json")) + glob.glob(str(RES / "pentest_*.json"))):
        try:
            d = json.loads(Path(f).read_text(encoding="utf-8"))
            items.append({"fichier": Path(f).name, "cible": d.get("cible"),
                          "volet": d.get("volet", "qa"), "date": d.get("date", ""),
                          "resume": d.get("resume", {})})
        except Exception:
            pass
    return jsonify(sorted(items, key=lambda x: x["fichier"], reverse=True))


@app.get("/api/audit")
def api_audit():
    f = RES / os.path.basename(request.args.get("f", ""))
    if not f.exists():
        return jsonify({"erreur": "introuvable"}), 404
    return jsonify(json.loads(f.read_text(encoding="utf-8")))


@app.get("/")
def index():
    return PAGE


PAGE = r"""<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>HSentinel — Console d'audit</title>
<style>
:root{--bg:#0e1116;--card:#171c24;--line:#262d38;--txt:#e6edf3;--mut:#9aa7b4;--accent:#2dd4bf;--red:#f87171;--green:#4ade80;--amber:#fbbf24;--gray:#64748b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.wrap{max-width:1000px;margin:0 auto;padding:24px 16px}
h1{font-size:22px;margin:0 0 2px}.sub{color:var(--mut);margin:0 0 20px;font-size:13px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
label{display:block;font-size:12px;color:var(--mut);margin:8px 0 3px}
select,input{width:100%;background:#0e1116;border:1px solid var(--line);color:var(--txt);border-radius:8px;padding:8px}
.row{display:flex;gap:12px;flex-wrap:wrap}.row>div{flex:1;min-width:120px}
button{background:var(--accent);color:#06241f;border:0;border-radius:8px;padding:10px 16px;font-weight:600;cursor:pointer;margin-top:14px}
button:disabled{opacity:.5;cursor:wait}
.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:600}
.fuite{background:rgba(248,113,113,.15);color:var(--red)}.ok{background:rgba(74,222,128,.15);color:var(--green)}
.nc{background:rgba(251,191,36,.15);color:var(--amber)}.pa{background:rgba(100,116,139,.2);color:var(--gray)}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{text-align:left;padding:8px;border-bottom:1px solid var(--line)}
th{color:var(--mut);font-weight:600;font-size:12px}a{color:var(--accent)}.mut{color:var(--mut);font-size:13px}
.k{font-size:12px;color:var(--mut)}.pill{font-size:11px;border:1px solid var(--line);border-radius:6px;padding:1px 6px;color:var(--mut)}
.job{display:flex;justify-content:space-between;gap:10px;align-items:center;border-bottom:1px solid var(--line);padding:8px 0;font-size:13px}
</style></head><body><div class="wrap">
<h1>HSentinel — Console d'audit</h1>
<p class="sub">Contrôle d'accès multi-tenant · QA (boîte noire) & Pentest (profond, guidé par Kimi K3) · agents H + verdict par le code</p>

<div class="card">
  <div class="row">
    <div><label>Cible</label><select id="cible"></select></div>
    <div><label>Volet</label><select id="volet"><option value="qa">QA — à chaque mise à jour</option><option value="pentest">Pentest — en profondeur (Kimi K3)</option></select></div>
    <div><label>Propriétaire</label><input id="prop" value="B"></div>
    <div><label>Intrus</label><input id="intr" value="A"></div>
  </div>
  <button id="go" onclick="lancer()">Lancer l'audit</button>
  <div id="jobs"></div>
</div>

<div class="card">
  <h3 style="margin:0 0 10px">Relevés</h3>
  <table><thead><tr><th>Cible</th><th>Volet</th><th>Résumé</th><th>Date</th><th></th></tr></thead><tbody id="audits"></tbody></table>
</div>
<div class="card" id="detail" style="display:none"></div>

<script>
async function j(u,o){const r=await fetch(u,o);return r.json()}
async function cibles(){const c=await j('/api/cibles');const s=document.getElementById('cible');s.innerHTML='';for(const k in c){s.innerHTML+=`<option value="${k}">${c[k]}</option>`}}
async function lancer(){const b=document.getElementById('go');b.disabled=true;b.textContent='Audit lancé…';
 await j('/api/lancer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cible:cible.value,volet:volet.value,proprietaire:prop.value,intrus:intr.value})});
 setTimeout(()=>{b.disabled=false;b.textContent="Lancer l'audit"},2000);poll()}
function badge(v){const m={fuite:['fuite','FUITE'],pas_de_fuite:['ok','pas de fuite'],refus_attendu:['ok','refus attendu'],partage_sain:['pa','partagé'],non_concluant:['nc','non concluant']};const x=m[v]||['pa',v||'—'];return `<span class="badge ${x[0]}">${x[1]}</span>`}
async function poll(){const js=await j('/api/jobs');document.getElementById('jobs').innerHTML=js.map(x=>`<div class="job"><span><b>${x.volet.toUpperCase()}</b> · ${x.cible} <span class="pill">${x.fini?'terminé':'en cours'}</span></span><span class="mut">${x.duree_s}s — ${x.ligne||''}</span></div>`).join('');audits()}
async function audits(){const a=await j('/api/audits');document.getElementById('audits').innerHTML=a.map(x=>{const r=x.resume||{};const res=('fuites' in r)?`${r.fuites||0} fuite(s) / ${r.objets_testes||r.objets_adressables||0} objet(s)`:'';return `<tr><td>${x.cible||''}</td><td>${(x.volet||'qa').toUpperCase()}</td><td>${res}</td><td class="mut">${(x.date||'').replace('T',' ').slice(0,16)}</td><td><a onclick="voir('${x.fichier}')" style="cursor:pointer">voir →</a></td></tr>`}).join('')}
async function voir(f){const d=await j('/api/audit?f='+encodeURIComponent(f));const el=document.getElementById('detail');el.style.display='block';
 let h=`<h3 style="margin:0 0 4px">${d.cible||''} — ${(d.volet||'qa').toUpperCase()}</h3><p class="mut">Propriétaire ${d.proprietaire} · intrus ${d.intrus} · ${(d.date||'').replace('T',' ').slice(0,16)}</p>`;
 if(d.priorites&&d.priorites.length){h+=`<p class="k">Priorités du guidage (Kimi K3)</p><ul class="mut">`+d.priorites.slice(0,5).map(p=>`<li>${p.zone} [${p.type_test}] — ${p.raison||''}</li>`).join('')+`</ul>`}
 h+=`<table><thead><tr><th>Objet / URL</th><th>Verdict</th><th>Gravité</th><th>Preuve</th></tr></thead><tbody>`;
 (d.constats||[]).forEach(c=>{h+=`<tr><td class="mut">${c.signature||c.url||''}<br><span class="k">${c.url||''}</span></td><td>${badge(c.verdict)}</td><td>${c.gravite?('<b>'+c.gravite+'</b><br><span class="k">'+(c.raisons_gravite||[]).join(', ')+'</span>'):'<span class="k">—</span>'}</td><td>${c.replay?('<a href="'+c.replay+'" target="_blank">replay ↗</a>'):''}</td></tr>`;if(c.explication){h+=`<tr><td colspan="4" class="mut" style="padding-left:16px">🗣️ ${c.explication} <span class="pill">${c.explication_par_ia?'rédigé par IA':'repli'}</span></td></tr>`}});
 h+=`</tbody></table>`;el.innerHTML=h;el.scrollIntoView({behavior:'smooth'})}
cibles();poll();setInterval(poll,4000);
</script>
</div></body></html>"""


if __name__ == "__main__":
    print("HSentinel console → http://127.0.0.1:8750")
    app.run(host="127.0.0.1", port=8750, debug=False)
