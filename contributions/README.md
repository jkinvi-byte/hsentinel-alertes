# Contributions en cours : le volet pentest

Ces deux modules ont été écrits par Kimi le 18/11. **Ils ne sont pas intégrés** au runner (`sentinelqa/`) : le code de `sentinelqa/` ne les appelle pas encore.

| Module | Rôle | État mesuré le 18/11 à 15 h 10 |
|---|---|---|
| [`kimi-pentest/`](kimi-pentest) | Contrôle d'accès sur Peer Review (S-PEER-02). Une ressource témoin est lue par le compte A, par un visiteur anonyme et par le compte B. | **19/19 tests réussis.** L'agent H `sentinelqa-pentest-acces` est créé. Une session réelle a eu lieu : la connexion du compte A. La connexion par HTTP n'est pas validée, et le compte B comme la ressource témoin manquent : **le contrôle complet n'a jamais été exécuté.** |
| [`hf-pentest/`](hf-pentest) | Hugging Face propose des hypothèses d'accès à partir d'un inventaire ; chacune est exécutée par le module de Kimi. | **49/49 tests réussis.** Seul le banc synthétique tourne ; il n'y a eu aucun appel réel à Hugging Face ni à H. |

Pour lancer les tests depuis la racine :

```sh
.venv/bin/python -m unittest discover -s contributions/kimi-pentest/tests
.venv/bin/python -m unittest discover -s contributions/hf-pentest/tests
```

Pour l'intégration dans le runner, voir [`kimi-pentest/NOTE-INTEGRATION.md`](kimi-pentest/NOTE-INTEGRATION.md).
