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

test('Un écart QA se lit avec son critère, et le nouveau type de faille a son nom', () => {
  const qa = ligneAlerte({ id: 'q1', cree_le: '2026-11-19T03:30:00Z', application_id: 'eugenia-public', theme: 'qa', methode: 'GET',
    chemin: '/programme/bachelor-ia-business', gravite: 'moyenne', critere: 'Texte attendu « Bac+5 » absent',
    raisons: ['le texte attendu n’est plus sur la page servie'], alerte_statut: 'a_traiter' });
  assert.equal(qa.type, 'Écart fonctionnel (QA)');
  assert.deepEqual(qa.raisons, ['Texte attendu « Bac+5 » absent', 'le texte attendu n’est plus sur la page servie']);
  assert.equal(ligneAlerte({ theme: 'compte', methode: 'GET', chemin: '/x', raisons: [] }).type, 'Lecture par un autre compte');
  assert.deepEqual(ligneAlerte({ theme: 'lecture', methode: 'GET', chemin: '/x', raisons: ['r'] }).raisons, ['r']);  // une faille du banc, inchangée
});

test('Un constat de site tiers se lit comme réservé, et une faille du scanner a son nom', () => {
  const tiers = ligneAlerte({ id: 't1', theme: 'qa', methode: 'GET', chemin: '/contact', critere: 'Page en erreur', raisons: [],
    alerte_statut: 'reservee', alerte_erreur: 'Site tiers : pas de ticket public.' });
  assert.equal(tiers.alerte.libelle, 'Réservé à la console · site tiers, pas de ticket public');
  assert.equal(tiers.ticket, null);
  assert.equal(ligneAlerte({ theme: 'http', methode: 'GET', chemin: '/search', raisons: [] }).type, 'Contrôle HTTP du scanner');
});

