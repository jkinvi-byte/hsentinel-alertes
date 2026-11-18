'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Square, X } from 'lucide-react'
import { creerDictee } from '../../../web/lib/qa-dictee.mjs'

export function MissionDictation({ disabled, onText, onBusy }) {
  const [phase, setPhase] = useState('repos')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState(null)
  const [note, setNote] = useState(null)
  const controller = useRef(null)
  const callbacks = useRef({ onText, onBusy })
  callbacks.current = { onText, onBusy }
  useEffect(() => {
    const voice = creerDictee({
      obtenirFlux: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      creerEnregistreur: (stream) => {
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(t => MediaRecorder.isTypeSupported?.(t))
        return new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      },
      transcrire: async (audio, signal) => {
        const res = await fetch('/api/console/transcription', { method: 'POST', body: audio, signal, headers: { 'Content-Type': audio.type } })
        const data = await res.json()
        if (!res.ok) throw new Error(data.erreur || 'La transcription a échoué.')
        return data
      },
      surEtat: value => { setPhase(value); callbacks.current.onBusy(value !== 'repos') },
      surSecondes: setSeconds, surErreur: setError,
      surTranscription: data => { callbacks.current.onText(data.texte); setNote('Transcription ajoutée. Relisez la consigne avant de préparer le plan.') },
    })
    controller.current = voice
    return () => { voice.disposer(); controller.current = null; callbacks.current.onBusy(false) }
  }, [])
  function start() {
    if (disabled || controller.current?.etat !== 'repos') return
    setError(null); setNote(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setError('La dictée n’est pas disponible ici. Vous pouvez taper votre consigne.'); return }
    void controller.current.commencer()
  }
  return <div className="space-y-2" aria-busy={phase !== 'repos'}>
    <div className="flex flex-wrap items-center gap-2">
      {phase === 'enregistrement' ? <button type="button" className="console-button border-danger/40 text-danger" onClick={() => controller.current?.arreter()}><Square className="size-3.5" aria-hidden="true" />Arrêter et transcrire · {seconds}s / 60s</button>
        : <button type="button" className="console-button" onClick={start} disabled={disabled || phase !== 'repos'}><Mic className="size-4" aria-hidden="true" />{phase === 'permission' ? 'Autorisez le micro…' : phase === 'transcription' ? 'Transcription…' : 'Dicter la consigne'}</button>}
      {phase !== 'repos' && <button type="button" className="console-button" onClick={() => controller.current?.annuler()}><X className="size-4" aria-hidden="true" />Annuler</button>}
    </div>
    {phase !== 'repos' && <p className="text-xs text-muted-foreground" role="status">{phase === 'enregistrement' ? 'Le micro enregistre votre consigne.' : phase === 'transcription' ? 'Micro fermé. La transcription est en cours.' : 'En attente de l’autorisation du micro.'}</p>}
    {note && <p className="text-xs text-safe" role="status">{note}</p>}
    {error && <p className="text-sm text-danger" role="alert">{error}</p>}
  </div>
}
