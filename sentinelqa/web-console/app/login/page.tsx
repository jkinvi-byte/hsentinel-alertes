import { redirect } from 'next/navigation'
import { login } from '@/app/actions'
import { Logo } from '@/components/brand/logo'
import { hasSession } from '@/lib/session'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await hasSession()) redirect('/app')
  const { error } = await searchParams
  return <main className="flex min-h-dvh items-center justify-center px-5 py-10">
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <Logo href="/" />
      <form action={login} className="panel flex w-full flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold">Accès à la console</h1>
        <p className="text-sm text-muted-foreground">Retrouvez les missions et les preuves de votre équipe.</p>
        {error && <p role="alert" className="text-sm text-danger">{error === 'config' ? 'L’accès à la console doit être configuré par votre équipe.' : 'Ce code d’accès n’est pas reconnu.'}</p>}
        <label className="flex flex-col gap-2 text-sm">Code d’accès de l’équipe
          <input className="console-field" name="token" type="password" required autoComplete="current-password" />
        </label>
        <button type="submit" className="console-button primary">Ouvrir la console</button>
      </form>
    </div>
  </main>
}
