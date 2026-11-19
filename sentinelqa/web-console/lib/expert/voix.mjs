// LA VOIX DE L'EXPERT (D-51) : la synthèse du système, réglée comme la Voix du Sommet de LEVELS
// (/Users/aurian/Desktop/levels:/app.js, _sommetVoicePickFor et _sommetSpeak). Aucune clé d'API.
// Une voix stable (pas la loterie du système), les voix claires d'abord, la version améliorée à
// identité égale, un débit vif, une phrase par énoncé, et un garde-fou qui rend toujours la main.

const PREFEREES = [/audrey/i, /am[ée]lie/i, /aur[ée]lie/i, /\bmarie\b/i, /google fran/i, /denise/i, /eloise|[ée]lise/i, /thomas/i, /henri/i, /paul/i]
const FANTAISIE = /^(Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i
export const DEBIT = 1.1
export const HAUTEUR = 1

/** La voix française à utiliser parmi celles du système : région exacte d'abord, puis l'ordre des préférences, version premium ou améliorée d'abord. */
export function choisirVoixParmi(voix, langue = 'fr-FR') {
  const region = (s) => String(s).replace(/_/g, '-').toLowerCase()
  const francaises = (voix ?? []).filter((v) => /^fr/i.test(v.lang) && !FANTAISIE.test(v.name))
  const exactes = francaises.filter((v) => region(v.lang) === region(langue))
  const pool = exactes.length ? exactes : francaises
  const qualite = (v) => (/premium/i.test(`${v.name} ${v.voiceURI}`) ? 2 : /enhanced|améliorée?/i.test(`${v.name} ${v.voiceURI}`) ? 1 : 0)
  for (const nom of PREFEREES) {
    const trouvee = pool.filter((v) => nom.test(String(v.name))).sort((a, b) => qualite(b) - qualite(a))[0]
    if (trouvee) return trouvee
  }
  return pool.find((v) => v.default) ?? pool[0] ?? null
}

/** Une phrase par énoncé : les longues lectures ne sont plus coupées, et chaque phrase a son propre garde-fou. */
export function phrases(texte) {
  return String(texte ?? '').split(/(?<=[.!?…])\s+/).map((p) => p.trim()).filter(Boolean)
}

// Les phrases fantômes que Whisper « entend » dans le bruit ou le silence : sous-titres et fins de vidéo, en français
// comme en anglais (le 19/11, un bip du micro de recette est devenu « Thank you. », et l'expert y a répondu).
const FANTOMES = /amara\.org|sous-?titr|radio-canada|merci d.avoir regard|^merci[\s.!]*$|^(euh|hum|hm)[\s.!]*$|^(thank you|thanks)( (so much|very much|for watching|for listening))?[\s.!]*$|^(bye|you)[\s.!]*$/i

/** Une transcription à laquelle l'expert doit répondre : ni vide, ni l'une des phrases fantômes de Whisper.
 *  @param {string} texte
 *  @returns {boolean} */
export function transcriptionUtile(texte) {
  const t = String(texte ?? '').trim()
  if (t.replace(/[^\p{L}\p{N}]/gu, '').length < 4) return false
  return !FANTOMES.test(t)
}

let cache = null
let enCours = []
let garde = null

function synthese() {
  return typeof window !== 'undefined' && window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null
}

if (typeof window !== 'undefined') {
  try { window.speechSynthesis?.addEventListener?.('voiceschanged', () => { cache = null }) } catch {}
}

function voixChoisie() {
  // getVoices peut être vide au premier geste : on ne fige jamais ce vide.
  if (!cache) cache = choisirVoixParmi(synthese()?.getVoices() ?? [])
  return cache
}

/** Lit le texte. surFin est appelé une seule fois : à la fin, en cas d'erreur, ou si la voix ne démarre jamais.
 *  surPhrase(i) suit le VRAI départ de chaque phrase : l'écran suit la voix, jamais un minuteur (comme LEVELS).
 *  @param {string} texte
 *  @param {() => void} [surFin]
 *  @param {(i: number) => void} [surPhrase]
 *  @returns {boolean} */
export function parler(texte, surFin = () => {}, surPhrase = () => {}) {
  const s = synthese()
  const suite = phrases(texte)
  if (!s || !suite.length) return false
  taire()
  const voix = voixChoisie()
  // Garder les énoncés : sans référence, certains navigateurs (iOS) les abandonnent en cours de lecture.
  enCours = suite.map((p) => {
    const u = new window.SpeechSynthesisUtterance(p)
    u.lang = 'fr-FR'; u.rate = DEBIT; u.pitch = HAUTEUR; u.volume = 1
    if (voix) u.voice = voix
    return u
  })
  let fini = false
  const terminer = () => {
    if (fini) return
    fini = true
    clearTimeout(garde)
    garde = null
    enCours = []
    surFin()
  }
  const armer = (ms) => { clearTimeout(garde); garde = setTimeout(terminer, ms) }
  enCours.forEach((u, i) => {
    u.onstart = () => { armer(Math.min(30000, u.text.length * 95 + 4000)); try { surPhrase(i) } catch {} }
    u.onend = () => (i === enCours.length - 1 ? terminer() : armer(3500))
    u.onerror = terminer
    s.speak(u)
  })
  armer(6000)
  return true
}

export function taire() {
  clearTimeout(garde)
  garde = null
  enCours = []
  try { synthese()?.cancel() } catch {}
}
