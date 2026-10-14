"""RQ-05: account identity is bound only after real OIDC verification.

Tokens are signed with keys generated for this run; the JWKS is a stub.
"""
from __future__ import annotations

import base64
import json
import sqlite3
import ssl
import types
import urllib.error
import urllib.request

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec

from conftest import AUDIENCE, ISSUER, KID, JWKS_URL, oidc, public_jwk

PROTECTED = [
    ("get", "/v1/usage"),
    ("get", "/v1/audit"),
    ("get", "/v1/audit/export"),
    ("post", "/v1/keys"),
    ("delete", "/v1/keys/some-key-id"),
]


def _call(portal_app, method: str, path: str, headers: dict[str, str] | None = None):
    kwargs = {"headers": headers or {}}
    if method == "post":
        kwargs["json"] = {}
    return getattr(portal_app.client, method)(path, **kwargs)


def _b64(obj: dict) -> str:
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(b"=").decode()


# --- arbitrary bearer text never reaches the account store -----------------

@pytest.mark.parametrize("authorization", [
    None,
    "",
    "alice",
    "Bearer",
    "Bearer ",
    "Bearer alice",
    "Bearer alice@example.com",
    "Bearer not.a.jwt",
    "Bearer a.b",
    pytest.param("Bearer " + "a" * 20_000 + ".b.c", id="oversized-jwt-shape"),
    "Basic not-a-credential",
])
@pytest.mark.parametrize("method,path", PROTECTED)
def test_arbitrary_bearer_text_is_rejected_before_account_access(portal_app, authorization, method, path):
    headers = {} if authorization is None else {"Authorization": authorization}
    response = _call(portal_app, method, path, headers)
    assert response.status_code == 401
    assert portal_app.db_opens == []          # no account read or created
    assert portal_app.account_count() == 0
    assert portal_app.jwks_fetches == []      # not even a key lookup


def test_old_behaviour_is_gone_bearer_subject_text_does_not_create_account(portal_app):
    # Before this change "Bearer alice" created and bound an account for sub=alice.
    response = portal_app.client.post("/v1/keys", json={}, headers={"Authorization": "Bearer alice"})
    assert response.status_code == 401
    assert portal_app.rows("SELECT * FROM accounts") == []
    assert portal_app.rows("SELECT * FROM api_keys") == []


# --- forged / expired / wrong-issuer / wrong-audience tokens --------------

def test_forged_signature_with_the_issuers_kid_is_rejected(portal_app, attacker_key):
    token = portal_app.mint(key=attacker_key)               # attacker key, real kid
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.db_opens == [] and portal_app.account_count() == 0


def test_tampered_payload_is_rejected(portal_app):
    header, _payload, signature = portal_app.mint(sub="alice").split(".")
    forged_payload = _b64({"sub": "mallory", "iss": ISSUER, "aud": AUDIENCE,
                           "exp": 9_999_999_999, "iat": 1})
    token = ".".join([header, forged_payload, signature])
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.account_count() == 0


def test_expired_token_is_rejected(portal_app):
    token = portal_app.mint(exp_in=-3600, iat_in=-7200)
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.db_opens == [] and portal_app.account_count() == 0


def test_wrong_issuer_is_rejected(portal_app):
    token = portal_app.mint(iss="https://evil.portal-test.invalid/realms/szl-portal-test")
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.db_opens == [] and portal_app.account_count() == 0


@pytest.mark.parametrize("aud", ["some-other-client", ["some-other-client", "account"]])
def test_wrong_audience_is_rejected(portal_app, aud):
    token = portal_app.mint(aud=aud)
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.db_opens == [] and portal_app.account_count() == 0


@pytest.mark.parametrize("missing", ["sub", "exp", "iat", "iss", "aud"])
def test_tokens_missing_a_required_claim_are_rejected(portal_app, missing):
    kwargs = {"sub": "alice"}
    kwargs[{"sub": "sub", "exp": "exp_in", "iat": "iat_in", "iss": "iss", "aud": "aud"}[missing]] = None
    token = portal_app.mint(**kwargs)
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.account_count() == 0


def test_not_yet_valid_and_future_issued_tokens_are_rejected(portal_app):
    for token in (portal_app.mint(extra={"nbf": 9_999_999_999}),
                  portal_app.mint(iat_in=3600, exp_in=7200)):
        response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
        assert response.status_code == 401
    assert portal_app.account_count() == 0


def test_unsigned_and_hmac_tokens_are_rejected(portal_app):
    unsigned = _b64({"alg": "none", "typ": "JWT", "kid": KID}) + "." + _b64(
        {"sub": "alice", "iss": ISSUER, "aud": AUDIENCE, "exp": 9_999_999_999, "iat": 1}) + "."
    # alg=none with an empty signature isn't even a well-formed compact JWS for us.
    assert portal_app.client.get("/v1/usage", headers=portal_app.auth(unsigned)).status_code == 401
    unsigned_with_sig = unsigned + "c2ln"
    assert portal_app.client.get("/v1/usage", headers=portal_app.auth(unsigned_with_sig)).status_code == 401
    # HS256 keyed with the issuer's public JWK modulus: the classic key-confusion forgery.
    hmac = jwt.encode({"sub": "alice", "iss": ISSUER, "aud": AUDIENCE, "exp": 9_999_999_999, "iat": 1},
                      portal_app.jwks["keys"][0]["n"], algorithm="HS256", headers={"kid": KID})
    assert portal_app.client.get("/v1/usage", headers=portal_app.auth(hmac)).status_code == 401
    assert portal_app.account_count() == 0
    assert portal_app.jwks_fetches == []


def test_unknown_kid_is_rejected(portal_app):
    token = portal_app.mint(kid="not-in-the-jwks")
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    assert response.status_code == 401
    assert portal_app.account_count() == 0


def test_symmetric_or_encryption_keys_in_the_jwks_are_never_used(portal_app):
    portal_app.jwks = {"keys": [
        {"kty": "oct", "kid": KID, "k": "c2VjcmV0", "alg": "RS256"},
        dict(public_jwk(portal_app.issuer_key), use="enc"),
    ]}
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(portal_app.mint()))
    assert response.status_code == 401
    assert portal_app.account_count() == 0


def test_algorithm_must_match_the_key_and_the_allowlist(portal_app, monkeypatch):
    ec_key = ec.generate_private_key(ec.SECP256R1())
    # ES256 isn't in the default allowlist (RS256 only).
    es_token = portal_app.mint(key=ec_key, alg="ES256")
    assert portal_app.client.get("/v1/usage", headers=portal_app.auth(es_token)).status_code == 401
    # Allowing ES256 doesn't let an EC-signed token verify against the RSA JWK.
    monkeypatch.setenv(oidc.ENV_ALGORITHMS, "RS256,ES256")
    rsa_jwk_without_alg = {k: v for k, v in public_jwk(portal_app.issuer_key).items() if k != "alg"}
    portal_app.jwks = {"keys": [rsa_jwk_without_alg]}
    assert portal_app.client.get("/v1/usage", headers=portal_app.auth(es_token)).status_code == 401
    assert portal_app.account_count() == 0


# --- verified identities are bound, and isolated from each other -----------

def test_verified_token_binds_an_issuer_qualified_account(portal_app):
    token = portal_app.mint(sub="alice")
    first = portal_app.client.get("/v1/usage", headers=portal_app.auth(token))
    second = portal_app.client.get("/v1/usage", headers=portal_app.auth(portal_app.mint(sub="alice")))
    assert first.status_code == 200 and second.status_code == 200
    rows = portal_app.rows("SELECT oauth_sub, email FROM accounts")
    assert [r["oauth_sub"] for r in rows] == [f"{ISSUER}#alice"]
    assert rows[0]["email"].endswith("@oidc.invalid")
    assert portal_app.jwks_fetches == [JWKS_URL]           # cached after the first fetch


def test_rows_created_from_unverified_bearer_text_are_not_inherited(portal_app):
    # Pre-fix code stored the raw bearer text as oauth_sub. A verified "alice"
    # must not be bound to whatever an unauthenticated caller created as "alice".
    db = sqlite3.connect(portal_app.db_path)
    db.execute("INSERT INTO accounts(account_id,email,oauth_sub) VALUES('legacy-alice','alice@oidc','alice')")
    db.commit(); db.close()
    response = portal_app.client.post("/v1/keys", json={}, headers=portal_app.auth(portal_app.mint(sub="alice")))
    assert response.status_code == 200
    owners = {r["account_id"] for r in portal_app.rows("SELECT account_id FROM api_keys")}
    assert owners and "legacy-alice" not in owners


def test_verified_subject_cannot_touch_another_accounts_keys_or_audit(portal_app):
    alice = portal_app.auth(portal_app.mint(sub="alice"))
    bob = portal_app.auth(portal_app.mint(sub="bob"))

    created = portal_app.client.post("/v1/keys", json={"name": "alice-key"}, headers=alice)
    assert created.status_code == 200
    alice_key_id = created.json()["key_id"]

    # Bob can't revoke (or learn the existence of) Alice's key.
    denied = portal_app.client.delete(f"/v1/keys/{alice_key_id}", headers=bob)
    assert denied.status_code == 404
    status = portal_app.rows("SELECT status FROM api_keys WHERE key_id=?", (alice_key_id,))
    assert [r["status"] for r in status] == ["active"]

    # Bob's audit log and evidence export contain nothing of Alice's.
    bob_audit = portal_app.client.get("/v1/audit", headers=bob).json()["actions"]
    bob_export = portal_app.client.get("/v1/audit/export", headers=bob).json()["boe"]
    assert bob_audit == [] and bob_export == []
    assert alice_key_id not in json.dumps([bob_audit, bob_export])
    assert portal_app.client.get("/v1/usage", headers=bob).json()["per_flagship"] == {}

    # Alice still sees her own records.
    alice_audit = portal_app.client.get("/v1/audit", headers=alice).json()["actions"]
    assert any(alice_key_id in a["detail"] for a in alice_audit)
    alice_export = portal_app.client.get("/v1/audit/export", headers=alice).json()["boe"]
    accounts = {r["oauth_sub"]: r["account_id"] for r in portal_app.rows("SELECT * FROM accounts")}
    assert {row["account_id"] for row in alice_export} == {accounts[f"{ISSUER}#alice"]}

    # And Alice can revoke her own key.
    assert portal_app.client.delete(f"/v1/keys/{alice_key_id}", headers=alice).status_code == 200


# --- missing or broken OIDC configuration fails closed ---------------------

@pytest.mark.parametrize("unset", [oidc.ENV_ISSUER, oidc.ENV_AUDIENCE, oidc.ENV_JWKS_URL])
def test_missing_oidc_configuration_fails_closed(portal_app, monkeypatch, unset):
    token = portal_app.mint()                     # would verify if config were complete
    monkeypatch.delenv(unset)
    for method, path in PROTECTED:
        response = _call(portal_app, method, path, portal_app.auth(token))
        assert response.status_code == 503
    assert portal_app.db_opens == [] and portal_app.account_count() == 0
    assert portal_app.jwks_fetches == []


@pytest.mark.parametrize("name,value", [
    (oidc.ENV_JWKS_URL, "http://idp.portal-test.invalid/certs"),
    (oidc.ENV_JWKS_URL, "https://someone@idp.portal-test.invalid/certs"),
    (oidc.ENV_ISSUER, "http://idp.portal-test.invalid/realms/szl-portal-test"),
    (oidc.ENV_ISSUER, ISSUER + "#frag"),
    (oidc.ENV_ALGORITHMS, "HS256"),
    (oidc.ENV_ALGORITHMS, "RS256,none"),
    (oidc.ENV_ALGORITHMS, " , "),
])
def test_invalid_oidc_configuration_fails_closed(portal_app, monkeypatch, name, value):
    monkeypatch.setenv(name, value)
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(portal_app.mint()))
    assert response.status_code == 503
    assert portal_app.db_opens == [] and portal_app.account_count() == 0


def test_unreachable_or_malformed_jwks_fails_closed(portal_app, monkeypatch):
    def unavailable(url):
        portal_app.jwks_fetches.append(url)
        raise oidc.OidcUnavailable("JWKS retrieval failed")

    monkeypatch.setattr(oidc, "_fetch_jwks_document", unavailable)
    response = portal_app.client.get("/v1/usage", headers=portal_app.auth(portal_app.mint()))
    assert response.status_code == 503

    for document in ({}, {"keys": []}, {"keys": "nope"}, {"keys": [1, 2]}):
        oidc.JWKS_CACHE.clear()
        monkeypatch.setattr(oidc, "_fetch_jwks_document", lambda url, d=document: d)
        response = portal_app.client.get("/v1/usage", headers=portal_app.auth(portal_app.mint()))
        assert response.status_code == 503
    assert portal_app.db_opens == [] and portal_app.account_count() == 0


def test_load_config_has_no_identity_defaults():
    with pytest.raises(oidc.OidcConfigError):
        oidc.load_config({})
    config = oidc.load_config({oidc.ENV_ISSUER: ISSUER, oidc.ENV_AUDIENCE: AUDIENCE,
                               oidc.ENV_JWKS_URL: JWKS_URL})
    assert config.algorithms == ("RS256",)


# --- the JWKS fetch itself fails closed ------------------------------------

class _FakeResponse:
    def __init__(self, body: bytes):
        self.body = body

    def read(self, limit: int) -> bytes:
        return self.body[:limit]

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def _fake_opener(monkeypatch, open_fn):
    seen = {}

    def build_opener(*handlers):
        seen["handlers"] = handlers
        return types.SimpleNamespace(open=open_fn)

    monkeypatch.setattr(oidc.urllib.request, "build_opener", build_opener)
    return seen


@pytest.mark.parametrize("body", [
    b"x" * (oidc.MAX_JWKS_BYTES + 1),
    b"not json",
    b"[1, 2]",
    b"\xff\xfe\x00",
], ids=["oversized", "not-json", "not-an-object", "not-utf8"])
def test_jwks_fetch_rejects_oversized_or_malformed_documents(monkeypatch, body):
    _fake_opener(monkeypatch, lambda request, timeout: _FakeResponse(body))
    with pytest.raises(oidc.OidcUnavailable):
        oidc._fetch_jwks_document(JWKS_URL)


def test_jwks_fetch_maps_network_errors_to_unavailable(monkeypatch):
    def unreachable(request, timeout):
        raise urllib.error.URLError("unreachable")

    _fake_opener(monkeypatch, unreachable)
    with pytest.raises(oidc.OidcUnavailable):
        oidc._fetch_jwks_document(JWKS_URL)


def test_jwks_fetch_uses_verified_tls_and_refuses_redirects(monkeypatch):
    seen = _fake_opener(monkeypatch, lambda request, timeout: _FakeResponse(b'{"keys": []}'))
    assert oidc._fetch_jwks_document(JWKS_URL) == {"keys": []}
    handlers = seen["handlers"]
    https = [h for h in handlers if isinstance(h, urllib.request.HTTPSHandler)]
    assert https and https[0]._context.verify_mode == ssl.CERT_REQUIRED
    redirect = [h for h in handlers if isinstance(h, oidc._RejectRedirects)]
    assert redirect
    with pytest.raises(urllib.error.HTTPError):
        redirect[0].redirect_request(types.SimpleNamespace(full_url=JWKS_URL), None, 302, "Found",
                                     {}, "https://elsewhere.portal-test.invalid/certs")
