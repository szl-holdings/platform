"""Signing / verifying DSSE envelopes in ECDSA, ML-DSA, or hybrid mode."""
from __future__ import annotations

import enum
import hashlib
from dataclasses import dataclass
from typing import Optional

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import (
    Prehashed,
)
from cryptography.exceptions import InvalidSignature

from . import mldsa_backend
from .envelope import DSSEEnvelope, Signature

ECDSA_TYPE = "ECDSA-P256-SHA256"
MLDSA_TYPE = "ML-DSA-65"


class SignatureType(str, enum.Enum):
    ECDSA = "ecdsa"      # classical default
    PQC = "pqc"          # ML-DSA only
    HYBRID = "hybrid"    # both ECDSA + ML-DSA


def ml_dsa_backend_available() -> bool:
    return mldsa_backend.backend_available()


def _keyid(public_bytes: bytes) -> str:
    return hashlib.sha256(public_bytes).hexdigest()[:16]


@dataclass
class Signer:
    """Holds whatever keys are needed for the requested mode.

    ``ecdsa_key`` is a cryptography EC private key (P-256).
    ``ml_dsa_secret`` / ``ml_dsa_public`` are raw ML-DSA-65 key bytes.
    """

    ecdsa_key: Optional[ec.EllipticCurvePrivateKey] = None
    ml_dsa_secret: Optional[bytes] = None
    ml_dsa_public: Optional[bytes] = None

    @staticmethod
    def generate(mode: SignatureType) -> "Signer":
        ecdsa_key = None
        ml_secret = ml_public = None
        if mode in (SignatureType.ECDSA, SignatureType.HYBRID):
            ecdsa_key = ec.generate_private_key(ec.SECP256R1())
        if mode in (SignatureType.PQC, SignatureType.HYBRID):
            if not mldsa_backend.backend_available():
                raise RuntimeError(
                    "ML-DSA backend unavailable; cannot generate PQC/hybrid signer. "
                    "Install the 'oqs' extra or 'dilithium-py'."
                )
            ml_public, ml_secret = mldsa_backend.keypair()
        return Signer(ecdsa_key=ecdsa_key, ml_dsa_secret=ml_secret, ml_dsa_public=ml_public)


def _ecdsa_keyid(key: ec.EllipticCurvePrivateKey) -> str:
    from cryptography.hazmat.primitives import serialization

    raw = key.public_key().public_bytes(
        serialization.Encoding.X962,
        serialization.PublicFormat.UncompressedPoint,
    )
    return _keyid(raw)


def sign_envelope(envelope: DSSEEnvelope, signer: Signer, mode: SignatureType) -> DSSEEnvelope:
    """Sign the envelope's PAE bytes and append signature entries.

    ECDSA P-256 is the default. PQC and HYBRID are additive.
    """
    data = envelope.pae()

    if mode in (SignatureType.ECDSA, SignatureType.HYBRID):
        if signer.ecdsa_key is None:
            raise ValueError("ECDSA key required for this mode")
        sig = signer.ecdsa_key.sign(data, ec.ECDSA(hashes.SHA256()))
        envelope.signatures.append(
            Signature(keyid=_ecdsa_keyid(signer.ecdsa_key), sig=sig, sig_type=ECDSA_TYPE)
        )

    if mode in (SignatureType.PQC, SignatureType.HYBRID):
        if signer.ml_dsa_secret is None or signer.ml_dsa_public is None:
            raise ValueError("ML-DSA keypair required for this mode")
        sig = mldsa_backend.sign(signer.ml_dsa_secret, data)
        envelope.signatures.append(
            Signature(keyid=_keyid(signer.ml_dsa_public), sig=sig, sig_type=MLDSA_TYPE)
        )

    return envelope


@dataclass
class Verifier:
    ecdsa_public: Optional[ec.EllipticCurvePublicKey] = None
    ml_dsa_public: Optional[bytes] = None

    @staticmethod
    def from_signer(signer: Signer) -> "Verifier":
        ecdsa_public = signer.ecdsa_key.public_key() if signer.ecdsa_key else None
        return Verifier(ecdsa_public=ecdsa_public, ml_dsa_public=signer.ml_dsa_public)


def verify_envelope(envelope: DSSEEnvelope, verifier: Verifier, require: SignatureType) -> bool:
    """Verify signatures on an envelope.

    ``require`` semantics:
      * ECDSA  — at least the ECDSA signature must verify
      * PQC    — at least the ML-DSA signature must verify
      * HYBRID — BOTH the ECDSA and ML-DSA signatures must verify
    """
    data = envelope.pae()
    ecdsa_ok = False
    mldsa_ok = False

    for s in envelope.signatures:
        if s.sig_type == ECDSA_TYPE and verifier.ecdsa_public is not None:
            try:
                verifier.ecdsa_public.verify(s.sig, data, ec.ECDSA(hashes.SHA256()))
                ecdsa_ok = True
            except InvalidSignature:
                ecdsa_ok = False
        elif s.sig_type == MLDSA_TYPE and verifier.ml_dsa_public is not None:
            mldsa_ok = mldsa_backend.verify(verifier.ml_dsa_public, data, s.sig)

    if require == SignatureType.ECDSA:
        return ecdsa_ok
    if require == SignatureType.PQC:
        return mldsa_ok
    if require == SignatureType.HYBRID:
        return ecdsa_ok and mldsa_ok
    return False
