import type { Deployment } from '@/lib/audit-types'
import { cn } from '@/lib/utils'

const timeFormat = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

export function VulnChip({ count, noun = 'faille' }: { count: number; noun?: string }) {
  const unsafe = count > 0
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 font-mono text-[10px] leading-[18px] tabular-nums',
        unsafe ? 'border-danger/40 bg-danger/10 text-danger' : 'border-border text-safe',
      )}
    >
      {count} {noun}
      {count > 1 ? 's' : ''}
    </span>
  )
}

type FeedProps = {
  deployments?: Deployment[]
  selectedId?: string
  onSelect: (id: string) => void
  /** D-49 : « en direct » seulement quand la page se rafraîchit vraiment (une mission tourne). */
  live?: boolean
}

export function DeploymentsFeed({ deployments, selectedId, onSelect, live = false }: FeedProps) {
  return (
    <section aria-labelledby="feed-title" className="panel flex flex-col overflow-hidden">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <h2 id="feed-title" className="text-[12.5px] font-semibold text-foreground">
          Missions
          {deployments ? <span className="ml-1.5 font-mono text-[10.5px] font-normal text-subtle">{deployments.length}</span> : null}
        </h2>
        {live ? (
          <span className="flex items-center gap-1.5 label-mono">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-safe" />
            en direct
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-[1fr_auto] border-b border-border px-3 py-1.5 label-mono text-subtle" aria-hidden="true">
        <span>Mission</span>
        <span>Résultat</span>
      </div>
      <ul
        aria-label="Missions précédentes — sélectionner pour revoir l’audit"
        className="flex flex-col divide-y divide-border lg:max-h-[calc(100dvh-11rem)] lg:overflow-y-auto"
      >
        {deployments
          ? deployments.map((d) => {
              const selected = d.id === selectedId
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(d.id)}
                    aria-pressed={selected}
                    className={cn(
                      'flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2',
                      selected ? 'border-l-steel bg-steel/[0.07]' : 'border-l-transparent hover:bg-foreground/[0.025]',
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex items-center gap-2">
                        <span className={cn('min-w-0 flex-1 truncate text-[12.5px]', selected ? 'font-medium text-foreground' : 'text-foreground')}>
                          {d.message}
                        </span>
                        <VulnChip count={d.vulnerabilities} noun={d.module === 'qa' ? 'écart' : 'faille'} />
                      </span>
                      <span className="truncate font-mono text-[10px] text-muted-foreground">
                        <span className={selected ? 'text-steel' : undefined}>{d.commit}</span>
                        <span className="text-subtle"> · </span>
                        {d.author}
                        <span className="text-subtle"> · </span>
                        {timeFormat.format(new Date(d.at))}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })
          : Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex flex-col gap-1.5 px-3 py-2.5" aria-hidden="true">
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
              </li>
            ))}
      </ul>
    </section>
  )
}
