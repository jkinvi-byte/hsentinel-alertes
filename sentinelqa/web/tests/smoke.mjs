// Test navigateur local : Supabase simulé en mémoire, aucun compte ou service distant.
// npm run build, puis HSENTINEL_PLAYWRIGHT=/chemin/vers/playwright node tests/smoke.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { CATALOGUE } from '../lib/missions.js';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.HSENTINEL_PLAYWRIGHT || 'playwright');
const rows = [], events = [], browserErrors = [];
const token = 'synthetic-local-smoke-token';
const auth = 'Basic ' + Buffer.from('equipe:' + token).toString('base64');
const finish = (row, status = 'passed') => {
  const scenario = CATALOGUE.scenarios.find((s) => s.id === row.rapport.request.scenario_id);
  row.statut = 'termine';
  row.rapport = { ...row.rapport, phase: 'completed', scenario_title: scenario.title,
    started_at: row.cree_le, finished_at: row.cree_le, duration_s: 1, cost_h: null, human_minutes: null,
    summary: { passed: +(status === 'passed'), failed: 0, inconclusive: +(status === 'inconclusive'), skipped: 0 },
    results: [{ scenario_id: scenario.id, status, expected: scenario.expected,
      observed: status === 'passed' ? 'Résultat simulé pour le test local de l’interface.' : 'Arrêt demandé. Preuves conservées.',
      reason_code: status === 'passed' ? 'synthetic_test' : 'cancelled', limitations: scenario.limitations }],
    sessions: [], evidence: [],
  };
};

const api = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let body = '';
  for await (const c of req) body += c;
  const data = body ? JSON.parse(body) : null;
  let result = [];
  if (url.pathname === '/rest/v1/audits') {
    if (req.method === 'POST') {
      const id = '00000000-0000-4000-8000-' + String(rows.length + 1).padStart(12, '0');
      result = [{ id, cree_le: new Date().toISOString(), ...data }];
      rows.unshift(result[0]);
    } else {
      result = rows.filter((r) => !url.searchParams.get('id') || 'eq.' + r.id === url.searchParams.get('id'));
      if (req.method === 'PATCH') result.forEach((r) => Object.assign(r, data));
    }
  }
  if (url.pathname === '/rest/v1/evenements') {
    if (req.method === 'POST') {
      events.push({ ...data, id: events.length + 1, quand: new Date().toISOString() });
      if (data.type === 'arret') finish(rows.find((r) => r.id === data.audit_id), 'inconclusive');
    }
    result = events.filter((e) => 'eq.' + e.audit_id === url.searchParams.get('audit_id') && e.id > Number((url.searchParams.get('id') ?? 'gt.0').slice(3)));
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
});

await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve));
const portProbe = http.createServer();
await new Promise((resolve) => portProbe.listen(0, '127.0.0.1', resolve));
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const origin = 'http://127.0.0.1:' + port;
const root = fileURLToPath(new URL('../', import.meta.url));
let output = '';
const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '-p', String(port)], {
  cwd: root,
  env: { ...process.env, HSENTINEL_OPERATOR_TOKEN: token, SUPABASE_URL: 'http://127.0.0.1:' + api.address().port,
    SUPABASE_SECRET_KEY: 'synthetic-local-key', NEXT_TELEMETRY_DISABLED: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
app.stdout.on('data', (d) => { output += d; });
app.stderr.on('data', (d) => { output += d; });
let browser;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(origin)).status === 401) break; } catch {}
    if (app.exitCode != null) throw new Error(output);
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.equal((await fetch(origin + '/audits/nouveau')).status, 401);
  assert.equal((await fetch(origin + '/api/audits', { method: 'POST', headers: { Authorization: auth, Origin: 'https://evil.example' }, body: '{}' })).status, 403);
  assert.equal((await fetch(origin + '/api/audits', { method: 'POST', headers: { Authorization: auth, Origin: origin }, body: JSON.stringify({ schema_version: 2, mode: 'qa', target_id: 'unknown' }) })).status, 400);
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ httpCredentials: { username: 'equipe', password: token }, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', (e) => browserErrors.push(e.message));
  await page.goto(origin + '/audits/nouveau');
  await page.getByRole('heading', { name: 'Que voulez-vous vérifier ?' }).waitFor();
  assert.equal(await page.locator('input[type=password]:visible').count(), 0);
  await page.getByRole('button', { name: 'Lancer le QA', exact: true }).click();
  await page.waitForURL(/\/audits\/[0-9a-f-]+$/);
  assert.equal(rows[0].rapport.request.mode, 'qa');
  assert.deepEqual(rows[0].comptes, []);
  finish(rows[0]);
  await page.getByText('Conforme au scénario', { exact: true }).waitFor();
  await page.goto(origin + '/');
  await page.getByRole('heading', { name: 'Des parcours et des preuves.' }).waitFor();

  await page.goto(origin + '/audits/nouveau');
  await page.getByRole('button', { name: 'Pentest', exact: true }).click();
  await page.getByRole('button', { name: 'Lancer le Pentest', exact: true }).click();
  await page.waitForURL(/\/audits\/[0-9a-f-]+$/);
  assert.equal(rows[0].rapport.request.mode, 'security');
  rows[0].statut = 'en_cours';
  await page.getByRole('button', { name: 'Arrêter la mission' }).click();
  await page.getByText('Non concluant', { exact: true }).waitFor();
  assert.equal(events.filter((e) => e.type === 'arret').length, 1);

  await page.goto(origin + '/audits/nouveau');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'pas de débordement horizontal');
  await page.screenshot({ path: '/private/tmp/hsentinel-mission-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Pentest', exact: true }).click();
  await page.screenshot({ path: '/private/tmp/hsentinel-mission-desktop.png', fullPage: true });
  assert.deepEqual(browserErrors, []);
  console.log('Smoke navigateur OK : accès opérateur, refus API, QA, rapport, pentest, arrêt et affichage mobile. Supabase et résultats simulés.');
} finally {
  if (browser) await browser.close();
  if (app.exitCode == null) {
    const exited = once(app, 'exit');
    app.kill('SIGTERM');
    await exited;
  }
  await new Promise((resolve) => api.close(resolve));
}
