import { libelleStatut } from '../../web/lib/qa-contrat.mjs'

const statuses = new Set(['passed', 'failed', 'inconclusive', 'skipped'])
const array = (v) => Array.isArray(v) ? v : []
const object = (v) => v && typeof v === 'object' && !Array.isArray(v) ? v : {}
const text = (v) => typeof v === 'string' ? v : ''
const number = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null
export function safeWebUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null }
  catch { return null }
}
export function summaryOf(results) {
  return Object.fromEntries([...statuses].map(s => [s, results.filter(r => r.status === s).length]))
}
export function normaliseMission(row, module) {
  const report = object(row.rapport)
  const request = object(row.demande ?? report.request)
  const versioned = [2, 3].includes(report.schema_version)
  const legacy = !report.schema_version && Array.isArray(report.preuves)
  const hasReport = versioned && report.phase === 'completed' || legacy
  let results = array(versioned ? report.results : []).map((value, i) => { const r = object(value); return ({
    id: text(r.id) || `R${i + 1}`, type: text(r.type), title: text(r.description) || text(r.scenario_title) || text(r.scenario_id) || `Contrôle ${i + 1}`,
    expected: text(r.attendu) || text(r.expected), observed: text(r.observe) || text(r.observed),
    status: statuses.has(r.status) ? r.status : 'inconclusive', reason: text(r.reason_code),
    evidence: array(r.preuves ?? r.evidence_references).filter(v => typeof v === 'string'),
  }) })
  if (legacy) results = array(report.preuves).map((value, i) => { const r = object(value); return ({
    id: `H${i + 1}`, type: '', title: text(r.type) || text(r.chemin) || `Constat ${i + 1}`, expected: '',
    observed: r.prouvee === true ? 'Constat confirmé dans le rapport historique.' : 'Constat non confirmé dans le rapport historique.',
    status: r.prouvee === true ? 'failed' : 'inconclusive', reason: 'historical_report', evidence: [],
  }) })
  const sessions = array(report.sessions).map(object).map(s => ({ id: text(s.session), replay: safeWebUrl(s.replay), status: text(s.statut), cost: number(s.cout_dollars) }))
  const evidence = array(report.evidence).map(object).map((e, i) => {
    const source = typeof e.image === 'string' ? e.image : e.image?.source
    const id = text(e.session)
    const prefix = `https://agp.eu.hcompany.ai/api/v1/trajectories/${id}/resources/`
    const image = /^[0-9a-f-]{36}$/.test(id) && typeof source === 'string' && source.startsWith(prefix)
      ? `/api/console/capture?session=${encodeURIComponent(id)}&src=${encodeURIComponent(source)}` : null
    return { id: text(e.id) || `E${i + 1}`, title: text(e.titre) || (e.kind === 'http' ? 'Vérification HTTP' : 'Observation du navigateur'), url: safeWebUrl(e.url), image,
      method: text(e.method), httpStatus: Number.isInteger(e.status_code) && e.status_code >= 100 && e.status_code <= 599 ? e.status_code : null,
      bytes: number(e.bytes), redirect: safeWebUrl(e.location), capturedAt: text(e.quand),
    }
  })
  return {
    id: text(row.id), module, title: text(report?.titre) || text(report?.scenario_title) || text(request.plan?.titre) || text(row.application) || (module === 'qa' ? 'Mission QA' : 'Contrôle d’accès'),
    target: text(row.cible) || text(request.target_id), createdAt: text(row.cree_le), status: text(row.statut) || 'inconnu',
    error: row.erreur ? text(row.erreur) : null, interruption: text(report.interruption), stopRequested: row.arret_demande === true,
    canStop: ['en_attente', 'en_cours'].includes(row.statut) && (module === 'qa' || report?.schema_version === 2),
    duration: number(report?.duration_s ?? report?.duree_totale_s), costH: number(report?.cost_h ?? report?.cout_dollars), costHf: number(report?.cost_hf ?? report?.cout_hf_dollars),
    results, summary: summaryOf(results), hasReport, legacy, sessions, evidence,
  }
}
export function formatMoney(value) {
  return number(value) === null ? 'Non mesuré' : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 4 })} $`
}
export function interruptionLabel(reason) {
  if (['write_risk', 'forbidden_page'].includes(reason)) return libelleStatut('inconclusive', reason)
  if (reason === 'cancelled') return 'Mission arrêtée à la demande de l’opérateur'
  if (['time_budget', 'timeout', 'step_budget'].includes(reason)) return 'Mission arrêtée · budget atteint'
  return 'Mission interrompue avant la fin des contrôles'
}
export function overallLabel(mission) {
  if (mission.status === 'echec') return 'Exécution interrompue'
  if (mission.status === 'en_attente') return 'En attente'
  if (mission.status === 'en_cours') return 'En cours'
  if (mission.interruption) return interruptionLabel(mission.interruption)
  if (!mission.hasReport || !mission.results.length) return 'Aucun verdict disponible'
  if (mission.summary.failed) return 'Écart constaté'
  if (mission.summary.inconclusive) return 'À confirmer'
  if (mission.summary.skipped) return 'Vérification partielle'
  return 'Contrôles exécutés conformes'
}
