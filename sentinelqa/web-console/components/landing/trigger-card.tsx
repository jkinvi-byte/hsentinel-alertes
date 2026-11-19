'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useLoopStep } from './use-loop-step'

type Seg = { t: string; c?: 'k' | 's' | 'f' | 'm' }

const TABS: { id: string; label: string; copy: string; lines: Seg[][] }[] = [
  {
    id: 'cli',
    label: 'CLI',
    copy: 'hsentinel audit --app staging.paie-express.app --modules qa,pentest',
    lines: [
      [{ t: 'hsentinel', c: 'k' }, { t: ' audit' }],
      [{ t: '  --app ', c: 'm' }, { t: 'staging.paie-express.app', c: 's' }],
      [{ t: '  --modules ', c: 'm' }, { t: 'qa,pentest', c: 's' }],
    ],
  },
  {
    id: 'webhook',
    label: 'Webhook',
    copy: 'POST /v1/audits {"app":"staging.paie-express.app","commit":"8f21c4e"}',
    lines: [
      [{ t: 'POST', c: 'k' }, { t: ' /v1/audits', c: 'f' }],
      [{ t: '{' }],
      [{ t: '  "app"', c: 'm' }, { t: ': ' }, { t: '"staging.paie-express.app"', c: 's' }, { t: ',' }],
      [{ t: '  "commit"', c: 'm' }, { t: ': ' }, { t: '"8f21c4e"', c: 's' }],
      [{ t: '}' }],
    ],
  },
  {
    id: 'github',
    label: 'GitHub Action',
    copy: 'uses: hsentinel/audit@v1',
    lines: [
      [{ t: '- uses: ', c: 'm' }, { t: 'hsentinel/audit@v1', c: 's' }],
      [{ t: '  with:', c: 'm' }],
      [{ t: '    app: ', c: 'm' }, { t: 'staging.paie-express.app', c: 's' }],
      [{ t: '    modules: ', c: 'm' }, { t: 'qa,pentest', c: 's' }],
    ],
  },
]

const SEG_CLASS = { k: 'text-[#b45309]', s: 'text-[#1e3a8a]', f: 'text-steel', m: 'text-[#6b21a8]' }

const RESULT = ['Explorateur · 27 pages', 'Rejeu HTTP · 41 requêtes', 'Vérificateur · navigateur', '1 faille prouvée']

export function TriggerCard() {
  const [tab, setTab] = useState(TABS[0].id)
  const [copied, setCopied] = useState(false)
  const step = useLoopStep(RESULT.length, 850, 2800)
  const active = TABS.find((t) => t.id === tab) ?? TABS[0]

  const copy = async () => {
    await navigator.clipboard?.writeText(active.copy).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div className="h-rise overflow-hidden rounded-2xl border border-border bg-secondary [animation-delay:200ms]">
      <div className="flex items-center justify-between px-3 pt-2">
        <div role="tablist" aria-label="Déclencheur" className="flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative px-2.5 py-2 text-[12.5px] transition-colors outline-none focus-visible:text-foreground',
                tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-foreground transition-opacity',
                  tab === t.id ? 'opacity-100' : 'opacity-0',
                )}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copié' : 'Copier la commande'}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      </div>

      <div className="m-1.5 mt-0 rounded-xl border border-border bg-background">
        <pre className="min-h-[148px] overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.85]" role="tabpanel">
          <code key={active.id} className="block animate-in fade-in duration-300">
            {active.lines.map((line, i) => (
              <span key={i} className="block">
                {line.map((seg, j) => (
                  <span key={j} className={seg.c ? SEG_CLASS[seg.c] : 'text-foreground'}>
                    {seg.t}
                  </span>
                ))}
              </span>
            ))}
          </code>
        </pre>

        <ol aria-label="Exécution de l’audit" className="flex flex-col gap-1.5 border-t border-border px-5 py-4">
          {RESULT.map((label, i) => {
            const done = step > i
            const last = i === RESULT.length - 1
            return (
              <li
                key={label}
                className={cn(
                  'flex items-center gap-2.5 font-mono text-[11.5px] transition-all duration-500',
                  done ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-30',
                  done && last ? 'text-danger' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'size-1.5 rounded-full transition-colors duration-500',
                    done ? (last ? 'bg-danger' : 'bg-foreground') : 'bg-border',
                    step === i && 'h-pulse bg-steel',
                  )}
                />
                {label}
                {step === i ? <span className="h-caret text-foreground">▍</span> : null}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
