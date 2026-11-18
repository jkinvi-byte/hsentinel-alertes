import { notFound } from 'next/navigation';
import { exigerAdmin } from '../../../../lib/session';
import { ENTREPRISES, FACTURES } from '../../../../lib/donnees';

export default async function ModifierFacture({ params }) {
  const utilisateur = await exigerAdmin();
  const { id } = await params;
  const facture = FACTURES.find((f) => f.id === id && f.entreprise === utilisateur.entreprise);
  if (!facture) notFound();
  return (
    <>
      <h1>Modifier la facture {facture.id}</h1>
      <p className="sous-titre">{ENTREPRISES[facture.entreprise].nom} · {facture.client}</p>
      <form className="carte formulaire" action={`/api/factures/${facture.id}`} method="post">
        <label className="champ">
          <span>Note interne</span>
          <textarea name="note" rows={3} maxLength={500} defaultValue={facture.note} />
        </label>
        <button type="submit" className="bouton">Enregistrer</button>
      </form>
    </>
  );
}
