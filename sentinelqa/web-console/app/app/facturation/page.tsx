import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, PageHeader } from '@/components/console/page-header'
import { CODE_ASSISTED_PRICE, CREDIT_COSTS, formatEuro, OFFER_ORDER, OFFERS } from '@/lib/billing'
import { formatDay, montant } from '@/lib/console-data'
import { chargerConsole, couts } from '@/lib/console-reel'

export const metadata: Metadata = {
  title: 'Crédits et facturation — HSentinel',
  description: 'Le modèle de prix de HSentinel, et ce que coûte réellement chaque audit, mesuré dans l’API H et chez Hugging Face.',
}

// Un coût réel de quelques millièmes ne s'affiche pas « 0,00 $ » : sous le centime, trois décimales (lib/console-data).
const dollars = montant

export default async function BillingPage() {
  const c = couts(await chargerConsole())
  const bareme = [
    ['Audit QA (une mission)', `${CREDIT_COSTS.qaRun} crédit`],
    ['Campagne Pentest', `${CREDIT_COSTS.pentestPair} crédits / paire d’entreprises`],
    ['Diagnostic Code-Assisted', `${CREDIT_COSTS.codeAssisted} crédits`],
    ['Re-test d’une faille', 'gratuit'],
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', href: '/app' }, { label: 'Crédits et facturation' }]}
        title="Crédits et facturation"
        description="Le modèle de prix prévu au lancement, et ce que coûte vraiment chaque audit aujourd’hui. Aucun paiement n’est branché."
      />
      <main className="grid items-start gap-5 px-5 py-6 lg:grid-cols-2 lg:px-8">
        <Card title="Coût mesuré">
          <div className="flex flex-col gap-4 px-4 py-4">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="font-mono text-[34px] leading-none font-semibold whitespace-nowrap tabular-nums text-foreground">{dollars(c.semaine)}</span>
              <span className="text-[12.5px] text-muted-foreground">dépensés en 7 jours</span>
            </p>
            <dl className="grid grid-cols-3 gap-3 border-t border-border pt-3">
              {[
                ['Mission QA', dollars(c.moyenneQa, 3), 'en moyenne'],
                ['Audit du banc', dollars(c.moyenneBanc), 'en moyenne'],
                ['Depuis le début', dollars(c.total), `${c.missions} missions`],
              ].map(([label, value, hint]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-[11.5px] text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-[15px] font-semibold tabular-nums text-foreground">{value}</dd>
                  <dd className="font-mono text-[10.5px] text-subtle">{hint}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Chaque coût est lu mission par mission : steps et tokens dans l’API H, appels à Hugging Face pour les plans et les hypothèses.
            </p>
          </div>
        </Card>

        <Card title="Offres" action={<span className="font-mono text-[10.5px] text-subtle">aucune souscrite</span>}>
          <ul className="flex flex-col">
            {OFFER_ORDER.map((id) => {
              const o = OFFERS[id]
              return (
                <li key={id} className="flex flex-col gap-0.5 border-b border-border px-4 py-3">
                  <p className="text-[13px] font-semibold text-foreground">
                    {o.name} <span className="text-[11.5px] font-normal text-muted-foreground">{o.tagline}</span>
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    <span className="font-medium text-foreground">{o.price ? `${formatEuro(o.price)} / app / ${o.period}` : `Gratuit · ${o.period}`}</span> ·{' '}
                    {o.creditsPerApp} crédits / app · {o.maxApps} app{o.maxApps > 1 ? 's' : ''} max
                  </p>
                </li>
              )
            })}
            <li className="flex flex-col gap-0.5 px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground">Option Code-Assisted</p>
              <p className="text-[12px] text-muted-foreground">
                <span className="font-medium text-foreground">+{formatEuro(CODE_ASSISTED_PRICE)} / mois</span> · diagnostic jusqu’au fichier
              </p>
            </li>
          </ul>
          <p className="border-t border-border px-4 py-2.5 text-[12px]">
            <Link href="/tarifs" className="text-steel hover:underline">
              Le détail des offres
            </Link>
          </p>
        </Card>

        <Card title="Coût par application" action={c.depuis ? <span className="font-mono text-[10.5px] text-subtle">depuis le {formatDay(c.depuis)}</span> : null}>
          <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                {['Application', 'QA', 'Pentest', 'Total'].map((h, i) => (
                  <th key={h} scope="col" className={i ? 'px-3 py-2 text-right font-normal label-mono sm:px-4' : 'px-3 py-2 font-normal label-mono sm:px-4'}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {c.applications.map((a) => (
                <tr key={a.name}>
                  <th scope="row" className="px-3 py-2.5 text-[12.5px] font-medium text-foreground sm:px-4">
                    {a.name}
                  </th>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular-nums text-muted-foreground sm:px-4">{a.qa ? dollars(a.qa) : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] tabular-nums text-muted-foreground sm:px-4">{a.pentest ? dollars(a.pentest) : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[12px] font-semibold tabular-nums text-foreground sm:px-4">{dollars(a.qa + a.pentest)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        <Card title="Barème prévu">
          <dl className="flex flex-col">
            {bareme.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
                <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
                <dd className="font-mono text-[12px] text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="px-4 py-3 text-[12px] leading-relaxed text-muted-foreground">
            Une paire = une entreprise qui tente d’accéder aux données d’une autre. Sur le banc, Bêta tente d’accéder aux données d’Alpha.
          </p>
        </Card>
      </main>
    </>
  )
}
