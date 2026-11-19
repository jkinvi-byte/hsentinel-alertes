import { Check, Search, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function SectionHeading({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <p className="label-mono text-steel">{eyebrow}</p>
      <h2 className="font-heading text-[26px] leading-tight font-bold tracking-tight text-balance text-foreground md:text-[32px]">
        {title}
      </h2>
      {intro ? <p className="text-[14.5px] leading-relaxed text-pretty text-muted-foreground">{intro}</p> : null}
    </div>
  )
}

const PROBLEMS = [
  {
    title: 'Des parcours à revérifier',
    body: 'Retrouver les pages, naviguer sur mobile, vérifier les textes : chaque version demande de repasser sur les mêmes fonctionnalités.',
  },
  {
    title: 'Des droits qui doivent tenir',
    body: 'Une fonctionnalité peut fonctionner pour son utilisateur tout en exposant des données à un autre rôle. Il faut vérifier ces deux comportements.',
  },
  {
    title: 'Des résultats à documenter',
    body: 'Une équipe doit pouvoir retrouver le parcours exécuté, l’observation et la preuve pour décider quoi corriger ou revérifier.',
  },
]

export function ProblemSection() {
  return (
    <section id="probleme" className="scroll-mt-12 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Le problème"
            title="Livrer une fonctionnalité, c’est aussi vérifier son comportement."
            intro="HSentinel réunit le QA fonctionnel et les contrôles d’accès dans une console commune, avec un rapport pour chaque mission."
          />
          <div className="panel flex shrink-0 items-center gap-3 px-4 py-3">
            <ShieldAlert className="size-5 text-danger" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-mono text-[11px] text-steel">QA + Pentest</span>
              <span className="text-[13px] font-semibold text-foreground">Des constats vérifiables</span>
            </div>
          </div>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
          {PROBLEMS.map((p) => (
            <article key={p.title} className="flex flex-col gap-2 bg-card p-5">
              <h3 className="text-[14px] font-semibold text-foreground">{p.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  {
    title: 'Définir le contrôle',
    actor: 'vous',
    body: 'Choisissez une application et le volet QA ou Pentest. Pour un QA guidé, saisissez ou dictez la consigne, puis relisez les critères.',
  },
  {
    title: 'Exécuter le parcours',
    actor: 'agent H',
    body: 'L’agent utilise le navigateur sur le site choisi. Les contrôles du scénario complètent ses observations et alimentent le journal de la mission.',
  },
  {
    title: 'Examiner les preuves',
    actor: 'rapport',
    body: 'Retrouvez les résultats, les captures disponibles et les coûts mesurés. Les vérifications incomplètes restent signalées comme telles.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="fonctionnement" className="scroll-mt-12 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:py-20">
        <SectionHeading
          eyebrow="Comment ça marche"
          title="De la consigne au rapport, dans la même console."
          intro="Lancez une mission, suivez son exécution et revenez sur chaque constat."
        />
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="panel flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-subtle tabular-nums">0{i + 1}</span>
                <span className="rounded border border-border px-1.5 font-mono text-[10px] leading-[18px] text-muted-foreground">
                  {step.actor}
                </span>
              </div>
              <h3 className="text-[16px] font-semibold text-foreground">{step.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const AGENTS = [
  {
    name: 'QA',
    icon: Check,
    tagline: 'Vérifier ce que l’utilisateur voit et peut faire.',
    points: [
      'Consigne écrite ou dictée, relue avant le lancement',
      'Parcours guidé ou exploration, sur ordinateur ou mobile',
      'Critères vérifiés et captures disponibles dans le rapport',
    ],
  },
  {
    name: 'Pentest',
    icon: Search,
    tagline: 'Vérifier les contrôles d’accès du scénario choisi.',
    points: [
      'Scénarios et applications issus du catalogue du projet',
      'Observations de navigation complétées par des contrôles HTTP',
      'Résultat attendu, résultat observé et références de preuves',
    ],
  },
]

export function AgentsSection() {
  return (
    <section id="agents" className="scroll-mt-12 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:py-20">
        <SectionHeading
          eyebrow="Deux volets"
          title="QA et Pentest, dans une même interface."
          intro="Chaque volet garde ses scénarios et ses critères. La console affiche les contrôles disponibles pour les applications du projet."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {AGENTS.map((agent) => (
            <article key={agent.name} className="panel flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-steel/40 bg-steel/10">
                  <agent.icon className="size-4 text-steel" aria-hidden="true" />
                </span>
                <div className="flex flex-col">
                  <h3 className="text-[16px] font-semibold text-foreground">Agent {agent.name}</h3>
                  <p className="text-[12.5px] text-muted-foreground">{agent.tagline}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2 border-t border-border pt-4">
                {agent.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13px] text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-safe" aria-hidden="true" />
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

const OFFERS = [
  { name: 'QA seul', modules: 'Agent QA', points: ['Parcours métier par rôle', 'Matrice rôle × action', 'Rapport à chaque déploiement'] },
  {
    name: 'Les deux',
    modules: 'Agents QA + Pentest',
    points: ['Tout QA et tout Pentest', 'Une seule console, deux onglets', 'Alertes ticket + e-mail'],
    featured: true,
  },
  { name: 'Pentest seul', modules: 'Agent Pentest', points: ['Rejeu inter-entreprises', 'Failles prouvées uniquement', 'Ticket et alerte sécurité'] },
]

export function OffersSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section id="offres" className="scroll-mt-12 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:py-20">
        <SectionHeading eyebrow="Offres" title="Choisissez vos agents." intro="Tarification sur demande, selon le nombre d’applications et de déploiements." />
        <div className="grid gap-4 md:grid-cols-3">
          {OFFERS.map((offer) => (
            <article
              key={offer.name}
              className={cn('panel flex flex-col gap-4 p-6', offer.featured && 'border-steel/50 bg-steel/[0.06]')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <h3 className="text-[16px] font-semibold text-foreground">{offer.name}</h3>
                  <p className="font-mono text-[11px] text-muted-foreground">{offer.modules}</p>
                </div>
                {offer.featured ? (
                  <span className="rounded border border-steel/40 px-1.5 font-mono text-[10px] leading-[18px] text-steel">recommandé</span>
                ) : null}
              </div>
              <ul className="flex flex-1 flex-col gap-2 border-t border-border pt-4">
                {offer.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[13px] text-foreground">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-safe" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                href={signedIn ? '/app' : '/login'}
                className={cn(
                  'flex h-9 items-center justify-center rounded-md text-[13px] font-semibold transition-colors',
                  offer.featured
                    ? 'bg-steel text-white hover:bg-[#1d4ed8]'
                    : 'border border-border text-foreground hover:bg-foreground/[0.05]',
                )}
              >
                Demander un accès
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-5 py-6 font-mono text-[10.5px] text-subtle">
      Agents H Company · Hugging Face · Vercel
    </footer>
  )
}
