import { readBody, sameOrigin } from '@/lib/api-policy.mjs'
import { cibleConnue, repondre, type Tour, type Volet } from '@/lib/expert/expert'
import { hasSession } from '@/lib/session'

// D-51 : l'expert QA ou Pentest du studio. Même accès que les autres écritures de la console : session d'opérateur
// et même origine. Le corps est borné ; la cible doit être au catalogue pour le volet choisi.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

export async function POST(request: Request) {
  if (!(await hasSession())) return json({ erreur: 'Reconnectez-vous pour accéder à la console.' }, 401)
  if (!sameOrigin(request)) return json({ erreur: 'Origine de la demande refusée.' }, 403)
  let corps: Record<string, unknown>
  try {
    corps = JSON.parse(new TextDecoder().decode(await readBody(request, 20_000)))
  } catch {
    return json({ erreur: 'Demande illisible.' }, 400)
  }
  const volet = corps.volet === 'qa' || corps.volet === 'pentest' ? (corps.volet as Volet) : null
  const cible = typeof corps.cible === 'string' ? corps.cible : ''
  const question = typeof corps.question === 'string' ? corps.question.trim() : ''
  const consigne = typeof corps.consigne === 'string' ? corps.consigne.slice(0, 2000) : ''
  if (!volet || !question || question.length > 1000) return json({ erreur: 'Posez une question de 1 000 caractères au plus.' }, 400)
  if (!cibleConnue(volet, cible)) return json({ erreur: 'Choisissez une application autorisée.' }, 400)
  const historique = (Array.isArray(corps.historique) ? corps.historique : []).slice(-6).flatMap((t): Tour[] =>
    t && typeof t === 'object' && typeof (t as Tour).texte === 'string' && ['utilisateur', 'expert'].includes((t as Tour).role)
      ? [{ role: (t as Tour).role, texte: (t as Tour).texte.slice(0, 600) }] : [])
  try {
    return json(await repondre({ volet, cible, consigne, question, historique }))
  } catch (erreur) {
    console.error('[expert]', erreur instanceof Error ? erreur.message : erreur)
    return json({ erreur: 'L’expert ne répond pas pour l’instant. Réessayez dans un instant.' }, 503)
  }
}
