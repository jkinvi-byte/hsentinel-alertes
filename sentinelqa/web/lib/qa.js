// Le volet QA, côté serveur : le plan préparé par Hugging Face, la dictée, la file des missions dans Supabase
// (tables qa_*, séparées des audits du pentest) et les captures de l'agent H, relayées sans exposer la clé.
// Le runner (runner/qa_moteur.py) revalide chaque mission : ce module refuse tôt, il ne fait pas foi.
import 'server-only';
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { requete } from './supabase';
import { CATALOGUE_QA, cibleQa, sansSecret, validerPlan, validerMissionQa } from './qa-contrat.mjs';

export { CATALOGUE_QA, cibleQa, validerMissionQa };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ROUTEUR = 'https://router.huggingface.co/v1/chat/completions';

// Une clé : la variable d'environnement (Vercel), sinon le fichier rangé hors du dépôt. Jamais renvoyée au navigateur.
function cle(nom, fichier) {
  if (process.env[nom]) return process.env[nom];
  try {
    const ligne = readFileSync(path.join(os.homedir(), fichier), 'utf8').split('\n').find((l) => l.trim().startsWith(`${nom}=`));
    // `holo login` écrit la clé entre guillemets : envoyée telle quelle, H répond 403 (vécu le 18/11 à 7 h 03).
    return ligne ? ligne.slice(ligne.indexOf('=') + 1).trim().replace(/^(['"])(.*)\1$/, '$2') : null;
  } catch { return null; }
}
const jetonHf = () => cle('HF_TOKEN', '.config/sentinelqa/.env');
const cleH = () => cle('HAI_API_KEY', '.config/hai/.env');

// Les liens de la page d'entrée, avec leur libellé : la carte du site donnée au modèle de préparation.
async function liensConnus(cible) {
  const reponse = await fetch(cible.entree, {
    headers: { 'User-Agent': 'HSentinel-QA/0.3 (authorized read-only QA check)' }, signal: AbortSignal.timeout(10000), redirect: 'follow',
  });
  const html = (await reponse.text()).slice(0, cible.limites.octets_par_lecture);
  const liens = new Map();
  for (const [, href, libelle] of html.matchAll(/<a[^>]+href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    let chemin;
    try { chemin = new URL(href.replaceAll('&amp;', '&'), cible.origine + '/'); } catch { continue; }
    if (chemin.origin !== cible.origine || chemin.pathname.startsWith('/_')) continue;
    const texte = libelle.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    const cleChemin = chemin.pathname.replace(/\/+$/, '') || '/';
    if (texte && !liens.has(cleChemin)) liens.set(cleChemin, texte.slice(0, 80));
  }
  return [...liens].slice(0, 80).map(([chemin, libelle]) => ({ chemin, libelle }));
}

// Le plan : Hugging Face découpe la consigne en étapes et en critères. Il reste hors du verdict.
export async function preparerPlan(targetId, instruction) {
  const cible = cibleQa(targetId);
  const regles = CATALOGUE_QA.preparation;
  const jeton = jetonHf();
  if (!jeton) throw new Error('Le jeton Hugging Face n’est pas configuré sur ce serveur.');
  const donnees = { consigne: instruction, site: cible.origine, liens_connus: await liensConnus(cible) };
  const debut = performance.now();
  const reponse = await fetch(ROUTEUR, {
    method: 'POST', signal: AbortSignal.timeout(45000),
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: regles.modele, temperature: 0, max_tokens: 900, response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: regles.consigne_systeme.join('\n') }, { role: 'user', content: JSON.stringify(donnees) }],
    }),
  });
  if (!reponse.ok) throw new Error(`Hugging Face a répondu HTTP ${reponse.status}.`);
  const corps = await reponse.json();
  const bloc = (corps.choices?.[0]?.message?.content ?? '').match(/\{[\s\S]*\}/);
  if (!bloc) throw new Error('Le modèle de préparation n’a pas rendu de plan lisible.');
  const plan = JSON.parse(bloc[0]);
  plan.preparation = {
    modele: regles.modele, fournisseur: reponse.headers.get('x-inference-provider') ?? regles.modele.split(':')[1] ?? '',
    latence_s: Math.round((performance.now() - debut) / 10) / 100, tokens: corps.usage?.total_tokens ?? null,
  };
  return validerPlan(plan, cible);
}

// La dictée : l'audio devient le même texte que la saisie, modifiable avant tout lancement.
export async function transcrire(audio, type) {
  const jeton = jetonHf();
  if (!jeton) throw new Error('Le jeton Hugging Face n’est pas configuré sur ce serveur.');
  const modele = CATALOGUE_QA.transcription.modele;
  const debut = performance.now();
  const reponse = await fetch(`https://router.huggingface.co/hf-inference/models/${modele}`, {
    method: 'POST', body: audio, signal: AbortSignal.timeout(60000),
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': type },
  });
  if (!reponse.ok) throw new Error(`La transcription a échoué (HTTP ${reponse.status}).`);
  const { text } = await reponse.json();
  return { texte: String(text ?? '').trim(), modele, latence_s: Math.round((performance.now() - debut) / 10) / 100 };
}

// ── La file des missions QA ─────────────────────────────────────────────────────────────────────────────

export async function creerMission(mission) {
  const [ligne] = await requete('qa_missions', {
    methode: 'POST', prefer: 'return=representation', corps: { cible: mission.target_id, demande: mission },
  });
  return ligne.id;
}

export async function lireMission(id) {
  if (!UUID.test(id)) return null;
  const [ligne] = await requete(`qa_missions?select=id,cree_le,statut,demande,rapport,erreur,debut,fin,arret_demande&id=eq.${id}`);
  return ligne ? { ...ligne, demande: sansSecret(ligne.demande) } : null;
}

export async function lireEvenementsQa(id, apres = 0) {
  if (!UUID.test(id)) return [];
  const depuis = Number.isInteger(Number(apres)) ? Number(apres) : 0;
  return requete(`qa_evenements?select=id,quand,type,message,donnees&mission_id=eq.${id}&id=gt.${depuis}&order=id.asc&limit=500`);
}

export async function listerMissions() {
  const lignes = await requete('qa_missions?select=id,cree_le,statut,demande,erreur,resume:rapport->summary,criteres:rapport->summary_criteres,'
    + 'duree:rapport->duration_s,cout:rapport->cost_h,titre:rapport->titre&order=cree_le.desc&limit=12');
  return lignes.map((l) => ({ ...l, demande: sansSecret(l.demande) }));
}

// L'arrêt : avant le départ, la mission se ferme ici ; ensuite, le worker annule la session H et garde les preuves.
// La clé publique du runner (JWK), avec laquelle le navigateur chiffre le mot de passe d'un site connecté.
export async function cleRunner() {
  const [cle] = await requete('cles_runner?select=id,cle_publique&order=id.desc&limit=1');
  return cle ? { id: cle.id, jwk: cle.cle_publique } : null;
}

export async function demanderArret(id) {
  const ligne = await lireMission(id);
  if (!ligne) return null;
  if (!['en_attente', 'en_cours'].includes(ligne.statut)) return { termine: true };
  await requete('qa_evenements', { methode: 'POST', corps: { mission_id: id, type: 'info', message: 'Arrêt demandé par l’opérateur.' } });
  if (ligne.statut === 'en_attente') {
    const instant = new Date().toISOString();
    const criteres = ligne.demande.plan?.criteres ?? [];
    const rapport = {
      schema_version: 3, phase: 'completed', mode: 'qa', request: ligne.demande, titre: ligne.demande.plan?.titre ?? 'Exploration bornée du site',
      started_at: instant, finished_at: instant, duration_s: 0, cost_h: 0, cost_hf: null, interruption: 'cancelled', parcours: [], visites: [],
      evidence: [], sessions: [], violations: [], hors_origine: [],
      results: criteres.map((c) => ({ id: c.id, type: c.type, description: c.description, attendu: c.valeur, status: 'skipped',
        reason_code: 'cancelled_before_start', verification: null, observe: 'Mission arrêtée avant son départ.', agent: null, chemin: null, preuves: [] })),
      summary: { passed: 0, failed: 0, inconclusive: 0, skipped: criteres.length },
    };
    // Comparaison avec le statut : ne jamais écraser une mission que le worker vient de prendre.
    const fermees = await requete(`qa_missions?id=eq.${id}&statut=eq.en_attente`, {
      // La demande relue est déjà sans texte chiffré : elle le remplace dans la base, la mission ne partira plus.
      methode: 'PATCH', prefer: 'return=representation', corps: { statut: 'termine', fin: instant, arret_demande: true, rapport, demande: ligne.demande },
    });
    if (fermees.length) return { termine: true };
  }
  await requete(`qa_missions?id=eq.${id}`, { methode: 'PATCH', corps: { arret_demande: true } });
  return { demande: true };
}

// ── Les captures de l'agent : relayées depuis H, la clé reste sur ce serveur ────────────────────────────

export async function capture(session, source) {
  if (!UUID.test(session ?? '') || typeof source !== 'string') return null;
  const prefixe = `https://agp.eu.hcompany.ai/api/v1/trajectories/${session}/resources/`;
  const reste = source.slice(prefixe.length);
  if (!source.startsWith(prefixe) || !/^[A-Za-z0-9._\-/]+\.(png|jpe?g|webp)$/.test(reste) || reste.includes('..')) return null;
  const cleApi = cleH();
  if (!cleApi) return null;
  // La redirection mène à un lien S3 présigné ; fetch retire l'en-tête Authorization en changeant d'origine.
  const reponse = await fetch(source, { headers: { Authorization: `Bearer ${cleApi}` }, redirect: 'follow', signal: AbortSignal.timeout(20000) });
  if (!reponse.ok) return null;
  return { corps: await reponse.arrayBuffer(), type: reponse.headers.get('content-type') ?? 'image/png' };
}
