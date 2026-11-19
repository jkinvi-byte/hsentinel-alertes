import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MANUEL, rechercher, blocFiches, normaliser, IDS } from '../lib/expert/manuel.mjs'

// D-51 : le Manuel HSentinel, corpus des experts du studio (mécanique du RAG de LEVELS).
test('chaque fiche a un id unique, un volet connu, des alias et des faits', () => {
  assert.equal(IDS.size, MANUEL.length)
  for (const f of MANUEL) {
    assert.ok(['commun', 'qa', 'pentest'].includes(f.volet), f.id)
    assert.ok(f.aliases.length > 0 && f.faits.length > 0, f.id)
    for (const a of f.aliases) assert.ok(normaliser(a).length > 0, `${f.id} : alias vide après normalisation`)
  }
})

test('aucune fiche ne promet ce que le produit ne fait pas', () => {
  const tout = normaliser(MANUEL.flatMap((f) => f.faits).join(' '))
  for (const interdit of ['100 securise', 'remplace un pentest', 'remplace un audit', 'severite']) assert.ok(!tout.includes(interdit), interdit)
})

test('la recherche reste dans le volet : une fiche Pentest ne sort jamais pour l’expert QA, et inversement', () => {
  for (const q of ['comment prouver une faille de lecture', 'gravite critique', 'paie express banc']) {
    assert.ok(rechercher(q, 'qa').every((f) => f.volet !== 'pentest'), q)
  }
  assert.ok(rechercher('pourquoi mon critere reste a confirmer', 'pentest').every((f) => f.volet !== 'qa'))
})

test('les questions types trouvent leurs fiches, accents et majuscules compris', () => {
  assert.deepEqual(rechercher('Pourquoi mon critère reste À CONFIRMER ?', 'qa').map((f) => f.id).slice(0, 1), ['a_confirmer'])
  assert.equal(rechercher('Tu peux faire une injection SQL sur Google ?', 'pentest')[0].id, 'limites')
  assert.ok(rechercher('Comment vous prouvez une faille entre deux comptes ?', 'pentest').some((f) => f.id === 'methode'))
  assert.ok(rechercher('combien ça coûte ?', 'qa').some((f) => f.id === 'cout'))
})

test('sans fiche trouvée, l’expert reçoit la fiche d’ouverture de son volet', () => {
  assert.deepEqual(blocFiches('bonjour', 'qa').ids, ['hsentinel', 'qa'])
  assert.deepEqual(blocFiches('bonjour', 'pentest').ids, ['hsentinel', 'pentest'])
  assert.ok(blocFiches('bonjour', 'qa').texte.startsWith('FICHES DU MANUEL HSENTINEL'))
})
