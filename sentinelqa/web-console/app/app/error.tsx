'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'
import { PageHeader, secondaryButton } from '@/components/console/page-header'

// D-49 : les pages de la console lisent Supabase côté serveur. Si la base ne répond pas, on le dit, sans écran blanc ni chiffre inventé.
export default function ConsoleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter()
  return (
    <>
      <PageHeader crumbs={[{ label: 'Console', href: '/app' }]} title="Données indisponibles" />
      <main className="px-5 py-6 lg:px-8">
        <div role="alert" className="panel flex flex-col items-start gap-3 px-5 py-5">
          <p className="text-[13px] font-medium text-foreground">La base de la console ne répond pas pour l’instant.</p>
          <p className="text-[12.5px] text-muted-foreground">Aucune donnée n’est affichée plutôt que des chiffres faux. Les missions en cours continuent côté agents.</p>
          <button
            type="button"
            className={secondaryButton}
            onClick={() =>
              startTransition(() => {
                router.refresh()
                reset()
              })
            }
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Réessayer
          </button>
        </div>
      </main>
    </>
  )
}
