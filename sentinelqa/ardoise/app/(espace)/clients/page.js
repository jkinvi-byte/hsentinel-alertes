import { CLIENTS, FACTURES, euros, jour } from '../../../lib/donnees';

export const metadata = { title: 'Clients · Ardoise' };

export default function Clients() {
  const dernier = [...CLIENTS].sort((a, b) => b.depuis.localeCompare(a.depuis))[0];
  return (
    <>
      <header className="entete">
        <p className="surtitre">Clients</p>
        <h1>{CLIENTS.length} clients actifs</h1>
        {/* Défaut D2 : la ville manquante s'affiche « undefined » (gabarit de texte sans valeur par défaut). */}
        <p className="chapo">{`Dernier client ajouté : ${dernier.nom}, ${dernier.ville}, le ${jour(dernier.depuis)}.`}</p>
      </header>
      <table>
        <thead><tr><th>Client</th><th>Ville</th><th>Client depuis</th><th className="nombre">Factures</th><th className="nombre">Chiffre d’affaires</th></tr></thead>
        <tbody>
          {CLIENTS.map((c) => {
            const siennes = FACTURES.filter((f) => f.client === c.id);
            return (
              <tr key={c.id}>
                <td>{c.nom}</td><td>{`${c.ville}`}</td><td>{jour(c.depuis)}</td>
                <td className="nombre">{siennes.length}</td><td className="nombre">{euros(siennes.reduce((s, f) => s + f.montant, 0))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
