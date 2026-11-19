import { CreditCard, KeyRound, LogOut, Mail, ShieldCheck, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { logout } from '@/app/actions'
import { Card, PageHeader, primaryButton, secondaryButton } from '@/components/console/page-header'
import { applications, chargerConsole, couts, indicateurs } from '@/lib/console-reel'

export const metadata: Metadata = {
  title: 'Mon compte — HSentinel',
  description: 'Votre accès à la console HSentinel, votre équipe et ce que vos audits coûtent.',
}

const dollars = (n: number) => `${n.toFixed(2).replace('.', ',')} $`

export default async function AccountPage() {
  const d = await chargerConsole()
  const k = indicateurs(d)
  const c = couts(d)
  const semaine = [...d.missionsQa, ...d.missionsPentest].filter((m) => Date.parse(m.vue.createdAt) >= Date.now() - 7 * 86400000).length

  const usage = [
    { label: 'Applications autorisées', value: String(applications(d).length) },
    { label: 'Missions sur 7 jours', value: String(semaine) },
    { label: 'Failles ouvertes', value: String(k.failles) },
    { label: 'Coût mesuré sur 7 jours', value: dollars(c.semaine) },
  ]

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Console', href: '/app' }, { label: 'Mon compte' }]}
        title="Mon compte"
        description="Votre accès à la console, votre équipe et ce que vos audits coûtent vraiment."
        actions={
          <form action={logout}>
            <button type="submit" className={secondaryButton}>
              <LogOut className="size-3.5" aria-hidden="true" />
              Se déconnecter
            </button>
          </form>
        }
      />

      <main className="grid items-start gap-5 px-5 py-6 lg:grid-cols-2 lg:px-8">
        <Card title="Profil">
          <dl className="flex flex-col">
            {[
              { icon: Users, label: 'Équipe', value: 'Équipe HSentinel' },
              { icon: ShieldCheck, label: 'Rôle', value: 'Opérateur : lance les missions, lit les preuves' },
              { icon: KeyRound, label: 'Authentification', value: 'Code d’équipe · session de 8 h' },
              { icon: Mail, label: 'Alertes', value: 'Ticket GitHub et e-mail, envoyés par n8n' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <Icon className="size-4 shrink-0 text-subtle" aria-hidden="true" />
                <dt className="w-32 shrink-0 text-[12px] text-muted-foreground">{label}</dt>
                <dd className="min-w-0 text-[12.5px] text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Abonnement">
          <div className="flex flex-col gap-4 px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-md border border-steel/40 bg-steel/10">
                  <CreditCard className="size-4 text-steel" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Aucune offre souscrite</p>
                  <p className="font-mono text-[10.5px] text-subtle">accès d’équipe · audits payés au coût réel de l’API H</p>
                </div>
              </div>
              <Link href="/tarifs" className={primaryButton}>
                Voir les offres
              </Link>
            </div>
            <ul className="flex flex-col">
              {usage.map((u) => (
                <li key={u.label} className="flex justify-between gap-3 border-b border-border py-2 text-[12px] last:border-0">
                  <span className="text-muted-foreground">{u.label}</span>
                  <span className="font-mono text-foreground tabular-nums">{u.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </main>
    </>
  )
}
