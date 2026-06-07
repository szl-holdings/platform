"""ML-KEM (FIPS 203) backend — key encapsulation, additive.

Prefers liboqs via ``oqs-python``; falls back to pure-Python ``kyber-py`` when
present. ML-KEM is provided for KEM use (key establishment), not signing.
"""
from __future__ import annotations

from typing import Optional, Tuple

ML_KEM_ALG = "ML-KEM-768"  # FIPS 203 Level-3 parameter set.

_BACKEND: Optional[str] = None


def _detect_backend() -> Optional[str]:
    global _BACKEND
    if _BACKEND is not None:
        return _BACKEND if _BACKEND != "none" else None
    try:
        import oqs  # type: ignore

        if hasattr(oqs, "KeyEncapsulation"):
            _BACKEND = "oqs"
            return "oqs"
    except Exception:
        pass
    try:
        from kyber_py.ml_kem import ML_KEM_768  # noqa: F401

        _BACKEND = "kyber_py"
        return "kyber_py"
    except Exception:
        pass
    _BACKEND = "none"
    return None


def backend_available() -> bool:
    return _detect_backend() is not None


def keypair() -> Tuple[bytes, bytes]:
    """Return ``(encapsulation_key, decapsulation_key)``."""
    backend = _detect_backend()
    if backend == "oqs":
        import oqs  # type: ignore

        kem = oqs.KeyEncapsulation(ML_KEM_ALG)
        ek = kem.generate_keypair()
        dk = kem.export_secret_key()
        return ek, dk
    if backend == "kyber_py":
        from kyber_py.ml_kem import ML_KEM_768

        ek, dk = ML_KEM_768.keygen()
        return ek, dk
    raise RuntimeError(
        "No ML-KEM backend available. Install the 'oqs' extra (liboqs) "
        "or 'kyber-py'."
    )


def encapsulate(encapsulation_key: bytes) -> Tuple[bytes, bytes]:
    """Return ``(ciphertext, shared_secret)``."""
    backend = _detect_backend()
    if backend == "oqs":
        import oqs  # type: ignore

        with oqs.KeyEncapsulation(ML_KEM_ALG) as kem:
            ct, ss = kem.encap_secret(encapsulation_key)
            return ct, ss
    if backend == "kyber_py":
        from kyber_py.ml_kem import ML_KEM_768

        ss, ct = ML_KEM_768.encaps(encapsulation_key)
        return ct, ss
    raise RuntimeError("No ML-KEM backend available.")


def decapsulate(decapsulation_key: bytes, ciphertext: bytes) -> bytes:
    backend = _detect_backend()
    if backend == "oqs":
        import oqs  # type: ignore

        with oqs.KeyEncapsulation(ML_KEM_ALG, decapsulation_key) as kem:
            return kem.decap_secret(ciphertext)
    if backend == "kyber_py":
        from kyber_py.ml_kem import ML_KEM_768

        return ML_KEM_768.decaps(decapsulation_key, ciphertext)
    raise RuntimeError("No ML-KEM backend available.")
