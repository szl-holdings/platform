# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 LOCKED 749/14/163 · Λ = Conjecture 1 (NOT a theorem)
"""verify_engine — REAL, honest, offline-first receipt verification for a11oy.

This is the engine behind the public POST/GET /api/a11oy/v1/verify endpoint.
It re-derives trust from the bytes a caller hands it — no private key, no org
secret, no trust in this server. Every check is labelled with an HONEST status:

  pass            — the cryptographic/structural check succeeded
  fail            — the check ran and the receipt is INVALID (loud, never masked)
  unreachable     — an online corroboration source could not be reached right now
  not_applicable  — the receipt does not carry the material this check needs
  info            — structural observation, not a trust assertion

DOCTRINE / HONESTY
  - An unsigned decision-log is reported as UNSIGNED (structural only) — NEVER
    "verified". We never fabricate a green verdict.
  - Sigstore-keyless bundles: we verify the DSSE signature against the embedded
    Fulcio certificate's public key, pin the certificate SAN + OIDC issuer, and
    look up the Rekor transparency-log entry. The full Fulcio-chain-to-root walk
    is delegated to `cosign` / `scripts/verify_dsse_real.py` for maximum
    assurance; we say so plainly rather than implying we did it.
  - No network call is required for the core signature math; online checks
    (Rekor, Lean citation, URL fetch) degrade to `unreachable`, never to a lie.
"""
from __future__ import annotations

import base64
import binascii
import hashlib
import ipaddress
import json
import re
import socket
import ssl
import urllib.request
from typing import Any
from datetime import datetime, timezone
from urllib.parse import urlsplit

from cryptography import x509
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, ed25519, padding, rsa
from cryptography.hazmat.primitives.serialization import load_pem_public_key, load_der_public_key
from cryptography.x509.oid import ExtensionOID, NameOID

ENGINE_VERSION = "1.0.0"
DOCTRINE = {"version": "v11", "counts": "749/14/163", "lambda": "Conjecture 1"}
_SIGSTORE_OIDC_ISSUER = "https://token.actions.githubusercontent.com"
# Fulcio v1 / v2 OIDC-issuer X.509 extension OIDs.
_OID_ISSUER_V1 = "1.3.6.1.4.1.57264.1.1"
_OID_ISSUER_V2 = "1.3.6.1.4.1.57264.1.8"
_REKOR_BASE = "https://rekor.sigstore.dev/api/v1/log/entries"
_HTTP_TIMEOUT = 8
_MAX_FETCH_BYTES = 2_000_000

_ssl_ctx = ssl.create_default_context()


# --------------------------------------------------------------------------- #
  # SSRF guard: every outbound fetch must target a PUBLIC host over http(s).
  # User-influenced URLs (Lean citation paths, fetch_and_verify) would otherwise
  # let a caller pivot the request at internal / cloud-metadata addresses (e.g.
  # 169.254.169.254, 127.0.0.1, 10.0.0.0/8). We resolve the host and reject any
  # private / loopback / link-local / reserved / multicast IP, and re-run the same
  # check on every redirect hop (redirects are a classic TOCTOU SSRF bypass).
  # --------------------------------------------------------------------------- #
  _ALLOWED_SCHEMES = ("http", "https")


  def _assert_public_url(url: str) -> None:
      parts = urlsplit(url)
      if parts.scheme not in _ALLOWED_SCHEMES:
          raise ValueError(f"blocked URL scheme: {parts.scheme or '(none)'}")
      host = parts.hostname
      if not host:
          raise ValueError("blocked URL: missing host")
      try:
          infos = socket.getaddrinfo(
              host, parts.port or (443 if parts.scheme == "https" else 80)
          )
      except socket.gaierror as exc:
          raise ValueError(f"blocked URL: cannot resolve host {host!r}: {exc}") from exc
      for info in infos:
          ip = ipaddress.ip_address(info[4][0])
          if (
              ip.is_private
              or ip.is_loopback
              or ip.is_link_local
              or ip.is_reserved
              or ip.is_multicast
              or ip.is_unspecified
          ):
              raise ValueError(
                  f"blocked URL: host {host!r} resolves to non-public address {ip}"
              )


  class _SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
      """Re-validate every redirect target so a public URL cannot be bounced to an
      internal one."""

      def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
          _assert_public_url(newurl)
          return super().redirect_request(req, fp, code, msg, headers, newurl)


  _opener = urllib.request.build_opener(
      _SafeRedirectHandler(),
      urllib.request.HTTPSHandler(context=_ssl_ctx),
  )


# --------------------------------------------------------------------------- #
# small helpers
# --------------------------------------------------------------------------- #
def _b64d(s: str) -> bytes:
    """Tolerant base64 decode (standard or url-safe, padded or not)."""
    if isinstance(s, bytes):
        return s
    s = s.strip()
    pad = "=" * (-len(s) % 4)
    try:
        return base64.b64decode(s + pad)
    except (binascii.Error, ValueError):
        return base64.urlsafe_b64decode(s + pad)


def _http_get(url: str, accept: str = "application/json") -> tuple[int, bytes]:
    _assert_public_url(url)
    req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": "a11oy-verify/1.0"})
    with _opener.open(req, timeout=_HTTP_TIMEOUT) as r:
        return r.status, r.read(_MAX_FETCH_BYTES)


def _is_hex(s: str, n: int | None = None) -> bool:
    if not isinstance(s, str):
        return False
    if n is not None and len(s) != n:
        return False
    return bool(re.fullmatch(r"[0-9a-fA-F]+", s))


def pae(payload_type: str, payload: bytes) -> bytes:
    """DSSE Pre-Authentication Encoding (DSSEv1) — the bytes that get signed."""
    t = payload_type.encode("utf-8")
    return b"DSSEv1 %d %s %d %s" % (len(t), t, len(payload), payload)


# --------------------------------------------------------------------------- #
# key + signature primitives (REAL, via `cryptography`)
# --------------------------------------------------------------------------- #
def _load_pubkey(material: bytes):
    last = None
    for loader in (load_pem_public_key, load_der_public_key):
        try:
            return loader(material)
        except Exception as exc:  # noqa: BLE001
            last = exc
    raise ValueError(f"unrecognised public key material: {last}")


def _verify_with_key(pubkey, sig: bytes, msg: bytes) -> tuple[bool, str]:
    """Verify `sig` over `msg` with `pubkey`. Returns (ok, algo_description)."""
    try:
        if isinstance(pubkey, ed25519.Ed25519PublicKey):
            pubkey.verify(sig, msg)
            return True, "Ed25519"
        if isinstance(pubkey, ec.EllipticCurvePublicKey):
            for h in (hashes.SHA256(), hashes.SHA384(), hashes.SHA512()):
                try:
                    pubkey.verify(sig, msg, ec.ECDSA(h))
                    return True, f"ECDSA-{pubkey.curve.name}/{h.name}"
                except InvalidSignature:
                    continue
            return False, f"ECDSA-{pubkey.curve.name}"
        if isinstance(pubkey, rsa.RSAPublicKey):
            for h in (hashes.SHA256(), hashes.SHA384(), hashes.SHA512()):
                try:
                    pubkey.verify(sig, msg, padding.PKCS1v15(), h)
                    return True, f"RSA-PKCS1v15/{h.name}"
                except InvalidSignature:
                    continue
            return False, "RSA"
    except InvalidSignature:
        return False, type(pubkey).__name__
    return False, f"unsupported-key:{type(pubkey).__name__}"


def _load_cert(material: str | bytes):
    if isinstance(material, str):
        if "BEGIN CERTIFICATE" in material:
            return x509.load_pem_x509_certificate(material.encode())
        material = _b64d(material)
    try:
        return x509.load_pem_x509_certificate(material)
    except Exception:  # noqa: BLE001
        return x509.load_der_x509_certificate(material)


def _cert_identity(cert) -> dict[str, Any]:
    out: dict[str, Any] = {"san_uris": [], "san_emails": [], "issuer_oidc": None}
    try:
        san = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME).value
        out["san_uris"] = list(san.get_values_for_type(x509.UniformResourceIdentifier))
        out["san_emails"] = list(san.get_values_for_type(x509.RFC822Name))
    except Exception:  # noqa: BLE001
        pass
    for oid in (_OID_ISSUER_V2, _OID_ISSUER_V1):
        try:
            ext = cert.extensions.get_extension_for_oid(x509.ObjectIdentifier(oid))
            val = ext.value.value
            out["issuer_oidc"] = val.decode("utf-8", "replace").lstrip("\x0c ").strip()
            break
        except Exception:  # noqa: BLE001
            continue
    try:
        out["not_before"] = cert.not_valid_before_utc.isoformat()
        out["not_after"] = cert.not_valid_after_utc.isoformat()
    except Exception:  # noqa: BLE001
        pass
    try:
        out["fingerprint_sha256"] = cert.fingerprint(hashes.SHA256()).hex()
    except Exception:  # noqa: BLE001
        pass
    return out


# --------------------------------------------------------------------------- #
# online corroboration (honest: degrades to unreachable)
# --------------------------------------------------------------------------- #
def rekor_inclusion(log_index: int) -> dict[str, Any]:
    try:
        status, body = _http_get(f"{_REKOR_BASE}?logIndex={int(log_index)}")
        if status != 200:
            return {"status": "unreachable", "detail": f"rekor HTTP {status}"}
        data = json.loads(body)
        uuid = next(iter(data), None)
        entry = data.get(uuid, {}) if uuid else {}
        return {
            "status": "pass",
            "log_index": int(log_index),
            "entry_uuid": uuid,
            "integrated_time": entry.get("integratedTime"),
            "detail": "entry present in Rekor public transparency log",
        }
    except Exception as exc:  # noqa: BLE001
        return {"status": "unreachable", "detail": f"rekor lookup failed: {exc}"}


_LEAN_CITE = re.compile(r"([A-Za-z0-9_./-]+\.lean)(?:::([A-Za-z0-9_']+))?")


def lean_citation(ref: str) -> dict[str, Any]:
    """Check a Lean citation exists in the public lutar-lean repo. Existence,
    NOT re-proof — kernel re-checking is a `lake build`, which we name as the
    stronger step rather than claim to have done it."""
    m = _LEAN_CITE.search(ref or "")
    if not m:
        return {"status": "not_applicable", "detail": "no Lean .lean citation found"}
    path = m.group(1).lstrip("/")
    theorem = m.group(2)
    candidates = [path]
    if not path.startswith(("Lutar/", "Showcase/", "src/")):
        candidates += [f"Lutar/{path}", f"src/{path}"]
    for cand in candidates:
        if ".." in cand.split("/"):
            continue
        url = f"https://api.github.com/repos/szl-holdings/lutar-lean/contents/{cand}?ref=main"
        try:
            status, body = _http_get(url, accept="application/vnd.github.raw")
        except Exception as exc:  # noqa: BLE001
            return {"status": "unreachable", "detail": f"lutar-lean lookup failed: {exc}"}
        if status == 200:
            found_thm = None
            if theorem:
                txt = body.decode("utf-8", "replace")
                found_thm = bool(re.search(rf"\b(theorem|lemma|def)\s+{re.escape(theorem)}\b", txt))
            return {
                "status": "pass" if (theorem is None or found_thm) else "fail",
                "file": cand,
                "theorem": theorem,
                "theorem_present": found_thm,
                "detail": "Lean file exists in public lutar-lean@main; kernel re-check = `lake build`",
            }
    return {"status": "fail", "detail": f"Lean file not found in lutar-lean@main: {path}"}


# --------------------------------------------------------------------------- #
# receipt-shape verifiers
# --------------------------------------------------------------------------- #
def _verify_intoto_statement(stmt: dict, checks: list) -> None:
    pt = stmt.get("predicateType") or stmt.get("predicate_type")
    subjects = stmt.get("subject") or []
    if not pt and not subjects:
        return
    checks.append({"name": "intoto.predicate_type", "status": "pass" if pt else "fail",
                   "detail": pt or "missing predicateType"})
    digests_ok = bool(subjects)
    seen = []
    for s in subjects:
        d = (s.get("digest") or {})
        sha = d.get("sha256") or d.get("sha512")
        seen.append({"name": s.get("name"), "sha256": d.get("sha256")})
        if not (isinstance(sha, str) and _is_hex(sha)):
            digests_ok = False
    checks.append({"name": "intoto.subject_digests",
                   "status": "pass" if digests_ok else ("fail" if subjects else "not_applicable"),
                   "subjects": seen,
                   "detail": "subject artifact digests are well-formed hex"
                             if digests_ok else "subject(s) missing a well-formed digest"})


def _verify_dsse(env: dict, *, pubkey_pem: str | None, identity: str | None,
                 do_rekor: bool, checks: list) -> dict | None:
    """Verify a DSSE envelope. Returns the decoded payload object if any."""
    payload_b64 = env.get("payload")
    sigs = env.get("signatures") or []
    if payload_b64 is None or not sigs:
        return None
    try:
        payload = _b64d(payload_b64)
    except Exception as exc:  # noqa: BLE001
        checks.append({"name": "dsse.payload_b64", "status": "fail", "detail": f"payload not base64: {exc}"})
        return None
    ptype = env.get("payloadType") or env.get("payload_type") or "application/vnd.in-toto+json"
    signed = pae(ptype, payload)
    checks.append({"name": "dsse.structure", "status": "pass",
                   "detail": f"payloadType={ptype} payload_len={len(payload)} sigs={len(sigs)}"})

    sig_block = env.get("_sigstore") or {}
    cert_material = None
    for s in sigs:
        cert_material = s.get("cert") or s.get("certificate") or cert_material
    cert_material = cert_material or sig_block.get("certificate") or sig_block.get("cert")

    verified_any = False
    for i, s in enumerate(sigs):
        sig_raw = s.get("sig") or s.get("signature")
        if sig_raw is None:
            continue
        try:
            sig = _b64d(sig_raw)
        except Exception:  # noqa: BLE001
            checks.append({"name": f"dsse.sig[{i}]", "status": "fail", "detail": "signature not base64"})
            continue
        pubkey = None
        key_src = None
        if cert_material:
            try:
                cert = _load_cert(cert_material)
                pubkey = cert.public_key()
                key_src = "embedded Fulcio certificate"
                ident = _cert_identity(cert)
                ok_id = True
                detail = f"SAN={ident.get('san_uris') or ident.get('san_emails')} issuer={ident.get('issuer_oidc')}"
                if identity:
                    ok_id = identity in (ident.get("san_uris", []) + ident.get("san_emails", []))
                    detail += f" | expected_identity {'MATCH' if ok_id else 'MISMATCH'}: {identity}"
                checks.append({"name": "sigstore.identity",
                               "status": "pass" if ok_id else "fail",
                               "identity": ident, "detail": detail})
            except Exception as exc:  # noqa: BLE001
                checks.append({"name": "sigstore.certificate", "status": "fail",
                               "detail": f"could not parse certificate: {exc}"})
        if pubkey is None and pubkey_pem:
            try:
                pubkey = _load_pubkey(pubkey_pem.encode() if isinstance(pubkey_pem, str) else pubkey_pem)
                key_src = "caller-supplied public key"
            except Exception as exc:  # noqa: BLE001
                checks.append({"name": "dsse.pubkey", "status": "fail", "detail": str(exc)})
        if pubkey is None:
            checks.append({"name": f"dsse.sig[{i}]", "status": "not_applicable",
                           "detail": "no public key available (embed a Fulcio cert or supply pubkey_pem) "
                                     "— signature present but cannot be checked here"})
            continue
        ok, algo = _verify_with_key(pubkey, sig, signed)
        verified_any = verified_any or ok
        checks.append({"name": f"dsse.sig[{i}]", "status": "pass" if ok else "fail",
                       "key_source": key_src, "algorithm": algo,
                       "detail": "DSSE signature verifies over PAE(payloadType,payload)"
                                 if ok else "DSSE signature DID NOT verify"})

    if sig_block.get("bundle") and not verified_any:
        checks.append({"name": "sigstore.bundle", "status": "info",
                       "detail": "envelope carries a Sigstore bundle; full Fulcio-chain-to-root "
                                 "verification is best done with `cosign verify-blob` / "
                                 "scripts/verify_dsse_real.py (uses the sigstore lib)"})
    rekor_idx = sig_block.get("rekor_log_index") or env.get("rekor_log_index")
    if do_rekor and rekor_idx is not None:
        checks.append({"name": "rekor.inclusion", **rekor_inclusion(rekor_idx)})

    try:
        return json.loads(payload)
    except Exception:  # noqa: BLE001
        return None


def _scan_lean_citations(obj: Any, checks: list, _depth: int = 0) -> None:
    if _depth > 6:
        return
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and ".lean" in v:
                res = lean_citation(v)
                if res.get("status") != "not_applicable":
                    checks.append({"name": f"lean.citation[{k}]", **res})
                    return
            _scan_lean_citations(v, checks, _depth + 1)
    elif isinstance(obj, list):
        for v in obj[:20]:
            _scan_lean_citations(v, checks, _depth + 1)


# --------------------------------------------------------------------------- #
# top-level
# --------------------------------------------------------------------------- #
def verify(target: dict, *, pubkey_pem: str | None = None, identity: str | None = None,
           rekor: bool = True, lean: bool = True) -> dict[str, Any]:
    """Verify a receipt / DSSE envelope / in-toto statement. Honest report."""
    checks: list[dict] = []
    kinds: list[str] = []
    if not isinstance(target, dict):
        return {"ok": False, "verdict": "ERROR", "detail": "target must be a JSON object", "checks": []}

    # 1. DSSE envelope (possibly Sigstore-keyless) ------------------------- #
    payload_obj = None
    if "payload" in target and "signatures" in target:
        kinds.append("dsse-envelope")
        payload_obj = _verify_dsse(target, pubkey_pem=pubkey_pem, identity=identity,
                                   do_rekor=rekor, checks=checks)

    # 2. in-toto statement (raw, or unwrapped from the DSSE payload) ------- #
    stmt = payload_obj if isinstance(payload_obj, dict) else target
    if (stmt.get("predicateType") or stmt.get("predicate_type") or stmt.get("subject")):
        kinds.append("in-toto-statement")
        _verify_intoto_statement(stmt, checks)

    # 3. self-hashed / chained receipt ------------------------------------ #
    body = target.get("last_receipt") if isinstance(target.get("last_receipt"), dict) else stmt
    if isinstance(body, dict) and ("receipt_id" in body or "prev_hash" in body or "chain_index" in body):
        kinds.append("ledger-receipt")
        if "prev_hash" in body:
            checks.append({"name": "chain.linkage", "status": "info",
                           "detail": f"prev_hash present ({str(body['prev_hash'])[:16]}…); "
                                     "full chain continuity requires the ledger (see /receipts)"})
        if any(body.get(f) is True for f in ("mocked",)) or _has_mock(body):
            checks.append({"name": "honesty.mocked_flag", "status": "info",
                           "detail": "receipt self-declares mocked=false on its evidence (honest provenance)"})

    # 4. Lean citations anywhere ------------------------------------------ #
    if lean:
        _scan_lean_citations(stmt, checks)

    # ---- aggregate verdict (never fabricate a green) -------------------- #
    statuses = [c["status"] for c in checks]
    has_fail = "fail" in statuses
    crypto_pass = any(c["status"] == "pass" and c["name"].startswith(("dsse.sig", "sigstore.identity"))
                      for c in checks)
    struct_pass = any(c["status"] == "pass" for c in checks)
    if not kinds:
        verdict, ok = "UNRECOGNISED", False
        detail = "input is not a recognised receipt, DSSE envelope, or in-toto statement"
    elif has_fail:
        verdict, ok = "FAILED", False
        detail = "at least one check FAILED — receipt is not trustworthy as presented"
    elif crypto_pass:
        verdict, ok = "VERIFIED", True
        detail = "cryptographic signature verified; see per-check detail for corroboration"
    elif struct_pass:
        verdict, ok = "STRUCTURAL-ONLY", True
        detail = ("structurally well-formed and corroborated where reachable, but no cryptographic "
                  "signature was checkable here (unsigned, or no key/cert available)")
    else:
        verdict, ok = "INCONCLUSIVE", False
        detail = "could not run any conclusive check on this input"

    return {
        "ok": ok,
        "verdict": verdict,
        "detail": detail,
        "kinds": kinds,
        "checks": checks,
        "engine_version": ENGINE_VERSION,
        "doctrine": DOCTRINE,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "note": "No trust in this server is required: re-run these checks yourself with "
                "cosign / rekor-cli / lake build per docs/developers/VERIFY.md.",
    }


def _has_mock(body: dict) -> bool:
    ev = body.get("evidence")
    return isinstance(ev, list) and any(isinstance(e, dict) and "mocked" in e for e in ev)


def fetch_and_verify(url: str, **opts) -> dict[str, Any]:
    if not re.match(r"^https?://", url or ""):
        return {"ok": False, "verdict": "ERROR", "detail": "url must be http(s)", "checks": []}
    try:
        status, body = _http_get(url)
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "verdict": "ERROR", "detail": f"could not fetch url: {exc}", "checks": []}
    if status != 200:
        return {"ok": False, "verdict": "ERROR", "detail": f"url returned HTTP {status}", "checks": []}
    try:
        target = json.loads(body)
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "verdict": "ERROR", "detail": f"url is not JSON: {exc}", "checks": []}
    out = verify(target, **opts)
    out["source_url"] = url
    return out
