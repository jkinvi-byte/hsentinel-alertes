# HSentinel : le business

> Votre IA code vite. Notre agent prouve ce qui fuit.

Ce document complète le [README](README.md), qui reste la source de vérité sur ce que fait le produit. Les chiffres du produit (59/60, 6/6, coûts) viennent du README et de [SUIVI.md](SUIVI.md). Les chiffres de marché viennent de sources externes : chaque ligne dit si elle est vérifiée ou à confirmer.

## En une phrase

HSentinel vérifie, toute l'année, deux choses qu'une petite équipe ne vérifie pas à chaque version : le parcours de l'application marche-t-il encore, et une entreprise cliente peut-elle lire ou modifier les données d'une autre ?

## Pour qui

- **Cible** : les éditeurs de logiciels SaaS B2B, de 10 à 50 personnes, qui livrent chaque semaine, souvent avec du code écrit par l'IA, et qui n'ont pas d'expert en sécurité dans l'équipe.
- **Pourquoi eux** : dans un SaaS B2B, plusieurs entreprises clientes partagent le même logiciel. Si l'une voit les données d'une autre, c'est le client qui fait la une, et l'éditeur qui perd le contrat. Exemple réel : en 2025, McHire, le logiciel de recrutement que Paradox.ai vendait à McDonald's, laissait lire 64 millions de candidatures en changeant un numéro dans l'adresse (I. Carroll et S. Curry, relayé par BleepingComputer).
- **Qui utilise, qui paie** :
  - Thomas, développeur principal, essaie l'outil gratuitement.
  - Léa, directrice technique, paie pour prouver la sécurité à ses grands clients.
  - Plus tard, les cabinets d'audit pourront s'en servir pour revérifier entre deux missions (partenaires, horizon 18 mois).

## Le problème

- Le contrôle d'accès défaillant est le n° 1 du Top 10 OWASP 2025. La page officielle indique que 100 % des applications testées en présentaient une forme. **Vérifié** (OWASP A01:2025).
- Les tests automatiques vérifient le code, pas ce qu'un utilisateur peut réellement faire en ligne.
- Un audit par un expert coûte cher et n'a lieu qu'une ou deux fois par an. Il est périmé dès la version suivante.

## L'offre

Abonnement par application. On ne facture ni au test, ni à la faille trouvée : ce serait un conflit d'intérêts.

| Offre | Prix | Contenu |
|---|---|---|
| Découverte | 0 € | 7 jours d'essai |
| Launch | 249 € / mois | Le parcours vérifié à chaque nouvelle version |
| **Scale** (notre cible) | 599 € / mois | Le parcours, et les tests de fuite entre clients chaque nuit |
| Audit Express | 790 €, une fois | Un contrôle complet avec rapport de preuves, avant un gros contrat |

Source : note tarifaire de l'équipe, 19/11/2026. **Prix à valider avec les premiers clients.** Les crédits, le paiement et le renouvellement ne sont pas encore codés (SUIVI, tâche 47).

## Ce que ça nous coûte

Coûts lus dans l'API H, session par session (README et SUIVI). Hébergement, abonnement H et support non compris.

| Test | Coût | Durée |
|---|---|---|
| Audit complet du banc, lancé depuis la console | 0,203 $ | 298 s |
| Test à deux vrais comptes sur Peer Review (S-PEER-02) | 0,035 $ | 106 s |
| Parcours guidé sur un vrai site | 0,007 $ | 29 s |

La marge réelle se mesurera avec les premiers clients, hébergement et support compris. On ne cite pas de taux de marge.

## Les alternatives

| Alternative | Prix | Ce qu'elle fait | Ce qu'elle ne fait pas | Statut du chiffre |
|---|---|---|---|---|
| Scanner automatique (ex. Detectify Standard) | dès 2 500 € / an | Cherche les failles techniques connues | Ne se met pas à la place de deux clients | **Vérifié**, page tarifs officielle (20/11) |
| Visite d'un expert | 4 000 € et plus par audit | Le plus complet, logique métier comprise | Une à deux fois par an | Vérifié (Kolonell, oct. 2026) ; la fourchette 4 000 à 18 000 € des cabinets PASSI est **à confirmer** |
| Burp Suite + extension Autorize | Gratuit ou licence Burp | Rejoue les requêtes d'un compte avec la session d'un autre | Il faut un humain qui navigue pour fournir les requêtes | Fait connu |
| Escape (Paris) | Sur devis | Agent IA sur la logique métier des applis web et API (IDOR, BOLA) | Passe par l'API ; vise des équipes sécurité | Levée de 18 M$ **à confirmer** (SecurityWeek) |
| Horizon3 NodeZero WebApp | Grands comptes | Teste depuis juillet 2026 les applis web connectées, IDOR compris, en HTTP | Pensé pour les grandes entreprises | Chiffres (250 M$, valo > 2 Md$) **à confirmer** (Forbes) |
| XBOW | ~4 000 à 8 000 $ par test | Test web automatisé, ponctuel | Vendu au test, pas en continu | **À confirmer** (comparatifs 2026) |
| QA.tech | dès 89 $ / mois | Agent IA de QA par l'interface | Ne prouve pas de fuite entre clients | **À confirmer** |

**Notre différence, dite simplement** : un agent qui voit l'écran découvre seul les pages, comme un utilisateur. Notre code rejoue ensuite ces pages avec le compte d'une autre entreprise. L'agent confirme la faille à l'écran, et une règle écrite décide (« l'agent montre, le code décide »). Le tout est pensé pour une petite équipe sans expert : deux questions simples, une preuve lisible par tous, toute l'année.

**À ne pas dire** :
- « Personne ne fait ça » ou « nous sommes les seuls » : Escape et Horizon3 testent déjà l'IDOR.
- « Sans API » : notre rejeu passe par HTTP. Seules l'exploration et la confirmation passent par l'écran.
- « Derrière SSO » : non testé à ce jour.

## Marché (ordres de grandeur)

| Marché | Taille 2026 | Croissance | Source | Statut |
|---|---|---|---|---|
| Pentest-as-a-Service (abonnement, continu) | ~0,72 Md$ | ~+22,6 % / an, ~1,98 Md$ en 2031 | MarketsandMarkets | À confirmer |
| Tests logiciels dopés à l'IA | ~12 Md$ | ~+27 % / an | Mordor Intelligence | À confirmer |
| Sécurité applicative | ~14 Md$ | ~+12 % / an | MarketsandMarkets | À confirmer |

Les périmètres de ces études varient : ce sont des ordres de grandeur, pas une base de calcul.

## Pourquoi maintenant

- L'IA écrit du code plus vite que jamais. Selon Veracode (2025), 45 % des échantillons de code générés par IA ont échoué à des tests de sécurité. Source : un éditeur de sécurité.
- Fin 2026, des applications générées avec Lovable répondaient sans aucune connexion. Un forum exposait plus de 80 000 profils, et un autre service plus de 1 000 dossiers avec des numéros de passeport. Source : Crissy Field avec le Handelsblatt, 2 nov. 2026, **vérifié**. Les auteurs précisent que leurs 30 % ne sont pas un taux de fuite confirmé.
- Les équipes livrent chaque semaine. Une enquête d'éditeur (Aikido, 2026) avance que 76 % des organisations livrent chaque semaine ou plus, mais que 21 % seulement vérifient la sécurité à chaque version. **À confirmer**, source intéressée.
- Pour les éditeurs qui traitent des paiements par carte, la norme PCI DSS 4.0 demande un test d'intrusion au moins une fois par an et après tout changement important.

## Comment on vend

1. **Entrer par la QA** : le développeur branche HSentinel sur son site de préproduction. Vérifier que le parcours marche est un besoin connu et budgété, qui ne fait pas peur.
2. **Monter vers la sécurité** : une fois l'accès donné, on active les tests de fuite entre clients (offre Scale).
3. **Garder le client** : le contrôle toute l'année et l'historique des failles rendent l'outil difficile à retirer.

Canaux : essai gratuit en libre-service, LinkedIn, communautés de développeurs, contenu pédagogique sur l'IDOR. Plus tard : les cabinets d'audit comme partenaires.

Frein principal : donner des comptes à un outil qui « attaque ». Notre réponse : des comptes de test dédiés, des données fictives, des mots de passe rangés dans le coffre de H (l'agent ne les voit jamais), et uniquement des sites autorisés par écrit (article 323-1 du Code pénal).

## Ce qu'on doit encore prouver

- Le prix : 3 premiers clients pour mesurer le temps gagné et la volonté de payer.
- La demande : le questionnaire n'a eu que 2 réponses, toutes deux hors cible. Il faut aller chercher les éditeurs en entretien direct.
- Les chiffres marqués « à confirmer » ci-dessus, sur des sources primaires.

## Historique

HSentinel est né de deux pistes explorées les 16 et 17 novembre 2026 :
- **AppZero** : un pentest applicatif continu, vendu aux entreprises régulées via les cabinets PASSI.
- **SentinelQA** : la QA et le pentest réunis, pour les startups SaaS.

Nous avons retenu la cible de SentinelQA. Le canal des cabinets d'audit d'AppZero reste une étape ultérieure.
