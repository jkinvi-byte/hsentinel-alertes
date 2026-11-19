const cellule = (resultat, proprietaire) => {
  if (resultat?.status === 'failed') return 'leak'
  if (resultat?.status !== 'passed') return 'na'
  return proprietaire ? 'allowed' : 'blocked'
}

export function matriceAcces(rapport) {
  const acces = rapport?.access_matrix
  if (!acces?.enabled || !Array.isArray(acces.resources) || !acces.resources.length) return null
  const resultats = Array.isArray(rapport.results) ? rapport.results : []
  const roles = [acces.owner, 'anonymous', acces.other]
  return {
    corner: 'Ressource IDOR',
    actions: [`Propriétaire (${acces.owner})`, 'Anonyme', `Autre compte (${acces.other})`],
    rows: acces.resources.map(resource => ({
      role: resource.path,
      tenant: resource.source === 'inventory' ? 'route découverte' : 'profil',
      cells: roles.map(role => cellule(resultats.find(r => r.url === resource.path
        && r.actor_reference === role && r.control_id === 'idor_access'), role === acces.owner)),
    })),
  }
}
