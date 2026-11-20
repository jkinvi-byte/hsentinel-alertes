import Link from 'next/link';
import { redirect } from 'next/navigation';
import { compteCourant } from '../../lib/session';

export const metadata = { title: 'Connexion · Ardoise' };

export default async function Connexion({ searchParams }) {
  if (await compteCourant()) redirect('/tableau-de-bord');
  const { erreur } = await searchParams;
  return (
    <main className="connexion">
      <form className="carte-connexion" action="/api/connexion" method="post">
        <Link href="/" className="marque"><span className="marque-carre" aria-hidden="true">A</span>Ardoise</Link>
        <h1>Connexion</h1>
        <p className="chapo">Retrouvez vos factures et vos relances.</p>
        {erreur ? <p className="erreur" role="alert">Adresse e-mail ou mot de passe incorrect.</p> : null}
        <label>Adresse e-mail<input name="email" type="email" autoComplete="username" required /></label>
        <label>Mot de passe<input name="mot_de_passe" type="password" autoComplete="current-password" required /></label>
        <button type="submit" className="bouton bouton-plein">Se connecter</button>
        <p className="note">Application fictive de démonstration (HSentinel).</p>
      </form>
    </main>
  );
}
