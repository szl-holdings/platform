"""Offline fixtures for the customer-portal tests.

Every key here is generated in-process for the test run and every JWKS fetch
is answered by a stub. No identity provider, network or cosign call is used.
"""
from __future__ import annotations

import importlib
import json
import sqlite3
import sys
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

portal = importlib.import_module("app.app")
oidc = importlib.import_module("app.oidc")

# Reserved .invalid names: never resolvable, and the JWKS fetch is stubbed anyway.
ISSUER = "https://idp.portal-test.invalid/realms/szl-portal-test"
AUDIENCE = "szl-portal-test-client"
JWKS_URL = ISSUER + "/protocol/openid-connect/certs"
KID = "portal-test-signing-key"


def _new_rsa_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def issuer_key() -> rsa.RSAPrivateKey:
    return _new_rsa_key()


@pytest.fixture(scope="session")
def attacker_key() -> rsa.RSAPrivateKey:
    return _new_rsa_key()


def public_jwk(private_key: rsa.RSAPrivateKey, kid: str = KID, alg: str = "RS256") -> dict[str, Any]:
    jwk = json.loads(jwt.algorithms.RSAAlgorithm.to_jwk(private_key.public_key()))
    jwk.update({"kid": kid, "use": "sig", "alg": alg})
    return jwk


@dataclass
class Portal:
    client: TestClient
    db_path: Path
    issuer_key: rsa.RSAPrivateKey
    jwks: dict[str, Any]
    jwks_fetches: list[str] = field(default_factory=list)
    db_opens: list[int] = field(default_factory=list)

    def mint(self, sub: str | None = "alice", *, key: Any = None, kid: str | None = KID,
             alg: str = "RS256", iss: str | None = ISSUER, aud: Any = AUDIENCE,
             exp_in: int | None = 300, iat_in: int | None = 0,
             extra: dict[str, Any] | None = None) -> str:
        now = int(time.time())
        claims: dict[str, Any] = {"jti": uuid.uuid4().hex}
        if sub is not None:
            claims["sub"] = sub
        if iss is not None:
            claims["iss"] = iss
        if aud is not None:
            claims["aud"] = aud
        if exp_in is not None:
            claims["exp"] = now + exp_in
        if iat_in is not None:
            claims["iat"] = now + iat_in
        claims.update(extra or {})
        headers = {"kid": kid} if kid is not None else {}
        signing_key = self.issuer_key if key is None else key
        return jwt.encode(claims, signing_key, algorithm=alg, headers=headers)

    def auth(self, token: str) -> dict[str, str]:
        return {"Authorization": f"Bearer {token}"}

    def rows(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            return conn.execute(sql, params).fetchall()
        finally:
            conn.close()

    def account_count(self) -> int:
        return self.rows("SELECT COUNT(*) AS n FROM accounts")[0]["n"]


@pytest.fixture
def portal_app(tmp_path, monkeypatch, issuer_key) -> Portal:
    db_path = tmp_path / "portal.db"
    conn = sqlite3.connect(db_path)
    conn.executescript((SERVICE_ROOT / "app" / "schema.sql").read_text(encoding="utf-8"))
    conn.close()

    monkeypatch.setenv(oidc.ENV_ISSUER, ISSUER)
    monkeypatch.setenv(oidc.ENV_AUDIENCE, AUDIENCE)
    monkeypatch.setenv(oidc.ENV_JWKS_URL, JWKS_URL)
    monkeypatch.delenv(oidc.ENV_ALGORITHMS, raising=False)
    monkeypatch.setattr(portal, "DB", str(db_path))
    # Key issuance would shell out to cosign; the tests never sign anything.
    monkeypatch.setattr(portal, "cosign_fingerprint", lambda fp: "PLACEHOLDER")

    state = Portal(client=TestClient(portal.app), db_path=db_path, issuer_key=issuer_key,
                   jwks={"keys": [public_jwk(issuer_key)]})

    def fake_fetch(url: str) -> dict[str, Any]:
        state.jwks_fetches.append(url)
        return state.jwks

    real_db = portal.db

    def counting_db():
        state.db_opens.append(1)
        return real_db()

    monkeypatch.setattr(oidc, "_fetch_jwks_document", fake_fetch)
    monkeypatch.setattr(portal, "db", counting_db)
    oidc.JWKS_CACHE.clear()
    yield state
    oidc.JWKS_CACHE.clear()
