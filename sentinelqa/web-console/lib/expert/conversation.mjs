// LE MODE CONVERSATION DE L'EXPERT (D-51) : les règles pures, testées sans navigateur (tests/expert.test.mjs).
// La mise en scène vit dans components/console/expert-conversation.tsx.

// La typographie française à l'écran : le guillemet ouvrant se soude au mot qui suit, le fermant et les ponctuations
// hautes (? ! : ;) au mot qui précède. Le modèle écrit souvent « Bac+3 » avec des espaces ordinaires : sans cela,
// le guillemet restait seul en bout de ligne. La voix, elle, reçoit le texte d'origine.
const OUVRANT = /^«$/
const FERMANT = /^(»|[?!:;])[»?!:;.,…]*$/

/** Les mots d'une phrase, pour les allumer au rythme de la voix, ponctuation française soudée.
 *  Les espaces insécables restent dans le mot : « Bac+3 » ne se coupe jamais en fin de ligne.
 *  @param {string} phrase
 *  @returns {string[]} */
export function mots(phrase) {
  const sortie = []
  let ouvrant = ''
  for (const b of String(phrase ?? '').split(/[ \t\r\n]+/).filter(Boolean)) {
    if (FERMANT.test(b) && sortie.length && !ouvrant) { sortie[sortie.length - 1] += (b[0] === '»' ? '\u00a0' : '\u202f') + b; continue }
    if (OUVRANT.test(b)) { ouvrant += '«\u00a0'; continue }
    sortie.push(ouvrant + b)
    ouvrant = ''
  }
  if (ouvrant) sortie.push(ouvrant.trim())
  return sortie
}

/** Le même texte, avec la typographie française de l'écran (pour vos phrases et les consignes proposées).
 *  @param {string} texte
 *  @returns {string} */
export function typographie(texte) {
  return mots(texte).join(' ')
}

/** Le plan d'allumage d'une réponse lue phrase par phrase : pour chaque phrase, l'indice global de son premier mot,
 *  son nombre de mots, et la part de la phrase déjà dite quand la voix attaque chaque mot (au prorata des lettres).
 *  @param {string[]} suite
 *  @returns {{ debut: number, total: number, departs: number[] }[]} */
export function planMots(suite) {
  let debut = 0
  return (suite ?? []).map((phrase) => {
    const m = mots(phrase)
    const poids = m.map((x) => x.length + 1)
    const somme = poids.reduce((a, b) => a + b, 0) || 1
    let cumul = 0
    const departs = poids.map((p) => { const d = cumul / somme; cumul += p; return d })
    const ligne = { debut, total: m.length, departs }
    debut += m.length
    return ligne
  })
}

// L'œil devance un peu l'oreille : un mot s'allume à l'instant où la voix l'attaque.
const AVANCE = 0.06

/** Le nombre de mots dits (indice global, exclusif) quand la phrase i en est à la part p (0 à 1) de son audio.
 *  @param {{ debut: number, total: number, departs: number[] }[]} plan
 *  @param {number} i
 *  @param {number} p
 *  @returns {number} */
export function motsDits(plan, i, p) {
  const ligne = plan?.[i]
  if (!ligne) return 0
  const q = Math.max(0, Math.min(1, (Number.isFinite(p) ? p : 0) + AVANCE))
  let n = 0
  while (n < ligne.total && ligne.departs[n] <= q) n++
  return ligne.debut + n
}

/** Ce que dit l'expert en ouvrant la conversation. Il parle le premier, comme la Voix de LEVELS, et d'après les faits
 *  déjà à l'écran : la cible choisie. Rien n'est demandé au serveur, et la phrase entre dans l'historique partagé.
 *  @param {{ volet: 'qa' | 'pentest', cible?: string | null, reprise?: boolean }} contexte
 *  @returns {string} */
export function accueilExpert({ volet, cible = null, reprise = false }) {
  if (reprise) return 'Reprenons. Que voulez-vous préciser ?'
  const sur = cible ? ` sur ${cible}` : ''
  return volet === 'pentest'
    ? `Je suis l’expert Pentest. Demandez-moi ce que vérifie un contrôle${sur}, ou comment une faille est prouvée.`
    : `Je suis l’expert QA. Nous préparons une mission${sur}. Que voulez-vous vérifier ?`
}
