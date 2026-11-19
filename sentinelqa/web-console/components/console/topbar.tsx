import { Play, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import type { Deployment } from '@/lib/audit-types'

// D-49 : la barre de la page Audits, sur la cible de la mission choisie. Fond opaque : rien ne défile sous un verre flouté (fable-fps).
export function Topbar({ context }: { context?: Deployment['context'] }) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-2.5 border-b border-border bg-background px-5 py-2.5 md:h-12 md:flex-row md:items-center md:justify-between md:py-0 lg:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="lg:hidden">
          <Logo href="/app" />
        </div>
        {context ? (
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
            <span className="font-medium text-foreground">
              {context.app} <span className="text-subtle">/</span> {context.environment}
            </span>
            <span className="rounded border border-border bg-foreground/[0.02] px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">
              {context.tenants}
            </span>
            {context.authorization ? (
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-safe">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                autorisation {context.authorization}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/app/nouveau"
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-steel px-2.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] [&_svg]:size-3.5"
        >
          <Play aria-hidden="true" />
          Lancer l’audit
        </Link>
      </div>
    </header>
  )
}
