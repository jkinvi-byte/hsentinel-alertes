'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATALOGUE_QA, MODELES_H, TYPES_CRITERES, nomModele, typo } from '../../lib/qa-contrat.mjs';
import { Fleche, Icone } from '../composants';
import Dictee from './dictee';
import { ajouterTranscription, studioDisponible } from '../../lib/qa-dictee.mjs';

const NOMS_H = { 'holo4-35b-a3b': 'Flash', 'holo4-27b': 'Pro' };
const secondesFr = (s) => (s == null ? 'un temps non mesuré' : `${String(s).replace('.', ',')} s`);

export default function Studio() {
  const router = useRouter();
  const [targetId, setTargetId] = useState(CATALOGUE_QA.cibles[0].id);
  const [pilotage, setPilotage] = useState('guide');
  const [appareil, setAppareil] = useState('ordinateur');
  const [modele, setModele] = useState(MODELES_H[0]);
  const [instruction, setInstruction] = useState('');
  const [voix, setVoix] = useState(false);
  const [dicteeOccupee, setDicteeOccupee] = useState(false);
  const dicteeEnCours = useRef(false);
  const [plan, setPlan] = useState(null);
  const [planPour, setPlanPour] = useState(null);
  const [etat, setEtat] = useState('repos');
  const [erreur, setErreur] = useState(null);
  const debut = useRef(null);
  const cible = CATALOGUE_QA.cibles.find((c) => c.id === targetId);
  const limites = cible.limites[pilotage];
  const perime = Boolean(plan) && planPour !== instruction.trim();
  const disponible = studioDisponible(etat, dicteeOccupee);
  const pret = disponible && (pilotage === 'exploration' || (plan && !perime));
  const occupe = !disponible;

  const marquerDebut = () => { debut.current ??= Date.now(); };

  async function preparer() {
    if (dicteeEnCours.current || etat !== 'repos') return;
    marquerDebut();
    setEtat('preparation');
    setErreur(null);
    const consigne = instruction.trim();
    try {
      const reponse = await fetch('/api/qa/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_id: targetId, instruction: consigne }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? 'Le plan n’a pas pu être préparé.');
      setPlan(corps.plan);
      setPlanPour(consigne);
    } catch (e) {
      setErreur(e.message);
    }
    setEtat('repos');
  }

  function retirer(index) {
    setPlan((p) => ({ ...p, criteres: p.criteres.filter((_, i) => i !== index) }));
  }

  async function lancer(event) {
    event.preventDefault();
    if (!pret || dicteeEnCours.current) return;
    setEtat('envoi');
    setErreur(null);
    const mission = {
      schema_version: 3, mode: 'qa', target_id: targetId, pilotage, appareil, modele_h: modele,
      instruction: pilotage === 'guide' ? instruction.trim() : '', source: pilotage === 'guide' && voix ? 'voix' : 'texte',
      plan: pilotage === 'guide' ? plan : null,
      preparation_humaine_s: debut.current ? Math.round((Date.now() - debut.current) / 1000) : null,
    };
    try {
      const reponse = await fetch('/api/qa/missions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mission) });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? 'La mission n’a pas pu être lancée.');
      router.push(`/qa/${corps.id}`);
    } catch (e) {
      setErreur(e.message);
      setEtat('repos');
    }
  }

  return (
    <form className="qa-studio" onSubmit={lancer}>
      <div className="bloc">
        <h2><span className="numero">01</span>Le site et l’agent</h2>
        <label className="champ">
          <span>Site autorisé</span>
          <select value={targetId} disabled={occupe} onChange={(e) => { setTargetId(e.target.value); setPlan(null); }}>
            {CATALOGUE_QA.cibles.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </label>
        <p className="qa-origine">{cible.entree} · consultation seule, sans connexion ni formulaire envoyé</p>
        <div className="qa-reglages">
          <div className="champ">
            <span>Écran</span>
            <div className="segment" role="group" aria-label="Écran testé">
              {Object.entries(CATALOGUE_QA.appareils).map(([valeur, libelle]) => (
                <button key={valeur} type="button" disabled={occupe} aria-pressed={appareil === valeur} onClick={() => setAppareil(valeur)}>
                  {libelle.split(' · ')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="champ">
            <span>Modèle de l’agent H</span>
            <div className="segment" role="group" aria-label="Modèle de l’agent H">
              {MODELES_H.map((m) => (
                <button key={m} type="button" disabled={occupe} aria-pressed={modele === m} onClick={() => setModele(m)}>{NOMS_H[m]}</button>
              ))}
            </div>
          </div>
        </div>
        <p className="qa-note">{CATALOGUE_QA.appareils[appareil]} · Holo {NOMS_H[modele]} ({modele}){modele === MODELES_H[0] ? ', le plus rapide' : ', plus lent et plus sûr sur les parcours complexes'}.</p>
      </div>

      <div className="bloc">
        <h2><span className="numero">02</span>La consigne</h2>
        <div className="segment pilotage" role="group" aria-label="Pilotage de la mission">
          {Object.keys(CATALOGUE_QA.pilotages).map((p) => (
            <button key={p} type="button" disabled={occupe} aria-pressed={pilotage === p} onClick={() => setPilotage(p)}>
              {p === 'guide' ? 'Parcours guidé' : 'Exploration bornée'}
            </button>
          ))}
        </div>
        {pilotage === 'guide' ? (
          <>
            <label className="champ">
              <span>Ce que l’agent doit vérifier</span>
              <textarea maxLength={2000} value={instruction} disabled={occupe}
                placeholder="Par exemple : depuis l’accueil, ouvre le menu Programmes puis le Bachelor, et vérifie que la page propose de candidater."
                onChange={(e) => { marquerDebut(); setInstruction(e.target.value); }} />
            </label>
            <p className="qa-note">Un texte qui doit apparaître mot pour mot se met entre guillemets : « 4 étapes ». Le code le cherchera tel quel dans la page.</p>
            <Dictee desactive={occupe} onDebut={marquerDebut}
              onOccupation={(valeur) => { dicteeEnCours.current = valeur; setDicteeOccupee(valeur); }}
              onTexte={(texte) => {
                const nouvelle = ajouterTranscription(instruction, texte);
                setVoix(true);
                setInstruction(nouvelle);
              }}
              suite={(
                <button type="button" className="bouton" disabled={!instruction.trim() || occupe} onClick={preparer}>
                  {etat === 'preparation' ? 'Préparation du plan…' : plan && !perime ? 'Préparer de nouveau' : 'Préparer le plan'}
                </button>
              )} />
          </>
        ) : (
          <p className="qa-exploration">
            Sans consigne, l’agent ouvre une à une les entrées du menu principal, {cible.limites.exploration.max_pages} pages au plus, et relève
            sur chacune le titre et les problèmes visibles. Le code vérifie que chaque page s’ouvre, que chaque titre cité existe vraiment et
            que chaque lien affiché mène à une page.
          </p>
        )}
      </div>

      {pilotage === 'guide' && plan && (
        <div className="bloc qa-plan">
          <h2><span className="numero">03</span>Le plan à relire</h2>
          {perime && <p className="qa-perime">La consigne a changé depuis la préparation : préparez de nouveau le plan avant de lancer l’agent.</p>}
          <h3>{typo(plan.titre)}</h3>
          <div>
            <p className="kicker">Les critères que le code vérifiera</p>
            <ol className="qa-criteres-plan">
              {plan.criteres.map((c, i) => (
                <li key={`${c.type}-${c.description}`}>
                  <span className="id">C{i + 1}</span>
                  <div>
                    <span className="kicker type">{TYPES_CRITERES[c.type]}</span>
                    {c.description}
                    {c.valeur && <span className="valeur">{c.type === 'page' ? c.valeur : `« ${c.valeur} »`}</span>}
                  </div>
                  <button type="button" className="bouton icone" aria-label={`Retirer le critère C${i + 1}`}
                    disabled={occupe || plan.criteres.length === 1} onClick={() => retirer(i)}>
                    <Icone nom="croix" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
          {plan.etapes.length > 0 && (
            <div>
              <p className="kicker">Les gestes prévus</p>
              <ol className="qa-etapes-plan">{plan.etapes.map((e) => <li key={e}>{e}</li>)}</ol>
            </div>
          )}
          {plan.hors_perimetre.length > 0 && (
            <div className="qa-hors"><b>L’agent ne le fera pas</b>, la mission est en consultation seule :
              <ul>{plan.hors_perimetre.map((h) => <li key={h}>{h}</li>)}</ul></div>
          )}
          {plan.inconnues.length > 0 && (
            <div className="qa-hors"><b>À préciser si besoin</b>, sinon l’agent tranchera à l’écran :
              <ul>{plan.inconnues.map((h) => <li key={h}>{h}</li>)}</ul></div>
          )}
          {plan.preparation && (
            <p className="qa-note">
              Préparé par <b>{nomModele(plan.preparation.modele)}</b> via Hugging Face en {secondesFr(plan.preparation.latence_s)}.
              Hugging Face prépare le plan ; il ne juge pas : chaque critère est vérifié par le code sur ce que le navigateur a affiché.
            </p>
          )}
        </div>
      )}

      {erreur && <p className="erreur-audit" role="alert">{erreur}</p>}
      <div className="envoi">
        <button type="submit" className="bouton principal" disabled={!pret}>
          {etat === 'envoi' ? 'Envoi de la mission…' : 'Lancer l’agent'}<Fleche />
        </button>
        <p className="doux">
          {pilotage === 'guide' && !plan ? 'Préparez puis relisez le plan pour lancer l’agent.'
            : `${limites.max_steps} actions et ${Math.round(limites.max_time_s / 60)} minutes au plus · arrêt possible à tout moment.`}
        </p>
      </div>
    </form>
  );
}
