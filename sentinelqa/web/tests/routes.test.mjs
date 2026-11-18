// Exécuter les vraies routes Next dans un VM avec seulement l'accès Supabase remplacé.
// Aucun port, aucun serveur distant. Les sources et imports métier restent ceux du produit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import * as crypto from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'http://127.0.0.1:3100';
const id = '00000000-0000-4000-8000-000000000001';
const payload = { schema_version: 2, mode: 'qa', target_id: 'eugenia-public', scenario_id: 'Q-PUB-01', instruction: '' };

async function charger(relative, requete) {
  const context = vm.createContext({ Request, Response, URL, Buffer, process });
  const cache = new Map();
  const synthetic = (exports, name) => new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context, identifier: name });
  async function module(filename) {
    if (cache.has(filename)) return cache.get(filename);
    let loaded;
    if (filename.endsWith('/lib/supabase.js')) loaded = synthetic({ requete }, filename);
    else if (filename === 'node:crypto') loaded = synthetic(crypto, filename);
    else if (filename.endsWith('.json')) loaded = synthetic({ default: JSON.parse(await readFile(filename, 'utf8')) }, filename);
    else loaded = new vm.SourceTextModule(await readFile(filename, 'utf8'), { context, identifier: filename });
    cache.set(filename, loaded);
    await loaded.link((specifier, referencing) => {
      if (specifier.startsWith('node:')) return module(specifier);
      let next = path.resolve(path.dirname(referencing.identifier), specifier);
      if (!path.extname(next)) next += '.js';
      return module(next);
    });
    return loaded;
  }
  const entry = await module(path.resolve(root, relative));
  await entry.evaluate();
  return entry.namespace;
}

const request = (body, from = origin, suffix = '') => new Request(origin + '/api/audits' + suffix, {
  method: 'POST', headers: { Origin: from, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

test('API QA et pentest : contrat stocké, zéro compte et aucune écriture', async () => {
  const writes = [];
  const { POST } = await charger('app/api/audits/route.js', async (table, opts) => { writes.push(opts.corps); return [{ id }]; });
  for (const data of [payload, { ...payload, mode: 'security', target_id: 'peer-review', scenario_id: 'S-PEER-01' }]) {
    const response = await POST(request(data));
    assert.equal(response.status, 201);
    assert.equal((await response.json()).id, id);
    const row = writes.at(-1);
    assert.equal(row.ecriture_autorisee, false);
    assert.equal(row.comptes.length, 0);
    assert.equal(row.rapport.request.mode, data.mode);
  }
});

test('API : contournement du catalogue, ancien flux sur site réel et CSRF ne créent rien', async () => {
  let writes = 0;
  const { POST } = await charger('app/api/audits/route.js', async () => { writes++; return [{ id }]; });
  for (const body of [{ ...payload, ecriture_autorisee: true }, { ...payload, mode: 'security' },
    { cible: 'https://peer-review-black.vercel.app/etudiant' }, null]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  assert.equal((await POST(request(payload, 'https://evil.example'))).status, 403);
  assert.equal(writes, 0);
});

test('API : panne de file rend un statut explicite sans exposer l’erreur serveur', async () => {
  const { POST } = await charger('app/api/audits/route.js', async () => { throw new Error('synthetic-secret'); });
  const response = await POST(request(payload));
  assert.equal(response.status, 503);
  assert.ok(!(await response.text()).includes('synthetic-secret'));
});

test('arrêt en attente : événement et transition atomique vers non exécuté', async () => {
  const calls = [];
  const { POST } = await charger('app/api/audits/[id]/arret/route.js', async (url, opts) => {
    if (!opts) return [{ id, statut: 'en_attente', rapport: { schema_version: 2, request: { target_id: payload.target_id, scenario_id: payload.scenario_id, mode: payload.mode, instruction: '' } } }];
    calls.push({ url, ...opts }); return [];
  });
  assert.equal((await POST(request({}, origin, '/' + id + '/arret'), { params: Promise.resolve({ id }) })).status, 202);
  assert.equal(calls[0].corps.type, 'arret');
  assert.ok(calls[1].url.includes('statut=eq.en_attente'));
  assert.equal(calls[1].corps.rapport.results[0].status, 'skipped');
});

test('arrêt en cours : le runner conserve la responsabilité du rapport partiel', async () => {
  const calls = [];
  const { POST } = await charger('app/api/audits/[id]/arret/route.js', async (url, opts) => {
    if (!opts) return [{ id, statut: 'en_cours', rapport: { schema_version: 2 } }];
    calls.push(opts); return [];
  });
  assert.equal((await POST(request({}, origin, '/' + id + '/arret'), { params: Promise.resolve({ id }) })).status, 202);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].corps.type, 'arret');
});
