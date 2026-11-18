# Contributions en cours : le volet pentest

Ces deux modules ont été écrits par Kimi le 18/11. **Ils ne sont pas intégrés** au runner (`sentinelqa/`) : le code de `sentinelqa/` ne les appelle pas encore.

| Module | Rôle | État mesuré le 18/11 |
|---|---|---|
| [`kimi-pentest/`](kimi-pentest) | Contrôle d'accès sur Peer Review (S-PEER-02). Une ressource témoin est lue par le compte A, par un visiteur anonyme et par le compte B. | **23/23 tests réussis.** Triplet HTTP réel exécuté avec deux identités vérifiées : A reçoit le témoin, l'anonyme est redirigé, et B reçoit sa propre vue sans le témoin de A. Aucune fuite démontrée ; B reste non concluant faute de refus explicite. La définition H locale ne contient plus `start_url` ; sa création dans l'espace de Jahdiel attend une clé autorisée (403 actuel). |
| [`hf-pentest/`](hf-pentest) | Hugging Face propose des hypothèses d'accès à partir d'un inventaire ; chacune est exécutée par le module de Kimi. | **50/50 tests réussis.** Un vrai appel HF sur inventaire synthétique a produit un plan validé, ensuite exécuté sur HTTP/H synthétiques avec détection de la fuite injectée. Aucun plan HF n'a été exécuté sur Peer Review réel. |

Pour lancer les tests depuis la racine :

```sh
.venv-holo/bin/python -m unittest discover -s contributions/kimi-pentest/tests
.venv-holo/bin/python -m unittest discover -s contributions/hf-pentest/tests
```

Pour l'intégration dans le runner, voir [`kimi-pentest/NOTE-INTEGRATION.md`](kimi-pentest/NOTE-INTEGRATION.md).
