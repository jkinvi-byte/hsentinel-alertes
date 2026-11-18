'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TAILLES, libelleStatut, typo, urlCapture } from '../../../lib/qa-contrat.mjs';
import { dateCourte } from '../../../lib/format';
import { Icone } from '../../composants';

const ETAPES = ['Mission', 'Agent H', 'Parcours', 'Vérification', 'Rapport'];
const INTERVALLE_MS = 1500;
const LIBELLES = { etape: 'Étape', session: 'Agent H', action: 'Geste', page: 'Page vue', critere: 'Critère', info: 'Journal', erreur: 'Erreur' };

// Le suivi en direct d'une mission QA : chaque geste de l'agent et chaque page vue, au moment où H les enregistre.
// Le sondage s'arrête à la fin et se suspend quand l'onglet est caché (fable-fps).
export default function SuiviQa({ id, statutInitial, erreurInitiale, arretInitial, titre, instruction, contexte, appareil = 'ordinateur' }) {
  const router = useRouter();
  const [evenements, setEvenements] = useState([]);
  const [etat, setEtat] = useState({ statut: statutInitial, erreur: erreurInitiale });
  const [arret, setArret] = useState(arretInitial ? 'demande' : null);
  const dernier = useRef(0);
  const session = evenements.find((e) => e.type === 'session')?.donnees ?? null;
  const etapes = evenements.filter((e) => e.type === 'etape');
  const courante = etapes.length ? Number(etapes[etapes.length - 1].message[0]) : -1;
  const [largeur, hauteur] = TAILLES[appareil] ?? TAILLES.ordinateur;

  async function arreter() {
    setArret('envoi');
    try {
      const r = await fetch(`/api/qa/missions/${id}/arret`, { method: 'POST' });
      if (!r.ok) throw new Error();
      const corps = await r.json();
      setArret('demande');
      if (corps.termine) router.refresh();
    } catch {
      setArret('erreur');
    }
  }

  useEffect(() => {
    let minuteur;
    let actif = true;
    const sonder = async () => {
      if (!document.hidden) {
        try {
          const reponse = await fetch(`/api/qa/missions/${id}?apres=${dernier.current}`, { cache: 'no-store' });
          if (reponse.ok && actif) {
            const corps = await reponse.json();
            if (!actif) return;
            if (corps.evenements.length) {
              dernier.current = Math.max(dernier.current, corps.evenements[corps.evenements.length - 1].id);
              // Fusion par identifiant : deux sondages concurrents (double montage en développement, rechargement à chaud)
              // affichaient chaque événement trois fois (vu le 18/11 à 7 h 16).
              setEvenements((e) => {
                const vus = new Set(e.map((x) => x.id));
                return [...e, ...corps.evenements.filter((x) => !vus.has(x.id))];
              });
            }
            setEtat({ statut: corps.statut, erreur: corps.erreur });
            if (corps.statut === 'termine') { router.refresh(); return; }
            if (corps.statut === 'echec') return;
          }
        } catch {
          // réseau coupé : nouvel essai au prochain tour
        }
      }
      if (actif) minuteur = setTimeout(sonder, INTERVALLE_MS);
    };
    sonder();
    return () => { actif = false; clearTimeout(minuteur); };
  }, [id, router]);

  const enCours = ['en_attente', 'en_cours'].includes(etat.statut);
  return (
    <main className="page">
      <a className="retour" href="/qa"><Icone nom="retour" />Le volet QA</a>
      <header className="entete-page">
        <p className="kicker">Volet QA · {contexte}</p>
        <h1>{titre}</h1>
        <p className="resume">{instruction ? `« ${instruction} »` : 'Exploration bornée du menu principal, sans consigne.'}</p>
      </header>
      <ol className="etapes" aria-label="Avancement de la mission">
        {ETAPES.map((libelle, i) => (
          <li key={libelle} className={i < courante ? 'faite' : i === courante ? 'courante' : ''} aria-current={i === courante ? 'step' : undefined}>
            <span className="mono">{i}/4</span> {libelle}
          </li>
        ))}
      </ol>
      <div className="qa-suivi-actions">
        {enCours && (
          <button type="button" className="bouton" disabled={arret === 'envoi' || arret === 'demande'} onClick={arreter}>
            {arret === 'demande' ? 'Arrêt demandé…' : arret === 'envoi' ? 'Envoi…' : 'Arrêter la mission'}
          </button>
        )}
        {session?.replay && (
          <a className="lien-fleche" href={session.replay} target="_blank" rel="noreferrer">Ouvrir la session dans H<Icone nom="sortie" /></a>
        )}
      </div>
      {arret === 'erreur' && <p role="alert" className="erreur-audit">L’arrêt n’a pas pu être demandé. Réessayez.</p>}
      {etat.statut === 'en_attente' && (
        <p className="doux">En attente du worker QA, qui prend les missions une par une. S’il ne tourne pas : <code>python runner/qa_worker.py</code>.</p>
      )}
      {etat.statut === 'echec' && <p className="erreur-audit">{etat.erreur ?? 'La mission s’est interrompue sans message.'}</p>}

      <div className="fil-direct" aria-live="polite">
        {[...evenements].reverse().map((e) => {
          const d = e.donnees ?? {};
          return (
            <article key={e.id} className={`evenement type-${e.type}${d.status ? ` ${d.status}` : ''}`}>
              <p className="tete">
                <span>{LIBELLES[e.type] ?? e.type}</span>
                <time dateTime={e.quand}>{dateCourte(e.quand).split(' · ')[1]}</time>
              </p>
              <p className="message">{typo(e.type === 'critere' ? `${libelleStatut(d.status, d.reason_code)} · ${e.message}` : e.message)}</p>
              {e.type === 'action' && d.pensee && <p className="pensee">{typo(d.pensee)}</p>}
              {e.type === 'critere' && d.observe && <p className="statut-court">{typo(d.observe)}</p>}
              {e.type === 'page' && d.capture && session?.session && (
                <a className="qa-vignette" href={urlCapture(session.session, d.capture)} target="_blank" rel="noreferrer">
                  <img src={urlCapture(session.session, d.capture)} alt={`Capture : ${e.message}`} width={largeur} height={hauteur} loading="lazy" />
                </a>
              )}
            </article>
          );
        })}
      </div>
    </main>
  );
}
