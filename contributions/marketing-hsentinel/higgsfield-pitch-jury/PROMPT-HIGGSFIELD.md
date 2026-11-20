# HSentinel — Brief et prompts Higgsfield

20 novembre 2026 · Proposition de film jury de **60 secondes**, horizontal **16:9**. Ce film accompagne la démonstration ; il ne remplace pas les preuves d'exécution.

## Où coller le prompt

Le **brief complet** ci-dessous sert à l'AI Director lorsque cette fonction est présente dans Cinema Studio. La documentation décrit notamment ce dialogue dans Cinema Studio 3.5. Dans un champ de génération vidéo, utiliser **un prompt de plan à la fois**.

Cinema Studio 4.0 documente des clips jusqu'à 30 secondes, des références et l'audio natif ; le guide indique une sortie jusqu'à 1080p. Cela ne signifie pas qu'un seul prompt produit automatiquement un film monté de 60 secondes avec des interfaces exactes. Les capacités et coûts affichés dans le compte priment. [Aide officielle](https://higgsfield.ai/creator-hub/help-center/tools/how-do-i-use-cinema-studio), [guide Cinema Studio 4.0](https://higgsfield.ai/blog/cinema-studio-4-0-complete-guide).

**Production recommandée :** plans humains/décors/transitions dans Cinema Studio ; enregistrements du produit conservés tels quels ; titres, métriques, logo, voix continue et musique assemblés dans un éditeur. Les plans 3 à 6 sont principalement du montage de vraies captures, pas de la génération d'un faux produit.

## Références à préparer

1. Logo exact : `sentinelqa/web-console/public/logo-mark.png`, ou l'asset officiel retenu par l'équipe.
2. Une capture de la console actuelle D-55 pour les couleurs et la composition.
3. Enregistrement réel de la préparation d'une mission QA, du parcours H et de son résultat.
4. Enregistrement réel du banc Paie Express : même ressource avec A puis B, résultat et preuve correspondante, données fictives uniquement.
5. Captures des rapports justifiant les deux chiffres retenus. Les métriques seront ajoutées comme texte au montage.

Les références produit manquantes deviennent des emplacements réservés dans le storyboard. Ne pas générer un faux écran et le présenter comme une exécution HSentinel. Le PDF sert au contenu et à la marque ; ses formulations corrigées dans l'évaluation font foi pour ce film.

## Brief complet à copier dans AI Director

```text
Tu es réalisateur, directeur artistique et monteur d'un film de lancement B2B pour HSentinel. Prépare une vidéo de 60 secondes, horizontale 16:9, avec une mise en scène cinématographique, de véritables transitions et une identité sonore cohérente.

OBJECTIF
Convaincre un jury de hackathon qu'HSentinel transforme une vérification répétitive en mission exécutable et en résultat examinable. Le public comprend les startups et le logiciel. L'émotion suit trois étapes : répétition du travail, passage de relais à l'agent, clarté du résultat.

PROMESSE
« Votre équipe construit. HSentinel vérifie. »
Cible : CTO et développeurs de petites équipes SaaS de 10 à 50 personnes.
Le produit associe deux volets de même importance : QA fonctionnel et contrôles d'accès. Leur donner chacun onze secondes de démonstration centrale.

VÉRITÉ DU PRODUIT
L'utilisateur choisit une cible et prépare une mission. Il peut parler ou écrire, puis relit le plan et lance. H navigue dans l'interface. Des règles de code vérifient les critères et les preuves. Les contrôles d'accès comparent plusieurs comptes selon un périmètre connu. Le rapport distingue conforme, écart ou faille démontrée, non concluant et non exécuté.
Le QA réel et le pentest du banc sont deux missions distinctes. La fuite illustrée vient d'un banc fictif à défauts injectés, jamais du site réel de l'école. L'agent révèle un défaut ; il ne corrige ni ne bloque automatiquement la fuite dans ce film.
Nous avons des résultats d'essais et des coûts fournisseurs mesurés, pas un gain de temps client déjà validé. Ne créer aucune certification, aucun client, aucune métrique ou fonction supplémentaire.

DIRECTION ARTISTIQUE
Film logiciel premium, précis et vivant. Fond blanc doux #f8f9f6, surfaces blanches, encre #141619, accent bleu #1a5fe5. Conserver les couleurs exactes des captures de la console. Rouge réservé au défaut démontré ; ambre pour une non-conclusion. Logo officiel intact.
Titres Schibsted Grotesk, texte Instrument Sans, petites annotations Martian Mono, si ces polices sont disponibles au montage.
Lumière latérale sculptée, matières mates, reflets contrôlés, profondeur et parallaxe. Commencer en cadrages serrés sur un geste humain, puis ouvrir l'espace à l'arrivée du produit.
Fil visuel récurrent : le déplacement d'un curseur devient une ligne, qui guide le regard du parcours vers sa preuve.
Pas de personnage hacker, pluie de code, robot humanoïde, cerveau holographique ou orbe vocal. Les éléments techniques restent ceux du vrai produit. Les formes abstraites servent un raccord, elles ne remplacent pas l'action.

RYTHME ET TRANSITIONS
Deux ou trois raccords rapides au début, puis des plans plus longs pour comprendre l'action. Une seule intention de caméra par plan. Mouvement plus ample aux transitions, image stable lors des preuves.
Transitions prévues : raccord sur un clic ; passage du reflet d'un écran à la console ; balayage par le bord d'une fenêtre pour changer de compte ; recul depuis la capture vers le rapport ; raccord d'une ligne du rapport vers le logo.
Les textes et chiffres importants sont ajoutés au montage et restent parfaitement nets. Ne pas demander au générateur de réinventer les écrans, d'écrire des métriques ou de redessiner le logo.

DÉCOUPAGE EXACT

00–06 s — LA RÉPÉTITION
Macro cinématographique sur une main qui clique, reflet du moniteur, profondeur de champ courte. Deux raccords retrouvent le même geste. La répétition devient sensible sans compteur inventé.
Voix : « Une nouvelle version. Et les mêmes vérifications à refaire. »
Texte au montage : « Encore à revérifier. »

06–13 s — LE PASSAGE DE RELAIS
La caméra rejoint la vraie console HSentinel. Montrer une courte instruction saisie ou dictée, le plan, la validation puis le lancement. Utiliser un extrait réel. Si la séquence est raccourcie, le montage doit rester explicite.
Voix : « Avec HSentinel, décrivez votre parcours. À la voix ou par écrit. Relisez le plan, puis lancez. »
Texte : « Un objectif. Un plan relu. Une mission. »

13–24 s — QA FONCTIONNEL
Capture réelle : le pointeur de l'agent ouvre le menu, atteint la page attendue et le rapport montre un critère vérifié. Montrer assez longtemps le geste puis son résultat. L'écran remplit le cadre ; le décor s'efface.
Voix : « L'agent utilise l'interface, ouvre les menus et suit le parcours. Le code vérifie les critères attendus. Est-ce que ça fonctionne ? »
Titre : « QA · Le parcours fonctionne-t-il ? »
Annotation si accéléré : « Parcours réel · extrait accéléré ».

24–35 s — CONTRÔLE D'ACCÈS
Raccord par le bord d'une fenêtre. Sur le banc Paie Express, A ouvre sa ressource. Puis B accède à cette même ressource et le contenu privé apparaît. Montrer le constat réel lié à cet essai. Les deux comptes et la ressource doivent rester compréhensibles. Ne pas ajouter une correction ou une protection automatique.
Voix : « Et qui peut accéder à quoi ? Sur notre banc fictif, nous vérifions si un compte accède aux données d'un autre. »
Titre : « Accès · Qui peut voir quoi ? »
Mention persistante et lisible : « Banc de démonstration · données fictives · défaut injecté ».

35–43 s — LA PREUVE
La caméra recule depuis la capture utile et la révèle dans le rapport correspondant. Mettre en évidence attendu, observé et preuve. Montrer aussi le libellé réel « Non concluant » issu d'un autre contrôle, identifié comme tel, sans modifier le verdict du premier.
Voix : « Attendu. Observé. Preuve. Chaque résultat est explicite. Quand les éléments manquent, le contrôle reste non concluant. »
Texte : « Un résultat que l'on peut examiner. »

43–51 s — LES MESURES
Deux compositions typographiques, ajoutées en postproduction sur fond clair. Apparition franche, sans faux compteur qui monte et sans tableau de bord inventé.
Carte 1 : « 10/10 » ; sous-texte : « Un parcours QA répété sur site réel » ; précision : « 29 s en moyenne ».
Carte 2 : « 59/60 détections » ; précision : « 6 défauts injectés · 10 audits ».
Petit pied de page lisible : « Mesures internes · scénarios et périmètres limités ».
Voix : « Des essais sur de vrais sites. Une détection mesurée sur des défauts connus. Des résultats documentés. »

51–55 s — LE CLIENT
Retour bref à l'équipe qui examine le rapport puis reprend son travail produit. Pas d'acteur qui prétend être un client réel.
Voix : « Pour les équipes SaaS qui veulent déléguer leurs vérifications. »
Texte : « QA + contrôles d'accès ».

55–60 s — SIGNATURE
Une ligne du rapport rejoint le logo officiel par raccord graphique. Fin calme, marque grande, slogan lisible.
Voix : « HSentinel. Votre équipe construit. Nous vérifions. »
Texte : « Votre équipe construit. HSentinel vérifie. »
CTA secondaire : « Testons votre parcours critique. »

SON
Voix off française naturelle, proche et assurée, sans emphase publicitaire. Une seule voix sur tout le film. Respecter les phrases et les pauses ; pas de personnage parlant à l'image nécessaire.
Musique instrumentale originale à 100 BPM, pulsation électronique fine, textures organiques et basse chaude maîtrisée. Les clics initiaux donnent le rythme. Brève suspension à 6 secondes, ouverture harmonique à l'arrivée du produit. La preuve apaise le morceau. Signature originale de trois notes avec le logo.
La voix reste toujours intelligible. Prévoir une bande musicale continue sur 60 secondes et des effets ponctuels. Ne pas changer de musique à chaque génération vidéo. Si une sortie en pistes séparées n'est pas disponible, préparer voix, musique et images séparément pour l'assemblage.

CONTRAINTES DE PRODUCTION
Préparer le storyboard et les prompts individuels ; une génération de clip ne couvre pas tout le film. Les captures produit, tableaux de résultats et logo sont des assets exacts à composer, pas des images à réinterpréter.
Pour les scènes 3 à 6, privilégier directement les enregistrements et le montage. Si un décor est généré, réserver une surface plate et stable pour l'incrustation.
Ne pas reprendre les affirmations suivantes du PDF : zéro fausse alerte garanti, 0,22 $ au plus, marge supérieure à 90 %, fuite démontrée sur l'école, alerte e-mail toujours instantanée, détection garantie de chaque déploiement.
Pas de prix ni de paiement dans cette version de 60 secondes : l'offre et ses hypothèses seront expliquées dans le pitch oral.

LIVRABLE ATTENDU
Un découpage prêt à produire, avec pour chaque plan : durée, référence à utiliser, action, mouvement de caméra, raccord et traitement audio. Séparer les plans à générer des séquences à monter à partir du produit réel. Identifier les références manquantes et conserver leurs emplacements, sans les inventer.
```

## Prompts courts pour les prises générées

Ces prompts s'utilisent dans le champ de génération d'un clip. L'anglais sert ici à décrire la réalisation ; la voix et les textes du film restent français. Choisir une durée disponible puis recouper au montage. Conserver les mêmes références de décor et de personne entre les plans 1 et 7.

### Prise 1 — Le geste répété, 6 secondes utiles

```text
Six-second cinematic live-action insert for a premium B2B software brand film. Extreme close-up of a developer's hand making one deliberate mouse click on a clean matte desk. Soft monitor light reflects on the fingertips; the workspace is realistic and understated, warm-white surfaces, deep ink shadows, a restrained blue accent. Begin with a low 85 mm macro framing and a slow, precise lateral camera slide. End on the pressed mouse button with the hand stable, leaving a clean action point for a match cut. Realistic anatomy, subtle breathing movement, sculpted side light, shallow depth of field, controlled highlights. The monitor content stays outside the readable focal plane. Capture quiet room tone and one dry mouse click; final voice and music will be added to the edit.
```

Faire les deux répétitions par montage/raccords ; ne pas demander au modèle d'inventer trois exécutions réelles du produit.

### Prise 2 — Transition vers la console, 7 secondes utiles

```text
Seven-second cinematic transition using the supplied HSentinel screen reference only to establish framing and proportions. Start over the developer's shoulder in the same real workspace. A narrow blue reflection travels along the edge of the monitor as the camera makes one smooth dolly-in. The physical screen becomes front-facing and fills the frame. Keep the screen plane rigid, rectangular and steady, with no perspective wobble. Finish with a two-second stable hold for an exact real software recording to be composited into the screen. Warm-white environment, ink details, precise blue accent, soft sculpted reflections. Build the transition through camera motion and depth. Leave all legible interface text, pointer actions, logo and results to the supplied recording in postproduction. Ambient room sound only.
```

### Plans 3 et 4 — QA et accès, enregistrements réels

Monter deux extraits de onze secondes. Garder la zone active et le curseur réels. Utiliser des recadrages motivés par l'action, suivis de pauses lisibles. Le changement A/B doit être explicite ; la mention du banc fictif reste affichée pendant le second extrait. Aucune génération n'est nécessaire pour ces preuves.

### Plan 5 — Capture vers rapport, montage

Faire correspondre la capture agrandie à sa vignette dans le rapport, puis reculer vers le rapport complet avec un raccord de géométrie. Garder les textes en calques nets. Pour le non-concluant, afficher un autre contrôle identifié. Ne pas morphoser un résultat conforme en faille ou inversement.

### Plan 6 — Deux métriques, motion design au montage

Utiliser deux cartes typographiques sobres, ajoutées depuis le texte exact du brief. Une légère translation et une apparition en opacité suffisent ; laisser six secondes de lecture. Éviter les graphiques décoratifs ou les courbes sans données.

### Prise 7 — Retour à l'équipe, 4 secondes utiles

```text
Four-second cinematic medium shot returning to the same developer and workspace reference. The developer finishes examining a report on a monitor, makes one small confirming gesture and naturally turns back toward their ongoing product work. Calm concentration rather than exaggerated celebration. A gentle camera pullback opens the space compared with the first macro shot. Warm-white desk, ink details, restrained blue accent, soft side light and realistic reflections. Screen content is kept unreadable and will not communicate product facts. This is a staged brand scene, not a customer testimonial. Quiet room tone only; the continuous film soundtrack is added later.
```

### Plan 8 — Signature, montage

Animer un trait bleu qui rejoint la composition du logo exact. Poser la signature et le CTA en texte natif. Stabiliser la composition ; fin lisible pendant au moins deux secondes. Ne pas régénérer le logo.

## Bande musicale continue

Prompt à utiliser dans l'outil audio choisi ; ne pas supposer que tous les champs vidéo permettent de produire une piste audio autonome.

```text
Create an original 60-second instrumental score for the premium B2B software brand HSentinel. Exactly 100 BPM. Precise, restrained electronic pulse with tactile click percussion, warm controlled bass and subtle organic textures. Narrative: repetitive verification work, a deliberate handover to an agent, clear evidence, calm confidence. Begin sparse and intimate. At 6 seconds make a brief 0.2-second suspension, then open the harmony as the product appears. Keep 13–35 seconds gently propulsive and spacious for French narration. Resolve the tension around 35 seconds. Leave the measured-results section from 43–51 seconds clean and intelligible. Introduce an original three-note sonic signature with the logo from 55 seconds and end naturally at 60 seconds. No lyrics, no sung vocal textures, no trailer impacts or alarm sounds. Voiceover will be mixed above the music. If supported, provide separate music and sound-design stems; otherwise deliver one instrumental track.
```

## Critères de validation

- À dix secondes, on comprend ce qui est délégué.
- Le QA et les contrôles d'accès sont tous deux visibles, onze secondes chacun.
- Le curseur, les résultats et les captures des séquences produit viennent des vrais essais choisis.
- Le changement de compte est intelligible et le défaut injecté explicitement identifié.
- Les métriques conservent leurs dénominateurs et leur protocole.
- Le son forme un seul film ; les raccords ont une raison visuelle.
- Aucun passage ne présente une nouvelle interface générée comme une preuve du produit.
- L'offre, les limites et la démo live restent explicables par l'équipe après le film.

Option : utiliser [Popcorn](https://higgsfield.ai/creator-hub/help-center/ai-models/how-do-i-use-popcorn) pour préparer les huit cadres du storyboard. Il produit une séquence d'images ; l'animation et l'assemblage restent des étapes distinctes.
