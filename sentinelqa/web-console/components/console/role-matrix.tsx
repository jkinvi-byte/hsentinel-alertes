import type { MatrixCell, RoleMatrix as RoleMatrixData } from '@/lib/audit-types'
import { cn } from '@/lib/utils'

const CELL: Record<MatrixCell, { label: string; className: string }> = {
  allowed: { label: 'autorisé', className: 'text-muted-foreground' },
  blocked: { label: 'bloqué ✓', className: 'text-safe' },
  leak: { label: 'FAILLE', className: 'rounded border border-danger/50 bg-danger/10 px-1.5 font-semibold text-danger' },
  na: { label: '—', className: 'text-subtle' },
}

export function RoleMatrix({ matrix }: { matrix: RoleMatrixData }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <caption className="sr-only">Matrice rôle × action observée pendant l’audit</caption>
        <thead>
          <tr className="border-b border-border bg-white/[0.02]">
            <th scope="col" className="px-3 py-1.5 font-normal label-mono">
              Rôle
            </th>
            {matrix.actions.map((action) => (
              <th key={action} scope="col" className="px-3 py-1.5 font-normal label-mono">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {matrix.rows.map((row) => {
            const leaking = row.cells.includes('leak')
            return (
              <tr key={`${row.role}-${row.tenant}`} className={cn('transition-colors hover:bg-white/[0.02]', leaking && 'bg-danger/[0.04]')}>
                <th scope="row" className="px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap text-white">
                  {row.role} <span className="font-mono text-[10px] font-normal text-muted-foreground">{row.tenant}</span>
                </th>
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-3 py-1.5">
                    <span className={cn('inline-flex font-mono text-[10.5px] leading-[18px]', CELL[cell].className)}>{CELL[cell].label}</span>
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
