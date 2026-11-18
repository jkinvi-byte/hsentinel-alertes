import { lireEvenementsQa, lireMission } from '../../../../../lib/qa';

// Le suivi : le statut, les événements après « apres », et le rapport quand la mission est finie.
export async function GET(request, { params }) {
  const { id } = await params;
  const mission = await lireMission(id);
  if (!mission) return Response.json({ erreur: 'Mission introuvable.' }, { status: 404 });
  const evenements = await lireEvenementsQa(id, new URL(request.url).searchParams.get('apres') ?? 0);
  return Response.json({ statut: mission.statut, erreur: mission.erreur, arret: mission.arret_demande, evenements,
    termine: ['termine', 'echec'].includes(mission.statut) }, { headers: { 'Cache-Control': 'no-store' } });
}
