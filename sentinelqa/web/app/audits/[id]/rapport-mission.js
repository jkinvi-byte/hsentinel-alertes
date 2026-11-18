import { RESULTATS, VOLETS } from '../../../lib/missions';
import { dateCourte, dollars, secondes } from '../../../lib/format';
import { Icone } from '../../composants';

export default function RapportMission({ audit }) {
  const d = audit.mission;
  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <header className="entete-page">
        <p className="kicker">{VOLETS[audit.mode]} · {audit.application} · {dateCourte(audit.quand)}</p>
        <h1>{d.scenario_title}</h1>
        <p className="resume">{secondes(d.duration_s)} · H : {dollars(d.cost_h)} · Temps humain : {d.human_minutes == null ? 'non mesuré' : d.human_minutes + ' min'}</p>
      </header>
      {d.results.map((r) => (
        <article key={r.scenario_id} className="carte mission-resultat">
          <p className={'mission-status ' + r.status}>{RESULTATS[r.status] ?? r.status}</p>
          <dl>
            <dt>Attendu</dt><dd>{r.expected}</dd>
            <dt>Observé</dt><dd>{r.observed}</dd>
            <dt>Portée du résultat</dt><dd>{r.limitations}</dd>
          </dl>
          <details><summary>Détails du contrôle</summary><p className="mono">{r.scenario_id} · {r.reason_code}</p></details>
        </article>
      ))}
      <section aria-label="Preuves recueillies">
        <h2>Les preuves</h2>
        {d.evidence.map((p) => (
          <article key={p.id} className="carte mission-resultat">
            <h3>{p.kind === 'browser' ? 'Parcours dans le navigateur' : 'Réponse du serveur'}</h3>
            <p className="mission-cible">{p.url}</p>
            {p.kind === 'http' ? (
              <><p>{p.method} · HTTP {p.status_code}{p.location ? ' · redirection vers ' + p.location : ''}</p>
                <details><summary>Référence de la réponse</summary><p>{p.captured_at}</p><pre>{p.sha256}</pre><p>{p.bytes} octets ; le corps n’est pas stocké.</p></details></>
            ) : (
              <><p>{p.visible_title}</p><ol>{p.actions.map((a, i) => <li key={i}>{a}</li>)}</ol>
                {p.replay && <a className="bouton secondaire" href={p.replay} target="_blank" rel="noreferrer">Revoir la session H<Icone nom="sortie" /></a>}</>
            )}
          </article>
        ))}
        {!d.evidence.length && <p className="doux">Aucune preuve recueillie. Ce résultat n’est pas compté comme conforme.</p>}
      </section>
      <div className="actions"><a className="bouton principal" href="/audits/nouveau">Nouvelle mission<Icone nom="sortie" /></a></div>
    </main>
  );
}
