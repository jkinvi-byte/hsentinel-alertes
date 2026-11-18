// Le contrat du volet QA côté web : mêmes règles que runner/qa_moteur.py (le runner revalide toujours).
import test from 'node:test';
import assert from 'node:assert/strict';
import { bilanCriteres, cheminCible, cibleQa, libelleStatut, urlCapture, validerMissionQa } from '../lib/qa-contrat.mjs';

const cible = cibleQa('eugenia-public');
const base = { schema_version: 3, mode: 'qa', target_id: 'eugenia-public', pilotage: 'guide', instruction: 'Essai',
  plan: { titre: 'Essai', etapes: ['Ouvrir le menu'], criteres: [{ type: 'page', description: 'Le Bachelor', valeur: '/programme/bachelor-ia-business' }] } };

test('Le périmètre des adresses : l’origine exacte, sans identifiants', () => {
  assert.equal(cheminCible(cible, 'https://www.eugeniaschool.com/programme/bachelor-ia-business/?x=1#a'), '/programme/bachelor-ia-business');
  assert.equal(cheminCible(cible, '/contact'), '/contact');
  assert.equal(cheminCible(cible, 'https://eugeniaschool.com.evil.test/'), null);
  assert.equal(cheminCible(cible, 'https://user:pass@www.eugeniaschool.com/'), null);
  assert.equal(cheminCible(cible, 'https://www.google.com/'), null);
});

test('Le plan est revalidé et renuméroté par le serveur', () => {
  const m = validerMissionQa({ ...base, plan: { criteres: [
    { id: 'C9', type: 'texte', description: 'Un texte sans valeur', valeur: '' },
    { type: 'page', description: 'Une page hors site', valeur: 'https://ailleurs.test/x' },
    { type: 'page', description: 'Le Bachelor', valeur: 'https://www.eugeniaschool.com/programme/bachelor-ia-business' },
  ] } });
  assert.deepEqual(m.plan.criteres.map((c) => [c.id, c.type, c.valeur]),
    [['C1', 'constat', ''], ['C2', 'page', ''], ['C3', 'page', '/programme/bachelor-ia-business']]);
});

test('Les formes inconnues sont refusées, l’exploration n’a pas de plan', () => {
  for (const defaut of [{ url: 'https://ailleurs.test' }, { pilotage: 'pentest' }, { target_id: 'inconnue' }, { plan: null },
    { modele_h: 'gpt' }, { instruction: 'x'.repeat(2001) }, { schema_version: 2 }, { preparation_humaine_s: -1 }]) {
    assert.throws(() => validerMissionQa({ ...base, ...defaut }), undefined, JSON.stringify(defaut));
  }
  assert.throws(() => validerMissionQa({ ...base, plan: { criteres: [{ type: 'requete_sql', description: 'd' }] } }));
  assert.equal(validerMissionQa({ ...base, pilotage: 'exploration', plan: null }).plan, null);
});

test('Les étiquettes d’un résultat et le bilan des critères', () => {
  assert.equal(libelleStatut('inconclusive', 'agent_reported_gap'), 'Écart signalé · à confirmer');
  assert.equal(libelleStatut('inconclusive', 'repeated_attempts'), 'Parcours difficile · à revoir');
  assert.equal(libelleStatut('failed', 'text_missing'), 'Écart constaté');
  const ancien = { results: [{ type: 'page', status: 'passed' }, { type: 'auto', status: 'passed' }, { type: 'texte', status: 'failed' }] };
  assert.deepEqual(bilanCriteres(ancien), { passed: 1, failed: 1, inconclusive: 0, skipped: 0 });
});

test('L’adresse d’une capture passe par notre serveur, encodée', () => {
  const u = urlCapture('d9e0ae67-0b4c-4fcd-bf1d-1fca1da8db27', 'https://agp.eu.hcompany.ai/api/v1/trajectories/x/resources/b/k.png');
  assert.ok(u.startsWith('/api/qa/captures?session=d9e0ae67'));
  assert.ok(!u.includes('https://agp'), 'la source est encodée, jamais copiée telle quelle');
});
