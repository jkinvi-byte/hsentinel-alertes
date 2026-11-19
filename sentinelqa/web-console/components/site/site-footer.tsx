import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { NAV } from './nav'

const EXTRA = [
  {
    label: 'Entreprise',
    links: [
      { label: 'Sécurité et confiance', href: '/securite' },
      { label: 'Tarifs', href: '/tarifs' },
      { label: 'Demander une démo', href: '/demo' },
    ],
  },
  {
    label: 'Compte',
    links: [
      { label: 'Créer un compte', href: '/signup' },
      { label: 'Se connecter', href: '/login' },
      { label: 'Console', href: '/app' },
    ],
  },
]

export function SiteFooter() {
  const columns = [
    ...NAV.filter((item) => item.children).map((item) => ({
      label: item.label,
      links: item.children!.map((c) => ({ label: c.label, href: c.href })),
    })),
    ...EXTRA,
  ]

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 pt-16 pb-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="flex max-w-xs flex-col gap-4">
            <span className="[&_.logo-mark]:filter-none! [&_.logo-word]:text-white!">
              <Logo href="/" />
            </span>
            <p className="text-[14px] leading-relaxed text-white/55">
              Des agents QA et Pentest qui prouvent, à chaque déploiement, qu’aucun client de votre SaaS ne voit les données
              d’un autre.
            </p>
          </div>
          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.label} className="flex flex-col gap-3">
                <h2 className="font-mono text-[11px] tracking-[0.08em] text-white/40 uppercase">{col.label}</h2>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-[14px] text-white/75 transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-line pt-6 text-[13px] text-white/45">
          <span>© 2026 HSentinel · Préproduction uniquement, jamais la production.</span>
          <span>Agents H Company · Hugging Face · Vercel</span>
        </div>
      </div>
    </footer>
  )
}
