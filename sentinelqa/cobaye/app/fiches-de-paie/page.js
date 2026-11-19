import { exigerConnexion } from '../../lib/session';
import { lireFiches, salarie, euros } from '../../lib/donnees';

export default async function FichesDePaie() {
  const FICHES_DE_PAIE = await lireFiches();
  const utilisateur = await exigerConnexion();
  const admin = utilisateur.acces === 'admin';
  // Un administrateur voit les fiches de son entreprise ; un salarié, seulement les siennes.
  const fiches = FICHES_DE_PAIE.filter((f) => (admin ? f.entreprise === utilisateur.entreprise : f.salarie === utilisateur.salarie));
  return (
    <>
      <h1>{admin ? 'Fiches de paie' : 'Mes fiches de paie'}</h1>
      <p className="sous-titre">Octobre 2026</p>
      <div className="carte">
        <table>
          <thead>
            <tr><th>N°</th><th>Salarié</th><th>Mois</th><th>Net à payer</th></tr>
          </thead>
          <tbody>
            {fiches.map((f) => (
              <tr key={f.id}>
                <td><a href={`/fiches-de-paie/${f.id}`}>{f.id}</a></td>
                <td>{salarie(f.salarie).nom}</td>
                <td>{f.mois}</td>
                <td>{euros(f.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
