import { Fleche } from './composants';

// Une adresse sans relevé : la page parle comme le produit, pas comme le framework.
export default function Introuvable() {
  return (
    <main className="page">
      <section className="entete-page">
        <p className="kicker">Relevé introuvable · 404</p>
        <h1>Rien à cette adresse.</h1>
        <p className="resume">Le lien est incomplet, ou ce relevé n’existe pas.</p>
        <div className="actions-page">
          <a className="bouton principal" href="/">Revenir à la salle<Fleche /></a>
        </div>
      </section>
    </main>
  );
}
