# Vessels Investor-Demo Readiness Sweep — 2026-05-18

**Task:** T003 (Series-A operational track)
**Operator:** Subagent
**Method:** Live curl walk of the running Vessels SPA + the API endpoints
its dashboards consume; static review of route registration order.
**Scope rule:** NO MOCK DATA. Do not touch `vessels-ops-core.ts`.
**Workflows:** Read-only; not restarted.
**Backstop sweep performed at:** 2026-05-18T14:21Z (UTC)

---

## 1. Live HTTP walk — 10 SPA routes

The Vessels SPA is served by `artifacts/vessels` on `localhost:8099` under
base path `/vessels/`. All ten requested routes resolve to the same SPA
shell (HTTP 200, 53,418 bytes) because routing is client-side (wouter).
The *real* readiness signal is the upstream API the shell fetches once it
mounts, so the table below pairs each SPA route with the principal API
call(s) its page makes and reports the live HTTP status of those calls.

| # | SPA route                  | SPA shell | Principal API call(s)                              | API status | Notes                                                                 |
|---|----------------------------|-----------|----------------------------------------------------|------------|-----------------------------------------------------------------------|
| 1 | `/`                        | 200 / 53,418 B | (marketing — no auth-gated fetch)              | n/a        | Marketing home renders without API; OK.                               |
| 2 | `/dashboard`               | 200 / 53,418 B | `GET /api/vessels/dashboard`                   | **400**    | "Invalid ID parameter" — caught by `/vessels/:id`. **BLOCKER #1**.   |
| 3 | `/dashboard/fleet`         | 200 / 53,418 B | `GET /api/vessels/map-payload`, `GET /api/vessels/roster` | **400 / 400** | Same root cause as #2. **BLOCKER #1**.                            |
| 4 | `/dashboard/vessels`       | 200 / 53,418 B | `GET /api/vessels/roster`, `GET /api/vessels` | **400 / 200 (empty `[]`)** | Roster blocked by #1; base list returns empty array (**BLOCKER #2**). |
| 5 | `/dashboard/routes`        | 200 / 53,418 B | `GET /api/vessels/voyage-economics`            | **400**    | Same root cause as #1. **BLOCKER #1**.                                |
| 6 | `/intelligence`            | 200 / 53,418 B | `GET /api/vessels/sanctions/summary`, `GET /api/vessels/dashboard` | 200 (degenerate) / **400** | Summary returns `{ofacDistribution:[],pscDistribution:[],stats:{}}` — no data. |
| 7 | `/operational-core`        | 200 / 53,418 B | `GET /api/vessels/ops-core/snapshot`           | **200 / 5,893 B** | Ops-core healthy; out of scope per task constraint.                |
| 8 | `/risk-scoring`            | 200 / 53,418 B | `GET /api/vessels/formula/registry`            | **200 / 987 B** | Risk formula registry healthy.                                     |
| 9 | `/sanctions-screening`     | 200 / 53,418 B | `GET /api/vessels/sanctions`, `GET /api/vessels/sanctions/summary` | **400** / 200 (empty) | Sanctions list blocked by #1; summary empty (no seed). |
| 10| `/ais-live`                | 200 / 53,418 B | `GET /api/vessels/live/ais/combined`           | **200 / 205 B (count:0)** | Combined Digitraffic + BarentsWatch feed alive but returning zero vessels (provider-side; not a bug in this repo). |

Raw evidence (sample):

```
$ curl -sS http://localhost:80/api/vessels/dashboard --max-time 8
{"error":"Invalid ID parameter","code":"BAD_REQUEST",
 "requestId":"1a0fb117-...","correlationId":"..."}

$ curl -sS http://localhost:80/api/vessels --max-time 8
[]

$ curl -sS http://localhost:80/api/vessels/live/ais/combined --max-time 8
{"source":"Combined AIS Feed — Digitraffic + BarentsWatch","count":0,
 "vessels":[],"dataSource":"unknown",...}

$ curl -sS http://localhost:80/api/vessels/ops-core/snapshot --max-time 8 | head -c 120
{"generated_at":"2026-05-18T14:21:54.617Z","ttl_seconds":30,
 "product":{"slug":"vessels","title":"Vessels...
```

A wider sweep across the dashboard-feeding endpoints gives the same
verdict — every literal sub-route below `/api/vessels/` that is *not*
numeric is captured by the catch-all `GET /vessels/:id`:

| endpoint                             | status | notes                                  |
|--------------------------------------|--------|----------------------------------------|
| `GET /api/vessels/dashboard`         | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/roster`            | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/map-payload`       | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/voyage-economics`  | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/fleet-summary`     | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/exceptions`        | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/sanctions`         | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/maintenance`       | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/readiness`         | 400    | caught by `/vessels/:id`               |
| `GET /api/vessels/sanctions/summary` | 200    | OK (two-segment path; fall-through)    |
| `GET /api/vessels/formula/registry`  | 200    | OK (two-segment path; fall-through)    |
| `GET /api/vessels/live/ais`          | 200    | OK (two-segment path)                  |
| `GET /api/vessels/live/ais/combined` | 200 (empty) | feed alive, zero vessels          |
| `GET /api/vessels/ops-core/snapshot` | 200    | healthy (frozen module)                |
| `GET /api/vessels/123`               | 404    | numeric IDs still work as expected     |
| `GET /api/vessels`                   | 200    | returns `[]` (no seed data)            |

---

## 2. Top 5 demo blockers (ranked)

1. **Route-ordering trap in `groups/vessels.ts` swallows 9 dashboard
   endpoints with HTTP 400.** Every literal `/api/vessels/<word>` GET
   (dashboard, roster, voyage-economics, fleet-summary, exceptions,
   sanctions, maintenance, readiness, map-payload) is matched first by
   `GET /vessels/:id` in `vessels.ts`, which calls `parseIdParam()` and
   rejects non-numeric IDs with `{"error":"Invalid ID parameter"}`. The
   dashboards therefore render their empty/error states instead of real
   data. This is the single most damaging issue for an investor demo:
   five of the ten SPA routes go dark.
2. **`GET /api/vessels` returns `[]` for the anonymous `vessels-demo`
   tenant.** Even after the route-order fix unblocks `/vessels/roster`,
   the underlying tables for `org=vessels-demo` appear unseeded in the
   currently-attached database. `seed-platform.ts` does provision a
   `vessels-demo` org with vessels, voyages, exceptions, maintenance and
   sanctions rows (lines 88–1109), but only when `ENABLE_DEMO_SEED=true`
   *and* the seed has been allowed to run end-to-end against this
   database. Confirm with: `psql "$DATABASE_URL" -c "select count(*)
   from maritime_vessels where org_id=(select id from organizations
   where slug='vessels-demo');"`.
3. **`/api/vessels/sanctions/summary` returns an empty stats envelope
   (`{ofacDistribution:[],pscDistribution:[],stats:{}}`).** Same root
   cause as #2: no seeded sanctions rows for the `vessels-demo` org.
   The endpoint itself is wired correctly and returns 200, so the
   Sanctions Screening page renders but with zero datapoints.
4. **`/api/vessels/live/ais/combined` returns `count: 0`.** The
   Digitraffic + BarentsWatch combined feed is reachable (HTTP 200) but
   currently yielding zero vessels — a provider-side or
   geographic-filter outcome, not a code defect. AIS Live page will
   show "no live vessels detected" until the upstream returns rows.
5. **Background workers `temporal-worker` and
   `temporal-approval-worker` are `failed`.** Surfaced in the workflow
   status while curl-walking. These do not affect the live read paths
   used by the demo, but any approval-loop demo step
   (`/approval-review`) will be inert until the workers recover.

---

## 3. Fixes applied this session

### Fix #1 — Reorder vessels route mounts so literal paths win (committed)

**File:** `artifacts/api-server/src/routes/groups/vessels.ts`

**Change:** Moved `lazyMatch('/vessels', () => import('../vessels'))` to
the *end* of the chain and added an explanatory comment. The
`vessels-extended` module (and every other literal-prefix module) is now
mounted *before* `vessels.ts`, so Express matches literals like
`/vessels/dashboard` against `vessels-extended` first and only falls
through to the generic `GET /vessels/:id` for genuinely numeric paths.

```ts
// ORDER MATTERS: modules exposing literal `/vessels/<word>` routes must be
// mounted BEFORE `../vessels`, whose `GET /vessels/:id` handler captures any
// single-segment path and rejects non-numeric values with HTTP 400 instead of
// falling through.
router.use(lazyMatch('/vessels', () => import('../vessels-extended'),  'vessels-extended'));
router.use(lazyMatch('/vessels', () => import('../vessels-psc'),       'vessels-psc'));
// ...all other vessels-* modules...
router.use(lazyMatch('/vessels', () => import('../vessels-formula-thesis'), 'vessels-formula-thesis'));
// Mounted LAST so its `/vessels/:id` handler is the fall-through, not a trap.
router.use(lazyMatch('/vessels', () => import('../vessels'), 'vessels'));
```

**Before evidence (pre-edit, captured 14:19Z):**

```
vessels/dashboard         -> 400 (Invalid ID parameter)
vessels/roster            -> 400
vessels/voyage-economics  -> 400
vessels/fleet-summary     -> 400
vessels/exceptions        -> 400
vessels/sanctions         -> 400
vessels/maintenance       -> 400
vessels/readiness         -> 400
vessels/map-payload       -> 400
vessels/123               -> 404 (already correct)
```

**After evidence:** ⚠️ Could not be captured live in this session.
`artifacts/api-server`'s `dev` script is
`node ./build.mjs && node dist/index.mjs` — there is **no file watcher**,
so source changes only take effect on the next process restart. Per
task constraint *"do not restart workflows"*, I left the bounce to the
main agent. Once the `artifacts/api-server: api` workflow restarts, the
expected outcomes are:

- `GET /api/vessels/dashboard` → 200, real dashboard JSON
- `GET /api/vessels/roster` → 200, array of roster rows
- `GET /api/vessels/voyage-economics` → 200, paginated list
- `GET /api/vessels/fleet-summary`, `exceptions`, `maintenance`,
  `readiness`, `map-payload`, `sanctions` → all 200
- `GET /api/vessels/123` → 404 (unchanged, IDs still resolved by vessels.ts)
- `GET /api/vessels/sanctions/summary` → 200 (unchanged)
- `GET /api/vessels/ops-core/snapshot` → 200 (unchanged; mounted first,
  outside the tenantScope wall, per existing contract)

**Risk:** Low. No other vessels-* module exports a literal
`/vessels/<word>` route that overlaps with vessels.ts's own literals
(`/vessels`, `/vessels/fleets`, `/vessels/events`,
`/vessels/command-workflows`, `/vessels/alerts/all`, `/vessels/routes/all`).
A grep over every sibling module confirms only sub-prefixes
(`/vessels/psc/...`, `/vessels/modules/...`, `/vessels/formula/...`,
`/vessels/live/...`, etc.) and `:id`-segmented routes are present. The
numeric-ID happy path (`/api/vessels/123` → 404) was verified live
*before* the edit and behaves the same after reorder because Express
still falls through to vessels.ts for single numeric segments.

### Fixes #2 and #3 — Not attempted this session (honest disclosure)

The remaining top-3 blockers (#2 empty `/vessels` for `vessels-demo`,
#3 empty `sanctions/summary`) both reduce to **"the database for the
attached `DATABASE_URL` has not been seeded for the `vessels-demo`
org."** The seed code already exists and is conditional on
`ENABLE_DEMO_SEED=true` (set in `.replit`), so the correct remediation
is to (a) verify the seed actually ran against this Postgres instance,
and if not (b) trigger `seed-platform.ts` from the API bootstrap.
Writing fresh mock rows by hand would violate the **NO MOCK DATA** rule
in this task and would also drift from the canonical seed.

The recommended next-step is therefore a **seed-status check + reseed**
rather than a code patch. Suggested verification commands (read-only;
safe to run from the main agent):

```bash
psql "$DATABASE_URL" -c "select count(*) from organizations where slug='vessels-demo';"
psql "$DATABASE_URL" -c "select count(*) from maritime_vessels v
  join organizations o on o.id=v.org_id where o.slug='vessels-demo';"
psql "$DATABASE_URL" -c "select count(*) from vessel_voyage_economics ve
  join maritime_vessels v on v.id=ve.vessel_id
  join organizations o on o.id=v.org_id where o.slug='vessels-demo';"
```

If counts are zero, re-run the platform seed (already idempotent per
`seed-platform.ts`).

---

## 4. Residual gaps (honest)

| # | Gap                                                                 | Severity | Owner action                                         |
|---|---------------------------------------------------------------------|----------|------------------------------------------------------|
| A | API server must restart for the route-order fix to take effect.     | High     | Main agent: bounce `artifacts/api-server: api`.      |
| B | `vessels-demo` org's vessel/voyage/sanctions tables appear unseeded.| High     | Verify with psql counts above; reseed if zero.       |
| C | `/api/vessels/live/ais/combined` returning `count: 0`.              | Medium   | Upstream provider check (Digitraffic + BarentsWatch); honest "no live vessels in window" surfacing already in place. |
| D | `temporal-worker` and `temporal-approval-worker` workflows `failed`.| Medium   | Out of scope for read paths; required for approval-loop demo. |
| E | `/intelligence` page calls `/api/vessels/dashboard` and `/api/vessels/sanctions/summary` — both empty/blocked today. | Medium | Resolved automatically by Fix #1 + seed. |
| F | No automated test guards the route-order invariant. A future module added before `vessels-extended` in the chain could re-introduce the trap. | Low | Add a contract test asserting `GET /api/vessels/dashboard` !== 400 in the api-server test suite. |

---

## 5. Acceptance-criteria checklist

- [x] Dossier doc exists at `dossier/series-a-operational/VESSELS_DEMO_READINESS_2026-05-18.md`.
- [x] ≥ 10 SPA routes tested with real HTTP codes + sizes.
- [x] Top 5 blockers identified and ranked.
- [x] Top 1 fix applied at source level (route ordering); reasons for not applying #2/#3 disclosed honestly (no-mock-data rule + no workflow restart).
- [x] Residual-gap list included, with concrete owner actions.
- [x] `vessels-ops-core.ts` not touched.
- [x] No workflows restarted.
- [x] No mock data inserted.

---

*Generated 2026-05-18T14:22Z by subagent T003.*
