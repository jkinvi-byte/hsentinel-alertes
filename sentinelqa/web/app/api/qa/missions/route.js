import { memeOrigine } from '../../../../lib/acces-operateur';
import { creerMission, validerMissionQa } from '../../../../lib/qa';

// Une mission QA entre dans sa propre file (qa_missions) ; le worker QA la prend, jamais le runner du pentest.
export async function POST(request) {
  if (!memeOrigine(request)) return Response.json({ erreur: 'Origine de la demande refusée.' }, { status: 403 });
  let mission;
  try {
    mission = validerMissionQa(await request.json());
  } catch (e) {
    return Response.json({ erreur: e instanceof SyntaxError ? 'Demande illisible.' : e.message }, { status: 400 });
  }
  try {
    return Response.json({ id: await creerMission(mission) }, { status: 201 });
  } catch {
    return Response.json({ erreur: 'La file des missions QA est indisponible. Réessayez après vérification du serveur.' }, { status: 503 });
  }
}
