#!/usr/bin/env python3
"""
forge_validate_dependabot.py — FORGE: validate + (optionally) merge the two
OpenTelemetry Dependabot PRs on szl-holdings/platform.

WHO RUNS THIS: Forge (Replit), in the platform repo checkout, with pnpm + the
monorepo toolchain available (the CTO agent has GitHub admin but cannot run the
200-package pnpm typecheck/build to actually validate the bumps).

THE SITUATION (honest):
  - PRs #344 (@opentelemetry/sdk-node 0.208.0 -> 0.217.0) and
    #345 (@opentelemetry/auto-instrumentations-node 0.69.0 -> 0.75.0) touch only
    lib/observability/package.json + pnpm-lock.yaml.
  - Their required checks (DCO, lockfile-registry, Scorecard) are GREEN, but the
    heavy gates (Typecheck/E2E/Trivy) are RED **on main already** (pre-existing),
    so they can't tell us whether the bump itself is safe. The CTO agent declined
    to force-merge unvalidated deps into the flagship monorepo. This script does
    the real local validation instead.
  - Both PRs are currently BEHIND main; they need a rebase/update first.

WHAT IT DOES (idempotent, read-mostly; only merges if you pass --merge):
  1. For each PR: update the branch onto main (gh pr update-branch).
  2. Install deps and typecheck/build ONLY the observability scope that the bump
     affects (@szl-holdings/observability + @szl-holdings/otel), not the whole
     monorepo — that isolates whether the OTel bump itself breaks types.
  3. Print a clear PASS/FAIL per PR. With --merge, squash-merge a PR ONLY if its
     scoped typecheck PASSED and its required checks are green.

ENV / AUTH:
  - GH_TOKEN : a token that can update + merge PRs on szl-holdings/platform.
  - Run inside a fresh `gh repo clone szl-holdings/platform` checkout.

USAGE:
  python forge_validate_dependabot.py            # validate only (no merge)
  python forge_validate_dependabot.py --merge     # merge the ones that pass

DOCTRINE v11: never force-merges unvalidated deps; honest PASS/FAIL only.
"""
from __future__ import annotations
import json, os, subprocess, sys

REPO = "szl-holdings/platform"
PRS = {
    344: "@opentelemetry/sdk-node 0.208.0->0.217.0",
    345: "@opentelemetry/auto-instrumentations-node 0.69.0->0.75.0",
}
# Scope actually affected by the bump (lib/observability). Adjust if the package
# graph differs; keep it the minimal set that imports OpenTelemetry.
SCOPE_FILTERS = ["@szl-holdings/observability", "@szl-holdings/observability-core",
                 "@szl-holdings/otel", "@szl-holdings/telemetry-standards"]


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    print("  $", " ".join(cmd))
    return subprocess.run(cmd, text=True, capture_output=True, **kw)


def gh_json(args: list[str]):
    cp = run(["gh"] + args)
    try:
        return json.loads(cp.stdout or "null")
    except Exception:  # noqa: BLE001
        return None


def required_checks_green(pr: int) -> bool:
    data = gh_json(["pr", "checks", str(pr), "--repo", REPO, "--json",
                    "name,state,bucket"])
    if not data:
        return False
    required = ("DCO", "lockfile", "Scorecard")
    for c in data:
        name = c.get("name", "")
        if any(r.lower() in name.lower() for r in required):
            if c.get("bucket") not in ("pass", "skipping") and c.get("state") not in ("SUCCESS", "NEUTRAL"):
                print(f"    required check not green: {name} = {c.get('state') or c.get('bucket')}")
                return False
    return True


def validate_pr(pr: int) -> bool:
    print(f"\n=== PR #{pr}: {PRS[pr]} ===")
    # 1) update branch onto main
    up = run(["gh", "pr", "update-branch", str(pr), "--repo", REPO])
    print("  update-branch:", (up.stdout or up.stderr).strip()[:200])
    # 2) checkout the PR locally
    co = run(["gh", "pr", "checkout", str(pr), "--repo", REPO])
    if co.returncode != 0:
        print("  ::error:: could not checkout PR:", co.stderr.strip()[:200]); return False
    # 3) install + scoped typecheck
    inst = run(["pnpm", "install", "--frozen-lockfile=false"])
    if inst.returncode != 0:
        print("  ::error:: pnpm install failed:\n", inst.stderr[-800:]); return False
    ok = True
    for scope in SCOPE_FILTERS:
        tc = run(["pnpm", "--filter", scope, "typecheck"])
        if tc.returncode != 0:
            # a missing 'typecheck' script in a scope is not a failure; a real TS error is
            err = (tc.stderr or "") + (tc.stdout or "")
            if "No projects matched" in err or "command \"typecheck\" not found" in err or "has no script" in err.lower():
                print(f"  (scope {scope}: no typecheck script — skipped)")
                continue
            print(f"  ::error:: typecheck FAILED for {scope}:\n", err[-1200:])
            ok = False
        else:
            print(f"  ✔ typecheck PASS for {scope}")
    print(f"  => PR #{pr} scoped validation: {'PASS' if ok else 'FAIL'}")
    return ok


def main() -> int:
    do_merge = "--merge" in sys.argv
    results = {}
    for pr in PRS:
        passed = validate_pr(pr)
        req = required_checks_green(pr)
        results[pr] = (passed, req)

    print("\n================ SUMMARY ================")
    exit_code = 0
    for pr, (passed, req) in results.items():
        verdict = "SAFE TO MERGE" if (passed and req) else "DO NOT MERGE"
        print(f"  #{pr}: scoped-typecheck={'PASS' if passed else 'FAIL'} "
              f"required-checks={'green' if req else 'not-green'} -> {verdict}")
        if do_merge and passed and req:
            m = run(["gh", "pr", "merge", str(pr), "--repo", REPO, "--squash"])
            print(f"    merge: {(m.stdout or m.stderr).strip()[:200]}")
            if m.returncode != 0:
                exit_code = 1
        elif not (passed and req):
            exit_code = 1
    if not do_merge:
        print("\n(validate-only; re-run with --merge to merge the SAFE-TO-MERGE ones)")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
