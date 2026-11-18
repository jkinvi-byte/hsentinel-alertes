import { memeOrigine } from '../../../../../../lib/acces-operateur';
import { demanderArret } from '../../../../../../lib/qa';

export async function POST(request, { params }) {
  if (!memeOrigine(request)) return Response.json({ erreur: 'Origine refusée.' }, { status: 403 });
  const { id } = await params;
  const resultat = await demanderArret(id);
  if (!resultat) return Response.json({ erreur: 'Mission introuvable.' }, { status: 404 });
  return Response.json(resultat, { status: resultat.termine ? 200 : 202 });
}
