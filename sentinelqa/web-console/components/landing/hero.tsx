import Image from 'next/image'
import Link from 'next/link'

const RUN = [
  { step: 'Votre consigne', actor: 'texte ou dictée', meta: 'Parcours à vérifier' },
  { step: 'Votre plan', actor: 'critères relus', meta: 'Résultats attendus' },
  { step: 'La navigation', actor: 'agent H', meta: 'Actions dans le navigateur' },
  { step: 'Le rapport', actor: 'observations vérifiées', meta: 'Preuves et limites' },
]

export function Hero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:py-24">
        <div className="flex flex-col items-start gap-6">
          <Image src="/logo-mark.png" alt="" width={56} height={56} priority className="size-14" />
          <div className="flex flex-col gap-4">
            <h1 className="font-heading text-[34px] leading-[1.08] font-bold tracking-tight text-balance text-white md:text-[46px]">
              HSentinel — QA + Pentest, sur vos vrais parcours
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground md:text-[17px]">
              Décrivez ce que vous voulez tester. L’agent parcourt l’application et rassemble les preuves pour vérifier les fonctionnalités et les contrôles d’accès.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={signedIn ? '/app' : '/login'}
              className="flex h-9 items-center rounded-md bg-steel px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#2f72e0]"
            >
              {signedIn ? 'Ouvrir la console' : 'Accéder à la console'}
            </Link>
            <a
              href="#fonctionnement"
              className="flex h-9 items-center rounded-md border border-border px-4 text-[13px] text-foreground transition-colors hover:bg-white/[0.05]"
            >
              Voir le fonctionnement
            </a>
          </div>
        </div>

        <figure className="panel overflow-hidden" aria-label="Illustration du parcours d’une mission QA">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="label-mono">
              <span className="mr-1.5 rounded border border-steel/40 px-1 text-steel">QA</span>
              Consigne → preuves
            </p>
            <span className="rounded border border-border px-1.5 font-mono text-[10px] leading-[18px] text-muted-foreground">
              Illustration
            </span>
          </div>
          <ol className="flex flex-col">
            {RUN.map((row, i) => (
              <li key={row.step} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span className="font-mono text-[10.5px] text-subtle tabular-nums">0{i + 1}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-semibold text-white">
                    {row.step}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">{row.actor}</span>
                </div>
                <span className="truncate text-right font-mono text-[10.5px] text-foreground">{row.meta}</span>
              </li>
            ))}
          </ol>
          <figcaption className="border-t border-border bg-white/[0.02] px-4 py-2 font-mono text-[10.5px] text-muted-foreground">
            Les rapports réels distinguent conforme, écart, non concluant et non exécuté.
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
