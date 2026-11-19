import { Check, Search } from 'lucide-react'
import Link from 'next/link'
import { LivePipeline, LiveTerminal } from '@/components/landing/live-visuals'

export function Row({
  id,
  eyebrow,
  title,
  body,
  link,
  visual,
  reverse,
}: {
  id?: string
  eyebrow: string
  title: string
  body: string
  link?: { href: string; label: string }
  visual: React.ReactNode
  reverse?: boolean
}) {
  return (
    <section id={id} className="scroll-mt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 lg:gap-16 lg:py-24">
        <div className={`h-reveal flex flex-col items-start gap-4 ${reverse ? 'md:order-2' : ''}`}>
          <p className="text-[13px] font-medium text-steel">{eyebrow}</p>
          <h2 className="font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance md:text-[40px]">
            {title}
          </h2>
          <p className="max-w-md text-[16px] leading-relaxed text-pretty text-muted-foreground">{body}</p>
          {link ? (
            <a href={link.href} className="mt-1 text-[15px] font-medium text-foreground hover:underline">
              {link.label} <span aria-hidden="true">→</span>
            </a>
          ) : null}
        </div>
        <div className="h-reveal">{visual}</div>
      </div>
    </section>
  )
}

export function LeakBrowser() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_60px_-34px_rgb(0_0_0/0.25)]">
      <div className="flex items-center gap-3 border-b border-border bg-secondary px-4 py-2.5">
        <span className="truncate font-mono text-[11.5px] text-muted-foreground">
          paie-express.app/companies/<span className="text-foreground">alpha</span>/payslips
        </span>
        <span className="ml-auto shrink-0 rounded-full bg-danger/10 px-2 py-0.5 font-mono text-[10.5px] text-danger">
          session Bêta
        </span>
      </div>
      <table className="w-full text-left text-[13px]">
        <caption className="sr-only">Bulletins de l’entreprise Alpha affichés à un utilisateur de Bêta</caption>
        <thead>
          <tr className="border-b border-border text-[11.5px] text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Salarié</th>
            <th className="px-4 py-2.5 font-medium">Mois</th>
            <th className="px-4 py-2.5 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['L. Martin', 'oct. 2026', '3 412 €'],
            ['S. Bernard', 'oct. 2026', '2 980 €'],
            ['A. Petit', 'oct. 2026', '4 105 €'],
          ].map(([name, month, net]) => (
            <tr key={name} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">{name}</td>
              <td className="px-4 py-3 text-muted-foreground">{month}</td>
              <td className="px-4 py-3 text-right font-mono text-[12.5px] text-danger">{net}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="border-t border-border bg-danger/5 px-4 py-2.5 font-mono text-[11px] text-danger">
        200 OK · les données d’Alpha sont visibles par Bêta
      </figcaption>
    </figure>
  )
}

export function ProblemSection() {
  return (
    <>
      <Row
        id="probleme"
        eyebrow="Le problème"
        title="Le contrôle d’accès défaillant est la faille n°1 du Top 10 OWASP."
        body="Dans un SaaS multi-entreprises, il suffit de changer un identifiant dans une URL pour lire les bulletins d’un autre client. Les scanners voient des URL, pas des entreprises, et le pentest n’arrive qu’une fois par an."
        visual={<LeakBrowser />}
      />
      <div className="mx-auto max-w-6xl px-5">
        <ul className="grid gap-3 md:grid-cols-3">
          {[
            ['Les scanners ne connaissent pas vos clients', 'Ils ne savent pas qu’Alpha ne doit jamais lire les données de Bêta.'],
            ['Le pentest arrive une fois par an', 'Vous déployez plusieurs fois par semaine ; une régression peut rester des mois.'],
            ['Une fuite entre clients est un incident', 'Données personnelles exposées, notification CNIL, confiance perdue.'],
          ].map(([title, body]) => (
            <li key={title} className="h-reveal flex flex-col gap-1.5 rounded-2xl bg-secondary p-6">
              <h3 className="text-[15px] font-semibold">{title}</h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function HowItWorksSection() {
  return (
    <>
      <Row
        id="fonctionnement"
        eyebrow="Comment ça marche"
        title="Trois étapes. Une faille prouvée, ou rien."
        body="Un agent explore votre préproduction avec chaque rôle, notre code rejoue chaque requête avec la session d’une autre entreprise, puis un second agent confirme à l’écran. Sans preuve, pas d’alerte."
        link={{ href: '#agents', label: 'Découvrir les agents' }}
        visual={<LivePipeline />}
        reverse
      />
      <Row
        eyebrow="À chaque déploiement"
        title="Branché sur votre CI, en quelques minutes."
        body="Un webhook ou une GitHub Action suffit. HSentinel audite chaque preview, ouvre un ticket avec la requête rejouée et alerte l’équipe sécurité, sans jamais accéder à la production."
        visual={<LiveTerminal />}
      />
    </>
  )
}

const AGENTS = [
  {
    name: 'QA',
    icon: Check,
    tag: 'à chaque déploiement',
    tagline: 'Chaque rôle obtient ce qu’il doit obtenir.',
    points: [
      'Rejoue les parcours métier de chaque rôle',
      'Compare les réponses au déploiement précédent',
      'Détecte les régressions de droits avant la production',
    ],
  },
  {
    name: 'Pentest',
    icon: Search,
    tag: 'exploration régulière',
    tagline: 'Aucune entreprise ne voit les données d’une autre.',
    points: [
      'Rejoue les requêtes d’un client avec la session d’un autre',
      'Confirme chaque fuite dans un vrai navigateur',
      'Ouvre un ticket et alerte l’équipe sécurité',
    ],
  },
]

export function AgentsSection() {
  return (
    <section id="agents" className="scroll-mt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:py-24">
        <div className="h-reveal flex max-w-2xl flex-col gap-4">
          <p className="text-[13px] font-medium text-steel">Deux agents</p>
          <h2 className="font-heading text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance md:text-[40px]">
            QA et Pentest, abonnables séparément.
          </h2>
          <p className="text-[16px] leading-relaxed text-pretty text-muted-foreground">
            Les deux agents partagent le même pipeline et la même console ; activez l’un, l’autre ou les deux.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {AGENTS.map((agent) => (
            <article
              key={agent.name}
              className="h-reveal group flex flex-col gap-6 rounded-2xl bg-secondary p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-full bg-background transition-transform duration-300 group-hover:scale-105">
                  <agent.icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-background px-3 py-1 text-[12px] text-muted-foreground">{agent.tag}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="font-heading text-[24px] font-semibold tracking-tight">Agent {agent.name}</h3>
                <p className="text-[15px] text-muted-foreground">{agent.tagline}</p>
              </div>
              <ul className="flex flex-col gap-2.5">
                {agent.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[14px]">
                    <Check className="mt-0.5 size-4 shrink-0 text-safe" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ClosingCta({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-20">
      <div className="h-reveal flex flex-col items-start gap-6 rounded-3xl bg-[#0b0b0c] px-8 py-12 text-white md:flex-row md:items-center md:justify-between md:px-12">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-[28px] leading-tight font-semibold tracking-[-0.02em] text-balance md:text-[34px]">
            Votre premier audit, en cinq étapes.
          </h2>
          <p className="text-[15px] text-white/60">Offre Découverte de 7 jours, aucun accès à la production demandé.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={signedIn ? '/app' : '/signup'}
            className="flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-medium text-[#0b0b0c] transition-opacity hover:opacity-85"
          >
            {signedIn ? 'Ouvrir la console' : 'Demander un accès'}
          </Link>
          <Link
            href="/tarifs"
            className="flex h-11 items-center rounded-full bg-white/10 px-5 text-[15px] font-medium text-white transition-colors hover:bg-white/15"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-6 text-[13px] text-muted-foreground">
      <span>© 2026 HSentinel</span>
      <span>Agents H Company · Hugging Face · Vercel</span>
    </footer>
  )
}
