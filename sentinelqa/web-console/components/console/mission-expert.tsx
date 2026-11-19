'use client'

import { AudioLines, BookOpen, CornerDownLeft, Mic, Square, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { creerDictee as creerDicteeJs } from '../../../web/lib/qa-dictee.mjs'
import { parler, taire } from '@/lib/expert/voix.mjs'
import { accueilExpert, typographie } from '@/lib/expert/conversation.mjs'
import { amorcerAudio, ExpertConversation, prechargerAccueil, type ReponseExpert } from './expert-conversation'

// D-51 : l'expert QA ou Pentest du studio. On lui parle (micro, même transcription que la dictée) ou on lui écrit ;
// il répond d'après le Manuel HSentinel et le contexte de la mission, et sa réponse est lue à voix haute,
// par Kokoro sur Hugging Face, avec la voix du système réglée comme celle de LEVELS en secours.
// Il ne lance rien : une consigne proposée ne remplace la vôtre que sur « Reprendre dans la consigne ».

// Le contrôleur de la dictée est en JavaScript : ses rappels prennent bien un argument, ce que l'inférence ne voit pas.
type Dictee = { etat: string; commencer(): Promise<void>; arreter(): void; annuler(): void; disposer(): void }
const creerDictee = creerDicteeJs as unknown as (options: Record<string, unknown>) => Dictee

type Volet = 'qa' | 'pentest'
type Message = { role: 'utilisateur' | 'expert'; texte: string; consigne?: string | null; fiches?: string[] }
type Props = { volet: Volet; cible: string; cibleNom?: string | null; consigne: string; disabled?: boolean; onApply: (texte: string) => void }

const NOM: Record<Volet, string> = { qa: 'L’expert QA', pentest: 'L’expert Pentest' }
const AIDE: Record<Volet, string> = {
  qa: 'Demandez-lui comment formuler votre parcours, ce que l’agent sait vérifier, ou pourquoi un critère reste à confirmer.',
  pentest: 'Demandez-lui ce que vérifie un contrôle, comment une faille est prouvée, ou ce que la cible permet.',
}

export function MissionExpert({ volet, cible, cibleNom = null, consigne, disabled = false, onApply }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [dictee, setDictee] = useState('repos')
  const [attente, setAttente] = useState(false)
  const [voix, setVoix] = useState(true)
  const [parle, setParle] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [conversation, setConversation] = useState(false)
  const [origine, setOrigine] = useState<{ x: number; y: number } | null>(null)
  const controleur = useRef<Dictee | null>(null)
  const fil = useRef<HTMLOListElement>(null)
  const etat = useRef({ volet, cible, consigne, messages, voix })
  etat.current = { volet, cible, consigne, messages, voix }

  // Une lecture en cours ne doit jamais en chevaucher une autre : chaque lecture porte un numéro, arrêter l'invalide.
  const lecture = useRef(0)
  const audio = useRef<HTMLAudioElement | null>(null)

  function arreterVoix() {
    lecture.current++
    audio.current?.pause()
    audio.current = null
    taire()
    setParle(false)
  }

  // La voix de Hugging Face (Kokoro, voix française), servie par la console ; si elle manque, la voix du système
  // réglée comme celle de LEVELS (lib/expert/voix.mjs) prend le relais : l'expert ne se tait jamais.
  async function lire(texte: string) {
    if (!etat.current.voix) return
    const n = ++lecture.current
    setParle(true)
    try {
      const res = await fetch('/api/console/expert/voix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texte }) })
      if (!res.ok) throw new Error('voix indisponible')
      const url = URL.createObjectURL(await res.blob())
      if (n !== lecture.current) { URL.revokeObjectURL(url); return }
      const a = new Audio(url)
      audio.current = a
      const fin = () => { URL.revokeObjectURL(url); if (audio.current === a) { audio.current = null; setParle(false) } }
      a.onended = fin
      a.onerror = fin
      await a.play()
    } catch {
      if (n !== lecture.current) return
      audio.current = null
      if (!parler(texte, () => setParle(false))) setParle(false)
    }
  }

  // Une question à l'expert, partagée par le panneau et le mode conversation : l'historique est le même.
  async function poser(q: string): Promise<ReponseExpert | null> {
    const historique = etat.current.messages.slice(-6).map((m) => ({ role: m.role, texte: m.texte }))
    setMessages((m) => [...m, { role: 'utilisateur', texte: q }])
    try {
      const res = await fetch('/api/console/expert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volet: etat.current.volet, cible: etat.current.cible, consigne: etat.current.consigne, question: q, historique }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'L’expert ne répond pas pour l’instant.')
      setMessages((m) => [...m, { role: 'expert', texte: data.reponse, consigne: data.consigne_proposee, fiches: data.fiches }])
      return { reponse: data.reponse, consigne_proposee: data.consigne_proposee ?? null }
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'L’expert ne répond pas pour l’instant.')
      return null
    }
  }

  async function demander(texte: string) {
    const q = texte.trim()
    if (!q || attente) return
    arreterVoix()
    setErreur(null)
    setQuestion('')
    setAttente(true)
    const r = await poser(q)
    setAttente(false)
    if (r) void lire(r.reponse)
  }

  // Ce que l'expert dit en ouvrant la conversation : il parle le premier, d'après la cible choisie.
  const accueil = accueilExpert({ volet, cible: cibleNom, reprise: messages.length > 0 })

  // La conversation naît du bouton touché (comme la Voix de LEVELS) : son centre devient l'origine du dépliage,
  // et le son s'ouvre dans le geste même.
  function ouvrirConversation(bouton: HTMLElement) {
    arreterVoix()
    if (controleur.current?.etat !== 'repos') controleur.current?.annuler()
    amorcerAudio()
    prechargerAccueil(accueil)
    const r = bouton.getBoundingClientRect()
    setOrigine({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    setErreur(null)
    setConversation(true)
  }
  const demanderRef = useRef(demander)
  demanderRef.current = demander

  // Changer de volet, c'est changer d'expert : la conversation repart de zéro.
  useEffect(() => {
    setMessages([])
    setErreur(null)
    arreterVoix()
  }, [volet])

  useEffect(() => {
    fil.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  useEffect(() => {
    const c = creerDictee({
      obtenirFlux: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      creerEnregistreur: (stream: MediaStream) => {
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported?.(t))
        return new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      },
      transcrire: async (audio: Blob, signal: AbortSignal) => {
        const res = await fetch('/api/console/transcription', { method: 'POST', body: audio, signal, headers: { 'Content-Type': audio.type } })
        const data = await res.json()
        if (!res.ok) throw new Error(data.erreur || 'La transcription a échoué.')
        return data
      },
      surEtat: setDictee,
      surErreur: setErreur,
      surTranscription: (data: { texte: string }) => { void demanderRef.current(data.texte) },
    })
    controleur.current = c
    return () => {
      c.disposer()
      controleur.current = null
      arreterVoix()
    }
  }, [])

  function ecouter() {
    if (disabled || attente || controleur.current?.etat !== 'repos') return
    arreterVoix()
    setErreur(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErreur('Le micro n’est pas disponible ici. Vous pouvez écrire votre question.')
      return
    }
    void controleur.current.commencer()
  }

  const occupe = disabled || attente || dictee !== 'repos'
  const statut = dictee === 'enregistrement' ? 'Le micro écoute votre question.'
    : dictee === 'permission' ? 'Autorisez le micro.'
    : dictee === 'transcription' ? 'Micro fermé. Transcription de votre question…'
    : attente ? `${NOM[volet]} réfléchit…`
    : parle ? `${NOM[volet]} parle.` : null

  return (
    <section className="panel space-y-4 p-5" aria-labelledby="expert-titre">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 basis-[220px]">
          <h2 id="expert-titre" className="text-base font-medium">
            <BookOpen className="mr-2 inline size-4 align-[-2px] text-steel" aria-hidden="true" />
            {NOM[volet]}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{AIDE[volet]} Il ne lance rien.</p>
          <button type="button" className="console-button primary mt-3" disabled={disabled || !cible}
            onPointerEnter={() => prechargerAccueil(accueil)} onFocus={() => prechargerAccueil(accueil)}
            onClick={(e) => ouvrirConversation(e.currentTarget)}>
            <AudioLines className="size-4" aria-hidden="true" />
            Converser à la voix
          </button>
        </div>
        <button
          type="button"
          className="console-button"
          aria-pressed={voix}
          onClick={() => { if (voix) arreterVoix(); setVoix(!voix) }}
        >
          {voix ? <Volume2 className="size-4" aria-hidden="true" /> : <VolumeX className="size-4" aria-hidden="true" />}
          {voix ? 'Réponses lues' : 'Réponses muettes'}
        </button>
      </div>

      {messages.length ? (
        <ol ref={fil} className="max-h-[min(28rem,60vh)] space-y-3 overflow-y-auto pr-1" aria-label={`Conversation avec ${NOM[volet].toLowerCase()}`}>
          {messages.map((m, i) => (
            <li key={i} className={m.role === 'utilisateur' ? 'flex justify-end' : 'flex'}>
              {m.role === 'utilisateur' ? (
                <p className="max-w-[85%] rounded-lg bg-foreground/[0.05] px-3 py-2 text-sm">{typographie(m.texte)}</p>
              ) : (
                <div className="max-w-[92%] space-y-2 rounded-lg border border-steel/30 bg-steel/[0.04] px-3 py-2">
                  <p className="text-sm leading-relaxed">{typographie(m.texte)}</p>
                  {m.consigne ? (
                    <div className="space-y-2 rounded-md border border-border bg-background p-2.5">
                      <p className="label-mono">{volet === 'qa' ? 'Consigne proposée' : 'Précisions proposées'}</p>
                      <p className="text-sm">{typographie(m.consigne)}</p>
                      <button type="button" className="console-button" disabled={disabled} onClick={() => onApply(m.consigne!)}>
                        <CornerDownLeft className="size-4" aria-hidden="true" />
                        Reprendre dans la consigne
                      </button>
                    </div>
                  ) : null}
                  {m.fiches?.length ? <p className="font-mono text-[10.5px] text-subtle">fiches : {m.fiches.join(', ')}</p> : null}
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {dictee === 'enregistrement' ? (
          <button type="button" className="console-button border-danger/40 text-danger" onClick={() => controleur.current?.arreter()}>
            <Square className="size-3.5" aria-hidden="true" />
            Arrêter et envoyer
          </button>
        ) : (
          <button type="button" className="console-button" onClick={ecouter} disabled={occupe || !cible}>
            <Mic className="size-4" aria-hidden="true" />
            Parler à l’expert
          </button>
        )}
        {dictee !== 'repos' ? (
          <button type="button" className="console-button" onClick={() => controleur.current?.annuler()}>
            <X className="size-4" aria-hidden="true" />
            Annuler
          </button>
        ) : null}
        {parle ? (
          <button type="button" className="console-button" onClick={arreterVoix}>
            <VolumeX className="size-4" aria-hidden="true" />
            Couper la voix
          </button>
        ) : null}
        <label className="flex min-w-0 flex-1 basis-[220px] items-center gap-2">
          <span className="sr-only">Votre question à l’expert</span>
          <input
            className="console-field min-w-0 flex-1"
            value={question}
            maxLength={1000}
            disabled={occupe || !cible}
            placeholder="Votre question…"
            onChange={(e) => setQuestion(e.target.value)}
            // Entrée ne doit jamais envoyer le formulaire du studio (qui lance la mission) : elle pose la question.
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void demander(question) } }}
          />
          <button type="button" className="console-button" disabled={occupe || !question.trim() || !cible} onClick={() => void demander(question)}>
            Demander
          </button>
        </label>
      </div>

      {statut ? <p className="text-xs text-muted-foreground" role="status">{statut}</p> : null}
      {conversation ? (
        <ExpertConversation nom={NOM[volet]} volet={volet} cibleNom={cibleNom} accueil={accueil} fil={messages} origine={origine}
          poser={poser} annoncer={(texte) => setMessages((m) => [...m, { role: 'expert', texte }])}
          onApply={onApply} onClose={() => setConversation(false)} />
      ) : null}
      {erreur ? <p className="text-sm text-danger" role="alert">{erreur}</p> : null}
    </section>
  )
}
