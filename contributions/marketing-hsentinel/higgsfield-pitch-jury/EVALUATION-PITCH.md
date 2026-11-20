# HSentinel — Évaluation du pitch jury

20 novembre 2026. PDF examiné : **HSentinel – Pitch jury.pdf**, huit pages, texte extrait et huit pages regardées. Comparaison avec les rapports déjà examinés et le GitHub actuel : `main` au commit [`f74d1f4`](https://github.com/jkinvi-byte/hsentinel-alertes/commit/f74d1f4ef0c8a73c96774e6d797f2d3e0a8a4109), qui suit la refonte `d526c74`. Aucune nouvelle campagne de test n'a été exécutée pour cette évaluation.

## Avis

La structure est bonne : problème, solution, démonstration, offre, cible, architecture, limites, coûts. Le cas Alpha/Bêta donne une représentation concrète du contrôle d'accès. Les titres et les chiffres sont lisibles, et les huit slides peuvent soutenir un oral court.

**Le principal risque vient de formulations plus fortes que les preuves.** Un jury technique peut attaquer le zéro fausse alerte, le plafond de coût, la marge, l'automatisation à chaque déploiement et l'ambiguïté entre site réel et fuite injectée. Le deck sous-représente aussi le problème de temps perdu en QA : la première page et la justification d'achat restent presque entièrement centrées sur les fuites.

Le meilleur renforcement est de montrer une petite équipe qui délègue une vérification répétitive, puis comprend le résultat. QA et pentest ont la même place. Le temps humain gagné est une hypothèse commerciale à mesurer, tandis que les durées et coûts machine ont déjà des observations.

**Angle proposé pour le film : « Votre équipe construit. HSentinel vérifie. »** C'est une proposition de campagne qui reprend le travail créatif précédent, pas une modification du slogan canonique sans décision de l'équipe.

## Corrections, page par page

### 1 — Le problème

**À garder :** l'exemple visuel Alpha/Bêta, explicitement fictif.

**À revoir :**

- « Souvent, personne ne vérifie » n'est pas établi dans les éléments fournis. Remplacer par un problème concret : « À chaque version, les parcours et les accès doivent être revérifiés. »
- Les deux fenêtres montrent `/fiches-de-paie/1041`, alors que la flèche dit « 1 chiffre changé ». Le schéma montre en réalité un changement de compte sur la même ressource. Écrire **« Même ressource, autre compte »** ; ou reconstruire une illustration qui montre réellement un identifiant modifié.
- A01 OWASP désigne le **contrôle d'accès défaillant**, une catégorie plus large que « lire les données d'un autre ».
- Les **45 % de Veracode** concernent les échantillons/tâches de génération évalués dans leur protocole. Ce n'est pas 45 % de toutes les lignes de code produites par toutes les IA. Formulation possible : « 45 % des échantillons générés échouent aux tests de sécurité dans l'étude Veracode 2025 ». Ce chiffre n'est pas une mesure spécifique des IDOR. [Veracode, source primaire](https://www.veracode.com/blog/genai-code-security-report/).
- Les **4,44 M$ IBM** correspondent à une moyenne mondiale sur les organisations étudiées, pas au coût attendu pour une startup de 10–50 salariés. Le rapport porte sur 600 organisations victimes de violations entre mars 2024 et février 2025. À garder en contexte secondaire si nécessaire, pas comme ROI client. [IBM, source primaire](https://newsroom.ibm.com/2025-07-30-ibm-report-13-of-organizations-reported-breaches-of-ai-models-or-applications,-97-of-which-reported-lacking-proper-ai-access-controls).

**Titre proposé :** « Vous livrez une nouvelle version. Qui revérifie les parcours et les accès ? »

### 2 — La solution

**À garder :** les deux questions « Est-ce que ça marche ? » et « Qui peut accéder à quoi ? ».

**À revoir :**

- Les **56 secondes** sont une mesure sur un redéploiement, pas un délai garanti. La veille observe périodiquement l'empreinte de la page d'entrée et peut manquer un changement uniquement serveur.
- « À chaque mise à jour » décrit l'ambition de récurrence ; la version actuelle ne détecte pas exhaustivement tous les déploiements. Dire « Des vérifications récurrentes, déclenchées après un changement détecté ou à la demande ».
- « La page s'ouvre ? Faille prouvée » est trop rapide : une page générique ou de connexion peut répondre 200. La preuve porte sur un contenu privé reçu par le mauvais compte, avec un contrôle positif.
- « Aucun lien cassé » doit se limiter aux liens effectivement vérifiés.

**Titre proposé :** « Vérifier le parcours. Vérifier les droits. Comprendre le résultat. »

### 3 — La démonstration

**À garder :** la démonstration avant l'architecture et les mesures d'exécution.

**À revoir :**

- « Un vrai site, puis une fuite » peut laisser croire qu'une fuite a été découverte sur le site de l'école. Afficher clairement **QA sur site réel autorisé** et **détection de failles injectées sur notre banc**. Les rapports Peer Review examinés ne démontrent pas de fuite.
- « 59/60 failles » devient **« 59 détections sur 60 occasions : 6 défauts injectés, 10 audits »**.
- « 0 fausse alerte » devient **« Aucun faux positif observé sur les contrôles sains de ce protocole »**.
- « 29 s chacun » devient **« 29 s en moyenne sur ce parcours QA »**.
- « En direct depuis la console » doit décrire le passage réellement exécuté devant le jury. Un relevé historique est **un résultat archivé**, même s'il provenait de la console.
- « Ticket et e-mail en secondes » demande une mesure récente de toute la chaîne. L'authentification du webhook n'est pas une preuve de livraison d'un nouvel e-mail.

**Titre proposé :** « Des parcours réels exécutés. Des défauts connus retrouvés. Les preuves sous les yeux. »

### 4 — Le modèle économique

**À garder :** une offre mensuelle et une prestation ponctuelle, avec un acheteur identifiable.

**À revoir :**

- Les prix sont des **hypothèses d'offre** tant qu'ils ne sont pas validés par des clients. Préciser l'unité : application, volume de missions, profondeur et dépassements.
- L'essai de sept jours et la prestation Audit Express sur quatorze jours sont deux produits différents ; les nommer ainsi évite une contradiction apparente.
- « Moins cher qu'une visite d'expert » rapproche des périmètres qui ne sont pas équivalents. Votre propre slide 7 dit que le produit complète l'audit humain.
- La comparaison Detectify à 70–90 €/mois est à refaire. La page officielle actuelle présente une structure de frais annuels et de coûts supplémentaires, qui ne justifie pas cette comparaison simplifiée. Éviter aussi « alarme simple », qui réduit artificiellement le concurrent. [Tarifs Detectify](https://detectify.com/pricing).

**Titre proposé :** « Un abonnement pour répéter les vérifications entre deux audits humains. »

### 5 — La mise sur le marché

**À garder :** utilisateur et payeur distincts ; cible SaaS 10–50 personnes.

**À revoir :** les personas et les partenaires « dans 18 mois » ne sont pas encore une stratégie d'acquisition démontrée. Ajouter une prochaine action vérifiable : recruter des CTO pour un pilote, choisir un parcours critique, mesurer la charge manuelle et demander si le résultat justifie un abonnement.

**Proposition :** « Trois pilotes SaaS : un parcours critique, un contrôle d'accès, un avant/après mesuré. » Le nombre trois est un objectif proposé, pas de la traction acquise.

### 6 — L'architecture

**À garder :** la séparation entre observation et règle de décision.

**À revoir :**

- **Supprimer « pas de fausse alerte ».** Une règle déterministe peut être incorrecte ou s'appliquer à une preuve insuffisante.
- Ajouter **non concluant** ; le produit sait aussi distinguer **non exécuté**.
- La chaîne explorateur → rejeu → vérificateur correspond au banc. Elle n'explique pas à elle seule tout le QA et le scanner générique.
- Hugging Face fait davantage que plan et dictée dans la version actuelle : conversation, synthèse vocale, priorisation du scanner. Garder seulement ce qui aide l'explication, sans transformer la slide en inventaire.

**Titre proposé :** « L'agent observe. Le code vérifie. Le rapport dit ce qu'on sait. »

### 7 — Les limites et la feuille de route

**À garder :** le complément à l'audit humain et le périmètre autorisé.

**À actualiser :**

- Le contrôle A/anonyme/B sur Peer Review a **déjà tourné** : deux conformes, un non concluant, aucune fuite démontrée. Il n'est plus seulement « en cours ».
- Le webhook W3 a été réaligné selon le journal ; la garantie d'alerte instantanée complète reste à mesurer. Ne reprendre ni l'ancien blocage ni une promesse générale à partir d'une source périmée.
- GitHub documente désormais la refonte visuelle D-55 en ligne, avec le commit `d526c74`. Le précédent avertissement de notre dossier CTO sur l'absence de redéploiement était attaché à `902b0c9` : il ne suffit plus à décrire l'état actuel.
- Les prochains chantiers de produit sont les comptes clients isolés, les workers hébergés et supervisés, la reprise des missions, les quotas et la mesure du temps humain.

[Suivi GitHub examiné](https://github.com/jkinvi-byte/hsentinel-alertes/blob/f74d1f4ef0c8a73c96774e6d797f2d3e0a8a4109/SUIVI.md).

**Titre proposé :** « Le prototype tourne. Les pilotes doivent maintenant prouver sa valeur. »

### 8 — Le coût et la demande

**À garder :** des coûts issus d'exécutions, et l'objectif d'aller vers des clients.

**À revoir :**

- « 0,22 $ au plus par contrôle complet » généralise un coût observé sur un banc. Le coût dépend du scénario, du nombre de sessions, des reprises et des fournisseurs.
- Une phrase précise est plus forte : **« Audit Paie Express depuis la console : 6/6 défauts injectés retrouvés, 298 s, 0,203 $ H »**.
- Retirer **« > 90 % de marge »** : le calcul ne prend pas tous les coûts en compte, confond dollars et euros et repose sur un volume hypothétique. Présenter les coûts H mesurés, puis un modèle économique à valider.
- « Classez-nous premiers » réclame le verdict. Une demande plus crédible : **« Notre prochaine étape : trois pilotes SaaS pour mesurer le temps gagné et la qualité des constats. »**
- Le lien de formulaire est trop long pour être recopié à distance ; un QR code lisible et un CTA court conviendraient mieux au deck. Ne pas le générer approximativement dans la vidéo.

## Trois angles qui rendent le pitch plus complet

1. **Le travail réellement délégué.** Montrer la même vérification manuelle puis le parcours de l'agent. Mesurer préparation, relecture et reprises ; le coût machine ne remplace pas ce calcul.
2. **La décision après le résultat.** Montrer attendu, observé, preuve et action suivante. Si une correction puis un retest sont montrés, les deux doivent avoir réellement été exécutés ; le cas de défaut mobile de votre propre console est une piste documentée.
3. **La fiabilité explicite.** Une non-conclusion bien expliquée rend l'architecture crédible. L'objectif est de rendre cette incertitude visible et actionnable, puis de la réduire.

Ces angles répondent à l'impact, à l'adoption et aux apprentissages du jury sans imposer une nouvelle gamme de fonctions à la veille de la démonstration.

## Vidéo proposée

**Un film d'ouverture de 60 secondes**, suivi de la démonstration du produit et du reste de l'oral. Les huit slides ne deviennent pas huit tableaux statiques. Les images servent une histoire : vérifications répétées → mission préparée → QA → accès → preuve → résultats → client → marque.

Le brief, la voix off et les prompts par plan figurent dans [PROMPT-HIGGSFIELD.md](PROMPT-HIGGSFIELD.md). Ce dossier prépare une production ; aucune vidéo Higgsfield n'a été générée.
