import { Check, ChevronRight, Search, TriangleAlert, X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/console/page-header'
import { formatAge, formatDateTime, type DiagnosticFinding } from '@/lib/console-data'
import { chargerConsole, failles } from '@/lib/console-reel'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Résultats — HSentinel',
  description: 'Toutes les failles prouvées par vos agents, avec rejeu, détails et chronologie.',
}

type FilterKey = 'statut' | 'gravite' | 'app' | 'module'
type Filters = Partial<Record<FilterKey | 'q', string>>

type Group = { key: FilterKey; label: string; field: keyof DiagnosticFinding; options: { value: string; label: string }[] }

function groupes(findings: DiagnosticFinding[]): Group[] {
  return [
  {
    key: 'statut',
    label: 'Statut',
    field: 'status',
    options: [
      { value: 'ouverte', label: 'Ouvertes' },
      { value: 'corrigée', label: 'Corrigées' },
    ],
  },
  {
    key: 'gravite',
    label: 'Gravité',
    field: 'severity',
    options: [
      { value: 'critique', label: 'Critique' },
      { value: 'élevée', label: 'Élevée' },
      { value: 'moyenne', label: 'Moyenne' },
      { value: 'faible', label: 'Faible' },
    ],
  },
  {
    key: 'app',
    label: 'Application',
    field: 'app',
    options: [...new Set(findings.map((f) => f.app))].map((app) => ({ value: app, label: app })),
  },
  {
    key: 'module',
    label: 'Module',
    field: 'module',
    options: [
      { value: 'Pentest', label: 'Pentest' },
      { value: 'QA', label: 'QA' },
    ],
  },
  ]
}

function matches(f: DiagnosticFinding, filters: Filters, groups: Group[], ignore?: FilterKey) {
  for (const group of groups) {
    const value = filters[group.key]
    if (group.key !== ignore && value && f[group.field] !== value) return false
  }
  const q = filters.q?.trim().toLowerCase()
  if (q && ![f.title, f.id, f.endpoint, f.app].some((v) => v.toLowerCase().includes(q))) return false
  return true
}

function hrefWith(filters: Filters, key: FilterKey, value?: string) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...filters, [key]: value })) if (v) params.set(k, v)
  const query = params.toString()
  return query ? `/app/diagnostic?${query}` : '/app/diagnostic'
}

export default async function DiagnosticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const filters: Filters = {}
  for (const key of ['statut', 'gravite', 'app', 'module', 'q'] as const) {
    const v = raw[key]
    if (typeof v === 'string' && v) filters[key] = v
  }
  const findings = failles(await chargerConsole())
  const groups = groupes(findings)
  const results = findings.filter((f) => matches(f, filters, groups))
  const active = Object.values(filters).some(Boolean)

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Résultats' }]}
        title="Vos résultats"
        description="Chaque faille prouvée, avec le rejeu de ce que l’agent a vu, les actions menées et son ticket."
      />
      <main className="lv-contenu flex flex-col gap-4">
        <section aria-label="Filtres" className="flex flex-col gap-4 border-b border-border pb-5">
          <form action="/app/diagnostic" className="flex items-center gap-2">
            {groups.map((g) => (filters[g.key] ? <input key={g.key} type="hidden" name={g.key} value={filters[g.key]} /> : null))}
            <label className="flex h-10 min-w-0 max-w-[460px] flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:border-steel">
              <Search className="size-3.5 text-subtle" aria-hidden="true" />
              <span className="sr-only">Rechercher une faille</span>
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Rechercher par titre, identifiant ou endpoint…"
                className="h-full w-full min-w-0 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-subtle"
              />
            </label>
            <button type="submit" className="lv-bouton lv-bouton-trait">
              Rechercher
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
            {groups.map((g) => (
              <div key={g.key} role="group" aria-label={g.label} className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11.5px] text-muted-foreground">{g.label}</span>
                {[{ value: undefined, label: 'Tous' }, ...g.options].map((o) => {
                  const selected = filters[g.key] === o.value
                  const count = findings.filter((f) => matches(f, { ...filters, [g.key]: o.value }, groups, o.value ? undefined : g.key)).length
                  return (
                    <Link
                      key={o.label}
                      href={hrefWith(filters, g.key, o.value)}
                      aria-current={selected ? 'true' : undefined}
                      scroll={false}
                      className={cn(
                        'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] transition-colors',
                        selected
                          ? 'border-blue-soft bg-blue-soft font-medium text-steel'
                          : 'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground',
                        count === 0 && !selected && 'opacity-50',
                      )}
                    >
                      {o.label}
                      <span className="tabular-nums text-[10.5px] opacity-70">{count}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>
            {results.length} faille{results.length > 1 ? 's' : ''} sur {findings.length}
          </span>
          {active ? (
            <Link href="/app/diagnostic" className="inline-flex items-center gap-1 text-steel hover:underline">
              <X className="size-3.5" aria-hidden="true" />
              Réinitialiser les filtres
            </Link>
          ) : null}
        </div>

        {results.length === 0 ? (
          <div className="lv-vide">
            <span className="lv-vide-icone"><Search aria-hidden="true" /></span>
            <div>
              <strong>{findings.length ? 'Aucune faille ne correspond à ces filtres' : 'Aucune faille prouvée pour l’instant'}</strong>
              <p>{findings.length ? 'Élargissez la recherche ou réinitialisez les filtres.' : 'Chaque faille prouvée par un audit apparaîtra ici, avec ses preuves et son ticket.'}</p>
            </div>
          </div>
        ) : (
          <ul className="lv-lignes">
            {results.map((f) => (
              <li key={f.id}>
                <Link href={`/app/diagnostic/${f.id}`} className="lv-ligne">
                  <span className="lv-ligne-icone" data-ton={f.status === 'ouverte' ? 'alerte' : 'sur'}>
                    {f.status === 'ouverte' ? <TriangleAlert aria-hidden="true" /> : <Check aria-hidden="true" />}
                  </span>
                  <span className="lv-ligne-texte">
                    <strong>{f.title}</strong>
                    <small>{f.app} · {f.module} · détectée le {formatDateTime(f.detectedAt)} · <span className="font-mono">{f.id.slice(0, 8)}</span></small>
                  </span>
                  <span className="lv-pill" data-ton={f.status === 'ouverte' ? 'alerte' : 'sur'}>
                    {f.status === 'ouverte' ? `${f.severity} · ouverte depuis ${formatAge(f.detectedAt)}` : `corrigée en ${formatAge(f.detectedAt, f.resolvedAt)}`}
                  </span>
                  <ChevronRight className="lv-ligne-chevron" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
