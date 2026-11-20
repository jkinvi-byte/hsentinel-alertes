# HSentinel — film publicitaire de 30 secondes

Concept : **« Votre prochaine release, preuves à l’appui. »**

Film produit destiné à un CTO de SaaS B2B. Le QA et le pentest disposent chacun d’un plan dédié de cinq secondes ; le reste du film présente le problème, la console, les preuves et l’offre.

Le premier parcours QA offert est une proposition commerciale, pas une offre déjà publiée. Variante sans gratuité en fin de document.

**V1 produite le 19/11 :** [film de 30 s](production/exports/HSentinel-30s-1080p.mp4), avec voix française Kokoro, sous-titres et musique originale. Les plans de console, de parcours et de rapport sont des illustrations signalées à l’écran. Ils remplacent les captures réelles prévues ci-dessous : la vidéo n’est pas un enregistrement d’exécution et ne présente aucun résultat client. Le plan d’accès montre une règle à tester, sans verdict inventé. [Détails du montage](production/README.md).

**Script et montage**

| Temps | Voix off française | Texte ajouté au montage | Visuel |
| --- | --- | --- | --- |
| 0–5 s | « Nouvelle release. Les parcours et les accès restent à revérifier. » | « Nouvelle release. Mêmes vérifications. » | Des fenêtres de produit se succèdent ; le même circuit de vérification revient. Mouvement précis, tension légère. Logo HSentinel en coin dès le début. |
| 5–10 s | « HSentinel réunit QA et pentest dans votre console. » | « QA + Pentest » | Révélation de la vraie console avec ses deux modes, de même taille. Le mouvement ralentit pour laisser voir le produit. |
| 10–15 s | « QA : décrivez le parcours. L’agent l’exécute à l’écran. » | « QA · Parcours utilisateurs » | Consigne courte, puis navigation : connexion, accueil, ouverture d’une page prévue. Montrer le pointeur et le changement de page. Les contrôles illustratifs restent identifiés comme une démonstration. |
| 15–20 s | « Pentest : testez les accès entre comptes, sur un périmètre défini. » | « Pentest · Contrôles d’accès » | Deux comptes de démonstration, une ressource qui appartient à A, une tentative d’accès par B. Sur le banc Paie Express, afficher le constat réel choisi, avec « Démo · défaut injecté ». |
| 20–25 s | « Vous récupérez les étapes, les captures et les résultats. » | « Des preuves consultables » | Trois cartes se rejoignent autour d’un rapport. Gros plan lisible sur une étape, sa capture et son résultat issus du même exemple. |
| 25–30 s | « HSentinel. Premier parcours QA offert. Voyez les preuves. » | « Premier parcours QA offert » puis bouton « Réserver mon essai » | Logo réel et écran final calme. Ligne secondaire : « 1 application · 1 parcours · rapport inclus ». CTA maintenu au moins trois secondes. |

La lecture représente environ 55 mots, à poser en 30 secondes avec des respirations. Prononcer QA « kiou-é » et HSentinel « Hache Sentinel ». Ajuster le minutage à l’enregistrement réel ; les cinq secondes de chaque ligne sont une cible de montage.

Le CTA mène vers une prise de contact pour le pilote accompagné. Aucun domaine ni lien d’inscription fictif ne doit apparaître. Le raccordement à l’application du prospect est confirmé avant son essai.

**Direction artistique**

Reprendre la console : graphite `#0b0e14`, panneaux `#111722`, texte `#e6e9ef`, bleu `#3b82f6`. Le vert `#49d08b`, le corail `#ff5a52` et l’ambre servent aux résultats correspondants. Grandes surfaces sombres, lumière latérale, reflets contenus, trajectoires nettes et typographie lisible. L’emblème H blanc existant apparaît par composition ; le modèle ne le redessine pas.

Le spectaculaire vient des mouvements de caméra, des changements d’échelle et des éléments de l’application. Les cadres, chemins et comptes illustrent le fonctionnement. Ce ne sont pas des graphiques chiffrés de performance. La narration suit une action reconnaissable : un parcours défini, un agent qui agit, un contrôle, une preuve.

Musique instrumentale sobre, pulsation régulière autour de 105 BPM, tension initiale puis résolution. Quelques sons de clic et transitions doux ; une seule piste continue sur les six plans. Voix humaine ou synthétique française naturelle, assurée et calme. Ajouter la musique et la voix au montage pour garder une continuité entre les générations.

Le film doit être compris sans le son. Sous-titrage fidèle à la voix, deux lignes maximum, avec une zone distincte des titres. En 1080p, viser au moins 48 px pour les titres et 36 px pour les sous-titres, puis vérifier sur téléphone. Les petits extraits du produit sont agrandis plutôt que montrés dans une page entière illisible.

**Éléments à préparer**

| Élément | Provenance / traitement |
| --- | --- |
| Logo | `sentinelqa/web-console/public/logo-mark.png`, ajouter le mot HSentinel comme dans la console. |
| Choix QA / pentest | Capture de `/app/nouveau`, données préparées pour la communication. |
| Parcours QA | Capture d’un parcours réellement exécuté. Si seul le principe est illustré, mention « Démonstration · données fictives », sans simuler un rapport mesuré. |
| Contrôle d’accès | Capture et rapport du même essai du banc Paie Express, comptes et données fictifs. Ne pas réutiliser des évaluations d’étudiants. |
| Preuves | Zoom d’un rapport existant, avec verdict, étape et capture cohérents. Conserver aussi un éventuel résultat non concluant. |
| URL du CTA | Ajouter la destination réellement choisie au montage ; à défaut, conserver seulement le texte du bouton. |

Des pauses sur les captures sont préférables à un morphing des interfaces. Le modèle génère les décors et transitions ; les enregistrements, textes, chiffres, logo et rapports restent des calques contrôlés. Un écran de principe ne doit pas se faire passer pour un résultat d’exécution.

**Prompt de production à donner à un agent ou outil disposant d’un montage vidéo**

Ce brief concerne le film assemblé. Dans le champ Prompt du Space Hugging Face, utiliser séparément les six blocs de [PROMPTS-HF.md](PROMPTS-HF.md).

```text
Réalise une publicité produit de 30 secondes pour HSentinel, destinée aux CTO et cofondateurs techniques de startups SaaS B2B de 10 à 50 salariés. Objectif : obtenir une demande d’essai accompagné sur un parcours critique.

Idée centrale : « Votre prochaine release, preuves à l’appui. » HSentinel réunit QA fonctionnel et pentest ciblé sur les contrôles d’accès. Des agents utilisent l’application dans un navigateur ; le code contrôle les résultats et le rapport permet de consulter les preuves. Le temps d’ingénierie récupéré est le bénéfice recherché ; aucun gain chiffré n’est encore démontré chez un client.

Construis six séquences de cinq secondes : répétition des vérifications ; révélation de la console et de ses deux modes ; parcours QA ; contrôle d’accès entre deux comptes ; rapport avec preuves ; offre et CTA. Donne le même poids visuel au QA et au pentest.

Direction artistique : animation produit cinématographique, fond graphite #0b0e14, panneaux #111722, texte #e6e9ef, accent bleu #3b82f6. Utilise des volumes sobres, des reflets maîtrisés et de légers mouvements de caméra. Les états du produit gardent leurs couleurs : vert #49d08b pour un résultat validé, corail #ff5a52 pour un défaut établi, ambre pour un résultat non concluant. Le sujet reste le logiciel et son usage. Chaque animation doit aider à comprendre une action ou une preuve.

Intègre les captures réelles fournies comme calques lisibles. Conserve le sens et le statut de chaque résultat. Pour le pentest, utilise un essai du banc Paie Express, avec la mention « Démo · défaut injecté ». Les visuels de principe portent « Démonstration · données fictives ». Si une capture manque, garde un emplacement identifié dans le projet de montage ; n’invente pas un résultat client.

Fais apparaître le véritable logo HSentinel dès les premières secondes et sur le carton final. Ajoute tous les textes, captures, chiffres et logos au montage. Les clips génératifs fournissent les fonds animés et les transitions.

Voix off française, naturelle, rythme posé :
0–5 : « Nouvelle release. Les parcours et les accès restent à revérifier. »
5–10 : « HSentinel réunit QA et pentest dans votre console. »
10–15 : « QA : décrivez le parcours. L’agent l’exécute à l’écran. »
15–20 : « Pentest : testez les accès entre comptes, sur un périmètre défini. »
20–25 : « Vous récupérez les étapes, les captures et les résultats. »
25–30 : « HSentinel. Premier parcours QA offert. Voyez les preuves. »

Carton final : « Premier parcours QA offert » ; « 1 application · 1 parcours · rapport inclus » ; CTA unique « Réserver mon essai ». Il s’agit de l’offre de lancement proposée. Si la gratuité n’est pas retenue, utiliser « Réservez une démonstration sur votre parcours critique » et le CTA « Réserver ma démo ».

Une bande musicale instrumentale continue, autour de 105 BPM, et quelques clics discrets accompagnent le film. Sous-titre intégralement la voix ; la publicité doit rester intelligible sans le son. Maintiens le CTA au moins trois secondes. Livrable principal : 1920 × 1080, 24 i/s. Prépare une recomposition 1080 × 1350 pour le fil LinkedIn en réorganisant les panneaux et les textes.

Les fonctionnalités représentées sont celles du prototype : QA guidé, contrôles d’accès ciblés, navigation visible et rapports. Les délais garantis, la sécurité exhaustive, la conformité certifiée, le pentest profond universel, le T1 sur sites réels, l’analyse du code et l’automatisation instantanée ne font pas partie de cette offre filmée.
```

**Version courte de 15 secondes**

Utiliser le parcours QA pendant 5 s, le contrôle d’accès pendant 5 s, puis le rapport et le carton final pendant 5 s. Afficher le logo dès la première image.

> « Vos parcours fonctionnent ? Les accès sont bien limités ? HSentinel vérifie et vous montre les preuves. Découvrez votre premier parcours QA offert. »

Même offre, même périmètre, même destination. Les interrogations sont une accroche publicitaire à tester ; aucun résultat commercial n’est présumé.

**Variante si la gratuité n’est pas retenue**

Dernière phrase : « HSentinel. Réservez une démonstration sur votre parcours critique. »

Carton : « Voyez HSentinel sur votre parcours critique. » Bouton : « Réserver ma démo ».
