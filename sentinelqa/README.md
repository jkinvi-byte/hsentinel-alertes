# HSentinel : QA et pentest sur sites réels

## Volet QA (18/11, Claude Code) : parcours dicté, exploration bornée, voix — exécuté en réel

On dit, au clavier ou à la voix, ce qu'il faut vérifier sur un site autorisé. Hugging Face découpe la consigne en étapes et en critères, que l'on relit. L'agent H `sentinelqa-qa` la joue dans un vrai navigateur. Le code vérifie ensuite chaque critère sur ce que H a enregistré (pages, gestes, texte affiché) et sur les pages servies. Sans consigne, l'agent explore le menu principal, 6 pages au plus. Les écritures restent interdites (D-24).

**Règle des verdicts.** Conforme ou écart : seulement avec une preuve relevée par le code (page atteinte dans les événements H, texte trouvé dans le contenu de la page hors menu, citation de l'agent retrouvée, erreur HTTP). Tout le reste est non concluant, même quand l'agent a un avis : « écart signalé · à confirmer », « désaccord · à confirmer », « parcours difficile · à revoir ».

```sh
# Une fois : la file QA dans Supabase (tables qa_missions et qa_evenements, RLS sans politique)
.venv-holo/bin/python sentinelqa/runner/qa_worker.py --schema
# Le worker QA : il prend les missions de la web une par une (il ne lit jamais la table audits du pentest)
.venv-holo/bin/python sentinelqa/runner/qa_worker.py
# La web : « Lancer un audit », onglet QA, ou http://localhost:3100/qa (en dev, pas 127.0.0.1 : voir les pièges)
cd sentinelqa/web && npm run dev
# Sans la web, depuis le terminal
.venv-holo/bin/python sentinelqa/runner/qa_moteur.py --consigne "Ouvre Programmes puis le Bachelor et vérifie qu'il affiche « Bac+3 »"
.venv-holo/bin/python sentinelqa/runner/qa_moteur.py --exploration --mobile
.venv-holo/bin/python sentinelqa/runner/qa_moteur.py --reverifier sentinelqa/rapports/qa-AAAAMMJJ-HHMMSS.json   # rejoue la vérification, sans agent
# Les tests
.venv-holo/bin/python -m unittest discover -s sentinelqa/runner/tests -p 'test_*.py'
cd sentinelqa/web && npm test
```

| Fichier | Rôle |
|---|---|
| `contrats/qa.json` | Cibles QA, budgets, écrans, consigne de préparation (Llama 3.3 70B par le routeur Hugging Face ; le routeur annonce OpenRouter comme fournisseur) et modèle de dictée (Whisper large v3 turbo) |
| `runner/qa_agent.py` | La définition de `sentinelqa-qa` (source unique, reprise par `agents_missions.py`) et sa relecture confirmée dans H |
| `runner/qa_moteur.py` | Mission, plan Hugging Face, session H suivie en direct, vérification par le code, rapport, CLI |
| `runner/qa_worker.py` | La file QA de Supabase, l'arrêt demandé depuis la web, le fil en direct |
| `supabase/qa.sql` | Les deux tables du volet QA |
| `web/lib/qa.js`, `web/lib/qa-contrat.mjs` | Plan, dictée, file, captures relayées (la clé H reste sur le serveur) ; contrat partagé |
| `web/app/qa/…`, `web/app/api/qa/…` | Le studio (`/qa`), le suivi en direct puis le rapport (`/qa/[id]`), six routes |

**Mesuré le 18/11, de 6 h 33 à 7 h 28, sur `eugeniaschool.com`** : 8 missions complètes, 0,290 $ de coût H au total, 0,036 $ et 81 s en moyenne. Parcours guidé : 43 à 81 s, 0,014 à 0,039 $. Exploration : 86 s sur ordinateur, 97 à 160 s en mobile. Plan Hugging Face : 0,84 à 1,04 s. Dictée : 1,1 à 1,4 s pour une phrase. Le scénario « 4 étapes » a été rejoué 3 fois ; le premier passage portait un faux écart du code, corrigé puis revérifié sur la même session. **Aucun défaut du site n'est prouvé à ce jour.** La FAQ de la page d'admission annonce « Quatre étapes », comme le menu, et la section illustrée en numérote trois : un constat à présenter tel quel, sans en faire un bug.

**Limites.** Une seule cible QA, publique. La dictée n'a été testée qu'avec une voix de synthèse. Le temps humain gagné n'est pas encore mesuré : la web relève seulement le temps de préparation. Les clics de l'agent ne sont pas filtrés avant exécution ; ses écarts de conduite sont relevés après coup (adresses tapées, lectures directes `web_fetch`). En mobile, 2 explorations sur 2 ont buté sur le menu en accordéon (à confirmer sur le replay).

## Premier lot du 18 novembre — implémenté, validation réelle à poursuivre

Le cadrage est celui de D-26 : **QA et pentest au même niveau**. L'interface `/audits/nouveau` propose maintenant les deux volets, une consigne texte et des cibles enregistrées. Un parcours public ne demande plus les trois comptes du cobaye.

| Scénario | État du code | Portée |
|---|---|---|
| Q-PUB-01 · Eugenia | Exécuteur QA et session H raccordés | Navigation vers le Bachelor, URL observée dans les événements H, titre visuel et titre HTML recoupés |
| S-PEER-01 · Peer Review | Exécuteur pentest anonyme et session H raccordés | Barrière d'entrée de `/etudiant` : refus HTTP ou redirection vers `/connexion`, observation visuelle séparée |
| Q-PEER-01 | Non exécutable dans ce lot | Adaptateur authentifié et critères d'identité à établir selon l'architecture |
| S-PEER-02 | Assertion locale testée ; scénario réel non exécutable | Deux identités, une règle connue, une ressource témoin et un contrôle positif nécessaires |

**Pas de résultat de pentest réel revendiqué.** Le premier essai Q-PUB-01 a rencontré `ConnectError` avant l'obtention d'une session H ; son rapport est non concluant. Le test navigateur local a été bloqué par `listen EPERM` sur `127.0.0.1`. Les tests du moteur et des routes utilisent des doubles locaux, explicitement identifiés.

### Démarrer depuis le dossier HCompany

Les clés existantes restent dans `~/.config/sentinelqa/.env` (Supabase) et `~/.config/hai/.env` (H). `HAI_API_KEY` peut aussi être fourni dans l'environnement. Aucun secret n'est à ajouter aux missions JSON.

Les missions utilisent désormais deux **agents nommés du catalogue H**, définis dans `runner/agents_missions.py` :

| Nom | Rôle de ce premier lot |
|---|---|
| `sentinelqa-qa` | Parcours QA public par les menus et liens visibles |
| `sentinelqa-pentest` | Observation de la barrière d'accès anonyme du scénario autorisé |

Les deux agents historiques `sentinelqa-explorateur` et `sentinelqa-verificateur` restent ceux du cobaye. Les nouveaux agents ont un navigateur vierge, aucun coffre et des consignes de consultation. Leur définition démarre sur `about:blank` ; le runner fournit l'URL validée et le schéma de réponse à chaque mission. Ils n'implémentent pas encore les scénarios authentifiés.

Pour enregistrer les deux agents avec la clé H déjà présente :

```sh
.venv-holo/bin/python sentinelqa/runner/sentinelqa.py --preparer-agents
```

Cette commande crée les entrées manquantes, actualise les définitions différentes et relit chaque agent avant d'afficher `Confirmé dans H`. Elle ne lance aucune session de navigateur. Ajouter `--verifier` valide seulement les définitions locales, sans publication. Une mission vérifie aussi son agent avant de démarrer sa session, puis le référence par son nom (et sa révision si H la fournit).

**État mesuré le 18/11, D-28 : définitions prêtes, enregistrement distant non effectué.** L'essai de la commande échoue sur le premier GET avec `ConnectError` ; le diagnostic Python indique `Errno 8` (résolution de l'hôte), sans réponse HTTP. La clé a été chargée, mais sa validité ne peut pas être établie par cet échec réseau. Les connecteurs installés dans Claude Code ne sont pas automatiquement disponibles dans cette session Codex.

Dans un premier terminal, lancer le runner directement, sans lancer le cobaye ni son tunnel :

```sh
.venv-holo/bin/python sentinelqa/runner/sentinelqa.py --surveiller
```

Dans un second terminal :

```sh
npm --prefix sentinelqa/web run dev
```

Ouvrir `http://127.0.0.1:3100/audits/nouveau`. Le serveur de développement écoute sur `127.0.0.1`. Pour une exécution de production, configurer `HSENTINEL_OPERATOR_TOKEN` côté serveur : l'accès HTTP Basic utilise le nom `equipe` et ce jeton comme mot de passe. Sans configuration, la production reste fermée. Cette protection est provisoire pour l'équipe, pas une gestion de clients multi-utilisateurs.

Si le lancement indique `EADDRINUSE`, vérifier le processus avec `lsof -nP -iTCP:3100 -sTCP:LISTEN` avant d'en relancer un. Le 18/11, ce port était déjà occupé par le serveur du dossier `sentinelqa/web` ; il n'était donc pas nécessaire de démarrer un second serveur.

Valider une mission sans appeler H ni le site :

```sh
.venv-holo/bin/python sentinelqa/runner/sentinelqa.py --mission sentinelqa/missions/qa-eugenia.json --verifier
.venv-holo/bin/python sentinelqa/runner/sentinelqa.py --mission sentinelqa/missions/pentest-peer-review.json --verifier
```

Retirer `--verifier` pour l'exécuter depuis l'entrée terminal interne. Le contrat et l'exécuteur sont les mêmes que ceux de la web app. Le rapport JSON et HTML est écrit dans `sentinelqa/rapports/` ; aucun replay public n'est créé.

### Structure et résultats

- `contrats/catalogue.json` : profils et scénarios partagés entre web et Python, avec URL, budgets et capacités. Modifier la consigne ne remplace pas le périmètre.
- `runner/missions.py` : exécution anonyme, lectures HTTP bornées, observations H, assertions et rapports à quatre résultats : `passed`, `failed`, `inconclusive`, `skipped`.
- `runner/agents_missions.py` : définitions persistantes QA/pentest, enregistrement idempotent et relecture du catalogue. Les instructions sont versionnées ici, pas dupliquées dans chaque session.
- `runner/sentinelqa.py` : même file de demandes que le cobaye, branche dédiée aux missions réelles. L'ancien flux est refusé sur les deux hôtes enregistrés.
- `web/lib/missions.js` : validation et normalisation du contrat. Dans `audits.rapport`, l'enveloppe `schema_version: 2, phase: queued` conserve la demande ; `phase: completed` ajoute les résultats. Aucune migration distante nécessaire pour ce lot. Utiliser le runner mis à jour pour consommer ces nouvelles demandes.
- Bouton d'arrêt : une mission encore en file devient non exécutée ; une mission active demande l'annulation de H et conserve ses preuves partielles. Les vérifications réseau et les plafonds de temps restent actifs.

Un HTTP 200 générique, une coquille HTML, un 404 ou un 500 ne deviennent pas un accès protégé dans le pentest. S-PEER-01 vérifie la barrière d'entrée uniquement, sans conclure sur les données privées ou les API. Les titres et actions produits par l'agent ne sont pas une preuve suffisante d'accès inter-utilisateurs.

Le navigateur H natif est encadré par des consignes sur ces parcours anonymes connus. Le filtrage effectif des clics, des écritures et des navigations du navigateur reste à construire avant les parcours sensibles ou l'exploration large. Les lectures HTTP du runner, elles, sont vérifiées avant l'envoi et les redirections ne sont pas suivies implicitement.

### Vérifications

```sh
.venv-holo/bin/python -m unittest discover -s sentinelqa/runner/tests -v
npm --prefix sentinelqa/web test
npm --prefix sentinelqa/web run build
```

Résultats observés le 18/11 : **25 tests Python réussis après D-28** ; les **10 tests JavaScript/routes et le build Next.js avaient réussi lors de D-27**, sans modification web depuis. Couverture : validation des cibles, absence de comptes pour les missions anonymes, résultats non concluants, refus des redirections hors périmètre, réponses compressées et volumineuses, annulation H simulée, preuve positive d'accès, file vers rapport et arrêt atomique en attente. Les cinq contrôles ajoutés pour D-28 vérifient le vrai SDK contre un transport HTTP simulé (création, idempotence, mise à jour, refus d'authentification/service et relecture) ainsi que la référence aux agents nommés dans les sessions des deux volets. Ils ne constituent pas une validation du service H en ligne.

Le script navigateur `web/tests/smoke.mjs` emploie Chrome et Playwright, une base Supabase simulée et des résultats explicitement synthétiques. Après le build, l'exécuter depuis `sentinelqa/web` avec `node tests/smoke.mjs` si Playwright est installé, ou avec `HSENTINEL_PLAYWRIGHT` pointant sur un module Playwright existant. Il vérifie les deux formulaires, le rapport, l'arrêt et la largeur mobile. **L'ouverture du port a été refusée au processus lancé par l'outil de cette revue** (`listen EPERM`). Ce constat ne démontre pas une interdiction générale des serveurs locaux sur le poste ; le lancement prévu reste `127.0.0.1:3100`.

### Suite du plan

Valider les deux parcours avec le service H, puis raccorder les scénarios authentifiés selon les préconditions du document 09. Hugging Face n'est pas encore intégré au nouveau flux ; son rôle dans les scénarios et rapports reste un lot distinct. Voix, exploration libre et CLI client restent après le socle des deux volets.

## Historique : démo du cobaye v1.1

SentinelQA prouve, sur une préproduction, qu'un compte accède à ce qu'il ne devrait pas, et livre une preuve rejouable pour chaque faille. Le canon de la marque (noms, chiffres, couleurs, voix) est dans `MARQUE.md`.

## Ce que fait un audit

**Trois thèmes de failles, testés avec trois comptes :**
- **Lecture** : B, d'une autre entreprise, lit les données de A ;
- **Écriture** : B modifie les données de A ;
- **Admin** : C, salarié de la même entreprise que A, dépasse son rôle.

**Deux agents H sur mesure**, créés par l'API (`runner/agents_h.py`) :
- `sentinelqa-explorateur` ;
- `sentinelqa-verificateur`.

Chaque compte de test a son propre coffre H. L'agent se connecte avec l'action `fill_secret_at` sans voir le mot de passe, qui n'apparaît dans aucun événement de session (vérifié le 17/11).

**Les quatre temps :**
1. **Cartographie.** L'explorateur parcourt l'application en cliquant, comme A, et comme C en parallèle. On garde les pages que son navigateur a réellement affichées (`metadata.url` des événements).
2. **Rejeux HTTP**, déterministes :
   - **lecture** : chaque page de A est redemandée par A puis par B. Une similarité d'au moins 0,95 vaut suspicion ;
   - **admin** : les pages de A que C ne voit pas dans son interface sont redemandées par C. Si la page de C reproduit celle de A (couverture d'au moins 0,95), c'est une suspicion ;
   - **écriture**, seulement avec un feu vert humain : B soumet les formulaires trouvés dans les pages de A, avec un marqueur. Si A voit ensuite le marqueur, c'est une suspicion. A remet la valeur d'origine à la fin.
3. **Preuves.** Le vérificateur ouvre chaque page suspecte et décrit ce qu'il voit, connecté comme B, comme C, ou comme A pour constater une écriture chez la victime. Une faille n'est **prouvée** que si le rejeu **et** l'agent la confirment.
4. **Rapport.** Un fichier HTML et un fichier JSON sont écrits dans `rapports/`, avec la vérité terrain, et le statut, les steps, les tokens, le coût et la durée de chaque session.

## Le parcours complet depuis la web app (v1.1, 17/11 au matin)

1. **Le cadrage.** Dans la salle de contrôle (`/audits/nouveau`), le CTO saisit :
   - l'URL de préproduction ;
   - les trois comptes de test, avec leur e-mail, leur mot de passe et leur entreprise ;
   - les pages interdites ;
   - le feu vert pour l'écriture ;
   - **l'attestation**, obligatoire : il est autorisé à tester cette préproduction (art. 323-1 du Code pénal).
2. **Le chiffrement dans le navigateur.** WebCrypto chiffre les trois mots de passe en RSA-OAEP 3072 bits (SHA-256), avec la **clé publique du runner** (`runner/cle_runner.py`), avant l'envoi. Le serveur de la web app ne voit jamais un mot de passe en clair.
3. **La demande dans Supabase** (`supabase/schema.sql`). Elle contient l'URL, les comptes sans mot de passe et le texte chiffré. Le RLS est activé, **sans aucune politique** : seule la clé secrète (serveur et runner) lit et écrit, et la clé publishable ne voit rien.
4. **Le runner en mode surveillance** (`sentinelqa.py --surveiller`) :
   - il réserve la demande, pour qu'aucun autre runner ne la prenne ;
   - il déchiffre les mots de passe en mémoire et remplit les coffres H ;
   - il audite, avec les pages interdites exclues ;
   - il écrit le fil et le rapport dans Supabase, puis **efface toujours le texte chiffré**, même en cas d'échec.
5. **Le suivi en direct** (`/audits/<id>`). La page interroge le fil toutes les 2 s, et s'arrête à la fin de l'audit ou quand l'onglet est caché. Elle affiche :
   - l'étape en cours ;
   - chaque session d'agent, avec son lien « en direct » ;
   - chaque preuve.

   À la fin, la page passe toute seule au rapport.
6. **Hugging Face, hors du verdict** (`runner/hf.py`, Qwen2.5-72B par défaut, option `--modele-hf`) :
   - **avant les rejeux, et en parallèle**, il propose les attaques à tenter. Ses propositions sont ensuite recoupées avec les failles prouvées : précision et rappel ;
   - la **gravité** n'est plus classée par le LLM depuis le 17/11 : elle variait d'un audit à l'autre pour la même faille (mesuré sur 5 audits). Une **règle écrite et déterministe** (`runner/gravite.py`, avec son banc de 9 cas) la calcule : qui accède (une autre entreprise ou un salarié), pour lire ou modifier, et quelles données, détectées par motifs fixes dans la page réellement reçue au rejeu. Les 14 audits passés ont été reclassés : la gravité est stable page par page.

   La latence, les tokens et le coût de chaque appel sont mesurés.

**Le filet de couverture.** L'explorateur doit ouvrir chaque ligne de chaque liste. Le runner ajoute aussi les liens visibles dans les pages qu'il a vues, sur un seul niveau et sur le même site. Il ne suit jamais les liens de déconnexion ou de suppression, ni les chemins `/cdn-cgi/` de Cloudflare.

## L'application cobaye : Paie Express v2

Un SaaS de paie fictif, partagé par deux entreprises (`cobaye/`). Comptes de test (fictifs) : `runner/comptes-demo.json`.
- **A**, Claire Martin, administratrice d'Alpha Conseil ;
- **B**, Hugo Bernard, administrateur de Bêta Logistique ;
- **C**, Léa Fontaine, salariée d'Alpha Conseil.

La vérité terrain (`cobaye/VERITE_TERRAIN.json`) documente **6 failles injectées** et **4 contrôles sains**, avec leur thème.

| Id | Thème | Faille injectée |
|---|---|---|
| F1 | Lecture | Une fiche de paie s'affiche par son URL sans contrôle de l'entreprise. |
| F2 | Lecture | La même faille sur l'API. |
| F3 | Lecture | Le paramètre `?entreprise=` de la liste des salariés n'est pas contrôlé. |
| F4 | Écriture | L'enregistrement du commentaire RH ne vérifie ni le rôle ni l'entreprise, alors que le formulaire est protégé. |
| F5 | Admin | `/administration` vérifie la connexion, pas le rôle. |
| F6 | Admin | Une salariée lit la fiche de paie d'un collègue. |

Les contrôles sains mesurent les faux positifs :
- **C1** : la facture d'une autre entreprise renvoie 404 ;
- **C2** : l'écriture sur une facture vérifie le rôle et l'entreprise ;
- **C3** : les paramètres de paie vérifient le rôle ;
- **C4** : les salariés et les factures sont réservés aux administrateurs.

**Le banc de la vérité terrain** (`runner/test_cobaye.py`, 21 vérifications) contrôle trois choses :
- chaque faille est bien ouverte ;
- chaque contrôle sain est bien fermé ;
- chaque accès légitime fonctionne.

Sans ce banc, un audit « 6 sur 6 » pourrait mesurer un cobaye qui ne contient plus ses failles.

## La salle de contrôle (web app)

`web/` est une application Next.js qui affiche les résultats des interventions des agents :
- les chiffres clés du dernier audit ;
- un ticker des failles prouvées ;
- le fil des sessions des agents, qui défile ;
- les constats, filtrés par date, thème, application et résultat ;
- le détail de chaque audit, avec sa vérité terrain et ses replays.

Elle lit pour l'instant les rapports JSON de `rapports/` ; Supabase prendra le relais. Les défilements n'animent que `transform`. Ils s'arrêtent au survol, quand l'onglet est caché, après deux minutes sans geste, ou si le système demande de réduire les animations.

## Lancer la démo

Prérequis, une seule fois par poste :
- se connecter à H avec `holo login` (voir `contexte/03-agents-api.md`) ;
- avoir l'environnement `.venv-holo` avec `hai-agents` à la racine du projet ;
- avoir Node 20 ou plus, et `cloudflared` (`brew install cloudflared`).

```bash
# L'audit, en une commande depuis la racine du projet. Le script :
# - reconstruit le cobaye si son code a changé ;
# - ouvre un tunnel public et l'application ;
# - lance l'audit à l'appui sur Entrée ;
# - demande le feu vert avant toute écriture, puis ouvre le rapport.
sentinelqa/demo.sh                        # ajouter --autoriser-ecriture pour donner le feu vert d'avance

# La salle de contrôle (port 3100, en local seulement : la web app n'a pas encore d'accès protégé)
cd sentinelqa/web && npm install && npx next build && npx next start -H 127.0.0.1 -p 3100

# Le parcours complet : le cobaye, le tunnel et le runner qui attend les demandes de la web app
sentinelqa/demo.sh --surveiller
# Puis, dans la salle de contrôle : « Lancer un audit », collez l'URL du tunnel, et c'est parti.

# Une fois pour toutes : le schéma Supabase, et l'import des anciens rapports
.venv-holo/bin/python sentinelqa/runner/base.py schema
.venv-holo/bin/python sentinelqa/runner/importer_rapports.py

# Le banc de la vérité terrain, cobaye lancé sur le port 3000
.venv-holo/bin/python sentinelqa/runner/test_cobaye.py
```

## Résultats mesurés (application cobaye, coût lu dans l'API H)

| Audit | Version | Failles prouvées | Faux positifs | Durée | Tokens | Coût |
|---|---|---|---|---|---|---|
| 16/11 · 23 h 30 | v0, avant correctif | 0 / 3 | 0 | 120 s | 352 804 | 0,054 $ |
| 16/11 · 23 h 36 | v0, lecture | 3 / 3 | 0 | 150 s | 581 606 | 0,098 $ |
| 16/11 · 23 h 40 | v0, lecture | 3 / 3 | 0 | 150 s | 606 335 | 0,103 $ |
| 16/11 · 23 h 50 | v0, lecture | 3 / 3 | 0 | 168 s | 534 359 | 0,091 $ |
| 16/11 · 23 h 54 | v0, lecture, `demo.sh` | 3 / 3 | 0 | 164 s | 629 488 | 0,113 $ |
| 17/11 · 0 h 21 | v0 avec agents sur mesure et coffres | 3 / 3 | 0 | 166 s | 660 838 | 0,113 $ |
| 17/11 · 0 h 34 | **v1, trois thèmes** | **6 / 6** | **0** | 213 s | 1 165 337 | 0,201 $ |
| 17/11 · 0 h 47 | **v1, code final** | **6 / 6** | **0** | 214 s | 1 114 085 | 0,187 $ |
| 17/11 · 6 h 27 | v1, fil dans Supabase | 5 / 6 | 0 | 170 s | 766 841 | 0,128 $ |
| 17/11 · 6 h 39 | **v1.1, lancé depuis le formulaire** | **6 / 6** | **0** | 304 s | 1 320 658 | 0,196 $ |
| 17/11 · 6 h 46 | **v1.1, formulaire et Hugging Face** | **6 / 6** | **0** | 349 s | 1 375 024 | 0,209 $ (+ 0,001 $ HF) |

**Le total sur les 5 audits v1 : 29 failles prouvées sur 30, et 0 faux positif.** À 6 h 27, l'explorateur n'avait ouvert que la première fiche de la liste et avait oublié celle de Karim, d'où F6 manquée. Le filet de couverture corrige ce cas : il a été vérifié en rejouant la trajectoire exacte de cet audit.

Chaque audit v1 compte 11 sessions d'agents (2 cartographies et 9 preuves) et 4 contrôles sains testés, sans faux positif. Le rapport de référence pour une démo hors ligne est `rapports/rapport-20261117-0034.html`.

## Limites de la v1, et la suite

- **Les comptes de test restent lisibles par notre runner.** Le rejeu HTTP en a besoin. Les agents, eux, ne voient jamais les mots de passe, qui passent par les coffres H.
- **L'application cobaye est écrite par l'équipe**, ce qui introduit un biais. La suite : un SaaS B2B open source déployé par nous, puis la préproduction d'un CTO pilote, avec son autorisation écrite.
- **La web app lit des fichiers locaux.** La suite :
  - Supabase, pour les audits et le fil des agents en temps réel ;
  - le formulaire de cadrage, pour lancer un audit depuis la web app ;
  - un LLM Hugging Face, qui propose les attaques à tenter ;
  - le déploiement sur Vercel.
- **La marge du seuil de lecture est étroite sur le tableau de bord.** Il est mesuré à 0,915 pour un seuil de 0,95 : c'est l'agent de preuve qui filtre le reste.
- **Le rapport complète un audit humain, il ne le remplace pas.**

## Pièges déjà rencontrés (à ne pas refaire)

**Le verdict et les rejeux**
- **Ne jamais fonder un verdict sur le texte rédigé par l'agent.** Ses « marqueurs » étaient reformulés (« Consultant senior » au lieu de « Consultante senior »), d'où 0 faille au premier audit. Le verdict compare désormais ce que reçoivent les comptes.
- **Un administrateur voit des boutons en plus.** Sur la fiche 1042, la similarité symétrique entre A et C est de 0,917, sous le seuil, alors que la page de C reproduit celle de A : la couverture vaut 1,000 (mesuré le 17/11). Pour le thème admin, on mesure donc la couverture.
- **Garder le réglage de difflib du seuil mesuré** (`autojunk` par défaut) pour la lecture, sinon le seuil de 0,95 ne vaut plus.

**La navigation de l'agent**
- **Prendre les URL dans la trajectoire du navigateur** (`metadata.url`), pas dans le résumé de l'agent. Il avait oublié `?entreprise=alpha`.
- **Faire naviguer l'agent en cliquant.** S'il tape les adresses, il saute les liens qui portent des paramètres.
- **Démarrer l'agent sur l'application** (`agent.environments[kind=web].start_url`). Sinon, il part de bing.com.
- **Un coffre par compte.** Un coffre choisit son identifiant d'après l'adresse de la page, et deux comptes sur le même site seraient ambigus.
- **L'agent peut mal remplir un champ structuré.** Il a déjà mis son propre nom comme « propriétaire » des données. Décrire précisément chaque champ (« pas le compte connecté ») : à l'audit de 0 h 47, il nomme bien Karim Haddad. Et ne jamais en tirer le verdict.

**Les mesures de l'API H**
- **Ne pas additionner les tokens de raisonnement** : ils sont déjà dans `output_tokens`.
- **`outcome` n'est pas l'état de la session** : c'est l'auto-évaluation de l'agent. L'état fiable est `status`, et `idle` veut dire que l'agent a répondu.
- **`finished_at` peut être vide** juste après la fin : la durée est mesurée de notre côté.

**L'exploration, Hugging Face et le tunnel**
- **L'exploration de l'agent varie d'un audit à l'autre.** À 6 h 27, il n'a ouvert que la première ligne d'une liste. D'où la consigne renforcée et le filet des liens visibles.
- **Le réseau de l'école bloque le port 7844** (TCP et UDP), indispensable au tunnel Cloudflare ; le port 443 passe. Le 17/11 à 11 h 36, le tunnel ne s'ouvrait plus, même en HTTP/2. Parade : brancher le Mac sur le partage de connexion d'un téléphone, puis relancer `demo.sh`. Test en 5 s : `nc -z -G 3 198.41.192.7 7844`.
- **Une coupure réseau arrêtait toute la démo** : un `ReadTimeout` de Supabase faisait planter le runner en attente, et le `trap` de `demo.sh` coupait alors le cobaye et le tunnel. La boucle d'attente réessaie désormais (3 s, puis jusqu'à 30 s), testé par une coupure simulée.
- **Le tunnel Cloudflare injecte `/cdn-cgi/l/email-protection`** dans les pages qui affichent des e-mails. Ce n'est pas une page de l'application : on l'exclut.
- **La latence du routeur Hugging Face varie beaucoup.** Les hypothèses ont pris 99,5 s puis 13 s pour la même tâche. Elles tournent donc en parallèle des rejeux.
- **La gravité du LLM variait d'un audit à l'autre** (10 pages sur 10 ont changé de niveau sur 5 audits). Elle est remplacée par la règle écrite de `runner/gravite.py`, et `runner/regraver.py` a reclassé l'historique.

**Le volet QA (18/11)**
- **`holo login` écrit la clé entre guillemets.** Lue telle quelle, H répond 403 « explicit deny » ; `source` les retire, d'où des essais en terminal qui passent. Toujours `.strip("'\"")`.
- **H renvoie ses valeurs par défaut** (`headless`, `lazy`, `settle_s`, `mode.markdown`) à la relecture d'un agent : comparer les seuls champs fixés, et refuser un coffre, un profil ou un proxy hérité (`qa_agent.conforme`).
- **Le menu de chaque page cite les autres pages** (« 4 étapes » est sur toutes les pages d'Eugenia). Un texte attendu se cherche dans le contenu, hors `nav`, `header` et `footer`.
- **« Quatre étapes » vaut « 4 étapes »** : les nombres de deux à vingt sont normalisés (pas « un », « une » ni « neuf », ambigus).
- **L'agent assemble ses citations** (« 01 … / 02 … / 03 … ») : chaque fragment est vérifié.
- **Un texte décrit n'est pas un texte exact.** « Vérifie qu'elle explique le processus » est un constat ; seuls les mots entre guillemets sont cherchés tels quels.
- **L'agent a un outil non documenté, `web_fetch`** : il lit une page sans l'afficher. Interdit dans sa consigne ; relevé dans le rapport ; jamais compté comme page atteinte.
- **En dev, ouvrir `localhost`, pas `127.0.0.1`** : `next dev` réécrit l'URL de la requête en `localhost`, et le contrôle d'origine refuse alors toute écriture. `next start` n'a pas ce défaut.
- **Deux sondages concurrents doublaient le fil** (double montage de React en dev, rechargement à chaud) : fusionner les événements par identifiant. Le suivi du pentest (`app/audits/[id]/suivi.js`) a le même schéma.
- **Le suffixe de fournisseur ne prouve pas le fournisseur.** Avec notre jeton, le routeur Hugging Face répond `x-inference-provider: openrouter` pour `Llama-3.3-70B-Instruct:groq` comme sans suffixe (18/11, 7 h 45). Citer le routeur, pas « Groq ».
- **Ne pas lancer `next dev` dans le dossier d'un `next start` en cours** : Next 16.4.6 écrit sa sortie de dev dans le même `.next`.

**Le code**
- **Un client httpx déjà utilisé ne s'ouvre pas une seconde fois avec `with`.**
- **Next 16 fige une page à la construction** si rien n'est dynamique (*lu* dans sa documentation). `await connection()` force la relecture des rapports à chaque visite.
- **Une grille mobile en `1fr`** laisse un tableau sans retour à la ligne élargir la page. Écrire `minmax(0, 1fr)`.
- **Un conteneur flex avec `gap`** coupe « Sentinel » et « QA » en deux éléments : le mot doit tenir dans un seul élément.
- **Une animation d'entrée qui part d'une opacité nulle** rend les cartes invisibles tant qu'elle n'est pas finie. Partir de 0,35.
- **L'agent recopie parfois du JSON sans espace.** Une chaîne sans coupure possible élargit sa carte et toute la page (1359 px pour un écran de 1280). Il faut `overflow-wrap: anywhere` et `min-width: 0` sur les cartes de la grille.
- **Deux processus Next écoutent le même port.** `kill $P` échoue quand `$P` contient deux identifiants : écrire `kill $(lsof -ti tcp:3100)`.
