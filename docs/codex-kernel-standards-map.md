# Codex-Kernel — Standards Map

This document maps the Codex-Kernel implementation (`packages/codex-kernel`) to the obligations of two reference frameworks:

- **EU AI Act** (Regulation (EU) 2024/1689), with focus on **Article 12 — Record-keeping**.
- **NIST AI Risk Management Framework 1.0**, focusing on the **MEASURE** and **MANAGE** functions.

The kernel is not a compliance program. It is a *primitive* that makes the auditability requirements of these frameworks expressible as testable code.

---

## EU AI Act — Article 12 (Record-keeping)

> "High-risk AI systems shall technically allow for the automatic recording of events ('logs') over the lifetime of the system."

| Obligation (paraphrased) | Codex-Kernel mechanism | Source |
| --- | --- | --- |
| Logs enable identification of situations that may result in the AI system presenting a risk under Article 79(1) or in substantial modification | `TraceEvent` records every step's `pipeline_stage`, `validator_results`, `proposed_delta`, and `stop_reason`; `ValidatorResult.severity` distinguishes `pass` / `soft_fail` / `hard_fail`. | `src/types.ts`, `src/kernel.ts` |
| Logs facilitate post-market monitoring | `ProofLedgerEntry` is append-only and JSONL-serializable, suitable for streaming to long-term storage. | `src/ledger.ts` |
| Logs are kept appropriate to the intended purpose, with at least: period of use; reference DB; input data; identification of natural persons involved in verification | `DecisionReceipt` carries `timestamp`, `policy_version`, `assumptions[]`, `evidence[]` (with `mocked` flag), `approval_status`, `approval_ref`. `ApprovalEvent` records `approved_by` + `approved_at`. | `src/types.ts`, `src/receipts.ts` |
| Capability to record events automatically over the lifetime of the system | `runLoop()` emits one `TraceEvent` per step unconditionally; the kernel cannot complete a non-trivial step without writing to the ledger. | `src/kernel.ts` |
| Logs must be tamper-evident sufficient to support audit | `chainHash(prev_hash, delta, next_state)` produces a 128-bit chain hash per step; `replay()` reconstructs the chain from the trace + initial state and fails on any mismatch. (Use SHA-256 wrapper for adversarial threat model.) | `src/hash.ts`, `src/replay.ts` |

**What the kernel does NOT cover from Article 12:** retention period, storage location, access control to logs, and deletion procedures. Those are deployment-time concerns layered above the kernel.

---

## NIST AI RMF 1.0 — MEASURE & MANAGE

### MEASURE 2 — Trustworthy characteristics are evaluated

| Sub-control | Codex-Kernel mechanism |
| --- | --- |
| MEASURE 2.4 — Test sets, metrics, and details about the tests are documented | `experiment_id`, `policy_version`, `budgets`, and `loop_policy` are first-class fields on `KernelConfig`; every run captures all of them in `RunSummary`. |
| MEASURE 2.5 — AI system behavior is evaluated against measurable objectives | Per-step `ValidatorResult[]` with severity; `RunSummary.{hard_stop_failures, soft_failures}` aggregates outcomes. |
| MEASURE 2.7 — AI system performance is evaluated regularly | The kernel is deterministic for a given `(initial_state, steps, policy_version)` triple, so re-running becomes the regression test. The Dresden Venus reference run is the canonical regression fixture. |
| MEASURE 2.10 — Privacy risk of the AI system is examined | `evidence_provenance` validator hard-stops if a non-trivial commit lacks documented evidence sources; `mocked: true` is surfaced to operators. |

### MEASURE 3 — Mechanisms for tracking risks are in place

| Sub-control | Codex-Kernel mechanism |
| --- | --- |
| MEASURE 3.1 — Approaches and metrics for risk identification are followed | `drift_bounds` validator with explicit warning + hard thresholds; results are recorded per step. |
| MEASURE 3.2 — Risk tracking approaches are adapted for emergent risks | `governance_enabled = false` mode promotes hard fails to soft fails on the *evidence_provenance* and *human_gate* validators only — the rest still fire — so operators can A/B compare governance posture without disabling instrumentation. |

### MANAGE 2 — Strategies to maximize benefits and minimize negative impacts are planned, prepared, and implemented

| Sub-control | Codex-Kernel mechanism |
| --- | --- |
| MANAGE 2.3 — Procedures for responding to and recovering from risks are followed | `StopReason ∈ {validator_hard_stop, human_gate_required, budget_exhausted, …}` documents the precise reason for halt; the trace lets operators rewind to the offending step. |
| MANAGE 2.4 — Mechanisms are in place and applied to override, disengage, or deactivate AI systems | `human_gate` validator + `KernelConfig.resolveApproval` callback; an unresolved approval is a hard stop. |

### MANAGE 4 — Risks and benefits are documented and monitored regularly

| Sub-control | Codex-Kernel mechanism |
| --- | --- |
| MANAGE 4.1 — Post-deployment AI system monitoring plans are implemented | The proof ledger is the monitoring substrate: each entry pins a `state_hash` to a `policy_version` and `approval_ref`. |
| MANAGE 4.3 — Mechanisms are in place to track and respond to adverse incidents | A hard-fail trace event is the incident; `ReplayReport.failure_reason` is the postmortem starting point. |

---

## Visible surfaces

The kernel's adherence to these frameworks is made operator-visible in three places in this monorepo:

| Surface | Artifact | Page | Purpose |
| --- | --- | --- | --- |
| Kernel runtime | Amaru / Conduit | `/codex-loop` | Execute the Dresden Venus reference loop in two governance postures (ON / OFF) and inspect every trace event + receipt. |
| Auditor verification | Sentra | `/replay-attestation` | Paste a `trace.jsonl` + `initial_state.json` and Sentra recomputes the chain step-by-step. Tamper detection demonstrated by a one-click bundle. |
| Policy & receipts library | A11oy | `/codex-receipts` | Show the receipt schema as live code, the validator policy, and a live sample of receipts from a governed run. |

---

## Boundaries — what this does not address

- **Cryptographic tamper-resistance against motivated adversaries.** The 128-bit FNV-1a chain hash is sufficient for replay verification but not for non-repudiation. Wrap with SHA-256 or Ed25519 signatures if your threat model requires it.
- **Distributed consensus.** The ledger is single-writer in-memory; persistence and multi-writer coordination are upstream concerns.
- **Model evaluation.** The kernel records governance, not predictive performance. Use it alongside (not instead of) a model evaluation harness.
- **Data subject rights.** Article 12 logging is distinct from GDPR Article 15/17; the kernel makes no provision for selective erasure of past trace events (which would, by design, break the chain).
