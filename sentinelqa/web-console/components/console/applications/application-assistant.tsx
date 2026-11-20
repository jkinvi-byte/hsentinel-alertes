'use client'

import { ArrowRight, Check, Code2, Copy, FileText, Globe, KeyRound, LockKeyhole, Mic, RefreshCw, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { consoleRequest, postJson } from '@/lib/console-client'
import { chiffrerPourRunner } from '@/lib/qa-account.mjs'
import type { ApplicationAjoutee, CompteTest } from '@/lib/applications-types'
import type { RunnerKey } from '@/lib/mission-types'
import { ATTESTATION, CHEMIN_FICHIER, NOM_BALISE } from '../../../../web/lib/applications-contrat.mjs'

// D-56 : ajouter son application en trois gestes. L'adresse et l'attestation ; la vérification, par un jeton publié sur le
// site ; les comptes de test, chiffrés dans ce navigateur pour le runner. Aucune mission ne part avant la vérification.

const ETAPES = [
  { titre: 'L’adresse', detail: 'Le site et l’attestation' },
  { titre: 'La vérification', detail: 'Le jeton publié sur le site' },
  { titre: 'Les comptes de test', detail: 'Chiffrés pour le runner' },
]
const jour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
const hote = (origine: string) => origine.replace(/^https:\/\//, '')

export function ApplicationAssistant({ initial, adresse = '' }: { initial: ApplicationAjoutee | null; adresse?: string }) {
  const [app, setApp] = useState(initial)
  const connexion = Boolean(app?.profil_qa?.connexion)
  const courante = !app ? 0 : !app.verifiee_le ? 1 : 2
  const prete = Boolean(app?.verifiee_le) && (!connexion || (app?.comptes.length ?? 0) > 0)
  const etat = (i: number) => (i < courante || (i === 2 && prete) ? 'fait' : i === courante ? 'actif' : 'a-venir')
  // Une étape qui apparaît en cours de route reçoit le focus ; celle affichée à l'ouverture de la page, non.
  const depart = useRef({ courante, prete })

  // L'adresse de la page suit l'application créée : un rechargement reprend là où on en était.
  function ajoutee(nouvelle: ApplicationAjoutee) {
    setApp(nouvelle)
    window.history.replaceState(null, '', `/app/applications/${nouvelle.id}`)
  }

  return (
    <div className="lv-assistant">
      <ol className="lv-etapes" data-n="3" aria-label="Les trois gestes pour ajouter votre application">
        {ETAPES.map((e, i) => (
          <li key={e.titre} data-etat={etat(i)} aria-current={etat(i) === 'actif' ? 'step' : undefined}>
            <span className="lv-etape-symbole" aria-hidden="true">{etat(i) === 'fait' ? <Check /> : <span className="lv-etape-numero">0{i + 1}</span>}</span>
            <span>
              <strong>{e.titre}</strong>
              <small>{i === 2 && app?.verifiee_le && !connexion ? 'Aucun compte : site public' : etat(i) === 'fait' ? 'Fait' : e.detail}</small>
            </span>
          </li>
        ))}
      </ol>

      {!app ? <EtapeAdresse adresseInitiale={adresse} onAjoutee={ajoutee} /> : null}
      {app && !app.verifiee_le ? <EtapeVerification app={app} focus={depart.current.courante !== 1} onVerifiee={(v) => setApp({ ...app, ...v })} /> : null}
      {app?.verifiee_le && prete ? <Prete app={app} focus={!depart.current.prete} /> : null}
      {app?.verifiee_le && connexion ? <EtapeComptes app={app} focus={depart.current.courante !== 2 && !prete} onComptes={(comptes) => setApp({ ...app, comptes })} /> : null}
      {app ? <Retirer app={app} /> : null}
    </div>
  )
}

// ── 01 · L'adresse ─────────────────────────────────────────────────────────────────────────────────────

function EtapeAdresse({ adresseInitiale, onAjoutee }: { adresseInitiale: string; onAjoutee: (a: ApplicationAjoutee) => void }) {
  const [adresse, setAdresse] = useState(adresseInitiale)
  const [nom, setNom] = useState('')
  const [avecConnexion, setAvecConnexion] = useState(true)
  const [chemin, setChemin] = useState('/connexion')
  const [atteste, setAtteste] = useState(false)
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const titre = useFocus(false)

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (attente) return
    setAttente(true)
    setErreur(null)
    try {
      const { application } = await postJson<{ application: ApplicationAjoutee }>('applications', {
        adresse, nom, connexion: avecConnexion ? chemin : null, attestation: atteste,
      })
      onAjoutee(application)
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'L’ajout a échoué. Réessayez.')
      setAttente(false)
    }
  }

  return (
    <form className="lv-carte" onSubmit={envoyer} aria-labelledby="etape-adresse">
      <p className="lv-carte-surtitre">Étape 01</p>
      <h2 id="etape-adresse" ref={titre} tabIndex={-1}>Quel site vos agents doivent-ils tester&#8239;?</h2>
      <p className="lv-carte-texte">Votre préproduction, ou votre site en ligne. Vos agents s’y connecteront comme vos utilisateurs, en consultation seule.</p>
      <div className="lv-champs">
        <label className="lv-champ">
          <span>Adresse du site</span>
          <input className="console-field" type="text" inputMode="url" autoComplete="url" spellCheck={false} autoCapitalize="none" required maxLength={300}
            placeholder="https://app.votre-saas.fr" value={adresse} onChange={(e) => setAdresse(e.target.value)} disabled={attente} />
          <small>https seulement, sur un nom de domaine public.</small>
        </label>
        <label className="lv-champ">
          <span>Nom affiché <em>facultatif</em></span>
          <input className="console-field" type="text" maxLength={60} placeholder="Repris du titre du site" value={nom} onChange={(e) => setNom(e.target.value)} disabled={attente} />
        </label>
        <div className="lv-champ">
          <label className="lv-case">
            <input type="checkbox" checked={avecConnexion} onChange={(e) => setAvecConnexion(e.target.checked)} disabled={attente} />
            <span>Le site demande une connexion<small>Vous ajouterez ensuite les comptes de test que l’agent utilisera.</small></span>
          </label>
          {avecConnexion ? (
            <label className="lv-champ lv-champ-retrait">
              <span>Chemin de la page de connexion</span>
              <input className="console-field" type="text" spellCheck={false} autoCapitalize="none" maxLength={120} placeholder="/connexion"
                value={chemin} onChange={(e) => setChemin(e.target.value)} disabled={attente} required />
            </label>
          ) : null}
        </div>
        <label className="lv-case lv-attestation">
          <input type="checkbox" checked={atteste} onChange={(e) => setAtteste(e.target.checked)} disabled={attente} required />
          <span>{ATTESTATION}</span>
        </label>
      </div>
      {erreur ? <p className="lv-note" data-ton="alerte" role="alert"><TriangleAlert aria-hidden="true" />{erreur}</p> : null}
      <div className="lv-carte-actions">
        <button type="submit" className="lv-bouton lv-bouton-bleu" disabled={attente || !adresse.trim() || !atteste}>
          {attente ? 'Lecture du site…' : 'Continuer'} <ArrowRight aria-hidden="true" />
        </button>
        <span className="lv-carte-aide">Nous lisons la page d’accueil une fois, pour vérifier qu’elle répond.</span>
      </div>
    </form>
  )
}

// ── 02 · La vérification ───────────────────────────────────────────────────────────────────────────────

function EtapeVerification({ app, focus, onVerifiee }: { app: ApplicationAjoutee; focus: boolean; onVerifiee: (v: Partial<ApplicationAjoutee>) => void }) {
  const [methode, setMethode] = useState<'fichier' | 'balise'>('fichier')
  const [attente, setAttente] = useState(false)
  const [refus, setRefus] = useState<string | null>(null)
  const titre = useFocus(focus)
  const jeton = app.verification_jeton ?? ''

  async function verifier() {
    if (attente) return
    setAttente(true)
    setRefus(null)
    try {
      const r = await postJson<{ verifiee: boolean; methode?: 'fichier' | 'balise'; verifiee_le?: string; raison?: string }>(`applications/${app.id}/verification`, {})
      if (r.verifiee) onVerifiee({ verifiee_le: r.verifiee_le ?? new Date().toISOString(), verification_methode: r.methode ?? null, autorisee: true })
      else setRefus(r.raison ?? 'Le jeton n’a pas été trouvé sur le site.')
    } catch (err) {
      setRefus(err instanceof Error ? err.message : 'La vérification n’a pas pu se faire. Réessayez.')
    } finally {
      setAttente(false)
    }
  }

  return (
    <section className="lv-carte" aria-labelledby="etape-verification">
      <p className="lv-carte-surtitre">Étape 02 · {app.nom}</p>
      <h2 id="etape-verification" ref={titre} tabIndex={-1}>Vérifions que ce site est à vous.</h2>
      <p className="lv-carte-texte">
        Publiez ce jeton à l’une de ces deux places, puis vérifiez. HSentinel le relit depuis Internet : aucune mission ne part avant.
        Le jeton reste le même pour cette adresse, même si vous retirez puis rajoutez l’application.
      </p>
      <div className="lv-onglets" role="tablist" aria-label="Où publier le jeton">
        {(['fichier', 'balise'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={methode === m} aria-controls={`publier-${m}`} id={`onglet-${m}`} onClick={() => setMethode(m)}>
            {m === 'fichier' ? <FileText aria-hidden="true" /> : <Code2 aria-hidden="true" />}
            {m === 'fichier' ? 'Un fichier' : 'Une balise'}
          </button>
        ))}
      </div>
      {methode === 'fichier' ? (
        <div id="publier-fichier" role="tabpanel" aria-labelledby="onglet-fichier" className="lv-publier">
          <p>Créez ce fichier à la racine du site&#8239;:</p>
          <Copie texte={`${app.origine}${CHEMIN_FICHIER}`} libelle="l’adresse du fichier" />
          <p>avec pour seul contenu&#8239;:</p>
          <Copie texte={jeton} libelle="le jeton" />
        </div>
      ) : (
        <div id="publier-balise" role="tabpanel" aria-labelledby="onglet-balise" className="lv-publier">
          <p>Ajoutez cette balise dans le <code>&lt;head&gt;</code> de la page d’accueil, <span className="lv-mono">{hote(app.origine)}/</span>&#8239;:</p>
          <Copie texte={`<meta name="${NOM_BALISE}" content="${jeton}">`} libelle="la balise" />
        </div>
      )}
      {refus ? <p className="lv-note" data-ton="alerte" role="alert"><TriangleAlert aria-hidden="true" /><span>{refus} Le jeton ne change pas : publiez-le, puis vérifiez de nouveau.</span></p> : null}
      <div className="lv-carte-actions">
        <button type="button" className="lv-bouton lv-bouton-bleu" onClick={verifier} disabled={attente || !jeton}>
          {attente ? 'Vérification…' : refus ? 'Vérifier de nouveau' : 'Vérifier maintenant'}
          {attente ? null : <ShieldCheck aria-hidden="true" />}
        </button>
        <span className="lv-carte-aide">Lecture de {hote(app.origine)} depuis Internet, sans rien y écrire.</span>
      </div>
    </section>
  )
}

function Copie({ texte, libelle }: { texte: string; libelle: string }) {
  const [copie, setCopie] = useState(false)
  useEffect(() => {
    if (!copie) return
    const t = setTimeout(() => setCopie(false), 1800)
    return () => clearTimeout(t)
  }, [copie])
  return (
    <div className="lv-copie">
      <code>{texte}</code>
      <button type="button" className="lv-bouton lv-bouton-trait lv-bouton-petit" aria-label={`Copier ${libelle}`}
        onClick={() => { void navigator.clipboard?.writeText(texte).then(() => setCopie(true)).catch(() => undefined) }}>
        {copie ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        <span aria-live="polite">{copie ? 'Copié' : 'Copier'}</span>
      </button>
    </div>
  )
}

// ── 03 · Les comptes de test ───────────────────────────────────────────────────────────────────────────

function EtapeComptes({ app, focus, onComptes }: { app: ApplicationAjoutee; focus: boolean; onComptes: (comptes: CompteTest[]) => void }) {
  const [libelle, setLibelle] = useState(app.comptes.length ? '' : 'Compte A')
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [nomAttendu, setNomAttendu] = useState('')
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [retrait, setRetrait] = useState<string | null>(null)
  const { data: cle, error: erreurCle, isLoading, mutate } = useSWR('cle-runner', (p: string) => consoleRequest<RunnerKey | null>(p),
    { shouldRetryOnError: false, revalidateOnFocus: true })
  const cleDisponible = Boolean(cle && !erreurCle && !isLoading)
  const titre = useFocus(focus)

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault()
    if (attente) return
    setAttente(true)
    setErreur(null)
    try {
      // La clé est relue au dernier moment : le runner a pu la renouveler depuis l'ouverture de la page.
      const chiffre = await chiffrerPourRunner(await mutate(), motDePasse)
      setMotDePasse('')
      const { compte } = await postJson<{ compte: CompteTest }>(`applications/${app.id}/comptes`, {
        libelle, identifiant, ...chiffre, identite: nomAttendu.trim() ? [nomAttendu.trim()] : [],
      })
      onComptes([...app.comptes, compte])
      setLibelle(`Compte ${String.fromCharCode(66 + app.comptes.length)}`)
      setIdentifiant('')
      setNomAttendu('')
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'L’enregistrement a échoué. Réessayez.')
    } finally {
      setAttente(false)
    }
  }

  async function retirer(compte: CompteTest) {
    setRetrait(compte.id)
    setErreur(null)
    try {
      await consoleRequest(`applications/${app.id}/comptes/${compte.id}`, { method: 'DELETE' })
      onComptes(app.comptes.filter((c) => c.id !== compte.id))
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le retrait a échoué. Réessayez.')
    } finally {
      setRetrait(null)
    }
  }

  return (
    <section id="comptes" className="lv-carte" aria-labelledby="etape-comptes">
      <p className="lv-carte-surtitre">Étape 03 · {app.nom}</p>
      <h2 id="etape-comptes" ref={titre} tabIndex={-1}>Les comptes de test.</h2>
      <p className="lv-carte-texte">
        L’agent se connecte avec eux, comme vos utilisateurs. Le mot de passe est chiffré dans ce navigateur pour notre runner :
        ni notre serveur ni notre base ne le lisent en clair. À chaque mission, il passe dans un coffre H créé pour elle, puis supprimé.
      </p>

      {app.comptes.length ? (
        <ul className="lv-comptes" aria-label={`Comptes de test de ${app.nom}`}>
          {app.comptes.map((c) => (
            <li key={c.id} className="lv-compte">
              <span className="lv-ligne-icone"><KeyRound aria-hidden="true" /></span>
              <div className="lv-compte-texte">
                <strong>{c.libelle}</strong>
                <span>{c.identifiant}{c.identite?.length ? ` · s’affiche « ${c.identite[0]} »` : ''}</span>
              </div>
              <span className="lv-pill" data-ton="sur"><LockKeyhole aria-hidden="true" />Chiffré pour le runner</span>
              <button type="button" className="lv-bouton lv-bouton-discret" onClick={() => retirer(c)} disabled={retrait === c.id}
                aria-label={`Retirer ${c.libelle}`}>
                <X aria-hidden="true" />{retrait === c.id ? 'Retrait…' : 'Retirer'}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="lv-compte-form" onSubmit={enregistrer} aria-label="Ajouter un compte de test">
        <p className="lv-detail-titre">{app.comptes.length ? 'Ajouter un autre compte' : 'Ajouter un compte'}</p>
        <div className="lv-champs lv-champs-2">
          <label className="lv-champ">
            <span>Libellé</span>
            <input className="console-field" maxLength={60} required placeholder="Compte A · gérante" value={libelle} onChange={(e) => setLibelle(e.target.value)} disabled={attente} />
          </label>
          <label className="lv-champ">
            <span>Identifiant</span>
            <input className="console-field" required maxLength={254} autoComplete="off" autoCapitalize="none" spellCheck={false} placeholder="camille@votre-saas.fr"
              value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} disabled={attente} />
          </label>
          <label className="lv-champ">
            <span>Mot de passe</span>
            <input className="console-field" type="password" required autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} disabled={attente} />
          </label>
          <label className="lv-champ">
            <span>Nom affiché une fois connecté <em>facultatif</em></span>
            <input className="console-field" maxLength={120} autoComplete="off" placeholder="Camille Martin" value={nomAttendu} onChange={(e) => setNomAttendu(e.target.value)} disabled={attente} />
          </label>
        </div>
        <p className="lv-carte-aide">Le nom affiché permet au code de vérifier que l’agent a ouvert le bon compte.</p>
        {erreur ? <p className="lv-note" data-ton="alerte" role="alert"><TriangleAlert aria-hidden="true" />{erreur}</p> : null}
        {!cleDisponible && !isLoading ? (
          <p className="lv-note" data-ton="alerte" role="status">
            <TriangleAlert aria-hidden="true" />
            <span>Le runner n’a pas encore publié sa clé : le chiffrement est impossible pour l’instant.</span>
            <button type="button" className="lv-bouton lv-bouton-discret" onClick={() => { void mutate() }}><RefreshCw aria-hidden="true" />Actualiser</button>
          </p>
        ) : null}
        <div className="lv-carte-actions">
          <button type="submit" className="lv-bouton lv-bouton-bleu" disabled={attente || !cleDisponible || !libelle.trim() || !identifiant.trim() || !motDePasse}>
            {attente ? 'Chiffrement…' : <><LockKeyhole aria-hidden="true" />Chiffrer et enregistrer</>}
          </button>
        </div>
      </form>
    </section>
  )
}

// ── Prête, et retirer ──────────────────────────────────────────────────────────────────────────────────

function Prete({ app, focus }: { app: ApplicationAjoutee; focus: boolean }) {
  const titre = useFocus(focus)
  const nombre = app.comptes.length
  return (
    <section className="lv-prete" aria-labelledby="application-prete">
      <span className="lv-prete-symbole" aria-hidden="true"><ShieldCheck /></span>
      <div className="lv-prete-texte">
        <h2 id="application-prete" ref={titre} tabIndex={-1}>{app.nom} est prête.</h2>
        <p>
          Vérifiée le {app.verifiee_le ? jour.format(new Date(app.verifiee_le)) : '—'}, par {app.verification_methode === 'balise' ? 'la balise' : 'le fichier'}.
          {app.profil_qa?.connexion ? ` ${nombre} compte${nombre > 1 ? 's' : ''} de test.` : ' Site public : aucun compte nécessaire.'}
        </p>
      </div>
      <div className="lv-prete-actions">
        <Link href={`/app/nouveau?volet=qa&cible=${encodeURIComponent(app.id)}&voix=1`} className="lv-bouton lv-bouton-encre"><Mic aria-hidden="true" />Parler à l’expert</Link>
        <Link href={`/app/nouveau?volet=qa&cible=${encodeURIComponent(app.id)}`} className="lv-bouton lv-bouton-bleu">Préparer un test <ArrowRight aria-hidden="true" /></Link>
        <Link href={`/app/nouveau?volet=pentest&cible=${encodeURIComponent(app.id)}`} className="lv-bouton lv-bouton-trait"><ShieldCheck aria-hidden="true" />Pentest libre</Link>
      </div>
    </section>
  )
}

function Retirer({ app }: { app: ApplicationAjoutee }) {
  const router = useRouter()
  const [confirmer, setConfirmer] = useState(false)
  const [attente, setAttente] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  async function retirer() {
    setAttente(true)
    try {
      await consoleRequest(`applications/${app.id}`, { method: 'DELETE' })
      router.push('/app/applications')
      router.refresh()
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Le retrait a échoué.')
      setAttente(false)
    }
  }
  return (
    <div className="lv-retirer">
      <Globe aria-hidden="true" />
      <span className="lv-mono">{hote(app.origine)}</span>
      {confirmer ? (
        <>
          <span>Ses comptes de test seront supprimés.</span>
          <button type="button" className="lv-bouton lv-bouton-trait lv-bouton-danger" onClick={retirer} disabled={attente}>{attente ? 'Retrait…' : 'Confirmer le retrait'}</button>
          <button type="button" className="lv-bouton lv-bouton-discret" onClick={() => setConfirmer(false)} disabled={attente}>Annuler</button>
        </>
      ) : (
        <button type="button" className="lv-bouton lv-bouton-discret" onClick={() => setConfirmer(true)}>Retirer l’application</button>
      )}
      {erreur ? <span className="text-danger" role="alert">{erreur}</span> : null}
    </div>
  )
}

/** Le titre d'une étape qui vient d'apparaître reçoit le focus : le lecteur d'écran annonce où l'on est. */
function useFocus(actif: boolean) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (actif) ref.current?.focus()
  }, [actif])
  return ref
}
