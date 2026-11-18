import { Lock } from 'lucide-react'
import type { AuditModule } from '@/lib/audit-types'
import { MODULE_LABELS, PLANS, type Plan } from '@/lib/plan'
import { cn } from '@/lib/utils'

const MODULES: AuditModule[] = ['qa', 'pentest']

type ModuleTabsProps = {
  active: AuditModule
  subscribed: AuditModule[]
  counts: Record<AuditModule, number>
  onSelect: (module: AuditModule) => void
  onUnlock: () => void
}

export function ModuleTabs({ active, subscribed, counts, onSelect, onUnlock }: ModuleTabsProps) {
  return (
    <div className="flex items-end gap-1">
      <div role="tablist" aria-label="Module d’audit" className="flex items-end">
        {MODULES.map((module) => {
          const locked = !subscribed.includes(module)
          const selected = !locked && module === active
          return (
            <button
              key={module}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-disabled={locked}
              disabled={locked}
              onClick={() => onSelect(module)}
              className={cn(
                '-mb-px flex h-8 items-center gap-1.5 border-b-2 px-3 text-[12.5px] transition-colors outline-none focus-visible:bg-white/[0.04]',
                selected ? 'border-steel font-semibold text-white' : 'border-transparent text-muted-foreground',
                locked ? 'cursor-not-allowed text-subtle' : !selected && 'hover:text-foreground',
              )}
            >
              {locked ? <Lock className="size-3" aria-hidden="true" /> : null}
              {MODULE_LABELS[module]}
              {locked ? (
                <span className="sr-only"> (non souscrit)</span>
              ) : (
                <span className="font-mono text-[10px] font-normal text-subtle tabular-nums">{counts[module]}</span>
              )}
            </button>
          )
        })}
      </div>
      {MODULES.filter((m) => !subscribed.includes(m)).map((module) => (
        <button
          key={module}
          type="button"
          onClick={onUnlock}
          className="mb-1.5 ml-1 rounded border border-steel/40 px-1.5 font-mono text-[10px] leading-[18px] text-steel transition-colors hover:bg-steel/10"
        >
          Débloquer {MODULE_LABELS[module]}
        </button>
      ))}
    </div>
  )
}

export function PlanSelect({ plan, onChange }: { plan: Plan; onChange: (plan: Plan) => void }) {
  return (
    <fieldset className="mb-1.5 flex items-center gap-2">
      <legend className="sr-only">Offre souscrite</legend>
      <span aria-hidden="true" className="label-mono text-subtle">
        Offre
      </span>
      <div className="flex rounded-md border border-border p-0.5">
        {PLANS.map((option) => (
          <label
            key={option.id}
            className={cn(
              'cursor-pointer rounded px-2 font-mono text-[10.5px] leading-5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-steel/60',
              plan === option.id ? 'bg-steel/15 text-white' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name="plan"
              value={option.id}
              checked={plan === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
