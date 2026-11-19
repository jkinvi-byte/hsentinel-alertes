'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, FileText, Mail, Repeat, Send } from 'lucide-react'
import type { Finding } from '@/lib/audit-types'
import { cn } from '@/lib/utils'

type PanelId = 'replay' | 'report'

export function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState<PanelId | null>(null)
  const toggle = (id: PanelId) => setOpen((cur) => (cur === id ? null : id))

  return (
    <article
      aria-labelledby={`finding-${finding.id}`}
      className="overflow-hidden rounded-md border border-danger/25 border-l-[3px] border-l-danger bg-danger-soft"
    >
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border border-danger/50 bg-danger/10 px-1.5 font-mono text-[10px] leading-[18px] font-semibold uppercase tracking-wider text-danger">
            Faille prouvée · {finding.severity}
          </span>
          {finding.href ? (
            <Link href={finding.href} className="font-mono text-[10.5px] text-steel hover:underline">
              {finding.id} · diagnostic
            </Link>
          ) : (
            <span className="font-mono text-[10.5px] text-muted-foreground">{finding.id}</span>
          )}
        </div>
        <h3 id={`finding-${finding.id}`} className="text-[15px] leading-snug font-semibold text-foreground">
          {finding.title}
        </h3>
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">{finding.summary}</p>
        <code className="w-fit rounded border border-border bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground">
          {finding.endpoint}
        </code>
      </div>

      <PanelToggle id="replay" label="Replay" icon={<Repeat className="size-3.5" aria-hidden="true" />} open={open === 'replay'} onToggle={toggle} findingId={finding.id} />
      {open === 'replay' ? (
        <div id={`${finding.id}-replay`} className="grid gap-px border-t border-border bg-border md:grid-cols-2">
          <CodeBlock label="Requête rejouée" content={finding.replay.request} />
          <CodeBlock label={finding.replay.responseLabel ?? 'Réponse'} content={finding.replay.response} />
        </div>
      ) : null}

      <PanelToggle id="report" label="Rapport" icon={<FileText className="size-3.5" aria-hidden="true" />} open={open === 'report'} onToggle={toggle} findingId={finding.id} />
      {open === 'report' ? (
        <ul id={`${finding.id}-report`} className="flex flex-col gap-1.5 border-t border-border px-4 py-3">
          {finding.report.map((line) => {
            const [label, ...rest] = line.split(' : ')
            return (
              <li key={line} className="text-[12.5px] leading-relaxed">
                <span className="font-semibold text-foreground">{label}</span>
                {rest.length ? <span className="text-muted-foreground"> : {rest.join(' : ')}</span> : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      <AlertsRow alerts={finding.alerts} />
    </article>
  )
}

function AlertsRow({ alerts }: { alerts: Finding['alerts'] }) {
  if (!alerts.ticket && !alerts.email) {
    return (
      <p className="flex items-center gap-1.5 border-t border-border px-4 py-2.5 font-mono text-[10.5px] text-muted-foreground">
        <Send className="size-3" aria-hidden="true" />
        Aucune alerte envoyée pour cette faille.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-1.5 border-t border-border px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="flex items-center gap-1.5 label-mono">
          <Send className="size-3" aria-hidden="true" />
          Alertes
        </span>
        {alerts.ticket ? (
        <a
          href={alerts.ticket.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-0.5 text-[12px] text-foreground transition-colors hover:border-steel/50 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <GithubMark className="size-3.5" />
          Ticket GitHub
          <span className="font-mono text-[11px] text-steel">#{alerts.ticket.id}</span>
          <ArrowUpRight className="size-3 text-subtle" aria-hidden="true" />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
        ) : null}
        {alerts.email ? (
        <span className="inline-flex items-center gap-1.5 rounded border border-border bg-muted px-2 py-0.5 text-[12px] text-foreground">
          <Mail className="size-3.5" aria-hidden="true" />
          E-mail envoyé
          <span className="font-mono text-[10.5px] text-muted-foreground">via {alerts.email.via}</span>
          <Check className="size-3 text-safe" aria-label="envoyé" />
        </span>
        ) : null}
      </div>
      <p className="font-mono text-[10.5px] text-muted-foreground">
        Un seul ticket par faille, sans aucune donnée sensible.
      </p>
    </div>
  )
}

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

type PanelToggleProps = {
  id: PanelId
  label: string
  icon: React.ReactNode
  open: boolean
  findingId: string
  onToggle: (id: PanelId) => void
}

function PanelToggle({ id, label, icon, open, findingId, onToggle }: PanelToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={`${findingId}-${id}`}
      onClick={() => onToggle(id)}
      className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-[12.5px] font-medium transition-colors hover:bg-foreground/[0.03] focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden="true" />
    </button>
  )
}

function CodeBlock({ label, content }: { label: string; content: string }) {
  return (
    <div className="flex min-w-0 flex-col bg-background">
      <p className="border-b border-border px-3 py-1.5 label-mono">{label}</p>
      <pre className="overflow-x-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed text-foreground/90">{content}</pre>
    </div>
  )
}
