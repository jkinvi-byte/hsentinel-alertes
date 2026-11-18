import { exigerAdmin } from '../../lib/session';
import { ENTREPRISES, SALARIES } from '../../lib/donnees';

// FAILLE INJECTÉE F3 (voir VERITE_TERRAIN.json) : la liste fait confiance au paramètre
// « entreprise » de l'URL au lieu d'utiliser l'entreprise de l'utilisateur connecté.
// Le rôle, lui, est bien vérifié (contrôle sain C4) : un salarié reçoit une page 404.
export default async function Salaries({ searchParams }) {
  const utilisateur = await exigerAdmin();
  const { entreprise = utilisateur.entreprise } = await searchParams;
  const nom = ENTREPRISES[entreprise]?.nom ?? 'Entreprise inconnue';
  const salaries = SALARIES.filter((s) => s.entreprise === entreprise);
  return (
    <>
      <h1>Salariés</h1>
      <p className="sous-titre">{nom}</p>
      <div className="carte">
        <table>
          <thead>
            <tr><th>Nom</th><th>Poste</th></tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s.id}><td>{s.nom}</td><td>{s.poste}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
