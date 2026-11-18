# Mohamed — points à améliorer

Branche `agents-ia-qa-pentest`, commit [`49ec3c0`](https://github.com/jkinvi-byte/hsentinel-alertes/tree/49ec3c0b7b850a0c9a9c176436c095d7ba97aff0), tête GitHub vérifiée le 18/11/2026. Ce retour porte sur le code publié.

**À conserver :** le guidage Hugging Face, la distinction ressources privées/partagées et le comparatif des modèles. Ce sont les éléments à raccorder au moteur actuel.

## Priorité 1 — avant intégration

| Point | Correction attendue |
|---|---|
| **Verdicts fiables** — `verdict.py`, `auditer.py` | Deux textes vides ou deux erreurs identiques donnent actuellement « fuite ». Une session échouée devient « accès refusé attendu ». Renvoyer **non concluant** sans preuve exploitable ; confirmer identité, ressource et contenu observé avant de conclure. |
| **Limites réellement appliquées** — `config.py` | `bornes()` écarte les limites avec le SDK installé. Transmettre `max_steps` et `max_time_s`, puis borner aussi la campagne entière et prévoir son arrêt. |
| **Agents cohérents** — configuration et création | Les scripts créent `hsentinel-*`, mais les valeurs par défaut appellent `sentinelqa-*`. Centraliser les noms et vérifier les agents dans l’espace H utilisé par l’équipe. |
| **Raccordement à l’architecture** | Livrer le guidage comme module du runner existant, avec les contrats du projet. QA = parcours fonctionnels ; isolation entre comptes = pentest. Valider les URL proposées contre le catalogue avant exécution. |

## Priorité 2 — fiabiliser les mesures et la livraison

- **Repli HF** — `pentest.py`, `guidage_hf.py` : convertir explicitement le rapport d’audit en inventaire. Aujourd’hui, le repli sans jeton peut planter sur ce format.
- **Comparatif et coûts** — `comparer_guidage.py`, `config.py` : séparer les erreurs HTTP des essais réussis ; un coût inconnu doit rester `null`. Comparer avec/sans guidage à budget égal, sur les contrôles effectivement réalisés. Versionner les résultats anonymisés.
- **Tests et README** : couvrir les textes vides, erreurs identiques, session échouée, limites transmises, repli HF et HTTP 401. Remplacer l’exemple `cadence` par une cible du catalogue et aligner les capacités annoncées sur celles exécutées.

**Prochaine livraison utile :** une PR ciblée depuis `main`, contenant le module de guidage, ses tests et un exemple de rapport compatible avec le runner et la console. Les deux branches ont des historiques indépendants : reprendre les composants utiles séparément.

Référence : [revue détaillée et reproductions locales](../revues/agents-ia-qa-pentest/REVUE.md).
