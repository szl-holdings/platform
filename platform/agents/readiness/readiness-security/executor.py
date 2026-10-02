#!/usr/bin/env python3
"""Read-only, fail-closed security evidence for public szl-holdings repos.

GREEN requires an observed inventory, a default-branch head, required workflow
files and successful runs at that exact head, a readable SECURITY.md with a
contact, and cryptographically verified release signatures. This executor does
not download release assets or run cosign, so signature presence is UNVERIFIED
and cannot satisfy that final gate. The Khipu receipt is a separate signature.
"""
from __future__ import annotations

import base64
import binascii
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-security"
REQUIRED_WORKFLOWS = {"sbom": ["sbom"], "trivy": ["trivy"], "gitleaks": ["gitleaks", "secret"]}
SHA40 = re.compile(r"^[0-9a-fA-F]{40}$")
CONTACT_EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PRIVATE_ADVISORY = re.compile(r"https://github\.com/[^\s/]+/[^\s/]+/security/advisories/new\b")
INVENTORY_LIMIT = 1000
RUN_MAX_AGE = timedelta(days=30)
RUN_FUTURE_TOLERANCE = timedelta(minutes=5)
RUN_TIMESTAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$")
_RATE_LIMITED = False


def _is_rate_limit(message: str) -> bool:
    lowered = (message or "").lower()
    return "http 429" in lowered or ("rate limit" in lowered and "http 403" in lowered)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _run_created_at(value: object, now: datetime) -> datetime | None:
    if not isinstance(value, str) or not RUN_TIMESTAMP.fullmatch(value):
        return None
    try:
        created = datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except (ValueError, OverflowError):
        return None
    return created if created <= now + RUN_FUTURE_TOLERANCE else None


def gh(*args: str) -> tuple[int, str]:
    global _RATE_LIMITED
    if _RATE_LIMITED:
        return 1, "RATE_LIMITED"
    env = dict(os.environ, GH_HOST="github.com")
    try:
        p = subprocess.run(
            ["gh", "api", *args], capture_output=True, text=True, env=env, timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired):
        return 1, "GitHub read unavailable"
    if p.returncode != 0 and _is_rate_limit(p.stderr):
        _RATE_LIMITED = True
        return 1, "RATE_LIMITED"
    return p.returncode, (p.stdout if p.returncode == 0 else p.stderr)


def list_repos() -> dict:
    global _RATE_LIMITED
    env = dict(os.environ, GH_HOST="github.com")
    try:
        p = subprocess.run(
            ["gh", "repo", "list", "szl-holdings", "--visibility", "public",
             "--limit", str(INVENTORY_LIMIT), "--json", "nameWithOwner"],
            capture_output=True, text=True, env=env, timeout=60,
        )
    except (OSError, subprocess.TimeoutExpired):
        return {"status": "READ_FAILED", "repos": []}
    if p.returncode != 0:
        if _is_rate_limit(p.stderr):
            _RATE_LIMITED = True
            return {"status": "RATE_LIMITED", "repos": []}
        return {"status": "READ_FAILED", "repos": []}
    try:
        rows = json.loads(p.stdout)
        if not isinstance(rows, list) or not rows:
            return {"status": "EMPTY_OR_INVALID", "repos": []}
        if len(rows) >= INVENTORY_LIMIT:
            return {"status": "LIMIT_REACHED", "repos": []}
        names = [row["nameWithOwner"] for row in rows]
        if any(not isinstance(name, str) or not name.lower().startswith("szl-holdings/")
               or name.count("/") != 1 for name in names):
            return {"status": "EMPTY_OR_INVALID", "repos": []}
        if len(set(names)) != len(names):
            return {"status": "EMPTY_OR_INVALID", "repos": []}
        return {"status": "OBSERVED", "repos": sorted(names)}
    except (KeyError, TypeError, ValueError):
        return {"status": "EMPTY_OR_INVALID", "repos": []}


def repo_head(repo: str) -> dict:
    rc, out = gh(f"repos/{repo}")
    if rc != 0:
        return {"status": "RATE_LIMITED" if out == "RATE_LIMITED" else "READ_FAILED"}
    try:
        branch = json.loads(out)["default_branch"]
        if not isinstance(branch, str) or not branch:
            raise ValueError("missing default branch")
    except (KeyError, TypeError, ValueError):
        return {"status": "INVALID_RESPONSE"}
    rc, out = gh(f"repos/{repo}/branches/{quote(branch, safe='')}")
    if rc != 0:
        return {"status": "RATE_LIMITED" if out == "RATE_LIMITED" else "READ_FAILED",
                "default_branch": branch}
    try:
        sha = json.loads(out)["commit"]["sha"]
        if not isinstance(sha, str) or not SHA40.fullmatch(sha):
            raise ValueError("invalid branch head")
    except (KeyError, TypeError, ValueError):
        return {"status": "INVALID_RESPONSE", "default_branch": branch}
    return {"status": "OBSERVED", "default_branch": branch, "head_sha": sha.lower()}


def _unavailable_workflows(status: str) -> dict:
    return {
        "listing_status": status, "runs_status": "NOT_READ",
        "present": {ctrl: None for ctrl in REQUIRED_WORKFLOWS},
        "recent_success": {ctrl: None for ctrl in REQUIRED_WORKFLOWS},
        "controls": {ctrl: {"status": status} for ctrl in REQUIRED_WORKFLOWS},
    }


def workflow_status(repo: str, branch: str, head_sha: str) -> dict:
    rc, out = gh(f"repos/{repo}/contents/.github/workflows?ref={head_sha}")
    if rc != 0:
        return _unavailable_workflows("RATE_LIMITED" if out == "RATE_LIMITED" else "READ_FAILED")
    try:
        entries = json.loads(out)
        if not isinstance(entries, list):
            raise ValueError("workflow directory is not a list")
        names = [entry["name"].lower() for entry in entries
                 if isinstance(entry, dict) and entry.get("type") == "file"
                 and isinstance(entry.get("name"), str)
                 and entry["name"].lower().endswith((".yml", ".yaml"))]
    except (TypeError, ValueError, KeyError):
        return _unavailable_workflows("INVALID_RESPONSE")

    files = {ctrl: [name for name in names if any(n in name for n in needles)]
             for ctrl, needles in REQUIRED_WORKFLOWS.items()}
    present = {ctrl: bool(matches) for ctrl, matches in files.items()}
    rc, out = gh(f"repos/{repo}/actions/runs?branch={quote(branch, safe='')}&per_page=100")
    if rc != 0:
        read_status = "RATE_LIMITED" if out == "RATE_LIMITED" else "READ_FAILED"
        return {
            "listing_status": "OBSERVED", "runs_status": read_status, "present": present,
            "recent_success": {ctrl: None for ctrl in REQUIRED_WORKFLOWS},
            "controls": {ctrl: {"status": read_status if present[ctrl] else "MISSING_WORKFLOW",
                                "workflow_files": files[ctrl]} for ctrl in REQUIRED_WORKFLOWS},
        }
    try:
        runs = json.loads(out)["workflow_runs"]
        if not isinstance(runs, list) or any(not isinstance(run, dict) for run in runs):
            raise ValueError("invalid workflow runs")
    except (KeyError, TypeError, ValueError):
        unavailable = _unavailable_workflows("INVALID_RESPONSE")
        unavailable.update({"listing_status": "OBSERVED", "runs_status": "INVALID_RESPONSE",
                            "present": present})
        unavailable["controls"] = {
            ctrl: {"status": "INVALID_RESPONSE" if present[ctrl] else "MISSING_WORKFLOW",
                   "workflow_files": files[ctrl]} for ctrl in REQUIRED_WORKFLOWS
        }
        return unavailable

    controls = {}
    recent_ok = {}
    for ctrl, workflow_files in files.items():
        if not workflow_files:
            controls[ctrl] = {"status": "MISSING_WORKFLOW", "workflow_files": []}
            recent_ok[ctrl] = None
            continue
        candidates = [run for run in runs
                      if isinstance(run.get("path"), str)
                      and run["path"].split("@", 1)[0].split("/")[-1].lower() in workflow_files
                      and run.get("head_branch") == branch]
        bound = [run for run in candidates
                 if isinstance(run.get("head_sha"), str)
                 and run["head_sha"].lower() == head_sha
                 and type(run.get("id")) is int and run["id"] > 0]
        if not bound:
            controls[ctrl] = {
                "status": "WRONG_HEAD_RUN" if candidates else "NO_CURRENT_HEAD_RUN",
                "workflow_files": workflow_files,
            }
            recent_ok[ctrl] = None
            continue
        now = _utcnow()
        timed = [(run, _run_created_at(run.get("created_at"), now)) for run in bound]
        if any(created is None for _, created in timed):
            controls[ctrl] = {"status": "INVALID_RUN_TIMESTAMP", "workflow_files": workflow_files}
            recent_ok[ctrl] = None
            continue
        latest, created = max(timed, key=lambda pair: (pair[1], pair[0]["id"]))
        assert created is not None
        completed = latest.get("status") == "completed"
        passed = completed and latest.get("conclusion") == "success"
        status = ("RUN_IN_PROGRESS" if not completed else
                  "RUN_NOT_SUCCESS" if not passed else
                  "STALE_RUN" if now - created > RUN_MAX_AGE else "SUCCESS")
        controls[ctrl] = {
            "status": status,
            "workflow_files": workflow_files,
            "run_id": latest.get("id"),
            "run_head_sha": latest.get("head_sha"),
            "run_conclusion": latest.get("conclusion"),
            "run_created_at": latest.get("created_at"),
        }
        recent_ok[ctrl] = True if status == "SUCCESS" else False if status == "RUN_NOT_SUCCESS" else None
    return {"listing_status": "OBSERVED", "runs_status": "OBSERVED", "present": present,
            "recent_success": recent_ok, "controls": controls}


def security_md(repo: str, head_sha: str) -> dict:
    rc, out = gh(f"repos/{repo}/contents/SECURITY.md?ref={head_sha}")
    if rc != 0:
        status = "RATE_LIMITED" if out == "RATE_LIMITED" else "MISSING" if "HTTP 404" in out else "READ_FAILED"
        return {"status": status, "present": False if status == "MISSING" else None,
                "has_contact": None}
    try:
        file = json.loads(out)
        if not isinstance(file, dict) or file.get("type") != "file" or file.get("encoding") != "base64":
            raise ValueError("invalid SECURITY.md file response")
        if not isinstance(file.get("content"), str) or not file["content"]:
            raise ValueError("missing SECURITY.md content")
        content = base64.b64decode("".join(file["content"].split()), validate=True).decode("utf-8")
    except (KeyError, TypeError, ValueError, UnicodeError, binascii.Error):
        return {"status": "INVALID_RESPONSE", "present": None, "has_contact": None}
    stale = any(re.search(rf"\b{re.escape(marker)}\b", content, re.IGNORECASE)
                for marker in khipu.STALE_DOCTRINE_MARKERS)
    has_contact = bool(CONTACT_EMAIL.search(content) or PRIVATE_ADVISORY.search(content))
    return {"status": "OBSERVED", "present": True, "has_contact": has_contact,
            "mentions_stale_doctrine": stale}


def cosign_latest(repo: str) -> dict:
    rc, out = gh(f"repos/{repo}/releases/latest")
    if rc != 0:
        status = "RATE_LIMITED" if out == "RATE_LIMITED" else "NO_RELEASE" if "HTTP 404" in out else "READ_FAILED"
        return {"status": status, "release": False if status == "NO_RELEASE" else None,
                "verified": None}
    try:
        rel = json.loads(out)
        if not isinstance(rel, dict) or not isinstance(rel.get("tag_name"), str):
            raise ValueError("invalid release")
        if not isinstance(rel.get("assets"), list):
            raise ValueError("invalid release assets")
        assets = [a["name"] for a in rel["assets"] if isinstance(a, dict)
                  and isinstance(a.get("name"), str)]
    except (KeyError, TypeError, ValueError):
        return {"status": "INVALID_RESPONSE", "release": None, "verified": None}
    has_sig = any(a.endswith(".sig") for a in assets)
    has_crt = any(a.endswith(".crt") or a.endswith(".pem") for a in assets)
    status = "MISSING_SIGNATURE" if not has_sig else "MISSING_CERTIFICATE" if not has_crt else "UNVERIFIED"
    return {"status": status, "release": True, "tag": rel["tag_name"],
            "has_cosign_sig": has_sig, "has_cert": has_crt, "verified": None}


def repo_verdict(head: dict, wf: dict, sec: dict, cs: dict) -> tuple[str, list[str]]:
    missing = []
    red = False
    if head.get("status") != "OBSERVED":
        missing.append(f"head:{head.get('status', 'UNAVAILABLE')}")
    for ctrl in REQUIRED_WORKFLOWS:
        status = wf.get("controls", {}).get(ctrl, {}).get("status", "UNAVAILABLE")
        if status != "SUCCESS":
            missing.append(f"workflow:{ctrl}:{status}")
            red = red or status in ("MISSING_WORKFLOW", "RUN_NOT_SUCCESS")
    if sec.get("status") != "OBSERVED":
        missing.append(f"SECURITY.md:{sec.get('status', 'UNAVAILABLE')}")
        red = red or sec.get("status") == "MISSING"
    else:
        if not sec.get("has_contact"):
            missing.append("SECURITY.md:NO_CONTACT")
            red = True
        if sec.get("mentions_stale_doctrine"):
            missing.append("SECURITY.md:STALE_DOCTRINE")
            red = True
    if cs.get("status") != "VERIFIED" or cs.get("verified") is not True:
        missing.append(f"cosign:{cs.get('status', 'UNVERIFIED')}")
        red = red or cs.get("status") in ("MISSING_SIGNATURE", "MISSING_CERTIFICATE")
    return ("RED" if red else "AMBER" if missing else "GREEN"), missing


def main() -> int:
    global _RATE_LIMITED
    _RATE_LIMITED = False
    inventory = list_repos()
    report = []
    for repo in inventory["repos"]:
        if _RATE_LIMITED:
            head = {"status": "NOT_ATTEMPTED_RATE_LIMIT"}
            wf = _unavailable_workflows("NOT_ATTEMPTED_RATE_LIMIT")
            sec = {"status": "NOT_ATTEMPTED_RATE_LIMIT", "present": None,
                   "has_contact": None}
            cs = {"status": "NOT_ATTEMPTED_RATE_LIMIT", "release": None,
                  "verified": None}
        else:
            head = repo_head(repo)
            if head["status"] == "OBSERVED":
                wf = workflow_status(repo, head["default_branch"], head["head_sha"])
                sec = security_md(repo, head["head_sha"])
            else:
                wf = _unavailable_workflows("NOT_CHECKED_NO_HEAD")
                sec = {"status": "NOT_CHECKED_NO_HEAD", "present": None,
                       "has_contact": None}
            cs = cosign_latest(repo)
        v, missing = repo_verdict(head, wf, sec, cs)
        report.append({"repo": repo, "verdict": v,
                       "evidence_state": "HOLD" if v == "AMBER" else v,
                       "missing_controls": missing,
                       "head": head, "workflows": wf, "security_md": sec, "cosign": cs})
    if any(row["verdict"] == "RED" for row in report):
        meta_verdict = "RED"
    elif inventory["status"] != "OBSERVED" or not report or any(
        row["verdict"] == "AMBER" for row in report
    ):
        meta_verdict = "AMBER"
    else:
        meta_verdict = "GREEN"
    payload = {"inventory": {"status": inventory["status"]}, "repo_count": len(report),
               "repos": report, "meta_verdict": meta_verdict,
               "overall_verdict": "HOLD" if meta_verdict == "AMBER" else meta_verdict}
    emitted = khipu.emit(AGENT, payload)
    if os.environ.get("GITHUB_ACTIONS") == "true" and not emitted["receipt"].get("signed"):
        print("READINESS-SECURITY receipt is unsigned", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
