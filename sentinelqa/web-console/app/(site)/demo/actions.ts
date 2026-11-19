'use server'

import { EMAIL, enregistrerDemande, lireFormulaire, TAILLES } from '@/lib/demandes'

export type DemoState = { status: 'idle' | 'success' | 'error'; message?: string; email?: string }

export async function requestDemo(_prev: DemoState, formData: FormData): Promise<DemoState> {
  const f = lireFormulaire(formData)
  if (!f.nom || !f.entreprise) return { status: 'error', message: 'Indiquez votre nom et votre entreprise.' }
  if (!EMAIL.test(f.email)) return { status: 'error', message: 'Adresse e-mail invalide.' }
  if (!TAILLES.has(f.taille)) return { status: 'error', message: 'Sélectionnez la taille de votre équipe.' }
  if (f.robot) return { status: 'success', email: f.email }

  // D-50 : la demande est vraiment enregistrée ; sinon, le formulaire le dit, au lieu d'afficher « Demande reçue ».
  try {
    await enregistrerDemande({ type: 'demo', nom: f.nom, email: f.email, entreprise: f.entreprise, taille: f.taille, message: f.message })
  } catch (erreur) {
    console.error('[demande-demo]', erreur instanceof Error ? erreur.message : erreur)
    return { status: 'error', message: 'Votre demande n’a pas pu être enregistrée. Réessayez dans un instant.' }
  }
  return { status: 'success', email: f.email }
}
