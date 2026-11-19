import catalogue from '../../contrats/catalogue.json' with { type: 'json' };

export const CATALOGUE = catalogue;
export const RESULTATS = {
  passed: 'Conforme au scénario', failed: 'Écart constaté',
  inconclusive: 'Non concluant', skipped: 'Non exécuté',
};
export const VOLETS = { qa: 'QA', security: 'Pentest' };

// Contrat partagé avec runner/missions.py. Le client ne fournit jamais d'URL ou de politique.
export function validerMission(d) {
  const champs = new Set(['schema_version', 'target_id', 'scenario_id', 'mode', 'instruction']);
  if (!d || typeof d !== 'object' || Array.isArray(d) || d.schema_version !== 2 || Object.keys(d).some((k) => !champs.has(k))) {
    throw new Error('Le format de la mission est invalide.');
  }
  const scenario = catalogue.scenarios.find((s) => s.id === d.scenario_id);
  if (!scenario || scenario.target_id !== d.target_id || scenario.mode !== d.mode) {
    throw new Error('La cible, le scénario et le volet ne correspondent pas au catalogue.');
  }
  const instruction = d.instruction ?? '';
  if (typeof instruction !== 'string' || [...instruction].length > 2000) {
    throw new Error('La consigne doit être un texte de 2 000 caractères au maximum.');
  }
  const target = catalogue.targets.find((t) => t.id === scenario.target_id);
  return { target, scenario, request: {
    target_id: target.id, scenario_id: scenario.id, mode: scenario.mode, instruction: instruction.trim(),
  } };
}

export function ligneMission(d) {
  const { target, request } = validerMission(d);
  return {
    statut: 'en_attente', application: target.name, cible: target.entry_url,
    comptes: [], perimetre: [], ecriture_autorisee: false, secrets_chiffres: null, cle_runner: null,
    // Enveloppe versionnée dans le JSON existant : pas de migration distante pour ce premier lot.
    // phase distingue une demande en file d'un rapport terminé.
    rapport: { schema_version: 2, phase: 'queued', request },
  };
}

export function cibleReelle(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/\.$/, '');
    // Les sites réels du catalogue refusent toute écriture (D-24) ; le banc, qui les accepte (business_writes, D-45), n'en est pas un.
    return catalogue.targets.some((t) => !t.business_writes && new URL(t.origin).hostname === host);
  } catch { return false; }
}

export function rapportArretAvantDepart(enveloppe, instant = new Date().toISOString()) {
  const { request, target, scenario } = validerMission({ schema_version: 2, ...enveloppe.request });
  return {
    schema_version: 2, phase: 'completed', request, scenario_title: scenario.title, scenario_version: scenario.version,
    scope_snapshot: target, started_at: instant, finished_at: instant, duration_s: 0, cost_h: 0, cost_hf: 0, human_minutes: null,
    results: [{ scenario_id: scenario.id, status: 'skipped', reason_code: 'cancelled_before_start',
      expected: scenario.expected, observed: 'Mission arrêtée avant son exécution.', limitations: scenario.limitations, evidence_references: [] }],
    summary: { passed: 0, failed: 0, inconclusive: 0, skipped: 1 }, evidence: [], sessions: [],
  };
}

export function normaliserMission(ligne, commun) {
  const d = ligne.rapport;
  const fini = d.phase === 'completed';
  return {
    ...commun, version: 2, mode: d.request.mode, mission: d,
    quand: d.started_at ?? ligne.cree_le, agents: 'H · scénario en consultation',
    score: fini ? { prouvees: d.request.mode === 'security' ? (d.summary.failed ?? 0) : 0, total: 0, fauxPositifs: null } : null,
    bilan: fini ? d.summary : null, verite: [], constats: [], failles: [], hypotheses: null,
    cout: d.cost_h ?? null, coutHf: d.cost_hf ?? null, duree: d.duration_s ?? null, tokens: null,
    interventions: (d.sessions ?? []).map((s, i) => ({
      id: `${ligne.id}-s${i}`, agent: VOLETS[d.request.mode], compte: s.role, tache: s.cible,
      statut: s.statut, steps: s.steps, tokens: s.tokens, cout: s.cout_dollars, duree: s.duree_s, replay: s.replay,
    })),
  };
}
