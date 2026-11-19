import { notFound } from 'next/navigation';
import { exigerConnexion } from '../../../lib/session';
import { ENTREPRISES, lireFiches, salarie, euros } from '../../../lib/donnees';

// FAILLE INJECTÉE F1 (voir VERITE_TERRAIN.json) : la fiche est affichée sans vérifier
// qu'elle appartient à l'entreprise de l'utilisateur connecté, ni qu'un salarié en est le titulaire (F6).
export default async function FicheDePaie({ params }) {
  const FICHES_DE_PAIE = await lireFiches();
  const utilisateur = await exigerConnexion();
  const { id } = await params;
  const fiche = FICHES_DE_PAIE.find((f) => f.id === id);
  if (!fiche) notFound();
  const s = salarie(fiche.salarie);
  return (
    <>
      <h1>Fiche de paie n° {fiche.id}</h1>
      <p className="sous-titre">{ENTREPRISES[fiche.entreprise].nom} · {fiche.mois}</p>
      <div className="carte">
        <p><span className="etiquette">{s.poste}</span></p>
        <h2>{s.nom}</h2>
        <p>Salaire brut : {euros(fiche.brut)}</p>
        <p>Net à payer</p>
        <p className="montant">{euros(fiche.net)}</p>
        {fiche.commentaire && <p className="commentaire">Commentaire RH : {fiche.commentaire}</p>}
        <p><a href={`/api/fiches-de-paie/${fiche.id}`}>Données brutes (JSON)</a></p>
        {utilisateur.acces === 'admin' && <p><a href={`/fiches-de-paie/${fiche.id}/modifier`}>Modifier le commentaire RH</a></p>}
      </div>
    </>
  );
}
