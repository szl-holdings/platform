#!/usr/bin/env python3
"""
READINESS-DOCS executor.

For every public szl-holdings/* repo, score documentation completeness on the
presence of the community-health + governance file set:
  README.md, LICENSE, SECURITY.md, CITATION.cff, CONTRIBUTING.md,
  CODE_OF_CONDUCT.md, STATUS.md
and flag any repo whose README/CITATION still carries stale Doctrine numbers
(626/189/168 or v7/v9/v10) instead of the locked v11 (749/14/163).

Emits a per-repo docs completeness score (0..7) + stale-doctrine flags.
Author: Yachay <yachay@szlholdings.dev>
"""
from __future__ import annotations

import base64
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-docs"
REQUIRED_DOCS = ["README.md", "LICENSE", "SECURITY.md", "CITATION.cff",
                 "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "STATUS.md"]
STALE = ["626/189/168", "626", "189", "168", "v7", "v9", "v10"]


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


def root_names(repo: str) -> list[str]:
    rc, out = gh(f"repos/{repo}/contents")
    if rc != 0:
        return []
    try:
        return [f["name"] for f in json.loads(out)]
    except Exception:
        return []


def fetch_text(repo: str, path: str) -> str:
    rc, out = gh(f"repos/{repo}/contents/{path}")
    if rc != 0:
        return ""
    try:
        return base64.b64decode(json.loads(out)["content"]).decode("utf-8", "replace")
    except Exception:
        return ""


def stale_markers_in(text: str) -> list[str]:
    found = []
    for m in STALE:
        if m in ("626", "189", "168"):
            if f"/{m}/" in text or f" {m} " in text:
                found.append(m)
        elif m in ("v7", "v9", "v10"):
            # crude word-boundary
            if (m + " " in text) or (m + ")" in text) or (m + "·") in text or (m + ".") in text:
                found.append(m)
        elif m in text:
            found.append(m)
    return sorted(set(found))


def score_repo(repo: str) -> dict:
    names = set(root_names(repo))
    present = {d: (d in names) for d in REQUIRED_DOCS}
    score = sum(1 for v in present.values() if v)
    readme = fetch_text(repo, "README.md") if "README.md" in names else ""
    citation = fetch_text(repo, "CITATION.cff") if "CITATION.cff" in names else ""
    stale = sorted(set(stale_markers_in(readme) + stale_markers_in(citation)))
    return {"repo": repo, "score": score, "max": len(REQUIRED_DOCS),
            "present": present, "stale_doctrine_markers": stale}


def main() -> int:
    repos = list_repos()
    rows = [score_repo(r) for r in repos]
    payload = {"repo_count": len(repos), "required_docs": REQUIRED_DOCS, "repos": rows}
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
