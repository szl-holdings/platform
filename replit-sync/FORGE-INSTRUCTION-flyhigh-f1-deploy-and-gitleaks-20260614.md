# FORGE ORDER — Land fly-high F1 (/pnt/limits all 4 pillars) + fix Gitleaks false-positive

Issued: 2026-06-14 by CTO. Doctrine v11. PROVE-OR-DOWNGRADE. Report to AUTO_STATE.json.

## CONTEXT
PR https://github.com/szl-holdings/a11oy/pull/379 (branch `flyhigh/f1-compute-bounds`, commit b9e55c3, DCO-signed) wires all four `/pnt/limits` pillars honestly:
- compute_bounds → `szl_pinn_bounds.certify_job` (Landauer/Margolus-Levitin/Bremermann/Bekenstein, label SAMPLE·STRUCTURAL-ONLY, E DERIVED = power×time, never asserted independently).
- pnt_resilience + nav_coasting → pure-stdlib closed-form when the numpy-less HF image can't import the numpy engines (new `via` field: `engine` | `closed_form_stdlib`, so the numpy-less path is never hidden).
- quantum_sensor unchanged (MODELED).
Root cause was: (1) compute_bounds only resolved on-metal sibling `physics_bounds`; (2) pnt_resilience/nav_coasting `import numpy` at module top and the served HF web image is numpy-less → silent `wired:false`. Only the 2 changed files: `fundamental_limits.py`, `test_pnt_limits_wired.py`. 9/9 tests green incl. a subprocess-isolated numpy-less HF-image sim.

## TASK 1 — Rebase + land PR #379 (served surface — careful)
PR #379 is mergeStateStatus DIRTY / CONFLICTING because main advanced. Do:
1. `git fetch origin && git checkout flyhigh/f1-compute-bounds && git rebase origin/main`
   - Conflicts will be in `fundamental_limits.py` (pillar wiring) — resolve by KEEPING the F1 changes (all four pillars wired, the `via` field) on top of whatever main added. If main already wired compute_bounds (live `/pnt/limits` shows compute_bounds:true), keep BOTH and ensure pnt_resilience + nav_coasting end up wired:true via closed_form_stdlib. Re-run `python3 -m pytest test_pnt_limits_wired.py -q` — must be 9/9 green before continuing.
2. Force-push the rebased branch: `git push --force-with-lease origin flyhigh/f1-compute-bounds`.

## TASK 2 — Gitleaks false-positive (blocks the green check)
The `Gitleaks secret scan` job fails on a WHOLE-TREE finding (NOT in PR #379's files):
- Finding: `RuntimeAttestation, private_key: "..."` — RuleID `generic-api-key`.
- This is a **Python function PARAMETER NAME** (`private_key:` type-hinted arg) in the runtime-attestation module, NOT a real secret. Verify this yourself: `grep -rn 'private_key' --include=*.py | grep -i attest`. Confirm it is a parameter/type-hint, not an assigned credential value.
- FIX: add a scoped allowlist entry to `.gitleaks.toml` (do NOT disable the rule globally). Add a regex/path allowlist for that exact parameter-declaration line in the runtime attestation file, with a comment: `# false positive: function parameter name, not a secret — verified 2026-06-14`. Re-run gitleaks locally (`gitleaks detect --source . --no-git --config .gitleaks.toml`) → must report 0 leaks.
- Commit the `.gitleaks.toml` allowlist on the SAME branch (`-s` DCO).

## TASK 3 — Verify green, then merge + deploy
1. Confirm PR #379 checks: `guard` pass, `Gitleaks secret scan` pass, doctrine/lint pass. The heavy "Build image + SBOM" job is NOT required — may stay red if pre-existing.
2. Merge squash --admin ONLY when guard + gitleaks + doctrine + the pnt tests are green.
3. Rebuild the box + HF image from main so the served surface picks it up.
4. PROVE: `curl https://a11oy.net/api/a11oy/v1/pnt/limits` must show ALL FOUR pillars `wired:true` with honest labels (compute_bounds SAMPLE, others MODELED) and the `via` field present. Report the exact JSON in AUTO_STATE.json.

## DO NOT
- Do NOT force any pillar green. If an engine genuinely can't import, leave it wired:false with the honest MODULE_NOT_WIRED note — that is correct, not a failure.
- Do NOT touch lutar-lean. Do NOT alter the compute_bounds label away from SAMPLE·STRUCTURAL-ONLY. Do NOT assert joules independently of power×time.
- Do NOT broaden the Gitleaks allowlist beyond the one verified false-positive line.
