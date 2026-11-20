# Brief Claude Code — intégrer le design Lovable dans HSentinel

## Résultat attendu

Faire évoluer **l’application Vercel existante** : conserver sa vitrine avant connexion, son fonctionnement et ses connexions ; reprendre le design Lovable pour l’espace connecté, en assurant une continuité avec la vitrine. L’interface actuelle de conversation avec l’agent IA est une référence validée par Aurian : conserver sa présentation et ses interactions.

Aurian souhaite un produit accueillant, lisible et abouti, avec les informations techniques accessibles dans le détail. QA et pentest gardent leur place dans le produit.

## Références et état vérifié au 19 novembre 2026

- Application fonctionnelle : https://hsentinel-console.vercel.app/
- Référence visuelle : https://screenshot-exactly-recreated-63.lovable.app/
- ZIP : `/Users/aurian/Downloads/083fb93c-0d6d-4707-a3bc-2775d24c558c.zip`.
- Projet à modifier : `/Users/aurian/Desktop/HCompany/sentinelqa/web-console`.
- GitHub `main`, vérifié : `902b0c915ca3e0ae943325c3367ec4cdce50549a`. **Le travail de Kimi est maintenant publié.** Repartir du dernier état du dépôt ; la copie des moteurs dans le ZIP est plus ancienne.

Cette comparaison repose sur les fichiers du ZIP, le code local et GitHub. Les pages authentifiées Lovable n’ont pas été validées visuellement dans cette revue, et Aurian n’a pas pu en vérifier le parcours complet.

Le ZIP est une migration partielle vers TanStack Start/Vite et une authentification Supabase distincte. Son `serviceStatus` déclare `runner: false` ; le lancement y est désactivé. Sa note `.lovable/reviews/hsentinel-livraison.md` confirme que les workers, les captures et certains raccordements restent à reprendre. **Utiliser Lovable comme source de design dans Next.js ; conserver le système opérationnel de Vercel.**

## 1. Périmètre de la refonte

| Élément | Consigne |
|---|---|
| Accueil public, pages marketing, connexion | Garder le design Vercel. Appliquer seulement les corrections de contenu et d’offres demandées ci-dessous. |
| Vue d’ensemble, navigation, applications, historique, résultats | Reprendre la composition, les espacements et le traitement visuel Lovable, sur les données Vercel. |
| Conversation avec l’IA | Garder l’interface Vercel, son historique, sa voix, son animation et ses commandes. L’intégrer harmonieusement au nouvel espace. |
| Missions, suivi, rapports, captures, alertes | Conserver les actions, routes, contrats et états existants, avec le nouvel habillage. |
| Supabase, H Company, Hugging Face, workers, n8n | Réutiliser les connexions existantes. Aucune migration Cloud Lovable pour cette refonte. |

Garder les routes et liens profonds actuels, le retour arrière et le rechargement d’une page. Ne pas remplacer l’application par les vues en état React local du ZIP.

## 2. Direction artistique après connexion

Reprendre dans le ZIP `src/styles.css`, `src/components/hsentinel-workspace.tsx` et les composants de présentation utiles : fond clair légèrement chaud, surfaces blanches, accents bleus, navigation lisible, cartes aérées, titres plus présents, séparateurs discrets et états vides travaillés.

Les deux versions utilisent déjà Schibsted Grotesk, Instrument Sans et Martian Mono : garder les polices locales et le logo de Vercel. Réserver la police monospace aux données techniques et aux petites métadonnées. Réduire la densité des badges, identifiants et panneaux techniques dans les vues principales.

Limiter les nouveaux styles à l’espace connecté, notamment `#console-root` / `.theme-console`. Ne pas copier les styles globaux `:root`, `body` ou les chemins d’assets Lovable dans la vitrine. Conserver le thème sombre et prévoir une navigation mobile avec libellés compréhensibles.

## 3. Parcours et interaction à conserver

- « Nouvelle mission » mène au parcours existant, avec une entrée vocale évidente et un accès secondaire aux paramètres manuels.
- Unifier les points d’entrée audio autour de la conversation Vercel : ne pas ajouter une seconde interface concurrente. Partager la même consigne et les mêmes paramètres entre conversation et formulaire.
- Conserver la préparation du plan, sa relecture, le lancement explicite, le suivi, l’arrêt et le rapport. Ne pas donner à l’expert des capacités de lancement qui n’existent pas dans son contrat.
- Conserver les cibles et contrôles disponibles dans le catalogue actuel, y compris l’intégration de Kimi. Adapter la présentation au site sélectionné.
- Corriger les défauts audio dans les composants existants. Le ZIP rapporte des corrections de verrou asynchrone et de piste micro interrompue : les vérifier et les porter si elles sont utiles, avec leurs tests. Le bug d’appui long n’y a pas été reproduit avec certitude ; ne pas le déclarer résolu par simple reprise du ZIP.

Points d’entrée : `components/console/expert-conversation.tsx`, `mission-expert.tsx`, `mission-studio.tsx`, `../web/lib/qa-dictee.mjs`, `lib/console-contract.mjs`, `lib/console-reel.ts` et `app/api/console`.

## 4. Attentes, résultats et crédits

**Suivi :** montrer l’état réel — attente, écoute, transcription, préparation, navigation, vérification, terminé — avec animation discrète, couleur, icône et texte. Distinguer mission en attente et agent actif. Une animation ne prouve pas que le worker tourne. Prévoir une reprise explicite après erreur et respecter la réduction des animations.

**Dashboard :** privilégier les missions, contrôles conformes, anomalies à examiner et derniers résultats. Montrer attendu, observé et preuve dans le détail. Conserver les distinctions entre anomalie, erreur technique, non concluant et non exécuté. Utiliser les captures réelles ; ne pas présenter le rejeu comme une vidéo en direct.

**Crédits :** retirer les coûts d’infrastructure en dollars des données phares et du résumé de navigation client. Placer un indicateur discret de type « X utilisés sur Y · Z restants », avec période et date de renouvellement, dans le menu de compte ou en bas de navigation. Le détail reste dans « Offre et utilisation ».

Le portefeuille n’est pas encore branché : afficher une indisponibilité claire tant que le solde manque. Aucune conversion arbitraire dollars → crédits. Aucun chiffre de ROI ou de couverture inventé.

## 5. Corrections de la vitrine et des offres

Conserver leur présentation visuelle actuelle, avec ces corrections ciblées :

- **Sept jours / quatorze jours :** l’essai dure sept jours ; « Audit Express » décrit une prestation distincte sur une fenêtre de quatorze jours. Clarifier cette différence. Le bandeau principal peut mettre en avant « Découvrez HSentinel avec un essai accompagné de 7 jours ». Présenter les quatorze jours dans la fiche Audit Express, sans les faire passer pour la durée d’exécution d’un agent.
- **Conditions d’essai :** `/signup` annonce actuellement un accès ouvert par l’équipe, sans carte, avec sept jours à compter de l’ouverture ; `/tarifs` annonce encore carte obligatoire et renouvellement automatique. Aligner les textes sur le parcours réellement disponible. Une conversion payante automatique viendra avec le raccordement commercial correspondant.
- **Code-Assisted :** `components/landing/pricing.tsx` partage actuellement un seul état `addon` entre les cartes, ce qui explique leur sélection simultanée. Proposer l’option une seule fois après le choix de l’offre, dans le récapitulatif. L’onglet Options peut la décrire et mener à cette même sélection. Un seul état de commande, une seule ligne tarifaire ; vérifier les changements d’offre et de périodicité.
- Vérifier la disponibilité effective de Code-Assisted avant d’en proposer l’achat. Présenter explicitement une option à venir si son service n’est pas opérationnel.
- Retirer les mentions Fintech des exemples, menus et métadonnées, conformément à la demande précédente.
- **URL :** garder le projet Vercel actuel. Raccorder un domaine de marque déjà détenu si disponible ; sinon conserver son URL actuelle. Tout changement doit préserver les liens, redirections et configurations d’origine. Aucun achat de domaine dans ce lot.

## 6. Panier, paiement et renouvellement — lot fonctionnel distinct

Prévoir un récapitulatif simple : offre, nombre d’applications, périodicité, option unique, total et conditions d’essai. Éviter un parcours de boutique généraliste.

Le code actuel ne contient ni paiement ni portefeuille, et l’accès Vercel reste un accès opérateur. Un paiement client réel nécessite un compte ou espace de travail identifiable, un abonnement persistant et des droits associés. Développer ce raccordement séparément dans l’architecture retenue, sans importer l’authentification du ZIP au passage.

Pour une mise en œuvre fonctionnelle :

- Calculer les prix et vérifier les droits côté serveur ; une sélection visuelle ne vaut pas abonnement.
- Activer les droits à partir d’une confirmation de paiement vérifiée, avec traitement des doublons, échecs et annulations.
- Afficher un paywall contextualisé lorsque le quota est épuisé ou qu’une fonctionnalité exige une autre offre ; conserver l’accès aux rapports existants.
- Renouveler le quota inclus au début de la nouvelle période contractuelle, de manière idempotente. Le « reset » concerne les droits et quotas : conserver les missions, preuves, paramètres et historiques. Traiter séparément d’éventuels packs achetés.
- Rendre visible ce qui est raccordé, ce qui fonctionne en mode test et ce qui reste nécessaire. Ne pas bloquer la livraison de la refonte visuelle sur ce chantier commercial.

## 7. Tutoriel guidé

Ajouter un tutoriel court, facultatif au premier accès et relançable depuis l’aide : nouvelle mission → conversation → résumé/paramètres → lancement → résultats.

Utiliser des repères ancrés aux vrais composants, une mise en évidence et un curseur illustratif. Prévoir « Suivant », « Précédent » et « Passer ». Le tutoriel ne clique pas, ne lance pas de mission et ne consomme pas de crédits. Adapter son placement sur mobile et mémoriser sa fermeture.

## Livraison et critères d’acceptation

1. Relever les écrans Vercel actuels, puis porter la navigation, la vue d’ensemble et les résultats Lovable dans le projet existant.
2. Intégrer la conversation Vercel conservée, les états de progression et les corrections commerciales ciblées.
3. Vérifier ordinateur/mobile, thème clair/sombre, navigation, chargements, données vides et erreurs. Comparer les pages publiques pour détecter toute modification involontaire.
4. Vérifier le parcours QA existant de bout en bout : connexion → préparation → lancement → suivi → rapport et preuves. Tester fermeture/reprise audio et arrêt de mission. Pour les autres moteurs, conserver les contrats et vérifier les rapports avec les tests existants ; aucun nouveau test externe demandé par ce brief.
5. Fournir des captures comparatives, la liste des fichiers modifiés et les résultats de validation. Présenter séparément l’avancement du paiement et des quotas.

**Réussite :** l’utilisateur retrouve la même application fonctionnelle, sa conversation IA et ses données, dans un espace connecté inspiré de Lovable qui semble appartenir à la même marque que la vitrine Vercel.
