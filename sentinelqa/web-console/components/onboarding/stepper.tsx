import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const STEPS = ['Application', 'Comptes', 'Modules', 'Déclencheur', 'Alertes'] as const

export function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Progression de la configuration">
      <ol className="flex items-center gap-2">
        {STEPS.map((label, index) => {
          const done = index < current
          const active = index === current
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10.5px] transition-colors',
                    done && 'border-steel bg-steel text-white',
                    active && 'border-steel bg-steel/12 text-white',
                    !done && !active && 'border-input text-subtle',
                  )}
                >
                  {done ? <Check className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'hidden text-[12.5px] whitespace-nowrap sm:inline',
                    active ? 'font-medium text-white' : done ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
                <span className="sr-only">{done ? ' (terminée)' : active ? ' (en cours)' : ''}</span>
              </div>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('h-px min-w-4 flex-1', done ? 'bg-steel/70' : 'bg-border')}
                />
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
