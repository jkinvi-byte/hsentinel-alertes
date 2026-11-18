'use client'

import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field, StepHeader, Toggle, inputClass } from './fields'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export type AlertsConfig = {
  github: boolean
  repo: string
  email: boolean
  address: string
}

type Props = {
  config: AlertsConfig
  onChange: (config: AlertsConfig) => void
}

export function StepAlerts({ config, onChange }: Props) {
  const set = (patch: Partial<AlertsConfig>) => onChange({ ...config, ...patch })

  return (
    <section aria-labelledby="step-title">
      <StepHeader
        index={5}
        title="Alertes"
        description="Où envoyer le récap quand une faille est prouvée. Un seul ticket par faille, sans aucune donnée sensible."
      />
      <div className="flex flex-col gap-3 px-5 py-5">
        <AlertRow
          id="alert-github"
          icon={<GithubIcon className="size-4 text-white" />}
          title="Ticket GitHub"
          description="Ouvre une issue avec la requête rejouée et le rapport."
          enabled={config.github}
          onToggle={(github) => set({ github })}
        >
          <Field id="github-repo" label="Dépôt">
            <input
              id="github-repo"
              spellCheck={false}
              autoComplete="off"
              value={config.repo}
              onChange={(event) => set({ repo: event.target.value })}
              placeholder="organisation/depot"
              className={cn(inputClass, 'font-mono text-[12px]')}
            />
          </Field>
        </AlertRow>

        <AlertRow
          id="alert-email"
          icon={<Mail className="size-4 text-white" aria-hidden="true" />}
          title="E-mail"
          description="Envoyé via n8n à l’équipe sécurité."
          enabled={config.email}
          onToggle={(email) => set({ email })}
        >
          <Field id="alert-address" label="Destinataire">
            <input
              id="alert-address"
              type="email"
              spellCheck={false}
              autoComplete="off"
              value={config.address}
              onChange={(event) => set({ address: event.target.value })}
              placeholder="securite@entreprise.fr"
              className={cn(inputClass, 'font-mono text-[12px]')}
            />
          </Field>
        </AlertRow>
      </div>
    </section>
  )
}

function AlertRow({
  id,
  icon,
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: (value: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className={cn('rounded-lg border bg-[#0d1119] transition-colors', enabled ? 'border-input' : 'border-border')}>
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-white/[0.03]">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p id={`${id}-label`} className="text-[13.5px] font-semibold text-white">
            {title}
          </p>
          <p className="text-[12px] text-muted-foreground">{description}</p>
        </div>
        <span className={cn('font-mono text-[10.5px]', enabled ? 'text-steel' : 'text-subtle')} aria-hidden="true">
          {enabled ? 'activé' : 'désactivé'}
        </span>
        <Toggle checked={enabled} onChange={onToggle} labelledBy={`${id}-label`} />
      </div>
      {enabled ? <div className="border-t border-border px-4 py-3">{children}</div> : null}
    </div>
  )
}
