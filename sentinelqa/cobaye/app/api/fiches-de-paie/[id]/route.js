import { utilisateurCourant } from '../../../../lib/session';
import { ENTREPRISES, ecrire, lireFiches, salarie } from '../../../../lib/donnees';

// FAILLE INJECTÉE F2 (voir VERITE_TERRAIN.json) : l'API vérifie la connexion,
// mais pas que la fiche demandée appartient à l'entreprise de l'appelant.
export async function GET(request, { params }) {
  const FICHES_DE_PAIE = await lireFiches();
  if (!(await utilisateurCourant())) return Response.json({ erreur: 'Non connecté' }, { status: 401 });
  const { id } = await params;
  const fiche = FICHES_DE_PAIE.find((f) => f.id === id);
  if (!fiche) return Response.json({ erreur: 'Introuvable' }, { status: 404 });
  return Response.json({ ...fiche, entreprise: ENTREPRISES[fiche.entreprise].nom, salarie: salarie(fiche.salarie) });
}

// FAILLE INJECTÉE F4 (voir VERITE_TERRAIN.json) : l'enregistrement vérifie la connexion,
// mais ni le rôle ni l'entreprise propriétaire. Le formulaire, lui, est protégé.
export async function POST(request, { params }) {
  const FICHES_DE_PAIE = await lireFiches();
  if (!(await utilisateurCourant())) return Response.json({ erreur: 'Non connecté' }, { status: 401 });
  const { id } = await params;
  const fiche = FICHES_DE_PAIE.find((f) => f.id === id);
  if (!fiche) return Response.json({ erreur: 'Introuvable' }, { status: 404 });
  const formulaire = await request.formData();
  await ecrire(`fiche:${fiche.id}`, String(formulaire.get('commentaire') ?? '').slice(0, 500));
  return new Response(null, { status: 303, headers: { Location: `/fiches-de-paie/${fiche.id}` } });
}
