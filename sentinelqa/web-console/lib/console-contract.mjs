import { CATALOGUE_QA, validerMissionQa } from '../../web/lib/qa-contrat.mjs'
import { CATALOGUE, ligneMission } from '../../web/lib/missions.js'

export function catalog() {
  return {
    qa: CATALOGUE_QA.cibles.map(c => ({ id: c.id, name: c.nom, url: c.entree, available: true, connexion: Boolean(c.connexion),
      modes: Object.keys(CATALOGUE_QA.pilotages).filter(m => c.limites[m]), limits: c.limites })),
    pentest: CATALOGUE.scenarios.filter(s => s.mode === 'security').map(s => {
      const t = CATALOGUE.targets.find(t => t.id === s.target_id)
      return { id: s.id, targetId: s.target_id, name: s.title, target: t.name, url: t.entry_url, available: s.available === true, writes: t.business_writes === true,
        expected: s.expected, limitations: s.limitations, maxSteps: t.limits.max_steps, maxTime: t.limits.max_time_s }
    }),
  }
}
export function validateStart(body) {
  if (body?.mode === 'qa') return { module: 'qa', data: validerMissionQa(body) }
  if (body?.mode !== 'security') throw new Error('Choisissez le volet QA ou Pentest.')
  const scenario = CATALOGUE.scenarios.find(s => s.id === body.scenario_id && s.mode === 'security')
  if (!scenario || scenario.available !== true) throw new Error('Ce scénario n’est pas encore disponible depuis la console.')
  return { module: 'pentest', data: ligneMission(body) }
}
