import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { createServer } from 'node:http'
import { constants, generateKeyPairSync, privateDecrypt } from 'node:crypto'
import { createSession } from '../../lib/operator-session.mjs'
import { normaliseMission } from '../../lib/mission-view.mjs'
import { bilanAlertes, ligneAlerte } from '../../../web/lib/alertes-format.mjs'
import { profilClient } from '../../../web/lib/applications-contrat.mjs'

const secret = 'synthetic-browser-test-access-token'
const externalServer = process.env.CONSOLE_TEST_URL
const baseURL = externalServer || 'http://127.0.0.1:3102'
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 3072 })
const runnerKey = { id: 123, jwk: publicKey.export({ format: 'jwk' }) }
const id = '11111111-1111-4111-8111-111111111111'
const plan = { titre: 'Recette UI · navigation', etapes: ['Ouvrir le menu Programmes', 'Ouvrir le Bachelor'], criteres: [
  { id: 'C1', type: 'page', description: 'La page du Bachelor est atteinte', valeur: '/programme/bachelor-ia-business' },
  { id: 'C2', type: 'texte', description: 'Le diplôme est affiché', valeur: 'Bac+3' },
], hors_perimetre: [], inconnues: [] }
const report = { schema_version: 3, phase: 'completed', titre: 'Recette UI · résultats fictifs', cost_h: null, cost_hf: null, duration_s: 14,
  results: [{ id: 'C1', description: 'Page atteinte', status: 'passed', observe: 'Observation de test.' },
    { id: 'C2', description: 'Texte à confirmer', status: 'inconclusive', observe: 'La citation reste à vérifier.' }], evidence: [], sessions: [] }

// Un dixième de seconde de silence, en WAV : ce que la voix Hugging Face rend dans la recette (D-51).
const SILENCE_WAV = (() => {
  const donnees = Buffer.alloc(1600), tete = Buffer.alloc(44)
  tete.write('RIFF', 0); tete.writeUInt32LE(36 + donnees.length, 4); tete.write('WAVE', 8); tete.write('fmt ', 12)
  tete.writeUInt32LE(16, 16); tete.writeUInt16LE(1, 20); tete.writeUInt16LE(1, 22); tete.writeUInt32LE(8000, 24)
  tete.writeUInt32LE(16000, 28); tete.writeUInt16LE(2, 32); tete.writeUInt16LE(16, 34); tete.write('data', 36); tete.writeUInt32LE(donnees.length, 40)
  return Buffer.concat([tete, donnees])
})()

async function loginCookie(page: Page) {
  await page.context().addCookies([{ name: 'hs_operator_session', value: createSession(secret), url: baseURL, httpOnly: true, sameSite: 'Lax' }])
}
async function fixtures(page: Page) {
  const calls = { starts: [] as any[], plans: [] as any[], stops: 0, transcriptions: 0, failed: false, running: false,
    keys: 0, keyAvailable: true, alertsFailed: false, expert: [] as any[], voix: [] as any[], voixEnPanne: false,
    reponseExpert: 'Réponse synthétique de l’expert.', transcription: 'Vérifie le Bachelor et son diplôme.',
    ajouts: [] as any[], verifications: 0, comptes: [] as any[], actionExpert: null as null | Record<string, unknown>,
    lancementExpert: null as null | 'direct' | 'studio', pilotageExpert: 'guide' as 'guide' | 'exploration' }
  await page.route('**/api/console/**', async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname
    const response = (body: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (path === '/api/console/cle-runner') { calls.keys++; return response(calls.keyAvailable ? runnerKey : null) }
    if (path === '/api/console/alertes') {
      if (calls.alertsFailed) return response({ erreur: 'Alertes momentanément indisponibles.' }, 503)
      const application = url.searchParams.get('application') || null
      const rows = [
        { id: 'demo-1', application_id: 'eugenia-public', gravite: 'critique', alerte_statut: 'traitee', github_issue_number: 7, email_envoye: true },
        { id: 'demo-2', application_id: 'peer-review', gravite: 'moyenne', alerte_statut: 'echec', github_issue_number: null, email_envoye: false },
      ].filter(r => !application || r.application_id === application).map(r => ligneAlerte({ ...r, audit_id: id, cree_le: '2026-11-18T18:00:00Z',
        methode: 'GET', chemin: '/ressource-synthetique', theme: 'lecture', raisons: ['Constat fictif pour la recette de l’interface.'] }))
      return response({ application, limite: 50, alertes: rows, bilan: bilanAlertes(rows), applications: [{ id: 'eugenia-public', nom: 'Eugenia' }, { id: 'peer-review', nom: 'Peer Review' }] })
    }
    if (path === '/api/console/plan') { calls.plans.push(request.postDataJSON()); return response({ plan }) }
    if (path === '/api/console/expert/voix') {
      calls.voix.push(request.postDataJSON())
      if (calls.voixEnPanne) return response({ erreur: 'La voix est momentanément indisponible.' }, 503)
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: SILENCE_WAV })
    }
    if (path === '/api/console/expert') {
      calls.expert.push(request.postDataJSON())
      return response({ reponse: calls.reponseExpert, consigne_proposee: calls.actionExpert ? null : 'Ouvrir le menu « Programmes », puis vérifier le texte « Bac+3 ».',
        action: calls.actionExpert, lancement: calls.actionExpert ? null : calls.lancementExpert, pilotage: calls.pilotageExpert, fiches: ['consigne'], modele: 'fixture', latence_s: 0.1 })
    }
    if (path === '/api/console/transcription') {
      calls.transcriptions++; await new Promise(resolve => setTimeout(resolve, 350))
      return response({ texte: calls.transcription, latence_s: .35, modele: 'fixture' })
    }
    // D-56 : l'assistant « Ajouter une application ». La première vérification échoue, la seconde passe.
    if (path === '/api/console/applications' && request.method() === 'POST') {
      calls.ajouts.push(request.postDataJSON())
      return response({ application: { ...APP_AJOUTEE, verifiee_le: null, autorisee: false, comptes: [] } }, 201)
    }
    if (path === `/api/console/applications/${APP_AJOUTEE.id}/verification`) {
      calls.verifications++
      return response(calls.verifications === 1
        ? { verifiee: false, fichier: 404, page: 200, raison: 'Jeton introuvable : /.well-known/hsentinel-verification.txt répond HTTP 404, et la page d’accueil n’a pas la balise.' }
        : { verifiee: true, methode: 'fichier', verifiee_le: '2026-11-20T08:00:00Z' })
    }
    if (path === `/api/console/applications/${APP_AJOUTEE.id}/comptes` && request.method() === 'POST') {
      const corps = request.postDataJSON()
      calls.comptes.push(corps)
      return response({ compte: { id: COMPTE_AJOUTE, application_id: APP_AJOUTEE.id, libelle: corps.libelle, identifiant: corps.identifiant, identite: corps.identite, cree_le: '2026-11-20T08:01:00Z', utilise_le: null } }, 201)
    }
    if (path === '/api/console/missions' && request.method() === 'POST') { calls.starts.push(request.postDataJSON()); return response({ id, module: request.postDataJSON().mode === 'qa' ? 'qa' : 'pentest' }, 201) }
    if (path.endsWith('/arret')) { calls.stops++; calls.running = false; return response({ demande: true }, 202) }
    if (path.endsWith(id)) {
      const running = calls.running
      const connectedReport = calls.starts.some(m => m.compte) ? { ...report, interruption: 'forbidden_page', results: [
        { id: 'K1', type: 'connexion', description: 'Connexion du compte', status: 'passed', observe: 'Connexion synthétique.' },
        { id: 'K2', type: 'identite', description: 'Identité du compte', status: 'passed', observe: 'Identité synthétique vérifiée.' },
        { id: 'C1', type: 'texte', description: 'Titre attendu', status: 'inconclusive', reason_code: 'h_text_partial', observe: 'Texte synthétique partiel.' },
      ] } : report
      const mission = normaliseMission({ id, statut: running ? 'en_cours' : 'termine', cible: 'example.invalid', rapport: connectedReport }, path.includes('/pentest/') ? 'pentest' : 'qa')
      return response({ mission, events: [{ id: 1, quand: '2026-11-18T18:00:00Z', type: 'info', message: 'Événement de test.' }] })
    }
    if (/\/missions\/(qa|pentest)$/.test(path)) return calls.failed ? response({ erreur: 'Service temporairement indisponible.' }, 503) : response({ missions: [] })
    return route.abort()
  })
  return calls
}

test.describe('Accès en production', () => {
  test.skip(Boolean(externalServer), 'Ces contrôles demandent le serveur de production isolé, avec sa clé synthétique.')

test('Les routes réelles refusent une session absente ou la session simulée historique', async ({ request }) => {
  const noSession = await request.get('/api/console/catalogue')
  expect(noSession.status()).toBe(401)
  const demoSession = await request.get('/api/console/catalogue', { headers: { cookie: 'hs_session=demo' } })
  expect(demoSession.status()).toBe(401)
  const signed = `hs_operator_session=${createSession(secret)}`
  expect((await request.get('/api/console/catalogue', { headers: { cookie: signed } })).status()).toBe(200)
  expect((await request.get('/api/console/cle-runner')).status()).toBe(401)
  expect((await request.post('/api/console/expert', { data: { volet: 'qa', cible: 'eugenia-public', question: 'test' } })).status()).toBe(401)
  expect((await request.post('/api/console/expert/voix', { data: { texte: 'test' } })).status()).toBe(401)
  expect((await request.get('/api/console/alertes')).status()).toBe(401)
  expect((await request.get('/api/console/alertes?limite=0', { headers: { cookie: signed } })).status()).toBe(400)
  const blocked = await request.post('/api/console/missions', { headers: { cookie: signed, origin: 'http://127.0.0.1:3102' }, data: { schema_version: 2, mode: 'security', target_id: 'peer-review', scenario_id: 'S-GEN-ACTIVE-01' } })
  expect(blocked.status()).toBe(400)
  expect((await request.post('/api/console/missions', { headers: { cookie: signed, origin: 'https://elsewhere.example' }, data: {} })).status()).toBe(403)
})

test('L’API enfile réellement un pentest libre sur une application vérifiée', async ({ request }) => {
  const avant = TABLES.applications
  const targetId = 'ardoise-demo-vercel-app'
  const origine = 'https://ardoise-demo.vercel.app'
  TABLES.applications = [{ id: targetId, nom: 'Ardoise', origine, autorisee: true, verifiee_le: '2026-11-20T08:00:00Z',
    ajoutee_console: true, retiree_le: null, profil_qa: profilClient({ id: targetId, nom: 'Ardoise', origine }) }]
  try {
    const reponse = await request.post('/api/console/missions', {
      headers: { cookie: `hs_operator_session=${createSession(secret)}`, origin: baseURL },
      data: { schema_version: 2, mode: 'security', target_id: targetId, scenario_id: 'S-GEN-DISCOVERY-01', instruction: '' },
    })
    expect(reponse.status()).toBe(201)
    expect(recues.audits).toHaveLength(1)
    expect(recues.audits[0]).toMatchObject({ statut: 'en_attente', application: 'Ardoise', cible: `${origine}/`,
      ecriture_autorisee: false, secrets_chiffres: null, comptes: [] })
    expect(recues.audits[0].rapport.request).toMatchObject({ target_id: targetId, scenario_id: 'S-GEN-DISCOVERY-01', mode: 'security' })
  } finally {
    TABLES.applications = avant
  }
})

test('Connexion opérateur : un faux code est refusé', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Code d’accès de l’équipe').fill('not-the-token')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Ce code d’accès n’est pas reconnu.' })).toHaveText('Ce code d’accès n’est pas reconnu.')
})

})

// D-49 : les pages de la console v0 lisent la base côté serveur. Une fausse base PostgREST sert des lignes synthétiques,
// une base vide ou une panne, selon le mode choisi par chaque test.
let modeBase: 'donnees' | 'vide' | 'panne' = 'donnees'
// D-56 : une application ajoutée et vérifiée, avec un compte de test enregistré ; servie seulement aux tests qui la demandent.
let avecAjoutees = false
const COMPTE_AJOUTE = '22222222-2222-4222-8222-222222222222'
const APP_AJOUTEE = { id: 'ardoise-demo-vercel-app', nom: 'Ardoise', origine: 'https://ardoise-demo.vercel.app', autorisee: true, ajoutee_console: true, retiree_le: null,
  profil_qa: { entree: 'https://ardoise-demo.vercel.app/connexion', connexion: { chemin: '/connexion' } }, attestee_le: '2026-11-20T07:58:00Z',
  verification_jeton: 'hsv-0123456789abcdefghijklmnopqrstuv', verification_methode: 'fichier', verifiee_le: '2026-11-20T08:00:00Z', cree_le: '2026-11-20T07:58:00Z' }
const COMPTES_AJOUTES = [{ id: COMPTE_AJOUTE, application_id: APP_AJOUTEE.id, libelle: 'Compte A · gérante', identifiant: 'camille@ardoise.test', identite: ['Camille Martin'], cree_le: '2026-11-20T08:01:00Z', utilise_le: null }]
const ici = Date.now(), ilYa = (minutes: number) => new Date(ici - minutes * 60000).toISOString()
const AUDIT_BANC = '22222222-2222-4222-8222-222222222222', MISSION_QA = '33333333-3333-4333-8333-333333333333'
const CONSTAT_LECTURE = '44444444-4444-4444-8444-444444444444', CONSTAT_ADMIN = '55555555-5555-4555-8555-555555555555'
const TABLES: Record<string, unknown[]> = {
  applications: [
    { id: 'paie-express', nom: 'Paie Express', origine: 'http://localhost:3000', observation_active: false, observee_le: null, mise_a_jour_le: null },
    { id: 'eugenia-public', nom: 'Eugenia School', origine: 'https://www.eugeniaschool.com', observation_active: true, observee_le: ilYa(5), mise_a_jour_le: null },
    { id: 'blackbox-local', nom: 'Banc local', origine: 'http://127.0.0.1:8765', observation_active: false, observee_le: null, mise_a_jour_le: null },
  ],
  audits: [{ id: AUDIT_BANC, cree_le: ilYa(60), statut: 'termine', application: 'Paie Express', cible: 'https://hsentinel-banc.vercel.app/', erreur: null,
    rapport: { schema_version: 2, phase: 'completed', scenario_title: 'Tests IDOR sur le banc (synthétique)', duration_s: 300, cost_h: 0.2, cost_hf: 0.0004,
      request: { mode: 'security', scenario_id: 'S-BANC-01', target_id: 'paie-express' },
      results: [{ id: 'F1', type: 'lecture', status: 'failed', observed: 'Prouvée (synthétique).' }, { id: 'F5', type: 'admin', status: 'failed', observed: 'Prouvée (synthétique).' },
        { id: 'C1', type: 'lecture', status: 'passed', observed: 'Contrôle sain (synthétique).' }],
      banc: { pages: { A: ['/fiches-de-paie/1', '/administration'], C: ['/tableau-de-bord'] }, score: { total: 6, detectees: 2, faux_positifs: 0 },
        sessions: [{ role: 'Compte A', cible: 'cartographie', duree_s: 100 }, { role: 'Compte B', cible: '/fiches-de-paie/1', duree_s: 40 }],
        rejeux: [{ chemin: '/fiches-de-paie/1', theme: 'lecture', http: 200, http_a: 200, similarite: 1, suspicion: true, donnees: ['salaires'] }],
        preuves: [{ chemin: '/fiches-de-paie/1' }, { chemin: '/administration' }] } } }],
  qa_missions: [{ id: MISSION_QA, cree_le: ilYa(30), statut: 'termine', cible: 'eugenia-public', erreur: null, arret_demande: false,
    demande: { mode: 'qa', pilotage: 'exploration', instruction: 'Explorer le site (synthétique)', source: 'texte' },
    rapport: { schema_version: 3, phase: 'completed', titre: 'Exploration synthétique', duration_s: 30, cost_h: 0.012, cost_hf: null,
      summary: { passed: 1, failed: 0, inconclusive: 1, skipped: 0 }, scope_snapshot: { origine: 'https://www.eugeniaschool.com' },
      visites: [{ chemin: '/', titre: 'Accueil', geste: null }], parcours: [], sessions: [{ duree_s: 27 }],
      results: [{ id: 'P1', description: 'Page / (synthétique)', status: 'passed', observe: 'HTTP 200.' }, { id: 'P2', description: 'Titre attendu', status: 'inconclusive', observe: 'Texte tronqué.' }] } }],
  constats: [
    { id: CONSTAT_LECTURE, cree_le: ilYa(58), application_id: 'paie-express', audit_id: AUDIT_BANC, audit_le: ilYa(58), theme: 'lecture', methode: 'GET', chemin: '/fiches-de-paie/1',
      gravite: 'critique', donnees: ['salaires'], raisons: ['Une autre entreprise lit des salaires (synthétique)'], critere: null, similarite: 1, seuil: 0.9, confirme_ecran: true,
      session_h: 'session-synthetique', piste: 'Vérifier l’entreprise propriétaire (synthétique).', empreinte: 'e-lecture', alerte_statut: 'traitee', github_issue_number: 15, email_envoye: true, alerte_traitee_le: ilYa(57) },
    { id: CONSTAT_ADMIN, cree_le: ilYa(58), application_id: 'paie-express', audit_id: AUDIT_BANC, audit_le: ilYa(58), theme: 'admin', methode: 'GET', chemin: '/administration',
      gravite: 'élevée', donnees: [], raisons: ['Un salarié entre dans l’administration (synthétique)'], critere: null, similarite: 1, seuil: 0.9, confirme_ecran: true,
      session_h: null, piste: null, empreinte: 'e-admin', alerte_statut: 'echec', github_issue_number: null, email_envoye: false, alerte_traitee_le: null },
  ],
}
// Les écritures reçues (demandes d'accès et de démo, D-50), table par table.
const recues: Record<string, any[]> = {}
const fausseBase = createServer((req, res) => {
  const table = new URL(req.url ?? '/', 'http://base').pathname.replace('/rest/v1/', '')
  if (modeBase === 'panne') { res.writeHead(503).end('{}'); return }
  if (req.method === 'POST') {
    let corps = ''
    req.on('data', (morceau) => { corps += morceau })
    req.on('end', () => {
      ;(recues[table] ??= []).push(JSON.parse(corps || '{}'))
      res.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify([{ id: 'synthetique' }]))
    })
    return
  }
  // Les seuls filtres que la base simule : ceux des applications ajoutées (D-56). Les autres requêtes reçoivent toute la table.
  const params = new URL(req.url ?? '/', 'http://base').searchParams
  let lignes = modeBase === 'vide' ? [] : [...(TABLES[table] ?? []), ...(avecAjoutees && table === 'applications' ? [APP_AJOUTEE] : []),
    ...(avecAjoutees && table === 'comptes_test' ? COMPTES_AJOUTES : [])] as Record<string, unknown>[]
  if (params.get('ajoutee_console') === 'eq.true') lignes = lignes.filter(l => l.ajoutee_console === true)
  if (params.get('retiree_le') === 'is.null') lignes = lignes.filter(l => l.retiree_le == null)
  res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(lignes))
})
test.beforeAll(async () => { await new Promise<void>(resolve => fausseBase.listen(3199, '127.0.0.1', resolve)) })
test.afterAll(async () => { await new Promise(resolve => fausseBase.close(resolve)) })
test.beforeEach(() => { modeBase = 'donnees'; avecAjoutees = false; for (const t of Object.keys(recues)) delete recues[t] })

test('Console v0 : chaque page montre les données de la base, sans chiffre inventé', async ({ page }) => {
  await loginCookie(page)
  await page.goto('/app')
  await expect(page.getByRole('heading', { name: 'Un regard neuf sur vos applications.' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Résultats\s*2/ })).toBeVisible()
  // D-55 : plus aucun dollar dans les indicateurs ni dans la barre latérale ; ils restent dans « Offre et utilisation ».
  await expect(page.locator('.lv-indicateurs, #app-sidebar').getByText(/\$/)).toHaveCount(0)
  await expect(page.getByText('Exploration synthétique').first()).toBeVisible()

  await page.goto('/app/audits')
  await expect(page.getByRole('heading', { name: 'Tests IDOR sur le banc (synthétique)' })).toBeVisible()
  await expect(page.getByText('Matrice action × compte')).toBeVisible()
  await expect(page.getByText('FAILLE', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('2/6', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Ticket GitHub\s*#15/ })).toHaveAttribute('href', 'https://github.com/jkinvi-byte/hsentinel-alertes/issues/15')
  await page.getByRole('tab', { name: /QA/ }).click()
  await expect(page.getByRole('heading', { name: 'Exploration synthétique' })).toBeVisible()
  await expect(page.getByText('Aucun écart prouvé ; 1 critère à confirmer.')).toBeVisible()

  await page.goto('/app/diagnostic')
  await expect(page.getByText('2 failles sur 2')).toBeVisible()
  await page.getByRole('link', { name: /Une autre entreprise peut lire GET \/fiches-de-paie\/1/ }).click()
  await expect(page).toHaveURL(new RegExp(`/app/diagnostic/${CONSTAT_LECTURE}`))
  await expect(page.getByRole('link', { name: /Ticket GitHub #15/ })).toHaveAttribute('href', 'https://github.com/jkinvi-byte/hsentinel-alertes/issues/15')
  await expect(page.getByText('Alerte envoyée', { exact: true })).toBeVisible()
  await expect(page.getByText('https://hsentinel-banc.vercel.app', { exact: true })).toBeVisible()
  await page.goto(`/app/diagnostic/${CONSTAT_ADMIN}`)
  await expect(page.getByText('Alerte en échec · reprise toutes les 15 min')).toBeVisible()
  await expect(page.getByRole('link', { name: /Ticket GitHub/ })).toHaveCount(0)

  await page.goto('/app/applications')
  await expect(page.getByRole('heading', { name: 'Paie Express' })).toBeVisible()
  await expect(page.getByText('Banc local')).toHaveCount(0)
  await page.locator('li.lv-app', { has: page.getByRole('heading', { name: 'Paie Express' }) }).getByRole('button', { name: 'Détails' }).click()
  await expect(page.getByText('S-BANC-01')).toBeVisible()

  await page.goto('/app/facturation')
  await expect(page.getByText('Aucun paiement n’est branché.', { exact: false })).toBeVisible()
  await page.goto('/app/compte')
  await expect(page.getByText('Aucune offre souscrite')).toBeVisible()

  // À 390 px, aucune page ne déborde en largeur.
  await page.setViewportSize({ width: 390, height: 844 })
  await mkdir('test-results/apercus', { recursive: true })
  for (const chemin of ['/app', '/app/audits', '/app/diagnostic', `/app/diagnostic/${CONSTAT_LECTURE}`, '/app/applications', '/app/facturation', '/app/compte']) {
    await page.goto(chemin)
    // Sur téléphone, la navigation est un tiroir fermé, hors de l'écran (D-55).
    await expect(page.locator('#app-sidebar')).toHaveAttribute('data-ouverte', 'false')
    // En cas d'échec, le message nomme les éléments qui dépassent : la page et sa cause d'un coup d'œil.
    const debordent = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth ? [] : [...document.querySelectorAll('body *')]
      .filter((e) => {
        const w = window.innerWidth + 1
        if (e.getBoundingClientRect().right <= w || (e.parentElement?.getBoundingClientRect().right ?? 0) > w) return false
        // Un débordement rogné par un parent (overflow hidden ou auto) ne fait pas défiler la page.
        for (let a = e.parentElement; a; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible' && a.getBoundingClientRect().right <= w) return false
        return true
      })
      .slice(0, 5).map((e) => `${e.tagName}.${String(e.className).slice(0, 60)} → ${Math.round(e.getBoundingClientRect().right)}`))
    await page.screenshot({ path: `test-results/apercus/console${chemin.replace(/\//g, '-')}-390.png`, fullPage: true })
    expect(debordent, chemin).toEqual([])
  }
})

test('Base vide : chaque page le dit, sans planter', async ({ page }) => {
  modeBase = 'vide'; await loginCookie(page)
  await page.goto('/app')
  await expect(page.getByText('Aucune session navigateur pour l’instant : lancez un audit QA.')).toBeVisible()
  await page.goto('/app/audits')
  await expect(page.getByText('Aucune mission dans ce volet')).toBeVisible()
  await page.goto('/app/diagnostic')
  await expect(page.getByText('Aucune faille prouvée pour l’instant')).toBeVisible()
  await page.goto('/app/applications')
  await expect(page.getByText('Aucune application autorisée')).toBeVisible()
})

test('Base injoignable : message explicite, puis reprise par « Réessayer »', async ({ page }) => {
  modeBase = 'panne'; await loginCookie(page)
  await page.goto('/app/diagnostic')
  await expect(page.getByRole('alert').filter({ hasText: 'La base de la console ne répond pas pour l’instant.' })).toBeVisible()
  modeBase = 'donnees'
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('2 failles sur 2')).toBeVisible()
})

test('Demande d’accès : enregistrée sans mot de passe ; robot ignoré ; base en panne dite, sans faux succès', async ({ page }) => {
  await page.goto('/signup')
  await expect(page.getByRole('heading', { name: 'Demandez votre accès d’essai' })).toBeVisible()
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await page.getByLabel('Nom complet').fill('Camille Roux')
  await page.getByLabel('E-mail professionnel').fill('Camille@Exemple.fr')
  await page.getByLabel('Entreprise').fill('Paie Express')
  await page.getByRole('button', { name: 'Demander mon accès' }).click()
  await expect(page.getByText('Demande enregistrée.')).toBeVisible()
  expect(recues.demandes_acces).toEqual([{ type: 'acces', nom: 'Camille Roux', email: 'camille@exemple.fr', entreprise: 'Paie Express', taille: null, message: null }])

  // Un robot remplit le champ caché : on lui répond comme à un humain, sans rien enregistrer.
  await page.goto('/signup')
  await page.getByLabel('Nom complet').fill('Robot')
  await page.getByLabel('E-mail professionnel').fill('robot@exemple.fr')
  await page.getByLabel('Entreprise').fill('Spam')
  await page.locator('input[name="site"]').evaluate((e: HTMLInputElement) => { e.value = 'https://spam.example' })
  await page.getByRole('button', { name: 'Demander mon accès' }).click()
  await expect(page.getByText('Demande enregistrée.')).toBeVisible()
  expect(recues.demandes_acces).toHaveLength(1)

  modeBase = 'panne'
  await page.goto('/signup')
  await page.getByLabel('Nom complet').fill('Camille Roux')
  await page.getByLabel('E-mail professionnel').fill('camille@exemple.fr')
  await page.getByLabel('Entreprise').fill('Paie Express')
  await page.getByRole('button', { name: 'Demander mon accès' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Votre demande n’a pas pu être enregistrée.' })).toBeVisible()
  await expect(page.getByText('Demande enregistrée.')).toHaveCount(0)
})

test('Demande de démo : vraiment enregistrée avant « Demande reçue »', async ({ page }) => {
  await page.goto('/demo')
  await page.getByLabel('Nom complet').fill('Alex Martin')
  await page.getByLabel('E-mail professionnel').fill('alex@exemple.fr')
  await page.getByLabel('Entreprise').fill('Bêta Logistique')
  await page.getByLabel('Taille de l’équipe').selectOption('10-50')
  await page.getByRole('button', { name: 'Demander ma démo' }).click()
  await expect(page.getByText('Demande reçue.')).toBeVisible()
  expect(recues.demandes_acces).toEqual([{ type: 'demo', nom: 'Alex Martin', email: 'alex@exemple.fr', entreprise: 'Bêta Logistique', taille: '10-50', message: null }])
})

test('Les anciennes adresses mènent aux pages de la console v0', async ({ page }) => {
  await loginCookie(page)
  await page.goto('/app/alertes')
  await expect(page).toHaveURL(/\/app\/diagnostic$/)
  await page.goto('/app/cibles')
  await expect(page).toHaveURL(/\/app\/applications$/)
})

test('Parcours QA : plan périmé bloqué, lancement unique et résultats non concluants', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Paramétrer manuellement' }).click()
  const instruction = page.getByLabel('Votre consigne')
  await instruction.fill('Vérifie le Bachelor.')
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeDisabled()
  await page.getByRole('button', { name: 'Préparer le plan' }).click()
  await expect(page.getByRole('heading', { name: plan.titre })).toBeVisible()
  await instruction.fill('Vérifie le Bachelor et le diplôme.')
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeDisabled()
  await page.getByRole('button', { name: 'Préparer de nouveau' }).click()
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeEnabled()
  await page.getByRole('button', { name: 'Lancer la mission' }).click({ clickCount: 2 })
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}`))
  await expect(page.getByText('Non concluant', { exact: true })).toBeVisible()
  expect(calls.starts).toHaveLength(1)
  expect(calls.starts[0].schema_version).toBe(3)
  expect(calls.starts[0].source).toBe('texte')
  await expect(page.getByText('Non mesuré', { exact: true })).toHaveCount(2)
  await mkdir('test-results/apercus', { recursive: true })
  await page.screenshot({ path: 'test-results/apercus/rapport-ordinateur.png', fullPage: true })
})

test('Pentest : scénarios disponibles, contrôles actifs réservés au laboratoire désactivés', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau?volet=pentest')
  // S-PEER-02 se lance depuis la console depuis que Kimi l'a intégré ; le scan actif reste réservé au laboratoire.
  await expect(page.getByRole('option', { name: /ressource d’un autre étudiant/ })).toBeEnabled()
  await expect(page.getByRole('option', { name: /contrôles actifs explicitement autorisés/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(page).toHaveURL(new RegExp(`/app/missions/pentest/${id}`))
  expect(calls.starts[0].mode).toBe('security')
  expect(calls.starts[0].scenario_id).toBe('S-PEER-01')
})

test('Pentest libre : une application vérifiée se lance depuis le studio en consultation seule', async ({ page }) => {
  const avant = TABLES.applications
  const cibleId = 'ardoise-demo-vercel-app'
  const origine = 'https://ardoise-demo.vercel.app'
  TABLES.applications = [...avant, {
    id: cibleId, nom: 'Ardoise', origine, autorisee: true, verifiee_le: '2026-11-20T08:00:00Z', ajoutee_console: true,
    profil_qa: {
      id: cibleId, nom: 'Ardoise', origine, client: true, entree: `${origine}/accueil`, consultation_seule: true,
      autorisation: 'Contrôle du site prouvé par le jeton publié', chemins_exclus: ['/api', '/deconnexion'], interdits: [],
      limites: { guide: { max_steps: 30, max_time_s: 300 }, exploration: { max_steps: 40, max_time_s: 420, max_pages: 6 },
        lectures_http: 30, octets_par_lecture: 3_000_000 },
    },
  }]
  try {
    await loginCookie(page); const calls = await fixtures(page)
    await page.goto(`/app/nouveau?volet=pentest&cible=${cibleId}`)
    await expect(page.getByRole('combobox', { name: 'Contrôle' })).toHaveValue('S-GEN-DISCOVERY-01')
    await expect(page.getByRole('combobox', { name: 'Application autorisée' })).toHaveValue(cibleId)
    await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeEnabled()
    await page.getByRole('button', { name: 'Lancer la mission' }).click()
    await expect(page).toHaveURL(new RegExp(`/app/missions/pentest/${id}`))
    expect(calls.starts).toHaveLength(1)
    expect(calls.starts[0]).toMatchObject({ schema_version: 2, mode: 'security', target_id: cibleId,
      scenario_id: 'S-GEN-DISCOVERY-01', instruction: '' })
    expect(calls.starts[0].compte).toBeUndefined()
    expect(calls.starts[0].ecriture_autorisee).toBeUndefined()
  } finally {
    TABLES.applications = avant
  }
})

test('Expert du studio : la voix d’abord, l’écrit à côté, consigne reprise sur demande, Entrée ne lance rien, un seul micro', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __lu: string[] }
    w.__lu = []
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => { w.__lu.push(u.text) }
  })
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau')
  await expect(page.getByRole('heading', { name: /Que souhaitez-vous vérifier/ })).toBeVisible()
  // D-55 : une seule entrée micro, la conversation ; ni dictée ni second micro dans le panneau.
  await expect(page.getByRole('button', { name: 'Parler à l’expert' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Dicter la consigne' })).toHaveCount(0)
  // Les paramètres manuels restent fermés tant qu'on ne les demande pas.
  await expect(page.getByLabel('Votre consigne')).toHaveCount(0)
  await page.getByRole('button', { name: 'Écrire à l’expert' }).click()
  await page.getByLabel('Votre question à l’expert').fill('Comment formuler ma consigne ?')
  await page.getByLabel('Votre question à l’expert').press('Enter')
  await expect(page.getByText('Réponse synthétique de l’expert.')).toBeVisible()
  expect(calls.starts).toHaveLength(0)
  expect(calls.expert[0]).toMatchObject({ volet: 'qa', question: 'Comment formuler ma consigne ?', historique: [] })
  // La réponse est lue par la voix Hugging Face ; la voix du système n'est pas sollicitée.
  await expect.poll(() => calls.voix.length).toBe(1)
  expect(calls.voix[0]).toEqual({ texte: 'Réponse synthétique de l’expert.' })
  expect(await page.evaluate(() => (window as unknown as { __lu: string[] }).__lu)).toEqual([])
  // La consigne proposée ouvre les paramètres manuels, déjà remplis.
  await page.getByRole('button', { name: 'Reprendre dans la consigne' }).click()
  await expect(page.getByLabel('Votre consigne')).toHaveValue('Ouvrir le menu « Programmes », puis vérifier le texte « Bac+3 ».')

  // Voix Hugging Face en panne : la voix du système, réglée comme celle de LEVELS, lit la réponse.
  calls.voixEnPanne = true
  await page.getByLabel('Votre question à l’expert').fill('Et pour le diplôme ?')
  await page.getByLabel('Votre question à l’expert').press('Enter')
  await expect.poll(() => calls.expert.length).toBe(2)
  await expect.poll(() => page.evaluate(() => (window as unknown as { __lu: string[] }).__lu)).toEqual(['Réponse synthétique de l’expert.'])
  expect(calls.starts).toHaveLength(0)

  await page.goto('/app/nouveau?volet=pentest')
  await expect(page.getByRole('heading', { name: /Que souhaitez-vous contrôler/ })).toBeVisible()
})

test('Mode conversation : l’expert parle le premier, puis répond à la phrase dite, mot à mot en voix Hugging Face, et l’écoute reprend seule', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  calls.reponseExpert = 'Première phrase de l’expert. Seconde phrase, avec « Bac+3 ».'
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await expect(dialogue).toBeVisible()
  await expect(dialogue.getByText('Eugenia School', { exact: true })).toBeVisible()
  // Comme la Voix de LEVELS, l'expert ouvre la conversation, à voix haute, d'après la cible à l'écran.
  const accueil = 'Je suis l’expert QA. Nous préparons une mission sur Eugenia School. Que voulez-vous vérifier ?'
  await expect(dialogue.locator('.expert-tour-expert').first()).toContainText(accueil)
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute', { timeout: 10_000 })
  // L'accueil préchargé au survol n'est demandé qu'une fois, phrase par phrase.
  expect(calls.voix.map((v: { texte: string }) => v.texte)).toEqual(['Je suis l’expert QA.', 'Nous préparons une mission sur Eugenia School.', 'Que voulez-vous vérifier ?'])
  // Le micro synthétique émet des bips : la fin de phrase peut venir du silence ou du bouton.
  await dialogue.getByRole('button', { name: 'J’ai fini' }).click({ timeout: 3000 }).catch(() => {})
  await expect(dialogue.getByText('« Vérifie le Bachelor et son diplôme. »')).toBeVisible()
  await expect(dialogue.locator('.expert-tour-expert').last()).toContainText('Seconde phrase, avec « Bac+3 ».')
  // L'accueil est dans l'historique partagé : l'expert sait ce qu'il vient de dire.
  await expect.poll(() => calls.expert.length).toBe(1)
  expect(calls.expert[0].historique).toEqual([{ role: 'expert', texte: accueil }])
  await expect.poll(() => calls.voix.length).toBe(5)
  expect(calls.voix.slice(3).map((v: { texte: string }) => v.texte)).toEqual(['Première phrase de l’expert.', 'Seconde phrase, avec « Bac+3 ».'])
  // Mains libres : la réponse dite, tous ses mots sont écrits, et l'écoute reprend seule.
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute', { timeout: 10_000 })
  await expect(dialogue.locator('[data-direct]')).toHaveCount(0)
  // D-57 : choisir la consigne ferme la voix tout de suite.
  await dialogue.getByRole('button', { name: 'Reprendre dans la consigne' }).click()
  await expect(dialogue).toHaveCount(0)
  await expect(page.getByLabel('Votre consigne')).toHaveValue('Ouvrir le menu « Programmes », puis vérifier le texte « Bac+3 ».')
  // Le panneau garde toute la conversation, accueil compris ; rien n'a été lancé.
  await expect(page.getByText(accueil)).toBeVisible()
  await expect(page.getByText('Première phrase de l’expert. Seconde phrase, avec « Bac+3 ».').first()).toBeVisible()
  expect(calls.starts).toHaveLength(0)
})

test('Mode conversation : la voix Hugging Face en panne, la voix du système parle jusqu’au bout, sans retour à Kokoro', async ({ page }) => {
  // Une synthèse du système simulée qui parle vite : départ, puis fin de chaque phrase.
  await page.addInitScript(() => {
    const w = window as unknown as { __lu: string[] }
    w.__lu = []
    window.speechSynthesis.speak = (u: SpeechSynthesisUtterance) => {
      w.__lu.push(u.text)
      setTimeout(() => { u.onstart?.(new Event('start') as SpeechSynthesisEvent); setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 40) }, 10)
    }
  })
  await loginCookie(page); const calls = await fixtures(page)
  calls.voixEnPanne = true
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute', { timeout: 10_000 })
  await expect(dialogue.getByText(/voix du système/)).toBeVisible()
  const kokoro = calls.voix.length
  await dialogue.getByRole('button', { name: 'J’ai fini' }).click({ timeout: 3000 }).catch(() => {})
  await expect(dialogue.locator('.expert-tour-expert').last()).toContainText('Réponse synthétique de l’expert.')
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute', { timeout: 10_000 })
  // L'accueil puis la réponse ont été dits par la voix du système, et Kokoro n'a plus été sollicité.
  expect(await page.evaluate(() => (window as unknown as { __lu: string[] }).__lu)).toEqual(['Je suis l’expert QA.', 'Nous préparons une mission sur Eugenia School.', 'Que voulez-vous vérifier ?', 'Réponse synthétique de l’expert.'])
  expect(calls.voix.length).toBe(kokoro)
  await expect(dialogue.locator('[data-direct]')).toHaveCount(0)
})

test('Mode conversation : une transcription fantôme de Whisper ne déclenche aucune réponse', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  calls.transcription = 'Thank you.'
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute', { timeout: 10_000 })
  await dialogue.getByRole('button', { name: 'J’ai fini' }).click({ timeout: 3000 }).catch(() => {})
  await expect(dialogue.getByRole('alert')).toHaveText('Je n’ai rien entendu de clair. Reparlez, ou écrivez votre question.')
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute')
  expect(calls.expert).toHaveLength(0)
})

test('Conversation : maintenir « Parler » ouvre le micro pendant l’appui, et le relâché envoie la phrase', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await dialogue.getByRole('button', { name: /Mains libres/ }).click()
  // Selon le moment du clic, l'écoute a pu reprendre seule après l'accueil : on la clôt d'abord d'un appui bref.
  const statut = dialogue.getByRole('status')
  await expect(statut).toHaveText(/À vous|vous écoute/, { timeout: 10_000 })
  if ((await statut.textContent())?.includes('vous écoute')) await dialogue.getByRole('button', { name: 'J’ai fini' }).click()
  await expect(statut).toHaveText('À vous', { timeout: 10_000 })
  const avant = calls.transcriptions
  const parler = dialogue.getByRole('button', { name: 'Parler', exact: true })
  const boite = await parler.boundingBox()
  await page.mouse.move(boite!.x + boite!.width / 2, boite!.y + boite!.height / 2)
  await page.mouse.down()
  // Avant le correctif, rien ne se passait pendant l'appui : l'écoute ne partait qu'au relâché.
  await expect(dialogue.getByRole('status')).toHaveText('L’expert QA vous écoute')
  await expect(dialogue.getByRole('button', { name: 'Relâchez pour envoyer' })).toBeVisible()
  await page.waitForTimeout(700)
  await page.mouse.up()
  await expect.poll(() => calls.transcriptions).toBe(avant + 1)
  await expect(dialogue.getByText('« Vérifie le Bachelor et son diplôme. »').last()).toBeVisible()
  await expect(dialogue.locator('.expert-tour-expert').last()).toContainText('Réponse synthétique de l’expert.')
})

test('Le studio reste utilisable à 390 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginCookie(page); await fixtures(page)
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Paramétrer manuellement' }).click()
  await page.getByLabel('Votre consigne').fill('Vérifie le diplôme du Bachelor.')
  await page.getByRole('button', { name: 'Préparer le plan' }).click()
  await expect(page.getByRole('heading', { name: plan.titre })).toBeVisible()
  const width = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: window.innerWidth }))
  expect(width.content).toBeLessThanOrEqual(width.viewport)
  await mkdir('test-results/apercus', { recursive: true })
  await page.screenshot({ path: 'test-results/apercus/studio-mobile.png', fullPage: true })
})


test('Un arrêt demandé deux fois ne déclenche qu’une mutation', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page); calls.running = true
  await page.goto(`/app/missions/qa/${id}`)
  await page.getByRole('button', { name: 'Arrêter la mission', exact: true }).click({ clickCount: 2 })
  await expect(page.getByRole('button', { name: 'Arrêter la mission', exact: true })).toHaveCount(0)
  expect(calls.stops).toBe(1)
})

test('QA connecté : mot de passe chiffré, trois noms au plus, K1/K2 et motif d’arrêt visibles', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau?cible=peer-review')
  await expect(page.getByRole('combobox', { name: 'Application' })).toHaveValue('peer-review')
  await page.getByLabel('Adresse du compte de test').fill('test@example.invalid')
  const password = 'mot-de-passe-synthetique-qa'
  await page.getByLabel('Mot de passe du compte de test').fill(password)
  await page.getByLabel('Nom attendu à l’écran 1').fill('Camille')
  await page.getByRole('button', { name: 'Ajouter un nom attendu' }).click()
  await page.getByRole('button', { name: 'Ajouter un nom attendu' }).click()
  await expect(page.getByRole('button', { name: 'Ajouter un nom attendu' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Paramétrer manuellement' }).click()
  await page.getByLabel('Votre consigne').fill('Ouvre Mon parcours.')
  await page.getByRole('button', { name: 'Préparer le plan' }).click()
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeEnabled()
  await page.getByRole('button', { name: 'Lancer la mission' }).click({ clickCount: 2 })
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}`))
  expect(calls.starts).toHaveLength(1)
  const compte = calls.starts[0].compte
  const decrypted = JSON.parse(privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(compte.secret_chiffre, 'base64')).toString())
  expect(decrypted).toEqual({ mot_de_passe: password })
  expect(compte.identite).toEqual(['Camille'])
  expect(JSON.stringify(calls.starts)).not.toContain(password)
  expect(calls.keys).toBeGreaterThanOrEqual(2)
  await expect(page.getByRole('heading', { name: 'Connexion et identité', exact: true })).toBeVisible()
  await expect(page.getByText('Titre tronqué par H · à voir sur la capture')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('page interdite')
  await mkdir('test-results/apercus', { recursive: true })
  await page.screenshot({ path: 'test-results/apercus/rapport-connecte.png', fullPage: true })
})

test('Une clé absente au chargement ou au lancement empêche toute mise en file', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page); calls.keyAvailable = false
  await page.goto('/app/nouveau?cible=peer-review')
  await page.getByLabel('Adresse du compte de test').fill('test@example.invalid')
  await page.getByLabel('Mot de passe du compte de test').fill('synthetic-password')
  await page.getByRole('button', { name: 'Paramétrer manuellement' }).click()
  await page.getByLabel('Votre consigne').fill('Ouvre Mon parcours.')
  await page.getByRole('button', { name: 'Préparer le plan' }).click()
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeDisabled()
  calls.keyAvailable = true
  await page.getByRole('button', { name: 'Actualiser la disponibilité' }).click()
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeEnabled()
  calls.keyAvailable = false
  await page.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'n’est pas prêt' })).toBeVisible()
  expect(calls.starts).toHaveLength(0)
})

test('Changer de cible efface le compte et ne le joint jamais à un QA public', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau?cible=peer-review')
  await page.getByLabel('Adresse du compte de test').fill('test@example.invalid')
  await page.getByLabel('Mot de passe du compte de test').fill('synthetic-password')
  await page.getByRole('combobox', { name: 'Application' }).selectOption('eugenia-public')
  await page.getByRole('combobox', { name: 'Application' }).selectOption('peer-review')
  await expect(page.getByLabel('Mot de passe du compte de test')).toHaveValue('')
  await expect(page.getByLabel('Adresse du compte de test')).toHaveValue('')
  await page.getByRole('combobox', { name: 'Application' }).selectOption('eugenia-public')
  await page.getByRole('button', { name: 'Paramétrer manuellement' }).click()
  await page.getByRole('button', { name: 'Exploration', exact: true }).click()
  await page.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}`))
  expect(calls.starts[0].compte).toBeUndefined()
})


test('Matrice IDOR : le rapport générique est visible dans une mission Pentest', async ({ page }) => {
  await loginCookie(page)
  const acces = { enabled: true, owner: 'A', other: 'B', identities_verified: ['A', 'B'],
    resources: [{ path: '/access/leak500', source: 'inventory', status: 'completed' }] }
  const resultat = (role: string, status: string) => ({ id: `access-${role}`, title: `Contrôle ${role}`, url: '/access/leak500',
    actor_reference: role, control_id: 'idor_access', status, reason_code: status === 'failed' ? 'protected_content_received' : 'access_denied',
    classification: status === 'failed' ? 'demonstrated_vulnerability' : 'observation', expected: 'Isolation entre comptes.', observed: 'Observation synthétique.' })
  const rapport = { schema_version: 2, phase: 'completed', scenario_title: 'Recette IDOR générique (synthétique)', duration_s: 12,
    access_matrix: acces, coverage: { access_resources: 1, access_resources_discovered: 1, access_identities_verified: 2,
      forms_submitted: 2, business_forms_submitted: 0, mutations: 0, methods_sent: ['GET', 'POST'], measurement_source: 'target_observer' },
    security_findings: { demonstrated_unique: 1, configuration_weakness_assertions: 0, tool_candidates: 0 },
    results: [resultat('A', 'passed'), resultat('anonymous', 'passed'), resultat('B', 'failed')], evidence: [], sessions: [] }
  await page.route(`**/api/console/missions/pentest/${id}`, route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ mission: normaliseMission({ id, statut: 'termine', cible: 'Banc fictif', rapport }, 'pentest'), events: [] }) }))
  await page.goto(`/app/missions/pentest/${id}`)
  await expect(page.getByRole('region', { name: 'Matrice IDOR' })).toBeVisible()
  await expect(page.getByRole('rowheader', { name: '/access/leak500 route découverte', exact: true })).toBeVisible()
  await expect(page.getByText('FAILLE', { exact: true })).toBeVisible()
  await expect(page.getByText('route découverte', { exact: true })).toBeVisible()
  await expect(page.getByText(/Méthodes HTTP observées : GET, POST/)).toBeVisible()
  await expect(page.getByText(/0 formulaire\(s\) métier soumis par le runner/)).toBeVisible()
})

// ── D-56 : ajouter son application, la vérifier, y enregistrer un compte de test, puis la tester ──────────────

test('Ajouter une application : adresse, vérification par jeton, compte chiffré dans le navigateur, puis prête', async ({ page }) => {
  await loginCookie(page)
  const calls = await fixtures(page)
  await page.goto('/app/applications')
  await expect(page.getByRole('heading', { name: 'Testez votre propre site.' }).or(page.getByText('Testez votre propre site.'))).toBeVisible()
  await page.getByRole('link', { name: 'Ajouter une application' }).first().click()
  await expect(page).toHaveURL(/\/app\/applications\/nouvelle$/)
  const continuer = page.getByRole('button', { name: /Continuer/ })
  await page.getByLabel('Adresse du site').fill('ardoise-demo.vercel.app')
  await expect(continuer).toBeDisabled() // l'attestation est obligatoire
  await page.getByText(/J’ai le contrôle de ce site/).click()
  await continuer.click()
  expect(calls.ajouts[0]).toMatchObject({ adresse: 'ardoise-demo.vercel.app', connexion: '/connexion', attestation: true })
  await expect(page).toHaveURL(new RegExp(`/app/applications/${APP_AJOUTEE.id}$`))
  await expect(page.getByRole('heading', { name: 'Vérifions que ce site est à vous.' })).toBeFocused()
  await expect(page.getByText(APP_AJOUTEE.verification_jeton, { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Une balise' }).click()
  await expect(page.getByText(`<meta name="hsentinel-verification" content="${APP_AJOUTEE.verification_jeton}">`)).toBeVisible()
  await page.getByRole('button', { name: /Vérifier maintenant/ }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'répond HTTP 404' })).toBeVisible()
  await page.getByRole('button', { name: /Vérifier de nouveau/ }).click()
  await expect(page.getByRole('heading', { name: 'Les comptes de test.' })).toBeFocused()
  const motDePasse = 'motdepasse-synthetique-ardoise'
  await page.getByLabel('Libellé').fill('Compte A · gérante')
  await page.getByLabel('Identifiant').fill('camille@ardoise.test')
  await page.getByLabel('Mot de passe').fill(motDePasse)
  await page.getByLabel(/Nom affiché une fois connecté/).fill('Camille Martin')
  await page.getByRole('button', { name: /Chiffrer et enregistrer/ }).click()
  await expect(page.getByRole('heading', { name: 'Ardoise est prête.' })).toBeFocused()
  await expect(page.getByText('Chiffré pour le runner')).toBeVisible()
  // Le mot de passe n'a quitté le navigateur que chiffré pour le runner : la clé privée de la recette le rouvre, rien d'autre.
  const envoye = calls.comptes[0]
  expect(JSON.stringify(envoye)).not.toContain(motDePasse)
  expect(envoye.cle_runner_id).toBe(runnerKey.id)
  const clair = JSON.parse(privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(envoye.secret_chiffre, 'base64')).toString())
  expect(clair).toEqual({ mot_de_passe: motDePasse })
  await expect(page.getByRole('link', { name: /Préparer un test/ })).toHaveAttribute('href', `/app/nouveau?volet=qa&cible=${APP_AJOUTEE.id}`)
  await expect(page.getByRole('link', { name: 'Pentest libre' })).toHaveAttribute('href', `/app/nouveau?volet=pentest&cible=${APP_AJOUTEE.id}`)
})

test('Studio : une application ajoutée se teste avec son compte enregistré, sans rien retaper', async ({ page }) => {
  avecAjoutees = true
  await loginCookie(page)
  const calls = await fixtures(page)
  await page.goto(`/app/nouveau?volet=qa&cible=${APP_AJOUTEE.id}`)
  await page.getByRole('button', { name: /Paramétrer manuellement/ }).first().click()
  await expect(page.getByRole('combobox', { name: 'Application' })).toHaveValue(APP_AJOUTEE.id)
  await expect(page.getByRole('option', { name: /Ardoise · votre application · compte requis/ })).toBeAttached()
  await expect(page.getByRole('radio', { name: /Compte A · gérante/ })).toBeChecked()
  await expect(page.getByLabel('Mot de passe du compte de test')).toHaveCount(0) // aucun mot de passe à retaper
  await page.getByRole('button', { name: 'Exploration' }).click()
  await page.getByRole('button', { name: /Lancer la mission/ }).click()
  await expect.poll(() => calls.starts.length).toBe(1)
  expect(calls.starts[0]).toMatchObject({ mode: 'qa', target_id: APP_AJOUTEE.id, pilotage: 'exploration', compte_id: COMPTE_AJOUTE })
  expect(calls.starts[0].compte).toBeUndefined()
})

test('Applications : la liste « Vos applications » dit ce qu’il reste à faire', async ({ page }) => {
  avecAjoutees = true
  await loginCookie(page)
  await page.goto('/app/applications')
  const ligne = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Ardoise' }) })
  await expect(ligne.getByText('Vérifiée')).toBeVisible()
  await expect(ligne.getByText('1 compte de test')).toBeVisible()
  await expect(ligne.getByRole('link', { name: /Préparer un test/ })).toHaveAttribute('href', `/app/nouveau?volet=qa&cible=${APP_AJOUTEE.id}`)
  await expect(ligne.getByRole('link', { name: 'Pentest libre' })).toHaveAttribute('href', `/app/nouveau?volet=pentest&cible=${APP_AJOUTEE.id}`)
  // Les exemples phares ne se mêlent pas aux applications ajoutées.
  await expect(page.getByRole('region', { name: 'Exemples phares' }).getByRole('heading', { name: 'Ardoise' })).toHaveCount(0)
})

test('L’expert oriente au lieu de bloquer : son bouton mène à l’ajout, adresse pré-remplie', async ({ page }) => {
  await loginCookie(page)
  const calls = await fixtures(page)
  calls.reponseExpert = 'Vous pouvez l’ajouter vous-même en trois gestes : son adresse et l’attestation, le jeton de vérification, puis un compte de test.'
  calls.actionExpert = { type: 'ajouter_application', libelle: 'Ajouter cette application', adresse: 'https://app.facturo.io',
    href: '/app/applications/nouvelle?adresse=https%3A%2F%2Fapp.facturo.io' }
  await page.goto('/app/nouveau?volet=qa')
  await page.getByRole('button', { name: /Écrire à l’expert/ }).click()
  await page.getByPlaceholder('Ou écrivez votre objectif…').fill('Je voudrais tester mon SaaS, app.facturo.io')
  await page.getByRole('button', { name: /Demander/ }).click()
  const bouton = page.getByRole('link', { name: 'Ajouter cette application' })
  await expect(bouton).toBeVisible()
  await bouton.click()
  await expect(page).toHaveURL(/\/app\/applications\/nouvelle\?adresse=/)
  await expect(page.getByLabel('Adresse du site')).toHaveValue('https://app.facturo.io')
})

// ── D-57 : l'expert propose, et quand tout est prêt la mission part seule, après un compte à rebours annulable ──

test('Mode conversation : tout est prêt, la consigne part seule après le compte à rebours (plan, puis mission)', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  calls.reponseExpert = 'Je vérifie la page du Bachelor et le texte « Bac+3 ». Je lance la mission ; vous pouvez annuler.'
  calls.lancementExpert = 'direct'
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await dialogue.getByRole('button', { name: 'J’ai fini' }).click({ timeout: 8000 }).catch(() => {})
  await expect(dialogue.getByText(/Lancement dans [1-4]/)).toBeVisible({ timeout: 15_000 })
  // Pendant le compte à rebours, l'écoute ne reprend pas ; à zéro, la voix se ferme et le studio prépare puis lance.
  await expect(dialogue).toHaveCount(0, { timeout: 8000 })
  await expect.poll(() => calls.plans.length).toBe(1)
  await expect.poll(() => calls.starts.length).toBe(1)
  expect(calls.starts[0]).toMatchObject({ mode: 'qa', pilotage: 'guide', source: 'voix', instruction: 'Ouvrir le menu « Programmes », puis vérifier le texte « Bac+3 ».' })
  expect(calls.starts[0].plan.criteres).toHaveLength(2)
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}$`))
})

test('Mode conversation : « Annuler » arrête le compte à rebours ; « Lancer la mission » part d’un clic et ferme la voix', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  calls.lancementExpert = 'direct'
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await dialogue.getByRole('button', { name: 'J’ai fini' }).click({ timeout: 8000 }).catch(() => {})
  await dialogue.getByRole('button', { name: 'Annuler' }).click({ timeout: 15_000 })
  await page.waitForTimeout(5000) // au-delà du délai : rien ne part
  expect(calls.starts).toHaveLength(0)
  await expect(dialogue).toBeVisible()
  await dialogue.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(dialogue).toHaveCount(0)
  await expect.poll(() => calls.starts.length).toBe(1)
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}$`))
})

test('Mode conversation : une chasse aux bugs devient une exploration, qui part seule sans plan', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  calls.reponseExpert = 'Pour trouver ce qui ne marche pas, je propose une exploration. Je la lance dans 4 secondes ; vous pouvez annuler.'
  calls.lancementExpert = 'direct'
  calls.pilotageExpert = 'exploration'
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Parler à l’expert' }).click()
  const dialogue = page.getByRole('dialog', { name: /Conversation/ })
  await dialogue.getByRole('button', { name: 'J’ai fini' }).click({ timeout: 8000 }).catch(() => {})
  await expect(dialogue.getByText('Exploration proposée')).toBeVisible({ timeout: 15_000 })
  await expect(dialogue.getByText(/Lancement dans [1-4]/)).toBeVisible()
  await expect(dialogue).toHaveCount(0, { timeout: 8000 })
  await expect.poll(() => calls.starts.length).toBe(1)
  expect(calls.starts[0]).toMatchObject({ mode: 'qa', pilotage: 'exploration', instruction: '', plan: null, source: 'voix' })
  expect(calls.plans).toHaveLength(0) // une exploration ne passe pas par le plan
})
