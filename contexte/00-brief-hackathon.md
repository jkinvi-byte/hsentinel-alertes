# Hackathon 2026 « Build The Future » : ce qu'il faut savoir pour cadrer

Synthèse du 16 nov 2026 (jour 1). Sources croisées :
- **PDF** : `Hackathon 2026 — Build The Future.pdf` (28 slides), cité [p.N]
- **Kick-off** : enregistrement de 49 min, transcrit dans `kickoff-transcription.md`, cité [hh:mm:ss]. Transcription de salle, imparfaite : le sens est fiable, pas le mot à mot.
- **Doc H** : hub.hcompany.ai + hcompany.ai/pricing, lus le 16/11
- **Showcase** : showcase.hcompany.ai, onglet « H × 42AI Hackathon » + onglet SF

Volontairement absents de ce fichier : le mot de passe des adresses d'équipe et les codes de crédits (slides 22-23). Ce dossier pourrait finir sur GitHub.

---

## 1. Le brief en une phrase

En 4 jours, monter une startup dont le produit repose sur un **agent computer-use** (Agents API de H Company) qui **agit** sur de vrais sites ou logiciels (voir l'écran, cliquer, taper, naviguer), puis le **démontrer en live sur un vrai cas, avec des résultats chiffrés** [p.3].

La question posée par H [p.3] : « Imaginez le produit ou le service que l'on peut construire lorsque l'IA peut réellement utiliser les logiciels et les interfaces existantes. Identifiez un problème concret, concevez une expérience convaincante, puis construisez un prototype fonctionnel qui utilise l'Agent API de H Company. »

Posture attendue : une équipe de fondateurs, pas des étudiants en exercice. Le test à chaque décision : « Est-ce qu'un vrai utilisateur paierait ou changerait ses habitudes pour ça ? » [p.4]

## 2. Comment on est noté

| Poids | Critère [p.21] |
|---|---|
| 25 % | Pertinence et impact |
| **30 %** | **Excellence technique et Agents API** |
| 25 % | Faisabilité, adoption et apprentissages |
| 20 % | UX, démo et pitch |

- **Critère n°1** : une démo live sur un vrai cas business, avec le ou les agents qui tournent [p.21].
- Le jury (ingénieurs H Company, Vercel, Eugenia) « ne vous évalue pas sur une idée » : il juge un agent qui tourne, sur un vrai cas, avec des chiffres [p.3].
- **Retours sur l'Agents API = partie du livrable** : ce qui a marché, ce qui a cassé, ce qui a surpris [p.4]. H manque de visibilité sur les usages réels de ses clients, donc nos retours sont de l'information qu'ils cherchent [00:04:01].
- Vendredi : un top 6 pitche (6 min + 4 min de Q&A) [p.20]. **Les finalistes ne sont pas annoncés à l'avance : toutes les équipes doivent être prêtes** [00:26:42]. Pendant les 6 min, tout le monde doit parler. Ne pas être dans le top 6 n'empêche pas une très bonne note [00:28:13].

## 3. Les 5 cases d'un bon projet [p.5]

1. **Un problème réel et précis.** « Les PME perdent du temps » est trop vague. « Un gérant de restaurant passe 3 h par semaine à comparer les prix de ses fournisseurs sur 4 sites différents » est assez précis.
2. **Une cible identifiable** : on sait décrire l'utilisateur et le trouver.
3. **Un usage justifié de l'agent** : pourquoi du computer-use plutôt qu'une API, Make, n8n ou un script ? Souvent parce qu'il n'y a pas d'API, que l'interface change, ou que la tâche demande de « voir » l'écran.
4. **Un MVP réaliste en 4 jours** : un parcours qui marche de bout en bout, pas dix fonctionnalités à moitié faites.
5. **Un modèle crédible** : qui paie, combien, pourquoi, et combien coûte le run (crédits, appels API). L'organisateur parle de « FinOps » [00:06:38].

## 4. Les pièges des éditions précédentes [p.6]

Idée trop large · sur-conception · **projet IA sans agent** (un chatbot ou un générateur de texte ne répond pas au brief : l'agent doit agir sur une interface) · slides sans prototype · **ne pas mesurer** (taux de réussite, latence, cas d'échec) · venir au support sans diagnostic (apporter le bug, ce qui a été testé, une capture) · liens inaccessibles (vérifier les droits avant le dépôt).

**Mise en garde de H à l'oral** [00:35:41] : ne pas voir le computer-use comme un simple outil de récupération de données, car il existe des moyens plus efficaces pour ça. Sa valeur, c'est d'**aller quelque part, se connecter, cliquer, remplir**, ce qu'on ne pourrait pas faire sans un agent qui manipule l'interface.

## 5. Calendrier et livrables

| Quand | Livrable | Contenu exigé |
|---|---|---|
| **Lun 16, avant 17h** | **Validation d'idée** : 5 slides max ou 1 Notion [p.13] | Nom + slogan · problème expliqué clairement · solution en 1 phrase · personae cibles · stack envisagée · répartition des rôles. Pas besoin d'architecture définie à ce stade [00:20:39]. |
| Mar 17 | Session tech H, points CTO 11h–12h et 15h–16h [p.12] | — |
| **Mer 18, avant 17h** | **Point intermédiaire** [p.17] | Parcours utilisateur (Figma, Miro, Airtable ou papier) · architecture technique (même dessinée à la main) · **mini pitch Loom de 2 min max** (problème + solution + avancement) · roadmap jusqu'à jeudi |
| Jeu 19 | Point CEO l'après-midi, finalisation, tests [p.12] | — |
| **Ven 20, avant 11h** | **Livrables du matin** [p.18] | Prototype fonctionnel démontrable en live (lien public, mode d'accès) · fiche projet + repo GitHub (problème, solution, stack, architecture, lien du proto, comment tester) · évaluation des pairs · **vidéo démo de 5 min** |
| **Ven 20, avant 15h** | **Pitch deck de 8 à 12 slides, dans cet ordre** [p.19] | Problème · Solution · Démo · Business model · Go-to-market · Architecture technique · Limites + roadmap · Estimation du coût de run |
| Chaque soir, 17h → 9h | Peer review [p.16] | Notation des coéquipiers sur peer-review-black.vercel.app, qui compte dans la note finale. Le code d'activation personnel est dans le Sheet. |

## 6. L'équipe

**Team 4** [p.26] : Mohamed El Hamss (M1), Tugdual Breuil (M1), Aziz Tajini (M1), Aurian Bingangoye (M2), Alec Diamidia (M2), Jahdiel Kinvi (M2).

**Six rôles obligatoires** [p.14-15] :

| Rôle | Responsabilités |
|---|---|
| **CEO** | Vision, arbitrages tech × business, priorités et planning des livrables. Porte le pitch final et la Q&A. À l'oral, c'est aussi le chef de projet : il attribue les rôles, gère les tensions et les « touristes » [00:20:39]. |
| **CTO** | Architecture IA + automatisation + BDD + API, qualité du code, reproductibilité, doc (README, schémas), prototype bout en bout, **démo live avec plan B** |
| **CAO** (automatisation) | Workflows Make, n8n ou Apps Script, liaison no-code et scripts, fiabilité et rapidité |
| **CAIO** (IA) | Features IA, prompts structurés et reproductibles, **comparaison des LLM en précision, coût et latence** |
| **CDO** (données) | Collecte de données réelles, BDD propre (Supabase, Airtable, Sheets), pipelines de nettoyage (Pandas) |
| **CPO** (produit) | Persona, problème, parcours, interface minimale, business model, go-to-market, pitch deck |

## 7. Stack imposée et ressources

- **Obligatoires** [p.10] : **H Company** (IA/agents), **Hugging Face** (modèles, datasets, doc), **GitHub** (dépôt). L'organisateur insiste sur un GitHub propre, qui servira aussi pour les candidatures [00:16:08].
- **Vercel** : crédits v0 [p.23]. Vercel est présenté comme un acteur majeur, partenaire de H et membre du jury. Déployer dessus est fortement conseillé [00:31:14, 00:41:46].
- **Hugging Face** [p.11] : 50 € de crédits (coupon). Hub, Inference Providers (routeur compatible OpenAI, plus de 200 modèles), Spaces (démo en ligne sur GPU) et Jobs (fine-tuning). Les **poids de Holo sont ouverts sur Hugging Face** (hcompany.ai/pricing), ce qui permet de cocher la case HF autrement qu'en décor.
- **Accès H** : un compte H par équipe, sur l'adresse TeamN@eugeniaschool.com. Le code de crédits a été envoyé par email à l'adresse Eugenia [00:29:44] et s'active sur platform.hcompany.ai [p.9].
- **Mentors H sur place** [p.7] : Jules Belveze (Core Team Researcher), Nolwenn Guiban (Product & Growth), Mathieu Diaz (Product & Software Engineer).
- **Prix** [p.24] : 1er, 6 mois d'Agents API premium + présentation du projet chez H Company + 350 € de cartes cadeaux · 2e, 100 € de crédits par personne · 3e, 50 € par personne. Bonus : concours LinkedIn du 20 au 27 nov, classé au total des réactions, avec 4 tags obligatoires (Eugenia, Vercel, H Company, Hugging Face) [p.25].

## 8. Agents API : ce qui est vérifié dans la doc

**Principe.** On décrit la tâche en langage naturel. H fournit l'environnement, fait tourner l'agent et renvoie le résultat. L'agent avance pas à pas : il regarde l'écran, raisonne, puis agit.

- **Environnements** : navigateur cloud hébergé par H (défaut) · **ton propre Chrome, avec tes sessions ouvertes** · **ton desktop**, à la vue ou en mode shell avec approbation des commandes.
- **Agents prêts à l'emploi** : `h/web-surfer-flash` (rapide, par défaut), `h/web-surfer-pro` (workflows complexes), `h/deep-search-pro` (manager qui délègue à des sous-agents).
- **Modèles** : `holo4-27b` par défaut. `holo4-35b-a3b` est plus rapide mais plus faible sur les tâches complexes. Le point fort de Holo selon H, c'est la **localisation** (« clique sur le bouton Submit » → coordonnées → clic), et ces appels coûtent moins cher [00:31:14].
- **Briques qui comptent pour les 30 % « technique »** :
  - sortie structurée (schéma Pydantic ou Zod) ;
  - **custom tools** (l'agent appelle nos fonctions) ;
  - **sous-agents en parallèle** ;
  - skills ;
  - conversation multi-tours (`send_message`) ;
  - **schedules** (cron) et webhooks ;
  - **browser profiles** (démarrer déjà connecté) ;
  - **vaults pour identifiants et 2FA**, sans que les secrets entrent dans le contexte du modèle ;
  - lecture et écriture de fichiers dans le navigateur cloud (téléchargements) ;
  - **approbation humaine** des actions.
- **Observation (idéal pour la démo)** : chaque session a un `agent_view_url` pour la suivre **en direct** ou la rejouer (pensées, actions, captures), et un **lien public de partage** sans clé. On peut piloter en cours de route : envoyer un message, mettre en pause, forcer une réponse ou annuler.
- **Mesure** : `GET /sessions/{id}/status` renvoie l'état, le **nombre de steps** et la **consommation de tokens**. Ce sont nos métriques de succès, de latence et de coût, toutes prêtes.
- **SDK** : Python et TypeScript (`hai-agents`), CLI `holo`, serveur MCP, intégration n8n, et une skill Claude Code `/hai-agents` dans le dépôt `hcompai/agents-api-demos`.
- **Plans** (hcompany.ai/pricing et doc *Plans and limits*) :

  | Plan | Prix | Agents simultanés | Volume indicatif |
  |---|---|---|---|
  | Free | 0 $ | 3 | ≈ 60 sessions/mois (60 M tokens) |
  | Builder | 20 $/mois | 10 | ≈ 1 000 sessions/mois (1 Md tokens) |
  | Startup | 200 $/mois | 100 | ≈ 10 000 sessions/mois |

  Au-delà du forfait : prix modèle + 20 %. Lancements de navigateurs cloud limités à 10/min par utilisateur.
- **Ordres de grandeur pour le coût de run** (à confirmer par mesure) :
  - **≈ 1 M tokens par session, soit ≈ 0,02 $ par session** au plan Builder (mesuré le 16/11 sur SentinelQA : 47 k à 316 k tokens par session, voir `notes/retours-agents-api.md`) ;
  - une capture d'écran coûte ≈ largeur × hauteur / 1024 tokens (1 280 × 800 ≈ 1 000 tokens) ;
  - prix d'exemple dans la doc pour Holo3.1 35B : 0,25 $/M tokens en entrée, 1,80 $/M en sortie.
- **Non documenté, donc à mesurer nous-mêmes** (et c'est exactement ce que le jury réclame) : latence par step, taux de réussite.

## 9. Ce qui existe déjà : 67 agents en showcase

Showcase H, avec 33 projets du hackathon H × 42AI (7-8 nov 2026), 28 du hackathon de San Francisco (11-12 juillet 2026), 5 démos de H et 1 projet indépendant (compté dans le HTML de la page le 16/11). H **autorise explicitement à reprendre un projet existant pour le pousser plus loin** [00:38:46].

| Famille | Exemples | État |
|---|---|---|
| Assistant vocal ou chat « qui fait tout » | Brainy, Gusan, Voilà, Colette, Reflex, Calli, Life-Admin Operator, Kylian, Holo Remote, H Companion, Meetin OS | **très représenté** |
| Apprendre par démonstration, tutoriel, guidage à l'écran | Show Me Once, DarkDatAgent, Twin Cursor, Rio, Undo, Reel-Learn, Holo Forge, AI Runbooks, ImproveMe, Handyman, AI Teaching Assistant, Voodoo | **très représenté** |
| QA, tests, accessibilité | Raven, Player Two, Humble, GrannySmith, Simulation Labs, A-Test, Cogito Ergo Feci, Houston | **très représenté**. Transcription imparfaite, vers [00:38:46] : « un sujet qui avait déjà été un peu posé ». Houston et Cogito Ergo Feci contrôlent les agents, pas des applis. |
| Logiciel métier legacy, opérations critiques | REBORN, Senna Systems (rail), Seraph (pompiers), Workfleet, ArcFlash Copilot, Georescue, Jesse (labo) | occupé |
| Argent du particulier | Kerdaxis (résiliation d'abonnements), Refundit (remboursements courses) | occupé, B2C |
| Achat, voyage, shopping | Styleroom, Nami, RunAI, BuyWith402, Product Availability | occupé |
| Divers | HoloSpeed (Minecraft), Claw-DJ, Agent Kalshi, Glassbox, Privacy Layer, FollowThrough, MIMK, Rot Curator, PapAI (support IT) | — |

**Espace libre repéré** : presque aucun projet ne vise **un métier B2B précis du tissu de PME et TPE françaises**, avec une tâche de back-office répétitive sur des portails sans API (achats, pièces comptables, conformité, portails administratifs ou fournisseurs). C'est pourtant l'angle que l'organisateur a posé d'entrée, avec des entreprises françaises « sans API » et « avec des besoins concrets » [00:01:35], et l'exemple même de la slide 5 (le restaurateur et ses 4 sites fournisseurs).

## 10. Les 3 familles de cas d'usage données par H en Q&A [00:32:45 → 00:38:46]

1. **Veille et collecte récurrente**, par exemple les concurrents d'une marque surveillés chaque jour puis synthétisés. Attention à ne pas tomber dans le pur scraping (cf. §4).
2. **Automatisation de tâches** sur le web ou sur l'ordinateur, par exemple un assistant qui manipule Photoshop pour toi, à la voix ou par chat.
3. **Tests (QA)**, par exemple un opérateur télécom qui doit vérifier tous les parcours de ses offres et options.

Exemple raconté par H [00:13:29] : pour un drop de merch Jacquemus × FFF, un agent planifié passait chaque jour sur le site et envoyait une capture si l'article manquait, un message dès qu'il était disponible.

Cible : « libre », B2B comme B2C [00:32:45]. Conseil final : choisir un sujet qui vous « chauffe », dans le respect des consignes [00:40:16].
