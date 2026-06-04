# Quality Gates Summary
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Overview

This document defines the per-app readiness gates across five pillars and the maturity label framework for all active SZL Holdings products.

---

## Five Pillar Readiness Gates

### Pillar 1 — Reliability

| Gate | Pass Criteria | Fail Criteria |
|------|--------------|---------------|
| Health endpoint | `/health` responds 200 within 2s | No health endpoint or response > 2s |
| Crash rate | < 0.1% sessions end in crash | ≥ 0.1% crash rate |
| Error boundary coverage | All async routes wrapped | Any top-level unhandled rejection |
| Uptime target | 99.5% availability (staging) | < 99.5% over rolling 7 days |
| Retry logic | External calls use exponential backoff | No retry on transient failures |

### Pillar 2 — Security

| Gate | Pass Criteria | Fail Criteria |
|------|--------------|---------------|
| Authentication | All non-public routes require auth | Any unauthenticated data access |
| RBAC enforcement | Role-based access verified by API tests | Privilege escalation possible |
| Secret management | No secrets in codebase or env output | Any hardcoded key or token |
| CORS policy | Explicit allowlist configured | Wildcard `*` origin in production |
| Dependency audit | Zero critical CVEs | Any unpatched critical CVE |
| Rate limiting | All auth and mutation endpoints rate-limited | No rate limiting on auth routes |

### Pillar 3 — Operational Excellence

| Gate | Pass Criteria | Fail Criteria |
|------|--------------|---------------|
| CI pipeline | All PRs blocked on CI failure | Any merge without CI pass |
| E2E coverage | Smoke + journey tests exist per app | Any app with zero E2E tests |
| Runbook coverage | Runbook exists for each critical flow | Critical flow has no documented recovery |
| Alerting | At least 1 actionable alert per SLO breach | No alerting configured |
| Log structure | Structured JSON logs in production | Unstructured text logs only |
| Incident response | P0 response SLA < 15 minutes | No defined response SLA |

### Pillar 4 — Performance Efficiency

| Gate | Pass Criteria | Fail Criteria |
|------|--------------|---------------|
| Bundle size | Main JS bundle < 1MB gzipped | Bundle ≥ 1MB gzipped |
| Core Web Vitals (LCP) | LCP < 2.5s on 3G simulated | LCP > 4s |
| Core Web Vitals (CLS) | CLS < 0.1 | CLS > 0.25 |
| API response time (p95) | < 500ms for read, < 2s for write | p95 > 2s for reads |
| Code splitting | Route-level lazy loading implemented | No code splitting |

### Pillar 5 — Cost Awareness

| Gate | Pass Criteria | Fail Criteria |
|------|--------------|---------------|
| Resource tagging | All cloud resources tagged with app + env | Any untagged resource |
| Cost alerting | Spend alert at 80% of monthly budget | No cost alert configured |
| Unused resource audit | Audit performed within 30 days | No audit in 90+ days |
| Data retention | Log/data TTL policies configured | Logs retained indefinitely |

---

## Maturity Labels

### Internal Alpha
**Definition:** The app exists and renders without crash. Suitable for internal demo only.

**Promotion Criteria:**
- All routes load without fatal error
- Basic auth flow works end-to-end
- No hardcoded secrets
- Smoke E2E tests pass

**Exit Blockers:**
- Crash on load
- No authentication
- Missing data model

---

### Functional Alpha
**Definition:** The app covers its core user journey end-to-end. Suitable for design-partner or trusted-user testing.

**Promotion Criteria:**
- All smoke tests pass
- At least 1 user journey E2E test passes
- Security pillar gates met (auth, RBAC, CORS)
- Health endpoint exists
- CI pipeline blocks on test failure

**Exit Blockers:**
- User journey test failing
- Known P0 security issue
- No health endpoint

---

### Beta Candidate
**Definition:** The app is hardened for limited external use. Suitable for closed beta with real users.

**Promotion Criteria:**
- All five pillar gates met at ≥ 80% pass rate
- Mobile viewport E2E tests pass
- Runbook exists for P0 failure scenarios
- SLI/SLO candidates documented
- Bundle size within performance gate
- Dependency audit: zero critical CVEs

**Exit Blockers:**
- Any critical security gate failing
- No runbook for any P0 scenario
- Reliability gate failing

---

### Production-Ready
**Definition:** The app is safe for general availability. Requires full gate compliance.

**Promotion Criteria:**
- All five pillar gates met at 100% pass rate
- Alerting configured for all SLO candidates
- Load test completed at 2x expected peak
- Incident response SLA documented and tested
- Disaster recovery / backup-restore verified
- Accessibility audit completed

**Exit Blockers:**
- Any open P0 or P1 issue
- SLO breach > 3 times in 30 days
- No load test on record

---

## Per-App Current Maturity Label

| App | Current Label | Target Label | Blocking Issues |
|-----|--------------|--------------|-----------------|
| Lyte Command Center | Functional Alpha | Beta Candidate | Bundle size, load test, runbook gaps |
| Aegis (Firestorm) | Functional Alpha | Beta Candidate | Decorative pages, runbook gaps |
| Terra | Functional Alpha | Beta Candidate | Mapbox bundle size, mobile E2E |
| Vessels | Functional Alpha | Beta Candidate | Mapbox bundle size, runbook gaps |
| SZL Holdings | Functional Alpha | Beta Candidate | E2E journey depth, load test |
| Carlota Jo | Internal Alpha | Functional Alpha | Client portal depth, journey tests |
| Stephen Lutar | Internal Alpha | Functional Alpha | Limited content, no journey tests |
| Platform / API | Functional Alpha | Beta Candidate | Load test, E2E API coverage |
