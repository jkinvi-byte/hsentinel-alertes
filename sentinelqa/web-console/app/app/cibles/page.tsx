import Link from 'next/link'
import { catalog } from '@/lib/console-contract.mjs'
import { ConsoleHeader } from '@/components/console/console-header'

export default function Targets() {
  const data = catalog()
  return <><ConsoleHeader title="Applications et scénarios" /><main className="mx-auto w-full max-w-5xl space-y-6 p-5 lg:p-7">
    <div><h1 className="text-2xl font-semibold">Les applications à tester</h1><p className="mt-2 text-sm text-muted-foreground">Choisissez parmi les parcours disponibles pour votre équipe.</p></div>
    <section className="space-y-3"><h2 className="text-base font-medium">QA fonctionnel</h2>{data.qa.map(t => <article className="panel flex flex-wrap items-center justify-between gap-3 p-5" key={t.id}><div><h3 className="font-medium">{t.name}</h3><p className="mt-1 break-all text-xs text-muted-foreground">{t.url}</p><p className="mt-2 text-sm text-muted-foreground">{t.connexion ? 'Parcours guidé avec un compte de test. Connexion et identité vérifiées dans le rapport.' : 'Parcours guidé et exploration selon les possibilités de la cible.'}</p></div>{t.available && <Link href={`/app/nouveau?cible=${encodeURIComponent(t.id)}`} className="console-button">Préparer un QA</Link>}</article>)}</section>
    <section className="space-y-3"><h2 className="text-base font-medium">Pentest</h2>{data.pentest.map(s => <article className="panel p-5" key={s.id}><p className="label-mono">{s.target}</p><h3 className="mt-2 font-medium">{s.name}</h3><p className="mt-2 text-sm text-muted-foreground">{s.expected}</p><p className="mt-2 text-xs text-muted-foreground">{s.limitations}</p>{s.available ? <Link className="console-button mt-4" href="/app/nouveau?volet=pentest">Préparer ce contrôle</Link> : <p className="mt-4 text-xs text-warn">En cours d’intégration</p>}</article>)}</section>
  </main></>
}
