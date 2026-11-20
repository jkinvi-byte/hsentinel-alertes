import { jetonPour, verifier } from '../../../lib/session';

export async function POST(request) {
  const formulaire = await request.formData();
  const compte = verifier(formulaire.get('email'), formulaire.get('mot_de_passe'));
  const vers = new URL(compte ? '/tableau-de-bord' : '/connexion?erreur=1', request.url);
  const reponse = Response.redirect(vers, 303);
  if (!compte) return reponse;
  const avecCookie = new Response(null, { status: 303, headers: reponse.headers });
  avecCookie.headers.append('Set-Cookie', `ardoise_session=${jetonPour(compte.id)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`);
  return avecCookie;
}
