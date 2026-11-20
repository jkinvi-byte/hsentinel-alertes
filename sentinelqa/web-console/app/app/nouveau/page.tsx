import { catalog } from '@/lib/console-contract.mjs'
import type { Catalog } from '@/lib/mission-types'
import { MissionStudio } from '@/components/console/mission-studio'
import { listerAjoutees } from '@/lib/applications-reel'

// D-56 : le studio propose aussi les applications ajoutées par le client. Une application non vérifiée y figure, grisée :
// aucune mission ne part avant la vérification (le serveur et le runner le revérifient).
export default async function NewMission({ searchParams }: { searchParams: Promise<{ volet?: string; cible?: string; voix?: string }> }) {
  const { volet, cible, voix } = await searchParams
  const ajoutees = await listerAjoutees().catch(() => [])
  const base = catalog(ajoutees) as unknown as Catalog
  const qa = [
    ...ajoutees.map((a) => ({
      id: a.id, name: a.nom, url: a.profil_qa?.entree ?? a.origine, available: Boolean(a.autorisee && a.verifiee_le), connexion: Boolean(a.profil_qa?.connexion),
      modes: ['guide', 'exploration'], limits: { guide: { max_steps: 30, max_time_s: 300 }, exploration: { max_steps: 40, max_time_s: 420, max_pages: 6 } },
      ajoutee: true, comptes: a.comptes.map((c) => ({ id: c.id, libelle: c.libelle, identifiant: c.identifiant })),
    })),
    ...base.qa,
  ]
  return <MissionStudio catalog={{ ...base, qa }} initialModule={volet === 'pentest' ? 'pentest' : 'qa'} initialTarget={cible} initialVoix={voix === '1'} />
}
