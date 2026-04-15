# OWASP API Security Top 10 Gap Map

Generated: 2026-04-15

## Assessment

| Risk | Status | Notes |
|------|--------|-------|
| API1: Broken Object Level Auth | **Mitigated** | Org-scoped queries via callerOrgIds() + inArray guard; CORTEX approve/dismiss routes hardened (task #536) |
| API2: Broken Authentication | **Mitigated** | Rate-limited auth endpoints (10/15m sliding), session management, password validation |
| API3: Broken Object Property Level Auth | **Partial** | Need to verify all response serializers exclude sensitive fields |
| API4: Unrestricted Resource Consumption | **Mitigated** | Global rate limiter (200/15m), route-specific limits, body size limit (10MB) |
| API5: Broken Function Level Auth | **Mitigated** | requireRole middleware with hierarchy, RequireAuth on frontend routes |
| API6: Unrestricted Access to Sensitive Business Flows | **Partial** | Idempotency on billing/AI; need to extend to all financial flows |
| API7: Server-Side Request Forgery | **Low Risk** | No user-controlled URL fetching identified in API routes |
| API8: Security Misconfiguration | **Mitigated** | Helmet headers, CORS by env, secure cookies, no verbose errors in prod |
| API9: Improper Inventory Management | **Partial** | API docs exist (/api/docs) but may not cover all routes |
| API10: Unsafe Consumption of APIs | **Partial** | AI provider calls lack timeout enforcement; need retry/circuit breaker |

## Priority Actions

1. **API3**: Add response serialization layer to strip internal fields (e.g., password hashes, internal IDs)
2. **API6**: Extend idempotency to all financial endpoints (Stripe, fund operations)
3. **API9**: Regenerate OpenAPI spec to match all current routes
4. **API10**: Add timeout and circuit breaker to AI provider calls in ai-engine
