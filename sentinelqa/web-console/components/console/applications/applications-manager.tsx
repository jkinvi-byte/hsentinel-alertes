'use client'

import { ArrowRight, Building2, ChevronDown, Globe, KeyRound, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { type Application, formatAge, formatDateTime } from '@/lib/console-data'
import type { ApplicationAjoutee } from '@/lib/applications-types'
import { etape } from '../../../../web/lib/applications-contrat.mjs'

// D-55 : les applications de la référence Lovable. Les cibles du catalogue sont les exemples phares, chacune avec son
// autorisation écrite (D-24) ; votre propre site entre de la même façon, par une demande d'ajout, jamais par une URL tapée
// au hasard (art. 323-1 du Code pénal). Le détail (comptes de test, scénarios, veille) se déplie sous chaque ligne.
export function ApplicationsManager({ initialApps, ajoutees }: { initialApps: Application[]; ajoutees: ApplicationAjoutee[] | null }) {
  const [ouverte, setOuverte] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="exemples-titre">
        <div className="lv-titre-section">
          <div>
            <h2 id="exemples-titre">Exemples phares</h2>
            <p>Des sites réels et notre banc, autorisés par écrit : ce que vos agents y mènent, ils le mèneront chez vous.</p>
          </div>
        </div>
        {initialApps.length ? (
          <ul className="lv-lignes">
            {initialApps.map((app) => {
              const deplie = ouverte === app.id
              const volet = app.qa ? 'qa' : 'pentest'
              return (
                <li key={app.id} className="lv-app">
                  <div className="lv-app-ligne">
                    <span className="lv-ligne-icone"><Globe aria-hidden="true" /></span>
                    <div className="lv-app-texte">
                      <h3>{app.name}</h3>
                      <p>{app.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
                      <ul className="lv-app-puces" aria-label={`Ce que permet ${app.name}`}>
                        <li className="lv-pill">{app.writes ? 'Écritures de test remises en état' : 'Consultation seule'}</li>
                        {app.qa ? <li className="lv-pill">{app.qa.connexion ? 'QA · compte de test requis' : 'QA · pages publiques'}</li> : null}
                        {app.scenarios?.some((s) => s.module === 'Pentest' && s.available) ? <li className="lv-pill">Pentest disponible</li> : null}
                        {app.openFindings
                          ? <li className="lv-pill" data-ton="alerte">{app.openFindings} faille{app.openFindings > 1 ? 's' : ''} ouverte{app.openFindings > 1 ? 's' : ''}</li>
                          : app.lastAuditAt ? <li className="lv-pill" data-ton="sur">Aucune faille prouvée</li> : null}
                        {app.watch?.active ? <li className="lv-pill" data-ton="bleu">Veille active</li> : null}
                      </ul>
                    </div>
                    <div className="lv-app-actions">
                      <Link href={`/app/nouveau?volet=${volet}&cible=${encodeURIComponent(app.id)}`} className="lv-bouton lv-bouton-trait">
                        Préparer un test <ArrowRight aria-hidden="true" />
                      </Link>
                      <button type="button" className="lv-bouton lv-bouton-discret" aria-expanded={deplie} aria-controls={`detail-${app.id}`}
                        onClick={() => setOuverte(deplie ? null : app.id)}>
                        Détails <ChevronDown aria-hidden="true" className={deplie ? 'rotate-180 transition-transform' : 'transition-transform'} />
                      </button>
                    </div>
                  </div>
                  {deplie ? <Detail app={app} /> : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="lv-vide">
            <span className="lv-vide-icone"><Globe aria-hidden="true" /></span>
            <div><strong>Aucune application autorisée</strong><p>Une cible entre au catalogue avec son autorisation écrite.</p></div>
          </div>
        )}
      </section>

      <section aria-labelledby="vos-applications-titre">
        <div className="lv-titre-section">
          <div>
            <h2 id="vos-applications-titre">Vos applications</h2>
            <p>Votre préproduction, testée comme les exemples : mêmes agents, mêmes preuves.</p>
          </div>
        </div>
        {ajoutees === null ? (
          <p className="lv-note" data-ton="alerte" role="status">Vos applications sont momentanément illisibles. Rechargez la page dans un instant.</p>
        ) : ajoutees.length ? (
          <ul className="lv-lignes">{ajoutees.map((a) => <LigneAjoutee key={a.id} app={a} />)}</ul>
        ) : (
          <div className="lv-vide lv-vos-apps-vide">
            <span className="lv-vide-icone"><ShieldCheck aria-hidden="true" /></span>
            <div>
              <strong>Testez votre propre site.</strong>
              <p>Ajoutez son adresse, publiez le jeton de vérification sur le site, puis vos comptes de test : vos missions QA s’y lancent aussitôt, sans attendre l’équipe.</p>
            </div>
            <Link href="/app/applications/nouvelle" className="lv-bouton lv-bouton-bleu"><Plus aria-hidden="true" />Ajouter une application</Link>
          </div>
        )}
      </section>
    </div>
  )
}

// D-56 : une application ajoutée par son responsable. L'action principale dit ce qu'il reste à faire.
function LigneAjoutee({ app }: { app: ApplicationAjoutee }) {
  const suite = etape(app)
  const connexion = Boolean(app.profil_qa?.connexion)
  const n = app.comptes.length
  return (
    <li className="lv-app">
      <div className="lv-app-ligne">
        <span className="lv-ligne-icone" data-ton={suite === 'prete' ? 'sur' : undefined}><Globe aria-hidden="true" /></span>
        <div className="lv-app-texte">
          <h3>{app.nom}</h3>
          <p>{app.origine.replace(/^https:\/\//, '')}</p>
          <ul className="lv-app-puces" aria-label={`État de ${app.nom}`}>
            <li className="lv-pill" data-ton={app.verifiee_le ? 'sur' : undefined}>{app.verifiee_le ? 'Vérifiée' : 'Vérification à faire'}</li>
            <li className="lv-pill">{connexion ? 'QA · compte de test requis' : 'QA · pages publiques'}</li>
            {connexion ? <li className="lv-pill">{n ? `${n} compte${n > 1 ? 's' : ''} de test` : 'Aucun compte de test'}</li> : null}
          </ul>
        </div>
        <div className="lv-app-actions">
          {app.verifiee_le ? <Link href={`/app/nouveau?volet=pentest&cible=${encodeURIComponent(app.id)}`} className="lv-bouton lv-bouton-trait"><ShieldCheck aria-hidden="true" />Pentest libre</Link> : null}
          {suite === 'prete' ? (
            <Link href={`/app/nouveau?volet=qa&cible=${encodeURIComponent(app.id)}`} className="lv-bouton lv-bouton-trait">Préparer un test <ArrowRight aria-hidden="true" /></Link>
          ) : (
            <Link href={`/app/applications/${app.id}`} className="lv-bouton lv-bouton-bleu">{suite === 'verification' ? 'Vérifier le site' : 'Ajouter un compte'} <ArrowRight aria-hidden="true" /></Link>
          )}
          <Link href={`/app/applications/${app.id}`} className="lv-bouton lv-bouton-discret">Gérer</Link>
        </div>
      </div>
    </li>
  )
}

function Detail({ app }: { app: Application }) {
  const faits = [
    ['Environnement', app.environment],
    ['Autorisation', app.authorization ?? '—'],
    ['Dernier audit', app.lastAuditAt ? formatDateTime(app.lastAuditAt) : 'aucun'],
    ['Veille des mises à jour', app.watch?.active ? (app.watch.seenAt ? `active · vue il y a ${formatAge(app.watch.seenAt)}` : 'active') : 'inactive'],
  ]
  return (
    <div id={`detail-${app.id}`} className="lv-app-detail">
      <dl className="lv-faits">
        {faits.map(([t, v]) => <div key={t}><dt>{t}</dt><dd>{v}</dd></div>)}
      </dl>
      {app.companies.length ? (
        <div>
          <p className="lv-detail-titre">Comptes de test</p>
          <ul className="flex flex-col gap-2">
            {app.companies.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-2 text-[12.5px] text-foreground">
                <Building2 className="size-4 text-subtle" aria-hidden="true" />
                <span className="font-medium">{c.name}</span>
                {c.roles.map((r) => <span key={r} className="lv-pill">{r}</span>)}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <KeyRound className="size-3.5 shrink-0" aria-hidden="true" />
            Les mots de passe ne sont jamais enregistrés ici : ils passent par un coffre H, le temps d’une mission.
          </p>
        </div>
      ) : null}
      {app.scenarios?.length ? (
        <div>
          <p className="lv-detail-titre">Ce que les agents savent y tester</p>
          <ul className="flex flex-col">
            {app.scenarios.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border py-2.5 text-[12.5px] last:border-0">
                <span className="w-24 font-mono text-[10.5px] text-subtle">{s.id}</span>
                <span className="min-w-0 flex-1 text-foreground">{s.name}</span>
                <span className="text-muted-foreground">{s.module}</span>
                <span className="lv-pill" data-ton={s.available ? 'sur' : undefined}>{s.available ? 'Disponible' : 'Pas encore'}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
