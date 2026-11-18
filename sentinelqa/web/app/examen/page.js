import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { lireAudits } from '../../lib/audits';
import { THEMES, alertes, ancre, cleJour, dateCourte, dollars, jour, pluriel } from '../../lib/format';
import { Gravite, Icone } from '../composants';
import { RESULTATS, VOLETS } from '../../lib/missions';

export const metadata = { title: 'SentinelQA · Index des relevés' };

const capitale = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Une entrée de l'index : une date ou une application donnent la liste de leurs relevés ;
// un thème donne le registre de ses pages, une ligne par page, avec son dernier verdict.
export default async function Examen({ searchParams }) {
  await connection();
  const { date, application, theme, vue = 'prouvee' } = await searchParams;
  const termines = (await lireAudits()).filter((a) => a.score);

  if (date || application) {
    const audits = termines.filter((a) => (date ? cleJour(a.quand) === date : a.application === application));
    if (!audits.length) notFound();
    return (
      <main className="page">
        <a className="retour" href="/"><Icone nom="retour" />La salle</a>
        <header className="entete-page">
          <p className="kicker">Index · {date ? '01 · par date' : '03 · par application'}</p>
          <h1>{capitale(date ? jour(`${date}T12:00:00`) : application)}</h1>
          <p className="resume">{pluriel(audits.length, 'relevé', 'relevés')}. Choisissez celui à examiner.</p>
        </header>
        <nav className="liste encadree carte">
          {audits.map((a) => (
            <a key={a.id} className="rangee" href={`/audits/${a.id}`}>
              <span className="titre">
                {date ? dateCourte(a.quand).split(' · ')[1] : dateCourte(a.quand)} · {a.application}
                <span className="sous-titre">
                  {a.version === 2 ? `${VOLETS[a.mode]} · ${RESULTATS[a.mission.results[0]?.status]}` : <>
                    {a.score.total ? `${a.score.prouvees} sur ${a.score.total} failles prouvées` : pluriel(a.score.prouvees, 'faille prouvée', 'failles prouvées')}
                    {' · '}{alertes(a.score.fauxPositifs)}
                  </>}
                </span>
              </span>
              <span className="valeur">{dollars(a.cout)}</span>
              <span className="chevron"><Icone nom="chevron" /></span>
            </a>
          ))}
        </nav>
      </main>
    );
  }

  if (!THEMES[theme]) notFound();
  // Le registre du thème : chaque page n'apparaît qu'une fois, avec le nombre de relevés où elle a fui.
  const registre = new Map();
  for (const a of termines) {
    for (const c of a.constats.filter((x) => x.theme === theme && x.statut === vue)) {
      const ligne = registre.get(c.chemin) ?? { chemin: c.chemin, audits: 0, dernier: null };
      ligne.audits += 1;
      ligne.dernier ??= { audit: a.id, quand: a.quand, gravite: c.gravite };
      registre.set(c.chemin, ligne);
    }
  }
  const lignes = [...registre.values()].sort((x, y) => y.audits - x.audits);
  const vues = { prouvee: 'Pages qui fuient', protegee: 'Pages protégées' };
  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <header className="entete-page">
        <p className="kicker">Index · 02 · par thème</p>
        <h1>{THEMES[theme]}</h1>
        <p className="resume">Chaque page n’apparaît qu’une fois, avec le nombre de relevés où elle a été testée ainsi.</p>
      </header>
      <nav className="segment" aria-label="Résultat">
        {Object.entries(vues).map(([cle, libelle]) => (
          <a key={cle} href={`/examen?theme=${theme}&vue=${cle}`} aria-current={vue === cle ? 'true' : undefined}>{libelle}</a>
        ))}
      </nav>
      <nav className="liste encadree carte">
        {lignes.map((l) => (
          <a key={l.chemin} className="rangee" href={`/audits/${l.dernier.audit}?faille=${ancre(theme, l.chemin)}#${ancre(theme, l.chemin)}`}>
            <span className="titre mono">
              {l.chemin}
              <span className="sous-titre">
                {vue === 'prouvee' ? 'Prouvée' : 'Protégée'} dans {pluriel(l.audits, 'relevé', 'relevés')} · dernier le {dateCourte(l.dernier.quand)}
              </span>
            </span>
            <span className="valeur">{vue === 'prouvee' && <Gravite g={l.dernier.gravite} />}</span>
            <span className="chevron"><Icone nom="chevron" /></span>
          </a>
        ))}
        {lignes.length === 0 && <p className="vide">{vue === 'prouvee' ? 'Aucune page n’a fui dans ce thème.' : 'Aucune page protégée relevée dans ce thème.'}</p>}
      </nav>
    </main>
  );
}
