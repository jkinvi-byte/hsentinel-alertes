import { notFound } from 'next/navigation';
import { exigerAdmin } from '../../../lib/session';
import { ENTREPRISES, lireFactures, euros } from '../../../lib/donnees';

// CONTRÔLE SAIN C1 (voir VERITE_TERRAIN.json) : la facture n'est montrée qu'à son entreprise.
// Sert à vérifier que SentinelQA ne signale pas de faux positif.
export default async function Facture({ params }) {
  const FACTURES = await lireFactures();
  const utilisateur = await exigerAdmin();
  const { id } = await params;
  const facture = FACTURES.find((f) => f.id === id && f.entreprise === utilisateur.entreprise);
  if (!facture) notFound();
  return (
    <>
      <h1>Facture {facture.id}</h1>
      <p className="sous-titre">{ENTREPRISES[facture.entreprise].nom}</p>
      <div className="carte">
        <p>Client : {facture.client}</p>
        <p className="montant">{euros(facture.montant)}</p>
        <p><span className="etiquette">{facture.statut}</span></p>
        {facture.note && <p className="commentaire">Note interne : {facture.note}</p>}
        <p><a href={`/factures/${facture.id}/modifier`}>Modifier la note interne</a></p>
      </div>
    </>
  );
}
