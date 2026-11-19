import 'server-only'
import { requete as requeteJs } from '../../web/lib/supabase.js'

// D-50 : les demandes d'accès et de démo du site, enregistrées dans Supabase (table demandes_acces,
// sentinelqa/supabase/acces.sql). n8n (W5) les relève et prévient l'équipe par un seul e-mail récapitulatif.
// Il n'existe pas encore de compte client : l'équipe ouvre chaque accès à la main.

const requete = requeteJs as (chemin: string, options?: { methode?: string; corps?: unknown; prefer?: string }) => Promise<unknown>

export type Demande = {
  type: 'acces' | 'demo'
  nom: string
  email: string
  entreprise: string
  taille?: string | null
  message?: string | null
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const TAILLES = new Set(['1-9', '10-50', '51-200', '200+'])

/** Les champs d'un formulaire public, bornés comme la table les borne. Le champ « site » est un piège à robots, invisible des humains. */
export function lireFormulaire(formData: FormData) {
  const champ = (nom: string, max: number) => String(formData.get(nom) ?? '').trim().slice(0, max)
  return {
    nom: champ('name', 120),
    email: champ('email', 200).toLowerCase(),
    entreprise: champ('company', 120),
    taille: champ('size', 10),
    message: champ('message', 2000),
    robot: champ('site', 200) !== '',
  }
}

/** Enregistre la demande ; lève une erreur si la base ne l'a pas acceptée (le formulaire le dit alors, sans faux succès). */
export async function enregistrerDemande(demande: Demande) {
  await requete('demandes_acces?select=id', {
    methode: 'POST',
    prefer: 'return=representation',
    corps: { ...demande, taille: demande.taille || null, message: demande.message || null },
  })
}
