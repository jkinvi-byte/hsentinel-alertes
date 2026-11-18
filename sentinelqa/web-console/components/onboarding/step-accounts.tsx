'use client'

import { Lock, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StepHeader, inputClass } from './fields'

export type TestAccount = {
  key: string
  code: string
  company: string
  role: string
  email: string
  password: string
}

type Props = {
  accounts: TestAccount[]
  onChange: (accounts: TestAccount[]) => void
}

const cellInput = cn(inputClass, 'h-7 bg-transparent text-[12.5px]')

export function StepAccounts({ accounts, onChange }: Props) {
  function update(key: string, patch: Partial<TestAccount>) {
    onChange(accounts.map((account) => (account.key === key ? { ...account, ...patch } : account)))
  }

  function add() {
    const used = new Set(accounts.map((account) => account.code))
    const code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((letter) => !used.has(letter)) ?? '?'
    onChange([...accounts, { key: crypto.randomUUID(), code, company: '', role: '', email: '', password: '' }])
  }

  function remove(key: string) {
    onChange(accounts.filter((account) => account.key !== key))
  }

  return (
    <section aria-labelledby="step-title">
      <StepHeader
        index={2}
        title="Comptes de test"
        description="Au moins deux entreprises distinctes : les agents tentent d’accéder aux données de l’une avec la session de l’autre."
      />
      <div className="flex flex-col gap-3 px-5 py-5">
        <div className="flex items-start gap-2 rounded-md border border-steel/25 bg-steel/[0.06] px-3 py-2">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-steel" aria-hidden="true" />
          <p className="font-mono text-[11px] leading-relaxed text-foreground">
            Mots de passe chiffrés dans votre navigateur · coffre H · préproduction et comptes de test uniquement · aucune donnée réelle.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-white/[0.02]">
              <tr className="border-b border-border">
                <th scope="col" className="w-10 px-3 py-2 label-mono font-normal">
                  ID
                </th>
                <th scope="col" className="px-2 py-2 label-mono font-normal">
                  Entreprise
                </th>
                <th scope="col" className="px-2 py-2 label-mono font-normal">
                  Rôle
                </th>
                <th scope="col" className="px-2 py-2 label-mono font-normal">
                  E-mail
                </th>
                <th scope="col" className="px-2 py-2 label-mono font-normal">
                  Mot de passe
                </th>
                <th scope="col" className="w-10 px-2 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.key} className="border-b border-border last:border-0 hover:bg-white/[0.015]">
                  <td className="px-3 py-1.5">
                    <span className="inline-flex size-6 items-center justify-center rounded border border-border font-mono text-[11px] text-white">
                      {account.code}
                    </span>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      aria-label={`Entreprise du compte ${account.code}`}
                      value={account.company}
                      onChange={(event) => update(account.key, { company: event.target.value })}
                      placeholder="Alpha"
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      aria-label={`Rôle du compte ${account.code}`}
                      value={account.role}
                      onChange={(event) => update(account.key, { role: event.target.value })}
                      placeholder="Admin"
                      className={cellInput}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      aria-label={`E-mail du compte ${account.code}`}
                      type="email"
                      autoComplete="off"
                      spellCheck={false}
                      value={account.email}
                      onChange={(event) => update(account.key, { email: event.target.value })}
                      placeholder="admin@alpha.test"
                      className={cn(cellInput, 'font-mono text-[11.5px]')}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      aria-label={`Mot de passe du compte ${account.code}`}
                      type="password"
                      autoComplete="new-password"
                      value={account.password}
                      onChange={(event) => update(account.key, { password: event.target.value })}
                      placeholder="••••••••"
                      className={cn(cellInput, 'font-mono text-[11.5px]')}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => remove(account.key)}
                      disabled={accounts.length <= 2}
                      className="inline-flex size-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-white/[0.06] hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">Supprimer le compte {account.code}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={add}
            className="inline-flex h-7 items-center gap-1.5 rounded-md border border-dashed border-input px-2.5 text-[12.5px] text-foreground transition-colors hover:border-steel/60 hover:bg-white/[0.03]"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Ajouter un compte
          </button>
          <p className="font-mono text-[11px] text-muted-foreground">
            {accounts.length} comptes · {new Set(accounts.map((a) => a.company.trim().toLowerCase()).filter(Boolean)).size} entreprises
          </p>
        </div>
      </div>
    </section>
  )
}
