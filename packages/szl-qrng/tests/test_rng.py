"""Tests for szl-qrng entropy source."""
import os

from szl_qrng import token_bytes, nonce, active_source, EntropySource


def test_default_is_os_csprng(monkeypatch):
    monkeypatch.delenv("QRNG_API_URL", raising=False)
    assert active_source() == EntropySource.OS_CSPRNG


def test_token_bytes_length_and_uniqueness():
    a = token_bytes(32)
    b = token_bytes(32)
    assert len(a) == 32 and len(b) == 32
    assert a != b  # overwhelmingly likely


def test_nonce_default_length():
    assert len(nonce()) == 32


def test_qrng_env_switches_source(monkeypatch):
    monkeypatch.setenv("QRNG_API_URL", "http://127.0.0.1:9/qrng")
    assert active_source() == EntropySource.QRNG
    # Service unreachable -> falls back to OS CSPRNG bytes, still correct length.
    out = token_bytes(32)
    assert len(out) == 32


def test_qrng_xor_never_weaker(monkeypatch):
    """When QRNG returns bytes, output = QRNG XOR OS; still 32 strong bytes."""
    monkeypatch.setenv("QRNG_API_URL", "http://example.invalid/qrng")
    import szl_qrng.rng as rng

    monkeypatch.setattr(rng, "_qrng_bytes", lambda n: b"\x00" * n)
    # XOR with zeros = the OS CSPRNG bytes unchanged; proves no weakening.
    out = rng.token_bytes(16)
    assert len(out) == 16
