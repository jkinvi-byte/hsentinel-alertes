// Les pièces communes de la salle blanche : icônes au trait (un seul style), jauge de gravité, flèche des boutons.
// Aucun rond coloré (pastille, puce, halo) : décision d'Aurian du 17/11, voir MARQUE.md.
import { CRANS, GRAVITES } from '../lib/format';

const TRAIT = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function Icone({ nom }) {
  const chemins = {
    chevron: <path d="M9 6l6 6-6 6" />,
    retour: <path d="M15 6l-6 6 6 6" />,
    fleche: <path d="M5 12h14M13 6l6 6-6 6" />,
    sortie: <path d="M8 16L16 8M9 8h7v7" />,
    croix: <path d="M6 6l12 12M18 6L6 18" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...TRAIT}>{chemins[nom]}</svg>;
}

export function Gravite({ g }) {
  if (!g) return null;
  return (
    <span className="gravite" title={g.justification || undefined}>
      <span className="crans" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => <i key={i} className={i <= (CRANS[g.niveau] ?? 0) ? 'plein' : ''} />)}
      </span>
      {GRAVITES[g.niveau] ?? g.niveau}
    </span>
  );
}

// La flèche d'un bouton : elle glisse au survol.
export function Fleche({ nom = 'fleche' }) {
  return <span className="fleche"><Icone nom={nom} /></span>;
}
