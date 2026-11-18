import { memeOrigine } from '../../../../lib/acces-operateur';
import { CATALOGUE_QA, transcrire } from '../../../../lib/qa';

// La dictée : l'enregistrement du navigateur devient le texte de la consigne, que l'utilisateur relit avant tout lancement.
export async function POST(request) {
  if (!memeOrigine(request)) return Response.json({ erreur: 'Origine de la demande refusée.' }, { status: 403 });
  const type = (request.headers.get('content-type') ?? '').split(';')[0].trim();
  if (!/^audio\/(webm|ogg|mp4|mpeg|wav|x-wav|flac)$/.test(type)) {
    return Response.json({ erreur: 'Ce format audio n’est pas pris en charge.' }, { status: 415 });
  }
  const audio = await request.arrayBuffer();
  if (!audio.byteLength) return Response.json({ erreur: 'L’enregistrement est vide.' }, { status: 400 });
  if (audio.byteLength > CATALOGUE_QA.transcription.max_octets) {
    return Response.json({ erreur: 'L’enregistrement est trop long : une minute au plus.' }, { status: 413 });
  }
  try {
    return Response.json(await transcrire(audio, request.headers.get('content-type')));
  } catch (e) {
    return Response.json({ erreur: e.message }, { status: 502 });
  }
}
