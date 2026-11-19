import 'server-only'

// D-51 : la voix de l'expert passe par Hugging Face, partenaire du hackathon : Kokoro-82M et sa voix française
// « ff_siwis », servis par deepinfra via le routeur HF (route compatible OpenAI), avec le même jeton que Whisper et Llama.
// Débit 1,1, celui de la Voix du Sommet de LEVELS. La voix du système reste le secours, côté navigateur.
const ROUTE = 'https://router.huggingface.co/deepinfra/v1/openai/audio/speech'
export const VOIX_HF = { modele: 'hexgrad/Kokoro-82M', voix: 'ff_siwis', debit: 1.1 } as const

export async function syntheseHf(texte: string, jeton = process.env.HF_TOKEN) {
  if (!jeton) throw new Error('Le jeton Hugging Face n’est pas configuré sur ce serveur.')
  const r = await fetch(ROUTE, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: VOIX_HF.modele, input: texte, voice: VOIX_HF.voix, response_format: 'mp3', speed: VOIX_HF.debit }),
  })
  if (!r.ok) throw new Error(`Hugging Face a répondu HTTP ${r.status}.`)
  return { audio: await r.arrayBuffer(), fournisseur: r.headers.get('x-inference-provider') ?? 'deepinfra' }
}
