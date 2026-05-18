import time

import pytest

from sentra_core.evidence_pack import (
    EvidenceItem,
    HMACSigner,
    build_pack,
)


def _item(idx: int, payload: bytes = b"data") -> EvidenceItem:
    return EvidenceItem(
        id=f"ev-{idx}",
        kind="log_excerpt",
        description=f"item {idx}",
        payload=payload,
        collected_at=time.time(),
        metadata={"src": "test"},
    )


def test_build_pack_signs_and_chains():
    signer = HMACSigner(secret=b"test-secret")
    items = [_item(i, payload=f"p{i}".encode()) for i in range(3)]
    pack = build_pack("inc-1", items, signer)
    assert pack.pack_hash and len(pack.pack_hash) == 64
    assert pack.signer_id == signer.signer_id
    assert len(pack.chain) == 3
    assert pack.chain[0].prev_hash == "0" * 64
    assert pack.chain[1].prev_hash == pack.chain[0].chain_hash
    assert pack.chain[-1].chain_hash == pack.pack_hash


def test_verify_passes_for_intact_pack():
    signer = HMACSigner(secret=b"sec")
    pack = build_pack("i", [_item(0), _item(1)], signer)
    assert pack.verify(signer) is True


def test_verify_fails_with_wrong_secret():
    s1 = HMACSigner(secret=b"a")
    s2 = HMACSigner(secret=b"b")
    pack = build_pack("i", [_item(0)], s1)
    assert pack.verify(s2) is False


def test_verify_detects_tamper_via_chain_mismatch():
    from dataclasses import replace

    signer = HMACSigner(secret=b"s")
    pack = build_pack("i", [_item(0), _item(1)], signer)
    bad_chain = list(pack.chain)
    bad_chain[1] = replace(bad_chain[1], chain_hash="0" * 64)
    tampered = replace(pack, chain=tuple(bad_chain))
    assert tampered.verify(signer) is False


def test_empty_pack_raises():
    with pytest.raises(ValueError):
        build_pack("i", [], HMACSigner(secret=b"s"))


def test_to_dict_includes_hashes_and_omits_payload_by_default():
    pack = build_pack("i", [_item(0)], HMACSigner(secret=b"s"))
    d = pack.to_dict()
    assert d["pack_hash"] == pack.pack_hash
    assert d["items"][0]["payload_b64"] is None
    d2 = pack.to_dict(include_payloads=True)
    assert d2["items"][0]["payload_b64"]


def test_publisher_called_with_pack_hash():
    published = []

    class Cap:
        def publish(self, topic, payload):
            published.append((topic, payload))

    signer = HMACSigner(secret=b"s")
    pack = build_pack("i", [_item(0)], signer, publisher=Cap())
    assert published[0][0] == "sentra.evidence"
    assert published[0][1]["pack_hash"] == pack.pack_hash
    assert published[0][1]["incident_id"] == "i"


def test_hmac_signer_from_env(monkeypatch):
    monkeypatch.setenv("SENTRA_EVIDENCE_SECRET", "from-env")
    s = HMACSigner.from_env()
    assert s.secret == b"from-env"


def test_hmac_signer_from_env_fails_closed_without_secret(monkeypatch):
    monkeypatch.delenv("SENTRA_EVIDENCE_SECRET", raising=False)
    with pytest.raises(RuntimeError, match="not set"):
        HMACSigner.from_env()


def test_hmac_signer_from_env_allow_dev_default(monkeypatch):
    monkeypatch.delenv("SENTRA_EVIDENCE_SECRET", raising=False)
    s = HMACSigner.from_env(allow_dev_default=True)
    assert s.secret  # explicit opt-in to dev key
    assert s.signer_id == "sentra-hmac-dev"


class _DenyGate:
    def guard(self, action, subject):
        from sentra_core.policy_gate import PolicyDecision, PolicyDeniedError
        raise PolicyDeniedError(PolicyDecision(False, "denied", "pol", None, {}))


class _CapturingPublisher:
    def __init__(self):
        self.published: list[tuple[str, dict]] = []
    def publish(self, topic, payload):
        self.published.append((topic, payload))


def test_build_pack_refuses_when_policy_gate_denies():
    from sentra_core.policy_gate import PolicyDeniedError
    items = [EvidenceItem(id="i1", kind="log_excerpt", description="x", payload=b"abc", collected_at=0.0)]
    with pytest.raises(PolicyDeniedError):
        build_pack("inc1", items, HMACSigner(secret=b"s"), policy_gate=_DenyGate())


def test_yawar_http_publisher_marks_failure_on_non_2xx():
    """raise_for_status() must be called so 4xx/5xx are recorded as failures."""
    import httpx
    from sentra_core.evidence_pack import YawarHTTPPublisher

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(503, text="overloaded")

    transport = httpx.MockTransport(handler)
    # Monkey-patch httpx.post to use our mock transport.
    real_post = httpx.post

    def patched_post(url, **kwargs):
        with httpx.Client(transport=transport) as c:
            return c.post(url, **kwargs)

    httpx.post = patched_post  # type: ignore[assignment]
    try:
        pub = YawarHTTPPublisher(base_url="http://yawar.test")
        pub.publish("sentra.evidence", {"k": "v"})
        assert pub.last_error is not None
        assert "503" in pub.last_error or "Server error" in pub.last_error
    finally:
        httpx.post = real_post  # type: ignore[assignment]


def test_yawar_http_publisher_clean_on_2xx():
    import httpx
    from sentra_core.evidence_pack import YawarHTTPPublisher

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(202, text="")

    transport = httpx.MockTransport(handler)
    real_post = httpx.post

    def patched_post(url, **kwargs):
        with httpx.Client(transport=transport) as c:
            return c.post(url, **kwargs)

    httpx.post = patched_post  # type: ignore[assignment]
    try:
        pub = YawarHTTPPublisher(base_url="http://yawar.test")
        pub.publish("sentra.evidence", {"k": "v"})
        assert pub.last_error is None
    finally:
        httpx.post = real_post  # type: ignore[assignment]


def test_build_pack_publishes_to_yawar_topic_by_default():
    items = [EvidenceItem(id="i1", kind="log_excerpt", description="x", payload=b"abc", collected_at=0.0)]
    pub = _CapturingPublisher()
    pack = build_pack("inc-1", items, HMACSigner(secret=b"s"), publisher=pub)
    assert pub.published and pub.published[0][0] == "sentra.evidence"
    assert pub.published[0][1]["pack_hash"] == pack.pack_hash
