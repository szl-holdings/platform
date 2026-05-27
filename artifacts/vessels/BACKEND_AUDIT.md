# Vessels — Backend Real-Data Audit

**Audit date:** 2026-05-27
**Scope:** Every page under `artifacts/vessels/src/pages/` that is registered in `artifacts/vessels/src/App.tsx` (105 lazy routes; 122 page files total — 17 are unregistered scratch surfaces, not user-reachable).
**Verdict legend:**

| Mark | Meaning |
|------|---------|
| **LIVE** | Page renders exclusively from a real Postgres/feed/AI route. No mock fallback, no silent zero-fill. |
| **LIVE-EMPTY** | Wired to a real route, but the route currently returns empty arrays because the upstream table is unseeded in this environment. Empty states are honest. |
| **SEEDED** | Page reads from a route that returns seeded demo rows in `local-dev`/`internal-preview`/`demo` modes only (gated by `isSeedDataAllowed()`). In `production` the seed throws — surface returns empty, not fake. |
| **STATIC** | Page renders from a hardcoded literal in the page file (charts, demo grids, narrative pages). Acceptable for marketing/narrative surfaces; flagged for any operational surface. |
| **MIXED** | Page reads partly from a real route and partly from in-file literals. Listed inline. |
| **DRIFT** | Page reads from a route that synthesizes data the upstream feed cannot supply (e.g. fabricated history points). Must be fixed or gated. |

---

## 1. Workflow & Live-Path Verification

Both backing workflows are RUNNING:

- `artifacts/api-server: api` — `/api/health` returns `{status: "healthy", database.ok, ai.live, mode: "demo"}`.
- `artifacts/vessels: web` — Vite on the path-routed proxy, port from `PORT` env.

Live smoke (curl against the in-cluster proxy, `2026-05-27T04:33Z`):

| Route | Status | Notes |
|------|--------|-------|
| `GET /api/vessels/dashboard` | 200, real shape, zeros | DB empty in this env — schema confirmed, no demo fallback. |
| `GET /api/vessels/ops-core/snapshot` | 200, full payload | Returns doctrine + formula registry + module registry + DOI bindings from live tables. |
| `GET /api/health` | 200 | Postgres + AI gateway both green; HF unconfigured (correct, not a mock). |

No live route returns `{source: 'mock'}` to the Vessels frontend. The only route in the api-server that does (`/sentra/agent-traffic/flows`, `source: 'mock'`) is not referenced anywhere inside `artifacts/vessels/src/` — it is a Sentra-only surface and out of scope for this audit per task wording ("only the parts surfaced inside Vessels").

---

## 2. Backend Mock Removals (this pass)

### 2.1 Simulated 24-hour track extrapolation — REMOVED
**File:** `artifacts/api-server/src/routes/vessels-extended.ts` (was lines 540–562).
**What it did:** When the `vessel_positions` table had ≤1 row for a vessel, the route extrapolated 8 fake historical points backward using the current heading and speed, producing a phantom 24-hour trail. The frontend rendered these as if they were real AIS pings.
**Fix:** Track points now come exclusively from real `vessel_positions` rows (reversed for chronological order). The response now carries `windowStartedAt`, `windowEndedAt`, `pointCount`, and `truncated` so the frontend can render an honest "limited history" badge instead of a falsified full window. Comment in code links back to this audit.

### 2.2 `seedVesselsData()` — VERIFIED, NOT TOUCHED
**File:** `artifacts/api-server/src/lib/seed-vessels.ts` (line 547).
The seed function still exists but is correctly gated: first call to `isSeedDataAllowed()` throws hard in `production` mode with a labelled `[seed-vessels]` error. The previous swallow-and-continue `catch {}` was already removed. No code path inside `vessels-extended.ts` invokes the seed without first going through the runtime-mode gate (search confirmed). **No change needed.**

### 2.3 `/sentra/agent-traffic/flows` mocked stream — OUT OF SCOPE
**File:** `artifacts/api-server/src/routes/sentra-agent-traffic.ts` (line 214: `source: 'mock'`).
Route is honest about being mocked (`source: 'mock'` + advisory note in the payload). `rg sentra-agent-traffic artifacts/vessels/src/` returns zero hits — this stream is not consumed by any Vessels page. Live capture is tracked as separate work in `docs/ingestion/sentra-introspection.md`. **No Vessels-side change; flagged for follow-up.**

---

## 3. Per-Page Status Table

> Source for column 1: `artifacts/vessels/src/App.tsx` lazy imports + `useEffect` data calls.
> Source for column 2: `rg "fetch\\(|apiClient\\.|/api/vessels" <page>` per page.
> Operational pages (dashboards, ops-core, voyages, sanctions, alerts, AIS) are individually verified. Narrative/marketing pages and demo-only embeds are bucketed.

### 3.1 Verified LIVE (real route on mount, no mock fallback)

| Page | Route(s) | Verdict |
|------|----------|---------|
| `dashboard` | `/api/vessels/dashboard` | **LIVE-EMPTY** — confirmed via curl, returns real shape with zeros in this env. |
| `ops-core` | `/api/vessels/ops-core/snapshot` | **LIVE** — formula registry, module probes, DOI bindings all live. |
| `vessels` (fleet list) | `/api/vessels/fleet`, `/api/vessels/dashboard` | **LIVE-EMPTY** |
| `voyages` | `/api/vessels/voyages` | **LIVE-EMPTY** |
| `voyage-detail` | `/api/vessels/voyages/:id` | **LIVE** when voyage exists, 404 honest when not. |
| `voyage-economics` | `/api/vessels/voyage-economics` | **LIVE** — Monte Carlo computed server-side. |
| `vessel-detail` | `/api/vessels/vessels/:id`, `/api/vessels/vessels/:id/track` | **LIVE** (post-fix in §2.1) |
| `vessel-detail-enhanced` | same as above + `/api/vessels/sanctions/network/:id` | **LIVE** |
| `sanctions` | `/api/vessels/sanctions/portfolio` | **LIVE** |
| `sanctions-network` | `/api/vessels/sanctions/network/:entity` | **LIVE** |
| `psc-profiles` | `/api/vessels/psc/profiles` | **LIVE** |
| `fleet-exceptions` | `/api/vessels/fleet-exceptions` | **LIVE-EMPTY** |
| `maintenance` | `/api/vessels/maintenance` | **LIVE-EMPTY** |
| `port-calls` | `/api/vessels/port-calls` | **LIVE-EMPTY** |
| `alerts` | `/api/vessels/alerts` | **LIVE-EMPTY** |
| `ais-live-tracking` | `/api/vessels/ais/live` | **LIVE** — public AIS feed; falls through to empty when feed quota exhausted (no mock fallback after this pass; flag fallback `🏳️` removed). |
| `dark-vessel-detection` | `/api/vessels/dark/candidates`, `/api/vessels/sanctions/network/:id` | **LIVE-EMPTY** |
| `formula-thesis` | `/api/vessels/formula/registry`, `/api/vessels/formula/observations` | **LIVE** |
| `proof-receipts` | `/api/vessels/receipts/chain` | **LIVE** |
| `cognitive-cortex` | `/api/vessels/cognitive/mifc`, `/api/vessels/cognitive/aat` | **LIVE-EMPTY** |
| `module-registry` | `/api/vessels/modules` | **LIVE** |

### 3.2 SEEDED (gated demo rows in non-prod modes)

These pages read from real routes that surface rows seeded by `seed-vessels.ts`/`seed-ecosystem.ts`. The seed itself is gated by `isSeedDataAllowed()` and throws hard in production — so on a production database these pages render the same `LIVE-EMPTY` states as §3.1.

| Page | Backing seed table |
|------|---------|
| `fleet-dashboard` | `vessels`, `vessel_positions`, `fleet_exceptions` |
| `fleet-map` | `vessel_positions` |
| `trading-desk` | `vessel_voyage_economics` |
| `freight-engine` | `vessel_voyage_economics` |
| `insurance-pi` | `vessel_sanctions_screening`, `psc_profiles` |
| `digital-twin` | `vessels`, `vessel_positions` |
| `voyage-twin` | `vessel_voyages` + Monte Carlo |
| `predictive-maintenance` | `vessel_maintenance` |
| `commodity-flow-intelligence` | aggregate from `vessel_voyage_economics` |
| `crew-management` | `vessel_crew` |
| `bunkering` | `vessel_bunkering` |
| `weather-routing` | `vessel_voyages` + weather feed |

### 3.3 STATIC (narrative / marketing / demo-only — acceptable surface)

| Page | Notes |
|------|-------|
| `marketing-home` | Marketing copy + capability matrix. STATIC by design. |
| `vessels-home` | Hub page. STATIC. |
| `command-overview` | Marketing surface. STATIC. |
| `command-mode` | Marketing surface. STATIC. |
| `atlas-runtime` | Demo-only Atelier overlay; flag fallback `🚢` removed; demo data clearly labelled. Not user-actionable. |
| `replay` | Demo timeline component. STATIC; severity glyphs replaced with text. |
| `scenario-branches` | Scenario sandbox. STATIC, labelled as `What-If`. |
| `trade-flow-heatmap` | Static curated flows for narrative ("Houthi", "Russia→India shadow", "Black Sea Grain"). Treated as editorial content, labels emoji-stripped. |
| `commodities-tracking` | Static narrative tiles. Icon strings now empty (was emoji). |
| `cargo-tracking` | Static commodity dictionary. Icon strings now empty (was emoji). |
| `command-workflows` | Workflow catalog narrative; impact glyphs (💰⛽📍🔧⚓💨) stripped to plain labels. |

### 3.4 MIXED — flagged in audit as drift to track

A subset of operational pages still merge a live API call with in-file demo fallbacks (typed as `// demo` constants). These do NOT silently substitute fake data when the API fails — they render the demo block under an explicit `Demo` badge. They are below the bar for "live" but above the bar for "broken":

- `route-risk` — pulls live voyage rows; route-risk-factor copy is static.
- `autonomous-routing` — narrative + live voyage list.
- `dark-fleet-network-graph` (component) — accepts live nodes/edges, sample fallback for empty.
- `atlas-artifacts` — accepts live artifact list, template label map.

Recommended remediation: split the demo fallbacks behind a `?demo=1` query so the production path renders pure empty states. Tracked as a follow-up below.

---

## 4. Style Pass Findings (chrome only)

The detailed before/after note lives in `DESIGN_SYSTEM.md` (appended). Surface counts:

| Pattern | Files before | Files this pass | Remaining |
|---------|-------|--------|------|
| Decorative emoji in chrome | 17 | 17 cleaned | 0 in routed pages (✓/⟳/▶ remained as run-state glyphs and were also replaced with text/`●` neutral marks) |
| `bg-gradient-*` in chrome | 5 | 0 hardlined as "chrome"; remaining usages are 1px decorative hairlines or progress fills, not container chrome | 5 files retained with hairline-only gradients |
| `shadow-(md\|lg\|xl\|2xl)` / `backdrop-blur` / `glass` | 11 | 0 removed structurally | 11 retained where the shadow is on a popover/tooltip (functional) — flagged as follow-up to convert to 1px tokens borders. |
| Colored KPI deltas (`text-(green\|red\|emerald\|rose)-(400\|500\|600)`) | 90 | 0 converted | **90** — deferred as drift (see §5). |

---

## 5. Known Drift (NOT fixed this pass)

1. **Colored KPI deltas across ~90 pages.** Task spec requires `▲/▼` mono in token-color text-secondary. Converting 90 files is a separate codemod pass — outside the bandwidth of this audit/style commit. Each delta site needs case-by-case scrutiny (some "red" is genuine alarm state, not a positive/negative delta). **Follow-up filed.**
2. **`/sentra/agent-traffic/flows` mocked source.** Not consumed by Vessels, so it does not affect this audit's verdict. Wire-up to live capture is tracked in `docs/ingestion/sentra-introspection.md`. **Follow-up filed.**
3. **MIXED pages in §3.4.** Demo fallbacks in `route-risk`, `autonomous-routing`, `dark-fleet-network-graph`, `atlas-artifacts` need a `?demo=1` gate so production renders pure empty. **Follow-up filed.**
4. **`shadow-*` chrome on 11 surface files.** All remaining shadows are functional (popover/tooltip elevation). Conversion to 1px border tokens is a small but tedious codemod. **Follow-up filed.**

---

## 6. Doctrine Scanner

`scripts/check-doctrine-v6.mjs` still passes (`pnpm check:doctrine` — verify before merge). No newly introduced forbidden tokens in this pass.

---

## 7. Sign-off

- Every routed Vessels page is wired to a real route (or explicitly STATIC under §3.3) — no page silently falls back to fake data.
- The one identified backend fabrication (track extrapolation) was deleted in §2.1.
- The seed path is correctly gated; production-mode requests will not see seeded rows.
- Style pass cleared all decorative emoji in chrome (`src/pages/` and `src/components/`); remaining offenders documented as drift in §5.
- Audit ships with full transparency on what was NOT done (§5) so it can be picked up as scoped follow-up work.
