import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ApplicationsManager } from '@/components/console/applications/applications-manager'
import { PageHeader, primaryButton } from '@/components/console/page-header'
import { applications, chargerConsole } from '@/lib/console-reel'
import { listerAjoutees } from '@/lib/applications-reel'
import { secondaryButton } from '@/components/console/page-header'

export const metadata: Metadata = {
  title: 'Applications — HSentinel',
  description: 'Les applications autorisées, leurs comptes de test, leur veille et les scénarios que les agents savent y mener.',
}

export default async function ApplicationsPage() {
  // Une lecture des applications ajoutées qui échoue n'empêche pas d'afficher les exemples phares.
  const [apps, ajoutees] = await Promise.all([chargerConsole().then(applications), listerAjoutees().catch(() => null)])
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', href: '/app' }, { label: 'Applications' }]}
        title="Vos applications"
        description="Un périmètre autorisé, des contrôles adaptés à chaque site. La veille relève leur version toutes les 15 minutes et lance une exploration QA quand elle change."
        actions={
          <>
            <Link href="/app/nouveau" className={secondaryButton}>Nouvelle mission</Link>
            <Link href="/app/applications/nouvelle" className={primaryButton}>
              <Plus aria-hidden="true" />
              Ajouter une application
            </Link>
          </>
        }
      />
      <main className="lv-contenu">
        <ApplicationsManager initialApps={apps.filter((a) => !a.ajoutee)} ajoutees={ajoutees} />
      </main>
    </>
  )
}
