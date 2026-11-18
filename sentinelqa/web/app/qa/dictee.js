'use client';

import { useEffect, useRef, useState } from 'react';
import { creerDictee } from '../../lib/qa-dictee.mjs';
import { nomModele } from '../../lib/qa-contrat.mjs';

const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function Dictee({ onTexte, onDebut, onOccupation, desactive, suite }) {
  const [etat, setEtat] = useState('repos');
  const [secondes, setSecondes] = useState(0);
  const [note, setNote] = useState(null);
  const [erreur, setErreur] = useState(null);
  const controle = useRef(null);
  const niveau = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onTexte, onDebut, onOccupation };

  useEffect(() => {
    let animation = null;
    let contexte = null;
    function niveauMicro(flux) {
      cancelAnimationFrame(animation);
      animation = null;
      contexte?.close().catch(() => {});
      contexte = null;
      if (niveau.current) niveau.current.style.transform = 'scaleX(0.04)';
      if (!flux || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      // La visualisation du volume est facultative : elle ne doit jamais casser la dictée.
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        contexte = new Audio();
        const analyseur = contexte.createAnalyser();
        analyseur.fftSize = 512;
        contexte.createMediaStreamSource(flux).connect(analyseur);
        const valeurs = new Uint8Array(analyseur.fftSize);
        const dessiner = () => {
          analyseur.getByteTimeDomainData(valeurs);
          const energie = valeurs.reduce((s, v) => s + ((v - 128) / 128) ** 2, 0);
          if (niveau.current) niveau.current.style.transform = `scaleX(${Math.min(1, 0.04 + Math.sqrt(energie / valeurs.length) * 3.2)})`;
          animation = requestAnimationFrame(dessiner);
        };
        animation = requestAnimationFrame(dessiner);
      } catch {
        contexte?.close().catch(() => {});
        contexte = null;
      }
    }
    const moteur = creerDictee({
      obtenirFlux: () => navigator.mediaDevices.getUserMedia({ audio: true }),
      creerEnregistreur: (flux) => {
        const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
          .find((t) => MediaRecorder.isTypeSupported?.(t));
        return new MediaRecorder(flux, type ? { mimeType: type } : undefined);
      },
      transcrire: async (audio, signal) => {
        const reponse = await fetch('/api/qa/transcription', {
          method: 'POST', headers: { 'Content-Type': audio.type }, body: audio, signal,
        });
        const corps = await reponse.json();
        if (!reponse.ok) throw new Error(corps.erreur ?? 'La transcription a échoué.');
        return corps;
      },
      surEtat: (e) => { setEtat(e); callbacks.current.onOccupation?.(e !== 'repos'); },
      surErreur: setErreur,
      surSecondes: setSecondes,
      surFlux: niveauMicro,
      surTranscription: (corps) => {
        callbacks.current.onTexte(corps.texte);
        const duree = Number.isFinite(corps.latence_s) ? `${String(corps.latence_s).replace('.', ',')} s` : 'un temps non mesuré';
        setNote(`Transcrit par ${nomModele(corps.modele)} en ${duree}. Relisez les noms d’écrans et les négations avant de préparer le plan.`);
      },
    });
    controle.current = moteur;
    return () => {
      moteur.disposer();
      controle.current = null;
      callbacks.current.onOccupation?.(false);
    };
  }, []);

  function commencer() {
    if (desactive || !controle.current || controle.current.etat !== 'repos') return;
    setNote(null);
    setErreur(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErreur('La dictée n’est pas disponible dans ce navigateur : tapez la consigne.');
      return;
    }
    callbacks.current.onDebut();
    void controle.current.commencer();
  }

  const occupe = etat !== 'repos';
  return (
    <div className="qa-dictee" aria-busy={occupe}>
      {etat === 'enregistrement' ? (
        <div className="qa-enregistrement">
          <p className="kicker">Enregistrement · {mmss(secondes)} · une minute au plus</p>
          <div className="qa-niveau" aria-hidden="true"><span ref={niveau} /></div>
          <div className="qa-ligne">
            <button type="button" className="bouton principal" onClick={() => controle.current?.arreter()}>Arrêter et transcrire</button>
            <button type="button" className="bouton secondaire" onClick={() => controle.current?.annuler()}>Annuler</button>
          </div>
        </div>
      ) : (
        <div className="qa-ligne">
          <button type="button" className="bouton secondaire" disabled={desactive || occupe} onClick={commencer}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
            </svg>
            {etat === 'permission' ? 'Autorisez le micro…' : etat === 'transcription' ? 'Transcription…' : 'Dicter la consigne'}
          </button>
          {occupe && <button type="button" className="bouton secondaire" onClick={() => controle.current?.annuler()}>Annuler</button>}
          {suite}
        </div>
      )}
      {occupe && <p className="qa-note" role="status">{etat === 'permission' ? 'En attente de l’autorisation du micro.'
        : etat === 'enregistrement' ? 'Le micro enregistre. Arrêtez pour transcrire, ou annulez la dictée.' : 'Transcription en cours. Le micro est fermé.'}</p>}
      {note && <p className="qa-note" role="status">{note}</p>}
      {erreur && <p className="erreur-audit" role="alert">{erreur}</p>}
    </div>
  );
}
