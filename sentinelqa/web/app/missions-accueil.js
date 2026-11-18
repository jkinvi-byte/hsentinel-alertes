import { RESULTATS, VOLETS } from '../lib/missions';
import { dateCourte, dollars } from '../lib/format';

export default function MissionsAccueil({ audits }) {
  const dernier = audits[0];
  return (
    <main className="page">
      <header className="entete-page">
        <p className="kicker">HSentinel · QA et pentest</p>
        <h1>Des parcours et des preuves.</h1>
        <p className="resume">Dernière mission : {VOLETS[dernier.mode]} · {dernier.application} · {RESULTATS[dernier.mission.results[0]?.status]}</p>
        <div className="actions"><a className="bouton principal" href="/audits/nouveau">Lancer une mission</a><a className="bouton secondaire" href={'/audits/' + dernier.id}>Voir le dernier rapport</a></div>
      </header>
      <h2>Les derniers relevés</h2>
      <nav className="liste encadree carte" aria-label="Relevés">
        {audits.map((a) => (
          <a key={a.id} className="rangee" href={'/audits/' + a.id}>
            <span className="titre">{a.application} · {dateCourte(a.quand)}
              <span className="sous-titre">{a.version === 2 ? VOLETS[a.mode] + ' · ' + RESULTATS[a.mission.results[0]?.status] : 'Banc interne · ' + a.score.prouvees + ' failles prouvées'}</span>
            </span><span className="valeur">{dollars(a.cout)}</span><span>→</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
