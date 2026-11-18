'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

export const inputClass =
  'h-8 w-full rounded-md border border-input bg-[#0d1119] px-2.5 text-[13px] text-foreground placeholder:text-subtle transition-colors focus-visible:border-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-steel/30 disabled:opacity-60'

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label-mono">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function StepHeader({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
      <p className="label-mono text-subtle">Étape {index} sur 5</p>
      <h2 className="text-[17px] font-bold tracking-tight text-white">{title}</h2>
      <p className="text-[13px] text-muted-foreground text-pretty">{description}</p>
    </div>
  )
}

export function CopyButton({ value, label = 'Copier' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border bg-white/[0.03] px-2.5 text-[12px] text-foreground transition-colors hover:bg-white/[0.07]"
    >
      {copied ? <Check className="size-3.5 text-safe" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copié' : label}</span>
    </button>
  )
}

export function Toggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  labelledBy: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors',
        checked ? 'border-steel bg-steel' : 'border-input bg-white/[0.06]',
      )}
    >
      <span
        className={cn(
          'inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}
