# Security Tasks #3584–#3588 — Audit Findings

**Date:** 2026-04-30
**Auditor:** Main agent
**Scope:** Re-verify the five security tasks from the original brief against
the live `main` codebase before claiming closure.

## Result

All five tasks are **already remediated** in the current code. The
descriptions in the task queue describe the historical pre-fix state. The
fixes landed in earlier work and are still in place. No new code changes were
required for #3585, #3586, #3587, #3588. #3584 also passes (production-mode
hard-block already in place); see notes below.

## Per-task evidence

### #3585 — MCP Control Plane Exposure

**Claim in task:** Anyone could enumerate MCP servers / start sessions
without auth.

**Evidence in code:** Every endpoint in
`artifacts/api-server/src/routes/mcp-gateway.ts` has both
`authMiddleware({ required: true })` and `requireRole(...)` applied.
Verified by: `grep -nE 'router\.(get|post|patch|put|delete)|requireAuth|authMiddleware|requireRole' artifacts/api-server/src/routes/mcp-gateway.ts`.

**Status:** REMEDIATED.

### #3586 — Operational Surface Access Control (env-registry)

**Claim in task:** `/api/env-registry` exposes which secrets are configured to
unauthenticated callers in production.

**Evidence in code:** `artifacts/api-server/src/app.ts:659-683` checks
`isProduction`, then verifies an internal scoped token with
`internal:read` scope OR an authenticated session with `ops` /
`super_admin` role; otherwise returns 401/403.

**Status:** REMEDIATED.

### #3587 — Public Shared-State Mutation (action-store PATCH)

**Claim in task:** `PATCH /api/action-store` accepted unauthenticated mutation
of shared action state.

**Evidence in code:** `artifacts/api-server/src/routes/action-store.ts:241`
defines the route as
`router.patch('/action-store', requireAuth, validateBody(...), …)` with
`const requireAuth = authMiddleware({ required: true });` declared at the
top of the file (line 44).

**Status:** REMEDIATED.

### #3588 — Streaming Webhook Auth (`/stream/webhook-siem`)

**Claim in task:** `POST /stream/webhook-siem` ingested events without any
auth check.

**Evidence in code:**
`artifacts/api-server/src/routes/streaming-ingestion.ts:242-294` requires a
`Bearer` token in the `Authorization` header, compares it against
`SIEM_WEBHOOK_TOKEN` using `timingSafeEqual`, and returns 401 on missing or
invalid tokens before any `ingestEvent()` call.

**Status:** REMEDIATED.

### #3584 — Email Trust Boundary

**Claim in task:** Email webhooks accept payloads when `RESEND_WEBHOOK_SECRET`
or `SENDGRID_WEBHOOK_SECRET` is unset; startup does not block on missing
secrets in production.

**Evidence in code:**
- `artifacts/api-server/src/routes/email-webhooks.ts` validators reject the
  request when no secret is configured (no fail-open path).
- `artifacts/api-server/src/lib/startup-validation.ts:2147-2173` pushes both
  `RESEND_WEBHOOK_SECRET` and `SENDGRID_WEBHOOK_SECRET` into the `errors`
  array when `isProduction` is true and either is missing — this hard-blocks
  startup. In non-production they only push to `warnings`, which is the
  intended developer-experience tradeoff.

**Status:** REMEDIATED.

## Note on task-state bookkeeping

The five tasks were reviewed but the project-task state machine is currently
unable to transition them out of `IN_PROGRESS` from this session
(`mark_task_complete` reports "cannot report done from state MERGED" for an
adjacent task that already merged, and starting new tasks is blocked by
"Another main-track task is still active"). This document is the durable
record of the audit so the remediation evidence is not lost when the
bookkeeping is unstuck.
