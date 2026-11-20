import Link from 'next/link';
import { exigerConnexion } from '../../../lib/session';
import { CLIENTS, FACTURES, enAttente, enRetard, euros, jour, nomClient } from '../../../lib/donnees';

export const metadata = { title: 'Tableau de bord · Ardoise' };

export default async function TableauDeBord() {
  const compte = await exigerConnexion();
  const retard = FACTURES.filter(enRetard);
  const attente = FACTURES.filter(enAttente);
  const encaisse = FACTURES.filter((f) => f.payee).reduce((s, f) => s + f.montant, 0);
  const somme = (liste) => euros(liste.reduce((s, f) => s + f.montant, 0));
  return (
    <>
      <header className="entete">
        <p className="surtitre">Vendredi 20 novembre 2026</p>
        <h1>Bonjour {compte.nom.split(' ')[0]}.</h1>
        <p className="chapo">Voici l’état de vos factures ce matin.</p>
      </header>
      <ul className="indicateurs">
        <li><span>Encaissé en novembre</span><strong>{euros(encaisse)}</strong></li>
        <li><span>En attente</span><strong>{somme(attente)}</strong><small>{attente.length} factures</small></li>
        <li data-ton="retard"><span>En retard</span><strong>{somme(retard)}</strong><small>{retard.length} factures en retard</small></li>
        <li><span>Clients actifs</span><strong>{CLIENTS.length}</strong></li>
      </ul>
      <section className="bloc">
        <div className="bloc-tete"><h2>Factures en retard</h2><Link href="/factures?statut=retard">Voir dans Factures</Link></div>
        <table>
          <thead><tr><th>Facture</th><th>Client</th><th>Échéance</th><th className="nombre">Montant</th></tr></thead>
          <tbody>{retard.map((f) => <tr key={f.numero}><td>{f.numero}</td><td>{nomClient(f.client)}</td><td>{jour(f.echeance)}</td><td className="nombre">{euros(f.montant)}</td></tr>)}</tbody>
        </table>
      </section>
    </>
  );
}
