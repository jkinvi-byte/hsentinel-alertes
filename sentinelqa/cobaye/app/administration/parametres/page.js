import { exigerAdmin } from '../../../lib/session';
import { ENTREPRISES } from '../../../lib/donnees';

// CONTRÔLE SAIN C3 (voir VERITE_TERRAIN.json) : les paramètres de paie vérifient le rôle d'administrateur.
export default async function Parametres() {
  const utilisateur = await exigerAdmin();
  const entreprise = ENTREPRISES[utilisateur.entreprise];
  return (
    <>
      <h1>Paramètres de paie</h1>
      <p className="sous-titre">{entreprise.nom}</p>
      <div className="carte">
        <p>Convention collective : <strong>{entreprise.convention}</strong></p>
        <p>Taux de cotisations patronales : <strong>{entreprise.cotisations}</strong></p>
        <p>Compte de versement des salaires : <strong>{entreprise.compte}</strong> (fictif)</p>
      </div>
    </>
  );
}
