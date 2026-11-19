'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { acceptsToken, createSession } from '@/lib/operator-session.mjs'
import { OPERATOR_COOKIE } from '@/lib/session'

export async function login(formData: FormData) {
  const secret = process.env.HSENTINEL_OPERATOR_TOKEN
  if (!secret || secret.length < 24) redirect('/login?error=config')
  if (!acceptsToken(formData.get('token'), secret)) redirect('/login?error=invalid')
  ;(await cookies()).set(OPERATOR_COOKIE, createSession(secret), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 8 * 60 * 60,
  })
  redirect('/app')
}
export async function logout() {
  ;(await cookies()).delete(OPERATOR_COOKIE)
  redirect('/login')
}
// « Démarrer l'essai de 7 jours » : pas de compte en libre-service, l'essai passe par une demande de démo.
export async function signup() {
  redirect('/demo')
}
