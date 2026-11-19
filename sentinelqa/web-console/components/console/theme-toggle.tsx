'use client'

import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { THEME_COOKIE, writePreferenceCookie, type ConsoleTheme } from '@/lib/plan'
import { cn } from '@/lib/utils'

const THEME_COLOR: Record<ConsoleTheme, string> = { light: '#f7f7f5', dark: '#0b0e14' }

export function useConsoleTheme(initialTheme: ConsoleTheme) {
  const [theme, setTheme] = useState(initialTheme)

  function changeTheme(next: ConsoleTheme) {
    setTheme(next)
    writePreferenceCookie(THEME_COOKIE, next)
    const root = document.getElementById('console-root')
    if (root) root.dataset.theme = next
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[next])
  }

  return [theme, changeTheme] as const
}

const OPTIONS = [
  { id: 'light', label: 'Clair', icon: Sun },
  { id: 'dark', label: 'Sombre', icon: Moon },
] as const

type Props = { theme: ConsoleTheme; onChange: (theme: ConsoleTheme) => void; expanded: boolean }

export function ThemeToggle({ theme, onChange, expanded }: Props) {
  if (!expanded) {
    const next = theme === 'dark' ? 'light' : 'dark'
    const Icon = theme === 'dark' ? Sun : Moon
    return (
      <div className="flex justify-center px-1.5 pb-2">
        <button
          type="button"
          onClick={() => onChange(next)}
          aria-label={next === 'dark' ? 'Passer en mode sombre' : 'Passer en mode clair'}
          title={next === 'dark' ? 'Mode sombre' : 'Mode clair'}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-steel/60 focus-visible:outline-none"
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <div className="px-2 pb-2">
      <div
        role="radiogroup"
        aria-label="Thème de la console"
        className="grid grid-cols-2 gap-0.5 rounded-md border border-border bg-foreground/[0.03] p-0.5"
      >
        {OPTIONS.map((option) => {
          const selected = theme === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex h-7 items-center justify-center gap-1.5 rounded text-[12px] transition-colors focus-visible:ring-2 focus-visible:ring-steel/60 focus-visible:outline-none',
                selected ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <option.icon className="size-3.5" aria-hidden="true" />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
