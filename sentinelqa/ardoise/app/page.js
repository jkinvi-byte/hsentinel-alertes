import Link from 'next/link';

export default function Accueil() {
  return (
    <main className="accueil">
      <header className="accueil-haut">
        <span className="marque"><span className="marque-carre" aria-hidden="true">A</span>Ardoise</span>
        <Link href="/connexion" className="bouton bouton-trait">Se connecter</Link>
      </header>
      <section className="accueil-corps">
        <p className="surtitre">Facturation des artisans</p>
        <h1>Vos factures partent. Vos relances suivent. Vous, vous travaillez.</h1>
        <p className="chapo">Ardoise suit chaque facture jusqu’au paiement et prépare les relances à votre place.</p>
        <Link href="/connexion" className="bouton bouton-plein">Accéder à mon espace</Link>
      </section>
      <footer className="pied">Application fictive de démonstration, construite par l’équipe HSentinel. Toutes les données sont fictives.</footer>
    </main>
  );
}
