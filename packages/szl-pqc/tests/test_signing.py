"""Round-trip sign+verify tests for ECDSA, PQC (ML-DSA), and hybrid modes."""
import pytest

from szl_pqc import (
    SignatureType,
    Signer,
    Verifier,
    sign_envelope,
    verify_envelope,
    ml_dsa_backend_available,
    DSSEEnvelope,
)

PAYLOAD = b'{"action":"khipu.tick","verdict":"ALLOW","budget":13}'

requires_mldsa = pytest.mark.skipif(
    not ml_dsa_backend_available(),
    reason="no ML-DSA backend (install 'oqs' extra or 'dilithium-py')",
)


def _fresh_envelope() -> DSSEEnvelope:
    return DSSEEnvelope(payload=PAYLOAD)


def test_ecdsa_round_trip():
    signer = Signer.generate(SignatureType.ECDSA)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.ECDSA)
    assert env.sig_types() == ["ECDSA-P256-SHA256"]
    v = Verifier.from_signer(signer)
    assert verify_envelope(env, v, SignatureType.ECDSA) is True


def test_ecdsa_rejects_tamper():
    signer = Signer.generate(SignatureType.ECDSA)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.ECDSA)
    env.payload = b"tampered"
    v = Verifier.from_signer(signer)
    assert verify_envelope(env, v, SignatureType.ECDSA) is False


@requires_mldsa
def test_pqc_round_trip():
    signer = Signer.generate(SignatureType.PQC)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.PQC)
    assert env.sig_types() == ["ML-DSA-65"]
    v = Verifier.from_signer(signer)
    assert verify_envelope(env, v, SignatureType.PQC) is True


@requires_mldsa
def test_pqc_rejects_tamper():
    signer = Signer.generate(SignatureType.PQC)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.PQC)
    env.payload = b"tampered"
    v = Verifier.from_signer(signer)
    assert verify_envelope(env, v, SignatureType.PQC) is False


@requires_mldsa
def test_hybrid_round_trip_both_signatures():
    signer = Signer.generate(SignatureType.HYBRID)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.HYBRID)
    assert set(env.sig_types()) == {"ECDSA-P256-SHA256", "ML-DSA-65"}
    v = Verifier.from_signer(signer)
    # Hybrid requires BOTH to verify.
    assert verify_envelope(env, v, SignatureType.HYBRID) is True
    # Either alone also verifies against its own requirement.
    assert verify_envelope(env, v, SignatureType.ECDSA) is True
    assert verify_envelope(env, v, SignatureType.PQC) is True


@requires_mldsa
def test_hybrid_fails_if_one_signature_missing():
    signer = Signer.generate(SignatureType.HYBRID)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.HYBRID)
    # Drop the ML-DSA signature; hybrid verify must now fail.
    env.signatures = [s for s in env.signatures if s.sig_type == "ECDSA-P256-SHA256"]
    v = Verifier.from_signer(signer)
    assert verify_envelope(env, v, SignatureType.HYBRID) is False
    assert verify_envelope(env, v, SignatureType.ECDSA) is True


def test_envelope_json_roundtrip():
    signer = Signer.generate(SignatureType.ECDSA)
    env = sign_envelope(_fresh_envelope(), signer, SignatureType.ECDSA)
    text = env.to_json()
    back = DSSEEnvelope.from_json(text)
    assert back.payload == env.payload
    assert back.sig_types() == env.sig_types()
    v = Verifier.from_signer(signer)
    assert verify_envelope(back, v, SignatureType.ECDSA) is True
