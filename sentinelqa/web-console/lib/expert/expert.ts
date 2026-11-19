import 'server-only'
import { CATALOGUE_QA as CATALOGUE_QA_JS } from '../../../web/lib/qa-contrat.mjs'
import { requete as requeteJs } from '../../../web/lib/supabase.js'
import { catalog } from '../console-contract.mjs'
import { blocFiches, IDS } from './manuel.mjs'

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
export type Reponse = { reponse: string; consigne_proposee: string | null; fiches: string[]; modele: string; fournisseur: string; latence_s: number }

const COMMUN = [
  'Tu parles directement à l’utilisateur et tu le vouvoies. Ta réponse est lue à voix haute : 2 à 4 phrases courtes, en français, sans liste, sans markdown, sans emoji. Les nombres s’écrivent en chiffres, avec leur unité.',
  'Réponds complètement à la question avec les faits utiles des fiches et du contexte. Ne mentionne jamais les fiches, leurs id ni de crochets dans la réponse : les id vont seulement dans le champ fiches.',
  'Ton registre : clinique et précis, comme un instrument de mesure. Chaque phrase porte un fait. Tu ne cherches jamais à faire peur ni à flatter.',
  'Tu ne sais que ce que disent les FICHES et le CONTEXTE DE LA MISSION. Si l’information n’y est pas, tu le dis simplement et tu indiques à qui demander (l’équipe).',
  'Tu n’inventes aucun résultat, aucune page, aucun chiffre, aucune fonctionnalité.',
  'Tu ne lances rien et tu ne dis jamais que tu vas lancer : l’utilisateur relit puis appuie lui-même sur « Lancer la mission ».',
  'Tu ne te présentes ni comme ChatGPT ni comme un modèle d’un autre éditeur.',
  'Réponds uniquement en JSON : {"reponse": "...", "consigne_proposee": "..." ou null, "fiches": ["id des fiches utilisées"]}.',
]

const PERSONAS: Record<Volet, string[]> = {
  qa: [
    'Tu es l’expert QA de HSentinel. Tu aides l’utilisateur à préparer une mission de QA fonctionnel que l’agent H saura jouer et que le code saura vérifier.',
    'Quand la consigne en cours est vague, propose dans consigne_proposee une consigne entière et meilleure : la page à atteindre, puis ce qu’on doit y voir, avec les mots attendus exactement entre guillemets ; 400 caractères au plus ; uniquement sur la cible choisie et en consultation seule. Sinon, consigne_proposee vaut null.',
    'Tu ne connais pas les menus ni les liens du site : n’en nomme aucun que le contexte ne donne pas. Décris l’intention (« ouvrir la page du Bachelor ») et laisse l’agent trouver le chemin.',
  ],
  pentest: [
    'Tu es l’expert Pentest de HSentinel. Tu expliques la méthode, les contrôles du catalogue disponibles sur la cible choisie et leurs limites, pour que l’utilisateur choisisse le bon contrôle et ses précisions.',
    'Tu ne donnes aucune technique d’attaque, aucune charge utile, aucun contournement, et rien sur une cible qui n’est pas au catalogue : tu rappelles alors qu’il faut une autorisation écrite et une entrée au catalogue.',
    'consigne_proposee : des précisions courtes qui restent dans le périmètre du contrôle choisi (pages à viser, données sensibles à surveiller), 300 caractères au plus ; sinon null.',
  ],
}

/** Le contexte de la mission en préparation : la cible du catalogue, la consigne et les dernières missions mesurées. */
export async function digest(volet: Volet, cible: string, consigne: string) {
  const c = catalog() as { qa: Ligne[]; pentest: Ligne[] }
  const lignes: string[] = [`Volet : ${volet === 'qa' ? 'QA fonctionnel' : 'Pentest'}.`]
  if (volet === 'qa') {
    const t = c.qa.find((x) => x.id === cible)
    if (t) lignes.push(`Cible : ${t.name} (${t.url}). Connexion avec un compte de test : ${t.connexion ? 'oui' : 'non'}. Modes : ${(t.modes ?? []).join(', ')}.`
      + (t.limits?.exploration?.max_pages ? ` Exploration : ${t.limits.exploration.max_pages} pages au plus.` : ''))
  } else {
    const scenarios = c.pentest.filter((s) => (s.targetIds ?? [s.targetId]).includes(cible))
    if (scenarios[0]) lignes.push(`Cible : ${scenarios[0].targets?.find((x: Ligne) => x.id === cible)?.name ?? scenarios[0].target}.`)
    for (const s of scenarios) lignes.push(`Contrôle ${s.id} « ${s.name} » : ${s.available ? 'disponible' : 'pas encore disponible'}${s.writes ? ', écritures de test remises en état' : ''}. Attendu : ${s.expected ?? '—'} Limites : ${s.limitations ?? '—'}`)
  }
  lignes.push(consigne.trim() ? `Consigne en cours : « ${consigne.trim().slice(0, 600)} »` : 'Consigne en cours : vide.')
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

/** La cible demandée existe-t-elle au catalogue pour ce volet ? Rien d'autre n'entre dans une requête. */
export function cibleConnue(volet: Volet, cible: string) {
  const c = catalog() as { qa: Ligne[]; pentest: Ligne[] }
  return volet === 'qa' ? c.qa.some((t) => t.id === cible) : c.pentest.some((s) => (s.targetIds ?? [s.targetId]).includes(cible))
}

export async function repondre(d: Demande, jeton = process.env.HF_TOKEN): Promise<Reponse> {
  if (!jeton) throw new Error('Le jeton Hugging Face n’est pas configuré sur ce serveur.')
  const fiches = blocFiches(`${d.question} ${d.historique.at(-1)?.texte ?? ''}`, d.volet)
  const systeme = [...PERSONAS[d.volet], ...COMMUN].join('\n')
  const contexte = `${fiches.texte}\n\nCONTEXTE DE LA MISSION :\n${await digest(d.volet, d.cible, d.consigne)}`
  const messages = [
    { role: 'system', content: `${systeme}\n\n${contexte}` },
    ...d.historique.slice(-6).map((t) => ({ role: t.role === 'expert' ? 'assistant' : 'user', content: t.texte.slice(0, 600) })),
    { role: 'user', content: d.question.slice(0, 1000) },
  ]
  const debut = performance.now()
  const appeler = (modele: string) => fetch(ROUTEUR, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modele, temperature: 0.2, max_tokens: 450, response_format: { type: 'json_object' }, messages }),
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
  const corps = await r.json()
  const brut = String(corps.choices?.[0]?.message?.content ?? '')
  let lu: Ligne = {}
  try { lu = JSON.parse(brut.match(/\{[\s\S]*\}/)?.[0] ?? '{}') } catch { lu = {} }
  // Filet de sécurité pour l'oral : aucune référence de fiche ne doit être lue à voix haute.
  const reponse = String(lu.reponse ?? (brut.trim().startsWith('{') ? '' : brut))
    .replace(/,?\s*(selon|d['’]après|comme (indiqué|précisé) dans) (la |les )?fiches?\s*\[[^\]]*\]/gi, '')
    .replace(/\s*\[[a-z_]+\]/g, '').replace(/\s+([.,;:!?])/g, '$1').trim().slice(0, 1200)
  if (!reponse) throw new Error('L’expert n’a pas rendu de réponse lisible.')
  const brute = typeof lu.consigne_proposee === 'string' ? lu.consigne_proposee.trim() : ''
  const proposee = brute ? (brute.charAt(0).toUpperCase() + brute.slice(1)).slice(0, 2000) : null
  return {
    reponse, consigne_proposee: proposee,
    fiches: (Array.isArray(lu.fiches) ? lu.fiches : fiches.ids).map(String).filter((id: string) => IDS.has(id)),
    modele, fournisseur: r.headers.get('x-inference-provider') ?? modele.split(':')[1] ?? '',
    latence_s: Math.round((performance.now() - debut) / 10) / 100,
  }
}
