# SZL Holdings — Operational Readiness Scorecard

**Date:** 2026-04-21  
**Auditor:** Enterprise Rehaul — Task #2841  
**Rating scale:** ✅ Green (ready) | ⚠️ Amber (partial/conditional) | ❌ Red (not ready) | — N/A

---

## Summary Score

| Category | Score | Investor-Ready? |
|---|---|---|
| Security & Auth | 8/10 | ✅ Yes |
| Data Layer | 7/10 | ✅ Yes |
| API Reliability | 7/10 | ⚠️ Conditional |
| Observability | 8/10 | ✅ Yes |
| Dev Ops / CI | 7/10 | ⚠️ Conditional |
| Frontend Quality | 6/10 | ⚠️ Conditional |
| Mobile | 5/10 | ⚠️ Not for lead demos |
| **Overall** | **6.9/10** | **⚠️ Conditionally ready** |

---

## Category Detail

### Security & Auth — 8/10 ✅
| Item | Status | Notes |
|---|---|---|
| Deny-by-default auth on all API routes | ✅ | Global enforcer active |
| 11-role RBAC with hierarchy | ✅ | Role model solid |
| Tenant isolation (DB + API + RAG) | ✅ | All P0 gaps closed Apr-2026 |
| CSRF protection | ✅ | Double-submit cookie |
| Rate limiting | ✅ | Global + per-endpoint |
| Security headers (CSP, HSTS) | ✅ | Production helmet config |
| SAST in CI | ✅ | CodeQL active |
| Dependency review in CI | ✅ | Active |
| Internal token timing safety | ✅ | timingSafeEqual |
| Field-level PII encryption | ⚠️ | Open (KG020d) |
| Virus scanning on uploads | ⚠️ | Open (KG020c) |
| Responsible disclosure / security.txt | ⚠️ | Open (VD1) |

### Data Layer — 7/10 ✅
| Item | Status | Notes |
|---|---|---|
| PostgreSQL 16 | ✅ | Production database |
| 139 migrations tracked | ✅ | Drizzle + hand-authored |
| Tenant scoping in schema | ✅ | org_id on entity tables |
| RAG tenant partitioning | ✅ | Fixed Apr-2026 |
| Connection pooling | ✅ | Configurable via env |
| Duplicate migration prefixes | ⚠️ | 5 conflicts; journal resolves |
| Legacy tables (stephen*) | ⚠️ | Dead schema; remove |
| Missing indexes on hot paths | ⚠️ | 3 high-risk items |
| Data retention policies | ⚠️ | Not formally defined |

### API Reliability — 7/10 ⚠️
| Item | Status | Notes |
|---|---|---|
| 268 routes operational | ✅ | All registered |
| Error envelope consistent | ✅ | sendError/sendNotFound |
| Request/trace IDs | ✅ | correlationMiddleware |
| Graceful startup on missing env | ✅ | Startup validation |
| Zod validation coverage | ✅ | 100% (268/268); initial 89-route estimate was false positive (see route-health.md) |
| Pagination on all list endpoints | ⚠️ | Not universally enforced |
| MFA on sensitive ops | ⚠️ | Not documented |

### Observability — 8/10 ✅
| Item | Status | Notes |
|---|---|---|
| Structured logging (pino) | ✅ | JSON logs; pinoHttp |
| OpenTelemetry configured | ✅ | OTLP export capable |
| Sentry error tracking | ✅ | @sentry/node active |
| Request correlation IDs | ✅ | Every request |
| Tenant isolation violation alerts | ✅ | Logged + telemetry |
| SLI/SLO definitions | ⚠️ | Open (KG023) |
| Lighthouse CI performance | ⚠️ | Open (KG019) |

### Dev Ops / CI — 7/10 ⚠️
| Item | Status | Notes |
|---|---|---|
| CI pipeline | ✅ | GitHub Actions: CI, CodeQL, Security |
| Type checking | ✅ | turbo typecheck |
| Linting | ✅ | Biome + oxlint |
| Unit tests | ✅ | Vitest |
| E2E tests | ✅ | Playwright (added Apr-2026) |
| Brand check | ✅ | Passes post-fix |
| Mock audit | ✅ | Passes (2 comments-only warnings) |
| CODEOWNERS | ✅ | Added Apr-2026 |
| Automated deployment | ⚠️ | Not configured |
| Schema drift detection | ⚠️ | Not in CI |
| SBOM | ⚠️ | Script exists; not in CI |

### Frontend Quality — 6/10 ⚠️
| Item | Status | Notes |
|---|---|---|
| Design system (tokens + shell) | ✅ | @szl-holdings/design-system v0.1.0 |
| No neon palette in product UX | ✅ | Deprecated; enterprise accents only |
| Brand check passing | ✅ | Post-fix: all 11 violations resolved |
| Consistent error/loading states | ⚠️ | Varies by artifact |
| A11y audit | ⚠️ | Not systematically done (KG025) |
| Bundle size | ⚠️ | 1–1.7MB; not optimized (KG024) |
| Catalog dep harmonization | ⚠️ | 86 deps not using workspace catalog |

### Mobile (CORTEX) — 5/10 ⚠️
| Item | Status | Notes |
|---|---|---|
| Core modules functional | ✅ | Biometric auth, main screens |
| Terra modules connected | ⚠️ | Not connected to live API |
| Safe-area compliance | ⚠️ | Issues flagged |
| Tab bar obscuring content | ⚠️ | Known issue |
| Tap target audit | ⚠️ | Not completed |
| Keyboard overlap | ⚠️ | Not audited |
| Offline support | ⚠️ | Partial |

---

## Top 5 Actions Before Investor Demo

1. ✅ **Fix brand violations** — Done (11 violations resolved; brand check passes)
2. **Configure MAPBOX_TOKEN** — Terra maps blank without it; significant demo gap
3. **Verify LLM API keys** — AI analysis routes may fall back to demo mode without them
4. **Resolve env required vars** — DATABASE_URL, SESSION_SECRET must be confirmed in prod secrets
5. **Start all workflows** — Preview pane shows blank until each artifact workflow is started

---

## Investor Demo Safe Checklist

- [x] Brand violations resolved
- [x] All P0 security gaps closed
- [x] Tenant isolation verified
- [x] Design system enterprise tokens active (no neon)
- [ ] MAPBOX_TOKEN configured
- [ ] LLM API keys verified
- [ ] All workflows started
- [ ] Screenshots updated to reflect current UI
