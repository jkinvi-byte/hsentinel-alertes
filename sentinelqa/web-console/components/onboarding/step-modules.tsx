'use client'

import { Layers, Radar, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Plan } from '@/lib/plan'
import { StepHeader } from './fields'

const OPTIONS: { value: Plan; title: string; tag: string; description: string; icon: typeof ShieldCheck }[] = [
  {
    value: 'qa',
    title: 'QA',
    tag: 'à chaque déploiement',
    description: 'Isolation entre entreprises testée à chaque déploiement : chaque rôle n’accède qu’à ses données.',
    icon: ShieldCheck,
  },
  {
    value: 'pentest',
    title: 'Pentest',
    tag: 'régulier',
    description: 'Exploration en profondeur de l’application, à intervalle régulier, pour prouver les failles d’accès.',
    icon: Radar,
  },
  {
    value: 'both',
    title: 'QA + Pentest',
    tag: 'les deux',
    description: 'Contrôle d’isolation à chaque déploiement et exploration en profondeur régulière.',
    icon: Layers,
  },
]

export function StepModules({ plan, onPlanChange }: { plan: Plan; onPlanChange: (plan: Plan) => void }) {
  return (
    <section aria-labelledby="step-title">
      <StepHeader index={3} title="Modules" description="Choisissez ce que HSentinel active sur cette application." />
      <div className="px-5 py-5">
        <fieldset>
          <legend className="sr-only">Modules à activer</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {OPTIONS.map((option) => {
              const selected = plan === option.value
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
                    name="modules"
                    value={option.value}
                    checked={selected}
                    onChange={() => onPlanChange(option.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <option.icon className={cn('size-4', selected ? 'text-steel' : 'text-subtle')} aria-hidden="true" />
                      <span className="text-[13.5px] font-semibold text-white">{option.title}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn('flex size-4 items-center justify-center rounded-full border', selected ? 'border-steel' : 'border-input')}
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
      </div>
    </section>
  )
}
