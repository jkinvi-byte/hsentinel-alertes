// Cycle de vie de la dictée, indépendant de React pour tester les courses asynchrones.
// Les dépendances média et réseau sont fournies par le composant navigateur.
export function creerDictee({ obtenirFlux, creerEnregistreur, transcrire, surEtat = () => {}, surErreur = () => {},
  surTranscription = () => {}, surFlux = () => {}, surSecondes = () => {},
  horloge = () => Date.now(), intervalle = setInterval, effacerIntervalle = clearInterval,
  delai = setTimeout, effacerDelai = clearTimeout, maxEnregistrementMs = 60_000, maxTranscriptionMs = 65_000 }) {
  let actif = true;
  let generation = 0;
  let etat = 'repos';
  let flux = null;
  let enregistreur = null;
  let minuteur = null;
  let attente = null;
  let requete = null;

  const courant = (id) => actif && id === generation;
  const publier = (valeur) => { etat = valeur; if (actif) surEtat(valeur); };
  const fermerFlux = (f) => f?.getTracks().forEach((piste) => piste.stop());

  function libererMicro() {
    effacerIntervalle(minuteur);
    minuteur = null;
    fermerFlux(flux);
    flux = null;
    surFlux(null);
  }

  function nettoyer() {
    // Supprimer les callbacks AVANT stop : certains doubles/navigateurs émettent immédiatement onstop.
    if (enregistreur) {
      enregistreur.onstop = null;
      enregistreur.onerror = null;
      enregistreur.ondataavailable = null;
      if (enregistreur.state !== 'inactive') {
        try { enregistreur.stop(); } catch { /* la libération des pistes reste nécessaire */ }
      }
      enregistreur = null;
    }
    libererMicro();
    effacerDelai(attente);
    attente = null;
    requete?.abort();
    requete = null;
  }

  function annuler() {
    generation += 1;
    nettoyer();
    publier('repos');
  }

  function echouer(id, message) {
    if (!courant(id)) return;
    annuler();
    if (actif) surErreur(message);
  }

  async function envoyer(audio, id) {
    if (!courant(id)) return;
    if (!audio.size) {
      echouer(id, 'Aucun son enregistré. Recommencez ou tapez la consigne.');
      return;
    }
    publier('transcription');
    requete = new AbortController();
    attente = delai(() => echouer(id, 'La transcription prend trop de temps. Réessayez ou tapez la consigne.'), maxTranscriptionMs);
    try {
      const resultat = await transcrire(audio, requete.signal);
      if (!courant(id)) return;
      if (!resultat || typeof resultat.texte !== 'string' || !resultat.texte.trim()) {
        throw new Error('Rien n’a été entendu. Recommencez plus près du micro.');
      }
      surTranscription({ ...resultat, texte: resultat.texte.trim() });
      if (!courant(id)) return;
      effacerDelai(attente);
      attente = null;
      requete = null;
      publier('repos');
    } catch (erreur) {
      if (courant(id)) echouer(id, erreur.message || 'La transcription a échoué. Réessayez ou tapez la consigne.');
    }
  }

  function arreter() {
    if (!actif || etat !== 'enregistrement' || !enregistreur) return;
    // Libérer immédiatement le micro, même si le navigateur retarde l'événement stop.
    publier('transcription');
    try { enregistreur.stop(); }
    catch { echouer(generation, 'L’enregistrement n’a pas pu être terminé. Recommencez.'); }
    finally { libererMicro(); }
  }

  async function commencer() {
    if (!actif || etat !== 'repos') return;
    const id = ++generation;
    publier('permission');
    surErreur(null);
    let nouveauFlux;
    try {
      nouveauFlux = await obtenirFlux();
      if (!courant(id)) { fermerFlux(nouveauFlux); return; }
      flux = nouveauFlux;
      enregistreur = creerEnregistreur(flux);
      const recorder = enregistreur;
      const morceaux = [];
      recorder.ondataavailable = (e) => { if (courant(id) && e.data.size) morceaux.push(e.data); };
      recorder.onerror = () => echouer(id, 'Le micro a interrompu l’enregistrement. Recommencez ou tapez la consigne.');
      recorder.onstop = () => {
        if (!courant(id)) return;
        const type = (recorder.mimeType || 'audio/webm').split(';')[0];
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.ondataavailable = null;
        enregistreur = null;
        libererMicro();
        void envoyer(new Blob(morceaux, { type }), id);
      };
      recorder.start();
      if (!courant(id)) return;
      publier('enregistrement');
      surSecondes(0);
      surFlux(flux);
      const depart = horloge();
      minuteur = intervalle(() => {
        if (!courant(id)) return;
        const ecoule = Math.max(0, horloge() - depart);
        surSecondes(Math.floor(Math.min(ecoule, maxEnregistrementMs) / 1000));
        if (ecoule >= maxEnregistrementMs) arreter();
      }, 250);
    } catch (erreur) {
      if (!courant(id)) { fermerFlux(nouveauFlux); return; }
      echouer(id, erreur.name === 'NotAllowedError'
        ? 'Micro refusé : autorisez-le dans le navigateur, ou tapez la consigne.'
        : 'Le micro n’est pas disponible. Réessayez ou tapez la consigne.');
    }
  }

  return { commencer, arreter, annuler, get etat() { return etat; },
    disposer() { actif = false; generation += 1; nettoyer(); etat = 'repos'; } };
}

export function ajouterTranscription(consigne, texte, maximum = 2000) {
  const resultat = [consigne.trim(), texte.trim()].filter(Boolean).join('\n');
  if ([...resultat].length > maximum) {
    throw new Error(`La dictée dépasse les ${maximum} caractères de la consigne. Raccourcissez le texte puis recommencez.`);
  }
  return resultat;
}

export function studioDisponible(etat, dicteeOccupee) {
  return etat === 'repos' && !dicteeOccupee;
}
