import 'server-only'
import { cookies, headers } from 'next/headers'
import { validSession } from './operator-session.mjs'
import { isPlan, PLAN_COOKIE, SIDEBAR_COOKIE, type Plan } from './plan'

export const OPERATOR_COOKIE = 'hs_operator_session'
export async function hasSession() {
  const secret = process.env.HSENTINEL_OPERATOR_TOKEN
  if (!secret && process.env.NODE_ENV === 'development') {
    const host = (await headers()).get('host') ?? ''
    return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)
  }
  return validSession((await cookies()).get(OPERATOR_COOKIE)?.value, secret)
}
export async function getPlan(): Promise<Plan> {
  const value = (await cookies()).get(PLAN_COOKIE)?.value
  return isPlan(value) ? value : 'both'
}
export async function getSidebarCollapsed() {
  return (await cookies()).get(SIDEBAR_COOKIE)?.value === '1'
}
