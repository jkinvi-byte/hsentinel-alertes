import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const LIFETIME = 8 * 60 * 60
function equal(a, b) {
  const left = Buffer.from(a), right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}
export function acceptsToken(value, secret) {
  return typeof secret === 'string' && secret.length >= 24 && typeof value === 'string' && equal(value, secret)
}
export function createSession(secret, now = Date.now()) {
  if (!acceptsToken(secret, secret)) throw new Error('Accès opérateur non configuré.')
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(now / 1000) + LIFETIME, nonce: randomBytes(16).toString('hex') })).toString('base64url')
  return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`
}
export function validSession(value, secret, now = Date.now()) {
  if (!acceptsToken(secret, secret) || typeof value !== 'string' || value.length > 512) return false
  const [payload, signature, extra] = value.split('.')
  if (!payload || !signature || extra) return false
  if (!equal(signature, createHmac('sha256', secret).update(payload).digest('base64url'))) return false
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return Number.isInteger(exp) && exp > Math.floor(now / 1000) && exp <= Math.floor(now / 1000) + LIFETIME
  } catch { return false }
}
