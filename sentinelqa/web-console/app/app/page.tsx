import type { Metadata } from 'next'
import { MissionConsole } from '@/components/console/mission-console'

export const metadata: Metadata = {
  title: 'Audits — HSentinel',
  description: 'Missions QA et Pentest, exécutions et preuves.',
}

export default async function ConsolePage() {
  return <MissionConsole />
}
