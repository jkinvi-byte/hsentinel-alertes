# Retours sur l'Agents API de H (journal)

> Ces retours font partie du livrable : ce qui a marché, ce qui a cassé, ce qui a surpris (slide 4 du PDF).
> On note la date, l'action, le résultat et la preuve (identifiant de session, mesure). Mesures prises sur le Mac d'Aurian.

## Mercredi 18/11/2026, 6 h 29 à 7 h 28 : le volet QA en réel, depuis Claude Code (D-30)

Toutes ces sessions sont réelles, sur `https://www.eugeniaschool.com` (consultation seule, D-24), région EU, SDK `hai-agents` 1.5.1, agent `sentinelqa-qa` (`holo4-35b-a3b`).

**Ce qui a marché (*mesuré*)**
- L'accès H fonctionne depuis Claude Code : `list_agents` répond, l'agent `sentinelqa-qa` est créé puis mis à jour (2 révisions dans H). Le `ConnectError` de Codex venait de son environnement, pas de H.
- 8 missions QA complètes : 0,290 $ de coût H au total, 0,036 $ et 81 s en moyenne. Parcours guidé : 43 à 81 s, 7 à 15 steps, 0,014 à 0,039 $. Exploration : 86 s (ordinateur) et 97 à 160 s (mobile), 0,045 à 0,070 $. Première session : `d9e0ae67`, 29,5 s, 4 steps, 0,011 $.
- `answer_schema` (Pydantic) : 8 réponses structurées valides sur 8, avec les citations demandées.
- `get_session_changes(from_index, include_events, wait_for_seconds)` suffit pour un fil en direct : chaque geste (`policy_event.tool_reqs[].args.element`, une description lisible de l'élément visé) et chaque page (`observation_event.metadata.url`) arrivent quelques secondes après l'action.
- `overrides` par session : `agent.environments[kind=web].mode` change l'écran (1280 × 800 ou 390 × 844) sans dupliquer l'agent.
- Les captures (`observation_event.image.source`) se téléchargent avec la clé et une redirection S3 : notre serveur les relaie sans exposer la clé.

**Ce qui a cassé, et la cause trouvée (*mesuré*)**
- La relecture d'un agent renvoie les valeurs par défaut de H en toutes lettres (`headless`, `lazy`, `settle_s`, `mode.markdown`). Une comparaison stricte avec la définition envoyée échoue toujours : l'agent est créé, puis déclaré « non confirmé » (6 h 29). Corrigé par une comparaison des seuls champs fixés, en refusant tout coffre, profil ou proxy hérité.
- `holo login` écrit la clé entre guillemets dans `~/.config/hai/.env`. Lue telle quelle, elle produit un 403 « explicit deny » (7 h 03). Le shell retire les guillemets avec `source`, d'où des essais en terminal qui passaient. *Hypothèse* : la même cause expliquerait le 403 du connecteur MCP `hai-agents-platform` au démarrage de Claude Code.

**Ce qui a surpris**
- **Un outil non documenté, `web_fetch`** : en mobile, ne parvenant pas à ouvrir un sous-menu, l'agent a lu 4 pages par requête directe (session `99b6dec5`). Le résultat est un markdown « # Page Content: … ». Cet outil n'apparaît pas dans la liste des actions du navigateur de la documentation. Nous l'interdisons dans la consigne et le rapport le signale. Une fois `web_fetch` interdit, l'agent a tapé deux adresses (`go_to_web`) ; notre rapport les relève aussi (session `4c7e4dce`).
- Le texte rendu (`markdown: true`) ne couvre que la zone visible et perd parfois des mots : le titre « Bachelor AI Applied to Business » y apparaît sans « Bachelor ». Nous recoupons donc avec la page servie.
- `agent_view_url` renvoie `https://platform.hcompany.ai/agents/sessions/<id>` pour une session EU ; la skill H indique `platform.eu.hcompany.ai/agent-view/<id>`. Le lien de l'API est conservé tel quel, et son ouverture n'a pas été testée sans connexion.
- Un même agent varie d'une session à l'autre. Le 18/11, il a vu « 3 étapes » en manquant la FAQ (7 h 05), puis il a trouvé « Quatre étapes » dans la FAQ (7 h 11). D'où notre règle : un écart signalé par l'agent seul n'est jamais compté comme prouvé.
- En mobile (390 × 844), 2 explorations sur 2 ont buté sur le menu en accordéon, avec 13 clics sans changer de page ; ce n'est jamais arrivé sur ordinateur. *Hypothèse* : la précision des clics sur petit écran, ou le menu lui-même. À confirmer sur le replay.

## Mercredi 18/11/2026 : agents persistants pour les missions réelles (D-28)

- **Écart corrigé** : les agents du premier lot étaient définis en ligne dans `start_session`, sans entrée persistante dans H. Les agents historiques du cobaye existaient déjà d'après les rapports et le code.
- **Implémentation** : `runner/agents_missions.py` et `--preparer-agents` utilisent `get_agent`, `create_agent` et `patch_agent`, puis relisent chaque configuration avant confirmation. Le runner référence `sentinelqa-qa` ou `sentinelqa-pentest` par son nom ; la cible validée est injectée par `overrides`. [Documentation H lue](https://hub.hcompany.ai/agents-api/agents/overview).
- **Validation locale** : définitions acceptées par le modèle `Agent` du SDK 1.5.1 ; 25 tests Python passent. Les contrats d'enregistrement sont exercés avec le vrai SDK et un transport HTTP simulé, sans accès distant.
- **Tentative réelle** : `--preparer-agents` échoue dès le GET du premier agent avec `ConnectError`. Diagnostic séparé : `Errno 8`, résolution de l'hôte, aucune réponse HTTP. La clé a été chargée depuis sa configuration existante ; aucun POST/PATCH n'a pu être atteint. Aucun nouvel agent ni session H enregistré par cette tentative.
- **Conséquence** : ne pas demander de refaire `holo login` sans erreur d'authentification observée. La configuration MCP de Claude Code est distincte des outils exposés à Codex. Ce constat ne prouve pas un défaut du service H.

## Mercredi 18/11/2026 : premier exécuteur de missions réelles

- **Implémenté et testé avec un double local** : session H vierge et sans coffre, schéma de réponse, lecture des URL dans les événements, métriques facultatives, annulation de la session lors de l'arrêt. Le SDK installé lors des tests était `hai-agents 1.5.1` ; les méthodes du handle ont été lues dans son code.
- **Essai réel Q-PUB-01** : le client a renvoyé `ConnectError` avant l'obtention d'un identifiant de session. Rapport non concluant : `sentinelqa/rapports/rapport-20261118-015916-098157.json`. Aucun succès du scénario et aucun coût H ne sont annoncés.
- **Diagnostic de l'environnement** : l'accès public avec `curl -I` à l'hôte API répondait, mais les appels Python et npm rencontraient des problèmes de connectivité/résolution. Le test navigateur local était bloqué par `listen EPERM` sur loopback. Cela ne démontre pas un défaut du service H.
- **Limite conservée** : les consignes du navigateur natif et le contrôle des URL observées après l'exécution ne constituent pas un filtrage avant clic. Les scénarios sensibles et authentifiés restent hors de ce premier exécuteur.

## Mardi 17/11/2026 : documentation pour la démo sur sites réels

**Lu, sans nouvelle session H ni mesure d'exécution :**
- Les [custom tools](https://hub.hcompany.ai/agents-api/custom-tools) s'ajoutent aux outils natifs. Ajouter un outil de contrôle ne bloque pas automatiquement les clics natifs du navigateur.
- Avec [le navigateur local](https://hub.hcompany.ai/agents-api/your-browser), un processus pilote un navigateur à la fois ; démarrer une nouvelle session sur ce processus annule la précédente. À prendre en compte pour isoler A et B.
- Le [navigateur cloud](https://hub.hcompany.ai/agents-api/browser/configuration) accepte `network.proxy_url`. La capacité à filtrer les opérations HTTPS avant transmission reste à éprouver : ce paramètre seul ne constitue pas un mode sans écriture.

Ces points motivent le travail de contrôle du navigateur décrit dans `livrables/09-guidelines-demo-sites-reels.md`. Aucune garantie de filtrage n'a été mesurée pendant cette revue.

## Lundi 16/11/2026 : mise en place et première session

**Ce qui a marché**
- Le plugin Claude Code `hai-agents@hai-skills` s'installe en ligne de commande (`claude plugin marketplace add hcompai/computer-use-agents-demos`, puis `claude plugin install hai-agents@hai-skills`), en moins d'une minute.
- Le CLI s'installe en une commande : `pip install "hai-agents[cli,browser]"`, dans un environnement isolé.
- `holo whoami` confirme l'endpoint européen, l'authentification et la source de la clé (`~/.config/hai/.env`).
- `holo agents list` renvoie 7 agents :
  - `h/holo-desktop` et `h/holotab`, sur `holo4-27b`, sur l'appareil de l'utilisateur ;
  - `h/web-surfer-pro` (`holo4-27b`) et `h/web-surfer-flash` (`holo4-35b-a3b`), dans le navigateur cloud `h/browser` ;
  - `h/web-scraper-pro` et `h/web-scraper-flash`, dans le navigateur textuel `h/textual_browser` ;
  - `h/deep-search-pro`.
- **Première session réussie.** `h/web-surfer-flash` a ouvert example.com et a renvoyé le bon titre et la bonne URL finale.
  - Session `0c9cc07a-9e2f-4cd1-a379-4614e74556cc`, résultat `success`.
  - **2 steps**, 20 323 tokens en entrée (dont 8 448 en cache), 210 en sortie et 119 de raisonnement.
  - **22 s** mesurées de bout en bout, démarrage du CLI compris.

**Ce qui a cassé**
- `holo login` refuse de tourner dans un shell non interactif, comme le mode `!` de Claude Code. Le message est clair et propose `holo login --key`, qui accepte aussi la clé par l'entrée standard.
- **`holo doctor` plante** (`ModuleNotFoundError: No module named 'ApplicationServices'`) quand l'option bureau n'est pas installée. Il devrait indiquer « bureau non installé » et afficher quand même ses autres vérifications.

**Ce qui a surpris**
- `holo run` rend la main avec `status: idle`. Quelques secondes plus tard, l'API de statut indique `completed`.
- Une tâche simple consomme environ 20 k tokens, loin de l'ordre de grandeur « ~1 M par session » noté dans le brief. Il faudra mesurer sur de vraies tâches SentinelQA.
- Le compte connecté est sur **l'offre gratuite** : 60 M de tokens jusqu'au 16/12 et 3 sessions simultanées. Il reste à vérifier où sont activés les crédits de l'équipe.

## Lundi 16/11/2026, 23 h : intégration Claude Code et première démo

**Ce qui a marché**
- Après redémarrage, Claude Code charge le pont MCP `holo`, qui expose `run_agent` et `list_agents`.
- Le SDK Python est lisible par introspection, sans clé.
  - `Client.start_session(..., answer_schema=Modèle)` renvoie un handle avec `id`, `get()` (dont `agent_view_url`), `status()` (dont `steps` et `usage_per_model`) et `wait_for_completion()`.
  - `wait_for_completion()` renvoie un résultat dont `answer` est déjà typé par le modèle Pydantic.
  - `client.sessions.share_session(id).share_url` donne le lien public de partage.

**Ce qui a cassé**
- Le plugin `hai-agents@hai-skills` déclare aussi trois serveurs MCP, et aucun ne se connecte :
  - `hai-agents-demos-extract-anything` et `hai-agents-demos-qa` : connexion fermée ;
  - `hai-agents-platform` : HTTP 403, « User is not authorized to access this resource with an explicit deny in an identity-based policy ».

  Le pont `holo` fonctionne, lui.

**Ce qui a surpris**
- La grille publique (hcompany.ai/pricing) n'affiche aucun prix au token par modèle. Elle donne seulement les offres et le dépassement « model cost + 20% ». On ne peut donc pas chiffrer un audit à partir des sources publiques. **Mise à jour à 23 h 45** : l'API, elle, donne ce coût (voir plus bas).

## Lundi 16/11/2026, minuit : premier audit SentinelQA

**Ce qui a surpris**
- **Les réponses structurées reformulent.** Avec un `answer_schema`, les champs texte sont résumés et réécrits : « Consultant senior » au lieu de « Consultante senior », plusieurs valeurs collées dans un même champ. Il ne faut pas s'en servir comme preuve mot pour mot.
- **L'agent préfère taper les URL plutôt que cliquer.** Il a même deviné des API qui n'existaient pas (`/api/salaries`, réponse 404). C'est utile pour un attaquant, mais on perd les paramètres portés par les liens.
- **Bonne surprise** : les événements de session (`list_session_events`) contiennent l'URL exacte de chaque page observée (`data.metadata.url`). C'est une source fiable pour rejouer ce que l'agent a réellement vu.
- **Le point de départ par défaut de `h/web-surfer-flash` est bing.com.** L'override `agent.environments[kind=web].start_url` le remplace.

**Mesures du premier audit** (avant correctif)
- Cartographie : 9 ressources relevées, 19 pages observées, environ 355 000 tokens, 120 s de bout en bout.

## Lundi 16/11/2026, de 23 h 30 à minuit : audits n°2 à n°5, après correctif

**Ce qui a marché**
- **Le résultat se reproduit.** Les 4 audits faits après correctif prouvent les 3 failles injectées, sans faux positif. Ils durent de 150 à 168 s et coûtent de 0,091 à 0,113 $ (tableau plus bas).
- **Les preuves tournent par vagues de 3**, la limite de l'offre gratuite. Chacune prend de 23 à 33 s et 4 ou 5 steps.
- **Le coût réel de chaque session est dans l'API.** `GET /api/v2/sessions/{id}/changes` renvoie `metrics.total_cost` en dollars, avec le détail par modèle : entrée, sortie et raisonnement. L'OpenAPI le documente (schéma `Metrics`), mais pas la page des prix.

**Ce qui a surpris**
- **`reasoning_tokens` est inclus dans `output_tokens`, et `cached_tokens` dans `input_tokens`.** La doc ne le dit pas, mais les coûts le prouvent exactement, sur 12 sessions sur 12. Notre premier total comptait donc le raisonnement deux fois (+0,8 %). Suggestion pour H : l'écrire dans la description des champs.
- **Les prix unitaires de `holo4-35b-a3b`**, déduits des coûts de l'API : 0,30 $ par million de tokens en entrée, 0,03 $ en cache, et 2,00 $ en sortie, raisonnement compris.
- **`wait_for_completion()` rend la main quand la session est `idle`.** L'agent a répondu, mais la session ne passe à `completed` que quelques secondes plus tard, et `finished_at` n'est renseigné qu'à ce moment-là. On l'a constaté sur 5 sessions sur 6 de l'audit n°4, et toutes étaient `completed` à la relecture. C'est la cause de nos durées vides.
- **`outcome` est resté vide sur toutes nos sessions.** C'est l'auto-évaluation de l'agent, renseignée seulement quand il la fournit (« when reported »). L'état fiable est `status`.
- **Les liens de replay.** Le SDK renvoie `platform.hcompany.ai/agents/sessions/{id}`, et `platform.eu.hcompany.ai` y redirige (HTTP 301). La skill `hai-agents` conseille l'hôte `.eu` pour les sessions européennes : les deux fonctionnent.
- **L'agent écrit parfois en anglais** (« dashboard ») alors que la consigne est en français. C'est sans conséquence ici : le verdict ne lit pas ce champ.

**Mesures** (application cobaye Paie Express, agent `h/web-surfer-flash`, coût lu dans l'API)

| Audit | Failles prouvées | Faux positifs | Durée | Tokens | Coût |
|---|---|---|---|---|---|
| n°1, avant correctif | 0 / 3 | 0 | 120 s | 352 804 | 0,054 $ |
| n°2 | 3 / 3 | 0 | 150 s | 581 606 | 0,098 $ |
| n°3 | 3 / 3 | 0 | 150 s | 606 335 | 0,103 $ |
| n°4 | 3 / 3 | 0 | 168 s | 534 359 | 0,091 $ |
| n°5, avec `demo.sh` | 3 / 3 | 0 | 164 s | 629 488 | 0,113 $ |

**Questions pour H, nées de ces mesures**
- Une session `idle` occupe-t-elle l'une des 3 places simultanées jusqu'à sa fermeture ?
- `metrics.total_cost` est-il le prix facturé au-delà du forfait, avant la majoration de 20 % ?

## Mardi 17/11/2026, de 0 h à 1 h : agents sur mesure, coffres et audit v1

**Ce qui a marché**
- **Créer un agent par l'API** : `client.agents.create_agent(name, description, instructions, model, environments)` a marché du premier coup. Les deux agents `sentinelqa-explorateur` et `sentinelqa-verificateur` apparaissent dans le catalogue. Un `patch_agent` crée une révision.
- **Les coffres H**, d'après la doc « Credentials and 2FA », *lue* :
  - un coffre interne et un élément par compte, rattaché à l'URL auditée ;
  - le coffre est lié à la session par l'override `agent.environments[kind=web].vault_id` ;
  - l'agent se connecte avec `fill_secret_at` (4 événements par session), et aucun mot de passe n'apparaît dans les événements (vérifié sur 2 sessions).
- **L'audit v1** prouve 6 failles sur 6, sans faux positif. Il compte 11 sessions, dure 213 s et coûte 0,201 $. Deux cartographies tournent en parallèle, puis les preuves par vagues de 3.

**Ce qui a surpris**
- **La correspondance par URL des coffres.** C'est la page qui choisit l'identifiant, d'après son adresse. Deux comptes sur le même site seraient ambigus, et il faut donc **un coffre par compte**. L'URL du tunnel change à chaque lancement : on remplace l'élément du coffre avant chaque audit.
- **Pas de validation humaine prévue pour un clic.** La doc du navigateur (*lue*) présente ses actions comme un ensemble fixe (« the set is fixed »), sans aucun réglage d'approbation. Les tool approvals y sont décrites pour les outils et les commandes. La validation des tests d'écriture se fait donc dans notre runner. Question pour H : est-ce possible autrement ?
- **Une session `idle` est fermée pour faire de la place** quand la limite de sessions simultanées est atteinte (doc des sessions, *lue*). Cela répond en partie à notre question : une session `idle` occupe bien une place.
- **Un champ structuré mal compris.** Connecté comme Léa, le vérificateur a mis « Léa Fontaine » comme propriétaire des données, alors que la fiche était celle de Karim. Son texte libre disait pourtant juste. Il faut décrire précisément chaque champ, et ne jamais en tirer le verdict.
- **Le texte libre des agents contient du markdown** (`**gras**`), qu'il faut nettoyer avant de l'afficher.
- **Deuxième audit v1 à 0 h 47**, avec le code final : 6 failles sur 6, 0 faux positif, 214 s, 1 114 085 tokens, 0,187 $. Avec la description précisée du champ « propriétaire » (« pas le compte connecté »), l'agent nomme bien Karim Haddad.

## Mardi 17/11/2026, de 6 h à 7 h 40 : cadrage chiffré, mode surveillance, Hugging Face

**Ce qui a marché**
- **Les coffres H avec des mots de passe venus du navigateur.** Le runner déchiffre en mémoire les mots de passe saisis dans la web app, remplit les coffres, et les agents se connectent comme avant. Deux audits ont été lancés depuis le formulaire : 6 sur 6 chacun.
- **Le coût Hugging Face est dans la réponse du routeur** (`usage.cost`), comme le coût H l'est dans `metrics.total_cost`. Hugging Face coûte environ 0,001 $ par audit, pour deux appels.

**Ce qui a surpris**
- **L'exploration varie d'un audit à l'autre.** À 6 h 27, l'explorateur s'est arrêté au bout de 19 steps, avec une seule fiche ouverte sur deux. F6 a été manquée, pour un score de 5 sur 6. La consigne « ouvre chaque ligne de chaque liste » et un filet déterministe (les liens visibles) corrigent ce cas. Question pour H : existe-t-il un réglage pour une exploration exhaustive ?
- **Le tunnel Cloudflare réécrit les pages** qui affichent des e-mails : il ajoute un lien `/cdn-cgi/l/email-protection`. C'est sans rapport avec H, mais à savoir pour toute démo sur tunnel.
- **La latence du routeur Hugging Face varie beaucoup** pour la même tâche, de 99,5 s à 13 s. La gravité varie aussi d'un audit à l'autre. Hugging Face reste donc hors du verdict, en parallèle quand c'est possible.

