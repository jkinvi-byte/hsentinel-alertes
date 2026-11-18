import { requete } from '../../../lib/supabase';
import { cibleReelle, ligneMission } from '../../../lib/missions';
import { memeOrigine } from '../../../lib/acces-operateur';

const EMAIL = /^[^\s@]+@[^\s@]+$/;
const CHIFFRE = /^[A-Za-z0-9+/]+={0,2}$/;

// La demande d'audit envoyée par le formulaire de cadrage. Les mots de passe arrivent déjà chiffrés
// par le navigateur avec la clé publique du runner : ce serveur ne les voit jamais en clair.
export async function POST(request) {
  if (!memeOrigine(request)) return Response.json({ erreur: 'Origine de la demande refusée.' }, { status: 403 });
  let d;
  try {
    d = await request.json();
  } catch {
    return Response.json({ erreur: 'Demande illisible.' }, { status: 400 });
  }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return Response.json({ erreur: 'Demande invalide.' }, { status: 400 });
  if ('schema_version' in d) {
    let ligne;
    try { ligne = ligneMission(d); }
    catch (e) { return Response.json({ erreur: e.message }, { status: 400 }); }
    try {
      const [audit] = await requete('audits', { methode: 'POST', prefer: 'return=representation', corps: ligne });
      return Response.json({ id: audit.id }, { status: 201 });
    } catch {
      return Response.json({ erreur: 'La file des missions est indisponible. Réessayez après vérification du serveur.' }, { status: 503 });
    }
  }
  if (cibleReelle(d.cible)) {
    return Response.json({ erreur: 'Cette cible utilise les scénarios de sites réels, sans écriture.' }, { status: 400 });
  }
  const erreurs = [];
  let cible = null;
  try {
    cible = new URL(d.cible);
    if (!['https:', 'http:'].includes(cible.protocol)) cible = null;
  } catch {
    cible = null;
  }
  if (!cible) erreurs.push('L’URL de préproduction est invalide.');
  if (d.atteste !== true) erreurs.push('L’attestation d’autorisation est obligatoire.');
  const comptes = Array.isArray(d.comptes) ? d.comptes : [];
  if (comptes.map((c) => c?.cle).join('') !== 'ABC') erreurs.push('Il faut trois comptes de test : A, B et C.');
  for (const c of comptes) {
    if (!EMAIL.test(c?.email ?? '')) erreurs.push(`L’e-mail du compte ${c?.cle} est invalide.`);
    if (!String(c?.entreprise ?? '').trim()) erreurs.push(`L’entreprise du compte ${c?.cle} manque.`);
    if (!['admin', 'salarie'].includes(c?.acces)) erreurs.push(`Le rôle du compte ${c?.cle} est invalide.`);
  }
  if (typeof d.secrets_chiffres !== 'string' || d.secrets_chiffres.length < 100 || d.secrets_chiffres.length > 2000 || !CHIFFRE.test(d.secrets_chiffres)) {
    erreurs.push('Les mots de passe ne sont pas chiffrés.');
  }
  if (erreurs.length) return Response.json({ erreur: erreurs.join(' ') }, { status: 400 });

  const perimetre = (Array.isArray(d.perimetre) ? d.perimetre : [])
    .filter((p) => typeof p === 'string' && p.startsWith('/')).map((p) => p.slice(0, 200)).slice(0, 50);
  const [audit] = await requete('audits', {
    methode: 'POST',
    prefer: 'return=representation',
    corps: {
      statut: 'en_attente',
      application: String(d.application || cible.host).trim().slice(0, 80),
      cible: `${cible.origin}${cible.pathname.replace(/\/$/, '')}`,
      perimetre,
      ecriture_autorisee: d.ecriture_autorisee === true,
      comptes: comptes.map(({ cle, email, entreprise, acces }) => ({
        cle, email: email.trim(), nom: email.trim(), entreprise: String(entreprise).trim().slice(0, 80), acces,
      })),
      secrets_chiffres: d.secrets_chiffres,
      cle_runner: Number.isInteger(d.cle_runner) ? d.cle_runner : null,
    },
  });
  return Response.json({ id: audit.id }, { status: 201 });
}
