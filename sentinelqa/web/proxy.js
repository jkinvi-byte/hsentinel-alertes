import { NextResponse } from 'next/server';
import { autoriseOperateur } from './lib/acces-operateur';

export function proxy(request) {
  if (autoriseOperateur(request)) return NextResponse.next();
  if (!process.env.HSENTINEL_OPERATOR_TOKEN) {
    return new NextResponse('Accès opérateur non configuré.', { status: 503 });
  }
  return new NextResponse('Connexion opérateur requise.', {
    status: 401, headers: { 'WWW-Authenticate': 'Basic realm="HSentinel", charset="UTF-8"', 'Cache-Control': 'no-store' },
  });
}

export const config = { matcher: ['/((?!_next/static|_next/image|icon.svg|favicon.ico).*)'] };
