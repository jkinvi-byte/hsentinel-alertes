import { ArrowUpRight, CircleCheck, CircleHelp } from 'lucide-react'
import Link from 'next/link'
import type { Criterion, Deployment } from '@/lib/audit-types'
import { FINE, montant } from '@/lib/console-data'
import { cn } from '@/lib/utils'
import { VulnChip } from './deployments-feed'
import { FindingCard } from './finding-card'
import { PipelineTimeline } from './pipeline-timeline'
import { RoleMatrix } from './role-matrix'

type AuditDetailProps = {
  deployment?: Deployment
  activeStep: number | null
}

const CRITERE: Record<Criterion['status'], { label: string; className: string }> = {
  passed: { label: 'conforme ✓', className: 'text-safe' },
  failed: { label: 'ÉCART', className: 'rounded border border-danger/50 bg-danger/10 px-1.5 font-semibold text-danger' },
  inconclusive: { label: 'à confirmer', className: 'text-warn' },
  skipped: { label: 'non testé', className: 'text-subtle' },
}

export function AuditDetail({ deployment, activeStep }: AuditDetailProps) {
  if (!deployment) {
    return (
      <div className="panel flex flex-col items-center gap-2 px-4 py-14 text-center">
        <p className="text-[13px] font-medium text-foreground">Aucune mission dans ce volet</p>
        <Link href="/app/nouveau" className="text-[12.5px] text-steel hover:underline">
          Lancer un premier audit
        </Link>
      </div>
    )
  }
  const { audit } = deployment
  // Une mission en cours n'a pas de pipeline simulé : on montre ce qui est déjà mesuré, et le lien du suivi en direct.
  const auditing = activeStep !== null || audit.running === true
  const qa = deployment.module === 'qa'

  return (
    <section aria-labelledby="audit-title" className="panel flex flex-col">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="label-mono">
            <span className="mr-1.5 rounded border border-steel/40 px-1 text-steel">{qa ? 'QA' : 'Pentest'}</span>
            Audit <span className="text-foreground">{audit.id}</span> <span className="text-subtle">·</span> {deployment.commit}{' '}
            <span className="text-subtle">·</span> {deployment.branch}
          </p>
          <h2 id="audit-title" className="truncate text-[15px] leading-tight font-semibold text-foreground">
            {deployment.message}
          </h2>
        </div>
        <dl className="flex items-center gap-3 font-mono text-[10.5px] text-muted-foreground">
          <div className="flex gap-1">
            <dt className="text-subtle">durée</dt>
            <dd className="tabular-nums text-foreground">{audit.durationSeconds}{FINE}s</dd>
          </div>
          <div className="flex gap-1">
            <dt className="text-subtle">coût</dt>
            <dd className="tabular-nums text-foreground">{montant(audit.costUsd)}</dd>
          </div>
          {!auditing ? <VulnChip count={deployment.vulnerabilities} noun={qa ? 'écart' : 'faille'} /> : null}
        </dl>
      </header>

      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2.5">
          <h3 className="label-mono">Pipeline</h3>
          <PipelineTimeline steps={audit.pipeline} activeIndex={activeStep} />
        </div>

        {!auditing ? (
          <>
            {audit.matrix ? (
              <div className="flex flex-col gap-2">
                <h3 className="label-mono">Matrice action × compte</h3>
                <RoleMatrix matrix={audit.matrix} />
              </div>
            ) : null}
            {audit.criteria?.length ? (
              <div className="flex flex-col gap-2">
                <h3 className="label-mono">Critères vérifiés</h3>
                <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                  {audit.criteria.map((c, i) => (
                    <li key={`${c.label}-${i}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-3 py-1.5">
                      <span className={cn('inline-flex shrink-0 font-mono text-[10.5px] leading-[18px]', CRITERE[c.status]?.className)}>
                        {CRITERE[c.status]?.label ?? c.status}
                      </span>
                      <span className="min-w-0 flex-1 text-[12.5px] text-foreground">{c.label}</span>
                      {c.detail ? <span className="w-full text-[11.5px] text-muted-foreground">{c.detail}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {audit.finding ? (
              <FindingCard finding={audit.finding} />
            ) : deployment.vulnerabilities === 0 ? (
              <p className={cn('flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[12.5px]', audit.inconclusive ? 'text-warn' : 'text-safe')}>
                {audit.inconclusive ? <CircleHelp className="size-3.5 shrink-0" aria-hidden="true" /> : <CircleCheck className="size-3.5 shrink-0" aria-hidden="true" />}
                {qa
                  ? audit.inconclusive
                    ? `Aucun écart prouvé ; ${audit.inconclusive} critère${audit.inconclusive > 1 ? 's' : ''} à confirmer.`
                    : 'Aucun écart : chaque critère vérifié est conforme.'
                  : 'Aucune faille prouvée sur les contrôles menés.'}
              </p>
            ) : null}
          </>
        ) : (
          <p role="status" className="font-mono text-[11px] text-steel">
            Audit en cours — les agents travaillent ; la page se met à jour d’elle-même.
          </p>
        )}

        {audit.reportHref ? (
          <Link href={audit.reportHref} className="inline-flex items-center gap-1 self-start text-[12.5px] font-medium text-steel hover:underline">
            {auditing ? 'Suivre la mission en direct' : 'Rapport complet, captures et sessions H'}
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </section>
  )
}
