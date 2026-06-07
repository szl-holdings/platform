# Performance Audit
**Phase:** 8 + 11  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Known Performance Issues

### Bundle Size (KG024 — P2)

| Artifact | Estimated Bundle Size | Target | Status |
|---|---|---|---|
| szl-holdings | ~1.4 MB | < 500 KB | ⚠️ Large (KG024) |
| command | ~1.7 MB | < 600 KB | ⚠️ Large (KG024) |
| lyte-command-center | ~1.2 MB | < 500 KB | ⚠️ Large (KG024) |
| aegis | ~1.1 MB | < 500 KB | ⚠️ Large (KG024) |
| vessels | ~1.0 MB | < 400 KB | ⚠️ Large (KG024) |
| terra | ~1.1 MB | < 500 KB | ⚠️ Large (KG024) |
| carlota-jo | ~0.8 MB | < 400 KB | 🟡 Acceptable |
| Other artifacts | ~0.5–0.9 MB | < 400 KB | 🟡 Acceptable |

**Root cause:** Large vendor bundles (React Query, Framer Motion, Mapbox, chart libraries) without code splitting.  
**Recommended fix:** Vite dynamic imports for heavy chart/map libraries; enable tree shaking; lazy-load Framer Motion animations.  
**Priority:** P2 — not a demo blocker; notable in production performance.

---

## No Lighthouse CI Guard (KG019 — P2)

| Finding | Lighthouse performance regression guard not configured |
|---|---|
| Impact | Performance regressions can ship undetected |
| Recommended fix | Add `lighthouse-ci` to GitHub Actions on main artifact pages |
| Priority | P2 — Sprint 4 |

---

## Cold Start Performance

| Environment | Cold Start Time | Target | Status |
|---|---|---|---|
| API server | ~3–5s (Replit cold start) | < 10s | ✅ Acceptable |
| Frontend apps | ~2–4s (Vite dev) | < 5s | ✅ Acceptable |
| Full platform (all workflows) | ~10–15s | < 20s | ✅ Acceptable |

**Note:** Replit containers have a warmup period on first request after inactivity. This is acceptable for design-partner phase but may need optimization for production SLAs.

---

## N+1 Query Analysis

| Surface | N+1 Risk | Status |
|---|---|---|
| Lyte signals list | None detected | ✅ Joins used |
| Decision recommendations | None detected | ✅ Single query with eager load |
| Entity graph | Potential N+1 on entity relationship fetch | ⚠️ Review |
| Proof chain browser | None detected | ✅ Paginated |
| Agent run list | None detected | ✅ Paginated |
| Terra property list | Potential N+1 on ownership records | ⚠️ Review |

---

## Caching

| Layer | Status | Notes |
|---|---|---|
| Redis cache | ⚠️ Not configured (`REDIS_URL` not set — GAP-009) | Falls back to LRU in-memory cache |
| Vite build caching | ✅ | Asset hashing enabled |
| API response caching | ✅ | Short-lived caching on read-heavy routes |
| Static asset CDN | ⚠️ Not configured | Post-funding infrastructure |

---

## Asset Compression

| Setting | Status |
|---|---|
| Gzip / Brotli compression | ✅ Enabled in Express (compression middleware) |
| Image optimization | ✅ Images use WebP format where available |
| Vite minification | ✅ esbuild minification enabled |
| Tree shaking | ✅ Enabled but vendor chunks still large |

---

## Performance Recommendations

| Priority | Action | Effort |
|---|---|---|
| P2 | Add code splitting for Mapbox, chart libraries | 1 day |
| P2 | Configure Lighthouse CI in GitHub Actions | 0.5 day |
| P3 | Add Redis for session and query caching | 0.5 day |
| P3 | Investigate N+1 on entity graph and Terra property list | 1 day |
| P3 | Add CDN for static assets | Post-funding |
