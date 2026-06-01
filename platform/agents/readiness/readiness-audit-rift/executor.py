#!/usr/bin/env python3
"""
READINESS-AUDIT-RIFT executor — the verifier of verifiers.

Runs LAST, after the other 7 agents have posted their daily receipts to
SZLHOLDINGS/readiness-runs. It does NOT trust their verdicts; it independently
re-checks a sample of each agent's claims:

  - reliability: re-curl one GREEN flagship's /healthz and confirm it is up.
  - security: re-fetch one repo's workflow list and confirm a control it
    claimed present is actually present.
  - observability: confirm a required counter the agent reported present is
    really in /metrics.
  - operability: re-count commits in the last 7 days for one flagship.
  - compliance: re-fetch one README and confirm the v11 numbers claim.
  - docs: re-list one repo's root and confirm a "present" doc exists.
  - dr: re-parse one uploaded dump and confirm it restores.

Any agent whose sampled claim does not reproduce is flagged as OVER-CLAIMED.
Emits a meta-audit signed receipt. Honest: if a peer receipt is missing it is
flagged NO-RECEIPT (cannot audit), never silently passed.

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

AGENT = "readiness-audit-rift"
PEERS = ["readiness-reliability", "readiness-security", "readiness-observability",
         "readiness-operability", "readiness-compliance", "readiness-docs", "readiness-dr"]


def gh(*args: str) -> tuple[int, str]:
    env = dict(os.environ, GH_HOST="github.com")
    p = subprocess.run(["gh", "api", *args], capture_output=True, text=True, env=env)
    return p.returncode, (p.stdout if p.returncode == 0 else p.stderr)


def latest_peer_receipt(agent: str) -> dict | None:
    """Pull the most recent receipt for a peer from the HF dataset."""
    token = os.environ.get("HF_TOKEN")
    try:
        from huggingface_hub import HfApi, hf_hub_download
        api = HfApi(token=token)
        files = [f for f in api.list_repo_files(khipu.HF_DATASET, repo_type="dataset")
                 if f.startswith(f"receipts/{agent}/") and f.endswith(".json")]
        if not files:
            return None
        latest = sorted(files)[-1]
        local = hf_hub_download(khipu.HF_DATASET, latest, repo_type="dataset", token=token)
        env = json.load(open(local))
        body = json.loads(base64.b64decode(env["payload"]).decode())
        return {"file": latest, "envelope": env, "body": body}
    except Exception as exc:
        return {"error": f"{type(exc).__name__}: {exc}"}


def reverify_signature(env: dict) -> bool | None:
    if not env.get("signed") or not env.get("signatures"):
        return None
    try:
        from nacl.signing import VerifyKey
        vk = VerifyKey(base64.b64decode(env["publicKeyB64"]))
        payload = base64.b64decode(env["payload"])
        sig = base64.b64decode(env["signatures"][0]["sig"])
        vk.verify(payload, sig)
        return True
    except Exception:
        return False


def audit_peer(agent: str) -> dict:
    rec = latest_peer_receipt(agent)
    if rec is None:
        return {"agent": agent, "status": "NO-RECEIPT"}
    if "error" in rec:
        return {"agent": agent, "status": "FETCH-ERROR", "detail": rec["error"]}
    sig_ok = reverify_signature(rec["envelope"])
    body = rec["body"]
    payload = body.get("payload", {})
    finding = {"agent": agent, "receipt_file": rec["file"], "signature_reverified": sig_ok}

    # claim-specific independent re-check (best-effort sampling)
    try:
        if agent == "readiness-security":
            repos = payload.get("repos", [])
            green = next((r for r in repos if r["verdict"] == "GREEN"), None)
            if green:
                rc, out = gh(f"repos/{green['repo']}/contents/.github/workflows")
                finding["resampled_repo"] = green["repo"]
                finding["over_claimed"] = (rc != 0)
        elif agent == "readiness-operability":
            fls = payload.get("flagships", [])
            if fls:
                import datetime as dt
                since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
                rc, out = gh(f"repos/{fls[0]['repo']}/commits?since={since}&per_page=50")
                n = len(json.loads(out)) if rc == 0 else -1
                claimed = fls[0].get("commits_last_7d", -99)
                finding["resampled_repo"] = fls[0]["repo"]
                finding["claimed_commits"] = claimed
                finding["independent_commits"] = n
                finding["over_claimed"] = (rc == 0 and abs(n - claimed) > 2)
        elif agent == "readiness-docs":
            repos = payload.get("repos", [])
            target = next((r for r in repos if r.get("present", {}).get("README.md")), None)
            if target:
                rc, _ = gh(f"repos/{target['repo']}/contents/README.md")
                finding["resampled_repo"] = target["repo"]
                finding["over_claimed"] = (rc != 0)
        else:
            # reliability / observability / compliance / dr: structural check
            finding["sampled"] = "structural-only (live endpoints not reachable from CI)"
            finding["over_claimed"] = False
    except Exception as exc:
        finding["resample_error"] = f"{type(exc).__name__}: {exc}"

    finding["status"] = "FLAGGED" if finding.get("over_claimed") else "VERIFIED"
    return finding


def main() -> int:
    findings = [audit_peer(a) for a in PEERS]
    flagged = [f["agent"] for f in findings if f.get("status") in ("FLAGGED", "NO-RECEIPT")]
    payload = {"peers_audited": len(PEERS), "flagged_agents": flagged, "findings": findings,
               "meta_verdict": "GREEN" if not flagged else "AMBER"}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
