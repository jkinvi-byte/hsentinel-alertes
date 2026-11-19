'use client'

import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { type DemoState, requestDemo } from '@/app/(site)/demo/actions'

const field =
  'h-11 w-full rounded-xl border border-border bg-background px-3.5 text-[15px] outline-none transition-shadow placeholder:text-subtle focus:border-foreground/30 focus:ring-4 focus:ring-ring/15'

export function DemoForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action, pending] = useActionState<DemoState, FormData>(requestDemo, { status: 'idle' })

  if (state.status === 'success') {
    return (
      <div role="status" className="flex flex-col items-start gap-4 rounded-[24px] border border-border bg-background p-8">
        <CheckCircle2 className="size-8 text-safe" aria-hidden="true" />
        <h2 className="font-heading text-[26px] font-semibold tracking-tight">Demande reçue.</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Nous vous écrivons à <strong className="font-medium text-foreground">{state.email}</strong> pour planifier 30
          minutes sur votre préproduction.
        </p>
        <Link href="/signup" className="text-[15px] font-medium underline-offset-4 hover:underline">
          En attendant, démarrer l’essai de 7 jours <span aria-hidden="true">→</span>
        </Link>
      </div>
    )
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-[24px] border border-border bg-background p-6 shadow-[0_30px_80px_-50px_rgb(10_15_28/0.45)] md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
          Nom complet
          <input name="name" required autoComplete="name" className={field} placeholder="Camille Durand" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
          E-mail professionnel
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={defaultEmail}
            className={field}
            placeholder="vous@entreprise.fr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
          Entreprise
          <input name="company" required autoComplete="organization" className={field} placeholder="Paie Express" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
          Taille de l’équipe
          <select name="size" required defaultValue="" className={field}>
            <option value="" disabled>
              Sélectionner
            </option>
            <option value="1-9">1 à 9 personnes</option>
            <option value="10-50">10 à 50 personnes</option>
            <option value="51-200">51 à 200 personnes</option>
            <option value="200+">Plus de 200 personnes</option>
          </select>
        </label>
      </div>
      {/* Piège à robots : invisible et ignoré par un humain, rempli par un script. */}
      <input type="text" name="site" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        Votre contexte <span className="font-normal text-muted-foreground">(facultatif)</span>
        <textarea
          name="message"
          rows={3}
          className={`${field} h-auto resize-none py-3`}
          placeholder="Ex. : SaaS de paie multi-entreprises, prochain audit client en mars."
        />
      </label>
      {state.status === 'error' ? (
        <p role="alert" className="text-[14px] text-danger">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-full bg-foreground text-[15px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {pending ? 'Envoi…' : 'Demander ma démo'}
      </button>
      <p className="text-[12.5px] text-muted-foreground">
        Aucun accès à la production demandé. Réponse sous un jour ouvré.
      </p>
    </form>
  )
}
