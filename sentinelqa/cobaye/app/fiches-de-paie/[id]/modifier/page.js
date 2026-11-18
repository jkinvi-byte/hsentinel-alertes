import { notFound } from 'next/navigation';
import { exigerAdmin } from '../../../../lib/session';
import { ENTREPRISES, FICHES_DE_PAIE, salarie } from '../../../../lib/donnees';

// Le formulaire, lui, est protégé : seul un administrateur de l'entreprise propriétaire l'ouvre.
// C'est sa route d'enregistrement qui ne vérifie rien (faille F4).
export default async function ModifierFiche({ params }) {
  const utilisateur = await exigerAdmin();
  const { id } = await params;
  const fiche = FICHES_DE_PAIE.find((f) => f.id === id && f.entreprise === utilisateur.entreprise);
  if (!fiche) notFound();
  return (
    <>
      <h1>Modifier la fiche n° {fiche.id}</h1>
      <p className="sous-titre">{ENTREPRISES[fiche.entreprise].nom} · {salarie(fiche.salarie).nom} · {fiche.mois}</p>
      <form className="carte formulaire" action={`/api/fiches-de-paie/${fiche.id}`} method="post">
        <label className="champ">
          <span>Commentaire RH</span>
          <textarea name="commentaire" rows={3} maxLength={500} defaultValue={fiche.commentaire} />
        </label>
        <button type="submit" className="bouton">Enregistrer</button>
      </form>
    </>
  );
}
