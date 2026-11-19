'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { AuditModule, Deployment, Kpi } from '@/lib/audit-types'
import { AuditDetail } from './audit-detail'
import { DeploymentsFeed } from './deployments-feed'
import { MetricsBar } from './metrics-bar'
import { ModuleTabs } from './module-tabs'
import { Topbar } from './topbar'

const SUBSCRIBED: AuditModule[] = ['qa', 'pentest']
const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} $`

type Props = { deployments: Deployment[]; kpis: Kpi[]; cout7j: number; initialModule: AuditModule }

// D-49 : la page Audits de la console v0, sur nos missions réelles. Elle se rafraîchit seule tant qu'une mission tourne.
export function AuditsConsole({ deployments, kpis, cout7j, initialModule }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<AuditModule>(initialModule)
  const [selectedId, setSelectedId] = useState<string>()
  const shown = deployments.filter((d) => d.module === tab)
  const selected = shown.find((d) => d.id === selectedId) ?? shown[0]
  const counts: Record<AuditModule, number> = {
    qa: deployments.filter((d) => d.module === 'qa').length,
    pentest: deployments.filter((d) => d.module === 'pentest').length,
  }
  const live = deployments.some((d) => d.audit.running)
  const last = shown.find((d) => !d.audit.running && d.audit.costUsd > 0)

  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh()
    }, 4000)
    return () => clearInterval(timer)
  }, [live, router])

  return (
    <>
      <Topbar context={selected?.context} />
      <main className="flex flex-1 flex-col gap-4 px-5 py-4 lg:px-6">
        <div className="flex flex-col gap-2 border-b border-border pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[18px] leading-none font-bold tracking-tight text-foreground">Audits</h1>
              <p className="text-[12.5px] text-muted-foreground">Chaque mission laisse ses preuves : seules les failles prouvées sont signalées.</p>
            </div>
            <span className="rounded border border-border px-1.5 font-mono text-[10px] leading-[18px] uppercase tracking-wider text-muted-foreground">
              source : missions réelles
            </span>
          </div>
          <MetricsBar kpis={kpis} lastRunAt={shown[0]?.at} />
        </div>

        <div className="-mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border">
          <ModuleTabs active={tab} subscribed={SUBSCRIBED} counts={counts} onSelect={setTab} onUnlock={() => router.push('/app/facturation')} />
          <Link href="/app/facturation" className="mb-1.5 font-mono text-[10.5px] text-muted-foreground transition-colors hover:text-foreground">
            coût mesuré{last ? ` · ${euros(last.audit.costUsd)} le dernier audit` : ''} · 7 jours : {euros(cout7j)}
          </Link>
        </div>

        <div
          role="tabpanel"
          aria-label={tab === 'qa' ? 'Audits QA' : 'Audits Pentest'}
          className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]"
        >
          <div className="lg:sticky lg:top-16">
            <DeploymentsFeed deployments={shown} selectedId={selected?.id} onSelect={setSelectedId} live={live} />
          </div>
          <AuditDetail deployment={selected} activeStep={null} />
        </div>
      </main>
      <footer className="border-t border-border px-5 py-2.5 font-mono text-[10px] text-subtle lg:px-6">
        Agents H Company · plans et hypothèses Hugging Face · alertes n8n · hébergé sur Vercel
      </footer>
    </>
  )
}
