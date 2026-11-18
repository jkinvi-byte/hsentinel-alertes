# Quels problèmes de sécurité choisir pour SentinelQA ?

Recherche publique du 17 novembre 2026. Objet : comparer les problèmes, leurs preuves, leurs acheteurs possibles, leur ROI et la justification du computer use. Cette note propose des orientations ; elle ne change pas les décisions du projet.

Les pages citées ont été ouvertes et lues. « Lu » signifie que la publication a été consultée, pas que ses résultats ont été reproduits. Pour Cobalt et GitLab, les chiffres proviennent des publications publiques de l'éditeur : ce ne sont pas des mesures indépendantes de notre marché. Les scénarios, acheteurs et gains proposés ci-dessous sont des **hypothèses à valider**.

Contexte utilisé : demande d'Aurian, `CLAUDE.md`, fiches locales SentinelQA, revue des points faibles et compilation du showcase. La page Notion de référence n'a pas pu être relue avec l'accès web public pendant cette recherche ; aucune connexion à un compte n'a été effectuée.

**Recommandation :** pour rester dans le pentest, concentrer SentinelQA sur les changements de droits et le retest de corrections. Pour privilégier l'utilité du computer use, examiner aussi la vérification des retraits d'accès dans les SaaS sans automatisation accessible. Ce dernier sujet relève davantage des opérations de sécurité que du pentest applicatif.

**Aucune des pistes n'a encore un ROI client validé.** Les sources établissent des risques et des tâches réelles ; les entretiens et la mesure doivent établir leur fréquence, leur coût et la volonté de payer dans notre segment.

## 1. Ce que les sources permettent réellement de dire

| Source primaire consultée — niveau : lu | Constat utilisable | Limite à conserver |
|---|---|---|
| [OWASP Top 10 2025, A01](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/) | Le contrôle d'accès défaillant est classé premier. | C'est une catégorie large. Le classement ne mesure pas la fréquence des fuites entre clients dans les startups SaaS. Ne pas transformer un taux de couverture des tests en prévalence. |
| [Cobalt, secteur logiciel, 30 juillet 2026](https://www.cobalt.io/blog/state-of-pentesting-software-industry) | Dans les constats présentés pour ce secteur : mauvaise configuration serveur 27 %, contrôle d'accès manquant 20 %, XSS 10 %, exposition de données sensibles 8 %, authentification et sessions 7 %. Le logiciel corrige plus vite que les autres secteurs étudiés. | Parts de constats chez les clients de ce prestataire, pas parts d'entreprises vulnérables. Pas d'échantillon publié ici isolant nos petites startups. Ne pas conclure que le logiciel est globalement négligent. |
| [Verizon, présentation du DBIR 2026, 19 mai 2026](https://www.verizon.com/about/news/breach-industry-wide-dbir-finds) | L'exploitation de vulnérabilités constitue le point d'entrée initial de 31 % des violations analysées. | Rapport 2026 sur des événements de 2025. Population large ; aucune attribution de ces 31 % à l'IDOR, au code IA ou à notre cible. Synthèse officielle lue, pas le rapport PDF complet. |
| [Cybermalveillance.gouv.fr, baromètre 2025](https://www.cybermalveillance.gouv.fr/tous-nos-contenus/actualites/etude-maturite-cyber-tpe-pme-2025) | Enquête OpinionWay auprès de 588 entreprises françaises de moins de 250 salariés. 16 % déclarent un incident en douze mois ; 43 % des entreprises victimes évoquent l'hameçonnage. 26 % déclarent utiliser la double authentification. Trois quarts déclarent un budget cybersécurité inférieur à 2 000 €. | Déclarations, tous secteurs. Le budget cité dans cette page n'a pas de périodicité explicitée : ne pas ajouter « par an » sans vérifier le questionnaire. Ces entreprises ne représentent pas spécifiquement les SaaS vendant aux grands comptes. |
| [Microsoft, révocation d'accès, mise à jour du 19 juin 2026](https://learn.microsoft.com/en-us/entra/identity/users/users-revoke-access) | Une application peut posséder son propre jeton de session. Entra ne peut pas directement révoquer ce jeton. La coupure dépend aussi du comportement et du provisioning de l'application. | Certains mécanismes permettent une révocation rapide. Il faut tester la politique et le délai attendus de chaque application, sans présenter tout délai comme une faille. |
| [Cobalt, enseignements du rapport 2026, 21 avril 2026](https://www.cobalt.io/blog/5-key-takeaways-from-the-2026-state-of-pentesting-report) | L'éditeur compare un délai pour clôturer la moitié des constats à haut risque de 10 jours chez les meilleurs à 249 jours dans les 10 % les moins performants. | Cette « demi-vie » inclut les constats encore ouverts ; ce n'est pas un temps moyen de correction. L'écart ne démontre pas que le retest est le principal goulot d'étranglement. |
| [OWASP WSTG, logique métier](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/10-Business_Logic_Testing/00-Introduction_to_Business_Logic/) | Les tests doivent tenir compte du processus, de l'ordre des étapes et des règles propres au métier. | Guide méthodologique, pas statistique d'incidents. Son affirmation ancienne d'une impossibilité d'automatiser ces tests est trop absolue pour servir de promesse commerciale en 2026. |
| [Mandiant, M-Trends 2026, 23 mars 2026](https://cloud.google.com/blog/topics/threat-intelligence/m-trends-2026) | Les investigations de 2025 documentent l'usage de sessions et jetons, les compromissions via des tiers et les attaques contre les moyens de reprise. | Échantillon d'investigations Mandiant, pas recensement de toutes les entreprises. Ne pas déduire la probabilité d'une attaque pour un prospect. |
| [CNIL, continuité et reprise, 14 mars 2024](https://www.cnil.fr/fr/securite-prevoir-la-continuite-et-la-reprise-dactivite) | La CNIL recommande de tester régulièrement les restaurations et les plans de continuité/reprise. | Cela démontre une tâche à effectuer, pas la proportion de sauvegardes inutilisables ni un marché prêt à acheter notre solution. |
| [Microsoft, gouvernance de Copilot, mise à jour du 3 novembre 2026](https://learn.microsoft.com/en-us/copilot/implement/copilot-controls-security-governance) | Microsoft prévoit explicitement l'identification et la correction de données trop largement partagées, avec des outils existants comme Purview et SharePoint Advanced Management. | Problème documenté, mais solutions natives déjà présentes. Un agent qui consulte les mêmes rapports doit apporter une valeur supplémentaire mesurée. |
| [Grafana, CVE-2026-11817, 17 juillet 2026](https://grafana.com/security/security-advisories/cve-2026-11817/) | Un administrateur d'une organisation pouvait obtenir certaines métadonnées de permissions d'autres organisations dans un déploiement multi-organisations. | Cas concret d'isolation défaillante. L'avis exclut explicitement les contenus des tableaux de bord, secrets et données personnelles : ne pas raconter une fuite de ces contenus. |

Ces sources documentent trois choses différentes : des **faiblesses** comme le contrôle d'accès, des **modes d'attaque** comme l'hameçonnage, et des **conséquences** comme la fuite ou l'arrêt d'activité. Une offre doit choisir une tâche précise dans cette chaîne.

## 2. Comparaison des pistes

Classement qualitatif proposé pour l'équipe, pas classement statistique des menaces. Les appréciations de ROI, d'adoption et de faisabilité sont des hypothèses.

| Piste | Acheteur à tester | Place du computer use | Mesure de valeur | Faisabilité pour notre prototype |
|---|---|---|---|---|
| **1. Régressions de droits après un changement de rôle ou d'organisation** | CTO ou responsable AppSec d'un SaaS B2B à plusieurs clients et rôles | Préparer des états via plusieurs comptes et parcourir l'interface ; comparer au coût d'un script | Temps de préparation et maintenance des scénarios, couverture réellement exécutée | La plus proche de SentinelQA, mais nécessite des transitions d'état |
| **2. Retest de vulnérabilités corrigées** | Responsable d'un cabinet de pentest ou équipe AppSec | Reconstituer le parcours connu lorsque l'interface a changé | Minutes humaines par retest et délai jusqu'à une preuve exploitable | Périmètre étroit ; possibilité de réutiliser la piste 1 |
| **3. Contournement des validations métier** | Éditeur de logiciel de dépenses, achats, gestion de crédits ; équipe sécurité | Enchaîner des opérations entre demandeur, approbateur et administrateur | Temps de validation ; pertes avérées liées aux abus déjà observés | Choisir une seule règle et un seul parcours |
| **4. Vérification effective des retraits d'accès SaaS** | Responsable IT ou prestataire informatique gérant plusieurs entreprises | Fort intérêt pour les applications sans API/provisioning accessible | Temps par départ et par application ; licences réellement économisées | Démo bornée à deux applications ; produit distinct du pentest pur |
| **5. Partages excessifs, invités et assistants IA** | Responsable IT/sécurité avant un déploiement d'assistant interne | Vérifier l'expérience réelle d'un invité ou lecteur ; intérêt conditionnel face aux outils natifs | Temps de revue et de vérification après correction | Deux rôles, un espace documentaire, un document témoin |
| **6. Reprise métier après restauration** | Prestataire informatique ou responsable continuité | Exécuter le parcours utilisateur sur l'environnement restauré | Temps d'exercice et délai de reprise constaté | Plus coûteux : il faut un environnement restaurable |
| **7. Parcours sensibles de récupération de compte** | AppSec d'un SaaS gérant son authentification | Parcours navigateur et messagerie de test ; contrôles serveur complémentaires | Temps de test des parcours et coût des incidents effectivement observés | Une séquence seulement ; complexité MFA et emails |

## 3. Les pistes les plus défendables

### 1 — Un droit supprimé doit effectivement disparaître

**Problème proposé :** « Nous changeons les rôles, invitations et partages, mais vérifier leurs effets dans tous les parcours demande de remettre plusieurs comptes dans le bon état. »

Exemples de scénarios à valider avec le client :

- Un administrateur devient lecteur : une action déjà ouverte doit-elle encore fonctionner ?
- Un membre quitte une organisation : peut-il encore obtenir un nouvel export ?
- Un document partagé est retiré : son ancien lien respecte-t-il la nouvelle politique ?
- Un utilisateur appartient à deux organisations : le changement d'espace conserve-t-il la bonne séparation ?

**Rôle proposé pour H :** construire le parcours et les changements d'état par l'interface. Un composant déterministe compare ensuite les opérations réellement permises à une matrice de droits fournie par le client. L'écran aide à comprendre le résultat ; la réponse serveur ou l'état persistant établit l'accès réel.

**Limite décisive :** un simple échange d'identifiant dans une URL ne justifie pas un agent visuel. [Autorize](https://portswigger.net/bappstore/f9bbac8c4acf4aefa4d7dc92a991af2f) rejoue déjà le trafic avec des droits différents pendant qu'un utilisateur navigue. Il faut démontrer un gain sur la préparation et l'entretien des parcours par rapport à cet outil et à des scripts.

La vérification doit distinguer une page conservée en cache d'une nouvelle lecture serveur. Le délai de révocation attendu doit faire partie du contrat de test.

### 2 — Vérifier une correction sans remobiliser tout le parcours manuel

**Problème proposé :** « Un développeur indique qu'une faille est corrigée ; il faut remettre les comptes et données en place, rejouer le scénario, documenter le résultat et rouvrir le ticket si nécessaire. »

Entrée : un constat connu, ses préconditions, ses comptes de test et le comportement attendu après correction. Sortie : résultat documenté sur une version précise, avec trois états distincts : violation reproduite, comportement attendu observé, test non concluant.

L'agent pourrait reconstruire le parcours malgré des changements d'interface. **Cette capacité est à mesurer**, pas à supposer. Une requête de reproduction stable sera souvent moins coûteuse à rejouer directement.

Le premier acheteur à interviewer serait un cabinet de pentest qui effectue régulièrement ces vérifications. Le besoin de traitement existe ; son volume et le temps réellement consacré au retest restent inconnus. Une correction lente peut surtout venir d'un manque de capacité de développement, auquel notre outil ne répond pas.

### 3 — Les actions autorisées séparément peuvent former un abus

**Problème proposé :** « Les écrans fonctionnent, mais un enchaînement d'actions permet de contourner une règle d'approbation ou une limite financière. »

Exemples hypothétiques : modifier le montant d'une dépense après approbation ; s'approuver soi-même par un changement de rôle ; obtenir deux fois un crédit qui ne doit être accordé qu'une fois. Le client doit préciser les règles : un agent ne peut pas déduire universellement quelle exception est légitime.

Le computer use sert à construire le processus et à agir avec plusieurs rôles. Les vérifications de montant, de statut ou de répétition peuvent rester côté API/base. Un test de concurrence pure se fait mieux par code.

Le ROI repose d'abord sur le travail de validation économisé. Les pertes évitées ne sont chiffrables qu'avec un historique d'abus du client et des hypothèses explicites ; ne pas inventer un taux de fraude.

### 4 — Un départ terminé dans l'annuaire peut rester incomplet dans les applications

**Problème proposé :** « L'IT a désactivé une identité, mais doit encore vérifier les applications autonomes, leurs comptes locaux et leurs sessions. »

L'offre pourrait contrôler les retraits dans une liste bornée d'applications et vérifier périodiquement le processus avec des identités de test. Il ne s'agit pas de récupérer la session privée d'un ancien salarié.

Le computer use se défend surtout quand l'application ou l'offre souscrite ne fournit pas l'automatisation nécessaire. Avec une API suffisante, la priorité doit aller à celle-ci. C'est aussi un marché déjà occupé : [Cerby documente des opérations d'accès exécutées par API ou navigateur](https://developer.cerby.com/#jobs), y compris le retrait d'utilisateurs. Une automatisation par clics ne constitue donc pas, à elle seule, une différenciation.

Mesures : temps actif IT par application, retraits confirmés, exceptions restantes, délai effectif. Une licence supprimée n'est une économie que si elle réduit une facture ou un achat futur ; ne pas additionner fictivement les prix de toutes les places libérées.

## 4. Trois autres directions à garder dans la comparaison

**Partages et assistants IA.** Tester avec des comptes de faible privilège si des documents explicitement exclus sont accessibles par un lien, une recherche ou un assistant. Utiliser des données témoins et une politique de droits connue. Distinguer une mauvaise permission existante d'un contournement du contrôle par l'assistant. Les outils natifs Microsoft sont un concurrent direct ; un audit par API peut être plus complet que quelques parcours visuels.

**Reprise après ransomware.** Le besoin exploitable est « après restauration, peut-on réellement retrouver un dossier, le modifier et reprendre le travail ? ». Restaurer un environnement de test puis exécuter un parcours métier permet de mesurer un délai et une capacité observée. Cela ne démontre pas une résistance générale au ransomware. L'intérêt du navigateur se situe dans la validation de l'application restaurée ; les opérations de sauvegarde elles-mêmes ont souvent des outils dédiés.

**Récupération de compte.** Examiner les changements d'adresse, réinitialisations et réauthentifications sur des comptes de test. [OWASP décrit les tests de changement et de récupération de mot de passe](https://wstg.owasp.org/v4.2/4-Web_Application_Security_Testing/04-Authentication_Testing/09-Testing_for_Weak_Password_Change_or_Reset_Functionalities/). C'est plus précis qu'un « détecteur de mots de passe faibles ». Le coût de gestion des boîtes de test et de la MFA peut toutefois dépasser celui du parcours principal.

## 5. Les sujets importants que je déprioriserais pour ce hackathon

| Sujet | Pourquoi il ne suffit pas à définir notre produit | Angle éventuellement pertinent |
|---|---|---|
| Hameçonnage | Le risque est documenté, mais générer/envoyer une simulation ne demande pas nécessairement de computer use. | Vérifier un parcours de protection ou de récupération bien défini, avec un acheteur identifié. |
| Mots de passe faibles ou partagés | Le contrôle de politique et la gestion des identités sont plus directement automatisables via les outils d'identité. | Retrait d'accès aux applications déconnectées ; gestion d'exceptions précisément identifiées. |
| Mauvaises configurations cloud | [AWS IAM Access Analyzer expose une API](https://docs.aws.amazon.com/access-analyzer/latest/APIReference/Welcome.html) pour analyser certaines permissions et accès. Naviguer dans la console n'ajoute pas automatiquement de valeur. | Vérification d'un effet applicatif que l'analyse de configuration ne couvre pas. Ne pas prétendre qu'Access Analyzer couvre toutes les configurations cloud. |
| Secrets dans le code, dépendances vulnérables | Ces objets sont directement analysables sous forme de fichiers, métadonnées et dépendances. | Orchestration de correction si un besoin client distinct apparaît ; computer use généralement faible. |
| Services exposés et vulnérabilités connues | Leur découverte et leur vérification reposent généralement sur des données réseau/protocolaires. | Valider un parcours métier après correction, plutôt que reconstruire un scanner générique. |
| « Fuites de données » ou « ransomware » | Ce sont des conséquences ou des familles très larges ; impossible d'en déduire seuls un périmètre, un acheteur et un prix. | Choisir un contrôle : partage révoqué, export interdit, reprise fonctionnelle après restauration. |

Le risque le plus médiatisé n'est pas nécessairement celui sur lequel notre équipe possède la meilleure démonstration, le meilleur canal commercial ou le meilleur avantage technique.

## 6. ROI : un exemple calculable, pas une statistique de marché

**Hypothèse pour le retest**, à remplacer par les mesures d'un cabinet :

- 20 retests par mois ;
- 45 minutes de travail humain par retest aujourd'hui ;
- 10 minutes de revue humaine avec l'outil ;
- coût chargé de 80 €/heure.

Gain brut hypothétique : `20 × (45 − 10) / 60 × 80 = 933 € / mois`, soit 11 h 40 de capacité humaine libérée.

Déduire les coûts d'agents, l'installation amortie, les reprises d'échec, le support et le prix du produit. Du temps libéré n'est pas automatiquement une baisse de masse salariale. La marge additionnelle suppose que le cabinet puisse utiliser cette capacité.

Comparer au **processus réel**, y compris les scripts et outils déjà utilisés. Si le processus actuel prend cinq minutes, l'hypothèse de 45 minutes n'a aucune valeur. Ne pas présenter le coût moyen mondial d'une fuite comme une économie produite par SentinelQA.

## 7. Comment départager les pistes cette semaine

Interviewer en priorité deux CTO/AppSec de SaaS et un responsable de cabinet de pentest ; ajouter un prestataire informatique si la piste de retrait des accès reste ouverte. Ce ciblage est une proposition, pas un contact déjà réalisé.

Questions fondées sur des faits récents :

1. Quel est le dernier défaut de droits ou retest qui vous a demandé du travail ? Montrer le déroulé d'un ticket anonymisé.
2. Combien de cas semblables le mois dernier ? Qui travaille dessus, combien de minutes actives, avec quels outils ?
3. Où est l'attente : préparation des comptes, correction, exécution, validation ou rédaction de la preuve ?
4. Que fournit déjà votre outillage ? Qu'est-ce qui oblige encore à naviguer manuellement ?
5. Quelle preuve permet de fermer le ticket ? Qui l'accepte et qui paierait pour produire cette preuve plus vite ?

Pour la démo : retenir un seul parcours de changement de droits, sur une version vulnérable et une version corrigée. Exécuter aussi un contrôle sain et un cas où le test ne peut pas conclure. Mesurer les minutes humaines, les reprises, le coût complet et les résultats sur plusieurs exécutions. Ajouter une modification d'interface et comparer à une référence scriptée.

La proximité avec [A-Test et les autres projets de QA du showcase H](https://showcase.hcompany.ai/?tab=h-42ai-hackathon) est relevée dans notre compilation locale du 16 novembre. La différence à démontrer porte sur les règles de sécurité entre comptes, les transitions de droits et la preuve vérifiable. Ce relevé local n'est pas une preuve d'absence de concurrents sur le marché actuel.

## 8. Proposition de problème, plus défendable

> Dans un SaaS à plusieurs clients et rôles, un changement de permission doit produire le bon effet dans tous les parcours concernés. Vérifier ces effets exige de préparer plusieurs comptes, des données et des états applicatifs. Nous voulons réduire ce travail sur les parcours sensibles et sur les failles déjà corrigées, en fournissant un résultat vérifiable pour chaque scénario exécuté et chaque version testée.

À présenter comme hypothèses tant que les entretiens ne les ont pas confirmées : fréquence de ce travail dans notre cible, insuffisance de l'outillage actuel, coût de maintenance, budget et acceptation des preuves par les clients grands comptes.

Corrections du récit initial :

- **« Prouver l'isolation de toutes les données à chaque version » est trop large.** Le résultat porte sur les scénarios, comptes, données et version effectivement testés ; il faut afficher les chemins non couverts.
- **Les tests scriptés peuvent vérifier des interdictions.** Le gain à démontrer est le coût de création/maintenance et la couverture obtenue, pas une incapacité générale des scripts.
- **34–41 % n'est pas une fourchette statistique établie.** [La page mondiale GitLab](https://about.gitlab.com/resources/developer-survey/) présente 34 % de code généré par IA dans une enquête de 3 266 professionnels ; [le billet français](https://about.gitlab.com/fr-fr/blog/devsecops-report-france/) cite 41 % dans un contexte français. Ne pas fusionner les deux ni en déduire une causalité avec les failles d'isolation. Ces publications ont été lues ; l'équivalence exacte des bases de calcul n'est pas établie ici.
- **Un rapport SentinelQA n'est pas automatiquement un pentest indépendant accepté par un grand compte.** Demander à l'acheteur le type de preuve requis ; ne pas annoncer un déblocage commercial avant cette validation.

