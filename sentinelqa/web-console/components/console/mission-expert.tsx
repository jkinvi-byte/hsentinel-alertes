'use client'

import { ArrowRight, CornerDownLeft, KeyRound, Keyboard, Mic, Play, Plus, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { parler, taire } from '@/lib/expert/voix.mjs'
import { accueilExpert, typographie } from '@/lib/expert/conversation.mjs'
import { amorcerAudio, ExpertConversation, prechargerAccueil, type ActionProposee, type Lancement, type ReponseExpert } from './expert-conversation'

// D-51 puis D-55 : l'expert QA ou Pentest, porte d'entrée de la nouvelle mission. On commence par la voix : le grand
// bouton ouvre la conversation (le seul micro du studio, D-55 : « parler avec l'IA en plus de la reconnaissance vocale,
// c'est trop »). On peut aussi lui écrire, ou passer aux paramètres manuels. D-57 : quand tout est prêt, sa consigne part après un
// compte à rebours annulable ; sinon elle
// ne remplace la vôtre que sur « Reprendre dans la consigne ».

type Volet = 'qa' | 'pentest'
type Message = { role: 'utilisateur' | 'expert'; texte: string; consigne?: string | null; action?: ActionProposee | null; lancement?: Lancement; fiches?: string[] }
type Props = {
  volet: Volet
  cible: string
  cibleNom?: string | null
  consigne: string
  disabled?: boolean
  /** La consigne choisie ; `lancer` : partir tout de suite, car tout est prêt (D-57). */
  onApply: (texte: string, lancer?: boolean) => void
  onManuel?: () => void
  /** Arrivée par « Parler à l'expert » : la conversation s'ouvre seule si le geste de l'utilisateur est encore actif. */
  ouvrirAuDepart?: boolean
}

const NOM: Record<Volet, string> = { qa: 'L’expert QA', pentest: 'L’expert Pentest' }
const QUESTION: Record<Volet, string> = { qa: 'Que souhaitez-vous vérifier\u202f?', pentest: 'Que souhaitez-vous contrôler\u202f?' }

export function MissionExpert({ volet, cible, cibleNom = null, consigne, disabled = false, onApply, onManuel, ouvrirAuDepart = false }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [attente, setAttente] = useState(false)
  const [voix, setVoix] = useState(true)
  const [parle, setParle] = useState(false)
  const [ecrire, setEcrire] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [conversation, setConversation] = useState(false)
  const [origine, setOrigine] = useState<{ x: number; y: number } | null>(null)
  const fil = useRef<HTMLOListElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)
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
      setMessages((m) => [...m, { role: 'expert', texte: data.reponse, consigne: data.consigne_proposee, action: data.action ?? null, lancement: data.lancement ?? null, fiches: data.fiches }])
      return { reponse: data.reponse, consigne_proposee: data.consigne_proposee ?? null, action: data.action ?? null, lancement: data.lancement ?? null }
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
  function ouvrirConversation(depuis: HTMLElement) {
    arreterVoix()
    amorcerAudio()
    prechargerAccueil(accueil)
    const r = depuis.getBoundingClientRect()
    setOrigine({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
    setErreur(null)
    setConversation(true)
  }

  // Changer de volet, c'est changer d'expert : la conversation repart de zéro.
  useEffect(() => {
    setMessages([])
    setErreur(null)
    arreterVoix()
  }, [volet])

  useEffect(() => {
    fil.current?.lastElementChild?.scrollIntoView({ block: 'nearest' })
  }, [messages])

  useEffect(() => () => arreterVoix(), [])

  // Venue de « Parler à l'expert » (vue d'ensemble) par la navigation de l'application : le geste est encore actif,
  // la voix peut partir. Sans geste (adresse tapée, rechargement), on attend le clic : jamais d'expert muet.
  useEffect(() => {
    if (!ouvrirAuDepart || !cible || !bouton.current) return
    const actif = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation?.isActive
    if (actif) ouvrirConversation(bouton.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statut = attente ? `${NOM[volet]} réfléchit…` : parle ? `${NOM[volet]} parle.` : null

  return (
    <section className="lv-expert" aria-labelledby="expert-titre">
      <div className="lv-expert-barres" aria-hidden="true">
        {Array.from({ length: 23 }, (_, i) => <span key={i} style={{ ['--i' as string]: Math.abs(i - 11) }} />)}
      </div>
      <p className="lv-expert-surtitre">{NOM[volet]} · votre mission commence ici</p>
      <h2 id="expert-titre">Bonjour.<br />{QUESTION[volet]}</h2>
      <p className="lv-expert-chapo">
        Décrivez votre objectif{cibleNom ? ` sur ${cibleNom}` : ''}. {NOM[volet]} prépare le test avec vous, puis vous décidez de le lancer.
      </p>
      <div className="lv-expert-actions">
        <button ref={bouton} type="button" className="lv-bouton lv-bouton-encre lv-bouton-grand" disabled={disabled || !cible}
          onPointerEnter={() => prechargerAccueil(accueil)} onFocus={() => prechargerAccueil(accueil)}
          onClick={(e) => ouvrirConversation(e.currentTarget)}>
          <Mic aria-hidden="true" />
          Parler à l’expert
        </button>
        <button type="button" className="lv-bouton lv-bouton-trait" aria-pressed={ecrire} onClick={() => setEcrire(!ecrire)}>
          <Keyboard aria-hidden="true" />
          Écrire à l’expert
        </button>
        {onManuel ? (
          <button type="button" className="lv-bouton lv-bouton-discret" onClick={onManuel}>
            <SlidersHorizontal aria-hidden="true" />
            Paramétrer manuellement
          </button>
        ) : null}
      </div>

      {messages.length ? (
        <ol ref={fil} className="lv-expert-fil" aria-label={`Conversation avec ${NOM[volet].toLowerCase()}`}>
          {messages.map((m, i) => (
            <li key={i} data-role={m.role}>
              <p className="lv-expert-qui">{m.role === 'utilisateur' ? 'Vous' : NOM[volet]}</p>
              <p className="lv-expert-texte">{typographie(m.texte)}</p>
              {m.consigne ? (
                <div className="lv-expert-proposition">
                  <p className="lv-expert-qui">{volet === 'qa' ? 'Consigne proposée' : 'Précisions proposées'}</p>
                  <p>{typographie(m.consigne)}</p>
                  <div className="flex flex-wrap gap-2">
                    {m.lancement === 'direct' ? (
                      <button type="button" className="lv-bouton lv-bouton-bleu" disabled={disabled} onClick={() => onApply(m.consigne!, true)}>
                        <Play aria-hidden="true" />
                        Lancer la mission
                      </button>
                    ) : null}
                    <button type="button" className={`lv-bouton ${m.lancement === 'direct' ? 'lv-bouton-trait' : 'lv-bouton-bleu'}`} disabled={disabled} onClick={() => onApply(m.consigne!, false)}>
                      <CornerDownLeft aria-hidden="true" />
                      Reprendre dans la consigne
                    </button>
                  </div>
                </div>
              ) : null}
              {m.action ? (
                <div className="lv-expert-proposition">
                  <p className="lv-expert-qui">{m.action.type === 'ajouter_compte' ? 'Compte de test' : 'Votre application'}</p>
                  <Link href={m.action.href} className="lv-bouton lv-bouton-bleu">
                    {m.action.type === 'ajouter_compte' ? <KeyRound aria-hidden="true" /> : <Plus aria-hidden="true" />}
                    {m.action.libelle}
                  </Link>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      {ecrire || messages.length ? (
        <div className="lv-expert-saisie">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Votre question à l’expert</span>
            <input
              value={question}
              maxLength={1000}
              disabled={disabled || attente || !cible}
              placeholder="Ou écrivez votre objectif…"
              onChange={(e) => setQuestion(e.target.value)}
              // Entrée ne doit jamais envoyer le formulaire du studio (qui lance la mission) : elle pose la question.
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void demander(question) } }}
            />
          </label>
          <button type="button" className="lv-bouton lv-bouton-bleu" disabled={disabled || attente || !question.trim() || !cible} onClick={() => void demander(question)}>
            Demander <ArrowRight aria-hidden="true" />
          </button>
          <button type="button" className="lv-bouton lv-bouton-discret" aria-pressed={voix} onClick={() => { if (voix) arreterVoix(); setVoix(!voix) }}>
            {voix ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
            {voix ? 'Réponses lues' : 'Réponses muettes'}
          </button>
        </div>
      ) : null}

      {statut ? <p className="lv-expert-statut" role="status">{statut}</p> : null}
      {erreur ? <p className="text-[13px] text-danger" role="alert">{erreur}</p> : null}
      <p className="lv-expert-note">Whisper écoute · Llama répond · Kokoro parle, sur Hugging Face. Quand tout est prêt, l’expert lance la mission après un compte à rebours ; vous pouvez annuler.</p>

      {conversation ? (
        <ExpertConversation nom={NOM[volet]} volet={volet} cibleNom={cibleNom} accueil={accueil} fil={messages} origine={origine}
          poser={poser} annoncer={(texte) => setMessages((m) => [...m, { role: 'expert', texte }])}
          onApply={onApply} onClose={() => setConversation(false)} />
      ) : null}
    </section>
  )
}
