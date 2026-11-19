import { redirect } from 'next/navigation'

// D-49 : les cibles et leurs scénarios sont dans la page Applications de la console v0.
export default function Targets() {
  redirect('/app/applications')
}
