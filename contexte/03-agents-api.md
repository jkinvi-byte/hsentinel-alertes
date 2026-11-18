# Agents API de H : référence vérifiée

Lu le 16/11/2026 dans la doc officielle (index : https://hub.hcompany.ai/llms.txt ; chaque page existe en `.md`). Les allocations peuvent changer : on lit les valeurs en direct par l'API plutôt que de les coder en dur. Ce qui n'a pas été trouvé est listé en bas, avec les questions à poser aux mentors H.

## Les trois produits de H

- **Agents API** : des agents computer-use gérés par H.
  - URL de base : `https://agp.eu.hcompany.ai/api/v2` (Europe) ou `https://agp.hcompany.ai/api/v2` (États-Unis).
- **Models API** : les modèles Holo, avec une API compatible OpenAI sur `https://api.hcompany.ai/v1`.
- **HoloTab** : une extension Chrome gratuite et sans code, qui fait tourner Holo dans le navigateur, avec des routines enregistrables et des plannings. C'est un concurrent possible de toute idée « routine dans le navigateur ».

## Accès et outils

- **Clé API** : à passer en bearer, depuis la variable `HAI_API_KEY` (dans `.env`, jamais commitée).
- **SDK** :
  - Python : `pip install hai-agents`, puis `from hai_agents import Client` ;
  - TypeScript : `npm install hai-agents`, puis `import { HaiAgentsClient } from "hai-agents"`.
- **CLI `holo`** : `pip install "hai-agents[cli]"`. Elle pilote le bureau avec `-a h/holo-desktop`, et sert de serveur MCP avec `holo mcp`.
- **Intégrations** : n8n (par des nœuds HTTP Request), serveur MCP, agents de code (Claude Code, Cursor, Codex).

## Sessions : l'unité de travail

- **Créer une session** : `POST /api/v2/sessions`.
  - En Python, `client.run_session(...)` bloque jusqu'à la réponse.
  - `client.sessions.create_session(...)` ne bloque pas.
- **Cycle de vie** : `queued` ou `pending`, puis `running`, puis éventuellement `idle`, jusqu'à un état terminal : `completed`, `failed`, `timed_out` ou `interrupted`.
- **Lire le résultat** : on lit `latest_answer` une fois l'état terminal atteint. Pour suivre la session, on utilise les webhooks ou l'endpoint de long-poll `changes`.
- **Paramètres de création vérifiés :**
  - `agent` : un identifiant du catalogue (`"h/web-surfer-flash"`, avec `:N` pour figer une révision) ou un agent défini en ligne, avec ses `environments` (par exemple `{ "kind": "web", "start_url": "…" }`).
  - `messages` : la consigne.
  - `files` : 10 fichiers au plus, 7 Mo au total, déposés dans `~/Downloads` du navigateur cloud.
  - `skills`, `timezone` (par exemple `"Europe/Paris"`).
  - `max_steps` : au plafond, l'agent est invité à répondre avec ce qu'il a. Il n'est pas tué.
  - `max_time_s` : secondes par réponse. Si l'agent tourne encore 60 s après le plafond, la session finit `failed` avec le code `timeout`.
  - `idle_timeout_s` : garde la session ouverte pour d'autres messages (mode interactif).
  - `delete_after_min` et `delete_screenshot_after_min` : effacement automatique, utile pour les données sensibles.
  - `group_id`, `parent_session_id` (sous-agents), `caller_id`.
  - `queue` : vaut `true` par défaut. Avec `false`, on reçoit un `429` au lieu d'une mise en file.
  - `overrides` : par exemple `agent.instructions`, `agent.model`, `agent.answer_format` ou `agent.environments[kind=web].start_url`.
- **Sortie structurée** : dans le SDK, `answer_schema` (Pydantic) ou `answerSchema` (Zod v4). Sans SDK, un JSON Schema dans `agent.answer_format`.
- **Agents et modèles vus dans la doc** :
  - `h/web-surfer-flash`, celui à préférer pour aller vite ;
  - `h/holo-desktop` ;
  - les modèles `holo4-35b-a3b` et `holo3-1-35b-a3b`.

  Le brief cite aussi `h/web-surfer-pro`, `h/deep-search-pro` et `holo4-27b`. La liste à jour s'obtient par `GET` sur la liste des agents.

## Les briques à exploiter (les 30 % de note technique)

- **Skills** : des instructions Markdown que l'agent charge quand la tâche correspond.
- **Custom tools** : l'agent appelle nos fonctions, et on lui renvoie les résultats par l'endpoint des tool results.
- **Validation humaine** : l'agent met en attente les appels d'outils qui demandent une décision humaine, et on les approuve ou refuse par l'endpoint des tool approvals.
- **Sous-agents** : un agent manager répartit la tâche entre des sous-agents qui tournent en parallèle. Une session enfant ne se met jamais en file d'attente : à pleine capacité, sa création renvoie un `429`.
- **Pilotage en cours de route** : envoyer un message, mettre en pause, reprendre, forcer une réponse ou annuler.
- **Preuves** :
  - la liste des événements (tout ce que l'agent a vu et fait) ;
  - les captures et fichiers à télécharger ;
  - un lien public « Agent View » sans clé, révocable.
- **Feedback** sur une session entière ou sur une étape précise. C'est notre canal de retours vers H.
- **Fichiers** : lister, lire et écrire des fichiers sur la machine du navigateur cloud.
- **Browser profiles** : cookies et stockage sauvegardés, pour démarrer déjà connecté.
- **Coffres (identifiants et 2FA)** : un coffre 1Password ou hébergé par H, avec des codes TOTP. Les secrets n'entrent jamais dans le contexte du modèle, et la lecture d'un secret est journalisée.
- **Webhooks** : un POST signé à chaque changement d'état d'une session.
- **Schedules** : des sessions lancées par un cron. Leur nombre est plafonné par organisation : la valeur exacte est à lire dans « Plans and limits ».

## Où agit l'agent

- **Navigateur cloud de H** : c'est le mode par défaut.
- **Notre propre Chrome** : on définit un environnement avec `"host": "user_device"` et on installe `pip install "hai-agents[cli,browser]"`.
  - L'agent se branche sur un Chrome ouvert en débogage distant (port 9222), avec un profil dédié (`~/.hai/chrome-profile`), nos logins et **notre réseau**.
  - Il peut exécuter des scripts de page et lire les cookies : la doc conseille une machine dédiée.
  - On l'arrête avec `holo local stop`.
- **Notre bureau**, piloté par commandes ou par la vue.
- **Exécution et inférence locales** :
  - `Client.local()` fait tourner la boucle de l'agent chez nous ;
  - les poids Holo sont servis par llama.cpp ou vLLM, et les prompts et captures ne quittent pas le réseau.
  - **Attention à la licence** : Holo4 27B et 35B-A3B sont en **CC BY-NC 4.0 (non commercial)**. Chaque fiche Hugging Face indique sa licence : on la vérifie avant de promettre une offre « sur site » dans le pitch.

## Offres et limites (doc « Plans and limits »)

| | Gratuit | 20 $/mois | 200 $/mois | Sur mesure |
|---|---|---|---|---|
| Tokens par période | 60 M | 1 Md | 10 Md | Sur mesure |
| Sessions simultanées | 3 | 10 | 100 | Sur mesure |

- **À la limite de sessions** : la session est acceptée en file (`201 queued`). Une session encore en file au bout de 24 h finit `timed_out`. Les sessions inactives depuis 120 s ou plus peuvent être fermées pour faire de la place.
- **Au-delà des tokens du forfait** : la facturation passe sur le crédit de l'organisation, au prix du modèle plus 20 %. Sans crédit, la session échoue avec le code `insufficient_credit`.
- **Quotas en direct** : `GET /api/v2/sessions/quota` et `GET /api/v2/quota/tokens`.
- **Mesure** : le statut de session renvoie l'état, le nombre de steps et les tokens consommés. `GET /api/v2/sessions/{id}/changes` renvoie en plus `metrics.total_cost`, le **coût de la session en dollars** au prix du modèle (schéma `Metrics` de l'OpenAPI, *lu* le 16/11). Ce sont nos métriques de réussite, de latence et de coût.
- **Ordre de grandeur du brief** : environ 1 M de tokens par session, soit environ 0,02 $ au plan à 20 $. **Prix d'exemple pour Holo3.1** : environ 0,25 $ par million de tokens en entrée et 1,80 $ en sortie. Deux chiffres **à confirmer par nos mesures**.
- **Mesuré le 16/11 pour `holo4-35b-a3b`** (prix déduits des coûts renvoyés par l'API, exacts sur 12 sessions sur 12) : 0,30 $ par million de tokens en entrée, 0,03 $ en cache et 2,00 $ en sortie, raisonnement compris. Une session SentinelQA consomme de 47 k à 316 k tokens, loin du « ≈ 1 M » du brief.

## Non trouvé dans la doc : à demander aux mentors H (points CTO mardi, 11 h et 15 h)

- L'accès à `localhost` depuis le navigateur cloud. Parade connue : l'environnement `user_device`.
- L'accès à la console du navigateur ou l'interception des requêtes réseau.
- La latence typique par step : à mesurer nous-mêmes.
- Les conditions d'utilisation pour des tests de sécurité. Les CGU, lues le 16/11 sur platform.hcompany.ai/terms, disent : « Ensure that Your use of the Platform Service complies with the terms of service, robots.txt policies, security measures and access restrictions of the websites being visited. » Elles ne mentionnent pas les tests de pénétration.
- Le nombre exact de schedules par organisation, et l'éventuelle limite de débit des lancements de navigateur. Le brief cite 10 par minute, à reconfirmer.

## Accès depuis Claude Code (mis en place le 16/11/2026 sur le Mac d'Aurian)

Procédure officielle, *lue* sur hub.hcompany.ai (pages « Coding agents » et « MCP server »), à reproduire sur chaque poste :

1. **Le plugin H**, qui apprend à Claude les API de H : `claude plugin marketplace add hcompai/computer-use-agents-demos`, puis `claude plugin install hai-agents@hai-skills`. On peut aussi taper `/plugin …` dans Claude Code.
2. **Le CLI `holo`**, dans un environnement isolé exclu de git : `python3 -m venv .venv-holo`, puis `.venv-holo/bin/python -m pip install "hai-agents[cli,browser]"`.
3. **La connexion, faite par chacun** : `.venv-holo/bin/holo login`. Elle passe par le navigateur, ou par `--key` pour coller une clé dans une saisie masquée. La clé est rangée dans `~/.config/hai/.env`. On se connecte avec le compte où les crédits de l'équipe sont activés.
4. **Le pont MCP local** : `.venv-holo/bin/holo mcp install claude-code`. Il ajoute le serveur `holo` (outils `run_agent`, `list_agents`), qui lit la clé enregistrée sans la recopier dans la configuration. On redémarre ensuite Claude Code.
5. **La vérification** : `.venv-holo/bin/holo doctor`, puis `/mcp` dans Claude Code.

**L'alternative : le serveur MCP distant** `https://agp.eu.hcompany.ai/mcp`, qui ajoute `wait_for_session`, `send_message`, `cancel_session` et les transferts de fichiers.
- Il n'accepte que la clé API, sans connexion par navigateur.
- Un `.mcp.json` de projet peut le déclarer avec l'en-tête `Authorization: Bearer ${HAI_API_KEY}`. Claude Code remplace alors la variable par sa valeur au démarrage, à condition que `HAI_API_KEY` soit définie dans le terminal qui lance Claude Code.
- `holo mcp install --remote` le fait aussi, mais **écrit la clé en clair** dans la configuration.

## Catalogue et première mesure, lus via l'API le 16/11/2026

- **Les 7 agents :**
  - `h/holo-desktop` et `h/holotab` : `holo4-27b`, sur l'appareil de l'utilisateur ;
  - `h/web-surfer-pro` (`holo4-27b`) et `h/web-surfer-flash` (`holo4-35b-a3b`) : navigateur cloud `h/browser` ;
  - `h/web-scraper-pro` (`holo4-27b`) et `h/web-scraper-flash` (`holo4-35b-a3b`) : navigateur textuel `h/textual_browser` ;
  - `h/deep-search-pro` (`holo4-27b`).
- **Le statut d'une session** (`GET /api/v2/sessions/{id}/status`) renvoie `steps` et `usage_per_model` : tokens en entrée, en cache, en sortie et de raisonnement. **Les tokens en cache sont inclus dans l'entrée, et ceux de raisonnement dans la sortie** : la doc ne le dit pas, mais les coûts de l'API le prouvent. Il ne faut donc additionner que l'entrée et la sortie. Le coût en dollars se lit dans `changes` (voir « Mesure » plus haut).
- **Première session** (example.com, `h/web-surfer-flash`) : 2 steps, environ 20 k tokens, 22 s. Le détail est dans `notes/retours-agents-api.md`.
