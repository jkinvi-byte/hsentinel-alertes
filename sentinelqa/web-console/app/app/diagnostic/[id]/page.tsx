import { CalendarClock, ExternalLink, RefreshCw, Repeat } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExploitReplay } from '@/components/console/diagnostic/exploit-replay'
import { FindingTimeline } from '@/components/console/diagnostic/finding-timeline'
import { Card, PageHeader, primaryButton, secondaryButton } from '@/components/console/page-header'
import { formatAge, formatDateTime, formatDay } from '@/lib/console-data'
import { chargerConsole, DEPOT_TICKETS, failles } from '@/lib/console-reel'
import { cn } from '@/lib/utils'

async function trouver(id: string) {
  return failles(await chargerConsole()).find((f) => f.id === id)
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const finding = await trouver((await params).id)
  return { title: finding ? `${finding.title} — Diagnostic HSentinel` : 'Diagnostic — HSentinel' }
}

export default async function DiagnosticPage({ params }: { params: Promise<{ id: string }> }) {
  const finding = await trouver((await params).id)
  if (!finding) notFound()
  const open = finding.status === 'ouverte'
  const fois = finding.occurrences ?? 1

  // La date d'introduction n'est pas connue (aucun commit relié) : on montre ce qu'on a mesuré, sans l'inventer.
  const dates = [
    { icon: CalendarClock, label: 'Détectée', value: formatDateTime(finding.detectedAt), hint: 'premier audit qui l’a prouvée' },
    open
      ? { icon: CalendarClock, label: 'Toujours présente', value: formatDateTime(finding.lastConfirmedAt), hint: `ouverte depuis ${formatAge(finding.detectedAt)}` }
      : { icon: CalendarClock, label: 'Corrigée', value: formatDateTime(finding.resolvedAt ?? finding.lastConfirmedAt), hint: `en ${formatAge(finding.detectedAt, finding.resolvedAt)}` },
    {
      icon: Repeat,
      label: 'Prouvée',
      value: `${fois} fois`,
      hint: finding.confirmedOnScreen ? 'rejeu HTTP, puis vue à l’écran par l’agent H' : 'rejeu HTTP',
    },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', href: '/app' }, { label: 'Diagnostics', href: '/app/diagnostic' }, { label: finding.id.slice(0, 8) }]}
        title={finding.title}
        description={finding.summary}
        actions={
          <>
            <Link href={`/app/nouveau?volet=${finding.module === 'QA' ? 'qa' : 'pentest'}&cible=${encodeURIComponent(finding.appId ?? '')}`} className={secondaryButton}>
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Re-tester
            </Link>
            {finding.ticket ? (
              <a href={`${DEPOT_TICKETS}/${finding.ticket}`} target="_blank" rel="noreferrer" className={primaryButton}>
                Ticket GitHub #{finding.ticket}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className={cn('rounded border px-1.5 leading-[20px] font-semibold uppercase tracking-wider', open ? 'border-danger/50 bg-danger/10 text-danger' : 'border-safe/40 bg-safe/10 text-safe')}>
            {open ? `${finding.severity} · ouverte` : 'corrigée'}
          </span>
          {[finding.id.slice(0, 8), finding.app, finding.module, `${finding.attacker} → ${finding.victim}`, finding.alertLabel ?? ''].filter(Boolean).map((tag) => (
            <span key={tag} className="rounded border border-border px-1.5 leading-[20px] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </PageHeader>

      <main className="flex flex-col gap-5 px-5 py-6 lg:px-8">
        <dl className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {dates.map((d) => (
            <div key={d.label} className="flex flex-col gap-1 bg-card px-4 py-3.5">
              <dt className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <d.icon className="size-3.5" aria-hidden="true" />
                {d.label}
              </dt>
              <dd className="text-[14px] font-semibold text-foreground">{d.value}</dd>
              <dd className="font-mono text-[10.5px] text-subtle">{d.hint}</dd>
            </div>
          ))}
        </dl>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex min-w-0 flex-col gap-5">
            <ExploitReplay finding={finding} />

            <Card title="Détails de la faille">
              <dl className="grid gap-px bg-border md:grid-cols-2">
                {[
                  ['Impact', finding.impact],
                  ['Cause', finding.cause],
                  ['Correctif recommandé', finding.fix],
                  ['Requête vulnérable', finding.endpoint],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 bg-card px-4 py-3">
                    <dt className="label-mono">{label}</dt>
                    <dd className={cn('text-[12.5px] leading-relaxed text-foreground', label === 'Requête vulnérable' && 'font-mono text-[11.5px] break-all text-danger')}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-3">
                <span className="mr-1 text-[12px] text-muted-foreground">Données exposées :</span>
                {(finding.dataExposed.length ? finding.dataExposed : ['aucune catégorie relevée']).map((d) => (
                  <span key={d} className="rounded-full border border-danger/30 bg-danger/[0.06] px-2 py-0.5 text-[11.5px] text-danger">
                    {d}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Actions menées" action={<span className="font-mono text-[10.5px] text-subtle">depuis le {formatDay(finding.detectedAt)}</span>}>
            <div className="px-4 py-3">
              <FindingTimeline steps={finding.timeline} />
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
