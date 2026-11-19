import type { Application } from '@/lib/console-data'
import { cn } from '@/lib/utils'

const STYLE: Record<Application['status'], { label: string; className: string }> = {
  faille: { label: 'Faille', className: 'border-danger/40 bg-danger/10 text-danger' },
  // « Aucune faille prouvée » : on ne prouve pas l'absence de faille, on dit ce qu'on a trouvé.
  sain: { label: 'Aucune faille', className: 'border-safe/40 bg-safe/10 text-safe' },
  'en cours': { label: 'Audit en cours', className: 'border-steel/40 bg-steel/10 text-steel' },
}

export function StatusBadge({ status, count }: { status: Application['status']; count?: number }) {
  const { className } = STYLE[status]
  const label = status === 'faille' && count ? `${count} faille${count > 1 ? 's' : ''}` : STYLE[status].label
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  )
}
