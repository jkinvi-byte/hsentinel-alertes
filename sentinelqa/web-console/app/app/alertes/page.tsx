import { redirect } from 'next/navigation'

// D-49 : les alertes vivent dans les Diagnostics de la console v0 (une faille, son ticket GitHub et son e-mail).
export default function AlertsPage() {
  redirect('/app/diagnostic')
}
