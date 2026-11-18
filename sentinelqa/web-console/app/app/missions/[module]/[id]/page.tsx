import { notFound } from 'next/navigation'
import { MissionDetail } from '@/components/console/mission-detail'

export default async function MissionPage({ params }: { params: Promise<{ module: string; id: string }> }) {
  const { module, id } = await params
  if ((module !== 'qa' && module !== 'pentest') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) notFound()
  return <MissionDetail module={module} id={id} />
}
