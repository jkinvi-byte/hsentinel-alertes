// D-56 : ajouter son application, prouver son contrôle, enregistrer ses comptes de test. Chaque règle dans les deux sens.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  adressePrivee, etape, idApplication, jetonPublie, normaliserAdresse, normaliserChemin, nouveauJeton, profilClient, validerCompteTest, JETON,
} from '../../web/lib/applications-contrat.mjs'
import { validerMissionQa } from '../../web/lib/qa-contrat.mjs'

const CHIFFRE = 'A'.repeat(344)
const ORIGINE = 'https://ardoise-demo.vercel.app'

test('une adresse publique en https est acceptée, et normalisée', () => {
  assert.deepEqual(normaliserAdresse('ardoise-demo.vercel.app'), { origine: ORIGINE, chemin: '/' })
  assert.deepEqual(normaliserAdresse(' https://Ardoise-Demo.vercel.app/tableau/ '), { origine: ORIGINE, chemin: '/tableau' })
  assert.equal(idApplication(ORIGINE), 'ardoise-demo-vercel-app')
})

test('une adresse locale, privée, non chiffrée ou avec identifiants est refusée', () => {
  for (const adresse of ['http://ardoise-demo.vercel.app', 'https://localhost', 'https://10.0.0.1', 'https://[::1]/', 'https://intranet',
    'https://serveur.local', 'https://ardoise-demo.vercel.app:8443', 'https://moi:secret@ardoise-demo.vercel.app', 'ftp://exemple.fr', '', ' ']) {
    assert.throws(() => normaliserAdresse(adresse), Error, adresse)
  }
})

test('le chemin de connexion reste un chemin du site', () => {
  assert.equal(normaliserChemin('connexion'), '/connexion')
  assert.equal(normaliserChemin('/auth/login/'), '/auth/login')
  assert.equal(normaliserChemin(''), null)
  for (const chemin of ['//autre.example', '/../admin', 'https://autre.example/login', '/login?next=x']) assert.throws(() => normaliserChemin(chemin), Error, chemin)
})

test('les adresses privées, locales et réservées sont refusées ; les publiques passent', () => {
  for (const ip of ['10.0.0.1', '127.0.0.1', '169.254.169.254', '172.20.1.1', '192.168.0.10', '100.64.1.1', '0.0.0.0', '::1', '::',
    '::ffff:127.0.0.1', '::ffff:7f00:1', 'fd12::1', 'fe80::1', 'ff02::1', '224.0.0.1', '255.255.255.255', 'n importe quoi']) {
    assert.equal(adressePrivee(ip), true, ip)
  }
  for (const ip of ['76.76.21.21', '8.8.8.8', '2606:4700::6810:84e5']) assert.equal(adressePrivee(ip), false, ip)
})

test('le jeton est aléatoire, au bon format, et retrouvé dans le fichier ou la balise', () => {
  const jeton = nouveauJeton()
  assert.match(jeton, JETON)
  assert.notEqual(jeton, nouveauJeton())
  assert.equal(jetonPublie({ fichier: `${jeton}\n` }, jeton), 'fichier')
  assert.equal(jetonPublie({ fichier: `# HSentinel\nhsentinel-verification=${jeton}` }, jeton), 'fichier')
  assert.equal(jetonPublie({ page: `<head><meta content="${jeton}" name="hsentinel-verification"></head>` }, jeton), 'balise')
  assert.equal(jetonPublie({ page: `<meta name='hsentinel-verification' content='${jeton}' />` }, jeton), 'balise')
})

test('un autre jeton, une autre balise ou un jeton mal formé ne prouvent rien', () => {
  const jeton = nouveauJeton()
  const autre = nouveauJeton()
  assert.equal(jetonPublie({ fichier: autre, page: `<meta name="hsentinel-verification" content="${autre}">` }, jeton), null)
  assert.equal(jetonPublie({ page: `<meta name="description" content="${jeton}">` }, jeton), null)
  assert.equal(jetonPublie({ fichier: `prefixe ${jeton}` }, jeton), null)
  assert.equal(jetonPublie({ fichier: 'hsv-court' }, 'hsv-court'), null)
})

test('le profil d’une application ajoutée est en consultation seule, avec des budgets fixes', () => {
  const p = profilClient({ id: 'ardoise-demo-vercel-app', nom: 'Ardoise', origine: ORIGINE, connexion: '/connexion' })
  assert.equal(p.client, true)
  assert.equal(p.consultation_seule, true)
  assert.equal(p.entree, `${ORIGINE}/connexion`)
  assert.deepEqual(p.connexion, { chemin: '/connexion' })
  assert.ok(p.chemins_exclus.includes('/deconnexion'))
  assert.deepEqual(p.limites.guide, { max_steps: 30, max_time_s: 300 })
  const publique = profilClient({ id: 'x', nom: 'X', origine: ORIGINE, chemin: '/accueil' })
  assert.equal(publique.entree, `${ORIGINE}/accueil`)
  assert.equal(publique.connexion, undefined)
})

test('un compte de test s’enregistre chiffré, jamais en clair', () => {
  const c = validerCompteTest({ libelle: ' Compte A  · gérante ', identifiant: 'camille@ardoise.test', secret_chiffre: CHIFFRE, cle_runner_id: 3, identite: ['Camille Martin', ' '] })
  assert.deepEqual(c, { libelle: 'Compte A · gérante', identifiant: 'camille@ardoise.test', secret_chiffre: CHIFFRE, cle_runner_id: 3, identite: ['Camille Martin'] })
  assert.equal(validerCompteTest({ libelle: 'B', identifiant: 'hugo.bernard', secret_chiffre: CHIFFRE, cle_runner_id: 3 }).identifiant, 'hugo.bernard')
  for (const mauvais of [
    { libelle: 'A', identifiant: 'a@b.c', mot_de_passe: 'clair', secret_chiffre: CHIFFRE, cle_runner_id: 3 },
    { libelle: 'A', identifiant: 'a@b.c', secret_chiffre: 'court', cle_runner_id: 3 },
    { libelle: '', identifiant: 'a@b.c', secret_chiffre: CHIFFRE, cle_runner_id: 3 },
    { libelle: 'A', identifiant: 'a b', secret_chiffre: CHIFFRE, cle_runner_id: 3 },
    { libelle: 'A', identifiant: 'a@b.c', secret_chiffre: CHIFFRE },
  ]) assert.throws(() => validerCompteTest(mauvais), Error, JSON.stringify(mauvais).slice(0, 60))
})

const mission = (extra) => ({ schema_version: 3, mode: 'qa', target_id: 'ardoise-demo-vercel-app', pilotage: 'exploration', appareil: 'ordinateur', instruction: '', ...extra })
const cibleClient = { ...profilClient({ id: 'ardoise-demo-vercel-app', nom: 'Ardoise', origine: ORIGINE, connexion: '/connexion' }) }

test('une mission sur une application ajoutée connectée exige un compte enregistré, et rien d’autre', () => {
  const compteId = '0b0c2d4e-1f2a-4b3c-8d9e-0f1a2b3c4d5e'
  assert.equal(validerMissionQa(mission({ compte_id: compteId }), cibleClient).compte_id, compteId)
  assert.throws(() => validerMissionQa(mission({}), cibleClient), /compte de test enregistré/)
  assert.throws(() => validerMissionQa(mission({ compte_id: 'pas-un-uuid' }), cibleClient), /compte de test enregistré/)
  assert.throws(() => validerMissionQa(mission({ compte_id: compteId, compte: { identifiant: 'a@b.c', secret_chiffre: CHIFFRE } }), cibleClient), /compte de test enregistré/)
})

test('un exemple du catalogue garde son compte saisi, sans compte enregistré ; une application inconnue est refusée', () => {
  const plan = { titre: 'Parcours', etapes: ['Ouvrir'], criteres: [{ type: 'constat', description: 'La page s’affiche', valeur: '' }] }
  assert.throws(() => validerMissionQa(mission({ target_id: 'peer-review', pilotage: 'guide', plan, compte_id: '0b0c2d4e-1f2a-4b3c-8d9e-0f1a2b3c4d5e' })), /compte saisi/)
  assert.throws(() => validerMissionQa(mission({ target_id: 'site-inconnu' })), /pas enregistrée/)
  const publique = profilClient({ id: 'x-fr', nom: 'X', origine: 'https://x.fr' })
  assert.throws(() => validerMissionQa(mission({ target_id: 'x-fr', compte_id: '0b0c2d4e-1f2a-4b3c-8d9e-0f1a2b3c4d5e' }), publique), /aucun compte/)
  assert.equal(validerMissionQa(mission({ target_id: 'x-fr' }), publique).target_id, 'x-fr')
})

test('l’étape suivante d’une application ajoutée', () => {
  assert.equal(etape({ verifiee_le: null }), 'verification')
  assert.equal(etape({ verifiee_le: 'x', profil_qa: { connexion: { chemin: '/c' } }, comptes: [] }), 'compte')
  assert.equal(etape({ verifiee_le: 'x', profil_qa: { connexion: { chemin: '/c' } }, comptes: [{}] }), 'prete')
  assert.equal(etape({ verifiee_le: 'x', profil_qa: {} }), 'prete')
})

// ── L'expert oriente au lieu de bloquer (D-56) : la règle du bouton proposé ──────────────────────────────
import { actionExpert, adressesCitees } from '../lib/expert/actions.mjs'

const connues = ['https://www.eugeniaschool.com', 'https://peer-review-black.vercel.app', ORIGINE]

test('un site cité et inconnu fait proposer « Ajouter cette application », adresse pré-remplie', () => {
  assert.deepEqual(adressesCitees('Tu peux tester monsaas.fr et https://app.exemple.com/connexion ?'), ['https://monsaas.fr', 'https://app.exemple.com'])
  const a = actionExpert({ question: 'Je voudrais tester mon SaaS, app.facturo.io', cible: null, connues })
  assert.deepEqual(a, { type: 'ajouter_application', libelle: 'Ajouter cette application', adresse: 'https://app.facturo.io',
    href: '/app/applications/nouvelle?adresse=https%3A%2F%2Fapp.facturo.io' })
})

test('un site connu, une adresse e-mail, un fichier ou une adresse locale ne font rien proposer', () => {
  for (const question of ['Vérifie ardoise-demo.vercel.app', 'Connecte-toi avec camille@ardoise.test', 'Ouvre rapport.json',
    'Teste http://localhost:3000', 'Teste 192.168.1.10', 'Vérifie la page Factures']) {
    assert.equal(actionExpert({ question, cible: null, connues }), null, question)
  }
})

test('une application ajoutée sans compte de test fait proposer d’en ajouter un', () => {
  const cible = { id: 'ardoise-demo-vercel-app', ajoutee: true, connexion: true, comptes: 0 }
  assert.deepEqual(actionExpert({ question: 'Que vérifier ?', cible, connues }),
    { type: 'ajouter_compte', libelle: 'Ajouter un compte de test', href: '/app/applications/ardoise-demo-vercel-app#comptes' })
  assert.equal(actionExpert({ question: 'Que vérifier ?', cible: { ...cible, comptes: 2 }, connues }), null)
  assert.equal(actionExpert({ question: 'Que vérifier ?', cible: { ...cible, connexion: false }, connues }), null)
})

test('le modèle peut demander le bouton sans adresse, jamais en inventer une', () => {
  assert.deepEqual(actionExpert({ question: 'Je veux tester mon propre site', cible: null, connues, proposee: { type: 'ajouter_application', adresse: 'https://invente.example' } }),
    { type: 'ajouter_application', libelle: 'Ajouter une application', adresse: null, href: '/app/applications/nouvelle' })
  assert.equal(actionExpert({ question: 'Bonjour', cible: null, connues, proposee: { type: 'supprimer_tout' } }), null)
  assert.equal(actionExpert({ question: 'Bonjour', cible: null, connues, proposee: 'ajouter_application' }), null)
})

test('sans intention d’ajout dans la question, l’avis du modèle ne fait pas apparaître le bouton', async () => {
  const { intentionAjout } = await import('../lib/expert/actions.mjs')
  for (const q of ['Je veux tester mon propre site', 'Et notre application ?', 'Peux-tu tester un autre SaaS ?', 'Comment ajouter une application ?', 'Mon saas n’est pas dans la liste'])
    assert.equal(intentionAjout(q), true, q)
  for (const q of ['Vérifie que la page Factures annonce bien « 3 factures en retard », comme le tableau de bord.', 'Que vérifier sur Ardoise ?', 'Explore le site'])
    assert.equal(intentionAjout(q), false, q)
  const proposee = { type: 'ajouter_application' }
  assert.equal(actionExpert({ question: 'Vérifie que la page Factures annonce bien « 3 factures en retard ».', cible: null, connues, proposee }), null)
})

test('un échange sur un site inconnu ne déteint pas sur les questions suivantes', async () => {
  const { historiqueSurLaCible } = await import('../lib/expert/actions.mjs')
  const historique = [
    { role: 'utilisateur', texte: 'Peux-tu tester app.facturo.io ?' }, { role: 'expert', texte: 'Ajoutez app.facturo.io en trois gestes.' },
    { role: 'utilisateur', texte: 'Que vérifier sur ardoise-demo.vercel.app ?' }, { role: 'expert', texte: 'La page Factures.' },
  ]
  assert.deepEqual(historiqueSurLaCible(historique, connues).map((t) => t.texte), ['Que vérifier sur ardoise-demo.vercel.app ?', 'La page Factures.'])
  assert.deepEqual(historiqueSurLaCible(historique.slice(2), connues), historique.slice(2))
})
