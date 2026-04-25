# Inference vs Training/Eval — Workload Boundary

**Version:** 1.0  
**Date:** April 25, 2026  
**Owner:** Platform Engineering  
**Status:** Authoritative

---

## Purpose

This document defines the hard boundary between **live inference paths** and **training/evaluation workloads** in the SZL Holdings platform. Mixing these paths is a reliability, cost, and audit-integrity risk. This boundary is enforced in code, in deployment configuration, and in access policy.

---

## Conceptual Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│  LIVE INFERENCE (production path)                               │
│  ─────────────────────────────                                  │
│  User request → API Server → Model call (versioned prompt) →    │
│  Policy gate → Proof chain entry → Response                     │
│                                                                 │
│  SLA: p95 < 2s  ·  Cost budget: metered per tenant             │
│  Governed by: Covenant Policy Engine                            │
│  Audited by: proof-chain (append-only)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │  ← HARD BOUNDARY — no cross-call →
┌───────────────────────────▼─────────────────────────────────────┐
│  TRAINING / EVAL / BATCH JOBS (offline path)                    │
│  ────────────────────────────────────────                       │
│  Scheduled job → eval-os runner → benchmark suite →            │
│  Score storage → Registry update (version bump)                 │
│                                                                 │
│  SLA: best-effort  ·  Cost budget: capped batch allowance       │
│  Governed by: eval-os + run-ledger                             │
│  Audited by: run-ledger (append-only eval records)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Boundary Enforcement Rules

### 1. No Training Calls in Production Request Paths

**Rule:** Any function that makes a model call for training, fine-tuning, or bulk evaluation **must not** be imported or invoked from within:
- `artifacts/api-server/src/routes/`
- `artifacts/api-server/src/middlewares/`
- Any `lib/*/src/` module that is loaded on the production request path

**Enforcement:** Code review gate. Any PR importing `lib/eval-os`, `lib/run-ledger`, or `lib/aef-evals` from a production route requires explicit sign-off from Platform Engineering.

### 2. Separate Environment Variables

| Variable | Inference Path | Eval/Training Path |
|----------|---------------|-------------------|
| `OPENAI_API_KEY` | Runtime secret (Replit/Key Vault) | Separate eval key with lower rate limit |
| `ANTHROPIC_API_KEY` | Runtime secret | Separate eval key |
| `MODEL_TIMEOUT_MS` | 8000 (strict) | 120000 (relaxed) |
| `COST_BUDGET_CENTS_PER_CALL` | 5 (enforced) | 100 (relaxed, monitored) |
| `RUN_MODE` | `inference` | `eval` or `training` |

The `RUN_MODE` environment variable is checked by `lib/policy-engine` before any model call. A `RUN_MODE=eval` call routed to a production endpoint is rejected with HTTP 403.

### 3. Separate Azure Resources

| Resource | Inference | Eval/Training |
|----------|-----------|---------------|
| App Service | `szl-api-prod` | `szl-eval-runner` (separate plan) |
| Key Vault | `kv-szl-prod` | `kv-szl-eval` |
| Log workspace | `log-szl-prod` | `log-szl-eval` |
| Cost alert | $200/month ceiling | $50/month ceiling (separate budget) |

Eval runner is not exposed via public DNS. It receives jobs only from the internal job queue (Azure Service Bus).

### 4. Deployment Configuration

```bicep
// infra/modules/eval-runner.bicep
resource evalAppService 'Microsoft.Web/sites@2022-03-01' = {
  name: 'szl-eval-runner'
  properties: {
    serverFarmId: evalPlanId  // SEPARATE App Service Plan from production
    siteConfig: {
      appSettings: [
        { name: 'RUN_MODE', value: 'eval' }
        { name: 'NODE_ENV', value: 'production' }
        { name: 'ALLOW_INFERENCE_ROUTES', value: 'false' }
      ]
    }
  }
}
```

The `ALLOW_INFERENCE_ROUTES=false` flag causes `lib/policy-engine` to reject any live-inference-style request routed to the eval runner.

### 5. Network Isolation

- Inference path (API Server): exposed via Azure Front Door → public internet
- Eval/training runner: accessible only from Azure Service Bus (internal VNET) — no public endpoint

---

## Code-Level Boundary Markers

All eval and training entry points are marked with a module guard:

```typescript
// lib/eval-os/src/runner.ts — example guard
if (process.env.RUN_MODE === 'inference') {
  throw new Error(
    '[eval-os] This module must not run in inference mode. ' +
    'Set RUN_MODE=eval for evaluation workloads.'
  );
}
```

The production `api-server` never sets `RUN_MODE=eval`. The eval runner never sets `RUN_MODE=inference`.

---

## Packages in Each Zone

### Inference Zone (production request path)

| Package | Role |
|---------|------|
| `lib/policy-engine` | Policy evaluation for every AI call |
| `lib/proof-chain` | Append-only audit of every decision |
| `lib/decision-engine` | Signal → recommendation pipeline |
| `lib/covenant-policy` | Approval gate evaluation |
| `lib/observability` | Request tracing (OpenTelemetry) |
| `lib/prompt-registry` | Version-pinned prompt resolution (read-only) |

### Eval/Training Zone (offline batch path)

| Package | Role |
|---------|------|
| `lib/eval-os` | Eval orchestration and scenario runner |
| `lib/aef-evals` | Benchmarks for the Agentic Execution Framework |
| `lib/run-ledger` | Append-only log of every eval run |
| `lib/eval-forge` | Scenario authoring and harness builder |
| `lib/cognitive-observability` | Eval-time cognitive trace capture |
| `lib/pulse-evals` | LUMINA briefing quality evaluations |

---

## Rollback Procedure for Eval Contamination

If an eval workload is detected running on the production inference path:

1. **Immediately** set `ALLOW_INFERENCE_ROUTES=false` on the affected App Service (restarts in < 30s)
2. Review `proof-chain` logs for any eval-mode records mixed into production audit trail
3. Quarantine the affected run-ledger entries (mark `contaminated: true`)
4. Investigate the deployment pipeline to determine how the boundary was broken
5. File an incident in `INCIDENT_RESPONSE.md` (Severity 2 minimum)
6. Restore from last known clean deployment checkpoint

---

## Review Cadence

This boundary document is reviewed:
- After every significant model or infrastructure change
- Quarterly as part of the Ops Hardening review
- Immediately after any P0/P1 incident involving AI cost overruns or latency spikes

**Next scheduled review:** July 25, 2026
