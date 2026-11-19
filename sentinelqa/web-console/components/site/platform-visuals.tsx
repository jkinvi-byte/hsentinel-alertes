import { Check, FileCode2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MATRIX = {
  actions: ['Voir bulletins', 'Exporter', 'Modifier IBAN'],
  rows: [
    { role: 'Admin', expected: [true, true, true], actual: [true, true, true] },
    { role: 'Gestionnaire paie', expected: [true, true, false], actual: [true, true, false] },
    { role: 'Salarié', expected: [true, false, false], actual: [true, true, false] },
  ],
}

export function RoleMatrix() {
  return (
    <figure className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_24px_60px_-34px_rgb(0_0_0/0.25)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-2.5">
        <span className="font-mono text-[11.5px] text-muted-foreground">QA · déploiement 71a0e9b</span>
        <span className="rounded-full bg-danger/10 px-2 py-0.5 font-mono text-[10.5px] text-danger">1 régression</span>
      </div>
      <table className="w-full text-left text-[13px]">
        <caption className="sr-only">Droits attendus et observés par rôle</caption>
        <thead>
          <tr className="border-b border-border text-[11.5px] text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Rôle</th>
            {MATRIX.actions.map((a) => (
              <th key={a} className="px-4 py-2.5 text-center font-medium">
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MATRIX.rows.map((row) => (
            <tr key={row.role} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">{row.role}</td>
              {row.actual.map((allowed, i) => {
                const regression = allowed !== row.expected[i]
                return (
                  <td key={i} className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full',
                        regression ? 'bg-danger text-white' : allowed ? 'bg-safe/15 text-safe' : 'bg-secondary text-subtle',
                      )}
                    >
                      {allowed ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
                      <span className="sr-only">
                        {allowed ? 'autorisé' : 'refusé'}
                        {regression ? ', régression' : ''}
                      </span>
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="border-t border-border bg-danger/5 px-4 py-2.5 font-mono text-[11px] text-danger">
        Salarié peut désormais exporter tous les bulletins
      </figcaption>
    </figure>
  )
}

export function FindingReport() {
  return (
    <figure className="flex flex-col gap-4 rounded-2xl border border-border bg-background p-5 shadow-[0_24px_60px_-34px_rgb(0_0_0/0.25)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">Finding #482 · Pentest</span>
          <h3 className="text-[16px] font-semibold">Accès inter-entreprises aux bulletins</h3>
        </div>
        <span className="shrink-0 rounded-full bg-danger px-2.5 py-1 font-mono text-[10.5px] text-white">critique</span>
      </div>
      <pre className="overflow-x-auto rounded-xl bg-ink px-4 py-3 font-mono text-[11.5px] leading-relaxed text-white/80">
        <span className="text-[#8fb3ff]">GET</span> /companies/alpha/payslips{'\n'}
        <span className="text-white/45">Cookie: session=</span>
        <span className="text-[#f87171]">beta_user_17</span>
        {'\n'}
        <span className="text-[#4ade80]">← 200 OK</span> <span className="text-white/45">· 3 bulletins renvoyés</span>
      </pre>
      <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2.5 font-mono text-[11.5px]">
        <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate">app/api/payslips/route.ts:42</span>
        <span className="ml-auto shrink-0 text-muted-foreground">Code-Assisted</span>
      </div>
      <ol className="flex flex-col gap-1.5 text-[13px] text-muted-foreground">
        {['Se connecter en tant qu’utilisateur Bêta', 'Ouvrir /companies/alpha/payslips', 'Constater les salaires d’Alpha'].map(
          (step, i) => (
            <li key={step} className="flex gap-2.5">
              <span className="font-mono text-[11px] text-foreground">{i + 1}.</span>
              {step}
            </li>
          ),
        )}
      </ol>
    </figure>
  )
}

const INTEGRATIONS = ['GitHub Actions', 'GitLab CI', 'Webhook', 'Vercel', 'Slack', 'Jira', 'Linear', 'E-mail']

export function IntegrationChips() {
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Intégrations disponibles">
      {INTEGRATIONS.map((name) => (
        <li key={name} className="rounded-full bg-background px-4 py-2 text-[14px] ring-1 ring-border">
          {name}
        </li>
      ))}
    </ul>
  )
}
