import { CATALOGUE_QA, TAILLES, TYPES_CRITERES, VERIFICATIONS, bilanCriteres, libelleStatut, nomModele, typo, urlCapture } from '../../../lib/qa-contrat.mjs';
import { dateCourte, dollars, nombre, secondes } from '../../../lib/format';
import { Fleche, Icone } from '../../composants';

const TYPES_AUTO = { auto: 'Contrôle automatique', texte_anormal: 'Contrôle automatique', page_visitee: 'Page ouverte', probleme: 'Problème signalé',
  lien: 'Lien vérifié', liens: 'Liens vérifiés', difficulte: 'Gestes de l’agent' };
const STATUTS_AGENT = { conforme: 'conforme', ecart: 'écart', non_verifie: 'non vérifié' };
const INTERRUPTIONS = { cancelled: 'arrêtée à la demande de l’opérateur', budget_exceeded: 'arrêtée par son budget de durée',
  agent_blocked: 'arrêtée : l’agent attendait une action humaine', execution_error: 'interrompue par une erreur d’exécution' };
const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

function Preuves({ resultat, captures, http, appareil }) {
  const [largeur, hauteur] = TAILLES[appareil] ?? TAILLES.ordinateur;
  const images = resultat.preuves.map((id) => captures[id]).filter(Boolean);
  const reponses = resultat.preuves.map((id) => http[id]).filter(Boolean);
  if (!images.length && !reponses.length) return null;
  return (
    <div className={`qa-preuves${appareil === 'mobile' ? ' portrait' : ''}`}>
      {images.map((p) => (
        <figure key={p.id}>
          <a href={urlCapture(p.session, p.image)} target="_blank" rel="noreferrer">
            <img className="qa-capture" src={urlCapture(p.session, p.image)} alt={`Ce que le navigateur affichait sur ${p.url}`}
              width={largeur} height={hauteur} loading="lazy" />
          </a>
          <figcaption>Capture de l’agent · {new URL(p.url).pathname} · {dateCourte(p.quand).split(' · ')[1]}</figcaption>
        </figure>
      ))}
      {reponses.map((p) => (
        <p key={p.id} className="qa-http">
          GET {new URL(p.url).pathname} · HTTP {p.status_code} · {nombre(p.bytes)} octets{p.h1?.length ? ` · titre « ${p.h1[0]} »` : ''}
          <br />empreinte {p.sha256.slice(0, 16)}… · relue le {dateCourte(p.captured_at)}
        </p>
      ))}
    </div>
  );
}

// Le rapport d'une mission QA : d'abord le bilan, puis chaque critère avec ses preuves, puis les annexes.
export default function RapportQa({ mission }) {
  const r = mission.rapport;
  const d = r.request;
  const s = r.sessions[0] ?? null;
  const cible = CATALOGUE_QA.cibles.find((c) => c.id === d.target_id);
  const captures = Object.fromEntries(r.evidence.filter((p) => p.kind === 'capture').map((p) => [p.id, p]));
  const http = Object.fromEntries(r.evidence.filter((p) => p.kind === 'http').map((p) => [p.id, p]));
  const tokens = s?.tokens ? s.tokens.entree + s.tokens.sortie : null;
  const prep = r.preparation ?? d.plan?.preparation;
  const pages = (r.visites ?? []).filter((v) => captures[v.capture]);
  const principaux = r.results.filter((x) => x.type !== 'auto');
  const automatiques = r.results.filter((x) => x.type === 'auto');
  const bilan = bilanCriteres(r);
  const signales = principaux.filter((x) => x.reason_code === 'agent_reported_gap').length;
  const mesures = [
    `${secondes(r.duration_s)} au total`,
    s ? `${pluriel(s.steps ?? 0, 'action', 'actions')} de l’agent` : null,
    `H ${dollars(r.cost_h)}`,
    tokens ? `${nombre(tokens)} tokens` : null,
    prep?.latence_s != null ? `plan Hugging Face ${String(prep.latence_s).replace('.', ',')} s` : null,
    `préparation humaine ${d.preparation_humaine_s == null ? 'non mesurée' : `${d.preparation_humaine_s} s`}`,
  ].filter(Boolean);

  return (
    <main className="page">
      <a className="retour" href="/qa"><Icone nom="retour" />Le volet QA</a>
      <header className="entete-page">
        <p className="kicker">
          Volet QA · {cible?.nom ?? d.target_id} · {d.appareil === 'mobile' ? 'mobile' : 'ordinateur'} · {dateCourte(r.started_at)}
        </p>
        <h1>{typo(r.titre)}</h1>
        <p className="resume">
          {d.instruction ? `« ${d.instruction} »` : 'Exploration bornée du menu principal, sans consigne.'}
          {d.source === 'voix' ? ' · consigne dictée' : ''}
        </p>
      </header>

      <section className="carte qa-bilan" aria-label="Bilan de la mission">
        <ul>
          <li><b>{bilan.passed}</b>{bilan.passed > 1 ? 'conformes' : 'conforme'}</li>
          <li className={bilan.failed ? 'ecart' : ''}><b>{bilan.failed}</b>{bilan.failed > 1 ? 'écarts constatés' : 'écart constaté'}</li>
          <li><b>{bilan.inconclusive}</b>non concluant{bilan.inconclusive > 1 ? 's' : ''}{signales ? `, dont ${signales} écart${signales > 1 ? 's' : ''} signalé${signales > 1 ? 's' : ''} par l’agent` : ''}</li>
          {bilan.skipped > 0 && <li><b>{bilan.skipped}</b>non exécuté{bilan.skipped > 1 ? 's' : ''}</li>}
        </ul>
        <p className="qa-mesures">{mesures.join(' · ')}</p>
        <p className="qa-note">
          Conforme ou écart : seulement avec une preuve relevée par le code. Tout le reste est non concluant, même quand l’agent a un avis.
        </p>
      </section>

      {r.interruption && (
        <div className="qa-alerte"><p className="kicker">Mission incomplète</p>
          <p>La mission a été {INTERRUPTIONS[r.interruption] ?? `interrompue (${r.interruption})`}. Les preuves déjà recueillies sont conservées.</p></div>
      )}
      {r.lectures_directes?.length > 0 && (
        <div className="qa-alerte"><p className="kicker">Lectures hors interface</p>
          <p>L’agent a lu {pluriel(r.lectures_directes.length, 'page', 'pages')} par requête directe, sans passer par le navigateur. Elles ne comptent
            pas comme pages atteintes : {r.lectures_directes.map((u) => { try { return new URL(u).pathname; } catch { return u; } }).join(', ')}.</p></div>
      )}
      {(r.violations?.length > 0 || r.hors_origine?.length > 0) && (
        <div className="qa-alerte"><p className="kicker">Écart à la consigne de l’agent</p>
          <ul>
            {r.violations.map((v) => <li key={v}>{v}</li>)}
            {r.hors_origine.map((u) => <li key={u}>Page hors du site autorisé : {u}</li>)}
          </ul></div>
      )}

      <section className="qa-resultats" aria-label="Les critères">
        {principaux.map((x) => (
          <article key={x.id} className={`carte qa-critere ${x.status}${x.reason_code === 'agent_reported_gap' ? ' signale' : ''}`}>
            <div className="qa-critere-tete">
              <span className={`qa-statut ${x.status}`}>{libelleStatut(x.status, x.reason_code)}</span>
              <span className="kicker">
                {x.id} · {TYPES_CRITERES[x.type] ?? TYPES_AUTO[x.type] ?? x.type}{x.verification ? ` · ${VERIFICATIONS[x.verification]}` : ''}
              </span>
            </div>
            <h3>{typo(x.description)}</h3>
            <dl>
              {x.attendu && <><dt>Attendu</dt><dd>{x.type === 'texte' ? `« ${x.attendu} »` : x.attendu}</dd></>}
              <dt>Observé</dt><dd>{typo(x.observe)}</dd>
              {x.agent && (
                <><dt>L’agent</dt>
                  <dd>
                    {STATUTS_AGENT[x.agent.statut] ?? x.agent.statut} · {typo(x.agent.constat)}
                    {x.agent.citation && <blockquote>« {x.agent.citation} »</blockquote>}
                  </dd></>
              )}
            </dl>
            <Preuves resultat={x} captures={captures} http={http} appareil={d.appareil} />
          </article>
        ))}
        {automatiques.length > 0 && (
          <article className="carte qa-auto">
            <p className="kicker">Contrôles automatiques · vérifiés par le code</p>
            <p className="qa-auto-titre">
              {automatiques.every((x) => x.status === 'passed')
                ? `Les ${automatiques.length} pages visitées répondent sans erreur.`
                : `${automatiques.filter((x) => x.status === 'failed').length} page(s) visitée(s) en erreur.`}
            </p>
            <ul>
              {automatiques.map((x) => (
                <li key={x.id} className={x.status === 'failed' ? 'ko' : ''}>
                  <span className="mono">{x.chemin}</span><span>{typo(x.observe)}</span>
                </li>
              ))}
            </ul>
          </article>
        )}
      </section>

      <div className="carte sections qa-annexes">
        <details className="section">
          <summary><span className="numero">01</span><span className="intitule">Les gestes de l’agent</span>
            <span className="compte">{r.parcours.length}</span><span className="signe" aria-hidden="true" /></summary>
          <div className="contenu">
            <ol className="qa-gestes">
              {r.parcours.map((g) => <li key={g.n}>{typo(g.geste)}{g.pensee && <small>{typo(g.pensee)}</small>}</li>)}
            </ol>
            {r.agent?.raison && <p className="qa-note">L’agent conclut : {r.agent.raison}</p>}
          </div>
        </details>
        {pages.length > 0 && (
          <details className="section">
            <summary><span className="numero">02</span><span className="intitule">Les pages vues</span>
              <span className="compte">{pages.length}</span><span className="signe" aria-hidden="true" /></summary>
            <div className="contenu">
              <div className={`qa-galerie${d.appareil === 'mobile' ? ' portrait' : ''}`}>
                {pages.map((v) => {
                  const p = captures[v.capture];
                  const [largeur, hauteur] = TAILLES[d.appareil] ?? TAILLES.ordinateur;
                  return (
                    <figure key={v.chemin}>
                      <a href={urlCapture(p.session, p.image)} target="_blank" rel="noreferrer">
                        <img className="qa-capture" src={urlCapture(p.session, p.image)} alt={`Capture de ${v.chemin}`} width={largeur} height={hauteur} loading="lazy" />
                      </a>
                      <figcaption>{v.chemin} · {v.mode === 'depart' ? 'page de départ' : v.mode === 'adresse' ? 'adresse tapée' : v.geste}</figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          </details>
        )}
        {s && (
          <details className="section">
            <summary><span className="numero">03</span><span className="intitule">La session H</span>
              <span className="compte">{s.statut}</span><span className="signe" aria-hidden="true" /></summary>
            <div className="contenu">
              <div className="tableau"><table><tbody>
                <tr><th>Agent</th><td className="mono">{s.agent} · {s.modele}</td></tr>
                <tr><th>Session</th><td className="mono">{s.session}</td></tr>
                <tr><th>Durée</th><td>{secondes(s.duree_s)} · {pluriel(s.steps ?? 0, 'action', 'actions')}</td></tr>
                <tr><th>Tokens</th><td>{s.tokens ? `${nombre(s.tokens.entree)} en entrée, dont ${nombre(s.tokens.cache)} en cache · ${nombre(s.tokens.sortie)} en sortie` : 'non mesurés'}</td></tr>
                <tr><th>Coût</th><td>{dollars(s.cout_dollars)}</td></tr>
                {prep && <tr><th>Plan</th><td>{nomModele(prep.modele)} via Hugging Face · {String(prep.latence_s).replace('.', ',')} s · {prep.tokens ?? '?'} tokens</td></tr>}
              </tbody></table></div>
              {s.replay && <p><a className="lien-fleche" href={s.replay} target="_blank" rel="noreferrer">Ouvrir la session dans H<Icone nom="sortie" /></a></p>}
            </div>
          </details>
        )}
      </div>
      <div className="actions-page"><a className="bouton principal" href="/qa">Nouvelle mission<Fleche /></a></div>
    </main>
  );
}
