# SZL Holdings — Temporal Orchestration Substrate

**Version:** 1.0 (Phase 10 — Operability & Governance)  
**Authority:** Platform Engineering

---

## Overview

Temporal is used for workflows that require durability, retryability, and human-in-the-loop coordination. It is NOT used for every async operation — only where its guarantees (infinite retry, time-travel debugging, signal/query API, replay testing) provide clear value over simpler approaches.

---

## Workflow Registry

| Workflow | File | Purpose | Retry Policy | Tests |
|----------|------|---------|:---:|:---:|
| `approvalWorkflow` | `workflows/approval-workflow.ts` | Human-in-the-loop approval gates | 3x, 2s→30s | ✅ |
| `remediationWorkflow` | `workflows/remediation-workflow.ts` | Automated/semi-automated remediation chains | 3x, 5s→60s | ✅ |
| `promotionWorkflow` | `workflows/promotion-workflow.ts` | Dependency-aware service promotion | 3x, 5s→60s | ✅ |
| `evidenceCollectionWorkflow` | `workflows/evidence-collection-workflow.ts` | Incident evidence packaging | 3x, 10s→2m | ✅ |
| `ingestionSyncWorkflow` | `workflows/ingestion-sync-workflow.ts` | Long-running data ingestion (continue-as-new) | 5x, 10s→5m | ✅ |

---

## Activity Registry

| Activity | File | External System | Non-Retryable Errors |
|----------|------|----------------|:---:|
| `evaluatePolicyActivity` | `activities/approval-activities.ts` | OPA bundle REST API | `PolicyEvaluationError` |
| `requestApprovalActivity` | `activities/approval-activities.ts` | api-server (POST /api/internal/approvals) | — |
| `recordEvidenceActivity` | `activities/approval-activities.ts` | api-server (POST /api/internal/evidence) | — |
| `emitLyteVisibilityActivity` | `activities/approval-activities.ts` | api-server (POST /api/internal/lyte/events) | — (non-critical) |
| `deployServiceActivity` | `activities/approval-activities.ts` | Argo CD API | — |
| `checkServiceHealthActivity` | `activities/approval-activities.ts` | api-server (GET /api/internal/health-check) | — |

---

## Lyte Visibility

Every Temporal workflow emits visibility events to the Lyte operator surface via `emitLyteVisibilityActivity`. Event types follow the pattern:

```
<workflow-type>.<event-name>
  e.g. approval-workflow.pending
       approval-workflow.approved
       promotion-workflow.deploying
       remediation-workflow.resolved
```

The Lyte operator surface schema is defined in `observability/lyte-operator-surface.ts`.

---

## Running Temporal Locally

```bash
# Start Temporal server (dev mode — in-process, no persistence)
npx @temporalio/cli@latest server start-dev --port 7233 --ui-port 8233

# Start a worker (from platform/temporal/)
pnpm --filter @szl-holdings/temporal-tests run worker:start

# Smoke-test the worker against an ephemeral in-process Temporal server
# (no external server required — boots TestWorkflowEnvironment, registers
# workflows, drives an approvalWorkflow end-to-end, exits 0 on success):
pnpm --filter @szl-holdings/temporal-tests run worker:smoke

# Run workflow tests
pnpm test
```

### Worker registration

`worker.ts` is the source of truth for worker bootstrap. It:

1. Loads every activity module under `activities/` and exposes them via
   `buildActivityRegistry()`.
2. Bundles every workflow registered in `workflows/index.ts` (each new
   workflow MUST be re-exported there).
3. Connects to `TEMPORAL_ENDPOINT` (default `localhost:7233`) under
   `TEMPORAL_NAMESPACE` (default `default`) and polls `TEMPORAL_TASK_QUEUE`
   (default `szl-platform`).

`scripts/start-worker.ts` is the runnable long-running process and is wired
into the `api-server` artifact as the `temporal-worker` service
(`autoStart = false` — operators flip it on once a Temporal Frontend is
reachable). Connection / registration failures fail-fast with a clear
`[temporal-worker] FATAL` log line so they surface in workflow logs and
OTel-shipped logs alike.

---

## Wiring the Agent Gateway to Live OPA + Temporal

The agent gateway (`platform/agent-gateway/`) routes approval requests through
the `approvalWorkflow` defined here. Two environment variables switch it from
embedded/test mode to live mode:

```bash
# Live OPA serving the platform/policy/ bundle
export OPA_ENDPOINT=http://opa.szl-platform.svc:8181

# Live Temporal Frontend service (host:port; the SDK uses gRPC, not HTTP)
export TEMPORAL_ENDPOINT=temporal.szl-platform.svc:7233

# Optional overrides
export TEMPORAL_NAMESPACE=szl-platform           # default: "default"
export TEMPORAL_APPROVAL_TASK_QUEUE=approval-task-queue
```

The end-to-end test
`platform/temporal/tests/agent-gateway-temporal-e2e.test.ts` boots an
ephemeral Temporal server via `TestWorkflowEnvironment.createLocal()`,
points the gateway's `routeApproval` at it, and verifies that the
`approvalDecisionSignal` round trip resolves both approved and rejected
outcomes back to the gateway caller. The OPA half of the wiring is covered
by `platform/agent-gateway/tests/gateway-opa-live.test.ts`, which spawns a
real `opa` process serving `platform/policy/approval/approval-requirements.rego`
and asserts that production-targeted requests get gated through the live
bundle (with `policyDecision.evaluatedAt` taken from OPA's HTTP `Date` header).

---

## Temporal Namespace Configuration

```bash
# Create the szl-platform namespace (production)
temporal operator namespace create \
  --namespace szl-platform \
  --retention 30d \
  --description "SZL Holdings platform operational workflows"

# Create the szl-platform-dev namespace (development)
temporal operator namespace create \
  --namespace szl-platform-dev \
  --retention 3d
```

---

## Replay Testing

Workflow history can be replayed to verify determinism and catch bugs after code changes:

```bash
# Export a workflow's history from production
temporal workflow show \
  --workflow-id approval-wf-123 \
  --namespace szl-platform \
  --output json > /tmp/approval-history.json

# Replay against current workflow code
npx tsx platform/temporal/tests/replay-test.ts /tmp/approval-history.json
```

---

## Adding a New Workflow

1. Define input/output types in `types/workflow-types.ts`
2. Implement the workflow in `workflows/<name>-workflow.ts`
3. Implement required activities in `activities/<name>-activities.ts` (or extend existing)
4. Register the workflow in the worker (`platform/temporal/worker.ts`)
5. Write tests in `tests/<name>-workflow.test.ts` — minimum: happy path + 1 failure path
6. Emit Lyte visibility events at start, on progress, and at completion
7. Record evidence at initiation and completion via `recordEvidenceActivity`
8. Update this README

---

## Design Principles

- **Durability over simplicity** — use Temporal when the operation cannot be safely retried by the caller (e.g. deploys, approvals, DB migrations)
- **Evidence everywhere** — every consequential workflow action records an evidence ledger entry
- **Lyte visibility always** — the operator must be able to see every running workflow in the Lyte surface
- **Non-bypassable policy** — OPA is evaluated before any policy-gated action; policy denials return early with full evidence
- **Continue-as-new for long-running** — ingestion and sync workflows must use continue-as-new to prevent history bloat
