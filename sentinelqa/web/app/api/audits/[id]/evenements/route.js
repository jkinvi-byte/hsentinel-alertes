import { lireEvenements, lireStatut } from '../../../../../lib/audits';

// Le fil d'un audit pour le suivi en direct : son statut, et les événements après « apres ».
export async function GET(request, { params }) {
  const { id } = await params;
  const statut = await lireStatut(id);
  if (!statut) return Response.json({ erreur: 'Audit introuvable' }, { status: 404 });
  const evenements = await lireEvenements(id, new URL(request.url).searchParams.get('apres') ?? 0);
  return Response.json({ statut, evenements }, { headers: { 'Cache-Control': 'no-store' } });
}
