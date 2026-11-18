export type Alert = {
  id: string; quand: string; application: string; audit_id: string | null; version: string | null;
  gravite: string; acces: string; type: string; donnees: string[]; raisons: string[];
  preuve: { similarite: number | null; confirme_ecran: boolean };
  alerte: { etat: string; libelle: string; tentatives: number; email_envoye: boolean | null; erreur: string | null };
  ticket: { numero: number; url: string } | null;
}
export type AlertData = {
  application: string | null; limite: number; alertes: Alert[];
  bilan: { total: number; par_gravite: Record<string, number>; envoyees: number; en_echec: number; tickets: number };
  applications: { id: string; nom: string }[];
}
