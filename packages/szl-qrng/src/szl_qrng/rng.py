"""Entropy source: OS CSPRNG default, optional QRNG via HTTP API.

Design
------
* ``EntropySource.OS_CSPRNG`` (default) — ``secrets.token_bytes``.
* ``EntropySource.QRNG`` — active only when ``QRNG_API_URL`` is set. Bytes are
  fetched from a real QRNG service. To preserve the "never weaker than CSPRNG"
  guarantee, QRNG bytes are XOR-folded with OS CSPRNG bytes of the same length.
  Thus the output is at least as strong as the OS CSPRNG even if the QRNG service
  is degraded or spoofed.
"""
from __future__ import annotations

import enum
import os
import secrets
from typing import Optional


class EntropySource(str, enum.Enum):
    OS_CSPRNG = "os-csprng"
    QRNG = "qrng"


QRNG_API_URL_ENV = "QRNG_API_URL"
QRNG_TIMEOUT_ENV = "QRNG_TIMEOUT_SECONDS"


def active_source() -> EntropySource:
    """Return the entropy source that will actually be used."""
    return EntropySource.QRNG if os.environ.get(QRNG_API_URL_ENV) else EntropySource.OS_CSPRNG


def _os_bytes(n: int) -> bytes:
    return secrets.token_bytes(n)


def _qrng_bytes(n: int) -> Optional[bytes]:
    """Fetch n bytes from the configured QRNG service. Returns None on failure."""
    url = os.environ.get(QRNG_API_URL_ENV)
    if not url:
        return None
    try:
        import urllib.request

        timeout = float(os.environ.get(QRNG_TIMEOUT_ENV, "3"))
        # The endpoint contract: GET {url}?length=N returns N raw bytes
        # (octet-stream). ANU/qrng-style providers can be adapted via a thin
        # proxy that conforms to this contract.
        full = url + ("&" if "?" in url else "?") + f"length={n}"
        with urllib.request.urlopen(full, timeout=timeout) as resp:  # noqa: S310
            data = resp.read()
        if len(data) >= n:
            return data[:n]
        return None
    except Exception:
        return None


def token_bytes(n: int = 32) -> bytes:
    """Return n cryptographically strong random bytes.

    If QRNG is configured AND reachable, returns ``QRNG XOR OS_CSPRNG`` (never
    weaker than the OS CSPRNG). Otherwise returns OS CSPRNG bytes.
    """
    base = _os_bytes(n)
    if active_source() == EntropySource.QRNG:
        q = _qrng_bytes(n)
        if q is not None and len(q) == n:
            return bytes(a ^ b for a, b in zip(base, q))
    return base


def nonce(n: int = 32) -> bytes:
    """Alias for token_bytes — a per-signature ECDSA nonce / general nonce."""
    return token_bytes(n)
