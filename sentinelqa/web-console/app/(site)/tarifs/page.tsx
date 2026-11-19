import type { Metadata } from 'next'
import { PricingSection } from '@/components/landing/pricing'
import { ClosingCta } from '@/components/site/closing-cta'
import { PageHero, PillLink } from '@/components/site/ui'
import { hasSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Tarifs — HSentinel',
  description:
    'Découverte 7 jours, Launch QA continu, Scale QA + Pentest, option Code-Assisted et Audit Express : la tarification HSentinel.',
}

export default async function TarifsPage() {
  const signedIn = await hasSession()
  return (
    <>
      <PageHero
        eyebrow="Tarifs"
        title="Un prix par application. Sans surprise."
        body="Commencez seul avec l’essai de 7 jours, ou montrez-nous votre préproduction en démo. Les deux mènent au même abonnement."
      >
        <PillLink href="/demo" arrow>
          Demander une démo
        </PillLink>
        <PillLink href="/signup" variant="secondary">
          Démarrer l’essai
        </PillLink>
      </PageHero>
      <PricingSection signedIn={signedIn} />
      <ClosingCta title="Vous hésitez entre deux offres ?" body="En démo, nous lançons un premier audit sur votre préproduction et vous recommandons l’offre adaptée." />
    </>
  )
}
