'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COMPTES_DEMO } from '../../../lib/demo';
import { Fleche } from '../../composants';

const VIDES = [
  { cle: 'A', email: '', mdp: '', entreprise: '', acces: 'admin' },
  { cle: 'B', email: '', mdp: '', entreprise: '', acces: 'admin' },
  { cle: 'C', email: '', mdp: '', entreprise: '', acces: 'salarie' },
];
const ROLES = {
  A: 'Administrateur de l’entreprise 1 : ses pages servent de référence',
  B: 'Administrateur de l’entreprise 2 : il tente de lire et de modifier les données de A',
  C: 'Salarié de l’entreprise 1 : il tente d’entrer dans les pages réservées',
};
// RSA-OAEP 3072 bits avec SHA-256 chiffre au plus 318 octets : on garde une marge.
const OCTETS_MAX = 300;

async function chiffrer(jwk, texte) {
  const octets = new TextEncoder().encode(texte);
  if (octets.length > OCTETS_MAX) throw new Error('Les trois mots de passe sont trop longs pour être chiffrés ensemble.');
  const cle = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, cle, octets));
  return btoa(String.fromCharCode(...chiffre));
}

export default function FormulaireCobaye({ cle }) {
  const router = useRouter();
  const [application, setApplication] = useState('');
  const [cible, setCible] = useState('');
  const [comptes, setComptes] = useState(VIDES);
  const [perimetre, setPerimetre] = useState('');
  const [ecriture, setEcriture] = useState(false);
  const [atteste, setAtteste] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  const changer = (i, champ, valeur) => setComptes((c) => c.map((x, j) => (j === i ? { ...x, [champ]: valeur } : x)));

  async function envoyer(evenement) {
    evenement.preventDefault();
    setErreur(null);
    setEnvoi(true);
    try {
      const secrets = await chiffrer(cle.jwk, JSON.stringify(Object.fromEntries(comptes.map((c) => [c.cle, c.mdp]))));
      const reponse = await fetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application, cible, ecriture_autorisee: ecriture, atteste, cle_runner: cle.id, secrets_chiffres: secrets,
          perimetre: perimetre.split(/[\n,]/).map((p) => p.trim()).filter(Boolean),
          comptes: comptes.map(({ cle: lettre, email, entreprise, acces }) => ({ cle: lettre, email, entreprise, acces })),
        }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? `Erreur HTTP ${reponse.status}`);
      window.scrollTo({ top: 0 });
      router.push(`/audits/${corps.id}`, { scroll: false }); // sinon Next s'arrête au segment, sous la barre du haut
    } catch (e) {
      setErreur(e.message);
      setEnvoi(false);
    }
  }

  return (
    <form className="cadrage" onSubmit={envoyer}>
      <div className="bloc">
        <h2><span className="numero">01</span>L’application</h2>
        <label className="champ">
          <span>Nom de l’application</span>
          <input value={application} onChange={(e) => setApplication(e.target.value)} placeholder="Paie Express" maxLength={80} />
        </label>
        <label className="champ">
          <span>URL de préproduction</span>
          <input type="url" required value={cible} onChange={(e) => setCible(e.target.value)} placeholder="https://preprod.exemple.fr" />
        </label>
        <label className="champ">
          <span>Pages interdites aux agents, une par ligne</span>
          <textarea rows={2} value={perimetre} onChange={(e) => setPerimetre(e.target.value)} placeholder="/paiements" />
        </label>
      </div>

      <div className="bloc">
        <div className="titre-bloc">
          <h2><span className="numero">02</span>Les trois comptes de test</h2>
          <button type="button" className="bouton secondaire sans-fleche" onClick={() => { setComptes(COMPTES_DEMO); setApplication('Paie Express'); }}>
            Remplir avec les comptes de démo
          </button>
        </div>
        {comptes.map((c, i) => (
          <fieldset key={c.cle} className="compte-test">
            <legend><b>Compte {c.cle}</b> {ROLES[c.cle]}</legend>
            <label className="champ">
              <span>E-mail</span>
              <input type="email" required autoComplete="off" value={c.email} onChange={(e) => changer(i, 'email', e.target.value)} />
            </label>
            <label className="champ">
              <span>Mot de passe</span>
              <input type="password" required autoComplete="new-password" value={c.mdp} onChange={(e) => changer(i, 'mdp', e.target.value)} />
            </label>
            <label className="champ">
              <span>Entreprise</span>
              <input required value={c.entreprise} onChange={(e) => changer(i, 'entreprise', e.target.value)} />
            </label>
          </fieldset>
        ))}
      </div>

      <div className="bloc">
        <h2><span className="numero">03</span>Le feu vert</h2>
        <label className="case">
          <input type="checkbox" checked={ecriture} onChange={(e) => setEcriture(e.target.checked)} />
          <span>J’autorise les tests d’écriture : le compte B tentera de modifier des données de test de A, puis A remettra les valeurs d’origine.</span>
        </label>
        <label className="case">
          <input type="checkbox" required checked={atteste} onChange={(e) => setAtteste(e.target.checked)} />
          <span>J’atteste être autorisé à tester cette préproduction. Tester un système sans autorisation est un délit (art. 323-1 du Code pénal).</span>
        </label>
      </div>

      {erreur && <p className="erreur-audit" role="alert">{erreur}</p>}
      <div className="envoi">
        <button type="submit" className="bouton principal" disabled={envoi}>
          {envoi ? 'Chiffrement et envoi…' : 'Chiffrer et lancer l’audit'}
          <Fleche />
        </button>
        <p className="doux">Les mots de passe ne quittent ce navigateur que chiffrés.</p>
      </div>
    </form>
  );
}
