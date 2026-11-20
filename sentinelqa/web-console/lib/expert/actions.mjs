// D-56 : l'expert oriente au lieu de bloquer. Le bouton qu'il propose sous sa réponse (« Ajouter cette application »,
// « Ajouter un compte de test ») est décidé par une règle écrite : le modèle ne peut que la compléter, jamais l'inventer.
import { normaliserAdresse } from '../../../web/lib/applications-contrat.mjs'

// Les extensions qu'on reconnaît dans une phrase : assez pour « monsaas.fr » ou « app.exemple.com », sans prendre
// « rapport.json » pour un site.
const EXTENSIONS = 'fr|com|net|org|io|app|dev|co|ai|eu|tech|cloud|site|online|xyz|be|ch|ca|de|uk|es|it|nl|pt|us|info|biz|me|tv|studio|digital|store|shop|vercel\\.app'
const ADRESSE = new RegExp(`(^|[\\s«"'(])((?:https?:\\/\\/)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+(?:${EXTENSIONS})(?::\\d+)?(?:\\/[^\\s»"')]*)?)`, 'gi')

/** Les sites cités dans une question, sous leur origine https : « vérifie monsaas.fr » → ["https://monsaas.fr"]. */
export function adressesCitees(texte) {
  const origines = []
  for (const [, , brut] of String(texte ?? '').matchAll(ADRESSE)) {
    try {
      const { origine } = normaliserAdresse(brut.replace(/^http:\/\//i, 'https://').replace(/[.,;:!?]+$/, ''))
      if (!origines.includes(origine)) origines.push(origine)
    } catch { /* une adresse locale, privée ou illisible n'est jamais proposée */ }
  }
  return origines
}

// Une question qui demande vraiment d'ajouter un site (« mon propre site », « un autre SaaS », « ajouter »…). Sans elle, l'avis du
// modèle ne suffit pas : le 20/11, resté sur le site de la question précédente, il proposait l'ajout pour une question sur Ardoise.
const INTENTION_AJOUT = /\b(?:(?:mon|ma|notre|nos|mes)\s+(?:propre\s+)?(?:site|application|app|saas|logiciel|plateforme|produit)s?|(?:un|une|d['’]un|d['’]une)\s+autre\s+(?:site|application|app|saas|logiciel|plateforme)|(?:nouveau|nouvelle)\s+(?:site|application|app|saas)|ajouter|ajout|pas dans (?:la|ma|votre) liste)\b/i
export const intentionAjout = (question) => INTENTION_AJOUT.test(String(question ?? '').normalize('NFC'))

// D-57 : l'expert propose plus qu'il ne questionne. Une seule question de précision par conversation : une question de
// l'expert compte quand elle répond à l'utilisateur (l'accueil, « Que souhaitez-vous vérifier ? », ne compte pas).
/** @param {{ role: string, texte: string }[]} historique */
export function questionDejaPosee(historique) {
  return historique.some((t, i) => t.role === 'expert' && i > 0 && historique[i - 1].role === 'utilisateur' && /\?\s*$/.test(String(t.texte).trim()))
}

/**
 * Peut-on lancer la mission tout de suite, sans rien demander de plus ? Seulement en QA, et seulement si la cible a tout
 * ce qu'il faut : un site public, ou une application ajoutée et vérifiée avec au moins un compte de test enregistré.
 * Un exemple du catalogue qui demande une connexion attend son compte, saisi pour la mission : « studio ».
 * @param {{ volet: string, catalogue?: { connexion?: boolean } | null, ajoutee?: { verifiee_le?: string | null, connexion?: boolean, comptes?: number } | null }} d
 * @returns {'direct' | 'studio'}
 */
export function lancementPossible({ volet, catalogue = null, ajoutee = null }) {
  if (volet !== 'qa') return 'studio'
  if (ajoutee) return ajoutee.verifiee_le && (!ajoutee.connexion || (ajoutee.comptes ?? 0) > 0) ? 'direct' : 'studio'
  return catalogue && !catalogue.connexion ? 'direct' : 'studio'
}

// ── D-57 bis : la pertinence avant tout lancement seul ───────────────────────────────────────────────────
// Le 20/11, « je veux vérifier qu'Ardoise n'a pas de bouton qui bug » a donné « clique sur chaque bouton… », lancé seul ;
// une dictée tronquée (« …pas de bouton qui. ») a donné « vérifie qu'aucun bouton ne contient « qui » », lancé seul aussi.

const sansAccents = (t) => String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[’']/g, ' ').replace(/[^a-z0-9« »"]+/g, ' ').replace(/\s+/g, ' ').trim()

// Chercher des bugs, des liens ou boutons cassés, des erreurs, ou tout le site : c'est le métier de l'exploration, que le
// code sait prouver (erreurs HTTP, liens cassés, textes anormaux). Un bouton précis (« le bouton Factures mène à… ») reste guidé.
const EXPLORATION = /\b(bugs?|bogues?|bugg\w*|plant\w*|cass\w*|erreurs?|404|ne marchent? pas|ne fonctionnent? pas|dysfonction\w*|anomalies?|problemes?)\b|\b(tous|toutes|chaque) (les )?(boutons?|liens?|pages?|ecrans?|menus?)\b|\b(tout le site|toute l application|tout le saas|toute l appli)\b|\bexplor\w*|\bparcour\w*|\bfais le tour\b/
export const intentionExploration = (question) => EXPLORATION.test(sansAccents(question))

// Une phrase dictée qui s'arrête sur un mot-outil a perdu sa fin : on ne devine pas, on demande.
const FIN_COUPEE = /\b(qui|que|qu|de|du|des|le|la|les|l|un|une|pour|avec|sur|dans|et|ou|a|au|aux|en|par|si|mais|donc|ce|cette|ces|son|sa|ses|mon|ma|mes|leur|est|sont)$/
const MOTS_VIDES = new Set(['vérifie', 'verifie', 'verifier', 'vérifier', 'regarde', 'regarder', 'teste', 'tester', 'controle', 'controler',
  'page', 'pages', 'site', 'application', 'appli', 'veux', 'voudrais', 'faut', 'faire', 'peux', 'pouvez', 'est', 'bien', 'tout', 'toute',
  'pour', 'avec', 'dans', 'mais', 'aussi', 'comme', 'alors', 'quand', 'quoi', 'ouvre', 'ouvrir', 'clique', 'cliquer', 'affiche', 'afficher'])
const motsSignifiants = (t, app = '') => sansAccents(t).split(' ').filter((m) => m.length >= 4 && !MOTS_VIDES.has(m) && !sansAccents(app).split(' ').includes(m))

/** La dictée a-t-elle coupé la phrase ? Trop courte, ou finie sur un mot-outil (« …pas de bouton qui »). */
export function questionTronquee(question, app = '') {
  const t = sansAccents(question).replace(/[« »"]/g, ' ').trim()
  return !t || FIN_COUPEE.test(t) || motsSignifiants(t, app).length === 0
}

/**
 * Une consigne guidée est-elle assez proche de la question pour partir seule ? Elle reprend au moins un mot signifiant de
 * la question, et chaque texte qu'elle cite entre guillemets vient de la question (jamais un « Bienvenue » inventé).
 */
export function consigneProche(question, consigne, app = '') {
  const q = sansAccents(question)
  const c = sansAccents(consigne)
  if (!c) return false
  const racines = motsSignifiants(question, app).map((m) => m.slice(0, 5))
  if (!racines.some((r) => c.split(' ').some((m) => m.startsWith(r)))) return false
  const citations = [...String(consigne).matchAll(/«\s*([^»]+?)\s*»|"([^"]+)"/g)].map((x) => sansAccents(x[1] ?? x[2]))
  return citations.every((cit) => cit && q.includes(cit))
}

/** La proposition d'exploration, dite par la règle (pas par le modèle) : ce qu'elle fait, et ce qu'elle ne fait pas. */
export function propositionExploration(app) {
  const nom = app || 'le site'
  // L'élision et la contraction : « d’Ardoise », « du site », « de Peer Review ».
  const deNom = /^le /i.test(nom) ? `du ${nom.slice(3)}` : /^[aeiouyhàâéèêëîïôûü]/i.test(nom) ? `d’${nom}` : `de ${nom}`
  return {
    reponse: `Pour trouver ce qui ne marche pas, je propose une exploration ${deNom} : l’agent ouvre chaque entrée du menu, 6 pages au plus, et le code relève les liens cassés, les erreurs et les textes anormaux. Il clique sur ce qui navigue, jamais sur ce qui enregistre ou envoie.`,
    consigne: `Explorer ${nom} : ouvrir chaque entrée du menu, 6 pages au plus, et relever les liens cassés, les erreurs et les textes anormaux.`,
  }
}

/**
 * L'historique envoyé au modèle, sans les échanges sur un site inconnu (une question qui en cite l'adresse, et la réponse qui
 * suit) : le 20/11, après « peux-tu tester app.facturo.io ? », l'expert répondait sur facturo à une question sur Ardoise.
 * @param {{ role: string, texte: string }[]} historique @param {string[]} connues
 */
export function historiqueSurLaCible(historique, connues) {
  const garde = []
  for (let i = 0; i < historique.length; i++) {
    const t = historique[i]
    if (t.role === 'utilisateur' && adressesCitees(t.texte).some((o) => !connues.includes(o))) {
      if (historique[i + 1]?.role === 'expert') i++
      continue
    }
    garde.push(t)
  }
  return garde
}

/**
 * Le bouton proposé sous la réponse de l'expert, ou null.
 * @param {{ question: string, cible: { id: string, ajoutee?: boolean, connexion?: boolean, comptes?: number } | null,
 *           connues: string[], proposee?: unknown }} d
 *   connues : les origines de la cible, des exemples du catalogue et des applications ajoutées ;
 *   proposee : l'action rendue par le modèle, relue ici.
 */
export function actionExpert({ question, cible, connues, proposee }) {
  // 1. Une application ajoutée qui demande une connexion, sans compte de test : l'agent ne peut pas s'y connecter.
  if (cible?.ajoutee && cible.connexion && !cible.comptes) {
    return { type: 'ajouter_compte', libelle: 'Ajouter un compte de test', href: `/app/applications/${encodeURIComponent(cible.id)}#comptes` }
  }
  // 2. Un site cité qui n'est ni la cible, ni un exemple, ni une application ajoutée : on propose de l'ajouter, pré-rempli.
  const inconnue = adressesCitees(question).find((o) => !connues.includes(o))
  if (inconnue) {
    return { type: 'ajouter_application', libelle: 'Ajouter cette application', adresse: inconnue,
      href: `/app/applications/nouvelle?adresse=${encodeURIComponent(inconnue)}` }
  }
  // 3. Le modèle a compris « je veux tester mon propre site » sans adresse : le bouton, sans pré-remplissage, si la question le demande.
  if (proposee && typeof proposee === 'object' && /** @type {{ type?: unknown }} */ (proposee).type === 'ajouter_application' && intentionAjout(question)) {
    return { type: 'ajouter_application', libelle: 'Ajouter une application', adresse: null, href: '/app/applications/nouvelle' }
  }
  return null
}
