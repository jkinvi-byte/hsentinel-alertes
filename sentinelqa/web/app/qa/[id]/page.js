import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { lireMission } from '../../../lib/qa';
import { CATALOGUE_QA } from '../../../lib/qa-contrat.mjs';
import SuiviQa from './suivi-qa';
import RapportQa from './rapport-qa';
import '../qa.css';

export const metadata = { title: 'Mission QA · HSentinel' };

// Une mission QA : le suivi en direct tant qu'elle tourne, puis son rapport.
export default async function PageMission({ params }) {
  const { id } = await params;
  await connection();
  const mission = await lireMission(id);
  if (!mission) notFound();
  if (mission.statut === 'termine' && mission.rapport) return <RapportQa mission={mission} />;
  const d = mission.demande;
  return (
    <SuiviQa id={id} statutInitial={mission.statut} erreurInitiale={mission.erreur} arretInitial={mission.arret_demande}
      titre={d.plan?.titre ?? 'Exploration bornée du site'} instruction={d.instruction}
      appareil={d.appareil} contexte={[CATALOGUE_QA.cibles.find((c) => c.id === d.target_id)?.nom ?? d.target_id, d.appareil === 'mobile' ? 'mobile' : 'ordinateur',
        d.pilotage === 'guide' ? 'parcours guidé' : 'exploration bornée'].join(' · ')} />
  );
}
