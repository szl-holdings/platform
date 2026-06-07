"""ML-DSA (FIPS 204) backend abstraction.

Prefers the liboqs-backed ``oqs-python`` binding (production). Falls back to the
pure-Python reference implementation ``dilithium-py`` when liboqs (a C library)
is not installable. Both implement FIPS 204 ML-DSA-65.

If neither backend is present, :func:`backend_available` returns ``False`` and
callers must use the ECDSA-only path.
"""
from __future__ import annotations

from typing import Optional, Tuple

# ML-DSA-65 is the NIST FIPS 204 Level-3 parameter set (Dilithium3 lineage).
ML_DSA_ALG = "ML-DSA-65"

_BACKEND: Optional[str] = None


def _detect_backend() -> Optional[str]:
    global _BACKEND
    if _BACKEND is not None:
        return _BACKEND if _BACKEND != "none" else None
    # 1) Production: liboqs via oqs-python. The real oqs-python exposes
    #    Signature / get_enabled_sig_mechanisms.
    try:
        import oqs  # type: ignore

        if hasattr(oqs, "Signature") and hasattr(oqs, "get_enabled_sig_mechanisms"):
            _BACKEND = "oqs"
            return "oqs"
    except Exception:
        pass
    # 2) Pure-Python reference: dilithium-py.
    try:
        from dilithium_py.ml_dsa import ML_DSA_65  # noqa: F401

        _BACKEND = "dilithium_py"
        return "dilithium_py"
    except Exception:
        pass
    _BACKEND = "none"
    return None


def backend_available() -> bool:
    return _detect_backend() is not None


def backend_name() -> Optional[str]:
    return _detect_backend()


def keypair() -> Tuple[bytes, bytes]:
    """Return ``(public_key, secret_key)`` for ML-DSA-65."""
    backend = _detect_backend()
    if backend == "oqs":
        import oqs  # type: ignore

        signer = oqs.Signature(ML_DSA_ALG)
        public_key = signer.generate_keypair()
        secret_key = signer.export_secret_key()
        return public_key, secret_key
    if backend == "dilithium_py":
        from dilithium_py.ml_dsa import ML_DSA_65

        public_key, secret_key = ML_DSA_65.keygen()
        return public_key, secret_key
    raise RuntimeError(
        "No ML-DSA backend available. Install the 'oqs' extra (liboqs) "
        "or 'dilithium-py' for a pure-Python reference implementation."
    )


def sign(secret_key: bytes, message: bytes) -> bytes:
    backend = _detect_backend()
    if backend == "oqs":
        import oqs  # type: ignore

        with oqs.Signature(ML_DSA_ALG, secret_key) as signer:
            return signer.sign(message)
    if backend == "dilithium_py":
        from dilithium_py.ml_dsa import ML_DSA_65

        return ML_DSA_65.sign(secret_key, message)
    raise RuntimeError("No ML-DSA backend available.")


def verify(public_key: bytes, message: bytes, signature: bytes) -> bool:
    backend = _detect_backend()
    if backend == "oqs":
        import oqs  # type: ignore

        with oqs.Signature(ML_DSA_ALG) as verifier:
            return bool(verifier.verify(message, signature, public_key))
    if backend == "dilithium_py":
        from dilithium_py.ml_dsa import ML_DSA_65

        return bool(ML_DSA_65.verify(public_key, message, signature))
    raise RuntimeError("No ML-DSA backend available.")
