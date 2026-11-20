'use client'

import { Activity, ArrowRight, Coins, FileCheck2, Globe, LayoutDashboard, Menu, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/brand/logo'
import type { ConsoleTheme } from '@/lib/plan'
import { ThemeToggle, useConsoleTheme } from './theme-toggle'
import { UserMenu } from './user-menu'

// D-55 : la navigation de l'espace connecté, sur le modèle de la référence Lovable. Quatre entrées libellées, la nouvelle
// mission en tête, les crédits discrets en bas. Sur téléphone, un tiroir avec les mêmes libellés : notre agent QA devinait
// les icônes de l'ancienne barre repliée (D-53, tâche 45).
const NAV = [
  { label: 'Vue d’ensemble', icon: LayoutDashboard, href: '/app', match: (p: string) => p === '/app' },
  { label: 'Missions', icon: Activity, href: '/app/audits', match: (p: string) => /^\/app\/(audits|missions)/.test(p) },
  { label: 'Applications', icon: Globe, href: '/app/applications', match: (p: string) => p.startsWith('/app/applications') },
  { label: 'Résultats', icon: FileCheck2, href: '/app/diagnostic', match: (p: string) => p.startsWith('/app/diagnostic'), counted: true },
]

/** Ce que la barre sait vraiment : les failles ouvertes. Aucun coût en dollars ici (brief D-55) : il reste dans « Offre et utilisation ». */
export type SidebarSummary = { openFindings: number }

type SidebarProps = { initialTheme: ConsoleTheme; summary: SidebarSummary }

export function Sidebar({ initialTheme, summary }: SidebarProps) {
  const [theme, setTheme] = useConsoleTheme(initialTheme)
  const [ouverte, setOuverte] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOuverte(false) }, [pathname])
  useEffect(() => {
    if (!ouverte) return
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && setOuverte(false)
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [ouverte])

  return (
    <>
      <button type="button" className="lv-burger" aria-label="Ouvrir la navigation" aria-expanded={ouverte} aria-controls="app-sidebar"
        onClick={() => setOuverte(true)}>
        <Menu aria-hidden="true" />
      </button>
      {ouverte ? <button type="button" className="lv-voile" aria-label="Fermer la navigation" onClick={() => setOuverte(false)} /> : null}
      <aside id="app-sidebar" className="lv-sidebar" data-ouverte={ouverte}>
        <div className="lv-sidebar-marque flex items-center justify-between">
          <Logo href="/app" />
          {ouverte ? (
            <button type="button" aria-label="Fermer la navigation" onClick={() => setOuverte(false)}
              className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.05] min-[900px]:hidden">
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="lv-espace">
          <span className="lv-avatar" aria-hidden="true">H</span>
          <span className="min-w-0">
            Espace HSentinel
            <small>Équipe · accès opérateur</small>
          </span>
        </div>

        <Link href="/app/nouveau" className="lv-nouvelle" aria-current={pathname.startsWith('/app/nouveau') ? 'page' : undefined}>
          <Plus aria-hidden="true" />
          Nouvelle mission
        </Link>

        <p className="lv-section">Espace de travail</p>
        <nav aria-label="Navigation principale" className="lv-nav">
          {NAV.map((item) => {
            const actif = item.match(pathname)
            const nombre = item.counted ? summary.openFindings : 0
            return (
              <Link key={item.href} href={item.href} className="lv-nav-item" aria-current={actif ? 'page' : undefined}>
                <item.icon aria-hidden="true" />
                {item.label}
                {nombre ? (
                  <span className="lv-compteur">
                    {nombre}
                    <span className="sr-only"> faille{nombre > 1 ? 's' : ''} ouverte{nombre > 1 ? 's' : ''}</span>
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        <div className="lv-bas">
          {/* Le portefeuille n'est pas raccordé : on le dit, sans solde inventé ni conversion des dollars en crédits. */}
          <Link href="/app/facturation" className="lv-credits">
            <span className="flex items-center gap-2"><Coins className="size-3.5" aria-hidden="true" />Vos crédits</span>
            <strong>Crédits non raccordés</strong>
            <p>Le solde et l’utilisation apparaîtront avec votre offre.</p>
            <span className="lv-lien">Offre et utilisation <ArrowRight aria-hidden="true" /></span>
          </Link>
          <ThemeToggle theme={theme} onChange={setTheme} expanded />
          <UserMenu email="Équipe HSentinel" subtitle="Accès opérateur" expanded />
        </div>
      </aside>
    </>
  )
}
