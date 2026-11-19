import { type FindingTimelineStep, formatDateTime } from '@/lib/console-data'
import { cn } from '@/lib/utils'

const DOT: Record<FindingTimelineStep['tone'], string> = {
  neutral: 'border-border bg-foreground/20',
  info: 'border-steel/50 bg-steel',
  danger: 'border-danger/50 bg-danger',
  safe: 'border-safe/50 bg-safe',
}

export function FindingTimeline({ steps }: { steps: FindingTimelineStep[] }) {
  return (
    <ol className="flex flex-col">
      {steps.map((step, i) => (
        <li key={`${step.at}-${step.title}`} className="flex gap-3">
          <span className="flex flex-col items-center pt-1">
            <span className={cn('size-2.5 shrink-0 rounded-full border-2', DOT[step.tone])} aria-hidden="true" />
            {i < steps.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" /> : null}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 pb-4">
            <time dateTime={step.at} className="font-mono text-[10.5px] text-subtle">
              {formatDateTime(step.at)} · {step.actor}
            </time>
            <span className={cn('text-[12.5px] font-medium', step.tone === 'danger' ? 'text-danger' : step.tone === 'safe' ? 'text-safe' : 'text-foreground')}>
              {step.title}
            </span>
            <span className="text-[12px] leading-relaxed text-muted-foreground">{step.detail}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}
