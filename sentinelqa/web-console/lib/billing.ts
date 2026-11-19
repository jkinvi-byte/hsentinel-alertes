import type { Plan } from './plan'

// Le modèle de prix de HSentinel (D-49) : les offres et le barème affichés sur /tarifs et dans la console.
// Aucun portefeuille ni paiement n'est branché : le portefeuille simulé de v0 (crédits, recharges, plafonds) est retiré.
export type OfferId = 'decouverte' | 'launch' | 'scale'

export const ANNUAL_DISCOUNT = 0.85
export const CODE_ASSISTED_PRICE = 199
export const AUDIT_EXPRESS_PRICE = 790

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

export function formatEuro(value: number) {
  return `${value.toLocaleString('fr-FR')} €`
}

export function formatCredits(value: number) {
  return value.toLocaleString('fr-FR')
}
