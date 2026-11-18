import { CircleCheck } from 'lucide-react'
import type { Deployment } from '@/lib/audit-types'
import { VulnChip } from './deployments-feed'
import { FindingCard } from './finding-card'
import { PipelineTimeline } from './pipeline-timeline'
import { RoleMatrix } from './role-matrix'

type AuditDetailProps = {
  deployment?: Deployment
  activeStep: number | null
}

export function AuditDetail({ deployment, activeStep }: AuditDetailProps) {
  if (!deployment) {
    return <div className="panel h-[480px] animate-pulse" aria-label="Chargement de l’audit" />
  }
  const { audit } = deployment
  const auditing = activeStep !== null

  return (
    <section aria-labelledby="audit-title" className="panel flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="label-mono">
            <span className="mr-1.5 rounded border border-steel/40 px-1 text-steel">
              {deployment.module === 'qa' ? 'QA' : 'Pentest'}
            </span>
            Audit <span className="text-foreground">{audit.id}</span> <span className="text-subtle">·</span> {deployment.commit}{' '}
            <span className="text-subtle">·</span> {deployment.branch}
          </p>
          <h2 id="audit-title" className="truncate text-[15px] leading-tight font-semibold text-white">
            {deployment.message}
          </h2>
        </div>
        <dl className="flex items-center gap-3 font-mono text-[10.5px] text-muted-foreground">
          <div className="flex gap-1">
            <dt className="text-subtle">durée</dt>
            <dd className="tabular-nums text-foreground">{audit.durationSeconds} s</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-subtle">coût</dt>
            <dd className="tabular-nums text-foreground">{audit.costUsd.toFixed(2).replace('.', ',')} $</dd>
          </div>
          {!auditing ? <VulnChip count={deployment.vulnerabilities} /> : null}
        </dl>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2.5">
          <h3 className="label-mono">Pipeline</h3>
          <PipelineTimeline steps={audit.pipeline} activeIndex={activeStep} />
        </div>

        {!auditing ? (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="label-mono">Matrice rôle × action</h3>
              <RoleMatrix matrix={audit.matrix} />
            </div>
            {audit.finding ? (
              <FindingCard finding={audit.finding} />
            ) : (
              <p className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[12.5px] text-safe">
                <CircleCheck className="size-3.5 shrink-0" aria-hidden="true" />
                {deployment.module === 'qa'
                  ? 'Aucune régression : chaque rôle obtient exactement ce qui est attendu sur ce déploiement.'
                  : 'Aucune faille : toutes les frontières entre entreprises tiennent sur ce déploiement.'}
              </p>
            )}
          </>
        ) : (
          <p role="status" className="font-mono text-[11px] text-steel">
            Audit en cours — les agents rejouent les parcours…
          </p>
        )}
      </div>
    </section>
  )
}
