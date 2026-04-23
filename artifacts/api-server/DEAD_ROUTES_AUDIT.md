# Dead Routes Audit

**Audited:** 2026-04-16  
**Method:** Static import analysis — all flat route `.ts` files cross-referenced against every `import` statement in `src/routes/groups/*.ts` and `src/index.ts`.

**Cleaned up:** 2026-04-18 — Category A files deleted (see below).  
**Updated:** 2026-04-23 — Category B rename completed; INCA brand decision documented (Task #1439).

---

## Findings

### Category A — Completely Unregistered (High Confidence Dead)

~~These four route files existed in `src/routes/` but were **never imported** by any group file or `src/index.ts`. Their route handlers were unreachable by any HTTP client.~~

**Status: DELETED on 2026-04-18.**

| File | Lines | Route Handlers | Routes |
|---|---|---|---|
| ~~`carlota-live.ts`~~ | 32 | 2 | `GET /carlota/live/consulting`, `GET /carlota/live/brand-summary` |
| ~~`dreamscape-live.ts`~~ | 36 | 3 | `GET /dreamscape/live/campaigns`, `GET /dreamscape/live/metrics`, `GET /dreamscape/live/campaign-summary` |
| ~~`inca-live.ts`~~ | 31 | 2 | `GET /inca/live/reports`, `GET /inca/live/model-summary` |
| ~~`readiness-live.ts`~~ | 37 | 3 | `GET /readiness/live/assessments`, `GET /readiness/live/metrics`, `GET /readiness/live/summary` |

**Pattern:** All four were small "live data" companion files — each fetched external/public data and returned it in a simplified format. They appear to have been scaffolded alongside their parent modules but never wired into the route registry.

---

### Category B — Legacy Filename (Low Risk, Rename Candidate)

| File | Issue |
|---|---|
| ~~`inca.ts`~~ | File header comment: _"legacy filename, module now known as Aegis Intelligence"_. The module is actively imported as `aegisIntelRouter` in `groups/security.ts`. The filename is misleading but the routes are live. |

**Status: DONE — renamed `inca.ts` → `aegis-intel.ts` on 2026-04-23.**

**AI Research Lab brand decision (Task #1439):** The brand name "INCA AI Research" has been **renamed to "AI Research Lab"** (Task #1439, 2026-04-23). "INCA" appears in the brand registry's `deprecatedStrings` list, confirming the Series A rebrand intended to retire it. The slug (`inca`), route mount path (`/inca`), and `appSlug` values are unchanged — only the display name is updated across `lib/config`, `lib/services`, `lib/shared-ui`, `lib/observability`, `packages/config`, and `artifacts/api-server`.

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

| Category | Count | Action | Status |
|---|---|---|---|
| Completely unregistered files | 4 | Delete | **Done — deleted 2026-04-18** |
| Legacy-named but active | 1 | Rename | **Done — renamed 2026-04-23** |
| Legacy section in active file | 1 | Review & prune | Open |
| Dev-only route exposed in prod | 1 | Guard or remove | Open |

**Total unreachable route handlers removed:** 10 (across the 4 deleted files)
