import { redirect } from 'next/navigation'
import { getConsoleTheme, getSidebarCollapsed, hasSession } from '@/lib/session'
import { Sidebar } from './sidebar'

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect('/login')
  const [collapsed, theme] = await Promise.all([getSidebarCollapsed(), getConsoleTheme()])

  return (
    <div id="console-root" data-theme={theme} className="theme-console flex min-h-dvh bg-background">
      <Sidebar initialCollapsed={collapsed} initialTheme={theme} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
