'use client';

import { useEffect, useRef, useState } from 'react';

const HAUTEUR = 52;
const VISIBLES = 2;
const PAS_MS = 2600;
const INACTIVITE_MS = 180000;

// Sous l'objectif : les pages qui fuient défilent une à une, comme sur un écran de contrôle.
// Un seul mouvement composité (transform) toutes les 2,6 s ; il s'arrête au survol, quand l'onglet est caché,
// et après trois minutes sans geste (fable-fps). Chaque ligne mène à la preuve.
export default function Defilement({ preuves }) {
  const [rang, setRang] = useState(0);
  const [glisse, setGlisse] = useState(true);
  const pause = useRef(false);
  const boucle = preuves.length > VISIBLES;

  useEffect(() => {
    if (!boucle || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let geste = Date.now();
    const activite = () => { geste = Date.now(); };
    window.addEventListener('pointermove', activite, { passive: true });
    window.addEventListener('keydown', activite);
    const minuteur = setInterval(() => {
      if (document.hidden || pause.current || Date.now() - geste > INACTIVITE_MS) return;
      setGlisse(true);
      setRang((r) => r + 1);
    }, PAS_MS);
    return () => {
      clearInterval(minuteur);
      window.removeEventListener('pointermove', activite);
      window.removeEventListener('keydown', activite);
    };
  }, [boucle]);

  // Les premières lignes sont recopiées en fin de liste : arrivé au bout, on revient au début sans transition.
  const fin = () => {
    if (rang >= preuves.length) {
      setGlisse(false);
      setRang(0);
    }
  };
  const lignes = boucle ? [...preuves, ...preuves.slice(0, VISIBLES)] : preuves;

  return (
    <section className="defilement carte" aria-label="Les failles prouvées" onPointerEnter={() => { pause.current = true; }} onPointerLeave={() => { pause.current = false; }}>
      <div className="tete-defilement">
        <span className="kicker">Sous l’objectif</span>
        <span className="kicker">{preuves.length} {preuves.length > 1 ? 'failles prouvées' : 'faille prouvée'}</span>
      </div>
      <div className="fenetre">
        <ol style={{ transform: `translateY(${-rang * HAUTEUR}px)`, transition: glisse ? 'transform 650ms cubic-bezier(0.2, 0.7, 0.2, 1)' : 'none' }} onTransitionEnd={fin}>
          {lignes.map((p, i) => (
            <li key={`${p.cle}-${i}`} aria-hidden={i >= preuves.length || undefined}>
              <a href={p.href} tabIndex={i >= preuves.length ? -1 : undefined}>
                <span className="chemin">{p.chemin}<small>{p.theme} · {p.scenario}</small></span>
                <span className="chevron" aria-hidden="true">›</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
