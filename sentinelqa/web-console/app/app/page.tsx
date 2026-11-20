import { Activity, ArrowRight, Check, ChevronRight, CircleHelp, FileCheck2, FolderOpen, Globe, Lock, Mic, Search, ShieldCheck, SlidersHorizontal, Sparkles, TriangleAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LiveBrowser } from '@/components/console/overview/live-browser'
import { PageHeader } from '@/components/console/page-header'
import { formatAge, formatDateTime } from '@/lib/console-data'
import { chargerConsole, failles, indicateurs, missions, sessionsNavigateur } from '@/lib/console-reel'

export const metadata: Metadata = {
  title: 'Vue d’ensemble — HSentinel',
  description: 'Votre espace HSentinel : missions, contrôles conformes, anomalies à examiner et preuves.',
}

const nombre = (n: number) => n.toLocaleString('fr-FR')
/** « 1 faille prouvée », « 3 failles prouvées » : l'accord se donne en entier, jamais par un « s » ajouté au dernier mot. */
const accord = (n: number, un: string, plusieurs: string) => `${nombre(n)} ${n > 1 ? plusieurs : un}`

type Ligne = ReturnType<typeof missions>['qa'][number]

type Ton = 'sur' | 'alerte' | 'attente' | 'bleu' | 'neutre'
/** Le verdict d'une mission, dans les mots de la marque : faille prouvée, écart constaté, conforme, contrôle à confirmer. */
function verdict(m: Ligne): { texte: string; ton: Ton } {
  if (m.status === 'en_attente') return { texte: 'En attente d’un agent', ton: 'neutre' }
  if (m.status === 'en_cours') return { texte: 'Agent au travail', ton: 'bleu' }
  if (m.status === 'echec') return { texte: 'Panne technique', ton: 'attente' }
  const b = m.summary
  if (b.failed) return m.module === 'pentest'
    ? { texte: accord(b.failed, 'faille prouvée', 'failles prouvées'), ton: 'alerte' }
    : { texte: accord(b.failed, 'écart constaté', 'écarts constatés'), ton: 'alerte' }
  if (b.inconclusive) return { texte: accord(b.inconclusive, 'contrôle à confirmer', 'contrôles à confirmer'), ton: 'attente' }
  if (b.passed) return { texte: m.module === 'pentest' ? 'Aucune faille prouvée' : 'Conforme', ton: 'sur' }
  return { texte: 'Rapport disponible', ton: 'neutre' }
}

// D-55 : la vue d'ensemble de la référence Lovable, sur nos missions réelles. Les dollars ont quitté les indicateurs
// (brief) : on y lit des contrôles, des anomalies et des missions. L'aperçu de droite est illustré, et le dit.
export default async function OverviewPage() {
  const d = await chargerConsole()
  const k = indicateurs(d)
  const ouvertes = failles(d).filter((f) => f.status === 'ouverte')
  const principale = ouvertes[0]
  const tout = missions(d)
  const liste = [...tout.qa, ...tout.pentest].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const semaine = Date.now() - 7 * 86400000
  const recentes = liste.filter((m) => Date.parse(m.createdAt) >= semaine && m.status === 'termine')
  const conformes = recentes.reduce((n, m) => n + (m.summary.passed ?? 0), 0)
  const verifies = recentes.reduce((n, m) => n + (m.summary.passed ?? 0) + (m.summary.failed ?? 0), 0)
  const ecartsQa = recentes.filter((m) => m.module === 'qa').reduce((n, m) => n + (m.summary.failed ?? 0), 0)
  const enCours = liste.filter((m) => m.status === 'en_cours' || m.status === 'en_attente')
  const derniere = liste.find((m) => m.status === 'termine')
  const dernierVerdict = derniere ? verdict(derniere) : null

  return (
    <>
      <PageHeader crumbs={[{ label: 'Vue d’ensemble' }]} title="Un regard neuf sur vos applications."
        description="Des parcours vérifiés. Des anomalies comprises. Des preuves, toujours." />

      <main className="lv-contenu">
        <section className="lv-accueil" aria-labelledby="accueil-titre">
          <div className="lv-accueil-texte">
            <p className="lv-accueil-surtitre"><Sparkles aria-hidden="true" />Bienvenue dans HSentinel</p>
            <h2 id="accueil-titre">Votre site.<br />Un objectif.<span>On s’occupe du regard.</span></h2>
            <p className="lv-accueil-chapo">Commencez par une conversation. Votre expert prépare le test, vous gardez la main.</p>
            <div className="lv-accueil-actions">
              <Link href="/app/nouveau?voix=1" className="lv-bouton lv-bouton-encre lv-bouton-grand">
                <Mic aria-hidden="true" />Parler à l’expert<ArrowRight aria-hidden="true" />
              </Link>
              <Link href="/app/nouveau" className="lv-bouton lv-bouton-discret">
                <SlidersHorizontal aria-hidden="true" />Paramétrer manuellement<ChevronRight aria-hidden="true" />
              </Link>
            </div>
            <p className="lv-accueil-note"><ShieldCheck aria-hidden="true" />Rien n’est lancé sans vous : une mission prête s’annule pendant son compte à rebours.</p>
          </div>

          {/* L'aperçu illustré : un agent qui parcourt une application, puis le code qui rend son verdict. Rien n'y est mesuré. */}
          <figure className="lv-apercu" aria-label="Aperçu illustré : un agent parcourt une application, le code vérifie le résultat">
            <div className="lv-apercu-fenetre">
              <div className="lv-apercu-haut">
                <span className="lv-apercu-points" aria-hidden="true"><i /><i /><i /></span>
                <span className="lv-apercu-adresse"><Lock aria-hidden="true" />votre-application.fr</span>
              </div>
              <div className="lv-apercu-corps">
                <div className="lv-apercu-nav" aria-hidden="true">
                  <span className="lv-apercu-marque"><Globe />Votre application</span>
                  <span className="lv-apercu-nav-actif" /><span /><span />
                </div>
                <div className="lv-apercu-page">
                  <span className="lv-apercu-surtitre">Espace client</span>
                  <h3>Tout commence par un parcours.</h3>
                  <span className="lv-apercu-recherche"><Search aria-hidden="true" />Rechercher un document</span>
                  <span className="lv-apercu-document">
                    <span className="lv-apercu-document-icone"><FileCheck2 aria-hidden="true" /></span>
                    <span><strong>Votre document</strong><small>Prêt à être consulté</small></span>
                  </span>
                </div>
              </div>
              <svg className="lv-apercu-curseur" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8.5-6.2 1.3L9.6 19z" /></svg>
            </div>
            <div className="lv-apercu-verdict" aria-hidden="true">
              <span><Check /></span>
              <div><strong>Le bon résultat, au bon endroit.</strong><small>Contrôle conforme · preuve disponible</small></div>
            </div>
            <figcaption>Aperçu illustré</figcaption>
          </figure>
        </section>

        <ul className="lv-indicateurs" aria-label="Vos indicateurs des 7 derniers jours">
          <li>
            <span><Check aria-hidden="true" />Contrôles conformes</span>
            <strong>{verifies ? nombre(conformes) : '—'}</strong>
            <small>{verifies ? `sur ${accord(verifies, 'contrôle vérifié', 'contrôles vérifiés')} en 7 jours` : 'Votre premier test vous attend'}</small>
          </li>
          <li>
            <span><TriangleAlert aria-hidden="true" />Anomalies à examiner</span>
            <strong className={ouvertes.length + ecartsQa ? 'lv-texte-alerte' : undefined}>{nombre(ouvertes.length + ecartsQa)}</strong>
            <small>{accord(ouvertes.length, 'faille ouverte', 'failles ouvertes')} · {accord(ecartsQa, 'écart QA', 'écarts QA')} en 7 jours</small>
          </li>
          <li>
            <span><Activity aria-hidden="true" />Missions en cours</span>
            <strong>{nombre(enCours.length)}</strong>
            <small>{enCours.length ? `dont ${nombre(enCours.filter((m) => m.status === 'en_attente').length)} en attente d’un agent` : `${accord(k.audits, 'mission terminée', 'missions terminées')} en 7 jours`}</small>
          </li>
          <li>
            <span><FileCheck2 aria-hidden="true" />Dernier résultat</span>
            <strong className={`lv-indicateur-texte ${dernierVerdict?.ton === 'alerte' ? 'lv-texte-alerte' : dernierVerdict?.ton === 'sur' ? 'lv-texte-sur' : ''}`}>{dernierVerdict?.texte ?? 'À venir'}</strong>
            <small>{derniere ? `${derniere.app} · ${formatDateTime(derniere.createdAt)}` : 'Vos preuves apparaîtront ici'}</small>
          </li>
        </ul>

        {principale ? (
          <Link href={`/app/diagnostic/${principale.id}`} className="lv-alerte">
            <span className="lv-alerte-icone"><TriangleAlert aria-hidden="true" /></span>
            <span className="lv-alerte-texte">
              <span className="lv-alerte-surtitre">Faille principale · {principale.severity}</span>
              <strong>{principale.title}</strong>
              <small>{principale.app} · ouverte depuis {formatAge(principale.detectedAt)}</small>
            </span>
            <span className="lv-lien">Voir le diagnostic <ArrowRight aria-hidden="true" /></span>
          </Link>
        ) : null}

        <section className="lv-bloc" aria-labelledby="activite-titre">
          <div className="lv-titre-section">
            <div>
              <h2 id="activite-titre">Votre activité récente</h2>
              <p>Le fil de vos missions, de la première action au dernier contrôle.</p>
            </div>
            <Link href="/app/audits" className="lv-lien">Toutes les missions <ArrowRight aria-hidden="true" /></Link>
          </div>
          {liste.length ? (
            <ul className="lv-lignes">
              {liste.slice(0, 6).map((m) => {
                const v = verdict(m)
                return (
                  <li key={`${m.module}-${m.id}`}>
                    <Link href={`/app/missions/${m.module}/${m.id}`} className="lv-ligne">
                      <span className="lv-ligne-icone">{m.module === 'qa' ? <FileCheck2 aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}</span>
                      <span className="lv-ligne-texte">
                        <strong>{m.title || (m.module === 'qa' ? 'Mission QA' : 'Mission Pentest')}</strong>
                        <small>{m.app} · {m.module === 'qa' ? 'QA fonctionnel' : 'Pentest'} · {formatDateTime(m.createdAt)}</small>
                      </span>
                      <span className="lv-pill" data-ton={v.ton === 'neutre' ? undefined : v.ton}>{v.ton === 'bleu' ? <span className="lv-pulsation" aria-hidden="true" /> : null}{v.texte}</span>
                      <ChevronRight className="lv-ligne-chevron" aria-hidden="true" />
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="lv-vide">
              <span className="lv-vide-icone"><FolderOpen aria-hidden="true" /></span>
              <div><strong>Le début d’une application mieux vérifiée.</strong><p>Votre première mission et ses résultats trouveront leur place ici.</p></div>
              <Link href="/app/nouveau?voix=1" className="lv-bouton lv-bouton-trait">Préparer mon premier test <ArrowRight aria-hidden="true" /></Link>
            </div>
          )}
        </section>

        <section className="lv-bloc" aria-labelledby="sessions-titre">
          <div className="lv-titre-section">
            <div>
              <h2 id="sessions-titre">Ce que vos agents ont vu</h2>
              <p>Les dernières sessions, rejouées pas à pas depuis leurs captures réelles.</p>
            </div>
          </div>
          <div id="sessions" className="scroll-mt-24"><LiveBrowser sessions={sessionsNavigateur(d)} /></div>
        </section>

        <div className="lv-bandes">
          <div><span className="lv-bande-icone"><ShieldCheck aria-hidden="true" /></span><div><strong>L’agent montre. Le code décide.</strong><p>Un contrôle conforme s’appuie sur une preuve vérifiable.</p></div></div>
          <div><span className="lv-bande-icone"><CircleHelp aria-hidden="true" /></span><div><strong>Un périmètre clair, dès le départ.</strong><p>Uniquement les sites autorisés, avec des limites explicites.</p></div></div>
        </div>

        <footer className="lv-pied">
          <span><ShieldCheck aria-hidden="true" />HSentinel · Votre IA code vite. Notre agent prouve ce qui fuit.</span>
          <span>QA fonctionnel et pentest, preuves à l’appui</span>
        </footer>
      </main>
    </>
  )
}
