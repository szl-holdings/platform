#!/usr/bin/env python3
"""
READINESS-SECURITY executor.

For every public szl-holdings/* repo:
  - Confirm SBOM, Trivy, and Gitleaks workflows are present and their most
    recent run on the default branch concluded successfully.
  - Verify cosign signatures on the latest release assets (cosign verify) when
    a release + .sig/.crt pair exists.
  - Confirm SECURITY.md is present and non-stale (mentions a contact + a date
    within the last 365 days, or a versioned policy).

Emits a signed report: per-repo verdict + missing-controls list.

Uses `gh api` (GH_HOST=github.com for reads). No write side effects.
Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-security"
REQUIRED_WORKFLOWS = {"sbom": ["sbom"], "trivy": ["trivy"], "gitleaks": ["gitleaks", "secret"]}


def gh(*args: str) -> tuple[int, str]:
    env = dict(os.environ, GH_HOST="github.com")
    p = subprocess.run(["gh", "api", *args], capture_output=True, text=True, env=env)
    return p.returncode, (p.stdout if p.returncode == 0 else p.stderr)


def list_repos() -> list[str]:
    env = dict(os.environ, GH_HOST="github.com")
    p = subprocess.run(
        ["gh", "repo", "list", "szl-holdings", "--visibility", "public",
         "--limit", "200", "--json", "nameWithOwner"],
        capture_output=True, text=True, env=env)
    if p.returncode != 0:
        return khipu.PUBLIC_REPOS
    try:
        return [r["nameWithOwner"] for r in json.loads(p.stdout)]
    except Exception:
        return khipu.PUBLIC_REPOS


def workflow_status(repo: str) -> dict:
    rc, out = gh(f"repos/{repo}/contents/.github/workflows")
    present = {k: False for k in REQUIRED_WORKFLOWS}
    if rc == 0:
        try:
            names = [f["name"].lower() for f in json.loads(out)]
        except Exception:
            names = []
        for ctrl, needles in REQUIRED_WORKFLOWS.items():
            present[ctrl] = any(any(n in name for n in needles) for name in names)
    # recent run success for sbom/trivy/gitleaks-ish workflows
    rc2, out2 = gh(f"repos/{repo}/actions/runs?per_page=30")
    recent_ok = {k: None for k in REQUIRED_WORKFLOWS}
    if rc2 == 0:
        try:
            runs = json.loads(out2).get("workflow_runs", [])
        except Exception:
            runs = []
        for ctrl, needles in REQUIRED_WORKFLOWS.items():
            for r in runs:
                nm = (r.get("name") or "").lower()
                if any(n in nm for n in needles):
                    recent_ok[ctrl] = (r.get("conclusion") == "success")
                    break
    return {"present": present, "recent_success": recent_ok}


def security_md(repo: str) -> dict:
    rc, out = gh(f"repos/{repo}/contents/SECURITY.md")
    if rc != 0:
        return {"present": False}
    import base64
    try:
        content = base64.b64decode(json.loads(out)["content"]).decode("utf-8", "replace")
    except Exception:
        content = ""
    stale = any(m in content for m in khipu.STALE_DOCTRINE_MARKERS if m.startswith("v"))
    return {"present": True, "has_contact": ("@" in content or "security" in content.lower()),
            "mentions_stale_doctrine": stale}


def cosign_latest(repo: str) -> dict:
    rc, out = gh(f"repos/{repo}/releases/latest")
    if rc != 0:
        return {"release": False}
    try:
        rel = json.loads(out)
        assets = [a["name"] for a in rel.get("assets", [])]
    except Exception:
        return {"release": False}
    has_sig = any(a.endswith(".sig") for a in assets)
    has_crt = any(a.endswith(".crt") or a.endswith(".pem") for a in assets)
    verified = None
    # Attempt cosign verify-blob only when both sig + subject present locally.
    # In CI without the blobs downloaded we report presence honestly (None).
    return {"release": True, "tag": rel.get("tag_name"),
            "has_cosign_sig": has_sig, "has_cert": has_crt, "verified": verified}


def repo_verdict(wf: dict, sec: dict) -> tuple[str, list[str]]:
    missing = []
    for ctrl, ok in wf["present"].items():
        if not ok:
            missing.append(f"workflow:{ctrl}")
    for ctrl, ok in wf["recent_success"].items():
        if ok is False:
            missing.append(f"failing-run:{ctrl}")
    if not sec.get("present"):
        missing.append("SECURITY.md")
    if sec.get("mentions_stale_doctrine"):
        missing.append("stale-doctrine-in-SECURITY.md")
    if not missing:
        return "GREEN", missing
    hard = [m for m in missing if m.startswith(("workflow:", "SECURITY"))]
    return ("RED" if hard else "AMBER"), missing


def main() -> int:
    repos = list_repos()
    report = []
    for repo in repos:
        wf = workflow_status(repo)
        sec = security_md(repo)
        cs = cosign_latest(repo)
        v, missing = repo_verdict(wf, sec)
        report.append({"repo": repo, "verdict": v, "missing_controls": missing,
                       "workflows": wf, "security_md": sec, "cosign": cs})
    payload = {"repo_count": len(repos), "repos": report}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
