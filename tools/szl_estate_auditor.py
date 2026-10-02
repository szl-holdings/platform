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

The flag covers only captured source metadata and observed CI lanes. It is
never a production-readiness certificate. Missing, pending or stale evidence
cannot establish GREEN; failed scheduled and dispatched runs are failures.

Pure Python standard library + the `gh` CLI (invoked via subprocess). No
third-party dependencies.

No API credentials or raw error responses are stored in the report.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import quote

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
# Event classes are reported separately; neither receives a failure exemption.
SCHEDULE_EVENTS = {"schedule", "workflow_dispatch", "dynamic", "repository_dispatch"}
FAILED = {"failure", "timed_out", "cancelled", "action_required", "startup_failure", "stale"}
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


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
                encoding="utf-8",
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
        # Provider errors can contain private URLs or credentials. Do not echo them.
        sys.stderr.write(f"[gh] request unavailable after {retries} attempts\n")
    return False, ""


def gh_json(args, retries=3):
    """Run a gh command expected to emit JSON; return (ok, parsed_or_None)."""
    ok, out = run_gh(args, retries=retries)
    if not ok or not isinstance(out, str) or not out.strip():
        return False, None
    try:
        return True, json.loads(out)
    except json.JSONDecodeError:
        return False, None


def paginated(endpoint, field=None):
    """Fetch every bounded API page; partial pages never count as complete."""
    records = []
    identifiers = set()
    observed_total = None
    separator = "&" if "?" in endpoint else "?"
    for page in range(1, 101):
        ok, data = gh_json(["api", f"{endpoint}{separator}per_page=100&page={page}"])
        if not ok:
            return False, records
        rows = data.get(field) if field and isinstance(data, dict) else data
        if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
            return False, records
        if field:
            total = data.get("total_count")
            if type(total) is not int or total < 0 or (observed_total is not None and total != observed_total):
                return False, records
            observed_total = total
        page_ids = [row.get("id", row.get("name")) for row in rows]
        if any(type(identifier) not in (str, int) for identifier in page_ids):
            return False, records
        if len(set(page_ids)) != len(page_ids) or identifiers.intersection(page_ids):
            return False, records
        identifiers.update(page_ids)
        records.extend(rows)
        if len(rows) < 100:
            if observed_total is not None and len(records) != observed_total:
                return False, records
            return True, records
    return False, records


def list_repos(owner):
    ok, rows = paginated(f"orgs/{quote(owner, safe='')}/repos?type=all")
    if not ok or any(not isinstance(row.get("name"), str) for row in rows):
        return False, []
    names = [row["name"] for row in rows]
    if len(set(names)) != len(names):
        return False, []
    return True, sorted(names, key=str.casefold)


def get_head(owner, repo, branch):
    if branch in (None, UNAVAILABLE):
        return UNAVAILABLE
    ok, data = gh_json(["api", f"repos/{owner}/{repo}/commits/{quote(branch, safe='')}", "--jq", "{sha}"])
    sha = data.get("sha") if ok and isinstance(data, dict) else None
    return sha if isinstance(sha, str) and SHA_RE.fullmatch(sha) else UNAVAILABLE


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
            "pushed_at: .pushed_at, license: (.license.spdx_id // null), "
            "archived: .archived, private: .private}",
        ]
    )
    if not ok or not isinstance(data, dict):
        return {
            "default_branch": UNAVAILABLE,
            "top_language": UNAVAILABLE,
            "pushed_at": UNAVAILABLE,
            "license_spdx": UNAVAILABLE,
            "archived": UNAVAILABLE,
            "private": UNAVAILABLE,
        }
    return {
        "default_branch": data.get("default_branch") or UNAVAILABLE,
        "top_language": data.get("language") or "none",
        "pushed_at": data.get("pushed_at") or UNAVAILABLE,
        "license_spdx": data.get("license"),  # may be None / NOASSERTION
        "archived": data.get("archived", UNAVAILABLE),
        "private": data.get("private", UNAVAILABLE),
    }


def path_exists(owner, repo, ref, candidates):
    """Return True if any of `candidates` exists at repo root for `ref`.

    Returns UNAVAILABLE if the contents listing cannot be retrieved.
    """
    if not isinstance(ref, str) or not SHA_RE.fullmatch(ref):
        return UNAVAILABLE
    ref_q = f"?ref={ref}"
    ok, data = gh_json(
        ["api", f"repos/{owner}/{repo}/contents{ref_q}", "--jq", "[.[].name]"]
    )
    if not ok or not isinstance(data, list):
        return UNAVAILABLE
    names = {str(n).lower() for n in data}
    return any(c.lower() in names for c in candidates)


def get_open_pr_count(owner, repo):
    """Count open PRs. Returns UNAVAILABLE on failure."""
    ok, rows = paginated(f"repos/{owner}/{repo}/pulls?state=open")
    return len(rows) if ok else UNAVAILABLE


def get_latest_ci(owner, repo, default_branch, revision=None):
    """Read all current-revision runs, retaining the latest per workflow/event.

    A newer queued run supersedes an older success. Distinct workflows never
    mask each other. Missing required workflows cannot be inferred from this
    endpoint, so this is explicitly an observed-lane snapshot only.
    """
    missing = {"push": None, "schedule": None, "available": False, "lanes": []}
    if not isinstance(revision, str) or not SHA_RE.fullmatch(revision):
        return missing
    # The revision, not the event name or branch label, binds a workflow run
    # to this source snapshot.  In particular, workflow_run post-deploy jobs
    # must not disappear behind a successful push run for the same commit.
    endpoint = f"repos/{owner}/{repo}/actions/runs?head_sha={revision}"
    ok, runs = paginated(endpoint, "workflow_runs")
    lanes = {}
    valid_runs = []
    for run in runs:
        valid = (type(run.get("id")) is int and type(run.get("workflow_id")) is int
                 and all(isinstance(run.get(field), str) for field in
                         ("created_at", "event", "status", "head_sha"))
                 and bool(run.get("event"))
                 and (run.get("conclusion") is None or isinstance(run["conclusion"], str)))
        if valid:
            try:
                valid = run["created_at"].endswith("Z") and bool(datetime.fromisoformat(run["created_at"].replace("Z", "+00:00")))
            except ValueError:
                valid = False
        if valid:
            valid_runs.append(run)
        else:
            ok = False
    for run in sorted(valid_runs, key=lambda r: (r["created_at"], r["id"]), reverse=True):
        event = run.get("event")
        if run.get("head_sha") != revision:
            continue
        workflow_id = run.get("workflow_id")
        if not isinstance(workflow_id, int):
            ok = False
            continue
        key = (workflow_id, event)
        if key not in lanes:
            lanes[key] = {
                "workflow_id": workflow_id, "name": run.get("name"),
                "status": run.get("status"), "conclusion": run.get("conclusion"),
                "event": event, "url": run.get("html_url"),
                "created_at": run.get("created_at"), "source_revision": revision,
            }
    rows = [lanes[key] for key in sorted(lanes)]

    def summarize(events):
        subset = [row for row in rows if row["event"] in events]
        if not subset:
            return None
        failures = [row for row in subset if row["conclusion"] in FAILED]
        pending = [row for row in subset if row["status"] != "completed" or row["conclusion"] != "success"]
        selected = (failures or pending or subset)[0]
        return {**selected, "conclusion": selected["conclusion"] if selected["status"] == "completed" else "pending"}

    return {"push": summarize(PUSH_EVENTS), "schedule": summarize(SCHEDULE_EVENTS),
            "available": ok, "lanes": rows}


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
        # Mutable metadata cannot establish a file at the captured revision.
        return UNAVAILABLE
    # license_file_present is False
    return False


def score_repo(record):
    """Score only source/observed CI; uncertainty never becomes GREEN."""
    reasons = []
    push_ci = record.get("latest_push_CI_conclusion")
    sched_ci = record.get("latest_schedule_CI_conclusion")
    age = record.get("last_commit_age_days")
    has_license = record.get("has_LICENSE")
    has_readme = record.get("has_README")
    for label, value in (("push", push_ci), ("scheduled/dispatch", sched_ci)):
        if value in FAILED:
            reasons.append(f"{label} CI concluded {value}")
    lanes = record.get("ci_lanes", [])
    if not isinstance(lanes, list) or any(not isinstance(lane, dict) for lane in lanes):
        return None, "YELLOW", ["malformed CI lane evidence"]
    for lane in lanes:
        if lane.get("conclusion") in FAILED:
            reasons.append(f"workflow {lane.get('workflow_id')} ({lane.get('event')}) concluded {lane['conclusion']}")
    if reasons:
        return 0, "RED", reasons
    if record.get("archived") is True:
        return None, "GRAY", ["historical archived source; not scored as operational"]
    required = {
        "source_revision": record.get("source_revision"),
        "push CI": push_ci, "LICENSE": has_license, "README": has_readme,
        "commit age": age,
    }
    unknown = [name for name, value in required.items() if value is None or value == UNAVAILABLE]
    if len(unknown) == len(required):
        return None, "GRAY", ["all source/CI signals unavailable"]
    if unknown:
        reasons.append("unavailable evidence: " + ", ".join(unknown))
    if record.get("collection_complete") is not True:
        reasons.append("collection incomplete or head drifted")
    revision = record.get("source_revision")
    if not isinstance(revision, str) or not SHA_RE.fullmatch(revision):
        reasons.append("no immutable source revision")
    if record.get("final_source_revision") != revision:
        reasons.append("final source head missing or different from captured revision")
    if record.get("ci_available") is not True:
        reasons.append("CI pagination not established complete")
    if not lanes or any(lane.get("source_revision") != revision for lane in lanes):
        reasons.append("CI lanes absent or bound to another revision")
    if not any(lane.get("event") == "push" for lane in lanes):
        reasons.append("no current-revision push workflow observed")
    if push_ci != "success":
        reasons.append("current source push CI not successful")
    if sched_ci not in (None, "success"):
        reasons.append("scheduled/dispatch CI not successful or unavailable")
    if any(lane.get("status") != "completed" or lane.get("conclusion") != "success"
           for lane in lanes):
        reasons.append("one or more observed workflow lanes pending or not successful")
    if type(age) is not int or age > STALE_DAYS:
        reasons.append("source freshness is unavailable or outside the observation window")
    if has_license is not True:
        reasons.append("LICENSE at captured revision not established")
    if has_readme is not True:
        reasons.append("README at captured revision not established")
    if reasons:
        return None, "YELLOW", reasons
    return 100, "GREEN", ["source metadata and observed CI only; readiness not assessed"]


# --------------------------------------------------------------------------- #
# Audit orchestration
# --------------------------------------------------------------------------- #
def audit_repo(owner, repo, now=None):
    """Collect all fields for one repo and score it. Never raises for API
    failures; failed fields become UNAVAILABLE."""
    meta = get_repo_meta(owner, repo)
    default_branch = meta["default_branch"]
    revision = get_head(owner, repo, default_branch)

    license_present = path_exists(
        owner, repo, revision, ["LICENSE", "LICENSE.md", "LICENSE.txt", "COPYING"]
    )
    readme_present = path_exists(
        owner, repo, revision, ["README.md", "README", "README.rst", "README.txt"]
    )
    open_prs = get_open_pr_count(owner, repo)
    ci = get_latest_ci(owner, repo, default_branch, revision)
    final_revision = get_head(owner, repo, default_branch)

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
        "source_revision": revision,
        "final_source_revision": final_revision,
        "archived": meta["archived"],
        "private": meta["private"],
        "ci_lanes": ci["lanes"],
        "ci_available": ci["available"],
        "collection_complete": (revision != UNAVAILABLE and revision == final_revision
                                and ci["available"] and open_prs != UNAVAILABLE
                                and license_present != UNAVAILABLE and readme_present != UNAVAILABLE),
        "last_observed_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "evidence_class": "REPORTED",
        "runtime_state": "NOT_PROBED",
        "operational_readiness": UNAVAILABLE,
    }
    score, flag, reasons = score_repo(record)
    record["health_score"] = score
    record["flag"] = flag
    record["flag_reasons"] = reasons
    return record


def audit_estate(repos, owner=DEFAULT_OWNER, now=None, workers=1):
    now = now or datetime.now(timezone.utc)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        records = list(pool.map(lambda repo: audit_repo(owner, repo, now=now), sorted(set(repos))))
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
        "schema_version": "szl-estate-source-ci/v2",
        "scope": "source metadata and observed current-revision CI lanes only",
        "collection_complete": all(r["collection_complete"] for r in records),
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
    counts = {"GREEN": 0, "YELLOW": 0, "RED": 0, "GRAY": 0}
    for r in report["repos"]:
        counts[r["flag"]] = counts.get(r["flag"], 0) + 1
    parts = [f"{k}={v}" for k, v in counts.items()]
    return (
        f"Source/CI snapshot (NOT operational readiness): {report['repo_count']} repos @ {report['generated_at_utc']} | "
        + " ".join(parts)
    )


# --------------------------------------------------------------------------- #
# CLI
# --------------------------------------------------------------------------- #
def default_report_path(now=None):
    now = now or datetime.now(timezone.utc)
    stamp = now.strftime("%Y%m%dT%H%M%SZ")
    return os.path.join("estate-audit", "local", f"auto_audit_{stamp}.json")


def validate_replay(report):
    """Reject malformed snapshots before rendering or writing any output.

    This checks internal consistency, not authenticity. A local hash is not
    a signature and replay does not renew the original observation.
    """
    if not isinstance(report, dict) or report.get("schema_version") != "szl-estate-source-ci/v2":
        raise ValueError("unsupported snapshot")
    rows = report.get("repos")
    if not isinstance(rows, list) or not rows or type(report.get("repo_count")) is not int or report["repo_count"] != len(rows):
        raise ValueError("invalid repository count")
    stamp = report.get("generated_at_utc")
    if not isinstance(stamp, str) or not stamp.endswith("Z"):
        raise ValueError("invalid observation time")
    datetime.fromisoformat(stamp.replace("Z", "+00:00"))
    required = {"name", "owner", "default_branch", "latest_push_CI_conclusion",
                "latest_schedule_CI_conclusion", "open_PR_count", "last_commit_age_days",
                "has_LICENSE", "has_README", "top_language", "source_revision",
                "final_source_revision", "ci_lanes", "ci_available", "collection_complete"}
    identities = set()
    for row in rows:
        if not isinstance(row, dict) or not required.issubset(row):
            raise ValueError("invalid repository record")
        for name in ("name", "owner", "default_branch", "top_language", "source_revision", "final_source_revision"):
            if not isinstance(row[name], str):
                raise ValueError("invalid text field")
        if not re.fullmatch(r"[A-Za-z0-9_.-]+", row["name"]) or not re.fullmatch(r"[A-Za-z0-9_.-]+", row["owner"]):
            raise ValueError("invalid repository identity")
        identity = (row["owner"].lower(), row["name"].lower())
        if identity in identities:
            raise ValueError("duplicate repository")
        identities.add(identity)
        for name in ("latest_push_CI_conclusion", "latest_schedule_CI_conclusion"):
            if row[name] is not None and not isinstance(row[name], str):
                raise ValueError("invalid CI conclusion")
        for name in ("open_PR_count", "last_commit_age_days"):
            if row[name] != UNAVAILABLE and (type(row[name]) is not int or row[name] < 0):
                raise ValueError("invalid numeric observation")
        for name in ("has_LICENSE", "has_README"):
            if type(row[name]) is not bool and row[name] != UNAVAILABLE:
                raise ValueError("invalid file observation")
        for name in ("ci_available", "collection_complete"):
            if type(row[name]) is not bool:
                raise ValueError("invalid completeness observation")
        if not isinstance(row["ci_lanes"], list):
            raise ValueError("invalid lanes")
        for lane in row["ci_lanes"]:
            if not isinstance(lane, dict) or type(lane.get("workflow_id")) is not int:
                raise ValueError("invalid lane identity")
            if any(not isinstance(lane.get(name), str) for name in ("event", "status", "source_revision")):
                raise ValueError("invalid lane observation")
            if lane.get("conclusion") is not None and not isinstance(lane["conclusion"], str):
                raise ValueError("invalid lane conclusion")


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
    parser.add_argument("--all", action="store_true", help="Enumerate every accessible organization repository.")
    parser.add_argument("--workers", type=int, choices=range(1, 9), default=4)
    parser.add_argument("--replay", help="Rescore a prior v2 JSON snapshot offline; does not refresh evidence.")
    parser.add_argument("--require-green", action="store_true", help="Exit 3 unless every source/CI flag is GREEN.")
    parser.add_argument(
        "--json-out",
        default=None,
        help="Path for the JSON report (default: estate-audit/local/auto_audit_<UTC>.json).",
    )
    parser.add_argument(
        "--no-table", action="store_true", help="Suppress the stdout table."
    )
    args = parser.parse_args(argv)

    now = datetime.now(timezone.utc)
    if args.all and args.repos or args.replay and (args.all or args.repos):
        parser.error("choose explicit repositories, --all, or --replay")
    repos = args.repos if args.repos else DEFAULT_REPOS
    out_path = args.json_out or default_report_path(now)
    if args.replay:
        try:
            with open(args.replay, encoding="utf-8") as stream:
                report = json.load(stream)
            validate_replay(report)
            for row in report["repos"]:
                row["health_score"], row["flag"], row["flag_reasons"] = score_repo(row)
            report["collection_complete"] = all(
                row["collection_complete"] is True and row["ci_available"] is True
                and row["source_revision"] == row["final_source_revision"]
                and SHA_RE.fullmatch(row["source_revision"])
                and all(lane["source_revision"] == row["source_revision"] for lane in row["ci_lanes"])
                for row in report["repos"])
            report["replayed_at_utc"] = now.strftime("%Y-%m-%dT%H:%M:%SZ")
        except (OSError, ValueError, TypeError, AttributeError):
            parser.error("invalid or unreadable v2 replay snapshot")
    else:
        if args.all:
            ok, repos = list_repos(args.owner)
            if not ok or not repos:
                sys.stderr.write("Organization census unavailable/incomplete; no successful empty report written.\n")
                return 2
        report = audit_estate(repos, owner=args.owner, now=now, workers=args.workers)

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, sort_keys=True)
        fh.write("\n")
    with open(out_path, "rb") as fh:
        digest = hashlib.sha256(fh.read()).hexdigest()
    with open(out_path + ".sha256", "w", encoding="ascii") as fh:
        fh.write(digest + "\n")

    if not args.no_table:
        print(render_table(report))
        print()
    print(render_summary(report))
    print(f"JSON report written to: {out_path}")
    if not report["collection_complete"]:
        return 2
    return 3 if args.require_green and any(r["flag"] != "GREEN" for r in report["repos"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
