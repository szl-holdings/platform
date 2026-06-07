# SOC 2 Type I Alignment Checklist — SZL Holdings Platform

> Documents control alignment for SOC 2 Type I readiness across the five Trust Service Criteria (TSC).  
> This is an internal readiness assessment, not a formal audit opinion.
>
> **Status:** Pre-audit readiness review  
> **Last Updated:** 2026-04-03  
> **Target:** SOC 2 Type I — Q3 2026  
> **Owner:** Stephen Lutar

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Control is in place and documented |
| 🟡 | Partially in place — gaps identified |
| ❌ | Not yet implemented |
| 🔵 | Not applicable to current scope |

---

## CC1 — Control Environment

### CC1.1 Integrity and Ethical Values

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Code of conduct documented | 🟡 | Needs formal written policy |
| Security policy communicated to all contributors | ✅ | `SECURITY.md` at repo root |
| Whistleblower / ethics reporting channel defined | ❌ | Not yet established |

### CC1.2 Board/Management Oversight

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Security responsibilities assigned | ✅ | stephen@szlholdings.com |
| Periodic security reviews scheduled | 🟡 | Ad-hoc; needs formal calendar |
| Risk register maintained | ❌ | Not yet created |

### CC1.3 Organizational Structure

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| RBAC roles defined | ✅ | Six-tier hierarchy: founder_admin → client |
| Role assignments reviewed | 🟡 | No formal periodic review yet |
| Separation of duties enforced | ✅ | Admin actions require elevated role + org scope |

---

## CC2 — Communication and Information

### CC2.2 Internal Communication

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Security incident reporting process documented | ✅ | `RUNBOOK_INCIDENT_RESPONSE.md` |
| Security policies communicated to team | ✅ | `SECURITY.md` |
| Change management process documented | ✅ | `RUNBOOK_DEPLOYMENT.md` |

### CC2.3 External Communication

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Vulnerability disclosure program published | ✅ | `SECURITY.md`, `/legal/security-disclosure` |
| Trust Center published | ✅ | `https://szlholdings.com/trust` |
| `security.txt` in place | ✅ | `/.well-known/security.txt` |
| Privacy policy published | 🟡 | Exists; needs review for completeness |
| Terms of Service published | 🟡 | Exists; needs legal review |

---

## CC3 — Risk Assessment

### CC3.1 Risk Identification

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| OWASP Top 10 assessed | ✅ | See `infra/docs/OWASP_CHECKLIST.md` |
| Threat model documented | ❌ | Not yet created |
| Vendor/third-party risk assessed | 🟡 | Key vendors identified; no formal risk scoring |

### CC3.2 Risk Analysis

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Severity classification framework defined | ✅ | `RUNBOOK_INCIDENT_RESPONSE.md` §2 |
| Dependency vulnerability scanning automated | ✅ | `pnpm audit` in CI |
| SAST tooling integrated | 🟡 | ESLint; dedicated SAST scanner not yet configured |

---

## CC4 — Monitoring Controls

### CC4.1 Evaluating Controls

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Audit logging implemented | ✅ | Immutable audit log on every significant action |
| Audit log fields: actor, role, timestamp, entity | ✅ | Enforced in activity-logger middleware |
| Log retention policy defined | 🟡 | Logs retained in DB; off-site retention not configured |
| Security event alerting configured | 🟡 | In-app audit; no SIEM/alerting integration yet |

### CC4.2 Internal Audit

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Secrets audit checklist | ✅ | `RUNBOOK_SECRETS.md` §Secret Audit Checklist |
| Quarterly security review checklist | ❌ | Not yet scheduled |
| Access review process | ❌ | No formal periodic access review |

---

## CC5 — Control Activities

### CC5.2 Technology Controls

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Input validation on API endpoints | ✅ | Zod validation + validateBody middleware |
| Parameterized queries / ORM (no raw SQL injection vectors) | ✅ | Drizzle ORM for all DB operations; raw queries use pg parameterization |
| CSRF protection | ✅ | `csrf.ts` middleware |
| Security headers (Helmet) | ✅ | Helmet with CSP, HSTS, X-Frame-Options |
| Rate limiting | ✅ | Login (10 req/hour), Auth (20 req/15min), Write (100 req/15min), Read (600 req/15min), Public submit (5 req/hour) |
| Secrets managed via env vars / Key Vault | ✅ | No secrets in source control; Key Vault for prod |
| TLS enforced in production | ✅ | HSTS with 2-year max-age, preload |
| Session management | ✅ | Time-limited tokens, session revocation |
| Idempotency controls on writes | ✅ | `idempotency.ts` middleware |

### CC5.3 Deployment Controls

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Deployment process documented | ✅ | `RUNBOOK_DEPLOYMENT.md` |
| Rollback procedure documented | ✅ | `RUNBOOK_ROLLBACK.md` |
| Feature flags for staged rollouts | ✅ | Feature flag system in place |
| Code review required before merge | ✅ | PR workflow enforced |

---

## CC6 — Logical and Physical Access

### CC6.1 Logical Access

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Authentication required for all non-public endpoints | ✅ | `authMiddleware` on all protected routes |
| OpenID Connect / PKCE authentication | ✅ | No password storage |
| Azure AD SSO supported | ✅ | Multi-tenant OIDC |
| SCIM provisioning | ✅ | SCIM 2.0 for user lifecycle management |
| Session expiry enforced | ✅ | 30-day TTL; re-auth for privileged ops |
| Least-privilege access enforced | ✅ | RBAC with org-scoped middleware |

### CC6.2 Provisioning and De-provisioning

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| User provisioning process | ✅ | SCIM 2.0 from IdP |
| User de-provisioning (termination) | 🟡 | SCIM supports; manual audit of inactive accounts needed |
| Privileged access review | ❌ | No formal privileged access review schedule |

### CC6.6 Security Threats

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Intrusion detection | 🟡 | Rate limiting + audit logs; no dedicated IDS |
| Vulnerability management | ✅ | `pnpm audit` + responsible disclosure program |
| Penetration testing | ✅ | NCC Group external pen test completed April 28 – May 9, 2026; re-test May 12, 2026; Letter of Attestation (NCC-SZL-2026-04-LOA-1.0) issued May 16, 2026. 0 Critical, 3 High (all remediated and verified). See `docs/internal/security/pentest-findings-2026-04.md` and `docs/internal/security/pentest-attestation-letter-2026-05.md`. |

---

## CC7 — System Operations

### CC7.1 — System and Data Monitoring

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Health endpoint monitoring | ✅ | `/api/health`, `/api/health/live`, `/api/health/ready` |
| Error tracking | ✅ | Pino logger + correlation IDs |
| Application performance monitoring | ✅ | APM route + telemetry middleware |
| Database monitoring | 🟡 | Basic query logging; no slow query alerting |

### CC7.2 — Incident Response

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Incident response plan documented | ✅ | `RUNBOOK_INCIDENT_RESPONSE.md` |
| Incident severity classification | ✅ | P0–P3 defined |
| Communication templates | ✅ | Customer notification template in incident runbook |
| Post-mortem process | ✅ | Template in `RUNBOOK_INCIDENT_RESPONSE.md` |

---

## CC8 — Change Management

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Change management process | ✅ | `RUNBOOK_DEPLOYMENT.md` |
| Peer review for infrastructure changes | ✅ | IaC is version-controlled |
| Rollback capability | ✅ | `RUNBOOK_ROLLBACK.md` |
| Emergency change process | 🟡 | No formal emergency change procedure |

---

## CC9 — Risk Mitigation

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Vendor risk management | 🟡 | Key vendors identified; no formal process |
| Business continuity plan | 🟡 | Backup runbook exists; full BCP not documented |
| Backup and recovery | ✅ | Automated backups; restoration verified periodically |

---

## A Series — Availability

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Uptime monitoring | 🟡 | Health endpoints available; no external uptime monitor |
| Disaster recovery plan | 🟡 | Backup runbook; full DR plan not documented |
| Performance capacity planning | ❌ | Not formally performed |
| Status page | ❌ | Not yet implemented |

---

## PI Series — Processing Integrity

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Input validation on all endpoints | ✅ | Zod validation with shared schemas |
| Data validation before DB writes | ✅ | ORM type enforcement + application validation |
| AI recommendations always labeled | ✅ | Generated content never presented as human-authored |
| Human-in-the-loop enforced | ✅ | Alloy agent cannot act without explicit human approval |
| Audit trail for all consequential actions | ✅ | Immutable audit log |

---

## C Series — Confidentiality

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Multi-tenant data isolation | ✅ | Enforced at DB and middleware layer |
| Credential redaction from logs | ✅ | Sensitive fields redacted at point of capture |
| Encryption in transit | ✅ | TLS 1.3, HSTS |
| Encryption at rest | ✅ | PostgreSQL encryption at rest on all managed deployments |
| NDA / data handling agreements | 🟡 | Customer DPA template needed |

---

## P Series — Privacy

| Control | Status | Evidence / Notes |
|---------|--------|-----------------|
| Privacy policy published | 🟡 | Exists; needs legal review |
| Data minimization | ✅ | Collect only data required to deliver service |
| Data retention policy | 🟡 | Retention windows defined; automated enforcement partial |
| Data subject rights (GDPR/CCPA) | ✅ | Access, deletion, portability workflows in place |
| Consent management | 🟡 | Implicit consent; explicit consent capture needed |
| Data processing agreements | 🟡 | Template needed for enterprise customers |

---

## Summary Scorecard

| Category | ✅ In Place | 🟡 Partial | ❌ Gap |
|----------|-----------|-----------|--------|
| CC1 Control Environment | 3 | 2 | 2 |
| CC2 Communication | 4 | 2 | 0 |
| CC3 Risk Assessment | 2 | 2 | 1 |
| CC4 Monitoring | 2 | 2 | 2 |
| CC5 Control Activities | 9 | 0 | 0 |
| CC6 Logical Access | 6 | 2 | 2 |
| CC7 Operations | 5 | 2 | 0 |
| CC8 Change Management | 3 | 1 | 0 |
| CC9 Risk Mitigation | 1 | 2 | 0 |
| Availability | 0 | 2 | 2 |
| Processing Integrity | 5 | 0 | 0 |
| Confidentiality | 4 | 1 | 0 |
| Privacy | 2 | 4 | 0 |

### Priority Gaps for Pre-Audit Remediation

1. **Formal risk register** — Required for CC3 (owner: Stephen, target: Q2 2026)
2. **Periodic access reviews** — Required for CC6 (schedule quarterly)
3. **Dedicated SAST scanner** — Supplement ESLint with CodeQL or Semgrep
4. **Penetration testing** — ✅ Complete. NCC Group engagement closed May 12, 2026 (0 Critical, 3 High remediated and re-tested). Letter of Attestation on file at `docs/internal/security/pentest-attestation-letter-2026-05.md`.
5. **Status page** — Demonstrates availability commitment
6. **Customer DPA template** — Required before enterprise contracts
7. **Quarterly security review schedule** — Formalize ad-hoc practices

---

*This checklist should be updated after each significant platform change and reviewed by the incident commander quarterly.*
