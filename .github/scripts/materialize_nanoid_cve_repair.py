#!/usr/bin/env python3
"""Create one signed, exact-tree nanoid CVE repair from protected main.

This controller is temporary and must never be merged. It updates the reviewed
pnpm override, regenerates the lockfile with the repository-pinned pnpm, verifies
that nanoid 3.3.17 is absent, performs a frozen install and high-severity audit,
and publishes only pnpm-workspace.yaml plus pnpm-lock.yaml to a clean target
branch through GitHub createCommitOnBranch.
"""
from __future__ import annotations

import base64
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.request
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
REPOSITORY = os.environ["REPOSITORY"]
TARGET_BRANCH = os.environ["TARGET_BRANCH"]
EXPECTED_PARENT = os.environ["EXPECTED_PARENT"]
TOKEN = os.environ["GITHUB_TOKEN"]
WORKSPACE = ROOT / "pnpm-workspace.yaml"
LOCKFILE = ROOT / "pnpm-lock.yaml"
OLD_OVERRIDE = "  nanoid@<4: 3.3.17\n"
NEW_OVERRIDE = "  nanoid@<4: 3.3.18\n"


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def request(url: str, *, data: dict[str, Any] | None = None) -> Any:
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8") if data is not None else None,
        method="POST" if data is not None else "GET",
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "szl-nanoid-cve-materializer/2",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")[:4000]
        raise SystemExit(f"GitHub HTTP {exc.code}: {body}") from exc


def main() -> int:
    workspace_before = WORKSPACE.read_text(encoding="utf-8")
    if workspace_before.count(OLD_OVERRIDE) != 1:
        raise SystemExit("expected exactly one nanoid@<4 override at 3.3.17")
    WORKSPACE.write_text(
        workspace_before.replace(OLD_OVERRIDE, NEW_OVERRIDE, 1),
        encoding="utf-8",
    )

    run("pnpm", "install", "--lockfile-only", "--ignore-scripts")

    workspace_after = WORKSPACE.read_text(encoding="utf-8")
    lockfile_after = LOCKFILE.read_text(encoding="utf-8")
    if "nanoid@<4: 3.3.17" in workspace_after:
        raise SystemExit("vulnerable nanoid override remains")
    if "nanoid@3.3.17" in lockfile_after:
        raise SystemExit("vulnerable nanoid package remains in lockfile")
    if "nanoid@3.3.18" not in lockfile_after:
        raise SystemExit("repaired nanoid 3.3.18 package is absent")
    integrity_match = re.search(
        r"(?m)^  nanoid@3\.3\.18:\n    resolution: \{integrity: (sha512-[^}]+)\}$",
        lockfile_after,
    )
    if integrity_match is None:
        raise SystemExit("nanoid 3.3.18 lacks a canonical sha512 lockfile integrity")
    lockfile_integrity = integrity_match.group(1)

    changed = subprocess.check_output(
        ["git", "diff", "--name-only"], cwd=ROOT, text=True
    ).splitlines()
    expected_changed = {"pnpm-lock.yaml", "pnpm-workspace.yaml"}
    if set(changed) != expected_changed:
        raise SystemExit(f"unexpected generated paths: {changed}")

    run("pnpm", "install", "--frozen-lockfile", "--ignore-scripts")
    run("pnpm", "audit", "--audit-level", "high")
    run("git", "diff", "--check")

    additions = []
    for path in sorted(expected_changed):
        additions.append(
            {
                "path": path,
                "contents": base64.b64encode((ROOT / path).read_bytes()).decode("ascii"),
            }
        )

    mutation = """
    mutation($input: CreateCommitOnBranchInput!) {
      createCommitOnBranch(input: $input) { commit { oid url } }
    }
    """
    variables = {
        "input": {
            "branch": {
                "repositoryNameWithOwner": REPOSITORY,
                "branchName": TARGET_BRANCH,
            },
            "message": {
                "headline": "fix(security): patch nanoid CVE-2026-67213",
                "body": "Signed-off-by: Stephen Lutar <stephenlutar2@gmail.com>",
            },
            "expectedHeadOid": EXPECTED_PARENT,
            "fileChanges": {"additions": additions},
        }
    }
    payload = request(
        "https://api.github.com/graphql",
        data={"query": mutation, "variables": variables},
    )
    if payload.get("errors"):
        raise SystemExit(json.dumps(payload["errors"], indent=2))
    commit = payload["data"]["createCommitOnBranch"]["commit"]
    sha = commit["oid"]
    verification = request(
        f"https://api.github.com/repos/{REPOSITORY}/commits/{sha}"
    )["commit"]["verification"]
    if verification.get("verified") is not True or verification.get("reason") != "valid":
        raise SystemExit(f"target commit is not GitHub-verified: {verification}")

    receipt = {
        "schema": "szl.nanoid-cve-materialization/v1",
        "cve": "CVE-2026-67213",
        "before": "3.3.17",
        "after": "3.3.18",
        "lockfile_integrity": lockfile_integrity,
        "expected_parent": EXPECTED_PARENT,
        "target_branch": TARGET_BRANCH,
        "commit": commit,
        "verification": {
            "verified": verification.get("verified"),
            "reason": verification.get("reason"),
        },
        "changed_paths": sorted(expected_changed),
        "frozen_install_passed": True,
        "high_severity_audit_passed": True,
        "diagnostic_controller_included": False,
        "secret_value_recorded": False,
    }
    (ROOT / "nanoid-cve-materialization.json").write_text(
        json.dumps(receipt, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(receipt, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
