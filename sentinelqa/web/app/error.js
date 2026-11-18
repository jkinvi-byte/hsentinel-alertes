'use client'; // les limites d'erreur sont des composants client

import { useEffect } from 'react';
import { Fleche } from './composants';

// Une lecture qui échoue (base injoignable, donnée inattendue) : on le dit, et on propose de réessayer.
export default function Erreur({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page">
      <section className="entete-page">
        <p className="kicker">Relevé indisponible</p>
        <h1>Le relevé n’a pas pu s’afficher.</h1>
        <p className="resume">La lecture des données a échoué. Si l’erreur persiste, les rapports locaux du runner font foi.</p>
        <div className="actions-page">
          <button type="button" className="bouton principal" onClick={() => retry()}>Réessayer<Fleche /></button>
        </div>
      </section>
    </main>
  );
}
