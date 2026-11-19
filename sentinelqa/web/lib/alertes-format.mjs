// Les alertes des failles prouvées, telles que la web les affiche : une ligne de la table constats (supabase/alertes.sql),
// son ticket GitHub et l'état de son alerte n8n (W3). Aucune donnée du site testé : un chemin, des catégories, des raisons.

export const DEPOT_ALERTES = 'jkinvi-byte/hsentinel-alertes';
export const COLONNES_ALERTES = 'id,cree_le,application_id,audit_id,audit_le,version,theme,methode,chemin,gravite,donnees,raisons,'
  + 'critere,similarite,confirme_ecran,alerte_statut,alerte_tentatives,github_issue_number,email_envoye,alerte_erreur';

const THEMES = { lecture: 'Lecture par une autre entreprise', ecriture: 'Modification par une autre entreprise',
  admin: 'Accès d’un salarié à une partie réservée', compte: 'Lecture par un autre compte', qa: 'Écart fonctionnel (QA)',
  http: 'Contrôle HTTP du scanner' };
const ETATS = { a_traiter: 'Alerte en attente', en_cours: 'Alerte en cours', traitee: 'Alerte envoyée', echec: 'Alerte en échec · reprise toutes les 15 min',
  // Un site tiers : le dépôt des tickets est public, le constat reste ici, réservé à l'équipe.
  reservee: 'Réservé à la console · site tiers, pas de ticket public' };
const ORDRE_GRAVITE = { critique: 0, 'élevée': 1, moyenne: 2, faible: 3 };

export function ligneAlerte(c) {
  return {
    id: c.id,
    quand: c.audit_le ?? c.cree_le,
    application: c.application_id,
    audit_id: c.audit_id ?? null,
    version: c.version ?? null,
    gravite: c.gravite,
    acces: `${c.methode} ${c.chemin}`,
    type: THEMES[c.theme] ?? c.theme,
    donnees: c.donnees ?? [],
    // Le critère d'un écart QA se lit en tête des raisons : la console l'affiche sans changer son composant.
    critere: c.critere ?? null,
    raisons: [...(c.critere ? [c.critere] : []), ...(c.raisons ?? [])],
    preuve: { similarite: c.similarite ?? null, confirme_ecran: Boolean(c.confirme_ecran) },
    alerte: {
      etat: c.alerte_statut,
      libelle: ETATS[c.alerte_statut] ?? c.alerte_statut,
      tentatives: c.alerte_tentatives ?? 0,
      email_envoye: c.email_envoye ?? null,
      erreur: c.alerte_erreur ?? null,
    },
    ticket: Number.isInteger(c.github_issue_number) && c.github_issue_number > 0
      ? { numero: c.github_issue_number, url: `https://github.com/${DEPOT_ALERTES}/issues/${c.github_issue_number}` }
      : null,
  };
}

// Le bilan en tête de page : combien de failles, de quelle gravité, combien d'alertes envoyées ou en échec.
export function bilanAlertes(alertes) {
  const parGravite = Object.fromEntries(Object.keys(ORDRE_GRAVITE).map((g) => [g, alertes.filter((a) => a.gravite === g).length]));
  return {
    total: alertes.length,
    par_gravite: parGravite,
    envoyees: alertes.filter((a) => a.alerte.etat === 'traitee').length,
    en_echec: alertes.filter((a) => a.alerte.etat === 'echec').length,
    tickets: new Set(alertes.filter((a) => a.ticket).map((a) => a.ticket.numero)).size,
  };
}
