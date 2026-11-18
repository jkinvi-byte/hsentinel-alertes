"""L'explication en clair, par Hugging Face (architecture 07 §3.4, décision D-23).
Rôle CAIO (Mohamed) : à partir des FAITS ÉTABLIS, deux phrases pour un non-technicien
et une piste de correction. Marquée « rédigé par IA », HORS du verdict.

Via Hugging Face Inference Providers (routeur compatible OpenAI). Si HF_TOKEN manque,
repli déterministe (pas d'IA), pour que le pipeline tourne quand même.
"""
import datetime as dt, os

import httpx

ROUTEUR = "https://router.huggingface.co/v1/chat/completions"
MODELE_DEFAUT = "Qwen/Qwen2.5-72B-Instruct"


def expliquer(faits, modele=MODELE_DEFAUT):
    """faits : dict (url, verdict, similarité, gravité, ce qui est visible, propriétaire, intrus).
    Renvoie {texte, modele, latence_s, par_ia}.
    """
    token = os.getenv("HF_TOKEN")
    consigne = (
        "Tu rédiges l'explication en clair d'une faille de contrôle d'accès, pour une personne non technique. "
        "À partir UNIQUEMENT des faits donnés, écris deux phrases : ce qui se passe et pourquoi c'est un problème, "
        "puis une phrase de piste de correction pour un développeur. Pas de jargon, pas d'invention.\n\n"
        f"Faits : {faits}"
    )
    if not token:
        return {"texte": _repli(faits), "modele": "aucun (repli sans IA)", "latence_s": 0.0, "par_ia": False}

    debut = dt.datetime.now()
    try:
        r = httpx.post(ROUTEUR, timeout=120,
                       headers={"Authorization": f"Bearer {token}"},
                       json={"model": modele, "messages": [{"role": "user", "content": consigne}],
                             "max_tokens": 220, "temperature": 0.2})
        r.raise_for_status()
        texte = r.json()["choices"][0]["message"]["content"].strip()
        lat = round((dt.datetime.now() - debut).total_seconds(), 1)
        return {"texte": texte, "modele": modele, "latence_s": lat, "par_ia": True}
    except Exception as e:
        return {"texte": _repli(faits), "modele": f"repli ({e})", "latence_s": 0.0, "par_ia": False}


def _repli(faits):
    return (f"Le compte « {faits.get('intrus')} » a pu accéder à « {faits.get('ce_qui_est_visible','')[:120]} », "
            f"qui appartient à « {faits.get('proprietaire')} ». Un compte ne devrait voir que ses propres données. "
            "Correction : vérifier, côté serveur, que l'objet demandé appartient bien à l'utilisateur connecté avant de le renvoyer.")


if __name__ == "__main__":
    print(expliquer({"intrus": "B", "proprietaire": "A", "verdict": "fuite",
                     "ce_qui_est_visible": "Fiche de paie n°1041, salaire brut 4 850 €"}))
