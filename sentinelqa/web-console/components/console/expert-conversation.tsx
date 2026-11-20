'use client'

import { Check, CornerDownLeft, KeyRound, Keyboard, Mic, Plus, Square, Volume2, X } from 'lucide-react'
import Link from 'next/link'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { creerDictee as creerDicteeJs } from '../../../web/lib/qa-dictee.mjs'
import { mots as decouperMots, motsDits, planMots, typographie } from '@/lib/expert/conversation.mjs'
import { parler, phrases as decouper, questionTranscrite, taire } from '@/lib/expert/voix.mjs'
import { cn } from '@/lib/utils'

// D-51 : le mode conversation de l'expert, sur le modèle de la Voix de LEVELS (/Users/aurian/Desktop/levels:/app.js,
// openVoice). L'écran naît du bouton qu'on vient de toucher, l'expert parle le premier, puis on se répond à voix haute :
// le silence clôt votre phrase, la réponse s'écrit mot à mot au rythme de la voix (l'écran suit la voix, jamais un
// minuteur), et l'écoute reprend seule en mains libres. Le fil est partagé avec le panneau du studio.
// L'instrument (une rangée de barres) suit le micro quand vous parlez, la voix de l'expert quand il répond.
// Performance (fable-fps) : transform et opacité seulement ; une seule boucle d'animation, active quand quelqu'un parle.

type Dictee = { etat: string; commencer(): Promise<void>; arreter(): void; annuler(): void; disposer(): void }
const creerDictee = creerDicteeJs as unknown as (options: Record<string, unknown>) => Dictee

// D-56 : l'expert oriente au lieu de bloquer. Sous sa réponse, un bouton mène à l'ajout de l'application ou d'un compte de test.
export type ActionProposee = { type: 'ajouter_application' | 'ajouter_compte'; libelle: string; href: string }
export type ReponseExpert = { reponse: string; consigne_proposee: string | null; action?: ActionProposee | null }
export type TourFil = { role: 'utilisateur' | 'expert'; texte: string; consigne?: string | null; action?: ActionProposee | null }
type Tour = TourFil & { id: number; direct: boolean; phrases: string[] }
type Etat = 'arrivee' | 'ouverture' | 'ecoute' | 'transcription' | 'reflexion' | 'formulation' | 'reponse' | 'attente'
type Props = {
  nom: string
  volet: 'qa' | 'pentest'
  cibleNom: string | null
  accueil: string
  fil: TourFil[]
  origine: { x: number; y: number } | null
  poser: (question: string) => Promise<ReponseExpert | null>
  annoncer: (texte: string) => void
  onApply: (texte: string) => void
  onClose: () => void
}

const BARRES = 36
// Détection de la fin de phrase : le silence après la parole, mesuré sur le micro.
const SILENCE_FIN_MS = 1100
const SANS_PAROLE_MS = 8000
const PAROLE_MAX_MS = 25000
// La voix Hugging Face varie (0,6 s le matin du 19/11, 1,2 à 5,3 s l'après-midi) : au-delà, la voix de LEVELS prend le relais.
const VOIX_MAX_MS = 6000
// Au-delà de cette durée, un appui sur « Parler » est un maintien : le relâché envoie la phrase.
const MAINTIEN_MS = 350
// Le temps que l'écran se déplie depuis le bouton, avant que l'expert ne prenne la parole.
const ARRIVEE_MS = 520

function etiquette(etat: Etat, nom: string) {
  switch (etat) {
    case 'arrivee': return `${nom} prend place`
    case 'ouverture': return 'Ouverture du micro'
    case 'ecoute': return `${nom} vous écoute`
    case 'transcription': return 'Transcription de vos mots'
    case 'reflexion': return `${nom} réfléchit`
    case 'formulation': return `${nom} prend la parole`
    case 'reponse': return `${nom} vous répond`
    default: return 'À vous'
  }
}

// ── La voix Hugging Face d'une phrase, demandée une seule fois : le survol du bouton précharge l'accueil. ──
const voixEnCache = new Map<string, Promise<Blob>>()
export function voixDe(texte: string) {
  let p = voixEnCache.get(texte)
  if (!p) {
    p = fetch('/api/console/expert/voix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texte }) })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('voix indisponible'))))
    p.catch(() => voixEnCache.delete(texte))
    if (voixEnCache.size >= 24) voixEnCache.delete(voixEnCache.keys().next().value as string)
    voixEnCache.set(texte, p)
  }
  return p
}
export function prechargerAccueil(texte: string) {
  for (const p of decouper(texte)) void voixDe(p).catch(() => {})
}

// ── Le son s'ouvre dans le geste même (le clic sur « Converser à la voix ») : sinon Safari le garde muet. ──
let contexteAudio: AudioContext | null = null
export function amorcerAudio() {
  try {
    contexteAudio ??= new AudioContext()
    if (contexteAudio.state === 'suspended') void contexteAudio.resume().catch(() => {})
  } catch { contexteAudio = null }
  return contexteAudio
}

export function ExpertConversation({ nom, volet, cibleNom, accueil, fil: filInitial, origine, poser, annoncer, onApply, onClose }: Props) {
  const ids = useRef(0)
  const [fil, setFil] = useState<Tour[]>(() => filInitial.map((t) => ({ ...t, id: ++ids.current, direct: false, phrases: decouper(t.texte) })))
  const [etat, setEtat] = useState<Etat>('arrivee')
  const [modeVoix, setModeVoix] = useState<'flux' | 'phrase'>('flux')
  const [reprises, setReprises] = useState<number[]>([])
  const [mainsLibres, setMainsLibres] = useState(true)
  const [ecrire, setEcrire] = useState(false)
  const [saisie, setSaisie] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  // Une remarque (rien entendu, micro en pause) reste lisible pendant la nouvelle écoute : seule une question l'efface.
  const [remarque, setRemarque] = useState<string | null>(null)
  const [fermeture, setFermeture] = useState(false)
  const [maintenu, setMaintenu] = useState(false)
  const maintien = useRef<{ id: number; debut: number; ecoutait: boolean } | null>(null)
  const maintienActif = useRef(false)

  const dictee = useRef<Dictee | null>(null)
  const ctx = useRef<AudioContext | null>(null)
  const micro = useRef<AnalyserNode | null>(null)
  const voix = useRef<AnalyserNode | null>(null)
  const barres = useRef<(HTMLSpanElement | null)[]>([])
  const boucle = useRef<number | null>(null)
  const lecture = useRef(0)
  const audio = useRef<HTMLAudioElement | null>(null)
  const ouvert = useRef(true)
  const premier = useRef<HTMLButtonElement>(null)
  const defilement = useRef<HTMLDivElement>(null)
  const mainsLibresRef = useRef(mainsLibres)
  mainsLibresRef.current = mainsLibres
  const mouvementReduit = useRef(false)

  // Les mots de la réponse en cours : allumés un à un, sans rendu React (une écriture d'attribut par mot dit).
  const motsRef = useRef<(HTMLSpanElement | null)[]>([])
  const allumes = useRef(0)
  const plan = useRef<ReturnType<typeof planMots>>([])
  const allumer = useCallback((n: number) => {
    for (let k = allumes.current; k < n; k++) motsRef.current[k]?.setAttribute('data-dit', '')
    if (n > allumes.current) allumes.current = n
  }, [])

  // ── L'instrument : une seule boucle rAF, qui lit le micro ou la voix, et s'arrête dès que personne ne parle. ──
  const arreterBoucle = useCallback(() => {
    if (boucle.current !== null) cancelAnimationFrame(boucle.current)
    boucle.current = null
    for (const b of barres.current) if (b) b.style.transform = ''
  }, [])

  const animer = useCallback((analyseur: AnalyserNode | null, vad?: (rms: number) => void, image?: () => void) => {
    arreterBoucle()
    const temps = analyseur ? new Uint8Array(analyseur.fftSize) : null
    const freq = analyseur ? new Uint8Array(analyseur.frequencyBinCount) : null
    const tour = () => {
      image?.()
      if (analyseur && temps && freq) {
        analyseur.getByteTimeDomainData(temps)
        let somme = 0
        for (const v of temps) somme += ((v - 128) / 128) ** 2
        const rms = Math.sqrt(somme / temps.length)
        vad?.(rms)
        if (!mouvementReduit.current && !document.hidden) {
          analyseur.getByteFrequencyData(freq)
          const utiles = Math.floor(freq.length * 0.6)
          barres.current.forEach((b, i) => {
            if (!b) return
            // Symétrie autour du centre : les graves au milieu, comme une voix qui s'ouvre.
            const k = Math.abs(i - (BARRES - 1) / 2) / ((BARRES - 1) / 2)
            const v = freq[Math.min(utiles - 1, Math.floor(k * utiles))] / 255
            b.style.transform = `scaleY(${(0.06 + 0.94 * Math.min(1, v * 1.35 + rms * 1.5)).toFixed(3)})`
          })
        }
      }
      boucle.current = requestAnimationFrame(tour)
    }
    boucle.current = requestAnimationFrame(tour)
  }, [arreterBoucle])

  const taireTout = useCallback(() => {
    lecture.current++
    audio.current?.pause()
    audio.current = null
    taire()
    arreterBoucle()
  }, [arreterBoucle])

  // ── La voix : Kokoro (Hugging Face) phrase par phrase, la suivante préchargée ; sinon la voix du système. ──
  const jouer = useCallback((blob: Blob, n: number, i: number, auDebut: () => void) => new Promise<void>((fini, echec) => {
    if (n !== lecture.current) return fini()
    const url = URL.createObjectURL(blob)
    const a = new Audio(url)
    audio.current = a
    let parti = false
    // L'écran suit la voix : la phrase commence à s'écrire quand le son part vraiment, jamais avant.
    a.onplaying = () => { if (!parti && n === lecture.current) { parti = true; auDebut() } }
    let analyseur: AnalyserNode | null = null
    try {
      if (ctx.current?.state === 'running' && voix.current) {
        ctx.current.createMediaElementSource(a).connect(voix.current)
        analyseur = voix.current
      }
    } catch { /* sans analyseur, l'instrument reste au repos : la voix, elle, passe */ }
    // Les mots s'allument au rythme du son : la part de la phrase déjà dite, au prorata des lettres.
    animer(analyseur, undefined, () => {
      if (parti && Number.isFinite(a.duration) && a.duration > 0) allumer(motsDits(plan.current, i, a.currentTime / a.duration))
    })
    const fin = () => { URL.revokeObjectURL(url); allumer(motsDits(plan.current, i, 1)); fini() }
    a.onended = fin
    a.onerror = () => { URL.revokeObjectURL(url); echec(new Error('lecture impossible')) }
    a.play().catch((e) => { URL.revokeObjectURL(url); echec(e) })
  }), [animer, allumer])

  const ecouterRef = useRef<() => Promise<void>>(async () => {})
  // Une fois la voix Hugging Face en défaut, la conversation garde la voix du système jusqu'au bout :
  // un expert qui change de voix d'une réponse à l'autre ne sonne plus comme une présence.
  const secours = useRef(false)

  const repondre = useCallback(async (r: ReponseExpert) => {
    const n = ++lecture.current
    const suite = decouper(r.reponse)
    const id = ++ids.current
    plan.current = planMots(suite)
    motsRef.current = []
    allumes.current = 0
    setFil((f) => [...f.map((t) => (t.direct ? { ...t, direct: false } : t)),
      { id, role: 'expert', texte: r.reponse, consigne: r.consigne_proposee, action: r.action ?? null, direct: true, phrases: suite }])
    setModeVoix('flux')
    setEtat('formulation')
    const apres = () => {
      if (n !== lecture.current || !ouvert.current) return
      arreterBoucle()
      setFil((f) => f.map((t) => (t.id === id ? { ...t, direct: false } : t)))
      if (mainsLibresRef.current) setTimeout(() => { if (ouvert.current && n === lecture.current) void ecouterRef.current() }, 450)
      else setEtat('attente')
    }
    let i = 0
    let minuteur: ReturnType<typeof setTimeout> | undefined
    try {
      if (secours.current) throw new Error('voix de secours')
      let suivante = voixDe(suite[0])
      const lente = new Promise<never>((_, refus) => { minuteur = setTimeout(() => refus(new Error('voix lente')), VOIX_MAX_MS) })
      const premiere = await Promise.race([suivante, lente])
      clearTimeout(minuteur)
      for (; i < suite.length; i++) {
        const blob = i === 0 ? premiere : await suivante
        if (n !== lecture.current) return
        if (i + 1 < suite.length) suivante = voixDe(suite[i + 1])
        await jouer(blob, n, i, () => setEtat('reponse'))
        if (n !== lecture.current) return
      }
      apres()
    } catch {
      clearTimeout(minuteur)
      if (n !== lecture.current) return
      secours.current = true
      // La voix Hugging Face a manqué : la voix du système, réglée comme celle de LEVELS, lit la suite.
      // Sans repère mot à mot, chaque phrase s'écrit en cascade à son vrai départ.
      arreterBoucle()
      setModeVoix('phrase')
      const depart = i
      const dite = (j: number) => {
        setEtat('reponse')
        const ligne = plan.current[depart + j]
        if (ligne) allumer(ligne.debut + ligne.total)
      }
      if (!parler(suite.slice(depart).join(' '), apres, dite)) apres()
    }
  }, [jouer, arreterBoucle, allumer])
  const repondreRef = useRef(repondre)
  repondreRef.current = repondre

  // ── Une seule question à la fois : la fin de phrase détectée au micro et une question écrite ne se croisent jamais. ──
  const enCours = useRef(false)
  const demander = useCallback(async (question: string) => {
    const q = question.trim()
    if (!q || enCours.current) return
    enCours.current = true
    taireTout()
    setErreur(null)
    setRemarque(null)
    const id = ++ids.current
    setFil((f) => [...f.map((t) => (t.direct ? { ...t, direct: false } : t)), { id, role: 'utilisateur', texte: q, direct: false, phrases: [q] }])
    setEtat('reflexion')
    const r = await poser(q)
    enCours.current = false
    if (!ouvert.current) return
    if (r) await repondre(r)
    else { setEtat('attente'); setErreur('L’expert ne répond pas pour l’instant. Réessayez dans un instant.') }
  }, [poser, repondre, taireTout])
  const demanderRef = useRef(demander)
  demanderRef.current = demander

  const ecouter = useCallback(async () => {
    taireTout()
    setErreur(null)
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setEtat('attente')
      setEcrire(true)
      setErreur('Le micro n’est pas disponible ici. Écrivez votre question.')
      return
    }
    if (ctx.current?.state === 'suspended') await ctx.current.resume().catch(() => {})
    if (dictee.current && dictee.current.etat === 'repos') await dictee.current.commencer()
  }, [taireTout])
  ecouterRef.current = ecouter

  // Le flux du micro arrive : on l'écoute pour l'instrument et pour la fin de phrase.
  const surFlux = useCallback((flux: MediaStream | null) => {
    if (!flux || !ctx.current || !micro.current) return
    const source = ctx.current.createMediaStreamSource(flux)
    source.connect(micro.current)
    const debut = performance.now()
    let fond = 0, mesures = 0, parole = false, dernier = 0, suites = 0
    animer(micro.current, (rms) => {
      const t = performance.now()
      if (t - debut < 400) { fond += rms; mesures++; return }
      const seuil = Math.max(0.02, (fond / Math.max(1, mesures)) * 2.5)
      if (rms > seuil) { suites++; if (suites >= 3) { parole = true; dernier = t } } else suites = 0
      const d = dictee.current
      if (!d || d.etat !== 'enregistrement') return
      // La limite de 25 s vaut toujours, mains libres ou non : le 20/11, sans elle, une écoute a couru plus de 30 s
      // et Whisper a complété le silence par « you you ».
      if (t - debut > PAROLE_MAX_MS) { arreterBoucle(); source.disconnect(); d.arreter(); return }
      // Pendant un appui maintenu, c'est le relâché qui envoie : ni le silence ni l'attente ne coupent la parole.
      if (!mainsLibresRef.current || maintienActif.current) return
      if (parole && t - dernier > SILENCE_FIN_MS) { arreterBoucle(); source.disconnect(); d.arreter() }
      else if (!parole && t - debut > SANS_PAROLE_MS) {
        arreterBoucle(); source.disconnect(); d.annuler(); setEtat('attente')
        setRemarque('Micro en pause après 8 s de silence. Appuyez sur « Parler » pour reprendre.')
      }
    })
  }, [animer, arreterBoucle])

  const annoncerRef = useRef(annoncer)
  annoncerRef.current = annoncer
  const accueilRef = useRef(accueil)

  useEffect(() => {
    mouvementReduit.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ctx.current = amorcerAudio()
    try {
      if (ctx.current) {
        micro.current = ctx.current.createAnalyser()
        micro.current.fftSize = 1024
        voix.current = ctx.current.createAnalyser()
        voix.current.fftSize = 1024
        voix.current.connect(ctx.current.destination)
      }
    } catch { micro.current = null; voix.current = null }
    const d = creerDictee({
      obtenirFlux: () => navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }),
      creerEnregistreur: (stream: MediaStream) => {
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((t) => MediaRecorder.isTypeSupported?.(t))
        return new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      },
      transcrire: async (audioBlob: Blob, signal: AbortSignal) => {
        const res = await fetch('/api/console/transcription', { method: 'POST', body: audioBlob, signal, headers: { 'Content-Type': audioBlob.type } })
        const data = await res.json()
        if (!res.ok) throw new Error(data.erreur || 'La transcription a échoué.')
        return data
      },
      surEtat: (e: string) => {
        if (!ouvert.current) return
        if (e === 'permission') setEtat('ouverture')
        else if (e === 'enregistrement') setEtat('ecoute')
        else if (e === 'transcription') setEtat('transcription')
      },
      surFlux,
      // Le contrôleur efface son erreur (null) à chaque nouvelle écoute : ce n'est pas un passage à « À vous ».
      surErreur: (m: string | null) => { if (!ouvert.current) return; setErreur(m); if (m) setEtat('attente') },
      surTranscription: (data: { texte: string }) => {
        const question = questionTranscrite(data.texte)
        if (question) { void demanderRef.current(question); return }
        // Rien de clair (bruit, ou phrase fantôme de Whisper) : on réécoute, sans déranger l'expert.
        setRemarque('Je n’ai rien entendu de clair. Reparlez, ou écrivez votre question.')
        if (mainsLibresRef.current) setTimeout(() => { if (ouvert.current) void ecouterRef.current() }, 300)
        else setEtat('attente')
      },
    })
    dictee.current = d
    const corps = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    premier.current?.focus({ preventScroll: true })
    // L'expert parle le premier, une fois l'écran posé : sa phrase entre aussi dans l'historique partagé.
    const prise = setTimeout(() => {
      if (!ouvert.current) return
      annoncerRef.current(accueilRef.current)
      void repondreRef.current({ reponse: accueilRef.current, consigne_proposee: null })
    }, mouvementReduit.current ? 0 : ARRIVEE_MS)
    return () => {
      ouvert.current = false
      clearTimeout(prise)
      document.body.style.overflow = corps
      d.disposer()
      dictee.current = null
      lecture.current++
      audio.current?.pause()
      taire()
      if (boucle.current !== null) cancelAnimationFrame(boucle.current)
      try { micro.current?.disconnect(); voix.current?.disconnect() } catch {}
    }
  }, [surFlux])

  // Partir : tout se tait tout de suite, puis l'écran se replie (sauf « réduire les animations »).
  const fermant = useRef(false)
  const fermer = useCallback(() => {
    if (fermant.current) return
    fermant.current = true
    ouvert.current = false
    if (dictee.current?.etat !== 'repos') dictee.current?.annuler()
    taireTout()
    if (mouvementReduit.current) onClose()
    else { setFermeture(true); setTimeout(onClose, 200) }
  }, [onClose, taireTout])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') fermer() }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [fermer])

  // Le fil défile jusqu'au dernier tour : la réponse en cours occupe déjà sa place, mots éteints.
  useEffect(() => {
    const el = defilement.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: mouvementReduit.current ? 'auto' : 'smooth' })
  }, [fil])

  function parlerMaintenant() {
    if (etat === 'ecoute') { dictee.current?.arreter(); return }
    setRemarque(null)
    void ecouter()
  }

  // « Parler » se touche ou se maintient (comme « Maintiens pour parler » de LEVELS). L'appui ouvre le micro tout de
  // suite ; relâché après MAINTIEN_MS, il envoie la phrase ; un appui bref garde l'écoute ouverte (le silence clôt la
  // phrase en mains libres). Le relâché est capturé : un doigt qui glisse hors du bouton n'oublie jamais d'envoyer.
  // Avant le 20/11, l'appui ne faisait rien et l'écoute ne partait qu'au relâché (bug signalé par Aurian).
  function appui(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || !e.isPrimary || maintien.current) return
    e.preventDefault()
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* le relâché arrivera quand même au bouton */ }
    const ecoutait = etat === 'ecoute'
    maintien.current = { id: e.pointerId, debut: performance.now(), ecoutait }
    if (ecoutait) return
    maintienActif.current = true
    setMaintenu(true)
    setRemarque(null)
    void ecouter()
  }
  function relache(e: React.PointerEvent<HTMLButtonElement>) {
    const m = maintien.current
    if (!m || m.id !== e.pointerId) return
    maintien.current = null
    maintienActif.current = false
    setMaintenu(false)
    if (m.ecoutait || performance.now() - m.debut >= MAINTIEN_MS) dictee.current?.arreter()
  }

  function envoyer() {
    const q = saisie.trim()
    if (!q || enCours.current) return
    if (dictee.current?.etat !== 'repos') dictee.current?.annuler()
    setSaisie('')
    void demander(q)
  }

  const occupe = etat === 'arrivee' || etat === 'ouverture' || etat === 'transcription' || etat === 'reflexion'
  const animation = etat === 'arrivee' ? 'arrivee'
    : etat === 'reflexion' || etat === 'transcription' || etat === 'formulation' ? 'reflexion'
    : etat === 'reponse' && modeVoix === 'phrase' ? 'parole' : 'mesure'
  const bouton = maintenu ? 'Relâchez pour envoyer' : etat === 'ecoute' ? 'J’ai fini' : etat === 'reponse' || etat === 'formulation' ? 'Couper et parler' : 'Parler'
  // L'échange en cours reste net ; les tours plus anciens s'effacent à moitié.
  const recent = fil.findLastIndex((t) => t.role === 'utilisateur')

  return (
    <div role="dialog" aria-modal="true" aria-label={`Conversation · ${nom}`} data-etat={etat}
      className={cn('expert-conversation fixed inset-0 z-[60]', fermeture && 'expert-fermeture')}
      style={origine ? { ['--ox' as string]: `${Math.round(origine.x)}px`, ['--oy' as string]: `${Math.round(origine.y)}px` } : undefined}>
      <div className="mx-auto flex h-full w-full max-w-[680px] flex-col px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="expert-qui whitespace-nowrap"><span className="hidden sm:inline">Conversation · </span><span className="expert-nom">{nom}</span></p>
            {cibleNom ? <p className="expert-cible">{cibleNom}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" aria-pressed={mainsLibres} onClick={() => setMainsLibres(!mainsLibres)} className="expert-bascule">
              Mains libres · {mainsLibres ? 'oui' : 'non'}
            </button>
            <button ref={premier} type="button" onClick={fermer} aria-label="Terminer la conversation" className="expert-fermer">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex flex-col items-center gap-3 pt-7 pb-2 sm:pt-12">
          <div className="expert-barres" data-animation={animation} aria-hidden="true">
            {Array.from({ length: BARRES }, (_, i) => (
              <span key={i} ref={(el) => { barres.current[i] = el }} style={{ ['--i' as string]: Math.abs(i - (BARRES - 1) / 2) }} />
            ))}
          </div>
          <p className="expert-etat" role="status" aria-live="polite">{etiquette(etat, nom)}</p>
        </div>

        <div ref={defilement} className="expert-defilement min-h-0 flex-1 overflow-y-auto">
          <ol className="expert-fil" aria-label={`Conversation avec ${nom.toLowerCase()}`}>
            {fil.map((t, index) => (
              <li key={t.id} data-direct={t.direct ? '' : undefined} data-mode={t.direct ? modeVoix : undefined}
                className={cn('expert-tour', t.role === 'utilisateur' ? 'expert-tour-vous' : 'expert-tour-expert', recent >= 0 && index < recent && 'expert-tour-passe')}>
                <p className="expert-qui">{t.role === 'utilisateur' ? 'Vous' : nom}</p>
                {t.role === 'utilisateur' ? (
                  <p className="expert-vous">«&nbsp;{typographie(t.texte)}&nbsp;»</p>
                ) : (
                  <p className="expert-dit">
                    {t.phrases.map((phrase, j) => {
                      const ligne = t.direct ? plan.current[j] : undefined
                      return decouperMots(phrase).map((mot, m) => (
                        <Fragment key={`${j}-${m}`}>
                          <span className="expert-mot" style={{ ['--m' as string]: m }}
                            ref={ligne ? (el) => { motsRef.current[ligne.debut + m] = el } : undefined}>{mot}</span>{' '}
                        </Fragment>
                      ))
                    })}
                  </p>
                )}
                {t.role === 'expert' && t.consigne && !t.direct ? (
                  <div className="expert-proposition">
                    <p className="expert-qui expert-qui-voix">{volet === 'qa' ? 'Consigne proposée' : 'Précisions proposées'}</p>
                    <p className="expert-proposition-texte">{typographie(t.consigne)}</p>
                    <button type="button" disabled={reprises.includes(t.id)} className="expert-action"
                      onClick={() => { onApply(t.consigne!); setReprises((r) => [...r, t.id]) }}>
                      {reprises.includes(t.id) ? <Check className="size-4" aria-hidden="true" /> : <CornerDownLeft className="size-4" aria-hidden="true" />}
                      {reprises.includes(t.id) ? 'Reprise dans la consigne' : 'Reprendre dans la consigne'}
                    </button>
                  </div>
                ) : null}
                {t.role === 'expert' && t.action && !t.direct ? (
                  <div className="expert-proposition">
                    <Link href={t.action.href} className="expert-action">
                      {t.action.type === 'ajouter_compte' ? <KeyRound className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                      {t.action.libelle}
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <footer className="flex flex-col gap-3 pt-3">
          {erreur ? <p role="alert" className="expert-erreur">{erreur}</p>
            : remarque ? <p role="alert" className="expert-remarque">{remarque}</p> : null}
          {ecrire ? (
            <div className="flex gap-2">
              <label className="sr-only" htmlFor="conversation-saisie">Votre question à l’expert</label>
              <input id="conversation-saisie" value={saisie} maxLength={1000} onChange={(e) => setSaisie(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); envoyer() } }}
                placeholder="Votre question…" autoFocus className="expert-saisie" />
              <button type="button" onClick={envoyer} disabled={!saisie.trim() || etat === 'reflexion'} className="expert-envoyer">
                Envoyer
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <button type="button" disabled={occupe} onPointerDown={appui} onPointerUp={relache} onPointerCancel={relache} onLostPointerCapture={relache}
              onClick={(e) => { if (e.detail === 0) parlerMaintenant() }} onContextMenu={(e) => e.preventDefault()}
              className={cn('expert-bouton expert-bouton-parler', etat === 'ecoute' || occupe ? 'expert-bouton-trait' : 'expert-bouton-plein')}>
              {etat === 'ecoute' ? <Square className="size-4" aria-hidden="true" /> : etat === 'reponse' || etat === 'formulation' ? <Volume2 className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
              {bouton}
            </button>
            <button type="button" aria-pressed={ecrire} onClick={() => setEcrire(!ecrire)} aria-label="Écrire plutôt que parler" className="expert-clavier">
              <Keyboard className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p className="expert-note">
            {modeVoix === 'phrase' ? 'Whisper écoute · Llama répond, sur Hugging Face · voix du système.' : 'Whisper écoute · Llama répond · Kokoro parle, sur Hugging Face.'} L’expert ne lance rien.
          </p>
        </footer>
      </div>
    </div>
  )
}
