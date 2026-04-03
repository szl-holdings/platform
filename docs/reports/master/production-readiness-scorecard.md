# SZL Holdings — Production Readiness Scorecard
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Maturity Label Key

| Label | Definition |
|-------|-----------|
| Internal Alpha | Renders without crash, internal demo only |
| Functional Alpha | Core journey works, design-partner testing |
| Beta Candidate | All 5 pillars ≥ 80%, hardened for limited external use |
| Production-Ready | All 5 pillars 100%, GA-safe |

---

## Per-App Scores (1-10)

### Lyte Command Center
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 8 | Clear business observability positioning |
| UX Quality | 7 | Premium design, some pages need polish |
| Frontend Quality | 8 | Clean React/Vite, shared-ui adoption improving |
| Mobile Quality | 6 | Expo app running, needs state handling audit |
| Backend Quality | 7 | Comprehensive API, good auth coverage |
| Security | 7 | Auth middleware, rate limiting, RBAC |
| Accessibility | 5 | Needs systematic audit |
| Performance | 6 | Large bundles, needs code splitting |
| Observability | 7 | APM, service topology pages exist |
| Release Discipline | 7 | CI comprehensive, E2E now active |
| Investor Readiness | 7 | Strong flagship story |
| Production Readiness | 6 | Functional Alpha → Beta Candidate path clear |
| **Overall** | **6.8** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** Bundle size gate, runbook gaps, load test missing

---

### Alloy (Engine Layer)
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 8 | Clear execution fabric positioning |
| Backend Quality | 8 | 9 schemas, retrieval, tools, evals |
| Security | 7 | Auth on critical endpoints, propose_only default |
| Observability | 7 | Audit logging for all decisions |
| Release Discipline | 6 | Needs eval-gated releases |
| Production Readiness | 5 | Schema-validated, needs production hardening |
| **Overall** | **6.8** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** No E2E tests, no runbooks, eval-gating not implemented

---

### Aegis (Firestorm)
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 7 | Strong security positioning, naming drift |
| UX Quality | 7 | Premium design |
| Frontend Quality | 8 | Comprehensive page set |
| Mobile Quality | 6 | Expo app with core screens |
| Backend Quality | 7 | Good API coverage |
| Security | 7 | Auth, RBAC |
| Release Discipline | 7 | E2E now active across 7 routes + journey |
| Production Readiness | 6 | Functional Alpha, many decorative pages remain |
| **Overall** | **6.9** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** Decorative page inventory audit, runbook gaps, RBAC test coverage

---

### Terra
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 7 | Clear RE intelligence positioning |
| UX Quality | 7 | Good data visualization |
| Frontend Quality | 8 | Maps, charts, detail pages |
| Mobile Quality | 7 | Best mobile app (field capture, scanner) |
| Backend Quality | 7 | Live data integrations |
| Performance | 5 | Mapbox bundle is 1.7MB |
| Release Discipline | 7 | E2E active across 7 routes + 3 journey steps |
| Production Readiness | 6 | Functional Alpha |
| **Overall** | **6.8** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** Mapbox bundle size (performance gate fail), runbook gaps, map fallback handling

---

### Vessels
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 7 | Clear maritime intelligence |
| UX Quality | 7 | Fleet dashboard, exception center |
| Frontend Quality | 8 | Comprehensive page set |
| Mobile Quality | 6 | Core fleet screens |
| Backend Quality | 7 | Fleet/voyage/exception APIs |
| Performance | 5 | Mapbox bundle is 1.7MB |
| Release Discipline | 7 | E2E active across 7 routes + journey |
| Production Readiness | 6 | Functional Alpha |
| **Overall** | **6.6** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** Mapbox bundle (performance gate), fleet data staleness runbook, load test

---

### Carlota Jo
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 7 | Clean advisory brand |
| UX Quality | 7 | Premium presentation |
| Frontend Quality | 7 | Clean pages |
| Mobile Quality | 6 | Client app with sessions/documents |
| Backend Quality | 6 | Booking, client portal |
| Release Discipline | 6 | E2E active, booking journey covered |
| Production Readiness | 5 | Approaching Functional Alpha |
| **Overall** | **6.3** | |

**Maturity Label:** Internal Alpha → Functional Alpha
**Next Gate:** Functional Alpha
**Blockers:** Booking flow end-to-end verification, client portal auth E2E, runbooks

---

### SZL Holdings
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 8 | Clear parent company shell |
| UX Quality | 7 | Premium design |
| Frontend Quality | 8 | 64 pages, comprehensive |
| Mobile Quality | 6 | Executive command app |
| Backend Quality | 7 | Capital readiness, ecosystem APIs |
| Investor Readiness | 7 | Strong investor pages |
| Release Discipline | 7 | E2E active, route smoke + journey tests |
| Production Readiness | 6 | Functional Alpha |
| **Overall** | **7.0** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** Capital readiness data live integration, investor portal load test, runbooks

---

### Stephen Lutar
| Dimension | Score | Notes |
|-----------|-------|-------|
| Product Clarity | 7 | Personal brand site |
| UX Quality | 7 | Clean design |
| Frontend Quality | 6 | Limited page set |
| Release Discipline | 6 | E2E active (smoke + routes + journey) |
| Production Readiness | 5 | Internal Alpha |
| **Overall** | **6.2** | |

**Maturity Label:** Internal Alpha
**Next Gate:** Functional Alpha
**Blockers:** Limited content depth, no backend integration

---

### Platform Core
| Dimension | Score | Notes |
|-----------|-------|-------|
| Backend Quality | 8 | 1,166 endpoints, well-structured |
| Security | 7 | Auth, RBAC, rate limiting |
| Observability | 7 | Audit logging, telemetry hooks |
| Release Discipline | 7 | CI comprehensive + E2E active |
| Production Readiness | 5 | Needs load test, API integration test coverage |
| **Overall** | **6.8** | |

**Maturity Label:** Functional Alpha
**Next Gate:** Beta Candidate
**Blockers:** Load test, API integration test suite (< 20% endpoint coverage), runbooks

---

## Five-Pillar Gate Summary

### Reliability Pillar
| App | Health Endpoint | Crash Rate | Error Boundary | Status |
|-----|----------------|-----------|----------------|--------|
| Platform API | Partial | Unknown | N/A | Needs work |
| Lyte | No | Unknown | Yes | Needs work |
| Aegis | No | Unknown | Yes | Needs work |
| Terra | No | Unknown | Yes | Needs work |
| Vessels | No | Unknown | Yes | Needs work |
| SZL Holdings | No | Unknown | Yes | Needs work |
| Carlota Jo | No | Unknown | Yes | Needs work |

### Security Pillar
| App | Auth Required | RBAC | No Hardcoded Secrets | CORS Policy | Rate Limiting | Status |
|-----|--------------|------|---------------------|------------|--------------|--------|
| Platform API | Yes | Yes | Yes | Partial | Yes | Partial |
| Lyte | Yes | Yes | Yes | Partial | Yes | Partial |
| Aegis | Yes | Yes | Yes | Partial | Yes | Partial |
| Terra | Yes | Partial | Yes | Partial | Yes | Partial |
| Vessels | Yes | Partial | Yes | Partial | Yes | Partial |
| SZL Holdings | Partial | N/A | Yes | Partial | Partial | Needs work |
| Carlota Jo | Partial | N/A | Yes | Partial | No | Needs work |

### Operational Excellence Pillar
| App | CI Active | E2E Active | Runbooks | Alerting | Structured Logs | Status |
|-----|----------|-----------|----------|---------|-----------------|--------|
| Platform API | Yes | Partial | No | No | Partial | Needs work |
| Lyte | Yes | Yes | No | No | Partial | Needs work |
| Aegis | Yes | Yes | No | No | Partial | Needs work |
| Terra | Yes | Yes | No | No | Partial | Needs work |
| Vessels | Yes | Yes | No | No | Partial | Needs work |
| SZL Holdings | Yes | Yes | No | No | Partial | Needs work |
| Carlota Jo | Yes | Yes | No | No | No | Needs work |

### Performance Efficiency Pillar
| App | Bundle < 1MB | LCP < 2.5s | Code Splitting | API p95 < 500ms | Status |
|-----|-------------|-----------|---------------|----------------|--------|
| Platform API | N/A | N/A | N/A | Unknown | Unknown |
| Lyte | Partial | Unknown | Partial | Unknown | Needs work |
| Aegis | Yes | Unknown | Partial | Unknown | Partial |
| Terra | No (Mapbox 1.7MB) | Unknown | Partial | Unknown | Needs work |
| Vessels | No (Mapbox 1.7MB) | Unknown | Partial | Unknown | Needs work |
| SZL Holdings | Yes | Unknown | Partial | Unknown | Partial |
| Carlota Jo | Yes | Unknown | Partial | Unknown | Partial |

### Cost Awareness Pillar
| App | Resource Tagging | Cost Alerting | Retention Policies | Status |
|-----|-----------------|--------------|-------------------|--------|
| All | No | No | No | Gap |

---

## Summary Table

| App | Maturity Label | Overall Score | Next Action |
|-----|--------------|--------------|------------|
| Lyte Command Center | Functional Alpha | 6.8 | Bundle optimization, runbooks |
| Alloy (Engine) | Functional Alpha | 6.8 | E2E API tests, eval-gating |
| Aegis (Firestorm) | Functional Alpha | 6.9 | Runbooks, RBAC test coverage |
| Terra | Functional Alpha | 6.8 | Mapbox bundle, runbooks |
| Vessels | Functional Alpha | 6.6 | Mapbox bundle, fleet runbooks |
| SZL Holdings | Functional Alpha | 7.0 | Capital integration, runbooks |
| Carlota Jo | Internal Alpha | 6.3 | Booking E2E, client portal |
| Stephen Lutar | Internal Alpha | 6.2 | Content depth, journey tests |
| Platform Core | Functional Alpha | 6.8 | Load test, API integration tests |
