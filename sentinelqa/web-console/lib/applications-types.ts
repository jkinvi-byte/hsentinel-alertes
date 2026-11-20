// D-56 : une application ajoutée par le client et ses comptes de test, telles que la console les reçoit (jamais un secret).
export type CompteTest = {
  id: string
  application_id: string
  libelle: string
  identifiant: string
  identite: string[]
  cree_le: string
  utilise_le: string | null
}

export type ApplicationAjoutee = {
  id: string
  nom: string
  origine: string
  autorisee: boolean
  profil_qa: { entree: string; connexion?: { chemin: string } } | null
  attestee_le: string | null
  verification_jeton: string | null
  verification_methode: 'fichier' | 'balise' | null
  verifiee_le: string | null
  cree_le: string
  comptes: CompteTest[]
}
