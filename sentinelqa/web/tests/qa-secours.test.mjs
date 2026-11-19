import { test } from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

// qa.js commence par « import 'server-only' », que seul Next.js sait résoudre : hors de Next, ce module est vide.
// Les imports relatifs sans extension (« ./supabase »), que Next.js accepte, reçoivent ici leur « .js ».
register('data:text/javascript,export async function resolve(s, c, n) { if (s === "server-only") return { url: "data:text/javascript,", shortCircuit: true }; try { return await n(s, c) } catch (e) { if (s.startsWith(".") && !/\\.[cm]?js$/.test(s)) return n(s + ".js", c); throw e } }')
const { preparerPlan } = await import('../lib/qa.js')

// Le 19/11, le routeur Hugging Face a répondu 429 pour le modèle imposé chez Groq. Le plan doit alors venir
// du même modèle, chez un autre fournisseur, au lieu d'échouer en pleine démo.
test('plan : un 429 du fournisseur imposé est repris par le même modèle, sans fournisseur imposé', async () => {
  const appels = []
  const plan = { titre: 'Vérifier le Bachelor', etapes: ['Ouvrir le menu'], criteres: [{ type: 'texte', description: 'Le diplôme est affiché', valeur: 'Bac+3' }], hors_perimetre: [], inconnues: [] }
  const avant = globalThis.fetch
  process.env.HF_TOKEN = 'jeton-de-test'
  globalThis.fetch = async (url, options = {}) => {
    if (!String(url).includes('router.huggingface.co')) return new Response('<a href="/programme">Programme</a>', { status: 200 })
    const corps = JSON.parse(options.body)
    appels.push(corps.model)
    if (corps.model.includes(':')) return new Response('{"error":"rate limited"}', { status: 429 })
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(plan) } }], usage: { total_tokens: 10 } }), { status: 200 })
  }
  try {
    const resultat = await preparerPlan('eugenia-public', 'Vérifie le Bachelor et son diplôme « Bac+3 ».')
    assert.equal(appels.length, 2)
    assert.ok(appels[0].endsWith(':groq'))
    assert.equal(appels[1], appels[0].split(':')[0])
    assert.equal(resultat.preparation.modele, appels[1])
    assert.equal(resultat.titre, 'Vérifier le Bachelor')
  } finally {
    globalThis.fetch = avant
  }
})
