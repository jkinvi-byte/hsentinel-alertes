import { FACTURES, RELANCES, euros, jour, nomClient } from '../../../lib/donnees';

export const metadata = { title: 'Relances · Ardoise' };

export default function Relances() {
  return (
    <>
      <header className="entete">
        <p className="surtitre">Relances</p>
        <h1>{RELANCES.length} relances programmées</h1>
        <p className="chapo">Ardoise les envoie à 9 h, le jour prévu. Vous pouvez les relire avant.</p>
      </header>
      <table>
        <thead><tr><th>Date</th><th>Facture</th><th>Client</th><th>Relance</th><th className="nombre">Montant</th></tr></thead>
        <tbody>
          {RELANCES.map((r) => {
            const f = FACTURES.find((x) => x.numero === r.facture);
            return <tr key={r.facture}><td>{jour(r.quand)}</td><td>{r.facture}</td><td>{nomClient(f.client)}</td><td>{r.canal}</td><td className="nombre">{euros(f.montant)}</td></tr>;
          })}
        </tbody>
      </table>
    </>
  );
}
