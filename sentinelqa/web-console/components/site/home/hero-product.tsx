'use client'

import { Check, ShieldAlert } from 'lucide-react'
import { useLoopStep } from '@/components/landing/use-loop-step'
import { cn } from '@/lib/utils'

const DEPLOYS = [
  { title: 'Refonte de l’export des bulletins', sha: '8f21c4e', leak: true },
  { title: 'Ajout du filtre par service', sha: '71a0e9b' },
  { title: 'Correctif arrondi des cotisations', sha: '5c3d902' },
  { title: 'Mise à jour des dépendances', sha: '2b7f411' },
]

const STEPS = [
  { title: 'Explorateur', meta: '27 pages · 41 requêtes' },
  { title: 'Rejeu HTTP', meta: '1 réponse 200 suspecte' },
  { title: 'Vérificateur', meta: 'salaires d’Alpha visibles par Bêta' },
  { title: 'Faille prouvée', meta: 'critique · ticket #482' },
]

const ROLES = [
  ['Admin Alpha', 'autorisé', 'autorisé', 'bloqué'],
  ['Comptable Alpha', 'autorisé', 'bloqué', 'bloqué'],
  ['Admin Bêta', 'FAILLE', 'bloqué', 'autorisé'],
]

export function HeroProduct() {
  const step = useLoopStep(STEPS.length, 1100, 3400)
  const proven = step >= STEPS.length

  return (
    <figure
      aria-label="Aperçu de la console HSentinel"
      className="h-rise relative mx-auto max-w-5xl overflow-hidden rounded-[22px] bg-ink p-1.5 text-white shadow-[0_40px_120px_-40px_rgb(10_15_28/0.6)] [animation-delay:260ms]"
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <span className="mx-auto truncate rounded-full bg-white/5 px-4 py-1 font-mono text-[11px] text-white/45">
          console.hsentinel.app/paie-express/audits
        </span>
      </div>

      <div className="grid gap-1.5 rounded-[16px] bg-[#0e1424] p-1.5 md:grid-cols-[260px_minmax(0,1fr)]">
        <div className="flex flex-col rounded-xl bg-white/[0.03] p-2">
          <p className="px-2.5 pt-1.5 pb-2 font-mono text-[10.5px] tracking-wider text-white/40 uppercase">Déploiements</p>
          {DEPLOYS.map((d, i) => (
            <div
              key={d.sha}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-left',
                i === 0 && 'bg-white/[0.06]',
              )}
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[12.5px] text-white/90">{d.title}</span>
                <span className="font-mono text-[10.5px] text-white/40">{d.sha}</span>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors duration-500',
                  d.leak
                    ? proven
                      ? 'bg-[#f87171]/15 text-[#f87171]'
                      : 'bg-white/5 text-white/45'
                    : 'bg-[#4ade80]/10 text-[#4ade80]',
                )}
              >
                {d.leak ? (proven ? '1 faille' : 'en cours') : '0 faille'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <ol aria-label="Pipeline d’audit" className="grid gap-1.5 sm:grid-cols-4">
            {STEPS.map((s, i) => {
              const done = step > i
              const running = step === i
              const last = i === STEPS.length - 1
              return (
                <li
                  key={s.title}
                  className={cn(
                    'flex flex-col gap-2 rounded-xl p-3 transition-colors duration-500',
                    running ? 'bg-[#2563eb]/15 ring-1 ring-[#2563eb]/40' : 'bg-white/[0.03]',
                    done && last && 'bg-[#f87171]/10 ring-1 ring-[#f87171]/30',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full font-mono text-[10.5px] transition-colors duration-500',
                      done ? (last ? 'bg-[#f87171] text-ink' : 'bg-white text-ink') : 'bg-white/10 text-white/50',
                      running && 'bg-[#2563eb] text-white',
                    )}
                  >
                    {done && !last ? <Check className="size-3" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={cn('text-[13px] font-medium', done && last ? 'text-[#f87171]' : 'text-white')}>
                    {s.title}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[10.5px] leading-snug transition-opacity duration-500',
                      done ? 'opacity-100' : 'opacity-0',
                      last ? 'text-[#f87171]' : 'text-white/45',
                    )}
                  >
                    {s.meta}
                  </span>
                </li>
              )
            })}
          </ol>

          <div className="overflow-hidden rounded-xl bg-white/[0.03]">
            <table className="w-full text-left text-[12px]">
              <caption className="sr-only">Matrice rôle par action</caption>
              <thead>
                <tr className="font-mono text-[10px] tracking-wider text-white/40 uppercase">
                  <th className="px-4 py-2.5 font-normal">Rôle</th>
                  <th className="px-4 py-2.5 font-normal">Bulletins Alpha</th>
                  <th className="hidden px-4 py-2.5 font-normal sm:table-cell">Modifier IBAN</th>
                  <th className="px-4 py-2.5 font-normal">Bulletins Bêta</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map(([role, ...cells]) => (
                  <tr key={role} className="border-t border-white/5">
                    <td className="px-4 py-2.5 text-white/85">{role}</td>
                    {cells.map((cell, j) => (
                      <td key={j} className={cn('px-4 py-2.5 font-mono text-[11px]', j === 1 && 'hidden sm:table-cell')}>
                        {cell === 'FAILLE' ? (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors duration-500',
                              proven ? 'bg-[#f87171]/15 text-[#f87171]' : 'text-white/40',
                            )}
                          >
                            {proven ? <ShieldAlert className="size-3" aria-hidden="true" /> : null}
                            {proven ? 'faille' : 'test…'}
                          </span>
                        ) : (
                          <span className={cell === 'bloqué' ? 'text-[#4ade80]' : 'text-white/50'}>{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </figure>
  )
}
