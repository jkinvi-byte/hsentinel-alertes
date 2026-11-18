import { redirect } from 'next/navigation'
import { hasSession } from '@/lib/session'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  if (!(await hasSession())) redirect('/login')
  return <div className="min-h-dvh bg-background">{children}</div>
}
