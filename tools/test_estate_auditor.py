#!/usr/bin/env python3
# ATTRIBUTION: companion test for szl_estate_auditor.py. CLI approach inspired by
# jkdevcode/repo-inspector (permissive MIT/ISC). Independent SZL implementation.
"""Tests for the SZL Estate Auto-Auditor.

Two layers:
  1. Offline (always runs): the pure scoring/derivation functions and the
     report shape against mock dicts. No network, no `gh` required.
  2. Live (skipped automatically if `gh` is unavailable / unauthenticated):
     runs a real 2-repo audit and asserts the JSON has the expected keys and
     does not crash.

Run with:  python tools/test_estate_auditor.py
Exits non-zero on any failure.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import szl_estate_auditor as aud  # noqa: E402

EXPECTED_REPO_KEYS = {
    "name",
    "owner",
    "default_branch",
    "latest_push_CI_conclusion",
    "latest_push_CI_url",
    "latest_schedule_CI_conclusion",
    "open_PR_count",
    "last_commit_age_days",
    "pushed_at",
    "has_LICENSE",
    "license_spdx",
    "has_README",
    "top_language",
    "health_score",
    "flag",
    "flag_reasons",
}

EXPECTED_TOP_KEYS = {
    "generated_at_utc",
    "owner",
    "stale_days_window",
    "doctrine",
    "attribution",
    "repo_count",
    "repos",
}

_passed = 0
_failed = 0


def check(cond, msg):
    global _passed, _failed
    if cond:
        _passed += 1
        print(f"  PASS: {msg}")
    else:
        _failed += 1
        print(f"  FAIL: {msg}")


# --------------------------------------------------------------------------- #
# 1. Offline unit tests — scoring function on mock dicts
# --------------------------------------------------------------------------- #
def test_module_imports():
    print("[test] module imports + parses")
    check(hasattr(aud, "score_repo"), "score_repo is defined")
    check(hasattr(aud, "audit_repo"), "audit_repo is defined")
    check(aud.STALE_DAYS == 30, "stale window is 30 days")


def test_score_green():
    print("[test] scoring: healthy repo -> GREEN")
    rec = {
        "latest_push_CI_conclusion": "success",
        "latest_schedule_CI_conclusion": "success",
        "last_commit_age_days": 3,
        "has_LICENSE": True,
        "has_README": True,
    }
    score, flag, reasons = aud.score_repo(rec)
    check(flag == "GREEN", f"flag GREEN (got {flag})")
    check(score == 100, f"score 100 (got {score})")


def test_score_red_pushfail():
    print("[test] scoring: push-event CI failure -> RED")
    rec = {
        "latest_push_CI_conclusion": "failure",
        "latest_schedule_CI_conclusion": "success",
        "last_commit_age_days": 1,
        "has_LICENSE": True,
        "has_README": True,
    }
    score, flag, _ = aud.score_repo(rec)
    check(flag == "RED", f"flag RED (got {flag})")
    check(score < 100, f"score reduced (got {score})")


def test_score_schedule_fail_not_red():
    print("[test] scoring: schedule-only CI failure is NOT RED (doctrine)")
    rec = {
        "latest_push_CI_conclusion": "success",
        "latest_schedule_CI_conclusion": "failure",
        "last_commit_age_days": 2,
        "has_LICENSE": True,
        "has_README": True,
    }
    score, flag, reasons = aud.score_repo(rec)
    check(flag == "GREEN", f"schedule failure stays GREEN (got {flag})")
    check(
        any("scheduled" in r for r in reasons),
        "schedule failure noted in reasons",
    )


def test_score_stale():
    print("[test] scoring: no push in 45d -> STALE")
    rec = {
        "latest_push_CI_conclusion": "success",
        "latest_schedule_CI_conclusion": None,
        "last_commit_age_days": 45,
        "has_LICENSE": True,
        "has_README": True,
    }
    _, flag, _ = aud.score_repo(rec)
    check(flag == "STALE", f"flag STALE (got {flag})")


def test_score_unlicensed():
    print("[test] scoring: missing LICENSE -> UNLICENSED")
    rec = {
        "latest_push_CI_conclusion": "success",
        "latest_schedule_CI_conclusion": None,
        "last_commit_age_days": 2,
        "has_LICENSE": False,
        "has_README": True,
    }
    _, flag, _ = aud.score_repo(rec)
    check(flag == "UNLICENSED", f"flag UNLICENSED (got {flag})")


def test_score_precedence():
    print("[test] scoring: RED outranks STALE + UNLICENSED")
    rec = {
        "latest_push_CI_conclusion": "failure",
        "latest_schedule_CI_conclusion": None,
        "last_commit_age_days": 90,
        "has_LICENSE": False,
        "has_README": False,
    }
    _, flag, _ = aud.score_repo(rec)
    check(flag == "RED", f"RED takes precedence (got {flag})")


def test_unavailable_not_fabricated():
    print("[test] honesty: unavailable signals never become a pass/fail")
    rec = {
        "latest_push_CI_conclusion": aud.UNAVAILABLE,
        "latest_schedule_CI_conclusion": aud.UNAVAILABLE,
        "last_commit_age_days": aud.UNAVAILABLE,
        "has_LICENSE": aud.UNAVAILABLE,
        "has_README": aud.UNAVAILABLE,
    }
    score, flag, reasons = aud.score_repo(rec)
    check(flag == "GREEN", "all-unavailable does not fabricate RED/STALE")
    check(
        any("unavailable" in r for r in reasons),
        "unavailable signals surfaced in reasons",
    )


def test_commit_age():
    print("[test] commit_age_days math + bad-input handling")
    now = datetime(2026, 6, 13, tzinfo=timezone.utc)
    age = aud.commit_age_days("2026-06-03T00:00:00Z", now=now)
    check(age == 10, f"10-day age (got {age})")
    check(aud.commit_age_days(aud.UNAVAILABLE) == aud.UNAVAILABLE, "unavailable passthrough")
    check(aud.commit_age_days("not-a-date") == aud.UNAVAILABLE, "bad date -> unavailable")


def test_license_flag():
    print("[test] has_license_flag custom-license handling")
    check(aud.has_license_flag(None, True) is True, "file present => licensed")
    check(aud.has_license_flag(None, False) is False, "no file, no spdx => unlicensed")
    check(
        aud.has_license_flag("NOASSERTION", True) is True,
        "custom LICENSE (NOASSERTION) still counts as licensed",
    )
    check(
        aud.has_license_flag(None, aud.UNAVAILABLE) == aud.UNAVAILABLE,
        "no spdx + unavailable listing => unavailable",
    )


def test_report_shape_offline():
    print("[test] report rendering on a mock record (no network)")
    rec = {
        "name": "mockrepo",
        "owner": "szl-holdings",
        "default_branch": "main",
        "latest_push_CI_conclusion": "success",
        "latest_push_CI_url": None,
        "latest_schedule_CI_conclusion": None,
        "open_PR_count": 0,
        "last_commit_age_days": 1,
        "pushed_at": "2026-06-12T00:00:00Z",
        "has_LICENSE": True,
        "license_spdx": "Apache-2.0",
        "has_README": True,
        "top_language": "Python",
        "health_score": 100,
        "flag": "GREEN",
        "flag_reasons": [],
    }
    report = {
        "generated_at_utc": "2026-06-13T00:00:00Z",
        "owner": "szl-holdings",
        "stale_days_window": 30,
        "doctrine": "v11 LOCKED 749/14/163",
        "attribution": "inspired by jkdevcode/repo-inspector (MIT/ISC)",
        "repo_count": 1,
        "repos": [rec],
    }
    check(set(rec.keys()) == EXPECTED_REPO_KEYS, "mock record has exactly expected keys")
    table = aud.render_table(report)
    check("mockrepo" in table and "FLAG" in table, "table renders repo + header")
    summary = aud.render_summary(report)
    check("GREEN=1" in summary, "summary counts the GREEN repo")


# --------------------------------------------------------------------------- #
# 2. Live test — real 2-repo audit (skipped if gh unavailable)
# --------------------------------------------------------------------------- #
def gh_available():
    if shutil.which("gh") is None:
        return False
    # Use run_gh (text), not gh_json: `.login` is a bare scalar, not JSON.
    ok, out = aud.run_gh(["api", "user", "--jq", ".login"], retries=1)
    return ok and bool(out.strip())


def test_live_two_repos():
    print("[test] live: audit 2 repos via gh, assert keys + no crash")
    if not gh_available():
        print("  SKIP: gh CLI unavailable/unauthenticated in this shell")
        return
    tmpdir = tempfile.mkdtemp(prefix="szl_audit_test_")
    out_path = os.path.join(tmpdir, "audit.json")
    rc = aud.main(["platform", "a11oy", "--json-out", out_path, "--no-table"])
    check(rc == 0, "main() returns 0 (no crash)")
    check(os.path.exists(out_path), "JSON report written")
    with open(out_path) as fh:
        report = json.load(fh)
    check(set(report.keys()) >= EXPECTED_TOP_KEYS, "report has expected top-level keys")
    check(report["repo_count"] == 2, "two repos audited")
    for r in report["repos"]:
        check(
            set(r.keys()) == EXPECTED_REPO_KEYS,
            f"{r['name']} record has exactly expected keys",
        )
        check(
            r["flag"] in ("GREEN", "RED", "STALE", "UNLICENSED"),
            f"{r['name']} flag is valid ({r['flag']})",
        )
    shutil.rmtree(tmpdir, ignore_errors=True)


def main():
    tests = [
        test_module_imports,
        test_score_green,
        test_score_red_pushfail,
        test_score_schedule_fail_not_red,
        test_score_stale,
        test_score_unlicensed,
        test_score_precedence,
        test_unavailable_not_fabricated,
        test_commit_age,
        test_license_flag,
        test_report_shape_offline,
        test_live_two_repos,
    ]
    for t in tests:
        t()
    print(f"\n{_passed} passed, {_failed} failed")
    return 1 if _failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
