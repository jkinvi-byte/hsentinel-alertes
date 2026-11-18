import { CircleCheck, CircleDashed, CircleAlert, MinusCircle } from 'lucide-react'
import type { ResultStatus } from '@/lib/mission-types'
import { libelleStatut } from '../../../web/lib/qa-contrat.mjs'

const definitions = {
  passed: { label: 'Conforme', color: 'text-safe border-safe/25 bg-safe/5', Icon: CircleCheck },
  failed: { label: 'Écart constaté', color: 'text-danger border-danger/25 bg-danger/5', Icon: CircleAlert },
  inconclusive: { label: 'Non concluant', color: 'text-amber-300 border-amber-300/25 bg-amber-300/5', Icon: CircleDashed },
  skipped: { label: 'Non exécuté', color: 'text-muted-foreground border-border bg-muted/30', Icon: MinusCircle },
}
export function ResultStatusBadge({ status, reason }: { status: ResultStatus; reason?: string }) {
  const { Icon, color, label } = definitions[status] ?? definitions.inconclusive
  return <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs ${color}`}><Icon className="size-3.5 shrink-0" aria-hidden="true" />{reason ? libelleStatut(status, reason) : label}</span>
}
