import test from 'node:test'
import assert from 'node:assert/strict'
import { catalog, validateStart } from '../lib/console-contract.mjs'
import { normaliseMission, overallLabel, formatMoney, safeWebUrl, interruptionLabel } from '../lib/mission-view.mjs'
import { createSession, validSession, acceptsToken } from '../lib/operator-session.mjs'
import { readBody, sameOrigin } from '../lib/api-policy.mjs'

const id = '11111111-1111-4111-8111-111111111111'
const plan = { titre: 'Navigation', etapes: ['Ouvrir Programmes'], criteres: [{ type: 'texte', description: 'Le titre attendu apparaît', valeur: 'Bachelor' }], hors_perimetre: [], inconnues: [] }
const mission = { schema_version: 3, mode: 'qa', target_id: 'eugenia-public', pilotage: 'guide', instruction: 'Ouvrir le Bachelor', plan }
const fixture = (report) => ({ id, statut: 'termine', cible: 'example.invalid', rapport: report })

test('Le lancement QA garde le contrat et la file du moteur existant', () => {
  const accepted = validateStart(mission)
  assert.equal(accepted.module, 'qa')
  assert.equal(accepted.data.schema_version, 3)
  assert.equal(accepted.data.plan.criteres[0].id, 'C1')
  assert.throws(() => validateStart({ ...mission, arbitrary_url: 'https://example.invalid' }))
})
test('Le QA connecté est proposé, avec un compte exigé par le contrat serveur', () => {
  const target = catalog().qa.find(c => c.id === 'peer-review')
  assert.equal(target.available, true)
  assert.equal(target.connexion, true)
  assert.equal(catalog().qa.find(c => c.id === 'eugenia-public').connexion, false)
  assert.throws(() => validateStart({ ...mission, target_id: 'peer-review' }), /compte de test/)
})
test('Un scénario pentest en préparation ne peut pas être forcé par une requête', () => {
  assert.throws(() => validateStart({ schema_version: 2, mode: 'security', target_id: 'peer-review', scenario_id: 'S-PEER-02' }), /disponible/)
  const accepted = validateStart({ schema_version: 2, mode: 'security', target_id: 'peer-review', scenario_id: 'S-PEER-01' })
  assert.equal(accepted.module, 'pentest')
  assert.equal(accepted.data.rapport.phase, 'queued')
  assert.equal(accepted.data.ecriture_autorisee, false)
})
test('Une cible ou un volet incorrect est rejeté', () => {
  assert.throws(() => validateStart({ schema_version: 2, mode: 'security', target_id: 'eugenia-public', scenario_id: 'S-PEER-01' }))
  assert.throws(() => validateStart({ mode: 'anything' }))
})
test('Une mission sans rapport ne devient pas un résultat conforme', () => {
  const m = normaliseMission(fixture(null), 'qa')
  assert.equal(overallLabel(m), 'Aucun verdict disponible')
  assert.equal(m.costH, null)
  assert.equal(formatMoney(m.costH), 'Non mesuré')
})
test('Un rapport vide terminé reste sans verdict et préserve le coût zéro mesuré', () => {
  const m = normaliseMission(fixture({ schema_version: 3, phase: 'completed', cost_h: 0, results: [] }), 'qa')
  assert.equal(overallLabel(m), 'Aucun verdict disponible')
  assert.equal(formatMoney(m.costH), '0 $')
})
test('Les non-conclusions et contrôles non exécutés restent distincts', () => {
  const m = normaliseMission(fixture({ schema_version: 3, phase: 'completed', results: [
    { id: 'C1', status: 'passed' }, { id: 'C2', status: 'inconclusive' }, { id: 'C3', status: 'skipped' }, { id: 'C4', status: 'unknown' },
  ] }), 'qa')
  assert.deepEqual(m.summary, { passed: 1, failed: 0, inconclusive: 2, skipped: 1 })
  assert.equal(overallLabel(m), 'À confirmer')
})
test('Le rapport pentest v2 conserve attendu, observé et références de preuves', () => {
  const m = normaliseMission(fixture({ schema_version: 2, phase: 'completed', results: [{ status: 'failed', expected: 'Refus', observed: 'Contenu reçu', evidence_references: ['E1'] }] }), 'pentest')
  assert.equal(m.results[0].expected, 'Refus')
  assert.equal(m.results[0].observed, 'Contenu reçu')
  assert.deepEqual(m.results[0].evidence, ['E1'])
  assert.equal(overallLabel(m), 'Faille prouvée')  // le canon : pentest → faille prouvée (D-46)
})
test('Les preuves HTTP gardent le statut et la redirection, sans corps ni cookies', () => {
  const m = normaliseMission(fixture({ schema_version: 2, phase: 'completed', evidence: [{ id: 'http-1', kind: 'http', method: 'GET', status_code: 307, bytes: 25,
    url: 'https://example.invalid/private', location: 'https://example.invalid/login', body: 'synthetic-private-body', cookies: 'synthetic-cookie',
  }] }), 'pentest')
  assert.equal(m.evidence[0].httpStatus, 307)
  assert.equal(m.evidence[0].redirect, 'https://example.invalid/login')
  assert.equal(JSON.stringify(m).includes('synthetic-private-body'), false)
  assert.equal(JSON.stringify(m).includes('synthetic-cookie'), false)
})
test('Une version de rapport inconnue ou des entrées absentes ne produisent pas un faux succès', () => {
  const future = normaliseMission(fixture({ schema_version: 99, phase: 'completed', results: [{ status: 'passed' }] }), 'qa')
  assert.equal(overallLabel(future), 'Aucun verdict disponible')
  const partial = normaliseMission(fixture({ schema_version: 3, phase: 'completed', results: [null], sessions: [null], evidence: [null] }), 'qa')
  assert.equal(overallLabel(partial), 'À confirmer')
})
test('Le rapport conserve K1, K2, les motifs précis et une interruption malgré des critères conformes', () => {
  const m = normaliseMission(fixture({ schema_version: 3, phase: 'completed', interruption: 'forbidden_page', results: [
    { id: 'K1', type: 'connexion', description: 'Connexion', status: 'passed' },
    { id: 'K2', type: 'identite', description: 'Identité', status: 'passed' },
    { id: 'C1', type: 'texte', status: 'inconclusive', reason_code: 'h_text_partial' },
  ] }), 'qa')
  assert.deepEqual(m.results.slice(0, 2).map(r => [r.id, r.type]), [['K1', 'connexion'], ['K2', 'identite']])
  assert.equal(m.results[2].reason, 'h_text_partial')
  assert.equal(m.interruption, 'forbidden_page')
  assert.match(overallLabel(m), /page interdite/)
  assert.match(interruptionLabel('write_risk'), /geste à risque/)
})
test('Le rapport normalisé ne contient ni comptes, ni coffre, ni demande brute', () => {
  const row = { ...fixture({ schema_version: 3, phase: 'completed', request: { coffre: 'synthetic-vault' }, results: [] }), secrets_chiffres: 'synthetic-secret', comptes: ['synthetic-person'] }
  const data = JSON.stringify(normaliseMission(row, 'qa'))
  for (const value of ['synthetic-vault', 'synthetic-secret', 'synthetic-person']) assert.equal(data.includes(value), false)
})
test('Les liens des résultats refusent les schémas exécutables et les identifiants', () => {
  assert.equal(safeWebUrl('javascript:alert(1)'), null)
  assert.equal(safeWebUrl('https://user:password@example.invalid'), null)
  assert.equal(safeWebUrl('https://example.invalid/report'), 'https://example.invalid/report')
})
test('Une capture H reste derrière le relais authentifié', () => {
  const source = `https://agp.eu.hcompany.ai/api/v1/trajectories/${id}/resources/a.png`
  const m = normaliseMission(fixture({ schema_version: 3, phase: 'completed', evidence: [{ id: 'E1', session: id, image: source }, { id: 'E2', session: id, image: 'https://example.invalid/a.png' }] }), 'qa')
  assert.match(m.evidence[0].image, /^\/api\/console\/capture\?/)
  assert.equal(m.evidence[1].image, null)
})
test('La session simulée historique et un secret absent ne donnent pas accès', () => {
  assert.equal(validSession('demo', undefined), false)
  assert.equal(validSession('demo', 'synthetic-test-secret-long-enough'), false)
  assert.equal(acceptsToken('', ''), false)
})
test('La session signée expire, refuse une altération et une autre clé', () => {
  const secret = 'synthetic-test-secret-long-enough', now = 1_700_000_000_000
  const token = createSession(secret, now)
  assert.equal(validSession(token, secret, now), true)
  assert.equal(validSession(`${token}x`, secret, now), false)
  assert.equal(validSession(token, secret + 'different', now), false)
  assert.equal(validSession(token, secret, now + 8 * 60 * 60 * 1000), false)
})
test('Les mutations demandent la même origine', () => {
  assert.equal(sameOrigin(new Request('https://console.example/api', { headers: { origin: 'https://console.example' } })), true)
  assert.equal(sameOrigin(new Request('https://console.example/api', { headers: { origin: 'https://elsewhere.example' } })), false)
  assert.equal(sameOrigin(new Request('https://console.example/api')), false)
  // Next en développement : request.url dit « localhost », la page est servie sur 127.0.0.1:3101 (dictée refusée, 18/11).
  const dev = origin => new Request('http://localhost:3101/api/console/transcription', { headers: { origin, host: '127.0.0.1:3101' } })
  assert.equal(sameOrigin(dev('http://127.0.0.1:3101')), true)
  assert.equal(sameOrigin(dev('https://elsewhere.example')), false)
})
test('Le corps est borné même sans Content-Length', async () => {
  const body = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(5)); c.enqueue(new Uint8Array(6)); c.close() } })
  const request = new Request('http://localhost/api', { method: 'POST', body, duplex: 'half' })
  await assert.rejects(() => readBody(request, 10), RangeError)
  const small = new Request('http://localhost/api', { method: 'POST', body: 'bonjour' })
  assert.equal(new TextDecoder().decode(await readBody(small, 10)), 'bonjour')
})
