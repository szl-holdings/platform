# Amaru Investor-Demo Readiness Sweep — 2026-05-18

**Task:** T003 / Round 4 (Series-A operational track)
**Operator:** Async subagent
**Method:** Live curl walk of the running Amaru sidecar (`localhost:6810`),
its api-server bridge (`localhost:80/api/amaru/*`), and the Conduit SPA
(`localhost:80/conduit/*`); static review of route registration order and
the global auth allowlist.
**Scope rule:** NO MOCK DATA. Do not touch `amaru-ops-core.ts`. Do not
restart workflows.
**Sweep performed at:** 2026-05-18T14:33Z (UTC)

---

## 1. Live HTTP walk

### 1.1 Amaru FastAPI sidecar — direct `localhost:6810`

The sidecar (`services/amaru`, R0513 OVERWATCH + HUKLLA halt-authority +
chakana wiring) advertises its own endpoint list at `GET /`. Direct
probes (in-process, bypassing the api-server) show every endpoint is up.

| # | Endpoint                       | Status | Bytes | Notes                                                          |
|---|--------------------------------|--------|------:|----------------------------------------------------------------|
| 1 | `GET /healthz`                 | 200    |   166 | `{ok:true,service:"amaru",version:"0.1.0",chakras:[7],...}`    |
| 2 | `GET /overwatch/snapshot`      | 200    | 1,028 | 6 invariants, summary `{pass:4,warn:0,trip:1,reserved:1}` (I5 trips: edge deficit 14). |
| 3 | `GET /state`                   | 200    |   258 | Kernel + brain hashes, halt state.                              |
| 4 | `GET /receipts`                | 200    |    35 | Empty list — no receipts emitted yet.                           |
| 5 | `GET /events`                  | 200    |   179 | Recent yawar-bus events.                                        |
| 6 | `GET /tripwires`               | 200    |   965 | All HUKLLA tripwires + thresholds.                              |
| 7 | `GET /scheduler/wiring`        | 200    |   452 | Chakana scheduler wiring map.                                   |
| 8 | `GET /`                        | 200    |   281 | Service envelope, lists 8 endpoints.                            |
| 9 | `GET /docs`                    | 200    |   ~400+ | Swagger UI shell, OK.                                          |

### 1.2 Amaru bridge — `localhost:80/api/amaru/*` (consumed by browsers)

| # | Path                                 | Status (pre-fix) | Notes                                                                 |
|---|--------------------------------------|------------------|-----------------------------------------------------------------------|
| 1 | `GET /api/amaru/ops-core/snapshot`   | **200 / 4,026 B** | Healthy. Parity surface with vessels-ops-core. Out of scope by task constraint. |
| 2 | `GET /api/amaru/ops-core/healthz`    | **200 / 25 B**    | Healthy.                                                              |
| 3 | `GET /api/amaru/healthz`             | **401**           | "UNAUTHORIZED — endpoint requires a valid session." **BLOCKER #1.**   |
| 4 | `GET /api/amaru/overwatch/snapshot`  | **401**           | Same. **BLOCKER #1.** Conduit Operational Core page goes dark.        |
| 5 | `GET /api/amaru/state`               | **401**           | Same. **BLOCKER #1.**                                                 |
| 6 | `GET /api/amaru/receipts`            | **401**           | Not in `amaru-proxy.ts`; would 404 even if auth-allowed. (Out of scope.) |
| 7 | `GET /api/amaru/events`              | **401**           | Same as #6.                                                           |
| 8 | `GET /api/amaru/tripwires`           | **401**           | Same as #6.                                                           |

### 1.3 Conduit SPA — `localhost:80/conduit/*`

The Conduit SPA is served by `artifacts/conduit: web`. All routes resolve
to the same SPA shell (HTTP 200, 51,503 bytes) because routing is
client-side (wouter). The real readiness signal is the upstream API the
shell fetches once it mounts. 28 routes walked:

| # | SPA route                              | Shell | Principal API call(s) (status)                                          |
|---|----------------------------------------|-------|--------------------------------------------------------------------------|
| 1  | `/conduit/`                           | 200 / 51,496 B | (marketing landing — no auth-gated fetch)                          |
| 2  | `/conduit/cockpit` (= dashboard)      | 200            | `GET /api/conduit/stats` 200 / 133 B (zeros)                       |
| 3  | `/conduit/dashboard`                  | 200            | `GET /api/conduit/{stats,connections,syncs}` 200 / 200 / 200       |
| 4  | `/conduit/compute`                    | 200            | local fabric data                                                   |
| 5  | `/conduit/connections`                | 200            | `GET /api/conduit/connections` 200 / `[]`                          |
| 6  | `/conduit/syncs`                      | 200            | `GET /api/conduit/syncs` 200 / `[]`                                |
| 7  | `/conduit/runs`                       | 200            | `GET /api/conduit/sync-runs?...` 200 / empty                        |
| 8  | `/conduit/templates`                  | 200            | `GET /api/conduit/templates` 200                                    |
| 9  | `/conduit/settings`                   | 200            | static + `/api/csrf-token`                                          |
| 10 | `/conduit/convergent-sync`            | 200            | local fabric data                                                   |
| 11 | `/conduit/codex-loop`                 | 200            | local fabric data                                                   |
| 12 | `/conduit/ouroboros`                  | 200            | local fabric data                                                   |
| 13 | `/conduit/thesis`                     | 200            | static doctrine page                                                |
| 14 | `/conduit/brain`                      | 200            | local fabric data                                                   |
| 15 | `/conduit/sigil`                      | 200            | `/api/sigil/*` 200 (public allowlist)                               |
| 16 | `/conduit/operational-core`           | 200            | `GET /api/amaru/overwatch/snapshot` **401** — page renders red error banner. **BLOCKER #1.** |
| 17 | `/conduit/sovereign-ai-hub`           | 200            | hub index                                                            |
| 18 | `/conduit/innovation`                 | 200            | static                                                              |
| 19 | `/conduit/roadmap`                    | 200            | static                                                              |
| 20 | `/conduit/agents`                     | 200            | local fabric data                                                   |
| 21 | `/conduit/observability`              | 200            | static                                                              |
| 22 | `/conduit/outcomes`                   | 200            | static                                                              |
| 23 | `/conduit/policies`                   | 200            | static                                                              |
| 24 | `/conduit/mappings`                   | 200            | static                                                              |
| 25 | `/conduit/destinations`               | 200            | static                                                              |
| 26 | `/conduit/models`                     | 200            | static                                                              |
| 27 | `/conduit/sources`                    | 200            | static                                                              |
| 28 | `/conduit/admin/usage`                | 200            | `GET /api/admin/usage` (auth-gated by design)                       |

Raw evidence (sample, all captured 14:33Z):

```
$ curl -sS http://localhost:6810/overwatch/snapshot | head -c 200
{"panel_version":"r0513.v1","thesis_kernel_hash":"01f6c9b6",
 "thesis_brain_hash":"df4e9741","read_only":true,
 "invariants":[{"id":"I1","title":"kl_drift_per_axis","status":"pass",...

$ curl -sS http://localhost:80/api/amaru/overwatch/snapshot
{"error":"This endpoint requires a valid session. Please log in.",
 "code":"UNAUTHORIZED","requestId":"d8d3e504-...","correlationId":"5adc..."}

$ curl -sS http://localhost:80/api/amaru/ops-core/snapshot | head -c 200
{"generated_at":"2026-05-18T14:32:50.424Z","ttl_seconds":30,
 "product":{"slug":"amaru","title":"Amaru — Convergent Multi-Source Sync",
 "stage":"Series A operational"},"anatomy_region":{"region":"HANDS",...

$ curl -sS http://localhost:80/api/conduit/stats
{"totalSyncs":0,"activeSyncs":0,"totalRuns":0,"successfulRuns":0,
 "failedRuns":0,"totalRowsWritten":0,"successRate":0,"recentRuns":[]}

$ curl -sS http://localhost:80/api/conduit/connections
[]
$ curl -sS http://localhost:80/api/conduit/syncs
[]
```

---

## 2. Top demo blockers (ranked)

1. **Amaru sidecar proxy endpoints return 401 through the api-server
   bridge.** `routes/amaru-proxy.ts` mounts GET handlers for
   `/api/amaru/healthz`, `/api/amaru/state`, and
   `/api/amaru/overwatch/snapshot`, but none of those paths are in the
   `globalAuthEnforcer` allowlist (`PUBLIC_EXACT_PATHS` /
   `PUBLIC_PREFIXES` / `OPS_CORE_PUBLIC_PREFIXES`), so every browser
   request is rejected with `UNAUTHORIZED` *before* it reaches the proxy.
   The Conduit Operational Core page
   (`artifacts/conduit/src/pages/operational-core.tsx` line 139) calls
   `/api/amaru/overwatch/snapshot` from a cold session, catches the 401,
   and renders an empty/error envelope instead of the live R0513
   OVERWATCH panel. **This is the single most damaging issue for an
   Amaru-side demo: the marquee "Operational Core" surface goes dark.**

2. **Conduit `stats`, `connections`, `syncs`, `sync-runs` return empty
   for the anonymous/demo session.** All four endpoints are healthy
   (200) but yield `totalSyncs: 0`, `[]`, `[]`, `[]`. Same root cause
   as the Vessels sweep (Round 3 T003): the Conduit tables have not been
   seeded against the currently-attached `DATABASE_URL`. The Cockpit
   *gracefully* falls back to the local `RELAY_*` fabric reference values
   and shows a soft red banner ("Live API unreachable — showing fabric
   reference values") only on hard error, so the dashboard does render
   numbers — but the "· live" tiles all read zero.

3. **`temporal-worker` and `temporal-approval-worker` workflows
   `failed`.** Surfaced in the workflow status panel during the sweep.
   These do not affect any of the read paths used by Amaru/Conduit
   demos, but any future approval-loop or scheduled-sync demo step will
   be inert until the workers recover.

4. **R0513 invariant I5 (`maxwell_m_zero_rigidity`) is *legitimately*
   tripping** (`edge deficit 14 — graph under-constrained`). This is
   surfaced honestly by the sidecar and the Conduit Operational Core
   page is *designed* to display the trip — it is a true read of an
   under-constrained chakana wiring, not a defect. Noted here as
   "not a blocker, but will draw questions on stage." Recommended:
   pre-brief the audience that I5 = trip is the read-only sensor doing
   its job, and that HUKLLA (halt authority) has not been engaged.

5. **`/api/conduit/runs` returns 404** at the bare path while
   `/api/conduit/sync-runs` is the canonical list endpoint. Not a
   blocker — the SPA never calls the bare path — but a request like
   `curl /api/conduit/runs` from a curious investor would produce an
   unhelpful 404. Cosmetic; leave alone.

---

## 3. Fixes applied this session

### Fix #1 — Whitelist Amaru sidecar proxy paths in `globalAuthEnforcer` (committed)

**File:** `artifacts/api-server/src/middlewares/global-auth-enforcer.ts`

**Change:** Added three exact-path entries to `PUBLIC_EXACT_PATHS` for
`/api/amaru/healthz`, `/api/amaru/state`, and
`/api/amaru/overwatch/snapshot`. These are the only three handlers
registered in `routes/amaru-proxy.ts`. The proxy is GET-only by design
(see file comment: *"GET-only by design — exposing POST handlers here
would let a UI cycle violate the read-only invariant of the organ"*)
and the upstream FastAPI organ (`services/amaru`) is itself read-only
(R0513 watches; halt authority belongs to HUKLLA). A POST/PUT/PATCH/
DELETE to any of these paths will still 404 at the router because the
proxy never registered those verbs. Same posture as the existing
`/api/amaru/ops-core/` carve-out in `OPS_CORE_PUBLIC_PREFIXES`.

```ts
  "/api/enterprise-mcp/revoked-subjects",
  // Amaru sidecar read-only proxy (routes/amaru-proxy.ts). The Conduit
  // Operational Core page (artifacts/conduit/src/pages/operational-core.tsx)
  // calls /api/amaru/overwatch/snapshot from the browser without a session;
  // /healthz + /state back the supporting health pills. The proxy registers
  // ONLY GET handlers (POST/PUT/PATCH/DELETE 404 at the router) and the
  // upstream FastAPI organ (services/amaru) is read-only by design — R0513
  // watches, halt authority lives in HUKLLA — so exact-path public exposure
  // is bounded. Same posture as /api/amaru/ops-core/ already in
  // OPS_CORE_PUBLIC_PREFIXES below.
  "/api/amaru/healthz",
  "/api/amaru/state",
  "/api/amaru/overwatch/snapshot",
```

**Before evidence (pre-edit, captured 14:33Z):**

```
GET /api/amaru/healthz             -> 401 UNAUTHORIZED
GET /api/amaru/overwatch/snapshot  -> 401 UNAUTHORIZED
GET /api/amaru/state               -> 401 UNAUTHORIZED
```

**After evidence:** ⚠️ Could not be captured live in this session.
The `artifacts/api-server: api` workflow uses `node ./build.mjs &&
node dist/index.mjs` with no file-watch hot-reload, so source changes
take effect only on the next process restart. Per task constraint
*"do not restart workflows"*, the bounce is left to the main agent.

Expected post-restart outcomes:

- `GET /api/amaru/healthz` → 200 / 166 B (Amaru sidecar health envelope)
- `GET /api/amaru/state` → 200 / 258 B (kernel + brain hashes, halt state)
- `GET /api/amaru/overwatch/snapshot` → 200 / 1,028 B (live R0513 panel)
- Conduit `/conduit/operational-core` renders the live B2 OVERWATCH panel
  with 6 invariants and the `{pass:4,warn:0,trip:1,reserved:1}` summary
- Mutating verbs to any of the three paths still 404 at the proxy router
- `/api/amaru/ops-core/snapshot` unchanged (already 200; mounted on its
  own router and covered by `OPS_CORE_PUBLIC_PREFIXES`)

**Risk:** Low. PUBLIC_EXACT_PATHS uses `Set.has(req.path)` so only the
three exact strings match. The amaru-proxy router has no other handlers
and no `:param` routes, so there is no overshoot. The upstream sidecar
is read-only by design and runs in-process on loopback (no
network-exposed side-effects).

### Fix #2 — Conduit seed (not attempted this session; honest disclosure)

The Conduit `stats`/`connections`/`syncs`/`sync-runs` returning empty is
the same class of issue surfaced in the Vessels Round-3 sweep: the
attached `DATABASE_URL` has not been seeded for the Conduit tables.
Writing fresh rows by hand would violate the **NO MOCK DATA** rule of
this task and would drift from any canonical seed. The Cockpit page
already falls back to the local `RELAY_*` fabric reference values when
the API is unreachable, so the surface is not *empty* on stage — it is
just showing reference values. The right remediation is to identify or
author a canonical Conduit seed script, run it, and re-verify. Out of
scope for a "no-restart, no-mock-data" sweep.

### Fix #3 — Out of scope this session

The remaining ranked items (`temporal-worker` failure, I5 invariant
trip, bare `/api/conduit/runs` 404) are out of scope under this task's
constraints (no workflow restart; I5 is honest sensor output; the 404
path is uncalled by the SPA).

---

## 4. Residual gaps (honest)

| # | Gap                                                                                | Severity | Owner action                                                                                       |
|---|------------------------------------------------------------------------------------|----------|----------------------------------------------------------------------------------------------------|
| A | API server must restart for the global-auth-enforcer change to take effect.       | High     | Main agent: bounce `artifacts/api-server: api`.                                                    |
| B | Conduit tables (`stats`, `connections`, `syncs`, `sync-runs`) appear unseeded.    | High     | Identify/author canonical Conduit seed; run against `DATABASE_URL`; re-verify the four endpoints.  |
| C | `temporal-worker` + `temporal-approval-worker` workflows `failed`.                | Medium   | Out of scope for read paths; blocks any approval-loop / scheduled-sync demo step.                  |
| D | R0513 I5 tripping (`edge deficit 14`).                                            | Low      | Honest sensor output. Pre-brief audience or under-constrain chakana wiring intentionally.          |
| E | No automated contract test asserting `/api/amaru/overwatch/snapshot` !== 401.     | Low      | Add a request-level test to the api-server suite to prevent future allowlist drift.                |
| F | Conduit cockpit's "Live API unreachable" red banner can confuse demo audiences when the soft fallback to fabric reference data is active. | Low | Phrase the banner as "Showing reference fabric (no live data yet)" to remove the implied failure. |

---

## 5. Acceptance-criteria checklist

- [x] Dossier doc exists at `dossier/series-a-operational/AMARU_DEMO_READINESS_2026-05-18.md`.
- [x] ≥ 8 routes walked with real HTTP codes (28 SPA routes + 8 bridge paths + 9 direct sidecar paths = 45 walked).
- [x] Top blockers identified and ranked (5 ranked).
- [x] Top 1 fix applied at source level (auth allowlist for the three GET-only Amaru proxy paths); reasons for not applying #2 disclosed honestly (no-mock-data + no-restart rule).
- [x] Residual-gap list included, with concrete owner actions.
- [x] `amaru-ops-core.ts` not touched.
- [x] No workflows restarted.
- [x] No mock data inserted.

---

*Generated 2026-05-18T14:34Z by async subagent T003 (Round 4).*
