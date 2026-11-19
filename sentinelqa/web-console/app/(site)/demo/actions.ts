'use server'

export type DemoState = { status: 'idle' | 'success' | 'error'; message?: string; email?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SIZES = new Set(['1-9', '10-50', '51-200', '200+'])

export async function requestDemo(_prev: DemoState, formData: FormData): Promise<DemoState> {
  const name = String(formData.get('name') ?? '').trim().slice(0, 120)
  const email = String(formData.get('email') ?? '').trim().toLowerCase().slice(0, 200)
  const company = String(formData.get('company') ?? '').trim().slice(0, 120)
  const size = String(formData.get('size') ?? '')
  const message = String(formData.get('message') ?? '').trim().slice(0, 2000)

  if (!name || !company) return { status: 'error', message: 'Indiquez votre nom et votre entreprise.' }
  if (!EMAIL.test(email)) return { status: 'error', message: 'Adresse e-mail invalide.' }
  if (!SIZES.has(size)) return { status: 'error', message: 'Sélectionnez la taille de votre équipe.' }

  // TODO: persist the lead (database or CRM) once a storage integration is connected.
  console.log('[demo-request]', { name, email, company, size, hasMessage: message.length > 0 })

  return { status: 'success', email }
}
