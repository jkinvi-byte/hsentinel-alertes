import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

const LINKS = [
  { href: '#probleme', label: 'Problème' },
  { href: '#fonctionnement', label: 'Fonctionnement' },
  { href: '#agents', label: 'Agents' },
]

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-5">
        <Logo href={signedIn ? '/app' : '/'} />
        <nav aria-label="Sections" className="hidden items-center gap-5 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <Link
          href={signedIn ? '/app' : '/login'}
          className="flex h-7 items-center rounded-md border border-border px-2.5 text-[12.5px] text-foreground transition-colors hover:bg-foreground/[0.05]"
        >
          {signedIn ? 'Ouvrir la console' : 'Se connecter'}
        </Link>
      </div>
    </header>
  )
}
