import { reinitialiser } from '../../../lib/donnees';

// Remet les données de démonstration dans leur état de départ. SentinelQA l'appelle après
// chaque test d'écriture, pour que l'audit suivant reparte des mêmes données.
export async function POST() {
  reinitialiser();
  return new Response(null, { status: 204 });
}
