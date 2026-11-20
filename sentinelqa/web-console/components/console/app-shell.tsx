import { redirect } from 'next/navigation'
import { resumeConsole } from '@/lib/console-reel'
import { getConsoleTheme, hasSession } from '@/lib/session'
import { Sidebar } from './sidebar'

// D-55 : l'espace connecté de la référence Lovable. Barre latérale fixe de 236 px (tiroir sur téléphone), contenu à droite.
export async function AppShell({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect('/login')
  const [theme, resume] = await Promise.all([getConsoleTheme(), resumeConsole()])

  return (
    <div id="console-root" data-theme={theme} className="theme-console min-h-dvh bg-background">
      <Sidebar initialTheme={theme} summary={{ openFindings: resume.faillesOuvertes }} />
      <div className="lv-main min-h-dvh">{children}</div>
    </div>
  )
}
