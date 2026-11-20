// Ardoise : données fictives, arrêtées au 20 novembre 2026. Aucune personne ni entreprise réelle.
// Les défauts plantés sont documentés dans DEFAUTS.md : ils servent de vérité terrain au QA HSentinel.

export const AUJOURDHUI = new Date('2026-11-20T12:00:00+01:00');

export const CLIENTS = [
  { id: 'c01', nom: 'Atelier Verrier', ville: 'Lille', depuis: '2024-03-12' },
  { id: 'c02', nom: 'Boulangerie Lemoine', ville: 'Lyon', depuis: '2023-09-04' },
  { id: 'c03', nom: 'Cordonnerie Petit', ville: 'Dijon', depuis: '2025-01-20' },
  { id: 'c04', nom: 'Électricité Moreau', ville: 'Nice', depuis: '2024-06-02' },
  { id: 'c05', nom: 'Fleurs de Mai', ville: 'Rennes', depuis: '2025-05-15' },
  { id: 'c06', nom: 'Garage des Tilleuls', ville: 'Nantes', depuis: '2023-11-27' },
  // Défaut D2 : la ville n'a pas été saisie à l'import, et la page Clients l'affiche telle quelle.
  { id: 'c07', nom: 'Imprimerie Faure', depuis: '2026-11-18' },
  { id: 'c08', nom: 'Menuiserie Roux', ville: 'Bordeaux', depuis: '2024-02-08' },
  { id: 'c09', nom: 'Plomberie Caron', ville: 'Toulouse', depuis: '2025-07-01' },
  { id: 'c10', nom: 'Pressing du Centre', ville: 'Angers', depuis: '2025-10-13' },
  { id: 'c11', nom: 'Serrurerie Blanc', ville: 'Metz', depuis: '2024-12-03' },
  { id: 'c12', nom: 'Traiteur Garnier', ville: 'Tours', depuis: '2025-03-30' },
];

// Montants en euros. Une facture payée n'a plus d'échéance à surveiller.
export const FACTURES = [
  { numero: 'F-2026-0141', client: 'c02', montant: 1980, emise: '2026-11-19', echeance: '2026-12-21', payee: false },
  { numero: 'F-2026-0140', client: 'c06', montant: 2450, emise: '2026-11-17', echeance: '2026-12-22', payee: false },
  { numero: 'F-2026-0139', client: 'c01', montant: 1120, emise: '2026-11-14', echeance: '2026-11-28', payee: false },
  { numero: 'F-2026-0138', client: 'c08', montant: 2760, emise: '2026-11-12', echeance: '2026-11-26', payee: true },
  { numero: 'F-2026-0137', client: 'c09', montant: 890, emise: '2026-11-10', echeance: '2026-11-24', payee: true },
  { numero: 'F-2026-0136', client: 'c05', montant: 1610, emise: '2026-11-09', echeance: '2026-11-30', payee: false },
  { numero: 'F-2026-0135', client: 'c04', montant: 3240, emise: '2026-11-06', echeance: '2026-11-20', payee: true },
  { numero: 'F-2026-0134', client: 'c03', montant: 640, emise: '2026-11-05', echeance: '2026-11-25', payee: false },
  { numero: 'F-2026-0133', client: 'c10', montant: 1070, emise: '2026-11-04', echeance: '2026-11-24', payee: false },
  { numero: 'F-2026-0132', client: 'c02', montant: 4300, emise: '2026-11-03', echeance: '2026-11-17', payee: true },
  { numero: 'F-2026-0131', client: 'c12', montant: 1530, emise: '2026-10-26', echeance: '2026-11-09', payee: false },
  { numero: 'F-2026-0130', client: 'c06', montant: 5050, emise: '2026-10-22', echeance: '2026-11-05', payee: true },
  { numero: 'F-2026-0128', client: 'c11', montant: 1340, emise: '2026-10-19', echeance: '2026-11-02', payee: false },
  { numero: 'F-2026-0119', client: 'c07', montant: 1340, emise: '2026-10-14', echeance: '2026-10-28', payee: false },
];

export const RELANCES = [
  { facture: 'F-2026-0119', quand: '2026-11-21', canal: 'E-mail, 2e relance' },
  { facture: 'F-2026-0128', quand: '2026-11-23', canal: 'E-mail, 1re relance' },
  { facture: 'F-2026-0131', quand: '2026-11-24', canal: 'E-mail, 1re relance' },
  { facture: 'F-2026-0133', quand: '2026-11-25', canal: 'Rappel avant échéance' },
];

export const nomClient = (id) => CLIENTS.find((c) => c.id === id)?.nom ?? '—';
export const euros = (n) => `${new Intl.NumberFormat('fr-FR').format(n)} €`;
export const jour = (iso) => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' }).format(new Date(iso));

// Le tableau de bord compte juste : une facture est en retard si son échéance (une vraie date) est passée.
export const enRetard = (f) => !f.payee && new Date(`${f.echeance}T23:59:59+01:00`) < AUJOURDHUI;
export const enAttente = (f) => !f.payee && !enRetard(f);

// Défaut D1 : la page Factures compare les échéances comme des textes « jj/mm/aaaa ». « 28/10/2026 » passe après
// « 20/11/2026 » dans l'ordre alphabétique : la facture la plus ancienne disparaît des retards.
export const enRetardSelonLaListe = (f) => !f.payee && jour(f.echeance) < jour(AUJOURDHUI.toISOString());
