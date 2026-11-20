# HSentinel — prompts prêts pour Hugging Face

**Modèle essayé : [le Space officiel LTX‑2.5 de Lightricks](https://huggingface.co/spaces/Lightricks/LTX-2.5).** Le 19 novembre 2026, le MCP a généré le plan P4 à partir d’une image Z-Image-Turbo : 1024 × 576, 24 i/s, environ 5 secondes, seed 42. Le quota ZeroGPU gratuit a ensuite été épuisé. La V1 montée combine ce clip, trois images HF animées au montage et deux compositions graphiques locales. Voir [la production et ses fichiers](production/README.md).

La [fiche du modèle](https://huggingface.co/Lightricks/LTX-2.5) décrit la génération à partir de texte ou d’image et la continuité entre plans. Je le retiens pour essayer cette direction artistique et pour l’accès à une démonstration officielle. Ce n’est pas un classement de qualité établi par nos propres essais. La fiche annonce l’usage commercial sous sa licence communautaire pour les entités sous 10 M$ de revenus annuels ; la gratuité de cette licence ne garantit pas un quota de calcul illimité.

Le Space consulté propose une durée manuelle allant jusqu’à 5 secondes. Le plan de production initial ci-dessous prévoit **six clips**, puis l’ajout du produit, du logo, des textes et de la voix de [SCRIPT.md](SCRIPT.md). La V1 utilise le montage hybride décrit ci-dessus. Le modèle ne reçoit pas le brief commercial entier à chaque génération.

**Réglages de départ**

Ouvrir Settings : durée 5 s, Auto length désactivé, Enhance prompt désactivé. Le Space travaille à 24 i/s et exige ici des dimensions multiples de 64. Pour le cadrage horizontal, utiliser 1472 × 832, puis recadrer légèrement en 16:9 au montage. Pour une génération dédiée au 4:5, choisir 1024 × 1280. Seed 42 et Randomize seed désactivé permettent de comparer les variantes de prompt ; ils ne garantissent pas une identité visuelle entre plans. Garder le décodeur conv par défaut pour le premier essai. Paramètres relus dans le [code public du Space](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py).

Commencer par P4 pour juger la lisibilité de l’idée, puis produire P1–P6. Une action et un mouvement de caméra par plan, avec de l’espace pour la composition. Le [guide LTX‑2.5](https://ltx.io/blog/ltx-2-5-prompt-guide) recommande des descriptions concrètes au présent et un cadrage explicite ; les prompts suivants sont rédigés en anglais dans cet esprit. La voix et les titres du film restent français.

Les panneaux générés sont volontairement vierges. Ajouter les enregistrements réels dans les panneaux au montage, avec un masque propre. Les éléments sémantiques importants — comptes A/B, sens de l’accès, verdict — sont également des calques contrôlés. Couper le son généré avant de poser la bande-son commune.

**P1 — Le travail qui revient · 0–5 s**

À coller seul dans Prompt :

```text
A five-second cinematic product animation opens in a dark graphite studio, with three thin software-window frames arranged in depth above a matte surface. The frames have clean empty navy interiors, softly rounded corners, and a restrained electric-blue rim light. A small blue light travels around the edge of the nearest frame, then begins the same circuit on the next identical frame, suggesting a repeated verification routine. The camera slowly tracks sideways while the three frames remain rigid and clearly separated. Cool side lighting reveals brushed metal edges and subtle reflections, with generous empty space in the upper third for editorial typography. The composition feels precise and slightly insistent, with crisp geometry and restrained motion blur. The only sound is a soft repeating mechanical click over a quiet ambient hum; the surfaces remain unmarked and the scene contains only these abstract objects.
```

Montage : superposer le logo réel et « Nouvelle release. Mêmes vérifications. ». Le circuit illustre une répétition, pas une métrique de productivité.

**P2 — La console · 5–10 s**

```text
A five-second premium software product shot shows one large, perfectly flat navy panel floating against a deep graphite background. Two equally sized luminous paths, both electric blue, approach from the lower left and lower right and settle beneath the panel in a symmetrical composition. The camera makes a gentle frontal push toward the panel and then comes to rest, keeping its rectangular surface stable and almost parallel to the image plane. Soft grazing light traces the outer bevel while the interior stays uniformly dark, clean, and empty for a product screen to be composited later. A subtle reflection grounds the panel on the matte floor, and ample negative space surrounds it. One quiet glass-like click accompanies the paths settling into place, followed by a calm ambient hum. The shot is elegant, controlled, and focused on the single panel.
```

Montage : insérer la capture du studio et le titre « QA + Pentest ». Les deux modes ont la même présence visuelle.

**P3 — QA : suivre un parcours · 10–15 s**

```text
A five-second cinematic interface illustration shows three clean, empty navy browser panels arranged as a short stepped path on a graphite surface. A single electric-blue light moves steadily from the first panel to the second and then to the third, pausing briefly at each stage. Each arrival reveals a thin blue outline around the current panel while the preceding panel remains visible. The camera performs a slow lateral slide with a slight overhead angle, keeping the whole route readable and every panel rigid. The lighting is cool and directional, with restrained reflections and a spacious central composition. The blank interiors remain flat and unmarked so real interface recordings can be added during editing. Three soft tactile clicks mark the progression, with a continuous quiet ambient bed.
```

Montage : incruster les écrans de la navigation QA et un pointeur. Utiliser des captures agrandies, pas des pages illisibles. Titre « QA · Parcours utilisateurs ». Un bleu de progression ne signifie pas qu’un contrôle est réussi.

**P4 — Pentest : vérifier la frontière entre comptes · 15–20 s**

```text
A five-second cinematic product animation presents two identical upright navy panels, side by side, separated by a narrow transparent divider in a deep graphite studio. Each panel contains a single simple unmarked document-shaped tile, and the two tiles remain clearly distinct. A thin blue light path begins at the right panel and approaches the central divider; the segment at the divider becomes a restrained coral accent, drawing attention to the boundary being examined. The camera makes a slow shallow orbit while keeping both panels and the divider visible throughout. Precise glass edges, soft directional lighting, subtle reflections, and restrained motion blur create a premium technical aesthetic. The upper third and both panel interiors retain generous clean space for account labels and product evidence to be composited later. A single soft electronic pulse marks the boundary inspection, and a quiet ambient hum continues beneath it.
```

Montage : ajouter « Compte A », « Compte B » et « Pentest · Contrôles d’accès ». Pour montrer une faille, utiliser le rapport et la capture d’un même essai Paie Express ; afficher « Démo · défaut injecté ». La couleur générée souligne un contrôle et ne constitue pas un verdict.

**P5 — Les preuves · 20–25 s**

```text
A five-second cinematic macro shot shows three rigid rectangular evidence cards sliding into a precise row above a matte graphite desk. Their surfaces are uniformly dark navy and completely unmarked, with thin electric-blue edges and enough empty area for real report excerpts. A fine blue line links the bottom edge of each card to a larger flat report panel below, forming a clear visual relationship between steps, observation, and result. The camera gently pushes closer and settles into a stable readable frontal view. Cool side lighting and a soft overhead highlight reveal subtle material depth without washing out the empty surfaces. The movement finishes early and holds, leaving time for editorial overlays to be read. Three understated contact sounds accompany the cards settling, followed by a calm, quiet room tone.
```

Montage : ajouter les extraits « Étapes », « Capture », « Résultat », provenant du même exemple, et « Des preuves consultables ». Zoomer sur la preuve utile, avec son vrai statut.

**P6 — Offre et marque · 25–30 s**

```text
A five-second closing shot shows an elegant empty graphite stage with a soft electric-blue horizon glow and a faint reflection on the matte floor. Two restrained arcs of blue light move inward from the outer edges and settle into a quiet symmetrical frame around a completely empty central area. The camera makes a very slow frontal push and then holds still for the final three seconds. Lighting remains soft and controlled, with deep navy shadows and a subtle white edge highlight near the center. The center and lower middle stay visually calm and clear for a real brand mark, a short offer, and one call-to-action to be added in editing. The scene feels resolved, precise, and confident, with one gentle tonal sound fading into silence. All surfaces remain plain and unmarked.
```

Montage : logo réel, « Premier parcours QA offert », « 1 application · 1 parcours · rapport inclus », bouton « Réserver mon essai ». Respecter la variante de fin du script si la gratuité n’est pas retenue.

**Assemblage**

1. Télécharger les six clips et conserver le prompt, la seed et les réglages avec chaque prise choisie.
2. Découper chaque prise selon le script ; la durée générée peut être ajustée à la grille d’images du modèle.
3. Ajouter les captures de produit, les étiquettes, la voix et les sous-titres au montage. Placer une seule musique sur toute la durée.
4. Exporter en 1920 × 1080 à 24 i/s. Composer séparément les textes et les panneaux pour le 1080 × 1350 ; un recadrage automatique du film horizontal peut enlever des preuves ou le CTA.
5. Relire le film sans son, puis sur téléphone : l’offre, les deux volets et l’action suivante doivent rester compréhensibles. Vérifier qu’un résultat illustratif n’est jamais présenté comme une mesure client.

Si le Space est indisponible ou son quota épuisé, le [Space officiel LTX‑2.3](https://huggingface.co/spaces/Lightricks/LTX-2-3) constitue une solution de repli pour ces prompts de plans uniques ; sa page et son code ont également été consultés. Sa disponibilité ne garantit pas un quota supplémentaire. Garder le script et les captures identiques lors d’un changement de modèle.
