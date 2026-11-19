// S-BANC-01 (D-46) : la console propose le banc, et nomme ses résultats comme le canon (faille prouvée, pas écart).
import test from 'node:test'
import assert from 'node:assert/strict'
import { catalog, validateStart } from '../lib/console-contract.mjs'
import { normaliseMission, overallLabel } from '../lib/mission-view.mjs'

test('Le banc est proposé et se lance depuis la console', () => {
  const banc = catalog().pentest.find(s => s.id === 'S-BANC-01')
  assert.deepEqual([banc.available, banc.target, banc.url], [true, 'Paie Express', 'https://hsentinel-banc.vercel.app/'])
  assert.equal(banc.writes, true)  // le panneau ne dit jamais « sans modification » pour le banc
  assert.equal(catalog().pentest.find(s => s.id === 'S-PEER-01').writes, false)
  const depart = validateStart({ schema_version: 2, mode: 'security', target_id: 'paie-express', scenario_id: 'S-BANC-01', instruction: '' })
  assert.equal(depart.module, 'pentest')
  assert.equal(depart.data.ecriture_autorisee, false)
})

test('Le titre d’une mission dit « faille prouvée » en pentest, « écart constaté » en QA', () => {
  const ligne = (results) => ({ id: 'x', statut: 'termine', rapport: { schema_version: 2, phase: 'completed', request: { mode: 'security' }, results } })
  const six = Array.from({ length: 6 }, () => ({ status: 'failed', reason_code: 'vulnerability_proven' }))
  assert.equal(overallLabel(normaliseMission(ligne(six), 'pentest')), 'Failles prouvées')
  assert.equal(overallLabel(normaliseMission(ligne(six.slice(0, 1)), 'pentest')), 'Faille prouvée')
  assert.equal(overallLabel(normaliseMission(ligne(six.slice(0, 1)), 'qa')), 'Écart constaté')
})
