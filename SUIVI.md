# Suivi du projet

> Mis à jour le 18/11/2026 à 19 h 30. Une ligne par tâche. On met l'état à jour dans le même commit que le travail. Les responsables sont proposés d'après les rôles et restent à confirmer en équipe.
>
> Priorité **P0** : indispensable à la démo de vendredi. **P1** : utile, mais elle peut s'en passer.

## Feuille de route jusqu'à vendredi

Chaque jalon dit ce qui doit être vrai à cette heure-là. Les numéros renvoient au tableau « À faire ».

| Quand | Jalon : ce qui doit être vrai | Tâches | Qui |
|---|---|---|---|
| **Mer 18, 17 h** | Checkpoint 2 rendu : parcours utilisateur, architecture ([ARCHITECTURE.md](ARCHITECTURE.md) et le PDF illustré corrigé), Loom de 2 min, cette feuille de route | — | Alec, Tugdual |
| **Mer 18, soir** | L'équipe travaille sur la même base : le bon Supabase est confirmé, tout le monde a accès au dépôt, Notion n'a plus de mots de passe en clair. La demande du compte B et de la ressource témoin est envoyée à l'école | 6, 10, 11, 12 | Jahdiel, chef de projet, Aurian |
| **Jeu 19, midi** | Le QA de la démo est figé : scénarios choisis, dictée validée avec une vraie voix, 10 répétitions faites, temps gagné mesuré | 1, 2, 3 | Aurian, Tugdual |
| **Jeu 19, midi** | Peer Review : la connexion par HTTP marche, et S-PEER-01 a tourné en réel | 5, 8 | Aurian |
| **Jeu 19, midi** | **Point de décision** : sans compte B ni ressource témoin à cette heure, le pentest de la démo se fait sur le banc Paie Express (59/60 mesuré) | — | Aurian, Alec |
| **Jeu 19, soir** | La démo complète tourne : S-PEER-02 intégré et exécuté (sauf décision contraire à midi), web déployée sur Vercel, répétition générale faite | 7, 9, 18 | Aurian |
| **Ven 20, 11 h** | Checkpoint 3 : prototype en live, fiche projet, dépôt à jour, vidéo de 5 min ; historique de test vidé | 4, 15, 17 | Tous |
| **Ven 20, 15 h** | Checkpoint 4 : deck de 8 à 12 slides, coût de run compris | 16 | Tugdual, Alec |

**Charge à revoir :** 10 tâches sur 18 sont au nom d'Aurian, dont 7 pour jeudi. Pour le soulager, une proposition, à trancher en équipe :
- Mohamed fait les 10 répétitions (tâche 3), en ligne de commande ;
- Jahdiel ou Aziz déploie la web (tâche 9) ;
- Tugdual valide la dictée avec une vraie voix (tâche 1), puisqu'elle fait partie de sa démo.

## Échéances

| Quand | Livrable | Responsable |
|---|---|---|
| **Mer 18, avant 17 h** | Checkpoint 2 : parcours utilisateur, architecture ([ARCHITECTURE.md](ARCHITECTURE.md)), Loom de 2 min, roadmap jusqu'à jeudi | Alec, Tugdual |
| Chaque soir, de 17 h à 9 h | Peer review sur peer-review-black.vercel.app | Tous |
| Jeu 19 | Point business CEO ; finalisation et tests | Alec |
| **Ven 20, avant 11 h** | Checkpoint 3 : prototype démontrable en live, fiche projet et dépôt GitHub, vidéo de démo de 5 min | Tous |
| **Ven 20, avant 15 h** | Checkpoint 4 : deck de 8 à 12 slides, dont le coût de run | Tugdual, Alec |

## À faire

| # | Tâche | Volet | Prio. | Responsable | Échéance |
|---|---|---|---|---|---|
| 1 | Tester la dictée avec une vraie voix, sur le micro de la démo | QA | P0 | Aurian | Jeu 19 |
| 2 | Mesurer le temps gagné : 3 parcours faits à la main puis par HSentinel, chronométrés | QA | P0 | Tugdual | Jeu 19 |
| 3 | Répéter chaque scénario QA de la démo 10 fois et noter le taux de réussite (3 répétitions faites pour « 4 étapes ») ; `qa_moteur.py --repetitions 10` | QA | P0 | Aurian | Jeu 19 |
| 4 | Vider l'historique de test de `qa_missions` avant la démo | QA | P1 | Aurian | Ven 20 matin |
| 5 | ~~Valider la connexion HTTP à Peer Review~~ : fait par Kimi pour A, le 18/11 à 18 h 39 (voir « Fait et vérifié ») | Pentest | P0 | Kimi | Fait |
| 6 | Obtenir le mot de passe en vigueur du compte B (Nathan : accord donné, l'école le sait). Celui transmis est refusé par le site, en HTTP (Kimi) comme dans le navigateur (2 essais). La ressource témoin et sa règle sont trouvées | Pentest | P0 | Aurian | Jeu 19 |
| 7 | Intégrer `contributions/kimi-pentest` au runner et à la web (S-PEER-02) | Pentest | P0 | Aurian | Jeu 19 |
| 8 | Exécuter S-PEER-01 (la barrière anonyme) en réel et noter le résultat. Bloqué : son agent `sentinelqa-pentest` n'existe pas chez H, et sa définition porte `about:blank` (tâche 21) | Pentest | P1 | Aurian | Jeu 19 |
| 9 | Déployer la web sur Vercel avec l'accès opérateur (`HSENTINEL_OPERATOR_TOKEN`) | Plateforme | P0 | Aurian | Jeu 19 |
| 10 | Confirmer le projet Supabase de l'équipe : seul `auaitjryhgwdbczwkdef` est configuré | Plateforme | P0 | Jahdiel | Mer 18 |
| 11 | Inviter les membres sur ce dépôt (*Settings → Collaborators*) | Plateforme | P0 | Jahdiel | Mer 18 |
| 12 | Retirer les mots de passe en clair de la page Notion « Apps à tester » | Plateforme | P0 | Chef de projet | Mer 18 |
| 13 | Sortir le projet du Bureau synchronisé par iCloud ; créer un environnement Python hors du disque externe | Plateforme | P1 | Aurian | Jeu 19 |
| 14 | Comparer 2 ou 3 modèles Hugging Face pour le plan QA (précision, coût, latence) | IA | P1 | Mohamed | Jeu 19 |
| 15 | Écrire le script de la vidéo de 5 min et la tourner | Démo | P0 | Tugdual, Alec | Ven 20 |
| 16 | Faire le deck, dont le coût de run (QA : 0,033 $ par mission, mesuré) | Démo | P0 | Tugdual | Ven 20 |
| 17 | Rédiger la fiche projet : problème, solution, stack, architecture, lien du prototype, comment tester | Démo | P0 | Tugdual | Ven 20 |
| 18 | Intégrer les polices à la web (`next/font/local`) : la compilation ne dépendra plus du réseau | Plateforme | P1 | Aurian | Jeu 19 |
| 19 | QA connecté : retester le compte de Nathan dès que son mot de passe en vigueur est connu. Aucun nouvel essai d'ici là, pour ne pas bloquer son compte | QA | P1 | Aurian | Jeu 19 |
| 20 | Lancer le QA connecté depuis la web : mot de passe chiffré dans le navigateur (comme le cadrage B du pentest), coffre par essai côté worker | QA | P1 | Aurian | Jeu 19 |
| 21 | **L'agent de Kimi `sentinelqa-pentest-acces` ne se relit plus chez H (500)**, comme tout agent enregistré avec `start_url: "about:blank"`. Le recréer sans cette valeur, sous un autre nom (le PATCH échoue aussi), et la retirer de `runner/agents_missions.py` | Pentest | P0 | Kimi, Aurian | Jeu 19 |
| 23 | `contributions/kimi-pentest/preuves/` contient l'adresse de la ressource témoin, avec l'identifiant de la session d'Alec : il est exclu du dépôt par le `.gitignore` (18/11, 19 h 30). Pour le publier, l'anonymiser, puis retirer cette ligne | Pentest | P1 | Kimi | — |
| 24 | Décider du rôle de `web-console` (prototype v0, données simulées) : le brancher sur Supabase et le runner, ou le garder comme maquette | Plateforme | P1 | À trancher en équipe | Jeu 19 |
| 25 | Choisir **une seule** base Supabase pour le runner et les alertes n8n (aujourd'hui : runner sur `auaitjryhgwdbczwkdef`, alertes sur `hsentinel-dev`), puis y rebrancher W1, W3 et W4 (suite de la tâche 10) | Plateforme | P0 | Jahdiel, Aurian | Jeu 19 |
| 26 | Écrire chaque faille prouvée du pentest dans la table `constats` (format : contrat de branchement de Jahdiel) : W3 envoie alors seul le ticket et l'e-mail | Pentest | P1 | Aurian | Jeu 19 |
| 27 | Montrer l'alerte en démo : une faille prouvée → ticket dans ce dépôt + e-mail, en quelques secondes | Démo | P1 | Jahdiel | Ven 20 |
| 28 | Brancher le webhook GitHub (*Deployment statuses*) d'une cible déployée sur Vercel vers W1, pour un audit à chaque mise en ligne | Plateforme | P1 | Jahdiel | Ven 20 |
| 29 | Retirer `cadence` des exemples du bac à sable de Mohamed (branche `agents-ia-qa-pentest`) : Cadence n'est pas une cible autorisée (D-24) | Pentest | P0 | Mohamed | Jeu 19 |
| 22 | Signaler à H : agents enregistrés avec `about:blank` illisibles (500 au GET et au PATCH), `about:blank` refusé sans annonce, titres à styles mêlés tronqués dans le texte relevé, action `list_secrets` absente de la doc | Plateforme | P1 | Aurian | Ven 20 |

## Fait et vérifié

| Date | Quoi | Preuve |
|---|---|---|
| 18/11 | Volet QA de bout en bout, en réel sur eugeniaschool.com : parcours guidé, exploration, mobile | 9 missions, 0,033 $ et 76 s en moyenne ([ARCHITECTURE.md §3](ARCHITECTURE.md#3-volet-qa--le-trajet-dune-mission)) |
| 18/11 | Architecture relue contre le code à 19 h 10 : ARCHITECTURE.md et le PDF illustré (27 pages, chaque page modifiée regardée) | Écarts corrigés : agents sans texte affiché, ancien chemin Q-PUB-01, 4 usages de Hugging Face, `/examen`, `web-console`, état de S-PEER-01 et S-PEER-02 |
| 18/11 | Connexion HTTP de A à Peer Review validée en réel ; ressource témoin et règle de visibilité confirmées (Kimi) | Preuves locales de Kimi, non publiées (tâche 23) |
| 18/11 | n8n W3 (Jahdiel) : faille prouvée (table `constats`) → un ticket GitHub par faille dans ce dépôt + un e-mail (sauf gravité faible), réouverture si la faille revient, reprise automatique toutes les 15 min | Testé en réel sur la base `hsentinel-dev` : nouvelle faille, doublon, réouverture, panne GitHub, panne Gmail, rattrapage, déclenchement automatique par Supabase (rapporté par Jahdiel) |
| 18/11 | n8n W1 (Jahdiel) : preview prête (événement GitHub `deployment_status`) → demande d'audit dans Supabase, signature GitHub vérifiée, dernière version seulement | Appel HTTP réel signé accepté, signature fausse refusée, doublons et versions dépassées gérés (rapporté par Jahdiel) |
| 18/11 | n8n W4 (Jahdiel) : chaque nuit à 2 h, demandes d'audit Pentest pour les applications abonnées | 2 passages réels : une demande créée et une alerte « 3 échecs », puis rien au 2e passage (rapporté par Jahdiel) |
| 18/11 | Agent QA public recréé sous le nom `sentinelqa-qa-public` : l'ancien `sentinelqa-qa` répond 500 chez H depuis vers 18 h 40 | Mission réelle « Bac+3 » à 18 h 47 : conforme, 38 s ; 54 tests Python |
| 18/11 | QA connecté sur Peer Review, avec un compte : connexion par coffre H, consultation seule, coffre supprimé après l'essai | 1 mission réelle, 43 s, 0,021 $ : connexion, identité et une page vérifiées par le code ; 2 constats vrais sur capture, mais tronqués dans le texte relevé par H ; aucun geste d'écriture ; mot de passe absent des événements et des rapports |
| 18/11 | Dictée dans la web (Whisper par Hugging Face), annulable, micro fermé à la sortie | Parcours complet dans un navigateur, avec une voix de synthèse ; tests JavaScript |
| 18/11 | File QA séparée dans Supabase, et son worker | Tables `qa_missions` et `qa_evenements`, RLS vérifié dans les deux sens |
| 18/11 | Agent H `sentinelqa-pentest-acces` créé ; une session réelle, la connexion du compte A | Module `contributions/kimi-pentest` |
| 18/11 | Les tests des modules pentest de `contributions/` passent tous | 22/22 pour le contrôle d'accès, 50/50 pour « HF vers contrôles » (mesuré à 19 h 05) |
| 18/11 | Le document d'architecture illustré corrigé (27 pages) et [ARCHITECTURE.md](ARCHITECTURE.md), avec les revirements depuis le 17/11 | Chaque page regardée en aperçu ; à déposer sur Notion à la place de la version du 17/11 |
| 18/11 | Ce dépôt GitHub, avec une sélection technique et aucun secret | Les vraies valeurs des clés ont été cherchées avant l'envoi : aucune trouvée |
| 17/11 | Banc pentest Paie Express | 59 failles prouvées sur 60, 0 faux positif, en 10 audits |

## Risques connus

- **Le Python du projet est sur un disque externe.** Si le disque est débranché, le worker s'arrête (code 138) : voir la tâche 13.
- **Un agent H varie d'une session à l'autre.** Un « écart » vu par l'agent seul ne compte jamais ; seul le code tranche.
- **Le réseau de l'école bloque le port 7844**, celui du tunnel Cloudflare du banc pentest. Parade : partager la connexion d'un téléphone.
- **Deux bases Supabase en parallèle.** Les alertes n8n (W1, W3, W4) lisent `hsentinel-dev`, le runner écrit dans `auaitjryhgwdbczwkdef` : tant que la tâche 25 n'est pas faite, les vraies failles ne déclenchent aucune alerte.
- **Plusieurs agents IA modifient les mêmes fichiers.** Faire un `git status` avant chaque commit, et ne pousser que des fichiers nommés.
