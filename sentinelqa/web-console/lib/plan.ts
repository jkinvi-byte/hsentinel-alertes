import type { AuditModule } from './audit-types'

export type Plan = 'qa' | 'pentest' | 'both'

export const PLAN_COOKIE = 'hs_plan'
export const SIDEBAR_COOKIE = 'hs_sidebar'
export const SESSION_COOKIE = 'hs_session'
export const ONBOARDED_COOKIE = 'hs_onboarded'

export const PLANS: { id: Plan; label: string }[] = [
  { id: 'qa', label: 'QA seul' },
  { id: 'pentest', label: 'Pentest seul' },
  { id: 'both', label: 'Les deux' },
]

export const PLAN_MODULES: Record<Plan, AuditModule[]> = {
  qa: ['qa'],
  pentest: ['pentest'],
  both: ['qa', 'pentest'],
}

export const MODULE_LABELS: Record<AuditModule, string> = {
  qa: 'QA',
  pentest: 'Pentest',
}

export function isPlan(value: unknown): value is Plan {
  return value === 'qa' || value === 'pentest' || value === 'both'
}

export function writePreferenceCookie(name: string, value: string) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`
}
