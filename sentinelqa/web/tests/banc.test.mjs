// S-BANC-01 (D-46) : le banc se lance comme les autres scénarios, et seul le banc accepte les écritures de test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cibleReelle, ligneMission } from '../lib/missions.js';
import { libelleStatut } from '../lib/qa-contrat.mjs';

test('Le banc n’est pas un site réel ; Peer Review et Eugenia le restent', () => {
  assert.equal(cibleReelle('https://hsentinel-banc.vercel.app/'), false);
  assert.equal(cibleReelle('https://peer-review-black.vercel.app/etudiant'), true);
  assert.equal(cibleReelle('https://www.eugeniaschool.com/'), true);
});

test('La demande du banc ne porte ni compte, ni écriture, ni adresse fournie par le client', () => {
  const ligne = ligneMission({ schema_version: 2, mode: 'security', target_id: 'paie-express', scenario_id: 'S-BANC-01', instruction: '' });
  assert.deepEqual([ligne.application, ligne.cible, ligne.ecriture_autorisee, ligne.comptes.length, ligne.secrets_chiffres],
    ['Paie Express', 'https://hsentinel-banc.vercel.app/', false, 0, null]);
  assert.throws(() => ligneMission({ schema_version: 2, mode: 'security', target_id: 'peer-review', scenario_id: 'S-BANC-01', instruction: '' }));
});

test('Un contrôle pentest qui échoue est une faille prouvée ; un critère QA, un écart constaté', () => {
  assert.equal(libelleStatut('failed', 'vulnerability_proven'), 'Faille prouvée');
  assert.equal(libelleStatut('failed', 'protected_content_received'), 'Faille prouvée');
  assert.equal(libelleStatut('failed', 'text_missing'), 'Écart constaté');
  assert.equal(libelleStatut('inconclusive', 'write_risk'), 'Mission arrêtée · geste à risque');
});
