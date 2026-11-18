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
  // Les POST utilisent une authentification navigateur : fermer le chemin CSRF.
  try { return new URL(request.headers.get('origin')).origin === new URL(request.url).origin; }
  catch { return false; }
}
