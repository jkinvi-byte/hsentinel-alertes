# CLAUDE.md : Hackathon 2026 « Build The Future » · Équipe 4

> **Le projet est suivi dans Notion, sur la page « Checkpoint 1 » :** https://app.notion.com/p/Checkpoint-1-41a14c8bcf3080f881d1c85052ea48cf
> La page est publique, mais ses sections sont repliées : il faut les déplier dans un navigateur pour lire le contenu. Elle a été restructurée le 16/11 au soir, et l'ancre de la V2 n'existe plus : on cite la page entière (décision d'Aurian, 17/11).
> Au début de chaque session, consulter cette page pour les mises à jour. **Cadrage actuel d'Aurian, D-25 précisé par D-26 : Notion sera mis à jour par le chef de projet. QA fonctionnel et pentest sont deux volets de même importance, à développer sur des sites réels.** Le temps perdu dans le QA est un problème retenu ; il ne justifie pas de reléguer le pentest. La consigne explicite d'Aurian prévaut dans l'intervalle.
>
> Le contexte du hackathon, les règles à respecter et l'état du projet, en **une seule version pour toute l'équipe**.
> Elle fusionne les CLAUDE.md d'Aurian et d'un coéquipier (16/11/2026). On met à jour ce fichier plutôt que d'en créer un autre.
> Sources : le PDF officiel de 28 pages (hors du dépôt, voir §9), la doc H (`contexte/03-agents-api.md`), le showcase H (`contexte/02-showcase-h.md`) et le kick-off (`contexte/`).
> Dernière mise à jour : mercredi 18 novembre 2026, 7 h 40 : volet QA exécuté en réel depuis Claude Code (D-30), sans écriture sur les cibles de D-24.

## 0. Consignes pour Claude (à lire en premier)

1. Répondre **en français**.
2. Avant toute proposition, tout passer au crible :
   - les **4 exigences** (§1) ;
   - les **5 cases** et la **grille du jury** (§3), en priorité « pourquoi un agent computer-use » ;
   - le **cousin le plus proche dans le showcase** (§7).

   Si un test échoue, le dire franchement : on ne flatte pas une idée faible.
3. Privilégier **un parcours de bout en bout qui marche** plutôt que des fonctionnalités en plus.
4. **Indiquer le niveau de preuve de chaque fait :**
   - *lu* : la page a été ouverte et lue, et le lien y mène ;
   - *rapporté* : la donnée vient d'un résumé de moteur de recherche, d'un blog ou d'un comparatif, et reste à confirmer avant tout livrable ;
   - *hypothèse* : à confirmer en entretien ou par la mesure.

   **Un résumé de moteur de recherche ne vaut jamais vérification.** On ne met jamais entre guillemets un texte qu'on n'a pas lu. On ne cite jamais une source officielle pour un chiffre lu ailleurs. On n'invente jamais une statistique.
5. **Ne pas tirer d'une preuve plus qu'elle ne dit.** Le showcase montre ce qui existe, pas ce que notre jury a vu. Une norme sectorielle (PCI DSS) n'est pas une loi. Une transcription imparfaite n'est pas une citation.
6. Respecter le **cadre éthique** (§9) : uniquement des cibles contrôlées par l'équipe ou autorisées par écrit.
7. **Ne pas commencer la construction de la démo** tant que l'équipe ne l'a pas demandé explicitement. (Aurian a donné le feu vert le 16/11 au soir.) **Avant de construire, poser à l'équipe les questions de cadrage en une seule fois**, avec une recommandation pour chacune.
8. **Livrer ce qui est demandé** : des idées et des fichiers de travail. Pas de deck ni de rendu final non demandé.
9. Consigner nos retours sur l'Agents API (ce qui marche, ce qui casse, ce qui surprend) au fil de l'eau dans `notes/retours-agents-api.md`. Ils font partie du livrable.
10. Ne jamais écrire de secret dans un fichier : mot de passe d'équipe, coupons, codes de crédits, clés API.
11. Mettre à jour le §8 (état du projet) à chaque décision de l'équipe.
12. **Tenir à jour le registre des décisions, `livrables/08-justification-des-choix.md`**, à chaque décision de l'équipe ou d'Aurian.
    - Une entrée par décision : la date et qui a tranché, la décision, les alternatives écartées, les raisons, les preuves avec leur niveau (*lu*, *mesuré*, *hypothèse*) et le statut.
    - Une décision annulée passe à « remplacé par D-xx » ; on ne supprime jamais une entrée.
    - Le §8 dit où en est le projet ; le registre dit pourquoi.
    - Les deux documents d'architecture suivent les décisions validées : la vue simple, `livrables/06-architecture-sentinelqa.md`, et la vue technique, `livrables/07-architecture-technique.md`.
    - La version illustrée du 07, `livrables/07-architecture-technique-illustree.pdf`, suit aussi : on modifie `livrables/07-illustre/architecture.html`, puis on lance `python3 livrables/07-illustre/generer.py --apercus <dossier>` et on regarde chaque page.

**Les erreurs déjà commises (16/11), pour ne pas les refaire :**
- Avoir écrit « le jury a déjà vu ce sujet » à partir de hackathons passés, jugés par d'autres jurys.
- Avoir classé Houston parmi les tests d'applications, alors qu'il contrôle les agents.
- Avoir écrit « minimum légal » pour PCI DSS, qui est une norme sectorielle.
- Avoir mis entre guillemets la clause des CGU de H sans l'avoir lue (elle a été lue depuis).
- Avoir étiqueté « vérifié » des chiffres tirés de résumés de recherche (PCI, DORA, OECP, SIRET, prix).
- Avoir lu les « 94 % » de l'OWASP comme une prévalence, alors que c'est la part d'applications testées.
- Avoir appelé « vidéo » le replay de H, qui rejoue les captures et les actions étape par étape (doc « Watch and steer »).
- Avoir confié aux webhooks de H le lancement des tests à chaque déploiement : ils signalent seulement qu'une session change d'état ; le déclencheur vient de Vercel ou de GitHub.
- Avoir écrit des généralités absolues sans preuve (« chaque nouvelle version part en production sans avoir été attaquée », « les failles les plus fréquentes sont des erreurs de logique »).
- Avoir construit la démo v0 en tranchant seul des choix qui revenaient à l'équipe : le domaine du cobaye, les failles testées, un agent H prêt à l'emploi au lieu d'agents sur mesure. Il fallait poser ces questions avant de coder (16/11, 23 h 50).

## 1. La règle d'or : 4 exigences, sinon on ne le fait pas

1. **Le computer use est indispensable.**
   - Pourquoi un agent qui voit l'écran et clique, plutôt qu'une API, Make, n8n ou un script ?
   - Les réponses recevables :
     - pas d'API, ou une API payante ou réservée (comme le SCIM des offres « entreprise ») ;
     - une interface qui change ;
     - une tâche qui demande de voir l'écran ;
     - une application locale à piloter.
   - L'agent doit **agir** : aller quelque part, se connecter, cliquer, remplir. H a prévenu au kick-off : le computer use n'est pas un outil de récupération de données.
   - Signal rouge : une API publique ferait le même travail.
2. **Un ROI massif, chiffré.**
   - Le calcul : (temps ou argent gagné par occurrence × fréquence × nombre d'utilisateurs), à comparer au prix et au coût de run mesuré (steps et tokens via `GET /sessions/{id}/status`).
   - Chaque terme porte une unité et une source.
   - Signal rouge : « gagner du temps » sans unité.
3. **Un persona clair.**
   - Son métier, la taille de son entreprise, les outils qu'il utilise, où le trouver, qui signe le chèque. L'utilisateur n'est pas toujours l'acheteur.
   - Signal rouge : « les PME », « tout le monde ».
4. **Un pain point solide.**
   - Sa fréquence, son intensité et son coût actuel, avec une preuve : une source datée, un entretien ou une mesure.
   - Le test du brief : « Un vrai utilisateur paierait-il ou changerait-il ses habitudes pour ça ? »

**Fiche de toute idée** (`idees/<nom>.md`) :
- persona ;
- pain point et sa preuve ;
- pourquoi le computer use ;
- calcul du ROI ;
- démo live sur un vrai cas ;
- cousin dans le showcase et ce qu'on apporte de plus ;
- briques de l'Agents API utilisées ;
- risques et tests pour les lever.

## 2. Le hackathon en bref

- **Quand et où :** du lundi 16 au vendredi 20 novembre 2026, à l'école Eugenia.
- **Devise :** « No Limit. Real Impact. Ship or Die. »
- **Partenaires :** H Company (partenaire tech principal), Vercel, Hugging Face.
- **Track :** Creative Entrepreneur.
- **Le défi :** en 4 jours, créer une startup autour d'**agents IA qui utilisent un ordinateur comme un humain** (voir l'écran, cliquer, taper, naviguer), sur de **vrais sites et de vraies applications**, avec l'Agent API de H Company.
- **La question de H :** « Imaginez le produit ou le service que l'on peut construire lorsque l'IA peut réellement utiliser les logiciels et les interfaces existantes. Identifiez un problème concret, concevez une expérience convaincante, puis construisez un prototype fonctionnel qui utilise l'Agent API de H Company. »
- **Posture :** une équipe de fondateurs, pas des étudiants.
- **On construit aussi pour H :** nos retours sur l'Agent API font partie du livrable.

## 3. Comment on est noté

| Critère | Poids |
|---|---|
| **Excellence technique et usage de l'Agents API** | **30 %** |
| Pertinence et impact | 25 % |
| Faisabilité, adoption et apprentissages | 25 % |
| UX, démo et pitch | 20 % |

- **Le jury** réunit des ingénieurs de H Company, de Vercel et d'Eugenia. **Le critère n°1 :** une démo live sur un vrai cas business, avec le ou les agents qui tournent, et des résultats chiffrés. Le jury n'évalue pas une idée.
- **Les attendus du challenge (slide 2) :** un problème réel, une solution claire, un produit qui tourne, l'IA et l'automatisation intégrées, un pitch crédible.
- **Les 5 cases d'un bon projet (slide 5) :**
  1. un problème réel et précis ;
  2. une cible identifiable ;
  3. un usage justifié de l'agent ;
  4. un MVP réaliste en 4 jours, c'est-à-dire un parcours de bout en bout ;
  5. un modèle crédible : qui paie, combien, pourquoi, et combien coûte le run.
- **Les 7 pièges (slide 6) :**
  1. une idée trop large ;
  2. sur-concevoir ;
  3. une IA sans agent qui agit sur une interface ;
  4. des slides sans prototype ;
  5. **ne pas mesurer** : taux de réussite, latence, cas d'échec ;
  6. venir au support sans diagnostic (apporter le bug, ce qui a été testé et une capture) ;
  7. des liens inaccessibles.
- **Les pitchs :** le top 6 pitche 6 min puis répond à 4 min de questions. Les finalistes ne sont pas annoncés à l'avance : toute l'équipe doit être prête, et tout le monde parle.
- **Les récompenses :**
  - 1re place : 6 mois d'Agents API premium, une présentation du projet chez H et 350 € de carte cadeau ;
  - 2e place : 100 € de crédits par personne ;
  - 3e place : 50 € de crédits par personne.

## 4. Planning et livrables

| Quand | Livrable |
|---|---|
| **Lun 16, avant 17 h** | **Checkpoint 1, validation de l'idée**, 5 slides max ou 1 page Notion : nom et slogan, problème, solution en une phrase, personas, stack envisagée, répartition des rôles |
| Mar 17 | Session tech H ; **points CTO de 11 h à 12 h et de 15 h à 16 h**, l'occasion de poser les questions du §6 |
| **Mer 18, avant 17 h** | **Checkpoint 2, point intermédiaire :** parcours utilisateur (Figma, Miro, Airtable ou papier), architecture (même à la main), **mini pitch Loom de 2 min max** (problème, solution, avancement), roadmap jusqu'à jeudi. Point business CEO. |
| Jeu 19 | Point business CEO l'après-midi ; finalisation et tests |
| **Ven 20, avant 11 h** | **Checkpoint 3 :** prototype démontrable en live ; fiche projet et dépôt GitHub (problème, solution, stack, architecture, lien du proto, comment tester) ; évaluation des pairs ; **vidéo démo de 5 min** |
| **Ven 20, avant 15 h** | **Checkpoint 4, pitch deck de 8 à 12 slides, dans cet ordre :** Problème · Solution · Démo · Business model · Go-to-market · Architecture technique · Limites, axes d'amélioration et roadmap · **Estimation du coût de run** |
| Chaque soir, de 17 h à 9 h | **Peer review** obligatoire sur `peer-review-black.vercel.app`, qui compte dans la note. Chacun active d'abord son compte avec son code personnel. |

## 5. L'équipe

**Membres :** Mohamed El Hamss (M1), Tugdual Breuil (M1), Aziz Tajini (M1), Aurian Bingangoye (M2), Alec Diamidia (M2), Jahdiel Kinvi (M2).

| Rôle | Responsabilités | Qui |
|---|---|---|
| **CEO** | Vision, arbitrages tech et business, priorités, planning ; porte le pitch et les questions du jury | Alec Diamidia |
| **CTO** | Architecture (IA, automatisation, base, API), qualité du code, README et schémas, proto de bout en bout, **démo live avec plan B** | Aurian Bingangoye |
| **CAO** | Workflows Make, n8n, Apps Script ou scripts, lien entre no-code et code, fiabilité | Aziz Tajini |
| **CAIO** | Features IA, prompts reproductibles, **comparaison des LLM en précision, coût et latence** | Mohamed El Hamss |
| **CDO** | Données réelles, base propre (Supabase, Airtable, Sheets), nettoyage | Jahdiel Kinvi |
| **CPO** | Personas, parcours, interface minimale, business model, go-to-market, pitch deck | Tugdual Breuil |

- **Mentors H sur place :** Jules Belveze (Core Team Researcher), Nolwenn Guiban (Product & Growth), Mathieu Diaz (Product & Software Engineer).
- **Slack :** un canal réunit les CEO et l'organisation.
- **Accès :** le compte H de l'équipe utilise l'adresse `Team4@…`. Les identifiants et les codes ne s'écrivent nulle part (§9).

## 6. Stack et ressources

**Obligatoires :**
- **H Company** : l'Agent API et les modèles Holo.
- **Hugging Face** : des modèles qui tournent vraiment, via les Inference Providers (200 modèles et plus, changement de modèle en une ligne : `OpenAI(base_url="https://router.huggingface.co/v1", api_key=HF_TOKEN)`), Spaces et Jobs. Les 50 € de crédits viennent du coupon de l'équipe et sont réservés à la semaine.
- **GitHub** : un dépôt propre, qui servira aussi aux candidatures.

**Fortement conseillé : Vercel** et v0, membre du jury et partenaire de H, avec des crédits fournis.

**Accès depuis Claude Code** : le plugin `hai-agents@hai-skills` et le pont MCP local `holo` sont installés. La procédure, à reproduire sur chaque poste, est dans `contexte/03-agents-api.md` (« Accès depuis Claude Code »). Chacun fait sa propre connexion avec `holo login`.

**Agent API** : la référence vérifiée est dans `contexte/03-agents-api.md`. L'essentiel :
- **Session et paramètres** : une session par tâche (`POST /api/v2/sessions`), avec `max_steps` et `max_time_s` comme garde-fous.
- **Sortie structurée** : `answer_schema` (Pydantic) ou `answerSchema` (Zod).
- **Briques** : sous-agents en parallèle, skills, custom tools, validation humaine des actions (tool approvals), webhooks, schedules, browser profiles, coffres pour identifiants et 2FA.
- **Preuves** : un lien de replay public, révocable.
- **Mesure** : steps et tokens par session.
- **Environnements** : le navigateur cloud ; **notre Chrome** (`"host": "user_device"`, avec nos logins et notre réseau) ; notre bureau (`h/holo-desktop`).
- **Offres** : gratuit (3 sessions simultanées, 60 M de tokens), 20 $/mois (10 sessions, 1 Md de tokens), 200 $/mois (100 sessions, 10 Md de tokens).

**À demander aux mentors H mardi :**
- les conditions d'utilisation pour des tests de sécurité ;
- l'accès à `localhost` depuis le navigateur cloud ;
- l'interception réseau ;
- la latence typique par step ;
- le nombre maximal de schedules.

## 7. Le showcase : ne pas refaire ce qui existe

`contexte/02-showcase-h.md` liste les 67 agents déjà publiés, par famille. On y cherche le cousin de chaque idée, et on dit ce qu'on apporte de plus (H autorise à reprendre un projet pour le pousser plus loin).

- **Ces projets viennent de hackathons passés** (San Francisco en juillet, 42AI les 7 et 8 novembre), jugés par d'autres jurys. Le showcase montre ce qui existe, pas ce que notre jury a vu.
- **Très représenté :**
  - les assistants « qui font tout » ;
  - **apprendre une app ou une tâche** : REBORN, Show Me Once, DarkDatAgent, Reel-Learn, Holo Forge, AI Runbooks, Voodoo ;
  - le QA et les tests : 7 projets testent des applis ou des sites, dont une démo de H. D'après la transcription imparfaite du kick-off, H y voit « un sujet qui avait déjà été un peu posé ».
- **Libre au 16/11 :**
  - le pentest et la sécurité offensive ;
  - les métiers B2B précis des PME françaises sur des portails sans API ;
  - l'administration des accès SaaS.
- **Le modèle à imiter**, REBORN : « 40 devis sur 40 recalculés au centime, et environ 5 $ d'agents pour analyser un CRM ». Un chiffre de résultat et un chiffre de coût.

## 8. État du projet (18/11, QA et pentest à égalité sur sites réels)

### Dépôt GitHub de l'équipe (D-31)
- **Dépôt** : https://github.com/jkinvi-byte/hsentinel-alertes, privé. Le dossier de travail est le dépôt. Le `.gitignore` fonctionne en liste blanche : ajouter un chemin à publier est une décision, que l'on consigne.
- **Avant chaque push** : `git status` pour voir ce qui part. Aucune clé dans un fichier (§9). Le README à la racine dit l'état réel ; on le tient à jour, daté.

### Volet QA exécuté en réel depuis Claude Code (D-30)
- **Demande d'Aurian (18/11, 6 h 20)** : mener à bien la partie QA pour que les agents H fassent ce qui est attendu, sans cybersécurité. Aurian gère l'autre volet.
- **Fait et vérifié en réel** sur `eugeniaschool.com`, en consultation seule :
  - l'agent `sentinelqa-qa` est créé et confirmé dans H ;
  - parcours dicté ou tapé : plan Hugging Face relu par l'utilisateur, puis vérification par le code ;
  - exploration bornée, sur ordinateur et sur mobile ;
  - dictée par Whisper ;
  - web `/qa` (studio, suivi en direct, arrêt, rapport avec captures et mesures) ;
  - file Supabase `qa_*` et worker dédié.
- **Mesures** : 8 missions complètes, 0,290 $ au total, 0,036 $ et 81 s en moyenne ; plan en 1 s ; 46 tests Python et 15 JS ; `next build` réussi.
- **Honnêteté** : aucun défaut du site n'est prouvé. Le constat « 4 étapes / 3 étapes » est corrigé : la FAQ dit « Quatre étapes ». Les faux écarts trouvés en réel ont été corrigés, puis revérifiés sur les mêmes sessions (`--reverifier`).
- **Accès** : « Lancer un audit », onglet QA (le studio avec la dictée, 7 h 55, à la demande d'Aurian) ; l'historique est sur `/qa`.
- **Commandes** : la section « Volet QA » de `sentinelqa/README.md`. Les retours sur l'API sont dans `notes/retours-agents-api.md`.
- **Reste à faire** :
  - valider la règle des verdicts ;
  - confirmer le bon Supabase ;
  - tester la dictée avec une vraie voix ;
  - mesurer le temps humain gagné ;
  - 10 exécutions par scénario.

### Passation demandée à Claude Code et raccordements non vérifiés (D-29)
- **Demande d'Aurian** : remettre la contribution Codex dans un dossier pour Claude. Il signale que les propositions s'appuyaient sur un ancien Supabase et une web app de test pour l'authentification. Ce signalement n'a pas été résolu par une vérification distante.
- **Correction de statut** : l'adéquation de `sentinelqa/web`, de la base configurée et des agents H avec le projet actuel n'a pas été établie. Les tests et le build locaux ne justifient aucune recommandation de déploiement. L'absence supposée de migration reposait sur le schéma local historique, pas sur la bonne base vérifiée.
- **Point lu dans le code** : le web privilégie ses variables d'environnement Supabase ; le runner lit par défaut le fichier local. Leur concordance n'a pas été vérifiée. Retrouver l'application et les services actuels avant de consommer une file ou de modifier un agent existant.
- **Livraison précisée par Aurian** : dossier `passation-claude/` limité au QA fonctionnel, à la voix et à l'interface. Le code QA est extrait en modules distincts ; les autres exécuteurs ne sont pas inclus. Le dossier décrit l'architecture cible et traite la web actuelle comme un prototype à faire évoluer. Il ne modifie pas le périmètre global du projet. La voix et l'exploration QA générale restent à construire ; aucun parcours réel n'est validé. Prompt, inventaire, provenance, tests des extraits et manifeste accompagnent la livraison.

### Agents H persistants et clarification de l'existant (D-28)
- **Demande d'Aurian** : s'appuyer sur le travail Claude Code, expliquer les tests réellement effectués et produire des agents H. Conversation relue : `bb3ef312-f62f-4a9e-ae0b-e7ba3df422c7`.
- **Existant confirmé dans les fichiers** : agents du cobaye `sentinelqa-explorateur` et `sentinelqa-verificateur`, Supabase et Hugging Face déjà intégrés au flux historique. Le rapport du 17/11 à 8 h 51 contient 12 sessions et des coûts H/HF mesurés ; le lot D-27 ne partait pas de zéro.
- **Code ajouté** : `runner/agents_missions.py` définit `sentinelqa-qa` et `sentinelqa-pentest`. Le runner crée ou actualise l'agent, le relit puis le référence par son nom. Commande dédiée : `--preparer-agents`, avec `--verifier` pour la validation locale uniquement.
- **État distant** : aucun nouvel agent créé par Codex. La tentative d'enregistrement échoue dès le premier GET : résolution de l'hôte (`ConnectError`, `Errno 8`), avant toute réponse HTTP. La clé H existe ; aucune invalidité de clé ni nécessité de reconnexion n'est établie. Aucun outil H n'est exposé à cette session ; la configuration Claude Code est distincte.
- **Validation** : 25 tests Python réussis, dont les contrats du SDK sur transport simulé et les sessions par agent nommé. Les deux scénarios réels restent à exécuter. Le serveur de `sentinelqa/web` est déjà à l'écoute sur `127.0.0.1:3100` ; `EADDRINUSE` vient d'un second lancement.

### Mise en œuvre demandée par Aurian : premier lot (D-27)
- **Demande** : commencer l'implémentation du plan ; s'appuyer sur l'architecture documentée, sans refaire le cadrage.
- **Code ajouté** : catalogue partagé des deux cibles et quatre scénarios, contrat de mission, formulaire QA/pentest à comptes facultatifs, branche dédiée dans le runner, résultats à quatre états et rapport adapté. Les deux scénarios anonymes Q-PUB-01 et S-PEER-01 sont raccordés ; Q-PEER-01 et S-PEER-02 restent non exécutables avec préconditions explicites.
- **Contrôles** : lectures HTTP limitées aux URL enregistrées, redirections vérifiées, budgets, arrêt avec annulation H et conservation des preuves, accès opérateur avant exposition. Le contrôle des clics natifs de H reste une consigne ; aucun pare-feu de navigateur n'est revendiqué.
- **Validation mesurée** : 20 tests Python et 10 tests JavaScript/routes réussis, build Next.js réussi. L'essai réel QA a rendu `inconclusive` après `ConnectError` vers H. Le smoke navigateur local a rencontré `listen EPERM` avant son démarrage. Aucun succès réel QA ou pentest n'est revendiqué pour ce lot.
- **Lancement** : commandes et limites dans `sentinelqa/README.md`. Aucune migration Supabase ni publication distante effectuée. Le worker utilise le JSON `audits.rapport` versionné pour conserver la demande puis les résultats.
- **Suite** : valider les deux parcours avec H ; poursuivre les adaptateurs authentifiés et les contrôles associés selon le document 09. HF, voix et CLI client restent à intégrer. Le socle réel complet de D-26 n'est pas déclaré terminé.

### Cadrage d'Aurian : deux volets de même importance (D-26)
- **Correction explicite** : QA et pentest méritent la même attention. Les expressions « QA central, pentest complémentaire » et l'ordre qui reportait le pentest étaient une interprétation de l'assistant, corrigée par Aurian.
- **Problèmes adressés** : le QA vérifie le fonctionnement attendu et réduit le travail répétitif ; le pentest recherche les comportements et accès qui devraient être impossibles, avec des preuves exploitables. Le temps gagné et la qualité des résultats sont à mesurer pour chaque volet.
- **Priorité confirmée** : faire fonctionner les deux volets sur des sites réels. Le QA désigne bien le test fonctionnel, pas seulement les contrôles d'accès T0. Notion sera mis à jour plus tard par le chef de projet.
- **Livraison recommandée** : un socle commun cible, instruction, périmètre, sessions, preuves et rapport ; deux chantiers P0 au même niveau, chacun avec son scénario réel, ses assertions, son budget et son critère de fin. Le socle de démo est complet lorsque les deux parcours fonctionnent. Aucun volet n'attend l'achèvement de l'autre.
- **Idées proposées, à distinguer d'une validation d'implémentation** : dictée vocale et lancement terminal/application. Recommandation : voix vers le même champ texte après le parcours initial ; CLI client après le moteur commun. Une entrée terminal interne existe déjà. Aucune application de bureau distincte n'est justifiée à ce stade.
- **Hugging Face** : scénarios QA réutilisables, priorisation de contrôles de pentest autorisés et rapports fondés sur les preuves ; la transcription est une option ensuite. H comprend déjà les consignes : un second modèle doit apporter une valeur identifiable. L'intégration HF retenue doit fonctionner dans la démo finale.
- **Contraintes conservées** : D-24, aucune écriture métier ni changement de droits sur les deux sites. Une exploration QA sans instruction reste bornée et n'active pas automatiquement un pentest.
- **Documents actuels** : la vue simple 06 et les guidelines 09 intègrent ce cadrage. Le corps historique du 07 et son PDF décrivent l'ancienne architecture ; ils ne constituent pas le plan de livraison courant.
- **État au moment de D-26** : revue documentaire seulement. D-27 décrit ensuite le premier lot implémenté ; le QA générique, la voix et la CLI client ne sont pas présentés comme construits.

### Nouveau cadrage d'Aurian : sites réels, aucune écriture (D-24)
- **Cibles indiquées dans la conversation** : `https://www.eugeniaschool.com/` et `https://peer-review-black.vercel.app/etudiant`.
- **Autorisation** : Aurian déclare avoir obtenu l'accord écrit du responsable. Cette instruction autorise le cadrage sur ces sites réels et remplace, pour ces deux cibles, la restriction générale à la préproduction du §9. L'accord lui-même n'a pas été relu pendant la revue d'architecture.
- **Limite confirmée** : aucune écriture métier ni changement de droits sur ces cibles. T1 et le Préparateur sont donc hors de cette démo sur sites réels ; une remise en état après modification ne serait pas conforme.
- **Démo souhaitée** : un volet QA et un volet Pentest ; le site retenu dépendra des résultats et de la fiabilité. D-25 rétablit le QA fonctionnel, distinct du QA=T0 ; D-26 confirme l'importance égale des deux volets.
- **Guidelines de mise en place** : `livrables/09-guidelines-demo-sites-reels.md`. La revue relève notamment la connexion HTTP propre à Paie Express, le modèle imposé de trois comptes, les verdicts trop dépendants de la similarité et des consignes navigateur insuffisantes pour imposer la lecture seule.
- **État** : revue du code et recommandations écrites ; aucune adaptation du runner ni aucun audit authentifié des sites réels n'a été réalisé dans cette revue. Les schémas précédents et le PDF illustré décrivent encore l'architecture antérieure à D-24.

### Historique : les avancements de Notion du 17/11, 16 h 12
**Le cadrage QA=T0 et l'exclusion du test fonctionnel ci-dessous sont remplacés par D-25.** T1 reste hors des deux sites réels selon D-24. Ces éléments sont conservés pour comprendre les décisions précédentes.
Aurian a demandé : « ne prends les modifs de l'architecture que si c'est plus pertinent ». Le détail est dans D-21 à D-23.
- **Repris** :
  - les deux volets : le QA à chaque mise à jour (T0), le Pentest en profondeur, régulier ou avant un gros contrat ;
  - Hugging Face guide le Pentest, à partir de la cartographie et, si le client le permet, du code, et le rejeu teste chaque route qu'il nomme ;
  - F7 et C5 au cobaye.
- **Pas repris** :
  - le test fonctionnel (« vérifie que la nouvelle fonctionnalité marche ») ;
  - le retrait de T1 et du Préparateur, que Notion ne cite plus. T1 reste dans le volet Pentest, à confirmer en équipe.
- **Retiré, sur décision d'Aurian** : le feu vert dans Slack (W2). Il se donne au cadrage.
- **Sur Notion, à corriger par l'équipe** :
  - le « En bref », qui dit encore SentinelQA ;
  - la phrase « En plus simple » était alors contestée ; D-25 confirme désormais le test fonctionnel ;
  - le tableau de la stack, qui date du 16/11 ;
  - la ressource déposée à 15 h 37, `architecture.html` : sans son dossier `polices/`, elle s'affiche mal. C'est le PDF qu'il faut déposer.
- **Le problème, mis à jour sur Notion à 16 h 03** : d'après l'OWASP 2025, le contrôle d'accès défaillant reste n°1, avec plus de 1,8 million d'occurrences sur plus de 2,8 millions d'applications (*rapporté* : vérifié par un coéquipier sur la page officielle, pas relu ici).
- **Le PDF illustré compte maintenant 24 pages.** Il ouvre sur une page « Deux volets, un seul verdict », avec un comparatif, et chaque page d'un volet porte son repère dans l'en-tête.
- **Relu à 17 h, le texte en bleu de Notion** (les blocs « Mise à jour 17/11 », de 16 h 01 à 16 h 12) correspond à l'architecture, ligne à ligne. Deux écarts sont voulus :
  - le Préparateur est gardé pour T1 ;
  - « jusqu'à la ligne de code » devient « jusqu'au code, quand le client le donne ».
- **Vigilance sur « Apps à tester »** (sous-page Notion, 16 h 56). Elle liste Cadence (`cadence-eugenia.vercel.app`) et Peer Review (`peer-review-black.vercel.app`, la plateforme d'évaluation entre pairs du hackathon, §4).
  - Ce sont des applications d'Eugenia en production.
  - **Cadrage remplacé pour la démo par D-24** : Aurian confirme l'autorisation écrite et désigne le site public Eugenia et Peer Review, sans écriture. Cadence n'est pas dans cette nouvelle liste.
  - La référence à l'accord existant doit figurer dans le profil de cible ; le mécanisme générique de preuve de propriété du document 07 reste une proposition produit, pas une nouvelle autorisation à demander pour cette revue.

### Le nom devient HSentinel (17/11, 14 h 55)
- **La décision** : la rubrique « Nom » de Notion dit HSentinel depuis le 17/11 à 14 h 52, et Aurian l'a confirmé (« oui le projet devient HSentinel »). Le slogan ne change pas. Le détail est dans D-20 et dans `sentinelqa/MARQUE.md`.
- **Ce qui ne change pas** : les identifiants techniques (`sentinelqa/`, `sentinelqa-explorateur`, `sentinelqa-verificateur`).
- **Reste à renommer** : la web app, `sentinelqa/README.md`, les fiches 04 et 05, et le « En bref » de Notion, qui dit encore SentinelQA.
- **Ancien écart résolu par D-25 et D-26 pour le périmètre** : le test fonctionnel et le pentest sont deux volets à égalité. L'architecture historique du 07, où l'agent QA était devenu le Préparateur, doit être adaptée. Le choix d'un nouveau slogan n'a pas été validé dans cette clarification.
- **L'architecture technique existe en PDF illustré** : `livrables/07-architecture-technique-illustree.pdf`, 24 pages, à la demande d'Aurian (le 07 était « bon mais pas assez lisible »). Il reprend tout le 07, avec un schéma par idée et les vraies valeurs de l'audit de 8 h 51, dans la DA de la salle blanche.

### Historique du cadrage sécurité du 16/11 : SentinelQA, devenu HSentinel
Le problème unique et la métrique principale de cette version sont remplacés par D-25. Les résultats du cobaye restent des mesures du banc interne.
- **En bref** : les startups SaaS livrent plus vite grâce à l'IA, mais personne ne prouve, à chaque version, qu'un client ne peut pas voir les données d'un autre. SentinelQA teste une préproduction avec deux comptes et livre une preuve rejouable pour chaque faille.
- **Slogan** : « Votre IA code vite. Notre agent prouve ce qui fuit. »
- **Cible** : le CTO et le lead developer de startups SaaS B2B qui vendent à des grands comptes.
- **Métrique clé** : le taux de failles d'isolation retrouvées avec preuve, sur des failles injectées, avec zéro faux positif.
- **Méthode** : une application cobaye avec des failles documentées, au moins 10 exécutions par scénario, une comparaison avec le simple rejeu de requêtes HTTP, un test de robustesse quand l'interface change, et au moins 3 entretiens de CTO.
- **Critères d'arrêt** : au moins 80 % de détection prouvée, au plus 1 € par audit, et au moins un CTO sur trois qui confirme le besoin.
- **Le Top 10 OWASP 2025 place bien le contrôle d'accès défaillant en n°1** (*lu*).
- **L'objection à préparer** : Autorize, une extension libre de Burp, rejoue déjà automatiquement les requêtes d'un utilisateur avec les droits d'un autre pour trouver ces failles. Mais elle a besoin d'un humain qui navigue dans l'appli (*lu*, README). Notre réponse : l'agent est ce navigateur, il travaille à chaque déploiement, et il produit la preuve visuelle.
- **Les rubriques de la V1 et de la V2 détaillées ci-dessous** restent le contexte de travail.

### Les décisions d'Aurian (CTO) pour la v1, du 17/11 à 0 h 30 : à ne jamais oublier
Aurian a tranché ces points en réponse aux questions de cadrage. Ils ont été passés au crible des §1 et §3 avant d'être consignés ici.
- **La web app SentinelQA.**
  - Le client y **cadre son audit** : l'URL de préproduction, les comptes de test et le périmètre.
  - Elle affiche, de manière stylée et précise, **les résultats des interventions des agents**, triés et filtrés selon de bons critères : la date, le thème (le type de faille), l'application, la gravité.
  - **Les consignes de design d'Aurian** : une interface vraiment futuriste, avec des encadrés qui défilent, et une UX presque comme dans les épisodes de *Black Mirror*.
  - Un garde-fou proposé par Claude : les chiffres clés (failles prouvées, faux positifs, coût) restent lisibles d'un coup d'œil.
- **Le cadrage, décision d'Aurian le 17/11 au matin : le parcours B, tout de suite.**
  - Le CTO saisit ses comptes de test dans la web app, et son navigateur chiffre les mots de passe avec la clé publique du runner.
  - Supabase ne stocke qu'un texte chiffré.
  - Le runner déchiffre en mémoire, remplit les coffres H, audite, puis efface le texte chiffré.
- **Supabase pour les données** : les audits, les constats, les sessions et les coûts. Son temps réel peut alimenter le fil des agents qui défile. Les mots de passe des comptes de test n'y vont jamais : ils restent dans les coffres H.
- **Hugging Face**, obligatoire (slide 10, *lu*). **Décision d'Aurian, le 17/11 au matin : les deux rôles.**
  - **Avant les rejeux**, un LLM propose les attaques à tenter.
  - **Après les preuves**, il classait la gravité. **Abandonné le 17/11 (Aurian : « il faut une règle déterministe »)** : la gravité du LLM variait pour la même faille (10 pages sur 10 sur 5 audits). Une règle écrite la calcule désormais (`sentinelqa/runner/gravite.py`).
  - Le détail de la proposition d'origine :
  - Un LLM des Inference Providers lit la cartographie et propose les attaques à tenter : quelles écritures essayer, quelles pages d'admin viser. Le rejeu A/B ne couvre que la lecture.
  - Mohamed (CAIO) compare 2 ou 3 modèles en précision, en coût et en latence.
  - Le LLM reste hors du verdict, qui reste déterministe : un rejeu, puis une preuve par l'agent.
- **Trois types de failles :**
  - B lit les données de A ;
  - B modifie les données de A ;
  - un utilisateur simple atteint l'admin.

  L'écriture se fait uniquement sur des données de test, avec une validation humaine. La doc du navigateur H (*lue* le 17/11) ne prévoit aucune approbation pour un clic : la validation se fait donc dans notre runner, qui demande le feu vert avant toute écriture. Le contrôle de l'admin suppose une cible qui a un rôle admin.
- **Deux agents H sur mesure** : `sentinelqa-explorateur` et `sentinelqa-verificateur`.
  - On les crée par l'API (`POST /api/v2/agents`, *lu* dans l'OpenAPI : nom, consignes, modèle, environnement, skills, sous-agents, outils maison, format de réponse).
  - Un coffre H garde les identifiants des comptes de test.
- **Le cobaye doit ressembler aux applications de notre cible** : un SaaS B2B multi-entreprises, comme Paie Express, enrichi des failles d'écriture et d'admin.
- **LEVELS est écarté comme cobaye** (Aurian, 17/11, 0 h 50) : c'est une application grand public, pas un SaaS B2B, et elle ne s'adresse pas aux CTO de notre cible. Pour mémoire, les conditions relevées dans son code le 17/11 (*lu*) :
  - un seul projet Firebase existe, celui de production (`levels-app-f50a9`). Il faut un projet de test séparé : **jamais lesommet.app**, la production (§9) ;
  - les données passent par le SDK Firestore, pas par des pages à URL. La méthode actuelle (URL observées, puis rejeu HTTP A/B) est donc à adapter ;
  - les règles Firestore sont strictes (lecture réservée au propriétaire ou aux membres, écritures presque toutes côté serveur, refus par défaut) et déjà testées par un banc automatique. L'interface n'a pas de rôle admin.
- **La construction de la v1 a commencé le 17/11 à 0 h 50**, à la demande d'Aurian (« on fait maintenant, on avise demain »).

### La v1.2 (17/11, 9 h) : gravité déterministe, résultats lisibles, nouvelle DA
- **Décisions d'Aurian :**
  - **La gravité suit une règle écrite et déterministe** (« oui il faut une règle déterministe »), dans `sentinelqa/runner/gravite.py`.
    - Le constat de départ : la gravité donnée par le LLM variait pour la même faille, et les 10 pages ont toutes changé de niveau sur 5 audits (*mesuré*).
    - Le niveau dépend de qui accède (une autre entreprise ou un salarié), de la nature de l'accès (lire ou modifier) et des données touchées. Ces données sont détectées par des motifs fixes dans la page reçue au rejeu.
    - La règle passe un banc de 9 cas. Les 14 audits passés ont été reclassés (`regraver.py`, avec une sauvegarde) et la gravité est stable page par page (*mesuré*).
    - L'audit de vérification de 8 h 51 a donné 6 failles sur 6, 0 faux positif, 0,205 $ et 262 s, avec les mêmes niveaux.
    - Hugging Face ne garde que les hypothèses d'attaque.
  - **Les résultats de la web app doivent être compréhensibles par un non-technicien.** Une carte par faille dit qui peut faire quoi, pourquoi c'est grave, ce que l'agent a vu et comment c'est prouvé. Une barre fait le bilan des gravités, et le technique passe en annexe repliée.
  - **La DA est celle de LEVELS, transposée en blanc froid** : la salle peinte en SVG plat (le microscope sur une paillasse), les boutons de LEVELS et les cartes mates.
    - Polices : Schibsted Grotesk pour les titres, Instrument Sans pour le texte, Martian Mono pour les annotations.
    - Rejetés : la 3D, le verre brillant, les ronds colorés, les quadrillages, Syne, Space Grotesk et Inter. Le détail est dans `sentinelqa/MARQUE.md`.
- **L'architecture proposée** est dans `livrables/06-architecture-sentinelqa.md` (à valider en équipe). On garde deux tests : l'isolation entre entreprises (existe) et « les droits changent, mais un accès reste » (nouveau). **Le retest après correction (T2) n'est pas retenu** : un coéquipier ne l'a pas validé (17/11).
- **La revue des points faibles** est dans `notes/revue-points-faibles-17-11.md`. Deux points sont critiques :
  - le rejeu HTTP ne fonctionne que sur notre cobaye, avec une connexion codée en dur ;
  - Hugging Face ne déclenche aucun test.

### La v1.1, ce qui tourne (17/11, 7 h 40)
- **Fait et vérifié en exécution :**
  - **Supabase** (`sentinelqa/supabase/schema.sql`) : trois tables, `audits`, `evenements` et `cles_runner`. Le RLS est activé sans aucune politique : la clé secrète lit et écrit, la clé publishable ne voit rien et ne peut rien écrire (vérifié dans les deux sens). Les 8 anciens rapports sont importés.
  - **Le cadrage B dans la web app** (`/audits/nouveau`) :
    - le navigateur chiffre les mots de passe (WebCrypto, RSA-OAEP 3072 bits) avec la clé publique du runner ;
    - Supabase ne contient que le texte chiffré, et aucun mot de passe en clair dans la ligne (vérifié) ;
    - le runner déchiffre, audite, puis efface le texte chiffré (vérifié) ;
    - une attestation d'autorisation (art. 323-1) est obligatoire.
  - **Le runner en mode surveillance** (`sentinelqa/demo.sh --surveiller`), et **le suivi en direct** dans la web app, qui passe tout seul au rapport à la fin.
  - **Hugging Face, les deux rôles** (Qwen2.5-72B), hors du verdict :
    - les hypothèses, en parallèle des rejeux, recoupées avec les failles prouvées par leur précision et leur rappel ;
    - la gravité est passée à la règle déterministe le 17/11 (voir plus haut) ; Hugging Face garde les hypothèses.

    Latence mesurée de 13 à 99,5 s selon les essais, pour environ 0,001 $ par audit.
  - **Le filet de couverture** : la consigne de l'explorateur renforcée, et les liens visibles ajoutés par le runner. Il est né de l'audit de 6 h 27 (5 sur 6, avec F6 manquée parce que l'agent avait oublié une ligne de liste), et il a été vérifié sur la trajectoire de cet audit.
  - **Les mesures de la v1** : 5 audits, **29 failles prouvées sur 30, 0 faux positif**. Les deux audits lancés depuis le formulaire font 6 sur 6.
  - Les écrans ont été regardés à 1280, 390 et 360 px, sans débordement.
- **Reste à faire :**
  - Vercel : il faut `vercel login`. La web app doit d'abord être protégée, car sans accès protégé, n'importe qui pourrait lancer des audits ;
  - une vérification de propriété de la cible (un fichier à déposer sur la préproduction) : c'est une idée, pas encore construite ;
  - les 10 exécutions par scénario, les 3 entretiens de CTO et la comparaison avec un crawler ;
  - valider les couleurs et les polices de `sentinelqa/MARQUE.md`.
- **Les fiches pour défendre le travail** : `livrables/04-fiche-defense-sentinelqa.md` (technique) et `livrables/05-sentinelqa-explique-simplement.md` (mots simples).

### La v1, ce qui tourne (17/11, 1 h 05)
Le détail est dans `sentinelqa/README.md`, et le canon de la marque dans `sentinelqa/MARQUE.md` (couleurs et typographies encore à valider).

- **Fait et vérifié en exécution :**
  - **Les deux agents H sur mesure**, créés par l'API, et **un coffre H par compte de test**. Les agents se connectent avec `fill_secret_at`, et aucun mot de passe n'apparaît dans les événements des sessions (vérifié).
  - **Le cobaye Paie Express v2** : 3 comptes (deux administrateurs, une salariée), 6 failles injectées sur les trois thèmes et 4 contrôles sains. Un banc de 21 vérifications le contrôle, et il est vert.
  - **Le runner v1** : la cartographie par A et par C, les rejeux lecture, admin et écriture (l'écriture seulement avec un feu vert humain, puis la remise des valeurs d'origine), les preuves et le rapport.
  - **Deux audits v1, le 17/11 à 0 h 34 et à 0 h 47** : **6 failles sur 6 prouvées et 0 faux positif à chaque fois**, 11 sessions d'agents, de 213 à 214 s, de **0,187 à 0,201 $** (coût lu dans l'API H).
  - **La salle de contrôle (web app)**, dans `sentinelqa/web` :
    - les chiffres clés, un ticker des failles prouvées et le fil des interventions des agents, qui défile ;
    - les constats, filtrés par date, thème, application et résultat ;
    - le détail de chaque audit.

    Captures regardées à 1280, 390 et 360 px, et filtres testés au clic. Elle lit pour l'instant les rapports JSON.
- **Reste à faire**, avec ce qui bloque :
  - Supabase : il faut un projet, créé par Jahdiel (CDO) ou par Aurian, avec ses clés hors du dépôt ;
  - le fil en temps réel et le formulaire de cadrage dans la web app : ils dépendent de Supabase ;
  - Hugging Face : il faut le jeton d'équipe ;
  - Vercel : il faut `vercel login` ;
  - les 10 exécutions par scénario prévues par la méthode : 2 ont été faites en v1.

### La démo v0, ce qui tourne (16/11, 23 h 55)
- **Le code** : `sentinelqa/`, avec la procédure dans `sentinelqa/README.md`. Une commande lance tout : `sentinelqa/demo.sh`.
  - **Paie Express** : le cobaye Next.js, avec 3 failles de lecture injectées et un contrôle sain.
  - **Le runner** : la cartographie par `h/web-surfer-flash`, le rejeu HTTP A/B, les preuves par des agents en parallèle, puis un rapport HTML.
- **Le déroulé pour les mentors H** : `livrables/03-demo-sentinelqa-mardi.md`.
- **Les mesures**, sur l'application cobaye (*mesuré*, coût lu dans l'API H) :

  | Audit | Failles prouvées | Faux positifs | Durée | Tokens | Coût |
  |---|---|---|---|---|---|
  | n°1, avant correctif | 0 / 3 | 0 | 120 s | 352 804 | 0,054 $ |
  | n°2 | 3 / 3 | 0 | 150 s | 581 606 | 0,098 $ |
  | n°3 | 3 / 3 | 0 | 150 s | 606 335 | 0,103 $ |
  | n°4 | 3 / 3 | 0 | 168 s | 534 359 | 0,091 $ |
  | n°5, avec `demo.sh` | 3 / 3 | 0 | 164 s | 629 488 | 0,113 $ |

- **Les critères d'arrêt.**
  - Sur le cobaye : 100 % de détection pour au moins 80 % visés, et environ 0,10 $ par audit pour au plus 1 € visé.
  - Ce qui manque :
    - 4 exécutions sur les 10 prévues ;
    - les 3 entretiens de CTO ;
    - la comparaison avec un simple crawler ;
    - le test de robustesse quand l'interface change.
- **Le point faible connu.** Sur notre cobaye, un crawler classique trouverait aussi les liens. Le computer use se justifie aujourd'hui par la preuve visuelle et par la généralité, pas par la découverte des pages.

### Plan A, la direction retenue : un pentest automatisé et récurrent, mené par un agent computer-use

- **L'inspiration :** Horizon3.ai (NodeZero) et Pentera.
  - Ces outils font du pentest autonome, continu et prouvé, **au niveau de l'infrastructure**.
  - Leurs principes : enchaîner des faiblesses jusqu'à un impact, prouver plutôt que supposer, boucler « trouver, corriger, vérifier », rester non destructif, vendre un abonnement avec tests illimités.
- **Notre idée :** la même promesse appliquée **à la couche application**, là où il faut « voir l'écran ».
- **La problématique (hypothèse à valider) :**
  - Chaque version passe des tests automatiques, mais ces tests cherchent des failles techniques connues.
  - Les tests qui raisonnent comme un attaquant (droits d'accès, contournement de parcours) restent manuels, coûteux et ponctuels.
  - Pourtant, les applications changent chaque semaine, et DORA comme PCI DSS demandent de re-tester après chaque changement significatif.
  - À confirmer par 2 ou 3 entretiens avec des pentesters ou des RSSI : les grandes entreprises ont déjà des scanners, des revues de code, des pentests sur les changements majeurs et du bug bounty.
- **La solution (formulation actuelle) :** un pentester IA autonome qui explore les applications comme un vrai utilisateur, prouve les failles et leur impact, puis revérifie automatiquement à chaque déploiement.
  - **La boucle :** cadrer (URL de préproduction et comptes de test), explorer (un agent par rôle), formuler des hypothèses (LLM), prouver (agent vérificateur et preuves), montrer l'impact, puis corriger et vérifier à chaque déploiement.
- **La cible :**
  - acheteur : le RSSI d'une grande entreprise régulée (banque, assurance, fintech) ;
  - utilisateur : l'équipe DevSecOps ;
  - consommateurs des preuves : l'audit interne et le régulateur ;
  - go-to-market : passer par les cabinets d'audit et les prestataires qualifiés PASSI.
- **Une variante détaillée** est dans `idees/vigie-pentest-pr.md` : tester **ce que chaque pull request change**, sur la preview Vercel, en quelques minutes. Le banc de mesure y est décrit : des PR piégées, des PR saines et Juice Shop.

**Les faits relevés le 16/11** (niveau de preuve indiqué, voir §0) :
- **PCI DSS v4.0.1, exigence 11.4** (*lu*, guide Blaze : un guide spécialisé, pas le texte PCI lui-même) : « At least every 12 months and after significant infrastructure or application changes ».
  - Le testeur doit être qualifié, et l'organisation garantit son indépendance.
  - L'automatisation et l'IA « can support the assessment », mais des ingénieurs dirigent le test. Le produit complète l'audit, il ne le remplace pas.
  - PCI DSS est une norme du secteur des cartes bancaires, **pas une loi**.
- **DORA** (*rapporté*, à confirmer sur le règlement 2022/2554) : un programme de tests au moins annuel, pentests compris (art. 24-25), et des TLPT tous les 3 ans pour les entités désignées (art. 26).
- **NIS2** (*rapporté*) n'est toujours pas transposée en France : la loi Résilience serait à l'Assemblée depuis le 9/11/2026.
- **Le prix d'un pentest web humain** (*rapporté*, fourchettes de blogs de prestataires) : 3 000 à 8 000 € pour une application simple, 4 à 5 jours, 800 à 1 800 € HT par jour.
- **Le concurrent direct à la couche application : Shannon** (*lu*, page GitHub). Open source (AGPL), plus de 34 000 étoiles. Il lit le code, lance de vrais exploits (Playwright et ligne de commande) et bloque la CI selon la gravité, mais teste toute l'appli, en 1 h à 1 h 30 par passage. Le jury peut le connaître. XBOW joue sur le même terrain (*rapporté*). A-Test (showcase, *lu*) fait du test fonctionnel sur chaque PR, pas de sécurité.
- **Les CGU de H** (*lu*, platform.hcompany.ai/terms) : « Ensure that Your use of the Platform Service complies with the terms of service, robots.txt policies, security measures and access restrictions of the websites being visited. » Elles ne mentionnent pas les tests de pénétration. Il faut l'accord explicite des mentors.
- **Vercel** (*lu*, doc « Protection Bypass for Automation ») : un secret passé en en-tête `x-vercel-protection-bypass`, avec `x-vercel-set-bypass-cookie` pour une session de navigation. Disponible sur toutes les offres. Ce secret ne doit pas entrer dans le contexte du modèle.

**Les références réglementaires, à revérifier sur les textes officiels avant les slides :**
- PCI DSS 6.2.4 (abus de logique métier) et 11.4 ;
- les normes d'authentification forte de DSP2 ;
- NIS2, art. 21 ;
- RGPD, art. 32(1)(d) : tester régulièrement l'efficacité des mesures.

**Correction de chiffre.** On ne doit pas écrire « le contrôle d'accès défaillant est présent dans 94 % des applications ». La phrase exacte de l'OWASP Top 10 2021 : « 94% of applications were tested for some form of broken access control with the average incidence rate of 3.81% ». C'est la catégorie n°1, avec le plus d'occurrences (plus de 318 000). Les 94 % mesurent la part d'applications **testées** pour cette catégorie, pas celles qui ont la faille.

**Les points ouverts :**
1. **L'angle :**
   - (a) les contrôles d'accès et la logique métier des applications web. Recommandé : c'est là que voir l'écran apporte le plus.
   - (b) la configuration de sécurité des consoles SaaS (Microsoft 365, Okta, Salesforce). **Attention à l'exigence n°1** : ces consoles ont des API d'administration, et le computer use y est difficile à justifier.
   - (c) les applications internes ou anciennes sans API.
2. **La cible :** un grand compte régulé (cycle de vente long) ou une scale-up qui livre chaque semaine (adoption rapide).
3. **La validation terrain :** quelques entretiens avec des pentesters ou des RSSI.
4. **L'accord de H**, à obtenir mardi.
5. **Le nom et le slogan.** Pistes : AppZero, Breakpoint, Pathfinder, Vigie.
6. **L'attribution des rôles.**

### Plan B (Aurian) : Portier, l'agent qui apprend seul à gérer les accès des SaaS

- **La fiche complète :** `idees/portier-acces-saas.md` (16/11). Aurian a choisi cet angle. L'équipe ne l'a pas encore validé.
- **Le pourquoi de l'angle :** le mécanisme « l'agent apprend une app » est **très représenté** dans le showcase (§7). L'idée se définit donc par un métier : les arrivées, les départs, les revues d'accès et les licences, dans les SaaS sans SSO ni SCIM au plan payé (la « SSO tax »). Les procédures apprises deviennent des skills H.
- **Les concurrents :**
  - **AccessOwl** (plus de 500 applis, vise les petites équipes IT) : le plus proche de notre cible ;
  - **Cerby** (grands comptes, intégré à Okta et SailPoint) ;
  - **dans le showcase**, aucun cousin direct.
- **Notre différence, à prouver :** apprendre une console sans connecteur écrit à la main, et couvrir la longue traîne des SaaS français.
- **Les tests urgents :**
  - vérifier, appli par appli, qu'aucune API ni aucun SCIM n'existe au plan de la démo, sinon l'exigence n°1 tombe ;
  - vérifier si les SaaS français figurent dans les catalogues d'AccessOwl et de Cerby.

### Archivée

- **Pli** : les démarches des marchés publics pour les TPE du BTP (`idees/pli-marches-publics.md`). Écartée faute de SIRET réel pour PLACE et à cause de l'application locale de dépôt.

## 9. Limites et cadre éthique (dans tout le projet)

- **On teste uniquement des cibles qu'on contrôle**, ou pour lesquelles on a une **autorisation écrite**. Accéder sans autorisation à un système est un délit (art. 323-1 du Code pénal). Paie Express reste le banc contrôlé ; D-24 ajoute les deux sites réels explicitement désignés par Aurian pour la démo.
- **Par défaut : préproduction et comptes de test. Exception D-24 :** le site public Eugenia et Peer Review, avec l'autorisation écrite déclarée obtenue, en lecture sans modification métier ni changement de droits. Le périmètre de chaque profil borne les ressources et opérations. Les preuves contenant des données privées restent minimales et réservées aux opérateurs.
- **Le produit ne remplace pas** un TLPT DORA, ni un audit par un prestataire qualifié PASSI, ni le pentest PCI : il les **complète entre deux audits**. On le dit clairement dans la slide « limites ».
- **Les garde-fous de l'agent :**
  - un périmètre strict ;
  - `max_steps` et `max_time_s` ;
  - aucune action irréversible sans validation humaine ;
  - un journal complet de chaque session ;
  - des liens de replay protégés, puisqu'ils montrent comment exploiter une faille.
- **Les secrets** (clés API, mots de passe, coupons) restent dans des variables d'environnement, **jamais dans le dépôt**.
  - **Où ranger les clés** : Supabase et Hugging Face dans `~/.config/sentinelqa/.env`, la clé H dans `~/.config/hai/.env`. Ces fichiers sont hors du dépôt, avec les droits 600.
  - **`sentinelqa/.env.example` ne se remplit jamais** : c'est le modèle sans valeur, et le `.gitignore` le laisse entrer dans git. Le 17/11, des clés y avaient été mises par erreur ; elles ont été déplacées avant tout commit.
  - **Le Bureau d'Aurian est synchronisé avec iCloud** : un fichier de clés posé dans le projet part aussi dans iCloud.
  - **Le PDF officiel ne va pas dans le dépôt** : ses slides 22-23 contiennent le mot de passe d'équipe et les codes de crédits. Il faut l'ajouter au `.gitignore` s'il est dans le dossier.
- **Les chiffres du pitch :** uniquement des chiffres sourcés ou mesurés par nous.
- **Les modèles en local :** Holo4 est sous licence **CC BY-NC 4.0 (non commerciale)**. On vérifie la licence avant de promettre une offre « sur site ».

## 10. Concours LinkedIn (bonus)

- Publier un post **public** sur le projet, puis ajouter son lien sur la page du concours.
- **Taguer les 4 comptes** Eugenia, Vercel, H Company et Hugging Face, sinon le post n'est pas classé.
- Le classement se fait au **total des réactions** ; les commentaires ne comptent pas.
- Du **vendredi 20/11 à 14 h** au **vendredi 27/11 à 18 h**, heure de Paris.

## 11. Où trouver quoi

- `contexte/00-brief-hackathon.md` : synthèse sourcée du brief.
- `contexte/kickoff-transcription.md` : le kick-off, avec un sens fiable mais pas le mot à mot.
- `contexte/02-showcase-h.md` : les 67 agents du showcase, par famille, avec les espaces libres.
- `contexte/03-agents-api.md` : la référence vérifiée de l'Agent API, et les questions pour H.
- `idees/` : une fiche par idée (Vigie et le plan A, Portier pour le plan B, Pli archivée).
- `sentinelqa/` : la démo v0 (application cobaye, runner, rapports, `demo.sh`).
- `livrables/03-demo-sentinelqa-mardi.md` : le déroulé de la démo pour les points CTO du 17/11.
- `livrables/04-fiche-defense-sentinelqa.md` : la fiche pour défendre le travail, avec tous les tests, leur but, leur résultat et leur preuve.
- `livrables/05-sentinelqa-explique-simplement.md` : la même chose en mots simples, compréhensibles par un collégien.
- `livrables/06-architecture-sentinelqa.md` : l'architecture, en vue simple, pour l'équipe et le jury.
- `livrables/07-architecture-technique.md` : l'architecture technique, avec les composants, les algorithmes, les données, n8n, Hugging Face, les mesures et le plan.
- `livrables/08-justification-des-choix.md` : le registre des décisions et de leurs raisons, à tenir à jour (§0, n°12).
- `livrables/07-architecture-technique-illustree.pdf` : le 07 en 24 pages illustrées, à lire en premier. Sa source est `livrables/07-illustre/architecture.html`, et une commande le régénère : `python3 livrables/07-illustre/generer.py`. Elle contrôle le nombre de pages, les polices de la marque et le lexique interdit.
- `notes/recherche-pain-points-securite-17-11-2026.md` : la note de recherche sur les tests de sécurité à retenir (sources *lues*).
- `notes/revue-points-faibles-17-11.md` : la revue des points faibles du projet.
- `notes/retours-agents-api.md` : nos retours sur l'API, à créer dès la première session.
- Le PDF officiel : hors du dépôt. Chez Aurian, il est dans `~/Downloads/Hackathon 2026 — Build The Future.pdf`.
