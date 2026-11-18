'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOGUE, VOLETS } from '../../../lib/missions';
import { Fleche, Icone } from '../../composants';
import FormulaireCobaye from './formulaire-cobaye';
import Studio from '../../qa/studio';

export default function Formulaire({ cle }) {
  const router = useRouter();
  const [mode, setMode] = useState('qa');
  const [scenarioId, setScenarioId] = useState('Q-PUB-01');
  const [instruction, setInstruction] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const scenario = CATALOGUE.scenarios.find((s) => s.id === scenarioId);
  const cible = CATALOGUE.targets.find((t) => t.id === scenario.target_id);
  const disponibles = CATALOGUE.scenarios.filter((s) => s.mode === mode && s.available);
  const preparation = CATALOGUE.scenarios.filter((s) => s.mode === mode && !s.available);

  function changerMode(valeur) {
    setMode(valeur);
    setScenarioId(CATALOGUE.scenarios.find((s) => s.mode === valeur && s.available).id);
    setInstruction('');
    setErreur(null);
  }

  async function envoyer(event) {
    event.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const response = await fetch('/api/audits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schema_version: 2, mode, target_id: cible.id, scenario_id: scenarioId, instruction }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.erreur ?? 'La mission n’a pas pu être lancée.');
      router.push('/audits/' + body.id);
    } catch (e) {
      setErreur(e.message);
      setEnvoi(false);
    }
  }

  // Le volet QA a son studio (consigne tapée ou dictée, plan relu, agent H) : le même que /qa, dans le parcours principal.
  if (mode === 'qa') {
    return (
      <>
        <div className="qa-volet">
          <div className="segment choix-volet" role="group" aria-label="Volet de la mission">
            {Object.entries(VOLETS).map(([valeur, nom]) => (
              <button key={valeur} type="button" aria-pressed={mode === valeur} onClick={() => changerMode(valeur)}>{nom}</button>
            ))}
          </div>
        </div>
        <Studio />
        <p className="qa-lien-historique"><a className="lien-fleche" href="/qa">Les missions QA récentes<Icone nom="sortie" /></a></p>
      </>
    );
  }

  return (
    <>
      <form className="cadrage" onSubmit={envoyer}>
        <div className="bloc">
          <h2><span className="numero">01</span>Le volet à tester</h2>
          <div className="segment choix-volet" role="group" aria-label="Volet de la mission">
            {Object.entries(VOLETS).map(([valeur, nom]) => (
              <button key={valeur} type="button" disabled={envoi} aria-pressed={mode === valeur} onClick={() => changerMode(valeur)}>{nom}</button>
            ))}
          </div>
          <p className="doux">{mode === 'qa' ? 'Vérifier un parcours et son résultat attendu.' : 'Vérifier un contrôle de sécurité et documenter les preuves.'}</p>
          <label className="champ">
            <span>Scénario sur un site autorisé</span>
            <select value={scenarioId} disabled={envoi} onChange={(e) => { setScenarioId(e.target.value); setInstruction(''); }}>
              {disponibles.map((s) => <option key={s.id} value={s.id}>{CATALOGUE.targets.find((t) => t.id === s.target_id).name} · {s.title}</option>)}
            </select>
          </label>
          <p className="mission-cible"><b>{cible.name}</b><br /><span>{cible.entry_url}</span></p>
          <p className="doux">Consultation uniquement, sans connexion ni modification de données pour ces premiers scénarios.</p>
        </div>

        <div className="bloc">
          <h2><span className="numero">02</span>La mission</h2>
          <p>{scenario.instruction}</p>
          <label className="champ">
            <span>Précisions pour l’agent, facultatives</span>
            <textarea rows={3} maxLength={2000} value={instruction} disabled={envoi}
              onChange={(e) => setInstruction(e.target.value)} placeholder="Précisez le parcours dans les limites de ce scénario." />
          </label>
          <div className="mission-attendu"><b>Résultat attendu</b><p>{scenario.expected}</p></div>
          <p className="doux">{scenario.limitations}</p>
          <p className="doux">Budget : {cible.limits.max_steps} actions et {Math.round(cible.limits.max_time_s / 60)} minutes au maximum.</p>
        </div>

        {erreur && <p className="erreur-audit" role="alert">{erreur}</p>}
        <div className="envoi">
          <button type="submit" className="bouton principal" disabled={envoi}>
            {envoi ? 'Envoi de la mission…' : 'Lancer le ' + VOLETS[mode]}<Fleche />
          </button>
          <p className="doux">Le suivi affiche l’exécution et les preuves recueillies.</p>
        </div>
      </form>

      <details className="missions-preparation">
        <summary>Scénarios authentifiés en préparation</summary>
        {preparation.map((s) => (
          <div key={s.id}><h3>{s.title}</h3><p>{s.expected}</p>
            <ul>{s.missing_preconditions.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        ))}
      </details>
      <details className="missions-preparation">
        <summary>Banc interne Paie Express</summary>
        {cle ? <FormulaireCobaye cle={cle} /> : <p className="doux">Le banc avec comptes nécessite la clé publique du runner.</p>}
      </details>
    </>
  );
}
