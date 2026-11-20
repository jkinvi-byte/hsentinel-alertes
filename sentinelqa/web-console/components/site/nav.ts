export type NavItem = {
  label: string
  href: string
  children?: { label: string; href: string; description: string }[]
}

export const NAV: NavItem[] = [
  {
    label: 'Plateforme',
    href: '/plateforme',
    children: [
      { label: 'Agent QA', href: '/plateforme#qa', description: 'Chaque rôle obtient ce qu’il doit obtenir.' },
      { label: 'Agent Pentest', href: '/plateforme#pentest', description: 'Aucun client ne voit les données d’un autre.' },
      { label: 'Preuves et rapports', href: '/plateforme#preuves', description: 'Requête rejouée, capture, sévérité stable.' },
      { label: 'Intégrations', href: '/plateforme#integrations', description: 'CI, webhook, GitHub Action, alertes.' },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'SaaS RH et paie', href: '/solutions#rh', description: 'Bulletins, salaires, données sociales.' },
      { label: 'Santé', href: '/solutions#sante', description: 'Dossiers patients et données sensibles.' },
      { label: 'Conformité B2B', href: '/solutions#conformite', description: 'Preuves pour vos questionnaires sécurité.' },
    ],
  },
  { label: 'Sécurité', href: '/securite' },
  { label: 'Tarifs', href: '/tarifs' },
]
