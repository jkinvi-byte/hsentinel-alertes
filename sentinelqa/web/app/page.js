import { connection } from 'next/server';
import { lireAudits } from '../lib/audits';
import { GRAVITES, THEMES, alertes, cleJour, dateCourte, jour, pluriel } from '../lib/format';
import Salle from './salle';
import Defilement from './defilement';
import Releves from './releves';
import { Fleche } from './composants';
import MissionsAccueil from './missions-accueil';

const releve = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '.');

// Thème par thème : failles prouvées sur failles injectées quand la vérité terrain existe, sinon le compte des pages prouvées.
function parTheme(audit) {
  return Object.entries(THEMES).map(([cle, libelle]) => {
    const injectees = audit.verite.filter((v) => !v.controle && v.theme === cle);
    const prouvees = injectees.length
      ? injectees.filter((v) => v.detectee).length
      : audit.constats.filter((c) => c.statut === 'prouvee' && c.theme === cle).length;
    return { cle, libelle, prouvees, total: injectees.length };
  });
}

// L'accueil : la salle blanche. Au centre, le microscope de la Sentinelle ; à gauche, ce qu'il a vu au dernier relevé.
export default async function Accueil() {
  await connection(); // les audits changent : on les relit à chaque visite
  const termines = (await lireAudits()).filter((a) => a.score);
  const dernier = termines[0];
  if (dernier?.version === 2) return <MissionsAccueil audits={termines} />;

  if (!dernier) {
    return (
      <main className="salle">
        <Salle groupes={Object.entries(THEMES).map(([cle, libelle]) => ({ cle, libelle, prouvees: 0, total: 0 }))} />
        <section className="salle-texte">
          <p className="kicker">Relevé de la sentinelle · aucun pour l’instant</p>
          <h1 className="affiche">Rien n’a encore été relevé.</h1>
          <p className="phrase">Lancez une mission QA ou pentest sur un site autorisé, puis examinez les résultats et leurs preuves.</p>
          <div className="actions"><a className="bouton principal" href="/audits/nouveau">Lancer un audit<Fleche /></a></div>
        </section>
      </main>
    );
  }

  const groupes = parTheme(dernier);
  // Sous l'objectif : une ligne par faille, dite simplement, avec sa gravité
  const preuves = dernier.failles.map((f) => ({
    cle: f.id, chemin: f.titre, theme: GRAVITES[f.gravite?.niveau] ?? 'Non classée', scenario: f.canal,
    href: `/audits/${dernier.id}#${f.ancre}`,
  }));
  const fuite = (audits) => audits.some((a) => a.score.prouvees > 0);
  const dates = [...new Set(termines.map((a) => cleJour(a.quand)))].map((cle) => {
    const lot = termines.filter((a) => cleJour(a.quand) === cle);
    return { cle, libelle: jour(`${cle}T12:00:00`), detail: pluriel(lot.length, 'relevé', 'relevés'), fuite: fuite(lot) };
  });
  const themes = Object.entries(THEMES).map(([cle, libelle]) => {
    const pages = new Set(termines.flatMap((a) => a.constats.filter((c) => c.statut === 'prouvee' && c.theme === cle).map((c) => c.chemin)));
    return { cle, libelle, detail: pages.size ? pluriel(pages.size, 'page qui fuit', 'pages qui fuient') : 'aucune fuite', fuite: pages.size > 0 };
  });
  const applications = [...new Set(termines.map((a) => a.application))].map((nom) => {
    const lot = termines.filter((a) => a.application === nom);
    return { cle: nom, libelle: nom, detail: pluriel(lot.length, 'relevé', 'relevés'), fuite: fuite(lot) };
  });
  const fausses = dernier.score.fauxPositifs;

  return (
    <main className="salle">
      <Salle groupes={groupes} />
      <section className="salle-texte">
        <p className="kicker">
          Relevé de la sentinelle · <b>{releve(dernier.quand)} · {dateCourte(dernier.quand).split(' · ')[1]}</b> · {dernier.application}
        </p>
        <h1 className="affiche">
          {pluriel(dernier.score.prouvees, 'faille prouvée.', 'failles prouvées.')}
          <br />
          <span className="attenue">{fausses == null ? 'Chacune vue à l’écran.' : `${alertes(fausses).replace(/^./, (x) => x.toUpperCase())}.`}</span>
        </h1>
        <p className="phrase">Les agents ont parcouru la préproduction comme vos clients. Chaque fuite est prouvée deux fois : par le rejeu, puis à l’écran.</p>
        <div className="actions">
          <a className="bouton principal" href={`/audits/${dernier.id}`}>Examiner le relevé<Fleche /></a>
          <Releves dates={dates} themes={themes} applications={applications} total={termines.length} />
        </div>
        <div className="themes-repli">
          {groupes.map((g) => (
            <a key={g.cle} className="carte" href={`/examen?theme=${g.cle}`}>
              <span className="libelle">{g.libelle}</span>
              <span className="mesure">{g.total ? <>{g.prouvees}<span className="sur">/{g.total}</span></> : g.prouvees}</span>
            </a>
          ))}
        </div>
        {preuves.length > 0 && <Defilement preuves={preuves} />}
      </section>
    </main>
  );
}
