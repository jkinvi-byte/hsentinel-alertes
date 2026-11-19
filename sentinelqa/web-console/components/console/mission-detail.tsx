'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, ExternalLink, RefreshCw, Square } from 'lucide-react'
import { ConsoleHeader } from './console-header'
import { ResultStatusBadge } from './result-status'
import { RoleMatrix } from './role-matrix'
import { consoleRequest } from '@/lib/console-client'
import { formatMoney, overallLabel, interruptionLabel } from '@/lib/mission-view.mjs'
import type { Mission, Module, Event, Result } from '@/lib/mission-types'

const classifications: Record<string, string> = {
  demonstrated_vulnerability: 'Faille démontrée par le code',
  configuration_weakness: 'Faiblesse de configuration',
  tool_candidate: 'Candidat d’outil · non confirmé',
  observation: 'Observation',
}

export function MissionDetail({ module, id }: { module: Module; id: string }) {
  const { data, error, mutate } = useSWR(`missions/${module}/${id}`, (path: string) => consoleRequest<{ mission: Mission; events: Event[] }>(path), {
    refreshInterval: data => data && ['en_attente', 'en_cours'].includes(data.mission.status) ? 1800 : 0,
    shouldRetryOnError: false, revalidateOnFocus: true,
  })
  const [stopping, setStopping] = useState(false)
  const [stopAsked, setStopAsked] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)
  const stopLock = useRef(false)
  const m = data?.mission
  const accessResults = m?.results.filter(r => ['connexion', 'identite'].includes(r.type)) ?? []
  const otherResults = m?.results.filter(r => !['connexion', 'identite'].includes(r.type)) ?? []
  async function stop() {
    if (stopLock.current || stopAsked) return
    stopLock.current = true; setStopping(true); setStopError(null)
    try { await consoleRequest(`missions/${module}/${id}/arret`, { method: 'POST' }); setStopAsked(true); await mutate() }
    catch (e) { setStopError(e instanceof Error ? e.message : 'L’arrêt a échoué.') }
    finally { stopLock.current = false; setStopping(false) }
  }
  return <><ConsoleHeader title={module === 'qa' ? 'Mission QA' : 'Mission Pentest'} />
    <main className="mx-auto w-full max-w-6xl space-y-6 p-5 lg:p-7">
      <Link href="/app" className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" aria-hidden="true" />Toutes les missions</Link>
      {error && <div role="alert" className="panel flex flex-wrap items-center justify-between gap-3 p-5"><p className="text-sm">{error.message}</p><button className="console-button" onClick={() => mutate()}><RefreshCw className="size-4" />Réessayer</button></div>}
      {!m && !error && <p role="status" className="panel p-10 text-sm text-muted-foreground">Chargement de la mission…</p>}
      {m && <>
        <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="label-mono">{module === 'qa' ? 'QA fonctionnel' : 'Pentest'}{m.legacy ? ' / rapport historique' : ''}</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{m.title}</h1><p className="mt-2 break-all text-sm text-muted-foreground">{m.target}</p><p className="mt-3 text-sm">{overallLabel(m)}</p></div>
          {m.canStop && <button type="button" className="console-button" disabled={stopping || stopAsked || m.stopRequested} onClick={stop}><Square className="size-3.5" aria-hidden="true" />{stopping ? 'Envoi…' : stopAsked || m.stopRequested ? 'Arrêt demandé…' : 'Arrêter la mission'}</button>}
        </header>
        {(stopError || m.error) && <p role="alert" className="panel border-danger/30 p-4 text-sm text-danger">{stopError || m.error}</p>}
        {m.status === 'en_attente' && <p role="status" className="panel p-4 text-sm text-muted-foreground">La mission est enregistrée. Elle attend qu’un agent soit disponible ; aucune progression n’est encore annoncée.</p>}
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[['Durée', m.duration == null ? 'Non mesurée' : `${m.duration.toLocaleString('fr-FR')} s`], ['Coût H', formatMoney(m.costH)], ['Coût HF', formatMoney(m.costHf)], ['Résultats vérifiés', `${m.summary.passed + m.summary.failed} / ${m.results.length}`]].map(([label, value]) => <div key={label} className="panel p-4"><dt className="label-mono">{label}</dt><dd className="mt-2 font-mono text-sm">{value}</dd></div>)}</dl>
        {m.securityFindings && <section className="panel space-y-2 p-5" aria-label="Bilan de sécurité"><h2 className="text-base font-medium">Bilan de sécurité</h2><p className="text-sm">{m.securityFindings.demonstrated} faille(s) unique(s) démontrée(s) · {m.securityFindings.configuration} assertion(s) de configuration en écart · {m.securityFindings.candidates} candidat(s) d’outil non confirmé(s).</p>{m.inference && <p className="text-xs text-muted-foreground">Priorisation HF : {m.inference.status} · {m.inference.reason}</p>}</section>}
        {m.coverage && <section className="panel space-y-3 p-5" aria-label="Couverture d’exécution">
          <h2 className="text-base font-medium">Couverture réellement exécutée</h2>
          <p className="text-sm">{m.coverage.endpoints ?? 'Non mesuré'} ressource(s) · {m.coverage.activeExecuted ?? 0}/{m.coverage.activeAuthorized ?? 0} opération(s) active(s) · {m.coverage.accessResources ?? 0} ressource(s) IDOR ({m.coverage.accessDiscovered ?? 0} découverte(s)) · {m.coverage.identities ?? 0} identité(s) vérifiée(s).</p>
          <p className="text-sm">{m.coverage.formsObserved ?? 0} formulaire(s) observé(s) · {m.coverage.formsSubmitted ?? 0} connexion(s) par formulaire · {m.coverage.businessFormsSubmitted ?? 0} formulaire(s) métier soumis par le runner · {m.coverage.mutations === null ? 'mutations non mesurées' : `${m.coverage.mutations} mutation(s)`}.</p>
          <p className="text-xs text-muted-foreground">{m.coverage.measurementSource === 'target_observer' ? 'Méthodes HTTP observées' : 'Méthodes du runner'} : {m.coverage.methods.join(', ') || 'aucune'}. {m.coverage.limitations}</p>
          {m.rulesExecuted.length > 0 && <p className="text-xs">Règles exécutées : {m.rulesExecuted.join(', ')}</p>}
          {m.rulesSkipped.length > 0 && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Règles non exécutées ou interrompues</summary><ul className="mt-2 space-y-1">{m.rulesSkipped.map((r, i) => <li key={`${r.id}-${i}`}>{r.id} · {r.reason}</li>)}</ul></details>}
        </section>}
        {m.matrix && <section className="panel space-y-3 p-5" aria-label="Matrice IDOR"><h2 className="text-base font-medium">Matrice IDOR · A / anonyme / B</h2><p className="text-xs text-muted-foreground">Chaque case vient d’une lecture attribuée. Une case vide signale une preuve insuffisante, pas une autorisation.</p><RoleMatrix matrix={m.matrix} /></section>}
        {m.interruption && <p role="status" className="panel border-warn/30 p-4 text-sm text-warn">{interruptionLabel(m.interruption)}. Les résultats déjà recueillis restent consultables.</p>}
        {accessResults.length > 0 && <section className="space-y-3" aria-labelledby="access-results">
          <h2 id="access-results" className="text-base font-medium">Connexion et identité</h2>
          {accessResults.map((r, i) => <ResultCard key={`${r.id}-${i}`} result={r} evidence={m.evidence} />)}
        </section>}
        {otherResults.length > 0 && <section className="space-y-3" aria-labelledby="results">
          <h2 id="results" className="text-base font-medium">Résultats et preuves</h2>
          {otherResults.map((r, i) => <ResultCard key={`${r.id}-${i}`} result={r} evidence={m.evidence} />)}
        </section>}
        {m.results.length === 0 && <section className="panel p-5"><h2 className="text-base font-medium">Les résultats apparaîtront ici</h2><p className="mt-2 text-sm text-muted-foreground">{m.hasReport ? 'Ce rapport ne contient aucun contrôle exploitable. Aucun verdict global ne peut en être déduit.' : 'L’exécution doit produire ses observations avant de conclure.'}</p></section>}
        {m.evidence.length > 0 && <section className="space-y-3" aria-label="Preuves recueillies"><h2 className="text-base font-medium">Preuves recueillies</h2><div className="grid gap-3 md:grid-cols-2">{m.evidence.map(e => <article id={`evidence-${encodeURIComponent(e.id)}`} key={e.id} className="panel overflow-hidden"><div className="p-4"><p className="text-sm">{e.title}</p>{e.url && <p className="mt-1 break-all text-xs text-muted-foreground">{e.url}</p>}
                {e.httpStatus !== null && <p className="mt-3 font-mono text-xs">{e.method || 'HTTP'} · {e.httpStatus}{e.bytes !== null ? ` · ${e.bytes.toLocaleString('fr-FR')} octets` : ''}</p>}
                {e.redirect && <p className="mt-2 break-all text-xs text-muted-foreground">Redirection : {e.redirect}</p>}
                {e.capturedAt && <time className="mt-2 block text-xs text-muted-foreground" dateTime={e.capturedAt}>{new Date(e.capturedAt).toLocaleString('fr-FR')}</time>}</div>{e.image && <a href={e.image} target="_blank" rel="noreferrer"><img src={e.image} alt={`Capture de preuve : ${e.title}`} loading="lazy" className="h-auto w-full border-t border-border" /></a>}</article>)}</div></section>}
        {m.sessions.some(s => s.replay) && <div className="flex flex-wrap gap-2">{m.sessions.filter(s => s.replay).map((s, i) => <a key={s.id || i} href={s.replay!} target="_blank" rel="noreferrer" className="console-button"><ExternalLink className="size-4" aria-hidden="true" />Session H {i + 1}</a>)}</div>}
        <section className="panel overflow-hidden" aria-labelledby="events"><h2 id="events" className="border-b border-border px-5 py-4 text-base font-medium">Journal d’exécution</h2>{data.events.length ? <ol className="max-h-96 divide-y divide-border overflow-y-auto">{[...data.events].reverse().map(e => <li className="flex gap-4 px-5 py-3" key={e.id}><time className="shrink-0 font-mono text-[10px] text-subtle" dateTime={e.quand}>{new Date(e.quand).toLocaleTimeString('fr-FR')}</time><p className="min-w-0 whitespace-pre-wrap break-words text-xs leading-relaxed">{e.message}</p></li>)}</ol> : <p className="px-5 py-6 text-sm text-muted-foreground">Aucun événement reçu pour le moment.</p>}</section>
        <p className="text-xs text-muted-foreground">Ce rapport décrit les contrôles exécutés sur ce parcours. Un résultat non concluant reste à vérifier.</p>
      </>}
    </main>
  </>
}

function EvidenceReference({ reference, available }: { reference: string; available: boolean }) {
  const className = 'rounded border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground'
  return available
    ? <a href={`#evidence-${encodeURIComponent(reference)}`} className={className}>Preuve {reference}</a>
    : <span className={className}>Preuve {reference} · indisponible</span>
}

function ResultCard({ result: r, evidence }: { result: Result; evidence: Mission['evidence'] }) {
  return <article className="panel space-y-3 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <h3 className="text-sm font-medium"><span className="mr-2 font-mono text-xs text-steel">{r.id}</span>{r.title}</h3>
      <ResultStatusBadge status={r.status} reason={r.reason} />
    </div>
    {r.classification && <p className="text-xs text-muted-foreground">{classifications[r.classification] ?? 'Observation à examiner'}</p>}
    {r.expected && <p className="text-sm text-muted-foreground"><span className="text-foreground">Attendu : </span>{r.expected}</p>}
    <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.observed || 'Aucun constat exploitable pour ce contrôle.'}</p>
    {r.evidence.length > 0 && <div className="flex flex-wrap gap-2">{r.evidence.map(ref => <EvidenceReference key={ref} reference={ref} available={evidence.some(e => e.id === ref)} />)}</div>}
  </article>
}
