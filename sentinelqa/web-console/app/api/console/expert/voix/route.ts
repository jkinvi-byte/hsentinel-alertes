import { readBody, sameOrigin } from '@/lib/api-policy.mjs'
import { syntheseHf, VOIX_HF } from '@/lib/expert/voix-serveur'
import { hasSession } from '@/lib/session'

// D-51 : la réponse de l'expert, lue par Kokoro (Hugging Face). Même accès que les autres écritures de la console.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  if (!(await hasSession())) return json({ erreur: 'Reconnectez-vous pour accéder à la console.' }, 401)
  if (!sameOrigin(request)) return json({ erreur: 'Origine de la demande refusée.' }, 403)
  let texte = ''
  try {
    const corps = JSON.parse(new TextDecoder().decode(await readBody(request, 8_000)))
    texte = typeof corps.texte === 'string' ? corps.texte.trim() : ''
  } catch {
    return json({ erreur: 'Demande illisible.' }, 400)
  }
  if (!texte || texte.length > 1200) return json({ erreur: 'Un texte de 1 200 caractères au plus.' }, 400)
  try {
    const { audio, fournisseur } = await syntheseHf(texte)
    return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Voix': `${VOIX_HF.modele} ${VOIX_HF.voix} (${fournisseur})` } })
  } catch (erreur) {
    console.error('[expert-voix]', erreur instanceof Error ? erreur.message : erreur)
    return json({ erreur: 'La voix est momentanément indisponible.' }, 503)
  }
}
