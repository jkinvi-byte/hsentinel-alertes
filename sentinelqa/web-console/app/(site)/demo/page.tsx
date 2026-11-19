import type { Metadata } from 'next'
import { DemoForm } from '@/components/site/demo-form'
import { Container, Eyebrow, TextLink } from '@/components/site/ui'

export const metadata: Metadata = {
  title: 'Demander une démo — HSentinel',
  description: '30 minutes pour lancer un premier audit QA + Pentest sur votre préproduction.',
}

const STEPS = [
  { title: 'Vous décrivez vos rôles', body: 'Entreprises clientes, rôles et données sensibles de votre SaaS.' },
  { title: 'Nous lançons un audit en direct', body: 'Sur votre préproduction, avec deux comptes de test.' },
  { title: 'Vous repartez avec les preuves', body: 'Résultats, requêtes rejouées et offre recommandée.' },
]

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="dot-grid fade-mask absolute inset-x-0 top-0 h-[520px]" />
      <Container className="relative grid gap-14 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,540px)] lg:py-24">
        <div className="flex flex-col gap-8">
          <div className="h-rise flex flex-col gap-5">
            <Eyebrow>Démo · 30 minutes</Eyebrow>
            <h1 className="font-heading text-[42px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance md:text-[58px]">
              Voyez une vraie faille prouvée sur votre SaaS.
            </h1>
            <p className="max-w-lg text-[17px] leading-relaxed text-pretty text-muted-foreground">
              Pas de slides : nous lançons HSentinel sur votre préproduction pendant l’appel.
            </p>
          </div>
          <ol className="flex flex-col">
            {STEPS.map((s, i) => (
              <li key={s.title} className="h-rise flex gap-4 border-t border-border py-5 [animation-delay:120ms]">
                <span className="font-mono text-[12px] text-steel">0{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[16px] font-semibold">{s.title}</h2>
                  <p className="text-[14.5px] text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-1 rounded-2xl bg-canvas p-5">
            <p className="text-[14.5px] text-muted-foreground">Vous préférez tester seul ?</p>
            <TextLink href="/signup">Démarrer l’essai de 7 jours</TextLink>
          </div>
        </div>
        <div className="h-rise [animation-delay:160ms]">
          <DemoForm defaultEmail={email} />
        </div>
      </Container>
    </section>
  )
}
