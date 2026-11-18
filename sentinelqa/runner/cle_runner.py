"""La paire de clés du runner : le cadenas des mots de passe saisis dans la web app.

Le navigateur du client chiffre les mots de passe des comptes de test avec la clé PUBLIQUE (RSA-OAEP,
SHA-256, 3072 bits) ; seule la clé PRIVÉE, qui ne quitte jamais ce poste, peut les déchiffrer.
Supabase ne voit donc qu'un texte illisible.
"""

import base64
import json
import os
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa

FICHIER = Path.home() / ".config/sentinelqa/runner-cle-privee.pem"
OAEP = padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None)


def _b64url(entier):
    octets = entier.to_bytes((entier.bit_length() + 7) // 8, "big")
    return base64.urlsafe_b64encode(octets).rstrip(b"=").decode()


def cle_privee():
    """Charge la clé privée du poste, ou la crée au premier lancement (droits 600)."""
    if FICHIER.exists():
        return serialization.load_pem_private_key(FICHIER.read_bytes(), password=None)
    cle = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    FICHIER.parent.mkdir(parents=True, exist_ok=True)
    FICHIER.write_bytes(cle.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                          serialization.NoEncryption()))
    os.chmod(FICHIER, 0o600)
    return cle


def jwk_publique(cle):
    """La clé publique au format JWK, celui que WebCrypto importe dans le navigateur."""
    nombres = cle.public_key().public_numbers()
    return {"kty": "RSA", "n": _b64url(nombres.n), "e": _b64url(nombres.e), "alg": "RSA-OAEP-256", "ext": True, "key_ops": ["encrypt"]}


def publier(base, cle):
    """Dépose la clé publique dans Supabase si elle n'y est pas déjà. Renvoie son identifiant."""
    jwk = jwk_publique(cle)
    for ligne in base.lire("cles_runner", order="id.desc"):
        if ligne["cle_publique"].get("n") == jwk["n"]:
            return ligne["id"]
    return base.ajouter("cles_runner", {"algorithme": "RSA-OAEP-256", "cle_publique": jwk})["id"]


def dechiffrer(cle, texte_chiffre):
    """Le texte chiffré par le navigateur (base64) redevient {"A": mot de passe, "B": …, "C": …}, en mémoire seulement."""
    return json.loads(cle.decrypt(base64.b64decode(texte_chiffre), OAEP).decode())
