export type Kpi = {
  id: string
  label: string
  value: string
  hint: string
}

export type PipelineStep = {
  id: string
  title: string
  actor: 'agent' | 'code' | 'result'
  actorLabel: string
  description: string
  meta: string
  status: 'done' | 'proven' | 'clear'
}

export type MatrixCell = 'allowed' | 'blocked' | 'leak' | 'na'

export type RoleMatrix = {
  /** L'en-tête de la première colonne : « Rôle » par défaut, « Action » quand les lignes sont des actions (D-49). */
  corner?: string
  actions: string[]
  rows: { role: string; tenant: string; cells: MatrixCell[] }[]
}

export type Finding = {
  id: string
  severity: 'critique' | 'élevée' | 'moyenne' | 'faible'
  title: string
  summary: string
  endpoint: string
  replay: { request: string; response: string; responseLabel?: string }
  report: string[]
  /** D-49 : le ticket et l'e-mail n'existent que si n8n les a vraiment créés. */
  alerts: {
    ticket: { id: string; url: string } | null
    email: { via: string; recipients: string } | null
  }
  href?: string
}

export type Criterion = { label: string; status: 'passed' | 'failed' | 'inconclusive' | 'skipped'; detail: string }

export type AuditDetail = {
  id: string
  durationSeconds: number
  costUsd: number
  pipeline: PipelineStep[]
  matrix: RoleMatrix | null
  finding: Finding | null
  /** D-49 : les critères QA vérifiés, le lien du rapport complet et l'état réel de la mission. */
  criteria?: Criterion[]
  reportHref?: string
  running?: boolean
  inconclusive?: number
}

export type AuditModule = 'qa' | 'pentest'

export type Deployment = {
  id: string
  module: AuditModule
  commit: string
  message: string
  author: string
  branch: string
  at: string
  vulnerabilities: number
  audit: AuditDetail
  /** D-49 : le contexte réel de la cible (application, environnement, comptes, autorisation). */
  context?: AuditResponse['context'] & { authorization?: string }
}

export type AuditResponse = {
  source: 'mock' | 'orchestrator'
  context: {
    app: string
    environment: string
    tenants: string
    ownershipVerified: boolean
  }
  kpis: Kpi[]
  deployments: Deployment[]
}
