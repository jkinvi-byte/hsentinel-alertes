# HSentinel — publicité V1

**V1 écartée après le retour d’Aurian sur le rendu et le pitch.** Conservée pour référence. La nouvelle direction est dans [REPRISE-CREATIVE-V2.md](../REPRISE-CREATIVE-V2.md) ; aucun film V2 n’est encore généré.

[Ouvrir le film 1080p](exports/HSentinel-30s-1080p.mp4) · [Lecteur local](VISIONNER.html) · [Storyboard](apercus/storyboard.jpg)

Film de 30 secondes en français, 1920 × 1080, 24 images/s. Voix, musique originale, sous-titres incrustés et logo HSentinel. QA et pentest ont chacun un plan dédié de cinq secondes. L’accroche est « Nouvelle release. Mêmes vérifications. » ; l’offre de lancement proposée est « Premier parcours QA offert ».

## Ce qui a réellement été produit

| Plans | Production |
| --- | --- |
| 1, 3, 5 | Images Z-Image-Turbo générées par le MCP Hugging Face, animées et composées au montage. |
| 2 | Illustration graphique de la console et de ses deux modes. |
| 4 | Clip LTX-2.5 généré par le MCP, premières 2,625 s ralenties sur cinq secondes ; calques de comptes et de règle ajoutés au montage. |
| 6 | Carton de marque, offre et CTA composés localement. |
| Voix | Six prises françaises Kokoro, voix `ff_siwis`, via le Space `Mowdep/kokoro-french`. |
| Musique | Synthèse instrumentale originale par le script, sans morceau préexistant. |

Le quota GPU gratuit a été épuisé après la génération du clip et des images. La voix a été produite sur un autre Space utilisant Kokoro ONNX. Aucun abonnement, Job payant ni achat de calcul n’a été déclenché.

Les images P2/P6 contenant du texte parasite et la première version de P1 ont été écartées. Le clip LTX est raccourci avant son recadrage final trop serré. Les trois autres fonds sont des images animées au montage, pas des clips LTX.

## Fidélité au produit

Les écrans portent « Illustration produit ». Les comptes et documents sont fictifs. Aucun enregistrement réel de mission, rapport client, donnée d’étudiant, identifiant ni résultat de faille réelle n’est présenté. Le pentest illustre le contrôle d’accès entre comptes ; aucune couverture exhaustive n’est annoncée.

« Premier parcours QA offert » reste une proposition d’offre. Le film est un fichier de travail non publié. Le CTA n’affiche aucun domaine inventé. La variante « Réserver ma démo » reste décrite dans [le script](../SCRIPT.md).

## Fichiers

- `exports/HSentinel-30s-1080p.mp4` : film principal H.264/AAC.
- `exports/HSentinel-affiche.jpg` : carton final sans sous-titre.
- `exports/HSentinel-30s-fr.srt` : sous-titres séparés.
- `exports/voix-fr.wav`, `exports/musique-originale.wav`, `exports/mix-final.wav` : pistes séparées et mix.
- `apercus/` : images des six plans et storyboard.
- `generations.json` : paramètres, textes prononcés et URL des médias HF. Les liens temporaires peuvent expirer ; les médias sont conservés dans `media/`.
- `verification.json` : mesures du fichier final, après rendu.
- `monter.py` : source du montage. Il utilise les médias déjà téléchargés et ne contacte aucun service.

Pour refaire le montage sur ce Mac : `python3 contributions/marketing-hsentinel/production/monter.py`. Option `--apercus` pour contrôler les six images avant l’encodage. Dépendances : Python, Pillow, NumPy, SciPy et FFmpeg ; polices système Arial. Sur un autre système, adapter les chemins de polices en tête du script.

Version livrée : paysage 16:9. Le format 4:5 du brief reste à recomposer ; recadrer automatiquement cette version couperait les textes et le produit.

## Crédits

- Images : [Z-Image-Turbo, Space MCP](https://huggingface.co/spaces/mcp-tools/z-image-turbo).
- Vidéo générative : [Lightricks LTX-2.5](https://huggingface.co/Lightricks/LTX-2.5), licence communautaire documentée dans le brief.
- Voix synthétique : [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), poids sous Apache 2.0 ; [Space français](https://huggingface.co/spaces/Mowdep/kokoro-french).
- La [fiche des voix Kokoro](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) attribue les données de la voix française au corpus [SIWIS](https://datashare.ed.ac.uk/handle/10283/2353), CC BY 4.0. La voix du film est synthétique, produite à partir de notre texte.
- Logo : fichier existant `sentinelqa/web-console/public/logo-mark.png`.
