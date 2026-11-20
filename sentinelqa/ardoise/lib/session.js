import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Les comptes de démonstration viennent de l'environnement de déploiement (ARDOISE_COMPTES) : un tableau JSON
// [{ id, email, nom, role, sel, empreinte }] où empreinte = scrypt(mot de passe, sel), en hexadécimal. Aucun mot de passe ici.
function comptes() {
  try { return JSON.parse(process.env.ARDOISE_COMPTES || '[]'); } catch { return []; }
}

function signature(id) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET manque.');
  return createHmac('sha256', secret).update(id).digest('hex');
}

export function verifier(email, motDePasse) {
  const compte = comptes().find((c) => c.email.toLowerCase() === String(email ?? '').trim().toLowerCase());
  if (!compte || typeof motDePasse !== 'string' || !motDePasse) return null;
  const attendue = Buffer.from(compte.empreinte, 'hex');
  const recue = scryptSync(motDePasse, compte.sel, attendue.length);
  return timingSafeEqual(attendue, recue) ? compte : null;
}

export const jetonPour = (id) => `${id}.${signature(id)}`;

export async function compteCourant() {
  const jeton = (await cookies()).get('ardoise_session')?.value;
  if (!jeton) return null;
  const [id, sig] = jeton.split('.');
  if (!id || !sig) return null;
  const attendue = Buffer.from(signature(id));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  const compte = comptes().find((c) => c.id === id);
  return compte ? { id: compte.id, nom: compte.nom, role: compte.role, email: compte.email } : null;
}

export async function exigerConnexion() {
  const compte = await compteCourant();
  if (!compte) redirect('/connexion');
  return compte;
}
