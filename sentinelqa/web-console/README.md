# Console HSentinel — intégration de l’interface de l’équipe

Le design de `/Users/aurian/Downloads/project` est repris ici : accueil, identité visuelle, navigation et composants. Les pages actives sont raccordées aux services existants dans `../web/lib`, aux contrats de `../contrats` et aux mêmes files Supabase. Le dossier d’origine reste intact.

**État :** QA public, QA connecté et consultation des alertes raccordés. Tests de contrat, chiffrement et compilation vérifiés. La recette de cette nouvelle interface dans un navigateur et une mission réelle depuis cette interface restent à valider. Les preuves de missions réalisées avec l’ancienne web ne valident pas automatiquement celle-ci.

## Démarrage

Depuis ce dossier, avec Node 24 et npm 11 (versions vérifiées : 24.13.1 et 11.8.0) :

```sh
npm ci
npm run dev
```

Ouvrir `http://127.0.0.1:3101/app`. Le port et l’hôte sont explicitement fixés dans les scripts. Garder le dépôt complet : cette application importe des modules du dossier voisin `web`.

Les services partagés lisent les clés déjà configurées hors dépôt dans `~/.config/sentinelqa/.env` et `~/.config/hai/.env`, ou dans les variables d’environnement du processus. Les variables attendues sont décrites dans [`.env.example`](.env.example). Ce modèle reste vide ; aucune clé n’est à placer dans ce dossier synchronisé avec iCloud.

Les deux workers existants exécutent les demandes. Depuis la racine du dépôt, dans deux terminaux, avec l’environnement Python déjà installé pour le projet :

```sh
.venv/bin/python sentinelqa/runner/qa_worker.py
```

```sh
.venv/bin/python sentinelqa/runner/sentinelqa.py --surveiller
```

Adapter `.venv` au chemin de l’environnement Python utilisé par l’équipe. Les tables existantes sont réutilisées ; cette intégration n’applique aucune migration. Un worker éteint laisse sa mission en attente.

En développement, l’accès sans jeton est limité à l’hôte local. En production, définir `HSENTINEL_OPERATOR_TOKEN` côté serveur, avec au moins 24 caractères, puis utiliser ce code sur `/login`. La session signée dure huit heures. C’est un accès d’équipe, pas encore une gestion de comptes clients.

## Pages raccordées

| Page | Comportement |
|---|---|
| `/` | Accueil conservé, texte adapté aux capacités actuelles ; illustration explicitement étiquetée |
| `/app` | Historique QA/Pentest, états réels, compteurs portant sur les 30 dernières missions chargées |
| `/app/nouveau` | QA guidé ou exploration, écran ordinateur/mobile, dictée, plan relu, lancement |
| `/app/nouveau?cible=peer-review` | QA connecté : adresse, mot de passe chiffré dans le navigateur, jusqu’à trois noms attendus à l’écran |
| `/app/nouveau?volet=pentest` | Scénarios du catalogue, consigne facultative saisie ou dictée, lancement dans la file pentest |
| `/app/missions/[module]/[id]` | Suivi, arrêt, résultats, preuves HTTP, captures disponibles, sessions H et coûts mesurés |
| `/app/cibles` | Applications et scénarios, avec leurs disponibilités dans le catalogue |
| `/app/alertes` | Constats, gravité, état d’envoi, tickets GitHub et filtre par application |
| `/login` | Accès opérateur avec un vrai secret serveur |
| `/onboarding` | Redirection vers le studio ; les étapes simulées ne sont plus utilisées |

Un coût absent affiche **Non mesuré**. Un rapport vide ne produit aucun verdict. Un contrôle inconnu reste **Non concluant**. La console conserve les quatre résultats du moteur : conforme, écart, non concluant, non exécuté.

## Contrat avec les fonctionnalités en cours

- **QA public** : contrat v3 et file `qa_missions`, sans changement du moteur.
- **QA connecté** : `GET /api/console/cle-runner` donne la clé publique ou `null`. Le navigateur chiffre `JSON.stringify({ mot_de_passe })` en RSA-OAEP SHA-256, puis joint `compte: { identifiant, secret_chiffre, identite }` au contrat v3. La clé est relue au lancement. Sans clé, aucun envoi ; après chiffrement, le champ mot de passe est effacé. Le worker existant gère le coffre temporaire. Le rapport présente K1/K2 et les motifs d’arrêt ou de texte tronqué.
- **Alertes** : `GET /api/console/alertes` réutilise `listerAlertes`, `bilanAlertes` et `listerApplications`. La page consulte l’état existant ; elle ne crée aucun ticket et n’envoie aucun e-mail. Une absence de constats ne devient pas un verdict de conformité.
- **Pentest S-PEER-01** : la demande v2 rejoint `audits`. La disponibilité dans le catalogue n’est pas un contrôle de santé de l’agent H. Son exécution réelle depuis la console reste à valider, selon [SUIVI.md](../../SUIVI.md).
- **Pentest S-PEER-02 / contribution HF** : le scénario est refusé côté API tant que le catalogue le marque indisponible. L’intégration des modules de Kimi au runner reste distincte de ce lot d’interface.
- **Voix** : réutilise `web/lib/qa-dictee.mjs` et le service de transcription existant. Dans le pentest, la voix remplit les précisions du scénario ; elle ne crée pas un nouveau scénario autonome.
- **ROI** : durée et coûts sont ceux du rapport. Aucun gain de temps humain n’est inventé. Le temps de préparation enregistré inclut les attentes ; la comparaison avec un passage manuel reste à mesurer.

## Vérification

Résultats du lot QA connecté / alertes : **28 tests locaux réussis**, dont un chiffrement réel WebCrypto déchiffré avec une clé de test au format du worker, vérification TypeScript et compilation de production réussies. **12 tests navigateur préparés** ; leur lancement sur le serveur local existant échoue au démarrage de Chrome, avant toute interaction avec les pages. Aucune mission H réelle n’a été lancée depuis cette interface durant cette intégration.

```sh
npm test
npm run typecheck
npm run build
npm run test:browser -- --list
```

La compilation utilise Webpack et des polices système : aucun téléchargement de police Google n’est requis. Le thème, les couleurs, le logo et les espacements du projet initial sont conservés. Des fontes locales sous licence peuvent ensuite remplacer les fontes système.

Si le serveur de développement est déjà ouvert, compiler dans un dossier distinct : `HSENTINEL_BUILD_DIR=.next-production npm run build`. Pour servir cette compilation, fournir la même variable à `npm run start`.

La recette Playwright est dans `tests/browser/console.spec.ts` : accès opérateur, erreurs réseau, plan périmé, double lancement, arrêt, dictée, largeur mobile, QA connecté et alertes. Elle utilise Chrome, des réponses simulées explicitement réservées aux tests et des clés synthétiques, sans mission réelle. Pour l’exécuter après la compilation :

```sh
npm run test:browser
```

Pour utiliser un serveur de développement déjà ouvert : `CONSOLE_TEST_URL=http://127.0.0.1:3101 npm run test:browser`. Les deux tests d’accès en production sont alors ignorés, car ils exigent le serveur isolé et sa clé synthétique. Les captures seront écrites dans `test-results/apercus/` quand la recette pourra exécuter les pages.

## Fichiers à reprendre

- [INTEGRATION.md](INTEGRATION.md) : points de raccordement et ordre des prochaines tâches.
- `app/api/console/[...path]/route.ts` : adaptation des services existants vers la nouvelle UI.
- `lib/console-contract.mjs` : validation des lancements et disponibilités.
- `lib/mission-view.mjs` : vue publique d’un rapport, sans comptes ni demande brute.
- `lib/qa-account.mjs` et `components/console/mission-account.tsx` : chiffrement et formulaire du compte.
- `components/console/alerts-console.tsx` : consultation des alertes.
- `components/console/mission-*.tsx` et `mission-dictation.jsx` : parcours actif.

Les composants de l’ancien prototype (`security-console`, `audit-detail`, `onboarding-*`, `audit-mock`, `audit-source`) restent comme référence de design, sans import dans les routes actives. `/api/audit` répond 410. `ORCHESTRATOR_URL`, les abonnements, les alertes et les déclencheurs simulés ne pilotent pas cette intégration.
