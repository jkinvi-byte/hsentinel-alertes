import { redirect } from 'next/navigation'
import { getSidebarCollapsed, hasSession } from '@/lib/session'
import { Sidebar } from './sidebar'

export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect('/login')
  const collapsed = await getSidebarCollapsed()

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar initialCollapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
