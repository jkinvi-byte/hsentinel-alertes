// D-56 : les applications ajoutées par le client, côté serveur. Ajouter, prouver le contrôle du site, enregistrer des
// comptes de test, retirer. Aucune mission ne part avant la preuve (le runner la revérifie) ; aucun mot de passe en clair
// ne passe ici : le navigateur le chiffre pour le runner. Les règles pures sont dans applications-contrat.mjs.
import 'server-only';
import { lookup } from 'node:dns/promises';
import { requete } from './supabase';
import { CATALOGUE_QA } from './qa-contrat.mjs';
import { CATALOGUE } from './missions.js';
import {
  ATTESTATION, CHEMIN_FICHIER, adressePrivee, estCompteId, idApplication, jetonPublie, normaliserAdresse, normaliserChemin,
  nouveauJeton, profilClient, validerCompteTest,
} from './applications-contrat.mjs';

const COLONNES = 'id,nom,origine,autorisee,profil_qa,attestee_le,verification_jeton,verification_methode,verifiee_le,cree_le';
const ID = /^[a-z0-9][a-z0-9-]{0,59}$/;
const MAX_COMPTES = 6;
const AGENT = 'HSentinel-Verification/1.0 (+https://hsentinel-console.vercel.app)';

// ── La garde réseau : notre serveur ne lit jamais une adresse privée pour le compte d'un client ──────────────────
// Le nom est résolu juste avant chaque lecture ; une adresse privée, locale ou réservée arrête tout. Reste le cas d'un DNS
// qui change entre la résolution et la connexion (quelques millisecondes) : il est consigné, pas encore fermé.
async function adressePublique(hote) {
  let adresses;
  try { adresses = await lookup(hote, { all: true, verbatim: true }); }
  catch { throw new Error('Ce nom de domaine ne répond pas. Vérifiez l’adresse.'); }
  if (!adresses.length || adresses.some((a) => adressePrivee(a.address))) {
    throw new Error('Ce site pointe vers une adresse privée : HSentinel ne peut pas le tester depuis Internet.');
  }
}

/** Une lecture bornée du site : redirections suivies sur la même origine seulement, taille et durée plafonnées. */
export async function lireSite(origine, chemin, { maxOctets = 1_000_000, delai = 8000 } = {}) {
  await adressePublique(new URL(origine).hostname);
  let url = new URL(chemin, `${origine}/`);
  for (let saut = 0; saut < 4; saut++) {
    const reponse = await fetch(url, {
      redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(delai),
      headers: { 'User-Agent': AGENT, Accept: 'text/html,text/plain;q=0.9,*/*;q=0.5' },
    });
    if (reponse.status >= 300 && reponse.status < 400 && reponse.headers.get('location')) {
      const suivant = new URL(reponse.headers.get('location'), url);
      await reponse.body?.cancel();
      if (suivant.origin !== origine) return { statut: reponse.status, texte: '', horsOrigine: suivant.origin };
      url = suivant;
      continue;
    }
    // Au-delà du plafond, la lecture s'arrête : le jeton et la balise sont toujours au début d'une page.
    const lecteur = reponse.body?.getReader();
    const morceaux = [];
    let lu = 0;
    while (lecteur && lu < maxOctets) {
      const { done, value } = await lecteur.read();
      if (done) break;
      const part = value.subarray(0, maxOctets - lu);
      morceaux.push(part);
      lu += part.byteLength;
    }
    if (lu >= maxOctets) await lecteur?.cancel();
    return { statut: reponse.status, texte: Buffer.concat(morceaux).toString('utf8'), url: url.href, type: reponse.headers.get('content-type') ?? '' };
  }
  return { statut: 310, texte: '' };
}

const titreDe = (html) => (html.match(/<title[^>]*>([\s\S]{1,200}?)<\/title>/i)?.[1] ?? '')
  .replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, '’').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim().slice(0, 60);

// ── Lire ───────────────────────────────────────────────────────────────────────────────────────────────

/** Les applications ajoutées et non retirées, avec leurs comptes de test (jamais le texte chiffré). */
export async function listerAjoutees() {
  const [apps, comptes] = await Promise.all([
    requete(`applications?select=${COLONNES}&ajoutee_console=eq.true&retiree_le=is.null&order=cree_le.asc`),
    requete('comptes_test?select=id,application_id,libelle,identifiant,identite,cree_le,utilise_le&order=cree_le.asc'),
  ]);
  return apps.map((a) => ({ ...a, comptes: comptes.filter((c) => c.application_id === a.id) }));
}

async function lireAjoutee(id) {
  if (!ID.test(id ?? '')) return null;
  const [app] = await requete(`applications?select=${COLONNES}&id=eq.${id}&ajoutee_console=eq.true&retiree_le=is.null`);
  return app ?? null;
}

/** Le profil QA d'une application ajoutée, seulement si son contrôle est prouvé. Sinon null : aucune mission n'y part. */
export async function cibleQaClient(id) {
  const app = await lireAjoutee(id);
  if (!app?.autorisee || !app.verifiee_le || !app.profil_qa) return null;
  return { ...app.profil_qa, id: app.id, nom: app.nom };
}

/** Un compte de test de cette application, sans son texte chiffré ; null s'il n'existe pas ou appartient à une autre. */
export async function compteDe(applicationId, compteId) {
  if (!estCompteId(compteId) || !ID.test(applicationId ?? '')) return null;
  const [compte] = await requete(`comptes_test?select=id,application_id,libelle,identifiant,identite&id=eq.${compteId}&application_id=eq.${applicationId}`);
  return compte ?? null;
}

// ── Écrire ─────────────────────────────────────────────────────────────────────────────────────────────

/** Ajouter une application : adresse publique, attestation cochée, site qui répond. Le jeton à publier suit l'adresse. */
export async function ajouterApplication(corps) {
  if (corps?.attestation !== true) throw new Error('Cochez l’attestation : on ne teste que ce qu’on a le droit de tester.');
  const { origine, chemin } = normaliserAdresse(corps?.adresse);
  const connexion = normaliserChemin(corps?.connexion);
  const exemples = [...CATALOGUE_QA.cibles.map((c) => c.origine), ...CATALOGUE.targets.map((t) => t.origin)];
  if (exemples.includes(origine)) throw new Error('Ce site est déjà parmi les exemples phares : préparez un test depuis sa ligne.');
  const id = idApplication(origine);
  const [existante] = await requete(`applications?select=id,ajoutee_console,retiree_le,verification_jeton&id=eq.${id}`);
  if (existante && (!existante.ajoutee_console || !existante.retiree_le)) throw new Error('Cette application est déjà dans vos applications.');
  const accueil = await lireSite(origine, chemin);
  if (accueil.horsOrigine) throw new Error(`Ce site redirige vers ${accueil.horsOrigine} : ajoutez plutôt cette adresse.`);
  if (!accueil.statut || accueil.statut >= 500) throw new Error(`Le site ne répond pas correctement (HTTP ${accueil.statut}). Réessayez quand il est en ligne.`);
  const nom = String(corps?.nom ?? '').split(/\s+/).filter(Boolean).join(' ').slice(0, 60) || titreDe(accueil.texte) || new URL(origine).hostname;
  const instant = new Date().toISOString();
  const ligne = {
    id, nom, origine, autorisee: false, ajoutee_console: true, tickets_publics: false, observation_active: false,
    autorisation: `Ajoutée dans la console le ${instant.slice(0, 10)} ; attestation : ${ATTESTATION}`,
    profil_qa: profilClient({ id, nom, origine, chemin, connexion }), attestee_le: instant,
    verification_jeton: existante?.verification_jeton ?? nouveauJeton(), verification_methode: null, verifiee_le: null, retiree_le: null,
  };
  const [app] = existante
    ? await requete(`applications?id=eq.${id}`, { methode: 'PATCH', prefer: 'return=representation', corps: ligne })
    : await requete('applications', { methode: 'POST', prefer: 'return=representation', corps: ligne });
  return { ...pick(app), comptes: [] };
}

const pick = (a) => Object.fromEntries(COLONNES.split(',').map((k) => [k, a[k] ?? null]));

/** Relire le jeton sur le site : le fichier, puis la balise de la page d'entrée. Rien n'est modifié tant qu'il manque. */
export async function verifierApplication(id) {
  const app = await lireAjoutee(id);
  if (!app) return null;
  const [fichier, page] = await Promise.all([
    lireSite(app.origine, CHEMIN_FICHIER, { maxOctets: 4096 }).catch((e) => ({ statut: 0, texte: '', erreur: e.message })),
    lireSite(app.origine, '/').catch((e) => ({ statut: 0, texte: '', erreur: e.message })),
  ]);
  const methode = jetonPublie({ fichier: fichier.statut === 200 ? fichier.texte : '', page: page.statut === 200 ? page.texte : '' }, app.verification_jeton);
  if (!methode) {
    return { verifiee: false, fichier: fichier.statut || null, page: page.statut || null,
      raison: fichier.erreur ?? `Jeton introuvable : ${CHEMIN_FICHIER} répond HTTP ${fichier.statut || '—'}, et la page d’accueil n’a pas la balise.` };
  }
  const instant = new Date().toISOString();
  await requete(`applications?id=eq.${id}`, { methode: 'PATCH', corps: {
    autorisee: true, verifiee_le: instant, verification_methode: methode,
    autorisation: `Contrôle du site prouvé le ${instant.slice(0, 10)} (${methode === 'fichier' ? CHEMIN_FICHIER : 'balise hsentinel-verification'}) ; attestation : ${ATTESTATION}`,
  } });
  return { verifiee: true, methode, verifiee_le: instant };
}

/** Retirer : les comptes de test sont supprimés, la ligne reste (son jeton aussi) mais ne se teste plus. */
export async function retirerApplication(id) {
  const app = await lireAjoutee(id);
  if (!app) return null;
  await requete(`comptes_test?application_id=eq.${id}`, { methode: 'DELETE' });
  await requete(`applications?id=eq.${id}`, { methode: 'PATCH', corps: { retiree_le: new Date().toISOString(), autorisee: false, verifiee_le: null } });
  return { retiree: true };
}

/** Enregistrer un compte de test : déjà chiffré par le navigateur, avec la clé du runner en service. */
export async function ajouterCompte(id, corps) {
  const app = await lireAjoutee(id);
  if (!app) return null;
  if (!app.profil_qa?.connexion) throw new Error('Cette application se teste sans connexion : elle ne reçoit aucun compte.');
  const compte = validerCompteTest(corps);
  const [cle] = await requete('cles_runner?select=id&order=id.desc&limit=1');
  if (!cle || cle.id !== compte.cle_runner_id) throw new Error('La clé de chiffrement a changé : actualisez la page puis recommencez.');
  const existants = await requete(`comptes_test?select=id,libelle&application_id=eq.${id}`);
  if (existants.length >= MAX_COMPTES) throw new Error(`${MAX_COMPTES} comptes de test au plus par application.`);
  if (existants.some((c) => c.libelle.toLowerCase() === compte.libelle.toLowerCase())) throw new Error('Un compte porte déjà ce libellé.');
  const [ligne] = await requete('comptes_test', { methode: 'POST', prefer: 'return=representation', corps: { application_id: id, ...compte } });
  return { id: ligne.id, application_id: id, libelle: ligne.libelle, identifiant: ligne.identifiant, identite: ligne.identite, cree_le: ligne.cree_le, utilise_le: null };
}

export async function retirerCompte(id, compteId) {
  if (!(await compteDe(id, compteId))) return null;
  await requete(`comptes_test?id=eq.${compteId}&application_id=eq.${id}`, { methode: 'DELETE' });
  return { retire: true };
}
