'use client'

import { BookOpen, CornerDownLeft, Mic, Square, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { creerDictee as creerDicteeJs } from '../../../web/lib/qa-dictee.mjs'

// D-51 : l'expert QA ou Pentest du studio. On lui parle (micro, même transcription que la dictée) ou on lui écrit ;
// il répond d'après le Manuel HSentinel et le contexte de la mission, et sa réponse est lue à voix haute.
// Il ne lance rien : une consigne proposée ne remplace la vôtre que sur « Reprendre dans la consigne ».

// Le contrôleur de la dictée est en JavaScript : ses rappels prennent bien un argument, ce que l'inférence ne voit pas.
type Dictee = { etat: string; commencer(): Promise<void>; arreter(): void; annuler(): void; disposer(): void }
const creerDictee = creerDicteeJs as unknown as (options: Record<string, unknown>) => Dictee

type Volet = 'qa' | 'pentest'
type Message = { role: 'utilisateur' | 'expert'; texte: string; consigne?: string | null; fiches?: string[] }
type Props = { volet: Volet; cible: string; consigne: string; disabled?: boolean; onApply: (texte: string) => void }

const NOM: Record<Volet, string> = { qa: 'L’expert QA', pentest: 'L’expert Pentest' }
const AIDE: Record<Volet, string> = {
  qa: 'Demandez-lui comment formuler votre parcours, ce que l’agent sait vérifier, ou pourquoi un critère reste à confirmer.',
  pentest: 'Demandez-lui ce que vérifie un contrôle, comment une faille est prouvée, ou ce que la cible permet.',
}

export function MissionExpert({ volet, cible, consigne, disabled = false, onApply }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [dictee, setDictee] = useState('repos')
  const [attente, setAttente] = useState(false)
  const [voix, setVoix] = useState(true)
  const [parle, setParle] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const controleur = useRef<Dictee | null>(null)
  const fil = useRef<HTMLOListElement>(null)
  const etat = useRef({ volet, cible, consigne, messages, voix })
  etat.current = { volet, cible, consigne, messages, voix }

  function arreterVoix() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setParle(false)
  }

  function lire(texte: string) {
    if (!etat.current.voix || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const synthese = window.speechSynthesis
    synthese.cancel()
    const phrase = new SpeechSynthesisUtterance(texte)
    phrase.lang = 'fr-FR'
    const francaise = synthese.getVoices().find((v) => v.lang?.toLowerCase().startsWith('fr'))
    if (francaise) phrase.voice = francaise
    phrase.rate = 1.05
    phrase.onend = () => setParle(false)
    phrase.onerror = () => setParle(false)
    setParle(true)
    synthese.speak(phrase)
  }

  async function demander(texte: string) {
    const q = texte.trim()
    if (!q || attente) return
    arreterVoix()
    setErreur(null)
    const historique = etat.current.messages.slice(-6).map((m) => ({ role: m.role, texte: m.texte }))
    setMessages((m) => [...m, { role: 'utilisateur', texte: q }])
    setQuestion('')
    setAttente(true)
    try {
      const res = await fetch('/api/console/expert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volet: etat.current.volet, cible: etat.current.cible, consigne: etat.current.consigne, question: q, historique }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'L’expert ne répond pas pour l’instant.')
      setMessages((m) => [...m, { role: 'expert', texte: data.reponse, consigne: data.consigne_proposee, fiches: data.fiches }])
      lire(data.reponse)
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'L’expert ne répond pas pour l’instant.')
    } finally {
      setAttente(false)
    }
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
                <p className="max-w-[85%] rounded-lg bg-foreground/[0.05] px-3 py-2 text-sm">{m.texte}</p>
              ) : (
                <div className="max-w-[92%] space-y-2 rounded-lg border border-steel/30 bg-steel/[0.04] px-3 py-2">
                  <p className="text-sm leading-relaxed">{m.texte}</p>
                  {m.consigne ? (
                    <div className="space-y-2 rounded-md border border-border bg-background p-2.5">
                      <p className="label-mono">{volet === 'qa' ? 'Consigne proposée' : 'Précisions proposées'}</p>
                      <p className="text-sm">{m.consigne}</p>
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
      {erreur ? <p className="text-sm text-danger" role="alert">{erreur}</p> : null}
    </section>
  )
}
