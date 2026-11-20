'use client'

import { KeyRound, Plus } from 'lucide-react'
import Link from 'next/link'

type Compte = { id: string; libelle: string; identifiant: string }

// D-56 : sur une application ajoutée, l'agent se connecte avec un compte de test déjà enregistré (chiffré pour le runner).
// Aucun mot de passe ne se retape ici. Sans compte, on oriente vers l'ajout plutôt que de bloquer.
export function MissionComptes({ appId, appNom, comptes, value, onChange, disabled }: {
  appId: string; appNom: string; comptes: Compte[]; value: string; onChange: (id: string) => void; disabled: boolean
}) {
  if (!comptes.length) {
    return (
      <div className="lv-note" data-ton="bleu" role="status">
        <KeyRound aria-hidden="true" />
        <span>{appNom} demande une connexion, et aucun compte de test n’est enregistré. Ajoutez-en un : il sera chiffré pour le runner, puis vous reviendrez ici.</span>
        <Link href={`/app/applications/${appId}#comptes`} className="lv-bouton lv-bouton-trait lv-bouton-petit"><Plus aria-hidden="true" />Ajouter un compte de test</Link>
      </div>
    )
  }
  return (
    <fieldset disabled={disabled} className="space-y-3 border-t border-border pt-5">
      <legend className="px-1 text-sm font-medium">Compte de test</legend>
      <div className="grid gap-2" role="radiogroup" aria-label={`Compte de test pour ${appNom}`}>
        {comptes.map((c) => (
          <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${value === c.id ? 'border-steel bg-steel/5' : 'border-border'}`}>
            <input type="radio" name="compte-enregistre" value={c.id} checked={value === c.id} onChange={() => onChange(c.id)} className="accent-[var(--steel)]" />
            <span className="min-w-0 flex-1"><span className="block font-medium">{c.libelle}</span><span className="block truncate text-xs text-muted-foreground">{c.identifiant}</span></span>
          </label>
        ))}
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Chiffré pour le runner ; l’agent ne voit jamais le mot de passe.</span>
        <Link href={`/app/applications/${appId}#comptes`} className="text-steel underline-offset-2 hover:underline">Gérer les comptes</Link>
      </p>
    </fieldset>
  )
}
