import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { signup } from '@/app/actions'
import { Logo } from '@/components/brand/logo'
import { hasSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Essai gratuit 7 jours — HSentinel',
  description: 'Créez votre compte HSentinel et lancez votre premier audit QA + Pentest en préproduction.',
}

const inputClass =
  'h-10 rounded-md border border-input bg-foreground/[0.02] px-3 text-[13.5px] text-foreground outline-none placeholder:text-subtle focus-visible:border-steel focus-visible:ring-2 focus-visible:ring-steel/30'

const INCLUDED = [
  'Agents QA et Pentest sur 1 application',
  'Jusqu’à 5 entreprises de test et leurs rôles',
  'Rejeu navigateur et captures de chaque faille',
  'Alertes GitHub, Slack et e-mail',
]

const STEPS = [
  { title: 'Créez votre compte', detail: 'Sans carte bancaire.' },
  { title: 'Ajoutez votre préproduction', detail: 'URL et comptes de test.' },
  { title: 'Recevez le premier rapport', detail: 'En moins de 30 minutes.' },
]

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await hasSession()) redirect('/app')
  const { error } = await searchParams

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
              Testez l’isolation de votre SaaS dès aujourd’hui
            </h1>
            <p className="text-[13.5px] text-muted-foreground">Aucune carte bancaire. Annulable à tout moment.</p>
          </div>

          <form action={signup} className="flex flex-col gap-4">
            {error ? (
              <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
                Renseignez votre nom, un e-mail valide et un mot de passe d&apos;au moins 8 caractères.
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[12.5px] font-medium text-foreground">
                Nom complet
              </label>
              <input id="name" name="name" type="text" autoComplete="name" required placeholder="Camille Roux" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[12.5px] font-medium text-foreground">
                E-mail professionnel
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@entreprise.fr" className={inputClass} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-[12.5px] font-medium text-foreground">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                aria-describedby="password-hint"
                className={inputClass}
              />
              <p id="password-hint" className="text-[11.5px] text-subtle">
                8 caractères minimum.
              </p>
            </div>
            <button
              type="submit"
              className="h-10 rounded-md bg-steel text-[13.5px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none"
            >
              Démarrer mon essai gratuit
            </button>
            <p className="text-[11.5px] leading-relaxed text-subtle">
              En créant un compte, vous acceptez nos conditions d’utilisation. HSentinel n’attaque que la préproduction que vous déclarez.
            </p>
          </form>

          <p className="text-[13px] text-muted-foreground">
            Déjà un compte ?{' '}
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
