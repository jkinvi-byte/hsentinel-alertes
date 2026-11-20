# HSentinel — Fiche orale CTO

**À relire juste avant le jury · 20 novembre 2026 · code `902b0c9`**

## La phrase centrale

**« HSentinel vérifie les parcours utilisateurs et les contrôles d'accès d'un SaaS. H navigue, Hugging Face prépare, nos règles évaluent les preuves. »**

Deux volets de même importance : QA fonctionnel et pentest. Un même besoin : vérifier les effets d'une évolution de l'application.

## Le dessin en vingt secondes

**Console Next.js sur Vercel → Supabase → deux workers Python → H + contrôles HTTP → rapport → alertes n8n.**

- HF : plan, transcription, conversation, voix ; priorisation encadrée dans le scanner.
- Workers actuellement sur le Mac ; navigateur chez H.
- QA : `qa_missions`, rapport v3. Pentest : `audits`, rapport v2.
- Suivi par polling ; pas Supabase Realtime dans ce parcours.
- Une mission terminée peut contenir des résultats non concluants.

## Les cinq choix à défendre

1. **H + HTTP.** H prouve le parcours dans l'interface ; HTTP confirme efficacement certaines observations. Les tests purement HTTP n'ont pas besoin de clics artificiels.
2. **Règles de verdict.** Elles sont inspectables et testables. Même règle et mêmes observations donnent le même résultat ; toute l'exécution n'est pas déterministe.
3. **Jobs hors de Next.js.** Les campagnes durent plusieurs minutes et continuent si l'utilisateur ferme sa page.
4. **Supabase comme file.** Persistance et réservation conditionnelle, avec peu de composants. Il manque la reprise automatique après crash et l'idempotence globale.
5. **Banc + sites réels.** Le banc mesure la détection sur défauts connus ; les sites réels prouvent l'intégration. L'un ne remplace pas l'autre.

## Les chiffres sûrs

| Cas | À dire | Limite |
|---|---|---|
| QA « Bac+3 » | 10/10 ; moyenne 29 s et 0,007 $ H | Un scénario précis |
| QA connecté | Connexion/identité 10/10 ; 40 s, 0,015 $ H | D'autres critères restent non concluants |
| Paie Express | 59 détections sur 60 occasions ; 6 failles injectées, 10 audits | Pas 59 failles différentes ; pas un taux de marché |
| S-PEER-02 | 2 conformes, 0 faille, 1 non concluant ; 106 s | Aucune fuite démontrée sur l'école |
| Scanner laboratoire | 6 vulnérabilités fictives uniques ; 7 ressources dans la matrice | Les 10 assertions échouées ne sont pas 10 vulnérabilités |

Coût H ≠ coût complet. Durée machine ≠ temps humain gagné. Le temps humain reste à mesurer selon le suivi.

## Les réponses qui évitent les pièges

**Pourquoi pas Playwright ?** Il est pertinent pour les parcours stables ; nous l'utilisons. H apporte l'exploration visuelle à partir d'une intention. Le gain de maintenance comparé reste à mesurer.

**Votre IA peut se tromper ?** Oui. On confronte ses observations aux règles et aux preuves. Une citation retrouvée recoupe son constat sans prouver toute sa signification métier.

**Pourquoi non concluant ?** Un échec d'outil, une page générique ou une session expirée ne doivent pas devenir une conformité inventée.

**Vous êtes prêts pour cent clients ?** Pas dans l'exploitation actuelle. Il faut héberger et superviser les workers, ajouter organisations/RLS, quotas et reprise des missions.

**La RLS isole déjà les clients ?** Elle ferme l'accès public. Le backend privilégié et l'accès opérateur commun ne constituent pas une isolation client.

**Le mot de passe ?** Chiffré dans le navigateur, retiré de la demande en base avant déchiffrement par le runner, puis coffre H et nettoyage. Pas de secret dans le prompt ; pas de promesse « zéro donnée sensible ».

**L'arrêt est immédiat ?** Non : annulation coopérative. La garde H observe des événements après les gestes.

**Vous avez trouvé une faille réelle sur l'école ?** Les rapports examinés n'en démontrent pas. Les résultats positifs sont sur les bancs fictifs.

**Pourquoi vous plutôt qu'un autre agent ?** Profils métier, vérification des parcours et des accès, résultats examinables et suivi. La différenciation doit être démontrée, car le QA par agent existe déjà.

## Avant de monter sur scène

- Confirmer le déploiement : le dernier D-54 est publié mais déclaré non déployé dans la console.
- Vérifier les deux workers par une mission de bout en bout ; une clé publique présente n'est pas un heartbeat.
- Préparer une preuve conforme, un défaut injecté et une non-conclusion expliquée.
- Identifier explicitement ce qui est live et ce qui est archivé.
- Tester le micro réel ; garder la saisie clavier disponible.

**Si une question te déstabilise : décision → raison → preuve → limite → prochaine étape.**

[Dossier complet et 40 questions](DEFENSE-TECHNIQUE-CTO.md)
