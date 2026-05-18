# Series A Round 3 Audit — Thesis vs Reality

**Date:** 2026-05-18
**Operator:** main agent
**Scope:** Six public szl-holdings org repos + Vessels investor-demo
readiness + new a11oy org-intelligence surface.
**Source of truth for the 6-repo verdicts:** `GET /api/org-intelligence/snapshot`
on api-server (Round 3, this session). Every datapoint below is fetched
live from GitHub via that endpoint; nothing is hardcoded.

---

## 0. What was new this round

| Artifact | Path | Purpose |
|---|---|---|
| API route | `artifacts/api-server/src/routes/org-intelligence.ts` | Live ingest of 6 public repos; 30-min cache; per-repo error containment; verdicts computed from tree contents (no constants to drift). |
| API allowlist | `global-auth-enforcer.ts` `OPS_CORE_PUBLIC_PREFIXES` | Added `/api/org-intelligence/` — GET/HEAD only, identical posture to per-app ops-core. |
| a11oy page | `artifacts/a11oy/src/pages/OrgIntelligence.tsx` + `App.tsx` route `/org-intelligence` | One investor-facing board with one card per repo; chip row computed live (drift-proof). |
| Vessels fix | `artifacts/api-server/src/routes/groups/vessels.ts` | Route-order trap fixed: nine literal `/api/vessels/<word>` endpoints now reach their real handlers instead of being shadowed by `GET /vessels/:id`. |
| Dossier (T003) | `dossier/series-a-operational/VESSELS_DEMO_READINESS_2026-05-18.md` | Curl-walk of 10 SPA routes + 16 API endpoints; ranked top-5 blockers; honest residual gaps. |
| Dossier (this) | `dossier/series-a-operational/ROUND3_AUDIT_2026-05-18.md` | Thesis-vs-reality synthesis. |

Live verification at 2026-05-18T14:24Z:

```
GET  /api/org-intelligence/snapshot   → 200, 11,062 B, 6/6 repos reachable
GET  /api/org-intelligence/healthz    → 200, {ok:true, cached_repos:6, token_present:true}
POST /api/org-intelligence/snapshot   → 403 (write methods rejected at auth wall)
GET  /a11oy/org-intelligence          → 200 (SPA shell + lazy chunk wired)
GET  /api/vessels/123                 → 404 (numeric ID still correct after vessels route reorder)
```

---

## 1. The six public repos — thesis vs reality

Verdict legend:

- **OPERATIONAL** — repo ships running code or verifiable artifacts. There
  is something to run, test, or audit.
- **DAYLIGHT** — repo ships investor-diligence metadata (CITATION.cff,
  .zenodo.json, LICENSE, scorecard.yml) even if it does not yet ship
  code. Honest preprint posture, not theater.
- **THEATER** — repo's README makes implementation claims (named classes,
  perf numbers, "ships in N weeks") that the tree does not back. The
  flag is a request to either implement or move the claim into a future-
  work section.

| # | Repo | Size | Pushed | Default | Issues | Verdict | What's there | Gap |
|---|------|-----:|--------|---------|-------:|---------|--------------|-----|
| 1 | **szl-cookbook** | 6,034 KB | 2026-05-18 | main | 1 | DAYLIGHT | 9 Anthropic-pattern skill packs (SKILL.md format, doctrine notes). No runtime source by design — skills *are* the product. | Source-file count is 0 because skills are `.md`. Acceptable; verdict logic now treats this as DAYLIGHT-only (intentional). |
| 2 | **agi-forecast** | 38 KB | 2026-05-18 | main | 0 | OPERATIONAL + DAYLIGHT | 7 TypeScript source files + 1 test file (`runtime/src/brier.ts` etc.). CITATION + Zenodo + LICENSE + Scorecard wired. | Could add CI run badge; receipts subdir empty. |
| 3 | **szl-trust** | 52 KB | 2026-05-18 | main | 0 | OPERATIONAL + DAYLIGHT | 4 CPS (Covenant Proof Standard) receipt artifacts present — verifiable run history. Citation pack complete. | Receipts could be auto-rebuilt on push via the workflow already in `.github/`. |
| 4 | **vsp-otel** | 26 KB | 2026-05-16 | main | 6 | **THEATER** | README + LICENSE + CITATION only. Zero source files. README references `LambdaSpanEmitter`, perf numbers, "shippable" timeline. | **Real implementation lives in this monorepo's `platform/packages/vsp-otel` package** (benchmarked + Merkle-verified in earlier rounds). Either push that code to the public repo or reframe the README as a preprint with a forward-pointer to the monorepo. |
| 5 | **ouroboros-thesis** | 20,563 KB | 2026-05-18 | main | 2 | OPERATIONAL + DAYLIGHT | 9 Lean source files + 1 test file (Lean 4 proof project). Full citation pack. | Two open issues — review and triage. |
| 6 | **ouroboros** | 456 KB | 2026-05-18 | main | 0 | OPERATIONAL + DAYLIGHT | 72 TypeScript source files + 17 test files. Bounded-loop runtime implementing the Lutar Invariant Λ. Earlier rounds confirmed 172/172 tests passing. | None at the repo level; deeper diligence would benefit from Zenodo-deposited release artifacts. |

**Aggregate (computed live, not hardcoded):** 6/6 reachable, 4 OPERATIONAL,
5 DAYLIGHT, 1 THEATER. These same numbers drive the a11oy chip row, so
the chip can no longer drift away from the underlying tree (which was
the structural concern behind follow-up #5206).

### 1.1 The one THEATER flag — vsp-otel — what to do

The vsp-otel public repo is the only one where the README out-runs the
tree. Two clean fixes:

1. **Push** — extract `platform/packages/vsp-otel` from the monorepo to
   the public repo (it's BSL-licensed source we already wrote and
   benchmarked). Verdict flips to OPERATIONAL on next snapshot fetch
   without any code change in a11oy.
2. **Reframe** — keep the public repo as a preprint+spec and replace
   "shippable in N weeks" with "reference implementation at
   szl-holdings/szl-holdings:platform/packages/vsp-otel". Verdict
   flips to DAYLIGHT on next snapshot.

Either path is honest. The current state is the one that isn't.

---

## 2. Vessels investor-demo readiness — verdict

Source: `dossier/series-a-operational/VESSELS_DEMO_READINESS_2026-05-18.md`
(T003 subagent, 244 lines).

**Fixed this round:**

- **Route-ordering trap in `groups/vessels.ts` (BLOCKER #1)** — nine
  dashboard endpoints (`/api/vessels/dashboard`, `/roster`,
  `/voyage-economics`, `/fleet-summary`, `/exceptions`, `/sanctions`,
  `/maintenance`, `/readiness`, `/map-payload`) were being captured by
  the `GET /vessels/:id` handler and rejected with HTTP 400 "Invalid
  ID parameter". The catch-all is now mounted last so literal-path
  modules win. Post-restart curl: all nine now reach their real
  handlers (return 401 for an unauthenticated investor, which is the
  correct gate, not 400 from a route trap). `GET /api/vessels/123`
  still returns 404 — numeric IDs still fall through correctly.

**Not fixed (out of scope per NO MOCK DATA rule, honestly disclosed):**

| # | Gap | Sev | What it needs |
|---|---|---|---|
| B | `vessels-demo` org's vessels/voyages/sanctions tables not seeded against this Postgres instance. | High | Run the existing `seed-platform.ts` against `$DATABASE_URL`; it is idempotent. Don't hand-insert rows. |
| C | `/api/vessels/live/ais/combined` returns `count: 0`. | Med | Provider-side (Digitraffic + BarentsWatch); the page already surfaces "no live vessels in window" honestly. |
| D | `temporal-worker` + `temporal-approval-worker` workflows are `failed`. | Med | Out of scope for read-path demo; needed for any approval-loop walkthrough. |
| F | No contract test guards the vessels route-order invariant. A future module added before `vessels-extended` could re-introduce the trap. | Low | Add an api-server test asserting `GET /api/vessels/dashboard` !== 400. |

**Demo verdict:** Read-path skeleton is now intact. To make the
demo *populated* takes one operator action (reseed) and one
infrastructure recovery (temporal workers). No further code changes
are blocking.

---

## 3. The a11oy `/org-intelligence` surface

Subagent built `OrgIntelligence.tsx` (12,852 bytes) and wired
`/a11oy/org-intelligence` in App.tsx (lazy import + `WithShell` route).

Behaviour:

- Polls `/api/org-intelligence/snapshot` every 60s with `cache:'no-store'`.
- Top chip row: "Repos reachable N/N" and live Operational/Daylight/
  Theater counts derived from the snapshot (worst-verdict wins per
  repo). Zero hardcoded numbers — this is the structural answer to
  follow-up #5206.
- Per-repo card: language pill, size, last-push age, open issues,
  default branch, last 3 commit subjects (short SHA + relative age),
  color-coded shipped_signals badges.
- Loading state: 6 skeleton cards. Per-card error pill on
  `_error`/`_http_code`; endpoint-level 503 raises a red banner.
- LSP clean. No other a11oy page touched.

Live verification: `GET /a11oy/org-intelligence` → 200 SPA shell + lazy
chunk wired (script tag confirmed in head); snapshot endpoint
serves it 6 real cards from GitHub.

---

## 4. Recommended next public-flip candidates

User asked which other repos to flip public for fuller diligence. From
the monorepo, the highest-signal candidates that already have shipped
code + tests + receipts (i.e. would arrive as OPERATIONAL on day one,
not THEATER):

1. **`platform/packages/vsp-otel`** — the actual implementation behind
   the currently-THEATER `vsp-otel` public repo. Pushing this is the
   single highest-leverage move because it both adds a new
   OPERATIONAL repo *and* flips an existing THEATER to OPERATIONAL.
2. **`platform/packages/cps-receipt`** — Covenant Proof Standard library
   that produces the receipts already on display in `szl-trust`.
   Publishing it lets external auditors verify receipts independently.
3. **`platform/packages/risk-formula`** — the registry already exposed
   read-only via `/api/vessels/formula/registry` (200 in T003 sweep).
   Open-sourcing it lets diligence parties replicate scoring locally
   from the same constants the live product uses.
4. **`platform/packages/ouroboros-core` runtime extracts** — if there
   is an embedded copy in the monorepo beyond what's in the public
   `ouroboros` repo, the delta is worth surfacing for ouroboros-thesis
   reviewers.

Order of operations recommendation: do (1) first — it retires the only
THEATER flag in the current six-repo board, which is the single most
audit-damaging item.

---

## 5. Architect review

Architect review flagged 2 HIGH issues — both fixed before this doc was
finalized:

1. **Contract mismatch** between API (`{kind, reason, evidence}`) and
   the a11oy board (`{verdict, label, detail}`). With undefined
   `verdict`, the board's tally fell through to `else operational +=
   1` and would have overcounted every repo as OPERATIONAL. **Fix:**
   API renamed to emit `verdict/label/detail/evidence` and added an
   inline comment guarding future rename drift. Live re-verified:
   every signal now carries all four keys; chip counts (4
   operational, 1 daylight, 1 theater) match per-card colours.

2. **Silent fallback in `fetchRepo`** — tree/readme fetch failures
   were being coerced to empty arrays and then fed to
   `computeShippedSignals`, which could emit investor-facing verdicts
   that reflected GitHub transport failure rather than repository
   reality. **Fix:** tree-fetch failure → `_error =
   'github_tree_unreachable'` and `shipped_signals = []` (no verdict
   fabricated). Readme failure → `_error =
   'github_readme_unreachable_theater_check_skipped'` (verdicts from
   the tree alone remain valid). Counts now gate on signal presence;
   added `evidence_missing` count to `b2_live_counts` for board-level
   visibility into partial outages.

## 6. Acceptance — Round 3 task plan

- [x] T001 — `/api/org-intelligence/{snapshot,healthz}` live, 200 with 6 real repos, POST 403, healthz 200, missing-token would 503 (not exercised because token is present).
- [x] T002 — `/a11oy/org-intelligence` page renders against the live endpoint with live-computed chips.
- [x] T003 — Vessels readiness dossier exists (244 lines, 10 SPA routes + 16 API endpoints walked, top-5 blockers ranked, fix #1 applied + verified post-restart, residual gaps disclosed).
- [x] T004 — This synthesis doc; live verification done; architect review run; commit message updated.

---

*Generated 2026-05-18 by main agent.*
