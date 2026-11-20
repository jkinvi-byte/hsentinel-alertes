import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ApplicationAssistant } from '@/components/console/applications/application-assistant'
import { PageHeader } from '@/components/console/page-header'
import { listerAjoutees } from '@/lib/applications-reel'

export const metadata: Metadata = { title: 'Votre application — HSentinel' }

// D-56 : une application ajoutée, reprise là où on en était (vérification, comptes de test, prête).
export default async function ApplicationAjouteePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[a-z0-9][a-z0-9-]{0,59}$/.test(id)) notFound()
  const app = (await listerAjoutees()).find((a) => a.id === id)
  if (!app) notFound()
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', href: '/app' }, { label: 'Applications', href: '/app/applications' }, { label: app.nom }]}
        surtitre="Votre application"
        title={app.nom}
        description="Son adresse, sa vérification et ses comptes de test. Vos missions QA s’y lancent depuis le studio."
      />
      <main className="lv-contenu">
        <ApplicationAssistant initial={app} />
      </main>
    </>
  )
}
