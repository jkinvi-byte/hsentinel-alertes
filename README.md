# HSentinel · premiers agents et premiers tests

> 17/11/2026 · Mohamed (CAIO). Bac à sable pour créer les agents H et mesurer leurs premiers tests sur deux cibles.
> Ce n'est pas l'orchestrateur de l'équipe (sur le Mac d'Aurian) : ici on teste les agents seuls, puis on branche le rejeu.

## 0. Les deux cibles (règle non négociable)

On ne teste **que des sites que l'équipe contrôle** (art. 323-1 du Code pénal, CLAUDE.md §8).

| Cible | Pourquoi | Comptes |
|---|---|---|
| **Paie Express**, notre cobaye | Failles connues (F1–F6, C1–C4) : on peut compter les détections et les fausses alertes | A (admin Alpha), B (admin Bêta), C (salarié Alpha) |
| **OWASP Juice Shop**, **notre propre instance** | Application tierce, volontairement vulnérable, avec des IDOR entre utilisateurs (le panier d'un autre client) : elle répond à la question du jury « et sur une vraie application ? » | Deux clients qu'on inscrit nous-mêmes : A (alice), B (bob) |

- **Pas l'instance publique de démo** de Juice Shop, ni un site « trouvé » : on déploie la nôtre (image Docker `bkimminich/juice-shop`, sur un hébergeur qui accepte Docker, par exemple Railway ou Render).
- **Les deux cibles doivent avoir une URL publique** : le navigateur cloud de H n'atteint pas `localhost`, et le réseau de l'école bloque le tunnel Cloudflare. Paie Express → Vercel (livrable 1 d'Aurian et Jahdiel).
- Si les « sites mis à disposition » sont fournis par l'organisation, il faut **une autorisation écrite** avant de lancer quoi que ce soit dessus.

## 1. Les plateformes, et ce qu'on y fait

| Plateforme | Ce qu'on y fait aujourd'hui |
|---|---|
| **H Company** · `platform.hcompany.ai` | Clé API (Settings → API keys), console des sessions et replays. Doc : `hub.hcompany.ai` |
| **Hugging Face** | Jeton `HF_TOKEN` pour l'étape suivante (guidage du Pentest, explication) |
| **Vercel** | Héberger Paie Express (URL publique) |
| **GitHub** | Mettre ce dossier dans le dépôt de l'équipe (`.env`, `coffres.json`, `cibles.json` sont ignorés) |

Le compte H de l'équipe est celui du CEO (identifiants dans le PDF, p. 22–23) : **jamais dans le dépôt**. Les agents, leurs formats de réponse et leurs garde-fous sont ceux de l'architecture (`architecture.html`) : `sentinelqa-explorateur`, `sentinelqa-verificateur`, navigateur `sentinelqa-navigateur`, réponse `Constat` (`confirme`, `ce_qui_est_visible`, `proprietaire`).

## 2. Installation (10 min)

```bash
cd agents_demo
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # y mettre HAI_API_KEY
cp cibles.example.json cibles.json   # y mettre les URL et les e-mails des comptes
```

Vérifier que la clé marche et que le SDK accepte les plafonds :

```bash
python -c "from hai_agents import Client; c=Client(); r=c.run_session(agent='h/web-surfer-flash', messages='Donne le titre de la page https://example.com'); print(r.status, r.answer)"
```

```bash
python -c "from hai_agents import Client; help(Client.run_session)" | grep -E "max_steps|max_time_s|overrides|answer_schema"
```

Si `max_steps` et `max_time_s` n'apparaissent pas, les scripts le signalent et la limite ne repose plus que sur la consigne : à signaler aux mentors H (retour sur l'API).

## 3. Créer les agents et les coffres

```bash
python 01_creer_agents.py
```

Crée `sentinelqa-explorateur` (cartographie) et `sentinelqa-verificateur` (ouvre une adresse, décrit, ne clique sur rien d'autre), modèle `holo4-35b-a3b`, navigateur visuel, garde-fous dans les instructions — comme dans l'architecture.

```bash
python 02_creer_coffres.py paie
```

```bash
python 02_creer_coffres.py juice
```

Un coffre H par compte. Le mot de passe est tapé au clavier et part directement chez H ; l'agent se connecte par `fill_secret_at` sans jamais le voir.

## 4. Premier test : cartographier, puis changer de compte

```bash
python 03_explorer.py juice A
```

```bash
python 04_verifier.py juice B resultats/carto_juice_A_XXXXXX.json --max 5
```

Puis la même chose sur Paie Express (`paie A`, puis `paie B`, puis `paie C` pour l'administration).

**Lire le résultat :** si B voit le panier ou la fiche de A, c'est une **suspicion**. Elle ne devient une faille prouvée qu'après le rejeu HTTP (similarité ≥ 0,95) de l'orchestrateur : c'est la règle D-05, à brancher avec Aurian.

## 5. Ce qu'on mesure dès maintenant

Chaque session ajoute une ligne à `resultats/mesures.csv` : statut, steps, durée, tokens, **coût estimé**, lien du replay.

- **Paie Express :** pages trouvées par l'Explorateur, failles F1–F6 atteintes, C1–C4 bien refusés.
- **Juice Shop :** le panier de A vu par B, ou non ; coût et durée sur une vraie application (question ouverte n°6).
- **Les échecs :** connexion ratée, sortie du périmètre, réponse non conforme au schéma. Les noter : c'est le livrable « retours sur l'Agent API ».

Le coût est estimé à partir des tokens et des tarifs de la page Models (0,30 $ / 2,00 $ par million pour `holo4-35b-a3b`) : **à recouper avec la console H**, la doc ne donne pas de coût par session.

## 6. Ce qui reste non vérifié dans la doc H (à demander aux mentors)

1. Les CGU de H pour des tests de sécurité sur une préproduction autorisée.
2. `max_steps` et `max_time_s` comme paramètres de `run_session` (documentés seulement en REST).
3. Le coût en dollars d'une session (aucun champ trouvé).
4. L'accès du navigateur cloud aux adresses privées et aux previews Vercel protégées.

## 7bis. L'audit complet (pipeline de bout en bout)

Un seul lanceur enchaîne les 6 étapes de l'architecture (§2), en lecture seule :

```bash
.venv/bin/python auditer.py cadence --proprietaire A --intrus B --max-objets 3
```

| Module | Rôle (architecture) |
|---|---|
| `auditer.py` | Orchestrateur : enchaîne les 6 étapes, écrit le relevé |
| `gravite.py` | Gravité par règle écrite, sans IA (D-11) |
| `verdict.py` | Le verdict déterministe : similarité ≥ 0,95, règle de propriété (D-05) |
| `explication_hf.py` | L'explication en clair, Hugging Face, marquée « rédigé par IA » (D-23) |

Les 6 étapes : ① cartographie des objets **privés** du propriétaire (Explorateur) → ② re-test par l'intrus (Vérificateur authentifié) → ③ **notre code décide** le verdict → ④ gravité par règle → ⑤ explication HF → ⑥ relevé (`resultats/audit_*.json` + `mesures.csv`).

**Cadrage anti-faux-positifs :** `cibles.json` déclare `rubriques_privees` et `rubriques_partagees`. Une ressource partagée (ex : les exemples de CV mis par l'école dans Documentation) n'est jamais signalée comme fuite.

**Décision d'architecture assumée :** le rejeu HTTP pur (httpx, session rejouée) reste la cible **sur le cobaye**, où on maîtrise la connexion. Sur une app tierce à **auth maison** (comme Cadence), le contenu de l'intrus est rapporté par l'agent authentifié, mais **la décision reste dans notre code** (`verdict.py`) — on respecte D-05 « le code décide, les agents montrent ». La « recette de connexion » httpx est le point n°1 de la revue.

## 8. Étape suivante (ton livrable 5)

Une fois ces tests passés : le guidage Hugging Face. Il prend la cartographie de A et propose des priorités (`zone`, `ressource`, `raison`) que l'Explorateur, en mode profond, visite en premier. On mesure les failles trouvées avec et sans guidage, à budget égal.

---

## Distinguer le volet QA et le volet Pentest profond

Les deux volets utilisent **les mêmes agents H** (`hsentinel-explorateur`, `hsentinel-verificateur`) et **le même moteur de verdict par le code** (`verdict.py` + `gravite.py`). Ce qui change, c'est la **profondeur**, la **liberté** et le **guidage** :

| | **QA** (`auditer.py`) | **Pentest profond** (`pentest.py`) |
|---|---|---|
| **Quand** | à chaque mise à jour, en quelques minutes | régulièrement / avant un contrat, en profondeur |
| **Posture de l'agent** | scénarios **connus**, budget court (~45 steps) | **exploration libre**, consignes d'attaquant, budget large (~80+ steps) |
| **Guidage Hugging Face** | non (seulement l'explication en clair) | **oui** — Kimi K3 produit un **plan d'attaque** à partir du `playbook_attaque.md` |
| **Surface couverte** | les objets privés cartographiés (lecture) | + énumération d'id, API, paramètres d'URL, **écriture**, chaînage (schémas P1–P7) |
| **Écritures** | non (lecture seule) | oui, avec feu vert au cadrage + remise en l'état |
| **Lancer** | `python auditer.py <cible> --proprietaire B --intrus A` | `python pentest.py <cible> --proprietaire B --intrus A --budget 80` |
| **Verdict** | identique : le code décide (rejeu ≥ 0,95), gravité par règle | identique |

**Repère simple :** le **QA** répond à « est-ce que l'isolation **tient toujours** sur ce qui a changé ? ». Le **Pentest** répond à « **par où** peut-on casser l'isolation, même là où aucun écran ne le montre ? ».

Le `playbook_attaque.md` est la **mémoire offensive** commune : il liste les schémas de failles (P1–P7) et s'enrichit à chaque audit. Le Pentest s'en sert pour viser ; le QA non.
