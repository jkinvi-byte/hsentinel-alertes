import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

type Crumb = { label: string; href?: string }

type PageHeaderProps = {
  crumbs: Crumb[]
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ crumbs, title, description, actions, children }: PageHeaderProps) {
  return (
    <>
      <div className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-border bg-background/90 px-5 backdrop-blur lg:px-8">
        <div className="min-[900px]:hidden">
          <Logo href="/" />
        </div>
        <nav aria-label="Fil d’Ariane" className="hidden min-w-0 min-[900px]:block">
          <ol className="flex items-center gap-1.5 text-[12.5px]">
            {crumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 ? <ChevronRight className="size-3.5 text-subtle" aria-hidden="true" /> : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <header className="flex flex-col gap-4 border-b border-border px-5 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h1 className="font-heading text-[22px] leading-tight font-bold tracking-tight text-foreground text-balance">{title}</h1>
            {description ? <p className="max-w-2xl text-[13px] leading-relaxed text-muted-foreground text-pretty">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </header>
    </>
  )
}

export function Card({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel flex min-w-0 flex-col ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export const primaryButton =
  'inline-flex h-8 items-center gap-1.5 rounded-md bg-steel px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none disabled:opacity-50'
export const secondaryButton =
  'inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] font-medium text-foreground transition-colors hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none disabled:opacity-50'
