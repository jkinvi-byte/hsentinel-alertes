export async function POST(request) {
  const reponse = new Response(null, { status: 303, headers: { Location: new URL('/', request.url).toString() } });
  reponse.headers.append('Set-Cookie', 'ardoise_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return reponse;
}
