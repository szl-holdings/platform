# Precision Evolution Runtime — Local Demo Mode

## What is Demo Mode?

Demo mode (`EVOLUTION_MODE=simulation`) is PER's default operating state. It
gives engineers, stakeholders, and reviewers a complete, interactive PER
experience without requiring:

- Real GPU hardware
- A live inference backend
- A training cluster
- A populated PostgreSQL database

All data is generated in-process by the simulation engine
(`packages/evolution-core/src/simulation/index.ts`).

---

## Enabling Demo Mode

Demo mode is the default. No configuration required beyond starting the API server.

```bash
# .env (or .env.local)
EVOLUTION_MODE=simulation   # default — safe to omit
EXECUTION_ENV=replit        # auto-detected on Replit
PRECISION_PROFILE=cpu_safe  # auto-detected on CPU-only host
```

---

## What Gets Simulated

| Component | Simulated Content |
|---|---|
| Candidate policies | 4 candidates: 1 active, 1 review, 1 shadow, 1 draft |
| Evaluation runs | 3 runs: 1 completed (high score), 1 completed (borderline), 1 running |
| Reward breakdowns | Full component breakdown per completed run |
| Calibration runs | 2 runs with synthetic baseline metrics |
| Drift reports | 3 reports: healthy, degraded, critical |
| Promotion queue | 1 candidate awaiting human approval |
| Audit events | 12 events across full lifecycle |
| Runtime diagnostics | cpu_safe profile, Replit environment, queue depth, job count |

All simulated records carry `simulated: true` and are clearly labelled in the
UI with an amber "SIMULATED" badge.

---

## Simulation Engine

```typescript
// packages/evolution-core/src/simulation/index.ts

export function buildSimulatedState(): SimulatedPERState {
  return {
    candidates:         generateCandidates(),
    evaluationRuns:     generateEvaluationRuns(candidates),
    rewardBreakdowns:   generateRewardBreakdowns(evaluationRuns),
    calibrationRuns:    generateCalibrationRuns(candidates),
    driftReports:       generateDriftReports(candidates),
    promotionQueue:     generatePromotionQueue(candidates),
    runtimeDiagnostics: generateDiagnostics(),
    generatedAt:        new Date().toISOString(),
  };
}
```

The state is regenerated on each API call to `GET /api/evolution/simulation`,
so refreshing the UI always reflects the current system configuration.

---

## Switching to Live Mode

When a real inference backend is available:

```env
EVOLUTION_MODE=live
INFERENCE_BACKEND=nvidia_remote
REMOTE_INFERENCE_URL=https://your-gpu-cluster/v1
REMOTE_INFERENCE_HEALTH_URL=https://your-gpu-cluster/health
NVIDIA_API_KEY=your_key_here
PROMOTION_MODE=manual_review  # keep manual review on first live run
```

In live mode:
- API endpoints call real adapters instead of the simulation engine
- DB reads and writes to PostgreSQL PER tables
- Simulated badge is not shown in UI
- All promotion decisions are recorded as non-simulated audit events

---

## Running the Demo Locally

```bash
# 1. Install dependencies
pnpm install

# 2. Start API server (demo mode is default)
pnpm --filter @szl-holdings/api-server dev

# 3. Start Command UI
pnpm --filter @szl-holdings/command dev

# 4. Navigate to:
#    http://localhost:PORT/command/evolution
```

---

## Key Demo Talking Points

1. **Precision honesty** — The `cpu_safe` profile badge is always visible. PER
   never claims GPU acceleration it cannot detect.

2. **Evidence gating** — The Governance Console shows real blocker/passer lists,
   not just green lights.

3. **Human-in-the-loop** — The approval queue surfaces candidates awaiting sign-off
   with action buttons (non-functional in simulation, wired in live mode).

4. **Drift guard** — The drift report table shows a `critical` entry and the rollback
   action it would trigger.

5. **Simulation labelling** — Every screen, every record is transparently labelled.
   There is no ambiguity about what is real vs. synthetic.
