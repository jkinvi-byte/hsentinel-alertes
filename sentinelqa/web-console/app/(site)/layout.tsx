import type { Viewport } from 'next'
import { AnnouncementBar } from '@/components/site/announcement-bar'
import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { hasSession } from '@/lib/session'

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await hasSession()
  return (
    <div className="theme-h flex min-h-dvh flex-col">
      <AnnouncementBar />
      <SiteHeader signedIn={signedIn} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
