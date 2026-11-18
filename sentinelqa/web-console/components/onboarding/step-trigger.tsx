'use client'

import { GitBranch, MousePointerClick } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CopyButton, Field, StepHeader, inputClass } from './fields'

export type TriggerMode = 'webhook' | 'manual'

type Props = {
  mode: TriggerMode
  onModeChange: (mode: TriggerMode) => void
  webhookUrl: string
  onWebhookUrlChange: (value: string) => void
}

const OPTIONS = [
  {
    value: 'webhook' as const,
    title: 'À chaque déploiement',
    tag: 'webhook',
    description: 'Votre CI appelle HSentinel après chaque mise en préprod. Recommandé.',
    icon: GitBranch,
  },
  {
    value: 'manual' as const,
    title: 'Manuel',
    tag: 'console',
    description: 'Vous lancez chaque audit depuis la console Audits.',
    icon: MousePointerClick,
  },
]

export function StepTrigger({ mode, onModeChange, webhookUrl, onWebhookUrlChange }: Props) {
  return (
    <section aria-labelledby="step-title">
      <StepHeader index={4} title="Déclencheur" description="Quand HSentinel doit-il auditer l’application ?" />
      <div className="flex flex-col gap-5 px-5 py-5">
        <fieldset>
          <legend className="sr-only">Mode de déclenchement</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((option) => {
              const selected = mode === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    'relative flex cursor-pointer flex-col gap-2 rounded-lg border p-3.5 transition-colors',
                    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-steel/40',
                    selected ? 'border-steel bg-steel/[0.07]' : 'border-border bg-[#0d1119] hover:border-input hover:bg-white/[0.02]',
                  )}
                >
                  <input
                    type="radio"
                    name="trigger"
                    value={option.value}
                    checked={selected}
                    onChange={() => onModeChange(option.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <option.icon className={cn('size-4', selected ? 'text-steel' : 'text-subtle')} aria-hidden="true" />
                      <span className="text-[13.5px] font-semibold text-white">{option.title}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-4 items-center justify-center rounded-full border',
                        selected ? 'border-steel' : 'border-input',
                      )}
                    >
                      {selected ? <span className="size-2 rounded-full bg-steel" /> : null}
                    </span>
                  </div>
                  <span className="w-fit rounded border border-border px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                    {option.tag}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground text-pretty">{option.description}</span>
                </label>
              )
            })}
          </div>
        </fieldset>

        {mode === 'webhook' ? (
          <Field
            id="webhook-url"
            label="URL du webhook"
            hint="À appeler en POST depuis votre CI à la fin du déploiement préprod (commit et auteur dans le corps)."
          >
            <div className="flex items-center gap-2">
              <input
                id="webhook-url"
                type="url"
                spellCheck={false}
                value={webhookUrl}
                onChange={(event) => onWebhookUrlChange(event.target.value)}
                className={cn(inputClass, 'font-mono text-[12px]')}
              />
              <CopyButton value={webhookUrl} />
            </div>
          </Field>
        ) : (
          <p className="rounded-md border border-border bg-[#0d1119] px-3 py-2.5 text-[12.5px] text-muted-foreground">
            Aucun appel automatique. Le bouton <span className="text-foreground">Lancer l’audit</span> de la console reste disponible à tout moment.
          </p>
        )}
      </div>
    </section>
  )
}
