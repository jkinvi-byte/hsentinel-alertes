import { capture } from '../../../../lib/qa';

// Une capture de l'agent H, relayée : seule une adresse de la trajectoire de la session passe, la clé reste ici.
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const image = await capture(params.get('session'), params.get('src'));
  if (!image) return new Response('Capture introuvable.', { status: 404 });
  return new Response(image.corps, { headers: { 'Content-Type': image.type, 'Cache-Control': 'private, max-age=86400, immutable' } });
}
