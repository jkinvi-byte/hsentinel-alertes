import 'server-only'
import { cache } from 'react'
import { DEPOT_ALERTES, ligneAlerte } from '../../web/lib/alertes-format.mjs'
import { requete as requeteJs } from '../../web/lib/supabase.js'
import { CATALOGUE as CATALOGUE_JS } from '../../web/lib/missions.js'
import { CATALOGUE_QA as CATALOGUE_QA_JS } from '../../web/lib/qa-contrat.mjs'
import { normaliseMission } from './mission-view.mjs'
import { matriceAcces } from './access-matrix.mjs'
import verite from '../../cobaye/VERITE_TERRAIN.json'
import type { ActivityEvent, Application, BrowserAction, BrowserSession, Company, DiagnosticFinding, FindingTimelineStep } from './console-data'
import type { Deployment, Finding, Kpi, MatrixCell, PipelineStep, RoleMatrix } from './audit-types'

// D-49 : les pages de la web app v0, nourries par nos vraies données. Aucun chiffre n'est inventé :
// chaque nombre vient de Supabase (missions, constats, applications) ou d'un rapport d'agent.

type Ligne = Record<string, any>
const requete = requeteJs as (chemin: string) => Promise<Ligne[]>
const CATALOGUE = CATALOGUE_JS as { targets: Ligne[]; scenarios: Ligne[] }
const CATALOGUE_QA = CATALOGUE_QA_JS as { cibles: Ligne[] }
export const DEPOT_TICKETS = `https://github.com/${DEPOT_ALERTES}/issues`

const COLONNES_CONSTATS = 'id,cree_le,application_id,audit_id,audit_le,theme,methode,chemin,gravite,donnees,raisons,critere,similarite,seuil,'
  + 'confirme_ecran,session_h,piste,empreinte,alerte_statut,github_issue_number,email_envoye,alerte_traitee_le'

// Ce qui décrit chaque application autorisée (D-24, D-45) : des descriptions, aucun chiffre.
const FICHES: Record<string, { environment: string; sector: string; tenants: string; companies: Company[] }> = {
  'paie-express': {
    environment: 'banc · données fictives', sector: 'Paie (banc d’essai)', tenants: 'Alpha (A, C) vs Bêta (B)',
    companies: [{ id: 'alpha', name: 'Alpha Conseil', roles: ['Admin (A)', 'Salariée (C)'] }, { id: 'beta', name: 'Bêta Logistique', roles: ['Admin (B)'] }],
  },
  'peer-review': { environment: 'production · consultation seule', sector: 'Évaluation entre pairs', tenants: 'compte étudiant', companies: [{ id: 'etudiants', name: 'Étudiants', roles: ['Compte de test'] }] },
  'eugenia-public': { environment: 'production · consultation seule', sector: 'Site d’école', tenants: 'sans compte', companies: [{ id: 'visiteurs', name: 'Visiteurs', roles: ['Sans compte'] }] },
  'hsentinel-console': { environment: 'production · notre console', sector: 'Console HSentinel', tenants: 'sans compte', companies: [{ id: 'visiteurs', name: 'Visiteurs', roles: ['Sans compte'] }] },
}
const ID_PAR_NOM: Record<string, string> = { 'Paie Express': 'paie-express', 'Peer Review': 'peer-review', 'Eugenia School': 'eugenia-public' }
const PHRASES: Record<string, string> = {
  lecture: 'Une autre entreprise peut lire', ecriture: 'Une autre entreprise peut modifier', compte: 'Un autre compte peut lire',
  qa: 'Écart fonctionnel sur', http: 'Faille HTTP démontrée sur', admin: 'Un salarié peut accéder à',
}
const ACTEURS: Record<string, [string, string]> = {
  lecture: ['Bêta (B)', 'Alpha (A)'], ecriture: ['Bêta (B)', 'Alpha (A)'], admin: ['Salariée (C)', 'Administration'],
  compte: ['Compte B', 'Compte A'], http: ['Visiteur', 'Serveur'], qa: ['Agent QA', 'Parcours attendu'],
}
const CAUSES: Record<string, string> = {
  lecture: 'Le serveur renvoie la ressource sans vérifier qu’elle appartient à l’entreprise de l’utilisateur connecté.',
  ecriture: 'Le serveur enregistre la modification sans vérifier l’entreprise propriétaire de la ressource.',
  admin: 'La partie réservée vérifie la connexion, mais pas le rôle de l’utilisateur.',
  compte: 'La ressource d’un compte est servie à un autre compte authentifié.',
  http: 'Le contrôle HTTP du scanner a démontré une faille sur cette requête.',
  qa: 'Le parcours ne produit pas le résultat attendu par le critère.',
}
const RANG: Record<string, number> = { critique: 0, 'élevée': 1, moyenne: 2, faible: 3 }
const phrase = (texte: string) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte)

export type DonneesConsole = Awaited<ReturnType<typeof chargerConsole>>

// Une seule lecture par requête, même quand la mise en page, la page et ses métadonnées la demandent.
export const chargerConsole = cache(async () => {
  const [qa, audits, constats, applications] = await Promise.all([
    requete('qa_missions?select=id,cree_le,statut,cible,demande,rapport,erreur,arret_demande&order=cree_le.desc&limit=100'),
    requete('audits?select=id,cree_le,statut,application,cible,rapport,erreur&order=cree_le.desc&limit=100'),
    requete(`constats?select=${COLONNES_CONSTATS}&order=cree_le.asc&limit=1000`),
    requete('applications?select=id,nom,origine,observation_active,observee_le,mise_a_jour_le&order=id.asc'),
  ])
  const missionsQa = qa.map((ligne) => ({ ligne, app: String(ligne.cible ?? ''), vue: normaliseMission(ligne, 'qa') as Ligne }))
  const missionsPentest = audits.filter((l) => l.rapport?.request?.mode !== 'qa')
    .map((ligne) => ({ ligne, app: ID_PAR_NOM[ligne.application] ?? String(ligne.rapport?.request?.target_id ?? ''), vue: normaliseMission(ligne, 'pentest') as Ligne }))
  // Le catalogue fait foi pour l'adresse d'une cible (le banc est en ligne depuis D-45, la table garde son ancienne adresse locale).
  // Une application seulement locale et hors catalogue (un banc de poste) n'a pas sa place dans la console en ligne.
  const apps = applications
    .map((a): Ligne => ({ ...a, origine: CATALOGUE.targets.find((t) => t.id === a.id)?.origin ?? a.origine }))
    .filter((a) => !/^http:\/\/(127\.|localhost)/.test(String(a.origine ?? '')))
  return { missionsQa, missionsPentest, constats, applications: apps }
})

function nomApplication(d: DonneesConsole, id: string) {
  return d.applications.find((a) => a.id === id)?.nom ?? id
}

// Une faille = une empreinte (application, thème, méthode, chemin) ; les plus anciens constats n'ont pas encore d'empreinte.
const cleConstat = (c: Ligne) => String(c.empreinte ?? `${c.application_id}|${c.theme}|${c.methode}|${c.chemin}`)

function causeDuBanc(theme: string, chemin: string) {
  const faille = (verite.failles as Ligne[]).find((f) => f.theme === theme && new RegExp(f.motif).test(chemin))
  return faille ? `${faille.id} · ${faille.description}` : null
}

/** Les failles prouvées, une par empreinte (application, thème, méthode, chemin) : la plus grave et la plus récente d'abord. */
export function failles(d: DonneesConsole): DiagnosticFinding[] {
  const groupes = new Map<string, Ligne[]>()
  for (const c of d.constats) groupes.set(cleConstat(c), [...(groupes.get(cleConstat(c)) ?? []), c])
  const resultat = [...groupes.values()].map((lignes): DiagnosticFinding => {
    const premiere = lignes[0], derniere = lignes[lignes.length - 1]
    const endpoint = `${derniere.methode} ${derniere.chemin}`
    const app = d.applications.find((a) => a.id === derniere.application_id)
    const [attacker, victim] = ACTEURS[derniere.theme] ?? ['—', '—']
    const timeline: FindingTimelineStep[] = []
    const tickets = new Set<number>()
    for (const [i, c] of lignes.entries()) {
      const rejeu = typeof c.similarite === 'number' ? `rejeu HTTP : pages similaires à ${Math.round(c.similarite * 100)} %` : 'rejeu HTTP'
      timeline.push({ at: c.audit_le ?? c.cree_le, actor: 'HSentinel', title: i === 0 ? 'Faille prouvée' : 'Toujours présente',
        detail: `${rejeu}${c.confirme_ecran ? ', puis vue à l’écran par l’agent H' : ''}.`, tone: 'danger' })
      if (c.github_issue_number) {
        const nouveau = !tickets.has(c.github_issue_number)
        tickets.add(c.github_issue_number)
        timeline.push({ at: c.alerte_traitee_le ?? c.cree_le, actor: 'n8n', title: `${nouveau ? 'Ticket' : 'Commentaire sur le ticket'} GitHub #${c.github_issue_number}`,
          detail: c.email_envoye ? 'E-mail envoyé à l’équipe.' : 'Sans e-mail.', tone: 'info' })
      }
    }
    timeline.sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
    // Les raisons (critère QA en tête) et le libellé de l'alerte : ceux de la page Alertes (web/lib/alertes-format.mjs), une seule voix.
    const alerte = ligneAlerte(derniere)
    return {
      id: derniere.id,
      title: `${PHRASES[derniere.theme] ?? 'Faille sur'} ${endpoint}`,
      severity: derniere.gravite,
      status: 'ouverte',
      app: app?.nom ?? derniere.application_id,
      module: derniere.theme === 'qa' ? 'QA' : 'Pentest',
      endpoint, attacker, victim,
      introducedAt: '', introducedCommit: '', introducedBy: '',
      detectedAt: premiere.audit_le ?? premiere.cree_le,
      lastConfirmedAt: derniere.audit_le ?? derniere.cree_le,
      summary: phrase(alerte.raisons[0] ?? ''),
      impact: phrase(alerte.raisons.join(' · ')),
      cause: (derniere.application_id === 'paie-express' && causeDuBanc(derniere.theme, derniere.chemin)) || CAUSES[derniere.theme] || '',
      fix: derniere.piste ?? '',
      dataExposed: derniere.donnees ?? [],
      timeline,
      origin: app?.origine ?? undefined, appId: derniere.application_id,
      ticket: alerte.ticket?.numero ?? undefined, alertLabel: alerte.alerte.libelle ?? undefined,
      replay: derniere.session_h ? `https://platform.hcompany.ai/agents/sessions/${derniere.session_h}` : undefined,
      theme: derniere.theme, similarity: typeof derniere.similarite === 'number' ? derniere.similarite : null,
      confirmedOnScreen: derniere.confirme_ecran === true, occurrences: lignes.length,
    }
  })
  return resultat.sort((a, b) => (RANG[a.severity] ?? 9) - (RANG[b.severity] ?? 9) || Date.parse(b.lastConfirmedAt) - Date.parse(a.lastConfirmedAt))
}

/** Les applications autorisées, avec leur dernier audit et leurs failles ouvertes. */
export function applications(d: DonneesConsole): Application[] {
  const ouvertes = failles(d)
  return d.applications.map((a): Application => {
    const missions = [...d.missionsQa, ...d.missionsPentest].filter((m) => m.app === a.id)
    const enCours = missions.some((m) => ['en_attente', 'en_cours'].includes(m.vue.status))
    const nombre = ouvertes.filter((f) => f.app === a.nom).length
    const fiche = FICHES[a.id] ?? { environment: 'production', sector: '', tenants: '—', companies: [] }
    const cible = CATALOGUE.targets.find((t) => t.id === a.id)
    const cibleQa = CATALOGUE_QA.cibles.find((c) => c.id === a.id)
    const scenarios = CATALOGUE.scenarios
      .filter((s) => (s.target_ids ?? [s.target_id]).includes(a.id))
      .map((s) => ({ id: String(s.id), name: String(s.title), module: s.mode === 'qa' ? 'QA' as const : 'Pentest' as const, available: s.available === true }))
    return {
      id: a.id, name: a.nom, url: a.origine ?? '', environment: fiche.environment, sector: fiche.sector,
      status: nombre ? 'faille' : enCours ? 'en cours' : 'sain',
      lastAuditAt: missions.map((m) => m.vue.createdAt).filter(Boolean).sort().at(-1) ?? '',
      openFindings: nombre, companies: fiche.companies,
      authorization: cible?.authorization_reference ?? (cibleQa ? 'catalogue QA' : undefined),
      writes: cible?.business_writes === true,
      watch: { active: a.observation_active === true, seenAt: a.observee_le ?? undefined, updatedAt: a.mise_a_jour_le ?? undefined },
      scenarios,
      qa: cibleQa ? { connexion: Boolean(cibleQa.connexion), modes: Object.keys(cibleQa.limites ?? {}).filter((m) => ['guide', 'exploration'].includes(m)) } : undefined,
    }
  })
}

/** Les sessions navigateur des missions QA récentes : les pages vraiment vues et les gestes vraiment faits par l'agent H. */
export function sessionsNavigateur(d: DonneesConsole, nombre = 3): BrowserSession[] {
  // La plus récente par application : trois onglets, trois cibles différentes.
  const vues = new Set<string>()
  const choisies = d.missionsQa.filter((m) => Array.isArray(m.ligne.rapport?.visites) && m.ligne.rapport.visites.length && !vues.has(m.app) && vues.add(m.app))
  return choisies.slice(0, nombre).map((m): BrowserSession => {
    const origine = String(m.ligne.rapport?.scope_snapshot?.origine ?? m.ligne.rapport?.scope_snapshot?.origin ?? '')
    const actions: BrowserAction[] = []
    for (const v of m.ligne.rapport.visites as Ligne[]) {
      if (v.geste) actions.push({ kind: 'click', label: String(v.geste), url: `${origine}${v.chemin ?? ''}` })
      actions.push({ kind: 'navigate', label: `Ouvre ${v.titre || v.chemin}`, url: `${origine}${v.chemin ?? ''}` })
    }
    const bilan = m.vue.summary ?? {}
    actions.push({ kind: 'assert', label: `Vérifie ${(bilan.passed ?? 0) + (bilan.failed ?? 0) + (bilan.inconclusive ?? 0)} critère(s) : ${bilan.passed ?? 0} conforme(s)`, url: actions.at(-1)?.url ?? origine })
    return {
      id: m.ligne.id, app: nomApplication(d, m.app), agent: 'Agent QA',
      persona: m.ligne.demande?.compte ? 'Compte de test' : 'Visiteur',
      status: ['en_attente', 'en_cours'].includes(m.vue.status) ? 'en cours' : bilan.failed ? 'faille' : 'terminée',
      startedAt: m.vue.createdAt, pages: m.ligne.rapport.visites.length, actions,
    }
  })
}

function pagesVues(m: { ligne: Ligne }) {
  const r = m.ligne.rapport ?? {}
  if (Array.isArray(r.visites)) return r.visites.length
  const banc = r.banc?.pages ?? r.pages
  return banc ? (banc.A?.length ?? 0) + (banc.C?.length ?? 0) : 0
}

/** Les quatre indicateurs de la vue d'ensemble, sur les 7 derniers jours, et ce qu'ils doivent à aujourd'hui. */
export function indicateurs(d: DonneesConsole) {
  const maintenant = Date.now(), semaine = maintenant - 7 * 86400000, jour = new Date(); jour.setHours(0, 0, 0, 0)
  const toutes = [...d.missionsQa, ...d.missionsPentest]
  const recentes = toutes.filter((m) => Date.parse(m.vue.createdAt) >= semaine)
  const du_jour = recentes.filter((m) => Date.parse(m.vue.createdAt) >= jour.getTime())
  const sessions = (l: typeof toutes) => l.reduce((n, m) => n + (m.vue.sessions?.length ?? 0), 0)
  const pages = (l: typeof toutes) => l.reduce((n, m) => n + pagesVues(m), 0)
  const terminees = (l: typeof toutes) => l.filter((m) => m.vue.status === 'termine')
  const ouvertes = failles(d)
  const cout = recentes.reduce((n, m) => n + (m.vue.costH ?? 0) + (m.vue.costHf ?? 0), 0)
  return {
    sessions: sessions(recentes), sessionsJour: sessions(du_jour),
    pages: pages(recentes), pagesJour: pages(du_jour),
    audits: terminees(recentes).length, auditsJour: terminees(du_jour).length,
    applicationsAuditees: new Set(terminees(recentes).map((m) => m.app)).size,
    failles: ouvertes.length, critiques: ouvertes.filter((f) => f.severity === 'critique').length,
    cout,
  }
}

/** Le fil d'activité : missions terminées, failles prouvées, tickets, mises à jour vues par la veille. */
export function activite(d: DonneesConsole, nombre = 12): ActivityEvent[] {
  const evenements: ActivityEvent[] = []
  for (const m of d.missionsQa.slice(0, 20)) {
    const b = m.vue.summary ?? {}
    evenements.push({ id: `qa-${m.ligne.id}`, at: m.ligne.rapport?.finished_at ?? m.vue.createdAt, kind: 'audit', app: nomApplication(d, m.app),
      title: `QA terminé · ${m.vue.title}`, detail: `${b.passed ?? 0} conforme(s), ${b.failed ?? 0} écart(s), ${b.inconclusive ?? 0} non concluant(s)`,
      href: `/app/missions/qa/${m.ligne.id}` })
  }
  for (const m of d.missionsPentest.slice(0, 20)) {
    const b = m.vue.summary ?? {}
    evenements.push({ id: `pt-${m.ligne.id}`, at: m.ligne.rapport?.finished_at ?? m.vue.createdAt, kind: 'audit', app: nomApplication(d, m.app),
      title: `Pentest terminé · ${m.vue.title}`, detail: b.failed ? `${b.failed} faille(s) prouvée(s)` : 'Aucune faille prouvée',
      href: `/app/missions/pentest/${m.ligne.id}` })
  }
  const vus = new Set<string>(), tickets = new Set<number>()
  for (const c of d.constats) {
    const cle = cleConstat(c)
    if (!vus.has(cle)) {
      vus.add(cle)
      evenements.push({ id: `f-${c.id}`, at: c.audit_le ?? c.cree_le, kind: 'finding', app: nomApplication(d, c.application_id),
        title: `Faille ${c.gravite} prouvée`, detail: `${PHRASES[c.theme] ?? 'Faille sur'} ${c.methode} ${c.chemin}`, href: `/app/diagnostic/${c.id}` })
    }
    if (c.github_issue_number && !tickets.has(c.github_issue_number)) {
      tickets.add(c.github_issue_number)
      evenements.push({ id: `t-${c.id}`, at: c.alerte_traitee_le ?? c.cree_le, kind: 'ticket', app: nomApplication(d, c.application_id),
        title: `Ticket GitHub #${c.github_issue_number} ouvert`, detail: c.email_envoye ? 'E-mail envoyé à l’équipe via n8n' : 'Créé par n8n',
        href: `${DEPOT_TICKETS}/${c.github_issue_number}` })
    }
  }
  for (const a of d.applications) {
    if (a.mise_a_jour_le) evenements.push({ id: `maj-${a.id}`, at: a.mise_a_jour_le, kind: 'deploy', app: a.nom,
      title: 'Mise à jour détectée', detail: 'La veille a vu une nouvelle version et lancé une exploration QA.' })
  }
  return evenements.filter((e) => e.at).sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, nombre)
}

/** Les missions pour la page Audits, dans le style de v0 : la plus récente d'abord. */
export function missions(d: DonneesConsole) {
  const ligne = (m: { ligne: Ligne; app: string; vue: Ligne }, module: 'qa' | 'pentest') => ({
    id: m.ligne.id as string, module, app: nomApplication(d, m.app), title: String(m.vue.title ?? ''), createdAt: String(m.vue.createdAt ?? ''),
    status: String(m.vue.status ?? ''), duration: m.vue.duration as number | null, cost: ((m.vue.costH ?? 0) + (m.vue.costHf ?? 0)) as number,
    summary: (m.vue.summary ?? {}) as { passed?: number; failed?: number; inconclusive?: number; skipped?: number },
  })
  return { qa: d.missionsQa.map((m) => ligne(m, 'qa')), pentest: d.missionsPentest.map((m) => ligne(m, 'pentest')) }
}

/** Le résumé léger de la barre latérale : failles ouvertes et coût mesuré sur 7 jours. */
export async function resumeConsole() {
  try {
    const d = await chargerConsole()
    const k = indicateurs(d)
    return { faillesOuvertes: k.failles, cout7j: k.cout }
  } catch {
    return { faillesOuvertes: 0, cout7j: null as number | null }
  }
}

// ── Page Audits (D-49) : chaque mission réelle, au format de la console v0 (pipeline, matrice, faille). ──

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`
const somme = (l: Ligne[], cle: string) => l.reduce((n, x) => n + (typeof x[cle] === 'number' ? x[cle] : 0), 0)
const ENCOURS = ['en_attente', 'en_cours']

// Le banc Paie Express : la matrice action × compte, déduite des identifiants de VERITE_TERRAIN (F1 à F6, C1 à C4).
const MATRICE_BANC: { action: string; motif: RegExp; A: string[]; C: string[]; B: string[] }[] = [
  { action: 'Lire les fiches de paie', motif: /^(\/api)?\/fiches-de-paie\//, A: [], C: ['F6'], B: ['F1', 'F2'] },
  { action: 'Modifier une fiche (commentaire RH)', motif: /^\/api\/fiches-de-paie\//, A: [], C: [], B: ['F4'] },
  { action: 'Lister les salariés', motif: /^\/salaries/, A: [], C: ['C4'], B: ['F3'] },
  { action: 'Factures', motif: /^(\/api)?\/factures/, A: [], C: ['C4'], B: ['C1', 'C2'] },
  { action: 'Administration', motif: /^\/administration/, A: [], C: ['F5'], B: [] },
  { action: 'Paramètres de paie', motif: /^\/parametres/, A: [], C: ['C3'], B: [] },
]

function matriceBanc(banc: Ligne, resultats: Ligne[]) {
  const prouvees = new Set<string>(), saines = new Set<string>()
  if (resultats.length) {
    for (const r of resultats) (r.status === 'failed' && r.id.startsWith('F') ? prouvees : r.status === 'passed' && r.id.startsWith('C') ? saines : new Set()).add(r.id)
  } else {
    for (const f of banc.score?.failles ?? []) if (f.detectee) prouvees.add(f.id)
    for (const c of banc.score?.controles ?? []) if (c.teste && !c.faux_positif) saines.add(c.id)
  }
  const pagesA: string[] = Array.isArray(banc.pages) ? banc.pages : (banc.pages?.A ?? [])
  const cellule = (ids: string[]) => (ids.some((i) => prouvees.has(i)) ? 'leak' : ids.some((i) => saines.has(i)) ? 'blocked' : 'na') as MatrixCell
  return {
    corner: 'Action',
    actions: ['Admin Alpha (A)', 'Salariée Alpha (C)', 'Admin Bêta (B)'],
    rows: MATRICE_BANC.map((l) => ({
      role: l.action, tenant: '',
      cells: [(pagesA.some((p) => l.motif.test(p)) ? 'allowed' : 'na') as MatrixCell, cellule(l.C), cellule(l.B)],
    })),
  }
}

function contexteCible(d: DonneesConsole, appId: string) {
  const fiche = FICHES[appId]
  const cible = CATALOGUE.targets.find((t) => t.id === appId) ?? CATALOGUE_QA.cibles.find((c) => c.id === appId)
  const autorisation = String(cible?.authorization_reference ?? cible?.autorisation ?? '')
  return {
    app: nomApplication(d, appId), environment: fiche?.environment.split(' · ')[0] ?? 'production',
    tenants: fiche?.tenants ?? '—',
    ownershipVerified: Boolean(autorisation), authorization: autorisation.split(' :')[0] || undefined,
  }
}

function failleAudit(d: DonneesConsole, auditId: string, banc: Ligne | null, origine: string): Finding | null {
  // La plus grave des failles prouvées par cet audit ; son titre, sa cause et son ticket sont ceux de la faille entière.
  const c = d.constats.filter((x) => x.audit_id === auditId).sort((a, b) => (RANG[a.gravite] ?? 9) - (RANG[b.gravite] ?? 9))[0]
  const f = c && failles(d).find((x) => cleConstat(d.constats.find((y) => y.id === x.id) ?? {}) === cleConstat(c))
  if (!c || !f) return null
  const rejeu = (banc?.rejeux as Ligne[] | undefined)?.find((r) => r.chemin === c.chemin && r.theme === c.theme)
  const compte = c.theme === 'admin' ? 'C' : 'B'
  return {
    id: f.id.slice(0, 8), severity: f.severity, title: f.title, summary: f.cause, endpoint: f.endpoint, href: `/app/diagnostic/${f.id}`,
    replay: {
      request: `${c.methode} ${origine}${c.chemin}\nsession : compte ${compte} (${f.attacker})`,
      response: rejeu
        ? `HTTP ${rejeu.http} pour ${f.attacker}\nHTTP ${rejeu.http_a} pour ${f.victim}\npages identiques à ${Math.round((rejeu.similarite ?? 0) * 100)} %${(rejeu.donnees ?? []).length ? `\ndonnées : ${rejeu.donnees.join(', ')}` : ''}`
        : `pages identiques à ${Math.round((c.similarite ?? 0) * 100)} %`,
      responseLabel: rejeu ? `Réponse · ${rejeu.http} au lieu d’un refus` : 'Réponse',
    },
    report: [
      `Gravité : ${f.severity}, ${(c.raisons ?? []).join(' ; ') || 'selon la règle écrite'}`,
      `Preuve : rejeu HTTP${c.confirme_ecran ? ', puis vue à l’écran par l’agent H' : ''}`,
      ...(c.piste ? [`Correctif : ${c.piste}`] : []),
    ],
    alerts: {
      ticket: (c.github_issue_number ?? f.ticket) ? { id: String(c.github_issue_number ?? f.ticket), url: `${DEPOT_TICKETS}/${c.github_issue_number ?? f.ticket}` } : null,
      email: c.email_envoye ? { via: 'n8n', recipients: 'équipe' } : null,
    },
  }
}

function deploiementPentest(d: DonneesConsole, m: { ligne: Ligne; app: string; vue: Ligne }): Deployment {
  const r = m.ligne.rapport ?? {}
  const banc: Ligne | null = r.banc ?? (Array.isArray(r.rejeux) ? r : null)
  const resultats: Ligne[] = Array.isArray(r.results) ? r.results : []
  const enCours = ENCOURS.includes(m.vue.status)
  const contexte = contexteCible(d, m.app)
  let pipeline: PipelineStep[], prouvees: number, matrice = null as RoleMatrix | null
  if (banc) {
    const sessions: Ligne[] = banc.sessions ?? []
    const carto = sessions.filter((s) => s.cible === 'cartographie'), verif = sessions.filter((s) => s.cible !== 'cartographie')
    const pages = Array.isArray(banc.pages) ? banc.pages.length : (banc.pages?.A?.length ?? 0) + (banc.pages?.C?.length ?? 0)
    const rejeux: Ligne[] = banc.rejeux ?? []
    const suspects = rejeux.filter((x) => x.suspicion).length
    const score = banc.score ?? {}
    prouvees = score.detectees ?? resultats.filter((x) => x.status === 'failed').length
    const roles = carto.map((s) => String(s.role).replace('Compte ', '')).join(' et ') || 'A'
    pipeline = [
      { id: 'explorateur', title: 'Explorateur', actor: 'agent', actorLabel: 'agent H', status: 'done',
        description: `Cartographie l’application en tant que ${roles} : ${pluriel(pages, 'page')} relevée${pages > 1 ? 's' : ''}.`, meta: `${Math.round(somme(carto, 'duree_s'))} s` },
      { id: 'rejeu', title: 'Rejeu HTTP', actor: 'code', actorLabel: 'notre code', status: 'done',
        description: 'B redemande les pages de A avec sa propre session ; C, simple salariée, celles réservées aux administrateurs.',
        meta: `${pluriel(rejeux.length, 'requête')} · ${pluriel(suspects, 'réponse')} suspecte${suspects > 1 ? 's' : ''}` },
      { id: 'verificateur', title: 'Vérificateur', actor: 'agent', actorLabel: 'agent H', status: 'done',
        description: `Ouvre chaque page suspecte avec le compte fautif et regarde ce qui s’affiche : ${pluriel((banc.preuves ?? []).length, 'preuve')}.`,
        meta: `${Math.round(somme(verif, 'duree_s'))} s` },
      { id: 'resultat', title: prouvees ? `${pluriel(prouvees, 'faille')} prouvée${prouvees > 1 ? 's' : ''}` : 'Aucune faille prouvée', actor: 'result', actorLabel: '',
        status: prouvees ? 'proven' : 'clear',
        description: score.total ? `${prouvees} sur ${score.total} failles injectées, ${pluriel(score.faux_positifs ?? 0, 'faux positif')}.` : 'Prouvées par rejeu, puis à l’écran.',
        meta: score.total ? `${prouvees}/${score.total}` : '' },
    ]
    if (m.app === 'paie-express') matrice = matriceBanc(banc, resultats)
  } else {
    const http = ((r.evidence ?? []) as Ligne[]).filter((e) => e.kind === 'http')
    const sessions: Ligne[] = r.sessions ?? []
    const failles = resultats.filter((x) => x.status === 'failed' && x.classification === 'demonstrated_vulnerability')
    prouvees = r.security_findings?.demonstrated_unique ?? new Set(failles.map((x) => x.finding_id ?? x.id)).size
    const echec = failles[0], conforme = resultats.length > 0 && resultats.every((x) => x.status === 'passed')
    const acces: Ligne[] = resultats.filter((x) => x.control_id === 'idor_access')
    pipeline = [
      ...(http.length ? [{ id: 'http', title: 'Lecture HTTP', actor: 'code' as const, actorLabel: 'notre code', status: 'done' as const,
        description: `${pluriel(http.length, 'preuve')} HTTP, avec leur compte d’origine quand une session est utilisée.`,
        meta: [...new Set(http.map((e) => `HTTP ${e.status_code}`))].join(' · ') }] : []),
      ...sessions.map((s, i) => ({ id: `session-${i}`, title: s.engine === 'h_company' ? 'Agent Pentest' : s.engine === 'playwright' ? 'Navigateur local' : 'Session HTTP',
        actor: (s.engine === 'h_company' ? 'agent' : 'code') as 'agent' | 'code',
        actorLabel: s.engine === 'h_company' ? 'agent H' : s.engine === 'playwright' ? 'Playwright' : 'notre code', status: 'done' as const,
        description: `Session ${String(s.role ?? '').toLowerCase() || 'de l’agent'}${typeof s.steps === 'number' ? ` : ${pluriel(s.steps, 'étape')}` : ''}.`, meta: `${Math.round(s.duree_s ?? 0)} s` })),
      ...(acces.length ? [{ id: 'acces', title: 'Matrice IDOR A / anonyme / B', actor: 'code' as const, actorLabel: 'notre code',
        status: (acces.some((x) => x.status === 'failed') ? 'proven' : 'done') as 'proven' | 'done',
        description: `${r.access_matrix?.resources?.length ?? 0} ressource(s), identités vérifiées : ${(r.access_matrix?.identities_verified ?? []).join(', ') || 'aucune'}.`,
        meta: `${acces.filter((x) => x.status === 'failed').length} fuite(s)` }] : []),
      { id: 'resultat', title: echec ? 'Faille prouvée' : conforme ? 'Conforme' : 'Non concluant', actor: 'result', actorLabel: '',
        status: echec ? 'proven' : conforme ? 'clear' : 'done', description: String((echec ?? resultats[0])?.observed ?? m.vue.error ?? ''), meta: '' },
    ]
    matrice = matriceAcces(r)
  }
  return {
    // Les rapports d'avant le catalogue (16 et 17/11) n'ont ni scénario ni titre : on dit ce qu'ils sont.
    id: m.ligne.id, module: 'pentest', commit: String(r.request?.scenario_id ?? 'historique'),
    message: String(r.scenario_title ?? (banc && !r.request ? 'Audit du banc, rejeu A/B' : m.vue.title ?? 'Audit')),
    author: contexte.app, branch: contexte.environment, at: m.vue.createdAt, vulnerabilities: prouvees, context: contexte,
    audit: {
      id: String(m.ligne.id).slice(0, 8), durationSeconds: Math.round(m.vue.duration ?? r.duree_totale_s ?? 0), costUsd: (m.vue.costH ?? 0) + (m.vue.costHf ?? 0),
      pipeline, matrix: matrice, finding: failleAudit(d, m.ligne.id, banc, contexte.app === 'Paie Express' ? String(CATALOGUE.targets.find((t) => t.id === 'paie-express')?.origin ?? '') : ''),
      reportHref: `/app/missions/pentest/${m.ligne.id}`, running: enCours,
    },
  }
}

function deploiementQa(d: DonneesConsole, m: { ligne: Ligne; app: string; vue: Ligne }): Deployment {
  const r = m.ligne.rapport ?? {}, demande = m.ligne.demande ?? r.request ?? {}
  const resultats: Ligne[] = Array.isArray(r.results) ? r.results : []
  const bilan = r.summary_criteres ?? r.summary ?? m.vue.summary ?? {}
  const visites: Ligne[] = r.visites ?? [], gestes: Ligne[] = r.parcours ?? [], sessions: Ligne[] = r.sessions ?? []
  const contexte = contexteCible(d, m.app)
  const ecarts = bilan.failed ?? 0, aConfirmer = bilan.inconclusive ?? 0
  const pipeline: PipelineStep[] = [
    demande.plan
      ? { id: 'plan', title: 'Plan', actor: 'code', actorLabel: 'Hugging Face', status: 'done',
          description: `Le parcours dicté devient ${pluriel((demande.plan.etapes ?? demande.plan.steps ?? []).length, 'étape')}, relues avant le lancement.`, meta: '' }
      : { id: 'consigne', title: 'Consigne', actor: 'code', actorLabel: demande.source === 'voix' ? 'dictée' : 'texte', status: 'done',
          description: String(demande.instruction ?? m.vue.title ?? '').slice(0, 160), meta: demande.pilotage === 'exploration' ? 'exploration bornée' : '' },
    { id: 'agent', title: 'Agent QA', actor: 'agent', actorLabel: 'agent H', status: 'done',
      description: `${pluriel(visites.length, 'page')} visitée${visites.length > 1 ? 's' : ''}, ${pluriel(gestes.length, 'geste')}${demande.appareil === 'mobile' ? ', sur mobile' : ''}.`,
      meta: `${Math.round(somme(sessions, 'duree_s'))} s` },
    { id: 'verification', title: 'Vérification', actor: 'code', actorLabel: 'notre code', status: 'done',
      description: `${pluriel(resultats.length, 'critère')} : ${bilan.passed ?? 0} conforme${(bilan.passed ?? 0) > 1 ? 's' : ''}, ${pluriel(ecarts, 'écart')}, ${aConfirmer} à confirmer.`, meta: '' },
    { id: 'resultat', title: ecarts ? `${pluriel(ecarts, 'écart')} constaté${ecarts > 1 ? 's' : ''}` : aConfirmer ? 'À confirmer' : 'Conforme', actor: 'result', actorLabel: '',
      status: ecarts ? 'proven' : aConfirmer ? 'done' : 'clear', description: ecarts ? 'Prouvé par le code, capture à l’appui.' : 'Chaque critère vérifiable a été vérifié par le code.', meta: '' },
  ]
  return {
    id: m.ligne.id, module: 'qa', commit: demande.pilotage === 'exploration' ? 'exploration' : 'parcours', message: String(m.vue.title ?? 'Mission QA'),
    author: contexte.app, branch: contexte.environment, at: m.vue.createdAt, vulnerabilities: ecarts, context: contexte,
    audit: {
      id: String(m.ligne.id).slice(0, 8), durationSeconds: Math.round(m.vue.duration ?? 0), costUsd: (m.vue.costH ?? 0) + (m.vue.costHf ?? 0),
      pipeline, matrix: null, finding: null, reportHref: `/app/missions/qa/${m.ligne.id}`, running: ENCOURS.includes(m.vue.status), inconclusive: aConfirmer,
      criteria: resultats.map((x) => ({ label: String(x.description ?? x.id), status: x.status, detail: String(x.observe ?? x.observed ?? '') })),
    },
  }
}

/** Les missions QA et Pentest au format de la page Audits de v0, avec la détection mesurée sur le banc. */
export function audits(d: DonneesConsole) {
  const deployments = [...d.missionsQa.map((m) => deploiementQa(d, m)), ...d.missionsPentest.map((m) => deploiementPentest(d, m))]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  const scores = d.missionsPentest.map((m) => (m.ligne.rapport?.banc ?? m.ligne.rapport)?.score).filter((s) => s?.total)
  const kpis: Kpi[] = scores.length ? [
    { id: 'detection', label: 'Détection', value: `${somme(scores, 'detectees')}/${somme(scores, 'total')}`, hint: `${pluriel(scores.length, 'audit')} du banc` },
    { id: 'false-positives', label: 'Faux positifs', value: String(somme(scores, 'faux_positifs')), hint: '' },
  ] : []
  return { deployments, kpis, cout7j: indicateurs(d).cout }
}

/** Les coûts réellement mesurés (API H et Hugging Face), par application et par volet, et leur moyenne par audit. */
export function couts(d: DonneesConsole) {
  const cout = (m: { vue: Ligne }) => (m.vue.costH ?? 0) + (m.vue.costHf ?? 0)
  const toutes = [...d.missionsQa.map((m) => ({ ...m, module: 'qa' as const })), ...d.missionsPentest.map((m) => ({ ...m, module: 'pentest' as const }))]
  const moyenne = (l: { vue: Ligne }[]) => {
    const payees = l.filter((m) => cout(m) > 0)
    return payees.length ? payees.reduce((n, m) => n + cout(m), 0) / payees.length : null
  }
  const parApp = new Map<string, { name: string; qa: number; pentest: number }>()
  for (const m of toutes) {
    const ligne = parApp.get(m.app) ?? { name: nomApplication(d, m.app), qa: 0, pentest: 0 }
    ligne[m.module] += cout(m)
    parApp.set(m.app, ligne)
  }
  return {
    semaine: indicateurs(d).cout,
    total: toutes.reduce((n, m) => n + cout(m), 0),
    missions: toutes.length,
    depuis: toutes.map((m) => m.vue.createdAt).filter(Boolean).sort()[0] ?? '',
    moyenneQa: moyenne(d.missionsQa),
    moyenneBanc: moyenne(d.missionsPentest.filter((m) => m.ligne.rapport?.banc || Array.isArray(m.ligne.rapport?.rejeux))),
    applications: [...parApp.values()].sort((a, b) => b.qa + b.pentest - (a.qa + a.pentest)),
  }
}
