import { requete } from '../../../../../lib/supabase';
import { memeOrigine } from '../../../../../lib/acces-operateur';
import { rapportArretAvantDepart } from '../../../../../lib/missions';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function POST(request, { params }) {
  if (!memeOrigine(request)) return Response.json({ erreur: 'Origine refusée.' }, { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return Response.json({ erreur: 'Mission introuvable.' }, { status: 404 });
  const [audit] = await requete(`audits?select=id,statut,rapport&id=eq.${id}`);
  if (!audit) return Response.json({ erreur: 'Mission introuvable.' }, { status: 404 });
  if (audit.rapport?.schema_version !== 2) return Response.json({ erreur: 'Arrêtez le banc interne depuis son terminal.' }, { status: 409 });
  if (!['en_attente', 'en_cours'].includes(audit.statut)) return Response.json({ termine: true });
  // L'événement est visible par le runner même si la réservation de la demande vient de se faire.
  await requete('evenements', { methode: 'POST', corps: { audit_id: id, type: 'arret', message: 'Arrêt demandé par l’opérateur.' } });
  if (audit.statut === 'en_attente') {
    // Comparaison atomique avec le statut : ne jamais écraser le rapport d'un runner qui vient de démarrer.
    const rapport = rapportArretAvantDepart(audit.rapport);
    await requete(`audits?id=eq.${id}&statut=eq.en_attente`, {
      methode: 'PATCH', prefer: 'return=representation', corps: { statut: 'termine', fin: rapport.finished_at, rapport },
    });
  }
  return Response.json({ demande: true }, { status: 202 });
}
