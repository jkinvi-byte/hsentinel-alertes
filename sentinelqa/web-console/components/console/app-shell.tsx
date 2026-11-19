import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { resumeConsole } from '@/lib/console-reel'
import { getConsoleTheme, getSidebarCollapsed, hasSession } from '@/lib/session'
import { Sidebar } from './sidebar'

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect('/login')
  const [collapsed, theme, resume, entetes] = await Promise.all([getSidebarCollapsed(), getConsoleTheme(), resumeConsole(), headers()])
  const telephone = entetes.get('sec-ch-ua-mobile') === '?1' || /Mobi|Android|iPhone|iPod/i.test(entetes.get('user-agent') ?? '')

  return (
    <div id="console-root" data-theme={theme} className="theme-console flex min-h-dvh bg-background">
      <Sidebar initialCollapsed={collapsed} initialDesktop={!telephone} initialTheme={theme} summary={{ openFindings: resume.faillesOuvertes, cost7d: resume.cout7j }} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
