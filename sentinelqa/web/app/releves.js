'use client';

import { useEffect, useRef, useState } from 'react';
import { Icone } from './composants';

// L'index des relevés, dans une feuille de verre posée sur la salle : trois façons de chercher,
// une liste par façon ; chaque ligne mène à la page qui la détaille. <dialog> gère le focus et la touche Échap.
const ONGLETS = [
  { cle: 'date', libelle: 'Par date', parametre: 'date' },
  { cle: 'theme', libelle: 'Par thème', parametre: 'theme' },
  { cle: 'application', libelle: 'Par application', parametre: 'application' },
];

export default function Releves({ dates, themes, applications, total }) {
  const feuille = useRef(null);
  const [onglet, setOnglet] = useState('date');
  const listes = { date: dates, theme: themes, application: applications };

  useEffect(() => {
    const d = feuille.current;
    const fermee = () => { delete document.documentElement.dataset.feuille; };
    d?.addEventListener('close', fermee);
    return () => d?.removeEventListener('close', fermee);
  }, []);

  const ouvrir = () => {
    document.documentElement.dataset.feuille = 'ouverte'; // la scène 3D cesse de suivre le pointeur sous la feuille
    feuille.current?.showModal();
  };
  // Un clic sur le voile, hors de la feuille, la referme
  const voile = (e) => { if (e.target === feuille.current) feuille.current.close(); };

  return (
    <>
      <button type="button" className="bouton secondaire" onClick={ouvrir} aria-haspopup="dialog">
        Tous les relevés <span className="compte-bouton">{total}</span>
      </button>
      <dialog ref={feuille} className="feuille" aria-labelledby="titre-feuille" onClick={voile}>
        <div className="haut">
          <div>
            <p className="kicker">Index · {total} relevés</p>
            <h2 id="titre-feuille">Tous les relevés</h2>
          </div>
          <button type="button" className="bouton icone" onClick={() => feuille.current?.close()} aria-label="Fermer l’index">
            <Icone nom="croix" />
          </button>
        </div>
        <div className="segment" role="group" aria-label="Chercher">
          {ONGLETS.map((o) => (
            <button key={o.cle} type="button" aria-pressed={onglet === o.cle} onClick={() => setOnglet(o.cle)}>{o.libelle}</button>
          ))}
        </div>
        <nav className="corps-feuille liste" aria-label={ONGLETS.find((o) => o.cle === onglet).libelle}>
          {listes[onglet].map((l) => (
            <a key={l.cle} className="rangee" href={`/examen?${ONGLETS.find((o) => o.cle === onglet).parametre}=${encodeURIComponent(l.cle)}`}>
              <span className="titre">
                {l.libelle.charAt(0).toUpperCase() + l.libelle.slice(1)}
                <span className="sous-titre">{l.detail}</span>
              </span>
              <span />
              <span className="chevron"><Icone nom="chevron" /></span>
            </a>
          ))}
        </nav>
      </dialog>
    </>
  );
}
