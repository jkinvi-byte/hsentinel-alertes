import './globals.css';
import { utilisateurCourant } from '../lib/session';
import { ENTREPRISES } from '../lib/donnees';

export const metadata = {
  title: 'Paie Express',
  description: 'Application cobaye de SentinelQA (données fictives).',
};

export default async function Layout({ children }) {
  const utilisateur = await utilisateurCourant();
  return (
    <html lang="fr">
      <body>
        <header className="entete">
          <a href={utilisateur ? '/tableau-de-bord' : '/'} className="marque">
            <span className="marque-pastille" aria-hidden="true" />
            Paie Express
          </a>
          {utilisateur && (
            <div className="compte">
              <span>
                {utilisateur.nom} · <strong>{ENTREPRISES[utilisateur.entreprise].nom}</strong>
              </span>
              <form action="/api/deconnexion" method="post">
                <button type="submit" className="bouton-discret">Se déconnecter</button>
              </form>
            </div>
          )}
        </header>
        <main className="contenu">{children}</main>
        <footer className="pied">Application de démonstration · données fictives</footer>
      </body>
    </html>
  );
}
