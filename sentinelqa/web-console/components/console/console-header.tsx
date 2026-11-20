import { TopBar } from './page-header'

// D-55 : le studio et le rapport de mission partagent la barre du haut de l'espace connecté (référence Lovable).
// La déconnexion vit dans le menu du compte, en bas de la barre latérale.
export function ConsoleHeader({ title }: { title: string; action?: boolean }) {
  return <TopBar crumbs={[{ label: 'Missions', href: '/app/audits' }, { label: title }]} />
}
