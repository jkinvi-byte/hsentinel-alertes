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

import { transcriptionUtile } from '../lib/expert/voix.mjs'
test('les phrases fantômes de Whisper ne sont pas des questions', () => {
  // « Thank you. » : le bip du micro de recette, transcrit par Whisper le 19/11, auquel l'expert avait répondu.
  for (const fantome of ['', '…', 'Merci.', 'Sous-titres réalisés par la communauté d’Amara.org', 'Merci d’avoir regardé !', 'Euh.', 'Sous-titrage ST’ 501',
    'Thank you.', 'Thank you so much!', 'Thanks for watching!', 'you', 'Bye.', 'Sous-titrage Société Radio-Canada'])
    assert.equal(transcriptionUtile(fantome), false, fantome)
  for (const vraie of ['Comment je vérifie le Bachelor ?', 'Pourquoi mon critère reste à confirmer ?', 'Merci, et pour le Pentest ?', 'Thank you, and what about Peer Review?'])
    assert.equal(transcriptionUtile(vraie), true, vraie)
})

import { mots, planMots, motsDits, accueilExpert, typographie } from '../lib/expert/conversation.mjs'
test('les mots s’allument au rythme de la voix, au prorata des lettres', () => {
  // Les espaces insécables restent dans le mot : « Bac+3 » ne se coupe pas.
  assert.deepEqual(mots('Vérifiez «\u00a0Bac+3\u00a0» ici.'), ['Vérifiez', '«\u00a0Bac+3\u00a0»', 'ici.'])
  assert.deepEqual(mots(''), [])
  // Le modèle écrit souvent les guillemets avec des espaces ordinaires : ils se soudent au mot, comme ? et !.
  assert.deepEqual(mots('les mots exacts « Bac+3 ».'), ['les', 'mots', 'exacts', '«\u00a0Bac+3\u00a0».'])
  assert.deepEqual(mots('Que voulez-vous vérifier ?'), ['Que', 'voulez-vous', 'vérifier\u202f?'])
  assert.deepEqual(mots('« Bac+3 »'), ['«\u00a0Bac+3\u00a0»'])
  assert.equal(typographie('Comment je vérifie Bac plus 3?'), 'Comment je vérifie Bac plus 3?')
  assert.equal(typographie('Attention : la page « Programmes » !'), 'Attention\u202f: la page «\u00a0Programmes\u00a0»\u202f!')
  const plan = planMots(['Un deux trois.', 'Quatre cinq.'])
  assert.deepEqual(plan.map((l) => [l.debut, l.total]), [[0, 3], [3, 2]])
  // Au départ, le premier mot s'allume (la voix l'attaque) ; à la fin, toute la phrase ; jamais la phrase suivante.
  assert.equal(motsDits(plan, 0, 0), 1)
  assert.equal(motsDits(plan, 0, 1), 3)
  assert.equal(motsDits(plan, 1, 0), 4)
  assert.equal(motsDits(plan, 1, 1), 5)
  // Un mot plus long dure plus longtemps : à mi-phrase, « Un » et « deux » sont dits, pas « trois. ».
  assert.equal(motsDits(plan, 0, 0.4), 2)
  // Une durée inconnue (NaN) ou une phrase absente ne font rien avancer.
  assert.equal(motsDits(plan, 0, Number.NaN), 1)
  assert.equal(motsDits(plan, 7, 0.5), 0)
})

test('l’expert ouvre la conversation d’après la cible à l’écran, et reprend sans se représenter', () => {
  assert.equal(accueilExpert({ volet: 'qa', cible: 'Eugenia School' }), 'Je suis l’expert QA. Nous préparons une mission sur Eugenia School. Que voulez-vous vérifier ?')
  assert.match(accueilExpert({ volet: 'pentest', cible: 'Peer Review' }), /^Je suis l’expert Pentest\. .*sur Peer Review/)
  assert.equal(accueilExpert({ volet: 'qa' }), 'Je suis l’expert QA. Nous préparons une mission. Que voulez-vous vérifier ?')
  assert.equal(accueilExpert({ volet: 'pentest', cible: 'Peer Review', reprise: true }), 'Reprenons. Que voulez-vous préciser ?')
  // Chaque phrase de l'accueil se lit seule (une phrase par énoncé) et se termine par sa ponctuation.
  for (const v of ['qa', 'pentest']) for (const p of phrases(accueilExpert({ volet: v, cible: 'X' }))) assert.match(p, /[.?!]$/)
})

import { nettoyerTranscription, questionTranscrite } from '../lib/expert/voix.mjs'
test('la queue fantôme de Whisper (« you you », « Merci. ») est retirée, la phrase reste', () => {
  // Le 20/11, une écoute trop longue a donné « …Bac plus 3? you you » : l'expert recevait ces mots fantômes.
  assert.equal(nettoyerTranscription('Comment je vérifie que la page affiche Bac plus 3? you you'), 'Comment je vérifie que la page affiche Bac plus 3?')
  assert.equal(nettoyerTranscription('Vérifie la page du Bachelor. Merci.'), 'Vérifie la page du Bachelor.')
  assert.equal(nettoyerTranscription('Vérifie la page du Bachelor, thank you.'), 'Vérifie la page du Bachelor')
  assert.equal(nettoyerTranscription('Vérifie le menu « Youpi ».'), 'Vérifie le menu « Youpi ».')
  assert.equal(nettoyerTranscription(''), '')
})

test('la question transcrite : un fantôme entier reste un fantôme, une queue fantôme est retirée', () => {
  // Le 20/11, nettoyer d'abord changeait « Thank you. » en « Thank », que l'expert prenait pour une question.
  assert.equal(questionTranscrite('Thank you.'), null)
  assert.equal(questionTranscrite('you you'), null)
  assert.equal(questionTranscrite('Merci.'), null)
  assert.equal(questionTranscrite('Comment je vérifie Bac plus 3? you you'), 'Comment je vérifie Bac plus 3?')
  assert.equal(questionTranscrite('Vérifie le Bachelor et son diplôme.'), 'Vérifie le Bachelor et son diplôme.')
})
