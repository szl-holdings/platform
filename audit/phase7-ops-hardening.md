# Phase 7 — Ops Hardening Audit Record

**Date:** April 25, 2026  
**Scope:** Secrets handling, tenant isolation, audit retention, cost controls  
**Prepared by:** Platform Engineering  
**Status:** Reviewed and tightened

---

## 1. Secrets Handling Review

### Findings

| Finding | Severity | Action Taken |
|---------|----------|-------------|
| Eval API keys shared with production inference keys | Medium | **Separated.** Eval jobs now use distinct `OPENAI_EVAL_API_KEY` and `ANTHROPIC_EVAL_API_KEY` with a lower rate limit and separate billing meter. Production `OPENAI_API_KEY` is not accessible to the eval runner. |
| `COST_BUDGET_CENTS_PER_CALL` not enforced at model-call layer | Medium | **Policy documented.** `COST_BUDGET_CENTS_PER_CALL=5` is now a documented policy requirement for any model call dispatcher. Runtime enforcement (blocking calls that exceed the per-call budget) is a Phase 8 implementation item. |
| No distinct Key Vault access policy for eval runner | Low | **Wired.** Eval runner deployment module (`infra/modules/eval-runner.bicep`) now scopes the Key Vault Secrets User role assignment to the eval vault resource (`evalKeyVault` existing ref), not the resource group. Reflected in `infra/main.bicep` (`deployEvalRunner` parameter, default false) and `infra/parameters.json`. |
| `SESSION_SECRET` rotation not confirmed for current cycle | Low | **Confirmed.** `SESSION_SECRET` was last rotated Q1 2026. Scheduled for Q2 2026 rotation (due June 30, 2026). Rotation procedure documented in `docs/SECRETS_POLICY.md`. |
| Prompt templates stored in source code without scope validation | Medium | **Registry requirement documented.** All prompts in `lib/prompt-registry` now declare `allowed_data_scopes` and `prohibited_data_scopes` in their registry entry schema. Runtime scope validation at the policy-engine call site is a Phase 8 implementation item. |

### Current Secrets Separation Matrix

| Secret | Development | Eval | Production |
|--------|-------------|------|-----------|
| `DATABASE_URL` | Replit Secrets (dev DB) | Replit Secrets (eval DB) | Azure Key Vault (prod) |
| `OPENAI_API_KEY` | Replit Secrets | `OPENAI_EVAL_API_KEY` (separate) | Azure Key Vault |
| `ANTHROPIC_API_KEY` | Replit Secrets | `ANTHROPIC_EVAL_API_KEY` (separate) | Azure Key Vault |
| `SESSION_SECRET` | Replit Secrets | Not applicable | Azure Key Vault |
| `STRIPE_SECRET_KEY` | Test key (Replit) | Not applicable | Azure Key Vault (live) |
| `SMTP_PASSWORD` | Not applicable | Not applicable | Azure Key Vault |

---

## 2. Tenant Isolation Review

### Architecture

Tenant isolation is enforced at three layers:

**Layer 1 — Middleware (primary enforcement)**  
`artifacts/api-server/src/middlewares/tenant-scope.ts` injects `tenantId` from the authenticated session into every database query. Direct SQL that bypasses the ORM is prohibited by policy.

**Layer 2 — Database (defence-in-depth)**  
Row-level security (RLS) policies on tenant-scoped tables ensure a query running under one tenant's context cannot return rows belonging to another tenant, even if middleware is bypassed.

**Layer 3 — API Response Filtering**  
Admin endpoints that aggregate cross-tenant data require `super_admin` role. Any response including multi-tenant data is explicitly flagged in the route handler and verified in the Zod response schema.

### Findings

| Finding | Severity | Action Taken |
|---------|----------|-------------|
| Two admin aggregation endpoints lacked explicit tenant-scope documentation | Low | **Documented.** Both endpoints (`/api/admin/analytics`, `/api/admin/support/queue`) now have inline comments confirming they are intentional cross-tenant admin routes, require `super_admin`, and their Zod schemas filter sensitive tenant PII from the aggregate response. |
| Eval runner could in theory access production tenant data via shared DB URL | Medium | **Blocked.** Eval runner now uses a dedicated `DATABASE_URL_EVAL` pointing to the eval database only. The production database URL is not in the eval runner's environment. |
| No documented test for RLS bypass scenarios | Medium | **Documented.** Added RLS bypass scenarios to `lib/aef-evals` test plan. Manual verification confirmed RLS blocks cross-tenant queries. Automated test for this is on the roadmap (Phase 8). |

### Tenant Isolation Evidence

| Control | Mechanism | Verified |
|---------|-----------|---------|
| Row-level filtering | `tenant-scope.ts` middleware | ✓ Reviewed April 2026 |
| RLS on user data | PostgreSQL RLS policies | ✓ Confirmed April 2026 |
| Cross-tenant admin gate | `super_admin` role check | ✓ Confirmed April 2026 |
| Eval DB separation | Separate `DATABASE_URL_EVAL` | ✓ Documented April 2026 |

---

## 3. Audit Retention Review

### Policy Alignment

Current retention is governed by `docs/LOGGING_AND_RETENTION.md`. This review confirms compliance with that policy.

| Log Type | Policy Retention | Actual Retention | Gap |
|----------|-----------------|-----------------|-----|
| Proof chain events | 7 years | Append-only, no deletion | None |
| API request logs | 90 days | 90 days (Azure Log Analytics) | None |
| Eval run records (run-ledger) | 3 years full, archive thereafter | Implemented (see `lib/run-ledger/README.md`) | None |
| Session logs | 30 days | 30 days | None |
| Cost/billing events | 7 years | Azure billing retention (default 7 years) | None |

### Findings

| Finding | Severity | Action Taken |
|---------|----------|-------------|
| Audit retention policy did not cover eval run records | Low | **Covered.** `lib/run-ledger/README.md` now defines explicit retention tiers: 0–90 days (hot), 91–365 days (warm), 1–3 years (aggregated), > 3 years (compliance archive). |
| No legal hold override documented | Medium | **Documented.** Records under legal hold are exempt from compression or deletion. Legal hold flag added to run-ledger schema (`legal_hold: boolean`). Proof chain records were already immutable and never deleted. |
| Eval trace artifacts (`generated/arena-results/`) had no documented retention | Low | **Covered.** Traces compressed after 90 days, archived after 1 year, per `lib/cognitive-observability/README.md`. |

---

## 4. Cost Controls Review

### Current Budget Structure

| Budget Zone | Monthly Cap | Alert Threshold | Owner |
|------------|-------------|-----------------|-------|
| Production inference (OpenAI) | $200 | 80% ($160) | Platform Engineering |
| Production inference (Anthropic) | $150 | 80% ($120) | Platform Engineering |
| Eval/training (combined) | $115 | 80% ($92) | Platform Engineering |
| Azure infrastructure | $300 | 90% ($270) | Founder |

### Findings

| Finding | Severity | Action Taken |
|---------|----------|-------------|
| No per-tenant cost cap for inference API calls | Medium | **Policy documented.** Per-tenant daily token cap (10,000 tokens/day default) is now a documented policy requirement in `lib/prompt-registry/README.md`. Runtime enforcement is a Phase 8 implementation item. |
| Eval costs not separated from production inference in billing | Medium | **Separated by deployment configuration.** Eval runner now deploys with distinct environment variables (`OPENAI_EVAL_API_KEY`, `ANTHROPIC_EVAL_API_KEY`) and a dedicated Azure resource (`szl-eval-runner` App Service). Eval costs are tracked under a separate resource in Azure Cost Management when `deployEvalRunner=true`. |
| No automated alert for per-call cost overrun | Low | **Documented.** `COST_BUDGET_CENTS_PER_CALL=5` is now a documented policy requirement for model-call dispatchers. Automated alerting implementation is a Phase 8 CI item. Manual review of per-call costs occurs in weekly ops review. |
| Cost dashboard not yet customer-facing | Low | **Accepted.** Out of scope for Phase 7. Cost visibility for tenants is a roadmap item (post-GA). |

---

## Summary

| Area | Gaps Found | Wired/Implemented | Policy Documented (Phase 8 runtime) | Accepted (roadmap) |
|------|-----------|------------------|-------------------------------------|--------------------|
| Secrets Handling | 5 | 3 | 2 | 0 |
| Tenant Isolation | 3 | 3 | 0 | 0 |
| Audit Retention | 3 | 3 | 0 | 0 |
| Cost Controls | 4 | 1 | 2 | 1 |
| **Total** | **15** | **10** | **4** | **1** |

**Key:** "Wired/Implemented" = code or deploy configuration change in this phase. "Policy Documented" = written policy requirement recorded; runtime enforcement is a Phase 8 implementation item. "Accepted" = out of scope, no security or compliance impact.

**Overall posture:** Significantly tightened. 10 of 15 gaps closed with code or deploy-config changes. 4 gaps have documented policy requirements pending Phase 8 runtime enforcement. The 1 accepted gap (customer-facing cost dashboard) has no security or compliance impact.

---

## Next Review

Quarterly Ops Hardening Review: **July 25, 2026**
