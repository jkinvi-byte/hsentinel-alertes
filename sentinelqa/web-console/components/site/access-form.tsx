'use client'

import { CheckCircle2 } from 'lucide-react'
import { useActionState } from 'react'
import { type AccessState, requestAccess } from '@/app/signup/actions'

const inputClass =
  'h-10 rounded-md border border-input bg-foreground/[0.02] px-3 text-[13.5px] text-foreground outline-none placeholder:text-subtle focus-visible:border-steel focus-visible:ring-2 focus-visible:ring-steel/30'

// D-50 : le formulaire d'accès d'essai. Il enregistre la demande ; l'équipe la reçoit par e-mail (n8n, W5).
export function AccessForm() {
  const [state, action, pending] = useActionState<AccessState, FormData>(requestAccess, { status: 'idle' })

  if (state.status === 'success') {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6">
        <CheckCircle2 className="size-7 text-safe" aria-hidden="true" />
        <h2 className="text-[20px] font-semibold tracking-tight text-foreground">Demande enregistrée.</h2>
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          L’équipe vous écrit à <strong className="font-medium text-foreground">{state.email}</strong> pour ouvrir votre accès et
          cadrer votre préproduction. Les 7 jours d’essai démarrent à l’ouverture.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-[12.5px] font-medium text-foreground">
          Nom complet
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required placeholder="Camille Roux" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[12.5px] font-medium text-foreground">
          E-mail professionnel
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="vous@entreprise.fr" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="company" className="text-[12.5px] font-medium text-foreground">
          Entreprise
        </label>
        <input id="company" name="company" type="text" autoComplete="organization" required placeholder="Paie Express" className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-[12.5px] font-medium text-foreground">
          Votre application <span className="font-normal text-subtle">(facultatif)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={2000}
          placeholder="Ex. : SaaS de paie multi-entreprises, préproduction sur Vercel."
          className={`${inputClass} h-auto resize-none py-2.5`}
        />
      </div>
      {/* Piège à robots : invisible et ignoré par un humain, rempli par un script. */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state.status === 'error' ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-steel text-[13.5px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-steel/50 focus-visible:outline-none disabled:opacity-60"
      >
        {pending ? 'Envoi…' : 'Demander mon accès'}
      </button>
      <p className="text-[11.5px] leading-relaxed text-subtle">
        Pas encore de compte en libre-service : chaque accès est ouvert par l’équipe, avec l’autorisation écrite de tester votre
        application. HSentinel n’attaque que la préproduction que vous déclarez.
      </p>
    </form>
  )
}
