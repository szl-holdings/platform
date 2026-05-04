# SZL Holdings — Operational Readiness Scorecard

**Date:** 2026-04-16  
**Owner:** Engineering / Founder  
**Audience:** Engineering leads, VP Engineering (incoming), Stephen Lutar, investors  
**Scope:** Red / Yellow / Green status across all launch readiness dimensions

This scorecard provides a structured, honest view of the platform's operational readiness for public launch. Each dimension has a status, owner, blocking dependencies, and whether manual human sign-off is required.

**Status key:**
- 🟢 **GREEN** — Ready. No action required before launch.
- 🟡 **YELLOW** — Conditional. One or more items need resolution or formal acceptance before launch.
- 🔴 **RED** — Blocked. Hard blockers must be resolved before launch.

---

## 1. Security Posture

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| P0 security gaps | 🟢 | Engineering | All 11 P0 gaps resolved Apr 2026 |
| Tenant isolation (DB + API + AI layers) | 🟢 | Engineering | Four enforcement layers verified |
| Input validation (Zod on all write routes) | 🟢 | Engineering | V1–V8 confirmed across all high-traffic routes |
| Structured logging (Pino) | 🟢 | Engineering | All console.* removed from production paths |
| Session security (HttpOnly, Secure, SameSite) | 🟢 | Engineering | Confirmed in app.ts |
| RBAC on admin/privileged routes | 🟢 | Engineering | 11-role hierarchy enforced |
| Credential rotation (Firebase/Google) | 🔴 | Stephen Lutar | **LB-001** — manual rotation required; history check pending |
| Production secrets independence | 🟡 | Engineering / Founder | **LB-005** — must confirm before deploy |
| SSRF validation on webhooks | 🟡 | Engineering | **LC-004** — conditional blocker; tracked as KG020b |
| CodeQL SAST in CI | 🟡 | DevOps | **LC-002** — conditional; KG011 |
| Dependency vulnerability scanning in CI | 🟡 | DevOps | **LC-003** — conditional; KG012 |
| Automated secret scanning in CI | 🟡 | DevOps | **LC-001** — conditional; GAP-002 |
| MFA implementation | 🟡 | Engineering | **LC-005** — accepted for design-partner phase |
| Responsible disclosure / security.txt | 🟡 | Engineering | VD1 — SECURITY.md exists; formal endpoint TBD |

**Overall Security Posture: 🟡 YELLOW**  
All critical (P0) gaps closed. Six conditional gaps require formal acceptance or resolution before launch. One hard blocker (LB-001 credential rotation) is RED.

**Manual sign-off required:** ☐ Stephen Lutar confirms credential rotation complete

---

## 2. Infrastructure and Reliability

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Production database separation from dev | 🔴 | Engineering | **LB-004** — must confirm before launch |
| Database migrations clean in production | 🟡 | Engineering | **LB-004** — dependent on prod DB provisioning |
| Demo/seed data absent from production | 🟡 | Engineering | Must verify with DB query before launch |
| API health endpoint responding in prod | 🟡 | Engineering | Can only verify after prod deploy |
| External uptime monitoring | 🔴 | Platform | **LB-002** — not configured; KG027 |
| Error tracking (Sentry or equivalent) | 🔴 | Platform | **LB-003** — not configured; KG028 |
| OTEL exporter wired to prod OTLP backend | 🔴 | Platform | **LB-006** — KG009 not resolved |
| Azure App Service / Replit publish configured | 🟡 | DevOps | Architecture ready; not yet live in production |
| Rollback mechanism documented and tested | 🟢 | Engineering | Replit checkpoint + Azure blue/green documented |
| Azure Key Vault for secrets (if Azure deploy) | 🟡 | DevOps | Architecture defined; not yet provisioned |
| CDN / Front Door configuration | 🟡 | DevOps | Architecture defined; not yet active |
| Redis cache for sessions (if Azure deploy) | 🟡 | DevOps | Architecture defined; not yet provisioned |

**Overall Infrastructure Readiness: 🔴 RED**  
Four hard blockers (LB-002, LB-003, LB-004, LB-006) must be resolved. Production environment is not yet fully provisioned.

**Manual sign-off required:** ☐ Engineering confirms production deployment is live and healthy

---

## 3. Code Quality and Testing

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| TypeScript typecheck passes | 🟢 | Engineering | `pnpm typecheck` — CI gate |
| ESLint passes | 🟢 | Engineering | `pnpm lint` — CI gate |
| Build succeeds for all artifacts | 🟢 | Engineering | `pnpm -r build` — CI gate |
| Integration smoke tests passing | 🟢 | Engineering | Route smoke tests exist and run |
| E2E test suite (Playwright or equivalent) | 🟡 | Engineering | KG010 — GitHub workflow exists; coverage incomplete |
| Automated E2E running in CI | 🟡 | Engineering | Test infrastructure exists; not all paths covered |
| CODEOWNERS file | 🟡 | Eng Lead | KG013 — no review ownership mapping |
| Large bundle sizes (1–1.7 MB per app) | 🟡 | Engineering | KG024 / LC-006 — conditional blocker |

**Overall Code Quality: 🟡 YELLOW**  
CI gates (typecheck, lint, build) are all passing. E2E coverage is incomplete — this is a conditional blocker accepted for design-partner phase. Bundle sizes are a known risk.

**Manual sign-off required:** ☐ Engineering confirms all CI gates pass on the release commit

---

## 4. Observability and Monitoring

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Pino structured logging across all routes | 🟢 | Engineering | Confirmed in all production paths |
| Self-monitoring (polls /api/health/detailed every 5 min) | 🟢 | Engineering | `lib/self-monitor.ts` configured |
| AI provider health checks (OpenAI, Anthropic, Gemini) | 🟢 | Engineering | Probes every 2 minutes |
| Job queue monitoring in health endpoint | 🟢 | Engineering | Queue depth visible in /api/health/detailed |
| OpenTelemetry OTLP exporter (production) | 🔴 | Platform | **LB-006** — KG009 — not configured for production |
| Error tracking (Sentry DSN in production) | 🔴 | Platform | **LB-003** — not configured |
| External uptime monitoring | 🔴 | Platform | **LB-002** — not configured |
| Azure Application Insights (if Azure deploy) | 🟡 | DevOps | Architecture defined; not provisioned |
| SLI/SLO definitions | 🟡 | Engineering | KG023 — targets defined in TRUST_CENTER_INDEX.md; not formally committed |
| Lighthouse CI performance gate | 🟡 | Engineering | KG019 — not configured |

**Overall Observability: 🔴 RED**  
Three hard blockers. Platform has self-monitoring but lacks external visibility (uptime, error tracking, distributed traces) required for production launch.

**Manual sign-off required:** ☐ Platform confirms uptime monitoring and error tracking configured and receiving data

---

## 5. Access Control and Admin Safety

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Global deny-by-default auth enforcer | 🟢 | Engineering | `globalAuthEnforcer` on all `/api/*` routes |
| Admin panel PIN-gated (not just session-gated) | 🟢 | Engineering | `/admin` requires session + ADMIN_PIN hash check |
| `super_admin` role requires direct DB write (not UI) | 🟢 | Engineering | Enforced by design |
| Cross-tenant access architecturally prevented | 🟢 | Engineering | Four enforcement layers; P0 gaps resolved |
| WebSocket ticket HMAC signed with SESSION_SECRET | 🟢 | Engineering | 5-minute TTL enforced |
| Internal service token (ALLOY_INTERNAL_TOKEN) timing-safe | 🟢 | Engineering | `crypto.timingSafeEqual` |
| Impersonation audit logged | 🟢 | Engineering | Start/end logged in routes/admin.ts |
| Admin routes not in public navigation | 🟢 | Engineering | Verified in szl-holdings frontend |
| ADMIN_PIN set in production environment | 🟡 | Founder | **LB-005** — must confirm with production secrets checklist |

**Overall Access Control: 🟢 GREEN (conditional on LB-005)**  
All access control mechanisms are implemented and verified. Production secret configuration must be confirmed.

---

## 6. Support and Incident Response

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Support model documented (../sales/support-operations.md) | 🟢 | Operations | Current as of Apr 2026 |
| INCIDENT_RESPONSE.md current | 🟢 | Engineering | Version 2.0, Apr 2026 |
| Incident severity matrix defined | 🟢 | Engineering | INCIDENT_SEVERITY_MATRIX.md current |
| Backup and recovery documented (RPO 1h, RTO 4h) | 🟢 | Engineering | BACKUP_AND_RECOVERY.md current |
| Security incident escalation path defined | 🟢 | Operations | stephen@szlholdings.com designated |
| On-call owner designated for launch | 🟡 | Founder | **Required** — must be named before launch |
| Launch-day communication channel active | 🟡 | Founder | Required — must be set up before launch |
| Automated ticketing / helpdesk | 🟡 | Operations | Phase 2 — manual email is acceptable at design-partner scale |
| 24/7 on-call rotation | 🟡 | Operations | Not available at current headcount — accepted gap |

**Overall Support Readiness: 🟡 YELLOW**  
Documentation and processes are in place. Two operational tasks (on-call naming, comms channel) must be completed before launch.

**Manual sign-off required:** ☐ Stephen Lutar confirms on-call designation for launch window

---

## 7. Legal and Commercial

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Privacy Policy present at `/legal/privacy` | 🔴 | Founder / Legal | **LB-007** — Must be reviewed by counsel before external users accept |
| Terms of Service present at `/legal/terms` | 🔴 | Founder / Legal | **LB-007** — Must be reviewed by counsel before external users accept |
| Design-partner / pilot agreements reviewed by counsel | 🔴 | Founder / Legal | **LB-007** — Must be reviewed before any commercial engagement |
| No fabricated customer data, logos, or traction in public materials | 🟢 | Founder | Verified — no fake traction claims in platform |
| Trust Center content accuracy (no stale model references) | 🟡 | Engineering | TRUST_CENTER_INDEX.md § Model Transparency references HuggingFace/Qwen3-8B as primary model — marked for review |
| Cookie consent configuration | 🟡 | Engineering | GDPR-applicable if EU visitors are expected |
| Pricing page reflects current offer | 🟡 | Founder | Must be reviewed before launch |
| Revenue recognition model | 🟡 | Finance | Requires finance advisor review if commercial transactions occur |

**Overall Legal/Commercial: 🔴 RED**  
Legal agreements must be reviewed by qualified counsel before any external user engagement. This cannot be completed by engineering.

**Manual sign-off required:** ☐ Legal counsel confirms Privacy Policy, ToS, and design-partner agreements  
**Manual sign-off required:** ☐ Stephen Lutar confirms no fabricated traction or customer claims in any public material

---

## 8. Documentation Completeness

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| LAUNCH_BLOCKERS.md | 🟢 | Engineering | Created Apr 2026 |
| PUBLIC_LAUNCH_READINESS.md | 🟢 | Engineering | Created Apr 2026 |
| GO_NO_GO_CHECKLIST.md | 🟢 | Engineering | Created Apr 2026 |
| OPERATIONAL_READINESS_SCORECARD.md | 🟢 | Engineering | This document |
| EXECUTIVE_LAUNCH_SUMMARY.md | 🟢 | Engineering | Created Apr 2026 |
| SECURITY-CHECKLIST.md | 🟢 | Engineering | Refreshed Apr 2026 |
| DEPLOYMENT-GUIDE.md | 🟢 | Engineering | Updated Apr 2026 |
| KNOWN-GAPS.md | 🟢 | Engineering | Updated Apr 2026 |
| TRUST_CENTER_INDEX.md | 🟡 | Engineering | One stale model reference needs correction (AI model transparency section) |
| OPERATIONS-RUNBOOK.md | 🟢 | Engineering | Version 2.0, Apr 2026 |
| INCIDENT_RESPONSE.md | 🟢 | Engineering | Current |

**Overall Documentation: 🟢 GREEN**  
All required launch documents are created or updated. One minor accuracy issue in TRUST_CENTER_INDEX.md (model transparency section) should be corrected pre-launch.

---

## Overall Scorecard Summary

| Dimension | Status | Hard Blockers | Conditional Items | Manual Signoff |
|-----------|--------|--------------|-------------------|----------------|
| 1. Security Posture | 🟡 YELLOW | 1 (LB-001) | 6 | Founder: credential rotation |
| 2. Infrastructure | 🔴 RED | 4 (LB-002, LB-003, LB-004, LB-006) | 5 | Engineering: prod health |
| 3. Code Quality | 🟡 YELLOW | 0 | 3 | Engineering: CI gates on release commit |
| 4. Observability | 🔴 RED | 3 (LB-002, LB-003, LB-006) | 3 | Platform: monitoring live |
| 5. Access Control | 🟢 GREEN | 0 | 1 | — (covered by LB-005) |
| 6. Support & Incident Response | 🟡 YELLOW | 0 | 2 | Founder: on-call designation |
| 7. Legal & Commercial | 🔴 RED | 1 (legal review) | 5 | Legal counsel + Founder |
| 8. Documentation | 🟢 GREEN | 0 | 1 | — |

**Aggregate launch status: 🔴 NOT READY FOR PUBLIC LAUNCH**

**Total hard blockers:** 6 (LB-001 through LB-006) + legal review  
**Total conditional items:** 25 (require resolution or formal acceptance)  
**Items requiring non-engineering human sign-off:** 5 (credential rotation, production health, monitoring config, on-call designation, legal review)

---

## Remediation Timeline

| Phase | Target | Work |
|-------|--------|------|
| **Pre-launch (engineering)** | Before any external traffic | LB-002 (uptime), LB-003 (Sentry), LB-004 (prod DB), LB-005 (secrets), LB-006 (OTEL) |
| **Pre-launch (Founder)** | Before any external traffic | LB-001 (credential rotation) |
| **Pre-launch (legal)** | Before any commercial engagement | Legal review of Privacy Policy, ToS, design-partner agreements |
| **Sprint 3** | 30 days post-launch | KG011 (CodeQL), KG012 (dep review), KG020b (SSRF), KG027/KG028 (if not done pre-launch) |
| **Sprint 4** | 90 days post-launch | KG010 (E2E), KG019 (Lighthouse CI), KG023 (SLI/SLO), KG024 (bundle sizes) |
| **Phase 3 / post-funding** | Post-revenue | SOC 2 Type II, ISO 27001, StateRAMP evaluation |

---

*Related: [LAUNCH_BLOCKERS.md](launch-blockers.md) · [GO_NO_GO_CHECKLIST.md](go-no-go-checklist.md) · [PUBLIC_LAUNCH_READINESS.md](public-launch-readiness.md) · [KNOWN-GAPS.md](../operations/known-gaps.md) · [SECURITY-CHECKLIST.md](../security/security-checklist.md)*

*Last reviewed: 2026-04-16 · Next review: Immediately before any external launch activity*
