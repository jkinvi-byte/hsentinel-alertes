import { CATALOGUE_QA, validerMissionQa } from '../../web/lib/qa-contrat.mjs'
import { CATALOGUE, ligneMission } from '../../web/lib/missions.js'

export function catalog() {
  return {
    qa: CATALOGUE_QA.cibles.map(c => ({ id: c.id, name: c.nom, url: c.entree, available: true, connexion: Boolean(c.connexion),
      modes: Object.keys(CATALOGUE_QA.pilotages).filter(m => c.limites[m]), limits: c.limites })),
    pentest: CATALOGUE.scenarios.filter(s => s.mode === 'security').map(s => {
      const targetIds = s.target_ids ?? [s.target_id]
      const targets = targetIds.map(id => CATALOGUE.targets.find(t => t.id === id)).filter(Boolean).map(t => ({
        id: t.id, name: t.name, url: t.entry_url, maxSteps: t.limits.max_steps, maxTime: t.limits.max_time_s,
      }))
      const t = CATALOGUE.targets.find(t => t.id === targetIds[0])
      return { id: s.id, targetId: t.id, targetIds, targets, name: s.title, target: t.name, url: t.entry_url, available: s.available === true, writes: t.business_writes === true,
        expected: s.expected, limitations: s.limitations, maxSteps: t.limits.max_steps, maxTime: t.limits.max_time_s }
    }),
  }
}
// `cible` : une application ajoutée par le client (D-56), déjà lue dans Supabase et vérifiée par l'appelant.
/** @param {any} body @param {Record<string, any> | null} [cible] */
export function validateStart(body, cible = null) {
  if (body?.mode === 'qa') return { module: 'qa', data: validerMissionQa(body, cible) }
  if (body?.mode !== 'security') throw new Error('Choisissez le volet QA ou Pentest.')
  const scenario = CATALOGUE.scenarios.find(s => s.id === body.scenario_id && s.mode === 'security')
  if (!scenario || scenario.available !== true) throw new Error('Ce scénario n’est pas encore disponible depuis la console.')
  return { module: 'pentest', data: ligneMission(body) }
}
