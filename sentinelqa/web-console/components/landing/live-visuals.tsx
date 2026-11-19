'use client'

import { cn } from '@/lib/utils'
import { useLoopStep } from './use-loop-step'

const PIPELINE = [
  { title: 'Explorateur', actor: 'agent H', meta: '27 pages · 41 requêtes' },
  { title: 'Rejeu HTTP', actor: 'notre code', meta: '1 réponse 200 suspecte' },
  { title: 'Vérificateur', actor: 'agent H', meta: 'salaires d’Alpha visibles par B' },
  { title: 'Faille prouvée', actor: 'résultat', meta: 'critique' },
]

export function LivePipeline() {
  const step = useLoopStep(PIPELINE.length, 1000, 3000)
  return (
    <ol aria-label="Pipeline d’audit" className="relative flex flex-col rounded-2xl border border-border bg-background p-2">
      {PIPELINE.map((row, i) => {
        const done = step > i
        const running = step === i
        const last = i === PIPELINE.length - 1
        return (
          <li
            key={row.title}
            className={cn(
              'flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors duration-500',
              running && 'bg-secondary',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-all duration-500',
                done
                  ? last
                    ? 'border-danger bg-danger text-white'
                    : 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground',
                running && 'h-pulse border-steel text-steel',
              )}
            >
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className={cn('text-[15px] font-medium', done && last ? 'text-danger' : 'text-foreground')}>
                {row.title}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">{row.actor}</span>
            </div>
            <span
              className={cn(
                'hidden truncate text-right font-mono text-[11.5px] transition-opacity duration-500 sm:block',
                done ? 'opacity-100' : 'opacity-0',
                last ? 'text-danger' : 'text-muted-foreground',
              )}
            >
              {row.meta}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const LOG: { t: string; tone?: 'dim' | 'ok' | 'bad' | 'cmd' }[] = [
  { t: '$ git push origin main', tone: 'cmd' },
  { t: '→ déploiement preprod 8f21c4e', tone: 'dim' },
  { t: '→ HSentinel déclenché par webhook', tone: 'dim' },
  { t: '✓ QA · 18 parcours conformes', tone: 'ok' },
  { t: '✓ Pentest · 40 requêtes refusées', tone: 'ok' },
  { t: '✗ GET /companies/alpha/payslips → 200 (session Bêta)', tone: 'bad' },
  { t: '→ ticket GitHub #482 ouvert, équipe alertée', tone: 'dim' },
]

const LOG_TONE = {
  cmd: 'text-white',
  dim: 'text-white/55',
  ok: 'text-[#4ade80]',
  bad: 'text-[#f87171]',
}

export function LiveTerminal() {
  const step = useLoopStep(LOG.length, 650, 3200)
  return (
    <div className="overflow-hidden rounded-2xl bg-[#0b0b0c] shadow-[0_24px_60px_-30px_rgb(0_0_0/0.45)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
        </div>
        <span className="font-mono text-[11px] text-white/45">ci · paie-express</span>
      </div>
      <pre className="min-h-[236px] px-5 py-4 font-mono text-[12.5px] leading-[1.9] whitespace-pre-wrap">
        {LOG.map((line, i) => (
          <span
            key={line.t}
            className={cn(
              'block transition-all duration-300',
              step > i ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
              LOG_TONE[line.tone ?? 'dim'],
            )}
          >
            {line.t}
          </span>
        ))}
        <span className="h-caret text-white" aria-hidden="true">
          ▍
        </span>
      </pre>
    </div>
  )
}
