'use client'

import { AppWindow, Bug, ChevronLeft, ChevronRight, ClipboardCheck, Coins, LayoutDashboard, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Logo, LogoMark } from '@/components/brand/logo'
import { montant as dollars } from '@/lib/console-data'
import { SIDEBAR_COOKIE, writePreferenceCookie, type ConsoleTheme } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { ThemeToggle, useConsoleTheme } from './theme-toggle'
import { UserMenu } from './user-menu'

// La navigation de la console v0 (D-49). Une mission, son studio et son rapport appartiennent aux Audits.
const NAV = [
  { label: 'Vue d’ensemble', icon: LayoutDashboard, href: '/app', match: (p: string) => p === '/app' },
  { label: 'Audits', icon: ClipboardCheck, href: '/app/audits', match: (p: string) => /^\/app\/(audits|missions|nouveau)/.test(p) },
  { label: 'Diagnostics', icon: Bug, href: '/app/diagnostic', match: (p: string) => p.startsWith('/app/diagnostic'), counted: true },
  { label: 'Applications', icon: AppWindow, href: '/app/applications', match: (p: string) => p.startsWith('/app/applications') },
  { label: 'Crédits', icon: Coins, href: '/app/facturation', match: (p: string) => p.startsWith('/app/facturation') },
  { label: 'Compte', icon: UserRound, href: '/app/compte', match: (p: string) => p.startsWith('/app/compte') },
]

/** Ce que la barre latérale sait vraiment : les failles ouvertes et le coût mesuré sur 7 jours (null si la lecture a échoué). */
export type SidebarSummary = { openFindings: number; cost7d: number | null }

const DESKTOP_QUERY = '(min-width: 900px)'

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(DESKTOP_QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

// Le serveur ne voit pas la largeur de l'écran : il part de ce que dit le navigateur (téléphone ou non), pour qu'un téléphone
// ne reçoive pas une barre dépliée qui se replie ensuite sous les yeux de l'utilisateur.
function useIsDesktop(initialDesktop: boolean) {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => initialDesktop,
  )
}

type SidebarProps = { initialCollapsed: boolean; initialDesktop: boolean; initialTheme: ConsoleTheme; summary: SidebarSummary }

export function Sidebar({ initialCollapsed, initialDesktop, initialTheme, summary }: SidebarProps) {
  const isDesktop = useIsDesktop(initialDesktop)
  const [theme, setTheme] = useConsoleTheme(initialTheme)
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
          'sticky top-0 z-30 flex h-dvh shrink-0 flex-col border-r border-border bg-canvas transition-[width] duration-200',
          expanded ? 'w-52' : 'w-12',
        )}
      >
        <SidebarContent
          expanded={expanded}
          pathname={pathname}
          theme={theme}
          summary={summary}
          onThemeChange={setTheme}
          onToggle={isDesktop ? toggleDesktop : () => setMobileOpen(true)}
          toggleExpanded={isDesktop ? expanded : mobileOpen}
        />
      </aside>

      {!isDesktop && mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Fermer la navigation"
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-border bg-canvas shadow-2xl shadow-black/10">
            <SidebarContent expanded pathname={pathname} theme={theme} summary={summary} onThemeChange={setTheme} onToggle={() => setMobileOpen(false)} toggleExpanded />
          </aside>
        </>
      ) : null}
    </>
  )
}

type ContentProps = {
  expanded: boolean
  pathname: string
  theme: ConsoleTheme
  summary: SidebarSummary
  onThemeChange: (theme: ConsoleTheme) => void
  onToggle: () => void
  toggleExpanded: boolean
}


// À la place du compteur de crédits de v0 : le coût réellement mesuré (API H et Hugging Face). Aucun plafond n'existe, donc pas de jauge.
function CostMeter({ cost }: { cost: number | null }) {
  return (
    <Link
      href="/app/facturation"
      className="mx-2 mb-2 flex flex-col gap-1 rounded-md border border-border px-2.5 py-2 transition-colors hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-steel/60 focus-visible:outline-none"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="label-mono text-subtle">7 jours</span>
        <span className="font-mono text-[11px] tabular-nums text-foreground">{cost === null ? '—' : dollars(cost)}</span>
      </span>
      <span className="text-[11px] text-muted-foreground">coût mesuré, API H et Hugging Face</span>
    </Link>
  )
}

function SidebarContent({ expanded, pathname, theme, summary, onThemeChange, onToggle, toggleExpanded }: ContentProps) {
  const ToggleIcon = toggleExpanded ? ChevronLeft : ChevronRight
  const toggle = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={toggleExpanded}
      aria-controls="app-sidebar"
      aria-label={toggleExpanded ? 'Replier la barre latérale' : 'Déplier la barre latérale'}
      title={toggleExpanded ? 'Replier' : 'Déplier'}
      className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-steel/60 focus-visible:outline-none"
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
          <span className="hidden min-[900px]:flex">
            <LogoMark href="/app" />
          </span>
          {toggle}
        </div>
      )}

      <nav aria-label="Navigation principale" className={cn('flex flex-col gap-px py-2.5', expanded ? 'px-2' : 'items-center px-1.5')}>
        {expanded ? <p className="px-2.5 pt-1 pb-2 label-mono text-subtle">Console</p> : null}
        {NAV.map((item) => {
          const active = item.match(pathname)
          const count = item.counted ? summary.openFindings : 0
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
                  ? 'bg-steel/12 font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
              )}
            >
              <item.icon className={cn('size-4 shrink-0', active && 'text-steel')} aria-hidden="true" />
              {expanded ? <span className="flex-1">{item.label}</span> : null}
              {count ? (
                expanded ? (
                  <span className="rounded border border-danger/40 px-1 font-mono text-[10px] leading-4 text-danger">
                    {count}
                    <span className="sr-only"> faille{count > 1 ? 's' : ''} ouverte{count > 1 ? 's' : ''}</span>
                  </span>
                ) : (
                  // Barre repliée : le nombre en toutes lettres, comme dépliée, et non un point rouge (MARQUE.md : aucun rond
                  // coloré). Notre agent QA lisait le point comme une « icône d'équipe avec un point rouge » (D-53).
                  <span className="absolute -top-1 -right-1.5 rounded border border-danger/40 bg-card px-0.5 font-mono text-[8.5px] leading-3 text-danger">
                    {count}
                    <span className="sr-only"> faille{count > 1 ? 's' : ''} ouverte{count > 1 ? 's' : ''}</span>
                  </span>
                )
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto">
        {expanded ? <CostMeter cost={summary.cost7d} /> : null}
        <ThemeToggle theme={theme} onChange={onThemeChange} expanded={expanded} />
        <UserMenu email="Équipe HSentinel" subtitle="Accès opérateur" expanded={expanded} />
      </div>
    </>
  )
}
