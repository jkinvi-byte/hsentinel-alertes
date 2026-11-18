'use client'

import { Plus, RefreshCw, X } from 'lucide-react'
import type { TestAccount } from '@/lib/mission-types'

type Props = {
  value: TestAccount; onChange: (value: TestAccount) => void; disabled: boolean;
  keyLoading: boolean; keyAvailable: boolean; keyError?: string; onRefresh: () => void;
}

export function MissionAccount({ value, onChange, disabled, keyLoading, keyAvailable, keyError, onRefresh }: Props) {
  return <fieldset disabled={disabled} className="space-y-4 border-t border-border pt-5">
    <legend className="px-1 text-sm font-medium">Compte de test</legend>
    <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground" role={keyError ? 'alert' : 'status'}>
        {keyLoading ? 'Vérification de la disponibilité…' : keyError || (keyAvailable
          ? 'Connexion chiffrée disponible. Le mot de passe sera utilisé uniquement pour cette mission.'
          : 'Le service QA connecté n’est pas prêt. Actualisez après son démarrage.')}
      </p>
      {!keyAvailable && <button className="console-button" type="button" disabled={keyLoading} onClick={onRefresh}>
        <RefreshCw className="size-3.5" aria-hidden="true" />Actualiser la disponibilité
      </button>}
    </div>
    <label className="block space-y-2 text-sm">
      <span>Adresse du compte de test</span>
      <input className="console-field" type="email" required maxLength={254} autoComplete="off" autoCapitalize="none" spellCheck={false}
        value={value.identifiant} onChange={e => onChange({ ...value, identifiant: e.target.value })} placeholder="compte@example.fr" />
    </label>
    <label className="block space-y-2 text-sm">
      <span>Mot de passe du compte de test</span>
      <input className="console-field" type="password" required autoComplete="off"
        value={value.motDePasse} onChange={e => onChange({ ...value, motDePasse: e.target.value })} />
    </label>
    <div className="space-y-3">
      <p id="identity-help" className="text-xs leading-relaxed text-muted-foreground">Pour vérifier que l’agent ouvre le bon compte, indiquez jusqu’à trois noms ou libellés attendus à l’écran.</p>
      {value.identite.map((name, i) => <div className="flex items-end gap-2" key={i}>
        <label className="block min-w-0 flex-1 space-y-2 text-sm"><span>Nom attendu à l’écran {i + 1}</span>
          <input className="console-field" maxLength={120} autoComplete="off" aria-describedby="identity-help" value={name}
            onChange={e => onChange({ ...value, identite: value.identite.map((v, index) => index === i ? e.target.value : v) })} placeholder="Ex. : Camille" />
        </label>
        {value.identite.length > 1 && <button className="console-button mb-0.5" type="button" aria-label={`Retirer le nom attendu ${i + 1}`}
          onClick={() => onChange({ ...value, identite: value.identite.filter((_, index) => index !== i) })}><X className="size-4" aria-hidden="true" /></button>}
      </div>)}
      {value.identite.length < 3 && <button type="button" className="console-button" onClick={() => onChange({ ...value, identite: [...value.identite, ''] })}>
        <Plus className="size-3.5" aria-hidden="true" />Ajouter un nom attendu
      </button>}
    </div>
  </fieldset>
}
