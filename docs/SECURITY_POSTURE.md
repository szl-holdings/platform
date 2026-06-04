# SZL Holdings — Security Posture

## Defense-in-Depth Architecture

The platform implements security at every layer of the stack, following a defense-in-depth model.

### Layer 1: Network & Transport
- TLS encryption for all client-server communication
- Replit-managed mTLS proxy for development environments
- CORS allowlist prevents unauthorized cross-origin requests
- Helmet middleware sets security headers (X-Frame-Options, CSP, HSTS)

### Layer 2: Authentication
- OIDC/OAuth 2.0 with PKCE flow (no implicit grants)
- Session management with secure, httpOnly cookies
- Multi-factor authentication support via identity provider
- Token refresh with sliding window expiry

### Layer 3: Authorization
- Role hierarchy: `public → authenticated → member → admin → super_admin`
- Tenant-scoped middleware isolates every request to its organization
- Guardian policy engine evaluates path-level access rules
- Zero-trust admin guard requires elevated verification for privileged operations

### Layer 4: Application
- Drizzle ORM with parameterized queries eliminates SQL injection
- CSRF middleware on all state-changing endpoints
- Input validation on API boundaries
- Rate limiting: per-user sliding window + per-endpoint throttles

### Layer 5: Data
- PostgreSQL with tenant-scoped row isolation
- Sensitive fields excluded from API responses and logs
- Database connection pooling with health checks
- Backup and recovery via Replit-managed PostgreSQL

### Layer 6: AI/Agent
- Covenant Policy Engine gates all AI recommendations
- Human approval required before execution of high-risk actions
- Model call tracing via OpenTelemetry spans
- Confidence scoring prevents low-confidence outputs from reaching users
- Prompt injection defenses via input sanitization

### Layer 7: Supply Chain
- Dependency audit in CI pipeline
- Lock file integrity verification
- 25 GitHub CI workflows covering build, test, and security scanning (source: `generated/platform-metrics.json`)
- SBOM generated weekly via `security.yml` (`scripts/qa/generate-sbom.js` → `security/sbom-latest.json`, 90-day CI artifact retention)

## Vulnerability Disclosure

See `SECURITY.md` for responsible disclosure process.

## Incident Response

Critical security incidents trigger the `security-legal` signal chain:
1. Aegis classifies and scopes the incident
2. Legal hold initiated automatically via PRISM Counsel
3. Executive risk score updated in portfolio dashboard
4. Full incident timeline captured in proof chain for replay
