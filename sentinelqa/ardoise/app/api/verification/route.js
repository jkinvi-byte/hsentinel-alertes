// Le jeton de vérification HSentinel (D-56), servi à /.well-known/hsentinel-verification.txt : il prouve que l'équipe
// qui ajoute Ardoise dans HSentinel contrôle bien son contenu. Il vient de l'environnement de déploiement.
export const dynamic = 'force-dynamic';

export function GET() {
  const jeton = process.env.HSENTINEL_VERIFICATION;
  if (!jeton) return new Response('Introuvable\n', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return new Response(`${jeton}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
