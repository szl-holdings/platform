"""Validate readiness receipt signing authority without publishing evidence.

The check is intentionally bounded: it decodes the configured raw Ed25519 seed,
signs a fixed local challenge, and verifies that signature with the derived public
key. It never prints the seed, signature, exception text, or provider state.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os

KEY_ENV = "_".join(("KHIPU", "SIGNING", "KEY", "B64"))
CHALLENGE = b"szl-readiness-signing-preflight/v1"


def _result(ready: bool, stage: str, code: str, message: str, **extra: str) -> dict:
    return {
        "ready": ready,
        "stage": stage,
        "code": code,
        "message": message,
        "algorithm": "ed25519",
        "key_env": KEY_ENV,
        **extra,
    }


def check_signing_authority() -> dict:
    """Return a safe result for the effective fleet signing secret.

    This proves only that the job can produce and locally verify an Ed25519
    signature. It does not rotate a key, establish downstream trust, or publish a
    receipt. The executor retains the full receipt verification and publish gates.
    """
    encoded = os.environ.get(KEY_ENV)
    if not encoded or not encoded.strip():
        return _result(
            False,
            "credential",
            "missing_key",
            "KHIPU_SIGNING_KEY_B64 is missing or empty in this job. Provision the existing fleet signer in the effective GitHub Actions secret.",
        )
    if any(char.isspace() or not char.isprintable() for char in encoded):
        return _result(
            False,
            "credential",
            "malformed_key",
            "KHIPU_SIGNING_KEY_B64 contains whitespace or control characters. Correct the stored secret without printing it.",
        )
    try:
        seed = base64.b64decode(encoded, validate=True)
    except (ValueError, TypeError):
        return _result(
            False,
            "credential",
            "malformed_key",
            "KHIPU_SIGNING_KEY_B64 is not strict base64. Correct the stored secret without printing it.",
        )
    if len(seed) != 32:
        return _result(
            False,
            "credential",
            "invalid_seed_length",
            "KHIPU_SIGNING_KEY_B64 must decode to the existing 32-byte Ed25519 seed.",
        )

    try:
        from nacl.signing import SigningKey  # type: ignore
    except Exception:
        return _result(
            False,
            "client",
            "client_unavailable",
            "PyNaCl signing support is unavailable. Install the workflow's pinned dependency before this preflight.",
        )

    try:
        signing_key = SigningKey(seed)
        signed = signing_key.sign(CHALLENGE)
        signing_key.verify_key.verify(CHALLENGE, signed.signature)
        public_key = bytes(signing_key.verify_key)
    except Exception:
        return _result(
            False,
            "signing",
            "signing_unavailable",
            "The configured fleet key could not produce and verify an Ed25519 signature.",
        )

    return _result(
        True,
        "complete",
        "ready",
        "Fleet signing authority produced and verified a local challenge. Receipt construction and publication remain separate gates.",
        keyid=hashlib.sha256(public_key).hexdigest()[:16],
    )


def main() -> int:
    result = check_signing_authority()
    print(json.dumps(result, sort_keys=True))
    if result["ready"]:
        return 0
    if os.environ.get("GITHUB_ACTIONS") == "true":
        print(
            "::error title=Readiness signing preflight failed::"
            f"{result['stage']}/{result['code']}: {result['message']}"
        )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
