# HSentinel

Des agents IA de H Company testent un site web autorisé comme un humain : ils naviguent, cliquent et observent. Ensuite, le code vérifie chaque résultat sur des preuves, et l'avis de l'agent seul ne suffit pas.

- **QA** : le site fait-il ce qu'on attend ?
- **Pentest** : un accès qui devrait être refusé est-il possible ?

**[Architecture](ARCHITECTURE.md)**, avec ce qui a changé depuis le document illustré du 17/11 · **[Suivi du projet, ce qui reste à faire](SUIVI.md)**

Hors de `main` : la branche `jahdiel/suivi-n8n` (le suivi des alertes n8n, repris dans SUIVI.md) et `agents-ia-qa-pentest` (le bac à sable de Mohamed). Voir [ARCHITECTURE.md, section 14](ARCHITECTURE.md#14-les-travaux-de-léquipe-hors-de-main).

## État au 18/11, 19 h 15

| Volet | Fonctionne, vérifié en réel | Manque |
|---|---|---|
| QA | Consigne tapée ou dictée, puis plan Hugging Face, agent H, vérification par le code et rapport web. 9 missions sur eugeniaschool.com, sur ordinateur et sur mobile : 0,033 $ et 76 s en moyenne | Dictée avec une vraie voix, mesure du temps gagné, déploiement |
| QA connecté : Peer Review | L'agent se connecte par un coffre H créé pour l'essai, puis consulte sans rien modifier. Compte d'Alec : 1 mission réelle (43 s, 0,021 $), connexion, identité et une page vérifiées par le code ; 2 constats confirmés sur capture seulement | Compte de Nathan refusé par le site (2 essais) : son mot de passe en vigueur ; répétitions ; lancement depuis la web (le terminal seulement aujourd'hui) |
| Pentest : banc | Paie Express, une application de test à failles injectées : 59 failles prouvées sur 60, en 10 audits, 0 faux positif | — |
| Pentest : Peer Review | Connexion HTTP de A validée en réel ; ressource témoin et règle de visibilité confirmées (Kimi) | B refusé par le site ; agent H illisible (500) ; contrôle A/B jamais exécuté ; modules non raccordés (`contributions/`) |
| Alertes n8n (Jahdiel) | W1, W3, W4 testés en réel sur la base `hsentinel-dev` (rapporté) | Une seule base avec le runner ; les failles prouvées écrites dans `constats` |
| Interface : `web-console` | Prototype exporté de v0 (accueil, onboarding, console), arrivé à 19 h 06, en local | Données simulées : relié ni à Supabase, ni au runner, ni à H ; pas encore publié |

## Lancer le volet QA

Ce qu'il faut :
- Python 3.12 et Node 20 ou plus ;
- un compte H : `holo login` écrit `HAI_API_KEY` dans `~/.config/hai/.env` ;
- `~/.config/sentinelqa/.env` : les clés Supabase et `HF_TOKEN`, sur le modèle de [`sentinelqa/.env.example`](sentinelqa/.env.example).

Les clés restent toujours hors du dépôt.

```sh
python3 -m venv .venv && .venv/bin/pip install -r sentinelqa/requirements.txt
.venv/bin/python sentinelqa/runner/qa_worker.py --schema   # une fois : crée la file QA dans Supabase
.venv/bin/python sentinelqa/runner/qa_worker.py            # le worker qui exécute les missions
cd sentinelqa/web && npm install && npm run dev            # http://localhost:3100
```

Dans la web : « Lancer un audit », onglet **QA**, puis « Dicter la consigne » ou une consigne tapée, « Préparer le plan » et « Lancer l'agent ».

Sans la web :

```sh
.venv/bin/python sentinelqa/runner/qa_moteur.py --consigne "Ouvre Programmes puis le Bachelor et vérifie qu'il affiche « Bac+3 »"
.venv/bin/python sentinelqa/runner/qa_moteur.py --cible peer-review --email <compte> --identite "<nom affiché>" \
  --consigne "Une fois connecté, vérifie…"   # site connecté : le mot de passe est demandé, puis va au coffre H ; --repetitions 10 pour répéter
.venv/bin/python sentinelqa/runner/qa_moteur.py --exploration --mobile
.venv/bin/python sentinelqa/runner/qa_moteur.py --reverifier sentinelqa/rapports/qa-….json   # rejoue la vérification, sans agent
```

## Lancer le banc pentest

`sentinelqa/demo.sh` démarre Paie Express et un tunnel public, puis lance l'audit. Il demande le feu vert avant toute écriture et ouvre le rapport à la fin. Avec `--surveiller`, il traite les demandes envoyées par la web.

## Tests

```sh
.venv/bin/python -m unittest discover -s sentinelqa/runner/tests -p 'test_*.py'
.venv/bin/python -m unittest discover -s contributions/kimi-pentest/tests
.venv/bin/python -m unittest discover -s contributions/hf-pentest/tests
cd sentinelqa/web && npm test
```

## Structure

| Chemin | Contenu |
|---|---|
| `sentinelqa/runner/` | Le moteur Python : QA (`qa_*.py`), pentest (`sentinelqa.py`, `missions.py`), agents H |
| `sentinelqa/web/` | La web Next.js : lancement, suivi en direct, arrêt, rapports |
| `sentinelqa/web-console/` | Un prototype d'interface (v0), sur des données simulées (en local, pas encore publié) |
| `sentinelqa/contrats/` | Les cibles autorisées et les règles partagées entre le runner et la web |
| `sentinelqa/supabase/` | Les schémas SQL |
| `sentinelqa/cobaye/` | Paie Express, l'application de test à failles injectées (comptes fictifs) |
| `contributions/` | Les modules pentest en cours, non intégrés (voir leur [état](contributions/README.md)) |

## Pièges connus

- Ouvrir `localhost`, pas `127.0.0.1` : en `next dev`, le contrôle d'origine refuse sinon toute écriture.
- `holo login` écrit la clé entre guillemets : retirez-les à la lecture, sinon H répond 403.
- Ne lancez pas `next dev` dans un dossier où tourne déjà un `next start` : les deux écrivent dans le même `.next`.
- H relit un agent avec ses valeurs par défaut (`headless`, `lazy`, `settle_s`…) : comparez seulement les champs que vous fixez.
- Le menu de chaque page cite les autres pages : un texte attendu se cherche dans le contenu, hors `nav`, `header` et `footer`.
- L'agent H dispose d'un outil absent de la documentation, `web_fetch`, qui lit une page sans l'afficher : il est interdit dans sa consigne et relevé dans le rapport.
- H refuse désormais `start_url: "about:blank"` à la création d'un agent (422). Ne fixez pas de page de départ dans la définition : chaque session impose la sienne.
- Sur un titre à styles mêlés (« Bonne *soirée*, Alec »), le texte relevé par H ne garde que la partie en italique. Une citation exacte y devient introuvable : le rapport le dit (`h_text_partial`) et renvoie à la capture.
- `next build` télécharge les polices chez Google. Le 18/11 à 15 h, ce téléchargement a échoué trois fois de suite, alors qu'une requête isolée passait : relancez, ou intégrez les polices au projet (tâche 18 du suivi).

## Règles

- Uniquement des sites contrôlés par l'équipe, ou autorisés par écrit (article 323-1 du Code pénal). Aujourd'hui : eugeniaschool.com et peer-review-black.vercel.app, en consultation, sans aucune écriture.
- Aucun secret dans le dépôt. Le `.gitignore` fonctionne en liste blanche : seuls les chemins listés sont publiés.
- « Conforme » ou « écart » : seulement avec une preuve relevée par le code.
