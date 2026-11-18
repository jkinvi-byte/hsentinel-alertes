'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES, dateCourte } from '../../../lib/format';
import { Icone } from '../../composants';
import Salle from '../../salle';

const ETAPES = ['Agents et coffres', 'Cartographie', 'Rejeux', 'Preuves', 'Rapport'];
const INTERVALLE_MS = 2000;

// Le suivi en direct d'un audit : le fil écrit par le runner, sondé toutes les deux secondes.
// Le sondage s'arrête à la fin de l'audit et se suspend quand l'onglet est caché (fable-fps).
export default function Suivi({ id, application, statutInitial, erreurInitiale, version, mode }) {
  const router = useRouter();
  const [evenements, setEvenements] = useState([]);
  const [etat, setEtat] = useState({ statut: statutInitial, erreur: erreurInitiale });
  const [arretDemande, setArretDemande] = useState(false);
  const [erreurArret, setErreurArret] = useState(null);
  const dernier = useRef(0);
  const libelles = version === 2 ? ['Périmètre', mode === 'security' ? 'Contrôle HTTP' : 'Préparation', 'Parcours H', 'Vérification', 'Rapport'] : ETAPES;

  async function arreter() {
    setArretDemande(true);
    setErreurArret(null);
    try {
      const r = await fetch(`/api/audits/${id}/arret`, { method: 'POST' });
      if (!r.ok) throw new Error('L’arrêt n’a pas pu être demandé. Réessayez.');
    } catch (e) { setErreurArret(e.message); setArretDemande(false); }
  }

  useEffect(() => {
    let minuteur;
    let actif = true;
    const sonder = async () => {
      if (!document.hidden) {
        try {
          const reponse = await fetch(`/api/audits/${id}/evenements?apres=${dernier.current}`, { cache: 'no-store' });
          if (reponse.ok) {
            const { statut, evenements: nouveaux } = await reponse.json();
            if (nouveaux.length) {
              dernier.current = nouveaux[nouveaux.length - 1].id;
              setEvenements((e) => [...e, ...nouveaux]);
            }
            setEtat(statut);
            if (statut.statut === 'termine') {
              router.refresh(); // la page serveur affiche alors le rapport complet
              return;
            }
            if (statut.statut === 'echec') return;
          }
        } catch {
          // réseau coupé : on réessaie au prochain tour
        }
      }
      if (actif) minuteur = setTimeout(sonder, INTERVALLE_MS);
    };
    sonder();
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [id, router]);

  // Le microscope de la salle, en direct : chaque preuve qui arrive fait éclore sa marque sur la lame
  const groupes = Object.entries(THEMES).map(([cle, libelle]) => ({
    cle, libelle, total: 0,
    prouvees: evenements.filter((e) => e.type === 'preuve' && e.donnees?.prouvee && e.donnees?.theme === cle).length,
  }));
  const etapes = evenements.filter((e) => e.type === 'etape');
  const courante = etapes.length ? Number(etapes[etapes.length - 1].message[0]) : -1;

  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <section className="suivi-haut">
        <div className="entete-page">
          <p className="kicker">
            {etat.statut === 'echec' ? 'Relevé interrompu' : 'Relevé en cours'} · <b>{application}</b>
          </p>
          <h1>{etat.statut === 'echec' ? 'L’audit s’est interrompu.' : etat.statut === 'en_attente' ? 'En attente du runner.' : 'Les agents sont au travail.'}</h1>
          <p className="resume">
            {etat.statut === 'echec' ? 'L’exécution n’a pas abouti.' : version === 2 ? 'Le résultat distingue les critères vérifiés des contrôles non concluants.' : 'Chaque preuve éclôt sur la lame dès qu’elle arrive.'}
          </p>
        </div>
        {version !== 2 && <div className="scene-suivi"><Salle groupes={groupes} cadrage="suivi" /></div>}
      </section>
      <ol className="etapes" aria-label="Avancement de l’audit">
        {libelles.map((libelle, i) => (
          <li key={libelle} className={i < courante ? 'faite' : i === courante ? 'courante' : ''} aria-current={i === courante ? 'step' : undefined}>
            <span className="mono">{i}/4</span> {libelle}
          </li>
        ))}
      </ol>

      {etat.statut === 'en_attente' && <p className="doux">Le runner prend la demande en quelques secondes. Il doit être lancé en mode surveillance.</p>}
      {etat.statut === 'echec' && <p className="erreur-audit">{etat.erreur ?? 'Erreur non enregistrée.'}</p>}
      {version === 2 && ['en_attente', 'en_cours'].includes(etat.statut) && (
        <button type="button" className="bouton secondaire" disabled={arretDemande} onClick={arreter}>
          {arretDemande ? 'Arrêt demandé…' : 'Arrêter la mission'}
        </button>
      )}
      {erreurArret && <p role="alert" className="erreur-audit">{erreurArret}</p>}

      <div className="fil-direct" aria-live="polite">
        {[...evenements].reverse().map((e) => <Evenement key={e.id} e={e} />)}
      </div>
    </main>
  );
}

function Evenement({ e }) {
  const d = e.donnees ?? {};
  const theme = d.theme ? { '--theme': `var(--${d.theme})` } : undefined;
  return (
    <article className={`evenement type-${e.type}${e.type === 'preuve' ? (d.prouvee ? ' prouvee' : ' non-confirmee') : ''}`} style={theme}>
      <p className="tete">
        <span>
          {LIBELLES[e.type] ?? e.type}
          {d.theme && <span className={`theme-${d.theme}`}> · {THEMES[d.theme]}</span>}
        </span>
        <time dateTime={e.quand}>{dateCourte(e.quand).split(' · ')[1]}</time>
      </p>
      <p className="message">{e.message.replace(/^▶\s*/, '').replace(/ · en direct : \S+$/, '')}</p>
      {d.replay && (
        <p className="lien">
          <a className="lien-fleche" href={d.replay} target="_blank" rel="noreferrer">
            {e.type === 'session' ? 'Voir l’agent en direct' : 'Revoir la preuve'}<Icone nom="sortie" />
          </a>
        </p>
      )}
    </article>
  );
}

const LIBELLES = { etape: 'Étape', session: 'Agent H', rejeu: 'Rejeu', preuve: 'Preuve', resultat: 'Résultat', info: 'Journal' };
