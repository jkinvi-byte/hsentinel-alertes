"""Produit deux documents HTML autonomes, sans appel réseau, depuis les Markdown.

Exécution : python3 contributions/defense-cto/generer-lecture.py
Dépendance : Markdown (déjà présent dans l'environnement de préparation).
"""

from html import escape
from pathlib import Path
import re

import markdown


RACINE = Path(__file__).resolve().parent

SCHEMA = '''<figure class="architecture">
<svg viewBox="0 0 1000 610" role="img" aria-labelledby="schema-titre schema-description" xmlns="http://www.w3.org/2000/svg">
<title id="schema-titre">Architecture de HSentinel au commit 902b0c9</title>
<desc id="schema-description">La console Vercel prépare avec Hugging Face et dépose les missions dans Supabase. Les workers Python sur le Mac utilisent H et les contrôles HTTP ou le scanner. Ils enregistrent les résultats ; n8n traite les alertes.</desc>
<defs><marker id="fleche" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#678098"/></marker></defs>
<g fill="none" stroke="#678098" stroke-width="2" marker-end="url(#fleche)">
<path d="M500 85V133"/><path d="M350 50H285"/><path d="M500 213V241H268V270"/><path d="M500 241H732V270"/>
<path d="M268 350V380H170V410"/><path d="M268 380H500V410"/><path d="M732 350V380H830V410"/><path d="M732 380H500"/>
<path d="M170 480V524H500V545"/><path d="M500 480V545"/><path d="M830 480V524H500"/>
<path d="M650 173H730"/><path d="M925 213V242"/>
</g>
<g font-family="Arial, sans-serif" text-anchor="middle">
<rect x="350" y="15" width="300" height="70" rx="12" fill="#10243b"/>
<text x="500" y="44" fill="white" font-size="19" font-weight="bold">Console Next.js</text><text x="500" y="66" fill="#cedef0" font-size="14">Vercel · session opérateur</text>
<rect x="30" y="15" width="255" height="70" rx="12" fill="#ede9fe" stroke="#cdc3f5"/>
<text x="157" y="44" fill="#493581" font-size="18" font-weight="bold">Hugging Face</text><text x="157" y="66" fill="#493581" font-size="14">Plan · voix · priorités scanner</text>
<rect x="350" y="133" width="300" height="80" rx="12" fill="#ecf8f0" stroke="#b5d6c0"/>
<text x="500" y="165" fill="#205237" font-size="19" font-weight="bold">Supabase / Postgres</text><text x="500" y="189" fill="#205237" font-size="14">Files · événements · rapports · constats</text>
<rect x="730" y="133" width="240" height="80" rx="12" fill="#f7f1e6" stroke="#e3d3b4"/>
<text x="850" y="165" fill="#6d5324" font-size="18" font-weight="bold">n8n</text><text x="850" y="189" fill="#6d5324" font-size="14">Alertes et intégrations</text>
<text x="925" y="263" fill="#6d5324" font-size="13">Ticket / e-mail</text>
<rect x="90" y="270" width="355" height="80" rx="12" fill="#eaf2ff" stroke="#b7cbe9"/>
<text x="268" y="300" fill="#1c477e" font-size="19" font-weight="bold">Worker QA · Python</text><text x="268" y="326" fill="#1c477e" font-size="14">Mac de l'équipe · rapport v3</text>
<rect x="555" y="270" width="355" height="80" rx="12" fill="#eaf2ff" stroke="#b7cbe9"/>
<text x="732" y="300" fill="#1c477e" font-size="19" font-weight="bold">Worker pentest · Python</text><text x="732" y="326" fill="#1c477e" font-size="14">Mac de l'équipe · rapport v2</text>
<rect x="40" y="410" width="260" height="70" rx="12" fill="#fff" stroke="#c1ceda"/>
<text x="170" y="438" fill="#21354c" font-size="17" font-weight="bold">Assertions QA + HTTP</text><text x="170" y="462" fill="#52687f" font-size="13">Critères et observations</text>
<rect x="370" y="410" width="260" height="70" rx="12" fill="#fff" stroke="#c1ceda"/>
<text x="500" y="438" fill="#21354c" font-size="17" font-weight="bold">Agents H</text><text x="500" y="462" fill="#52687f" font-size="13">Navigateur cloud · coffres · sessions</text>
<rect x="700" y="410" width="260" height="70" rx="12" fill="#fff" stroke="#c1ceda"/>
<text x="830" y="438" fill="#21354c" font-size="17" font-weight="bold">Scanner selon profil</text><text x="830" y="462" fill="#52687f" font-size="13">HTTP · Playwright · ZAP</text>
<rect x="290" y="545" width="420" height="54" rx="12" fill="#10243b"/>
<text x="500" y="579" fill="#fff" font-size="18" font-weight="bold">Application autorisée</text>
</g></svg>
<figcaption>Les workers enregistrent leurs résultats dans Supabase. Le schéma sépare le traitement des missions des requêtes de la console ; les contrôles du scanner ne passent pas tous par H.</figcaption>
</figure>'''

STYLE = '''
:root{--ink:#172d43;--muted:#60758a;--blue:#1d58a8;--line:#dce4ed;--paper:#fff;--bg:#f5f7fa;--side:270px}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
a{color:var(--blue);text-underline-offset:3px}a:hover{color:#113868}aside{position:fixed;inset:0 auto 0 0;width:var(--side);overflow:auto;padding:28px 20px;border-right:1px solid var(--line);background:#eef2f6}
.brand{font-weight:850;font-size:20px;letter-spacing:-.8px}.eyebrow{color:var(--muted);font-size:11px;letter-spacing:1.4px;text-transform:uppercase}.toc ul{padding:0;list-style:none}.toc ul ul{display:none}.toc>ul>li>a{display:none}.toc>ul>li>ul{display:block}.toc>ul>li>ul>li{margin:13px 0;line-height:1.4}.toc a{color:#36506a;text-decoration:none;font-size:13px}
main{max-width:1180px;margin:0 auto 0 var(--side);padding:45px 5vw 100px}article{background:var(--paper);padding:38px 48px;border:1px solid var(--line);border-radius:16px;box-shadow:0 5px 30px #173b5f06}
h1{font-size:38px;line-height:1.16;letter-spacing:-1.5px;max-width:760px;margin:0 0 26px}h2{font-size:25px;line-height:1.25;letter-spacing:-.6px;margin:54px 0 22px;padding-top:20px;border-top:1px solid var(--line)}h3{font-size:19px;line-height:1.4;margin:30px 0 12px}p{margin:14px 0}li{margin:8px 0}strong{font-weight:730}
blockquote{margin:24px 0;padding:8px 22px;border-left:4px solid #2d66b7;background:#f0f5fc;border-radius:0 9px 9px 0}blockquote p{margin:10px 0}code{font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;background:#edf1f6;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}pre{padding:20px;background:#eef2f6;overflow-x:auto}
.table-scroll{overflow:auto;margin:22px 0}table{width:100%;border-collapse:collapse;font-size:13px;line-height:1.55;text-align:left}th{background:#ecf2f8;color:#294965;font-size:12px;padding:12px;vertical-align:top}td{padding:12px;vertical-align:top;border-bottom:1px solid var(--line)}tr:nth-child(even) td{background:#f9fbfd}td p{margin:0}table code{font-size:11px}
.architecture{margin:24px 0;background:#f8fafd;border:1px solid var(--line);border-radius:12px;padding:14px}.architecture svg{width:100%;height:auto;display:block}figcaption{font-size:12px;color:var(--muted);line-height:1.5;padding:12px}
.tools{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 26px}.tools button,.tools a{font-family:inherit;font-weight:600;font-size:12px;line-height:1.5;border:1px solid #ccd8e5;background:#fff;border-radius:7px;padding:8px 12px;cursor:pointer;color:var(--blue);text-decoration:none}.tools button:hover,.tools a:hover{background:#eaf2fc}
.qa{border:1px solid var(--line);border-radius:10px;margin:12px 0;padding:15px 19px;background:#fff}.qa summary{font-weight:730;font-size:17px;cursor:pointer;line-height:1.45}.qa[open] summary{margin-bottom:12px}.qa>div>p:last-child{margin-bottom:3px}
.reference{font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap}.note{font-size:12px;color:var(--muted)}footer{margin-top:25px;font-size:12px;color:var(--muted)}section{overflow-wrap:anywhere}.print-only{display:none}
@media(min-width:1600px){main{margin-left:calc(var(--side) + (100vw - 1600px)/2)}}
@media(max-width:1050px){:root{--side:220px}aside{padding:22px 14px}main{padding:24px}article{padding:30px}h1{font-size:32px}}
@media(max-width:760px){aside{position:relative;width:auto;border-right:0;border-bottom:1px solid var(--line);padding:20px}.toc{display:none}main{margin:0;padding:14px}article{padding:24px 19px}h1{font-size:30px}h2{font-size:23px}.tools{margin-bottom:15px}table{min-width:620px}.qa summary{font-size:16px}}
@media print{@page{size:A4;margin:16mm 14mm 18mm}body{background:#fff;font-size:10pt;line-height:1.5}aside,.tools{display:none}main{margin:0;padding:0;max-width:none}article{padding:0;border:0;box-shadow:none;border-radius:0}h1{font-size:25pt}h2{font-size:17pt;margin-top:28px;break-after:avoid}h3,summary{break-after:avoid}p{orphans:3;widows:3}table{min-width:0;font-size:8pt;line-height:1.4}th,td{padding:7px}tr{break-inside:avoid}thead{display:table-header-group}a{color:inherit;text-decoration:none}blockquote,.architecture{break-inside:avoid}svg{max-height:170mm}.table-scroll{overflow:visible}.qa{padding:10px 12px}.qa>div{display:block!important}.qa summary{font-size:11pt}.print-only{display:block}}
'''

SCRIPT = '''
document.querySelectorAll('[data-qa]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('details.qa').forEach(item=>item.open=button.dataset.qa==='open');
}));
document.querySelector('[data-print]').addEventListener('click',()=>window.print());
let previous;
window.addEventListener('beforeprint',()=>{previous=[...document.querySelectorAll('details.qa')].map(d=>d.open);document.querySelectorAll('details.qa').forEach(d=>d.open=true)});
window.addEventListener('afterprint',()=>{document.querySelectorAll('details.qa').forEach((d,i)=>d.open=previous?.[i]??true)});
'''


def produire(nom, titre, fiche=False):
    source = (RACINE / f'{nom}.md').read_text()
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'])
    contenu = md.convert(source)
    contenu = re.sub(r'<pre><code class="language-mermaid">[\s\S]*?</code></pre>', SCHEMA, contenu)
    contenu = re.sub(r'<table>([\s\S]*?)</table>', r'<div class="table-scroll"><table>\1</table></div>', contenu)
    # Les quarante questions deviennent des cartes ouvrables pour l'entraînement oral.
    contenu = re.sub(r'<h3 id="([^"]+)">(\d+\.\s*«.*?)</h3>\s*([\s\S]*?)(?=<h[23]\b|\Z)',
        r'<details class="qa" id="\1" open><summary>\2</summary><div>\3</div></details>', contenu)
    contenu = re.sub(r'<li><strong>\[((?:C|R|E)\d+)\]</strong>', r'<li id="source-\1"><strong>[\1]</strong>', contenu)
    contenu = re.sub(r'(?<!<strong>)\[((?:C|R|E)\d+)\](?!</strong>)', r'<a class="reference" href="#source-\1">[\1]</a>', contenu)
    contenu = contenu.replace('href="DEFENSE-TECHNIQUE-CTO.md"', 'href="DEFENSE-TECHNIQUE-CTO.html"')
    destination = 'DEFENSE-TECHNIQUE-CTO.html' if fiche else 'FICHE-ORALE-CTO.html'
    label = 'Ouvrir le dossier complet' if fiche else 'Fiche orale · révision rapide'
    entrainement = '' if fiche else '<button data-qa="close">Mode oral · masquer les réponses</button><button data-qa="open">Afficher les réponses</button>'
    page = f'''<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>{escape(titre)}</title><style>{STYLE}</style></head>
<body><aside><div class="eyebrow">Préparation du jury</div><div class="brand">HSentinel / CTO</div>
<p class="note">20 novembre 2026<br>Code examiné : 902b0c9</p>{md.toc}</aside>
<main><div class="eyebrow">Architecture vérifiée · décisions · preuves</div>
<div class="tools"><a href="{destination}">{label}</a>{entrainement}<button data-print>Imprimer / enregistrer en PDF</button></div>
<article>{contenu}</article><footer>Document local autonome · aucun service externe ni donnée de compte chargé par cette page.</footer></main>
<script>{SCRIPT}</script></body></html>'''
    (RACINE / f'{nom}.html').write_text(page)
    return page


if __name__ == '__main__':
    for nom, titre, fiche in [('DEFENSE-TECHNIQUE-CTO', 'HSentinel — Défense technique CTO', False),
                              ('FICHE-ORALE-CTO', 'HSentinel — Fiche orale CTO', True)]:
        page = produire(nom, titre, fiche)
        print(f'{nom}.html : {len(page):,} caractères ; {page.count("class=\"qa\"")} questions interactives')
