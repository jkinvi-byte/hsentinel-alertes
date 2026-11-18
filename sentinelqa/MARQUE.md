# HSentinel : la marque

> **Ce fichier fait foi** pour chaque texte, nom et choix visuel de HSentinel (anciennement SentinelQA) : la web app, le rapport, le pitch et les posts. On le lit avant d'écrire, et chaque décision validée y entre dans la même passe.
> Légende : **[validé]** = décidé par l'équipe ou par Aurian ; **[proposé]** = proposition de Claude, à valider.

## Le nom et la promesse

- **Le nom : HSentinel** [validé : rubrique « Nom » de Notion, modifiée le 17/11 à 14 h 52 ; confirmé par Aurian à 14 h 55, « le projet devient HSentinel »]. Il s'écrit en un mot, le H et le S en capitales.
  - **L'ancien nom, SentinelQA** (16-17/11), reste dans les identifiants techniques réels, qu'on ne renomme pas : le dossier `sentinelqa/`, les agents `sentinelqa-explorateur` et `sentinelqa-verificateur`, la clé `~/.config/sentinelqa/`.
  - **Le logo en lettres** [proposé, 17/11, PDF de l'architecture] : HSENTINEL en Schibsted Grotesk, en capitales espacées ; le H en gris doux et SENTINEL à l'encre, comme QA l'était dans SENTINEL QA.
  - **Reste à renommer** : la web app (logo et textes), `sentinelqa/README.md`, les fiches 04 et 05, et le « En bref » de la page Notion, qui dit encore SentinelQA.
- **Le slogan, formule gelée** [validé] : « Votre IA code vite. Notre agent prouve ce qui fuit. » Aurian l'a gardé pour la couverture du PDF de l'architecture (17/11).
  - Un second slogan figure sur Notion depuis le 17/11 à 14 h 31 : « Ça marche. Et ça ne fuit pas. ». Il n'a pas été retenu pour la couverture : « ça marche » promet un test fonctionnel que l'architecture n'a pas [à trancher en équipe].
  - Depuis le 18/11, le volet QA fait du test fonctionnel, exécuté en réel : l'objection à « ça marche » ne tient plus. Le choix du slogan reste à l'équipe.
- **La cible** [validé] : le CTO et le lead developer de startups SaaS B2B qui vendent à des grands comptes.
- **La promesse** [validé] : une preuve rejouable pour chaque faille, sur une préproduction, avec des comptes de test.

## Les chiffres canon

On ne les cite jamais avec un autre nombre. Une surface qui veut faire court reformule sans renuméroter.

- **Les trois thèmes de failles** [validé] :
  - **Lecture** : un compte lit les données d'une autre entreprise ;
  - **Écriture** : un compte modifie les données d'une autre entreprise ;
  - **Admin** : un compte dépasse son rôle.
- **Les deux agents** [validé] : **l'explorateur** (`sentinelqa-explorateur`) et **le vérificateur** (`sentinelqa-verificateur`).
- **Les quatre temps d'un audit** [proposé] : **Cartographie**, **Rejeux**, **Preuves**, **Rapport**.

## Le lexique

| On dit | Ce que ça veut dire | On ne dit jamais |
|---|---|---|
| **faille prouvée** | Le rejeu **et** l'agent l'ont confirmée. | « vulnérabilité détectée » ; « faille » pour un simple signal |
| **suspicion** | Le rejeu la signale, mais aucun agent ne l'a encore confirmée. | « alerte », « faille probable » |
| **preuve**, **replay** | Le replay de la session H, étape par étape, avec ses captures. | « vidéo » (erreur déjà commise le 16/11) |
| **contrôle sain** | Une ressource bien protégée, qui mesure les faux positifs. | « test réussi » |
| **vérité terrain** | Les failles injectées et documentées avant l'audit. | « solution », « corrigé » |
| **compte de test**, **coffre** | Les identifiants d'audit, rangés dans un coffre H : l'agent ne les voit jamais. | « mot de passe de l'agent » |
| **préproduction** | Le seul terrain d'audit. | « production », « site du client » |
| **demande d'audit**, **cadrage** | Ce que le client remplit dans la web app : l'URL, les trois comptes, les pages interdites, le feu vert. | « ticket », « job » |
| **attestation** | La case obligatoire où le client atteste être autorisé à tester sa préproduction (art. 323-1 du Code pénal). | « conditions », « disclaimer » |
| **gravité** | Le classement d'une faille prouvée (critique, élevée, moyenne, faible), calculé par une règle écrite et déterministe (`runner/gravite.py`) : qui accède, pour lire ou modifier, et quelles données. | « sévérité », « score de risque » |
| **cartographie** | Le parcours de l'application par l'explorateur, en cliquant. | « scan », « crawl » |
| **volet QA** | Le test fonctionnel d'un site autorisé : un parcours dicté ou une exploration bornée, joués par l'agent H et vérifiés par le code [D-25 et D-26, Aurian, 18/11 ; remplace la définition du 17/11, « cartographie, rejeu, preuve »]. | « scan », « crawl », « QA » pour un audit de sécurité |
| **parcours guidé** | La consigne de l'utilisateur, tapée ou dictée, découpée en étapes et en critères que l'on relit avant le lancement [proposé, 18/11]. | « scénario automatique », « script » |
| **exploration bornée** | Sans consigne : l'agent ouvre le menu principal, 6 pages au plus, et relève les problèmes visibles [proposé, 18/11]. | « exploration libre », « crawl » |
| **critère** | Un résultat attendu, d'un type que le code sait vérifier : page atteinte, texte exact, constat cité [proposé, 18/11]. | « test », « assertion » à l'écran |
| **citation** | Le texte que l'agent copie mot pour mot ; le code le retrouve dans la page, sinon le constat ne compte pas [proposé, 18/11]. | « preuve » pour une simple phrase de l'agent |
| **conforme**, **écart constaté** | Un verdict QA prouvé par le code (page, texte, citation, erreur HTTP) [proposé, 18/11]. | « test réussi », « bug » sans preuve |
| **écart signalé · à confirmer** | L'agent voit un écart et le cite, mais le code ne peut pas le prouver : il reste non concluant [proposé, 18/11]. | « écart » tout court |
| **dictée** | La consigne dite au micro, transcrite par Hugging Face dans le même champ que la saisie, modifiable avant le lancement [proposé, 18/11]. | « commande vocale » : l'agent n'obéit pas à la voix en direct |
| **volet Pentest** | La recherche en profondeur, régulière ou avant un gros contrat : l'explorateur cherche en attaquant, guidé par Hugging Face [Notion, 17/11]. | « remplace un pentest » |

**Les promesses interdites** : « 100 % sécurisé », et « remplace un pentest » ou « remplace un audit ». SentinelQA complète un audit humain, il ne le remplace pas (CLAUDE.md, §9).

## La voix [proposé]

- **Clinique et précise**, comme un instrument de mesure. Chaque phrase porte un fait ou un chiffre, et on ne cherche jamais à faire peur.
- Une faille se dit comme un constat : « Faille prouvée. Le compte B lit la fiche de paie n° 1041 d'Alpha Conseil. »
- Les nombres s'écrivent en chiffres, avec leur unité : 3 / 6, 0,113 $, 166 s.

## La direction artistique

- **Les consignes d'Aurian** [validé, 17/11] :
  - une interface vraiment futuriste, épurée, blanche, presque scientifique : une grande salle blanche avec un microscope au centre ;
  - époustouflante et immersive, pas une application ordinaire ;
  - des encadrés qui défilent, une UX presque comme dans les épisodes de *Black Mirror* ;
  - peu d'informations à la fois : un clic mène au détail (une date, un critère donnent une liste) ;
  - des boutons soignés ;
  - une petite référence à la « sentinelle ».
- **Le concept : « La salle blanche »** [validé, 17/11, dans la DA de LEVELS demandée par Aurian] :
  - une salle sans murs, d'un blanc de laboratoire froid (le blanc du premier microscope), au sol continu : aucune grille, seulement les ombres douces ;
  - au centre, le microscope de la Sentinelle sur une paillasse, peint une fois en SVG plat et immobile (« un lieu, pas une liste », charte LEVELS §0) : blanc froid, oculaire et objectif noirs, une bande rouge sur l'objectif, comme le code couleur gravé sur un vrai objectif. La 3D a été rejetée (« modélisation 3D pour des maths ») ;
  - sur la lame de verre, l'application examinée : un fin trait rouge par faille prouvée, gris pour une faille manquée, comme des repères de mesure ; dans le suivi en direct, chaque preuve fait éclore son trait ;
  - les relevés gravés sur le chant de la paillasse (Lecture 3/3, Écriture 1/1, Admin 2/2) : une étiquette se grave sur le décor au lieu de le masquer ; un clic mène au thème ;
  - une entrée unique : la paillasse apparaît, le microscope se pose, la lumière tombe d'en haut, puis les traits s'inscrivent sur la lame et les relevés se gravent ; ensuite, plus rien ne bouge.
- **Les cartes** [validé, 17/11] : matière mate, filet fin, rayon de 20 px (LEVELS §1). Le verre brillant a été abandonné avec la 3D.
- **Les boutons** [validé, 17/11] : la recette de LEVELS (`.btn`) transposée en blanc : rectangles à 14 px de rayon, capitales espacées, un ressort au survol, un appui qui s'enfonce. L'action principale est d'encre ; les autres sont posées sur la salle. Cibles de 44 px. Les pilules noires et les capsules de verre ont été rejetées.
- **Interdit : les ronds colorés** [validé, Aurian, 17/11] : ni pastille de statut, ni puce de couleur, ni halo, ni lentille ou œil décoratif, ni jauge circulaire. Un état se dit par le texte, la typographie, un trait ou des crans.
- **Interdit : les carreaux** [validé, Aurian, 17/11] : ni quadrillage au sol, ni papier millimétré, ni damier de petits carrés.
- **La sentinelle** : le relevé s'appelle « Relevé de la sentinelle », et la barre du haut affiche « Sentinelle en veille », en texte seul.
- **Le garde-fou** [validé] : les chiffres clés (failles prouvées, fausses alertes, coût) restent lisibles d'un coup d'œil, et le mouvement ne masque jamais une information.
- **Les couleurs** [validé, 17/11] : le blanc froid de la salle (celui du premier microscope, repris à la demande d'Aurian), l'encre bleutée pour le texte, et un seul signal, le rouge, pour la faille prouvée. Chaque couleur garde un seul sens, partout.

  | Sens | Couleur |
  |---|---|
  | La salle | blanc pur en haut, `#f5f6f8`, horizon `#eef1f5`, sol `#e6eaf0` qui s'éclaircit vers l'avant `#f6f7f9` |
  | Le texte | encre `#0e1116`, secondaire `#3f4652`, doux `#6b7383` |
  | Faille prouvée, bande de l'objectif | rouge signal `#e2312b` |
  | Ressource protégée, contrôle sain (texte seulement) | vert `#1d8a52` |
  | Focus clavier | bleu `#2459e6` |

- **La gravité** [validé, 17/11] : une jauge de 4 crans, en rouge « faille prouvée », et une barre de bilan en segments droits (du rouge plein au rouge pâle). Le niveau est écrit en toutes lettres, avec ses raisons tirées de la règle (« Pourquoi critique »).
- **Hugging Face** [validé, 17/11] : il est toujours présenté comme « hors du verdict ». Dans le volet QA, il prépare le plan et transcrit la dictée ; il ne juge aucun critère [18/11]. Ses propositions sont recoupées avec les failles prouvées : « justes » pour la précision, « failles vues venir » pour le rappel.
- **Les typographies** [validé, 17/11] : Schibsted Grotesk pour les titres et le logo, Instrument Sans pour le texte, Martian Mono pour les annotations et les chemins. Rejetées : Space Grotesk et Inter (vues partout), Syne (trop « jeu »), Instrument Sans semi-condensée avec IBM Plex Mono.
- **Le mouvement** [validé] :
  - n'animer que la transformation et l'opacité ;
  - la scène est peinte une fois ; seule une preuve qui arrive pendant le suivi en direct fait entrer son trait (clés stables) ;
  - mettre en pause les défilements quand l'onglet est caché, qu'on les survole ou après trois minutes sans geste ;
  - respecter le réglage « réduire les animations » du système (fable-fps).
