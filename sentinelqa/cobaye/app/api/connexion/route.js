import { UTILISATEURS } from '../../../lib/donnees';
import { jetonPour } from '../../../lib/session';

// Redirections relatives : l'application tourne derrière un tunnel, l'hôte public n'est pas localhost.
function rediriger(chemin, enTetes = {}) {
  return new Response(null, { status: 303, headers: { Location: chemin, ...enTetes } });
}

export async function POST(request) {
  const formulaire = await request.formData();
  const email = String(formulaire.get('email') ?? '').trim().toLowerCase();
  const motDePasse = String(formulaire.get('mot_de_passe') ?? '');
  const utilisateur = UTILISATEURS.find((u) => u.email === email && u.motDePasse === motDePasse);
  if (!utilisateur) return rediriger('/?erreur=1');
  return rediriger('/tableau-de-bord', {
    'Set-Cookie': `session=${jetonPour(utilisateur.id)}; Path=/; HttpOnly; SameSite=Lax`,
  });
}
