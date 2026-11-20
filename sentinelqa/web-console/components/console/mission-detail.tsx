'use client'

import Link from 'next/link'
import { Fragment, useRef, useState } from 'react'
import useSWR from 'swr'
import { ArrowLeft, Check, CircleHelp, ExternalLink, Minus, RefreshCw, Square, TriangleAlert } from 'lucide-react'
import { ConsoleHeader } from './console-header'
import { ResultStatusBadge } from './result-status'
import { RoleMatrix } from './role-matrix'
import { consoleRequest } from '@/lib/console-client'
import { mots as decouperMots } from '@/lib/expert/conversation.mjs'
import { formatMoney, overallLabel, interruptionLabel } from '@/lib/mission-view.mjs'
import type { Mission, Module, Event, Result } from '@/lib/mission-types'

const classifications: Record<string, string> = {
  demonstrated_vulnerability: 'Faille démontrée par le code',
  configuration_weakness: 'Faiblesse de configuration',
  tool_candidate: 'Candidat d’outil · non confirmé',
  observation: 'Observation',
}

const nombre = (n: number) => n.toLocaleString('fr-FR')
const accord = (n: number, un: string, plusieurs: string) => `${nombre(n)} ${n > 1 ? plusieurs : un}`
type Ton = 'sur' | 'alerte' | 'attente' | 'bleu' | 'neutre'

/** Ce que dit l'expert du rapport, en deux phrases : le verdict, puis ce qu'il faut en faire. Rien au-delà du rapport. */
function parole(m: Mission): { verdict: string; suite: string; ton: Ton } {
  if (m.status === 'en_attente') return { verdict: 'Votre mission attend un agent.', suite: 'Elle partira dès qu’un agent sera libre ; aucune progression n’est encore annoncée.', ton: 'neutre' }
  if (m.status === 'en_cours') return { verdict: 'L’agent est au travail.', suite: 'Ses étapes s’affichent au fil de l’eau ; le verdict viendra du code, pas de l’agent.', ton: 'bleu' }
  if (m.status === 'echec') return { verdict: 'Exécution interrompue.', suite: 'C’est une panne technique, pas un verdict sur le site testé.', ton: 'attente' }
  const b = m.summary
  if (m.interruption) return { verdict: `${interruptionLabel(m.interruption)}.`, suite: 'Les résultats déjà recueillis restent consultables ci-dessous.', ton: 'attente' }
  if (b.failed) return { verdict: m.module === 'pentest'
      ? (m.securityFindings && !m.securityFindings.demonstrated ? `${overallLabel(m)}.` : `${accord(m.securityFindings?.demonstrated ?? b.failed, 'faille prouvée', 'failles prouvées')}.`)
      : `${accord(b.failed, 'écart constaté', 'écarts constatés')}.`, suite: m.module === 'pentest' ? 'Examinez chaque preuve avant de corriger : chacune se rejoue.' : 'Chaque écart est prouvé par le code ; la capture montre ce que l’agent a vu.', ton: 'alerte' }
  if (b.inconclusive) return { verdict: `${accord(b.inconclusive, 'contrôle reste', 'contrôles restent')} à confirmer.`, suite: 'Le code n’a pas pu trancher : revoyez la capture ou précisez le critère.', ton: 'attente' }
  if (b.passed) return { verdict: m.module === 'pentest' ? 'Aucune faille prouvée sur les contrôles menés.' : 'Tout est conforme.', suite: `${accord(b.passed, 'contrôle vérifié', 'contrôles vérifiés')} par le code, preuves à l’appui.`, ton: 'sur' }
  return { verdict: 'Aucun verdict disponible.', suite: 'Ce rapport ne contient aucun contrôle exploitable.', ton: 'neutre' }
}

const ETAPES = [
  { label: 'Enregistrée', detail: 'dans la file' },
  { label: 'Agent au travail', detail: 'navigateur H' },
  { label: 'Vérification', detail: 'par le code' },
  { label: 'Rapport', detail: 'preuves à l’appui' },
]

/** L'étape réelle, lue dans le statut et le journal : une animation ne prouve pas qu'un agent tourne, le journal si. */
function etapeCourante(m: Mission, events: Event[]) {
  if (m.status === 'termine') return { index: 4, panne: false }
  if (m.status === 'echec') {
    const verifie = events.some((e) => /vérification par le code|3\/4/i.test(e.message))
    const agent = events.some((e) => /agent h|navigateur|session/i.test(e.message))
    return { index: verifie ? 2 : agent ? 1 : 0, panne: true }
  }
  if (m.status === 'en_cours') return { index: events.some((e) => /vérification par le code|3\/4/i.test(e.message)) ? 2 : 1, panne: false }
  return { index: 0, panne: false }
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
  const p = m ? parole(m) : null
  const etape = m && data ? etapeCourante(m, data.events) : null
  const enCours = m ? ['en_attente', 'en_cours'].includes(m.status) : false
  const derniere = data?.events.at(-1)

  return <><ConsoleHeader title={module === 'qa' ? 'Mission QA' : 'Mission Pentest'} />
    <main className="lv-page space-y-7 pb-12">
      {/* D-55 : la liste des missions est la page Missions (/app/audits), plus la vue d'ensemble (tâche 41). */}
      <Link href="/app/audits" className="lv-lien"><ArrowLeft aria-hidden="true" />Toutes les missions</Link>
      {error && <div role="alert" className="panel flex flex-wrap items-center justify-between gap-3 p-5"><p className="text-sm">{error.message}</p><button className="lv-bouton lv-bouton-trait" onClick={() => mutate()}><RefreshCw aria-hidden="true" />Réessayer</button></div>}
      {!m && !error && <p role="status" className="panel p-10 text-sm text-muted-foreground">Chargement de la mission…</p>}
      {m && p && etape && <>
        <header className="lv-rapport-entete">
          <div className="min-w-0">
            <p className="lv-surtitre">{module === 'qa' ? 'QA fonctionnel' : 'Pentest'}{m.legacy ? ' · rapport historique' : ''}</p>
            <h1>{m.title}</h1>
            <p className="break-all">{m.target}</p>
          </div>
          {m.canStop && <button type="button" className="lv-bouton lv-bouton-trait" disabled={stopping || stopAsked || m.stopRequested} onClick={stop}><Square aria-hidden="true" />{stopping ? 'Envoi…' : stopAsked || m.stopRequested ? 'Arrêt demandé…' : 'Arrêter la mission'}</button>}
        </header>

        {/* Le diagnostic de l'expert, dit dans une bulle qui arrive un temps après la page, mot à mot (D-55). */}
        <div className="lv-verdict" data-ton={p.ton} key={p.verdict}>
          <span className="lv-mascotte" aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <span key={i} style={{ ['--i' as string]: i }} />)}</span>
          <div className="lv-bulle" aria-live="polite">
            <p className="lv-bulle-qui">{module === 'qa' ? 'L’expert QA' : 'L’expert Pentest'} · diagnostic</p>
            <p className="lv-bulle-verdict">{decouperMots(p.verdict).map((mot, i) => <Fragment key={i}><span style={{ ['--m' as string]: i }}>{mot}</span>{' '}</Fragment>)}</p>
            <p className="lv-bulle-suite">{p.suite}</p>
          </div>
        </div>

        <ol className="lv-etapes" aria-label="Avancement de la mission">
          {ETAPES.map((e, i) => {
            const fait = i < etape.index
            const actif = i === etape.index && !etape.panne && enCours
            const panne = etape.panne && i === etape.index
            return <li key={e.label} data-etat={panne ? 'panne' : actif ? 'actif' : fait ? 'fait' : 'a-venir'}>
              <span className="lv-etape-symbole">{panne ? <TriangleAlert aria-hidden="true" /> : actif ? <span className="lv-pulsation" aria-hidden="true" /> : fait ? <Check aria-hidden="true" /> : <span className="lv-etape-numero">{i + 1}</span>}</span>
              <span className="min-w-0"><strong>{e.label}</strong><small>{panne ? 'panne technique' : actif ? 'en cours' : e.detail}</small></span>
            </li>
          })}
        </ol>
        {enCours && derniere ? <p className="lv-derniere-action"><span className="lv-pulsation" aria-hidden="true" />{derniere.message}</p> : null}

        {(stopError || m.error) && <p role="alert" className="panel border-danger/30 p-4 text-sm text-danger">{stopError || m.error}</p>}
        {m.status === 'en_attente' && <p role="status" className="panel p-4 text-sm text-muted-foreground">La mission est enregistrée. Elle attend qu’un agent soit disponible ; aucune progression n’est encore annoncée.</p>}

        <section className="lv-compteurs" aria-label="Bilan des contrôles">
          {([['passed', 'Conformes', Check], ['failed', module === 'pentest' ? 'Failles ou écarts' : 'Écarts constatés', TriangleAlert], ['inconclusive', 'À confirmer', CircleHelp], ['skipped', 'Non exécutés', Minus]] as const).map(([s, label, Icone]) => (
            <div key={s} data-statut={s}><span className="lv-symbole"><Icone aria-hidden="true" /></span><strong>{nombre(m.summary[s] ?? 0)}</strong><span>{label}</span></div>
          ))}
        </section>

        <dl className="lv-mesures">{[['Durée', m.duration == null ? 'Non mesurée' : `${m.duration.toLocaleString('fr-FR')} s`], ['Résultats vérifiés par le code', `${m.summary.passed + m.summary.failed} / ${m.results.length}`], ['Coût H', formatMoney(m.costH)], ['Coût HF', formatMoney(m.costHf)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>

        {m.securityFindings && <section className="panel space-y-2 p-5" aria-label="Bilan de sécurité"><h2 className="lv-h2">Bilan de sécurité</h2><p className="text-sm">{m.securityFindings.demonstrated} faille(s) unique(s) démontrée(s) · {m.securityFindings.configuration} assertion(s) de configuration en écart · {m.securityFindings.candidates} candidat(s) d’outil non confirmé(s).</p>{m.inference && <p className="text-xs text-muted-foreground">Priorisation HF : {m.inference.status} · {m.inference.reason}</p>}</section>}
        {m.matrix && <section className="panel space-y-3 p-5" aria-label="Matrice IDOR"><h2 className="lv-h2">Matrice IDOR · A / anonyme / B</h2><p className="text-xs text-muted-foreground">Chaque case vient d’une lecture attribuée. Une case vide signale une preuve insuffisante, pas une autorisation.</p><RoleMatrix matrix={m.matrix} /></section>}
        {m.interruption && <p role="status" className="panel border-warn/30 p-4 text-sm text-warn">{interruptionLabel(m.interruption)}. Les résultats déjà recueillis restent consultables.</p>}
        {accessResults.length > 0 && <section className="space-y-3" aria-labelledby="access-results">
          <h2 id="access-results" className="lv-h2">Connexion et identité</h2>
          <div className="lv-constats">{accessResults.map((r, i) => <ResultCard key={`${r.id}-${i}`} result={r} evidence={m.evidence} />)}</div>
        </section>}
        {otherResults.length > 0 && <section className="space-y-3" aria-labelledby="results">
          <h2 id="results" className="lv-h2">Résultats et preuves</h2>
          <div className="lv-constats">{otherResults.map((r, i) => <ResultCard key={`${r.id}-${i}`} result={r} evidence={m.evidence} />)}</div>
        </section>}
        {m.results.length === 0 && <section className="lv-vide"><span className="lv-vide-icone"><CircleHelp aria-hidden="true" /></span><div><strong>Les résultats apparaîtront ici</strong><p>{m.hasReport ? 'Ce rapport ne contient aucun contrôle exploitable. Aucun verdict global ne peut en être déduit.' : 'L’exécution doit produire ses observations avant de conclure.'}</p></div></section>}
        {m.coverage && <section className="panel space-y-3 p-5" aria-label="Couverture d’exécution">
          <h2 className="lv-h2">Couverture réellement exécutée</h2>
          <p className="text-sm">{m.coverage.endpoints ?? 'Non mesuré'} ressource(s) · {m.coverage.activeExecuted ?? 0}/{m.coverage.activeAuthorized ?? 0} opération(s) active(s) · {m.coverage.accessResources ?? 0} ressource(s) IDOR ({m.coverage.accessDiscovered ?? 0} découverte(s)) · {m.coverage.identities ?? 0} identité(s) vérifiée(s).</p>
          <p className="text-sm">{m.coverage.formsObserved ?? 0} formulaire(s) observé(s) · {m.coverage.formsSubmitted ?? 0} connexion(s) par formulaire · {m.coverage.businessFormsSubmitted ?? 0} formulaire(s) métier soumis par le runner · {m.coverage.mutations === null ? 'mutations non mesurées' : `${m.coverage.mutations} mutation(s)`}.</p>
          <p className="text-xs text-muted-foreground">{m.coverage.measurementSource === 'target_observer' ? 'Méthodes HTTP observées' : 'Méthodes du runner'} : {m.coverage.methods.join(', ') || 'aucune'}. {m.coverage.limitations}</p>
          {m.rulesExecuted.length > 0 && <p className="text-xs">Règles exécutées : {m.rulesExecuted.join(', ')}</p>}
          {m.rulesSkipped.length > 0 && <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Règles non exécutées ou interrompues</summary><ul className="mt-2 space-y-1">{m.rulesSkipped.map((r, i) => <li key={`${r.id}-${i}`}>{r.id} · {r.reason}</li>)}</ul></details>}
        </section>}
        {m.evidence.length > 0 && <section className="space-y-3" aria-label="Preuves recueillies"><h2 className="lv-h2">Preuves recueillies</h2><div className="grid gap-4 md:grid-cols-2">{m.evidence.map(e => <article id={`evidence-${encodeURIComponent(e.id)}`} key={e.id} className="lv-preuve"><div className="p-4"><p className="text-[13px] font-medium">{e.title}</p>{e.url && <p className="mt-1 break-all text-xs text-muted-foreground">{e.url}</p>}
                {e.httpStatus !== null && <p className="mt-3 font-mono text-xs">{e.method || 'HTTP'} · {e.httpStatus}{e.bytes !== null ? ` · ${e.bytes.toLocaleString('fr-FR')} octets` : ''}</p>}
                {e.redirect && <p className="mt-2 break-all text-xs text-muted-foreground">Redirection : {e.redirect}</p>}
                {e.capturedAt && <time className="mt-2 block text-xs text-muted-foreground" dateTime={e.capturedAt}>{new Date(e.capturedAt).toLocaleString('fr-FR')}</time>}</div>{e.image && <a href={e.image} target="_blank" rel="noreferrer"><img src={e.image} alt={`Capture de preuve : ${e.title}`} loading="lazy" className="h-auto w-full border-t border-border" /></a>}</article>)}</div></section>}
        {m.sessions.some(s => s.replay) && <div className="flex flex-wrap gap-2">{m.sessions.filter(s => s.replay).map((s, i) => <a key={s.id || i} href={s.replay!} target="_blank" rel="noreferrer" className="lv-bouton lv-bouton-trait"><ExternalLink aria-hidden="true" />Rejouer la session H {i + 1}</a>)}</div>}
        <section className="lv-chronologie" aria-labelledby="events"><h2 id="events" className="lv-h2">Journal d’exécution</h2>{data.events.length ? <ol>{[...data.events].reverse().map(e => <li key={e.id}><time dateTime={e.quand}>{new Date(e.quand).toLocaleTimeString('fr-FR')}</time><p>{e.message}</p></li>)}</ol> : <p className="text-sm text-muted-foreground">Aucun événement reçu pour le moment.</p>}</section>
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
  return <article className="lv-constat" data-statut={r.status}>
    <div className="lv-constat-tete">
      <span className="lv-symbole">{r.status === 'passed' ? <Check aria-hidden="true" /> : r.status === 'failed' ? <TriangleAlert aria-hidden="true" /> : r.status === 'skipped' ? <Minus aria-hidden="true" /> : <CircleHelp aria-hidden="true" />}</span>
      <h3><span className="mr-2 font-mono text-[11px] text-steel">{r.id}</span>{r.title}</h3>
      <ResultStatusBadge status={r.status} reason={r.reason} />
    </div>
    <div className="lv-constat-corps">
      {r.classification && <p className="text-xs text-muted-foreground">{classifications[r.classification] ?? 'Observation à examiner'}</p>}
      <dl>
        {r.expected && <div><dt>Attendu</dt><dd>{r.expected}</dd></div>}
        <div><dt>Observé</dt><dd className="whitespace-pre-wrap">{r.observed || 'Aucun constat exploitable pour ce contrôle.'}</dd></div>
      </dl>
      {r.evidence.length > 0 && <div className="flex flex-wrap gap-2">{r.evidence.map(ref => <EvidenceReference key={ref} reference={ref} available={evidence.some(e => e.id === ref)} />)}</div>}
    </div>
  </article>
}
