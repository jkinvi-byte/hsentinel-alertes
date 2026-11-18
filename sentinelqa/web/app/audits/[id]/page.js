import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { lireAudit } from '../../../lib/audits';
import {
  GRAVITES, ORDRE_GRAVITE, PREUVE_SIMPLE, SCENARIOS, SCENARIOS_SIMPLES, THEMES, alertes, ancre, dateCourte, dollars,
  nombre, pluriel, secondes,
} from '../../../lib/format';
import { Gravite, Icone } from '../../composants';
import Suivi from './suivi';
import RapportMission from './rapport-mission';

export async function generateMetadata({ params }) {
  const audit = await lireAudit((await params).id);
  return { title: audit ? `SentinelQA · Relevé du ${dateCourte(audit.quand)}` : 'SentinelQA · Relevé introuvable' };
}

const ratio = (x) => (x == null ? '—' : `${Math.round(x * 100)} %`);
const SECTIONS_HF = { ecritures: ['Écritures à tenter', 'ecriture'], pages_admin: ['Pages d’admin à viser', 'admin'], lectures: ['Lectures à tenter', 'lecture'] };
const CLASSE = { critique: 'critique', 'élevée': 'elevee', moyenne: 'moyenne', faible: 'faible' };
const duree = (s) => (s == null ? 'une durée non mesurée' : s < 60 ? `${Math.round(s)} s` : `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`);
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);

function Entete({ numero, intitule, compte }) {
  return (
    <summary>
      <span className="numero">{numero}</span>
      <span className="intitule">{intitule}</span>
      <span className="compte">{compte}</span>
      <span className="signe" aria-hidden="true" />
    </summary>
  );
}

// Une faille, pour quelqu'un qui n'est pas technicien : qui peut faire quoi, pourquoi c'est grave,
// ce que notre agent a vu, comment c'est prouvé. Les adresses techniques restent repliées.
function CarteFaille({ f }) {
  const niveau = f.gravite?.niveau;
  return (
    <article className={`carte carte-faille niveau-${CLASSE[niveau] ?? 'aucun'}`} id={f.ancre}>
      <div className="faille-tete">
        <Gravite g={f.gravite} />
        <span className="kicker">{f.canal}</span>
      </div>
      <h3 className="faille-titre">{f.titre}.</h3>
      {f.gravite?.raisons?.length > 0 && (
        <p className="faille-pourquoi">
          <span className="kicker">Pourquoi {GRAVITES[niveau]?.toLowerCase()}</span>
          {f.gravite.raisons.map(majuscule).join(' · ')}.
        </p>
      )}
      {f.vu && (
        <figure className="faille-vu">
          <figcaption className="kicker">Ce que notre agent a vu à l’écran</figcaption>
          <blockquote>{f.vu}</blockquote>
        </figure>
      )}
      <div className="faille-pied">
        <p className="faille-preuve">{PREUVE_SIMPLE[f.theme]}</p>
        {f.replay && (
          <a className="bouton secondaire" href={f.replay} target="_blank" rel="noreferrer">Revoir la preuve<span className="fleche"><Icone nom="sortie" /></span></a>
        )}
      </div>
      <details className="faille-details">
        <summary>Détails techniques · {pluriel(f.pages.length, 'adresse', 'adresses')}{f.verite ? ` · ${f.verite.id}` : ''}</summary>
        <ul>
          {f.pages.map((p) => (
            <li key={p.id} id={ancre(p.theme, p.chemin)}>
              <code>{p.chemin}</code>
              <span className="doux">compte {p.compte}{p.gravite?.donnees?.length ? ` · ${p.gravite.donnees.join(', ')}` : ''}</span>
              {p.replay && <a className="lien-fleche" href={p.replay} target="_blank" rel="noreferrer">Replay<Icone nom="sortie" /></a>}
            </li>
          ))}
        </ul>
        {f.verite?.description && <p className="doux">{f.verite.description}</p>}
      </details>
    </article>
  );
}

// Le relevé détaillé d'un audit : le verdict en clair, une carte par faille, puis l'annexe technique repliée.
export default async function Audit({ params }) {
  await connection();
  const { id } = await params;
  const audit = await lireAudit(id);
  if (!audit) notFound();
  if (audit.version === 2 && audit.mission.phase === 'completed') return <RapportMission audit={audit} />;
  if (!audit.score) {
    return <Suivi id={audit.id} application={audit.application} statutInitial={audit.statut} erreurInitiale={audit.erreur} version={audit.version} mode={audit.mode} />;
  }
  const prouvees = audit.constats.filter((c) => c.statut === 'prouvee');
  const h = audit.hypotheses?.propositions ? audit.hypotheses : null;
  const testes = Object.keys(THEMES).filter((t) => audit.constats.some((c) => c.theme === t));
  const reussis = Object.keys(THEMES).filter((t) => audit.failles.some((f) => f.theme === t));
  const compte = Object.fromEntries(ORDRE_GRAVITE.map((n) => [n, audit.failles.filter((f) => f.gravite?.niveau === n).length]));
  const classees = ORDRE_GRAVITE.reduce((s, n) => s + compte[n], 0);

  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <header className="entete-page">
        <p className="kicker">Relevé de la sentinelle · <b>{dateCourte(audit.quand)}</b> · {audit.application}</p>
        <h1>{pluriel(audit.score.prouvees, 'faille prouvée', 'failles prouvées')}</h1>
        <p className="resume">
          Nos agents ont essayé {pluriel(testes.length, 'façon', 'façons')} d’accéder à des données interdites ;{' '}
          {reussis.length === testes.length ? (testes.length > 1 ? 'toutes ont réussi' : 'elle a réussi') : `${reussis.length} ont réussi`}.
          {' '}{audit.score.total ? `${audit.score.prouvees} failles sur les ${audit.score.total} cachées dans l’application, ` : ''}
          {alertes(audit.score.fauxPositifs)}, en {duree(audit.duree)} pour {dollars(audit.cout)}.
        </p>
      </header>

      {classees > 0 && (
        <section className="bilan carte" aria-label="Gravité des failles prouvées">
          <div className="bilan-barre" aria-hidden="true">
            {ORDRE_GRAVITE.map((n) => (compte[n] ? <span key={n} className={`niveau-${CLASSE[n]}`} style={{ flexGrow: compte[n] }} /> : null))}
          </div>
          <ul className="bilan-legende">
            {ORDRE_GRAVITE.map((n) => (
              <li key={n} className={compte[n] ? '' : 'doux'}>
                <b>{compte[n]}</b> {GRAVITES[n].toLowerCase()}{compte[n] > 1 ? 's' : ''}
              </li>
            ))}
          </ul>
          <p className="bilan-regle">Chaque gravité suit une règle écrite : qui accède (une autre entreprise ou un salarié), pour lire ou modifier, et quelles données (salaires, identité, droits).</p>
        </section>
      )}

      <section className="resultats" aria-label="Les failles prouvées">
        {Object.keys(THEMES).filter((t) => audit.failles.some((f) => f.theme === t)).map((t) => (
          <div key={t} className="scenario">
            <h2 className="titre-scenario"><span className="kicker">{THEMES[t]} · {SCENARIOS[t]}</span>{SCENARIOS_SIMPLES[t]}</h2>
            {audit.failles.filter((f) => f.theme === t).map((f) => <CarteFaille key={f.id} f={f} />)}
          </div>
        ))}
        {audit.failles.length === 0 && <p className="vide">Aucune faille prouvée dans ce relevé.</p>}
      </section>

      <p className="kicker annexe-titre">Pour l’équipe technique</p>
      <div className="sections carte">
        <details className="section">
          <Entete numero="01" intitule="Les adresses prouvées" compte={pluriel(prouvees.length, 'preuve', 'preuves')} />
          <div className="contenu tableau">
            <table>
              <thead><tr><th>Adresse</th><th>Thème</th><th>Compte</th><th>Gravité</th><th></th></tr></thead>
              <tbody>
                {prouvees.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.chemin}</td>
                    <td>{THEMES[c.theme]}</td>
                    <td>{c.compte}</td>
                    <td><Gravite g={c.gravite} /></td>
                    <td>{c.replay && <a className="lien-fleche" href={c.replay} target="_blank" rel="noreferrer">Replay<Icone nom="sortie" /></a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <details className="section">
          <Entete numero="02" intitule="La vérité terrain" compte={`${audit.verite.length} contrôles`} />
          <div className="contenu tableau">
            <table>
              <thead><tr><th>Id</th><th>Thème</th><th>Ce qui est testé</th><th>Résultat</th></tr></thead>
              <tbody>
                {audit.verite.map((v) => (
                  <tr key={v.id}>
                    <td className="mono">{v.id}</td>
                    <td>{THEMES[v.theme]}</td>
                    <td>{v.controle ? `Contrôle sain : ${v.description}` : v.type}</td>
                    <td className={v.controle ? (v.faux_positif ? 'ko' : 'ok') : v.detectee ? 'ko' : 'doux'}>
                      {v.controle ? (v.faux_positif ? 'Faux positif' : v.teste ? 'Non signalé' : 'Non testé') : v.detectee ? 'Prouvée' : 'Manquée'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {h && (
          <details className="section">
            <Entete numero="03" intitule="Hugging Face, hors du verdict" compte={h.modele.split('/')[1]} />
            <div className="contenu">
              <p className="doux" style={{ margin: 0 }}>
                Attaques proposées en {Math.round(h.latence_s)} s, avant les rejeux
                {audit.coutHf != null && ` ; ${dollars(audit.coutHf)}`}. La gravité ne vient pas du LLM : elle suit la règle écrite.
              </p>
              {Object.entries(SECTIONS_HF).map(([cle, [titre, theme]]) => {
                const r = h.recoupement?.[theme];
                return (
                  <div key={cle} className="hf-bloc">
                    <h3>{titre}{r && <span className="doux"> · justes {ratio(r.precision)} · failles vues venir {ratio(r.rappel)}</span>}</h3>
                    <ul className="propositions">
                      {h.propositions[cle].map((p) => <li key={p.chemin}><code>{p.chemin}</code> <span className="doux">{p.raison}</span></li>)}
                      {h.propositions[cle].length === 0 && <li className="doux">Aucune proposition.</li>}
                    </ul>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        <details className="section">
          <Entete numero={h ? '04' : '03'} intitule="Les sessions des agents H" compte={`${audit.interventions.length} sessions`} />
          <div className="contenu tableau">
            <table>
              <thead><tr><th>Agent</th><th>Compte</th><th>Tâche</th><th>Steps</th><th>Coût</th><th>Durée</th><th></th></tr></thead>
              <tbody>
                {audit.interventions.map((i) => (
                  <tr key={i.id}>
                    <td>{i.agent}</td>
                    <td>{i.compte}</td>
                    <td className="mono">{i.tache}</td>
                    <td className="mono">{i.steps ?? '—'}</td>
                    <td className="mono">{dollars(i.cout)}</td>
                    <td className="mono">{secondes(i.duree)}</td>
                    <td>{i.replay && <a className="lien-fleche" href={i.replay} target="_blank" rel="noreferrer">Replay<Icone nom="sortie" /></a>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="doux" style={{ margin: '12px 0 0', fontSize: 13 }}>{nombre(audit.tokens)} tokens au total.</p>
          </div>
        </details>
      </div>
    </main>
  );
}
