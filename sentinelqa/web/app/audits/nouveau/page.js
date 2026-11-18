import { connection } from 'next/server';
import { requete } from '../../../lib/supabase';
import Formulaire from './formulaire';
import { Icone } from '../../composants';
import '../../qa/qa.css';

export const metadata = { title: 'HSentinel · Nouvelle mission' };

export default async function NouvelAudit() {
  await connection();
  let cle = null;
  try { [cle] = await requete('cles_runner?select=id,cle_publique&order=id.desc&limit=1'); } catch { /* Le QA et le pentest anonymes n’utilisent aucun coffre. */ }
  return (
    <main className="page">
      <a className="retour" href="/"><Icone nom="retour" />La salle</a>
      <section className="entete-page">
        <p className="kicker">Sites réels · QA et pentest</p>
        <h1>Que voulez-vous vérifier ?</h1>
        <p className="chapeau">
          Choisissez un scénario, précisez la mission et suivez son exécution. Chaque résultat distingue ce qui a été vérifié de ce qui reste incertain.
        </p>
      </section>
      <Formulaire cle={cle ? { id: cle.id, jwk: cle.cle_publique } : null} />
    </main>
  );
}
