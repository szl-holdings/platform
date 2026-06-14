#!/usr/bin/env python3
# ATTRIBUTION
# ===========
# SZL Estate Auto-Auditor — an SZL-native per-repo health/alignment checker.
#
# The CLI *approach* (a single-command tool that auto-analyzes a project's
# structure/health and emits a developer-readable report) is inspired by the
# open-source project jkdevcode/repo-inspector (https://github.com/jkdevcode/repo-inspector),
# which is published under a permissive license (MIT per its About metadata;
# ISC per its LICENSE file — both permit reuse with attribution).
#
# This file is an INDEPENDENT, original implementation written by SZL Holdings.
# No source from repo-inspector (or from any unlicensed repository) is copied
# here. Only the high-level idea — "one command, auto health report" — is reused,
# with attribution, as permitted by the upstream permissive license.
# See the repository NOTICE file for the matching credit entry.
#
# Author of this implementation: SZL Holdings (stephenlutar2 <stephenlutar2@gmail.com>)
# Doctrine: v11 LOCKED 749/14/163. Additive tool; no secrets committed.
#
# Honesty contract: this tool never fabricates a status. When the GitHub API
# cannot be reached after retries, the affected field is reported as
# "unavailable" and the run continues without crashing.
"""SZL Estate Auto-Auditor.

Automates the per-repo health/alignment check that the manual estate sweep
performed by hand. For each repository in the SZL estate it reports:

    {name, default_branch, latest_push_CI_conclusion (push-event vs schedule-event),
     open_PR_count, last_commit_age_days, has_LICENSE, has_README, top_language}

and computes a health score + flag:

    RED        latest push-event CI on the default branch concluded "failure"
    STALE      no push to the default branch within 30 days
    UNLICENSED no LICENSE file present
    GREEN      none of the above

Pure Python standard library + the `gh` CLI (invoked via subprocess). No
third-party dependencies.

SZL doctrine note: scheduled / workflow_dispatch CI failures are frequently
expected (nightly scans, credential-gated jobs) and are reported separately
from push-event failures, which represent real breakage of the default branch.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone

# Default SZL estate (per the manual 5-dev sweep scope).
DEFAULT_REPOS = [
    "platform",
    "a11oy",
    "lutar-lean",
    "killinchu",
    "anatomy",
    "yarqa",
    "szl-uds-deployment",
    "uds-mesh",
    "ouroboros",
    "hatun-mcp",
]

DEFAULT_OWNER = "szl-holdings"
STALE_DAYS = 30
UNAVAILABLE = "unavailable"

# Field sentinel used when an entire repo lookup fails.
PUSH_EVENTS = {"push"}
# Treated as "real" CI signal vs. scheduled/dispatch which are often expected.
SCHEDULE_EVENTS = {"schedule", "workflow_dispatch", "dynamic", "repository_dispatch"}


# --------------------------------------------------------------------------- #
# gh CLI plumbing
# --------------------------------------------------------------------------- #
def run_gh(args, retries=3, timeout=60):
    """Run a `gh` command, returning (ok, stdout_text).

    Retries up to `retries` times on failure. Returns (False, "") if all
    attempts fail or `gh` is not installed — the caller maps that to
    "unavailable". This function never raises for an API failure.
    """
    last_err = ""
    for attempt in range(1, retries + 1):
        try:
            proc = subprocess.run(
                ["gh", *args],
                capture_output=True,
                text=True,
                timeout=timeout,
            )
        except FileNotFoundError:
            # gh is not installed in this environment; no point retrying.
            return False, ""
        except subprocess.TimeoutExpired:
            last_err = "timeout"
            time.sleep(min(2 * attempt, 5))
            continue
        if proc.returncode == 0:
            return True, proc.stdout
        last_err = (proc.stderr or "").strip()
        time.sleep(min(2 * attempt, 5))
    if last_err:
        sys.stderr.write(f"[gh] giving up after {retries} attempts: {last_err}\n")
    return False, ""


def gh_json(args, retries=3):
    """Run a gh command expected to emit JSON; return (ok, parsed_or_None)."""
    ok, out = run_gh(args, retries=retries)
    if not ok or not out.strip():
        return False, None
    try:
        return True, json.loads(out)
    except json.JSONDecodeError:
        return False, None


# --------------------------------------------------------------------------- #
# Per-field collectors (each isolates failure to its own field)
# --------------------------------------------------------------------------- #
def get_repo_meta(owner, repo):
    """Return dict with default_branch, top_language, pushed_at, license_spdx.

    Any field that cannot be resolved is set to UNAVAILABLE.
    """
    ok, data = gh_json(
        [
            "api",
            f"repos/{owner}/{repo}",
            "--jq",
            "{default_branch: .default_branch, language: .language, "
            "pushed_at: .pushed_at, license: (.license.spdx_id // null)}",
        ]
    )
    if not ok or not isinstance(data, dict):
        return {
            "default_branch": UNAVAILABLE,
            "top_language": UNAVAILABLE,
            "pushed_at": UNAVAILABLE,
            "license_spdx": UNAVAILABLE,
        }
    return {
        "default_branch": data.get("default_branch") or UNAVAILABLE,
        "top_language": data.get("language") or "none",
        "pushed_at": data.get("pushed_at") or UNAVAILABLE,
        "license_spdx": data.get("license"),  # may be None / NOASSERTION
    }


def path_exists(owner, repo, ref, candidates):
    """Return True if any of `candidates` exists at repo root for `ref`.

    Returns UNAVAILABLE if the contents listing cannot be retrieved.
    """
    ref_q = "" if ref in (None, UNAVAILABLE) else f"?ref={ref}"
    ok, data = gh_json(
        ["api", f"repos/{owner}/{repo}/contents{ref_q}", "--jq", "[.[].name]"]
    )
    if not ok or not isinstance(data, list):
        return UNAVAILABLE
    names = {str(n).lower() for n in data}
    return any(c.lower() in names for c in candidates)


def get_open_pr_count(owner, repo):
    """Count open PRs. Returns UNAVAILABLE on failure."""
    # search API is reliable and paginates internally for the count.
    ok, data = gh_json(
        [
            "api",
            "-X",
            "GET",
            "search/issues",
            "-f",
            f"q=repo:{owner}/{repo} type:pr state:open",
            "--jq",
            ".total_count",
        ]
    )
    if not ok or not isinstance(data, int):
        return UNAVAILABLE
    return data


def get_latest_ci(owner, repo, default_branch):
    """Resolve the latest *completed* CI conclusion on the default branch,
    distinguishing push-event runs from schedule/dispatch runs.

    Returns a dict:
        {
          "push": {"conclusion": <str|None>, "event": "push", "url": <str|None>,
                   "created_at": <str|None>} | None,
          "schedule": {... } | None,
          "available": bool,
        }
    """
    if default_branch in (None, UNAVAILABLE):
        branch_filter = []
    else:
        branch_filter = ["-b", default_branch]
    ok, runs = gh_json(
        [
            "run",
            "list",
            "-R",
            f"{owner}/{repo}",
            *branch_filter,
            "--limit",
            "60",
            "--json",
            "databaseId,event,conclusion,status,headBranch,createdAt,url",
        ]
    )
    if not ok or not isinstance(runs, list):
        return {"push": None, "schedule": None, "available": False}

    push_latest = None
    sched_latest = None
    for r in runs:
        if r.get("status") != "completed":
            continue  # in-progress / queued carry no conclusion yet
        event = r.get("event", "")
        rec = {
            "conclusion": r.get("conclusion") or None,
            "event": event,
            "url": r.get("url"),
            "created_at": r.get("createdAt"),
        }
        if event in PUSH_EVENTS and push_latest is None:
            push_latest = rec
        elif event in SCHEDULE_EVENTS and sched_latest is None:
            sched_latest = rec
        if push_latest and sched_latest:
            break
    return {"push": push_latest, "schedule": sched_latest, "available": True}


# --------------------------------------------------------------------------- #
# Derivations
# --------------------------------------------------------------------------- #
def commit_age_days(pushed_at, now=None):
    """Whole days since `pushed_at` (ISO-8601 Z). UNAVAILABLE on bad input."""
    if pushed_at in (None, UNAVAILABLE):
        return UNAVAILABLE
    now = now or datetime.now(timezone.utc)
    try:
        ts = pushed_at.replace("Z", "+00:00")
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
    except (ValueError, AttributeError):
        return UNAVAILABLE
    delta = now - dt
    return max(delta.days, 0)


def has_license_flag(license_spdx, license_file_present):
    """True if a LICENSE is detectably present.

    Prefers the explicit contents-listing result; falls back to the SPDX id.
    A NOASSERTION SPDX with a present LICENSE file (custom license) still counts.
    """
    if license_file_present is True:
        return True
    if license_file_present == UNAVAILABLE:
        if license_spdx in (None, UNAVAILABLE):
            return UNAVAILABLE
        # SPDX present and recognised => licensed.
        return license_spdx not in ("", "NONE")
    # license_file_present is False
    return False


def score_repo(record):
    """Compute a health score (0-100) and a flag from a per-repo record.

    Pure function over a plain dict — unit-testable without network access.

    Flag precedence (highest severity first):
        RED        push-event CI on default branch == "failure"
        STALE      last_commit_age_days > STALE_DAYS
        UNLICENSED has_LICENSE is False
        GREEN      otherwise

    Returns (score:int, flag:str, reasons:list[str]).
    """
    reasons = []
    score = 100

    push_ci = record.get("latest_push_CI_conclusion")
    sched_ci = record.get("latest_schedule_CI_conclusion")
    age = record.get("last_commit_age_days")
    has_license = record.get("has_LICENSE")
    has_readme = record.get("has_README")

    flag = "GREEN"

    # RED — real push-event breakage on the default branch.
    if push_ci == "failure":
        score -= 60
        reasons.append("push-event CI on default branch concluded failure")
        flag = "RED"

    # STALE — no push within the staleness window.
    if isinstance(age, int) and age > STALE_DAYS:
        score -= 25
        reasons.append(f"no push in {age} days (> {STALE_DAYS}d window)")
        if flag != "RED":
            flag = "STALE"

    # UNLICENSED — missing LICENSE.
    if has_license is False:
        score -= 20
        reasons.append("no LICENSE file present")
        if flag not in ("RED", "STALE"):
            flag = "UNLICENSED"

    # Minor deductions (do not change the headline flag).
    if has_readme is False:
        score -= 5
        reasons.append("no README present")
    if sched_ci == "failure":
        # Scheduled/dispatch failures are often expected; minor, informational.
        score -= 5
        reasons.append("scheduled/dispatch CI failing (often expected per doctrine)")

    # Unavailable signals are noted but never fabricated into a pass/fail.
    if push_ci == UNAVAILABLE:
        reasons.append("push-event CI status unavailable")
    if has_license == UNAVAILABLE:
        reasons.append("LICENSE presence unavailable")

    return max(score, 0), flag, reasons


# --------------------------------------------------------------------------- #
# Audit orchestration
# --------------------------------------------------------------------------- #
def audit_repo(owner, repo, now=None):
    """Collect all fields for one repo and score it. Never raises for API
    failures; failed fields become UNAVAILABLE."""
    meta = get_repo_meta(owner, repo)
    default_branch = meta["default_branch"]

    license_present = path_exists(
        owner, repo, default_branch, ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"]
    )
    readme_present = path_exists(
        owner, repo, default_branch, ["README.md", "README", "README.rst", "README.txt"]
    )
    open_prs = get_open_pr_count(owner, repo)
    ci = get_latest_ci(owner, repo, default_branch)

    push_rec = ci.get("push")
    sched_rec = ci.get("schedule")
    if not ci.get("available"):
        push_conclusion = UNAVAILABLE
        sched_conclusion = UNAVAILABLE
    else:
        push_conclusion = push_rec["conclusion"] if push_rec else None
        sched_conclusion = sched_rec["conclusion"] if sched_rec else None

    has_license = has_license_flag(meta["license_spdx"], license_present)

    record = {
        "name": repo,
        "owner": owner,
        "default_branch": default_branch,
        "latest_push_CI_conclusion": push_conclusion,
        "latest_push_CI_url": push_rec["url"] if push_rec else None,
        "latest_schedule_CI_conclusion": sched_conclusion,
        "open_PR_count": open_prs,
        "last_commit_age_days": commit_age_days(meta["pushed_at"], now=now),
        "pushed_at": meta["pushed_at"],
        "has_LICENSE": has_license,
        "license_spdx": meta["license_spdx"] if meta["license_spdx"] else None,
        "has_README": readme_present,
        "top_language": meta["top_language"],
    }
    score, flag, reasons = score_repo(record)
    record["health_score"] = score
    record["flag"] = flag
    record["flag_reasons"] = reasons
    return record


def audit_estate(repos, owner=DEFAULT_OWNER, now=None):
    now = now or datetime.now(timezone.utc)
    records = []
    for repo in repos:
        sys.stderr.write(f"[audit] {owner}/{repo} ...\n")
        records.append(audit_repo(owner, repo, now=now))
    return {
        "generated_at_utc": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "owner": owner,
        "stale_days_window": STALE_DAYS,
        "doctrine": "v11 LOCKED 749/14/163",
        "attribution": (
            "Auto-auditor CLI approach inspired by jkdevcode/repo-inspector "
            "(permissive license, MIT/ISC). Independent SZL-native implementation; "
            "no upstream code copied."
        ),
        "repo_count": len(records),
        "repos": records,
    }


# --------------------------------------------------------------------------- #
# Rendering
# --------------------------------------------------------------------------- #
def _cell(value):
    if value is None:
        return "-"
    if value is True:
        return "yes"
    if value is False:
        return "no"
    return str(value)


def render_table(report):
    rows = report["repos"]
    headers = [
        "REPO",
        "BRANCH",
        "PUSH-CI",
        "SCHED-CI",
        "PRs",
        "AGE(d)",
        "LIC",
        "RDME",
        "LANG",
        "SCORE",
        "FLAG",
    ]

    def row_of(r):
        return [
            _cell(r["name"]),
            _cell(r["default_branch"]),
            _cell(r["latest_push_CI_conclusion"]),
            _cell(r["latest_schedule_CI_conclusion"]),
            _cell(r["open_PR_count"]),
            _cell(r["last_commit_age_days"]),
            _cell(r["has_LICENSE"]),
            _cell(r["has_README"]),
            _cell(r["top_language"]),
            _cell(r["health_score"]),
            _cell(r["flag"]),
        ]

    table = [headers] + [row_of(r) for r in rows]
    widths = [max(len(table[i][c]) for i in range(len(table))) for c in range(len(headers))]
    lines = []
    sep = "-+-".join("-" * w for w in widths)
    for ri, row in enumerate(table):
        line = " | ".join(cell.ljust(widths[ci]) for ci, cell in enumerate(row))
        lines.append(line)
        if ri == 0:
            lines.append(sep)
    return "\n".join(lines)


def render_summary(report):
    counts = {"GREEN": 0, "RED": 0, "STALE": 0, "UNLICENSED": 0}
    for r in report["repos"]:
        counts[r["flag"]] = counts.get(r["flag"], 0) + 1
    parts = [f"{k}={v}" for k, v in counts.items()]
    return (
        f"Estate: {report['repo_count']} repos @ {report['generated_at_utc']} | "
        + " ".join(parts)
    )


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def default_report_path(now=None):
    now = now or datetime.now(timezone.utc)
    stamp = now.strftime("%Y%m%dT%H%M%SZ")
    return os.path.join("/home/user/workspace/estate_audit", f"auto_audit_{stamp}.json")


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="SZL Estate Auto-Auditor — per-repo health/alignment check."
    )
    parser.add_argument(
        "repos",
        nargs="*",
        default=None,
        help="Repo names to audit (default: the SZL estate).",
    )
    parser.add_argument("--owner", default=DEFAULT_OWNER, help="GitHub org/owner.")
    parser.add_argument(
        "--json-out",
        default=None,
        help="Path for the JSON report (default: estate_audit/auto_audit_<UTC>.json).",
    )
    parser.add_argument(
        "--no-table", action="store_true", help="Suppress the stdout table."
    )
    args = parser.parse_args(argv)

    now = datetime.now(timezone.utc)
    repos = args.repos if args.repos else DEFAULT_REPOS
    out_path = args.json_out or default_report_path(now)

    report = audit_estate(repos, owner=args.owner, now=now)

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, sort_keys=False)

    if not args.no_table:
        print(render_table(report))
        print()
    print(render_summary(report))
    print(f"JSON report written to: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
