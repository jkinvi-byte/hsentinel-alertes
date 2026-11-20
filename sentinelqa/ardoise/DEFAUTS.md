# Ardoise : les défauts plantés (vérité terrain du QA HSentinel, D-56)

Ardoise est un SaaS fictif, construit par l'équipe pour montrer le QA HSentinel sur une application jamais vue par l'agent.
Ses données sont fictives, arrêtées au 20 novembre 2026. Trois défauts fonctionnels y sont plantés, volontairement :

| Défaut | Où | Ce qu'on voit | Ce que le code de HSentinel peut prouver |
|---|---|---|---|
| D1 | Factures | « 2 factures en retard », alors que le tableau de bord en annonce 3 (4 210 €) | Rien seul : la page est privée, l'absence d'un texte n'y est pas prouvable. L'agent peut le signaler (« écart signalé · à confirmer »). |
| D2 | Clients | « undefined » à la place de la ville d'Imprimerie Faure | Écart constaté : texte anormal à l'écran (contrôle T) |
| D3 | Menu, « Aide » | Une page introuvable (HTTP 404) | Écart constaté : HTTP 404 relu par le code, et « Page introuvable » à l'écran |

D1 vient d'une comparaison de dates écrites en texte (« jj/mm/aaaa ») : « 28/10/2026 » passe après « 20/11/2026 ».

Les comptes de démonstration (ARDOISE_COMPTES), le secret de session (SESSION_SECRET) et le jeton de vérification
(HSENTINEL_VERIFICATION) viennent de l'environnement de déploiement Vercel ; aucun n'est écrit dans ce dossier.
