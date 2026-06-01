# OWASP API Security Top 10 — Gap Map

Last updated: 2026-04-16

## Assessment Overview

Practical assessment against OWASP API Security Top 10 (2023 edition) for the `szl-api-server`.

| Risk | Status | Confidence |
|------|--------|-----------|
| API1: Broken Object Level Authorization | Mitigated | High |
| API2: Broken Authentication | Mitigated | High |
| API3: Broken Object Property Level Authorization | Partial | Medium |
| API4: Unrestricted Resource Consumption | Mitigated | High |
| API5: Broken Function Level Authorization | Mitigated | High |
| API6: Unrestricted Access to Sensitive Business Flows | Partial | Medium |
| API7: Server-Side Request Forgery | Low Risk | High |
| API8: Security Misconfiguration | Mitigated | High |
| API9: Improper Inventory Management | Partial | Medium |
| API10: Unsafe Consumption of APIs | Mitigated | High |

---

## Detailed Assessment

### API1: Broken Object Level Authorization — MITIGATED

**Controls in place**:
- All database queries are org-scoped via `callerOrgIds()` helper in `lib/auth.ts`
- `inArray(table.orgId, orgIds)` guard applied at the query layer
- CORTEX approve/dismiss routes hardened with explicit BOLA guard (task #536)
- `tenantScopeMiddleware` enforces org context on all authenticated routes

**Remaining risk**: Minor — verify all new routes added in future are org-scoped by default.

**Action**: Add a linting rule or review checklist item for "new route must include org-scope guard."

---

### API2: Broken Authentication — MITIGATED

**Controls in place**:
- Rate-limited auth endpoints: 10 req/15m sliding window per IP
- OIDC/PKCE authentication flow (Replit Auth)
- Bearer tokens validated on every request
- Session expiry: 24h with rolling refresh
- Password validation with complexity requirements
- `global-auth-enforcer.ts` ensures no route accidentally bypasses auth

**Remaining risk**: Low — MFA not yet supported for admin users (on roadmap).

---

### API3: Broken Object Property Level Authorization — PARTIAL

**Issue**: Some API responses may include internal fields not intended for the calling role.

**Controls in place**:
- Role-based access control governs which operations are allowed
- Some response serializers strip internal fields

**Gap**: No systematic response serialization layer to strip fields like password hashes, internal IDs, and audit metadata from all responses.

**Action (Priority: High)**:
1. Audit all `res.json()` calls that return DB rows directly
2. Create response DTO types that explicitly list allowed fields
3. Add `zod` transform layer to strip fields on response serialization

---

### API4: Unrestricted Resource Consumption — MITIGATED

**Controls in place**:
- Global rate limiter: 200 req/15m per IP (`globalLimiter`)
- Route-specific limits: auth (10/15m), AI (20/min)
- Body size limit: 10MB (`express.json({ limit: "10mb" })`)
- Compression disabled for large payloads
- AI inference token budget controls
- Database query timeout enforcement

---

### API5: Broken Function Level Authorization — MITIGATED

**Controls in place**:
- `requireRole` middleware enforces role hierarchy on all protected routes
- `adminGuard` middleware protects `/api/admin/*` endpoints
- `globalAuthEnforcer` ensures no route skips auth by default
- Internal service calls require `x-internal-token` header
- `RequireAuth` component on frontend routes

---

### API6: Unrestricted Access to Sensitive Business Flows — PARTIAL

**Controls in place**:
- Idempotency keys enforced on billing and AI endpoints
- `requireApproval` middleware for high-stakes operations
- Approval gate enforced on financial mutations

**Gap**: Idempotency not yet extended to all financial flows (Stripe webhooks, fund operations).

**Action (Priority: High)**:
1. Audit all financial mutation endpoints for idempotency coverage
2. Add `idempotencyMiddleware` to Stripe webhook handler
3. Add rate limiting to fund operation endpoints

---

### API7: Server-Side Request Forgery — LOW RISK

**Assessment**: No user-controlled URL fetching identified in API routes.

**Controls in place**:
- No URL-fetch endpoints accepting user-supplied URLs
- External API calls (AI providers) use hardcoded endpoints

**Monitoring**: Review any future feature that fetches user-supplied URLs (e.g., webhook registration, link preview).

---

### API8: Security Misconfiguration — MITIGATED

**Controls in place**:
- Full Helmet.js suite: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- CORS: environment-specific allowlists, no wildcard in production
- Secure, HttpOnly, SameSite=Strict cookies
- No verbose error messages in production (stack traces suppressed)
- Secrets in environment variables, not codebase
- Dev fallbacks guarded by `NODE_ENV !== 'production'`

---

### API9: Improper Inventory Management — PARTIAL

**Controls in place**:
- OpenAPI spec at `/api/docs` (swagger-ui-express)
- Route groups organized by domain in `src/routes/groups/`

**Gap**: OpenAPI spec may not cover all routes — was not auto-generated from route definitions.

**Action (Priority: Medium)**:
1. Audit `/api/docs` spec against actual routes in `src/routes/`
2. Implement `tsoa` or similar to auto-generate OpenAPI spec from TypeScript types
3. Add spec coverage check to CI pipeline

---

### API10: Unsafe Consumption of APIs — MITIGATED

**Controls in place**:
- AI provider calls use the `ai-gateway.ts` abstraction layer
- `withExternalSpan` tracks external call latency
- `ai-model-observability.ts` monitors provider health
- `AbortController` enforces a 30s hard timeout on every provider `chatCompletionForProvider` call
- Per-provider circuit breaker (`ProviderCircuitBreaker` in `ai-gateway.ts`):
  - Opens after 3 consecutive failures
  - Transitions to half-open after 60s recovery window
  - Probe request on half-open: success → closed, failure → re-opens
  - Open circuit fails fast with `503 AI_PROVIDER_UNAVAILABLE` (`AiProviderUnavailableError`)
- Circuit breaker state exposed via `getCircuitBreakerMetrics()` in `ai-model-observability.ts`
- `getGatewayStatus()` includes `circuitState` per provider

**Remaining risk**: Low — circuit breaker state is in-process memory only; a multi-replica deployment would need a shared state store (Redis) for full coordination.

---

## Priority Action Matrix

| Action | Risk Addressed | Priority | Effort |
|--------|---------------|----------|--------|
| Response DTO serialization layer | API3 | High | Medium |
| Extend idempotency to all financial flows | API6 | High | Low |
| ~~Add AI provider timeout + circuit breaker~~ | API10 | ~~High~~ Done | Medium |
| OpenAPI spec auto-generation | API9 | Medium | High |
| BOLA guard linting rule | API1 | Low | Low |
