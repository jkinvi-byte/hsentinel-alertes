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
  severity: 'critique' | 'élevée' | 'moyenne'
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
}

export const APPLICATIONS: Application[] = [
  {
    id: 'paie-express',
    name: 'Paie Express',
    url: 'preprod.paie-express.fr',
    environment: 'préprod',
    sector: 'RH et paie',
    status: 'faille',
    lastAuditAt: '2026-11-18T09:48:00Z',
    openFindings: 1,
    companies: [
      { id: 'alpha', name: 'Alpha', roles: ['Admin', 'Comptable'] },
      { id: 'beta', name: 'Bêta', roles: ['Admin'] },
      { id: 'gamma', name: 'Gamma', roles: ['Admin', 'Salarié'] },
    ],
  },
  {
    id: 'medidossier',
    name: 'MédiDossier',
    url: 'staging.medidossier.io',
    environment: 'staging',
    sector: 'Santé',
    status: 'sain',
    lastAuditAt: '2026-11-18T07:12:00Z',
    openFindings: 0,
    companies: [
      { id: 'clinique-nord', name: 'Clinique Nord', roles: ['Médecin', 'Secrétariat'] },
      { id: 'cabinet-sud', name: 'Cabinet Sud', roles: ['Médecin'] },
    ],
  },
  {
    id: 'fintrack',
    name: 'FinTrack',
    url: 'preprod.fintrack.app',
    environment: 'préprod',
    sector: 'Fintech',
    status: 'en cours',
    lastAuditAt: '2026-11-19T08:02:00Z',
    openFindings: 0,
    companies: [
      { id: 'orion', name: 'Orion SAS', roles: ['Trésorier', 'Lecteur'] },
      { id: 'vega', name: 'Vega Group', roles: ['Trésorier'] },
      { id: 'lyra', name: 'Lyra Capital', roles: ['Admin'] },
      { id: 'altair', name: 'Altair', roles: ['Admin', 'Auditeur'] },
    ],
  },
]

export const BROWSER_SESSIONS: BrowserSession[] = [
  {
    id: 'bs_9f12',
    app: 'FinTrack',
    agent: 'Explorateur',
    persona: 'Trésorier · Orion SAS',
    status: 'en cours',
    startedAt: '2026-11-19T08:02:00Z',
    pages: 14,
    actions: [
      { kind: 'navigate', label: 'Ouvre le tableau de bord', url: '/dashboard' },
      { kind: 'click', label: 'Clique sur « Virements »', url: '/transfers' },
      { kind: 'click', label: 'Ouvre le virement #4821', url: '/transfers/4821' },
      { kind: 'extract', label: 'Relève l’IBAN bénéficiaire', url: '/transfers/4821' },
      { kind: 'navigate', label: 'Ouvre « Comptes »', url: '/accounts' },
      { kind: 'type', label: 'Filtre « EUR »', url: '/accounts?currency=EUR' },
      { kind: 'assert', label: 'Vérifie 3 comptes Orion visibles', url: '/accounts?currency=EUR' },
    ],
  },
  {
    id: 'bs_8c40',
    app: 'Paie Express',
    agent: 'Vérificateur',
    persona: 'Admin · Bêta',
    status: 'faille',
    startedAt: '2026-11-18T09:46:00Z',
    pages: 3,
    actions: [
      { kind: 'navigate', label: 'Ouvre ses propres bulletins', url: '/companies/beta/payslips' },
      { kind: 'type', label: 'Remplace beta par alpha', url: '/companies/alpha/payslips' },
      { kind: 'assert', label: 'Salaires d’Alpha affichés', url: '/companies/alpha/payslips' },
    ],
  },
  {
    id: 'bs_7a11',
    app: 'MédiDossier',
    agent: 'Agent QA',
    persona: 'Médecin · Clinique Nord',
    status: 'terminée',
    startedAt: '2026-11-18T07:10:00Z',
    pages: 21,
    actions: [
      { kind: 'navigate', label: 'Ouvre la liste des patients', url: '/patients' },
      { kind: 'click', label: 'Ouvre le dossier P-2291', url: '/patients/2291' },
      { kind: 'assert', label: 'Ordonnances visibles', url: '/patients/2291/rx' },
    ],
  },
]

export const ACTIVITY: ActivityEvent[] = [
  { id: 'e1', at: '2026-11-19T08:02:00Z', kind: 'session', title: 'Session navigateur démarrée', detail: 'Explorateur · Trésorier Orion SAS', app: 'FinTrack' },
  { id: 'e2', at: '2026-11-19T07:58:00Z', kind: 'deploy', title: 'Déploiement détecté', detail: 'commit c19ab02 · « Export CSV des virements »', app: 'FinTrack' },
  { id: 'e3', at: '2026-11-18T09:49:00Z', kind: 'ticket', title: 'Ticket GitHub #142 ouvert', detail: 'E-mail envoyé à l’équipe sécurité via n8n', app: 'Paie Express', href: '/app/diagnostic/HS-2026-0142' },
  { id: 'e4', at: '2026-11-18T09:48:00Z', kind: 'finding', title: 'Faille critique prouvée', detail: 'Bêta lit les bulletins de paie d’Alpha', app: 'Paie Express', href: '/app/diagnostic/HS-2026-0142' },
  { id: 'e5', at: '2026-11-18T09:42:00Z', kind: 'audit', title: 'Audit Pentest lancé', detail: 'commit 8f21c4e · « Refonte de l’export des bulletins »', app: 'Paie Express', href: '/app/audits' },
  { id: 'e6', at: '2026-11-18T07:14:00Z', kind: 'audit', title: 'Audit QA terminé', detail: '21 pages · aucune régression', app: 'MédiDossier', href: '/app/audits' },
  { id: 'e7', at: '2026-11-16T14:20:00Z', kind: 'fix', title: 'Faille corrigée et re-testée', detail: 'HS-2026-0131 · export IBAN Gamma', app: 'Paie Express', href: '/app/diagnostic/HS-2026-0131' },
]

export const FINDINGS: DiagnosticFinding[] = [
  {
    id: 'HS-2026-0142',
    title: 'Une autre entreprise peut lire les salaires de vos employés',
    severity: 'critique',
    status: 'ouverte',
    app: 'Paie Express',
    module: 'Pentest',
    endpoint: 'GET /api/companies/alpha/payslips?month=2026-10',
    attacker: 'Admin · Bêta',
    victim: 'Alpha',
    introducedAt: '2026-11-18T09:40:00Z',
    introducedCommit: '8f21c4e',
    introducedBy: 'camille.r',
    detectedAt: '2026-11-18T09:48:00Z',
    lastConfirmedAt: '2026-11-19T06:00:00Z',
    summary:
      'Un administrateur de Bêta obtient les bulletins de paie d’Alpha en changeant l’identifiant d’entreprise dans l’URL.',
    impact: '48 bulletins de paie d’Alpha (noms, salaires nets, IBAN partiels) lisibles par n’importe quel administrateur d’une autre entreprise.',
    cause: 'Le contrôleur payslips filtre par companyId issu de l’URL au lieu de celui porté par la session.',
    fix: 'Dériver companyId de la session et renvoyer 404 si la ressource n’appartient pas à l’entreprise courante.',
    dataExposed: ['Noms des salariés', 'Salaires nets', 'IBAN partiels', 'Période de paie'],
    timeline: [
      { at: '2026-11-18T09:40:00Z', actor: 'camille.r', title: 'Faille introduite', detail: 'Commit 8f21c4e poussé en préprod : « Refonte de l’export des bulletins ».', tone: 'neutral' },
      { at: '2026-11-18T09:42:00Z', actor: 'Webhook CI', title: 'Audit Pentest déclenché', detail: 'Déploiement détecté sur preprod.paie-express.fr.', tone: 'info' },
      { at: '2026-11-18T09:44:00Z', actor: 'Explorateur', title: 'Cartographie en tant qu’Alpha', detail: '27 pages parcourues, 41 requêtes authentifiées enregistrées.', tone: 'info' },
      { at: '2026-11-18T09:46:00Z', actor: 'Rejeu HTTP', title: 'Rejeu avec la session de Bêta', detail: '41 requêtes rejouées · 1 réponse 200 au lieu de 403.', tone: 'danger' },
      { at: '2026-11-18T09:47:00Z', actor: 'Vérificateur', title: 'Confirmation dans le navigateur', detail: 'La page des bulletins d’Alpha s’affiche pour l’admin de Bêta. Capture enregistrée.', tone: 'danger' },
      { at: '2026-11-18T09:48:00Z', actor: 'HSentinel', title: 'Faille prouvée · critique', detail: 'Sévérité calculée : données personnelles et financières, inter-entreprises.', tone: 'danger' },
      { at: '2026-11-18T09:49:00Z', actor: 'n8n', title: 'Ticket GitHub #142 et e-mail', detail: 'Un seul ticket, sans aucune donnée sensible.', tone: 'neutral' },
      { at: '2026-11-19T06:00:00Z', actor: 'Planificateur', title: 'Re-test nocturne', detail: 'La faille est toujours reproductible.', tone: 'danger' },
    ],
  },
  {
    id: 'HS-2026-0131',
    title: 'L’export IBAN de Gamma accessible depuis Alpha',
    severity: 'élevée',
    status: 'corrigée',
    app: 'Paie Express',
    module: 'Pentest',
    endpoint: 'GET /api/exports/iban?company=gamma',
    attacker: 'Comptable · Alpha',
    victim: 'Gamma',
    introducedAt: '2026-11-12T15:02:00Z',
    introducedCommit: 'a41d77c',
    introducedBy: 'nicolas.b',
    detectedAt: '2026-11-12T15:09:00Z',
    lastConfirmedAt: '2026-11-15T06:00:00Z',
    resolvedAt: '2026-11-16T14:20:00Z',
    summary: 'Le paramètre company de l’export IBAN n’était pas vérifié contre la session.',
    impact: 'IBAN complets de 12 salariés de Gamma exportables en CSV.',
    cause: 'Paramètre de requête utilisé sans contrôle d’appartenance.',
    fix: 'Contrôle d’appartenance ajouté dans le middleware d’export (commit e90b3f1).',
    dataExposed: ['IBAN complets', 'Noms des salariés'],
    timeline: [
      { at: '2026-11-12T15:02:00Z', actor: 'nicolas.b', title: 'Faille introduite', detail: 'Commit a41d77c.', tone: 'neutral' },
      { at: '2026-11-12T15:09:00Z', actor: 'HSentinel', title: 'Faille prouvée', detail: 'Rejeu + capture du Vérificateur.', tone: 'danger' },
      { at: '2026-11-16T14:12:00Z', actor: 'nicolas.b', title: 'Correctif déployé', detail: 'Commit e90b3f1.', tone: 'info' },
      { at: '2026-11-16T14:20:00Z', actor: 'HSentinel', title: 'Re-test : corrigée', detail: 'Réponse 404 obtenue avec la session d’Alpha.', tone: 'safe' },
    ],
  },
]

export function getFinding(id: string) {
  return FINDINGS.find((f) => f.id === id)
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const dayFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

export const formatDateTime = (iso: string) => dateFmt.format(new Date(iso))
export const formatDay = (iso: string) => dayFmt.format(new Date(iso))
export const formatTime = (iso: string) => timeFmt.format(new Date(iso))

export const NOW = '2026-11-19T09:00:00Z'

export function formatAge(fromIso: string, toIso: string = NOW) {
  const minutes = Math.max(0, Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h`
  return `${Math.round(hours / 24)} j`
}
