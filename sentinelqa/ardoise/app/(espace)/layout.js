import Link from 'next/link';
import { exigerConnexion } from '../../lib/session';

const MENU = [
  ['/tableau-de-bord', 'Tableau de bord'],
  ['/factures', 'Factures'],
  ['/clients', 'Clients'],
  ['/relances', 'Relances'],
  // Défaut D3 : le centre d'aide a été déplacé, ce lien mène à une page introuvable.
  ['/centre-aide', 'Aide'],
];

export default async function Espace({ children }) {
  const compte = await exigerConnexion();
  return (
    <div className="espace">
      <aside className="menu">
        <Link href="/tableau-de-bord" className="marque"><span className="marque-carre" aria-hidden="true">A</span>Ardoise</Link>
        <nav aria-label="Menu principal">
          <ul>{MENU.map(([href, libelle]) => <li key={href}><Link href={href}>{libelle}</Link></li>)}</ul>
        </nav>
        <div className="menu-pied">
          <p className="qui"><strong>{compte.nom}</strong><span>{compte.role}</span></p>
          <form action="/api/deconnexion" method="post"><button type="submit" className="bouton-discret">Se déconnecter</button></form>
        </div>
      </aside>
      <main className="contenu">{children}</main>
    </div>
  );
}
