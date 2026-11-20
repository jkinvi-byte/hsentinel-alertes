// D-56 : l'application qu'un client ajoute dans la console, puis ses comptes de test. Contrat partagé par les routes,
// les écrans et les tests ; le runner (runner/applications.py) applique les mêmes règles avant toute mission.
// Pour l'instant, une application ajoutée ne s'ouvre qu'au QA, en consultation seule (le pentest attend, consigne d'Aurian).

export const CHEMIN_FICHIER = '/.well-known/hsentinel-verification.txt';
export const NOM_BALISE = 'hsentinel-verification';
export const METHODES = { fichier: 'Fichier publié sur le site', balise: 'Balise dans la page d’accueil' };
export const JETON = /^hsv-[A-Za-z0-9_-]{32}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const CHIFFRE = /^[A-Za-z0-9+/]+={0,2}$/;
export const ATTESTATION = 'J’ai le contrôle de ce site, ou l’autorisation écrite de son responsable, pour y faire tester des parcours en consultation seule (article 323-1 du Code pénal).';

const espaces = (t) => String(t ?? '').split(/\s+/).filter(Boolean).join(' ');

/** L'adresse saisie : https seulement, port par défaut, sans identifiants, un nom de domaine public (jamais une IP). */
export function normaliserAdresse(brut) {
  if (typeof brut !== 'string' || !brut.trim() || brut.length > 300) throw new Error('Indiquez l’adresse de votre site.');
  let texte = brut.trim();
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(texte)) texte = `https://${texte}`;
  let u;
  try { u = new URL(texte); } catch { throw new Error('Cette adresse n’est pas lisible.'); }
  if (u.protocol !== 'https:') throw new Error('Seules les adresses https sont acceptées.');
  if (u.username || u.password) throw new Error('L’adresse ne doit pas contenir d’identifiants.');
  if (u.port) throw new Error('Utilisez le port par défaut de https.');
  const hote = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!hote.includes('.') || /^[\d.]+$/.test(hote) || hote.includes(':') || hote.includes('[') || hote === 'localhost'
      || /\.(localhost|local|internal|lan|home|corp|intranet)$/.test(hote)) {
    throw new Error('Indiquez le nom de domaine public de votre site, pas une adresse locale.');
  }
  return { origine: `https://${hote}`, chemin: u.pathname.replace(/\/+$/, '') || '/' };
}

/** Le chemin de la page de connexion, facultatif : « /connexion », jamais une autre adresse. */
export function normaliserChemin(brut) {
  const texte = espaces(brut);
  if (!texte) return null;
  const chemin = texte.startsWith('/') ? texte : `/${texte}`;
  if (chemin.length > 120 || chemin.startsWith('//') || chemin.includes('..') || !/^\/[A-Za-z0-9._~\-/]*$/.test(chemin)) {
    throw new Error('Le chemin de connexion doit ressembler à « /connexion ».');
  }
  return chemin.replace(/\/+$/, '') || '/';
}

/** L'identifiant d'une application ajoutée, tiré de son hôte : « ardoise-demo.vercel.app » → « ardoise-demo-vercel-app ». */
export function idApplication(origine) {
  return new URL(origine).hostname.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

/** Un jeton à publier : 24 octets aléatoires, en base64url (32 caractères). */
export function nouveauJeton(cryptoApi = globalThis.crypto) {
  const octets = cryptoApi.getRandomValues(new Uint8Array(24));
  return `hsv-${btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

/** Où le jeton est-il publié ? Le fichier (le jeton seul, ou « hsentinel-verification=… ») ou la balise de la page d'accueil. */
export function jetonPublie({ fichier = '', page = '' }, jeton) {
  if (!JETON.test(jeton ?? '')) return null;
  const lignes = String(fichier).slice(0, 4096).split(/\r?\n/).map((l) => l.trim().replace(/^hsentinel-verification\s*[:=]\s*/i, ''));
  if (lignes.includes(jeton)) return 'fichier';
  for (const [balise] of String(page).slice(0, 2_000_000).matchAll(/<meta\b[^>]*>/gi)) {
    const attr = (nom) => balise.match(new RegExp(`\\b${nom}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
    const nom = attr('name');
    const contenu = attr('content');
    if (nom && (nom[2] ?? nom[3] ?? nom[4]).toLowerCase() === NOM_BALISE && contenu && (contenu[2] ?? contenu[3] ?? contenu[4]).trim() === jeton) return 'balise';
  }
  return null;
}

/** Une adresse IP qu'un serveur ne doit jamais lire pour le compte d'un client : privée, locale, réservée, métadonnées. */
export function adressePrivee(ip) {
  const v4 = (texte) => {
    const n = texte.split('.').map(Number);
    if (n.length !== 4 || n.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return true;
    const [a, b, c] = n;
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0 && (c === 0 || c === 2))
      || (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113);
  };
  const texte = String(ip ?? '').toLowerCase().replace(/^\[|\]$/g, '');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(texte)) return v4(texte);
  if (!texte.includes(':')) return true;
  const mappee = texte.match(/^(?:0*:)*:?(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/) ?? texte.match(/^64:ff9b::(\d+\.\d+\.\d+\.\d+)$/);
  if (mappee) return v4(mappee[1]);
  return texte === '::' || texte === '::1' || /^f[cd]/.test(texte) || /^fe[89ab]/.test(texte) || texte.startsWith('ff')
    || texte.startsWith('2001:db8') || texte.startsWith('2001:0db8') || texte.startsWith('::ffff:');
}

/**
 * Le profil de test d'une application ajoutée, construit par notre serveur (jamais un JSON du client) : même forme
 * qu'une cible de contrats/qa.json, consultation seule, gestes interdits et budgets fixes.
 */
export function profilClient({ id, nom, origine, chemin = '/', connexion = null }) {
  return {
    id, nom, origine, client: true,
    entree: `${origine}${connexion ?? (chemin === '/' ? '/' : chemin)}`,
    autorisation: 'D-56 : contrôle du site prouvé par le jeton publié, attestation de l’utilisateur ; consultation seule',
    consultation_seule: true,
    ...(connexion ? { connexion: { chemin: connexion } } : {}),
    chemins_exclus: ['/api', '/logout', '/log-out', '/signout', '/sign-out', '/deconnexion'].filter((x) => x !== connexion),
    interdits: [
      'Application ajoutée par son responsable pour un test en consultation seule : ne clique jamais sur un bouton qui crée, envoie, enregistre, modifie, supprime, paie, invite ou exporte, même pour essayer.',
      'Ne te déconnecte pas et ne change aucun réglage du compte ni de l’application.',
    ],
    limites: {
      guide: { max_steps: 30, max_time_s: 300 },
      exploration: { max_steps: 40, max_time_s: 420, max_pages: 6 },
      lectures_http: 30, octets_par_lecture: 3_000_000,
    },
  };
}

/** Un compte de test à enregistrer : un libellé, un identifiant, le mot de passe chiffré par le navigateur, le nom attendu. */
export function validerCompteTest(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)
      || Object.keys(c).some((k) => !['libelle', 'identifiant', 'secret_chiffre', 'cle_runner_id', 'identite'].includes(k))) {
    throw new Error('Le compte de test est illisible.');
  }
  const libelle = espaces(c.libelle);
  if (!libelle || [...libelle].length > 60) throw new Error('Donnez un libellé au compte (60 caractères au plus).');
  const identifiant = String(c.identifiant ?? '').trim();
  if (!/^\S{3,254}$/.test(identifiant)) throw new Error('L’identifiant du compte de test est invalide.');
  if (typeof c.secret_chiffre !== 'string' || c.secret_chiffre.length < 100 || c.secret_chiffre.length > 2000 || !CHIFFRE.test(c.secret_chiffre)) {
    throw new Error('Le mot de passe doit arriver chiffré par le navigateur.');
  }
  if (!Number.isInteger(Number(c.cle_runner_id)) || Number(c.cle_runner_id) <= 0) throw new Error('La clé de chiffrement est inconnue.');
  const identite = c.identite ?? [];
  if (!Array.isArray(identite) || identite.length > 3 || identite.some((x) => typeof x !== 'string' || x.trim().length > 120)) {
    throw new Error('Le nom attendu à l’écran est invalide.');
  }
  return { libelle, identifiant, secret_chiffre: c.secret_chiffre, cle_runner_id: Number(c.cle_runner_id),
    identite: identite.map((x) => espaces(x)).filter(Boolean) };
}

export const estCompteId = (id) => typeof id === 'string' && UUID.test(id);

/** L'état d'une application ajoutée, pour l'écran : ce qu'il reste à faire avant le premier test. */
export function etape(app) {
  if (!app?.verifiee_le) return 'verification';
  if (app.profil_qa?.connexion && !(app.comptes ?? []).length) return 'compte';
  return 'prete';
}
