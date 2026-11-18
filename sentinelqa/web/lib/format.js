// Mise en forme partagée par le serveur et le navigateur : mêmes chaînes des deux côtés.
const DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const JOUR = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

export const dateCourte = (iso) => DATE.format(new Date(iso)).replace(' ', ' · ');
export const jour = (iso) => JOUR.format(new Date(iso));
export const cleJour = (iso) => iso.slice(0, 10);
export const dollars = (x) => (x == null ? 'non mesuré' : `${x.toFixed(3).replace('.', ',')} $`);
export const nombre = (n) => (n == null ? 'non mesuré' : n.toLocaleString('fr-FR'));
export const secondes = (s) => (s == null ? 'non mesuré' : `${Math.round(s)} s`);

// Le texte libre d'un agent peut contenir du markdown (**gras**) et des retours à la ligne.
export const texteAgent = (t) => (t == null ? null : t.replace(/\*\*/g, '').replace(/\s*\n+\s*/g, ' ').trim());

export const pluriel = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;
// Les fausses alertes : null quand aucune vérité terrain ne permet de les mesurer.
export const alertes = (n) => (n == null ? 'fausses alertes non mesurées' : n === 0 ? 'aucune fausse alerte' : pluriel(n, 'fausse alerte', 'fausses alertes'));

// Ce que l'agent a vu, en extrait lisible : les données JSON deviennent « clé : valeur », la réponse de l'agent
// (« Réponse : Oui… ») est retirée, et l'extrait s'arrête à un mot entier.
export function extrait(t, max = 280) {
  let s = texteAgent(t);
  if (!s) return null;
  if (/\{\s*"/.test(s)) {
    const vues = new Set();
    const paires = [...s.matchAll(/"([^"]+)"\s*:\s*(?:"([^"]*)"|(-?\d+(?:\.\d+)?))/g)]
      .filter(([, cle]) => cle !== 'id' && !vues.has(cle) && vues.add(cle))
      .map(([, cle, chaine, nombre]) => `${cle} : ${chaine ?? nombre}`);
    if (paires.length) s = `Données brutes reçues · ${paires.join(' · ')}`;
  }
  s = s.split(/\s(?:Réponse\s*:|Oui,\s|Cette page (?:montre|affiche|contient) des données)/)[0].trim();
  if (s.length <= max) return s;
  const coupe = s.slice(0, max);
  return `${coupe.slice(0, coupe.lastIndexOf(' '))}…`;
}

export const THEMES = { lecture: 'Lecture', ecriture: 'Écriture', admin: 'Admin' };
// Les trois scénarios d'attaque, un par thème (les trois types de failles décidés le 17/11).
export const SCENARIOS = { lecture: 'B lit les données de A', ecriture: 'B modifie les données de A', admin: 'C, simple salarié, entre dans l’admin' };
// La gravité : une règle écrite et déterministe (sentinelqa/runner/gravite.py), 4 crans du plus grave au moins grave.
export const GRAVITES = { critique: 'Critique', 'élevée': 'Élevée', moyenne: 'Moyenne', faible: 'Faible', non_classee: 'Non classée' };
export const CRANS = { critique: 4, 'élevée': 3, moyenne: 2, faible: 1 };
export const ORDRE_GRAVITE = ['critique', 'élevée', 'moyenne', 'faible'];

// Les mots d'un non-technicien. Le titre d'une faille dit qui peut faire quoi, sur quelles données ;
// il se déduit du thème et des catégories de données détectées par la règle, jamais d'un texte libre.
export function titreSimple(theme, donnees = []) {
  const d = new Set(donnees);
  if (theme === 'lecture') {
    if (d.has('salaires')) return 'Une autre entreprise peut lire les salaires de vos employés';
    if (d.has('coordonnées bancaires')) return 'Une autre entreprise peut lire vos coordonnées bancaires';
    if (d.has('identité') || d.has('coordonnées')) return 'Une autre entreprise peut lire la liste de vos employés';
    return 'Une autre entreprise peut lire des pages qui vous sont réservées';
  }
  if (theme === 'ecriture') {
    if (d.has('salaires')) return 'Une autre entreprise peut écrire dans les fiches de paie de vos employés';
    return 'Une autre entreprise peut modifier vos données';
  }
  if (d.has("droits d'accès")) return 'Un salarié sans droits peut ouvrir l’administration des comptes';
  if (d.has('salaires')) return 'Un salarié peut lire la fiche de paie d’un collègue';
  return 'Un salarié sans droits peut ouvrir une page réservée aux administrateurs';
}

// Par où passe la faille : l'interface (une adresse de page) ou l'API (les données brutes, sans l'interface)
export function canal(chemins) {
  const api = chemins.some((c) => c.startsWith('/api/'));
  const page = chemins.some((c) => !c.startsWith('/api/'));
  return api && page ? 'Par l’interface et par l’API' : api ? 'Par l’API, sans passer par l’interface' : 'Par l’interface web';
}

// Les deux preuves, dites simplement, thème par thème
export const PREUVE_SIMPLE = {
  lecture: 'Prouvée deux fois : l’entreprise B reçoit exactement la même page que l’entreprise A, puis notre agent l’a vue à l’écran.',
  ecriture: 'Prouvée deux fois : le texte écrit par l’entreprise B apparaît chez l’entreprise A, puis notre agent l’a vu à l’écran.',
  admin: 'Prouvée deux fois : le salarié C reçoit la même page que l’administrateur, puis notre agent l’a vue à l’écran.',
};
// Les trois scénarios, titrés pour un non-technicien
export const SCENARIOS_SIMPLES = {
  lecture: 'Une autre entreprise lit vos données',
  ecriture: 'Une autre entreprise modifie vos données',
  admin: 'Un salarié entre là où il ne devrait pas',
};
// « idle » : l'agent a rendu sa réponse ; la session passe à « completed » quelques secondes plus tard.
export const STATUTS = { completed: 'terminée', idle: 'terminée', failed: 'échec', timed_out: 'délai dépassé', interrupted: 'interrompue' };

// L'ancre d'une faille dans la page d'un audit : la page d'examen y mène directement.
export const ancre = (theme, chemin) => `f-${theme}-${chemin}`.replace(/[^a-zA-Z0-9-]+/g, '-');
