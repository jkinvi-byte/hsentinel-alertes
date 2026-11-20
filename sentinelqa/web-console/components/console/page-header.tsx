import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Crumb = { label: string; href?: string }

type PageHeaderProps = {
  crumbs: Crumb[]
  title: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  surtitre?: string
}

const jour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' })

// D-55 : la barre du haut et l'en-tête de page de la référence Lovable. Le fil d'Ariane part toujours de l'espace de
// travail ; à droite, l'accès réellement ouvert (opérateur) et le compte. Le contenu suit dans `.lv-contenu`.
/** La barre du haut de l'espace connecté : le fil d'Ariane depuis l'espace de travail, l'accès ouvert et le compte. */
export function TopBar({ crumbs }: { crumbs: Crumb[] }) {
  const chemin = crumbs[0]?.label === 'Console' ? crumbs.slice(1) : crumbs
  return (
    <div className="lv-topbar">
      <nav aria-label="Fil d’Ariane" className="min-w-0">
        <ol className="lv-ariane">
          <li><Link href="/app">Espace de travail</Link></li>
          {chemin.map((crumb, i) => (
            <li key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-2.5">
              <ChevronRight aria-hidden="true" />
              {crumb.href && i < chemin.length - 1 ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <div className="lv-topbar-actions">
        <span className="lv-etat">Accès opérateur</span>
        <Link href="/app/compte" aria-label="Mon compte" className="lv-avatar-rond">É</Link>
      </div>
    </div>
  )
}

export function PageHeader({ crumbs, title, description, actions, children, surtitre = 'Votre espace HSentinel' }: PageHeaderProps) {
  return (
    <>
      <TopBar crumbs={crumbs} />
      <div className="lv-page">
        <header className="lv-entete">
          <div className="lv-entete-texte">
            <p className="lv-surtitre">{surtitre}</p>
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          <div className="lv-entete-droite">
            <span className="lv-date">{jour.format(new Date())}</span>
            {actions ? <div className="lv-actions">{actions}</div> : null}
          </div>
        </header>
        {children}
      </div>
    </>
  )
}

export function Card({ title, action, children, className = '' }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel flex min-w-0 flex-col ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="font-heading text-[14px] font-semibold text-foreground">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export const primaryButton =
  'lv-bouton lv-bouton-bleu focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none disabled:opacity-50'
export const secondaryButton =
  'lv-bouton lv-bouton-trait focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none disabled:opacity-50'
