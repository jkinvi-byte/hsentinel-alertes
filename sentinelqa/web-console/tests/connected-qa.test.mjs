import test from 'node:test'
import assert from 'node:assert/strict'
import { constants, generateKeyPairSync, privateDecrypt } from 'node:crypto'
import { encryptQaAccount, publicRunnerKey } from '../lib/qa-account.mjs'
import { validateStart } from '../lib/console-contract.mjs'
import { normaliseMission } from '../lib/mission-view.mjs'
import { libelleStatut } from '../../web/lib/qa-contrat.mjs'

// Clés éphémères : aucun compte ou coffre réel dans ces tests.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 3072 })
const key = { id: 42, jwk: publicKey.export({ format: 'jwk' }) }
const account = { identifiant: 'test@example.invalid', motDePasse: '  mot-de-passe-synthétique!  ', identite: [' Camille ', 'Équipe démo', ''] }
const decrypt = encrypted => JSON.parse(privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(encrypted, 'base64')).toString())

test('Le navigateur produit le format RSA-OAEP SHA-256 lisible par le worker, sans altérer le mot de passe', async () => {
  const compte = await encryptQaAccount(key, account)
  assert.deepEqual(decrypt(compte.secret_chiffre), { mot_de_passe: account.motDePasse })
  assert.deepEqual(compte.identite, ['Camille', 'Équipe démo'])
  const validated = validateStart({ schema_version: 3, mode: 'qa', target_id: 'peer-review', pilotage: 'guide', instruction: 'Ouvrir Mon parcours',
    plan: { titre: 'Mon parcours', etapes: ['Ouvrir Mon parcours'], criteres: [{ type: 'constat', description: 'Page visible', valeur: '' }] }, compte })
  assert.equal(validated.data.compte.secret_chiffre, compte.secret_chiffre)
  assert.equal(JSON.stringify(validated.data).includes(account.motDePasse), false)
  assert.equal(Object.hasOwn(validated.data.compte, 'mot_de_passe'), false)
})
test('Deux chiffrements de la même valeur utilisent des aléas différents', async () => {
  const first = await encryptQaAccount(key, account), second = await encryptQaAccount(key, account)
  assert.notEqual(first.secret_chiffre, second.secret_chiffre)
  assert.deepEqual(decrypt(first.secret_chiffre), decrypt(second.secret_chiffre))
})
test('Une clé absente, WebCrypto absent ou un mot de passe vide bloquent le chiffrement', async () => {
  await assert.rejects(encryptQaAccount(null, account), /n’est pas prêt/)
  await assert.rejects(encryptQaAccount(key, account, {}), /HTTPS/)
  await assert.rejects(encryptQaAccount(key, { ...account, motDePasse: '' }), /Renseignez/)
})
test('La taille est contrôlée en octets UTF-8, avant RSA', async () => {
  await assert.rejects(encryptQaAccount(key, { ...account, motDePasse: 'é'.repeat(160) }), /trop long/)
})
test('Le compte respecte les règles serveur : trois marqueurs au plus, pas de compte sur une cible publique', async () => {
  await assert.rejects(encryptQaAccount(key, { ...account, identite: ['a', 'b', 'c', 'd'] }), /nom attendu/)
  await assert.rejects(encryptQaAccount(key, { ...account, identifiant: 'invalide' }), /adresse/)
  const compte = await encryptQaAccount(key, account)
  assert.throws(() => validateStart({ schema_version: 3, mode: 'qa', target_id: 'eugenia-public', pilotage: 'exploration', compte }), /aucun compte/)
})
test('La réponse de clé ne peut contenir de paramètres privés', () => {
  const result = publicRunnerKey({ ...key, jwk: privateKey.export({ format: 'jwk' }), private_note: 'synthetic-private' })
  assert.deepEqual(Object.keys(result).sort(), ['id', 'jwk'])
  assert.deepEqual(Object.keys(result.jwk).sort(), ['alg', 'e', 'ext', 'key_ops', 'kty', 'n'])
  assert.equal(publicRunnerKey(null), null)
  assert.throws(() => publicRunnerKey({ id: 1, jwk: { kty: 'RSA' } }))
})
test('La vue du rapport ne renvoie pas le compte, même si la mission est encore en attente', async () => {
  const compte = await encryptQaAccount(key, account)
  const view = normaliseMission({ id: 'fixture', statut: 'en_attente', demande: { target_id: 'peer-review', compte }, rapport: null }, 'qa')
  const output = JSON.stringify(view)
  for (const value of [account.identifiant, account.motDePasse, compte.secret_chiffre, 'Camille']) assert.equal(output.includes(value), false)
})
test('Les trois raisons demandées utilisent les libellés métier existants', () => {
  assert.match(libelleStatut('inconclusive', 'h_text_partial'), /Titre tronqué/)
  assert.match(libelleStatut('inconclusive', 'write_risk'), /geste à risque/)
  assert.match(libelleStatut('inconclusive', 'forbidden_page'), /page interdite/)
})
