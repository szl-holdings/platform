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
pnpm run worker:start

# Run workflow tests
pnpm test
```

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
