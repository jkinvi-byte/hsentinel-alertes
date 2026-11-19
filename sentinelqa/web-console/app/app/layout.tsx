import type { Viewport } from 'next'
import { AppShell } from '@/components/console/app-shell'
import { getConsoleTheme } from '@/lib/session'

export async function generateViewport(): Promise<Viewport> {
  const theme = await getConsoleTheme()
  return theme === 'dark' ? { colorScheme: 'dark', themeColor: '#0b0e14' } : { colorScheme: 'light', themeColor: '#f7f7f5' }
}

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
