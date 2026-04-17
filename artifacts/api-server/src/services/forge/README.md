# Forge — AI Runtime, Agent Factory & Governed Promotion Pipeline

Forge is the governed lifecycle layer for every AI agent that runs anywhere in the
SZL Holdings platform. It owns the registry, the runtime capture pipeline, the
drift evaluator, the promotion validator, and the rollback orchestrator.

> **Tables:** 20 `forge_*` tables defined in `lib/db/src/schema/forge.ts`
> **Service:** `artifacts/api-server/src/services/forge/index.ts`
> **REST API:** `artifacts/api-server/src/routes/forge.ts` (mounted under `/forge/*`)
> **UI:** `artifacts/szl-holdings/src/pages/forge/*` (6 pages)
> **Seed:** `pnpm --filter @workspace/scripts run seed:forge` (also step 13 of `seed-demo-canonical.sh`)
> **Smoke:** `pnpm --filter @workspace/scripts run smoke:forge` (10-step end-to-end check)

## Concepts

| Object | Purpose |
| --- | --- |
| **Agent** | A versioned, named AI capability (e.g. `executive-briefer`) with risk class, owner, deployment targets. |
| **Agent Version** | Immutable snapshot binding a `model + prompt-version + tools + policy + evals + observability + provenance`. |
| **Model / Prompt / Tool / Policy Pack** | Approved, audited registries shared across agents. |
| **Environment Profile** | Tier (`dev`, `sandbox`, `staging`, `production`) with a current inventory snapshot per agent. |
| **Promotion** | Request to move an agent version from one tier to another. Validated against the 8 blocker codes. |
| **Drift Event** | Recorded delta between expected (active version) and observed (env snapshot) state. |
| **Execution Run** | A single runtime invocation captured with latency, tokens, tool calls, policy outcome, status. |
| **Audit Event** | Append-only governance trail (promote, rollback, override, drift, etc.). |

## Promotion blockers (all 8 enforced)

| Code | Trigger |
| --- | --- |
| `INVALID_TIER_TRANSITION` | Skipping a tier (e.g. dev → production). |
| `MISSING_HUMAN_APPROVAL` | Production promotion of an agent with `risk_class >= regulated` without recorded approval. |
| `EVALS_NOT_PASSED` | Version's `evals_passed` flag is false. |
| `MISSING_OBSERVABILITY` | Version's `observability_hook_configured` is false. |
| `MISSING_PROVENANCE` | Version's `provenance_complete` is false. |
| `UNAPPROVED_MODEL` | Version references a model marked `approved = false`. |
| `UNAPPROVED_TOOL` | Version references one or more tools marked `approved = false`. |
| `DRIFT_OVER_THRESHOLD` | Live drift evaluation against the target tier returns severity `high` or `critical`. |

## REST surface

```
GET    /forge/overview
GET    /forge/agents
POST   /forge/agents
GET    /forge/agents/:id
GET    /forge/agents/:id/versions
POST   /forge/agents/:id/versions
POST   /forge/agents/:id/promote
POST   /forge/agents/:id/rollback
POST   /forge/agents/:id/execute
GET    /forge/promotions
POST   /forge/promotions/:id/approve
GET    /forge/drift/events
GET    /forge/drift/summary
POST   /forge/drift/evaluate
GET    /forge/executions
GET    /forge/telemetry/summary
GET    /forge/lookups/(models|prompts|tools|policies|targets|envs)
```

All routes require an internal token (`x-internal-token` header).

## Frontend pages

`/forge/overview` · `/forge/registry` · `/forge/registry/:agentId` · `/forge/drift` · `/forge/promotions` · `/forge/telemetry`
