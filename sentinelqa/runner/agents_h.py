"""Les agents H sur mesure de SentinelQA, et un coffre d'identifiants par compte de test.

Ce fichier est la source de vérité : `assurer_agents` crée les agents dans le catalogue H,
ou les met à jour quand leur définition a changé ici.

`preparer_coffres` range chaque compte de test dans son propre coffre H, rattaché à l'URL
auditée. L'agent se connecte avec l'action `fill_secret_at` sans voir le mot de passe, qui
n'apparaît donc ni dans ses consignes ni dans les replays. Un coffre par compte : la page
choisit l'identifiant par son adresse, et deux comptes sur le même site seraient ambigus.
"""

from hai_agents import VaultCreateRequestProviderConfig_Internal
from hai_agents.core.api_error import ApiError

MODELE = "holo4-35b-a3b"
EXPLORATEUR = "sentinelqa-explorateur"
VERIFICATEUR = "sentinelqa-verificateur"

GARDE_FOUS = (
    "Tu travailles pour SentinelQA, qui audite la préproduction d'un SaaS avec l'autorisation écrite de son éditeur. "
    "Règles absolues : reste sur le site audité ; ne supprime jamais rien ; n'envoie aucun formulaire à part celui "
    "de connexion, sauf si la tâche te le demande explicitement en donnant la valeur à saisir. "
    "Pour te connecter, utilise uniquement les identifiants de ton coffre avec l'action fill_secret_at : "
    "tu ne connais pas le mot de passe et tu ne dois jamais en taper un toi-même."
)

AGENTS = {
    EXPLORATEUR: {
        "description": "Explore une application web avec un compte de test et relève les pages qui affichent ses données, sans rien modifier.",
        "instructions": GARDE_FOUS + " Tu explores comme un utilisateur : tu navigues en cliquant sur les liens, "
                        "les tuiles et les boutons visibles, sans jamais saisir d'adresse toi-même.",
    },
    VERIFICATEUR: {
        "description": "Ouvre une page précise avec un compte de test et constate à qui appartiennent les données affichées.",
        "instructions": GARDE_FOUS + " Tu décris fidèlement ce que la page affiche, sans rien supposer au-delà de ce que tu vois.",
    },
}
NAVIGATEUR = {"id": "sentinelqa-navigateur", "kind": "web", "mode": {"type": "visual"}}


def assurer_agents(client):
    """Crée les agents absents et met à jour ceux dont la définition a changé. Renvoie ce qui a été fait."""
    faits = {}
    for nom, spec in AGENTS.items():
        try:
            actuel = client.agents.get_agent(nom)
        except ApiError as erreur:
            if erreur.status_code != 404:
                raise
            client.agents.create_agent(name=nom, model=MODELE, environments=[NAVIGATEUR], **spec)
            faits[nom] = "créé"
            continue
        if (actuel.description, actuel.instructions, actuel.model) != (spec["description"], spec["instructions"], MODELE):
            client.agents.patch_agent(nom, model=MODELE, environments=[NAVIGATEUR], **spec)
            faits[nom] = "mis à jour"
        else:
            faits[nom] = "à jour"
    return faits


def preparer_coffres(client, base, comptes, cles):
    """Range chaque compte dans son coffre, rattaché à l'URL auditée. Renvoie {clé du compte : id du coffre}."""
    existants = {v.name: v.id for v in client.vaults.list_vaults(limit=100).vaults}
    coffres = {}
    for cle in cles:
        compte, nom = comptes[cle], f"sentinelqa-compte-{cle.lower()}"
        coffre = existants.get(nom) or client.vaults.create_vault(
            name=nom, provider_config=VaultCreateRequestProviderConfig_Internal()).id
        # L'URL auditée change à chaque tunnel : on remplace l'ancien identifiant plutôt que d'en empiler.
        for item in client.vaults.list_vault_items(coffre, limit=100).items:
            client.vaults.delete_vault_item(coffre, item.id)
        client.vaults.create_vault_item(
            coffre, name=f"Compte {cle} · {compte['entreprise']}", urls=[base],
            values={"username": compte["email"], "email": compte["email"], "password": compte["mot_de_passe"]})
        coffres[cle] = coffre
    return coffres
