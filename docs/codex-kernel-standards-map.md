# Codex-Kernel — standards alignment map

Referenced by `packages/codex-kernel/README.md`. This document records how the
Codex-Kernel governed-loop primitive maps to the two external frameworks cited
in its public release notes. The claims are alignment claims (the kernel is
architected to produce the records these frameworks require); they are not a
certification claim.

## Source of the alignment claim (Codex-Kernel v1.0.0 release body, verbatim)

> "Replay-grade governed-loop primitive for AI agents. Hash-chained state,
> decision receipts, append-only proof ledger, hard-stop validators,
> deterministic replay verifier. Aligned with EU AI Act Article 12
> (record-keeping) and NIST AI RMF."

## EU AI Act — Article 12 (record-keeping / logging)

Article 12 requires automatic recording of events (logs) over the lifetime of a
high-risk AI system, to a degree appropriate to its intended purpose.

| Article 12 requirement | Kernel mechanism | Source file |
| --- | --- | --- |
| Automatic logging over the system lifetime | Append-only proof ledger (`proof_ledger.jsonl`), one entry per committed step | `src/ledger.ts`, `src/cli/run.ts` |
| Traceability of each event | Hash-chained state: `next_state_hash = H(prev_hash \|\| delta \|\| next_state)` | `src/hash.ts`, `src/kernel.ts` |
| Recording of decisions and their basis | Decision receipts: `decision_type`, `assumptions[]`, `evidence[]`, `policy_version`, approval status | `src/receipts.ts`, `src/types.ts` |
| Tamper-evident reconstruction | Deterministic replay verifier recomputes the chain and asserts every transition | `src/replay.ts`, `src/cli/replay.ts` |
| Stable run identity | `computeTraceIdentity(inputs)` — deterministic trace id per run | `src/cli/contracts.ts` |
| Version pinning of the recorded run | `resolveVersionLineage(refs)` — git/sha/tag/version lineage in the manifest | `src/cli/contracts.ts` |

## NIST AI RMF — MEASURE & MANAGE

| RMF function | Kernel mechanism | Source file |
| --- | --- | --- |
| MEASURE — traceable, evidence-backed decisions | Receipts carry `evidence[]`; `evidence_provenance` validator enforces provenance | `src/validators.ts`, `src/receipts.ts` |
| MANAGE — severity-bound governance and hard stops | Hard-stop validators (`state_transition_rule`, `drift_bounds`, `evidence_provenance`, `human_gate`) halt the loop on failure | `src/validators.ts`, `src/kernel.ts` |
| MANAGE — secret handling and redaction | `auditSecrets(env)` — env/secret allowlist + redaction proof on every run | `src/cli/contracts.ts` |
| MANAGE — deployment binding | `resolveDeploymentContract(target)` — runtime/region/cap binding recorded in the manifest | `src/cli/contracts.ts` |

## The four operational contracts (Codex-Kernel v1.0.2)

The v1.0.2 release moved four contracts "from documentation into real code
paths." All four execute on every kernel run and emit receipts into the run
manifest (`trace_identity`, `secrets_status`, `version_lineage`,
`deployment_contract`):

1. `computeTraceIdentity(inputs)` — deterministic trace id from inputs.
2. `auditSecrets(env)` — env/secret allowlist + redaction proof.
3. `resolveVersionLineage(refs)` — git/sha/tag/version pinning.
4. `resolveDeploymentContract(target)` — runtime/region/cap binding.

## Reference run (verifiable evidence)

A complete reference run is preserved at
`szl-holdings/szl-trust/runs/E4-codex-kernel-2026-04-29/` — 12 receipts,
`mocked: false`. The kernel reproduces these published hashes bit-for-bit:

- Dresden Venus: `final_state_hash = fe20ecc47445dbd887b5b14ef26ed981`,
  `ledger_digest = 4d0a943cef5b8fa605919db38df5e8e7`.
- SZL governed-ops: `final_state_hash = ca0910f40dd2e24d9f98437242f9717c`.

The `codex-kernel-verify.yml` CI gate asserts these on every change to the
package.
