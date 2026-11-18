# Playbook d'attaque — contrôle d'accès multi-tenant

> La « mémoire » offensive de HSentinel : les schémas de failles que les agents connaissent déjà.
> Injecté dans le guidage (Kimi K3) et dans la consigne du Pentest. S'enrichit à chaque audit.
> Périmètre STRICT : accès d'un tenant/utilisateur aux données d'un autre. Rien d'autre.

## P1 — IDOR en lecture (objet par identifiant)
- **Idée** : un objet privé est servi par une adresse `/ressource/{id}` ; le serveur vérifie-t-il la propriété ?
- **Tester** : le propriétaire ouvre l'objet et capture son URL+id ; l'intrus ouvre la même URL.
- **Signal de faille** : l'intrus reçoit la ressource du propriétaire (similarité ≥ 0,95). Sain = 403/404/redirection.

## P2 — Contournement par paramètre d'URL
- **Idée** : une liste/vue filtre selon un paramètre (`?entreprise=`, `?eleve=`, `?candidature=`, `?org=`) auquel le serveur fait confiance.
- **Tester** : l'intrus met l'identifiant du propriétaire dans le paramètre.
- **Signal** : les données de l'autre tenant s'affichent. Sain = le serveur ignore le paramètre / renvoie son propre contexte.

## P3 — Write-IDOR (écriture sur l'objet d'autrui)
- **Idée** : la lecture est protégée mais l'**écriture** (modifier/supprimer) ne revérifie pas la propriété — erreur classique.
- **Tester** : capturer la requête d'enregistrement du propriétaire ; la rejouer depuis l'intrus en ne changeant que l'id. Changement anodin, remise en l'état.
- **Signal** : la modification est persistée sur l'objet du propriétaire. Sain = refus/validation d'appartenance.
- **Note** : sur server actions Next.js, rejouer le corps **brut** exact (le forge naïf échoue à la validation).

## P4 — Escalade de privilèges par rôle
- **Idée** : une zone réservée (admin, coach, export) vérifie la connexion mais pas le **rôle**.
- **Tester** : un compte à rôle faible ouvre directement l'URL réservée / l'action réservée.
- **Signal** : le compte faible atteint la zone/action. Sain = refus selon le rôle.

## P5 — Accès résiduel après changement de droits (T1)
- **Idée** : après rétrogradation/retrait, un accès **reste** ouvert (ancienne session, jeton, lien de partage non révoqué).
- **Tester** : capturer les accès **avant** le changement ; le Préparateur change le droit ; rejouer les mêmes accès **après**, avec l'ancienne session puis une nouvelle.
- **Signal** : un accès attendu refusé renvoie la même réponse qu'avant. Tenir compte du délai de révocation.

## P6 — Énumération d'identifiants
- **Idée** : si les id sont **séquentiels/devinables** (entiers, dates), on atteint d'autres tenants sans les connaître.
- **Tester** : observer la forme de l'id (entier vs UUID) ; si devinable, tenter des voisins (avec prudence, données d'autrui).
- **Signal** : des objets d'autres tenants répondent. UUID aléatoire = surface fortement réduite.

## P7 — Endpoint / API non protégé
- **Idée** : l'API (`/api/...`, flux RSC) qui alimente l'écran applique-t-elle le même contrôle que la page ?
- **Tester** : rejouer l'appel d'API de l'objet du propriétaire avec la session de l'intrus.
- **Signal** : l'API renvoie la donnée sans vérifier la propriété, même si la page, elle, la protège.

---
### Enseignements accumulés (s'enrichit à chaque cible)
- **Cadence (18/11)** : P1 protégé (404), P2 protégé (paramètre ignoré), P3 non concluant (server action Next.js dure à forger). Objets = UUID (P6 peu praticable).
- **Peer Review (18/11)** : P1 recaps protégé en intra-équipe ; **cross-équipe (P1/P4/P7) et évaluations NON testés** (manque un compte d'une autre équipe).
- **Juice Shop (18/11, cible vulnérable)** : P1/P7 **FUITE confirmée** — lecture du panier d'autrui via `GET /rest/basket/{id}` ; P1 **FUITE confirmée** — lecture du compte d'autrui via `GET /api/Users/{id}` (fuite d'e-mail). P3 écriture (`POST /api/BasketItems` avec le BasketId d'autrui) **refusée (401)** sur cet endpoint.
  **Leçon (à réutiliser) :** sur une API REST + JWT, l'IDOR se trouve là où **l'identifiant de l'objet est dans l'URL** et où le serveur fait confiance à **l'identité du jeton mais pas à la propriété de l'objet**. Priorité : tester tout `GET /ressource/{id}` (panier, compte, commande, adresse) avec le jeton d'un autre compte. L'écriture est souvent mieux protégée que la lecture.
