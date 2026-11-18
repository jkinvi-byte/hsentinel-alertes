// Données fictives de démonstration : aucune personne ni entreprise réelle.

export const ENTREPRISES = {
  alpha: { id: 'alpha', nom: 'Alpha Conseil', convention: 'Syntec', cotisations: '42 %', compte: 'FR76 •••• •••• 0042' },
  beta: { id: 'beta', nom: 'Bêta Logistique', convention: 'Transports routiers', cotisations: '45 %', compte: 'FR76 •••• •••• 0077' },
};

// Comptes de test publics de l'application cobaye (pas des secrets).
// « acces » : un administrateur gère l'espace paie de son entreprise ; un salarié ne voit que ses fiches.
export const UTILISATEURS = [
  { id: 'u-alpha', email: 'claire@alpha-conseil.test', motDePasse: 'Alpha-Demo-2026', nom: 'Claire Martin', role: 'Responsable RH', acces: 'admin', entreprise: 'alpha' },
  { id: 'u-alpha-2', email: 'lea@alpha-conseil.test', motDePasse: 'Alpha-Salariee-2026', nom: 'Léa Fontaine', role: 'Consultante senior', acces: 'salarie', salarie: 's-101', entreprise: 'alpha' },
  { id: 'u-beta', email: 'hugo@beta-logistique.test', motDePasse: 'Beta-Demo-2026', nom: 'Hugo Bernard', role: 'Responsable RH', acces: 'admin', entreprise: 'beta' },
];

export const SALARIES = [
  { id: 's-101', entreprise: 'alpha', nom: 'Léa Fontaine', poste: 'Consultante senior' },
  { id: 's-102', entreprise: 'alpha', nom: 'Karim Haddad', poste: 'Chef de projet' },
  { id: 's-201', entreprise: 'beta', nom: 'Inès Morel', poste: 'Responsable d’entrepôt' },
  { id: 's-202', entreprise: 'beta', nom: 'Tom Lefèvre', poste: 'Chauffeur poids lourd' },
];

const DEPART = {
  fiches: [
    { id: '1041', entreprise: 'alpha', salarie: 's-101', mois: 'Octobre 2026', brut: 4850, net: 3790, commentaire: '' },
    { id: '1042', entreprise: 'alpha', salarie: 's-102', mois: 'Octobre 2026', brut: 5320, net: 4155, commentaire: '' },
    { id: '2051', entreprise: 'beta', salarie: 's-201', mois: 'Octobre 2026', brut: 3100, net: 2420, commentaire: '' },
    { id: '2052', entreprise: 'beta', salarie: 's-202', mois: 'Octobre 2026', brut: 2350, net: 1840, commentaire: '' },
  ],
  factures: [
    { id: 'FA-2026-031', entreprise: 'alpha', client: 'Groupe Horizon', montant: 18400, statut: 'Payée', note: '' },
    { id: 'FB-2026-077', entreprise: 'beta', client: 'Transports Delmas', montant: 9650, statut: 'En attente', note: '' },
  ],
};

// Les fiches et les factures se modifient : elles vivent sur globalThis, pour que les pages
// et les routes d'API, compilées séparément par Next, partagent les mêmes tableaux.
globalThis.__paieExpress ??= structuredClone(DEPART);
export const FICHES_DE_PAIE = globalThis.__paieExpress.fiches;
export const FACTURES = globalThis.__paieExpress.factures;

// Remet les données de démonstration dans leur état de départ, en gardant les mêmes tableaux.
export function reinitialiser() {
  FICHES_DE_PAIE.splice(0, FICHES_DE_PAIE.length, ...structuredClone(DEPART.fiches));
  FACTURES.splice(0, FACTURES.length, ...structuredClone(DEPART.factures));
}

export function salarie(id) {
  return SALARIES.find((s) => s.id === id);
}

export function euros(montant) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
}
