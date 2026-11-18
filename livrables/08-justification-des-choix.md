# HSentinel : pourquoi nos choix (registre des décisions)

> Le suivi du projet : chaque décision, ce qu'on a écarté, pourquoi, et sur quelles preuves.
> **Il se tient à jour à chaque décision** (règle n°12 du §0 du CLAUDE.md). Le §8 du CLAUDE.md dit **où en est** le projet ; ce registre dit **pourquoi**.
> **Les niveaux de preuve** : *lu* (page ouverte et lue), *mesuré* (nos audits), *hypothèse* (à confirmer en entretien ou par la mesure).
> **Les statuts** : **validé** ; **à valider** ; **écarté** ; **remplacé par D-xx**.

## Comment ajouter une décision

```
### D-xx · Titre court
- Date, qui :
- Décision :
- Alternatives écartées :
- Pourquoi :
- Preuves (avec leur niveau) :
- Statut :
```

Une décision qui en annule une autre fait passer l'ancienne au statut « remplacé par D-xx ». On ne supprime jamais une entrée.

## Index

| N° | Décision | Statut |
|---|---|---|
| D-01 | Faire un pentest de la couche application, plutôt que Pli ou Portier | Périmètre exclusivement sécurité remplacé par D-25 |
| D-02 | Viser le CTO d'une startup SaaS B2B qui vend à des grands comptes | Validé, à confirmer en entretien |
| D-03 | Tester le contrôle d'accès entre comptes, plutôt que les autres familles de pentest | Validé |
| D-04 | Trois thèmes : lecture, écriture, admin | Validé |
| D-05 | Un verdict par rejeu HTTP et preuve à l'écran, jamais par une IA seule | Validé |
| D-06 | Deux agents H sur mesure et un coffre par compte de test | Validé |
| D-07 | Un cobaye SaaS B2B construit par nous, pas LEVELS | Conservé pour le banc ; cible de démo remplacée par D-24 |
| D-08 | Le cadrage dans la web app, avec des mots de passe chiffrés dans le navigateur | Validé |
| D-09 | Supabase pour les données | Validé |
| D-10 | Hugging Face dans deux rôles | Remplacé en partie par D-11 et D-16 |
| D-11 | Une gravité par règle écrite et déterministe | Validé |
| D-12 | Le nouveau test : « les droits changent, mais un accès reste » | À valider en équipe ; rangé dans le volet Pentest (D-22) |
| D-13 | Le retest après correction | Écarté |
| D-14 | Une architecture où le code décide et les agents montrent | Proposition ; exclusion du QA fonctionnel remplacée par D-25 |
| D-15 | n8n pour les déclencheurs, l'accord humain et les alertes | À valider en équipe ; W2 remplacé par D-21 |
| D-16 | Hugging Face utile : des variantes testées, l'explication en clair | Remplacé par D-23 |
| D-17 | Héberger le cobaye sur Vercel | À valider en équipe |
| D-18 | La direction artistique : la salle blanche, dans la DA de LEVELS | Validé |
| D-19 | Des résultats compréhensibles par un non-technicien | Validé |
| D-20 | Le nom : HSentinel | Validé |
| D-21 | Le feu vert aux écritures se donne au cadrage, plus dans Slack | Validé |
| D-22 | Deux volets : le QA à chaque mise à jour, le Pentest en profondeur | QA=T0 remplacé par D-25 ; T1 hors sites réels selon D-24 |
| D-23 | Hugging Face guide le Pentest, et le rejeu teste chaque route qu'il nomme | À valider en équipe |
| D-24 | Démo sur le site public Eugenia et Peer Review, autorisés, sans écriture | Validé par Aurian ; adaptation technique à faire |
| D-25 | Réduire le temps de QA ; priorité aux parcours sur sites réels | QA fonctionnel confirmé ; hiérarchie QA/pentest corrigée par D-26 |
| D-26 | QA et pentest : deux volets de même importance | Confirmé par Aurian ; plan documentaire corrigé |
| D-27 | Commencer l'implémentation à partir de l'architecture | Demandé par Aurian ; premier lot codé et testé localement, validation réelle à poursuivre |
| D-28 | Raccorder les missions réelles à des agents H persistants | Code et tests locaux prêts ; enregistrement distant bloqué avant la réponse H |
| D-29 | Passer la contribution à Claude et vérifier les raccordements actuels | Demandé par Aurian ; dossier de contribution locale, aucune validation distante |

---

### D-01 · Faire un pentest de la couche application, plutôt que Pli ou Portier
> Le périmètre exclusivement sécurité est remplacé par D-25. Le pentest reste un volet du produit ; les alternatives Pli et Portier ne sont pas réactivées.
- **Date, qui** : le 16/11, par l'équipe (Notion « Checkpoint 1 », V2).
- **Décision** : un agent computer-use qui teste la sécurité d'une application web, à chaque version.
- **Alternatives écartées** :
  - **Pli**, les marchés publics pour les TPE du BTP : archivé, faute de SIRET réel pour PLACE et à cause de l'application locale de dépôt ;
  - **Portier**, la gestion des accès SaaS : gardé en plan B. Le mécanisme « l'agent apprend une app » est déjà très représenté dans le showcase, et AccessOwl comme Cerby occupent le terrain.
- **Pourquoi** :
  - le pentest et la sécurité offensive étaient libres dans le showcase au 16/11 ;
  - les tests qui raisonnent comme un attaquant restent manuels et ponctuels ;
  - la sécurité offre un résultat chiffrable : des failles prouvées, des fausses alertes, un coût.
- **Preuves** :
  - la compilation du showcase, 67 agents (*lu*, `contexte/02-showcase-h.md`) ;
  - l'exigence 11.4 de PCI DSS : retester après un changement significatif (*lu*, guide Blaze, et non le texte PCI lui-même).
- **Statut** : périmètre exclusivement sécurité remplacé par D-25 ; pentest conservé comme volet.

### D-02 · Viser le CTO d'une startup SaaS B2B qui vend à des grands comptes
- **Date, qui** : le 16/11, par l'équipe (Notion V2).
- **Décision** : l'acheteur est le CTO ou le lead developer d'un SaaS B2B qui vend à des grands comptes.
- **Alternatives écartées** : le RSSI d'une grande entreprise régulée, du plan A initial. Son cycle de vente est long, et il passe par des cabinets qualifiés PASSI.
- **Pourquoi** :
  - ce CTO livre vite ;
  - une fuite entre clients peut lui coûter un contrat grand compte ;
  - il décide vite.
- **Preuves** : *hypothèse*. Aucun entretien n'est fait pour l'instant ; 3 sont prévus.
- **Statut** : validé, à confirmer en entretien.

### D-03 · Tester le contrôle d'accès entre comptes, plutôt que les autres familles de pentest
- **Date, qui** : les 16 et 17/11, par l'équipe, confirmé par la note de recherche.
- **Décision** : tester les failles de contrôle d'accès. Un compte voit ou modifie ce qu'il ne devrait pas, entre entreprises ou entre rôles.
- **Alternatives écartées, et pourquoi** :

  | Famille | Pourquoi on ne la prend pas |
  |---|---|
  | Injections, XSS, failles techniques connues | Les scanners et la revue de code les couvrent déjà. Un agent qui voit l'écran n'y apporte rien de décisif. |
  | Configuration du cloud | AWS expose une API d'analyse des permissions (*lu*, note) : une API fait le travail, ce qui viole notre exigence n°1. |
  | Secrets, dépendances vulnérables, services exposés | Ils s'analysent dans les fichiers et les protocoles, sans navigateur. |
  | Hameçonnage | Le risque est réel (*lu*, Cybermalveillance 2025), mais produire des simulations ne demande pas de computer use. |
  | Mots de passe faibles | Les outils d'identité s'en chargent directement. |
- **Pourquoi** :
  - le contrôle d'accès dépend des rôles, des comptes et des parcours : il faut naviguer comme un utilisateur ;
  - le contrôle d'accès défaillant est n°1 du Top 10 OWASP 2025 ;
  - c'est 20 % des constats présentés par Cobalt pour le secteur logiciel. C'est une part des constats chez ses clients, pas une part d'entreprises vulnérables.
- **Preuves** :
  - OWASP 2025 (*lu*) ;
  - Cobalt (*lu*, note de recherche) ;
  - l'objection Autorize : elle rejoue déjà des requêtes avec d'autres droits, mais un humain doit naviguer (*lu*, README).
- **Statut** : validé.

### D-04 · Trois thèmes : lecture, écriture, admin
- **Date, qui** : le 17/11 à 0 h 30, par Aurian.
- **Décision** :
  - B lit les données de A ;
  - B modifie les données de A ;
  - un salarié C atteint l'administration.
- **Alternatives écartées** : la lecture seule, celle de la v0.
- **Pourquoi** :
  - couvrir la confidentialité, l'intégrité et l'élévation de privilèges ;
  - l'écriture ne touche que des données de test, avec un feu vert humain et une remise en état.
- **Preuves** : 10 audits, 59 failles prouvées sur 60, 0 faux positif (*mesuré*).
- **Statut** : validé.

### D-05 · Un verdict par rejeu HTTP et preuve à l'écran, jamais par une IA seule
- **Date, qui** : le 16/11 (v0), confirmé par l'équipe le 17/11.
- **Décision** : une faille est prouvée si le rejeu HTTP la signale **et** si l'agent la confirme à l'écran.
- **Alternatives écartées** :
  - la seule parole de l'agent ;
  - un LLM qui juge.
- **Pourquoi** : le résultat doit être reproductible et sans faux positif. Le premier audit v0 avait échoué parce que le verdict reposait sur des mots reformulés par l'agent.
- **Preuves** : 0 faux positif sur les contrôles sains, dans tous les audits (*mesuré*).
- **Statut** : validé.

### D-06 · Deux agents H sur mesure et un coffre par compte de test
- **Date, qui** : le 17/11 à 0 h 30, par Aurian.
- **Décision** : les agents `sentinelqa-explorateur` et `sentinelqa-verificateur`, créés par l'API, avec un coffre interne par compte.
- **Alternatives écartées** : l'agent prêt à l'emploi `h/web-surfer-flash`, celui de la v0.
- **Pourquoi** :
  - des consignes et un format de réponse maîtrisés ;
  - le mot de passe n'entre jamais dans le contexte du modèle ;
  - un usage visible de l'Agents API, qui pèse 30 % de la note.
- **Preuves** : aucun mot de passe dans les événements des sessions (*vérifié*).
- **Statut** : validé.

### D-07 · Un cobaye SaaS B2B construit par nous, pas LEVELS
- **Date, qui** : le 17/11 à 0 h 50, par Aurian.
- **Décision** : Paie Express, un SaaS de paie multi-entreprises, avec des failles documentées.
- **Alternatives écartées** :
  - **LEVELS** : c'est une application grand public, sans rôle admin. Elle n'a qu'un projet Firebase, celui de production, et ses données passent par le SDK Firestore ;
  - **une application tierce** : il faut une autorisation écrite (§9 du CLAUDE.md).
- **Pourquoi** :
  - ressembler aux applications de la cible ;
  - n'attaquer que ce qu'on contrôle (art. 323-1 du Code pénal).
- **Preuves** : les conditions de LEVELS, relevées dans son code (*lu*, §8 du CLAUDE.md).
- **Statut** : conservé pour le banc interne ; remplacé par D-24 pour le choix des cibles de la démo. L'ancienne décision est conservée ci-dessus comme historique.

### D-08 · Le cadrage dans la web app, avec des mots de passe chiffrés dans le navigateur
- **Date, qui** : le 17/11 au matin, par Aurian (le « parcours B »).
- **Décision** : le CTO saisit ses comptes de test dans la web app. Le navigateur chiffre les mots de passe avec la clé publique du runner ; le runner déchiffre, audite, puis efface.
- **Alternatives écartées** :
  - des mots de passe stockés en clair ;
  - une saisie directe dans les coffres H par le client.
- **Pourquoi** : la base ne voit jamais un mot de passe.
- **Preuves** : seul le texte chiffré est dans Supabase, et il est effacé après l'audit (*vérifié*).
- **Statut** : validé.

### D-09 · Supabase pour les données
- **Date, qui** : le 17/11 à 0 h 30, par Aurian.
- **Décision** : Postgres, Realtime, Auth et Storage dans un seul service.
- **Alternatives écartées** :
  - les fichiers JSON locaux de la v0 ;
  - Airtable ou Google Sheets.
- **Pourquoi** :
  - une vraie base avec isolation par RLS ;
  - le temps réel pour le fil ;
  - c'est le domaine du CDO.
- **Preuves** : le RLS est vérifié dans les deux sens. La clé publishable ne voit rien (*vérifié*).
- **Statut** : validé.

### D-10 · Hugging Face dans deux rôles
- **Date, qui** : le 17/11 au matin, par Aurian (« les deux »).
- **Décision** : avant les rejeux, proposer des attaques ; après les preuves, classer la gravité.
- **Pourquoi** : Hugging Face est obligatoire (slide 10, *lu*).
- **Ce qui s'est passé** :
  - le rôle « gravité » a été remplacé par la règle de D-11, parce que la gravité du LLM était instable ;
  - la revue a montré que les hypothèses ne déclenchent aucun test : D-16 corrige ce point.
- **Statut** : remplacé en partie par D-11 et D-16.

### D-11 · Une gravité par règle écrite et déterministe
- **Date, qui** : le 17/11, par Aurian (« il faut une règle déterministe »).
- **Décision** : `sentinelqa/runner/gravite.py`. Le niveau dépend de qui accède, de la nature de l'accès (lire ou modifier) et des données touchées, détectées dans la page reçue au rejeu.
- **Alternatives écartées** :
  - la gravité classée par le LLM ;
  - un score CVSS calculé à la main (possible plus tard).
- **Pourquoi** : la même page doit toujours recevoir la même gravité, avec des raisons qu'on peut défendre.
- **Preuves** :
  - avec le LLM, les 10 pages ont toutes changé de niveau au moins une fois sur 5 audits (*mesuré*) ;
  - avec la règle, le banc de 9 cas passe, et la gravité est stable sur 14 audits (*mesuré*).
- **Statut** : validé.

### D-12 · Le nouveau test : « les droits changent, mais un accès reste »
- **Date, qui** : le 17/11. Recommandé par la note de recherche, retenu dans l'architecture proposée.
- **Décision** : après une rétrogradation, un retrait d'organisation ou le retrait d'un partage, vérifier que l'ancienne session, les exports, les pièces jointes, les actions ouvertes et les anciens liens sont bien coupés.
- **Alternatives écartées, et pourquoi** :

  | Piste de la note | Pourquoi on ne la prend pas |
  |---|---|
  | Le retest après correction | Pas validé par l'équipe (D-13) |
  | Le contournement d'une règle métier | Le client doit fournir la règle ; c'est une seule règle à la fois. Gardé pour plus tard. |
  | La vérification des départs dans les SaaS | De l'exploitation informatique plus que du pentest ; Cerby et AccessOwl l'outillent déjà (c'était le plan B, Portier) |
  | Les partages excessifs et les assistants IA | Les outils natifs de Microsoft couvrent déjà le sujet (*lu*, note) |
  | La reprise après restauration | Il faudrait un environnement restaurable : trop lourd en 4 jours |
  | La récupération de compte | Les e-mails de test et la double authentification coûtent plus cher que le parcours |
- **Pourquoi** :
  - c'est là que le computer use est indispensable : changer un rôle ou retirer un membre passe par les écrans d'administration de chaque application ;
  - le verdict reste déterministe, par le rejeu avant et après ;
  - c'est notre réponse à Autorize : il rejoue des requêtes, mais il ne prépare pas les états.
- **Preuves** :
  - Microsoft : une application peut garder sa propre session, qu'Entra ne révoque pas directement (*lu*, note) ;
  - l'avis Grafana CVE-2026-11817 : une fuite de métadonnées de permissions entre organisations (*lu*, note) ;
  - le gain sur un script et sur Autorize reste une *hypothèse* à mesurer.
- **Statut** : à valider en équipe ; rangé dans le volet Pentest (D-22).

### D-13 · Le retest après correction
- **Date, qui** : le 17/11, non validé par un coéquipier.
- **Décision** : ce n'est pas un test retenu cette semaine.
- **Ce qu'il apportait** : rejouer une faille connue sur la version corrigée et produire la preuve de clôture.
- **Pourquoi il est écarté** :
  - un coéquipier ne l'a pas validé ;
  - la note elle-même avertit que le retest n'est pas prouvé comme principal goulot d'étranglement (*hypothèse*) ;
  - une simple requête de reproduction suffit souvent.
- **Statut** : écarté. À rouvrir si les entretiens montrent un besoin (cabinet de pentest).

### D-14 · Une architecture où le code décide et les agents montrent
> L'exclusion d'un agent de QA fonctionnel est remplacée par D-25. Le découpage entre observations, assertions et preuves reste pertinent ; son implémentation pour le QA est proposée dans le document 09.
- **Date, qui** : le 17/11. Proposition de Claude, qui répond à la proposition « Agent QA + Agent PE ».
- **Décision** :
  - un orchestrateur en Python choisit les scénarios par règles, rejoue et décide ;
  - les agents H explorent, préparent et prouvent ;
  - Hugging Face propose et explique ;
  - n8n relie les outils.
- **Alternatives écartées** :
  - **tirer un pentest au hasard dans Supabase** : on ne peut alors plus comparer deux versions, ni mesurer un taux de détection ;
  - **un agent H qui clique dans Supabase pour choisir** : la base a une API, ce qui viole notre exigence n°1, et coûte des steps ;
  - **un agent qui attaque et diagnostique** : ce n'est pas reproductible, et un LLM est instable (D-11) ;
  - **un agent QA à part** : le test fonctionnel est très représenté dans le showcase. Il devient l'agent Préparateur.
- **Ce qu'on garde de la proposition** :
  - le découpage choisir, attaquer, diagnostiquer ;
  - le catalogue de tests dans Supabase ;
  - les sous-agents H en parallèle.
- **Preuves** : *mesuré* (D-05, D-11) ; l'exigence n°1 (§1 du CLAUDE.md).
- **Statut** : proposition historique ; exclusion du QA fonctionnel remplacée par D-25.

### D-15 · n8n pour les déclencheurs, l'accord humain et les alertes
- **Date, qui** : le 17/11. Proposition, le workflow revient à Aziz (CAO).
- **Décision** :
  - **W1** : une mise en ligne (Vercel ou GitHub) déclenche un audit ;
  - **W2** : le feu vert humain aux écritures se donne dans Slack ;
  - **W3** : une faille prouvée envoie une alerte, ouvre un ticket et commente la PR.
- **Alternatives écartées** :
  - tout coder dans le runner ;
  - déclencher par les webhooks H.
- **Pourquoi** :
  - relier des outils sans logique de verdict, c'est le rôle du no-code ;
  - les webhooks H signalent seulement qu'une session change d'état : le déclencheur vient de Vercel ou de GitHub (*lu*, erreur déjà commise le 16/11).
- **Statut** : à valider en équipe ; le feu vert dans Slack (W2) est remplacé par D-21.

### D-16 · Hugging Face utile : des variantes testées, l'explication en clair
- **Date, qui** : le 17/11, proposé après la revue des points faibles.
- **Décision** :
  - le LLM propose des variantes (un autre identifiant, un paramètre modifié, une action retentée après une rétrogradation), que le rejeu teste vraiment ;
  - il rédige aussi l'explication en clair, marquée « rédigé par IA ».
- **Alternatives écartées** : des hypothèses comparées après coup, sans effet sur l'audit, comme aujourd'hui.
- **Pourquoi** : un ingénieur de H verrait qu'une IA décorative ne sert à rien. Son apport doit se mesurer en failles trouvées grâce à elle.
- **Preuves** : aujourd'hui, ses hypothèses ne déclenchent aucun test (*lu*, code, `auditer`).
- **Statut** : remplacé par D-23.

### D-17 · Héberger le cobaye sur Vercel
- **Date, qui** : le 17/11, proposé après deux arrêts de la démo.
- **Décision** : déployer le cobaye et la web app sur Vercel.
- **Alternatives écartées** :
  - **le tunnel Cloudflare depuis le Mac** : le réseau de l'école bloque son port 7844 ;
  - **le partage de connexion du téléphone** : trop instable ;
  - **le tunnel par localhost.run** : préparé dans `demo.sh` en secours, pas encore testé.
- **Pourquoi** : la démo ne doit pas dépendre du réseau de la salle.
- **Preuves** : port 7844 bloqué, puis un `ReadTimeout` de Supabase qui avait arrêté le runner (*mesuré* le 17/11).
- **Statut** : à valider en équipe.

### D-18 · La direction artistique : la salle blanche, dans la DA de LEVELS
- **Date, qui** : le 17/11, par Aurian, au fil de ses retours.
- **Décision** :
  - une salle peinte en SVG plat : le microscope sur une paillasse, dans un blanc froid ;
  - les boutons et les cartes de LEVELS ;
  - Schibsted Grotesk pour les titres, Instrument Sans pour le texte, Martian Mono pour les annotations.
- **Alternatives écartées** :
  - le mode nuit façon *Black Mirror* ;
  - la page plate du « relevé » ;
  - le microscope en 3D, jugé « modélisation 3D pour des maths » ;
  - le verre brillant ;
  - les ronds colorés et les quadrillages (« ça pue l'IA ») ;
  - les polices Space Grotesk et Inter (vues partout), Syne (trop « jeu »), Instrument Sans semi-condensée avec IBM Plex Mono.
- **Pourquoi** : les consignes d'Aurian : futuriste, épuré, blanc, « époustouflant et immersif », pas une application ordinaire.
- **Preuves** : le détail est dans `sentinelqa/MARQUE.md`.
- **Statut** : validé.

### D-19 · Des résultats compréhensibles par un non-technicien
- **Date, qui** : le 17/11, par Aurian.
- **Décision** :
  - une carte par faille : qui peut faire quoi, pourquoi c'est grave, ce que l'agent a vu, comment c'est prouvé ;
  - une barre de bilan des gravités ;
  - le technique en annexe repliée.
- **Alternatives écartées** : une liste de chemins techniques, comme `/api/fiches-de-paie/1041`.
- **Pourquoi** : l'acheteur et le jury doivent comprendre la faille sans lire de code.
- **Statut** : validé.

### D-20 · Le nom : HSentinel
- **Date, qui** : le 17/11. La rubrique « Nom » de la page Notion passe à HSentinel à 14 h 52 ; Aurian le confirme à 14 h 55 (« oui le projet devient HSentinel »).
- **Décision** : le produit s'appelle HSentinel. Le slogan ne change pas : « Votre IA code vite. Notre agent prouve ce qui fuit. »
- **Alternatives écartées** :
  - **SentinelQA**, le nom du 16/11 (Notion V2) ;
  - **« Ça marche. Et ça ne fuit pas. »** en couverture du PDF de l'architecture. Ajouté sur Notion à 14 h 31, il promet un test fonctionnel que l'architecture n'a pas. Ce slogan reste à trancher en équipe.
- **Pourquoi** : c'est le choix de l'équipe sur Notion, confirmé par Aurian. La raison du nom n'est pas écrite sur la page.
- **Preuves** : la page Notion, relue le 17/11 à 14 h 54 par son API publique, avec la date de modification de chaque bloc (*lu*).
- **Ce qui suit** : les identifiants techniques gardent le préfixe `sentinelqa`. La web app, `sentinelqa/README.md`, les fiches 04 et 05 et le « En bref » de Notion restent à renommer.
- **Statut** : validé.

### D-21 · Le feu vert aux écritures se donne au cadrage, plus dans Slack
- **Date, qui** : le 17/11, par Aurian (« enlève la partie slack inutile »).
- **Décision** : le client autorise d'avance les écritures et les changements de droits, au cadrage, avec une case du formulaire et l'attestation. Le workflow W2 (le feu vert dans Slack) et la table `approbations` disparaissent. Slack ne sert plus qu'aux alertes (W3), à côté de l'e-mail.
- **Alternatives écartées** : le feu vert dans Slack, action par action (W2), proposé par Claude dans le 07 (D-15).
- **Pourquoi** :
  - la case du cadrage existe et fonctionne déjà, et le runner n'écrit pas sans elle (*lu*, `web/app/audits/nouveau/formulaire.js` et `runner/sentinelqa.py`) ;
  - un audit automatique qui attend un clic reste bloqué, et sans réponse, les tests d'écriture sautent ;
  - dans un pentest, l'autorisation se donne avant, par écrit, pour un périmètre précis ;
  - pour la démo, c'est une dépendance de moins (Slack, n8n, un webhook en direct).
- **Preuves** : le code (*lu*) ; le tableau de la stack sur Notion ne donne à n8n que les déclenchements et les alertes (*lu*).
- **Statut** : validé.

### D-22 · Deux volets : le QA à chaque mise à jour, le Pentest en profondeur
> L'assimilation du QA aux contrôles d'accès T0 et l'exclusion du test fonctionnel sont remplacées par D-25. D-24 exclut T1 des deux sites réels.
- **Date, qui** : le 17/11, sur la page Notion (16 h 01 à 16 h 12). Claude l'a repris à la demande d'Aurian (« ne prends les modifs de l'architecture que si c'est plus pertinent »).
- **Décision** :
  - le **volet QA**, à chaque mise à jour, en boîte noire : l'Explorateur cartographie, le rejeu vérifie (T0) ;
  - le **volet Pentest**, en profondeur, régulier ou avant un gros contrat : l'Explorateur explore librement, avec plus de steps et de temps et les priorités de Hugging Face, y compris après un changement de droits (T1) ;
  - la règle d'or ne change pas : les deux volets produisent des cibles, le rejeu signale, le Vérificateur prouve.
- **Pourquoi c'est plus pertinent** : le découpage parle à l'acheteur (une vérification rapide à chaque version, une recherche profonde avant un contrat grand compte), et il range T0 et T1 sans rien changer au verdict.
- **Ce qui n'est pas repris** :
  - **l'agent qui « vérifie que la nouvelle fonctionnalité marche »** (Notion, 14 h 23) : un test fonctionnel, absent de l'architecture de 16 h 12, et déjà très pris dans le showcase ;
  - **le retrait de T1 et du Préparateur** : Notion ne cite plus que l'Explorateur et le Vérificateur, mais son volet Pentest cherche lui-même « après un changement de droits ». Il faut donc un agent qui change le rôle par l'interface, et c'est là que le computer use est indispensable (D-12).
- **Preuves** : la page Notion, relue le 17/11 à 16 h 20 avec l'heure de modification de chaque bloc (*lu*).
- **Statut** : QA=T0 et exclusion du test fonctionnel remplacés par D-25 ; T1 et le Préparateur restent hors des sites réels selon D-24.

### D-23 · Hugging Face guide le Pentest, et le rejeu teste chaque route qu'il nomme
- **Date, qui** : le 17/11. Sur Notion, la version de 16 h 03 faisait lire le code à Hugging Face pour donner des routes au rejeu ; celle de 16 h 12 en fait le guide de l'Explorateur. Claude garde les deux.
- **Décision** : à partir de la cartographie et, si le client le permet, du code, Hugging Face classe où chercher en priorité. L'Explorateur y va en premier, et chaque route que Hugging Face nomme est aussi rejouée directement. Il rédige l'explication en clair, avec le fichier en cause quand le code est fourni.
- **Alternatives écartées** :
  - **les variantes de D-16**, devinées depuis la cartographie seule ;
  - **le guide seul** : son apport dépendrait du chemin de l'agent et ne se mesurerait pas proprement.
- **Pourquoi** : son apport doit se mesurer en failles trouvées grâce à lui. Le cobaye reçoit F7, une faille sur une route qu'aucun écran ne montre, et C5, son contrôle sain (Notion, 16 h 03).
- **Les risques** :
  - lire le code rapproche HSentinel de Shannon (*lu*, §8 du CLAUDE.md), et la différence reste la preuve à l'écran et le verdict déterministe ;
  - le code part chez le fournisseur du modèle : c'est une option, avec l'accord du client.
- **Statut** : à valider en équipe.

### D-24 · Démo sur des sites réels autorisés, sans écriture
- **Date, qui** : le 17/11/2026, par Aurian dans la conversation, en rapportant les réponses de cadrage données à Claude Code.
- **Décision** :
  - viser `https://www.eugeniaschool.com/` et `https://peer-review-black.vercel.app/etudiant` ;
  - retenir l'autorisation écrite du responsable, déclarée obtenue par Aurian ;
  - ne réaliser aucune écriture métier ni changement de droits sur ces cibles ;
  - préparer un volet QA et un volet Pentest, puis choisir le site de démonstration selon les résultats et la fiabilité.
- **Choix antérieurs remplacés pour ces cibles** : démonstration limitée au cobaye (partie de D-07), restriction générale à la préproduction et proposition de démontrer T1 en changeant un rôle. Paie Express reste un banc de calibration ; D-21 ne permet pas de réactiver les écritures sur les deux profils réels.
- **Pourquoi** : exercer le produit sur d'autres applications et préparer la démo demandée par l'équipe. Le transfert du runner hors du cobaye reste à réaliser et à mesurer.
- **Preuves** : décision explicite d'Aurian dans la conversation ; l'accord écrit lui-même n'a pas été relu lors de cette revue. Lecture du code consignée dans `livrables/09-guidelines-demo-sites-reels.md` (*lu*). Aucun résultat de pentest réel n'est revendiqué.
- **Recommandations distinctes de la décision** : QA fonctionnel de consultation pour le site public, contrôles d'accès en lecture pour Peer Review, profils de cibles, contrôle préalable du trafic et rapport à quatre états. Ces choix d'implémentation sont proposés dans le document 09.
- **Statut** : cadrage validé par Aurian ; adaptation technique à faire. D-07 est remplacé par D-24 pour le choix de la cible de démo, conservé pour le banc interne. D-12/T1 reste hors de la démo sur ces sites réels.

### D-25 · Réduire le temps de QA ; priorité aux parcours sur sites réels
> **Correction D-26 :** la priorité du QA sur le pentest et les termes « volet complémentaire » étaient une interprétation de l'assistant. Aurian précise que les deux volets sont équivalents. L'ordre technique ci-dessous est historique et remplacé par deux chantiers P0.
- **Date, qui** : le 17/11/2026, par Aurian dans la conversation, en relayant le cadrage de son chef de projet.
- **Décision confirmée** : le problème principal devient le temps passé par les startups sur le QA. Priorité à l'exécution du QA et des contrôles de sécurité sur des sites réels. Le QA inclut les parcours fonctionnels effectués par les agents H ; il ne se réduit plus aux tests d'isolation des données.
- **Source du cadrage** : Aurian indique explicitement que le problème actuel sur Notion est dépassé et sera mis à jour plus tard. Sa consigne prévaut dans l'intervalle.
- **Alternatives écartées par ce cadrage** : conserver le contrôle d'accès comme problème unique ; exclure le QA fonctionnel parce que des projets voisins existent ; privilégier des options d'interface avant le parcours réel.
- **Idées soumises à évaluation, sans validation d'implémentation** : voix pour décrire une mission, parcours guidé ou exploration QA sans instruction, lancement terminal et application.
- **Ordre recommandé dans cette revue** : d'abord une instruction texte et un parcours public dans la web app, avec attendu/observé, preuve, statut, durée et coût. Puis consultation authentifiée et contrôles de sécurité ciblés, sauvegarde/rejeu et HF réellement intégré. Voix et CLI client après ce socle, vers le même contrat de lancement. L'exploration QA reste bornée ; elle ne déclenche pas automatiquement le pentest.
- **Pourquoi** : l'exécution et la relecture des parcours portent la valeur du produit. La voix change la saisie ; une CLI change le canal de lancement. Leurs gains doivent être mesurés séparément.
- **Preuves** : instruction explicite d'Aurian ; code local (*lu*) : le runner impose encore le flux du cobaye et dispose déjà d'une entrée terminal. Capacités ASR et sortie structurée dans les documentations HF (*lu*, liens dans le document 09). Le temps gagné chez les startups reste une *hypothèse* à mesurer, pas une statistique acquise.
- **Décisions remplacées en partie** : D-01 pour le périmètre exclusivement sécurité, D-14 pour l'exclusion du QA fonctionnel, D-22 pour l'équivalence QA=T0. D-24 demeure applicable sans écriture métier ni changement de droits. Le ciblage commercial précis de D-02 et le slogan restent à revoir avec l'équipe.
- **Statut** : réintégration du QA fonctionnel confirmée ; hiérarchie QA/pentest et ordre technique remplacés par D-26. Aucune adaptation du code réalisée dans cette revue.

### D-26 · QA et pentest : deux volets de même importance
- **Date, qui** : le 17/11/2026, correction explicite d'Aurian dans la conversation.
- **Décision** : QA et pentest sont deux volets équivalents, chacun méritant toute l'attention de l'équipe. La priorité reste de les faire fonctionner sur des sites réels.
- **Interprétation corrigée** : l'assistant avait qualifié le pentest de complément et proposé de le faire après le parcours QA. Ce n'était pas une décision d'Aurian.
- **Conséquence recommandée** : deux chantiers P0 sur un socle partagé ; un parcours réel, un budget, des critères de fin et des preuves pour chaque volet. Préparer les préconditions du pentest dès le même stade que le QA. Le socle de démo n'est pas complet avec un seul volet.
- **Options communes** : HF pour les scénarios QA, la priorisation des contrôles de sécurité autorisés et les rapports ; voix et CLI client après le socle des deux volets. Un seul contrat de lancement, des scénarios et critères de preuve distincts.
- **Contraintes conservées** : D-24, deux cibles autorisées, sans écriture métier ni changement de droits. L'égalité des volets n'élargit pas le périmètre des opérations.
- **Preuves** : instruction explicite d'Aurian. Aucun nouveau résultat de QA ou de pentest réel n'est revendiqué.
- **Statut** : confirmé par Aurian ; CLAUDE.md et documents 06 à 09 corrigés. Code non modifié.

### D-27 · Commencer l'implémentation à partir de l'architecture
- **Date, qui** : le 18/11/2026, Aurian demande de mettre en œuvre le plan et rappelle que le cadrage est documenté dans l'architecture.
- **Décision** : commencer la construction en conservant l'égalité QA/pentest de D-26 et le périmètre de D-24.
- **Choix techniques du premier lot** : catalogue JSON partagé, demande et rapport versionnés dans `audits.rapport`, branche d'exécution distincte du cobaye, deux scénarios anonymes raccordés. Les scénarios authentifiés restent non exécutables tant que leurs préconditions et leur adaptateur ne sont pas établis.
- **Pourquoi** : livrer les entrées, exécuteurs et résultats des deux volets sans imposer la connexion du cobaye aux sites réels. Réutiliser la file existante évite une migration distante pour ce lot.
- **Choix écartés pour ce lot** : changement d'URL seul dans le runner historique, lancement des tests d'écriture sur les sites réels, conclusion de sécurité à partir d'une coquille 200 ou d'un avis de modèle seul.
- **Preuves** : code ajouté (*lu*) ; 20 tests Python et 10 tests JavaScript/routes réussis, build Next.js réussi (*mesuré*). L'essai réel QA s'arrête sur `ConnectError` avant l'obtention d'une session H ; le smoke navigateur rencontre `listen EPERM`. Ce sont des limites de validation, pas des résultats des sites.
- **Statut** : premier lot implémenté et testé localement ; socle réel complet de D-26 encore en cours. Aucun déploiement, audit authentifié ou succès de pentest réel revendiqué. Les commandes figurent dans `sentinelqa/README.md`.

### D-28 · Reprendre l'existant et enregistrer des agents QA et pentest dans H
- **Date, qui** : le 18/11/2026, Aurian demande ce qui a réellement été testé, constate l'absence de nouveaux agents H et fournit la conversation Claude Code `bb3ef312-f62f-4a9e-ae0b-e7ba3df422c7`.
- **Décision** : reprendre le socle déjà construit et rendre explicite la différence entre code local, tests simulés, agents enregistrés dans H et sessions réellement exécutées. Les nouveaux parcours référencent deux agents persistants ; les agents historiques restent disponibles pour le cobaye.
- **Choix d'implémentation** : `sentinelqa-qa` et `sentinelqa-pentest`, définis dans `runner/agents_missions.py`, créés ou actualisés via le SDK puis relus avant confirmation. `--preparer-agents` prépare les deux agents sans lancer de navigateur. Chaque mission vérifie aussi son agent avant de le lancer par son nom. Seul un GET 404 autorise la création ; un refus d'authentification ou une panne réseau ne devient pas une absence d'agent.
- **Alternative remplacée** : les agents définis uniquement en ligne dans les sessions du lot D-27, qui ne créaient aucune entrée persistante dans le catalogue H.
- **Pourquoi** : rendre les agents identifiables et réutilisables dans H, conserver leurs instructions dans les fichiers du projet et permettre de vérifier concrètement leur enregistrement.
- **Preuves** : conversation et rapports du cobaye relus (*lu*) ; le rapport `rapport-20261117-0851.json` contient 12 sessions, 6/6 failles du cobaye détectées, 0 faux positif, 0,20527918 $ H et 0,00042168 $ HF (*mesuré dans ce rapport*, pas sur les sites réels). 25 tests Python passent, avec un transport HTTP simulé pour le vrai SDK (*mesuré localement*). La commande réelle d'enregistrement échoue au premier GET sur `ConnectError` ; diagnostic `Errno 8` avant toute réponse HTTP. Aucun nouvel agent ou session H créé par ce lot.
- **Accès** : clé H locale présente, validité non vérifiable lors de la panne réseau. La configuration des outils dans Claude Code n'expose pas automatiquement ces outils à Codex ; aucun outil H disponible dans cette session. Le besoin mesuré est l'accès à l'API depuis le processus d'exécution, pas une nouvelle connexion au site cible.
- **Statut** : code prêt et testé localement ; enregistrement distant et parcours réels non validés. D-24 et D-26 restent applicables.

### D-29 · Passer la contribution à Claude et corriger le statut des raccordements
- **Date, qui** : le 18/11/2026, Aurian demande un dossier de contribution pour Claude. Il signale l'emploi d'un ancien Supabase et d'une web app de test pour l'authentification dans les propositions de Codex.
- **Décision** : livrer le travail local dans `passation-claude/`, avec les fichiers concernés, un inventaire, les preuves disponibles, les limites et un prompt de reprise. La nouvelle tâche est la passation ; aucune création H, migration, consommation de file ou tentative de déploiement n'est effectuée pendant sa préparation.
- **Correction** : la correspondance des agents existants, de `sentinelqa/web` et de la base configurée avec le projet actuel n'a pas été vérifiée. Les tests locaux ne prouvent pas cette correspondance. « Aucune migration nécessaire » était conditionnel au schéma historique supposé courant ; ce point doit être réévalué sur la bonne base.
- **Pourquoi** : permettre à Claude, avec ses accès et son historique, de reprendre une contribution identifiable sans la confondre avec un système déjà raccordé et validé. Retrouver les services actuels est nécessaire avant d'évaluer l'adéquation du code.
- **Exigences transmises** : QA et pentest au même niveau ; consignes utilisateur, exploration QA bornée sans consigne, voix vers transcription HF et même moteur que le texte. La voix et l'exploration ne sont pas codées. D-24 reste applicable, sans rouvrir le cadrage déjà tranché.
- **Preuves** : signalement explicite d'Aurian ; `web/lib/supabase.js` et `runner/base.py` relus (*lu*) : sources de configuration différentes et concordance non vérifiée. `git rev-parse` ne trouve pas de dépôt, donc le dossier fournit un snapshot sélectionné et non un diff d'origine garanti.
- **Précision ultérieure d'Aurian** : la web doit évoluer selon l'architecture cible. La livraison demandée est limitée au QA fonctionnel, à la voix et à l'interface. La passation finale fournit des extraits QA distincts ; les autres exécuteurs et le contexte historique correspondant ne sont pas copiés dans ce dossier. Ce changement porte sur la livraison, pas sur une annulation des autres volets du projet.
- **Statut** : contribution QA extraite pour Claude, avec architecture visée, code, tests locaux et limites explicites. Aucun résultat distant supplémentaire revendiqué.

### D-30 · Le volet QA de bout en bout : agent H, plan, voix, vérification par le code et web
- **Date, qui** : le 18/11/2026 vers 6 h 20, Aurian demande à Claude Code de « mener à bien la partie QA qui va permettre à nos agents sur H Company de faire ce qui est attendu ». Il précise : pas de cybersécurité, et il gère lui-même l'autre volet. Les choix techniques ci-dessous ont été tranchés par Claude Code dans ce cadre, à partir de `passation-claude/` (D-29). Ils sont soumis à la validation d'Aurian.
- **Décision** :
  1. Un seul agent H, `sentinelqa-qa`, pour le parcours guidé et l'exploration bornée. Sa source unique est `runner/qa_agent.py`, et `runner/agents_missions.py` la reprend : deux définitions du même agent s'écrasaient dans H.
  2. Le plan : la consigne, tapée ou dictée, découpée en étapes et en critères (page, texte exact, constat cité) par Hugging Face (Llama 3.3 70B demandé avec `:groq` ; le routeur annonce `x-inference-provider: openrouter` avec ou sans ce suffixe, *mesuré* à 7 h 45 : le fournisseur effectif n'est pas Groq de façon établie). L'utilisateur le relit, puis le runner le revalide. La dictée passe par Whisper large v3 turbo et arrive dans le même champ que la saisie.
  3. Les verdicts : conforme ou écart, seulement avec une preuve relevée par le code. Un écart vu par l'agent seul reste non concluant, avec l'étiquette « à confirmer ».
  4. Une file QA séparée dans Supabase (`qa_missions`, `qa_evenements`) et un worker dédié. La table `audits` du pentest n'est jamais lue.
  5. La web : `/qa` (le studio) et `/qa/[id]` (le suivi en direct, puis le rapport), avec six routes `/api/qa/*`, dans des fichiers séparés.
- **Alternatives écartées** :
  - réutiliser `sentinelqa-explorateur`, conçu pour le cobaye et ses comptes ;
  - `h/web-surfer-flash` sans définition persistante, qui n'a pas de consigne QA durable ;
  - la table `audits` : le runner du pentest aurait pris les missions QA, et l'accueil aurait cassé sur un rapport v3 ;
  - Qwen 2.5 72B (9,7 s) et Qwen3 32B (35,8 s), trop lents pour un aperçu ;
  - Llama 3.1 8B (0,8 s), qui transformait « envoie le formulaire » en étapes ;
  - le routage `:fastest`, dont les plans variaient d'un appel à l'autre (deux appels seulement : un indice, pas une mesure) ;
  - un verdict tiré du texte de l'agent.
- **Pourquoi** : ce que l'agent dit ne vaut pas preuve. Le code s'appuie sur ce que H enregistre (URL, gestes, texte affiché) et sur la page servie. L'agent a varié d'une session à l'autre : il a vu « 3 étapes » en manquant la FAQ, puis « Quatre étapes ». Hugging Face apporte une valeur identifiable, le plan et la dictée, hors du verdict (D-26).
- **Preuves** (*mesuré*) :
  - **Sessions H réelles sur eugeniaschool.com** : `d9e0ae67` (Bachelor, 29,5 s, 0,011 $), `acfd2cc3`, `13739d7a` (exploration, 7 pages et 28 liens vérifiés), `ec2f3a9d`, `f1540fe4`, `dce757ce`, `99b6dec5` et `4c7e4dce` (explorations mobiles), `3ea0e39c`.
  - **Coûts et durées** : 8 missions complètes, 0,290 $ en tout, 0,036 $ et 81 s en moyenne.
  - **Tests** : 46 Python, dont le bug de relecture reproduit (le test échoue avec l'ancienne égalité stricte), et 15 JS.
  - **Build et captures** : `next build` réussi ; captures regardées à 1280, 390 et 360 px, sans débordement.
- **Corrections dans la passe** :
  - **Bugs trouvés en réel puis corrigés** : relecture d'agent impossible (valeurs par défaut de H) ; clé lue avec ses guillemets (403) ; en-tête HTTP non ASCII ; texte du menu compté dans la page ; « Quatre » non reconnu pour « 4 » ; citations assemblées rejetées ; outil non documenté `web_fetch` ; fil en direct affiché trois fois.
  - **Constat corrigé** : l'« incohérence réelle » annoncée à Aurian à 6 h 47 (« le menu annonce 4 étapes, la page en montre 3 ») était **incomplète**. La FAQ de la page dit « Quatre étapes » (*lu*, HTML servi) ; seule la section illustrée en numérote trois. Aucun défaut du site n'est prouvé.
- **Fichier partagé modifié** : `runner/agents_missions.py`, pour le mode `qa` délégué et la comparaison tolérante aux valeurs par défaut de H. Les 25 tests existants passent. Aucun autre fichier du pentest n'a changé.
- **Précision (7 h 55)** : Aurian cherchait la dictée dans « Lancer un audit ». L'onglet QA de `/audits/nouveau` affiche désormais le studio (vérifié dans les deux sens : l'onglet Pentest est inchangé).
- **Statut** : fait et vérifié en réel sur le site public Eugenia. À valider par Aurian : la règle des verdicts, le Supabase actuel (seul `auaitjryhgwdbczwkdef` est configuré), la dictée avec une vraie voix et la mesure du temps humain gagné.

### D-31 · Un dépôt GitHub pour l'équipe, avec une sélection publiée
- **Date, qui** : le 18/11/2026 à 14 h 30, Aurian demande « tout de suite » un dépôt GitHub pour le groupe : seulement les documents pertinents, un README clair, sans pavés, sur la vision actuelle et l'état réel. Il choisit le dépôt privé de Jahdiel, `jkinvi-byte/hsentinel-alertes`, dont il est collaborateur. Il demande de publier le travail pentest de Kimi, étiqueté « en cours », et le CLAUDE.md.
- **Décision** : le dossier de travail devient le dépôt. Son `.gitignore` fonctionne en liste blanche : tout est ignoré sauf les chemins listés. Sont publiés `sentinelqa/`, `contributions/`, les documents à jour (06, 08, retours sur l'API, recherche, contexte) et le CLAUDE.md.
- **Écarté** : les idées archivées, les documents dépassés (01 à 05, 07, 09), les passations entre agents, les revues, les rapports bruts (ils contiennent des liens de session) et le PDF officiel. L'organisation GitHub n'a pas été créée : la ligne de commande ne le permet pas, et Aurian a désigné un dépôt existant.
- **Preuves** (*mesuré*) : avant l'envoi, les vraies valeurs de 10 secrets (clés H, Supabase et HF, clé privée du runner, mots de passe vus sur Notion) ont été cherchées dans les 139 fichiers, sans aucune trouvée. Après l'envoi, GitHub montre 139 fichiers, aucun chemin interdit, et le README en page d'accueil.
- **Statut** : publié, commit `5b77a79`. Le dépôt vit dans le Bureau synchronisé par iCloud, ce qui reste un risque pour un dossier `.git` ; le déplacer hors d'iCloud quand ce sera possible.
