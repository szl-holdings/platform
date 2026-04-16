# Dead Routes Audit

**Audited:** 2026-04-16  
**Method:** Static import analysis — all flat route `.ts` files cross-referenced against every `import` statement in `src/routes/groups/*.ts` and `src/index.ts`.

---

## Findings

### Category A — Completely Unregistered (High Confidence Dead)

These four route files exist in `src/routes/` but are **never imported** by any group file or `src/index.ts`. Their route handlers are unreachable by any HTTP client.

| File | Lines | Route Handlers | Routes |
|---|---|---|---|
| `carlota-live.ts` | 32 | 2 | `GET /carlota/live/consulting`, `GET /carlota/live/brand-summary` |
| `dreamscape-live.ts` | 36 | 3 | `GET /dreamscape/live/campaigns`, `GET /dreamscape/live/metrics`, `GET /dreamscape/live/campaign-summary` |
| `inca-live.ts` | 31 | 2 | `GET /inca/live/reports`, `GET /inca/live/model-summary` |
| `readiness-live.ts` | 37 | 3 | `GET /readiness/live/assessments`, `GET /readiness/live/metrics`, `GET /readiness/live/summary` |

**Pattern:** All four are small "live data" companion files — each fetches external/public data and returns it in a simplified format. They appear to have been scaffolded alongside their parent modules but never wired into the route registry.

**Recommendation:** Delete these four files. If the live-feed endpoints are needed, wire them into the appropriate group file (e.g., `groups/misc.ts` or their parent domain group).

---

### Category B — Legacy Filename (Low Risk, Rename Candidate)

| File | Issue |
|---|---|
| `inca.ts` | File header comment: _"legacy filename, module now known as Aegis Intelligence"_. The module is actively imported as `aegisIntelRouter` in `groups/security.ts`. The filename is misleading but the routes are live. |

**Recommendation:** Rename `inca.ts` → `aegis-intel.ts` and update the import in `groups/security.ts`. No route changes needed.

---

### Category C — Legacy Route Section (Low Risk, Prune Candidate)

| File | Location | Issue |
|---|---|---|
| `vessels-extended.ts` | Line 434 | Section header: `// ── Legacy Voyages (maritime.ts voyagesTable) ──`. Routes reference `voyagesTable` from a module previously called `maritime.ts`. The routes are registered and reachable, but the data model may be superseded. |

**Recommendation:** Review whether the legacy voyages routes in `vessels-extended.ts` are still consumed by any frontend. If not, remove the section.

---

### Category D — Route Stub Inside Route Handler

| File | Route | Issue |
|---|---|---|
| `firestorm/routes.ts` | `POST /firestorm/seed` | Seed-data endpoint exposed on the API. Suitable for development only — should be gated with `NODE_ENV !== "production"` or removed from production builds. |

**Recommendation:** Add a `process.env.NODE_ENV !== "production"` guard around the seed route registration, or move seeding entirely to the startup bootstrap sequence.

---

## Summary

| Category | Count | Action |
|---|---|---|
| Completely unregistered files | 4 | Delete |
| Legacy-named but active | 1 | Rename |
| Legacy section in active file | 1 | Review & prune |
| Dev-only route exposed in prod | 1 | Guard or remove |

**Total unreachable route handlers:** 10 (across the 4 unregistered files)
