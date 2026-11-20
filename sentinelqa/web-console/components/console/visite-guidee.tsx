'use client'

import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { visitePour, type EtapeVisite, type Visite } from '@/lib/visites'

// D-59 : la visite guidée de la page affichée. Le « ? » de la barre du haut la lance ; un curseur part du bouton et glisse
// vers chaque élément, qui s'éclaire, avec une bulle courte. Elle ne clique ni ne lance rien. Les animations sont jouées
// une fois (transform et opacity) ; « réduire les animations » les retire.

const CLE = 'hs_visites'
const lues = (): string[] => { try { return JSON.parse(localStorage.getItem(CLE) || '[]') } catch { return [] } }
const marquer = (cle: string) => { try { localStorage.setItem(CLE, JSON.stringify([...new Set([...lues(), cle])])) } catch { /* le navigateur refuse : rien de grave */ } }

/** La cible d'une étape, si elle est réellement à l'écran (ni absente, ni cachée, ni dans un tiroir fermé). */
function cibleDe(etape: EtapeVisite): HTMLElement | null {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(etape.cible))) {
    const r = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    if (r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth && style.visibility !== 'hidden' && style.display !== 'none') return el
  }
  return null
}

export function BoutonVisite() {
  const chemin = usePathname()
  const visite = visitePour(chemin ?? '')
  const [ouverte, setOuverte] = useState(false)
  const [nouvelle, setNouvelle] = useState(false)
  const bouton = useRef<HTMLButtonElement>(null)
  const cle = visite?.cle

  useEffect(() => {
    setOuverte(false)
    setNouvelle(Boolean(cle) && !lues().includes(cle!))
  }, [cle])

  const fermer = useCallback(() => {
    setOuverte(false)
    setNouvelle(false)
    if (cle) marquer(cle)
    requestAnimationFrame(() => bouton.current?.focus())
  }, [cle])

  if (!visite) return null
  return (
    <>
      <button ref={bouton} type="button" className="lv-visite-bouton" data-nouvelle={nouvelle ? '' : undefined} aria-haspopup="dialog"
        aria-label={`Visite guidée de la page : ${visite.titre}`} title="Visite guidée de cette page" onClick={() => setOuverte(true)}>
        <span className="lv-visite-signe" aria-hidden="true">?</span>
        <span className="lv-visite-libelle">Visite guidée</span>
      </button>
      {ouverte ? <Parcours visite={visite} depart={bouton.current?.getBoundingClientRect() ?? null} onFin={fermer} /> : null}
    </>
  )
}

function Parcours({ visite, depart, onFin }: { visite: Visite; depart: DOMRect | null; onFin: () => void }) {
  // Les étapes dont la cible est à l'écran, relevées à l'ouverture : la page ne change pas pendant la visite.
  const [etapes] = useState(() => visite.etapes.filter((e) => cibleDe(e)))
  const [i, setI] = useState(0)
  const [boite, setBoite] = useState<DOMRect | null>(null)
  const [appui, setAppui] = useState(0)
  const suivant = useRef<HTMLButtonElement>(null)
  const reduit = useRef(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const etape = etapes[i]
  const derniere = i === etapes.length - 1

  const aller = useCallback((pas: number) => setI((n) => Math.min(Math.max(n + pas, 0), etapes.length - 1)), [etapes.length])

  // Rien à montrer (une page encore vide) : la visite se referme aussitôt.
  useEffect(() => { if (!etapes.length) onFin() }, [etapes.length, onFin])

  // La cible : on y défile, puis on relève sa place ; défilement et redimensionnement la suivent.
  useEffect(() => {
    if (!etape) return
    const el = cibleDe(etape)
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: reduit.current ? 'auto' : 'smooth' })
    let image = 0
    const mesurer = () => { cancelAnimationFrame(image); image = requestAnimationFrame(() => setBoite(el.getBoundingClientRect())) }
    const attente = setTimeout(mesurer, reduit.current ? 0 : 420)
    addEventListener('scroll', mesurer, true)
    addEventListener('resize', mesurer)
    return () => { clearTimeout(attente); cancelAnimationFrame(image); removeEventListener('scroll', mesurer, true); removeEventListener('resize', mesurer) }
  }, [etape])

  useEffect(() => { suivant.current?.focus({ preventScroll: true }) }, [i])

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onFin() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (derniere) onFin(); else aller(1) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); aller(-1) }
    }
    addEventListener('keydown', touche)
    return () => removeEventListener('keydown', touche)
  }, [aller, derniere, onFin])

  if (!etape) return null
  const w = typeof window === 'undefined' ? 1280 : innerWidth
  const h = typeof window === 'undefined' ? 800 : innerHeight
  const etroit = w < 640
  // Le curseur pointe la cible (vers le haut et la gauche d'un grand bloc) ; il part du « ? ».
  const x = boite ? boite.left + Math.min(boite.width / 2, 150) : (depart?.left ?? w - 80)
  const y = boite ? boite.top + Math.min(boite.height / 2, 44) : (depart?.top ?? 20)
  // La bulle : sous la cible s'il y a la place, sinon au-dessus ; sur téléphone, en bas ou en haut de l'écran.
  const dessous = boite ? h - boite.bottom >= 230 || boite.top < 230 : true
  const style: React.CSSProperties = etroit
    ? (boite && boite.top + boite.height / 2 > h / 2 ? { top: 12 } : { bottom: 12 })
    : { left: Math.min(Math.max((boite?.left ?? 16), 16), w - 356), ...(dessous ? { top: Math.min((boite?.bottom ?? 80) + 18, h - 240) } : { bottom: h - (boite?.top ?? h) + 18 }) }

  return createPortal(
    <div className="lv-visite" data-reduit={reduit.current ? '' : undefined}>
      <div className="lv-visite-voile" aria-hidden="true" />
      {boite ? <div className="lv-visite-halo" aria-hidden="true"
        style={{ top: boite.top - 6, left: boite.left - 6, width: boite.width + 12, height: boite.height + 12 }} /> : null}
      <div className="lv-visite-curseur" aria-hidden="true" style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
        onTransitionEnd={(e) => { if (e.propertyName === 'transform') setAppui((n) => n + 1) }}>
        <svg key={appui} className={appui ? 'lv-visite-appui' : undefined} viewBox="0 0 24 24">
          <path d="M5 2.5v17.2l4.3-4.1 3.1 6.6 3-1.4-3.1-6.5h6.1z" />
        </svg>
      </div>
      <div key={i} role="dialog" aria-modal="true" aria-labelledby="visite-titre" aria-describedby="visite-texte" className="lv-visite-bulle" style={style}>
        <div className="lv-visite-tete">
          <p className="lv-visite-compte">{visite.titre} · {i + 1} sur {etapes.length}</p>
          <button type="button" className="lv-visite-fermer" onClick={onFin} aria-label="Quitter la visite"><X aria-hidden="true" /></button>
        </div>
        <h2 id="visite-titre">{etape.titre}</h2>
        <p id="visite-texte">{etape.texte}</p>
        <div className="lv-visite-pied">
          <ol className="lv-visite-crans" aria-hidden="true">{etapes.map((_, k) => <li key={k} data-fait={k <= i ? '' : undefined} />)}</ol>
          {i > 0 ? <button type="button" className="lv-bouton lv-bouton-trait lv-bouton-petit" onClick={() => aller(-1)}><ArrowLeft aria-hidden="true" />Précédent</button> : null}
          <button ref={suivant} type="button" className="lv-bouton lv-bouton-bleu lv-bouton-petit" onClick={() => (derniere ? onFin() : aller(1))}>
            {derniere ? <>Terminer<Check aria-hidden="true" /></> : <>Suivant<ArrowRight aria-hidden="true" /></>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
