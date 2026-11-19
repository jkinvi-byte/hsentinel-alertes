import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOGUE, ligneMission, normaliserMission, validerMission, cibleReelle } from '../lib/missions.js';
import { autoriseOperateur, memeOrigine } from '../lib/acces-operateur.js';

const demande = { schema_version: 2, mode: 'qa', target_id: 'eugenia-public', scenario_id: 'Q-PUB-01', instruction: '' };

test('les deux volets entrent dans la même file sans compte ni mot de passe', () => {
  for (const scenario of CATALOGUE.scenarios.filter((s) => s.available)) for (const targetId of scenario.target_ids ?? [scenario.target_id]) {
    const row = ligneMission({ ...demande, mode: scenario.mode, target_id: targetId, scenario_id: scenario.id });
    assert.deepEqual(row.comptes, []);
    assert.equal(row.secrets_chiffres, null);
    assert.equal(row.ecriture_autorisee, false);
    assert.equal(row.rapport.phase, 'queued');
  }
});

test('la cible, le volet et la politique ne peuvent pas être substitués', () => {
  for (const payload of [null, [], { ...demande, target_id: 'autre' }, { ...demande, mode: 'security' },
    { ...demande, cible: 'http://127.0.0.1' }, { ...demande, ecriture_autorisee: true },
    { ...demande, instruction: 42 }, { ...demande, instruction: 'x'.repeat(2001) }]) {
    assert.throws(() => validerMission(payload));
  }
  assert.equal(cibleReelle('https://peer-review-black.vercel.app.:443/etudiant'), true);
});

test('un scénario partagé exige une cible réellement autorisée', () => {
  for (const targetId of ['peer-review', 'eugenia-public']) {
    const result = validerMission({ schema_version: 2, mode: 'security', target_id: targetId, scenario_id: 'S-GEN-DISCOVERY-01' });
    assert.equal(result.target.id, targetId);
    assert.equal(result.request.target_id, targetId);
    assert.equal(result.scenario.target_id, targetId);
  }
  assert.throws(() => validerMission({ schema_version: 2, mode: 'security', target_id: 'paie-express', scenario_id: 'S-GEN-DISCOVERY-01' }));
});

test('le score du scanner sépare failles uniques, configuration et alertes', () => {
  const row = { id: 'scan', cree_le: '2026-11-19T00:00:00Z', ...ligneMission({ schema_version: 2, mode: 'security', target_id: 'peer-review', scenario_id: 'S-GEN-DISCOVERY-01' }) };
  row.rapport = { ...row.rapport, phase: 'completed', summary: { passed: 8, failed: 12, inconclusive: 15, skipped: 0 },
    security_findings: { demonstrated_unique: 2, configuration_weakness_assertions: 10, tool_candidates: 15 }, results: [] };
  assert.equal(normaliserMission(row, {}).score.prouvees, 2);
});

test('une demande en file ne devient pas un faux rapport de sécurité', () => {
  const row = { id: 'test', cree_le: '2026-11-18T00:00:00Z', ...ligneMission(demande) };
  const normal = normaliserMission(row, {});
  assert.equal(normal.score, null);
  assert.equal(normal.mode, 'qa');
  row.rapport = { ...row.rapport, phase: 'completed', summary: { passed: 0, failed: 1, inconclusive: 0, skipped: 0 }, results: [] };
  assert.equal(normaliserMission(row, {}).score.prouvees, 0); // échec QA ≠ faille
});

test('accès opérateur fermé en production sans configuration, et authentifié sinon', () => {
  const request = (url, headers) => new Request(url, { headers });
  assert.equal(autoriseOperateur(request('https://demo.example'), { NODE_ENV: 'production' }), false);
  assert.equal(autoriseOperateur(request('http://127.0.0.1:3100'), { NODE_ENV: 'development' }), true);
  assert.equal(autoriseOperateur(request('http://demo.example'), { NODE_ENV: 'development' }), false);
  const env = { NODE_ENV: 'production', HSENTINEL_OPERATOR_TOKEN: 'synthetic-test-token' };
  assert.equal(autoriseOperateur(request('https://demo.example'), env), false);
  assert.equal(autoriseOperateur(request('https://demo.example', { authorization: 'Basic ' + Buffer.from('equipe:synthetic-test-token').toString('base64') }), env), true);
  assert.equal(autoriseOperateur(request('https://demo.example', { authorization: 'Basic invalide' }), env), false);
});

test('POST depuis une autre origine ou sans origine refusé', () => {
  assert.equal(memeOrigine(new Request('http://127.0.0.1:3100/api/audits')), false);
  assert.equal(memeOrigine(new Request('http://127.0.0.1:3100/api/audits', { headers: { origin: 'https://autre.example' } })), false);
  assert.equal(memeOrigine(new Request('http://127.0.0.1:3100/api/audits', { headers: { origin: 'http://127.0.0.1:3100' } })), true);
  // Next en développement : request.url dit « localhost », le navigateur a appelé 127.0.0.1 (403 sur toute écriture, 18/11).
  const dev = (origin, extra = {}) => new Request('http://localhost:3100/api/qa/plan', { headers: { origin, host: '127.0.0.1:3100', ...extra } });
  assert.equal(memeOrigine(dev('http://127.0.0.1:3100')), true);
  assert.equal(memeOrigine(dev('http://127.0.0.1:3999')), false);  // un autre port est une autre origine
  assert.equal(memeOrigine(dev('https://autre.example')), false);
  assert.equal(memeOrigine(dev('null')), false);
  // Derrière un proxy (Vercel), l'hôte public arrive par X-Forwarded-Host.
  assert.equal(memeOrigine(dev('https://hsentinel.vercel.app', { 'x-forwarded-host': 'hsentinel.vercel.app' })), true);
});
