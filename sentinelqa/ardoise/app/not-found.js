import Link from 'next/link';

export default function Introuvable() {
  return (
    <main className="introuvable">
      <p className="surtitre">Erreur 404</p>
      <h1>Page introuvable</h1>
      <p className="chapo">Cette page n’existe pas, ou plus.</p>
      <Link href="/tableau-de-bord" className="bouton bouton-trait">Retour au tableau de bord</Link>
    </main>
  );
}
