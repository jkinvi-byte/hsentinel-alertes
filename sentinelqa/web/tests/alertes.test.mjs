// Les alertes des failles prouvées, telles que la web les affiche.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bilanAlertes, ligneAlerte } from '../lib/alertes-format.mjs';

const constat = {
  id: 'c1', cree_le: '2026-11-18T21:00:00Z', application_id: 'paie-express', audit_id: null, audit_le: '2026-11-17T07:51:00Z', version: null,
  theme: 'lecture', methode: 'GET', chemin: '/fiches-de-paie/1041', gravite: 'critique', donnees: ['salaires'],
  raisons: ['une autre entreprise peut lire ces données'], similarite: 1, confirme_ecran: true, alerte_statut: 'traitee',
  alerte_tentatives: 1, github_issue_number: 7, email_envoye: true, alerte_erreur: null,
};

test('Une faille prouvée devient une ligne lisible, avec son ticket', () => {
  const a = ligneAlerte(constat);
  assert.equal(a.acces, 'GET /fiches-de-paie/1041');
  assert.equal(a.type, 'Lecture par une autre entreprise');
  assert.deepEqual(a.ticket, { numero: 7, url: 'https://github.com/jkinvi-byte/hsentinel-alertes/issues/7' });
  assert.equal(a.alerte.libelle, 'Alerte envoyée');
  assert.equal(a.quand, '2026-11-17T07:51:00Z');
  const sansTicket = ligneAlerte({ ...constat, github_issue_number: null, alerte_statut: 'echec', alerte_erreur: 'GitHub injoignable' });
  assert.equal(sansTicket.ticket, null);
  assert.match(sansTicket.alerte.libelle, /reprise/);
});

test('Le bilan compte les gravités, les alertes envoyées et les tickets distincts', () => {
  const alertes = [constat, { ...constat, id: 'c2' }, { ...constat, id: 'c3', gravite: 'faible', alerte_statut: 'echec', github_issue_number: null }]
    .map(ligneAlerte);
  assert.deepEqual(bilanAlertes(alertes), { total: 3, par_gravite: { critique: 2, 'élevée': 0, moyenne: 0, faible: 1 }, envoyees: 2, en_echec: 1, tickets: 1 });
});
