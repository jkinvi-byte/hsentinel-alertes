import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { UTILISATEURS } from './donnees';

// Un secret par processus : redémarrer l'application déconnecte tout le monde.
globalThis.__secretSession ??= process.env.SESSION_SECRET || randomBytes(32).toString('hex');

function signature(idUtilisateur) {
  return createHmac('sha256', globalThis.__secretSession).update(idUtilisateur).digest('hex');
}

export function jetonPour(idUtilisateur) {
  return `${idUtilisateur}.${signature(idUtilisateur)}`;
}

function utilisateurDuJeton(jeton) {
  if (!jeton) return null;
  const [id, sig] = jeton.split('.');
  if (!id || !sig) return null;
  const attendue = Buffer.from(signature(id));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  return UTILISATEURS.find((u) => u.id === id) ?? null;
}

export async function utilisateurCourant() {
  const jar = await cookies();
  return utilisateurDuJeton(jar.get('session')?.value);
}

export async function exigerConnexion() {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) redirect('/');
  return utilisateur;
}

// Réservé aux administrateurs : un salarié reçoit une page 404, comme pour une ressource inexistante.
export async function exigerAdmin() {
  const utilisateur = await exigerConnexion();
  if (utilisateur.acces !== 'admin') notFound();
  return utilisateur;
}
