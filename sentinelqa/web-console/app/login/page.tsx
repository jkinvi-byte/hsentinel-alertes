import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { login } from '@/app/actions'
import { Logo } from '@/components/brand/logo'
import { hasSession } from '@/lib/session'

export const metadata: Metadata = {
  title: 'Connexion — HSentinel',
  description: 'Connectez-vous à la console HSentinel.',
}

const inputClass =
  'h-9 rounded-md border border-input bg-foreground/[0.02] px-3 text-[13px] text-foreground outline-none placeholder:text-subtle focus-visible:border-steel focus-visible:ring-2 focus-visible:ring-steel/30'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await hasSession()) redirect('/app')
  const { error } = await searchParams

  return (
    <main className="theme-console flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <Logo href="/" />
        <form action={login} className="panel flex w-full flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-[18px] font-bold tracking-tight text-foreground">Connexion</h1>
            <p className="text-[12.5px] text-muted-foreground">Accédez à vos audits QA et Pentest.</p>
          </div>
          {error ? (
            <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
              {error === 'config' ? 'L’accès à la console doit être configuré par votre équipe.' : 'Ce code d’accès n’est pas reconnu.'}
            </p>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="token" className="label-mono">
              Code d’accès de l’équipe
            </label>
            <input id="token" name="token" type="password" autoComplete="current-password" required className={inputClass} />
          </div>
          <button
            type="submit"
            className="h-9 rounded-md bg-steel text-[13px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none"
          >
            Se connecter
          </button>
          <p className="text-center text-[12.5px] text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/signup" className="font-medium text-steel hover:underline">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
