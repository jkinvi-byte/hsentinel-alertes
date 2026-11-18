import test from 'node:test';
import assert from 'node:assert/strict';
import { ajouterTranscription, creerDictee, studioDisponible } from '../lib/qa-dictee.mjs';

const attente = () => {
  let resolve, reject;
  const promise = new Promise((oui, non) => { resolve = oui; reject = non; });
  return { promise, resolve, reject };
};
const vider = () => new Promise((resolve) => setImmediate(resolve));

function banc(t, options = {}) {
  const b = { pistesFermees: 0, etats: [], textes: [], erreurs: [], appels: [], demandesMicro: 0,
    secondes: [], temps: 0, timers: new Map(), intervals: new Map(), id: 0 };
  b.flux = { getTracks: () => [{ stop: () => { b.pistesFermees += 1; } }] };
  class Recorder {
    constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm;codecs=opus'; }
    start() { this.state = 'recording'; }
    stop() {
      this.state = 'inactive';
      queueMicrotask(() => {
        this.ondataavailable?.({ data: new Blob(options.vide ? [] : ['audio-synthetique']) });
        this.onstop?.();
      });
    }
  }
  const deps = {
    obtenirFlux: () => { b.demandesMicro += 1; return options.permission ?? Promise.resolve(b.flux); },
    creerEnregistreur: () => {
      if (options.erreurRecorder) throw new Error('recorder indisponible');
      b.recorder = new Recorder(); return b.recorder;
    },
    transcrire: (audio, signal) => {
      b.appels.push({ audio, signal });
      return options.transcription ?? Promise.resolve({ texte: ' Ouvre le Bachelor. ', modele: 'fixture', latence_s: 0.1 });
    },
    surEtat: (e) => b.etats.push(e),
    surErreur: (e) => { if (e) b.erreurs.push(e); },
    surTranscription: (r) => b.textes.push(r),
    surSecondes: (s) => b.secondes.push(s),
    horloge: () => b.temps,
    intervalle: (f) => { const id = ++b.id; b.intervals.set(id, f); return id; },
    effacerIntervalle: (id) => b.intervals.delete(id),
    delai: (f) => { const id = ++b.id; b.timers.set(id, f); return id; },
    effacerDelai: (id) => b.timers.delete(id),
  };
  b.controle = creerDictee(deps);
  t.after(() => b.controle.disposer());
  b.avancer = (temps) => { b.temps = temps; for (const f of [...b.intervals.values()]) f(); };
  b.expirer = () => { for (const f of [...b.timers.values()]) f(); };
  return b;
}

test('La dictée devient du texte relisible et libère toutes les ressources', async (t) => {
  const b = banc(t);
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  assert.equal(b.textes[0].texte, 'Ouvre le Bachelor.');
  assert.equal(b.appels.length, 1);
  assert.equal(b.appels[0].audio.type, 'audio/webm');
  assert.equal(b.controle.etat, 'repos');
  assert.ok(b.pistesFermees >= 1);
  assert.equal(b.intervals.size + b.timers.size, 0);
});

test('Deux clics pendant la permission ne demandent qu’un micro', async (t) => {
  const permission = attente();
  const b = banc(t, { permission: permission.promise });
  const premier = b.controle.commencer();
  await b.controle.commencer();
  assert.equal(b.controle.etat, 'permission');
  assert.equal(b.demandesMicro, 1);
  permission.resolve(b.flux);
  await premier;
  assert.equal(b.controle.etat, 'enregistrement');
});

test('Quitter avant la permission ferme le flux arrivé tard, sans capture ni transcription', async (t) => {
  const permission = attente();
  const b = banc(t, { permission: permission.promise });
  const debut = b.controle.commencer();
  b.controle.disposer();
  const etats = [...b.etats];
  permission.resolve(b.flux);
  await debut;
  assert.equal(b.pistesFermees, 1);
  assert.equal(b.recorder, undefined);
  assert.equal(b.appels.length, 0);
  assert.deepEqual(b.etats, etats, 'aucune mise à jour React après démontage');
});

test('Annuler une permission puis recommencer ignore la première réponse', async (t) => {
  const permission = attente();
  const b = banc(t, { permission: permission.promise });
  const debut = b.controle.commencer();
  b.controle.annuler();
  permission.resolve(b.flux);
  await debut;
  assert.equal(b.controle.etat, 'repos');
  assert.equal(b.recorder, undefined);
  assert.equal(b.pistesFermees, 1);
});

test('Le refus du micro rend immédiatement la saisie disponible', async (t) => {
  const erreur = new Error('refus'); erreur.name = 'NotAllowedError';
  const b = banc(t, { permission: Promise.reject(erreur) });
  await b.controle.commencer();
  assert.equal(b.controle.etat, 'repos');
  assert.match(b.erreurs[0], /Micro refusé/);
  assert.equal(b.appels.length, 0);
});

test('Un échec de construction de MediaRecorder ferme aussi le micro', async (t) => {
  const b = banc(t, { erreurRecorder: true });
  await b.controle.commencer();
  assert.equal(b.controle.etat, 'repos');
  assert.equal(b.pistesFermees, 1);
  assert.equal(b.appels.length, 0);
});

test('Annuler un enregistrement ne déclenche aucun envoi audio', async (t) => {
  const b = banc(t);
  await b.controle.commencer();
  b.controle.annuler();
  await vider();
  assert.equal(b.appels.length, 0);
  assert.equal(b.textes.length, 0);
  assert.equal(b.pistesFermees, 1);
  assert.equal(b.controle.etat, 'repos');
});

test('Le micro se ferme dès l’arrêt, avant la réponse de transcription', async (t) => {
  const transcription = attente();
  const b = banc(t, { transcription: transcription.promise });
  await b.controle.commencer();
  b.controle.arreter();
  assert.ok(b.pistesFermees >= 1);
  await vider();
  assert.equal(b.controle.etat, 'transcription');
  assert.equal(b.textes.length, 0);
});

test('Annuler la transcription coupe la requête et ignore une réponse tardive', async (t) => {
  const transcription = attente();
  const b = banc(t, { transcription: transcription.promise });
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  b.controle.annuler();
  assert.equal(b.appels[0].signal.aborted, true);
  transcription.resolve({ texte: 'Une ancienne consigne' });
  await vider();
  assert.equal(b.textes.length, 0);
  assert.equal(b.controle.etat, 'repos');
  assert.equal(b.erreurs.length, 0);
});

test('Une ancienne transcription ne peut pas interrompre un nouvel enregistrement', async (t) => {
  const transcription = attente();
  const b = banc(t, { transcription: transcription.promise });
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  b.controle.annuler();
  await b.controle.commencer();
  transcription.resolve({ texte: 'Ancienne réponse' });
  await vider();
  assert.equal(b.controle.etat, 'enregistrement');
  assert.equal(b.recorder.state, 'recording');
  assert.equal(b.textes.length, 0);
});

test('Quitter pendant la transcription annule la requête sans modifier la consigne', async (t) => {
  const transcription = attente();
  const b = banc(t, { transcription: transcription.promise });
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  b.controle.disposer();
  const etats = [...b.etats];
  transcription.resolve({ texte: 'Trop tard' });
  await vider();
  assert.equal(b.appels[0].signal.aborted, true);
  assert.equal(b.textes.length, 0);
  assert.deepEqual(b.etats, etats);
});

test('Une transcription qui ne répond pas expire et permet de recommencer', async (t) => {
  const b = banc(t, { transcription: attente().promise });
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  b.expirer();
  assert.equal(b.appels[0].signal.aborted, true);
  assert.equal(b.controle.etat, 'repos');
  assert.match(b.erreurs[0], /trop de temps/);
  assert.equal(b.timers.size, 0);
});

test('Une minute d’audio déclenche un seul arrêt et une seule transcription', async (t) => {
  const b = banc(t);
  await b.controle.commencer();
  b.avancer(60_000);
  b.avancer(61_000);
  await vider();
  assert.equal(b.appels.length, 1);
  assert.equal(b.secondes.at(-1), 60);
  assert.equal(b.controle.etat, 'repos');
});

test('Un enregistrement vide n’est pas envoyé au fournisseur', async (t) => {
  const b = banc(t, { vide: true });
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  assert.equal(b.appels.length, 0);
  assert.match(b.erreurs[0], /Aucun son/);
});

test('Une erreur du recorder ferme le micro et conserve la consigne', async (t) => {
  const b = banc(t);
  await b.controle.commencer();
  b.recorder.onerror();
  await vider();
  assert.equal(b.controle.etat, 'repos');
  assert.equal(b.pistesFermees, 1);
  assert.equal(b.appels.length + b.textes.length, 0);
});

test('Un texte vide ou une panne de transcription ne produisent aucune consigne', async (t) => {
  const b = banc(t, { transcription: Promise.resolve({ texte: '   ' }) });
  await b.controle.commencer();
  b.controle.arreter();
  await vider();
  assert.equal(b.textes.length, 0);
  assert.equal(b.controle.etat, 'repos');
  assert.match(b.erreurs[0], /Rien n’a été entendu/);
});

test('Le studio attend la fin de chaque phase de dictée, même avec un plan déjà prêt', () => {
  for (const etat of ['permission', 'enregistrement', 'transcription']) {
    assert.equal(studioDisponible('repos', etat !== 'repos'), false, etat);
  }
  assert.equal(studioDisponible('preparation', false), false);
  assert.equal(studioDisponible('envoi', false), false);
  assert.equal(studioDisponible('repos', false), true);
});

test('La transcription s’ajoute au texte sans le tronquer et respecte la limite de caractères', () => {
  assert.equal(ajouterTranscription('Ouvre le menu.', ' Vérifie le titre. '), 'Ouvre le menu.\nVérifie le titre.');
  assert.equal(ajouterTranscription('', '🙂'.repeat(2000)).length, 4000, 'la limite compte les caractères Unicode');
  assert.throws(() => ajouterTranscription('x'.repeat(1999), 'Encore'), /2000 caractères/);
  assert.throws(() => ajouterTranscription('', 'x'.repeat(2001)), /2000 caractères/);
});
