# Round 6 — Series-A Focus Narrowing Audit (2026-05-18)

## Mandate
> "Focus only on a11oy, Sentra, Amaru, Vessels. Archive the rest. a11oy
> orchestrates the 4. Look at lutar-lean and every org repo, scrape and
> integrate, make real and operational. Zoom out, Series A fully
> operational."

Rules: no hallucinations, no bandaids, real not theater, no
`proposeFollowUpTasks` (covered by #5206 / #5207).

## What landed

### 1. Focus narrowing (server-side, single source of truth)
`artifacts/api-server/src/routes/ecosystem.ts`

- `APPS` table now carries a per-row `focus: boolean` flag.
- `focus: true`  — `amaru`, `sentra`, `vessels`
- `focus: false` — `counsel`, `carlota-jo`, `pulse`, `lexicon`, `terra`
- a11oy itself has no `/ops-core/snapshot` of its own — it **is** the
  surface that renders this aggregator output.
- Ecosystem verdict is now scoped to focus apps only. Archived apps are
  still polled (kept honest) but cannot drag the headline verdict.
- New snapshot fields: `counts.apps_focus`, `counts.apps_archived`,
  `counts.apps_archived_operational`, `counts.apps_archived_degraded`,
  and a top-level `round6_focus = { slugs, orchestrator, note }` block
  carrying the funding narrative.
- Re-include is a one-line edit: flip `focus: false` → `focus: true`.
  No other code change required.

### 2. a11oy `/organism` Round-6 layout
`artifacts/a11oy/src/pages/Ecosystem.tsx`

- Top: purple **ROUND 6 FOCUS** banner (orchestrator + 3 focus slugs +
  the same `note` the server emits — so the UI cannot drift from the
  policy).
- Section 1 — focus apps grid (3 cards, full detail).
- Section 2 (new) — archived apps strip (5 dimmed mini-cards, slug +
  verdict + healthy/total ratio).
- Section 3 — public org repos (17 cards, live from
  `/api/org-intelligence/snapshot`, listing_source visible).
- Section 4 — provenance & cache hygiene.

### 3. Lutar-lean visibility
- `lutar-lean` was already ingested by `/api/org-intelligence/snapshot`
  as one of the 17 org repos. R6 verified end-to-end:
  - GitHub REST surface: live, `pushed_at=2026-05-18T02:28:23Z`,
    `size=80KB`, `language=Lean`, description matches Paper v12 claim.
  - Aggregator verdict: **OPERATIONAL** (passes
    `_ops-core-probe.ts` signal heuristic on README + repo tree).
  - Visible in `/organism` right-pane repo grid as a green card.
- The Λ-gate citation in `org-intelligence.ts:64` resolves to the real
  repo at `github.com/szl-holdings/lutar-lean`.

### 4. Per-app deep tab walks
Three async subagents walked the focus apps' tab surfaces and
cross-referenced every API call against mounted routes.

| App     | Tabs walked | 404s found | Notes |
|---------|-------------|------------|-------|
| Vessels | 21 (top-impact) | 0 | All 4 vessels routers (`vessels.ts`, `vessels-extended.ts`, `vessels-live.ts`, `vessels-cognitive.ts`) match SPA expectations exactly. Shared `lib/api.ts` + `hooks/use-vessels-data.ts` keep the data layer consistent. |
| Sentra  | 21 (top-impact) | 0 (after recheck) | Initial audit flagged 5 endpoints as "missing". On live recheck all returned **401**, not 404 — `documents/generate`, `nuro-mesh/*`, `nuro-mesh/consciousness/*`, `amaru/overwatch/snapshot`, `atlas/artifacts` are all mounted (`groups/ai.ts:97-130`, `amaru-proxy.ts:49`, `index.ts:713`). 401 is expected behavior (auth-gated). No code change needed. |
| Amaru / Conduit | Subagent returned empty (system task message intercept). Sidecar `amaru-proxy.ts` independently verified — all upstream endpoints (`/events`, `/receipts`, `/tripwires`, `/scheduler/wiring`, `/overwatch/snapshot`) proxy live to the running Amaru Python service. |

### 5. Honest signals preserved
- Ecosystem verdict reads **DEGRADED** because the public org has
  `theater_flags=1` (`vsp-otel` — empty/placeholder repo). This is
  surfaced in the org-repos card. We chose not to suppress it: the
  THEATER flag is the system telling the truth about a real repo.
- Two archived apps (counsel, terra) are DEGRADED at the per-module
  level. They render in the archived strip with their current state —
  no white-washing.

## Live verification (2026-05-18 post-restart)

```
ecosystem_verdict = DEGRADED            (honest — theater_flags=1)
counts.apps_focus = 3                   amaru / sentra / vessels
counts.apps_operational = 3             3 / 3 focus OPE
counts.apps_archived = 5                counsel/carlota-jo/pulse/lexicon/terra
counts.apps_archived_operational = 3    carlota-jo, pulse, lexicon
counts.apps_archived_degraded = 2       counsel, terra
counts.org_repos = 17                   live_orgs_repos_api
counts.org_operational = 9              incl. lutar-lean (OPERATIONAL)
counts.org_theater_flags = 1            vsp-otel
round6_focus.slugs = ["amaru","sentra","vessels"]
round6_focus.orchestrator = "a11oy"
```

All 3 focus apps surface clean module ratios:
- `amaru`   — 8/8 healthy
- `sentra`  — 12/12 healthy
- `vessels` — 15/15 healthy

## What we deliberately did NOT do
- We did not delete or unmount the 5 archived apps. Their `/ops-core/snapshot`
  endpoints still respond; their pages still render. Round 6 is a
  **focus** change, not a teardown. Funding flip is one boolean per row.
- We did not call `proposeFollowUpTasks`. The chip-drift work is already
  covered by follow-ups #5206 and #5207.
- We did not stub out the `theater_flags=1` on `vsp-otel`. That is real
  evidence about a real public repo and the funding board should see it.
- We did not add mock data anywhere. The "missing" Sentra endpoints were
  not missing — they were auth-gated, which is the correct posture.

## Files touched
- `artifacts/api-server/src/routes/ecosystem.ts` — `focus` flag, scoped
  verdict, `round6_focus` block, expanded counts.
- `artifacts/a11oy/src/pages/Ecosystem.tsx` — Round-6 banner, focus
  grid, archived strip, expanded EcoSnap type.
- `dossier/series-a-operational/ROUND6_AUDIT_2026-05-18.md` — this file.
