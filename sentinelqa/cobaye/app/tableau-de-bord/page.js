import { exigerConnexion } from '../../lib/session';
import { ENTREPRISES, lireFiches, lireFactures, SALARIES } from '../../lib/donnees';

export default async function TableauDeBord() {
  const FICHES_DE_PAIE = await lireFiches();
  const FACTURES = await lireFactures();
  const utilisateur = await exigerConnexion();
  const e = utilisateur.entreprise;
  const prenom = utilisateur.nom.split(' ')[0];

  if (utilisateur.acces !== 'admin') {
    const miennes = FICHES_DE_PAIE.filter((f) => f.salarie === utilisateur.salarie);
    return (
      <>
        <h1>Bonjour {prenom}</h1>
        <p className="sous-titre">Votre espace salarié chez {ENTREPRISES[e].nom}</p>
        <div className="grille">
          <a className="tuile" href="/fiches-de-paie">
            <strong>Mes fiches de paie</strong>
            <span>{miennes.length} fiche(s)</span>
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Bonjour {prenom}</h1>
      <p className="sous-titre">Espace paie de {ENTREPRISES[e].nom}</p>
      <div className="grille">
        <a className="tuile" href="/fiches-de-paie">
          <strong>Fiches de paie</strong>
          <span>{FICHES_DE_PAIE.filter((f) => f.entreprise === e).length} fiches ce mois-ci</span>
        </a>
        <a className="tuile" href="/factures">
          <strong>Factures</strong>
          <span>{FACTURES.filter((f) => f.entreprise === e).length} facture(s)</span>
        </a>
        <a className="tuile" href={`/salaries?entreprise=${e}`}>
          <strong>Salariés</strong>
          <span>{SALARIES.filter((s) => s.entreprise === e).length} salariés</span>
        </a>
        <a className="tuile" href="/administration">
          <strong>Administration</strong>
          <span>Comptes et paramètres de paie</span>
        </a>
      </div>
    </>
  );
}
