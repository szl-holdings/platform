# Alpha Release Readiness

**Date:** 2026-04-27  
**Phase:** Rehaul 9/9  
**Release Tag:** `v1.0.0-alpha` (published 2026-04-20)  
**Release Path:** `bash scripts/release/alpha.sh [--publish] [--skip-tests]`  
**Equivalent alias:** `pnpm release:alpha`

---

## Release Path — `pnpm release:alpha`

The alpha release gate runs five sequential checks:

| Step | Command | What It Validates |
|---|---|---|
| 1 | `node scripts/qa/verify-env.js` | Required env variables present and non-empty |
| 2 | `pnpm run brand:strings` | Brand string compliance (no old names, placeholder strings) |
| 3 | `pnpm run typecheck:libs` | TypeScript type correctness across all shared libraries |
| 4 | `pnpm run test:unit` | API server unit tests (skippable with `--skip-tests`) |
| 5 | `pnpm run audit:mocks` + `pnpm run audit:routes` | Mock register and route coverage audit |

On `--publish`, the gate invokes `scripts/launch/publish-github-release.mjs` to create a GitHub Release draft.

**Full pre-release sweep** (includes build, security audit, product-mode smoke):
```bash
pnpm audit:series-a
```
This runs: `brand:check → typecheck → test → audit:mocks → audit:routes → audit:deps → audit:copy → security:audit → smoke:product-mode → build`

---

## Current Release State

### v1.0.0-alpha — Published 2026-04-20

| Dimension | Status | Evidence |
|---|---|---|
| Tag created | ✅ Yes | `v1.0.0-alpha` on `szl-holdings/szl-holdings-platform` |
| GitHub Release | ✅ Published | [Releases page](https://github.com/szl-holdings/szl-holdings-platform/releases/tag/v1.0.0-alpha) |
| CI gate passing | ✅ Yes | All 5 required status checks passing |
| All 13 web surfaces load | ✅ Verified | Runtime verification 2026-04-26 |
| Zero artifacts broken | ✅ Verified | No startup failures or crash loops |
| Brand string compliance | ✅ Verified | Old product names removed; placeholders absent |
| TypeScript errors | ✅ Resolved | Fixes applied in Tasks #2825 (TS2724, TS2353, TS2578, TS2375, TS2412) |
| Unit tests passing | ✅ Passing | API server unit tests green |
| Dependency audit | ✅ Clean | No Critical/High findings (excluding documented incompatibilities) |
| Changelog updated | ✅ Current | `CHANGELOG.md` includes all Rehaul phases |

---

## Release Checklist Status

| Section | Status | Notes |
|---|---|---|
| `CHANGELOG.md` updated | ✅ Done | All phases documented including this Rehaul closeout |
| `RELEASE_CHECKLIST.md` current | ✅ Current | No changes required |
| `docs/APP_STATUS.md` accurate | ⚠️ Stale date | File says "April 16, 2026"; content is accurate but needs date update |
| `README.md` accurate | ✅ Current | Updated 2026-04-26 with verified runtime status |
| Screenshots current | ✅ Current | Verified captures from 2026-04-25 live platform |
| No secrets in release commit | ✅ Verified | Gitleaks clean; analytics token audit confirmed |
| Migrations tested | ✅ N/A | Schema stable; no new migrations in this phase |
| Production deployment | ✅ Live | Deployed post-stabilization (Task #2825) |

---

## Known Gaps at Alpha (Documented Limitations)

These are not blockers for the alpha release. They are documented limitations that must be resolved before `v1.0.0` GA.

| Gap | Severity | Owner | Target |
|---|---|---|---|
| `sentra` — `/api/sentra/risks` route not registered | HIGH | API Server | v1.1.0 |
| Terra maps blank — Mapbox token not configured | MEDIUM | Infrastructure | v1.1.0 |
| AIS telemetry simulated (no live AIS provider) | MEDIUM | Vessels | v1.2.0+ |
| Command CORTEX badge counts not wired to live API | MEDIUM | Command | v1.1.0 |
| KORA legacy `/lyte/` path alias missing | LOW | Lyte/KORA | v1.1.0 |
| Enterprise SSO / SCIM 2.0 not GA | MEDIUM | API Server | v1.2.0 |
| Redis session store not in production | MEDIUM | Infrastructure | v1.1.0 |
| Sentry error tracking not active | LOW | Infrastructure | v1.1.0 |
| Integration tests not in CI | MEDIUM | CI | v1.1.0 |
| A11oy Phase 2 workcell engine incomplete | HIGH (roadmap) | A11oy | v1.2.0 |

---

## Next Release — v1.1.0 Criteria

Before cutting `v1.1.0`, the following must be resolved:

1. `/api/sentra/risks` route registered and returning real data
2. Mapbox token configured (or maps gracefully degraded with visible message)
3. Command badge counts wired to live API
4. Integration tests registered in CI (`audit/ci/` + `pnpm test:integration`)
5. Redis session store active in production
6. `docs/APP_STATUS.md` date updated

---

*Release readiness as of 2026-04-27. Run `pnpm audit:series-a` for a live automated gate check.*
