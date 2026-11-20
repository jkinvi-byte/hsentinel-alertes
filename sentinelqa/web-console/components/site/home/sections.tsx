import { ArrowUpRight, Check, FileCode2, Lock, Eye, ShieldCheck, Server } from 'lucide-react'
import Link from 'next/link'
import { LivePipeline } from '@/components/landing/live-visuals'
import { LeakBrowser, Row } from '@/components/site/story'
import { Container, SectionHeading } from '../ui'

const SECTORS = ['SaaS RH et paie', 'Santé', 'LegalTech', 'Assurance', 'Immobilier', 'Éducation', 'Marketplaces B2B']

export function SectorStrip() {
  return (
    <section aria-label="Secteurs" className="border-y border-border bg-canvas py-6">
      <p className="mb-4 text-center text-[13px] text-muted-foreground">
        Conçu pour les SaaS multi-entreprises qui manipulent des données sensibles
      </p>
      <div className="fade-x overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="h-marquee flex w-max gap-12">
          {[...SECTORS, ...SECTORS].map((s, i) => (
            <li
              key={`${s}-${i}`}
              aria-hidden={i >= SECTORS.length}
              className="font-heading text-[20px] font-semibold tracking-tight whitespace-nowrap text-foreground/35"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const STATS = [
  { value: '59/60', label: 'failles détectées sur notre banc d’essai multi-entreprises' },
  { value: '0', label: 'faux positif : chaque alerte est confirmée dans un vrai navigateur' },
  { value: '< 10 min', label: 'par audit, déclenché automatiquement à chaque déploiement' },
  { value: '0', label: 'accès à la production, jamais, quel que soit le plan' },
]

export function StatsBand() {
  return (
    <section className="py-20 lg:py-24">
      <Container>
        <dl className="grid gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="h-reveal flex flex-col gap-3 bg-background p-7">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-heading text-[44px] leading-none font-semibold tracking-[-0.04em] tabular-nums">{s.value}</dd>
              <p className="text-[14px] leading-relaxed text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}

function TileQa() {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="rounded-full bg-background px-4 py-2.5 text-[13px] shadow-sm">18 parcours métier rejoués</span>
      <span className="ml-6 flex items-center gap-2.5 rounded-full bg-background px-4 py-2.5 text-[13px] shadow-md">
        0 régression de droits
        <span className="flex size-5 items-center justify-center rounded-full bg-safe text-white">
          <Check className="size-3" aria-hidden="true" />
        </span>
      </span>
    </div>
  )
}

function TilePentest() {
  const cells = ['ok', 'ok', 'ok', 'ok', 'bad', 'ok']
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-background p-3 shadow-md">
      <span className="text-[12px] font-medium">Matrice rôle × action</span>
      <div className="grid grid-cols-3 gap-1.5">
        {cells.map((c, i) => (
          <span
            key={i}
            className={
              c === 'bad'
                ? 'h-8 w-12 rounded-md bg-danger/15 ring-1 ring-danger/30'
                : 'h-8 w-12 rounded-md bg-safe/15'
            }
          />
        ))}
      </div>
    </div>
  )
}

function TileCode() {
  return (
    <div className="flex w-full max-w-[260px] flex-col gap-2 rounded-xl bg-background p-3 font-mono text-[11px] shadow-md">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <FileCode2 className="size-3.5" aria-hidden="true" />
        app/api/payslips/route.ts
      </span>
      <span className="rounded bg-danger/10 px-2 py-1 text-danger">42 · where id = params.id</span>
      <span className="rounded bg-safe/10 px-2 py-1 text-safe">piste : filtrer par company_id</span>
    </div>
  )
}

function TileAudit() {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-background p-3 shadow-md">
      <span className="text-[12px] font-medium">Audit Express · 14 jours</span>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className={i < 10 ? 'size-5 rounded bg-foreground' : 'size-5 rounded bg-border'} />
        ))}
      </div>
      <span className="font-mono text-[10.5px] text-muted-foreground">rapport + retest inclus</span>
    </div>
  )
}

const PRODUCTS = [
  { title: 'Agent QA', body: 'Chaque rôle obtient ce qu’il doit obtenir, à chaque pull request.', href: '/plateforme#qa', tile: <TileQa /> },
  { title: 'Agent Pentest', body: 'Rejoue chaque requête avec la session d’un autre client.', href: '/plateforme#pentest', tile: <TilePentest /> },
  { title: 'Code-Assisted', body: 'Lecture seule du dépôt : la piste cite le fichier concerné.', href: '/plateforme#preuves', tile: <TileCode /> },
  { title: 'Audit Express', body: 'Un pentest ciblé avant une signature ou un jalon de conformité.', href: '/tarifs', tile: <TileAudit /> },
]

export function ProductGrid() {
  return (
    <section className="py-20 lg:py-24">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="La plateforme"
          title="Une plateforme, quatre façons de prouver votre sécurité."
          body="Les agents partagent le même pipeline, la même console et les mêmes preuves. Activez ce dont votre équipe a besoin."
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <li key={p.title} className="h-reveal">
              <Link href={p.href} className="group flex h-full flex-col gap-4 outline-none">
                <div className="flex aspect-[4/3.4] items-center justify-center rounded-2xl bg-canvas p-6 ring-1 ring-border transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_24px_50px_-30px_rgb(10_15_28/0.35)] group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <div className="transition-transform duration-500 group-hover:scale-[1.04]">{p.tile}</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="flex items-center gap-1.5 font-heading text-[21px] font-semibold tracking-tight">
                    {p.title}
                    <ArrowUpRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="text-[14.5px] leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

const SHIFT = [
  ['Pentest une fois par an', 'Audit à chaque déploiement'],
  ['Scanner d’URL générique', 'Tests par entreprise et par rôle'],
  ['Rapport PDF de 80 pages', 'Requête rejouée et capture d’écran'],
  ['Faux positifs à trier', 'Alerte uniquement si la fuite est prouvée'],
  ['Accès production demandé', 'Préproduction uniquement'],
]

export function ShiftBlock() {
  return (
    <section className="py-8">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-7 py-14 md:px-14 md:py-20">
          <div aria-hidden="true" className="dot-grid-dark absolute inset-0" />
          <div
            aria-hidden="true"
            className="absolute -bottom-48 -left-24 size-[520px] rounded-full bg-[radial-gradient(circle,rgb(37_99_235/0.28),transparent_65%)]"
          />
          <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
            <SectionHeading
              dark
              eyebrow="Pourquoi maintenant"
              title="Vous livrez chaque semaine. Votre pentest, une fois par an."
              body="Entre deux audits, une seule requête mal filtrée suffit pour qu’un client lise les données d’un autre. HSentinel referme cet écart."
            />
            <div className="h-reveal grid grid-cols-2 overflow-hidden rounded-2xl ring-1 ring-ink-line">
              <div className="flex flex-col bg-white/[0.03]">
                <p className="border-b border-ink-line px-5 py-3 text-[13px] text-white/45">Hier</p>
                {SHIFT.map(([before]) => (
                  <p key={before} className="border-b border-dashed border-ink-line px-5 py-3.5 text-[13.5px] text-white/50 last:border-b-0">
                    {before}
                  </p>
                ))}
              </div>
              <div className="flex flex-col bg-[#2563eb]/15 ring-1 ring-[#2563eb]/50">
                <p className="border-b border-[#2563eb]/40 bg-[#2563eb] px-5 py-3 text-[13px] font-medium text-white">
                  Avec HSentinel
                </p>
                {SHIFT.map(([before, after]) => (
                  <p
                    key={before}
                    className="flex items-start gap-2 border-b border-dashed border-ink-line px-5 py-3.5 text-[13.5px] text-white last:border-b-0"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-[#8fb3ff]" aria-hidden="true" />
                    {after}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

export function HomeStory() {
  return (
    <>
      <Row
        eyebrow="Le problème"
        title="Le contrôle d’accès défaillant est la faille n°1 du Top 10 OWASP."
        body="Dans un SaaS multi-entreprises, il suffit de changer un identifiant dans une URL pour lire les bulletins d’un autre client. Les scanners voient des URL, pas des entreprises."
        link={{ href: '/solutions', label: 'Voir les cas d’usage' }}
        visual={<LeakBrowser />}
      />
      <Row
        eyebrow="Comment ça marche"
        title="Trois étapes. Une faille prouvée, ou rien."
        body="Un agent explore votre préproduction avec chaque rôle, notre code rejoue chaque requête avec la session d’une autre entreprise, puis un second agent confirme à l’écran."
        link={{ href: '/plateforme', label: 'Découvrir la plateforme' }}
        visual={<LivePipeline />}
        reverse
      />
    </>
  )
}

const USE_CASES = [
  {
    id: 'rh',
    sector: 'SaaS RH et paie',
    title: 'Les bulletins d’Alpha restent chez Alpha.',
    tone: 'bg-[#e8eefc]',
  },
  {
    id: 'sante',
    sector: 'Santé',
    title: 'Un cabinet ne lit jamais les dossiers d’un autre.',
    tone: 'bg-[#f6ece6]',
  },
]

export function UseCases() {
  return (
    <section className="bg-canvas py-20 lg:py-24">
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Solutions"
            title="Là où une fuite entre clients coûte le plus cher."
          />
          <Link href="/solutions" className="text-[15px] font-medium underline-offset-4 hover:underline">
            Toutes les solutions <span aria-hidden="true">→</span>
          </Link>
        </div>
        <ul className="grid gap-5 md:grid-cols-2">
          {USE_CASES.map((u) => (
            <li key={u.id} className="h-reveal">
              <Link
                href={`/solutions#${u.id}`}
                className={`group flex h-full min-h-[300px] flex-col justify-between rounded-2xl p-7 ring-1 ring-border transition-transform duration-300 hover:-translate-y-1 ${u.tone}`}
              >
                <span className="w-fit rounded-full bg-background/70 px-3 py-1 text-[12.5px] text-muted-foreground">
                  {u.sector}
                </span>
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-heading text-[26px] leading-[1.1] font-semibold tracking-tight text-balance">{u.title}</h3>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

const TRUST = [
  { icon: Server, title: 'Préproduction uniquement', body: 'Nos agents ne touchent jamais à votre production.' },
  { icon: ShieldCheck, title: 'Propriété vérifiée', body: 'Nous n’auditons que les domaines dont vous prouvez la propriété.' },
  { icon: Eye, title: 'Preuve avant alerte', body: 'Pas de capture, pas de requête rejouée : pas d’alerte.' },
  { icon: Lock, title: 'Lecture seule', body: 'L’option Code-Assisted lit votre dépôt, sans jamais l’écrire.' },
]

export function TrustRow() {
  return (
    <section className="py-20 lg:py-24">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          eyebrow="Sécurité et confiance"
          title="Un outil de sécurité doit d’abord être sûr."
          body="Les mêmes garanties pour tous les plans, documentées et vérifiables."
        />
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((t) => (
            <li key={t.title} className="h-reveal flex flex-col gap-3 border-t border-foreground pt-5">
              <t.icon className="size-5" aria-hidden="true" />
              <h3 className="text-[16px] font-semibold">{t.title}</h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ul>
        <Link href="/securite" className="w-fit text-[15px] font-medium underline-offset-4 hover:underline">
          Notre approche de la sécurité <span aria-hidden="true">→</span>
        </Link>
      </Container>
    </section>
  )
}
