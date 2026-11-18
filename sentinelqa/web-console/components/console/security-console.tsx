'use client'

import { useRef, useState } from 'react'
import useSWR from 'swr'
import type { AuditModule, AuditResponse, Deployment } from '@/lib/audit-types'
import { PLAN_COOKIE, PLAN_MODULES, writePreferenceCookie, type Plan } from '@/lib/plan'
import { AuditDetail } from './audit-detail'
import { DeploymentsFeed } from './deployments-feed'
import { MetricsBar } from './metrics-bar'
import { ModuleTabs, PlanSelect } from './module-tabs'
import { Topbar } from './topbar'

const fetcher = async (url: string): Promise<AuditResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Erreur de chargement')
  return res.json()
}

const STEP_MS = 900

export function SecurityConsole({ initialPlan }: { initialPlan: Plan }) {
  const { data, error, mutate } = useSWR('/api/audit', fetcher, { revalidateOnFocus: false })
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const [tab, setTab] = useState<AuditModule>('pentest')
  const [selectedId, setSelectedId] = useState<string>()
  const [simulating, setSimulating] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const subscribed = PLAN_MODULES[plan]
  const activeModule = subscribed.includes(tab) ? tab : subscribed[0]
  const deployments = data?.deployments.filter((d) => d.module === activeModule)
  const selected = deployments?.find((d) => d.id === selectedId) ?? deployments?.[0]
  const counts: Record<AuditModule, number> = {
    qa: data?.deployments.filter((d) => d.module === 'qa').length ?? 0,
    pentest: data?.deployments.filter((d) => d.module === 'pentest').length ?? 0,
  }

  function stopAudit() {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
    setActiveStep(null)
  }

  function changePlan(next: Plan) {
    stopAudit()
    setPlan(next)
    writePreferenceCookie(PLAN_COOKIE, next)
  }

  function selectModule(module: AuditModule) {
    stopAudit()
    setTab(module)
  }

  function runAudit(target?: Deployment) {
    const dep = target ?? selected
    if (!dep) return
    if (timer.current) clearInterval(timer.current)
    setSelectedId(dep.id)
    setActiveStep(0)
    let step = 0
    timer.current = setInterval(() => {
      step += 1
      if (step >= dep.audit.pipeline.length) {
        stopAudit()
        return
      }
      setActiveStep(step)
    }, STEP_MS)
  }

  async function simulateDeployment() {
    setSimulating(true)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate-deployment', module: activeModule }),
      })
      if (!res.ok) throw new Error('Simulation impossible')
      const dep = (await res.json()) as Deployment
      await mutate((cur) => (cur ? { ...cur, deployments: [dep, ...cur.deployments] } : cur), { revalidate: false })
      runAudit(dep)
    } catch (err) {
      console.error('[v0] simulate failed', err)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <>
      <Topbar
        context={data?.context}
        onSimulate={simulateDeployment}
        onRunAudit={() => runAudit()}
        simulating={simulating}
        auditing={activeStep !== null}
      />
      <main className="flex flex-1 flex-col gap-4 px-5 py-4 lg:px-6">
        <div className="flex flex-col gap-2 border-b border-border pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[18px] leading-none font-bold tracking-tight text-white">Audits</h1>
              <p className="text-[12.5px] text-muted-foreground">
                Chaque déploiement est audité : seules les failles prouvées sont signalées.
              </p>
            </div>
            {data ? (
              <span className="rounded border border-border px-1.5 font-mono text-[10px] leading-[18px] uppercase tracking-wider text-muted-foreground">
                source : {data.source === 'mock' ? 'simulation' : 'orchestrateur'}
              </span>
            ) : null}
          </div>
          <MetricsBar kpis={data?.kpis} lastRunAt={data?.deployments?.[0]?.at} />
        </div>

        <div className="-mt-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-border">
          <ModuleTabs
            active={activeModule}
            subscribed={subscribed}
            counts={counts}
            onSelect={selectModule}
            onUnlock={() => changePlan('both')}
          />
          <PlanSelect plan={plan} onChange={changePlan} />
        </div>

        {error ? (
          <p role="alert" className="rounded-md border border-border px-4 py-3 text-sm">
            {error.message}{' '}
            <button type="button" className="underline underline-offset-2" onClick={() => mutate()}>
              Réessayer
            </button>
          </p>
        ) : null}

        <div
          role="tabpanel"
          aria-label={activeModule === 'qa' ? 'Audits QA' : 'Audits Pentest'}
          className="grid items-start gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]"
        >
          <div className="lg:sticky lg:top-16">
            <DeploymentsFeed deployments={deployments} selectedId={selected?.id} onSelect={setSelectedId} />
          </div>
          <AuditDetail deployment={selected} activeStep={activeStep} />
        </div>
      </main>
      <footer className="border-t border-border px-5 py-2.5 font-mono text-[10px] text-subtle lg:px-6">
        Agents H Company · rapport Hugging Face · hébergé sur Vercel
      </footer>
    </>
  )
}
