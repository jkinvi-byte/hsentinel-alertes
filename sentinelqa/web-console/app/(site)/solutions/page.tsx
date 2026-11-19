import { Check } from 'lucide-react'
import type { Metadata } from 'next'
import { ClosingCta } from '@/components/site/closing-cta'
import { Container, Eyebrow, PageHero, PillLink } from '@/components/site/ui'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Solutions — HSentinel',
  description:
    'SaaS RH et paie, fintech, santé, conformité B2B : HSentinel prouve qu’aucun client ne voit les données d’un autre.',
}

const SOLUTIONS = [
  {
    id: 'rh',
    eyebrow: 'SaaS RH et paie',
    title: 'Les bulletins d’Alpha restent chez Alpha.',
    body: 'Salaires, arrêts maladie, numéros de sécurité sociale : une fuite entre entreprises clientes est un incident CNIL immédiat.',
    tests: ['Accès aux bulletins par identifiant d’entreprise', 'Exports CSV et PDF filtrés par client', 'Rôles salarié, manager, gestionnaire paie'],
    tone: 'bg-[#e8eefc]',
    quote: { k: 'GET /companies/alpha/payslips', v: 'session Bêta → refusé' },
  },
  {
    id: 'fintech',
    eyebrow: 'Fintech',
    title: 'Aucun client ne modifie l’IBAN d’un autre.',
    body: 'Comptes, bénéficiaires et virements : nous vérifions que chaque action sensible reste confinée au bon titulaire.',
    tests: ['Modification de bénéficiaires et d’IBAN', 'Lecture des relevés et transactions', 'Validation à plusieurs niveaux de droits'],
    tone: 'bg-[#e9f5ee]',
    quote: { k: 'PATCH /accounts/812/iban', v: 'session d’un autre client → refusé' },
  },
  {
    id: 'sante',
    eyebrow: 'Santé',
    title: 'Un cabinet ne lit jamais les dossiers d’un autre.',
    body: 'Les données de santé exigent un cloisonnement strict entre établissements, praticiens et patients.',
    tests: ['Dossiers patients et pièces jointes', 'Agendas et comptes rendus partagés', 'Accès praticien, secrétariat, patient'],
    tone: 'bg-[#f6ece6]',
    quote: { k: 'GET /clinics/4/records/221', v: 'praticien d’un autre cabinet → refusé' },
  },
  {
    id: 'conformite',
    eyebrow: 'Conformité B2B',
    title: 'Répondez aux questionnaires sécurité avec des preuves.',
    body: 'Vos prospects grands comptes demandent un pentest récent. Montrez un historique d’audits continus plutôt qu’un PDF d’il y a onze mois.',
    tests: ['Historique d’audits par déploiement', 'Rapport partageable avec vos prospects', 'Audit Express avant une signature'],
    tone: 'bg-canvas',
    quote: { k: 'Audit Express', v: 'rapport + retest sous 14 jours' },
  },
]

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Solutions"
        title="Là où une fuite entre clients coûte le plus cher."
        body="Chaque secteur a ses données critiques et ses rôles. HSentinel les teste tous, entreprise par entreprise."
      >
        <PillLink href="/demo" arrow>
          Demander une démo
        </PillLink>
      </PageHero>

      <div className="flex flex-col gap-6 py-16 lg:py-20">
        {SOLUTIONS.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <Container>
              <div className="h-reveal grid items-stretch gap-6 rounded-[28px] border border-border p-3 lg:grid-cols-2">
                <div className={cn('flex flex-col gap-5 p-6 md:p-9', i % 2 === 1 && 'lg:order-2')}>
                  <Eyebrow>{s.eyebrow}</Eyebrow>
                  <h2 className="font-heading text-[30px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance md:text-[38px]">
                    {s.title}
                  </h2>
                  <p className="text-[16px] leading-relaxed text-pretty text-muted-foreground">{s.body}</p>
                  <ul className="flex flex-col gap-2.5 border-t border-border pt-5">
                    {s.tests.map((t) => (
                      <li key={t} className="flex items-start gap-2.5 text-[14.5px]">
                        <Check className="mt-0.5 size-4 shrink-0 text-safe" aria-hidden="true" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn('flex min-h-[260px] items-center justify-center rounded-[20px] p-8', s.tone)}>
                  <div className="flex w-full max-w-sm flex-col gap-2 rounded-2xl bg-background p-4 font-mono text-[12px] shadow-[0_24px_50px_-30px_rgb(10_15_28/0.4)]">
                    <span className="text-muted-foreground">{s.quote.k}</span>
                    <span className="flex items-center gap-2 text-safe">
                      <Check className="size-3.5" aria-hidden="true" />
                      {s.quote.v}
                    </span>
                  </div>
                </div>
              </div>
            </Container>
          </section>
        ))}
      </div>

      <ClosingCta />
    </>
  )
}
