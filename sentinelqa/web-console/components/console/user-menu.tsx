'use client'

import { AppWindow, ChevronsUpDown, Globe, LogOut, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { logout } from '@/app/actions'
import { cn } from '@/lib/utils'

const MENU_LINKS = [
  { label: 'Mon compte', href: '/app/compte', icon: UserRound },
  { label: 'Applications', href: '/app/applications', icon: AppWindow },
  { label: 'Site HSentinel', href: '/', icon: Globe },
]

export function UserMenu({ email, subtitle, expanded }: { email: string; subtitle: string; expanded: boolean }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const initial = email.charAt(0).toUpperCase()

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative mt-auto border-t border-border', expanded ? 'p-2' : 'flex justify-center py-2.5')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={expanded ? undefined : `Compte ${email}`}
        title={expanded ? undefined : email}
        className={cn(
          'flex items-center rounded-md text-left transition-colors hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-steel/60 focus-visible:outline-none',
          expanded ? 'w-full gap-2.5 px-2 py-1.5' : 'size-8 justify-center',
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-steel/40 bg-steel/15 font-mono text-[11px] font-semibold text-steel"
        >
          {initial}
        </span>
        {expanded ? (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[12.5px] font-medium text-foreground">{email}</span>
              <span className="truncate text-[11px] text-subtle">{subtitle}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />
          </>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          className={cn(
            'absolute z-50 w-52 rounded-md border border-border bg-popover p-1 shadow-xl shadow-black/10',
            expanded ? 'right-2 bottom-full left-2 mb-1 w-auto' : 'bottom-2 left-full ml-2',
          )}
        >
          <p className="truncate px-2.5 pt-1.5 pb-2 font-mono text-[11px] text-subtle">{email}</p>
          {MENU_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[12.5px] text-foreground transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none"
            >
              <link.icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
              {link.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-border" />
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-[12.5px] text-foreground transition-colors hover:bg-danger/10 hover:text-danger focus-visible:bg-danger/10 focus-visible:text-danger focus-visible:outline-none"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Se déconnecter
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
