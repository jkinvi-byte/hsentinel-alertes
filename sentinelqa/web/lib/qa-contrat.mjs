// Le contrat du volet QA, partagé par les routes, les écrans et les tests : le catalogue (contrats/qa.json, lu aussi
// par le runner), les mots de l'interface et la validation d'une mission. Mêmes règles que runner/qa_moteur.py.
import catalogue from '../../contrats/qa.json' with { type: 'json' };

export const CATALOGUE_QA = catalogue;
export const STATUTS_QA = { passed: 'Conforme', failed: 'Écart constaté', inconclusive: 'Non concluant', skipped: 'Non exécuté' };
export const VERIFICATIONS = { code: 'Vérifié par le code', citation: 'Citation retrouvée sur la page', agent: 'Signalé par l’agent seul' };
export const TYPES_CRITERES = { page: 'Page atteinte', texte: 'Texte exact', constat: 'Constat cité' };
// Un écart que l'agent signale et cite, sans preuve du code : il reste non concluant, mais il se lit comme tel.
const LIBELLES_RAISONS = { agent_reported_gap: 'Écart signalé · à confirmer', agent_disagrees: 'Désaccord · à confirmer',
  repeated_attempts: 'Parcours difficile · à revoir', h_text_partial: 'Titre tronqué par H · à voir sur la capture',
  write_risk: 'Mission arrêtée · geste à risque', forbidden_page: 'Mission arrêtée · page interdite' };
// Un contrôle pentest qui échoue est une faille prouvée, pas un écart fonctionnel : le canon distingue les deux (README, Règles).
const FAILLES_PROUVEES = new Set(['vulnerability_proven', 'protected_content_received']);
export const libelleStatut = (status, raison) => (status === 'failed' && FAILLES_PROUVEES.has(raison) && 'Faille prouvée')
  || (status === 'inconclusive' && LIBELLES_RAISONS[raison]) || STATUTS_QA[status] || status;
export function bilanCriteres(rapport) {
  if (rapport.summary_criteres) return rapport.summary_criteres;
  const criteres = rapport.results.filter((x) => x.type !== 'auto');
  return Object.fromEntries(Object.keys(STATUTS_QA).map((s) => [s, criteres.filter((x) => x.status === s).length]));
}
export const MODELES_H = ['holo4-35b-a3b', 'holo4-27b'];
const CHAMPS = new Set(['schema_version', 'mode', 'target_id', 'pilotage', 'appareil', 'instruction', 'source', 'plan', 'modele_h',
  'preparation_humaine_s', 'compte']);
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}$/;
const CHIFFRE = /^[A-Za-z0-9+/]+={0,2}$/;

// Le compte de test d'un site connecté. Le mot de passe arrive chiffré par le navigateur avec la clé publique du runner
// (RSA-OAEP, SHA-256, JSON {"mot_de_passe": …}) : ce serveur ne le voit jamais en clair, le runner le verse dans un coffre H.
export function validerCompte(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c) || Object.keys(c).some((k) => !['identifiant', 'secret_chiffre', 'identite'].includes(k))) {
    throw new Error('Ce site se teste connecté : il faut un compte de test.');
  }
  if (typeof c.identifiant !== 'string' || !EMAIL.test(c.identifiant.trim())) throw new Error('L’adresse du compte de test est invalide.');
  if (typeof c.secret_chiffre !== 'string' || c.secret_chiffre.length < 100 || c.secret_chiffre.length > 2000 || !CHIFFRE.test(c.secret_chiffre)) {
    throw new Error('Le mot de passe doit arriver chiffré par le navigateur.');
  }
  const identite = c.identite ?? [];
  if (!Array.isArray(identite) || identite.length > 3 || identite.some((x) => typeof x !== 'string' || !x.trim() || x.length > 120)) {
    throw new Error('Le nom attendu à l’écran est invalide.');
  }
  return { identifiant: c.identifiant.trim(), secret_chiffre: c.secret_chiffre, identite: identite.map((x) => x.trim()) };
}

// Une demande relue pour le navigateur : jamais le texte chiffré, même s'il n'a pas encore quitté la base.
export function sansSecret(demande) {
  if (!demande?.compte) return demande;
  const { secret_chiffre: _, ...compte } = demande.compte;
  return { ...demande, compte };
}

const sansAccents = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^0-9a-z]+/g, ' ');
const CONNEXION = /\b(se connecter|connexion|s identifier|login|log in|sign in)\b/;

export function cibleQa(id) {
  const cible = catalogue.cibles.find((c) => c.id === id);
  if (!cible) throw new Error('Cette cible n’est pas enregistrée pour le QA.');
  return cible;
}

function texte(valeur, maxi, nom) {
  if (valeur == null) valeur = '';
  if (typeof valeur !== 'string') throw new Error(`${nom} doit être un texte.`);
  const propre = valeur.split(/\s+/).filter(Boolean).join(' ');
  if ([...propre].length > maxi) throw new Error(`${nom} dépasse ${maxi} caractères.`);
  return propre;
}

// Le chemin d'une adresse de l'origine de la cible, sans paramètres ; null hors du périmètre.
export function cheminCible(cible, url) {
  if (typeof url !== 'string' || !url || /[\u0000-\u001f\\]/.test(url)) return null;
  let u;
  try { u = new URL(url.trim(), cible.origine + '/'); } catch { return null; }
  if (u.origin !== cible.origine || u.username || u.password) return null;
  const chemin = u.pathname.replace(/\/+$/, '') || '/';
  if ((cible.chemins_exclus ?? []).some((x) => chemin === x || chemin.startsWith(x.replace(/\/$/, '') + '/'))) return null;
  return chemin;
}

// Le plan relu par l'utilisateur : formes connues seulement ; le serveur numérote lui-même les critères.
export function validerPlan(plan, cible) {
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) throw new Error('Le plan est illisible.');
  const regles = catalogue.preparation;
  const etapes = (plan.etapes ?? []).map((e) => texte(e, 300, 'Une étape')).filter(Boolean).slice(0, regles.max_etapes);
  const criteres = [];
  for (const brut of plan.criteres ?? []) {
    if (!brut || typeof brut !== 'object' || !Object.hasOwn(TYPES_CRITERES, brut.type)) throw new Error('Un critère a un type inconnu.');
    const description = texte(brut.description, 300, 'La description d’un critère');
    let valeur = texte(brut.valeur, 200, 'La valeur d’un critère');
    if (!description) continue;
    let type = brut.type;
    if (type === 'page' && valeur) valeur = cheminCible(cible, valeur) ?? '';
    if (type === 'texte' && !valeur) type = 'constat';
    criteres.push({ id: `C${criteres.length + 1}`, type, description, valeur });
  }
  if (!criteres.length) throw new Error('Le plan doit contenir au moins un critère vérifiable.');
  const propre = {
    titre: texte(plan.titre, 120, 'Le titre') || 'Parcours QA', etapes, criteres: criteres.slice(0, regles.max_criteres),
    // Sur un site connecté, l'agent se connecte lui-même avec le coffre : « Se connecter » hors périmètre contredirait sa mission.
    hors_perimetre: (plan.hors_perimetre ?? []).map((h) => texte(h, 300, 'Une mention hors périmètre')).filter(Boolean)
      .filter((h) => !cible.connexion || !CONNEXION.test(sansAccents(h))).slice(0, 6),
    inconnues: (plan.inconnues ?? []).map((h) => texte(h, 300, 'Une inconnue')).filter(Boolean).slice(0, 6),
  };
  const prep = plan.preparation;
  if (prep && typeof prep === 'object') {
    propre.preparation = Object.fromEntries(Object.entries(prep).filter(([k, v]) =>
      (['modele', 'fournisseur'].includes(k) && typeof v === 'string') || (['latence_s', 'tokens'].includes(k) && typeof v === 'number')));
  }
  return propre;
}

export function validerMissionQa(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) || d.schema_version !== 3 || d.mode !== 'qa'
      || Object.keys(d).some((k) => !CHAMPS.has(k))) {
    throw new Error('Le format de la mission QA est invalide.');
  }
  const cible = cibleQa(d.target_id);
  const appareil = d.appareil ?? 'ordinateur';
  if (!Object.hasOwn(catalogue.pilotages, d.pilotage) || !Object.hasOwn(catalogue.appareils, appareil)) {
    throw new Error('Le pilotage ou l’appareil est inconnu.');
  }
  if (!Object.hasOwn(cible.limites, d.pilotage)) throw new Error('Ce pilotage n’est pas ouvert sur ce site.');
  // Un site connecté : un compte de test, dont le runner versera le mot de passe dans un coffre H propre à la mission.
  const compte = cible.connexion ? validerCompte(d.compte) : null;
  if (!cible.connexion && d.compte != null) throw new Error('Un site public ne reçoit aucun compte.');
  const source = d.source ?? 'texte';
  if (!['texte', 'voix'].includes(source)) throw new Error('La source de la consigne est inconnue.');
  const modele = d.modele_h ?? MODELES_H[0];
  if (!MODELES_H.includes(modele)) throw new Error('Ce modèle H n’est pas proposé.');
  const humain = d.preparation_humaine_s ?? null;
  if (humain !== null && (typeof humain !== 'number' || humain < 0 || humain > 7200)) throw new Error('La durée de préparation est invalide.');
  const mission = {
    schema_version: 3, mode: 'qa', target_id: cible.id, pilotage: d.pilotage, appareil, source, modele_h: modele,
    instruction: texte(d.instruction, 2000, 'La consigne'), preparation_humaine_s: humain === null ? null : Math.round(humain), plan: null,
  };
  if (d.pilotage === 'guide') {
    if (d.plan == null) throw new Error('Un parcours guidé demande un plan relu.');
    mission.plan = validerPlan(d.plan, cible);
  }
  if (compte) mission.compte = compte;
  return mission;
}

// L'apostrophe française pour les textes écrits par le runner ; jamais pour une citation, qui reste mot pour mot.
export const typo = (texte) => (texte == null ? texte : String(texte).replace(/'/g, '’'));

// L'adresse d'une capture de l'agent, relayée par notre serveur (la clé H n'atteint jamais le navigateur).
export const urlCapture = (session, source) => `/api/qa/captures?session=${encodeURIComponent(session)}&src=${encodeURIComponent(source)}`;
export const TAILLES = { ordinateur: [1280, 800], mobile: [390, 844] };

// Le nom lisible d'un modèle Hugging Face : « meta-llama/Llama-3.3-70B-Instruct:groq » → « Llama 3.3 70B ».
export function nomModele(id = '') {
  const nom = id.split('/').pop().split(':')[0];
  return nom.replace(/^Llama-/, 'Llama ').replace(/-Instruct$/, '').replace(/-70B/, ' 70B').replace(/^whisper-large-v3-turbo$/, 'Whisper large v3 turbo');
}
