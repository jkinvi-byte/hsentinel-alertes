import Link from 'next/link';
import { FACTURES, enRetardSelonLaListe, euros, jour, nomClient } from '../../../lib/donnees';

export const metadata = { title: 'Factures · Ardoise' };

const ONGLETS = [['toutes', 'Toutes'], ['attente', 'En attente'], ['retard', 'En retard'], ['payees', 'Payées']];

// La liste classe les factures avec sa propre règle de retard : voir le défaut D1 (lib/donnees.js, DEFAUTS.md).
const statut = (f) => (f.payee ? 'payees' : enRetardSelonLaListe(f) ? 'retard' : 'attente');
const LIBELLES = { payees: 'Payée', retard: 'En retard', attente: 'En attente' };

export default async function Factures({ searchParams }) {
  const { statut: choisi = 'toutes' } = await searchParams;
  const onglet = ONGLETS.some(([id]) => id === choisi) ? choisi : 'toutes';
  const retard = FACTURES.filter((f) => statut(f) === 'retard');
  const liste = onglet === 'toutes' ? FACTURES : FACTURES.filter((f) => statut(f) === onglet);
  return (
    <>
      <header className="entete">
        <p className="surtitre">Factures</p>
        <h1>{FACTURES.length} factures</h1>
        <p className="chapo">{retard.length} factures en retard · {euros(retard.reduce((s, f) => s + f.montant, 0))} à relancer.</p>
      </header>
      <nav className="onglets" aria-label="Filtrer les factures">
        {ONGLETS.map(([id, libelle]) => {
          const n = id === 'toutes' ? FACTURES.length : FACTURES.filter((f) => statut(f) === id).length;
          return <Link key={id} href={id === 'toutes' ? '/factures' : `/factures?statut=${id}`} aria-current={onglet === id ? 'page' : undefined}>{libelle} ({n})</Link>;
        })}
      </nav>
      <table>
        <thead><tr><th>Facture</th><th>Client</th><th>Émise le</th><th>Échéance</th><th>État</th><th className="nombre">Montant</th></tr></thead>
        <tbody>
          {liste.map((f) => (
            <tr key={f.numero}>
              <td>{f.numero}</td><td>{nomClient(f.client)}</td><td>{jour(f.emise)}</td><td>{jour(f.echeance)}</td>
              <td><span className="etat" data-etat={statut(f)}>{LIBELLES[statut(f)]}</span></td><td className="nombre">{euros(f.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
