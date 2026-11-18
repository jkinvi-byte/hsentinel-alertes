import test from 'node:test'
import assert from 'node:assert/strict'
import { alertFilters } from '../lib/alerts-contract.mjs'
import { bilanAlertes, ligneAlerte } from '../../web/lib/alertes-format.mjs'

test('Un filtre invalide est refusé au lieu d’afficher silencieusement toutes les applications', () => {
  assert.deepEqual(alertFilters(new URLSearchParams()), { application: null, limite: 50 })
  assert.deepEqual(alertFilters(new URLSearchParams('application=peer-review&limite=10')), { application: 'peer-review', limite: 10 })
  for (const input of ['application=peer.review', 'application=all%26other', 'limite=0', 'limite=201', 'limite=1.5', 'limite=50abc', 'limite=']) {
    assert.throws(() => alertFilters(new URLSearchParams(input)), input)
  }
})
test('La vue conserve attente, échec, ticket et e-mail inconnu sans inventer un envoi', () => {
  const base = { id: 'synthetic', gravite: 'critique', methode: 'GET', chemin: '/test', theme: 'lecture', application_id: 'test-app' }
  const pending = ligneAlerte({ ...base, alerte_statut: 'a_traiter', github_issue_number: null })
  const failed = ligneAlerte({ ...base, id: 'failed', alerte_statut: 'echec', alerte_erreur: 'Erreur synthétique', github_issue_number: 7, email_envoye: false })
  assert.equal(pending.ticket, null)
  assert.equal(pending.alerte.email_envoye, null)
  assert.equal(pending.alerte.libelle, 'Alerte en attente')
  assert.match(failed.ticket.url, /\/issues\/7$/)
  assert.match(failed.alerte.libelle, /échec/)
  assert.equal(bilanAlertes([pending, failed]).envoyees, 0)
  assert.equal(bilanAlertes([pending, failed]).en_echec, 1)
})
