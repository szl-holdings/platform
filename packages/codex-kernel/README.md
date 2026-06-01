# @workspace/codex-kernel

[![codex-kernel-verify](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/codex-kernel-verify.yml/badge.svg?branch=main)](https://github.com/stephenlutar2-hash/szl-holdings-platform/actions/workflows/codex-kernel-verify.yml)
[![release](https://img.shields.io/github/v/release/stephenlutar2-hash/szl-holdings-platform?label=release)](https://github.com/stephenlutar2-hash/szl-holdings-platform/releases)

Replay-grade governed-loop primitive. Pure TypeScript, zero runtime dependencies, browser + Node.

> The CI badge above is the live, public, third-party-runnable proof that the kernel reproduces the published Dresden + SZL bundles bit-for-bit on every commit. If it goes red, the kernel is broken — and you'd see it before I do.

## What it is

A small kernel that runs an iterative agentic loop and emits a tamper-evident audit chain:

- **Hash-chained state** — every commit's `next_state_hash = H(prev_hash || delta || next_state)`.
- **Decision receipts** — each non-trivial step records `decision_type`, `assumptions[]`, `evidence[]`, `policy_version`, and approval status.
- **Append-only proof ledger** — JSONL stream of `{ts, step, state_hash, delta_hash, receipt_id, policy_version, approval_ref}`.
- **Hard-stop validators** — `state_transition_rule`, `drift_bounds`, `evidence_provenance`, `human_gate`. Hard fails halt the loop.
- **Replay verifier** — given `initial_state + trace.jsonl`, recompute the chain and assert every transition.
- **Dresden Codex Venus reference** — canonical demo run modelling synodic-cycle drift correction as governed iteration.

## What it isn't

- Not a LLM router or planning framework. Bring your own `proposeDelta`.
- Not cryptographically tamper-resistant. The 128-bit FNV-1a chain is sufficient for replay; swap to SHA-256 in a wrapper if adversarial integrity is required.

## Standards alignment

- **EU AI Act, Article 12** — automatic record-keeping (logs) over the lifetime of the system.
- **NIST AI RMF — MEASURE & MANAGE** — traceable decisions, evidence trails, and severity-bound governance.

See `docs/codex-kernel-standards-map.md` in the repo root.

## Usage

```ts
import {
  runLoop,
  replay,
  serializeTraceJsonl,
  dresdenSteps,
  DRESDEN_INITIAL_STATE,
} from '@workspace/codex-kernel';

const result = runLoop({
  experiment_id: 'E4',
  initial_state: DRESDEN_INITIAL_STATE,
  policy_version: 'covenant-v1',
  budgets: { time_budget_ms: 5_000, step_budget: 30, retry_budget: 0 },
  loop_policy: {
    max_steps: 30,
    adaptive_depth: { enabled: false },
    entropy_regularized_exit: { enabled: false },
  },
  governance_enabled: true,
  steps: dresdenSteps(),
});

const jsonl = serializeTraceJsonl(result.trace);
const report = replay(DRESDEN_INITIAL_STATE, result.trace, result.summary.final_state_hash);
console.log(report.ok); // true
```

## Runnable CLI — payload-driven

The package ships a fully runnable, deterministic CLI driven by
`runner/payload.json`. The payload is the single source of truth for the
experiment id, governance posture, budgets, drift model, target row count,
and output paths. The same kernel exercised by the browser surfaces is
exercised here — there is no parallel implementation.

```bash
# Run the governed loop. Writes the six declared deliverables to ./output/.
pnpm --filter @workspace/codex-kernel codex:run

# Verify the recorded trace replays bit-identical to the recorded final hash.
pnpm --filter @workspace/codex-kernel codex:replay
```

Outputs (paths come from `runner/payload.json` → `platform.output_paths`):

| File | Purpose |
| --- | --- |
| `output/trace.jsonl` | One JSON event per line. The append-only contract. |
| `output/proof_ledger.jsonl` | One ledger entry per committed step. |
| `output/final_state.json` | Final state + final state hash + ledger digest. |
| `output/run_summary.json` | Status, budgets used, stop reason, replay status, ledger digest. |
| `output/decision_receipt.json` | Last receipt; full set is embedded in `trace.jsonl`. |
| `output/final_table_preview.json` | The Dresden Venus table — externally checkable surface. |
| `output/run_manifest.json` | Binds the bundle to the contract: `payload_hash`, `final_state_hash`, `ledger_digest`, and a SHA per deliverable. |

Determinism guarantees, enforced by `src/cli/run.test.ts`:

- Two independent runs produce **identical** `final_state_hash`.
- The replay verifier reports **`verdict: ATTESTED`** with
  `recomputed_final_hash == expected_final_hash`.
- The trace is parseable JSONL with one event per non-empty line.
- The ledger digest in the run summary matches the digest printed on stdout.

Output root resolution:

1. `CODEX_OUTPUT_ROOT` environment variable (used by tests for sandboxing).
2. `process.cwd()` if invoked from anywhere outside the package directory.
3. The repository root by default — so `pnpm codex:run` from anywhere
   inside the workspace lands artifacts at `<repo>/output/`.

Custom payload (e.g. for a different drift schedule):

```bash
pnpm --filter @workspace/codex-kernel codex:run path/to/my-payload.json
pnpm --filter @workspace/codex-kernel codex:replay \
  ./output/trace.jsonl ./output/final_state.json path/to/my-payload.json
```

## Governance A/B

Set `governance_enabled: false` to demote `evidence_provenance` and `human_gate` hard fails to soft fails. Every other validator still fires. This is the surface that makes "kernel on vs. kernel off" legible side-by-side.
