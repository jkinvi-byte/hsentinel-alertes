import './globals.css';

export const metadata = {
  title: 'Ardoise · factures et relances des artisans',
  description: 'Application fictive de démonstration, construite par l’équipe HSentinel. Données fictives.',
};

export default function Layout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
