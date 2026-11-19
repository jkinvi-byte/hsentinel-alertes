import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/brand/logo'
import { AccessForm } from '@/components/site/access-form'
import { hasSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Demander un accès — HSentinel',
  description: 'Demandez votre accès d’essai de 7 jours à HSentinel : l’équipe l’ouvre et cadre avec vous votre préproduction.',
}

const INCLUDED = [
  'Agents QA et Pentest sur 1 application',
  'Captures et session de l’agent H pour chaque faille prouvée',
  'Alertes : ticket GitHub et e-mail',
  'Le coût des agents, mesuré audit par audit',
]

const STEPS = [
  { title: 'Demandez votre accès', detail: 'Sans carte bancaire.' },
  { title: 'Cadrez avec l’équipe', detail: 'URL de préproduction, comptes de test et autorisation écrite.' },
  { title: 'Recevez le premier rapport', detail: 'Failles prouvées, preuves et alertes.' },
]

export default async function SignupPage() {
  if (await hasSession()) redirect('/app')

  return (
    <main className="theme-console grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex flex-col px-6 py-8 sm:px-10">
        <Logo href="/" />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full border border-steel/40 bg-steel/10 px-2.5 py-0.5 text-[11.5px] font-medium text-steel">
              Essai gratuit · 7 jours
            </span>
            <h1 className="text-balance text-[26px] leading-tight font-bold tracking-tight text-foreground">
              Demandez votre accès d’essai
            </h1>
            <p className="text-[13.5px] text-muted-foreground">
              L’équipe ouvre votre accès et cadre avec vous votre préproduction. Les 7 jours démarrent à l’ouverture, sans carte bancaire.
            </p>
          </div>

          <AccessForm />

          <p className="text-[13px] text-muted-foreground">
            Déjà un accès ?{' '}
            <Link href="/login" className="font-medium text-steel hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </section>

      <aside aria-label="Ce que comprend l’essai" className="hidden flex-col justify-center gap-10 border-l border-border bg-card px-12 py-12 lg:flex">
        <div className="flex flex-col gap-4">
          <h2 className="text-[18px] font-semibold text-foreground">Inclus dans l’essai</h2>
          <ul className="flex flex-col gap-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13.5px] text-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-safe/15">
                  <Check className="size-3 text-safe" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ol className="flex flex-col gap-0">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex flex-col items-center">
                <span className="flex size-7 items-center justify-center rounded-full border border-steel/50 font-mono text-[12px] text-steel">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 ? <span className="w-px flex-1 bg-border" aria-hidden="true" /> : null}
              </span>
              <span className="flex flex-col pb-6">
                <span className="text-[13.5px] font-medium text-foreground">{step.title}</span>
                <span className="text-[12.5px] text-muted-foreground">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>

        <figure className="rounded-lg border border-border bg-background p-5">
          <blockquote className="text-[13.5px] leading-relaxed text-foreground">
            « En une semaine, HSentinel a trouvé deux fuites entre clients que nos tests n’avaient jamais vues. »
          </blockquote>
          <figcaption className="mt-3 font-mono text-[11px] text-subtle">CTO · SaaS RH, 32 personnes</figcaption>
        </figure>
      </aside>
    </main>
  )
}
