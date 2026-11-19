import type { AuditModule } from './audit-types'
import { APPLICATIONS } from './console-data'
import type { Plan } from './plan'

export type OfferId = 'decouverte' | 'launch' | 'scale'
export type PackId = 'starter' | 'growth' | 'volume'

export const OFFER_COOKIE = 'hs_offer'
export const ADDON_COOKIE = 'hs_code_assisted'
export const WALLET_COOKIE = 'hs_wallet'

export const ANNUAL_DISCOUNT = 0.85
export const CODE_ASSISTED_PRICE = 199
export const AUDIT_EXPRESS_PRICE = 790
export const PACK_VALIDITY_MONTHS = 12

export type Offer = {
  id: OfferId
  name: string
  tagline: string
  price: number
  period: string
  creditsPerApp: number
  maxApps: number
  maxCompanies: number
  plan: Plan
}

export const OFFERS: Record<OfferId, Offer> = {
  decouverte: {
    id: 'decouverte',
    name: 'Découverte',
    tagline: 'Essai 7 jours · QA + Pentest',
    price: 0,
    period: '7 jours',
    creditsPerApp: 80,
    maxApps: 1,
    maxCompanies: 3,
    plan: 'both',
  },
  launch: {
    id: 'launch',
    name: 'Launch',
    tagline: 'QA continu',
    price: 249,
    period: 'mois',
    creditsPerApp: 150,
    maxApps: 5,
    maxCompanies: 10,
    plan: 'qa',
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    tagline: 'QA + Pentest',
    price: 599,
    period: 'mois',
    creditsPerApp: 400,
    maxApps: 10,
    maxCompanies: 20,
    plan: 'both',
  },
}

export const OFFER_ORDER: OfferId[] = ['decouverte', 'launch', 'scale']

export const CREDIT_COSTS = {
  qaRun: 1,
  pentestPair: 2,
  codeAssisted: 3,
  retest: 0,
} as const

export const CREDIT_PACKS: { id: PackId; credits: number; price: number }[] = [
  { id: 'starter', credits: 100, price: 99 },
  { id: 'growth', credits: 500, price: 399 },
  { id: 'volume', credits: 1500, price: 990 },
]

export const THRESHOLDS = [50, 100, 200] as const
export const MONTHLY_CAPS = [0, 500, 1000, 2500] as const

export type Purchase = { at: string; packId: PackId; credits: number; auto?: boolean }

export type Wallet = {
  topup: number
  auto: boolean
  threshold: number
  packId: PackId
  cap: number
  purchases: Purchase[]
}

export const DEFAULT_WALLET: Wallet = {
  topup: 0,
  auto: false,
  threshold: 100,
  packId: 'growth',
  cap: 1000,
  purchases: [],
}

export function isOfferId(value: unknown): value is OfferId {
  return value === 'decouverte' || value === 'launch' || value === 'scale'
}

export function isPackId(value: unknown): value is PackId {
  return CREDIT_PACKS.some((p) => p.id === value)
}

export function parseWallet(raw?: string): Wallet {
  if (!raw) return DEFAULT_WALLET
  try {
    const data = JSON.parse(raw) as Partial<Wallet>
    return {
      topup: Number.isFinite(data.topup) ? Math.max(0, Math.floor(data.topup as number)) : 0,
      auto: data.auto === true,
      threshold: THRESHOLDS.includes(data.threshold as never) ? (data.threshold as number) : DEFAULT_WALLET.threshold,
      packId: isPackId(data.packId) ? data.packId : DEFAULT_WALLET.packId,
      cap: MONTHLY_CAPS.includes(data.cap as never) ? (data.cap as number) : DEFAULT_WALLET.cap,
      purchases: Array.isArray(data.purchases)
        ? data.purchases.filter((p) => isPackId(p?.packId) && typeof p.at === 'string').slice(-8)
        : [],
    }
  } catch {
    return DEFAULT_WALLET
  }
}

export function pairCount(companies: number) {
  return companies * (companies - 1)
}

export function auditCost(module: AuditModule, companies: number) {
  return module === 'qa' ? CREDIT_COSTS.qaRun : CREDIT_COSTS.pentestPair * pairCount(companies)
}

const PERIOD_USAGE: Record<string, { qaRuns: number; pentestCampaigns: number; codeAssisted: number }> = {
  'paie-express': { qaRuns: 64, pentestCampaigns: 9, codeAssisted: 4 },
  medidossier: { qaRuns: 41, pentestCampaigns: 6, codeAssisted: 0 },
  fintrack: { qaRuns: 92, pentestCampaigns: 7, codeAssisted: 2 },
}

export type AppUsage = {
  id: string
  name: string
  pairs: number
  qa: number
  pentest: number
  codeAssisted: number
  total: number
}

export type BillingSummary = {
  offer: Offer
  codeAssisted: boolean
  apps: number
  included: number
  used: number
  includedLeft: number
  topup: number
  balance: number
  usedPct: number
  monthlyPrice: number
  byApp: AppUsage[]
  wallet: Wallet
  renewsOn: string
  low: boolean
}

export function summarizeBilling(offerId: OfferId, codeAssisted: boolean, wallet: Wallet): BillingSummary {
  const offer = OFFERS[offerId]
  const apps = APPLICATIONS.slice(0, offer.maxApps)
  const scale = offer.id === 'decouverte' ? 0.25 : 1
  const pentestEnabled = offer.plan !== 'qa'

  const byApp = apps.map<AppUsage>((app) => {
    const u = PERIOD_USAGE[app.id] ?? { qaRuns: 0, pentestCampaigns: 0, codeAssisted: 0 }
    const pairs = pairCount(app.companies.length)
    const qa = Math.round(u.qaRuns * scale) * CREDIT_COSTS.qaRun
    const pentest = pentestEnabled ? Math.round(u.pentestCampaigns * scale) * CREDIT_COSTS.pentestPair * pairs : 0
    const ca = codeAssisted ? Math.round(u.codeAssisted * scale) * CREDIT_COSTS.codeAssisted : 0
    return { id: app.id, name: app.name, pairs, qa, pentest, codeAssisted: ca, total: qa + pentest + ca }
  })

  const included = offer.creditsPerApp * apps.length
  const used = byApp.reduce((n, a) => n + a.total, 0)
  const includedLeft = Math.max(0, included - used)
  const overflow = Math.max(0, used - included)
  const topup = Math.max(0, wallet.topup - overflow)
  const balance = includedLeft + topup

  return {
    offer,
    codeAssisted,
    apps: apps.length,
    included,
    used,
    includedLeft,
    topup,
    balance,
    usedPct: included ? Math.min(100, Math.round((used / included) * 100)) : 0,
    monthlyPrice: offer.price * apps.length + (codeAssisted && offer.price ? CODE_ASSISTED_PRICE : 0),
    byApp,
    wallet,
    renewsOn: offer.id === 'decouverte' ? '24 nov.' : '1 déc.',
    low: balance < wallet.threshold,
  }
}

export function formatEuro(value: number) {
  return `${value.toLocaleString('fr-FR')} €`
}

export function formatCredits(value: number) {
  return value.toLocaleString('fr-FR')
}
