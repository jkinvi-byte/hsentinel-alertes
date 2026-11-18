import { Hero } from '@/components/landing/hero'
import { AgentsSection, HowItWorksSection, ProblemSection, SiteFooter } from '@/components/landing/sections'
import { SiteHeader } from '@/components/landing/site-header'
import { hasSession } from '@/lib/session'

export default async function HomePage() {
  const signedIn = await hasSession()
  return <div className="min-h-dvh bg-background">
    <SiteHeader signedIn={signedIn} />
    <main><Hero signedIn={signedIn} /><ProblemSection /><HowItWorksSection /><AgentsSection /></main>
    <SiteFooter />
  </div>
}
