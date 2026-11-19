import { exigerConnexion } from '../../lib/session';
import { ENTREPRISES, lireFiches, UTILISATEURS, euros } from '../../lib/donnees';

// FAILLE INJECTÉE F5 (voir VERITE_TERRAIN.json) : la page vérifie la connexion, mais pas le rôle.
// Son lien n'apparaît qu'aux administrateurs ; un salarié qui connaît l'adresse y entre quand même.
export default async function Administration() {
  const FICHES_DE_PAIE = await lireFiches();
  const utilisateur = await exigerConnexion();
  const e = utilisateur.entreprise;
  const comptes = UTILISATEURS.filter((u) => u.entreprise === e);
  const masse = FICHES_DE_PAIE.filter((f) => f.entreprise === e).reduce((total, f) => total + f.brut, 0);
  return (
    <>
      <h1>Administration</h1>
      <p className="sous-titre">{ENTREPRISES[e].nom} · réservé aux administrateurs</p>
      <div className="carte">
        <h2>Comptes de l’espace paie</h2>
        <table>
          <thead>
            <tr><th>Nom</th><th>E-mail</th><th>Fonction</th><th>Accès</th></tr>
          </thead>
          <tbody>
            {comptes.map((u) => (
              <tr key={u.id}>
                <td>{u.nom}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.acces === 'admin' ? 'Administrateur' : 'Salarié'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="carte">
        <p>Masse salariale brute d’octobre</p>
        <p className="montant">{euros(masse)}</p>
        <p><a href="/administration/parametres">Paramètres de paie</a></p>
      </div>
    </>
  );
}
