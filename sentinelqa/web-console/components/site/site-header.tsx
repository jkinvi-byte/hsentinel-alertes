import { ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { PillLink } from './ui'
import { NAV } from './nav'

const trigger =
  'flex h-9 items-center gap-1 rounded-full px-3.5 text-[14px] text-foreground transition-colors hover:bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring/50'

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Logo href="/" />

        <nav aria-label="Navigation principale" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) =>
            item.children ? (
              <div key={item.label} className="group relative">
                <Link href={item.href} className={trigger} aria-haspopup="true">
                  {item.label}
                  <ChevronDown
                    className="size-3.5 text-muted-foreground transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
                    aria-hidden="true"
                  />
                </Link>
                <div className="invisible absolute top-full left-1/2 w-[440px] -translate-x-1/2 pt-2 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-background p-2 shadow-[0_24px_60px_-30px_rgb(10_15_28/0.35)]">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="flex flex-col gap-0.5 rounded-xl p-3 transition-colors outline-none hover:bg-secondary focus-visible:bg-secondary"
                        >
                          <span className="text-[14px] font-medium text-foreground">{child.label}</span>
                          <span className="text-[12.5px] leading-snug text-muted-foreground">{child.description}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <Link key={item.label} href={item.href} className={trigger}>
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <PillLink href={signedIn ? '/app' : '/login'} variant="outline" size="sm" className="hidden sm:inline-flex">
            {signedIn ? 'Console' : 'Se connecter'}
          </PillLink>
          <PillLink href="/demo" size="sm" arrow>
            Demander une démo
          </PillLink>
          <details className="group/menu relative lg:hidden">
            <summary
              aria-label="Ouvrir le menu"
              className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full hover:bg-secondary [&::-webkit-details-marker]:hidden"
            >
              <Menu className="size-4.5" aria-hidden="true" />
            </summary>
            <div className="absolute top-full right-0 mt-2 w-72 rounded-2xl border border-border bg-background p-2 shadow-[0_24px_60px_-30px_rgb(10_15_28/0.35)]">
              <ul className="flex flex-col">
                {NAV.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="block rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-secondary">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-border pt-1">
                  <Link
                    href={signedIn ? '/app' : '/login'}
                    className="block rounded-xl px-3 py-2.5 text-[15px] text-muted-foreground hover:bg-secondary"
                  >
                    {signedIn ? 'Ouvrir la console' : 'Se connecter'}
                  </Link>
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
