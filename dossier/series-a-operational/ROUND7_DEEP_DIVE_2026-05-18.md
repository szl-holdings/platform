# Round 7 — Deep-dive ingest + GitHub push via our own software

**Date:** 2026-05-18  
**Mode:** innovate + evolve through our own stack (not screenshots, not manual scraping)  
**Token state:** rotated, `contents:write` ✅, `pull-requests:write` ❌ (still missing — user must toggle that scope when re-rotating)

## What was built

### 1. Two new endpoints in `artifacts/api-server/src/routes/org-intelligence.ts`

| Endpoint | What it does | Cache | Evidence |
|---|---|---|---|
| `GET /api/org-intelligence/deep-dive/:slug` | Pulls README (raw), top-level tree, last 10 commits, open PRs, languages-by-bytes, releases for any szl-holdings repo. Per-field `_error` markers if individual GH calls fail — no silent fallback. | 5 min per slug, `?fresh=1` to bypass | Verified live: lutar-lean returned 18 top-level entries, 10 commits, 1 release (`v0.1.0`), README 3,170 chars. ouroboros-thesis returned 24 top-level entries, 5 releases (newest `paper-v14-1.0.0-draft`). |
| `GET /api/org-intelligence/lean-status` | Fetches each `Lutar/*.lean` file from lutar-lean and counts `\bsorry\b` occurrences. Returns per-file breakdown + total + a shields.io-compatible JSON. `kernel_signed_off=true` iff total==0. | 5 min | Live result: **7 sorries** — 4 in `Uniqueness.lean`, 3 in `Bound.lean`. `Axioms.lean`, `Egyptian.lean`, `Invariant.lean` clean. `kernel_signed_off=false`. |

### 2. New a11oy page: `artifacts/a11oy/src/pages/OrgRepoDeepDive.tsx`

- Route: `/a11oy/organism/repo/:slug` (wired in `App.tsx`)
- Consumes `/api/org-intelligence/deep-dive/:slug`
- Renders: meta strip, languages bar chart, top-level tree, last commits, open PRs, releases, README excerpt
- No mock data. Empty fields render upstream HTTP code so drift is visible.
- Ecosystem page (`/a11oy/organism`) repo cards are now `<a>` tags linking here → one click from the org overview to the repo deep-dive.

### 3. Full org ingest (real evidence, dossier file)

Dossier: `dossier/series-a-operational/ORG_INGEST_R7_2026-05-18.jsonl`  
**All 17 szl-holdings repos ingested through our own deep-dive endpoint** (not raw GH curl — the page and the dossier read the same source of truth). Compact summary:

| slug | language | size_kb | open PRs | latest commit |
|---|---|---:|---:|---|
| lutar-lean | Lean | 80 | 0 | doi-backfill v0.1.0 + DOI badge (today) |
| ouroboros-thesis | Lean | 20,563 | 2 | feat(papers): v14 arXiv submission package |
| platform | TypeScript | 636,844 | 3 | chore(ci): repair platform main baseline |
| szl-cookbook | Shell | 6,034 | 1 | doctrine: name-suffix "Jr." in CITATION.cff |
| ouroboros | TypeScript | 456 | 0 | ClusterFuzzLite harness for Scorecard Fuzzing |
| sentra | TypeScript | 72 | 0 | thesis v13 DOI badge + cross-link |
| amaru | Python | 116 | 0 | thesis v13 DOI badge + cross-link |
| a11oy | TypeScript | 137 | 0 | thesis v13 DOI badge + cross-link |
| vessels, terra, counsel, carlota-jo | — | ~60 | 0 | thesis v13 DOI badge + cross-link |
| szl-brand | Python | 10,837 | 0 | doctrine CITATION suffix |
| agi-forecast | TypeScript | 38 | 0 | chore(actions): pin to SHA refs for Scorecard |
| szl-trust | — | 52 | 0 | doctrine CITATION suffix |
| .github | — | 2,058 | 0 | org profile — thesis v12/v13 publish note |
| vsp-otel | — | 26 | **6** | feat(scaffold): initial README/CITATION/scorecard |

**Theater flag confirmed:** `vsp-otel` is a 26 KB scaffold with 6 open PRs and 6 open issues — it's stub-only, matching the `theater_flag=1` from Round 6.

## What was pushed to GitHub (real artifacts, via `contents:write`)

| Repo | Branch | What landed | Status |
|---|---|---|---|
| `szl-holdings/lutar-lean` | `ci/lean-sorry-count-2026-05-18` | `.github/workflows/sorry-count.yml` — per-push lean kernel sorry count, prints per-file table in run summary, uploads shields.io JSON artifact | HTTP 201 ✅ |
| `szl-holdings/ouroboros-thesis` | `docs/lean-kernel-signoff-2026-05-18` | README — appended "Lean kernel sign-off" section citing the new CI workflow, with current sorry count breakdown and the explicit promise that the count cannot drift undetected | HTTP 200 ✅ |
| `szl-holdings/platform` | `docs/series-a-snapshot-2026-05-18` | `SERIES_A.md` + `verify-szl-metrics.sh` (from Round 6) | branch live |

**One-click PR-compare URLs** (paste into browser, click "Create pull request"):
- https://github.com/szl-holdings/lutar-lean/compare/main...ci/lean-sorry-count-2026-05-18?expand=1
- https://github.com/szl-holdings/ouroboros-thesis/compare/main...docs/lean-kernel-signoff-2026-05-18?expand=1
- https://github.com/szl-holdings/platform/compare/main...docs/series-a-snapshot-2026-05-18?expand=1

## v2 thesis architecture — gap analysis (from user's Layer 0-4 chart)

User's v2 chart shows a planned refactor of the spine into separate repos. **Probed both `szl-holdings` and `stephenlutar2-hash`** — none exist yet:

| v2 slug | szl-holdings | personal | Status |
|---|---|---|---|
| `ouroboros-invariant` | 404 | 404 | not yet shipped |
| `ouroboros-newton` | 404 | 404 | not yet shipped |
| `ouroboros-gauss` | 404 | 404 | not yet shipped |
| `ouroboros-loop` | 404 | 404 | not yet shipped (currently inside `ouroboros` repo) |
| `a11oy-runtime` | 404 | 404 | not yet shipped (currently inside `platform`) |
| `amaru-runtime` | 404 | 404 | not yet shipped (currently inside `amaru` + `platform/services/amaru`) |
| `sentra-runtime` | 404 | 404 | not yet shipped |
| `substrate-mcp-gateway` | 404 | 404 | not yet shipped (currently inside `platform/agent-gateway` + `platform/substrate-mcp-gateway` sidecar) |

The v2 chart is a future-state architecture, not a current claim. **stephenlutar2-hash personal account has 1 repo — the profile README** — confirming nothing else lives there.

## Known environment gaps (not blockers, called out for honesty)

- `agent-gateway`, `amaru`, `temporal-worker`, `temporal-approval-worker`, `vessels-pitch` workflows fail on restart due to port collisions / Temporal Frontend never coming up at `localhost:7233`. These are pre-existing infra issues, not regressions from Round 7. The api workflow itself spawns the agent-gateway sidecar on port 8077 (see start.sh), which competes with the standalone workflow on port 6800.
- Token still missing `pull-requests:write` — PRs cannot be opened by us. Branches + one-click compare URLs are the workaround. To unlock, regenerate the fine-grained PAT with **Pull requests: Read and write** toggled on, then update the `GH_WORKFLOW_TOKEN` secret via the Secrets pane (not chat).

## Acceptance

- [x] Deep-dive endpoint: live, returns real GH data, 5-min cached, no mocks
- [x] Lean-status endpoint: live, real sorry count, kernel sign-off boolean, drift-proof
- [x] a11oy UI page consuming both endpoints, wired into router, linked from /organism
- [x] All 17 repos ingested via our own software, dossier file written
- [x] Real artifacts pushed to GitHub (3 branches, 2 of them brand-new this turn)
- [x] v2 architecture gap analysis with honest "404 — not yet shipped" markers
- [x] Token + infra gaps disclosed
