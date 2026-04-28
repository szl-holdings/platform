# SZL Holdings — Trust Center

## Overview

SZL Holdings operates a governed decision operating system where every consequential action follows a verifiable lifecycle: **Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning**.

This Trust Center documents the security posture, governance controls, and compliance readiness of the platform for enterprise evaluators, procurement teams, and investors.

## Governance Architecture

| Layer | Implementation | Package |
|-------|---------------|---------|
| Policy Enforcement | Covenant Policy Engine + Guardian middleware | `lib/covenant-policy`, `packages/guardian` |
| Approval Gates | Human-in-the-loop with risk-tier escalation | `lib/covenant-policy/src/approvals.ts`, `artifacts/api-server/src/middlewares/approval-gate.ts` |
| Audit Trail | Hash-linked immutable proof chain | `lib/proof-chain` |
| Decision Replay | Full trace reconstruction from any decision point | `packages/replay-core`, `packages/trace-graph` |
| Event Correlation | Cross-domain correlation IDs via Signal Mesh | `packages/signal-mesh` |

## Security Controls

### Authentication & Authorization
- OIDC/OAuth 2.0 with PKCE for all user sessions
- Role-based access: `public < authenticated < member < admin < super_admin`
- Tenant-scoped data isolation enforced at middleware layer
- CSRF protection on all state-changing endpoints
- Zero-trust admin guard for privileged operations

### API Security
- Rate limiting: per-user sliding window + global circuit breakers
- Helmet security headers on all responses
- CORS allowlist enforcement
- API versioning middleware
- Request correlation IDs for full traceability

### Data Protection
- PostgreSQL with row-level tenant isolation
- Encrypted connections (TLS) for all data in transit
- Drizzle ORM parameterized queries (SQL injection prevention)
- Sensitive field redaction in logs

### AI Governance
- Model call tracing via OpenTelemetry
- Policy-gated AI recommendations (no autonomous execution without approval)
- Confidence scoring on all AI-generated outputs
- Prompt/response audit logging
- Hallucination resistance scoring in Command Arena evaluations

## Compliance Readiness

| Control Area | Status | Evidence |
|-------------|--------|----------|
| Access control (RBAC) | Implemented | `lib/db/src/schema/organizations.ts` |
| Audit logging | Implemented | `lib/proof-chain` |
| Data isolation | Implemented | `tenant-scope.ts` middleware |
| Incident response | Documented | Signal chain: `security-legal` |
| Change management | Implemented | 25 GitHub CI workflows (source: `generated/platform-metrics.json`) |
| AI governance | Implemented | Covenant Policy Engine |
| Vulnerability management | Partial | Dependency audit in CI; SBOM generated weekly (CI artifact, not yet release-attached) |

## Known Gaps (Disclosed)

| Gap | Severity | Remediation Plan |
|-----|----------|-----------------|
| SOC 2 Type II not yet obtained | Medium | Targeted Q3 2026 |
| SBOM not release-attached | Low | SBOM generated weekly (`security.yml` CI artifact); not yet attached to GitHub release tags |
| Sentry error monitoring not wired | Medium | Configuration pending |
| Redis session store not configured | Low | Using in-memory sessions; Redis planned |

## Contact

For security disclosures: See `SECURITY.md` in the repository root.
For procurement inquiries: Contact SZL Holdings directly.
