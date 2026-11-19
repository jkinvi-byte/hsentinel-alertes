'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, ClipboardList, RefreshCw } from 'lucide-react'
import { ConsoleHeader } from './console-header'
import { consoleRequest } from '@/lib/console-client'
import { formatMoney, overallLabel } from '@/lib/mission-view.mjs'
import type { Mission, Module } from '@/lib/mission-types'

export function MissionConsole() {
  const [module, setModule] = useState<Module>('qa')
  const { data, error, isLoading, mutate } = useSWR(`missions/${module}`, (path: string) => consoleRequest<{ missions: Mission[] }>(path), {
    refreshInterval: (data) => data?.missions.some(m => ['en_attente', 'en_cours'].includes(m.status)) ? 3000 : 15000,
    revalidateOnFocus: true, shouldRetryOnError: false,
  })
  const rows = data?.missions ?? []
  const active = rows.filter(m => ['en_attente', 'en_cours'].includes(m.status)).length
  const withGaps = rows.filter(m => m.summary.failed > 0).length
  const uncertain = rows.filter(m => m.summary.inconclusive > 0).length
  return <>
    <ConsoleHeader title="Les missions de votre équipe" />
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-5 lg:p-7">
      <div><h1 className="text-2xl font-semibold tracking-tight">Chaque test, ses preuves.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Préparez un parcours, observez l’agent et retrouvez les résultats vérifiés. Un test incomplet reste visible.</p></div>
      <div className="flex gap-1 border-b border-border" role="group" aria-label="Volet des missions">
        {(['qa', 'pentest'] as const).map(m => <button key={m} type="button" aria-pressed={m === module} onClick={() => setModule(m)} className={`border-b-2 px-5 py-3 text-sm ${module === m ? 'border-steel text-foreground' : 'border-transparent text-muted-foreground'}`}>{m === 'qa' ? 'QA fonctionnel' : 'Pentest'}</button>)}
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Missions récentes', rows.length], ['En attente / en cours', active], ['Avec un écart', withGaps], ['À confirmer', uncertain]].map(([label, value]) => <div className="panel p-4" key={label}><dt className="label-mono">{label}</dt><dd className="mt-3 text-2xl font-semibold tabular-nums">{data ? value : '—'}</dd></div>)}
      </dl>
      {error && <div role="alert" className="panel flex flex-wrap items-center justify-between gap-3 border-danger/30 p-4"><p className="text-sm">{error.message}</p><button className="console-button" onClick={() => mutate()}><RefreshCw className="size-4" aria-hidden="true" />Réessayer</button></div>}
      {isLoading && <div role="status" className="panel p-10 text-sm text-muted-foreground">Chargement des missions…</div>}
      {!isLoading && !error && rows.length === 0 && <div className="panel flex flex-col items-center gap-4 px-6 py-14 text-center"><ClipboardList className="size-9 text-steel" aria-hidden="true" /><h2 className="text-lg font-medium">Votre première mission commence ici</h2><p className="max-w-md text-sm text-muted-foreground">Choisissez une application et définissez ce que vous voulez vérifier.</p><Link className="console-button primary" href={`/app/nouveau?volet=${module}`}>Préparer une mission</Link></div>}
      {rows.length > 0 && <section aria-label="Historique des missions" className="panel divide-y divide-border overflow-hidden">
        {rows.map(m => <Link key={m.id} href={`/app/missions/${module}/${m.id}`} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-foreground/[0.025] focus-visible:outline-2 focus-visible:outline-steel">
          <div className="min-w-0 flex-1 basis-56"><div className="flex items-center gap-2"><span className="label-mono">{module === 'qa' ? 'QA' : 'Pentest'}</span>{m.legacy && <span className="text-xs text-muted-foreground">Rapport historique</span>}</div><h2 className="mt-1 text-sm font-medium">{m.title}</h2><p className="mt-1 break-all text-xs text-muted-foreground">{m.target}</p></div>
          <div className="flex items-center gap-4"><div className="text-right"><p className={`text-xs ${m.summary.failed ? 'text-danger' : m.summary.inconclusive ? 'text-warn' : 'text-muted-foreground'}`}>{overallLabel(m)}</p><p className="mt-1 font-mono text-[11px] text-subtle">{m.duration == null ? 'Durée non mesurée' : `${m.duration.toLocaleString('fr-FR')} s`} · H : {formatMoney(m.costH)}</p></div><ArrowUpRight className="size-4 shrink-0 text-subtle" aria-hidden="true" /></div>
        </Link>)}
      </section>}
      <p className="text-xs text-muted-foreground">Les compteurs portent sur les 30 dernières missions du volet sélectionné. Les résultats décrivent uniquement les contrôles exécutés.</p>
    </main>
  </>
}
