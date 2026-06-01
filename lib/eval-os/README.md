# Eval OS — Evaluation Orchestration System

**Version:** 1.0  
**Date:** April 25, 2026  
**Owner:** Platform Engineering  
**Zone:** Eval/Training (offline batch — never runs on production inference path)

---

## Purpose

Eval OS is the offline evaluation orchestration layer for the SZL Holdings platform. It runs benchmark suites against versioned prompts and models, records results in the Run Ledger, and gates promotion of new prompt or model versions to production.

Eval OS **does not** run on the production inference path. See `infra/INFERENCE_VS_TRAINING_BOUNDARY.md` for the enforced boundary.

---

## Architecture

```
Scenario Library (lib/eval-forge)
        │
        ▼
Eval OS Runner ──► Model Call (eval API key, relaxed budget)
        │                │
        ▼                ▼
 Score Aggregator   Cognitive Trace (lib/cognitive-observability)
        │
        ▼
Run Ledger (lib/run-ledger) ──► Registry Update (status, score)
```

---

## Eval Registry

Every evaluation suite is a registered entity with version metadata.

### Eval Suite Entry Schema

```typescript
interface EvalSuiteEntry {
  id: string;                   // e.g. "maritime-delay-suite"
  version: string;              // semver: "2.0.0"
  status: "active" | "deprecated" | "draft";
  targets: {
    promptIds: string[];        // prompt IDs under evaluation
    modelIds: string[];         // model IDs under evaluation
  };
  scenarios: string[];          // scenario IDs from eval-forge
  scorecard: {
    correctness: number;        // weight
    hallucination_resistance: number;
    policy_adherence: number;
    latency_p95_ms: number;
    evidence_completeness: number;
  };
  promotion_threshold: number;  // overall score required to promote
  last_run_id: string;          // links to run-ledger
  last_run_score: number;
  last_run_at: string;          // ISO 8601
  created_at: string;
  created_by: string;
}
```

---

## Current Eval Suite Inventory

| ID | Version | Status | Targets | Last Score | Last Run |
|----|---------|--------|---------|-----------|---------|
| `maritime-core-suite` | 2.0.0 | active | maritime-delay-analysis, port-risk-assessment | 0.905 | 2026-04-20 |
| `aegis-triage-suite` | 1.5.0 | active | security-incident-triage, threat-intelligence-synthesis | 0.915 | 2026-04-21 |
| `terra-risk-suite` | 1.2.0 | active | property-risk-assessment, market-signal-analysis | 0.860 | 2026-04-19 |
| `lyte-decision-suite` | 3.1.0 | active | signal-fusion, recommendation-synthesis | 0.920 | 2026-04-22 |
| `counsel-legal-suite` | 1.0.0 | active | contract-clause-analysis, legal-risk-summary | 0.880 | 2026-04-18 |
| `core-policy-suite` | 2.0.0 | active | cross-domain-cascade-router, policy-gate-evaluator | 0.960 | 2026-04-23 |
| `hallucination-regression-suite` | 1.0.0 | active | hallucination-detector | 0.780 | 2026-04-24 |

---

## Running Evaluations

### Current invocation (development)

The eval runner is invoked via the arena script that already exists in the repository:

```bash
# Run the Command Arena eval (existing script)
npx tsx scripts/evals/run-arena.ts

# Results are written to generated/arena-results/arena-<timestamp>.json/.md
```

A dedicated `pnpm eval:run` CLI is planned for Phase 8. Until then, suite-specific evaluations are invoked by passing suite parameters directly to the arena runner or by running scenario files in `evals/scenarios/`.

### Scheduled runs

Eval suites run on a scheduled basis via the eval runner (Azure):
- **Daily:** Core policy and hallucination regression suites
- **Weekly:** All lane-specific suites
- **On-demand:** Any time a new prompt or model version is submitted for promotion

---

## Rollback Procedure (Eval Suite)

If an eval suite produces systematically wrong scores (suite regression, not prompt regression):

1. **Identify** the last suite version with valid scoring behaviour

2. **Deactivate current suite** by updating its `status` field to `deprecated` in the registry source data above and redeploying the eval runner. A Phase 8 CLI will automate this:
   ```bash
   # Planned Phase 8 CLI (not yet available):
   # pnpm registry:eval set-status <suite-id>@<version> deprecated
   ```

3. **Activate previous suite version** by setting the previous suite version's `status` to `active` in the registry source data and redeploying:
   ```bash
   # Planned Phase 8 CLI (not yet available):
   # pnpm registry:eval set-status <suite-id>@<previous-version> active
   ```

4. **Re-run** the previous suite version against the current prompt/model set

5. **Log** the rollback in `run-ledger` and `docs/FIX_LOG.md`

6. **Investigate** why the current suite version produced invalid scores (scenario drift, harness bug, model API change)

**Expected rollback time:** < 15 minutes

---

## Promotion Gate

A prompt or model version is blocked from advancing to `active` if:
- Overall eval score < 0.85 (suite-level)
- Policy adherence < 1.00 on any scenario
- Hallucination resistance < 0.90 on any scenario
- Any scenario produces a critical policy violation

Promotion is performed by `platform-engineer` or above and is logged in `proof-chain`.

---

## Output Artifacts

Each eval run produces:
- `generated/arena-results/<run-id>/scores.json` — per-scenario scores
- `generated/arena-results/<run-id>/traces/` — full cognitive traces
- `generated/arena-results/<run-id>/summary.md` — human-readable summary
- Run ledger entry (via `lib/run-ledger`)

---

## Access Control

| Role | View Results | Run Evals | Author Suites | Promote/Rollback |
|------|-------------|-----------|---------------|-----------------|
| `exec` | ✓ | — | — | — |
| `ops` | ✓ | ✓ | — | — |
| `platform-engineer` | ✓ | ✓ | ✓ | ✓ |
| `compliance` | ✓ | — | — | — |
