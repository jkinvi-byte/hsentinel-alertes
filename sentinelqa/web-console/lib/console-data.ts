export type Company = { id: string; name: string; roles: string[] }

export type Application = {
  id: string
  name: string
  url: string
  environment: string
  sector: string
  status: 'faille' | 'sain' | 'en cours'
  lastAuditAt: string
  openFindings: number
  companies: Company[]
  /** Données réelles (D-49) : l'autorisation, les écritures permises, la veille et les scénarios du catalogue. */
  authorization?: string
  writes?: boolean
  watch?: { active: boolean; seenAt?: string; updatedAt?: string }
  scenarios?: { id: string; name: string; module: 'QA' | 'Pentest'; available: boolean }[]
  qa?: { connexion: boolean; modes: string[] }
  /** D-56 : ajoutée dans la console par son responsable (sinon, un exemple phare du catalogue). */
  ajoutee?: boolean
}

export type BrowserAction = {
  kind: 'navigate' | 'click' | 'type' | 'extract' | 'assert'
  label: string
  url: string
}

export type BrowserSession = {
  id: string
  app: string
  agent: 'Explorateur' | 'Vérificateur' | 'Agent QA'
  persona: string
  status: 'en cours' | 'terminée' | 'faille'
  startedAt: string
  pages: number
  actions: BrowserAction[]
}

export type ActivityEvent = {
  id: string
  at: string
  kind: 'finding' | 'audit' | 'session' | 'ticket' | 'deploy' | 'fix'
  title: string
  detail: string
  app: string
  href?: string
}

export type FindingTimelineStep = {
  at: string
  actor: string
  title: string
  detail: string
  tone: 'neutral' | 'danger' | 'safe' | 'info'
}

export type DiagnosticFinding = {
  id: string
  title: string
  severity: 'critique' | 'élevée' | 'moyenne' | 'faible'
  status: 'ouverte' | 'corrigée'
  app: string
  module: 'Pentest' | 'QA'
  endpoint: string
  attacker: string
  victim: string
  introducedAt: string
  introducedCommit: string
  introducedBy: string
  detectedAt: string
  lastConfirmedAt: string
  resolvedAt?: string
  summary: string
  impact: string
  cause: string
  fix: string
  dataExposed: string[]
  timeline: FindingTimelineStep[]
  /** Données réelles (D-49) : la cible, le ticket GitHub et la session H de la preuve, quand ils existent. */
  origin?: string
  appId?: string
  ticket?: number
  /** Le libellé de l'alerte n8n (envoyée, en échec, réservée à la console pour un site tiers : D-44). */
  alertLabel?: string
  replay?: string
  /** Le thème du constat (lecture, ecriture, admin…), la similarité du rejeu HTTP, la confirmation à l'écran et le nombre de preuves. */
  theme?: string
  similarity?: number | null
  confirmedOnScreen?: boolean
  occurrences?: number
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

// Une date absente ou illisible s'affiche « — » : Intl lève une erreur sur une date invalide, qui ferait tomber toute la page.
const formatter = (fmt: Intl.DateTimeFormat) => (iso: string) => (Number.isNaN(Date.parse(iso)) ? '—' : fmt.format(new Date(iso)))
export const formatDateTime = formatter(dateFmt)
export const formatDay = formatter(dayFmt)
export const formatTime = formatter(timeFmt)

// Un nombre et son unité ne se séparent jamais en fin de ligne (espace fine insécable) : sur téléphone, « 3,09 » restait
// sur une ligne et « $ » passait seul à la suivante. Relevé par notre propre agent QA sur la console (D-53, 19/11).
export const FINE = '\u202f'
/** Un coût en dollars ; sous le centime, trois décimales (un coût réel de quelques millièmes ne s'affiche pas « 0,00 $ »). */
export function montant(n: number | null | undefined, chiffres = 2) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return `${n.toFixed(n > 0 && n < 0.01 ? 3 : chiffres).replace('.', ',')}${FINE}$`
}

export function formatAge(fromIso: string, toIso: string = new Date().toISOString()) {
  const minutes = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h`
  return `${Math.round(hours / 24)} j`
}
