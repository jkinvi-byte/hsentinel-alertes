import type { Metadata } from 'next'
import { ApplicationAssistant } from '@/components/console/applications/application-assistant'
import { PageHeader } from '@/components/console/page-header'

export const metadata: Metadata = {
  title: 'Ajouter une application — HSentinel',
  description: 'Votre site, vérifié par un jeton publié, puis vos comptes de test chiffrés pour le runner.',
}

// D-56 : l'adresse peut arriver pré-remplie, depuis l'expert (« Ajouter cette application »).
export default async function NouvelleApplication({ searchParams }: { searchParams: Promise<{ adresse?: string }> }) {
  const { adresse } = await searchParams
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', href: '/app' }, { label: 'Applications', href: '/app/applications' }, { label: 'Ajouter une application' }]}
        surtitre="Votre application"
        title="Testez votre propre site."
        description="Trois gestes, et vos agents QA s’y connectent comme vos utilisateurs. Rien n’est lancé sans vous."
      />
      <main className="lv-contenu">
        <ApplicationAssistant initial={null} adresse={typeof adresse === 'string' ? adresse.slice(0, 300) : ''} />
      </main>
    </>
  )
}
