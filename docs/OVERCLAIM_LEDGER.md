# Overclaim Ledger

**Status:** Evidence-backed snapshot

**Actions audit observed:** 2026-07-25

**Machine-readable source:** [`overclaim-ledger.json`](overclaim-ledger.json)

## Public metric

| Metric | Verified value | Definition |
| --- | ---: | --- |
| Overclaims caught by CI | **1** | Unique claim incidents rejected by a completed CI policy check |
| Mean time to correction | **10h 51m 38s** | Mean from the first policy finding to the correcting commit |

Repeated runs for one unchanged claim count as one incident. Workflow setup
failures do not count as claim findings. Live-probe incidents are recorded
separately and do not inflate the CI metric.

## CI-detected incidents

### OC-2026-001 — Lambda uniqueness qualification

| Field | Evidence |
| --- | --- |
| Claim caught | `Lambda trust aggregator — unconditional uniqueness` described as `Conjecture 1 (conditional proven axiom-free)` |
| Truth | Unconditional Lambda uniqueness is **Conjecture 1 — OPEN**. **Theorem U** is the proved conditional result: uniqueness modulo approximately-Lambda under IA, and strict uniqueness only under Anchored or Normalized assumptions. |
| First detection | 2026-06-30 15:31:27 UTC |
| First failed policy run | [Doctrine Overclaim Guard run 28456207537](https://github.com/szl-holdings/platform/actions/runs/28456207537) |
| Repeated runs | [28488223279](https://github.com/szl-holdings/platform/actions/runs/28488223279), [28488225463](https://github.com/szl-holdings/platform/actions/runs/28488225463), [28488227827](https://github.com/szl-holdings/platform/actions/runs/28488227827) |
| Correction | [Commit e4ca900](https://github.com/szl-holdings/platform/commit/e4ca9006d905748670496908a2223f12f61cbe7e) |
| Corrected | 2026-07-01 02:23:05 UTC |
| Time to correction | **10h 51m 38s** |

The four failed runs exposed the same unchanged README line, so the ledger
records one incident rather than four.

## Related incident that was not caught by the guard

### OC-2026-R0-SOVEREIGN — stale sovereign deployment label

The Actions run titled `R0 URGENT — a11oy.net sovereign OVERCLAIM half-state`
inherited its title from [operations commit
297b855](https://github.com/szl-holdings/platform/commit/297b855a682c543c1f920459d649f0de694fd075).
That commit records a live probe showing `sovereign:true` and
`self-hosted-gpu` while key resolution and two governed turns used the Hugging
Face router.

This is a real overclaim incident, but it is **not** a CI-detected incident:

- the [Doctrine Overclaim Guard
  run](https://github.com/szl-holdings/platform/actions/runs/27455147544)
  concluded **success**;
- the separately failing [CI
  run](https://github.com/szl-holdings/platform/actions/runs/27455147459)
  stopped during typecheck after a runner shutdown, not an overclaim finding;
  and
- live correction was recorded by [commit
  5a5f535](https://github.com/szl-holdings/platform/commit/5a5f5352fc1111b591bc860a4c16b7db3a020f23)
  at 2026-06-13 05:27:59 UTC, **2h 02m 57s** after the evidence commit.

It remains in this ledger as a related live-probe incident so public material
does not misdescribe a commit title as a policy-gate detection.

## Audit boundary

The 2026-07-25 Actions audit found 15 failed Doctrine Overclaim Guard workflow
runs: four contained a completed policy finding, all for OC-2026-001; eleven
ended without completed policy-rule output and are excluded. This ledger makes
no claim that older deleted logs, other repositories, or external deployment
monitors were exhaustively recoverable.

Run `node scripts/audit/validate-overclaim-ledger.js` to recompute the public
counter and correction-time metric from the machine-readable entries.
