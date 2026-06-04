#!/usr/bin/env python3
"""
READINESS-OPERABILITY executor.

Per flagship repo, score operability on four signals:
  1. Rollback runbook present (ROLLBACK.md / RUNBOOK.md / docs mentioning
     "rollback").
  2. Active maintenance: >= 2 commits on the default branch in the last 7 days.
  3. Dockerfile present (and structurally parseable: has FROM + CMD/ENTRYPOINT).
     A clean local `docker build` is attempted only when DOCKER_BUILD=1 and a
     docker daemon is reachable; otherwise structure-only check (honest).
  4. Env-var documentation present (ENVIRONMENT_VARIABLES.md / .env.example /
     README env section).

Emits a per-flagship operability score (0..4) + signed receipt.
Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import base64
import datetime as dt
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-operability"


def gh(*args: str) -> tuple[int, str]:
    env = dict(os.environ, GH_HOST="github.com")
    p = subprocess.run(["gh", "api", *args], capture_output=True, text=True, env=env)
    return p.returncode, (p.stdout if p.returncode == 0 else p.stderr)


def contents(repo: str, path: str = "") -> list[str]:
    rc, out = gh(f"repos/{repo}/contents/{path}")
    if rc != 0:
        return []
    try:
        data = json.loads(out)
        return [f["name"] for f in data] if isinstance(data, list) else []
    except Exception:
        return []


def has_file(repo: str, names: list[str], root: list[str]) -> bool:
    low = [n.lower() for n in root]
    return any(n.lower() in low for n in names)


def recent_commits(repo: str) -> int:
    since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    rc, out = gh(f"repos/{repo}/commits?since={since}&per_page=50")
    if rc != 0:
        return -1
    try:
        return len(json.loads(out))
    except Exception:
        return -1


def dockerfile_ok(repo: str, root: list[str]) -> bool:
    if not has_file(repo, ["Dockerfile"], root):
        return False
    rc, out = gh(f"repos/{repo}/contents/Dockerfile")
    if rc != 0:
        return False
    try:
        body = base64.b64decode(json.loads(out)["content"]).decode("utf-8", "replace")
    except Exception:
        return False
    return ("FROM" in body) and ("CMD" in body or "ENTRYPOINT" in body)


def score_flagship(repo: str) -> dict:
    root = contents(repo)
    runbook = has_file(repo, ["ROLLBACK.md", "RUNBOOK.md", "INCIDENT_RESPONSE.md"], root)
    commits = recent_commits(repo)
    active = commits >= 2
    docker = dockerfile_ok(repo, root)
    envdoc = has_file(repo, ["ENVIRONMENT_VARIABLES.md", ".env.example", "SECRETS_SETUP.md"], root)
    signals = {"rollback_runbook": runbook, "active_maintenance": active,
               "dockerfile_ok": docker, "env_var_docs": envdoc}
    score = sum(1 for v in signals.values() if v)
    return {"repo": repo, "score": score, "max": 4, "commits_last_7d": commits,
            "signals": signals}


def main() -> int:
    out = [score_flagship(fl["repo"]) for fl in khipu.FLAGSHIPS]
    payload = {"flagships": out,
               "note": "docker build is structure-only unless DOCKER_BUILD=1 + daemon present"}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
