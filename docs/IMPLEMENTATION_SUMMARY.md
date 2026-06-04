# Precision Evolution Runtime — Implementation Summary

> For engineers picking up PER development after the initial build.

## What Was Built

The Precision Evolution Runtime (PER) is a complete, simulation-mode-first
governed AI policy evolution system for the SZL Holdings monorepo. It covers
the full lifecycle from candidate registration through calibration, evaluation,
governance gating, rollout, and audit.

---

## What Is Complete

| Area | Status | Location |
|---|---|---|
| DB schema (10 tables) | Complete | `lib/db/src/schema/precision_evolution.ts` |
| Evolution-core package | Complete | `packages/evolution-core/` |
| Capability detector | Complete | `packages/evolution-core/src/capability/` |
| Adapters (mock, safe, nvidia) | Complete | `packages/evolution-core/src/adapters/` |
| Reward composer | Complete | `packages/evolution-core/src/reward/` |
| Drift measurement | Complete | `packages/evolution-core/src/drift/` |
| Governance / promotion gate | Complete | `packages/evolution-core/src/governance/` |
| Calibration engine | Complete | `packages/evolution-core/src/calibration/` |
| Rollout job manager | Complete | `packages/evolution-core/src/rollout/` |
| Simulation engine | Complete | `packages/evolution-core/src/simulation/` |
| Control-plane utilities | Complete | `packages/evolution-core/src/utils/` |
| API routes (19 endpoints) | Complete | `artifacts/api-server/src/routes/evolution.ts` |
| Runtime Overview UI | Complete | `artifacts/command/src/pages/evolution/runtime-overview.tsx` |
| Evaluation Console UI | Complete | `artifacts/command/src/pages/evolution/evaluation-console.tsx` |
| Governance Console UI | Complete | `artifacts/command/src/pages/evolution/governance-console.tsx` |
| Diagnostics UI | Complete | `artifacts/command/src/pages/evolution/diagnostics.tsx` |
| Command App.tsx routes | Complete | `/evolution`, `/evolution/evaluation`, `/evolution/governance`, `/evolution/diagnostics` |
| Unified Layout nav section | Complete | "Precision Evolution Runtime" section in OPERATIONS_NAV |
| Command palette entries | Complete | 4 entries under group "Evolution" |
| .env.example PER vars | Complete | 13 new vars with documentation |
| Unit tests | Complete | `packages/evolution-core/src/__tests__/` |
| Architecture doc | Complete | `docs/PRECISION_EVOLUTION_ARCHITECTURE.md` |
| Runtime profiles doc | Complete | `docs/RUNTIME_PROFILES.md` |
| Calibration & drift doc | Complete | `docs/CALIBRATION_AND_DRIFT.md` |
| Governance & promotion doc | Complete | `docs/GOVERNANCE_AND_PROMOTION.md` |
| Local demo mode doc | Complete | `docs/LOCAL_DEMO_MODE.md` |
| Changelog | Complete | `docs/CHANGELOG_PRECISION_EVOLUTION.md` |
| Implementation summary | Complete | `docs/IMPLEMENTATION_SUMMARY.md` (this file) |

---

## Live-Mode Architecture (EVOLUTION_MODE=live)

Set `EVOLUTION_MODE=live` to switch from simulation to real DB writes.
All 19 endpoints branch on `IS_SIMULATION`:

| Endpoint | Live behaviour |
|---|---|
| `GET /evolution/candidates` | Reads `per_candidate_policies` table |
| `POST /evolution/candidates` | Inserts into `per_candidate_policies` |
| `GET /evolution/candidates/:id` | Single-row lookup by `candidate_id` |
| `POST /evolution/candidates/:id/evaluate` | Inserts into `per_evaluation_runs` |
| `GET /evolution/evaluations` | Lists all evaluation runs from DB |
| `GET /evolution/scorecards/:runId` | Returns real row from `per_evaluation_runs` |
| `GET /evolution/drift/:candidateId` | Reads `per_drift_reports` table |
| `POST /evolution/candidates/:id/promote` | Runs real promotion gate (reward + drift + coverage + rollback) → inserts `per_promotion_decisions` + writes audit-chain event |
| `POST /evolution/candidates/:id/approve` | Updates decision outcome + writes audit-chain event |
| `POST /evolution/candidates/:id/reject` | Updates decision outcome + writes audit-chain event |
| `POST /evolution/candidates/:id/activate` | Requires approved decision → sets state=active + writes audit-chain event (riskLevel: critical) |
| `POST /evolution/candidates/:id/rollback` | Sets state=rolled_back + writes audit-chain event |
| `GET /evolution/promotions` | Lists all promotion decisions from DB |
| `GET /evolution/audit` | Combines candidates + decisions + health snapshots |
| `POST /evolution/candidates/:id/rollout` | Inserts into `per_rollout_jobs` |
| `GET /evolution/diagnostics` | Real capability detection + health snapshot |

## Governance Gate (Live Mode)

Every `/promote` request must pass all of the following before a decision is created:

1. **Evaluation run**: A completed evaluation run must exist for the candidate
2. **Reward threshold**: `avg_score_total ≥ PER_MIN_PROMOTE_SCORE` (default 0.72)
3. **Coverage**: Pass rate ≥ 80% of test cases
4. **Drift**: No `critical` drift severity when `DRIFT_GUARD=true` (default)
5. **Rollback path**: Verified via state-machine contract
6. **Human approval**: All transitions to `active` require an approved promotion decision

If any criterion fails, the endpoint returns HTTP 422 with a `blockers[]` array.

## Audit-Chain Integration

The following lifecycle events write immutable records to `audit_chain_events`
via SHA-256 hash chaining (Genesis → ... → tail):

| Event | Risk Level |
|---|---|
| `promotion_requested` | high |
| `promotion_approved` | high |
| `promotion_rejected` | medium |
| `policy_activated` | critical |
| `policy_rolled_back` | critical |

## API Contract Types (api-zod)

PER Zod schemas and inferred TypeScript types are exported from
`@szl-holdings/api-zod` via `lib/api-zod/src/per.ts`:

- `RegisterCandidateRequestSchema` / `RegisterCandidateRequest`
- `PromotionRequestSchema` / `PromotionRequest`
- `ApproveRejectRequestSchema` / `ApproveRejectRequest`
- `PerCandidateSchema` / `PerCandidate`
- `PerEvaluationRunSchema` / `PerEvaluationRun`
- `PerPromotionDecisionSchema` / `PerPromotionDecision`
- `PerDiagnosticsSchema` / `PerDiagnostics`
- `PerGateResultSchema` / `PerGateResult`
- `PerAuditEventSchema` / `PerAuditEvent`
- `PerGateBlockedResponseSchema` / `PerGateBlockedResponse`

## UI Pages — Live / Simulated Distinction

All three PER UI pages now call live endpoints and display a **LIVE** or **SIMULATED**
badge based on the `simulated` field in the API response:

| Page | Primary Endpoints |
|---|---|
| Runtime Overview | `GET /evolution/candidates`, `GET /evolution/diagnostics` |
| Evaluation Console | `GET /evolution/candidates`, `GET /evolution/evaluations` |
| Governance Console | `GET /evolution/candidates`, `GET /evolution/promotions`, `GET /evolution/audit` |

In live mode the Governance Console Approve/Reject buttons call `POST /evolution/candidates/:id/approve`
with the real DB decision. In simulation mode they are disabled with an explanatory label.
| Real evaluation benchmarks | Not defined | Define `BenchmarkSuite` specs in `packages/evolution-core/src/benchmarks/` |
| NvidiaInferenceAdapter live test | Not validated | Requires `REMOTE_INFERENCE_HEALTH_URL` + `NVIDIA_API_KEY` |
| E2E browser tests | Not written | Add Playwright tests for 4 evolution pages |
| Grafana / metrics export | Not wired | Export PER runtime metrics to observability stack |
| Mobile surface | Not built | No PER pages in `szl-holdings-mobile` |

The DB schema is complete. The package business logic is complete. The API route
structure and validation are complete. The gap is that live-mode code paths
call the simulation engine rather than the DB until wiring tasks are done.

---

## Key Design Decisions

### Simulation-First

PER defaults to `EVOLUTION_MODE=simulation`. This was a deliberate choice to
allow full development, demo, and CI use without any GPU or inference backend.
The simulation engine generates realistic synthetic data that exercises every
code path in the system.

### Honest Precision Profiles

The capability detector never claims acceleration it cannot verify. This is
different from the pattern of silently falling back — PER logs its selection
reasoning and surfaces it in the Diagnostics UI.

### Evidence Gating

Promotion is not a single pass/fail flag. It records a full evidence bundle
(eval results, reward components, drift scores, governance check results,
human approval record) at decision time. This bundle is immutable once written.

### Human-in-the-Loop Default

`PROMOTION_MODE=manual_review` requires every promotion to pass through a human
approval queue, regardless of automated gate results. This is the safe default
for production and is wired to the Governance Console UI.

---

## How to Continue Development

### Adding a Real Inference Backend

1. Set `INFERENCE_BACKEND=nvidia_remote` and populate `REMOTE_INFERENCE_URL`
2. Implement the call in `NvidiaInferenceAdapter.runInference()`
3. Change `EVOLUTION_MODE=live` to bypass the simulation engine

### Wiring Live DB Queries

The Drizzle schema is complete. Replace the simulation engine calls in
`artifacts/api-server/src/routes/evolution.ts` with real `db.select()` /
`db.insert()` calls using the `@szl-holdings/db` package.

### Adding a New Evaluation Benchmark

Create a benchmark definition object in
`packages/evolution-core/src/benchmarks/` conforming to:

```typescript
interface BenchmarkSuite {
  suiteId: string;
  name: string;
  domains: string[];
  cases: BenchmarkCase[];
}
```

Then reference it in the evaluation engine to populate `per_evaluation_results`.

---

## Running Locally

```bash
pnpm install
pnpm --filter @szl-holdings/api-server dev    # default port from PORT env var
pnpm --filter @szl-holdings/command dev       # Command UI

# Navigate to: http://localhost:<PORT>/command/evolution
```

All 4 PER pages are available immediately in simulation mode with no additional
configuration required.
