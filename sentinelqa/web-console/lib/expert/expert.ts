import 'server-only'
import { CATALOGUE_QA as CATALOGUE_QA_JS } from '../../../web/lib/qa-contrat.mjs'
import { requete as requeteJs } from '../../../web/lib/supabase.js'
import { catalog } from '../console-contract.mjs'
import { blocFiches, IDS } from './manuel.mjs'
import { actionExpert, historiqueSurLaCible, lancementPossible, questionDejaPosee } from './actions.mjs'
import { listerAjoutees } from '../applications-reel'
import type { ApplicationAjoutee } from '../applications-types'

// D-51 : l'expert du studio, QA ou Pentest selon le volet choisi. Mécanique du RAG de LEVELS : les fiches du Manuel
// HSentinel (manuel.mjs) + un digest de la mission en préparation + une persona aux garde-fous durs.
// Le modèle est celui qui prépare déjà les plans QA (Hugging Face, servi par Groq) : il répond en une à deux secondes.

type Ligne = Record<string, any>
const requete = requeteJs as (chemin: string) => Promise<Ligne[]>
const MODELE = (CATALOGUE_QA_JS as { preparation: { modele: string } }).preparation.modele
const ROUTEUR = 'https://router.huggingface.co/v1/chat/completions'

export type Volet = 'qa' | 'pentest'
export type Tour = { role: 'utilisateur' | 'expert'; texte: string }
export type Demande = { volet: Volet; cible: string; consigne: string; question: string; historique: Tour[] }
export type ActionExpert = { type: 'ajouter_application' | 'ajouter_compte'; libelle: string; href: string; adresse?: string | null }
export type Reponse = { reponse: string; consigne_proposee: string | null; action: ActionExpert | null; lancement: 'direct' | 'studio' | null; fiches: string[]; modele: string; fournisseur: string; latence_s: number }

const COMMUN = [
  'Tu parles directement à l’utilisateur et tu le vouvoies. Ta réponse est lue à voix haute : 2 à 4 phrases courtes, en français, sans liste, sans markdown, sans emoji. Les nombres s’écrivent en chiffres, avec leur unité.',
  'Réponds complètement à la question avec les faits utiles des fiches et du contexte. Ne mentionne jamais les fiches, leurs id ni de crochets dans la réponse : les id vont seulement dans le champ fiches.',
  'Ton registre : clinique et précis, comme un instrument de mesure. Chaque phrase porte un fait. Tu ne cherches jamais à faire peur ni à flatter.',
  'Tu ne sais que ce que disent les FICHES et le CONTEXTE DE LA MISSION. Si l’information n’y est pas, tu le dis simplement et tu indiques à qui demander (l’équipe).',
  'Tu n’inventes aucun résultat, aucune page, aucun chiffre, aucune fonctionnalité.',
  // D-57 : l'expert propose et, quand tout est prêt, la mission part après un compte à rebours que l'utilisateur peut annuler.
  'Tu ne lances rien toi-même. Quand tout est prêt, ta consigne part après un compte à rebours de 4 secondes que l’utilisateur peut annuler ; sinon, il la reprend et la lance depuis le studio. Ne promets jamais un lancement quand le CONTEXTE dit « lancement direct : impossible ».',
  'Tu ne te présentes ni comme ChatGPT ni comme un modèle d’un autre éditeur.',
  'Réponds uniquement en JSON : {"reponse": "...", "consigne_proposee": "..." ou null, "action": null ou {"type": "ajouter_application"}, "fiches": ["id des fiches utilisées"]}.',
]

const PERSONAS: Record<Volet, string[]> = {
  qa: [
    'Tu es l’expert QA de HSentinel. Tu aides l’utilisateur à préparer une mission de QA fonctionnel que l’agent H saura jouer et que le code saura vérifier.',
    // D-57 : dans la proposition, pas dans l’interrogatoire.
    'Sois dans la proposition. Dès que tu sais quelle page ouvrir et ce qu’on doit y voir, propose consigne_proposee, même si tout n’est pas précisé : l’utilisateur la corrige d’un clic.',
    'Au plus une question de précision dans toute la conversation, et seulement si sans elle aucune consigne vérifiable n’est possible. Elle est courte et fermée, avec ta proposition par défaut (« Je vérifie la page Factures, ou une autre ? »). Si le CONTEXTE indique que ta question est déjà posée, n’en pose plus : propose la meilleure consigne avec ce que tu sais.',
    'Quand tu proposes une consigne et que le CONTEXTE indique « lancement direct : possible », dis en une phrase ce que l’agent va faire et que tu lances la mission ; l’utilisateur peut annuler. Sinon, dis ce qu’il reste à fournir dans le studio.',
    'Quand la consigne en cours est vague, propose dans consigne_proposee une consigne entière et meilleure : la page à atteindre, puis ce qu’on doit y voir, avec les mots attendus exactement entre guillemets ; 400 caractères au plus ; uniquement sur la cible choisie et en consultation seule. Sinon, consigne_proposee vaut null.',
    'consigne_proposee s’adresse à l’agent : une phrase complète à l’impératif, comme l’exemple du studio. Exemple : Ouvre la page du Bachelor, puis vérifie que la page affiche « Bac+3 ».',
    'Tu ne connais pas les menus ni les liens du site : n’en nomme aucun que le contexte ne donne pas. Décris l’intention (« ouvrir la page du Bachelor ») et laisse l’agent trouver le chemin.',
    // D-56 : orienter, jamais bloquer.
    'La cible est celle du CONTEXTE DE LA MISSION : une question qui ne cite pas d’autre adresse porte sur elle, même si un autre site a été évoqué plus tôt dans la conversation. N’en reparle pas.',
    'Si l’utilisateur veut tester un autre site que la cible choisie, ou son propre site, ne refuse jamais : dis-lui qu’il peut l’ajouter lui-même en trois gestes (son adresse et l’attestation, puis un jeton de vérification publié sur le site, puis un compte de test si le site a une connexion), que cela prend deux minutes et que rien ne part avant la vérification. Mets alors action = {"type": "ajouter_application"} et consigne_proposee = null. Si le site figure déjà dans ses applications ajoutées, dis-lui de le choisir dans la liste Application.',
    'Si la cible demande une connexion et qu’aucun compte de test n’est enregistré, dis-le simplement et propose d’en ajouter un : un bouton s’affichera sous ta réponse.',
    'Sinon, action vaut null.',
  ],
  pentest: [
    'Tu es l’expert Pentest de HSentinel. Tu expliques la méthode, les contrôles du catalogue disponibles sur la cible choisie et leurs limites, pour que l’utilisateur choisisse le bon contrôle et ses précisions.',
    'Tu ne donnes aucune technique d’attaque, aucune charge utile, aucun contournement, et rien sur une cible qui n’est pas au catalogue : tu rappelles alors qu’il faut une autorisation écrite et une entrée au catalogue.',
    'consigne_proposee : des précisions courtes qui restent dans le périmètre du contrôle choisi (pages à viser, données sensibles à surveiller), 300 caractères au plus ; sinon null.',
  ],
}

/** Le contexte de la mission en préparation : la cible (exemple du catalogue ou application ajoutée), la consigne et les dernières missions mesurées. */
export async function digest(volet: Volet, cible: string, consigne: string, ajoutees: ApplicationAjoutee[] = []) {
  const c = catalog() as { qa: Ligne[]; pentest: Ligne[] }
  const lignes: string[] = [`Volet : ${volet === 'qa' ? 'QA fonctionnel' : 'Pentest'}.`]
  if (volet === 'qa') {
    const t = c.qa.find((x) => x.id === cible)
    const a = ajoutees.find((x) => x.id === cible)
    if (a) lignes.push(`Cible : ${a.nom} (${a.origine}), l’application de l’utilisateur, ajoutée dans la console ; ${a.verifiee_le ? `vérifiée le ${a.verifiee_le.slice(0, 10)}` : 'vérification à faire'}. Connexion avec un compte de test : ${a.profil_qa?.connexion ? 'oui' : 'non'}.`
      + (a.profil_qa?.connexion ? ` Comptes de test enregistrés : ${a.comptes.length ? a.comptes.map((x) => x.libelle).join(', ') : 'aucun'}.` : '') + ' Modes : guide, exploration (6 pages au plus).')
    lignes.push(`Applications ajoutées par l’utilisateur : ${ajoutees.length ? ajoutees.map((x) => `${x.nom} (${x.origine}, ${x.verifiee_le ? 'vérifiée' : 'vérification à faire'})`).join(' ; ') : 'aucune'}. Exemples du catalogue : ${c.qa.map((x) => x.name).join(', ')}.`)
    if (t) lignes.push(`Cible : ${t.name} (${t.url}). Connexion avec un compte de test : ${t.connexion ? 'oui' : 'non'}. Modes : ${(t.modes ?? []).join(', ')}.`
      + (t.limits?.exploration?.max_pages ? ` Exploration : ${t.limits.exploration.max_pages} pages au plus.` : ''))
  } else {
    const scenarios = c.pentest.filter((s) => (s.targetIds ?? [s.targetId]).includes(cible))
    if (scenarios[0]) lignes.push(`Cible : ${scenarios[0].targets?.find((x: Ligne) => x.id === cible)?.name ?? scenarios[0].target}.`)
    for (const s of scenarios) lignes.push(`Contrôle ${s.id} « ${s.name} » : ${s.available ? 'disponible' : 'pas encore disponible'}${s.writes ? ', écritures de test remises en état' : ''}. Attendu : ${s.expected ?? '—'} Limites : ${s.limitations ?? '—'}`)
  }
  lignes.push(consigne.trim() ? `Consigne en cours : « ${consigne.trim().slice(0, 600)} »` : 'Consigne en cours : vide.')
  if (volet === 'qa') {
    const lancement = lancementDe(volet, cible, ajoutees)
    lignes.push(lancement === 'direct' ? 'Lancement direct : possible (tout est prêt ; une consigne proposée part après un compte à rebours que l’utilisateur peut annuler).'
      : 'Lancement direct : impossible (il manque une information, par exemple le compte de test à saisir dans le studio).')
  }
  try {
    if (volet === 'qa') {
      const missions = await requete(`qa_missions?select=cree_le,statut,resume:rapport->summary,resultats:rapport->results,cout:rapport->cost_h&cible=eq.${encodeURIComponent(cible)}&order=cree_le.desc&limit=3`)
      for (const m of missions) {
        const r = m.resume ?? {}
        const douteux = ((m.resultats ?? []) as Ligne[]).filter((x) => x.status !== 'passed').slice(0, 3).map((x) => `« ${String(x.description ?? '').slice(0, 80)} » (${x.status})`)
        lignes.push(`Mission du ${String(m.cree_le).slice(0, 10)} : ${m.statut}, ${r.passed ?? 0} conforme(s), ${r.failed ?? 0} écart(s), ${r.inconclusive ?? 0} à confirmer${typeof m.cout === 'number' ? `, ${m.cout.toFixed(3)} $` : ''}.${douteux.length ? ` Critères non conformes : ${douteux.join(' ; ')}.` : ''}`)
      }
    } else {
      const audits = await requete(`audits?select=cree_le,statut,resume:rapport->summary,scenario:rapport->request->>scenario_id,cout:rapport->cost_h&rapport->request->>target_id=eq.${encodeURIComponent(cible)}&order=cree_le.desc&limit=3`)
      for (const a of audits) {
        const r = a.resume ?? {}
        lignes.push(`Audit ${a.scenario ?? ''} du ${String(a.cree_le).slice(0, 10)} : ${a.statut}, ${r.failed ?? 0} faille(s) prouvée(s), ${r.passed ?? 0} contrôle(s) conforme(s)${typeof a.cout === 'number' ? `, ${a.cout.toFixed(3)} $` : ''}.`)
      }
    }
  } catch {
    lignes.push('Historique des missions : momentanément illisible.')
  }
  return lignes.join('\n')
}

/** La cible demandée existe-t-elle pour ce volet (catalogue, ou application ajoutée en QA) ? Rien d'autre n'entre dans une requête. */
export async function cibleConnue(volet: Volet, cible: string) {
  const c = catalog() as { qa: Ligne[]; pentest: Ligne[] }
  if (volet === 'pentest') return c.pentest.some((s) => (s.targetIds ?? [s.targetId]).includes(cible))
  return c.qa.some((t) => t.id === cible) || (await ajouteesLisibles()).some((a) => a.id === cible)
}

/** Le lancement possible pour cette cible (D-57) : la règle écrite d'actions.mjs, sur le catalogue ou l'application ajoutée. */
function lancementDe(volet: Volet, cible: string, ajoutees: ApplicationAjoutee[]) {
  const c = catalog() as { qa: Ligne[]; pentest: Ligne[] }
  const a = ajoutees.find((x) => x.id === cible)
  const t = c.qa.find((x) => x.id === cible)
  return lancementPossible({ volet, catalogue: t ? { connexion: Boolean(t.connexion) } : null,
    ajoutee: a ? { verifiee_le: a.verifiee_le, connexion: Boolean(a.profil_qa?.connexion), comptes: a.comptes.length } : null }) as 'direct' | 'studio'
}

// Une lecture des applications ajoutées qui échoue ne fait pas taire l'expert : il répond sans elles.
const ajouteesLisibles = () => listerAjoutees().catch(() => [] as ApplicationAjoutee[])

export async function repondre(d: Demande, jeton = process.env.HF_TOKEN): Promise<Reponse> {
  if (!jeton) throw new Error('Le jeton Hugging Face n’est pas configuré sur ce serveur.')
  const fiches = blocFiches(`${d.question} ${d.historique.at(-1)?.texte ?? ''}`, d.volet)
  const systeme = [...PERSONAS[d.volet], ...COMMUN].join('\n')
  const ajoutees = d.volet === 'qa' ? await ajouteesLisibles() : []
  const contexte = `${fiches.texte}\n\nCONTEXTE DE LA MISSION :\n${await digest(d.volet, d.cible, d.consigne, ajoutees)}`
  const c = catalog() as { qa: Ligne[]; pentest: Ligne[] }
  const connues = [...c.qa.map((t) => new URL(t.url).origin), ...c.pentest.flatMap((x) => (x.targets ?? []).map((t: Ligne) => new URL(t.url).origin)),
    ...ajoutees.map((a) => a.origine)]
  const historique = historiqueSurLaCible(d.historique.slice(-6), connues) as Tour[]
  // D-57 : une seule question de précision par conversation ; le contexte le dit au modèle.
  const dejaQuestionne = d.volet === 'qa' && questionDejaPosee(d.historique)
  const rappel = dejaQuestionne ? '\nQuestion de précision déjà posée : oui. Ne pose plus de question : propose consigne_proposee.' : ''
  const messages = [
    { role: 'system', content: `${systeme}\n\n${contexte}${rappel}` },
    ...historique.map((t) => ({ role: t.role === 'expert' ? 'assistant' : 'user', content: t.texte.slice(0, 600) })),
    { role: 'user', content: d.question.slice(0, 1000) },
  ]
  const debut = performance.now()
  const appeler = (modele: string, liste = messages) => fetch(ROUTEUR, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modele, temperature: 0.2, max_tokens: 450, response_format: { type: 'json_object' }, messages: liste }),
  })
  // Le 19/11, Groq a répondu 429 après une dizaine de questions rapprochées : on repose alors la question au même
  // modèle, chez le fournisseur que Hugging Face choisit. En démo, l'expert ne doit pas se taire pour une limite de débit.
  let modele = MODELE
  let r = await appeler(modele)
  if ((r.status === 429 || r.status >= 500) && MODELE.includes(':')) {
    console.warn(`[expert] ${MODELE} : HTTP ${r.status}, secours chez un autre fournisseur`)
    modele = MODELE.split(':')[0]
    r = await appeler(modele)
  }
  if (!r.ok) throw new Error(`Hugging Face a répondu HTTP ${r.status}.`)
  let lu = lireReponse(await r.json())
  // D-57 : la question déjà posée, l'expert la repose quand même ? Une seule seconde demande, qui exige une consigne.
  if (dejaQuestionne && !lu.proposee && /\?\s*$/.test(lu.reponse)) {
    const encore = await appeler(modele, [...messages, { role: 'assistant', content: JSON.stringify({ reponse: lu.reponse }) },
      { role: 'user', content: 'Tu as déjà posé ta question de précision. Ne pose plus de question : propose maintenant la meilleure consigne_proposee avec ce que tu sais, et dis-la en une phrase.' }])
    if (encore.ok) {
      const second = lireReponse(await encore.json())
      if (second.proposee) lu = second
    }
  }
  if (!lu.reponse) throw new Error('L’expert n’a pas rendu de réponse lisible.')
  // Le bouton proposé : une règle écrite (actions.mjs), que l'avis du modèle ne fait que compléter. Pas de bouton en Pentest.
  const cibleAjoutee = ajoutees.find((a) => a.id === d.cible)
  const action = d.volet === 'qa' ? actionExpert({ question: d.question, connues, proposee: lu.brut.action,
    cible: cibleAjoutee ? { id: cibleAjoutee.id, ajoutee: true, connexion: Boolean(cibleAjoutee.profil_qa?.connexion), comptes: cibleAjoutee.comptes.length } : null }) as ActionExpert | null : null
  const consigne = action?.type === 'ajouter_application' ? null : lu.proposee
  return {
    reponse: lu.reponse, consigne_proposee: consigne, action,
    // D-57 : une consigne proposée part directement (compte à rebours annulable) si la cible a tout ce qu'il faut.
    lancement: d.volet === 'qa' && consigne ? lancementDe(d.volet, d.cible, ajoutees) : null,
    fiches: (Array.isArray(lu.brut.fiches) ? lu.brut.fiches : fiches.ids).map(String).filter((id: string) => IDS.has(id)),
    modele, fournisseur: r.headers.get('x-inference-provider') ?? modele.split(':')[1] ?? '',
    latence_s: Math.round((performance.now() - debut) / 10) / 100,
  }
}

/** La réponse du modèle, relue : texte sans référence de fiche, consigne en phrase complète. */
function lireReponse(corps: Ligne) {
  const brutTexte = String(corps.choices?.[0]?.message?.content ?? '')
  let brut: Ligne = {}
  try { brut = JSON.parse(brutTexte.match(/\{[\s\S]*\}/)?.[0] ?? '{}') } catch { brut = {} }
  // Filet de sécurité pour l'oral : aucune référence de fiche ne doit être lue à voix haute.
  const reponse = String(brut.reponse ?? (brutTexte.trim().startsWith('{') ? '' : brutTexte))
    .replace(/,?\s*(selon|d['’]après|comme (indiqué|précisé) dans) (la |les )?fiches?\s*\[[^\]]*\]/gi, '')
    .replace(/\s*\[[a-z_]+\]/g, '').replace(/\s+([.,;:!?])/g, '$1').trim().slice(0, 1200)
  const brute = typeof brut.consigne_proposee === 'string' ? brut.consigne_proposee.trim() : ''
  // Une consigne est une phrase : majuscule au début, point à la fin (le modèle oublie souvent le point final).
  const proposee = brute ? `${brute.charAt(0).toUpperCase()}${brute.slice(1)}${/[.!?…]$/.test(brute) ? '' : '.'}`.slice(0, 2000) : null
  return { brut, reponse, proposee }
}
