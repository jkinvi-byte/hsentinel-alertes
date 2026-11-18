# Contributions en cours : le volet pentest

Ces deux modules ont été écrits par Kimi le 18/11. **Ils ne sont pas intégrés** au runner (`sentinelqa/`) : le code de `sentinelqa/` ne les appelle pas encore.

| Module | Rôle | État mesuré le 18/11 à 14 h 30 |
|---|---|---|
| [`kimi-pentest/`](kimi-pentest) | Contrôle d'accès sur Peer Review (S-PEER-02). Une ressource témoin est lue par le compte A, par un visiteur anonyme et par le compte B. | **18/18 tests réussis.** L'agent H `sentinelqa-pentest-acces` est créé. Une session réelle a eu lieu : la connexion du compte A. La connexion par HTTP n'est pas validée, et le compte B comme la ressource témoin manquent : **le contrôle complet n'a jamais été exécuté.** |
| [`hf-pentest/`](hf-pentest) | Hugging Face propose des hypothèses d'accès à partir d'un inventaire ; chacune est exécutée par le module de Kimi. | **42/47 tests réussis.** Les 5 échecs sont des tests ajoutés en dernier (14 h 19) qui ne passent pas la validation du contrat `Inventaire`, modifié pour la dernière fois à 13 h 56 : la passe s'est arrêtée avant d'être terminée. Seul le banc synthétique tourne ; il n'y a eu aucun appel réel à Hugging Face ni à H. Le README du module annonce encore 38 tests réussis. |

Pour lancer les tests depuis la racine :

```sh
.venv/bin/python -m unittest discover -s contributions/kimi-pentest/tests
.venv/bin/python -m unittest discover -s contributions/hf-pentest/tests
```

La conception du module « HF → contrôles » est décrite dans [`passation-kimi/BRIEF-MOTEUR-PENTEST-HF.md`](../passation-kimi/BRIEF-MOTEUR-PENTEST-HF.md). Pour l'intégration dans le runner, voir [`kimi-pentest/NOTE-INTEGRATION.md`](kimi-pentest/NOTE-INTEGRATION.md).
