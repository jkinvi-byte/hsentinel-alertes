'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import {
  ANNUAL_DISCOUNT,
  AUDIT_EXPRESS_PRICE,
  CODE_ASSISTED_PRICE,
  OFFERS as BILLING_OFFERS,
} from '@/lib/billing'
import { cn } from '@/lib/utils'

const PRICES = {
  launch: BILLING_OFFERS.launch.price,
  scale: BILLING_OFFERS.scale.price,
  codeAssisted: CODE_ASSISTED_PRICE,
} as const

const creditsPoint = (id: 'decouverte' | 'launch' | 'scale') => ({
  strong: `${BILLING_OFFERS[id].creditsPerApp} crédits inclus par application`,
  rest: id === 'decouverte' ? ', 1 application et 3 entreprises de test.' : ', rechargeables à tout moment avec plafond de dépense.',
})

type View = 'offres' | 'options'

type Offer = {
  id: string
  name: string
  badge: string
  intro: string
  featured?: boolean
  cta: string
  points: { strong: string; rest: string }[]
  footnote: string
  addonLabel: string
}

const OFFERS: Offer[] = [
  {
    id: 'decouverte',
    name: 'Découverte · 7 jours',
    badge: 'essai 7 jours',
    intro: 'Évaluez la vérification automatisée sur votre environnement de préproduction.',
    cta: 'Démarrer l’essai de 7 jours',
    points: [
      { strong: '7 jours d’accès complet', rest: ' sur préproduction, coordonnées bancaires enregistrées dès l’ouverture.' },
      { strong: 'Passage automatique en abonnement', rest: ' à J+7, avec rappel préalable et annulation libre avant échéance.' },
      { strong: 'Preuves reproductibles', rest: ' et diagnostic orienté, sans modification de votre code.' },
      creditsPoint('decouverte'),
    ],
    footnote: 'Renouvellement automatique à J+7 · détection et preuve uniquement',
    addonLabel: 'Option Code-Assisted (dès J+7)',
  },
  {
    id: 'launch',
    name: 'Launch',
    badge: 'QA continu',
    intro: 'Validez vos pull requests et previews de déploiement à chaque livraison.',
    cta: 'Choisir Launch',
    points: [
      { strong: 'Contrôle QA à chaque pull request', rest: ' et preview, contre les régressions fonctionnelles et d’accès.' },
      { strong: 'Preuves reproductibles et sévérité stable', rest: ' pour trier les anomalies sans bruit.' },
      { strong: 'Rapports et tickets actionnables', rest: ' pour vos développeurs, sans intervention sur le code.' },
      creditsPoint('launch'),
    ],
    footnote: 'Sans accès code par défaut · détection et preuve uniquement',
    addonLabel: 'Option Code-Assisted',
  },
  {
    id: 'scale',
    name: 'Scale',
    badge: 'QA + Pentest',
    intro: 'Couverture QA continue et campagnes de tests d’intrusion sur rôles et accès.',
    featured: true,
    cta: 'Choisir Scale',
    points: [
      { strong: 'Tout Launch', rest: ', complété par des campagnes de pentest planifiées ou à la demande.' },
      { strong: 'Vérification des rôles et permissions', rest: ', avec preuves reproductibles et retests.' },
      { strong: 'Exploration priorisée', rest: ' et diagnostic vers le fichier concerné ; HSentinel n’applique pas les correctifs.' },
      creditsPoint('scale'),
    ],
    footnote: 'Pour les startups de 10 à 50 personnes · détection et preuve uniquement',
    addonLabel: 'Option Code-Assisted',
  },
]

function formatEuro(value: number) {
  return `${value.toLocaleString('fr-FR')} €`
}

function PointList({ points }: { points: Offer['points'] }) {
  return (
    <ul className="flex flex-col gap-2.5 border-t border-border pt-4">
      {points.map((point) => (
        <li key={point.strong} className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground">
          <Check className="mt-1 size-3.5 shrink-0 text-safe" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-foreground">{point.strong}</strong>
            {point.rest}
          </span>
        </li>
      ))}
    </ul>
  )
}

function CtaLink({ href, featured, children }: { href: string; featured?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex h-9 items-center justify-center rounded-md text-[13px] font-semibold transition-colors',
        featured ? 'bg-steel text-foreground hover:bg-[#2f72e0]' : 'border border-border text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </Link>
  )
}

function Badge({ children, featured }: { children: React.ReactNode; featured?: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded border px-1.5 font-mono text-[10px] leading-[18px]',
        featured ? 'border-steel/40 text-steel' : 'border-border text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}

export function PricingSection({ signedIn }: { signedIn: boolean }) {
  const [view, setView] = useState<View>('offres')
  const [annual, setAnnual] = useState(false)
  const [addon, setAddon] = useState(false)

  const price = (monthly: number) => (annual ? Math.round(monthly * ANNUAL_DISCOUNT) : monthly)
  const launch = price(PRICES.launch)
  const scale = price(PRICES.scale)
  const codeAssisted = price(PRICES.codeAssisted)
  const addonSuffix = ' / mois'
  const ctaHref = (offer: string) => (signedIn ? '/app' : `/login?offre=${offer}${addon ? '&option=code-assisted' : ''}`)

  const priceBlock: Record<string, { amount: string; unit: string; note: React.ReactNode }> = {
    decouverte: {
      amount: '0 €',
      unit: 'pendant 7 jours',
      note: (
        <>
          Carte bancaire requise au démarrage · passage automatique à{' '}
          <strong className="font-semibold text-foreground">{formatEuro(launch + (addon ? codeAssisted : 0))} / mois</strong>
          {annual ? ` (annuel -15 %, soit ${formatEuro(launch * 12)} / an)` : ''} après 7 jours, sauf annulation avant J+7.
        </>
      ),
    },
    launch: {
      amount: formatEuro(launch),
      unit: '/ mois',
      note: annual
        ? `Tarif annuel -15 %, soit ${formatEuro(launch * 12)} / an, par application sur préproduction et previews.`
        : 'Abonnement par application · exécution continue sur préproduction et environnements de preview.',
    },
    scale: {
      amount: formatEuro(scale),
      unit: '/ mois',
      note: annual
        ? `Tarif annuel -15 %, soit ${formatEuro(scale * 12)} / an · QA continu, pentests, rôles et retests.`
        : 'Abonnement complet pour équipes multi-rôles B2B · QA continu, pentests planifiés ou à la demande et retests.',
    },
  }

  return (
    <section id="offres" className="scroll-mt-12 border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-16 lg:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="label-mono text-steel">Tarification · startups de 10 à 50 personnes</p>
            <h2 className="font-heading text-[26px] leading-tight font-bold tracking-tight text-balance text-foreground md:text-[32px]">
              Vérification continue et tests d’intrusion orientés preuves.
            </h2>
            <p className="text-[14.5px] leading-relaxed text-pretty text-muted-foreground">
              HSentinel détecte, prouve et oriente le diagnostic vers le fichier concerné, sans corriger ni maintenir votre code.
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div role="tablist" aria-label="Vue tarifaire" className="flex rounded-md border border-border bg-secondary p-0.5">
              {(
                [
                  { id: 'offres', label: 'Offres' },
                  { id: 'options', label: 'Options & Audit' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={view === tab.id}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setView(tab.id)}
                  className={cn(
                    'rounded px-3 py-1 text-[12.5px] font-medium transition-colors',
                    view === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 text-[12.5px]">
              <span className={cn(annual ? 'text-muted-foreground' : 'text-foreground')}>Mensuel</span>
              <button
                type="button"
                role="switch"
                aria-checked={annual}
                aria-label="Facturation annuelle (-15 %)"
                onClick={() => setAnnual((v) => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
                  annual ? 'border-steel bg-steel' : 'border-border bg-secondary',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-3.5 rounded-full bg-white transition-transform',
                    annual ? 'translate-x-[18px]' : 'translate-x-[2px]',
                  )}
                />
              </button>
              <span className={cn(annual ? 'text-foreground' : 'text-muted-foreground')}>Annuel</span>
              <span className="rounded border border-safe/40 px-1.5 font-mono text-[10px] leading-[18px] text-safe">-15 %</span>
            </div>
          </div>
        </div>

        {view === 'offres' ? (
          <div id="panel-offres" role="tabpanel" aria-labelledby="tab-offres" className="grid gap-4 lg:grid-cols-3">
            {OFFERS.map((offer) => {
              const block = priceBlock[offer.id]
              return (
                <article
                  key={offer.id}
                  className={cn('panel flex flex-col gap-5 p-6', offer.featured && 'border-steel/50 bg-steel/[0.06]')}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[16px] font-semibold text-foreground">{offer.name}</h3>
                      <Badge featured={offer.featured}>{offer.featured ? 'recommandé' : offer.badge}</Badge>
                    </div>
                    {offer.featured ? <p className="font-mono text-[11px] text-steel">{offer.badge}</p> : null}
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{offer.intro}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="flex items-baseline gap-2">
                      <span className="font-heading text-[30px] font-bold tracking-tight text-foreground tabular-nums">{block.amount}</span>
                      <span className="font-mono text-[11px] text-subtle">{block.unit}</span>
                    </p>
                    <p className="min-h-[3.25rem] text-[12px] leading-relaxed text-muted-foreground">{block.note}</p>
                  </div>

                  <CtaLink href={ctaHref(offer.id)} featured={offer.featured}>
                    {offer.cta}
                  </CtaLink>

                  <PointList points={offer.points} />

                  <div className="mt-auto flex flex-col gap-4">
                    <div className="rounded-md border border-border bg-secondary p-3">
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-foreground">
                          <input
                            type="checkbox"
                            checked={addon}
                            onChange={(e) => setAddon(e.target.checked)}
                            className="size-3.5 accent-[var(--color-steel)]"
                          />
                          {offer.addonLabel}
                        </label>
                        <span
                          className={cn(
                            'shrink-0 font-mono text-[11px] whitespace-nowrap tabular-nums',
                            offer.featured ? 'text-steel' : 'text-muted-foreground',
                          )}
                        >
                          +{formatEuro(codeAssisted)}
                          {addonSuffix}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11.5px] leading-relaxed text-subtle">
                        Lecture seule du dépôt et localisation du fichier concerné ; la correction reste à la charge de votre équipe.
                      </p>
                    </div>
                    <p className="border-t border-border pt-3 font-mono text-[10.5px] text-subtle">{offer.footnote}</p>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div id="panel-options" role="tabpanel" aria-labelledby="tab-options" className="grid gap-4 lg:grid-cols-2">
            <article className="panel flex flex-col gap-5 border-steel/50 bg-steel/[0.06] p-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] font-semibold text-foreground">Option Code-Assisted</h3>
                  <Badge featured>add-on mensuel</Badge>
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Analyse en lecture seule du dépôt pour orienter l’exploration et désigner le fichier en cause.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="flex items-baseline gap-2">
                  <span className="font-heading text-[30px] font-bold tracking-tight text-foreground tabular-nums">+{formatEuro(codeAssisted)}</span>
                  <span className="font-mono text-[11px] text-subtle">{annual ? '/ mois (-15 %)' : '/ mois'}</span>
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Aide au ciblage et au diagnostic uniquement : HSentinel ne modifie jamais votre code source.
                </p>
              </div>
              <CtaLink href={signedIn ? '/app' : '/login?option=code-assisted'} featured>
                Activer Code-Assisted
              </CtaLink>
              <PointList
                points={[
                  { strong: 'Accès en lecture seule', rest: ' à votre dépôt, avec consentement explicite de votre équipe.' },
                  { strong: 'Ciblage des routes sensibles', rest: ' pour concentrer les tests là où le risque est réel.' },
                  { strong: 'Piste de diagnostic citant le fichier', rest: ' pour accélérer la correction par vos développeurs.' },
                ]}
              />
              <p className="mt-auto border-t border-border pt-3 font-mono text-[10.5px] text-subtle">
                Orientation diagnostique uniquement · aucune correction appliquée
              </p>
            </article>

            <article className="panel flex flex-col gap-5 p-6">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[16px] font-semibold text-foreground">Audit Express</h3>
                  <Badge>ponctuel · 14 jours</Badge>
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  Campagne de test d’intrusion ciblée avant une signature client B2B ou un jalon de conformité.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="flex items-baseline gap-2">
                  <span className="font-heading text-[30px] font-bold tracking-tight text-foreground tabular-nums">
                    {formatEuro(AUDIT_EXPRESS_PRICE)}
                  </span>
                  <span className="font-mono text-[11px] text-subtle">paiement unique</span>
                </p>
                <p className="text-[12px] leading-relaxed text-muted-foreground">
                  Intervention sur une fenêtre de 14 jours, avec rapport de preuves et vérification après correctifs.
                </p>
              </div>
              <CtaLink href={signedIn ? '/app' : '/login?offre=audit-express'}>Commander l’Audit Express</CtaLink>
              <PointList
                points={[
                  { strong: 'Campagne de pentest dédiée', rest: ' sur votre environnement de préproduction autorisé.' },
                  { strong: 'Synthèse et preuves reproductibles', rest: ' à partager avec vos équipes techniques ou prospects.' },
                  { strong: 'Retest inclus sous 14 jours', rest: ' pour confirmer la prise en compte des correctifs.' },
                ]}
              />
              <p className="mt-auto border-t border-border pt-3 font-mono text-[10.5px] text-subtle">
                Sans abonnement récurrent · détection et preuve uniquement
              </p>
            </article>
          </div>
        )}

        <p className="font-mono text-[10.5px] text-subtle">
          La correction et la maintenance du code restent assurées par votre équipe.
        </p>
      </div>
    </section>
  )
}
