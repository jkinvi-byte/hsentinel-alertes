import { validerCompte } from '../../web/lib/qa-contrat.mjs'

// Cette projection ne transmet que la partie publique, même si la ligne source comporte d'autres champs.
export function publicRunnerKey(key) {
  if (!key) return null
  const { n, e, kty } = key.jwk ?? {}
  if (!['string', 'number'].includes(typeof key.id) || kty !== 'RSA' || typeof n !== 'string' || !n || typeof e !== 'string' || !e) {
    throw new Error('La clé de connexion n’est pas disponible.')
  }
  return { id: key.id, jwk: { kty, n, e, alg: 'RSA-OAEP-256', ext: true, key_ops: ['encrypt'] } }
}

// Exécuté dans le navigateur : le mot de passe, chiffré pour le runner (RSA-OAEP, SHA-256). Seule la clé privée du poste
// qui fait tourner le runner l'ouvre ; ni notre serveur ni la base ne le lisent en clair.
export async function chiffrerPourRunner(runnerKey, motDePasse, cryptoApi = globalThis.crypto) {
  const key = publicRunnerKey(runnerKey)
  if (!key) throw new Error('Le service QA connecté n’est pas prêt. Actualisez sa disponibilité avant de lancer.')
  if (!cryptoApi?.subtle) throw new Error('Le chiffrement nécessite HTTPS ou une adresse locale. Le mot de passe n’a pas été envoyé.')
  if (typeof motDePasse !== 'string' || !motDePasse.length) throw new Error('Renseignez le mot de passe du compte de test.')
  const publicKey = await cryptoApi.subtle.importKey('jwk', key.jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt'])
  const bytes = new TextEncoder().encode(JSON.stringify({ mot_de_passe: motDePasse }))
  // Limite RSA-OAEP SHA-256 calculée sur la clé reçue ; marge identique au formulaire existant.
  const maxBytes = Math.min(300, publicKey.algorithm.modulusLength / 8 - 66)
  if (bytes.length > maxBytes) throw new Error('Le mot de passe est trop long pour cette clé de connexion.')
  const encrypted = new Uint8Array(await cryptoApi.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, bytes))
  return { secret_chiffre: btoa(String.fromCharCode(...encrypted)), cle_runner_id: Number(key.id) }
}

// Le mot de passe n'entre ni dans le plan HF, ni dans la demande en clair.
export async function encryptQaAccount(runnerKey, account, cryptoApi = globalThis.crypto) {
  const { secret_chiffre } = await chiffrerPourRunner(runnerKey, account?.motDePasse, cryptoApi)
  return validerCompte({ identifiant: account.identifiant, secret_chiffre,
    identite: account.identite.map(value => value.trim()).filter(Boolean) })
}
