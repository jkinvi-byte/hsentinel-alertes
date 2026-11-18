import { Play, Rocket, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AuditResponse } from '@/lib/audit-types'
import { Logo } from '@/components/brand/logo'

type TopbarProps = {
  context?: AuditResponse['context']
  onSimulate: () => void
  onRunAudit: () => void
  simulating: boolean
  auditing: boolean
}

export function Topbar({ context, onSimulate, onRunAudit, simulating, auditing }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-2.5 border-b border-border bg-background/90 px-5 py-2.5 backdrop-blur md:h-12 md:flex-row md:items-center md:justify-between md:py-0 lg:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="lg:hidden">
          <Logo href="/app" />
        </div>
        {context ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
            <span className="font-medium text-white">
              {context.app} <span className="text-subtle">/</span> {context.environment}
            </span>
            <span className="rounded border border-border bg-white/[0.02] px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">
              {context.tenants}
            </span>
            {context.ownershipVerified ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-safe">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                propriété vérifiée
              </span>
            ) : null}
          </div>
        ) : (
          <p className="h-4 w-72 animate-pulse rounded bg-muted" aria-label="Chargement du contexte" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSimulate}
          disabled={simulating || !context}
          className="h-7 rounded-md border-border bg-transparent px-2.5 text-[12.5px] text-foreground hover:bg-white/[0.05]"
        >
          <Rocket aria-hidden="true" />
          {simulating ? 'Déploiement…' : 'Simuler un déploiement'}
        </Button>
        <Button
          size="sm"
          onClick={onRunAudit}
          disabled={auditing || !context}
          className="h-7 rounded-md bg-steel px-2.5 text-[12.5px] font-semibold text-white hover:bg-[#2f72e0]"
        >
          <Play aria-hidden="true" />
          {auditing ? 'Audit en cours…' : 'Lancer l’audit'}
        </Button>
      </div>
    </header>
  )
}
