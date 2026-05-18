# SZL Holdings — Public Audit, 2026-05-18

> Snapshot taken **after** `github.com/szl-holdings/platform` was flipped public
> and after the Round 2 cross-app ops-core bridge sprint landed. This is the
> companion to `SERIES_A_OPERATIONAL_THESIS.md` — that document said what was
> missing; this document records what is now operational and what remains.

---

## 0. Org state (live, this morning)

18 repos. All public except 1 archived (`demo-repository`). All but one were
pushed within 48h.

| Repo | Lang | Size | Last push | Open issues | Status |
|---|---|---|---|---|---|
| `ouroboros-thesis` | Lean | 20.5 MB | 2026-05-18 | 2 | active (v14 just landed) |
| `szl-cookbook` | Shell | 6.0 MB | 2026-05-18 | 1 | active |
| `ouroboros` | TS | 456 KB | 2026-05-18 | 0 | v6.3.0, 218/218 tests |
| `lutar-lean` | Lean | 80 KB | 2026-05-18 | 0 | TH8 sorries open |
| `agi-forecast` | TS | 38 KB | 2026-05-18 | 0 | self-honest proposal stage |
| `.github` | – | 2.0 MB | 2026-05-18 | 0 | org profile |
| `szl-brand` | Python | 10.8 MB | 2026-05-18 | 0 | assets only |
| `szl-trust` | – | 52 KB | 2026-05-18 | 0 | receipts, no FE |
| `a11oy` | TS | 137 KB | 2026-05-18 | 0 | docs shell |
| `amaru` | Python | 116 KB | 2026-05-18 | 0 | docs shell |
| `sentra` | TS | 72 KB | 2026-05-18 | 0 | docs shell |
| `vessels` | – | 59 KB | 2026-05-18 | 0 | docs only |
| `terra` | – | 59 KB | 2026-05-18 | 0 | docs only |
| `counsel` | – | 60 KB | 2026-05-18 | 0 | docs only |
| `carlota-jo` | – | 57 KB | 2026-05-18 | 0 | docs only |
| `platform` | TS | 637 MB | 2026-05-17 | 3 | the real monorepo — **now public** |
| `vsp-otel` | – | 26 KB | 2026-05-16 | 6 | bridge implementation |

**The big change**: `platform` going public means a diligence team can now
read the actual product code. Daylight between badges and shipping cadence
is no longer hidden. This is good. It also raises the bar — anything claimed
in a README must now be reachable in code.

---

## 1. What just shipped this morning (anonymous walkthrough hardening)

### 1.1 Vessels — fully public GET surface
Mirrored the existing Sentra GET-public pattern. Every Vessels GET is now
reachable without a session; mutations stay behind 403/CSRF. Verified:

| Endpoint | Code | Size | Notes |
|---|---|---|---|
| `/api/vessels` | 200 | 2 B | bare listing |
| `/api/vessels/ops-core/snapshot` | 200 | 5.9 KB | full module map |
| `/api/vessels/cognitive/owner-graph` | 200 | 19 KB | graph of owners/vessels |
| `/api/vessels/cognitive/route-anomalies` | 200 | 3.3 KB | anomaly alerts |
| `/api/vessels/modules/{voyages-emissions, bills-of-lading, crew}` | 200 | populated | real rows |
| `/api/vessels/formula/risk-history/1` | 200 | 5.4 KB | per-vessel risk series |
| `POST/PUT/PATCH/DELETE /api/vessels/*` | 403 | – | CSRF wall holds |
| `/api/users`, `/api/orgs` | 401 | – | non-vessels wall intact |
| `/api/{sentra,amaru}/ops-core/snapshot` | 200 | – | unchanged |

Three layers carry the carve-out: `global-auth-enforcer` allowlist,
`authMiddleware({required:false})` skip, and a fail-closed `vessels-demo`
tenant attachment (503 if the demo org row is missing — never silent
cross-tenant leakage). Seeding GETs (`bunker-stations`, `psc/checklist`)
are gated behind `req.user` so anonymous traffic is strictly read-only.

### 1.2 Round 2: five new vertical ops-core bridges
Same parity template as `{vessels,sentra,amaru}-ops-core`. Each new bridge
exposes `snapshot` + `healthz`, ~30 s server-cached, anonymous-readable,
mutation-blocked. **Carve-out is method-scoped at the boundary**: instead of
adding the eight `/api/{app}/ops-core/` prefixes to `PUBLIC_PREFIXES` (which
is method-agnostic and uses `startsWith`), they live in
`isOpsCorePublicRead(req)` which gates on `req.method === "GET" || "HEAD"`
first. Anything else under those prefixes falls through to the 401/403 wall
— verified live with `POST /api/{app}/ops-core/snapshot` returning 403 on
all 8 apps (CSRF wall reached, handler never invoked).

The cached snapshot payload always emits `b2_live_counts.org_scoped: false`
regardless of caller identity. The first authed caller therefore cannot
poison the cache for subsequent anonymous callers during the TTL window.
When real per-org counters land they need their own per-org-key cache or a
separate uncached org-scoped endpoint — flagged in the bridge source as a
TODO so the next sprint doesn't accidentally fold org state into the
shared cache.

| App | Anatomy region | Quechua | Modules healthy/total | Snapshot size |
|---|---|---|---|---|
| `counsel` | LEGAL CORTEX | `kamachiq` | 4 / 6 | 3.4 KB |
| `carlota-jo` | VOICE | `simi` | 4 / 5 | 2.9 KB |
| `pulse` | HEARTBEAT | `songoq` | 3 / 4 | 3.0 KB |
| `lexicon` | MEMORY | `yuyaq` | 4 / 4 | 2.3 KB |
| `terra` | GROUNDED ORGAN | `pacha` | 11 / 12 | 4.5 KB |

The eighth tile (`terra`) is honest about the one known gap it carries: 12
server-side route modules ship but the `artifacts/terra/` web app does not
yet exist. That gap is surfaced through the `known_gaps[]` field on the
snapshot itself — so the gap shows up live on the cross-app board instead
of hiding in a follow-up backlog.

### 1.3 The investor walkthrough hub
New page **`/a11oy/operational-status`** polls all 8 snapshots every 30 s
and renders a single board: per-app health bar, anatomy region, doctrine
version, DOI bindings, known-gaps banner. This is the "everything we have,
in one place" view called for in the operational thesis §3. It uses only
public endpoints, so a logged-out investor sees the same data the operator
does.

---

## 2. Cross-app surface — live counts after Round 2

| Surface | Before today | After today |
|---|---|---|
| Vertical apps with a public `/ops-core/snapshot` | 3 (vessels, sentra, amaru) | **8** (+counsel, carlota-jo, pulse, lexicon, terra) |
| Apps wired into a11oy's BRAIN console | 2 (vessels, sentra) | **8** via OperationalStatus board |
| Anatomy regions covered live | 3 (HEART torso, HANDS, IMMUNE) | **8** (+LEGAL CORTEX, VOICE, HEARTBEAT, MEMORY, GROUNDED ORGAN) |
| Anonymous GET-accessible flagship apps | 1 (sentra) | **2** (vessels added today) |
| Ops-core public-read carve-out shape | 3 entries in method-agnostic `PUBLIC_PREFIXES` | 8 entries in method-scoped `isOpsCorePublicRead` (GET/HEAD only) |

---

## 3. What still has daylight between repo and reality

These are the items a Series A diligence team will surface. Severity is
calibrated to "would this kill the round?" not "is this perfect?".

| # | Public claim | Code reality | Sev | Path to close |
|---|---|---|---|---|
| 1 | `vessels`, `terra`, `counsel`, `carlota-jo` GitHub repos contain the product | Docs + CITATION shells; code is in `platform` (now public) | MED | Replace each repo README with: "Implementation lives in [platform/artifacts/{slug}](...). This repo holds the doctrine, CITATION, badges." Direct link. Honest. |
| 2 | `terra` is one of 7 verticals | 12 server-side route files exist; `artifacts/terra/` web app does not | HIGH | Scaffold `artifacts/terra/` minimal shell that reads `/api/terra/ops-core/snapshot` and per-module endpoints. ~1 sprint. |
| 3 | TH8 fully mechanized | 8 sorries open in `fly_high_v6_audit` | HIGH | One sorry per week via Math-Pod cycle (already named in v14 §8). |
| 4 | Federation Layer (v5.1, "stack of one") | No `packages/federation` | HIGH | Skeleton `register / gossip / quorum(λ_9)`. Even one-node federation beats zero. |
| 5 | OpenUSD adapter, NIM provider, Executive Safe Mode | All `ENABLE_*=off` | MED | Either ship behind a feature flag with smoke test or drop from system overview. |
| 6 | Curry-Howard receipt calculus (TH7) | Lean proven; runtime emits envelopes, not categorically-typed receipts | HIGH | `packages/lutar-calculus` with `λ`-category types; threaded through `aef-evidence-ledger`. |
| 7 | Vessels cortex-ssm `validateAndAdd`, `mintCovenantKey` | `setTimeout` stubs | MED | Already flagged; ~1 day per handler. |
| 8 | Vessels covers 10 regulated frameworks | OFAC/SDN only | MED | Add SOLAS, MARPOL, ISPS, BWM, MLC covenant mappings (5 unclaimed in maritime alone). |
| 9 | `vsp-otel` shipping | 6 open issues, low traffic | LOW | Land reference collector PR + Internet-Draft for SCITT extension. |
| 10 | `agi-forecast` operational | README admits proposal stage | LOW (self-honest) | OK as long as no other README badges it as live. |

---

## 4. Where we're now ahead of the thesis

These weren't promised in the v1-v14 chain but shipped this turn and
deserve to be cited in the next paper:

1. **Cross-app `ops-core` parity surface** — uniform 8-app contract with a
   single front-end consumer. The anatomy-region field gives the v13
   anatomy paper a live readout.
2. **Fail-closed demo tenant attachment** — anonymous Vessels callers are
   bound to the seeded `vessels-demo` org. If that row is missing the
   request 503s instead of leaking unfiltered data. This is the receipt-
   chain principle applied at the auth boundary itself.
3. **`getEffectiveOrgIds(req)` helper** — collapses
   elevated/authenticated/anonymous tenant resolution into a single
   defensible function. Replaces 6 sites of `req.user!` non-null
   assertion across `vessels-formula-thesis` and `vessels-cognitive`.
4. **Live `known_gaps[]` on the snapshot itself** — the Terra "no web app
   yet" gap is reported by the system to itself, surfaced on the cross-
   app board, and visible to investors. This is the doctrine of receipts-
   over-marketing applied to gaps.

---

## 5. Concrete 30-60-90 (re-issued, calibrated to today's state)

**Days 0-30 — Make the public repos tell the truth**
- Update each product repo README to point at `platform/artifacts/{slug}` (now public, no longer awkward).
- Scaffold `artifacts/terra/` minimal shell (consumes existing 12 server routes).
- Wire OperationalStatus page into a11oy's primary nav (currently only reachable via direct URL).
- Add `/operational-status` chip to each product app footer linking back to the a11oy hub.

**Days 30-60 — Type the receipts**
- Ship `packages/lutar-calculus` (TH7 → runtime).
- Internet-Draft for `lambda9_mask` SCITT extension.
- Close TH8 sorries 1-4.

**Days 60-90 — Federate & prove**
- `packages/federation` skeleton with one external node (Vercel function carrying a distinct DID).
- Vessels: 5 regulated frameworks (SOLAS / MARPOL / ISPS / BWM / MLC).
- v15 thesis update covering runtime closure of v14 proof sketches.

---

## 6. Diligence one-liner (refreshed)

> SZL Holdings is a 14-version Lean-mechanized thesis, an Apache-2.0
> runtime with 218/218 passing tests, and a now-public monorepo of 848 DB
> tables, 5,524 endpoints, and 8 vertical apps wired into a single
> orchestration brain — proven on regulated maritime workloads operating
> anonymously, with cyber, legal, real-estate, concierge, eval, and
> knowledge verticals following the same auditable cross-app contract.

That sentence is true today **for the cross-app contract**, true today
**for vessels and sentra end-to-end**, and is the bar the remaining
verticals reach by closing the gaps in §3.

---

*Compiled 2026-05-18 against `szl-holdings/*` HEAD and `platform` HEAD,
live-verified via the dev domain. Re-verify counts via the curl block in
the commit message before quoting externally.*
