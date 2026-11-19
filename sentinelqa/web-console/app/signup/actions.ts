'use server'

import { EMAIL, enregistrerDemande, lireFormulaire } from '@/lib/demandes'

export type AccessState = { status: 'idle' | 'success' | 'error'; message?: string; email?: string }

// D-50 : « Créer un compte » devient une demande d'accès. Aucun mot de passe n'est demandé : il n'existe pas encore
// de compte client, l'équipe ouvre chaque accès à la main, avec l'autorisation écrite de tester l'application.
export async function requestAccess(_prev: AccessState, formData: FormData): Promise<AccessState> {
  const f = lireFormulaire(formData)
  if (!f.nom || !f.entreprise) return { status: 'error', message: 'Indiquez votre nom et votre entreprise.' }
  if (!EMAIL.test(f.email)) return { status: 'error', message: 'Adresse e-mail invalide.' }
  if (f.robot) return { status: 'success', email: f.email }
  try {
    await enregistrerDemande({ type: 'acces', nom: f.nom, email: f.email, entreprise: f.entreprise, message: f.message })
  } catch (erreur) {
    console.error('[demande-acces]', erreur instanceof Error ? erreur.message : erreur)
    return { status: 'error', message: 'Votre demande n’a pas pu être enregistrée. Réessayez dans un instant.' }
  }
  return { status: 'success', email: f.email }
}
