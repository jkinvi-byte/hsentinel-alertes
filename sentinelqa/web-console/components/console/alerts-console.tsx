'use client'

import Link from 'next/link'
import { useState } from 'react'
import useSWR from 'swr'
import { Bell, ExternalLink, RefreshCw } from 'lucide-react'
import { ConsoleHeader } from './console-header'
import { consoleRequest } from '@/lib/console-client'
import type { Alert, AlertData } from '@/lib/alert-types'

const severities: Record<string, string> = {
  critique: 'border-danger/30 bg-danger/10 text-danger',
  élevée: 'border-orange-300/30 bg-orange-300/5 text-orange-300',
  moyenne: 'border-amber-300/30 bg-amber-300/5 text-amber-300',
  faible: 'border-border text-muted-foreground',
}
const alertColors: Record<string, string> = {
  traitee: 'text-safe', echec: 'text-danger', en_cours: 'text-steel', a_traiter: 'text-amber-300',
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function AlertsConsole() {
  const [application, setApplication] = useState('')
  const path = `alertes?limite=50${application ? `&application=${encodeURIComponent(application)}` : ''}`
  const { data, error, isValidating, mutate } = useSWR(path, (key: string) => consoleRequest<AlertData>(key), {
    refreshInterval: 15000, shouldRetryOnError: false, revalidateOnFocus: true, keepPreviousData: true,
  })
  // Garder les choix du filtre pendant le chargement, sans afficher les résultats d'une autre application.
  const view = data?.application === (application || null) ? data : undefined
  const applications = data?.applications ?? []
  const names = new Map(applications.map(a => [a.id, a.nom]))

  return <><ConsoleHeader title="Alertes et tickets" />
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-5 lg:p-7">
      <div><p className="label-mono">Suivi de l’équipe</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Les constats, puis leurs alertes.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Retrouvez les constats prouvés et le suivi des notifications, avec les tickets GitHub disponibles.</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block w-full space-y-2 text-sm sm:max-w-xs"><span>Filtrer par application</span>
          <select className="console-field" value={application} onChange={e => setApplication(e.target.value)}>
            <option value="">Toutes les applications</option>
            {application && !names.has(application) && <option value={application}>{application}</option>}
            {applications.map(a => <option value={a.id} key={a.id}>{a.nom}</option>)}
          </select>
        </label>
        <button type="button" className="console-button" disabled={isValidating} onClick={() => { void mutate().catch(() => undefined) }}>
          <RefreshCw className={`size-4 ${isValidating ? 'animate-spin' : ''}`} aria-hidden="true" />Actualiser
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Constats récents', view?.bilan.total], ['Alertes envoyées', view?.bilan.envoyees],
          ['Alertes en échec', view?.bilan.en_echec], ['Tickets distincts', view?.bilan.tickets],
        ].map(([label, value]) => <div className="panel p-4" key={label}><dt className="label-mono">{label}</dt><dd className="mt-3 text-2xl font-semibold tabular-nums">{value ?? '—'}</dd></div>)}
      </dl>
      {error && <div role="alert" className="panel flex flex-wrap items-center justify-between gap-3 border-danger/30 p-4">
        <p className="text-sm">{error.message}</p><button className="console-button" onClick={() => { void mutate().catch(() => undefined) }}>Réessayer</button>
      </div>}
      {!view && !error && <p role="status" className="panel p-10 text-sm text-muted-foreground">Chargement des alertes…</p>}
      {view?.alertes.length === 0 && !error && <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
        <Bell className="size-8 text-steel" aria-hidden="true" /><h2 className="text-lg font-medium">Aucun constat enregistré</h2>
        <p className="max-w-md text-sm text-muted-foreground">Aucun constat ne correspond à ce filtre. Consultez les rapports des missions pour connaître les contrôles exécutés.</p>
        <Link href="/app" className="console-button">Voir les missions</Link>
      </div>}
      {view && view.alertes.length > 0 && <section className="space-y-4" aria-label="Liste des alertes">
        {view.alertes.map(alert => <AlertCard key={alert.id} alert={alert} applicationName={names.get(alert.application) || alert.application} />)}
      </section>}
      <p className="text-xs text-muted-foreground">Les compteurs portent sur les {view?.limite ?? 50} derniers constats du filtre sélectionné. L’état d’envoi reflète le suivi du service de notifications.</p>
    </main>
  </>
}

function AlertCard({ alert, applicationName }: { alert: Alert; applicationName: string }) {
  return <article className="panel space-y-4 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><p className="label-mono">{applicationName}</p><h2 className="mt-2 text-base font-medium">{alert.type}</h2></div>
      <span className={`rounded border px-2 py-1 text-xs ${severities[alert.gravite] ?? severities.faible}`}>{alert.gravite || 'Gravité non renseignée'}</span>
    </div>
    <p className="break-all rounded-md border border-border bg-background/40 p-3 font-mono text-xs">{alert.acces}</p>
    {alert.raisons.length > 0 && <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">{alert.raisons.map((reason, i) => <li key={i}>{reason}</li>)}</ul>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <div className="space-y-1"><p className={`text-sm ${alertColors[alert.alerte.etat] ?? 'text-muted-foreground'}`}>{alert.alerte.libelle || 'État non renseigné'}</p>
        <p className="text-xs text-muted-foreground">E-mail : {alert.alerte.email_envoye === true ? 'envoyé' : alert.alerte.email_envoye === false ? 'non envoyé' : 'non renseigné'} · {alert.alerte.tentatives} tentative{alert.alerte.tentatives === 1 ? '' : 's'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {alert.audit_id && UUID.test(alert.audit_id) && <Link className="console-button" href={`/app/missions/pentest/${alert.audit_id}`}>Voir le rapport</Link>}
        {alert.ticket ? <a className="console-button" href={alert.ticket.url} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" aria-hidden="true" />Ticket #{alert.ticket.numero}</a>
          : <span className="self-center text-xs text-muted-foreground">Aucun ticket associé</span>}
      </div>
    </div>
    {alert.alerte.erreur && <details className="text-xs text-danger"><summary className="cursor-pointer">Détail de l’échec d’envoi</summary><p className="mt-2 whitespace-pre-wrap break-words">{alert.alerte.erreur}</p></details>}
    {alert.quand && <time dateTime={alert.quand} className="block text-xs text-subtle">Constat du {new Date(alert.quand).toLocaleString('fr-FR')}</time>}
  </article>
}
