# REMOVALS AND CONSOLIDATION — Phase 2 + Phase 8

Captured: 2026-04-23.

## Removals shipped this pass (Phase 2)

| File | Reason | Risk |
| --- | --- | --- |
| `nohup.out` (root, 0 B) | Empty, gitignored already, leftover from earlier process | none |
| `docs/reports/master/logs/env-references.txt` (0 B) | Zero-byte log file with no consumers | none |
| `artifacts/api-server/src/middlewares/.gitkeep` | Directory is non-empty; placeholder no longer needed | none |
| `artifacts/api-server/src/lib/.gitkeep` | Directory is non-empty; placeholder no longer needed | none |

These were grep-verified for non-usage before removal.

## Removals proposed (require coordination, NOT shipped)

| Target | Reason | Why not shipped this pass | Owner |
| --- | --- | --- | --- |
| `lib/ontology/` (`@szl-holdings/ontology`) | Duplicate of `packages/ontology` (`@workspace/ontology`); only 3 consumers vs 36 for canonical package | Requires migrating 3 consumer imports + verifying no schema divergence | Phase 8 / dedicated task |
| `artifacts/api-server/src/routes/firestorm/`, `firestorm-*.ts`, `lib/db/src/schema/firestorm.ts`, etc. | Brand rename complete; old name is in deprecatedStrings list | Already tracked as Tasks #1437, #1438, #3419 — must follow that workflow to keep API spec / DB compatibility intact | Existing tasks |
| Stale baseline entries in `scripts/banned-brand-strings.baseline.json` (3,892 entries) | Mask real violations | Single command `pnpm brand:strings -- --update-baseline` — left for explicit owner approval since baseline rotation changes the safety net | Phase 10 |

## Duplication inventory (Phase 8 candidates)

The 14 oversized route files in `artifacts/api-server/src/routes/` (each >1,900 LOC) almost certainly contain repeated patterns that should be promoted to shared middleware:

- Auth/org-scoping checks (likely repeated in every handler)
- JSON response envelopes (`{ data, meta }` shape)
- Pagination clamps (`safeLimit`, `parsePaginationInt` already exists in some files but is duplicated)
- Error catch + structured-log pattern
- Zod-parsed query/body extraction

**Concrete evidence already in the codebase:** `artifacts/api-server/src/routes/consciousness.ts` defines `safeLimit(raw, fallback, max)`. `artifacts/api-server/src/routes/ai-ops-dashboard.ts` defines `parsePaginationInt(raw, defaultValue, max)`. These are the same function with different names.

**Recommendation (Phase 8, post-launch):**
1. Extract `safePaginationLimit(raw, { default, max })` into `artifacts/api-server/src/lib/http/pagination.ts`.
2. Replace both call sites and any other clamps that emerge from a `rg` sweep.
3. Add a small unit test for the helper.

This is exactly the kind of consolidation the brief calls for: subtraction, not addition.

## Consolidation NOT recommended

Per the brief's explicit constraints:

- Do **not** rewrite domain business logic in the 14 large route handlers — only the cross-cutting wiring may be extracted. The handlers themselves stay intact.
- Do **not** introduce a new "framework" or abstraction layer that would itself require maintenance.
- Do **not** consolidate Express + Hono — they may coexist, full migration is future work.

## Result

- **4 files removed** from repo (zero-byte / placeholder).
- **3 consolidations identified** with clear owners (deferred — see table).
- **Codebase is leaner by 4 files**, no production behaviour change.
