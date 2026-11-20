# HSentinel

> Votre IA code vite. Notre agent prouve ce qui fuit.

Des agents IA de H Company testent un site autorisé comme le ferait un humain : ils se connectent, naviguent, cliquent et observent l'écran. Le code tranche ensuite sur des preuves : l'avis de l'agent seul ne suffit jamais. Chaque faille prouvée et chaque écart constaté deviennent un ticket GitHub.

**Démo en ligne : https://hsentinel-console.vercel.app** · accès par le code de l'équipe, communiqué sur demande · [Business](BUSINESS.md) · [Architecture](ARCHITECTURE.md) · [Suivi du projet](SUIVI.md)

## Le problème

Les équipes livrent chaque semaine, souvent avec du code écrit par l'IA. Les tests automatiques vérifient le code, pas ce qu'un utilisateur peut réellement faire dans l'application en ligne. À chaque mise en ligne, deux questions restent sans preuve :

- **le parcours marche-t-il encore ?** Une page attendue, un texte, un lien, un formulaire de connexion ;
- **un utilisateur peut-il lire ou modifier les données d'un autre ?** Le contrôle d'accès défaillant est le n° 1 du Top 10 OWASP 2025.

## Ce que fait HSentinel

| Volet | Ce que fait l'agent H | Ce que vérifie le code |
|---|---|---|
| **QA fonctionnel** | Il suit un parcours tapé ou dicté, que Hugging Face découpe en étapes et en critères, relus avant le lancement. Ou il explore le site, 6 pages au plus. Sur ordinateur ou sur mobile, connecté ou non. | La page atteinte, le texte exact relu par HTTP, la citation de l'agent retrouvée dans la page, les erreurs HTTP, les liens cassés. |
| **Pentest : tests IDOR** | Deux comptes de test, de deux entreprises différentes, rangés dans des coffres H : l'agent ne voit jamais les mots de passe. L'agent cartographie les pages du compte A. Le compte B tente ensuite de les ouvrir, puis de les modifier. Un salarié tente d'atteindre l'administration. | B reçoit-il la page de A (rejeu HTTP, similarité d'au moins 0,95) ? Son marqueur d'écriture apparaît-il chez A ? L'agent confirme ensuite chaque faille à l'écran. Une règle écrite calcule la gravité. |
| **Pentest : barrière d'accès** | Un visiteur sans compte ouvre une page réservée. | Le serveur le refuse (401 ou 403) ou le renvoie vers la connexion. |
| **Votre propre SaaS** | « Ajouter une application » : l'adresse, l'attestation, un jeton de vérification publié sur le site, puis les comptes de test (chiffrés dans le navigateur pour le runner, versés dans un coffre H le temps d'une mission). L'expert du studio y conduit au lieu de bloquer. | Rien ne part avant que le jeton soit relu sur le site ; adresses privées refusées ; consultation seule. Sur une page privée, le code prouve un texte anormal ou une erreur HTTP, et dit l'écart que l'agent signale et cite. |
| **Veille des mises à jour** | Aucun agent : deux lectures HTTP de la page d'entrée, toutes les 15 minutes. | Si l'empreinte du site change (compilation, ressources, titres), une mission QA part toute seule. Rien n'est à installer chez le client. |
| **Alertes** | — | Chaque faille prouvée et chaque écart constaté deviennent un constat. Pour nos propres applications, n8n en fait un ticket GitHub, et un e-mail si un destinataire est choisi. Si la même faille revient, le ticket reçoit un commentaire au lieu d'un doublon. Pour un site tiers, le constat reste privé dans la console : ce dépôt est public, et une faille ne s'y publie jamais avant que son propriétaire soit prévenu. |

Les tests IDOR, c'est-à-dire un compte qui lit ou modifie l'objet d'un autre en changeant un identifiant, sont le cœur du volet Pentest depuis le premier jour. Dans le code, ce sont les thèmes `lecture` et `ecriture` ; l'élévation de droits d'un salarié est le thème `admin`.

## Résultats mesurés

| Test | Résultat | Durée et coût |
|---|---|---|
| Tests IDOR sur le banc Paie Express : 6 failles injectées, 4 contrôles sains, vérité terrain écrite avant l'audit | **59 failles prouvées sur 60, en 10 audits, 0 faux positif** | 0,13 à 0,21 $ par audit |
| Le même banc, en ligne sur Vercel (19/11) : audit complet par les agents H | **6 sur 6, 0 faux positif** ; la vérité terrain du banc passe 21 contrôles sur 21, trois fois de suite | 283 s, 0,215 $ |
| Le même banc, lancé depuis la console (19/11) | **6 sur 6, 0 faux positif** ; les 10 preuves partent aux alertes | 298 s, 0,203 $ |
| QA guidé sur eugeniaschool.com (« Bac+3 » sur la page du Bachelor), 10 répétitions | 10 sur 10 | 29 s et 0,007 $ en moyenne |
| QA en exploration bornée, 10 répétitions | 10 sur 10 | 103 s et 0,051 $ en moyenne |
| QA connecté sur Peer Review, 10 répétitions | Connexion et identité prouvées 10 sur 10, aucune écriture | 40 s et 0,015 $ en moyenne |
| Barrière d'accès de Peer Review (S-PEER-01) | Conforme : 307 vers `/connexion` | 24 s, 0,004 $ |
| Isolation entre deux comptes de Peer Review (S-PEER-02, 19/11) : A, B et un visiteur anonyme, consultation seule | Aucune faille prouvée : A voit sa page, l'anonyme est redirigé, B reçoit la page sans les données de A mais le refus n'est pas confirmé à l'écran (1 non concluant) ; aucune écriture | 106 s, 0,035 $ |
| Veille : la console est redéployée | Mise à jour détectée en 56 s, exploration faite 30 s plus tard | 0,010 $ |
| Un SaaS jamais vu, ajouté dans la console (Ardoise, 20/11) : vérifié par jeton, deux comptes de test, exploration connectée | Connexion et identité prouvées ; les 2 défauts plantés que le code peut prouver sur une page privée le sont (« undefined » à l'écran, aide en 404) | 73 s, 0,028 $ |
| Le même SaaS, parcours guidé proposé par l'expert (« 3 factures en retard ») | Le 3e défaut (la page en annonce 2) signalé et cité par l'agent, retrouvé à l'écran : à confirmer, jamais prouvé sur une page privée | 51 s, 0,012 $ |

Les coûts H sont lus dans l'API H, session par session.

## Architecture

```
Console (Next.js, Vercel) ──► Supabase : files qa_missions et audits, constats, applications
                                  ▲                          │
          Workers Python (Mac) ───┘                          └──► n8n : W3 (ticket GitHub et e-mail)
            ├─ H Agents API : agents, coffres, sessions             W4 (pentest régulier, la nuit)
            ├─ Hugging Face : plan du parcours, dictée (Whisper)
            └─ Veille des mises à jour (empreinte HTTP)
```

Le principe : **l'agent montre, le code décide.** Hugging Face prépare le plan et transcrit la dictée, mais il n'entre jamais dans le verdict. Le détail est dans [ARCHITECTURE.md](ARCHITECTURE.md).

**Stack** : H Agents API (`holo4-35b-a3b`, coffres, replays) · Hugging Face Inference Providers (Llama 3.3 70B, Whisper large v3 turbo) · Supabase (PostgreSQL, RLS, coffre, `pg_net`) · Next.js sur Vercel · n8n · GitHub Issues.

## Tester

- **Votre propre site** : Applications, « Ajouter une application ». Le SaaS de démonstration [Ardoise](https://ardoise-demo-ruddy.vercel.app) (`sentinelqa/ardoise`, défauts plantés dans `DEFAUTS.md`) y est déjà ajouté et vérifié.
- **En ligne** : https://hsentinel-console.vercel.app, avec le code de l'équipe. Lancez un QA (consigne tapée ou dictée, puis « Préparer le plan » et « Lancer la mission »), le pentest « Vérifier la barrière d'accès sans connexion » ou « Tests IDOR sur le banc », qui prouve en direct les 6 failles du banc en 5 minutes environ, puis ouvrez la page Alertes. Les missions sont exécutées par les workers de l'équipe : s'ils sont arrêtés, une mission reste en attente. Le banc IDOR est en ligne lui aussi : https://hsentinel-banc.vercel.app, avec des comptes et des données fictifs (`sentinelqa/runner/comptes-demo.json`).
- **En local** : il faut Python 3.12, Node 20 ou plus, une clé H (`pbpaste | holo login --key --force`), et les clés Supabase et `HF_TOKEN` dans `~/.config/sentinelqa/.env`, sur le modèle de [`sentinelqa/.env.example`](sentinelqa/.env.example). Les clés ne vont jamais dans le dépôt.

```sh
python3 -m venv .venv && .venv/bin/pip install -r sentinelqa/requirements.txt
.venv/bin/python sentinelqa/runner/qa_worker.py                 # worker QA, avec la veille des mises à jour
.venv/bin/python sentinelqa/runner/sentinelqa.py --surveiller   # worker pentest
cd sentinelqa/web-console && npm install && npm run dev         # console sur http://127.0.0.1:3101
```

Sans console :

```sh
.venv/bin/python sentinelqa/runner/qa_moteur.py --consigne "Ouvre Programmes puis le Bachelor et vérifie qu'il affiche « Bac+3 »"
.venv/bin/python sentinelqa/runner/qa_moteur.py --exploration --mobile
.venv/bin/python sentinelqa/runner/sentinelqa.py https://hsentinel-banc.vercel.app --autoriser-ecriture   # le banc IDOR, en ligne
sentinelqa/demo.sh            # le même banc en local, derrière un tunnel public
```

Tests : `.venv/bin/python -m unittest discover -s sentinelqa/runner/tests`, puis `npm test` dans `sentinelqa/web` et dans `sentinelqa/web-console`. `npm run test:browser` lance les tests navigateur de la console.

## Limites

- HSentinel **complète** un audit humain : il ne remplace ni un pentest qualifié, ni un TLPT, ni un audit PCI.
- Il ne teste que des sites contrôlés par l'équipe ou autorisés par écrit : eugeniaschool.com et Peer Review, en consultation seule, et notre propre console. Les tests d'écriture se font uniquement sur le banc Paie Express.
- La veille voit ce qui change dans la page d'entrée : un changement purement côté serveur peut lui échapper.
- Sur Peer Review, le test IDOR entre deux comptes (S-PEER-02) a été exécuté une fois, le 19/11 : aucune faille prouvée, et un contrôle reste non concluant faute de refus visible à l'écran. Le webhook instantané des alertes reste à réaligner : en attendant, un ticket part en 15 minutes au plus.

## Règles

- Uniquement des cibles autorisées (article 323-1 du Code pénal), avec un périmètre écrit pour chacune dans [`sentinelqa/contrats/`](sentinelqa/contrats).
- « Conforme », « écart constaté » ou « faille prouvée » : seulement avec une preuve relevée par le code.
- Aucun secret dans le dépôt. Le `.gitignore` fonctionne en liste blanche, et le dépôt est public.

## Pour l'équipe

| Chemin | Contenu |
|---|---|
| `sentinelqa/runner/` | Le moteur Python : QA (`qa_*.py`), veille (`veille.py`), pentest (`sentinelqa.py`, `missions.py`), constats (`constats.py`) |
| `sentinelqa/web-console/` | La console, déployée sur Vercel |
| `sentinelqa/web/` | Les services partagés avec la console (`lib/`) et l'ancienne interface |
| `sentinelqa/contrats/` | Les cibles autorisées et leurs limites, lues par le runner et par la console |
| `sentinelqa/supabase/` | Les schémas SQL, dont `alertes.sql` : applications, constats, fonctions de n8n |
| `sentinelqa/n8n/` | Les workflows W1, W3 et W4 et leur mise en service |
| `sentinelqa/cobaye/` | Paie Express, le banc IDOR à failles injectées (comptes et données fictifs), en ligne sur https://hsentinel-banc.vercel.app |
| `contributions/` | Les modules pentest en cours d'intégration (S-PEER-02, Hugging Face vers contrôles) |

Pièges qui ont déjà mordu :
- **Garde d'origine** : elle compare l'en-tête `Origin` à l'hôte appelé (`Host`), jamais à `request.url`, que Next réécrit en `localhost` en développement.
- **Déploiement sur Vercel** : le builder ignore un `distDir` personnalisé et empaquette `.next/`. On compile donc dans `.next` (`cd sentinelqa && vercel build --prod && vercel deploy --prebuilt --prod`), puis on vérifie la date de la route empaquetée.
- **Clé H** : `holo login` l'écrit entre guillemets. Il faut les retirer à la lecture, sinon H répond 403.
- **Page de départ d'un agent** : H refuse `start_url: "about:blank"` à la création d'un agent. Chaque session impose sa page de départ.
- **Titres à styles mêlés** : dans un titre comme « Bonne *soirée* », le texte relevé par H ne garde que la partie en italique. Le rapport le signale (`h_text_partial`) et renvoie à la capture.
- **État en mémoire sur Vercel** : chaque instance a sa propre mémoire. Ce qu'une requête doit voir d'une autre (une donnée modifiée, le secret de session) vit hors du processus : dans Supabase et dans une variable d'environnement.
- **Nouvelle table Supabase** : l'API ne la voit qu'après `notify pgrst, 'reload schema'`. Sinon, elle répond `PGRST205`, et un test de refus semble réussir sans avoir rien testé.
- **Projet créé par `vercel project add`** : il n'a pas de framework, et le build cherche un dossier `public`. Le framework se déclare dans `vercel.json`.
- **Événements H** : ils arrivent par lots, et H a souvent déjà exécuté un geste quand notre garde le voit. Sur un site réel, la consigne et les zones interdites protègent d'abord ; la garde borne la suite.

L'état détaillé, daté, et la liste de ce qui reste à faire sont dans [SUIVI.md](SUIVI.md). Les décisions et leurs raisons sont dans [ARCHITECTURE.md](ARCHITECTURE.md).
