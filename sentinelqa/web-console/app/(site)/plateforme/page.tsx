import type { Metadata } from 'next'
import { LivePipeline, LiveTerminal } from '@/components/landing/live-visuals'
import { Row } from '@/components/site/story'
import { TriggerCard } from '@/components/landing/trigger-card'
import { ClosingCta } from '@/components/site/closing-cta'
import { FindingReport, IntegrationChips, RoleMatrix } from '@/components/site/platform-visuals'
import { Container, PageHero, PillLink, SectionHeading } from '@/components/site/ui'

export const metadata: Metadata = {
  title: 'Plateforme — HSentinel',
  description:
    'Agent QA, Agent Pentest, preuves reproductibles et intégrations CI : comment HSentinel audite chaque déploiement de votre SaaS.',
}

export default function PlateformePage() {
  return (
    <>
      <PageHero
        eyebrow="Plateforme"
        title="Deux agents. Un pipeline. Des preuves."
        body="HSentinel explore votre préproduction comme vos clients, attaque comme un pentesteur et ne vous alerte que lorsqu’une fuite est démontrée."
      >
        <PillLink href="/demo" arrow>
          Demander une démo
        </PillLink>
        <PillLink href="/signup" variant="secondary">
          Démarrer l’essai
        </PillLink>
      </PageHero>

      <section className="border-b border-border py-16 lg:py-20">
        <Container className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Le pipeline"
            title="Explorer, rejouer, vérifier."
            body="Chaque audit suit les mêmes quatre étapes, du premier clic à la faille prouvée."
          />
          <div className="h-reveal mx-auto w-full max-w-3xl">
            <LivePipeline />
          </div>
        </Container>
      </section>

      <Row
        id="qa"
        eyebrow="Agent QA"
        title="Chaque rôle obtient ce qu’il doit obtenir."
        body="L’agent QA rejoue les parcours métier de chaque rôle à chaque pull request, compare les réponses au déploiement précédent et signale toute régression de droits avant la production."
        visual={<RoleMatrix />}
      />
      <Row
        id="pentest"
        eyebrow="Agent Pentest"
        title="Aucune entreprise ne voit les données d’une autre."
        body="Notre code rejoue chaque requête d’un client avec la session d’un autre. Un second agent ouvre ensuite un vrai navigateur pour confirmer la fuite à l’écran."
        visual={<LiveTerminal />}
        reverse
      />
      <Row
        id="preuves"
        eyebrow="Preuves et rapports"
        title="Une alerte, c’est une requête rejouée et une capture."
        body="Sévérité stable, étapes de reproduction et, avec l’option Code-Assisted, le fichier concerné. Votre équipe corrige ; HSentinel retest."
        visual={<FindingReport />}
      />

      <section id="integrations" className="scroll-mt-24 bg-canvas py-16 lg:py-24">
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <SectionHeading
              eyebrow="Intégrations"
              title="Branché sur votre CI en quelques minutes."
              body="Une commande, un webhook ou une GitHub Action suffit. Les tickets et les alertes arrivent là où votre équipe travaille déjà."
            />
            <IntegrationChips />
          </div>
          <div className="h-reveal">
            <TriggerCard />
          </div>
        </Container>
      </section>

      <ClosingCta />
    </>
  )
}
