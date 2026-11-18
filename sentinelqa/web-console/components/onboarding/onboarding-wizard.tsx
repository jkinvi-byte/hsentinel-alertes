'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Play } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { StepAccounts, type TestAccount } from './step-accounts'
import { StepAlerts, type AlertsConfig } from './step-alerts'
import { ONBOARDED_COOKIE, PLAN_COOKIE, PLANS, writePreferenceCookie, type Plan } from '@/lib/plan'
import { StepApplication } from './step-application'
import { StepModules } from './step-modules'
import { StepTrigger, type TriggerMode } from './step-trigger'
import { STEPS, Stepper } from './stepper'

const INITIAL_ACCOUNTS: TestAccount[] = [
  { key: 'a', code: 'A', company: 'Alpha', role: 'Admin', email: 'admin@alpha.test', password: 'preprod-alpha-a' },
  { key: 'c', code: 'C', company: 'Alpha', role: 'Comptable', email: 'compta@alpha.test', password: 'preprod-alpha-c' },
  { key: 'b', code: 'B', company: 'Bêta', role: 'Admin', email: 'admin@beta.test', password: 'preprod-beta-b' },
]

function isHttpsUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.includes('.')
  } catch {
    return false
  }
}

export function OnboardingWizard() {
  const router = useRouter()
  const headingRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)

  const [appUrl, setAppUrl] = useState('https://staging.paie-express.app')
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)

  const [plan, setPlan] = useState<Plan>('both')

  const [trigger, setTrigger] = useState<TriggerMode>('webhook')
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.hsentinel.dev/v1/deploy/pe-7f3a9c')

  const [alerts, setAlerts] = useState<AlertsConfig>({
    github: true,
    repo: 'paie-express/app',
    email: true,
    address: 'securite@paie-express.fr',
  })
  const [launching, setLaunching] = useState(false)

  const urlValid = isHttpsUrl(appUrl)
  const companies = new Set(accounts.map((a) => a.company.trim().toLowerCase()).filter(Boolean))
  const accountsValid =
    accounts.length >= 2 &&
    companies.size >= 2 &&
    accounts.every((a) => a.company.trim() && a.role.trim() && a.email.includes('@') && a.password.length > 0)
  const triggerValid = trigger === 'manual' || isHttpsUrl(webhookUrl)
  const alertsValid =
    (!alerts.github || /^[\w.-]+\/[\w.-]+$/.test(alerts.repo)) && (!alerts.email || alerts.address.includes('@'))

  const lastStep = STEPS.length - 1
  const canContinue = [urlValid && verified, accountsValid, true, triggerValid, alertsValid][step]
  const blocker = [
    !urlValid ? 'Renseignez une URL https valide.' : !verified ? 'Vérifiez la propriété pour continuer.' : null,
    companies.size < 2 ? 'Ajoutez au moins deux entreprises distinctes.' : !accountsValid ? 'Complétez tous les champs.' : null,
    null,
    !triggerValid ? 'URL de webhook invalide.' : null,
    !alertsValid ? 'Vérifiez le dépôt et l’adresse e-mail.' : null,
  ][step]

  function handleAppUrlChange(value: string) {
    setAppUrl(value)
    setVerified(false)
  }

  function handleVerify() {
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setVerified(true)
    }, 1100)
  }

  function goTo(next: number) {
    setStep(next)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  function launch() {
    setLaunching(true)
    writePreferenceCookie(PLAN_COOKIE, plan)
    writePreferenceCookie(ONBOARDED_COOKIE, '1')
    router.push('/app')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur lg:px-6">
        <div className="flex items-center gap-4">
          <Logo href="/" />
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          <span className="hidden font-mono text-[11px] text-muted-foreground sm:inline">
            nouvelle application · configuration
          </span>
        </div>
        <Link href="/app" className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
          Passer · aller à la console
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-6 lg:py-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-[20px] font-bold tracking-tight text-white">Configurer HSentinel</h1>
          <p className="text-[13px] text-muted-foreground">
            Cinq étapes avant le premier audit. Aucun accès à la production n’est demandé.
          </p>
        </div>

        <Stepper current={step} />

        <div className="panel overflow-hidden shadow-[0_1px_0_rgb(255_255_255/0.03)_inset,0_8px_24px_-12px_rgb(0_0_0/0.6)]">
          <div ref={headingRef} tabIndex={-1} id="step-title" className="outline-none" aria-label={`Étape ${step + 1} : ${STEPS[step]}`}>
            {step === 0 ? (
              <StepApplication
                appUrl={appUrl}
                onAppUrlChange={handleAppUrlChange}
                urlValid={urlValid}
                verified={verified}
                verifying={verifying}
                onVerify={handleVerify}
              />
            ) : null}
            {step === 1 ? <StepAccounts accounts={accounts} onChange={setAccounts} /> : null}
            {step === 2 ? <StepModules plan={plan} onPlanChange={setPlan} /> : null}
            {step === 3 ? (
              <StepTrigger mode={trigger} onModeChange={setTrigger} webhookUrl={webhookUrl} onWebhookUrlChange={setWebhookUrl} />
            ) : null}
            {step === lastStep ? <StepAlerts config={alerts} onChange={setAlerts} /> : null}
          </div>

          {step === lastStep ? (
            <div className="flex flex-col gap-3 border-t border-border bg-white/[0.015] px-5 py-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
                <Summary term="Application" value={new URL(appUrl).host} />
                <Summary term="Comptes" value={`${accounts.length} · ${companies.size} entreprises`} />
                <Summary term="Modules" value={plan === 'both' ? 'QA + Pentest' : (PLANS.find((p) => p.id === plan)?.label ?? '')} />
                <Summary term="Déclencheur" value={trigger === 'webhook' ? 'webhook' : 'manuel'} />
                <Summary
                  term="Alertes"
                  value={[alerts.github && 'GitHub', alerts.email && 'e-mail'].filter(Boolean).join(' + ') || 'aucune'}
                />
              </dl>
              <button
                type="button"
                onClick={launch}
                disabled={!alertsValid || launching}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-steel text-[14px] font-semibold text-white shadow-[0_6px_20px_-8px_rgb(59_130_246/0.7)] transition-colors hover:bg-[#2f72e0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {launching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
                {launching ? 'Ouverture de la console…' : 'Lancer le premier audit'}
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={step === 0}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] text-foreground transition-colors hover:bg-white/[0.05] disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Précédent
            </button>
            <div className="flex items-center gap-3">
              {blocker ? <p className="hidden text-[12px] text-muted-foreground sm:block">{blocker}</p> : null}
              {step < lastStep ? (
                <button
                  type="button"
                  onClick={() => goTo(step + 1)}
                  disabled={!canContinue}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-steel px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#2f72e0] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-subtle"
                >
                  Continuer
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <p className="text-center font-mono text-[10.5px] text-subtle">SOURCE : SIMULATION · aucune requête n’est envoyée</p>
      </main>
    </div>
  )
}

function Summary({ term, value }: { term: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="label-mono text-subtle">{term}</dt>
      <dd className="truncate font-mono text-[11.5px] text-foreground">{value}</dd>
    </div>
  )
}
