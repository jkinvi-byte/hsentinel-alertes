'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowRight, Check, ChevronDown, Monitor, PencilLine, Plus, Smartphone, Sparkles, X } from 'lucide-react'
import { ConsoleHeader } from './console-header'
import { MissionExpert } from './mission-expert'
import { MissionAccount } from './mission-account'
import { MissionComptes } from './mission-comptes'
import Link from 'next/link'
import { consoleRequest, postJson } from '@/lib/console-client'
import { encryptQaAccount } from '@/lib/qa-account.mjs'
import type { Catalog, Module, Plan, RunnerKey, TestAccount } from '@/lib/mission-types'

const emptyAccount = (): TestAccount => ({ identifiant: '', motDePasse: '', identite: [''] })

export function MissionStudio({ catalog, initialModule, initialTarget, initialVoix = false }: { catalog: Catalog; initialModule: Module; initialTarget?: string; initialVoix?: boolean }) {
  const router = useRouter()
  const [module, setModule] = useState(initialModule)
  const [target, setTarget] = useState(catalog.qa.find(t => t.id === initialTarget && t.available)?.id ?? catalog.qa.find(t => t.available)?.id ?? '')
  const [scenario, setScenario] = useState(catalog.pentest.find(s => s.available && s.targetIds.includes(initialTarget ?? ''))?.id ?? catalog.pentest.find(s => s.available)?.id ?? '')
  const [targetPentest, setTargetPentest] = useState(() => {
    const selected = catalog.pentest.find(s => s.id === scenario)
    return selected?.targetIds.includes(initialTarget ?? '') ? initialTarget! : selected?.targetId ?? ''
  })
  const [mode, setMode] = useState('guide')
  const [screen, setScreen] = useState('ordinateur')
  const [instruction, setInstruction] = useState('')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planFor, setPlanFor] = useState('')
  const [pending, setPending] = useState<'plan' | 'launch' | null>(null)
  const [voiceUsed, setVoiceUsed] = useState(false)
  // D-55 : la voix d'abord ; les paramètres manuels s'ouvrent à la demande, ou quand l'expert propose une consigne.
  const [manuel, setManuel] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // D-57 : l'expert a proposé une consigne et tout est prêt : le studio prépare le plan puis lance, sans autre clic.
  const [direct, setDirect] = useState<string | null>(null)
  const [account, setAccount] = useState<TestAccount>(emptyAccount)
  // D-56 : sur une application ajoutée, un compte enregistré, choisi sans rien retaper.
  const [compteId, setCompteId] = useState(() => catalog.qa.find(t => t.id === target)?.comptes?.[0]?.id ?? '')
  const locked = useRef(false)
  const began = useRef<number | null>(null)
  const selected = catalog.qa.find(t => t.id === target)
  const selectedScenario = catalog.pentest.find(s => s.id === scenario)
  const selectedPentestTarget = selectedScenario?.targets.find(t => t.id === targetPentest)
  const connected = module === 'qa' && selected?.connexion === true
  const ajoutee = module === 'qa' && selected?.ajoutee === true
  const { data: runnerKey, error: keyError, isLoading: keyLoading, mutate: refreshKey } = useSWR(
    connected && !ajoutee ? 'cle-runner' : null, (path: string) => consoleRequest<RunnerKey | null>(path),
    { shouldRetryOnError: false, revalidateOnFocus: true },
  )
  const keyAvailable = Boolean(runnerKey && !keyError && !keyLoading)
  const busy = !!pending
  const stale = planFor !== `${target}:${instruction.trim()}`
  const ready = !busy && (!connected || (ajoutee ? Boolean(compteId) : keyAvailable && account.identifiant.trim() && account.motDePasse.length > 0))
    && (module === 'pentest' ? selectedScenario?.available && selectedPentestTarget : selected?.available && (mode === 'exploration' || (plan && !stale && plan.criteres.length > 0)))
  const limit = module === 'qa' ? selected?.limits[mode] : { max_steps: selectedPentestTarget?.maxSteps, max_time_s: selectedPentestTarget?.maxTime }
  const begin = () => { began.current ??= Date.now() }
  function ouvrirManuel() {
    setManuel(true)
    begin()
    requestAnimationFrame(() => document.getElementById('mission-parametres')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  async function prepare() {
    if (locked.current || !instruction.trim()) return
    locked.current = true; begin(); setPending('plan'); setError(null)
    const text = instruction.trim()
    try {
      const data = await postJson<{ plan: Plan }>('plan', { target_id: target, instruction: text })
      setPlan(data.plan); setPlanFor(`${target}:${text}`)
    } catch (e) { setError(e instanceof Error ? e.message : 'La préparation a échoué.') }
    finally { locked.current = false; setPending(null) }
  }
  // Prêt à partir sans rien demander : QA, application disponible, et son compte de test s'il en faut un (enregistré).
  const pretDirect = module === 'qa' && selected?.available === true && (!connected || (ajoutee && Boolean(compteId)))
  async function lancerDirect(texte: string, pilotage: 'guide' | 'exploration' = 'guide') {
    if (locked.current) return
    locked.current = true; begin(); setError(null)
    try {
      // D-57 bis : une exploration part sans plan ; la consigne guidée passe d'abord par Hugging Face.
      if (pilotage === 'exploration') {
        setPending('launch'); setDirect('Lancement de l’exploration…')
        const mission = await postJson<{ id: string; module: Module }>('missions', {
          schema_version: 3, mode: 'qa', target_id: target, pilotage: 'exploration', appareil: screen, modele_h: 'holo4-35b-a3b',
          instruction: '', source: 'voix', plan: null, preparation_humaine_s: began.current ? Math.round((Date.now() - began.current) / 1000) : null,
          ...(connected && ajoutee ? { compte_id: compteId } : {}),
        })
        router.push(`/app/missions/${mission.module}/${mission.id}`)
        return
      }
      setPending('plan'); setDirect('L’expert prépare le plan avec Hugging Face…')
      const data = await postJson<{ plan: Plan }>('plan', { target_id: target, instruction: texte })
      setPlan(data.plan); setPlanFor(`${target}:${texte}`)
      setPending('launch'); setDirect(`Plan prêt : ${data.plan.criteres.length} critère${data.plan.criteres.length > 1 ? 's' : ''}. Lancement de la mission…`)
      const mission = await postJson<{ id: string; module: Module }>('missions', {
        schema_version: 3, mode: 'qa', target_id: target, pilotage: 'guide', appareil: screen, modele_h: 'holo4-35b-a3b',
        instruction: texte, source: 'voix', plan: data.plan, preparation_humaine_s: began.current ? Math.round((Date.now() - began.current) / 1000) : null,
        ...(connected && ajoutee ? { compte_id: compteId } : {}),
      })
      router.push(`/app/missions/${mission.module}/${mission.id}`)
    } catch (e) {
      // Rien n'est perdu : la consigne est en place, les paramètres s'ouvrent pour relire et relancer.
      setError(e instanceof Error ? e.message : 'Le lancement direct a échoué.')
      setDirect(null); locked.current = false; setPending(null); ouvrirManuel()
    }
  }

  async function launch(e: React.FormEvent) {
    e.preventDefault()
    if (!ready || locked.current) return
    locked.current = true; setPending('launch'); setError(null)
    try {
      // Relire la clé au lancement : elle peut avoir changé pendant la préparation du plan.
      const compte = connected && !ajoutee ? await encryptQaAccount(await refreshKey(), account) : null
      if (compte) setAccount(current => ({ ...current, motDePasse: '' }))
      const body = module === 'qa' ? {
        schema_version: 3, mode: 'qa', target_id: target, pilotage: mode, appareil: screen, modele_h: 'holo4-35b-a3b',
        instruction: mode === 'guide' ? instruction.trim() : '', source: mode === 'guide' && voiceUsed ? 'voix' : 'texte',
        plan: mode === 'guide' ? plan : null, preparation_humaine_s: began.current ? Math.round((Date.now() - began.current) / 1000) : null,
        ...(compte ? { compte } : {}), ...(connected && ajoutee ? { compte_id: compteId } : {}),
      } : { schema_version: 2, mode: 'security', target_id: targetPentest, scenario_id: scenario, instruction: instruction.trim() }
      const data = await postJson<{ id: string; module: Module }>('missions', body)
      router.push(`/app/missions/${data.module}/${data.id}`)
    } catch (e) { setError(e instanceof Error ? e.message : 'La mission n’a pas pu être lancée.'); locked.current = false; setPending(null) }
  }
  return <>
    <ConsoleHeader title="Nouvelle mission" />
    <main className="lv-page pb-10">
      <header className="lv-entete"><div className="lv-entete-texte"><p className="lv-surtitre">Nouvelle mission</p><h1>Votre site. Un objectif.</h1><p>Parlez à l’expert, ou paramétrez la mission vous-même. Quand tout est prêt, l’expert la lance ; vous pouvez toujours annuler.</p></div></header>
      <form onSubmit={launch} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-5">
          {/* D-51 puis D-55 et D-57 : l'expert QA ou Pentest, porte d'entrée vocale ; quand tout est prêt, sa consigne part après un compte à rebours ; sinon elle ne remplace la vôtre que sur demande. */}
          <MissionExpert volet={module} cible={module === 'qa' ? target : targetPentest} cibleNom={module === 'qa' ? selected?.name : selectedPentestTarget?.name} consigne={instruction} disabled={busy}
            ouvrirAuDepart={initialVoix} onManuel={ouvrirManuel}
            onApply={(texte: string, lancer?: boolean, pilotage: 'guide' | 'exploration' = 'guide') => {
              const exploration = module === 'qa' && pilotage === 'exploration' && Boolean(selected?.modes.includes('exploration'))
              setInstruction(exploration ? '' : texte); setVoiceUsed(true); if (module === 'qa') setMode(exploration ? 'exploration' : 'guide'); begin()
              if (lancer && pretDirect) void lancerDirect(texte, exploration ? 'exploration' : 'guide')
              else ouvrirManuel()
            }} />
          {direct ? <p className="lv-note" data-ton="bleu" role="status"><Sparkles aria-hidden="true" /><span>{direct}</span></p> : null}
          <section className="panel space-y-5 p-5" aria-labelledby="mission-setup">
            <h2 id="mission-setup" className="text-base font-medium"><span className="mr-2 text-steel">01</span>Le test et l’application</h2>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Volet">
              {(['qa', 'pentest'] as const).map(m => <button type="button" key={m} disabled={busy} aria-pressed={module === m} className={`console-button ${module === m ? 'border-steel bg-steel/10 text-foreground' : 'text-muted-foreground'}`} onClick={() => { if (m === module) return; setModule(m); setError(null); setInstruction(''); setPlan(null); setVoiceUsed(false); setAccount(emptyAccount()); begin() }}>{m === 'qa' ? 'QA fonctionnel' : 'Pentest'}</button>)}
            </div>
            {module === 'qa' ? <>
              <label className="block space-y-2 text-sm"><span>Application</span><select className="console-field" disabled={busy} value={target} onChange={e => { setTarget(e.target.value); setPlan(null); setMode('guide'); setAccount(emptyAccount()); setCompteId(catalog.qa.find(t => t.id === e.target.value)?.comptes?.[0]?.id ?? ''); setError(null); begin() }}>{catalog.qa.map(t => <option key={t.id} value={t.id} disabled={!t.available}>{t.name}{t.ajoutee ? ' · votre application' : ''}{t.connexion ? ' · compte requis' : ''}{t.ajoutee && !t.available ? ' · vérification à faire' : ''}</option>)}</select></label>
              <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="break-all">{selected?.url}</span><Link href="/app/applications/nouvelle" className="inline-flex items-center gap-1 text-steel underline-offset-2 hover:underline"><Plus className="size-3.5" aria-hidden="true" />Ajouter votre application</Link></p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Écran testé">{[{ id: 'ordinateur', label: 'Ordinateur', Icon: Monitor }, { id: 'mobile', label: 'Mobile', Icon: Smartphone }].map(({ id, label, Icon }) => <button key={id} type="button" disabled={busy} aria-pressed={screen === id} onClick={() => setScreen(id)} className={`console-button ${screen === id ? 'border-steel text-foreground' : 'text-muted-foreground'}`}><Icon className="size-4" aria-hidden="true" />{label}</button>)}</div>
              {connected && ajoutee && selected && <MissionComptes appId={selected.id} appNom={selected.name} comptes={selected.comptes ?? []} value={compteId} onChange={id => { setCompteId(id); begin() }} disabled={busy} />}
              {connected && !ajoutee && <MissionAccount value={account} onChange={value => { setAccount(value); begin() }} disabled={busy}
                keyLoading={keyLoading} keyAvailable={keyAvailable} keyError={keyError?.message}
                onRefresh={() => { void refreshKey().catch(() => undefined) }} />}
            </> : <>
              <label className="block space-y-2 text-sm"><span>Contrôle</span><select className="console-field" value={scenario} disabled={busy} onChange={e => { const next = catalog.pentest.find(s => s.id === e.target.value); setScenario(e.target.value); setTargetPentest(next?.targetId ?? ''); begin() }}>{catalog.pentest.map(s => <option key={s.id} value={s.id} disabled={!s.available}>{s.name}{!s.available ? ' · indisponible sur cette cible' : ''}</option>)}</select></label>
              {(selectedScenario?.targets.length ?? 0) > 1 && <label className="block space-y-2 text-sm"><span>Application autorisée</span><select className="console-field" value={targetPentest} disabled={busy} onChange={e => { setTargetPentest(e.target.value); begin() }}>{selectedScenario?.targets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
              <p className="text-sm text-muted-foreground">{selectedPentestTarget?.name}</p><p className="break-all text-xs text-muted-foreground">{selectedPentestTarget?.url}</p>
            </>}
          </section>
          {manuel ? <section id="mission-parametres" className="panel space-y-4 p-5 scroll-mt-24" aria-labelledby="mission-instruction">
            <h2 id="mission-instruction" className="text-base font-medium"><span className="mr-2 text-steel">02</span>{module === 'qa' ? 'Le parcours' : 'Le résultat attendu'}</h2>
            {module === 'qa' && <div className="flex flex-wrap gap-2" role="group" aria-label="Type de parcours">{selected?.modes.map(m => <button key={m} type="button" disabled={busy} aria-pressed={mode === m} className={`console-button ${mode === m ? 'border-steel text-foreground' : 'text-muted-foreground'}`} onClick={() => setMode(m)}>{m === 'guide' ? 'Consigne guidée' : 'Exploration'}</button>)}</div>}
            {module === 'pentest' && <p className="text-sm leading-relaxed">{selectedScenario?.expected}</p>}
            {module === 'qa' && mode === 'exploration' ? <p className="text-sm leading-relaxed text-muted-foreground">L’agent explore les menus et relève les problèmes visibles sur {selected?.limits.exploration?.max_pages ?? 6} pages au plus. Chaque constat garde son niveau de preuve.</p> : <>
              <label className="block space-y-2 text-sm"><span>{module === 'qa' ? 'Votre consigne' : 'Précisions facultatives'}</span><textarea rows={4} className="console-field resize-y" maxLength={2000} disabled={busy} value={instruction} onChange={e => { setInstruction(e.target.value); begin() }} placeholder={module === 'qa' ? connected ? 'Connecte-toi, puis ouvre Mon parcours et vérifie que la page s’affiche.' : 'Ouvre Programmes, puis le Bachelor, et vérifie que la page affiche « Bac+3 ».' : 'Précisez ce que l’agent doit observer dans ce scénario.'} /></label>
              <div className="flex justify-between text-xs text-muted-foreground"><span>{module === 'qa' ? 'Un texte attendu exactement se met entre guillemets.' : 'Les précisions restent dans le périmètre du contrôle choisi.'}</span><span className="ml-3 tabular-nums">{[...instruction].length}/2000</span></div>
            </>}
            {module === 'qa' && mode === 'guide' && <button className="console-button" type="button" disabled={busy || !instruction.trim()} onClick={prepare}><Sparkles className="size-4" aria-hidden="true" />{pending === 'plan' ? 'Préparation du plan…' : plan ? 'Préparer de nouveau' : 'Préparer le plan'}</button>}
          </section> : (
            <button type="button" className="lv-ouvrir-parametres" onClick={ouvrirManuel}>
              <span><strong>Paramètres manuels</strong><small>{module === 'qa' ? 'Consigne, type de parcours et plan à relire' : 'Précisions facultatives pour ce contrôle'}</small></span>
              <ChevronDown aria-hidden="true" />
            </button>
          )}
          {module === 'qa' && mode === 'guide' && plan && <section className="panel space-y-4 p-5" aria-labelledby="plan-title"><p className="label-mono">03 / Relecture</p><h2 id="plan-title" className="text-base font-medium">{plan.titre}</h2>
            {stale && <p role="status" className="text-sm text-warn">La consigne a changé. Préparez de nouveau le plan avant de lancer.</p>}
            <ol className="space-y-2">{plan.criteres.map((c, i) => <li key={c.id} className="flex gap-3 rounded-md border border-border p-3"><span className="font-mono text-xs text-steel">C{i + 1}</span><div className="min-w-0 flex-1"><p className="text-sm">{c.description}</p>{c.valeur && <p className="mt-1 break-words text-xs text-muted-foreground">{c.valeur}</p>}</div><button type="button" aria-label={`Retirer le critère C${i + 1}`} disabled={busy || plan.criteres.length <= 1} className="self-start rounded p-1 text-muted-foreground disabled:opacity-30" onClick={() => setPlan({ ...plan, criteres: plan.criteres.filter((_, index) => index !== i) })}><X className="size-4" /></button></li>)}</ol>
            <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">Voir les étapes prévues</summary><ol className="mt-3 list-decimal space-y-2 pl-5">{plan.etapes.map((step, i) => <li key={i}>{step}</li>)}</ol></details>
            {!!plan.hors_perimetre.length && <div className="text-xs text-muted-foreground"><p className="font-medium">Hors de ce parcours</p><ul className="mt-2 list-disc space-y-1 pl-4">{plan.hors_perimetre.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
            {!!plan.inconnues.length && <div className="text-xs text-warn"><p>Points à vérifier à l’écran</p><ul className="mt-2 list-disc space-y-1 pl-4">{plan.inconnues.map((p, i) => <li key={i}>{p}</li>)}</ul></div>}
          </section>}
        </div>
        <aside className="panel space-y-4 p-5 lg:sticky lg:top-5"><p className="label-mono">Votre mission</p><h2 className="font-medium">{module === 'qa' ? 'Un parcours, des critères vérifiables' : 'Un contrôle, des preuves attribuées'}</h2><p className="text-sm leading-relaxed text-muted-foreground">{module === 'qa' ? 'L’agent navigue sur le site. Le rapport distingue ce qui est vérifié de ce qui reste à confirmer.' : selectedScenario?.limitations}</p>
          {module === 'pentest' && selectedScenario?.writes
            ? <p className="flex items-start gap-2 text-xs text-warn"><PencilLine className="size-4 shrink-0" aria-hidden="true" />Écritures de test sur des données fictives, remises en état à la fin.</p>
            : <p className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="size-4 shrink-0 text-safe" aria-hidden="true" />Consultation, sans modification des données.</p>}
          {limit?.max_steps && <p className="text-xs text-muted-foreground">{limit.max_steps} actions · budget de {Math.round((limit.max_time_s ?? 0) / 60)} minutes. Arrêt disponible pendant le suivi.</p>}
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <button type="submit" className="console-button primary w-full" disabled={!ready}>{pending === 'launch' ? 'Enregistrement…' : 'Lancer la mission'}<ArrowRight className="size-4" aria-hidden="true" /></button>
          {module === 'qa' && mode === 'guide' && (!plan || stale) && <p className="text-xs text-muted-foreground">Préparez puis relisez le plan pour lancer.</p>}
        </aside>
      </form>
    </main>
  </>
}
