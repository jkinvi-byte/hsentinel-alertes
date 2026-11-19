import { RESULTATS, VOLETS } from '../../../lib/missions';
import { dateCourte, dollars, secondes } from '../../../lib/format';
import { Icone } from '../../composants';

const CLASSIFICATIONS = {
  demonstrated_vulnerability: 'Faille démontrée par une assertion du code',
  configuration_weakness: 'Faiblesse de configuration',
  tool_candidate: 'Candidat d’outil, non confirmé',
  observation: 'Observation',
};

export default function RapportMission({ audit }) {
  const d = audit.mission;
  const preuves = d.evidence ?? [];
  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <header className="entete-page">
        <p className="kicker">{VOLETS[audit.mode]} · {audit.application} · {dateCourte(audit.quand)}</p>
        <h1>{d.scenario_title}</h1>
        <p className="resume">{secondes(d.duration_s)} · H : {dollars(d.cost_h)} · Temps humain : {d.human_minutes == null ? 'non mesuré' : d.human_minutes + ' min'}</p>
      </header>
      {d.security_findings && <section className="carte mission-resultat" aria-label="Bilan de sécurité">
        <h2>Bilan de sécurité</h2>
        <p>{d.security_findings.demonstrated_unique} faille(s) unique(s) démontrée(s) · {d.security_findings.configuration_weakness_assertions} assertion(s) de configuration en écart · {d.security_findings.tool_candidates} candidat(s) d’outil à confirmer.</p>
      </section>}
      {d.coverage && <section className="carte mission-resultat" aria-label="Couverture exécutée">
        <h2>Couverture réellement exécutée</h2>
        <p>{d.coverage.endpoints_discovered} ressource(s) · {d.coverage.active_operations_executed}/{d.coverage.active_operations_authorized} opération(s) active(s) · {d.coverage.forms_observed} formulaire(s) observé(s), {d.coverage.forms_submitted} soumis.</p>
        <p>{d.coverage.mutations} mutation · méthodes envoyées : {(d.coverage.methods_sent ?? []).join(', ') || 'aucune'}.</p>
        <p className="doux">{d.coverage.limitations}</p>
        {d.rules_executed?.length > 0 && <p>Règles exécutées : {d.rules_executed.join(', ')}</p>}
        {d.rules_skipped?.length > 0 && <details><summary>Règles non exécutées ou interrompues</summary><ul>{d.rules_skipped.map((r, i) => <li key={`${r.rule_id}-${i}`}>{r.rule_id} · {r.reason_code}</li>)}</ul></details>}
      </section>}
      {d.results.map((r, index) => (
        <article key={r.id ?? index} className="carte mission-resultat">
          <p className={'mission-status ' + r.status}>{RESULTATS[r.status] ?? r.status}</p>
          {r.title && <h2>{r.title}</h2>}
          {r.classification && <p className="doux">{CLASSIFICATIONS[r.classification] ?? r.classification}</p>}
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
        {preuves.map((p) => (
          <article key={p.id} className="carte mission-resultat">
            <h3>{p.kind === 'browser' ? 'Parcours dans le navigateur' : 'Réponse du serveur'}</h3>
            <p className="mission-cible">{p.url}</p>
            {p.kind === 'http' ? (
              <><p>{p.method} · HTTP {p.status_code}{p.location ? ' · redirection vers ' + p.location : ''}</p>
                <details><summary>Référence de la réponse</summary><p>{p.captured_at}</p><pre>{p.sha256}</pre><p>{p.bytes} octets ; le corps n’est pas stocké.</p></details></>
            ) : (
              <><p>{p.visible_title ?? p.assertion ?? 'Observation attribuée à la session indiquée.'}</p><ol>{(p.actions ?? []).map((a, i) => <li key={i}>{a}</li>)}</ol>
                {p.replay && <a className="bouton secondaire" href={p.replay} target="_blank" rel="noreferrer">Revoir la session H<Icone nom="sortie" /></a>}</>
            )}
          </article>
        ))}
        {!preuves.length && <p className="doux">Aucune preuve recueillie. Ce résultat n’est pas compté comme conforme.</p>}
      </section>
      <div className="actions"><a className="bouton principal" href="/audits/nouveau">Nouvelle mission<Icone nom="sortie" /></a></div>
    </main>
  );
}
