# Overclaim Ledger

**Maturity:** MEASURED

**Evidence state:** SNAPSHOT

**Observed:** 2026-07-25T23:50:00Z

**Scope:** Selected retrievable GitHub Actions and commit metadata for the
incidents listed below. This is not an exhaustive history of deleted logs,
other repositories, or external deployment monitors.

**Machine-readable sources:**
[`overclaim-ledger.json`](overclaim-ledger.json) and
[`overclaim-ledger.evidence.json`](overclaim-ledger.evidence.json)

## Public metric

| Metric | Observed value | Definition |
| --- | ---: | --- |
| Overclaims caught by CI | **1** | Unique claim incidents rejected by a completed CI policy check |
| Observed correction time | **10h 51m 38s** | First policy finding to the correcting commit for the single measured incident (`n=1`) |

This is one observed correction interval, not a statistically meaningful mean.
Repeated runs for one unchanged claim count as one incident. Workflow setup
failures and live-probe reports do not inflate the CI metric.

## CI-detected incident

### OC-2026-001 - Lambda uniqueness qualification

| Field | Evidence |
| --- | --- |
| Maturity | **MEASURED** |
| Claim caught | `Lambda trust aggregator - unconditional uniqueness` described as `Conjecture 1 (conditional proven axiom-free)` |
| Truth | Unconditional Lambda uniqueness is **Conjecture 1 - OPEN**. **Theorem U** is the proved conditional result: uniqueness modulo approximately-Lambda under IA, and strict uniqueness only under Anchored or Normalized assumptions. |
| First detection | 2026-06-30 15:31:27 UTC |
| Failed policy run | [Doctrine Overclaim Guard run 28456207537](https://github.com/szl-holdings/platform/actions/runs/28456207537) |
| Correction | [Commit e4ca900](https://github.com/szl-holdings/platform/commit/e4ca9006d905748670496908a2223f12f61cbe7e) |
| Corrected | 2026-07-01 02:23:05 UTC |
| Observed correction time | **10h 51m 38s** (`n=1`) |

The local evidence manifest pins selected GitHub metadata snapshots and their
SHA-256 digests. The validator recomputes those digests and cross-checks the
ledger against the detection and correction snapshots.

## Related report excluded from the CI metric

### OC-2026-R0-SOVEREIGN - reported stale sovereign label

**Maturity:** REPORTED

An operations commit reported `sovereign:true` and `self-hosted-gpu` while key
resolution and two governed turns used the Hugging Face router. This is
recorded as a related report, not as a CI detection:

- the [Doctrine Overclaim Guard
  run](https://github.com/szl-holdings/platform/actions/runs/27455147544)
  concluded **success**;
- the report originated in [operations commit
  297b855](https://github.com/szl-holdings/platform/commit/297b855a682c543c1f920459d649f0de694fd075);
  and
- [commit
  5a5f535](https://github.com/szl-holdings/platform/commit/5a5f5352fc1111b591bc860a4c16b7db3a020f23)
  is a candidate reconciliation record, not an independent live deployment
  verification.

Its correction state remains **OPEN_UNVERIFIED**. No correction-time metric is
computed for this report.

## Validation

Run:

```text
node scripts/audit/validate-overclaim-ledger.js
node --test scripts/audit/validate-overclaim-ledger.test.js
```

The negative tests reject a digest mismatch, a mislabeled one-sample mean, a
duration mismatch, and duplicate evidence references.
