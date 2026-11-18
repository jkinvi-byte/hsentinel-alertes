import { memeOrigine } from '../../../../lib/acces-operateur';
import { preparerPlan } from '../../../../lib/qa';

// Le plan d'un parcours guidé : la consigne (tapée ou dictée) découpée en étapes et en critères, à relire avant le lancement.
export async function POST(request) {
  if (!memeOrigine(request)) return Response.json({ erreur: 'Origine de la demande refusée.' }, { status: 403 });
  let d;
  try { d = await request.json(); } catch { return Response.json({ erreur: 'Demande illisible.' }, { status: 400 }); }
  const instruction = typeof d?.instruction === 'string' ? d.instruction.trim() : '';
  if (!instruction) return Response.json({ erreur: 'Décrivez d’abord ce que l’agent doit vérifier.' }, { status: 400 });
  if ([...instruction].length > 2000) return Response.json({ erreur: 'La consigne dépasse 2 000 caractères.' }, { status: 400 });
  try {
    return Response.json({ plan: await preparerPlan(d.target_id, instruction) });
  } catch (e) {
    return Response.json({ erreur: `Le plan n’a pas pu être préparé : ${e.message}` }, { status: 502 });
  }
}
