import { connection } from 'next/server';
import { listerMissions } from '../../lib/qa';
import { CATALOGUE_QA, STATUTS_QA } from '../../lib/qa-contrat.mjs';
import { dateCourte } from '../../lib/format';
import { Icone } from '../composants';
import Studio from './studio';
import './qa.css';

export const metadata = { title: 'Volet QA · HSentinel' };

const ETATS = { en_attente: 'En attente du worker', en_cours: 'En cours', echec: 'Interrompue' };

function bilan(m) {
  if (m.statut !== 'termine' || !m.resume) return ETATS[m.statut] ?? m.statut;
  const r = m.criteres ?? m.resume;
  return [r.passed && `${r.passed} ${r.passed > 1 ? 'conformes' : 'conforme'}`, r.failed && `${r.failed} ${r.failed > 1 ? 'écarts' : 'écart'}`,
    r.inconclusive && `${r.inconclusive} non concluant${r.inconclusive > 1 ? 's' : ''}`].filter(Boolean).join(' · ') || STATUTS_QA.skipped;
}

// Le volet QA : dire ce qu'il faut vérifier (au clavier ou à la voix), relire le plan, lancer l'agent H.
export default async function PageQa() {
  await connection();
  let missions = [];
  let indisponible = false;
  try { missions = await listerMissions(); } catch { indisponible = true; }
  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <header className="entete-page">
        <p className="kicker">Volet QA · test fonctionnel · consultation seule</p>
        <h1>Ce que l’agent doit vérifier.</h1>
        <p className="resume">
          Tapez ou dictez un parcours. Hugging Face le découpe en étapes et en critères, vous relisez, puis l’agent H le joue
          dans un vrai navigateur. Le code vérifie chaque critère sur ce que le navigateur a réellement affiché.
        </p>
      </header>
      <Studio />
      <section className="qa-historique" aria-label="Missions QA récentes">
        <h2 className="kicker">Missions récentes</h2>
        <div className="liste encadree carte">
          {indisponible && <p className="vide">La file des missions QA est injoignable : vérifiez la configuration Supabase du serveur.</p>}
          {!indisponible && !missions.length && <p className="vide">Aucune mission pour l’instant.</p>}
          {missions.map((m) => (
            <a key={m.id} className="rangee" href={`/qa/${m.id}`}>
              <span className="titre">
                {m.titre ?? m.demande?.plan?.titre ?? 'Exploration bornée du site'}
                <span className="sous-titre">
                  {dateCourte(m.cree_le)} · {CATALOGUE_QA.cibles.find((c) => c.id === m.demande?.target_id)?.nom ?? m.demande?.target_id}
                  {' · '}{m.demande?.appareil === 'mobile' ? 'mobile' : 'ordinateur'}{m.demande?.source === 'voix' ? ' · dictée' : ''}
                </span>
              </span>
              <span className="valeur">{bilan(m)}</span>
              <span className="chevron"><Icone nom="chevron" /></span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
