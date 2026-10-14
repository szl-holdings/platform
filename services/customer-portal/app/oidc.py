"""oidc.py - fail-closed OIDC bearer verification for the customer portal.

An account is bound only to a subject read from a JWT that PyJWT verified
against the configured issuer's JWKS: signature (asymmetric algorithms only),
``iss``, ``aud``, ``exp`` and ``iat`` (``nbf`` too when present). No part of
the bearer string is trusted before that. Signature and claim checks are
PyJWT's; this module only chooses the policy and fetches the key set.

Configuration (required; a missing or invalid value means the portal refuses
every authenticated request with 503 and touches no account):

    SZL_PORTAL_OIDC_ISSUER      exact expected ``iss`` (https, no query/fragment)
    SZL_PORTAL_OIDC_AUDIENCE    expected ``aud`` (the portal's client id)
    SZL_PORTAL_OIDC_JWKS_URL    https URL of the issuer's JWKS document

Optional:

    SZL_PORTAL_OIDC_ALGORITHMS  comma-separated asymmetric JWS algorithms
                                (default ``RS256``)

There are no defaults for the issuer, audience or JWKS URL. Those are
deployment settings the owner supplies.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import ssl
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

import jwt
from jwt import PyJWK

ENV_ISSUER = "SZL_PORTAL_OIDC_ISSUER"
ENV_AUDIENCE = "SZL_PORTAL_OIDC_AUDIENCE"
ENV_JWKS_URL = "SZL_PORTAL_OIDC_JWKS_URL"
ENV_ALGORITHMS = "SZL_PORTAL_OIDC_ALGORITHMS"

# Asymmetric JWS algorithms only. "none" and the HMAC family are never
# accepted, so a public JWKS key can't be replayed as a shared secret.
ASYMMETRIC_ALGORITHMS = frozenset({
    "RS256", "RS384", "RS512",
    "PS256", "PS384", "PS512",
    "ES256", "ES384", "ES512",
    "EdDSA",
})
DEFAULT_ALGORITHMS = ("RS256",)

MAX_TOKEN_CHARS = 16_384
MAX_JWKS_BYTES = 512_000
MAX_JWKS_KEYS = 100
JWKS_TTL_SECONDS = 300.0
JWKS_REFRESH_COOLDOWN_SECONDS = 30.0
JWKS_TIMEOUT_SECONDS = 5.0
CLOCK_LEEWAY_SECONDS = 30
MAX_SUBJECT_CHARS = 255

_COMPACT_JWS = re.compile(r"[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+")


class OidcConfigError(RuntimeError):
    """OIDC settings are missing or invalid; authentication must fail closed."""


class OidcUnavailable(RuntimeError):
    """The issuer's key set could not be obtained; authentication must fail closed."""


class AuthenticationError(Exception):
    """The bearer credential did not establish a verified identity."""


@dataclass(frozen=True)
class OidcConfig:
    issuer: str
    audience: str
    jwks_url: str
    algorithms: tuple[str, ...]


@dataclass(frozen=True)
class VerifiedSubject:
    issuer: str
    subject: str


def _https_url(value: str, label: str, *, allow_query: bool) -> str:
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme != "https" or not parsed.hostname:
        raise OidcConfigError(f"{label} must be an https URL")
    if parsed.fragment or (parsed.query and not allow_query):
        raise OidcConfigError(f"{label} must not carry a query or fragment")
    if parsed.username or parsed.password:
        raise OidcConfigError(f"{label} must not embed credentials")
    return value


def load_config(env: Mapping[str, str] | None = None) -> OidcConfig:
    """Read and validate the OIDC settings. Raises OidcConfigError when incomplete."""
    env = os.environ if env is None else env
    issuer = (env.get(ENV_ISSUER) or "").strip()
    audience = (env.get(ENV_AUDIENCE) or "").strip()
    jwks_url = (env.get(ENV_JWKS_URL) or "").strip()
    missing = [name for name, value in (
        (ENV_ISSUER, issuer), (ENV_AUDIENCE, audience), (ENV_JWKS_URL, jwks_url),
    ) if not value]
    if missing:
        raise OidcConfigError("OIDC configuration is incomplete: " + ", ".join(missing))
    _https_url(issuer, ENV_ISSUER, allow_query=False)
    _https_url(jwks_url, ENV_JWKS_URL, allow_query=True)

    raw_algorithms = (env.get(ENV_ALGORITHMS) or "").strip()
    if raw_algorithms:
        algorithms = tuple(dict.fromkeys(a.strip() for a in raw_algorithms.split(",") if a.strip()))
    else:
        algorithms = DEFAULT_ALGORITHMS
    if not algorithms or any(a not in ASYMMETRIC_ALGORITHMS for a in algorithms):
        raise OidcConfigError(
            f"{ENV_ALGORITHMS} may list only asymmetric JWS algorithms: "
            + ", ".join(sorted(ASYMMETRIC_ALGORITHMS))
        )
    return OidcConfig(issuer=issuer, audience=audience, jwks_url=jwks_url, algorithms=algorithms)


class _RejectRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: ANN001
        raise urllib.error.HTTPError(req.full_url, code, "JWKS redirects are refused", headers, fp)


def _fetch_jwks_document(url: str) -> dict[str, Any]:
    """GET the JWKS document over verified TLS: no redirects, bounded size and time."""
    opener = urllib.request.build_opener(
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        _RejectRedirects(),
    )
    request = urllib.request.Request(url, headers={"Accept": "application/json"}, method="GET")
    try:
        with opener.open(request, timeout=JWKS_TIMEOUT_SECONDS) as response:
            raw = response.read(MAX_JWKS_BYTES + 1)
    except (OSError, urllib.error.URLError) as exc:
        raise OidcUnavailable("JWKS retrieval failed") from exc
    if len(raw) > MAX_JWKS_BYTES:
        raise OidcUnavailable("JWKS document exceeds the size bound")
    try:
        document = json.loads(raw.decode("utf-8"))
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise OidcUnavailable("JWKS document is not JSON") from exc
    if not isinstance(document, dict):
        raise OidcUnavailable("JWKS document is not a JSON object")
    return document


def _parse_key_set(document: Any) -> tuple[dict[str, Any], ...]:
    keys = document.get("keys") if isinstance(document, dict) else None
    if not isinstance(keys, list) or not keys or len(keys) > MAX_JWKS_KEYS:
        raise OidcUnavailable("JWKS key set is empty, malformed or oversized")
    usable = tuple(k for k in keys if isinstance(k, dict) and isinstance(k.get("kty"), str))
    if not usable:
        raise OidcUnavailable("JWKS key set has no usable keys")
    return usable


def _match_signing_key(keys: tuple[dict[str, Any], ...], kid: str, alg: str) -> PyJWK | None:
    """Return the JWK whose kid matches and which PyJWT can load for `alg`, if any."""
    for raw in keys:
        if raw.get("kid") != kid:
            continue
        if raw.get("kty") == "oct":
            continue  # symmetric material is never a verification key here
        if raw.get("use") not in (None, "sig"):
            continue
        if raw.get("alg") is not None and raw.get("alg") != alg:
            continue
        try:
            # Loading the JWK for the token's algorithm also rejects a key of the
            # wrong type (an RSA key for an ES256 token, say).
            return PyJWK(raw, algorithm=alg)
        except jwt.PyJWTError:
            continue
    return None


class _JwksCache:
    """Per-URL key-set cache with a TTL and a refresh cooldown for unknown kids."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._entries: dict[str, tuple[float, tuple[dict[str, Any], ...]]] = {}

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()

    def signing_key(self, url: str, kid: str, alg: str) -> PyJWK:
        with self._lock:
            now = time.monotonic()
            entry = self._entries.get(url)
            if entry is not None and now - entry[0] < JWKS_TTL_SECONDS:
                key = _match_signing_key(entry[1], kid, alg)
                if key is not None:
                    return key
                if now - entry[0] < JWKS_REFRESH_COOLDOWN_SECONDS:
                    raise AuthenticationError("no matching signing key")
            key_set = _parse_key_set(_fetch_jwks_document(url))
            self._entries[url] = (now, key_set)
            key = _match_signing_key(key_set, kid, alg)
            if key is None:
                raise AuthenticationError("no matching signing key")
            return key


JWKS_CACHE = _JwksCache()


def bearer_token(authorization: str | None) -> str:
    """Extract a compact JWS from an Authorization header, or raise AuthenticationError."""
    if not authorization:
        raise AuthenticationError("missing bearer token")
    scheme, _, token = authorization.strip().partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        raise AuthenticationError("missing bearer token")
    if len(token) > MAX_TOKEN_CHARS or not _COMPACT_JWS.fullmatch(token):
        raise AuthenticationError("bearer token is not a JWT")
    return token


def verify_bearer(authorization: str | None, config: OidcConfig) -> VerifiedSubject:
    """Verify the bearer JWT against the configured issuer and return its subject.

    Raises AuthenticationError for any token that fails, and OidcUnavailable when
    the key set can't be fetched. Nothing is returned unless every check passed.
    """
    token = bearer_token(authorization)
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as exc:
        raise AuthenticationError("bearer token header is invalid") from exc
    alg = header.get("alg")
    kid = header.get("kid")
    if not isinstance(alg, str) or alg not in config.algorithms:
        raise AuthenticationError("token algorithm is not allowed")
    if not isinstance(kid, str) or not kid:
        raise AuthenticationError("token has no key id")

    signing_key = JWKS_CACHE.signing_key(config.jwks_url, kid, alg)
    try:
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=[alg],
            audience=config.audience,
            issuer=config.issuer,
            leeway=CLOCK_LEEWAY_SECONDS,
            options={
                "require": ["exp", "iat", "iss", "aud", "sub"],
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_nbf": True,
                "verify_iss": True,
                "verify_aud": True,
            },
        )
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise AuthenticationError("token signature or registered claims are invalid") from exc

    subject = claims.get("sub")
    if not isinstance(subject, str) or not 1 <= len(subject) <= MAX_SUBJECT_CHARS:
        raise AuthenticationError("token subject is invalid")
    if claims.get("iss") != config.issuer:
        raise AuthenticationError("token issuer is invalid")
    return VerifiedSubject(issuer=config.issuer, subject=subject)


def account_binding(identity: VerifiedSubject) -> str:
    """The value stored in accounts.oauth_sub: issuer-qualified, since `sub` is unique only per issuer."""
    return f"{identity.issuer}#{identity.subject}"


def placeholder_email(binding: str) -> str:
    """accounts.email is NOT NULL UNIQUE; the token's email claim isn't trusted for that."""
    return hashlib.sha256(binding.encode("utf-8")).hexdigest()[:32] + "@oidc.invalid"
