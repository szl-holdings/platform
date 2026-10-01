#!/usr/bin/env python3
"""
READINESS-COMPLIANCE executor.

Checks:
  1. Doctrine v11 numbers consistency across the mesh: scans each flagship's
     README/CITATION for the canonical 749/14/163 and flags any stale numbers
     (626/189/168, v7/v9/v10).
  2. Wire D envelope structure: requests an envelope from each flagship's
     /khipu/sign. Structure is observed; signature trust is not verified here.
  3. LEGAL_BOUNDARIES.md on killinchu is accessible.
  4. Privacy policy + DPA template present (customer-portal / docs-site).

Emits technical observations and an explicitly NOT_ASSESSED framework matrix.
Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys
import urllib.request

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-compliance"
COMPLIANCE_REPO = os.environ.get("COMPLIANCE_REPO", "szl-holdings/customer-portal")


def gh(*args: str) -> tuple[int, str]:
    env = dict(os.environ, GH_HOST="github.com")
    p = subprocess.run(["gh", "api", *args], capture_output=True, text=True, env=env)
    return p.returncode, (p.stdout if p.returncode == 0 else p.stderr)


def fetch_text(repo: str, path: str) -> str | None:
    rc, out = gh(f"repos/{repo}/contents/{path}")
    if rc != 0:
        return None
    try:
        return base64.b64decode(json.loads(out)["content"]).decode("utf-8", "replace")
    except Exception:
        return None


def doctrine_consistency() -> list[dict]:
    rows = []
    for fl in khipu.FLAGSHIPS:
        txt = fetch_text(fl["repo"], "README.md") or ""
        has_v11 = khipu.DOCTRINE_STRING in txt
        stale = sorted({m for m in khipu.STALE_DOCTRINE_MARKERS
                        if m in txt and not m.isdigit() or (m.isdigit() and f"/{m}/" in txt)})
        rows.append({"repo": fl["repo"], "has_v11_numbers": has_v11,
                     "stale_markers": stale})
    return rows


def nonempty_base64(value: object) -> bool:
    if not isinstance(value, str) or not value:
        return False
    try:
        return bool(base64.b64decode(value, validate=True))
    except (ValueError, TypeError):
        return False


def envelope_structure_present(env: object) -> bool:
    """Inspect fields only; decoding bytes does not authenticate a signer."""
    if not isinstance(env, dict):
        return False
    payload_type = env.get("payloadType")
    signatures = env.get("signatures")
    return (isinstance(payload_type, str) and bool(payload_type.strip())
            and nonempty_base64(env.get("payload"))
            and isinstance(signatures, list) and bool(signatures)
            and all(isinstance(sig, dict) and nonempty_base64(sig.get("sig"))
                    for sig in signatures))


def wire_d_dsse() -> list[dict]:
    rows = []
    for fl in khipu.FLAGSHIPS:
        base = khipu.flagship_url(fl)
        if not base:
            rows.append({"flagship": fl["name"], "verifiable": None,
                         "verification_state": "UNAVAILABLE", "reason": "url unset"})
            continue
        try:
            req = urllib.request.Request(f"{base.rstrip('/')}/khipu/sign", method="POST",
                                         data=b"{}", headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=8) as resp:
                env = json.loads(resp.read(65536).decode())
            structure = envelope_structure_present(env)
            rows.append({"flagship": fl["name"], "verifiable": None,
                         "verification_state": "NOT_MEASURED",
                         "envelope_structure_present": structure,
                         "has_payloadType": isinstance(env, dict)
                         and isinstance(env.get("payloadType"), str)
                         and bool(env["payloadType"].strip())})
        except Exception as exc:
            rows.append({"flagship": fl["name"], "verifiable": False,
                         "verification_state": "FETCH_ERROR",
                         "reason": f"{type(exc).__name__}: {exc}"})
    return rows


def legal_and_privacy() -> dict:
    legal = fetch_text("szl-holdings/killinchu", "LEGAL_BOUNDARIES.md")
    privacy = fetch_text(COMPLIANCE_REPO, "PRIVACY.md") or fetch_text("szl-holdings/docs-site", "docs/privacy.md")
    dpa = fetch_text(COMPLIANCE_REPO, "DPA.md") or fetch_text(COMPLIANCE_REPO, "docs/DPA-template.md")
    return {
        "legal_boundaries_killinchu": legal is not None,
        "privacy_policy_present": privacy is not None,
        "dpa_template_present": dpa is not None,
    }


def main() -> int:
    doctrine = doctrine_consistency()
    wired = wire_d_dsse()
    lp = legal_and_privacy()
    # Document presence and envelope shape cannot establish framework compliance,
    # durable automatic logging, signer trust, or an authenticated trace chain.
    matrix = {
        "NIST_AI_RMF": {
            "MAP": False,
            "MEASURE": False,
            "MANAGE": False,
            "GOVERN": False,
        },
        "EU_AI_Act_Article_12_record_keeping": {
            "automatic_logging_via_khipu": False,
            "traceability": False,
        },
    }
    observations = {
        "doctrine_numbers_consistent": bool(doctrine) and all(
            r.get("has_v11_numbers") is True and not r.get("stale_markers")
            for r in doctrine),
        "signed_envelope_structure_present": bool(wired) and all(
            r.get("envelope_structure_present") is True for r in wired),
        "signature_verification": "NOT_MEASURED",
        "automatic_logging": "NOT_MEASURED",
        "traceability": "NOT_MEASURED",
    }
    payload = {"doctrine_consistency": doctrine, "wire_d_dsse": wired,
               "legal_privacy": lp, "technical_observations": observations,
               "compliance_matrix": matrix, "compliance_assessment": {
                   "state": "NOT_ASSESSED",
                   "reason": "Technical observations only; framework assessment, "
                   "signature trust, durable logging and trace-chain evidence are absent.",
               }}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
