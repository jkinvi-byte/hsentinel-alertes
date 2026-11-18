import { redirect } from 'next/navigation';
import { utilisateurCourant } from '../lib/session';

export default async function Connexion({ searchParams }) {
  if (await utilisateurCourant()) redirect('/tableau-de-bord');
  const { erreur } = await searchParams;
  return (
    <div className="connexion carte">
      <h1>Connexion</h1>
      <p className="sous-titre">Accédez à l’espace paie de votre entreprise.</p>
      {erreur && <p className="erreur">E-mail ou mot de passe incorrect.</p>}
      <form action="/api/connexion" method="post">
        <label className="champ">
          <span>E-mail professionnel</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="champ">
          <span>Mot de passe</span>
          <input name="mot_de_passe" type="password" autoComplete="current-password" required />
        </label>
        <button type="submit" className="bouton">Se connecter</button>
      </form>
    </div>
  );
}
