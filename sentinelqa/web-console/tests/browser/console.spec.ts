import { test, expect, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { constants, generateKeyPairSync, privateDecrypt } from 'node:crypto'
import { createSession } from '../../lib/operator-session.mjs'
import { normaliseMission } from '../../lib/mission-view.mjs'
import { bilanAlertes, ligneAlerte } from '../../../web/lib/alertes-format.mjs'

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

async function loginCookie(page: Page) {
  await page.context().addCookies([{ name: 'hs_operator_session', value: createSession(secret), url: baseURL, httpOnly: true, sameSite: 'Lax' }])
}
async function fixtures(page: Page) {
  const calls = { starts: [] as any[], plans: [] as any[], stops: 0, transcriptions: 0, failed: false, running: false,
    keys: 0, keyAvailable: true, alertsFailed: false }
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
    if (path === '/api/console/transcription') {
      calls.transcriptions++; await new Promise(resolve => setTimeout(resolve, 350))
      return response({ texte: 'Vérifie le Bachelor et son diplôme.', latence_s: .35, modele: 'fixture' })
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
  expect((await request.get('/api/console/alertes')).status()).toBe(401)
  expect((await request.get('/api/console/alertes?limite=0', { headers: { cookie: signed } })).status()).toBe(400)
  const blocked = await request.post('/api/console/missions', { headers: { cookie: signed, origin: 'http://127.0.0.1:3102' }, data: { schema_version: 2, mode: 'security', target_id: 'peer-review', scenario_id: 'S-PEER-02' } })
  expect(blocked.status()).toBe(400)
  expect((await request.post('/api/console/missions', { headers: { cookie: signed, origin: 'https://elsewhere.example' }, data: {} })).status()).toBe(403)
})

test('Connexion opérateur : un faux code est refusé', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Code d’accès de l’équipe').fill('not-the-token')
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Ce code d’accès n’est pas reconnu.' })).toHaveText('Ce code d’accès n’est pas reconnu.')
})

})

test('Historique vide et erreur réseau restent explicites', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app')
  await expect(page.getByText('Votre première mission commence ici')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Simuler un déploiement' })).toHaveCount(0)
  calls.failed = true
  await page.getByRole('button', { name: 'Pentest', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Service temporairement indisponible.' })).toBeVisible()
  calls.failed = false
  await page.getByRole('button', { name: 'Réessayer' }).click()
  await expect(page.getByText('Votre première mission commence ici')).toBeVisible()
})

test('Parcours QA : plan périmé bloqué, lancement unique et résultats non concluants', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau')
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

test('Pentest : scénario disponible, contrôles authentifiés désactivés', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau?volet=pentest')
  await expect(page.getByRole('option', { name: /ressource d’un autre étudiant/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(page).toHaveURL(new RegExp(`/app/missions/pentest/${id}`))
  expect(calls.starts[0].mode).toBe('security')
  expect(calls.starts[0].scenario_id).toBe('S-PEER-01')
})

test('Dictée sur microphone synthétique : bloque le lancement et ajoute du texte relisible', async ({ page, context }) => {
  await context.grantPermissions(['microphone'])
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/nouveau')
  await page.getByRole('button', { name: 'Dicter la consigne' }).click()
  await expect(page.getByText('Le micro enregistre votre consigne.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeDisabled()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: /Arrêter et transcrire/ }).click()
  await expect(page.getByLabel('Votre consigne')).toHaveValue('Vérifie le Bachelor et son diplôme.')
  expect(calls.transcriptions).toBe(1)
  await page.getByRole('button', { name: 'Préparer le plan' }).click()
  await expect(page.getByRole('button', { name: 'Lancer la mission' })).toBeEnabled()
  await page.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}`))
  expect(calls.starts[0].source).toBe('voix')
})

test('Le studio reste utilisable à 390 pixels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await loginCookie(page); await fixtures(page)
  await page.goto('/app/nouveau')
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
  await page.getByRole('button', { name: 'Exploration', exact: true }).click()
  await page.getByRole('button', { name: 'Lancer la mission' }).click()
  await expect(page).toHaveURL(new RegExp(`/app/missions/qa/${id}`))
  expect(calls.starts[0].compte).toBeUndefined()
})

test('Alertes : filtre, état d’envoi, ticket et panne du service', async ({ page }) => {
  await loginCookie(page); const calls = await fixtures(page)
  await page.goto('/app/alertes')
  await expect(page.getByRole('link', { name: 'Ticket #7', exact: true })).toHaveAttribute('href', 'https://github.com/jkinvi-byte/hsentinel-alertes/issues/7')
  await expect(page.getByText('Alerte envoyée', { exact: true })).toBeVisible()
  await expect(page.getByText('Alerte en échec · reprise toutes les 15 min')).toBeVisible()
  await page.getByLabel('Filtrer par application').selectOption('peer-review')
  await expect(page.getByRole('link', { name: 'Ticket #7', exact: true })).toHaveCount(0)
  await expect(page.getByText('Aucun ticket associé')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await mkdir('test-results/apercus', { recursive: true })
  await page.screenshot({ path: 'test-results/apercus/alertes-mobile.png', fullPage: true })
  calls.alertsFailed = true
  await page.getByRole('button', { name: 'Actualiser', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Alertes momentanément indisponibles.' })).toBeVisible()
})
