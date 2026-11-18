import type { PipelineStep } from '@/lib/audit-types'
import { cn } from '@/lib/utils'

type TimelineProps = {
  steps: PipelineStep[]
  activeIndex: number | null
}

export function PipelineTimeline({ steps, activeIndex }: TimelineProps) {
  return (
    <ol className="flex flex-col" aria-label="Pipeline d’audit">
      {steps.map((step, i) => {
        const pending = activeIndex !== null && i > activeIndex
        const running = activeIndex === i
        const proven = step.status === 'proven' && !pending && !running
        const last = i === steps.length - 1
        return (
          <li key={step.id} className="relative flex gap-3 pb-3.5 last:pb-0" aria-current={running ? 'step' : undefined}>
            {!last ? <span aria-hidden="true" className="absolute top-5 bottom-0 left-[9px] w-px bg-border" /> : null}
            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 mt-px flex size-[19px] shrink-0 items-center justify-center rounded-full border font-mono text-[9.5px]',
                proven && 'border-danger bg-danger-soft text-danger',
                running && 'border-steel bg-steel/15 text-steel',
                !proven && !running && !pending && 'border-white/20 bg-card text-foreground',
                pending && 'border-border bg-background text-subtle',
              )}
            >
              {i + 1}
            </span>
            <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', pending && 'opacity-45')}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <h4 className={cn('text-[13px] font-semibold', proven ? 'text-danger' : 'text-white')}>{step.title}</h4>
                {step.actor !== 'result' ? (
                  <span className="rounded border border-border px-1 font-mono text-[9.5px] leading-4 text-muted-foreground">
                    {step.actorLabel}
                  </span>
                ) : null}
                <span
                  className={cn(
                    'ml-auto font-mono text-[10.5px] tabular-nums',
                    running ? 'text-steel' : step.status === 'clear' && !pending ? 'text-safe' : proven ? 'text-danger' : 'text-muted-foreground',
                  )}
                >
                  {running ? 'en cours…' : pending ? 'en attente' : step.meta}
                </span>
              </div>
              <p className="text-[12.5px] leading-snug text-muted-foreground">{step.description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
