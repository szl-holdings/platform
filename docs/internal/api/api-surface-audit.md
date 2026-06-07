# API Surface Audit

> Generated: 2026-04-02
> Version: 0.2.0

## Overview

All routes are mounted under `/api`. Authentication is handled via `authMiddleware` with Bearer tokens or session cookies. Rate limiting is applied per-prefix.

---

## Rate Limiting

| Path Prefix         | Limiter         |
|---------------------|-----------------|
| `/auth`             | `authLimiter`   |
| `/billing`          | `writeLimiter`  |
| `/connectors`       | `writeLimiter`  |
| `/notifications`    | `writeLimiter`  |
| `/feature-flags`    | `writeLimiter`  |
| `/projects`         | `writeLimiter`  |
| `/files`            | `writeLimiter`  |
| `/webhooks`         | `writeLimiter`  |
| `/vessels`          | `readLimiter`   |
| `/intelligence`     | `readLimiter`   |
| `/firestorm`        | `readLimiter`   |
| `/inca`             | `readLimiter`   |
| `/msp`              | `readLimiter`   |
| `/aegis`            | `readLimiter`   |
| `/booking`          | `readLimiter`   |
| `/holdings`         | `readLimiter`   |
| `/audit`            | `readLimiter`   |
| `/contact`          | `writeLimiter`  |
| `/demo-requests`    | `writeLimiter`  |
| `/alloy`            | `readLimiter`   |
| `/ai`               | `readLimiter`   |
| ALL requests        | `globalLimiter` |

---

## Health Endpoints

| Method | Path                         | Auth     | Description                                              |
|--------|------------------------------|----------|----------------------------------------------------------|
| GET    | `/api/health`                | None     | Basic server health, memory, uptime                      |
| GET    | `/api/health/live`           | None     | Liveness probe — always 200 if process is up             |
| GET    | `/api/health/ready`          | None     | Readiness probe — checks DB connectivity                 |
| GET    | `/api/health/detailed`       | Optional | Full system health: DB, job queue, telemetry             |
| GET    | `/api/healthz`               | None     | Kubernetes-style healthz with backup status              |
| GET    | `/api/health/integrations`   | None     | All integration health checks (Stripe, HubSpot, etc.)   |
| GET    | `/api/health/ai`             | None     | AI provider status, model slots, retrieval stats         |
| GET    | `/api/health/websocket`      | None     | WebSocket server health                                  |
| GET    | `/api/health/billing`        | None     | Billing provider (Stripe) health check                   |
| GET    | `/api/health/external-feeds` | None     | External data feed reachability (AIS, NVD, FRED, etc.)  |

---

## Auth Endpoints

| Method | Path                              | Auth     | Description                         |
|--------|-----------------------------------|----------|-------------------------------------|
| POST   | `/api/auth/login`                 | None     | Token login                         |
| GET    | `/api/auth/me`                    | Required | Get current user                    |
| GET    | `/api/auth/user`                  | Optional | OIDC user envelope                  |
| GET    | `/api/auth/providers`             | None     | List auth providers                 |
| POST   | `/api/auth/sessions`              | Required | Create session token                |
| DELETE | `/api/auth/sessions/current`      | Required | Revoke current session              |
| DELETE | `/api/auth/sessions/:id`          | Required | Revoke specific session             |
| GET    | `/api/login`                      | None     | Begin browser OIDC flow             |
| GET    | `/api/callback`                   | None     | OIDC callback                       |
| GET    | `/api/logout`                     | None     | OIDC logout                         |
| POST   | `/api/mobile-auth/token-exchange` | None     | Mobile code exchange                |
| POST   | `/api/mobile-auth/logout`         | Required | Mobile logout                       |

---

## AI Engine Endpoints (`/api/ai/*`)

| Method | Path                           | Auth     | Description                                |
|--------|--------------------------------|----------|--------------------------------------------|
| GET    | `/api/ai/health`               | None     | AI provider health, model config           |
| GET    | `/api/ai/models`               | None     | Model slot registry + route config         |
| GET    | `/api/ai/tools`                | None     | Tool definitions + policy status           |
| POST   | `/api/ai/respond`              | None     | Free-form AI chat                          |
| POST   | `/api/ai/triage`               | None     | Structured triage decision                 |
| POST   | `/api/ai/extract`              | None     | Entity extraction                          |
| POST   | `/api/ai/plan`                 | None     | Action plan generation                     |
| POST   | `/api/ai/retrieve`             | None     | Hybrid retrieval from knowledge index      |
| POST   | `/api/ai/tools/preview`        | None     | Policy dry-run for a tool call             |
| POST   | `/api/ai/tools/execute`        | Required | Execute a tool (policy-gated)              |
| GET    | `/api/ai/audit`                | Required | In-memory AI decision audit log            |
| POST   | `/api/ai/evals/run`            | Required | Run eval harness                           |
| GET    | `/api/ai/evals/golden-set`     | None     | View eval golden set                       |
| POST   | `/api/ai/retrieval/ingest`     | Required | Ingest content into retrieval index        |
| GET    | `/api/ai/decision`             | Required | List Alloy structured decisions            |
| POST   | `/api/ai/decision`             | Required | Create Alloy structured decision           |
| GET    | `/api/ai/decision/:id`         | Required | Get decision by ID                         |
| POST   | `/api/ai/decision/:id/approve` | Required | Approve a pending decision                 |
| POST   | `/api/ai/decision/:id/reject`  | Required | Reject a pending decision                  |

---

## Alloy Workflow Endpoints (`/api/alloy/*`)

| Method | Path                                 | Auth          | Description                        |
|--------|--------------------------------------|---------------|------------------------------------|
| GET    | `/api/alloy/workflows`               | Required      | List workflows (org-scoped)        |
| POST   | `/api/alloy/workflows`               | ops/analyst   | Create workflow                    |
| GET    | `/api/alloy/workflows/:id`           | Required      | Get workflow                       |
| PATCH  | `/api/alloy/workflows/:id`           | ops/analyst   | Update workflow                    |
| DELETE | `/api/alloy/workflows/:id`           | ops           | Delete workflow                    |
| POST   | `/api/alloy/workflows/:id/run`       | Required      | Trigger workflow run               |
| GET    | `/api/alloy/runs/:id`                | ops/admin     | Get run                            |
| POST   | `/api/alloy/runs/:id/retry`          | ops           | Retry failed run                   |
| POST   | `/api/alloy/runs/:id/cancel`         | ops           | Cancel active run                  |
| GET    | `/api/alloy/artifacts`               | Required      | List output artifacts              |
| GET    | `/api/alloy/artifacts/:id`           | Required      | Get artifact                       |
| POST   | `/api/alloy/artifacts/:id/approve`   | compliance    | Approve artifact                   |
| POST   | `/api/alloy/artifacts/:id/reject`    | compliance    | Reject artifact                    |
| GET    | `/api/alloy/signals`                 | Required      | List signals                       |
| POST   | `/api/alloy/ingest/signal`           | Required      | Ingest single signal               |
| POST   | `/api/alloy/ingest/batch`            | ops/analyst   | Batch ingest signals               |
| GET    | `/api/alloy/approvals`               | Required      | List approvals                     |
| POST   | `/api/alloy/approvals/:id/approve`   | Required      | Approve decision                   |
| POST   | `/api/alloy/approvals/:id/reject`    | Required      | Reject decision                    |
| GET    | `/api/alloy/audit`                   | Required      | Query immutable audit log          |

---

## Nuro Mesh Endpoints (`/api/nuro-mesh/*`)

| Method | Path                               | Auth     | Description                        |
|--------|-------------------------------------|----------|------------------------------------|
| POST   | `/api/nuro-mesh/orchestrate`        | Optional | Full Nuro Mesh orchestration       |
| POST   | `/api/nuro-mesh/agent/:agentId`     | Optional | Call specific agent                |
| GET    | `/api/nuro-mesh/agents`             | None     | List agent registry                |
| GET    | `/api/nuro-mesh/routes`             | None     | View domain routing rules          |

---

## Error Response Format

All errors conform to the standard format documented in `error-contract.md`.

---

## Idempotency

- **Payment webhooks** (`/api/webhooks/stripe`, `/api/billing/*`): Idempotency enforced via `X-Idempotency-Key` header; requests with the same key within 24 hours return cached response.
- **Action execution** (`/api/ai/tools/execute`, `/api/alloy/workflows/:id/run`): Idempotency enforced via `X-Idempotency-Key` header.
- **Signal ingestion** (`/api/alloy/ingest/signal`): Idempotency enforced via `X-Idempotency-Key` header.
