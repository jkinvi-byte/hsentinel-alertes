"""D-56 : les applications ajoutées par un client dans la console, vues par le runner.

Le runner ne fait jamais confiance à la web : il relit l'application dans Supabase, n'accepte qu'un profil construit par
notre serveur (forme stricte, consultation seule, budgets plafonnés), refuse une application dont le contrôle n'est pas
prouvé, et ne lit jamais une adresse privée pour le compte d'un client (le runner tourne sur un poste de l'équipe).
Mêmes règles que web/lib/applications-contrat.mjs.
"""

import ipaddress
import re
import socket
from urllib.parse import urlsplit

ID = re.compile(r"[a-z0-9][a-z0-9-]{0,59}")
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
CHEMIN = re.compile(r"/[A-Za-z0-9._~\-/]*")
PLAFONDS = {"guide": {"max_steps": 30, "max_time_s": 300}, "exploration": {"max_steps": 40, "max_time_s": 420, "max_pages": 6}}


class ApplicationRefusee(ValueError):
    """Une application ajoutée qui ne peut pas être testée : non vérifiée, retirée, profil illisible ou adresse privée."""


def adresse_privee(ip):
    """Privée, locale, réservée, multidiffusion ou de documentation : jamais lue pour le compte d'un client."""
    try:
        adresse = ipaddress.ip_address(str(ip).strip("[]"))
    except ValueError:
        return True
    if isinstance(adresse, ipaddress.IPv6Address) and adresse.ipv4_mapped:
        adresse = adresse.ipv4_mapped
    return not adresse.is_global or adresse.is_multicast


def garder_hote(hote):
    """Le nom résolu juste avant la lecture : une seule adresse privée suffit à tout arrêter."""
    try:
        adresses = {info[4][0] for info in socket.getaddrinfo(hote, 443, type=socket.SOCK_STREAM)}
    except socket.gaierror as erreur:
        raise ApplicationRefusee("Ce nom de domaine ne répond pas.") from erreur
    if not adresses or any(adresse_privee(a) for a in adresses):
        raise ApplicationRefusee("Ce site pointe vers une adresse privée : il n'est pas lu.")


def valider_profil(profil, id_, nom):
    """Le profil enregistré, revérifié champ par champ : rien d'autre qu'un profil construit par notre serveur ne passe."""
    if not isinstance(profil, dict) or profil.get("client") is not True or profil.get("consultation_seule") is not True:
        raise ApplicationRefusee("Le profil de cette application est illisible.")
    origine = profil.get("origine")
    parts = urlsplit(origine or "")
    if parts.scheme != "https" or not parts.hostname or parts.port or parts.username or parts.path not in ("", "/") \
            or f"https://{parts.hostname}" != origine:
        raise ApplicationRefusee("L'adresse de cette application est invalide.")
    entree = urlsplit(profil.get("entree") or "")
    if f"{entree.scheme}://{entree.netloc}" != origine or not CHEMIN.fullmatch(entree.path or "/"):
        raise ApplicationRefusee("La page d'entrée sort de l'application.")
    connexion = profil.get("connexion")
    if connexion is not None and not (isinstance(connexion, dict) and set(connexion) == {"chemin"}
                                      and CHEMIN.fullmatch(str(connexion["chemin"]))):
        raise ApplicationRefusee("Le chemin de connexion est invalide.")
    limites = profil.get("limites") or {}
    for pilotage, plafond in PLAFONDS.items():
        if any(not isinstance(limites.get(pilotage, {}).get(k), int) or limites[pilotage][k] > v for k, v in plafond.items()):
            raise ApplicationRefusee("Les budgets de cette application dépassent les plafonds.")
    if not (isinstance(limites.get("lectures_http"), int) and limites["lectures_http"] <= 30
            and isinstance(limites.get("octets_par_lecture"), int) and limites["octets_par_lecture"] <= 3_000_000):
        raise ApplicationRefusee("Les budgets de lecture dépassent les plafonds.")
    exclus = profil.get("chemins_exclus") or []
    interdits = profil.get("interdits") or []
    if not all(isinstance(x, str) and CHEMIN.fullmatch(x) for x in exclus) or not all(isinstance(x, str) and len(x) <= 400 for x in interdits):
        raise ApplicationRefusee("Les interdits de cette application sont illisibles.")
    propre = {
        "id": id_, "nom": nom, "client": True, "origine": origine, "entree": profil["entree"], "consultation_seule": True,
        "autorisation": str(profil.get("autorisation") or "")[:300], "chemins_exclus": exclus, "interdits": interdits,
        "limites": {"guide": dict(limites["guide"]), "exploration": dict(limites["exploration"]),
                    "lectures_http": limites["lectures_http"], "octets_par_lecture": limites["octets_par_lecture"]},
    }
    if connexion:
        propre["connexion"] = {"chemin": connexion["chemin"]}
    return propre


def cible_client(base, target_id):
    """Le profil QA d'une application ajoutée, seulement si son contrôle est prouvé et qu'elle n'est pas retirée."""
    if not isinstance(target_id, str) or not ID.fullmatch(target_id):
        raise ApplicationRefusee("Cette application est inconnue.")
    lignes = base.lire("applications", id=f"eq.{target_id}", ajoutee_console="eq.true", retiree_le="is.null",
                       select="id,nom,autorisee,verifiee_le,profil_qa")
    if not lignes:
        raise ApplicationRefusee("Cette application n'est pas (ou plus) dans les applications ajoutées.")
    app = lignes[0]
    if not app["autorisee"] or not app["verifiee_le"]:
        raise ApplicationRefusee("Le contrôle de cette application n'est pas prouvé : aucune mission ne part.")
    cible = valider_profil(app["profil_qa"], app["id"], app["nom"])
    garder_hote(urlsplit(cible["origine"]).hostname)
    return cible


def compte_client(base, target_id, compte_id):
    """Un compte de test enregistré, seulement s'il appartient à cette application. Son texte chiffré ne sort pas d'ici."""
    if not isinstance(compte_id, str) or not UUID.fullmatch(compte_id):
        raise ApplicationRefusee("Ce compte de test est inconnu.")
    lignes = base.lire("comptes_test", id=f"eq.{compte_id}", application_id=f"eq.{target_id}",
                       select="id,libelle,identifiant,secret_chiffre,identite")
    if not lignes:
        raise ApplicationRefusee("Ce compte de test n'existe plus pour cette application.")
    return lignes[0]
