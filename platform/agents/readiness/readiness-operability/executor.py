#!/usr/bin/env python3
"""Observe four source signals at a pinned default-branch revision.

Unreadable or malformed evidence stays UNKNOWN, not confirmed absence.
Docker is structure-only: no build, execution or runtime qualification.
"""
from __future__ import annotations

import base64
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
from urllib.parse import quote

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "_lib"))
import khipu  # noqa: E402

AGENT = "readiness-operability"
SIGNALS = ("rollback_runbook", "active_maintenance", "dockerfile_ok", "env_var_docs")
RUNBOOK_NAMES = {"rollback.md", "runbook.md", "incident_response.md"}
ENV_NAMES = {"environment_variables.md", ".env.example", "secrets_setup.md"}


class EvidenceUnavailable(Exception):
    """A sanitized reason code; never include raw provider diagnostics."""


def gh(path: str) -> object:
    try:
        p = subprocess.run(
            ["gh", "api", path], capture_output=True, text=True,
            encoding="utf-8", env=dict(os.environ, GH_HOST="github.com"), timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise EvidenceUnavailable("request_unavailable") from None
    if p.returncode != 0:
        # A 404 can mean inaccessible, so never turn it into confirmed absence.
        raise EvidenceUnavailable("request_failed")
    try:
        return json.loads(p.stdout)
    except (ValueError, TypeError):
        raise EvidenceUnavailable("malformed_response") from None


def sha(value: object) -> bool:
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{40}", value) is not None


def root_files(repo: str, tree_sha: str) -> dict[str, dict]:
    data = gh(f"repos/{repo}/git/trees/{tree_sha}?recursive=1")
    if not isinstance(data, dict) or data.get("sha") != tree_sha:
        raise EvidenceUnavailable("malformed_tree")
    if data.get("truncated") is not False:
        raise EvidenceUnavailable("incomplete_tree")
    entries = data.get("tree")
    if not isinstance(entries, list):
        raise EvidenceUnavailable("malformed_tree")
    files, seen = {}, set()
    for entry in entries:
        if (not isinstance(entry, dict) or not isinstance(entry.get("path"), str)
                or not sha(entry.get("sha")) or entry.get("type") not in ("blob", "tree", "commit")):
            raise EvidenceUnavailable("malformed_tree")
        path = entry["path"]
        if path in seen or not path or path.startswith("/") or ".." in path.split("/"):
            raise EvidenceUnavailable("malformed_tree")
        seen.add(path)
        # Symlinks and submodules are not observed document/file contents.
        if "/" not in path and entry["type"] == "blob" and entry.get("mode") in ("100644", "100755"):
            files[path] = entry
        elif "/" not in path and (path.lower() in RUNBOOK_NAMES | ENV_NAMES or path == "Dockerfile"):
            raise EvidenceUnavailable("unsupported_file_type")
    return files


def dockerfile_structure(repo: str, revision: str, entry: dict) -> bool:
    data = gh(f"repos/{repo}/contents/Dockerfile?ref={revision}")
    if (not isinstance(data, dict) or data.get("sha") != entry["sha"]
            or data.get("encoding") != "base64" or not isinstance(data.get("content"), str)):
        raise EvidenceUnavailable("malformed_dockerfile")
    try:
        raw = base64.b64decode("".join(data["content"].split()), validate=True)
        body = raw.decode("utf-8")
    except (ValueError, UnicodeError):
        raise EvidenceUnavailable("malformed_dockerfile") from None
    if hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest() != entry["sha"]:
        raise EvidenceUnavailable("dockerfile_blob_mismatch")
    # Instruction presence only; comments and substrings cannot count.
    instructions = set(re.findall(r"^[ \t]*([A-Za-z]+)[ \t]+[^\s#]", body, re.MULTILINE))
    instructions = {value.upper() for value in instructions}
    return "FROM" in instructions and bool({"CMD", "ENTRYPOINT"} & instructions)


def maintenance(repo: str, revision: str, observed: dt.datetime) -> tuple[bool, int, int | None]:
    since = (observed - dt.timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    until = observed.strftime("%Y-%m-%dT%H:%M:%SZ")
    seen = set()
    for page in range(1, 11):
        data = gh(f"repos/{repo}/commits?sha={revision}&since={since}&until={until}&per_page=100&page={page}")
        if (not isinstance(data, list) or len(data) > 100
                or any(not isinstance(item, dict) or not sha(item.get("sha")) for item in data)):
            raise EvidenceUnavailable("malformed_commits")
        ids = [item["sha"] for item in data]
        if len(set(ids)) != len(ids) or seen.intersection(ids):
            raise EvidenceUnavailable("duplicate_commits")
        seen.update(ids)
        if len(data) < 100:
            count = len(seen)
            return count >= 2, count, count
    # A full final page is not proof of exhaustion; never publish a capped count as exact.
    raise EvidenceUnavailable("incomplete_commit_history")


def score_flagship(repo: str) -> dict:
    observed = dt.datetime.now(dt.timezone.utc)
    row = {
        "repo": repo, "observed_at_utc": observed.isoformat(),
        "default_branch": None, "revision": None, "tree_sha": None,
        "score": None, "max": 4, "observed_score": 0, "observation_state": "INCOMPLETE",
        "signals": {name: None for name in SIGNALS}, "signal_details": {},
        "commits_last_7d": None, "commits_last_7d_lower_bound": None,
        "docker_check": "STRUCTURE_ONLY", "docker_build": "NOT_MEASURED",
        "readiness_qualification": "NOT_ASSESSED",
    }
    def record(name: str, value: bool | None, reason: str, paths: list[str] | None = None) -> None:
        row["signals"][name] = value
        row["signal_details"][name] = {
            "state": "UNKNOWN" if value is None else "PRESENT" if value else "NOT_SATISFIED",
            "reason": reason, "paths": paths or [],
        }
    try:
        metadata = gh(f"repos/{repo}")
        branch = metadata.get("default_branch") if isinstance(metadata, dict) else None
        if not isinstance(branch, str) or not branch:
            raise EvidenceUnavailable("default_branch_unavailable")
        row["default_branch"] = branch
        commit = gh(f"repos/{repo}/commits/{quote(branch, safe='')}")
        if not isinstance(commit, dict) or not sha(commit.get("sha")):
            raise EvidenceUnavailable("revision_unavailable")
        detail = commit.get("commit")
        tree_detail = detail.get("tree") if isinstance(detail, dict) else None
        tree = tree_detail.get("sha") if isinstance(tree_detail, dict) else None
        if not sha(tree):
            raise EvidenceUnavailable("tree_revision_unavailable")
        revision = row["revision"] = commit["sha"]
        row["tree_sha"] = tree
    except EvidenceUnavailable as exc:
        for name in SIGNALS:
            record(name, None, str(exc))
        return row

    try:
        files = root_files(repo, tree)
        for name, names in (("rollback_runbook", RUNBOOK_NAMES), ("env_var_docs", ENV_NAMES)):
            matches = sorted(path for path in files if path.lower() in names)
            record(name, bool(matches), "recognized_root_file_present" if matches else "recognized_root_file_absent", matches)
        entry = files.get("Dockerfile")
        if entry is None:
            record("dockerfile_ok", False, "root_dockerfile_absent")
        else:
            try:
                ok = dockerfile_structure(repo, revision, entry)
                record("dockerfile_ok", ok, "instruction_presence_only", ["Dockerfile"])
            except EvidenceUnavailable as exc:
                record("dockerfile_ok", None, str(exc), ["Dockerfile"])
    except EvidenceUnavailable as exc:
        for name in ("rollback_runbook", "env_var_docs", "dockerfile_ok"):
            record(name, None, str(exc))
    try:
        active, lower_bound, exact = maintenance(repo, revision, observed)
        row["commits_last_7d"] = exact
        row["commits_last_7d_lower_bound"] = lower_bound
        record("active_maintenance", active, "at_least_two_commits" if active else "fewer_than_two_commits")
    except EvidenceUnavailable as exc:
        record("active_maintenance", None, str(exc))
    values = list(row["signals"].values())
    row["observed_score"] = sum(value is True for value in values)
    if all(type(value) is bool for value in values):
        row["score"] = row["observed_score"]
        row["observation_state"] = "COMPLETE"
    return row


def main() -> int:
    payload = {
        "flagships": [score_flagship(fl["repo"]) for fl in khipu.FLAGSHIPS],
        "note": "Pinned source observations only; Docker structure-only; publication success is not readiness qualification.",
        "readiness_qualification": "NOT_ASSESSED",
    }
    # Preserve the fleet's existing signing and fail-closed publication contract.
    khipu.emit(AGENT, payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
