import { Bug, CircleCheck, GitCommit, Globe, Play, Ticket } from 'lucide-react'
import Link from 'next/link'
import { type ActivityEvent, formatDateTime } from '@/lib/console-data'
import { cn } from '@/lib/utils'

const KIND: Record<ActivityEvent['kind'], { icon: typeof Bug; tone: string }> = {
  finding: { icon: Bug, tone: 'border-danger/40 bg-danger/10 text-danger' },
  audit: { icon: Play, tone: 'border-steel/40 bg-steel/10 text-steel' },
  session: { icon: Globe, tone: 'border-steel/40 bg-steel/10 text-steel' },
  ticket: { icon: Ticket, tone: 'border-border bg-foreground/[0.04] text-foreground' },
  deploy: { icon: GitCommit, tone: 'border-border bg-foreground/[0.04] text-foreground' },
  fix: { icon: CircleCheck, tone: 'border-safe/40 bg-safe/10 text-safe' },
}

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (!events.length) return <p className="py-6 text-center text-[12.5px] text-muted-foreground">Aucune activité pour l’instant.</p>
  return (
    <ol className="flex flex-col">
      {events.map((event, i) => {
        const { icon: Icon, tone } = KIND[event.kind]
        const body = (
          <>
            <span className="relative flex flex-col items-center">
              <span className={cn('flex size-7 items-center justify-center rounded-full border', tone)}>
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              {i < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" aria-hidden="true" /> : null}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 pb-4">
              <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[12.5px] font-medium text-foreground">{event.title}</span>
                <time dateTime={event.at} className="font-mono text-[10.5px] text-subtle">
                  {formatDateTime(event.at)}
                </time>
              </span>
              <span className="text-[12px] text-muted-foreground">{event.detail}</span>
              <span className="font-mono text-[10.5px] text-subtle">{event.app}</span>
            </span>
          </>
        )
        return (
          <li key={event.id}>
            {event.href ? (
              <Link href={event.href} className="-mx-2 flex gap-3 rounded-md px-2 pt-2 transition-colors hover:bg-foreground/[0.03]">
                {body}
              </Link>
            ) : (
              <div className="flex gap-3 pt-2">{body}</div>
            )}
          </li>
        )
      })}
    </ol>
  )
}
