import { getMockAudit, simulateDeployment } from './audit-mock'
import type { AuditModule, AuditResponse, Deployment } from './audit-types'

function orchestratorUrl(path: string) {
  const base = process.env.ORCHESTRATOR_URL
  if (!base) return null
  return new URL(path, base.endsWith('/') ? base : `${base}/`).toString()
}

export async function fetchAudit(): Promise<AuditResponse> {
  const url = orchestratorUrl('audit')
  if (!url) return getMockAudit()

  const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Orchestrator responded ${res.status}`)
  const data = (await res.json()) as Omit<AuditResponse, 'source'>
  return { ...data, source: 'orchestrator' }
}

export async function triggerDeployment(module: AuditModule): Promise<Deployment> {
  const url = orchestratorUrl('deployments')
  if (!url) return simulateDeployment(module)

  const res = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ module }),
  })
  if (!res.ok) throw new Error(`Orchestrator responded ${res.status}`)
  return (await res.json()) as Deployment
}
