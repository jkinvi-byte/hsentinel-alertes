export async function POST() {
  return new Response(null, {
    status: 303,
    headers: { Location: '/', 'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' },
  });
}
