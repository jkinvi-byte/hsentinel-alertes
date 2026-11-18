# Suivi du projet

> Mis à jour le 18/11/2026 à 17 h. Une ligne par tâche. On met l'état à jour dans le même commit que le travail. Les responsables sont proposés d'après les rôles et restent à confirmer en équipe.
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

## Fait et vérifié

| Date | Quoi | Preuve |
|---|---|---|
| 18/11 | Volet QA de bout en bout, en réel sur eugeniaschool.com : parcours guidé, exploration, mobile | 9 missions, 0,033 $ et 76 s en moyenne ([ARCHITECTURE.md §3](ARCHITECTURE.md#3-volet-qa--le-trajet-dune-mission)) |
| 18/11 | Dictée dans la web (Whisper par Hugging Face), annulable, micro fermé à la sortie | Parcours complet dans un navigateur, avec une voix de synthèse ; tests JavaScript |
| 18/11 | File QA séparée dans Supabase, et son worker | Tables `qa_missions` et `qa_evenements`, RLS vérifié dans les deux sens |
| 18/11 | Agent H `sentinelqa-pentest-acces` créé ; une session réelle, la connexion du compte A | Module `contributions/kimi-pentest` |
| 18/11 | Les tests des modules pentest de `contributions/` passent tous | 19/19 pour le contrôle d'accès, 49/49 pour « HF vers contrôles » (mesuré à 15 h 10) |
| 18/11 | Le document d'architecture illustré corrigé (27 pages) et [ARCHITECTURE.md](ARCHITECTURE.md), avec les revirements depuis le 17/11 | Chaque page regardée en aperçu ; à déposer sur Notion à la place de la version du 17/11 |
| 18/11 | Ce dépôt GitHub, avec une sélection technique et aucun secret | Les vraies valeurs des clés ont été cherchées avant l'envoi : aucune trouvée |
| 17/11 | Banc pentest Paie Express | 59 failles prouvées sur 60, 0 faux positif, en 10 audits |

## Risques connus

- **Le Python du projet est sur un disque externe.** Si le disque est débranché, le worker s'arrête (code 138) : voir la tâche 13.
- **Un agent H varie d'une session à l'autre.** Un « écart » vu par l'agent seul ne compte jamais ; seul le code tranche.
- **Le réseau de l'école bloque le port 7844**, celui du tunnel Cloudflare du banc pentest. Parade : partager la connexion d'un téléphone.
- **Plusieurs agents IA modifient les mêmes fichiers.** Faire un `git status` avant chaque commit, et ne pousser que des fichiers nommés.
