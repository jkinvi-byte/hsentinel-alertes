import type { Metadata } from 'next'
import { AuditsConsole } from '@/components/console/audits-console'
import { audits, chargerConsole } from '@/lib/console-reel'

export const metadata: Metadata = {
  title: 'Missions — HSentinel',
  description: 'Console HSentinel : chaque mission QA et Pentest, son pipeline, ses preuves et ses alertes.',
}

export default async function AuditsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { deployments, kpis } = audits(await chargerConsole())
  const volet = (await searchParams).volet
  return <AuditsConsole deployments={deployments} kpis={kpis} initialModule={volet === 'qa' ? 'qa' : 'pentest'} />
}
