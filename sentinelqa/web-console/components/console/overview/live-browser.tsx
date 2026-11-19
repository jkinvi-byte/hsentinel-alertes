'use client'

import { Eye, Keyboard, MousePointer2, Navigation, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import { useLoopStep } from '@/components/landing/use-loop-step'
import type { BrowserAction, BrowserSession } from '@/lib/console-data'
import { formatTime } from '@/lib/console-data'
import { cn } from '@/lib/utils'

const ACTION_ICON: Record<BrowserAction['kind'], typeof Eye> = {
  navigate: Navigation,
  click: MousePointer2,
  type: Keyboard,
  extract: ScanSearch,
  assert: Eye,
}

const CURSOR_POS = [
  { x: '18%', y: '30%' },
  { x: '62%', y: '44%' },
  { x: '40%', y: '62%' },
  { x: '74%', y: '70%' },
]

const STATUS_STYLE: Record<BrowserSession['status'], string> = {
  'en cours': 'border-steel/40 text-steel',
  terminée: 'border-safe/40 text-safe',
  faille: 'border-danger/50 text-danger',
}

export function LiveBrowser({ sessions }: { sessions: BrowserSession[] }) {
  const [selectedId, setSelectedId] = useState(sessions[0]?.id)
  const session = sessions.find((s) => s.id === selectedId) ?? sessions[0]
  // D-49 : le point ne pulse que si une session tourne vraiment ; sinon, c'est le rejeu des dernières sessions.
  const live = sessions.some((s) => s.status === 'en cours')

  if (!session) {
    return (
      <section aria-labelledby="live-title" className="theme-ink panel flex min-w-0 flex-col">
        <div className="border-b border-border px-4 py-3">
          <h2 id="live-title" className="text-[13px] font-semibold text-white">
            Sessions navigateur des agents
          </h2>
        </div>
        <p className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">Aucune session navigateur pour l’instant : lancez un audit QA.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="live-title" className="theme-ink panel flex min-w-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            {live ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-steel/60 motion-reduce:hidden" /> : null}
            <span className="relative inline-flex size-2 rounded-full bg-steel" />
          </span>
          <h2 id="live-title" className="text-[13px] font-semibold text-white">
            Sessions navigateur des agents
          </h2>
          <span className="font-mono text-[10.5px] text-subtle">{live ? 'en direct' : 'rejeu'}</span>
        </div>
        <div role="tablist" aria-label="Sessions" className="flex flex-wrap gap-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === session.id}
              onClick={() => setSelectedId(s.id)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[12px] transition-colors',
                s.id === session.id ? 'bg-white/[0.08] font-medium text-white' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.app}
            </button>
          ))}
        </div>
      </div>
      <SessionPlayer key={session.id} session={session} />
    </section>
  )
}

function SessionPlayer({ session }: { session: BrowserSession }) {
  const last = session.actions.length - 1
  const step = useLoopStep(last, 1500, 2600)
  const action = session.actions[step]
  const cursor = CURSOR_POS[step % CURSOR_POS.length]
  const leak = session.status === 'faille' && step === last
  const qa = session.agent === 'Agent QA'

  return (
    <div className="grid min-w-0 gap-px bg-border lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-3 bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-muted-foreground">
          <span className="text-foreground">{session.agent}</span>
          <span className="text-subtle">·</span>
          <span>{session.persona}</span>
          <span className={cn('rounded border px-1.5 uppercase tracking-wider', STATUS_STYLE[session.status])}>
            {qa && session.status === 'faille' ? 'écart' : session.status}
          </span>
          <span className="ml-auto">démarrée à {formatTime(session.startedAt)}</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-[#0a0d13]">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <span className="flex gap-1" aria-hidden="true">
              <span className="size-2 rounded-full bg-white/15" />
              <span className="size-2 rounded-full bg-white/15" />
              <span className="size-2 rounded-full bg-white/15" />
            </span>
            <p className="min-w-0 flex-1 truncate rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-foreground">
              <span key={action.url} className={cn('h-rise inline-block', leak && 'text-danger')}>
                {action.url}
              </span>
            </p>
          </div>

          <div className="relative h-56 overflow-hidden p-4" aria-hidden="true">
            <div className="flex h-full gap-3">
              <div className="hidden w-24 shrink-0 flex-col gap-2 sm:flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={cn('h-2 rounded bg-white/[0.06]', i === step % 5 && 'bg-steel/40')} />
                ))}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <span className="h-3 w-2/5 rounded bg-white/[0.1]" />
                <div className={cn('flex flex-1 flex-col gap-1.5 rounded-md border p-2 transition-colors duration-500', leak ? 'border-danger/60 bg-danger/[0.07]' : 'border-border')}>
                  {[0, 1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="flex items-center gap-2">
                      <span className={cn('h-2 w-1/4 rounded bg-white/[0.07]', leak && 'bg-danger/30')} />
                      <span className="h-2 flex-1 rounded bg-white/[0.04]" />
                      <span className={cn('h-2 w-12 rounded bg-white/[0.07]', leak && 'bg-danger/40')} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {leak ? (
              <span className="h-rise absolute top-3 right-3 rounded border border-danger/60 bg-[#1c0d10] px-2 py-1 font-mono text-[10.5px] text-danger">
                {qa ? 'Écart constaté par le code' : 'Données d’une autre entreprise visibles'}
              </span>
            ) : null}
            {/* Le curseur saute d'une position à l'autre : animer left/top en boucle relancerait la mise en page (fable-fps). */}
            <span className="absolute" style={{ left: cursor.x, top: cursor.y }}>
              <MousePointer2 className="size-4 fill-white text-white drop-shadow" />
              <span className="absolute top-0 left-0 size-4 animate-ping rounded-full bg-steel/40 motion-reduce:hidden" />
            </span>
          </div>
        </div>
        <p className="font-mono text-[11px] text-foreground" aria-live="polite">
          <span className="text-steel">›</span> {action.label}
        </p>
      </div>

      <ol aria-label="Actions de l’agent" className="flex flex-col bg-card py-2">
        {session.actions.map((a, i) => {
          const Icon = ACTION_ICON[a.kind]
          const state = i < step ? 'done' : i === step ? 'current' : 'todo'
          return (
            <li
              key={`${a.label}-${i}`}
              className={cn(
                'flex items-start gap-2.5 px-4 py-1.5 text-[12px] transition-colors',
                state === 'current' && 'bg-white/[0.04]',
                state === 'todo' && 'opacity-40',
              )}
            >
              <Icon className={cn('mt-0.5 size-3.5 shrink-0', state === 'current' ? 'text-steel' : 'text-muted-foreground')} aria-hidden="true" />
              <span className={state === 'current' ? 'text-white' : 'text-foreground'}>{a.label}</span>
            </li>
          )
        })}
        <li className="mt-auto border-t border-border px-4 pt-2 font-mono text-[10.5px] text-subtle">
          {session.pages} pages · {session.actions.length} actions
        </li>
      </ol>
    </div>
  )
}
