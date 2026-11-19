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

// La voix de l'expert : celle de LEVELS (choix stable, version améliorée d'abord, une phrase par énoncé).
import { choisirVoixParmi, phrases } from '../lib/expert/voix.mjs'

test('la voix choisie suit les préférences de LEVELS, pas l’ordre du système', () => {
  const v = (name, lang = 'fr-FR', extra = {}) => ({ name, lang, voiceURI: name, default: false, ...extra })
  const systeme = [v('Bad News'), v('Jacques', 'fr-FR', { default: true }), v('Thomas'), v('Amélie (améliorée)'), v('Amélie'), v('Samantha', 'en-US')]
  assert.equal(choisirVoixParmi(systeme).name, 'Amélie (améliorée)')
  assert.equal(choisirVoixParmi([v('Bad News'), v('Jacques', 'fr-FR', { default: true })]).name, 'Jacques')
  assert.equal(choisirVoixParmi([v('Thomas', 'fr-CA'), v('Henri', 'fr-FR')]).name, 'Henri')
  assert.equal(choisirVoixParmi([v('Samantha', 'en-US')]), null)
})

test('une phrase par énoncé', () => {
  assert.deepEqual(phrases('Vous devez ouvrir la page. Puis vérifier « Bac+3 » ! Fini…  Oui'), ['Vous devez ouvrir la page.', 'Puis vérifier « Bac+3 » !', 'Fini…', 'Oui'])
  assert.deepEqual(phrases(''), [])
})
