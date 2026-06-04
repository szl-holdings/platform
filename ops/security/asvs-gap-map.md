# OWASP ASVS Gap Map

Generated: 2026-04-15

## Summary

Practical assessment against OWASP Application Security Verification Standard (ASVS) Level 1 requirements.

| Category | Status | Coverage |
|----------|--------|----------|
| V1 Architecture | Partial | Monorepo structure clear, needs formal threat model |
| V2 Authentication | Good | Replit Auth OIDC/PKCE, session cookies, bearer tokens |
| V3 Session Management | Good | HttpOnly, Secure, SameSite, 24h expiry, refresh |
| V4 Access Control | Good | RBAC with role hierarchy, org-scoped queries |
| V5 Input Validation | Good | Zod schemas on auth routes, validateBody middleware |
| V6 Cryptography | Good | AES-256-GCM, HMAC key derivation, production-only keys |
| V7 Error Handling | Good | Structured errors, no stack traces in production |
| V8 Data Protection | Partial | Field encryption exists, needs data classification map |
| V9 Communication | Good | HTTPS via Replit proxy, mTLS for preview |
| V10 Malicious Code | Partial | No dependency pinning in lockfile (pnpm-lock exists) |
| V11 Business Logic | Partial | Idempotency on billing, needs more coverage |
| V12 File Upload | Unknown | Need to verify upload controls |
| V13 API Security | Good | Rate limiting, CORS, security headers, auth |
| V14 Configuration | Partial | Dev fallbacks exist (guarded by NODE_ENV) |

## Key Gaps

### Must Fix
1. **V5.1**: Extend Zod validation to ALL write endpoints (not just auth)
2. **V8.1**: Create data classification document (PII, sensitive, public)
3. **V14.2**: Verify all dev fallback secrets throw in production (already mostly done)

### Should Fix
4. **V10.1**: Add `pnpm audit` to CI pipeline (already in security.yml)
5. **V11.1**: Add idempotency middleware to all financial mutation endpoints
6. **V12.1**: Audit file upload endpoints for size limits and type validation
7. **V1.2**: Create formal threat model document

### Nice to Have
8. **V2.8**: Add MFA support for admin users
9. **V3.5**: Add session invalidation on password change
10. **V6.3**: Add key rotation mechanism for encryption keys
