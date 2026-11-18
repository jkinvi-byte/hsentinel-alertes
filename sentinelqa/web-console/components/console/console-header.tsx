import Link from 'next/link'
import { Plus, LogOut } from 'lucide-react'
import { logout } from '@/app/actions'

export function ConsoleHeader({ title, action = true }: { title: string; action?: boolean }) {
  return <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 lg:px-7">
    <div><p className="label-mono">HSentinel / Console</p><p className="mt-1 text-sm font-medium">{title}</p></div>
    <div className="flex items-center gap-2">
      {action && <Link className="console-button primary" href="/app/nouveau"><Plus className="size-4" aria-hidden="true" />Nouvelle mission</Link>}
      <form action={logout}><button type="submit" className="console-button" aria-label="Se déconnecter" title="Se déconnecter"><LogOut className="size-4" aria-hidden="true" /></button></form>
    </div>
  </header>
}
