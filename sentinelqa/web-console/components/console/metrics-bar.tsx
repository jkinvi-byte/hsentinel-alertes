import type { Kpi } from '@/lib/audit-types'

const relative = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto', style: 'short' })

function timeAgo(iso: string) {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour')
  return relative.format(Math.round(hours / 24), 'day')
}

type MetricsBarProps = {
  kpis?: Kpi[]
  lastRunAt?: string
}

export function MetricsBar({ kpis, lastRunAt }: MetricsBarProps) {
  if (!kpis) {
    return <div className="h-4 w-80 animate-pulse rounded bg-muted" aria-label="Chargement des métriques" />
  }
  const detection = kpis.find((k) => k.id === 'detection')?.value
  const falsePositives = kpis.find((k) => k.id === 'false-positives')?.value

  return (
    <dl aria-label="Métriques" className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
      {detection ? (
        <div className="flex items-baseline gap-1.5">
          <dt>Détection</dt>
          <dd className="font-semibold tabular-nums text-foreground">{detection}</dd>
        </div>
      ) : null}
      {falsePositives ? (
        <>
          <span aria-hidden="true" className="text-subtle">·</span>
          <div className="flex items-baseline gap-1.5">
            <dd className="font-semibold tabular-nums text-foreground">{falsePositives}</dd>
            <dt>{Number(falsePositives) > 1 ? 'faux positifs' : 'faux positif'}</dt>
          </div>
        </>
      ) : null}
      {lastRunAt ? (
        <>
          <span aria-hidden="true" className="text-subtle">·</span>
          <div className="flex items-baseline gap-1.5">
            <dt>dernière exéc.</dt>
            <dd className="tabular-nums text-foreground">
              <time dateTime={lastRunAt} suppressHydrationWarning>
                {timeAgo(lastRunAt)}
              </time>
            </dd>
          </div>
        </>
      ) : null}
    </dl>
  )
}
