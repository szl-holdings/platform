#!/usr/bin/env python3
"""harvest_security.py — Security layer for the wasted-energy harvest module.

Four orthogonal controls (all enforced before any outbound byte leaves the box):

1. EGRESS ALLOWLIST / SSRF GUARD
   Only the exact harvest hostnames are reachable.  The wrapper resolves the
   hostname to an IP and rejects private/loopback/link-local ranges even if DNS
   has been poisoned (TOCTOU note: see DNS-rebinding caveat in RESIDUAL RISK).

2. RATE LIMIT / POLITENESS
   Per-host token-bucket: minimum interval between consecutive calls to the same
   host.  These are FREE public endpoints; we must be good citizens.

3. SECRET-LEAK GUARD
   scrub() strips secret-shaped strings from any dict or str before logging/
   returning.  assert_no_secret_in_outbound() raises if a key ever leaks into
   a harvest request — harvest is KEYLESS BY DESIGN; this enforces it.

4. CONSENT-ONLY SWARM GATE
   consent_gate() default-DENY: a swarm node must appear in the explicit
   consent allowlist before ANY connection is attempted.  Models BOINC /
   Folding@home opt-in doctrine.  No scanning, no unsolicited reach.

Doctrine (binding):
  - NO free-energy.  All data is open/public.
  - CONSENT-ONLY swarm: never reach an un-consented node (Λ=Conjecture 1).
  - locked-8 untouched.
  - NEVER commit a real secret.
"""
from __future__ import annotations

import hashlib
import hmac
import ipaddress
import re
import socket
import time
import urllib.request
import urllib.parse
from typing import Any, Dict, Optional, Set

# ---------------------------------------------------------------------------
# 1. EGRESS ALLOWLIST (anti-SSRF)
# ---------------------------------------------------------------------------

#: The exact set of hostnames the harvest module is allowed to contact.
#: Any URL whose resolved host is not in this set will be REFUSED.
#: NOTE on HTTP: CAISO OASIS returns the actual data as a ZIP inside an HTTPS
#: endpoint so HTTPS is fine there too.  ALL feeds here support HTTPS; the
#: module uses https:// for every call so plain-HTTP is disallowed globally.
EGRESS_ALLOWLIST: Set[str] = {
    "api.awattar.de",
    "api.awattar.at",
    "api.energy-charts.info",
    "api.carbonintensity.org.uk",
    "api.open-meteo.com",
    "marine-api.open-meteo.com",
    "oasis.caiso.com",
    # UK Elexon BMRS — used by jack_elexon_uk()
    "data.elexon.co.uk",
}

#: Private / loopback / link-local IPv4 networks to block (SSRF guard).
_BLOCKED_V4 = [
    ipaddress.IPv4Network("10.0.0.0/8"),
    ipaddress.IPv4Network("127.0.0.0/8"),
    ipaddress.IPv4Network("169.254.0.0/16"),   # AWS metadata et al.
    ipaddress.IPv4Network("172.16.0.0/12"),
    ipaddress.IPv4Network("192.168.0.0/16"),
    ipaddress.IPv4Network("0.0.0.0/8"),
    ipaddress.IPv4Network("100.64.0.0/10"),    # shared address space (RFC 6598)
    ipaddress.IPv4Network("192.0.2.0/24"),     # TEST-NET
    ipaddress.IPv4Network("198.51.100.0/24"),
    ipaddress.IPv4Network("203.0.113.0/24"),
    ipaddress.IPv4Network("240.0.0.0/4"),      # reserved
]

#: Private / loopback / link-local IPv6 networks to block.
_BLOCKED_V6 = [
    ipaddress.IPv6Network("::1/128"),          # loopback
    ipaddress.IPv6Network("fc00::/7"),          # ULA
    ipaddress.IPv6Network("fe80::/10"),         # link-local
    ipaddress.IPv6Network("::ffff:0:0/96"),     # IPv4-mapped (catches 127.x etc.)
    ipaddress.IPv6Network("2001:db8::/32"),     # documentation
    ipaddress.IPv6Network("100::/64"),          # discard
]

#: Hard limits on egress requests.
SAFE_GET_TIMEOUT: int = 15           # seconds
SAFE_GET_MAX_BYTES: int = 4 * 1024 * 1024   # 4 MiB — generous for any JSON feed


class EgressDenied(Exception):
    """Raised when safe_get() refuses a request for any security reason."""


def _is_blocked_ip(addr: str) -> bool:
    """Return True if *addr* (a resolved IP string) falls in a blocked range."""
    try:
        ip = ipaddress.ip_address(addr)
    except ValueError:
        return True   # unparseable → deny
    if isinstance(ip, ipaddress.IPv4Address):
        return any(ip in net for net in _BLOCKED_V4)
    if isinstance(ip, ipaddress.IPv6Address):
        return any(ip in net for net in _BLOCKED_V6)
    return True


def _resolve_and_check(host: str) -> None:
    """Resolve *host* to all its addresses and raise EgressDenied if ANY
    address falls in a blocked range.

    DNS-rebinding caveat (residual risk): the TCP connection is opened AFTER
    this check, so a malicious resolver could return a public IP here then
    serve a private one for the actual SYN.  Full mitigation requires binding
    the socket to the checked IP, which urllib does not expose.  This guard
    stops accidental / misconfiguration SSRF; a determined attacker with
    control of the authoritative DNS for an allowlisted domain could bypass it.
    """
    try:
        infos = socket.getaddrinfo(host, None)
    except socket.gaierror as exc:
        raise EgressDenied(f"SSRF guard: DNS resolution failed for {host!r}: {exc}") from exc
    for *_, (addr, *__) in infos:
        if _is_blocked_ip(addr):
            raise EgressDenied(
                f"SSRF guard: host {host!r} resolves to blocked IP {addr!r}"
            )


_UA = {"User-Agent": "szl-wasted-energy-harvest/1.0 (+https://a-11-oy.com)"}


def safe_get(url: str, extra_headers: Optional[Dict[str, str]] = None) -> Optional[object]:
    """Allowlist-checked, rate-limited, secret-clean replacement for _get_json().

    Raises EgressDenied for any policy violation; returns None on non-fatal
    network failures (consistent with the original _get_json behaviour).

    Steps performed in order:
      1. Assert no secret in the outbound URL + headers.
      2. Parse URL; require https scheme.
      3. Check host against EGRESS_ALLOWLIST.
      4. Resolve host; reject private/loopback/link-local IPs.
      5. Enforce per-host rate limit (token bucket).
      6. Perform the GET with timeout + max-bytes guard.
    """
    headers = dict(_UA)
    if extra_headers:
        headers.update(extra_headers)

    # Step 1 — secret-leak guard on outbound request
    assert_no_secret_in_outbound(url, headers)

    # Step 2 — scheme
    parsed = urllib.parse.urlparse(url)
    scheme = parsed.scheme.lower()
    if scheme != "https":
        raise EgressDenied(
            f"SSRF guard: only https is permitted; got scheme={scheme!r} for {url!r}"
        )

    # Step 3 — allowlist
    host = parsed.hostname or ""
    if not host:
        raise EgressDenied(f"SSRF guard: cannot parse hostname from {url!r}")
    if host not in EGRESS_ALLOWLIST:
        raise EgressDenied(
            f"SSRF guard: host {host!r} is NOT in the egress allowlist"
        )

    # Step 4 — IP resolution check (blocks SSRF to private ranges)
    _resolve_and_check(host)

    # Step 5 — rate limit
    _rate_limit(host)

    # Step 6 — fetch with hard timeout + max-bytes
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=SAFE_GET_TIMEOUT) as resp:
            body = resp.read(SAFE_GET_MAX_BYTES + 1)
        if len(body) > SAFE_GET_MAX_BYTES:
            raise EgressDenied(
                f"EGRESS guard: response from {host!r} exceeded {SAFE_GET_MAX_BYTES} bytes"
            )
        text = body.decode("utf-8", "replace").strip()
        if not text:
            return None
        import json
        return json.loads(text)
    except EgressDenied:
        raise
    except Exception:
        return None


# ---------------------------------------------------------------------------
# 2. RATE LIMIT / POLITENESS
# ---------------------------------------------------------------------------

#: Minimum gap (seconds) between consecutive calls to the SAME host.
#: Free public endpoints should never be hammered; 2 s is polite.
_RATE_MIN_INTERVAL: float = 2.0

#: Wall-clock time of the last call per host.
_last_call: Dict[str, float] = {}


def _rate_limit(host: str) -> None:
    """Block (sleep) until the per-host minimum interval has elapsed.

    This is a simple token-bucket with bucket-size=1; one outstanding
    request per host at a time, minimum *_RATE_MIN_INTERVAL* seconds apart.
    """
    now = time.monotonic()
    last = _last_call.get(host, 0.0)
    gap = now - last
    if gap < _RATE_MIN_INTERVAL:
        time.sleep(_RATE_MIN_INTERVAL - gap)
    _last_call[host] = time.monotonic()


# ---------------------------------------------------------------------------
# 3. SECRET-LEAK GUARD
# ---------------------------------------------------------------------------

#: Patterns that identify secret-shaped material.
#: Ordered from most-specific to most-general so that specific matches shadow
#: broader ones in debug output.  All matches are replaced with [REDACTED].
_SECRET_PATTERNS: list = [
    # Authorization header values (any scheme)
    re.compile(r"(?i)authorization\s*[:=]\s*\S+"),
    # Bearer tokens (JWT, OAuth, arbitrary)
    re.compile(r"(?i)bearer\s+[A-Za-z0-9\-._~+/=]+"),
    # Named credential key=value (handles hyphens, underscores, dots in value)
    re.compile(r"(?i)(api[_-]?key|apikey|access[_-]?token|secret[_-]?key|auth[_-]?token)\s*[:=]\s*\S+"),
    # Generic token= / api_key= style (value may contain any non-whitespace chars)
    re.compile(r"(?i)\b(token|api_key|apikey)\s*[:=]\s*\S+"),
    # AWS access key ID
    re.compile(r"AKIA[0-9A-Z]{16}"),
    # AWS secret access key
    re.compile(r"(?i)aws[_-]secret[_-]access[_-]key\s*[:=]\s*\S+"),
    # Long base64 blobs (40+ chars)
    re.compile(r"[A-Za-z0-9+/]{40,}={0,2}"),
    # Long hex strings (32+ hex chars)
    re.compile(r"[0-9a-fA-F]{32,}"),
]

_SCRUB_PLACEHOLDER = "[REDACTED]"


def scrub(obj: Any) -> Any:
    """Recursively strip secret-shaped strings from *obj* (dict, list, or str).

    All matching substrings are replaced with ``[REDACTED]``.  The original
    object is NOT mutated; a new object is returned.

    Use this before logging any external response or including it in a receipt.
    """
    if isinstance(obj, str):
        result = obj
        for pat in _SECRET_PATTERNS:
            result = pat.sub(_SCRUB_PLACEHOLDER, result)
        return result
    if isinstance(obj, dict):
        return {k: scrub(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [scrub(item) for item in obj]
    return obj


def assert_no_secret_in_outbound(url: str, headers: Dict[str, str]) -> None:
    """Raise ValueError if any secret pattern is detected in *url* or *headers*.

    Harvest is KEYLESS BY DESIGN — no auth tokens, no API keys.  This guard
    enforces that invariant: if a secret somehow ends up in an outbound
    harvest request (e.g. env-var injection, mis-wired config) the request is
    REFUSED and an error is raised before a single byte leaves the host.
    """
    combined = url + " " + " ".join(f"{k}:{v}" for k, v in headers.items())
    for pat in _SECRET_PATTERNS:
        m = pat.search(combined)
        if m:
            raise ValueError(
                f"SECRET-LEAK guard: secret-shaped material detected in outbound "
                f"harvest request (pattern={pat.pattern!r}, match={m.group()[:20]!r}…). "
                f"Harvest is keyless — remove the credential."
            )


# ---------------------------------------------------------------------------
# 4. CONSENT-ONLY SWARM GATE
# ---------------------------------------------------------------------------
#
# Doctrine: we model BOINC / Folding@home.  A swarm node is NEVER contacted
# unless the node operator has explicitly opted in.  We store a signed consent
# token per node (HMAC-SHA256 of "consent:<node_id>" with the shared secret).
# Default is DENY; even a node known by name is refused until its token is
# verified.
#
# In production the shared secret is exchanged out-of-band (never committed).
# The unit-test uses a FAKE string — "FAKE_TEST_TOKEN_do_not_use" — which is
# clearly labelled and never a real credential.

#: Map of node_id → HMAC-SHA256 consent token (hex).
#: Populated by `register_consent(node_id, token, secret)` at runtime.
_CONSENT_REGISTRY: Dict[str, str] = {}


class ConsentDenied(Exception):
    """Raised when consent_gate() refuses access to a swarm node."""


def _make_consent_token(node_id: str, secret: bytes) -> str:
    """Derive the expected consent token for *node_id* given *secret*."""
    msg = f"consent:{node_id}".encode()
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()


def register_consent(node_id: str, token: str, secret: bytes) -> None:
    """Register *node_id* as consented after verifying its *token*.

    The *token* must equal HMAC-SHA256("consent:<node_id>", secret).
    Raises ValueError if the token is invalid.  This should be called once
    at startup per node, using tokens distributed out-of-band.
    """
    expected = _make_consent_token(node_id, secret)
    if not hmac.compare_digest(token, expected):
        raise ValueError(
            f"CONSENT gate: invalid consent token for node {node_id!r}. "
            f"Node is NOT registered."
        )
    _CONSENT_REGISTRY[node_id] = token


def consent_gate(node_id: str) -> None:
    """Raise ConsentDenied unless *node_id* is in the verified consent registry.

    Call this before ANY connection attempt to a swarm node.  The gate is
    DEFAULT DENY — if a node_id is not in the registry (even if the hostname
    looks legitimate) the request is REFUSED.

    Doctrine: consent-only swarm, modelled on BOINC / Folding@home opt-in.
    We never scan, never probe, never reach an un-consented host.
    """
    if node_id not in _CONSENT_REGISTRY:
        raise ConsentDenied(
            f"CONSENT gate: node {node_id!r} has not consented. "
            f"DENY — add node to the consent registry via register_consent() "
            f"with a valid signed token before attempting contact."
        )


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    import json as _json

    checks = 0
    failures = []

    def _check(name: str, ok: bool, detail: str = "") -> None:
        global checks
        checks += 1
        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {name}" + (f" — {detail}" if detail else ""))
        if not ok:
            failures.append(name)

    print("=== harvest_security self-test ===\n")

    # ------------------------------------------------------------------
    # (a) Allowlist: allowed host passes; non-allowed host is refused
    # ------------------------------------------------------------------
    print("--- (a) EGRESS ALLOWLIST ---")

    # Non-allowlisted host — must raise EgressDenied
    try:
        safe_get("https://evil.com/steal")
        _check("evil.com refused", False, "should have raised EgressDenied")
    except EgressDenied as e:
        _check("evil.com refused", True, str(e)[:80])

    # AWS metadata endpoint via http — must raise (http scheme)
    try:
        safe_get("http://169.254.169.254/latest/meta-data/")
        _check("AWS metadata http refused", False, "should have raised EgressDenied")
    except EgressDenied as e:
        _check("AWS metadata http refused", True, str(e)[:80])

    # AWS metadata endpoint via https — not in allowlist
    try:
        safe_get("https://169.254.169.254/latest/meta-data/")
        _check("AWS metadata https refused (not in allowlist)", False, "should have raised EgressDenied")
    except EgressDenied as e:
        _check("AWS metadata https refused (not in allowlist)", True, str(e)[:80])

    # ------------------------------------------------------------------
    # (b) Private-IP URL refused
    # ------------------------------------------------------------------
    print("\n--- (b) PRIVATE IP SSRF BLOCK ---")

    # Temporarily patch allowlist to let "localhost" through host-check,
    # so we exercise the IP resolution layer specifically.
    EGRESS_ALLOWLIST.add("localhost")
    try:
        safe_get("https://localhost/admin")
        _check("localhost (127.0.0.1) refused", False, "should have raised EgressDenied")
    except EgressDenied as e:
        _check("localhost (127.0.0.1) refused", True, str(e)[:80])
    finally:
        EGRESS_ALLOWLIST.discard("localhost")

    # ------------------------------------------------------------------
    # (c) scrub() removes an injected fake token
    # ------------------------------------------------------------------
    print("\n--- (c) SECRET-LEAK SCRUB ---")
    FAKE_TOKEN = "FAKE_TEST_TOKEN_do_not_use"

    dirty_str = f"api_key={FAKE_TOKEN} wind=12.3"
    clean_str = scrub(dirty_str)
    _check(
        "scrub() removes api_key from string",
        FAKE_TOKEN not in clean_str,
        f"result: {clean_str!r}",
    )

    dirty_dict = {
        "Authorization": f"Bearer {FAKE_TOKEN}",
        "wind_speed": 12.3,
        "nested": {"token": f"token={FAKE_TOKEN}"},
    }
    clean_dict = scrub(dirty_dict)
    auth_clean = clean_dict.get("Authorization", "")
    nested_clean = clean_dict.get("nested", {})
    _check(
        "scrub() removes Bearer token from dict",
        FAKE_TOKEN not in auth_clean,
        f"Authorization value → {auth_clean!r}",
    )
    nested_val = nested_clean.get("token", "") if isinstance(nested_clean, dict) else str(nested_clean)
    _check(
        "scrub() removes nested token",
        FAKE_TOKEN not in nested_val,
        f"nested.token → {nested_val!r}",
    )

    # assert_no_secret_in_outbound raises on URL with fake token
    try:
        assert_no_secret_in_outbound(
            f"https://api.awattar.de/v1/marketdata?api_key={FAKE_TOKEN}",
            {},
        )
        _check("assert_no_secret raises on keyed URL", False, "should have raised ValueError")
    except ValueError as e:
        _check("assert_no_secret raises on keyed URL", True, str(e)[:80])

    # clean URL passes
    try:
        assert_no_secret_in_outbound("https://api.awattar.de/v1/marketdata", {})
        _check("assert_no_secret passes on clean URL", True)
    except ValueError as e:
        _check("assert_no_secret passes on clean URL", False, str(e)[:80])

    # ------------------------------------------------------------------
    # (d) consent_gate: default deny; explicit consent allows
    # ------------------------------------------------------------------
    print("\n--- (d) CONSENT-ONLY SWARM GATE ---")

    FAKE_NODE = "node-test-001"
    FAKE_SECRET = b"FAKE_SHARED_SECRET_do_not_use_in_prod"

    # Default deny — node not registered yet
    try:
        consent_gate(FAKE_NODE)
        _check("consent_gate default DENY", False, "should have raised ConsentDenied")
    except ConsentDenied as e:
        _check("consent_gate default DENY", True, str(e)[:80])

    # Bad token — must be refused
    try:
        register_consent(FAKE_NODE, "not-a-valid-token", FAKE_SECRET)
        _check("register_consent rejects bad token", False, "should have raised ValueError")
    except ValueError as e:
        _check("register_consent rejects bad token", True, str(e)[:80])

    # Correct token — derive it and register
    good_token = _make_consent_token(FAKE_NODE, FAKE_SECRET)
    try:
        register_consent(FAKE_NODE, good_token, FAKE_SECRET)
        _check("register_consent accepts good token", True)
    except Exception as e:
        _check("register_consent accepts good token", False, str(e)[:80])

    # Now gate should pass
    try:
        consent_gate(FAKE_NODE)
        _check("consent_gate ALLOWS registered node", True)
    except ConsentDenied as e:
        _check("consent_gate ALLOWS registered node", False, str(e)[:80])

    # A DIFFERENT node still denied
    try:
        consent_gate("node-unregistered-999")
        _check("consent_gate DENIES unregistered node", False, "should have raised ConsentDenied")
    except ConsentDenied as e:
        _check("consent_gate DENIES unregistered node", True, str(e)[:80])

    # ------------------------------------------------------------------
    # (e) Rate limiter spaces calls
    # ------------------------------------------------------------------
    print("\n--- (e) RATE LIMITER ---")
    TEST_HOST = "_test_rate_host_"
    _last_call[TEST_HOST] = time.monotonic()   # simulate a recent call

    t0 = time.monotonic()
    _rate_limit(TEST_HOST)
    elapsed = time.monotonic() - t0

    _check(
        f"rate_limit waits >= {_RATE_MIN_INTERVAL}s between calls",
        elapsed >= _RATE_MIN_INTERVAL - 0.05,   # 50 ms tolerance
        f"elapsed={elapsed:.3f}s (min={_RATE_MIN_INTERVAL}s)",
    )

    # Second immediate call should also wait
    t1 = time.monotonic()
    _rate_limit(TEST_HOST)
    elapsed2 = time.monotonic() - t1
    _check(
        "consecutive rate_limit calls each wait",
        elapsed2 >= _RATE_MIN_INTERVAL - 0.05,
        f"elapsed={elapsed2:.3f}s",
    )

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    print()
    if failures:
        print(f"FAILED checks: {failures}")
        print(f"ok:false checks:{checks}")
        sys.exit(1)
    else:
        print(f"ok:true checks:{checks}")
        sys.exit(0)
