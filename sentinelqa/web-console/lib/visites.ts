// D-59 : les visites guidées. Un « ? » dans la barre du haut lance la visite de la page affichée : un curseur glisse vers
// chaque élément, qui s'éclaire, avec une bulle courte. Une visite par page, jamais un gros bloc ; la visite ne clique ni ne
// lance rien. Les cibles sont des sélecteurs stables de la console ; une cible absente ou cachée est sautée.

export type EtapeVisite = { cible: string; titre: string; texte: string }
export type Visite = { cle: string; titre: string; etapes: EtapeVisite[] }

const VISITES: Record<string, Visite> = {
  apercu: { cle: 'apercu', titre: 'Vue d’ensemble', etapes: [
    { cible: '.lv-accueil-actions a:nth-of-type(1)', titre: 'Parler à l’expert', texte: 'Le plus court chemin : dites votre objectif à voix haute. L’expert propose la mission et la lance quand tout est prêt ; vous pouvez annuler.' },
    { cible: '.lv-accueil-actions a:nth-of-type(2)', titre: 'Ou paramétrer vous-même', texte: 'Le studio s’ouvre sur les paramètres : l’application, le parcours, puis le plan préparé par Hugging Face, à relire.' },
    { cible: '.lv-indicateurs', titre: 'Vos chiffres', texte: 'Contrôles conformes, anomalies à examiner, missions en cours : chaque nombre vient d’une mission réelle.' },
    { cible: 'section[aria-labelledby="activite-titre"]', titre: 'L’activité récente', texte: 'Les dernières missions et leur verdict. Un clic ouvre le rapport, preuves comprises.' },
    { cible: 'section[aria-labelledby="sessions-titre"]', titre: 'Ce que l’agent a vu', texte: 'Les pages ouvertes et les gestes faits par l’agent H, dans un vrai navigateur.' },
    { cible: '.lv-nav-item[href="/app/applications"]', titre: 'Vos applications', texte: 'Ajoutez votre propre site : son adresse, un jeton de vérification, vos comptes de test.' },
  ] },
  studio: { cle: 'studio', titre: 'Nouvelle mission', etapes: [
    { cible: '.lv-expert-actions', titre: 'L’expert QA', texte: 'Parlez-lui ou écrivez-lui. Pour un point précis, il propose une consigne ; pour chercher les bugs, une exploration.' },
    { cible: '[data-visite="application"]', titre: 'L’application testée', texte: 'Un exemple phare, ou votre application vérifiée. « Ajouter votre application » est juste en dessous.' },
    { cible: '[data-visite="compte"]', titre: 'Le compte de test', texte: 'Sur un site avec connexion, l’agent entre avec ce compte, sans jamais voir le mot de passe : il passe par un coffre H.' },
    { cible: '.lv-ouvrir-parametres, #mission-parametres', titre: 'Les paramètres manuels', texte: 'Consigne guidée ou exploration bornée. En guidé, Hugging Face prépare un plan de critères, que vous relisez.' },
    { cible: 'aside button[type="submit"]', titre: 'Lancer la mission', texte: 'L’agent part dans un navigateur. Vous le suivez en direct, et vous pouvez l’arrêter à tout moment.' },
  ] },
  applications: { cle: 'applications', titre: 'Applications', etapes: [
    { cible: '.lv-entete-droite a[href="/app/applications/nouvelle"]', titre: 'Ajouter une application', texte: 'Votre site en trois gestes : l’adresse et l’attestation, le jeton de vérification, les comptes de test.' },
    { cible: 'section[aria-labelledby="exemples-titre"] .lv-app', titre: 'Un exemple phare', texte: 'Un site autorisé par écrit, ou notre banc. Les étiquettes disent ce que les agents peuvent y mener.' },
    { cible: 'section[aria-labelledby="exemples-titre"] .lv-app-actions a', titre: 'Préparer un test', texte: 'Ouvre le studio sur cette application, prête à recevoir votre objectif.' },
    { cible: 'section[aria-labelledby="vos-applications-titre"]', titre: 'Vos applications', texte: 'Chacune dit ce qu’il reste à faire : vérifier le site, ajouter un compte de test, ou lancer un test.' },
  ] },
  ajout: { cle: 'ajout', titre: 'Votre application', etapes: [
    { cible: '.lv-assistant .lv-etapes', titre: 'Trois gestes', texte: 'L’adresse, la vérification, les comptes de test. Aucune mission ne part avant la vérification.' },
    { cible: '.lv-assistant input[inputmode="url"]', titre: 'L’adresse', texte: 'En https, sur un nom de domaine public. Votre préproduction est le meilleur terrain.' },
    { cible: '.lv-attestation', titre: 'L’attestation', texte: 'Vous attestez avoir le droit de faire tester ce site (article 323-1 du Code pénal).' },
    { cible: '.lv-onglets', titre: 'Le jeton de vérification', texte: 'Publiez-le dans un fichier ou une balise de votre site : HSentinel le relit depuis Internet, sans rien y écrire.' },
    { cible: '.lv-prete', titre: 'Prête', texte: 'Votre application est vérifiée : parlez à l’expert ou préparez un test.' },
    { cible: '#comptes', titre: 'Les comptes de test', texte: 'Le mot de passe est chiffré dans votre navigateur pour notre runner : ni notre serveur ni notre base ne le lisent.' },
  ] },
  rapport: { cle: 'rapport', titre: 'Rapport de mission', etapes: [
    { cible: '.lv-verdict', titre: 'Le diagnostic', texte: 'Le verdict vient du code, pas de l’agent : un écart n’est « constaté » qu’avec une preuve.' },
    { cible: 'ol[aria-label="Avancement de la mission"]', titre: 'Les étapes réelles', texte: 'Enregistrée, agent au travail, vérification, rapport : lues dans le journal, jamais simulées.' },
    { cible: '.lv-compteurs', titre: 'Le bilan', texte: 'Conformes, écarts, à confirmer. Un « à confirmer » attend votre regard sur la capture.' },
    { cible: '.lv-constats', titre: 'Chaque contrôle', texte: 'Ce qui était attendu, ce qui a été observé, et la preuve : capture de l’agent ou réponse HTTP.' },
    { cible: 'a.lv-bouton[target="_blank"]', titre: 'Rejouer la session', texte: 'Le replay H, étape par étape, avec les captures de l’agent.' },
    { cible: '.lv-chronologie', titre: 'Le journal', texte: 'Chaque geste de l’agent et chaque contrôle du code, horodatés.' },
  ] },
  missions: { cle: 'missions', titre: 'Missions', etapes: [
    { cible: '.lv-entete-droite a[href="/app/nouveau"]', titre: 'Nouvelle mission', texte: 'Ouvre le studio : l’expert, ou les paramètres manuels.' },
    { cible: '[aria-label="Missions QA"], [aria-label="Missions Pentest"]', titre: 'Vos missions', texte: 'Chaque mission, son état et son verdict. Une mission en cours s’actualise toute seule.' },
  ] },
  resultats: { cle: 'resultats', titre: 'Résultats', etapes: [
    { cible: 'section[aria-label="Filtres"]', titre: 'Les filtres', texte: 'Par application, par thème, par gravité : retrouvez une faille en deux clics.' },
    { cible: '.lv-contenu > .lv-lignes, .lv-contenu > .lv-vide', titre: 'Les failles prouvées', texte: 'Chacune avec ce que l’agent a vu, les actions menées et son ticket.' },
  ] },
}

/** La visite de la page affichée, ou null quand la page n'en a pas. */
export function visitePour(chemin: string): Visite | null {
  if (chemin === '/app') return VISITES.apercu
  if (chemin === '/app/nouveau') return VISITES.studio
  if (chemin === '/app/applications') return VISITES.applications
  if (/^\/app\/applications\/[a-z0-9-]+$/.test(chemin)) return VISITES.ajout
  if (/^\/app\/missions\/(qa|pentest)\/[0-9a-f-]{36}$/.test(chemin)) return VISITES.rapport
  if (chemin === '/app/audits') return VISITES.missions
  if (chemin === '/app/diagnostic') return VISITES.resultats
  return null
}
