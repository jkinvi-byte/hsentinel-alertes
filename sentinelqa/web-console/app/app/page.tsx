import { ArrowRight, Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ActivityFeed } from '@/components/console/overview/activity-feed'
import { LiveBrowser } from '@/components/console/overview/live-browser'
import { Card, PageHeader, primaryButton, secondaryButton } from '@/components/console/page-header'
import { StatusBadge } from '@/components/console/status-badge'
import { formatAge, formatDateTime } from '@/lib/console-data'
import { activite, applications, chargerConsole, failles, indicateurs, sessionsNavigateur } from '@/lib/console-reel'

export const metadata: Metadata = {
  title: 'Vue d’ensemble — HSentinel',
  description: 'Toute l’activité de vos agents HSentinel : sessions navigateur, audits, failles et alertes.',
}


const nombre = (n: number) => n.toLocaleString('fr-FR')
const pluriel = (n: number, mot: string) => `${nombre(n)} ${mot}${n > 1 ? 's' : ''}`

// D-49 : les indicateurs se calculent sur nos missions et nos constats des 7 derniers jours ; aucun chiffre n'est écrit en dur.
export default async function OverviewPage() {
  const d = await chargerConsole()
  const k = indicateurs(d)
  const FINDINGS = failles(d)
  const APPLICATIONS = applications(d)
  const BROWSER_SESSIONS = sessionsNavigateur(d)
  const ACTIVITY = activite(d)
  const KPIS = [
    { label: 'Sessions navigateur', value: nombre(k.sessions), hint: '7 derniers jours', delta: `+${nombre(k.sessionsJour)} aujourd’hui`, href: '#sessions', action: 'Voir les sessions des agents' },
    { label: 'Pages explorées', value: nombre(k.pages), hint: 'par les agents', delta: `+${nombre(k.pagesJour)} aujourd’hui`, href: '/app/applications', action: 'Voir la couverture par application' },
    { label: 'Audits terminés', value: nombre(k.audits), hint: pluriel(k.applicationsAuditees, 'application'), delta: `+${nombre(k.auditsJour)} aujourd’hui`, href: '/app/audits', action: 'Voir les audits' },
    { label: 'Failles ouvertes', value: nombre(k.failles), hint: pluriel(k.critiques, 'critique'), delta: k.failles ? 'à traiter' : 'aucune', danger: k.failles > 0, href: '/app/diagnostic?statut=ouverte', action: 'Voir les failles ouvertes' },
  ]
  const open = FINDINGS.find((f) => f.status === 'ouverte')

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console' }, { label: 'Vue d’ensemble' }]}
        title="Vue d’ensemble"
        description="Tout ce que vos agents ont fait dans le navigateur : sessions, audits, failles prouvées et alertes envoyées."
        actions={
          <>
            <Link href="/app/nouveau" className={secondaryButton}>
              <Plus className="size-3.5" aria-hidden="true" />
              Lancer un audit
            </Link>
            <Link href="/app/audits" className={primaryButton}>
              Voir les audits
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </>
        }
      />

      <main className="flex flex-col gap-5 px-5 py-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
          {KPIS.map((kpi) => (
            <li key={kpi.label} className="flex">
              <Link
                href={kpi.href}
                className="group flex flex-1 flex-col gap-1 bg-card px-4 py-4 transition-colors hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-steel"
              >
                <span className="flex items-center justify-between gap-2 text-[12px] text-muted-foreground">
                  {kpi.label}
                  <ArrowRight
                    className="size-3.5 text-subtle opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                {/* Sur téléphone, « +30 aujourd’hui » passe sous le chiffre au lieu d'être rogné (relevé par notre agent QA, D-53). */}
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={`font-heading text-[26px] leading-none font-bold tabular-nums ${kpi.danger ? 'text-danger' : 'text-foreground'}`}>
                    {kpi.value}
                  </span>
                  <span className={`font-mono text-[10.5px] whitespace-nowrap ${kpi.danger ? 'text-danger' : 'text-safe'}`}>{kpi.delta}</span>
                </span>
                <span className="font-mono text-[10.5px] text-subtle">{kpi.hint}</span>
                <span className="sr-only">{kpi.action}</span>
              </Link>
            </li>
          ))}
        </ul>

        {open ? (
          <Link
            href={`/app/diagnostic/${open.id}`}
className="group flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-danger/30 border-l-[3px] border-l-danger bg-danger-soft px-4 py-3 transition-colors hover:border-danger/50"
  >
  <span className="flex min-w-0 flex-1 basis-[260px] flex-col gap-1.5">
  <span className="flex flex-wrap items-center gap-2">
  <span className="rounded border border-danger/50 bg-danger/10 px-1.5 font-mono text-[10px] leading-[18px] font-semibold uppercase tracking-wider text-danger">
  Faille principale · {open.severity}
  </span>
  <span className="text-[12px] text-muted-foreground">
  {open.app} · ouverte depuis {formatAge(open.detectedAt)}
  </span>
  </span>
  <span className="text-[14px] font-semibold text-pretty text-foreground">{open.title}</span>
  </span>
  <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-danger">
              Voir le diagnostic
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
        ) : null}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-5">
            <div id="sessions" className="scroll-mt-6">
              <LiveBrowser sessions={BROWSER_SESSIONS} />
            </div>

            <Card
              title="Applications surveillées"
              action={
                <Link href="/app/applications" className="text-[12px] text-steel hover:underline">
                  Gérer
                </Link>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="px-4 py-2 label-mono font-normal">Application</th>
                      <th scope="col" className="px-4 py-2 label-mono font-normal">Comptes testés</th>
                      <th scope="col" className="px-4 py-2 label-mono font-normal">Dernier audit</th>
                      <th scope="col" className="px-4 py-2 label-mono font-normal">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {APPLICATIONS.map((app) => (
                      <tr key={app.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="block font-medium text-foreground">{app.name}</span>
                          <span className="font-mono text-[10.5px] text-subtle">{app.url}</span>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{app.companies.map((c) => c.name).join(', ') || '—'}</td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{formatDateTime(app.lastAuditAt)}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={app.status} count={app.openFindings} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <Card title="Activité récente">
            <div className="px-4 pt-2 pb-1">
              <ActivityFeed events={ACTIVITY} />
            </div>
          </Card>
        </div>
      </main>
    </>
  )
}
