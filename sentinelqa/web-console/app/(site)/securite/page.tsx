import { Eye, KeyRound, Lock, Server, ShieldCheck, Trash2, X } from 'lucide-react'
import type { Metadata } from 'next'
import { ClosingCta } from '@/components/site/closing-cta'
import { Container, PageHero, SectionHeading } from '@/components/site/ui'

export const metadata: Metadata = {
  title: 'Sécurité et confiance — HSentinel',
  description:
    'Préproduction uniquement, propriété vérifiée, preuve avant alerte, lecture seule : les garanties de sécurité HSentinel.',
}

const PRINCIPLES = [
  { icon: Server, title: 'Préproduction uniquement', body: 'Les agents n’opèrent que sur les environnements de préproduction et de preview que vous déclarez.' },
  { icon: ShieldCheck, title: 'Propriété vérifiée', body: 'Un enregistrement DNS ou un fichier prouve que vous contrôlez le domaine avant tout audit.' },
  { icon: KeyRound, title: 'Comptes de test dédiés', body: 'Vous fournissez des comptes fictifs par rôle et par entreprise ; leurs secrets sont chiffrés.' },
  { icon: Eye, title: 'Preuve avant alerte', body: 'Une faille n’est signalée que si elle est rejouée et confirmée dans un vrai navigateur.' },
  { icon: Lock, title: 'Lecture seule du code', body: 'L’option Code-Assisted lit votre dépôt avec votre consentement explicite, sans jamais écrire.' },
  { icon: Trash2, title: 'Rétention maîtrisée', body: 'Captures et requêtes sont conservées pour le suivi des retests, puis supprimables à la demande.' },
]

const NEVER = [
  'Accéder à votre environnement de production',
  'Modifier, corriger ou pousser du code dans votre dépôt',
  'Attaquer un domaine dont la propriété n’est pas vérifiée',
  'Utiliser de vraies données clients pour nos tests',
]

const FAQ = [
  {
    q: 'Faut-il installer quelque chose dans notre application ?',
    a: 'Non. HSentinel teste votre préproduction depuis l’extérieur, comme un utilisateur. Seul le déclencheur (webhook ou GitHub Action) s’ajoute à votre CI.',
  },
  {
    q: 'Que se passe-t-il si un agent trouve une faille ?',
    a: 'Il la rejoue, la confirme à l’écran, puis ouvre un ticket avec la requête, la capture et la sévérité. Votre équipe corrige ; HSentinel relance un retest.',
  },
  {
    q: 'Les agents peuvent-ils casser notre préproduction ?',
    a: 'Les actions destructrices sont exclues par défaut et vous définissez les routes interdites. Les tests restent bornés aux comptes de test fournis.',
  },
  {
    q: 'Pouvons-nous partager les résultats avec nos prospects ?',
    a: 'Oui. Chaque audit produit un rapport partageable, utile pour vos questionnaires sécurité et vos due diligences.',
  },
]

export default function SecuritePage() {
  return (
    <>
      <PageHero
        eyebrow="Sécurité et confiance"
        title="Un outil de sécurité doit d’abord être sûr."
        body="Nous attaquons votre SaaS pour vous protéger. Voici exactement ce que nos agents font, et ce qu’ils ne feront jamais."
      />

      <section className="py-16 lg:py-24">
        <Container className="flex flex-col gap-12">
          <SectionHeading eyebrow="Nos principes" title="Les mêmes garanties pour tous les plans." />
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="h-reveal flex flex-col gap-3 border-t border-foreground pt-5">
                <p.icon className="size-5" aria-hidden="true" />
                <h3 className="text-[17px] font-semibold">{p.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-8">
        <Container>
          <div className="relative overflow-hidden rounded-[28px] bg-ink px-7 py-14 md:px-14 md:py-20">
            <div aria-hidden="true" className="dot-grid-dark absolute inset-0" />
            <div className="relative grid gap-12 lg:grid-cols-2">
              <SectionHeading dark eyebrow="Engagements" title="Ce que HSentinel ne fera jamais." />
              <ul className="flex flex-col">
                {NEVER.map((n) => (
                  <li key={n} className="h-reveal flex items-center gap-4 border-b border-ink-line py-5 text-[17px] text-white last:border-b-0">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f87171]/15 text-[#f87171]">
                      <X className="size-4" aria-hidden="true" />
                    </span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <Container className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <SectionHeading eyebrow="Questions fréquentes" title="Ce que nos clients demandent avant de commencer." />
          <div className="flex flex-col">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-border py-5 first:border-t">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[18px] leading-none transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="pt-3 pr-10 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <ClosingCta />
    </>
  )
}
