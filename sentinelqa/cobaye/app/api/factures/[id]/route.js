import { utilisateurCourant } from '../../../../lib/session';
import { FACTURES } from '../../../../lib/donnees';

// CONTRÔLE SAIN C2 (voir VERITE_TERRAIN.json) : l'enregistrement d'une facture vérifie
// le rôle d'administrateur et l'entreprise propriétaire. Un autre client reçoit une 404.
export async function POST(request, { params }) {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return Response.json({ erreur: 'Non connecté' }, { status: 401 });
  const { id } = await params;
  const facture = FACTURES.find((f) => f.id === id && f.entreprise === utilisateur.entreprise);
  if (!facture || utilisateur.acces !== 'admin') return Response.json({ erreur: 'Introuvable' }, { status: 404 });
  const formulaire = await request.formData();
  facture.note = String(formulaire.get('note') ?? '').slice(0, 500);
  return new Response(null, { status: 303, headers: { Location: `/factures/${facture.id}` } });
}
