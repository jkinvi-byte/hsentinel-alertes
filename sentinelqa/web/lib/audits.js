// Les audits, lus dans Supabase côté serveur, et mis au même format pour l'interface.
// Trois générations de rapports existent : la v0 d'avant correctif, la v0 « lecture seule »,
// et la v1 à trois thèmes. Un champ absent reste null : on affiche « non mesuré », jamais une
// valeur inventée. Un audit en attente ou en cours n'a pas encore de rapport.
import 'server-only';
import { requete } from './supabase';
import { CRANS, STATUTS, canal, extrait, titreSimple } from './format';
import { normaliserMission } from './missions';

const COLONNES = 'id,cree_le,statut,application,cible,comptes,ecriture_autorisee,perimetre,debut,fin,rapport,erreur';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function dateDuRapport(texte) {
  const [jour, heure] = texte.split(' ');
  const [j, m, a] = jour.split('/');
  return `${a}-${m}-${j}T${heure}:00`;
}

function hote(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function proprietaire(constat) {
  return constat?.proprietaire ?? constat?.entreprise_affichee ?? null;
}

// La gravité d'une faille prouvée (règle déterministe) ; les anciens classements du LLM n'avaient qu'une justification
function gravite(g) {
  if (!g) return null;
  return { niveau: g.niveau, raisons: g.raisons ?? (g.justification ? [g.justification] : []), donnees: g.donnees ?? [], source: g.source ?? null };
}

// Les failles d'un audit : les pages prouvées regroupées par faille. Avec une vérité terrain, une faille injectée
// rassemble ses pages (motif) ; sans elle, une même adresse à l'identifiant près forme une faille.
const ORDRE_THEMES = { lecture: 0, ecriture: 1, admin: 2 };
function faillesDe(constats, verite, id) {
  const injectees = verite.filter((v) => !v.controle && v.motif);
  const groupes = new Map();
  for (const c of constats.filter((x) => x.statut === 'prouvee')) {
    const f = injectees.find((v) => v.theme === c.theme && new RegExp(v.motif).test(c.chemin));
    const cle = f ? f.id : `${c.theme}:${c.chemin.replace(/\/\d+(?=\/|$)/g, '/:id').replace(/=[^&]*/g, '=')}`;
    if (!groupes.has(cle)) groupes.set(cle, { cle, theme: c.theme, verite: f ?? null, pages: [] });
    groupes.get(cle).pages.push(c);
  }
  return [...groupes.values()].map((g) => {
    const plusGrave = [...g.pages].sort((a, b) => (CRANS[b.gravite?.niveau] ?? 0) - (CRANS[a.gravite?.niveau] ?? 0))[0];
    const donnees = [...new Set(g.pages.flatMap((p) => p.gravite?.donnees ?? []))];
    return {
      ...g, id: `${id}-${g.cle}`, ancre: `faille-${String(g.cle).replace(/[^a-zA-Z0-9]+/g, '-')}`,
      gravite: plusGrave.gravite, donnees, titre: titreSimple(g.theme, donnees), canal: canal(g.pages.map((p) => p.chemin)),
      // L'extrait vient de préférence d'une page de l'interface, plus parlante que l'API
      vu: extrait((g.pages.find((p) => !p.chemin.startsWith('/api/') && p.visible) ?? plusGrave).visible),
      replay: g.pages.find((p) => p.replay)?.replay ?? null,
    };
  }).sort((a, b) => ORDRE_THEMES[a.theme] - ORDRE_THEMES[b.theme] || (CRANS[b.gravite?.niveau] ?? 0) - (CRANS[a.gravite?.niveau] ?? 0));
}

function normaliser(ligne) {
  const { id, rapport: d } = ligne;
  const commun = {
    id, statut: ligne.statut, application: ligne.application, cible: hote(ligne.cible), comptes: ligne.comptes ?? [],
    ecritureAutorisee: ligne.ecriture_autorisee, perimetre: ligne.perimetre ?? [], erreur: ligne.erreur ?? null,
  };
  if (d?.schema_version === 2) return normaliserMission(ligne, commun);
  if (!d) {
    return { ...commun, quand: ligne.cree_le, agents: null, score: null, verite: [], cout: null, tokens: null, duree: null,
             hypotheses: null, constats: [], failles: [], interventions: [] };
  }
  const quand = d.date ? dateDuRapport(d.date) : ligne.cree_le;
  const theme = (x) => x.theme ?? 'lecture';
  const constats = [
    ...d.preuves.filter((p) => p.prouvee).map((p) => ({
      statut: 'prouvee', theme: theme(p), chemin: p.chemin, nature: p.type, compte: p.compte ?? 'B',
      visible: p.constat?.ce_qui_est_visible ?? null, proprietaire: proprietaire(p.constat), replay: p.replay ?? null,
      gravite: gravite(p.gravite),
    })),
    ...d.rejeux.filter((r) => !r.suspicion).map((r) => ({
      statut: 'protegee', theme: theme(r), chemin: r.chemin, nature: r.type, compte: theme(r) === 'admin' ? 'C' : 'B',
      visible: null, proprietaire: null, replay: null, http: r.http ?? null, gravite: null,
    })),
  ].map((c, i) => ({ ...c, id: `${id}-${i}`, audit: id, quand, application: ligne.application }));
  const verite = [...d.score.failles.map((f) => ({ ...f, theme: f.theme ?? 'lecture', controle: false })),
                  ...(d.score.controles ?? []).map((c) => ({ ...c, theme: c.theme ?? 'lecture', controle: true }))];
  const failles = faillesDe(constats, verite, id);
  return {
    ...commun,
    quand,
    agents: d.agent ?? null,
    // Sans vérité terrain (une application cliente), on compte les failles regroupées ; les fausses alertes ne sont pas mesurables.
    score: d.score.total
      ? { prouvees: d.score.detectees, total: d.score.total, fauxPositifs: d.score.faux_positifs }
      : { prouvees: failles.length, total: 0, fauxPositifs: null },
    verite,
    failles,
    cout: d.cout_dollars ?? null,
    tokens: d.tokens_totaux ?? null,
    duree: d.duree_totale_s ?? null,
    hypotheses: d.hypotheses ?? null,
    mesureGravite: d.gravite ?? null,
    coutHf: d.cout_hf_dollars ?? null,
    constats,
    interventions: d.sessions.map((s, i) => ({
      id: `${id}-s${i}`, audit: id, quand,
      agent: s.cible === 'cartographie' ? 'Explorateur' : 'Vérificateur',
      compte: s.role.replace('Compte ', ''), tache: s.cible,
      statut: STATUTS[s.statut] ?? s.statut ?? null, steps: s.steps ?? null, tokens: s.tokens ?? null,
      cout: s.cout_dollars ?? null, duree: s.duree_s ?? null, replay: s.replay ?? null,
    })),
  };
}

export async function lireAudits() {
  const lignes = await requete(`audits?select=${COLONNES}&order=cree_le.desc`);
  return lignes.map(normaliser);
}

export async function lireAudit(id) {
  if (!UUID.test(id)) return null;
  const [ligne] = await requete(`audits?select=${COLONNES}&id=eq.${id}`);
  return ligne ? normaliser(ligne) : null;
}

// Le fil d'un audit : les événements écrits par le runner après l'événement « apres ».
export async function lireEvenements(id, apres = 0) {
  if (!UUID.test(id)) return [];
  const depuis = Number.isInteger(Number(apres)) ? Number(apres) : 0;
  return requete(`evenements?select=id,quand,type,message,donnees&audit_id=eq.${id}&id=gt.${depuis}&order=id.asc&limit=500`);
}

// Le statut d'un audit, pour le suivi en direct.
export async function lireStatut(id) {
  if (!UUID.test(id)) return null;
  const [ligne] = await requete(`audits?select=statut,erreur&id=eq.${id}`);
  return ligne ?? null;
}
