'use client'

import { Building2, KeyRound, Play } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { StatusBadge } from '@/components/console/status-badge'
import { secondaryButton } from '@/components/console/page-header'
import { type Application, formatAge, formatDateTime } from '@/lib/console-data'
import { cn } from '@/lib/utils'

// D-49 : les applications autorisées, en lecture seule. Ajouter une cible passe par le catalogue et une autorisation écrite (D-24),
// pas par un formulaire : rien n'est modifiable ici, donc rien ne fait semblant d'être enregistré.
export function ApplicationsManager({ initialApps }: { initialApps: Application[] }) {
  const [selectedId, setSelectedId] = useState(initialApps[0]?.id)
  const selected = initialApps.find((a) => a.id === selectedId) ?? initialApps[0]

  if (!selected) {
    return (
      <div className="panel flex flex-col items-center gap-2 px-4 py-12 text-center">
        <p className="text-[13px] font-medium text-foreground">Aucune application autorisée</p>
        <p className="text-[12px] text-muted-foreground">Une cible entre dans le catalogue avec son autorisation écrite.</p>
      </div>
    )
  }

  const watch = selected.watch
  const facts = [
    ['Environnement', selected.environment],
    ['Autorisation', selected.authorization ?? '—'],
    ['Dernier audit', selected.lastAuditAt ? formatDateTime(selected.lastAuditAt) : 'aucun'],
    [
      'Veille des mises à jour',
      watch?.active ? (watch.seenAt ? `active · vue il y a ${formatAge(watch.seenAt)}` : 'active') : 'inactive',
    ],
  ]

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <nav aria-label="Applications" className="panel flex flex-col p-1.5">
        {initialApps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => setSelectedId(app.id)}
            aria-current={app.id === selected.id ? 'true' : undefined}
            className={cn(
              'flex flex-col items-start gap-1 rounded-md px-3 py-2.5 text-left transition-colors',
              app.id === selected.id ? 'bg-foreground/[0.06]' : 'hover:bg-foreground/[0.03]',
            )}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-foreground">{app.name}</span>
              <StatusBadge status={app.status} count={app.openFindings} />
            </span>
            <span className="max-w-full truncate font-mono text-[10.5px] text-subtle">{app.url.replace(/^https?:\/\//, '')}</span>
          </button>
        ))}
      </nav>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="panel grid grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 bg-card px-4 py-3">
              <span className="text-[11.5px] text-muted-foreground">{label}</span>
              <span className="text-[13px] font-medium break-words text-foreground">{value}</span>
            </div>
          ))}
        </section>

        <section aria-labelledby="companies-title" className="panel flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 id="companies-title" className="text-[13px] font-semibold text-foreground">
                Comptes de test · {selected.name}
              </h2>
              <p className="text-[12px] text-muted-foreground">
                {selected.writes
                  ? 'Banc construit par l’équipe : comptes et données fictifs, écritures permises puis remises en état.'
                  : 'Consultation seule : aucune écriture métier ni changement de droits.'}
              </p>
            </div>
          </div>

          <ul className="flex flex-col">
            {selected.companies.map((company) => (
              <li key={company.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <span className="flex size-8 items-center justify-center rounded-md border border-border bg-foreground/[0.03]">
                  <Building2 className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
                <span className="min-w-[140px] text-[13px] font-medium text-foreground">{company.name}</span>
                <ul aria-label={`Rôles de ${company.name}`} className="flex flex-1 flex-wrap items-center gap-1.5">
                  {company.roles.map((role) => (
                    <li key={role} className="rounded-full border border-border bg-foreground/[0.03] px-2.5 py-0.5 text-[11.5px] text-foreground">
                      {role}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-2 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
            <KeyRound className="size-3.5 shrink-0" aria-hidden="true" />
            Les mots de passe ne sont jamais enregistrés ici : ils passent par un coffre H, le temps d’une mission.
          </p>
        </section>

        <section aria-labelledby="scenarios-title" className="panel flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <h2 id="scenarios-title" className="text-[13px] font-semibold text-foreground">
                Ce que les agents savent y tester
              </h2>
              <p className="text-[12px] text-muted-foreground">
                {selected.qa
                  ? `QA ${selected.qa.connexion ? 'connecté' : 'sans compte'}${selected.qa.modes.length ? ` · ${selected.qa.modes.map((m) => (m === 'guide' ? 'parcours dicté' : 'exploration')).join(', ')}` : ''}`
                  : 'Pas de QA sur cette cible.'}
              </p>
            </div>
            <Link href={`/app/nouveau?volet=${selected.qa ? 'qa' : 'pentest'}&cible=${encodeURIComponent(selected.id)}`} className={secondaryButton}>
              <Play className="size-3.5" aria-hidden="true" />
              Lancer un audit
            </Link>
          </div>
          {selected.scenarios?.length ? (
            <ul className="flex flex-col">
              {selected.scenarios.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-2.5 last:border-0">
                  <span className="w-20 font-mono text-[11px] text-subtle">{s.id}</span>
                  <span className="min-w-0 flex-1 text-[12.5px] text-foreground">{s.name}</span>
                  <span className="text-[11.5px] text-muted-foreground">{s.module}</span>
                  <span
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[11px]',
                      s.available ? 'border-safe/40 bg-safe/10 text-safe' : 'border-border text-muted-foreground',
                    )}
                  >
                    {s.available ? 'disponible' : 'pas encore'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-[12px] text-muted-foreground">Aucun scénario écrit pour cette cible : seul le QA s’y lance.</p>
          )}
        </section>
      </div>
    </div>
  )
}
