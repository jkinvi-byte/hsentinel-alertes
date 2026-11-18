"""Crée les agents H de l'architecture : l'Explorateur et le Vérificateur.
Noms, modèle et navigateur repris de architecture.html (section « Les agents H », 07 §3.1).
Usage : python 01_creer_agents.py
"""
from hai_agents import Client

from config import MODELE, PREFIXE

# Le navigateur visuel partagé, « sentinelqa-navigateur » dans l'architecture.
NAVIGATEUR = [{"id": f"{PREFIXE}-navigateur", "kind": "web", "mode": {"type": "visual", "width": 1280, "height": 800}}]

GARDE_FOUS = """Cadre : test de sécurité AUTORISÉ, sur une préproduction contrôlée par l'équipe, avec des comptes de test.
Règles absolues :
- Reste sur le domaine de départ. Ne quitte jamais ce site.
- Ne clique jamais sur : se déconnecter, supprimer, payer, commander, réinitialiser, ni sur rien du périmètre interdit donné dans la consigne.
- Ne soumets aucun formulaire, sauf celui de connexion.
- Pour te connecter, utilise uniquement les identifiants enregistrés (remplissage sécurisé). N'écris jamais un mot de passe toi-même.
- Si tu n'es pas sûr qu'une action est sans effet, ne la fais pas."""

AGENTS = {
    f"{PREFIXE}-explorateur": dict(
        description="Cartographie les pages et les ressources visibles par un compte de test.",
        instructions=GARDE_FOUS + """
Mission : connecte-toi, puis parcours l'application comme un utilisateur curieux. Ouvre les menus, les listes et quelques fiches de détail.
Relève chaque page qui affiche une ressource (fiche, facture, panier, profil, commande, document...) : son adresse exacte telle qu'affichée dans la barre d'adresse,
son titre, le type de ressource, son identifiant s'il est visible (dans l'adresse ou la page), et l'entreprise ou la personne propriétaire si elle est affichée.
Ne relève pas les pages purement statiques (aide, mentions légales).""",
    ),
    f"{PREFIXE}-verificateur": dict(
        description="Ouvre une adresse précise et décrit ce qui est visible, sans rien faire d'autre.",
        instructions=GARDE_FOUS + """
Mission : connecte-toi si nécessaire, puis ouvre EXACTEMENT l'adresse donnée dans la consigne, en la tapant dans la barre d'adresse.
Ne clique sur rien d'autre. Décris fidèlement ce que la page affiche : message d'erreur, page vide, redirection, ou données (avec leurs valeurs clés).
Indique à qui appartiennent les données affichées (nom d'entreprise ou de personne visible), et si ce n'est pas le compte avec lequel tu es connecté.""",
    ),
}


def main():
    client = Client()
    for nom, d in AGENTS.items():
        try:
            client.agents.create_agent(name=nom, model=MODELE, environments=NAVIGATEUR, **d)
            print(f"✅ créé : {nom} ({MODELE})")
        except Exception as e:
            print(f"ℹ️  {nom} : {e}  (s'il existe déjà, c'est normal)")


if __name__ == "__main__":
    main()
