// Les alertes des failles prouvées, côté serveur : la clé secrète lit la table constats, le navigateur ne la voit jamais.
import 'server-only';
import { requete } from './supabase';
import { COLONNES_ALERTES, bilanAlertes, ligneAlerte } from './alertes-format.mjs';

export { bilanAlertes, ligneAlerte };

// Les dernières failles prouvées, les plus récentes d'abord ; une application précise si on la donne.
export async function listerAlertes({ application = null, limite = 50 } = {}) {
  const filtre = application && /^[a-z0-9-]{1,40}$/.test(application) ? `&application_id=eq.${application}` : '';
  const nombre = Math.min(Math.max(Number.parseInt(limite, 10) || 50, 1), 200);
  const lignes = await requete(`constats?select=${COLONNES_ALERTES}${filtre}&order=cree_le.desc&limit=${nombre}`);
  return lignes.map(ligneAlerte);
}

// Les applications suivies et ce qu'on a le droit d'y faire (sans adresse e-mail).
export async function listerApplications() {
  return requete('applications?select=id,nom,origine,autorisee,autorisation,cible_qa,cible_pentest,scenario_pentest,pentest_actif,'
    + 'pentest_frequence_jours&order=id.asc');
}
