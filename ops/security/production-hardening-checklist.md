# Production Hardening Checklist

Generated: 2026-04-15

## Pre-Deployment

### Secrets
- [ ] All secrets set in deployment environment (see ops/replit/production-secret-checklist.md)
- [ ] No dev fallback secrets active (NODE_ENV=production guards all)
- [ ] FIELD_ENCRYPTION_KEY is unique per environment
- [ ] SESSION_SECRET is unique per environment
- [ ] No secrets in client bundles (verify with `grep -r "sk-" dist/`)

### Headers
- [x] Helmet configured with CSP, HSTS, X-Frame-Options
- [x] CORS restricted to production domain
- [x] Secure, HttpOnly, SameSite cookies

### Authentication
- [x] Rate limiting on auth endpoints (10/15m)
- [x] Password validation (min 8 chars)
- [x] Session expiry (24h)
- [ ] MFA for admin users (future)

### Authorization
- [x] RBAC with role hierarchy
- [x] Org-scoped data access
- [x] Internal token fast path for service calls

### Input Validation
- [x] Zod validation on auth routes
- [ ] Zod validation on all write routes (partial)
- [x] Body size limit (10MB)
- [x] JSON parsing with raw body verification

### Data Protection
- [x] Field-level encryption (AES-256-GCM)
- [x] Encryption key derivation (HMAC-SHA256)
- [x] Production-only encryption key requirement
- [ ] Data classification documentation

### Logging
- [x] Structured logging (Pino)
- [x] Request ID propagation
- [x] Audit trail for sensitive actions
- [x] No sensitive data in logs
- [ ] External log sink for immutability

### Dependencies
- [x] pnpm-lock.yaml for reproducible builds
- [x] security.yml workflow for dependency scanning
- [x] CodeQL for static analysis
- [x] Dependency review on PRs

### Infrastructure
- [x] TLS via Replit proxy
- [x] Health endpoints for monitoring
- [x] Rate limiting at application level
- [ ] Database statement timeout
- [ ] Connection pool max limit documented

## Post-Deployment

- [ ] Run smoke tests (see ops/observability/post-deploy-smoke-tests.md)
- [ ] Verify health endpoints return 200
- [ ] Check error rate is normal
- [ ] Verify no new console errors
- [ ] Test login/logout cycle
- [ ] Verify rate limiting is active
