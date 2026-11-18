import { catalog } from '@/lib/console-contract.mjs'
import type { Catalog } from '@/lib/mission-types'
import { MissionStudio } from '@/components/console/mission-studio'

export default async function NewMission({ searchParams }: { searchParams: Promise<{ volet?: string; cible?: string }> }) {
  const { volet, cible } = await searchParams
  return <MissionStudio catalog={catalog() as unknown as Catalog} initialModule={volet === 'pentest' ? 'pentest' : 'qa'} initialTarget={cible} />
}
