'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { AuditModule, Deployment, Kpi } from '@/lib/audit-types'
import { AuditDetail } from './audit-detail'
import { DeploymentsFeed } from './deployments-feed'
import { MetricsBar } from './metrics-bar'
import { ModuleTabs } from './module-tabs'
import { PageHeader, primaryButton } from './page-header'

const SUBSCRIBED: AuditModule[] = ['qa', 'pentest']

type Props = { deployments: Deployment[]; kpis: Kpi[]; initialModule: AuditModule }

// D-49 puis D-55 : la page des missions, dans l'habillage Lovable, sur nos missions réelles. Elle se rafraîchit seule tant
// qu'une mission tourne. Les dollars n'y sont plus en vitrine : ils restent dans « Offre et utilisation ».
export function AuditsConsole({ deployments, kpis, initialModule }: Props) {
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

  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      if (!document.hidden) router.refresh()
    }, 4000)
    return () => clearInterval(timer)
  }, [live, router])

  return (
    <>
      <PageHeader crumbs={[{ label: 'Missions' }]} title="Vos missions"
        description="Chaque mission laisse ses preuves : seules les failles prouvées et les écarts constatés sont signalés."
        actions={<Link href="/app/nouveau" className={primaryButton}><Plus aria-hidden="true" />Nouvelle mission</Link>} />
      <main className="lv-contenu flex flex-1 flex-col gap-5">
        <MetricsBar kpis={kpis} lastRunAt={shown[0]?.at} />
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border">
          <ModuleTabs active={tab} subscribed={SUBSCRIBED} counts={counts} onSelect={setTab} onUnlock={() => router.push('/app/facturation')} />
          {live ? (
            <span className="lv-pill mb-2" data-ton="bleu" role="status">
              <span className="lv-pulsation" aria-hidden="true" />Une mission tourne · actualisation toutes les 4 s
            </span>
          ) : null}
        </div>

        <div
          role="tabpanel"
          aria-label={tab === 'qa' ? 'Missions QA' : 'Missions Pentest'}
          className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(280px,330px)_minmax(0,1fr)]"
        >
          <div className="lg:sticky lg:top-20">
            <DeploymentsFeed deployments={shown} selectedId={selected?.id} onSelect={setSelectedId} live={live} />
          </div>
          <AuditDetail deployment={selected} activeStep={null} />
        </div>
      </main>
    </>
  )
}
