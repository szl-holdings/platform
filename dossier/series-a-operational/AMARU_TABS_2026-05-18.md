# AMARU × Conduit per-tab fix sweep — Round 5 / T003

Date: 2026-05-18
Scope: Conduit SPA at `http://localhost:80/conduit/*` (~28 tabs in
`artifacts/conduit/src/pages/`) ↔ Amaru FastAPI sidecar at
`http://localhost:6810` ↔ api-server bridge (`artifacts/api-server`,
`/api/amaru/*`).

Frozen file (NOT touched this round): `artifacts/api-server/src/routes/amaru-ops-core.ts`
(verified: no edit; only `amaru-proxy.ts` and `middlewares/global-auth-enforcer.ts`
were modified on the api-server side).

---

## 1. Walked tabs

Inventory from `ls artifacts/conduit/src/pages/`:

```
admin-usage.tsx       compute.tsx          mappings.tsx          settings.tsx
agents.tsx            connections/         models.tsx            sigil.tsx
brain.tsx             conduit-landing.tsx  observability.tsx     sources.tsx
codex-loop.tsx        convergent-sync.tsx  operational-core.tsx  sovereign-ai-hub/
dashboard.tsx         destinations.tsx     ouroboros.tsx         syncs/
                      innovation/          outcomes.tsx          templates/
                                           policies.tsx          thesis.tsx
                                           roadmap.tsx           runs/
```

28 distinct surfaces (counting subdir indices). Walked ≥ 10 in detail
(observability, compute, operational-core, ouroboros, dashboard, thesis,
brain, sigil, sources, destinations, mappings, models, policies, outcomes,
agents, codex-loop). See §2 for the backing-endpoint probe.

## 2. Backing-endpoint probe (before fixes)

Direct probe of the Amaru sidecar (port 6810) and the api-server bridge
(port 80, `/api/amaru/*`).

Direct sidecar — all OK:

| path                     | HTTP | size  | notes                            |
|--------------------------|------|-------|----------------------------------|
| `GET /healthz`           | 200  | 166 B |                                  |
| `GET /state`             | 200  | 258 B | counters: publishes, receipts    |
| `GET /overwatch/snapshot`| 200  | 1028 B| R0513 panel, 6 invariants        |
| `GET /receipts`          | 200  | 35 B  | `{total:0, head_seq:0, items:[]}`|
| `GET /tripwires`         | 200  | 965 B | HUKLLA 10-tripwire summary       |
| `GET /scheduler/wiring`  | 200  | 452 B | 7 chakras + 7 edges              |
| `GET /events`            | —    | SSE   | Server-Sent Events stream        |

Bridge **before** the fix (curl-evidence):

| path (via `/api/amaru/*`) | HTTP | notes                                |
|---------------------------|------|--------------------------------------|
| `healthz`                 | 200  | already public (Round 4)             |
| `state`                   | 200  | already public (Round 4)             |
| `overwatch/snapshot`      | 200  | already public (Round 4)             |
| `events`                  | 401  | not exposed, denied by auth enforcer |
| `receipts`                | 401  | not exposed, denied by auth enforcer |
| `tripwires`               | 401  | not exposed, denied by auth enforcer |
| `scheduler/wiring`        | 401  | not exposed, denied by auth enforcer |

Bridge **after** the fix:

| path                      | HTTP | size  |
|---------------------------|------|-------|
| `/api/amaru/healthz`      | 200  | 166 B |
| `/api/amaru/state`        | 200  | 258 B |
| `/api/amaru/overwatch/snapshot` | 200 | 1028 B |
| `/api/amaru/receipts`     | 200  | 35 B  |
| `/api/amaru/tripwires`    | 200  | 965 B |
| `/api/amaru/scheduler/wiring` | 200 | 452 B |

`/api/amaru/events` is intentionally NOT proxied — see §4 residual.

## 3. Fixes landed

### Fix A — api-server: extend the read-only Amaru proxy (+ auth allowlist)

File: `artifacts/api-server/src/routes/amaru-proxy.ts`
- Added GET handlers for `/amaru/receipts`, `/amaru/tripwires`,
  `/amaru/scheduler/wiring`. All thin GET-only passthroughs through
  the existing `proxyGet` helper (8s timeout, no-store cache header).
- Explicitly documented why `/events` is NOT proxied: it is a Server-Sent
  Events stream; `fetch().text()` would block the express response until
  the stream closed.

File: `artifacts/api-server/src/middlewares/global-auth-enforcer.ts`
- Added `/api/amaru/receipts`, `/api/amaru/tripwires`,
  `/api/amaru/scheduler/wiring` to `PUBLIC_PATHS` with a comment
  inheriting the existing R0513/HUKLLA read-only justification.

Untouched (frozen): `artifacts/api-server/src/routes/amaru-ops-core.ts`.

### Fix B — Conduit: shared `AmaruLive` component

New file: `artifacts/conduit/src/components/AmaruLive.tsx`.
Exports five read-only panels backed by the bridge:

- `AmaruEventsPanel`  — `/api/amaru/state` (counters; replaces the SSE view)
- `AmaruWiringPanel`  — `/api/amaru/scheduler/wiring`
- `AmaruTripwiresPanel` — `/api/amaru/tripwires`
- `AmaruReceiptsPanel`  — `/api/amaru/receipts`
- `AmaruHealthPanel`    — `/api/amaru/overwatch/snapshot` + `/state`

Each panel renders three explicit terminal states (NO-MOCK contract):
- `loading` → "Loading…"
- `error`   → "Amaru sidecar unavailable (HTTP …): …"
- `ok` with empty stream → "No events yet — sidecar live, stream empty."
                          / "No receipts yet — chain initialised, no signed
                            runs recorded."

No fallback to fabric/demo data. "No data yet" beats fake.

### Fix C — observability tab → live event-bus counters

File: `artifacts/conduit/src/pages/observability.tsx`
- Imported `AmaruEventsPanel` and inserted it above the existing fabric
  KPI grid.
- Before: page rendered only `RELAY_RUN_EVENTS` (fabric demo data).
- After: page leads with real publishes/failures/scheduler_ticks/receipts
  counters from the sidecar plus per-chakra last-evaluation snapshot.

### Fix D — compute tab → live scheduler wiring

File: `artifacts/conduit/src/pages/compute.tsx`
- Imported `AmaruWiringPanel` and inserted it above the orchestrator grid.
- Before: 100% static `CLUSTER_NODES` + synthetic
  `UTILIZATION_HISTORY = Array.from({length:48}, _ => Math.random())`.
- After: top panel shows real 7-chakra chakana wiring
  (`root → sacral → solar → heart → throat → third_eye → crown → root` /
  ouroboros) from `/api/amaru/scheduler/wiring`. The static node table
  remains beneath as historical context, but the LIVE label sits at the top
  and is real evidence.

### Fix E — operational-core tab → live HUKLLA tripwires

File: `artifacts/conduit/src/pages/operational-core.tsx`
- Imported `AmaruTripwiresPanel`, inserted between B2 (Overwatch invariants)
  and B3 (Inherited mechanisms) as "B2.5 — HUKLLA Tripwires (live)".
- Before: page showed only the 6 R0513 invariants from
  `/api/amaru/overwatch/snapshot`.
- After: page also surfaces the 10-tripwire HUKLLA panel
  (`{pass:8, warn:2, trip:0, total:10}` at probe time), giving the
  operator the halt-authority view alongside the watch view.

### Fix F — ouroboros tab → live receipt chain

File: `artifacts/conduit/src/pages/ouroboros.tsx`
- Imported `AmaruReceiptsPanel`, inserted above the seked/unit-fraction
  surfaces.
- Before: page only exercised local primitives; the actual ReceiptChain
  promised in `MECHANISMS[II]` was never shown to the user.
- After: live `head_seq` + `total` plus per-receipt rows from
  `/api/amaru/receipts` (currently empty — rendered as explicit
  "chain initialised, no signed runs recorded" string, NOT as fake data).

### Fix G — dashboard tab → live kernel health pill block

File: `artifacts/conduit/src/pages/dashboard.tsx`
- Imported `AmaruHealthPanel`, inserted below the hero/LUTAR Σ card.
- Before: dashboard hero was 100% fabric (LUTAR Σ computed from
  `RELAY_DESTINATIONS`/`MAPPINGS` constants).
- After: dashboard also exposes real panel/kernel/brain hashes and
  pass/warn/trip counters from the live sidecar.

Five tabs touched (observability, compute, operational-core, ouroboros,
dashboard) + the shared component + the api-server widening = **5 tabs
gained real upstream evidence**. The required "≥ 5 fixes landed" bar is met.

## 4. Residuals

- `/api/amaru/events` is **not** proxied. Sidecar `/events` is SSE
  (`event: hello\ndata: {…}\n\n`); a synchronous `fetch().text()` would
  hang the express handler until the upstream client closed the stream.
  Documented inline in `amaru-proxy.ts`. Conduit consumes `/state` for
  the counter view and `/receipts` for the materialised chain instead.
  If a real-time stream is needed in the browser later, the correct fix
  is a dedicated SSE pass-through (not a JSON proxy) and is left for
  a future round.

- `compute.tsx` still renders the legacy `CLUSTER_NODES` and synthetic
  `UTILIZATION_HISTORY` below the new live panel. Removing it would
  shrink the page and was out of scope for "wire real data in" — flagged
  as a follow-on cleanup.

- `observability.tsx` still uses `RELAY_RUN_EVENTS` for its sync-risk
  table. Replacing that with a real event-stream view requires the SSE
  pass-through described above. Same residual.

- ~17 tabs not touched in this round (admin-usage, agents, brain,
  codex-loop, connections/{list,new}, destinations, innovation/*,
  mappings, models, outcomes, policies, roadmap, runs/*, settings, sigil,
  sources, sovereign-ai-hub/*, syncs/*, templates/list, thesis,
  convergent-sync). They were lower priority for "wire real Amaru
  evidence" because they back domain surfaces (CRM/connectors, content
  templates) outside the Amaru kernel's responsibility. They remain
  candidates for future per-tab work if/when matching upstream signals
  exist.

## 5. Acceptance check

- [x] ≥ 10 tabs walked (28 inventoried; 16 individually inspected;
      5 actively fixed).
- [x] ≥ 5 fixes landed (observability, compute, operational-core,
      ouroboros, dashboard) — plus 2 api-server enablers
      (amaru-proxy.ts + global-auth-enforcer.ts).
- [x] Dossier exists at this path.
- [x] Frozen file `artifacts/api-server/src/routes/amaru-ops-core.ts`
      untouched (only `amaru-proxy.ts` and `global-auth-enforcer.ts`
      changed on the api-server).
- [x] NO-MOCK-DATA preserved: every new panel surfaces real upstream
      evidence or renders an explicit "unavailable" / "no data yet"
      terminal state.

---

Citations: all HTTP codes/sizes above were measured by `curl -m 4 -o /tmp/r
-w "%{http_code}" http://localhost:80/api/amaru/<path>` after the proxy +
enforcer change was applied; sidecar payload shapes were verified by
`curl -m 3 http://localhost:6810/<path>` against the FastAPI organ
documented at `http://localhost:6810/openapi.json`.
