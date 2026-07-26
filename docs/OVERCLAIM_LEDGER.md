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
| Correction state | **RESOLVED** |
| Claim caught | Lambda trust aggregator - unconditional uniqueness: Conjecture 1 (conditional proven axiom-free). |
| Truth | Unconditional Lambda uniqueness is Conjecture 1 and remains OPEN; Theorem U is the proved conditional result, modulo approximately-Lambda under IA, with strict uniqueness only under Anchored or Normalized assumptions. |
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

| Field | Evidence |
| --- | --- |
| Maturity | **REPORTED** |
| Correction state | **OPEN_UNVERIFIED** |
| Claim reported | a11oy.net reportedly declared sovereign self-hosted GPU inference while governed turns used the Hugging Face router. |
| Truth | The cited operations note reports a stale deployment, a sleeping GPU node, and two governed turns served by the Hugging Face router. |
| Observed | 2026-06-13 03:25:02 UTC |
| Operations report | [Commit 297b855](https://github.com/szl-holdings/platform/commit/297b855a682c543c1f920459d649f0de694fd075) |
| Overclaim guard | [Run 27455147544](https://github.com/szl-holdings/platform/actions/runs/27455147544) - **success** |
| Candidate reconciliation | [Commit 5a5f535](https://github.com/szl-holdings/platform/commit/5a5f5352fc1111b591bc860a4c16b7db3a020f23) |
| Counted in CI metric | **No** |

**Exclusion reason:** The incident was reported by an operations note, not detected by the CI policy gate. The named guard run passed. The later reconciliation commit is not an independent live verification of deployment state.

No correction-time metric is computed for this report.

## Validation

Run:

```text
node scripts/audit/validate-overclaim-ledger.js
node --test scripts/audit/validate-overclaim-ledger.test.js
```

The negative tests reject digest and contract drift, misleading metrics,
duplicate evidence, and divergence between the machine ledger and either
public incident section.
