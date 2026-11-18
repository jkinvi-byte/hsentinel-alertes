# Showcase H : les 67 agents déjà construits, par famille

Relevé le 16/11/2026 sur https://showcase.hcompany.ai (onglets All, H × 42AI Hackathon, Hackathon SF). Les descriptions sont celles du site. Le classement par famille est un jugement de Claude.

Le décompte : 33 projets du hackathon H × 42AI (7-8 nov. 2026), 28 du Hackathon SF (11-12 juil. 2026), 5 démos de H et 1 projet indépendant (Pricehunter).

**À quoi sert ce fichier.** Avant de proposer une idée, on cherche son « cousin » ici. H autorise à reprendre un projet pour le pousser plus loin (kick-off, 00:38:46). Encore faut-il le savoir et dire ce qu'on apporte de plus.

**Ce que ce fichier ne dit pas.** Ces projets viennent de hackathons passés (San Francisco en juillet, 42AI les 7 et 8 novembre), jugés par d'autres jurys. Une famille « très représentée » signale un terrain où il est plus dur de se distinguer. Elle ne prouve pas que notre jury connaît déjà le sujet.

## 1. Apprendre une app ou une tâche (vidéo, démonstration, exploration) : TRÈS REPRÉSENTÉ

| Projet | Ce qu'il fait | Origine |
|---|---|---|
| REBORN | « Des agents H Company explorent l'ancien logiciel comme un humain et prouvent chacune de ses règles par l'expérience », puis un Studio reconstruit une app moderne. Chiffres affichés : « 40 devis sur 40 recalculés au centime, et environ 5 $ d'agents pour analyser un CRM ». | 42AI |
| Show Me Once | Montrer une tâche une fois en la commentant. Holo extrait la procédure, Devin la compile en outil Playwright, l'agent reprend la main si le logiciel change. | 42AI |
| DarkDatAgent | Transforme d'anciens tutoriels vidéo en skills, exécutés par un agent H dans la version actuelle du logiciel (démo Dolibarr), avec vérification en base. | 42AI |
| Reel-Learn | « An agent that learns desktop apps the way people do: by watching tutorial videos. » | SF |
| Holo Forge | Une vidéo commentée d'une tâche devient une automatisation de bureau relisible. | SF |
| AI Runbooks | Des enregistrements d'écran deviennent des runbooks rejouables et vérifiés pas à pas. | SF |
| ImproveMe | Observe une journée de travail, puis rejoue les routines selon un planning. | SF |
| Voodoo | Explore une app web et transforme un parcours en tutoriel vidéo commenté. | SF |
| Twin Cursor | Un second curseur qui montre comment utiliser n'importe quelle app sur Mac, et le fait si on veut. | 42AI |
| Rio | Tutoriel assisté directement à l'écran. | 42AI |
| Handyman | Pointe l'élément à l'écran et dit à voix haute quoi faire. | SF |
| AI Teaching Assistant | Un tuteur tiré de vrais cours, Holo montre les étapes à l'écran. | SF |
| Undo | Garde l'historique de ce qui s'est passé sur le Mac et peut agir dessus. | 42AI |

**Conséquence :** le mécanisme « l'agent apprend une app » ne suffit plus à se différencier. L'idée doit se définir par un **métier précis et un acheteur**, l'apprentissage n'étant qu'un moyen.

## 2. Assistant vocal ou chat « qui fait tout » : TRÈS REPRÉSENTÉ

- Brainy, Gusan, Voilà, Colette (démarches pour personnes âgées ou malvoyantes), Reflex (candidatures, réservations), Calli, Kylian, Holo Remote, H Companion, Life-Admin Operator, Meetin OS (réunions transformées en tâches), Halo (panneau Chrome), « Hackathon 7nov H » (tâches administratives).

## 3. QA, tests, accessibilité, fiabilité des agents : TRÈS REPRÉSENTÉ

D'après la transcription imparfaite du kick-off (vers 00:38:46), H y voit « un sujet qui avait déjà été un peu posé ». Le décompte : 7 projets testent des applications ou des sites (dont une démo de H) ; Houston, Cogito Ergo Feci et MIMK portent sur la fiabilité des agents eux-mêmes.

- raven agent, Player Two (QA de jeux), QA any web UI (démo H), A-Test (« Test cases in plain words, run by a computer-use agent to gate every PR »), GrannySmith, Simulation Labs, Humble (accessibilité).
- Côté fiabilité des agents : Houston (audite et prouve chaque run), Cogito Ergo Feci (agent qui ment sur la fin de sa tâche), MIMK (jumeaux numériques).
- **Aucun projet de pentest ou de sécurité offensive.**

## 4. Logiciels métier legacy et opérations critiques : OCCUPÉ

- REBORN (voir §1), Senna Systems (centres de contrôle ferroviaire, pilote un logiciel legacy), Seraph (pompiers), Workfleet (clone l'ordinateur pour faire travailler plusieurs agents dans des apps legacy), ArcFlash Copilot (rapports d'ingénierie électrique, validation humaine), Jesse (assistant de laboratoire), Georescue (analyse d'inondation), Snowglobe (agents derrière les caméras de magasin).

## 5. Argent, achats, commerce : OCCUPÉ, surtout en B2C

- Kerdaxis (« AI CFO » : trouve les abonnements inutiles et un agent H les résilie chez le fournisseur), Refundit (remboursements de courses), Pricehunter (codes promo), BuyWith402 (des agents qui achètent), Styleroom (déco), Agent Kalshi (paris), Add to cart et Product availability (démos H).

## 6. Voyage, loisirs, création : OCCUPÉ

- Nami (agence de voyage), RunAI (voyage pour une course), Hiking Routes in Google Maps, Claw-DJ, HoloSpeed (speedrun Minecraft), HoloBlocks et HoloBricks (démos H), Holodev (Roblox), CUA Molecular Visualizer, Rot Curator.

## 7. IT, développement, infrastructure : PEU OCCUPÉ

- PapAI (support informatique : Holo planifie la correction, l'IT valide, Holo l'exécute sur le poste), Cloud CUA (serveur MCP qui déploie un dépôt en pilotant la vraie console AWS), HoloMobile (agent sur smartphone), Privacy Layer for Visual Agents (floute les captures avant le modèle).
- Divers : Glassbox (détection de traite humaine dans des annonces), FollowThrough (agent BizDev).

## Espaces libres repérés (aucun cousin direct au 16/11)

- Un métier B2B précis du tissu de PME françaises, sur des portails sans API : marchés publics, conformité, portails fournisseurs. Voir `idees/pli-marches-publics.md`.
- Les tests de sécurité (pentest) : voir `idees/vigie-pentest-pr.md`.
- L'administration des accès SaaS (arrivées, départs, revues d'accès, licences) dans les apps sans SSO ni SCIM : voir `idees/portier-acces-saas.md` (plan B). Hors showcase, le terrain est occupé par AccessOwl et Cerby.

## Ce que les meilleurs projets font bien (à imiter)

- **Un chiffre de résultat et un chiffre de coût**, comme REBORN : « 40 devis sur 40 recalculés au centime, et environ 5 $ d'agents pour analyser un CRM ».
- **Une vérification indépendante** du travail de l'agent : en base pour DarkDatAgent, par audit pour Houston.
- **Une validation humaine avant l'irréversible** : PapAI, ArcFlash Copilot, Life-Admin Operator, Meetin OS.
