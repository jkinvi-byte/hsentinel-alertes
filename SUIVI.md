# Suivi du projet

> Mis à jour le 18/11/2026 à 15 h. Une ligne par tâche. On met l'état à jour dans le même commit que le travail. Les responsables sont proposés d'après les rôles et restent à confirmer en équipe.
>
> Priorité **P0** : indispensable à la démo de vendredi. **P1** : utile, mais elle peut s'en passer.

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
| 3 | Répéter chaque scénario QA de la démo 10 fois et noter le taux de réussite (3 répétitions faites pour « 4 étapes ») | QA | P0 | Aurian | Jeu 19 |
| 4 | Vider l'historique de test de `qa_missions` avant la démo | QA | P1 | Aurian | Ven 20 matin |
| 5 | Valider la connexion HTTP à Peer Review (le formulaire de `/connexion`) | Pentest | P0 | Aurian | Jeu 19 |
| 6 | Obtenir le compte B, la ressource témoin et sa règle de visibilité, avec l'accord de l'école | Pentest | P0 | Aurian | Jeu 19 |
| 7 | Intégrer `contributions/kimi-pentest` au runner et à la web (S-PEER-02) | Pentest | P0 | Aurian | Jeu 19 |
| 8 | Exécuter S-PEER-01 (la barrière anonyme) en réel et noter le résultat | Pentest | P1 | Aurian | Jeu 19 |
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
| 19 | Choisir **une seule** base Supabase pour le runner et les alertes n8n (aujourd'hui : runner sur `auaitjryhgwdbczwkdef`, alertes sur `hsentinel-dev`), puis y rebrancher W1, W3 et W4 (suite de la tâche 10) | Plateforme | P0 | Jahdiel, Aurian | Jeu 19 |
| 20 | Écrire chaque faille prouvée du pentest dans la table `constats` (format : contrat de branchement de Jahdiel) : W3 envoie alors seul le ticket et l'e-mail | Pentest | P1 | Aurian | Jeu 19 |
| 21 | Montrer l'alerte en démo : une faille prouvée sur Peer Review → ticket dans ce dépôt + e-mail, en quelques secondes | Démo | P1 | Jahdiel | Ven 20 |
| 22 | Brancher le webhook GitHub (*Deployment statuses*) d'une cible déployée sur Vercel vers W1, pour un audit à chaque mise en ligne | Plateforme | P1 | Jahdiel | Ven 20 |

## Fait et vérifié

| Date | Quoi | Preuve |
|---|---|---|
| 18/11 | Volet QA de bout en bout, en réel sur eugeniaschool.com : parcours guidé, exploration, mobile | 9 missions, 0,033 $ et 76 s en moyenne ([ARCHITECTURE.md §3](ARCHITECTURE.md#3-volet-qa--le-trajet-dune-mission)) |
| 18/11 | Dictée dans la web (Whisper par Hugging Face), annulable, micro fermé à la sortie | Parcours complet dans un navigateur, avec une voix de synthèse ; tests JavaScript |
| 18/11 | File QA séparée dans Supabase, et son worker | Tables `qa_missions` et `qa_evenements`, RLS vérifié dans les deux sens |
| 18/11 | Agent H `sentinelqa-pentest-acces` créé ; une session réelle, la connexion du compte A | Module `contributions/kimi-pentest` |
| 18/11 | Les tests des modules pentest de `contributions/` passent tous | 19/19 pour le contrôle d'accès, 49/49 pour « HF vers contrôles » (mesuré à 15 h 10) |
| 18/11 | Ce dépôt GitHub, avec une sélection technique et aucun secret | Les vraies valeurs des clés ont été cherchées avant l'envoi : aucune trouvée |
| 18/11 | n8n W3 : faille prouvée (table `constats`) → un ticket GitHub par faille dans ce dépôt + un e-mail (sauf gravité faible), réouverture si la faille revient, reprise automatique toutes les 15 min | Testé en réel sur la base `hsentinel-dev` : nouvelle faille, doublon, réouverture, panne GitHub, panne Gmail, rattrapage, déclenchement automatique par Supabase |
| 18/11 | n8n W1 : preview prête (événement GitHub `deployment_status`) → demande d'audit dans Supabase, signature GitHub vérifiée, dernière version seulement | Appel HTTP réel signé accepté, signature fausse refusée, doublons et versions dépassées gérés |
| 18/11 | n8n W4 : chaque nuit à 2 h, demandes d'audit Pentest pour les applications abonnées | 2 passages réels : une demande créée et une alerte « 3 échecs », puis rien au 2e passage |
| 17/11 | Banc pentest Paie Express | 29 failles prouvées sur 30, 0 faux positif, sur 5 audits |

## Risques connus

- **Le Python du projet est sur un disque externe.** Si le disque est débranché, le worker s'arrête (code 138) : voir la tâche 13.
- **Un agent H varie d'une session à l'autre.** Un « écart » vu par l'agent seul ne compte jamais ; seul le code tranche.
- **Le réseau de l'école bloque le port 7844**, celui du tunnel Cloudflare du banc pentest. Parade : partager la connexion d'un téléphone.
- **Deux bases Supabase en parallèle.** Les alertes n8n (W1, W3, W4) lisent `hsentinel-dev`, le runner écrit dans `auaitjryhgwdbczwkdef` : tant que la tâche 19 n'est pas faite, les vraies failles ne déclenchent aucune alerte.
- **Plusieurs agents IA modifient les mêmes fichiers.** Faire un `git status` avant chaque commit, et ne pousser que des fichiers nommés.
