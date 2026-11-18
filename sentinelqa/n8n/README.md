# Les alertes n8n (Jahdiel)

Trois workflows n8n, exportés de l'instance de Jahdiel le 18/11/2026. Les exports ne contiennent aucun secret : les identifiants sont désignés par leur nom et restent dans n8n. Seul le SQL, dans la base, décide ; n8n relaie.

| Fichier | Déclencheur | Fonction SQL appelée | Ce qui en sort |
|---|---|---|---|
| `w1-mise-en-ligne-audit-qa.json` | Webhook GitHub `deployment_status` (`POST /hsentinel-w1-github`), corps brut et `X-Hub-Signature-256` | `creer_demande_audit_github(p_corps, p_signature, p_evenement)` → `action` (`audit_cree` ou `refuse`), `raison`, `audit_id`, `depot_proprietaire`, `depot_nom`, `sha` | Une demande d'audit QA ; le statut de commit GitHub « HSentinel · en cours » ; un e-mail à l'équipe si l'audit n'est pas lancé |
| `w3-faille-prouvee-alertes.json` | Webhook de base sur chaque nouveau constat (`POST /hsentinel-w3-constat`, en-tête `x-hsentinel-secret`, l'identifiant seul), et un rattrapage toutes les 15 min | `constats_a_alerter()`, `preparer_alerte(p_constat_id, p_url_releve_base)` → `action` (`creer_ticket` ou `commenter_ticket`), `titre`, `corps_ticket`, `etiquettes`, `github_issue_number`, `gravite_permet_email`, `email_alertes`, `email_sujet`, `email_html` ; puis `noter_alerte(p_constat_id, p_statut, p_github_issue_number, p_email_envoye, p_erreur)` | Un ticket GitHub par faille dans `jkinvi-byte/hsentinel-alertes`, rouvert et commenté si elle revient ; un e-mail sauf gravité faible ; un ticket « alerte non envoyée » si Gmail échoue |
| `w4-pentest-regulier.json` | Chaque nuit à 2 h (Paris) | `creer_demandes_pentest()` → le bilan (créées, alertes, refusées) | Les demandes de pentest dues, pour les applications abonnées ; un e-mail après 3 échecs |

## Ce que la base fournit : `supabase/alertes.sql`

Le SQL de `hsentinel-dev` n'existe pas en fichier : il est réécrit dans notre base, d'après les entrées et les sorties qu'attendent les trois workflows.
- **Tables** : `applications` (ce qu'on a le droit de tester, et comment ; autorisation explicite, D-24) et `constats` (une ligne par faille prouvée, avec le suivi de son alerte). RLS sans politique, comme les autres.
- **W3** : `preparer_alerte`, `noter_alerte` et `constats_a_alerter`, plus un déclencheur qui appelle W3 à chaque nouveau constat. Un ticket par faille (empreinte : application, type d'accès, méthode, chemin), commenté si la faille revient, jamais deux à la fois.
- **W4** : `creer_demandes_pentest`. Une demande au format du premier lot, que lit le runner du pentest ; pas de doublon ; une alerte unique après 3 échecs d'affilée. Désactivé par défaut pour chaque application.
- **W1** : `creer_demande_audit_github`. Il vérifie la signature GitHub, ne garde que les déploiements réussis d'une application autorisée qui a un profil QA, et crée une exploration bornée dans `qa_missions`, en remplaçant celle qui attend encore.
- **Le runner** (`runner/constats.py`) écrit chaque faille prouvée du banc dans `constats`, à la fin de chaque audit. Une ligne ne porte jamais de donnée du site testé.

**Vérifié** (*mesuré*, 18/11 au soir) : dix groupes d'essais sur une base PostgreSQL 17 locale qui imite Supabase (coffre, appel HTTP, rôles) ; les 10 failles prouvées réelles de l'audit du 17/11 à 8 h 51 acceptées et rédigées en tickets ; les demandes de W1 et W4 acceptées par les validateurs Python des workers.

## Mise en service

Le SQL est **déjà en place** dans notre base (vérifié le 18/11 à 21 h 45). Il reste trois gestes, dans n8n et dans Supabase :

1. **Accès** : être membre du projet Supabase de l'équipe (invitation par Aurian).
2. **Le coffre**, dans l'éditeur SQL de Supabase. Le secret est la valeur actuelle de l'identifiant n8n « Secret webhook Supabase W3 » :
   ```sql
   select vault.create_secret('https://jahdiel13ms.app.n8n.cloud/webhook/hsentinel-w3-constat', 'hsentinel_w3_url');
   select vault.create_secret('<valeur de l''identifiant « Secret webhook Supabase W3 »>', 'hsentinel_w3_secret');
   ```
3. **n8n** :
   - l'identifiant « Supabase hsentinel-dev (clé secrète) » : remplacer l'adresse par `https://auaitjryhgwdbczwkdef.supabase.co` et la clé par une clé secrète de notre projet (Project Settings → API Keys) ;
   - importer les trois workflows de [`import/`](import/) à la place des anciens (dans chaque workflow : menu ⋯ → Import from File). Les adresses pointent déjà vers notre base, et la trace de W1 écrit dans `qa_evenements` ;
   - les réactiver.

**La recette** : `python sentinelqa/runner/constats.py sentinelqa/rapports/rapport-20261117-0851.json --limite 1` doit produire un ticket ; la même commande rejouée doit ajouter un commentaire, sans second ticket.

Réglages de W3, dans le nœud « Constat et réglages » : `github_owner`, `github_repo`, `email_equipe`, `url_releve_base` (le préfixe du relevé dans la console, suivi de l'identifiant de l'audit).
