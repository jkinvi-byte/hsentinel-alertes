'use client'

import { FileText, Loader2, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CopyButton, Field, StepHeader, inputClass } from './fields'

export const OWNERSHIP_TOKEN = 'hsentinel-verify=7f3a9c2e41b8d6f05e2a'

type Props = {
  appUrl: string
  onAppUrlChange: (value: string) => void
  urlValid: boolean
  verified: boolean
  verifying: boolean
  onVerify: () => void
}

export function StepApplication({ appUrl, onAppUrlChange, urlValid, verified, verifying, onVerify }: Props) {
  const origin = urlValid ? new URL(appUrl).origin : 'https://votre-preprod.exemple'

  return (
    <section aria-labelledby="step-title">
      <StepHeader
        index={1}
        title="Application"
        description="L’environnement de préproduction que les agents vont explorer. Jamais la production."
      />
      <div className="flex flex-col gap-5 px-5 py-5">
        <Field id="app-url" label="URL de préproduction" hint={appUrl && !urlValid ? 'URL invalide : utilisez https://…' : undefined}>
          <input
            id="app-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={appUrl}
            onChange={(event) => onAppUrlChange(event.target.value)}
            placeholder="https://staging.paie-express.app"
            aria-invalid={appUrl.length > 0 && !urlValid}
            className={cn(inputClass, 'font-mono text-[12.5px]')}
          />
        </Field>

        <div className="rounded-lg border border-border bg-[#0d1119]">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <h3 className="text-[13px] font-semibold text-white">Preuve de propriété</h3>
            {verified ? (
              <span className="inline-flex items-center gap-1 rounded border border-safe/30 bg-safe/10 px-1.5 py-px font-mono text-[10.5px] text-safe">
                <ShieldCheck className="size-3" aria-hidden="true" />
                vérifié ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded border border-input px-1.5 py-px font-mono text-[10.5px] text-muted-foreground">
                <ShieldQuestion className="size-3" aria-hidden="true" />
                non vérifié
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 px-4 py-3.5">
            <p className="text-[12.5px] text-muted-foreground text-pretty">
              Déposez ce fichier à la racine de votre site. HSentinel n’audite que les applications dont vous prouvez la propriété.
            </p>

            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <FileText className="size-3.5 shrink-0 text-subtle" aria-hidden="true" />
              <code className="min-w-0 truncate font-mono text-[11.5px] text-foreground">
                <span className="text-subtle">{origin}</span>/.well-known/hsentinel.txt
              </code>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="label-mono" id="token-label">
                Contenu du fichier
              </span>
              <div className="flex items-center gap-2">
                <code
                  aria-labelledby="token-label"
                  className="min-w-0 flex-1 truncate rounded-md border border-border bg-background px-3 py-1.5 font-mono text-[12px] text-white"
                >
                  {OWNERSHIP_TOKEN}
                </code>
                <CopyButton value={OWNERSHIP_TOKEN} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
              <p className="text-[12px] text-muted-foreground" aria-live="polite">
                {verified
                  ? `Fichier trouvé sur ${new URL(appUrl).host} · jeton conforme.`
                  : verifying
                    ? 'Lecture du fichier…'
                    : 'Le bouton Continuer s’active après vérification.'}
              </p>
              <button
                type="button"
                onClick={onVerify}
                disabled={!urlValid || verifying || verified}
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-steel/50 bg-steel/10 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-steel/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {verifying ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
                {verified ? 'Vérifié' : verifying ? 'Vérification…' : 'Vérifier'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
