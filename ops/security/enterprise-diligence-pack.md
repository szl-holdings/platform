# Enterprise Diligence Pack

Last updated: 2026-04-16
Audience: Investors, buyers, enterprise prospects conducting technical due diligence

---

## 1. Company & Platform Overview

**SZL Holdings** builds Lyte and Alloy — a governed decision infrastructure platform for enterprise operations. Lyte surfaces revenue stalls, approval gaps, and ownership drift. Alloy routes the governed action through structured workflows with full audit attribution.

**Deployment model**: SaaS, cloud-hosted on Replit infrastructure (US-East). On-premise deployment roadmap: Q4 2026.

**Founded**: 2025 | **Stage**: Pre-seed | **Headquarters**: Washington, DC

---

## 2. Security Posture Summary

### Authentication & Authorization
- **Authentication**: Replit Auth OIDC/PKCE for end-user sessions; bearer token for API access.
- **Session management**: HttpOnly, Secure, SameSite=Strict cookies; 24-hour expiry with rolling refresh; server-side session invalidation supported.
- **Authorization**: Role-based access control (RBAC) with a 5-level hierarchy (`viewer → editor → analyst → ops → super_admin`). All database queries are organization-scoped via `callerOrgIds()` guard.
- **Multi-tenancy**: Full tenant isolation at the database query layer. Row-level org scoping on all tables. Cross-tenant data leakage prevented by default.

### Data Protection
- **Encryption at rest**: AES-256-GCM for sensitive field encryption; HMAC key derivation.
- **Encryption in transit**: HTTPS enforced via Replit proxy; mTLS for preview/internal traffic.
- **PII handling**: Structured redaction in all log pipelines (authorization headers, cookies, session tokens never logged).
- **Data residency**: Currently US-East. Additional regions available on enterprise contracts.

### API Security
- **Rate limiting**: Global 200 req/15m per IP; auth endpoints 10 req/15m (sliding window).
- **Input validation**: Zod schema validation on all auth routes and high-traffic write endpoints; extension to all routes in progress.
- **CORS**: Environment-specific allowlists; no wildcard origins in production.
- **Security headers**: Full Helmet.js suite — CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
- **CSRF protection**: Token-based CSRF middleware on all state-mutating endpoints.
- **Idempotency**: Idempotency keys enforced on billing and financial mutation endpoints.

### Infrastructure Security
- **Secrets management**: All secrets in Replit environment secrets; no secrets in codebase or logs.
- **Dependency scanning**: `pnpm audit` in CI pipeline; Dependabot configured.
- **Admin surface isolation**: Admin routes require elevated role (`super_admin`, `ops`, `exec`); internal service-to-service calls require `x-internal-token` header.

---

## 3. Compliance Posture

| Framework | Status | Notes |
|-----------|--------|-------|
| SOC 2 Type II | In progress | Target: Q3 2026 |
| ISO 27001 | Aligned | Formal certification: 2027 roadmap |
| GDPR | Compliant | Data processing agreements available |
| CCPA | Compliant | Privacy policy and rights request process active |
| HIPAA | Not applicable | No PHI handled currently |
| StateRAMP | Roadmap | Gov/defense deployment: 2027 roadmap |

**Do not claim**: We do not claim SOC 2 Type II certification currently. "In progress" is accurate and appropriate for diligence conversations.

---

## 4. Availability & Reliability

| Metric | Target | Current Baseline |
|--------|--------|-----------------|
| API Availability | 99.9% | Monitored; see SLO catalog |
| API Latency p95 | < 500ms | Measured via telemetry middleware |
| AI Response p95 | < 10s | Monitored per provider |
| Planned Maintenance | < 30 min/month | Deploy-time only |

**Incident response**: P0 incidents paged immediately; 30-minute response SLA; post-incident review within 24 hours.

**Backup & recovery**: Daily automated database backups; point-in-time recovery to within 5 minutes.

---

## 5. OWASP Compliance Summary

### ASVS Level 1 (Practical Assessment)

| Category | Status |
|----------|--------|
| Authentication | Strong |
| Session Management | Strong |
| Access Control | Strong |
| Input Validation | Good (in progress for full coverage) |
| Cryptography | Strong |
| Error Handling | Strong |
| Data Protection | Good (data classification in progress) |
| API Security | Strong |

### OWASP API Top 10

| Risk | Status |
|------|--------|
| API1: Broken Object Level Auth | Mitigated |
| API2: Broken Authentication | Mitigated |
| API4: Unrestricted Resource Consumption | Mitigated |
| API5: Broken Function Level Auth | Mitigated |
| API8: Security Misconfiguration | Mitigated |
| API3: Broken Object Property Level Auth | Partial |
| API6: Unrestricted Business Flow Access | Partial |
| API10: Unsafe External API Consumption | Partial |

---

## 6. AI Governance & Trust

All AI-generated outputs are:
- **Source-attributed**: Every AI response includes citations to underlying data.
- **Human-in-the-loop required**: No autonomous AI execution on consequential actions. Approval gates enforced.
- **Proof-chained**: Immutable audit trail records every AI use, approval, and action — admissible in legal contexts.
- **Hallucination-bounded**: Responses scored for confidence; low-confidence outputs flagged for human review.

**GenAI observability**: Langfuse-compatible trace bridge for monitoring model behavior; token budget controls; fallback handling.

---

## 7. Penetration Testing & Security Reviews

| Activity | Status | Notes |
|----------|--------|-------|
| Internal threat modeling | Completed | See `/ops/security/threat-model-summary.md` |
| OWASP ASVS gap assessment | Completed | See `/ops/security/asvs-gap-map.md` |
| Third-party penetration test | Planned | Q3 2026 (pre-SOC 2) |
| Bug bounty program | Planned | Post SOC 2 |

---

## 8. Data Flow & Architecture

```
[Client Browser / Mobile]
        ↓ HTTPS
[Replit Proxy / mTLS]
        ↓
[API Server — Express + Auth + Rate Limiting]
        ↓
[PostgreSQL — Row-Level Org Isolation]
        ↓
[Anthropic / OpenAI — AI Inference]
        ↓ (telemetry)
[OTEL Collector → Honeycomb / Grafana]
```

**No third-party sub-processors** receive raw customer data except:
- Anthropic / OpenAI (inference only; no training data sharing per enterprise agreements)
- Replit (infrastructure provider)

---

## 9. Vulnerability Disclosure

Security researchers may disclose vulnerabilities to: **security@szlholdings.com**

We commit to:
- Acknowledge within 2 business days
- Provide a resolution timeline within 10 business days
- Not pursue legal action for good-faith disclosures

---

## 10. References & Documents Available on Request

| Document | Availability |
|----------|-------------|
| System architecture diagram | On request (NDA required) |
| Threat model summary | On request |
| ASVS gap map | On request |
| Data processing agreement (DPA) | Available for enterprise prospects |
| Privacy policy | Public: szlholdings.com/legal/privacy |
| Terms of service | Public: szlholdings.com/legal/terms |
| Security disclosure policy | Public: szlholdings.com/legal/security-disclosure |
| SOC 2 report (when complete) | On request (NDA required) |
