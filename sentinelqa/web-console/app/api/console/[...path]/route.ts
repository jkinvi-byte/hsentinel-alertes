import { hasSession } from '@/lib/session'
import { catalog, validateStart } from '@/lib/console-contract.mjs'
import { normaliseMission } from '@/lib/mission-view.mjs'
import { sameOrigin, readBody } from '@/lib/api-policy.mjs'
import { publicRunnerKey } from '@/lib/qa-account.mjs'
import { alertFilters } from '@/lib/alerts-contract.mjs'
import { requete as sharedQuery } from '../../../../../web/lib/supabase.js'
import { lireMission, lireEvenementsQa, creerMission, demanderArret, preparerPlan, transcrire, capture, cleRunner, CATALOGUE_QA } from '../../../../../web/lib/qa.js'
import { lireEvenements } from '../../../../../web/lib/audits.js'
import { listerAlertes, bilanAlertes, listerApplications } from '../../../../../web/lib/alertes.js'
import { POST as stopPentest } from '../../../../../web/app/api/audits/[id]/arret/route.js'
import { ajouterApplication, ajouterCompte, cibleQaClient, compteDe, listerAjoutees, retirerApplication, retirerCompte, verifierApplication } from '../../../../../web/lib/applications.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 90
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
type Context = { params: Promise<{ path: string[] }> }
// Le service partagé est en JavaScript : ce contrat décrit ses options réelles, sans dupliquer son implémentation.
const requete = sharedQuery as (path: string, options?: { methode?: string; prefer?: string; corps?: unknown }) => Promise<Array<Record<string, any>>>
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
// Une erreur de Supabase ne se montre jamais telle quelle ; une règle refusée (adresse, attestation, compte) se dit à l'utilisateur.
const refus = (error: unknown, fallback: string) => error instanceof Error && !error.message.startsWith('Supabase ')
  ? json({ erreur: error.message }, 400) : json({ erreur: fallback }, 503)
// La cible QA d'une demande : un exemple du catalogue, ou une application ajoutée dont le contrôle est prouvé (D-56).
async function cibleQaDe(targetId: unknown): Promise<{ connue: boolean; cible: Record<string, any> | null }> {
  if (typeof targetId !== 'string') return { connue: false, cible: null }
  if (catalog().qa.some(c => c.id === targetId && c.available)) return { connue: true, cible: null }
  const cible = await cibleQaClient(targetId)
  return { connue: Boolean(cible), cible }
}
async function access(request: Request, mutation = false) {
  if (!(await hasSession())) return json({ erreur: 'Reconnectez-vous pour accéder à la console.' }, 401)
  if (mutation && !sameOrigin(request)) return json({ erreur: 'Origine de la demande refusée.' }, 403)
  return null
}

export async function GET(request: Request, context: Context) {
  const refused = await access(request)
  if (refused) return refused
  const { path } = await context.params
  const query = new URL(request.url).searchParams
  try {
    if (path.join('/') === 'catalogue') return json(catalog(await listerAjoutees()))
    if (path.join('/') === 'applications') return json({ applications: await listerAjoutees() })
    if (path.join('/') === 'cle-runner') return json(publicRunnerKey(await cleRunner()))
    if (path.join('/') === 'alertes') {
      let filters
      try { filters = alertFilters(query) }
      catch (error) { return json({ erreur: error instanceof Error ? error.message : 'Filtre invalide.' }, 400) }
      const [alertes, applications] = await Promise.all([listerAlertes(filters), listerApplications()])
      return json({ ...filters, alertes, bilan: bilanAlertes(alertes),
        applications: applications.map((a: { id: string; nom: string }) => ({ id: a.id, nom: a.nom })) })
    }
    if (path.join('/') === 'capture') {
      const image = await capture(query.get('session'), query.get('src'))
      return image ? new Response(image.corps, { headers: { 'Content-Type': image.type, 'Cache-Control': 'private, no-store' } }) : json({ erreur: 'Capture indisponible.' }, 404)
    }
    const module = path[1]
    if (path[0] !== 'missions' || !['qa', 'pentest'].includes(module)) return json({ erreur: 'Route inconnue.' }, 404)
    const table = module === 'qa' ? 'qa_missions' : 'audits'
    if (path.length === 2) {
      const columns = module === 'qa' ? 'id,cree_le,statut,cible,demande,rapport,erreur,arret_demande' : 'id,cree_le,statut,application,cible,rapport,erreur'
      const rows = await requete(`${table}?select=${columns}&order=cree_le.desc&limit=30`)
      return json({ missions: rows.filter((r: { rapport?: { request?: { mode?: string } } }) => module === 'qa' || r.rapport?.request?.mode !== 'qa')
        .map((row: unknown) => normaliseMission(row, module)) })
    }
    const id = path[2]
    if (path.length !== 3 || !UUID.test(id)) return json({ erreur: 'Mission introuvable.' }, 404)
    const row = module === 'qa' ? await lireMission(id) : (await requete(`audits?select=id,cree_le,statut,application,cible,rapport,erreur&id=eq.${id}`))[0]
    if (!row) return json({ erreur: 'Mission introuvable.' }, 404)
    const after = Math.max(0, Number(query.get('apres')) || 0)
    const events = module === 'qa' ? await lireEvenementsQa(id, after) : await lireEvenements(id, after)
    return json({ mission: normaliseMission(row, module), events: events.map((e: { id: number; quand: string; type: string; message: string }) => ({ id: e.id, quand: e.quand, type: e.type, message: e.message })) })
  } catch {
    return json({ erreur: 'Les données sont momentanément indisponibles. Réessayez dans quelques instants.' }, 503)
  }
}

export async function POST(request: Request, context: Context) {
  const refused = await access(request, true)
  if (refused) return refused
  const { path } = await context.params
  if (path.join('/') === 'transcription') {
    const mime = request.headers.get('content-type') ?? ''
    if (!/^audio\/(webm|ogg|mp4|mpeg|wav|x-wav|flac)(;|$)/.test(mime)) return json({ erreur: 'Format audio non pris en charge.' }, 415)
    try {
      const bytes = await readBody(request, CATALOGUE_QA.transcription.max_octets)
      if (!bytes.length) return json({ erreur: 'L’enregistrement est vide.' }, 400)
      return json(await transcrire(bytes, mime))
    } catch (error) { return json({ erreur: error instanceof RangeError ? error.message : 'La transcription a échoué. Réessayez ou tapez votre consigne.' }, error instanceof RangeError ? 413 : 502) }
  }
  if (path[0] === 'missions' && path.length === 4 && path[3] === 'arret' && ['qa', 'pentest'].includes(path[1]) && UUID.test(path[2])) {
    try {
      if (path[1] === 'pentest') return await stopPentest(request, { params: Promise.resolve({ id: path[2] }) })
      const result = await demanderArret(path[2])
      return result ? json(result, result.termine ? 200 : 202) : json({ erreur: 'Mission introuvable.' }, 404)
    } catch { return json({ erreur: 'L’arrêt n’a pas pu être demandé. Réessayez.' }, 503) }
  }
  if (path[0] === 'applications') return ecrireApplication(request, path)
  if (!['plan', 'missions'].includes(path.join('/'))) return json({ erreur: 'Route inconnue.' }, 404)
  let body
  try { body = JSON.parse(new TextDecoder().decode(await readBody(request, 32_768))) }
  catch (error) { return json({ erreur: 'Demande illisible ou trop volumineuse.' }, error instanceof RangeError ? 413 : 400) }
  if (path[0] === 'plan') {
    const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : ''
    if (!instruction || [...instruction].length > 2000) return json({ erreur: 'Décrivez le parcours en 2 000 caractères au maximum.' }, 400)
    let qa
    try { qa = await cibleQaDe(body.target_id) } catch { return json({ erreur: 'Les applications sont momentanément illisibles. Réessayez.' }, 503) }
    if (!qa.connue) return json({ erreur: 'Cette application n’est pas disponible dans le studio : prouvez d’abord que vous en avez le contrôle.' }, 400)
    try { return json({ plan: await preparerPlan(body.target_id, instruction, qa.cible) }) }
    catch { return json({ erreur: 'Le plan n’a pas pu être préparé. Votre consigne est conservée ; réessayez.' }, 502) }
  }
  let qa: { connue: boolean; cible: Record<string, any> | null } = { connue: true, cible: null }
  if (body?.mode === 'qa') {
    try { qa = await cibleQaDe(body.target_id) } catch { return json({ erreur: 'Les applications sont momentanément illisibles. Réessayez.' }, 503) }
    if (!qa.connue) return json({ erreur: 'Cette application n’est pas vérifiée : prouvez d’abord que vous en avez le contrôle.' }, 400)
  }
  let pentestLibre: Record<string, any> | null = null
  if (body?.mode === 'security' && !catalog().pentest.some(s => s.targetIds.includes(body.target_id))) {
    try { pentestLibre = await cibleQaClient(body.target_id) }
    catch { return json({ erreur: 'Les applications sont momentanément illisibles. Réessayez.' }, 503) }
    if (!pentestLibre) return json({ erreur: 'Cette application n’est pas vérifiée : prouvez d’abord que vous en avez le contrôle.' }, 400)
  }
  let validated
  try { validated = validateStart(body, qa.cible, pentestLibre) }
  catch (error) { return json({ erreur: error instanceof Error ? error.message : 'Mission invalide.' }, 400) }
  // Un compte enregistré doit appartenir à cette application : jamais le compte d'une autre.
  const qaData = validated.data as { target_id?: string; compte_id?: string }
  if (validated.module === 'qa' && qaData.compte_id) {
    try { if (!(await compteDe(qaData.target_id, qaData.compte_id))) return json({ erreur: 'Ce compte de test n’existe plus pour cette application.' }, 400) }
    catch { return json({ erreur: 'Les comptes de test sont momentanément illisibles. Réessayez.' }, 503) }
  }
  try {
    const id = validated.module === 'qa' ? await creerMission(validated.data)
      : (await requete('audits', { methode: 'POST', prefer: 'return=representation', corps: validated.data }))[0].id
    return json({ id, module: validated.module }, 201)
  } catch { return json({ erreur: 'La mission n’a pas pu être enregistrée. Vérifiez l’historique avant de réessayer.' }, 503) }
}

// D-56 : ajouter une application, prouver son contrôle, enregistrer ses comptes de test. Chaque écriture est relue ici
// et dans le runner ; le mot de passe arrive déjà chiffré par le navigateur.
const ID_APP = /^[a-z0-9][a-z0-9-]{0,59}$/
async function ecrireApplication(request: Request, path: string[]) {
  const id = path[1]
  if (path.length > 1 && !ID_APP.test(id)) return json({ erreur: 'Application introuvable.' }, 404)
  if (path.length === 3 && path[2] === 'verification') {
    try {
      const resultat = await verifierApplication(id)
      return resultat ? json(resultat) : json({ erreur: 'Application introuvable.' }, 404)
    } catch (error) { return refus(error, 'La vérification n’a pas pu se faire. Réessayez.') }
  }
  if (path.length !== 1 && !(path.length === 3 && path[2] === 'comptes')) return json({ erreur: 'Route inconnue.' }, 404)
  let body
  try { body = JSON.parse(new TextDecoder().decode(await readBody(request, 8192))) }
  catch (error) { return json({ erreur: 'Demande illisible ou trop volumineuse.' }, error instanceof RangeError ? 413 : 400) }
  try {
    if (path.length === 1) return json({ application: await ajouterApplication(body) }, 201)
    const compte = await ajouterCompte(id, body)
    return compte ? json({ compte }, 201) : json({ erreur: 'Application introuvable.' }, 404)
  } catch (error) { return refus(error, 'L’enregistrement a échoué. Réessayez.') }
}

export async function DELETE(request: Request, context: Context) {
  const refused = await access(request, true)
  if (refused) return refused
  const { path } = await context.params
  if (path[0] !== 'applications' || !ID_APP.test(path[1] ?? '')) return json({ erreur: 'Route inconnue.' }, 404)
  try {
    if (path.length === 2) {
      const resultat = await retirerApplication(path[1])
      return resultat ? json(resultat) : json({ erreur: 'Application introuvable.' }, 404)
    }
    if (path.length === 4 && path[2] === 'comptes' && UUID.test(path[3])) {
      const resultat = await retirerCompte(path[1], path[3])
      return resultat ? json(resultat) : json({ erreur: 'Compte introuvable.' }, 404)
    }
    return json({ erreur: 'Route inconnue.' }, 404)
  } catch (error) { return refus(error, 'Le retrait a échoué. Réessayez.') }
}
