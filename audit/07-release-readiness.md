# SZL Holdings — Release Readiness

**Audit date:** 2026-04-21  
**Verdict: NOT RELEASE-READY.** Runtime blockers B-01 through B-10 must be resolved first.

**Truth Label Key (applies to all factual claims in this document):**
- **VERIFIED** — confirmed from filesystem, grep, or direct file inspection  
- **PARTIALLY VERIFIED** — partially confirmed; runtime or integration behavior not checked  
- **UNVERIFIED** — asserted but not checked in this audit  
- **BROKEN** — claim is contradicted by primary-source evidence

---

## Release Readiness Scorecard

| Category | Score | Notes | Audit Status |
|----------|-------|-------|--------------|
| Runtime (workflows running) | 0 / 10 | All 18 workflows NOT STARTED | **VERIFIED** — system log confirms 18 workflows NOT STARTED |
| Auth security | 3 / 10 | Structure exists; 9 open findings; dual role system | **PARTIALLY VERIFIED** — code structure confirmed; runtime behavior unverified |
| Database / Schema | 6 / 10 | 915 table definitions verified (direct `pgTable(` calls); migration posture risky; seed scripts partially broken | **VERIFIED** for table count; **PARTIALLY VERIFIED** for migration posture (not run in this audit) |
| API surface | 5 / 10 | 268 route groups code-verified; server not running | **VERIFIED** for route count (filesystem); **UNVERIFIED** for runtime behavior |
| CI/CD | 6 / 10 | CI config exists; lint/typecheck clean on targeted packages; integration tests not gated | **PARTIALLY VERIFIED** — CI config exists (VERIFIED); test gate status (PARTIALLY VERIFIED) |
| Documentation accuracy | 2 / 10 | Multiple contradictory metrics; wrong lifecycle states; RBAC names wrong | **VERIFIED** — contradictions documented across all audit files |
| External data connections | 4 / 10 | Public APIs likely functional; premium API keys missing; AIS simulated | **UNVERIFIED** — server not running; assessment based on route file analysis only |
| Investor positioning | 3 / 10 | No clear single narrative; contradictory counts damage credibility | **VERIFIED** — metrics contradictions documented; narrative gap confirmed |
| Error monitoring | 0 / 10 | Sentry not configured | **PARTIALLY VERIFIED** — Sentry DSN env var not set; no Sentry SDK init confirmed in code |
| Revenue path | 1 / 10 | Stripe in test mode only | **VERIFIED** — `STRIPE_SECRET_KEY` (test mode) confirmed |

**Overall release readiness: 3/10**

---

## What Would Make This "5/10" (Investor Demo Ready)

The following 10 actions would move the platform to investor-demoable state:

1. Start all workflows and verify smoke tests pass (`audit/deployment-checklist.md` Phase 0)
2. Set `MFA_SECRET_ENCRYPTION_KEY` (F-02, immediate security fix)
3. Add rate limiting to `/api/auth/login` (F-01)
4. Correct all contradictory metric claims in docs
5. Correct all "Live" lifecycle statuses in `PRODUCT_MATRIX.md`
6. Fix PRISM Counsel recovery seed script
7. Consolidate dual RBAC role system (or at minimum document the canonical role)
8. Wire Vessels commercial modules to live database
9. Confirm NOAA/GDELT/Open-Meteo routes return live data
10. Write an honest investor landing page anchored on the primary wedge (Alloy governance)

**Time estimate for steps 1–10:** 3–5 days of focused engineering work.

---

## What Would Make This "8/10" (Series A Ready)

All 10 above, plus:

11. Add enterprise custom domain to `CORS_ORIGINS` (`.replit [userenv.production]` already covers `*.replit.app,*.replit.dev,*.repl.co`)
12. Configure Sentry (frontend and backend)
13. Activate Stripe live mode
14. Activate Redis session store
15. Add E2E specs for at least 5 artifacts (currently 6 of 15 have zero tests)
16. Adopt single auth hook across all artifacts
17. Wire integration tests into CI gate
18. Fix `GOMAXPROCS` orphan references in 24 files
19. Consolidate Sentra into Aegis
20. Consolidate `/lyte/` and `/command/` into one experience

**Time estimate for steps 11–20:** Additional 1–2 weeks.

---

## Artifact-Level Readiness

| Artifact | Src Files | E2E Tests | Auth Pattern | Data Sources | Readiness |
|----------|-----------|-----------|--------------|--------------|-----------|
| `szl-holdings` | 469 | Yes | Redirect helper | Mixed | Beta — not running |
| `command` | 281 | Yes | Replit OIDC | Seeded | Beta — not running |
| `aegis` | 212 | Yes | Replit OIDC | CISA/NVD/MITRE (partially verified) | Beta — not running |
| `carlota-jo` | 89 | Yes | Shared hook (canonical) | World Bank/BLS (partially verified) | GA candidate — not running |
| `vessels` | 130 | Yes | Replit OIDC | NOAA/GDELT live; AIS simulated | Beta — not running |
| `terra` | 116 | Yes | Replit OIDC | NYC Open Data; needs Mapbox key | Beta — not running |
| `sentra` | 22 | **None** | Replit OIDC | Seeded mesh data | Alpha — not running |
| `pulse` | 23 | **None** | Local useAuth | AI gateway (partially verified) | Beta — not running |
| `lyte-command-center` | 23 | **None** | Replit OIDC | Live API (partially verified) | Beta — not running |
| `counsel` | 14 | **None** | Replit OIDC | None (skeleton) | Alpha skeleton — not running |
| `szl-holdings-mobile` | — | Jest suite | Replit OIDC | API server | Beta — not running |
| `szl-demo-video` | 14 | **None** | None (public) | Static | Alpha — not running |
| `api-server` | — | 851 vitest | Multi-mode | All domains | Beta — not running |
| `mockup-sandbox` | 19 | **None** | None | None | Internal — not running |

---

## Verdict

The SZL platform has **genuine engineering depth**: 915 schema-defined table definitions, 382 route files, a real workflow engine, and significant frontend code across 13 artifacts. The depth is real. The readiness gaps are primarily:

1. **Runtime:** Nothing is running. This is the most damaging state for an investor evaluation.
2. **Documentation integrity:** Multiple wrong numbers across publicly visible docs.
3. **Auth hardening:** 9 open findings from Phase A.
4. **Positioning:** No clear single narrative; artifacts appear as an unrelated portfolio.

None of these gaps require fundamental re-architecture. They require:
- Starting the platform and fixing startup issues
- Correcting documentation to match reality
- Remediating the 9 auth findings
- Repositioning the narrative around the primary wedge

This is achievable in the next 2–4 weeks.
