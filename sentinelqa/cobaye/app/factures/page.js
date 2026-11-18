import { exigerAdmin } from '../../lib/session';
import { FACTURES, euros } from '../../lib/donnees';

export default async function Factures() {
  const utilisateur = await exigerAdmin();
  const factures = FACTURES.filter((f) => f.entreprise === utilisateur.entreprise);
  return (
    <>
      <h1>Factures</h1>
      <p className="sous-titre">Factures clients émises</p>
      <div className="carte">
        <table>
          <thead>
            <tr><th>N°</th><th>Client</th><th>Montant</th><th>Statut</th></tr>
          </thead>
          <tbody>
            {factures.map((f) => (
              <tr key={f.id}>
                <td><a href={`/factures/${f.id}`}>{f.id}</a></td>
                <td>{f.client}</td>
                <td>{euros(f.montant)}</td>
                <td>{f.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
