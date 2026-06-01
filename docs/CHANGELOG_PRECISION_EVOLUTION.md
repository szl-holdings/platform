# Precision Evolution Runtime — Changelog

## [1.0.0] — 2026-04-25

### Added

#### Core Package (`@szl-holdings/evolution-core`)

- **Capability Detector** (`capability/index.ts`)
  - Runtime precision profile detection: `cpu_safe`, `cuda_bf16`, `cuda_fp8_linear`,
    `cuda_fp8_linear_kv`, `remote_accelerated`, `future_blackwell_path`
  - Honest fallback: PRECISION_PROFILE env override validated against detected hardware
  - Remote backend health-check integration

- **Adapters** (`adapters/`)
  - `local_mock` — in-process synthetic adapter; zero dependencies; default in simulation mode
  - `local_safe` — CPU-safe inference adapter; honours `cpu_safe` profile
  - `NvidiaInferenceAdapter` — remote GPU backend adapter with health-check and retry logic

- **Reward Composer** (`reward/index.ts`)
  - Multi-component reward: task success, safety, latency, regression penalty, coverage bonus
  - Configurable component weights
  - `promotionEligible` flag + `recommendation` output (promote / review / reject / hold)

- **Drift Measurement** (`drift/index.ts`)
  - KL-divergence proxy, reward delta, latency delta
  - Overall drift score (0–1 weighted composite)
  - Status classification: `healthy` / `degraded` / `critical`

- **Governance / Promotion Gate** (`governance/index.ts`)
  - 7-point evidence gate: pass rate, reward, drift, coverage, regression, policy, human approval
  - Risk classification: `low` / `medium` / `high` / `critical`
  - `evidenceBundle` snapshot for immutable audit record

- **Calibration Engine** (`calibration/index.ts`)
  - Run types: baseline, regression, ablation, stress, precision
  - Retry logic for inconclusive outcomes
  - Baseline comparison vs. currently active policy

- **Rollout Job Manager** (`rollout/index.ts`)
  - Strategies: canary, blue_green, immediate, phased
  - Drift-guarded step progression
  - Rollback trigger (auto on critical drift; manual via API)

- **Simulation Engine** (`simulation/index.ts`)
  - `buildSimulatedState()` — full synthetic PER world (candidates, evals, rewards, drift, audit)
  - All records tagged `simulated: true`
  - Realistic lifecycle distribution across candidate states

- **Control Plane Utilities** (`utils/control-plane.ts`)
  - `parseEnvConfig()` — type-safe env var parsing with defaults and validation
  - `createControlPlaneContext()` — request-scoped context builder

#### Database Schema (`lib/db/src/schema/precision_evolution.ts`)

- `per_candidate_policies` — policy lifecycle (draft → active → archived)
- `per_evaluation_runs` — benchmark run results
- `per_evaluation_results` — per-case pass/fail details
- `per_reward_breakdowns` — component reward scores
- `per_calibration_runs` — baseline and regression calibration runs
- `per_drift_reports` — drift measurement records
- `per_promotion_decisions` — evidence-gated promotion decisions with audit bundle
- `per_rollout_jobs` — rollout lifecycle management
- `per_rollout_traces` — step-by-step rollout progression
- `per_runtime_health_snapshots` — periodic runtime diagnostics + audit events

#### API Server Routes (`/api/evolution/*`)

14 endpoints, all Zod-validated. **Current mode: simulation-only.**
All endpoints return `buildSimulatedState()` data when `EVOLUTION_MODE=simulation` (default).
Live DB wiring is deferred — see `IMPLEMENTATION_SUMMARY.md`.

| Method | Path | Description |
|---|---|---|
| GET | `/evolution/simulation` | Full simulated PER state |
| GET | `/evolution/diagnostics` | Runtime profile, device caps, config |
| GET | `/evolution/candidates` | List candidate policies |
| POST | `/evolution/candidates` | Register new candidate |
| GET | `/evolution/candidates/:id` | Candidate detail |
| POST | `/evolution/evaluate` | Trigger evaluation run |
| GET | `/evolution/evaluation/:runId` | Evaluation run detail |
| POST | `/evolution/promote` | Submit for promotion gate |
| GET | `/evolution/promotion/:decisionId` | Promotion decision detail |
| GET | `/evolution/audit` | Audit event log |
| POST | `/evolution/rollout` | Launch rollout job |
| GET | `/evolution/rollout/:jobId` | Rollout job status |
| POST | `/evolution/rollout/:jobId/rollback` | Trigger rollback |
| POST | `/evolution/activate` | Activate promoted policy |

#### Command Artifact UI (`artifacts/command/src/pages/evolution/`)

- **Runtime Overview** (`runtime-overview.tsx`)
  — Active policy card, candidate list, drift status table, runtime profile panel

- **Evaluation Console** (`evaluation-console.tsx`)
  — Run list with pass-rate bars, scorecard detail, reward breakdown with component chart

- **Governance Console** (`governance-console.tsx`)
  — Approval queue with evidence display and action buttons, audit timeline table

- **Diagnostics** (`diagnostics.tsx`)
  — Precision profile, device capabilities, throughput / latency / cache, full config grid

#### Documentation

- `docs/STATE_OF_PLATFORM_AUDIT.md` — full repo audit and module mapping
- `docs/PRECISION_EVOLUTION_ARCHITECTURE.md` — system diagram, package layout, pipeline
- `docs/RUNTIME_PROFILES.md` — profile reference and detection logic
- `docs/CALIBRATION_AND_DRIFT.md` — calibration run types and drift thresholds
- `docs/GOVERNANCE_AND_PROMOTION.md` — gate checks, risk levels, rollout strategies, audit events
- `docs/LOCAL_DEMO_MODE.md` — demo mode guide, simulation engine, switching to live
- `docs/CHANGELOG_PRECISION_EVOLUTION.md` — this file
- `docs/IMPLEMENTATION_SUMMARY.md` — cross-cutting summary for engineers

#### Configuration

- `.env.example` updated with 13 PER env vars:
  `EVOLUTION_MODE`, `EXECUTION_ENV`, `PRECISION_PROFILE`, `CALIBRATION_MODE`,
  `PROMOTION_MODE`, `INFERENCE_BACKEND`, `TRAINING_BACKEND`, `EVALUATION_BACKEND`,
  `DRIFT_GUARD`, `REMOTE_INFERENCE_HEALTH_URL`, `REMOTE_INFERENCE_URL`, `NVIDIA_API_KEY`

---

## Planned for [1.1.0]

- Real DB integration (live reads/writes replacing simulation state)
- Evaluation benchmark suite definitions in `packages/evolution-core/src/benchmarks/`
- Persistent audit log streaming to platform event bus
- Command palette deep-links to candidate detail pages
- Grafana dashboard definitions for PER runtime metrics
