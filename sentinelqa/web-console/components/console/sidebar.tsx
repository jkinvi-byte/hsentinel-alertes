'use client'

import { AppWindow, Bell, ChevronLeft, ChevronRight, ClipboardCheck, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Logo, LogoMark } from '@/components/brand/logo'
import { SIDEBAR_COOKIE, writePreferenceCookie } from '@/lib/plan'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Missions', icon: ClipboardCheck, href: '/app', count: 0 },
  { label: 'Nouvelle mission', icon: Plus, href: '/app/nouveau', count: 0 },
  { label: 'Applications', icon: AppWindow, href: '/app/cibles', count: 0 },
  { label: 'Alertes', icon: Bell, href: '/app/alertes', count: 0 },
]

const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  )
}

export function Sidebar({ initialCollapsed }: { initialCollapsed: boolean }) {
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  function toggleDesktop() {
    const next = !collapsed
    setCollapsed(next)
    writePreferenceCookie(SIDEBAR_COOKIE, next ? '1' : '0')
  }

  const expanded = isDesktop && !collapsed

  return (
    <>
      <aside
        id="app-sidebar"
        className={cn(
          'sticky top-0 z-30 flex h-dvh shrink-0 flex-col border-r border-border bg-[#0d1119] transition-[width] duration-200',
          expanded ? 'w-52' : 'w-12',
        )}
      >
        <SidebarContent
          expanded={expanded}
          pathname={pathname}
          onToggle={isDesktop ? toggleDesktop : () => setMobileOpen(true)}
          toggleExpanded={isDesktop ? expanded : mobileOpen}
        />
      </aside>

      {!isDesktop && mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Fermer la navigation"
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-[#0d1119] shadow-2xl shadow-black/60">
            <SidebarContent expanded pathname={pathname} onToggle={() => setMobileOpen(false)} toggleExpanded />
          </aside>
        </>
      ) : null}
    </>
  )
}

type ContentProps = {
  expanded: boolean
  pathname: string
  onToggle: () => void
  toggleExpanded: boolean
}

function SidebarContent({ expanded, pathname, onToggle, toggleExpanded }: ContentProps) {
  const ToggleIcon = toggleExpanded ? ChevronLeft : ChevronRight
  const toggle = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={toggleExpanded}
      aria-controls="app-sidebar"
      aria-label={toggleExpanded ? 'Replier la barre latérale' : 'Déplier la barre latérale'}
      title={toggleExpanded ? 'Replier' : 'Déplier'}
      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-steel/60 focus-visible:outline-none"
    >
      <ToggleIcon className="size-4" aria-hidden="true" />
    </button>
  )

  return (
    <>
      {expanded ? (
        <div className="flex h-12 items-center justify-between gap-2 border-b border-border pr-2.5 pl-4">
          <Logo href="/app" />
          {toggle}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 border-b border-border py-2.5">
          <span className="hidden lg:flex">
            <LogoMark href="/app" />
          </span>
          {toggle}
        </div>
      )}

      <nav aria-label="Navigation principale" className={cn('flex flex-col gap-px py-2.5', expanded ? 'px-2' : 'items-center px-1.5')}>
        {expanded ? <p className="px-2.5 pt-1 pb-2 label-mono text-subtle">Console</p> : null}
        {NAV.map((item) => {
          const active = item.href === '/app' ? pathname === '/app' || pathname.startsWith('/app/missions/') : pathname.startsWith(item.href)
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              aria-label={expanded ? undefined : item.label}
              title={expanded ? undefined : item.label}
              className={cn(
                'relative flex items-center rounded-md text-[13px] transition-colors',
                expanded ? 'gap-2.5 px-2.5 py-1.5' : 'size-8 justify-center',
                active
                  ? 'bg-steel/12 font-medium text-white'
                  : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
              )}
            >
              <item.icon className={cn('size-4 shrink-0', active && 'text-steel')} aria-hidden="true" />
              {expanded ? <span className="flex-1">{item.label}</span> : null}
              {item.count ? (
                expanded ? (
                  <span className="rounded border border-danger/40 px-1 font-mono text-[10px] leading-4 text-danger">
                    {item.count}
                    <span className="sr-only"> alerte non lue</span>
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-danger">
                    <span className="sr-only">{item.count} alerte non lue</span>
                  </span>
                )
              ) : null}
            </Link>
          )
        })}
      </nav>

      {expanded ? (
        <div className="mt-auto border-t border-border px-4 py-3">
          <p className="label-mono text-subtle">Espace</p>
          <p className="mt-1 text-[12.5px] font-medium">Équipe HSentinel</p>
        </div>
      ) : null}
    </>
  )
}
