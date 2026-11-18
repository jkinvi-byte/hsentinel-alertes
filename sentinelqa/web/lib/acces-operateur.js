import { timingSafeEqual } from 'node:crypto';

export function autoriseOperateur(request, env = process.env) {
  const token = env.HSENTINEL_OPERATOR_TOKEN;
  if (!token) {
    // Le serveur de développement écoute uniquement sur loopback (package.json).
    return env.NODE_ENV === 'development' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(request.url).hostname);
  }
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const actual = Buffer.from(header.slice(6), 'base64');
    const expected = Buffer.from(`equipe:${token}`);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}

export function memeOrigine(request) {
  // Les POST utilisent une authentification navigateur : fermer le chemin CSRF. L'origine de la page se compare à l'hôte
  // que le navigateur a appelé (Host, ou X-Forwarded-Host derrière un proxy), comme Next pour ses Server Actions.
  // Jamais à request.url : en développement, Next y écrit « localhost » même pour une page servie sur 127.0.0.1, et
  // chaque écriture était refusée (dictée, plan, lancement ; 18/11). La console importe cette même garde.
  try {
    const hote = request.headers.get('x-forwarded-host')?.split(',')[0].trim() || request.headers.get('host') || new URL(request.url).host;
    return new URL(request.headers.get('origin')).host === hote;
  } catch { return false; }
}
