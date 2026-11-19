# Suivi du projet

> Mis à jour le 19/11/2026 à 2 h. Une ligne par tâche. On met l'état à jour dans le même commit que le travail. Les responsables sont proposés d'après les rôles et restent à confirmer en équipe.
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
- ~~Mohamed fait les 10 répétitions (tâche 3)~~ : faites par Claude le 18/11 au soir ;
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
| 3 | ~~Répéter chaque scénario QA de la démo 10 fois~~ : fait le 18/11 au soir, avec une réussite jugée par le code. Guidé « Bac+3 » 10/10 (29 s, 0,007 $) ; exploration 10/10 (103 s, 0,051 $) ; Peer Review connecté 10/10 pour la connexion et l'identité (40 s, 0,015 $). À refaire si le scénario final de la démo change (`qa_moteur.py --repetitions 10`) | QA | P0 | Claude | Fait |
| 4 | Vider l'historique de test de `qa_missions` avant la démo | QA | P1 | Aurian | Ven 20 matin |
| 5 | ~~Valider la connexion HTTP à Peer Review~~ : fait par Kimi pour A, le 18/11 à 18 h 39 (voir « Fait et vérifié ») | Pentest | P0 | Kimi | Fait |
| 6 | ~~Obtenir un compte B actif~~ : le nouveau B est validé avec identité vérifiée ; le triplet HTTP réel A/anonyme/B a tourné. A et l'anonyme passent ; B reçoit sa propre vue sans le témoin de A, donc aucune fuite de A démontrée, mais pas de refus explicite | Pentest | P0 | Kimi | Fait |
| 7 | Intégrer `contributions/kimi-pentest` au runner et à la web (S-PEER-02) | Pentest | P0 | Aurian | Jeu 19 |
| 8 | Exécuter S-PEER-01 (la barrière anonyme) en réel et noter le résultat. Son agent existe depuis 19 h 40, dans l'espace de Jahdiel | Pentest | P1 | Aurian | Jeu 19 |
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
| 20 | ~~Lancer le QA connecté depuis la web, côté serveur~~ : fait et vérifié en réel le 18/11, avec 3 missions par la file web. Le texte chiffré est effacé avant le déchiffrement, le mot de passe ne se retrouve ni dans la base ni dans le fil, et le coffre est supprimé. Le formulaire console est raccordé ; recette restante (tâche 34) | QA | P1 | Claude | Fait (serveur) |
| 21 | ~~L'agent de Kimi `sentinelqa-pentest-acces`~~ : définition corrigée par Kimi (sans `about:blank`, relecture tolérant la valeur ajoutée par H) ; présent dans l'espace de Jahdiel et confirmé conforme par sa propre fonction, le 18/11 à 20 h 38 | Pentest | P0 | Kimi | Fait |
| 23 | `contributions/kimi-pentest/preuves/` contient l'adresse de la ressource témoin, avec l'identifiant de la session d'Alec : il est exclu du dépôt par le `.gitignore` (18/11, 19 h 30). Pour le publier, l'anonymiser, puis retirer cette ligne | Pentest | P1 | Kimi | — |
| 24 | Recette de la console de l'équipe (`web-console`) : un QA public réel depuis `/app/nouveau`, la demande vue dans `qa_missions`, le rapport et l'arrêt (plan de Codex : `web-console/INTEGRATION.md`) | Plateforme | P0 | Codex, Aurian | Jeu 19 |
| 25 | **Alertes sur notre base** : le SQL (`supabase/alertes.sql`) est en place en production, version actuelle, droits vérifiés (18/11, 21 h 45 : clé publique refusée, clé secrète acceptée). Les secrets de W3 sont dans le coffre Supabase (créés à 21 h 51 ; vérifié à 23 h, ainsi que le déclencheur `constat_ajoute`). **Bascule faite par Jahdiel ; recette réelle le 19/11** : un constat de test devient le ticket n° 7 par le rattrapage. **Reste** : le webhook instantané, refusé par n8n (403 « Authorization data is wrong! »). L'identifiant n8n « Secret webhook Supabase W3 » doit porter l'en-tête `x-hsentinel-secret` et la valeur de `hsentinel_w3_secret`. Ensuite : `github_webhook_secret` pour W1, puis un destinataire d'e-mail (`applications.email_alertes`). Pas à pas : `sentinelqa/n8n/README.md` | Plateforme | P0 | Jahdiel | Jeu 19 |
| 26 | ~~Écrire chaque faille prouvée du pentest dans la table `constats`~~ : fait pour le banc, à la fin de chaque audit (`runner/constats.py`) ; à étendre à S-PEER-02 quand il sera raccordé | Pentest | P1 | Claude | Fait (banc) |
| 27 | Montrer l'alerte en démo : une faille prouvée → ticket dans ce dépôt + e-mail, en quelques secondes. Aujourd'hui, le ticket arrive par le rattrapage, en 15 min au plus ; il n'arrivera en quelques secondes qu'une fois le webhook réparé (tâche 25) | Démo | P1 | Jahdiel | Ven 20 |
| 28 | Brancher le webhook GitHub (*Deployment statuses*) d'une cible déployée sur Vercel vers W1, pour un audit à chaque mise en ligne | Plateforme | P1 | Jahdiel | Ven 20 |
| 29 | Retirer `cadence` des exemples du bac à sable de Mohamed (branche `agents-ia-qa-pentest`) : Cadence n'est pas une cible autorisée (D-24) | Pentest | P0 | Mohamed | Jeu 19 |
| 30 | La clé H en service est la troisième (validée par H à 20 h 37 ; mission publique réelle conforme à 20 h 39). Les trois clés sont apparues dans la conversation : révoquer celles qui ne servent plus, puis remplacer la troisième, en copiant la nouvelle sans la coller et en tapant `! pbpaste \| holo login --key --force` (le mot `--key` tel quel) | Plateforme | P1 | Aurian | Jeu 19 |
| 31 | Lever les bloquants relevés par la revue de Codex avant toute reprise de la branche de Mohamed : verdict « fuite » sur deux textes vides, session échouée comptée comme refus, budgets non transmis, noms d'agents divergents | Pentest | P1 | Mohamed | Jeu 19 |
| 32 | Chaque poste qui lance le runner : créer sa clé dans l'espace H de Jahdiel | Plateforme | P1 | Tous | Jeu 19 |
| 34 | Console : QA connecté et page Alertes raccordés. **Recette faite par Claude le 19/11** : 12 tests navigateur sur 12 en production, puis en réel une dictée, une mission publique et une mission connectée (K1/K2). Page Alertes vérifiée avec de vrais constats et le ticket n° 7. Reste : l'arrêt d'une mission réelle. [Contrat et état](ARCHITECTURE.md#11-la-web) | Plateforme | P0 | Codex, Aurian | Jeu 19 |
| 35 | Pentest (`runner/missions.py`) : le même piège que le QA, à vérifier. H passe une session à « idle » avant d'y attacher la réponse, et `wait_for_completion` peut alors rendre `answer = None`, compté « agent_incomplete ». Le QA s'en protège avec `qa_moteur.lire_fin`, qui relit la session 10 s au plus | Pentest | P1 | Kimi | Jeu 19 |
| 33 | ~~Obtenir de Jahdiel le SQL de `hsentinel-dev`~~ : il n'existe pas en fichier. Réécrit dans notre base (`supabase/alertes.sql`, `runner/constats.py`) et testé sur une base locale qui imite Supabase | Plateforme | P0 | Claude | Fait |
| 22 | Signaler à H : agents enregistrés avec `about:blank` illisibles (500 au GET et au PATCH), `about:blank` refusé sans annonce, titres à styles mêlés tronqués dans le texte relevé, action `list_secrets` absente de la doc | Plateforme | P1 | Aurian | Ven 20 |

## Fait et vérifié

| Date | Quoi | Preuve |
|---|---|---|
| 18/11 | Volet QA de bout en bout, en réel sur eugeniaschool.com : parcours guidé, exploration, mobile | 9 missions, 0,033 $ et 76 s en moyenne ([ARCHITECTURE.md §3](ARCHITECTURE.md#3-volet-qa--le-trajet-dune-mission)) |
| 18/11 | L'équipe passe dans l'espace H de Jahdiel (19 h 39) : nos 5 agents recréés par le code et confirmés | Mission publique réelle conforme (26 s, 0,006 $) ; mission connectée réelle avec le compte d'Alec (42 s, 0,022 $), connexion et identité prouvées par le code |
| 18/11 | Architecture relue contre le code à 19 h 10 : ARCHITECTURE.md et le PDF illustré (27 pages, chaque page modifiée regardée) | Écarts corrigés : agents sans texte affiché, ancien chemin Q-PUB-01, 4 usages de Hugging Face, `/examen`, `web-console`, état de S-PEER-01 et S-PEER-02 |
| 18/11 | Connexion HTTP de A à Peer Review validée en réel ; ressource témoin et règle de visibilité confirmées (Kimi) | Preuves locales de Kimi, non publiées (tâche 23) |
| 18/11 | Triplet HTTP réel A/anonyme/B exécuté sur Peer Review avec deux identités vérifiées ; nouveau B actif | 9 requêtes : A reçoit le témoin, l'anonyme est redirigé sans témoin, B reçoit sa propre vue sans le témoin de A. Aucune fuite démontrée ; B reste non concluant faute de refus explicite. Rapport local non publié (tâche 23) |
| 18/11 | n8n W3 (Jahdiel) : faille prouvée (table `constats`) → un ticket GitHub par faille dans ce dépôt + un e-mail (sauf gravité faible), réouverture si la faille revient, reprise automatique toutes les 15 min | Testé en réel sur la base `hsentinel-dev` : nouvelle faille, doublon, réouverture, panne GitHub, panne Gmail, rattrapage, déclenchement automatique par Supabase (rapporté par Jahdiel) |
| 18/11 | n8n W1 (Jahdiel) : preview prête (événement GitHub `deployment_status`) → demande d'audit dans Supabase, signature GitHub vérifiée, dernière version seulement | Appel HTTP réel signé accepté, signature fausse refusée, doublons et versions dépassées gérés (rapporté par Jahdiel) |
| 18/11 | n8n W4 (Jahdiel) : chaque nuit à 2 h, demandes d'audit Pentest pour les applications abonnées | 2 passages réels : une demande créée et une alerte « 3 échecs », puis rien au 2e passage (rapporté par Jahdiel) |
| 18/11 | Agent QA public recréé sous le nom `sentinelqa-qa-public` : l'ancien `sentinelqa-qa` répond 500 chez H depuis vers 18 h 40 | Mission réelle « Bac+3 » à 18 h 47 : conforme, 38 s ; 54 tests Python |
| 18/11 | QA connecté sur Peer Review, avec un compte : connexion par coffre H, consultation seule, coffre supprimé après l'essai | 1 mission réelle, 43 s, 0,021 $ : connexion, identité et une page vérifiées par le code ; 2 constats vrais sur capture, mais tronqués dans le texte relevé par H ; aucun geste d'écriture ; mot de passe absent des événements et des rapports |
| 18/11 | Dictée dans la web (Whisper par Hugging Face), annulable, micro fermé à la sortie | Parcours complet dans un navigateur, avec une voix de synthèse ; tests JavaScript |
| 18/11 | File QA séparée dans Supabase, et son worker | Tables `qa_missions` et `qa_evenements`, RLS vérifié dans les deux sens |
| 18/11 | Agent H `sentinelqa-pentest-acces` créé ; une session réelle, la connexion du compte A | Module `contributions/kimi-pentest` |
| 18/11 | Les tests des modules pentest de `contributions/` passent tous | 23/23 pour le contrôle d'accès, 50/50 pour « HF vers contrôles » ; 4/4 pour la revue |
| 18/11 | Le document d'architecture illustré corrigé (27 pages) et [ARCHITECTURE.md](ARCHITECTURE.md), avec les revirements depuis le 17/11 | Chaque page regardée en aperçu ; à déposer sur Notion à la place de la version du 17/11 |
| 18/11 | Ce dépôt GitHub, avec une sélection technique et aucun secret | Les vraies valeurs des clés ont été cherchées avant l'envoi : aucune trouvée |
| 17/11 | Banc pentest Paie Express | 59 failles prouvées sur 60, 0 faux positif, en 10 audits |
| 18/11 | QA connecté lancé par la file web : mot de passe chiffré dans le navigateur, effacé de la base avant le déchiffrement, versé dans un coffre H propre à la mission, supprimé à la fin | 3 missions réelles (22 h 48 à 23 h 01) : mot de passe introuvable dans la base et dans le fil, coffre supprimé ; 4 tests du worker avec un vrai chiffrement RSA |
| 18/11 | Garde du QA connecté renforcée après l'ouverture d'une évaluation (22 h 48, rien de noté) : la review du soir devient une zone interdite, la session s'arrête sur une page interdite, « Commencer » compte comme geste à risque, la mission porte les interdits et la consigne de l'agent est clarifiée | 3 tests qui échouent sans le correctif ; puis 12 missions réelles sans aucune évaluation ouverte |
| 18/11 | 10 répétitions par scénario QA : guidé, exploration, Peer Review connecté | Guidé 10/10, exploration 10/10, connecté 10/10 pour la connexion et l'identité ([ARCHITECTURE.md §3](ARCHITECTURE.md#3-volet-qa--le-trajet-dune-mission)) |
| 18/11 | Réponse de l'agent lue trop tôt (session « idle » avant la réponse) : la lecture finale attend la réponse | Un test reproduit la course et échoue sans le correctif ; la session `d58b6def`, revérifiée, donne « Mon parcours » conforme |
| 19/11 | Écritures refusées (403) sur 127.0.0.1 dans la console (dictée, plan, lancement, arrêt) et dans l'ancienne web : une seule garde d'origine, comparée à l'hôte appelé | Reproduit au curl ; un test qui échoue sans le correctif ; console rechargée : 403 → accepté, origine étrangère toujours refusée |
| 19/11 | Recette réelle de la console dans Chrome, sans fenêtre (Playwright) | Dictée transcrite, mission publique 3/3, mission connectée K1/K2 ; 12 tests navigateur sur 12 en production |
| 19/11 | Chaîne des alertes de bout en bout sur notre base : constat → n8n (rattrapage de W3) → ticket GitHub → état noté → page Alertes de la console | Constat `eef16877` écrit à 1 h 36, ticket n° 7 à 1 h 48, état « traitée » relu dans la base ; capture de la console avec « Ticket #7 ». Le même constat republié commente le ticket n° 7 (« Toujours présente », 2 h 04), sans doublon |

## Risques connus

- **Le Python du projet est sur un disque externe.** Si le disque est débranché, le worker s'arrête (code 138) : voir la tâche 13.
- **Un agent H varie d'une session à l'autre.** Un « écart » vu par l'agent seul ne compte jamais ; seul le code tranche.
- **Le réseau de l'école bloque le port 7844**, celui du tunnel Cloudflare du banc pentest. Parade : partager la connexion d'un téléphone.
- **Les sessions d'avant 19 h 39 restent dans l'ancien espace H** : leurs replays, et les captures des anciens rapports dans la web, ne se lisent plus avec la nouvelle clé.
- **Le webhook instantané de W3 est refusé (403).** Tant que l'identifiant n8n et notre coffre n'ont pas le même secret, une faille prouvée attend le rattrapage, jusqu'à 15 min, avant de devenir un ticket (tâche 25).
- **H a souvent déjà exécuté un geste quand notre garde le voit.** Les événements arrivent par lots, et l'arrêt prend 2 à 3 s (18/11, 22 h 48). Sur un site réel, la consigne, les interdits de la mission et les zones interdites du contrat protègent d'abord ; la garde borne la suite.
- **Un test navigateur qui simule l'API ne voit pas les gardes du serveur.** Les tests de la console passaient alors que toutes ses écritures étaient refusées (19/11). Avant de déclarer une interface prête, une recette réelle passe par le vrai serveur.
- **Plusieurs agents IA modifient les mêmes fichiers.** Faire un `git status` avant chaque commit, et ne pousser que des fichiers nommés.
