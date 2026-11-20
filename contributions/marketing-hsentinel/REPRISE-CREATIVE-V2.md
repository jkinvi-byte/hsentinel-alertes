# HSentinel — reprise créative V2

19 novembre 2026. Proposition après le retour d’Aurian : V1 rejetée pour la faiblesse des images, de l’animation et du pitch. Ce document prépare une nouvelle production ; aucune génération Higgsfield n’a encore été effectuée.

**Précision d’Aurian intégrée :** la direction de réalisation détaillée — identité, dix plans, raccords, rythme, musique et signature sonore — se trouve désormais dans [FILM-MARQUE.md](FILM-MARQUE.md). Elle précise et remplace le découpage uniforme ci-dessous. Le présent document conserve l’analyse du produit, le choix des outils et les conditions de connexion.

**Angle : « Votre équipe construit. HSentinel vérifie. »**

Le CTO achète la possibilité de déléguer une partie des vérifications répétitives et de disposer de constats exploitables. Le film doit faire ressentir ce travail transféré à l’agent, puis montrer pourquoi l’équipe peut examiner le résultat : parcours exécuté, preuves et contrôle par le code. Le temps humain récupéré reste à mesurer ; aucun chiffre de gain n’est affiché.

La V1 montrait principalement des panneaux sombres et énumérait QA, pentest et rapports. Sa cadence uniforme et ses mouvements très faibles donnaient un aspect de présentation. Elle laissait hors champ la dictée, la préparation du plan, l’action visible dans le navigateur et le passage du constat à une décision. Le quota GPU a limité les médias disponibles ; la direction créative et le pitch devaient néanmoins être meilleurs.

**Ce que le produit actuel permet de raconter**

État *lu* dans [ARCHITECTURE.md](../../ARCHITECTURE.md), version du 19/11 à 3 h 15, et dans les composants de la console. Ces exécutions n’ont pas été rejouées pour le brief.

- QA : consigne écrite ou dictée → plan relu → navigation réelle de l’agent → vérification des critères → rapport. Exploration bornée, ordinateur/mobile et connexion existent.
- Pentest : scénarios de contrôles d’accès avec lectures HTTP et observation à l’écran. Un exemple du banc Paie Express peut illustrer une faille injectée ; le contrôle anonyme réel sur Peer Review a également été exécuté.
- Le code distingue les constats prouvés des résultats non concluants. Les preuves servent à comprendre et traiter le résultat.
- La console est désormais déployée. Le ticket GitHub issu d’un constat a été vérifié par le chemin de rattrapage ; le déclenchement instantané reste à réparer. Le film peut montrer un ticket existant, avec une ellipse de montage, sans chronomètre ni promesse d’instantanéité.

Le plan QA et le scénario pentest restent deux missions distinctes. La dictée est une entrée du QA ; le film ne l’attribue pas à un pentest vocal généraliste encore non livré.

**Choix de production**

Je recommande un essai dans **Higgsfield Cinema Studio**, puis la composition des interfaces, du logo et des textes avec les enregistrements du produit. Higgsfield est une plateforme donnant accès à plusieurs modèles. Le choix porte sur la direction de caméra, les références et l’itération autant que sur le modèle.

| Besoin | Traitement proposé |
| --- | --- |
| Profondeur, lumière, mouvement, transitions spectaculaires | Cinema Studio, avec des images de référence cohérentes et un mouvement précis par prise. |
| Clics, consigne, états du produit, preuves | Enregistrements HSentinel et calques contrôlés ; les textes utiles gardent leur géométrie et leur lisibilité. |
| Effet visuel fort | Une consigne vocale devient un parcours, puis la caméra rejoint le navigateur où l’agent agit. Chaque transformation représente une étape du produit. |
| Son | Voix française dirigée, pauses prévues et sons d’actions synchronisés. Audition du résultat avant montage final. |

Les capacités de caméra, d’éclairage et de continuité sont décrites dans la [documentation Cinema Studio](https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio), ouverte et lue. Elles justifient l’essai ; elles ne prouvent pas qu’une prise sera meilleure avant comparaison. **Marketing Studio** propose des formats publicitaires à partir de produits et de références ; son système de presets ne remplace pas notre scénario SaaS. [Documentation ouverte](https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-marketing-studio-to-create-video-ads).

**Voix off proposée, environ 30 secondes**

> Votre équipe livre. Et les vérifications recommencent.
> Déléguez-les à HSentinel.
> Dictez votre parcours. L’agent agit dans votre application.
> QA : les fonctionnalités.
> Pentest : les accès entre comptes.
> Retrouvez les constats vérifiés et leurs preuves, pour savoir quoi corriger.
> HSentinel. Votre équipe construit. Nous vérifions.

Le montage complète la narration avec des actions lisibles. Le temps humain libéré est la proposition de valeur à valider commercialement. La voix n’annonce ni des économies mesurées ni une couverture exhaustive.

**Découpage**

| Temps | Action visible | Message |
| --- | --- | --- |
| 0–4 s | Une release devient une suite de gestes à refaire : connexion, page, compte. Raccords rapides entre le même clic dans plusieurs écrans, puis arrêt net. | « Encore à revérifier. » |
| 4–8 s | Une onde vocale rejoint la consigne réelle ; le plan apparaît, l’utilisateur le relit et lance. La caméra accompagne le passage de la consigne à l’action. | « Déléguez l’exécution. » |
| 8–14 s | Extrait QA agrandi : l’agent clique, ouvre la page attendue, retrouve le contenu. Un marqueur suit les gestes réellement enregistrés. | « QA · Ce qui doit fonctionner » |
| 14–20 s | Même importance et même durée pour le pentest. A ouvre son document ; B tente l’accès ; zoom sur le constat et sa preuve issus du même essai Paie Express. | « Pentest · Qui peut accéder à quoi ? » + « Démo · défaut injecté » |
| 20–25 s | Le geste, la capture et le résultat du même contrôle s’alignent. Un constat devient une tâche à examiner ; un éventuel ticket GitHub arrive après une ellipse. | « Une preuve. Une action à traiter. » |
| 25–30 s | Raccord de mouvement vers le logo ; écran calme, promesse et CTA lisibles. | « Votre équipe construit. HSentinel vérifie. » / « Faites tester votre parcours critique. » |

L’offre gratuite du premier brief peut rester une petite ligne finale, une fois retenue par l’équipe. La promesse principale porte sur le travail délégué et les preuves. Aucun prix ni domaine commercial n’est inventé.

**Première séquence à produire : 8 secondes, « La consigne devient action »**

Préparer deux images de référence : début sur une onde vocale et un cadre de consigne, fin sur le navigateur de la console. Utiliser un véritable extrait QA comme calque de contenu. L’objectif est de juger la matière, le mouvement, le raccord et la lisibilité sur une seule séquence. Les variantes changent la caméra et la lumière ; le contenu du produit reste identique.

Prompt pour la prise de décor/mouvement, en anglais :

```text
Eight-second premium software commercial shot. A precise electric-blue audio waveform travels across a deep graphite workspace. The waveform folds into a thin luminous route connecting three rigid interface frames. The camera follows this route in one fluid dolly movement with clear foreground and background parallax, passing close to the first frame and settling squarely in front of the final browser frame. The movement expresses an instruction becoming a sequence of actions. Sculpted side lighting, crisp blue highlights, rich black materials, controlled white reflections, convincing spatial depth. Acceleration is brief at the transition, followed by a stable two-second hold on the final composition. Keep the flat browser surface empty and geometrically stable for the supplied real screen recording to be composited. Preserve the uploaded start and finish compositions. Build the visual around this single transformation. All legible interface content, the pointer, typography and brand mark will be added from product assets in compositing.
```

La forme vocale et les éléments d’interface peuvent aussi être animés directement au montage si le modèle les déforme. Le résultat recherché est un mouvement construit en profondeur, avec une véritable action de produit et une fin lisible. La caméra ne doit pas masquer le fonctionnement.

Le premier essai est retenu seulement si le mouvement dépasse un simple zoom sur une image, les cadres gardent leur forme, le raccord vers l’écran réel fonctionne, et la phrase/action se comprend en une lecture. Le film complet se construit ensuite autour de ce niveau visuel. Le 4:5 demande une composition dédiée.

**Connexion et coût — vérifiés dans les sources officielles**

Le connecteur officiel Higgsfield a été retrouvé dans le catalogue de plugins de cette session ; il n’est pas installé. La [documentation de connexion](https://higgsfield.ai/creator-hub/help-center/integrations/how-do-i-connect-higgsfield-to-ai-agent), ouverte et lue, indique un abonnement actif pour la connexion aux agents. Elle distingue les fonctions du site de celles accessibles dans ChatGPT : la génération audio n’y est notamment pas annoncée disponible.

Les générations via MCP/CLI consomment des crédits, même lorsqu’un modèle est proposé en illimité sur le site. Le coût dépend du modèle, de la durée et de la résolution. [Règles officielles de crédits, ouvertes et lues](https://higgsfield.ai/creator-hub/help-center/credits/how-credits-work). Le prix d’une prise doit venir du devis affiché pour ses réglages ; aucun budget exact ni achat d’abonnement n’est arrêté dans ce brief.
