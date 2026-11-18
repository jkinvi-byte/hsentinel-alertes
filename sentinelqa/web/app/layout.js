import './globals.css';
import { Instrument_Sans, Martian_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Fleche } from './composants';

// Schibsted Grotesk pour les titres et le logo (un grotesque de presse, sérieux ; Syne faisait trop « jeu »),
// Instrument Sans pour le texte, Martian Mono pour les annotations et les chemins
const titre = Schibsted_Grotesk({ subsets: ['latin'], variable: '--police-titre' });
const texte = Instrument_Sans({ subsets: ['latin'], variable: '--police-texte' });
const mono = Martian_Mono({ subsets: ['latin'], axes: ['wdth'], variable: '--police-mono' });

export const metadata = {
  title: 'HSentinel',
  description: 'QA et pentest sur des sites autorisés, avec des résultats documentés.',
};

export default function Layout({ children }) {
  return (
    <html lang="fr" className={`${texte.variable} ${titre.variable} ${mono.variable}`}>
      <body>
        <header className="bandeau">
          <div className="bandeau-gauche">
            <a href="/" className="marque" aria-label="HSentinel, retour à la salle">
              <span className="marque-mot">H<span>SENTINEL</span></span>
            </a>
            <span className="kicker veille">Sentinelle en veille</span>
          </div>
          <a href="/audits/nouveau" className="bouton secondaire">Lancer un audit<Fleche /></a>
        </header>
        {children}
        <footer className="pied">HSentinel · QA et pentest · sites autorisés · résultats et limites documentés</footer>
      </body>
    </html>
  );
}
