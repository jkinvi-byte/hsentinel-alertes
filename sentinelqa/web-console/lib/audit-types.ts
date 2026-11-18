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
  actions: string[]
  rows: { role: string; tenant: string; cells: MatrixCell[] }[]
}

export type Finding = {
  id: string
  severity: 'critique'
  title: string
  summary: string
  endpoint: string
  replay: { request: string; response: string }
  report: string[]
  alerts: {
    ticket: { id: string; url: string }
    email: { via: string; recipients: string }
  }
}

export type AuditDetail = {
  id: string
  durationSeconds: number
  costUsd: number
  pipeline: PipelineStep[]
  matrix: RoleMatrix
  finding: Finding | null
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
