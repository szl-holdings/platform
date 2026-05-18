# Series-A GitHub Audit — Full Org × Thesis Reconciliation
**Date:** 2026-05-18
**Scope:** Every public repo in `github.com/szl-holdings` × every layer of
the thesis screenshot you sent (T → L → R → P → 7 surfaces).
**Goal:** Real, honest evidence of what is shipped, what is drift, what
is gap. No bandaids.

---

## 1 · Access posture

GitHub token in this env (`GH_WORKFLOW_TOKEN`) has **push + admin on
every repo** I audited. That includes all 4 spine repos, all 4 focus
surface repos, all 5 archived surface repos, and every support repo.
**I can push corrections without asking for more access.** I have not
pushed anything yet — pushing is destructive and requires your
explicit go.

API rate limit remaining: 4,999 / 5,000 (essentially untouched).

---

## 2 · The thesis screenshot vs reality

Side-by-side reconciliation of every claim in the iOS-notes screenshot
you sent against what `github.com/szl-holdings` actually serves right
now.

| Layer | Thesis screenshot claim | Reality (verified 2026-05-18) | Status |
|---|---|---|---|
| **T — Ouroboros Thesis** | `v1→v11 published · v12 PR #25 open · v13 in writing` | v11/v12/v13 **all published with DOIs** (`10.5281/zenodo.20119582`, `20173920`, `20195368`). Currently open: **PR #61** (v13 DOI backfill) and **PR #62** (v14 anatomy-evolved Ch.9). PR #25 is long closed. | **DRIFT — ahead of claim.** Real is more advanced than screenshot. |
| **L — Lutar-Lean** | `Lean 4 + Mathlib formalisation of the Lutar Invariant Λ_k uniqueness theorem · Kernel builds clean · ref-vectors check in CI` | Files present: `Lutar/{Axioms,Egyptian,Invariant,Bound,Uniqueness}.lean`, `RefVectors.lean`, `reference-vectors.json`. **Sorry count: 7 (4 in Uniqueness.lean, 3 in Bound.lean)**. Axioms, Egyptian, Invariant all clean (0 sorries). | **GAP — screenshot overstates.** The README itself is honest: "🟡 stated, proof scaffolded" for Uniqueness and Bound. Until `sorry == 0`, the kernel has not yet signed off the uniqueness theorem. Egyptian-exactness lemma is fully proved. |
| **R — Ouroboros Loop / runtime** | `Closure operator O:X→X with Λ-gate, Gauss forecast, witness-diversity, Bekenstein, dual-witness · 19/19 tests · published bit-exact ref-vectors` | Runtime repo README badge: **218/218 tests** (not 172, which is what older builds showed; not 19, which appears to be one specific bit-exact harness). v6.3.0 released. 9-axis Lutar Invariant in `Lambda Engine`. | **DRIFT — ahead of claim** at the runtime level. The "19/19" likely refers to the bit-exact ref-vector harness in `RefVectors.lean`/`reference-vectors.json` specifically — separate from the 218 runtime tests. |
| **P — Platform monorepo (this codebase)** | `TypeScript spine + 7 surfaces + workers + apps + services · 1,220 tests across 76 packages · 0 failures` | **207 workspace packages, 8,004 `test()/it()` declarations across the repo.** 76 was correct at thesis-writing time; reality is 2.7× packages and 6.5× tests. | **DRIFT — significantly ahead.** README badge in `ouroboros-thesis` still cites 1,220/76. Needs bump. |
| **MCP gateway** | `Streamable HTTP, SSE, OAuth 2.1, extension negotiation · 27/27 e2e including session lifecycle + extension RPC` | `services/substrate-mcp-gateway/tests/` ships `e2e.test.ts`, `mcp-apps.test.ts`, plus today's new `session-bootstrap.perf.test.ts` (Task #5069). Extension negotiation now has unit-level coverage in `packages/nexus-mcp/src/server.test.ts` (Task #5073 — merged this session). | **VERIFIED + extended.** Today's merges added perf coverage and unit-level extension-negotiation coverage on top of the e2e count. |
| **Surfaces — 7 vertical operators** | `A11oy · Sentra · Amaru · Vessels · Terra · Counsel · Carlota Jo` | All 7 repos exist on the org. **R6 narrows to a11oy + sentra + amaru + vessels (focus)**; counsel, carlota-jo, terra archived (also pulse + lexicon, which the screenshot omits — 9 surfaces total in code, screenshot lists 7). | **DRIFT — partial.** Screenshot omits `pulse` and `lexicon`. |

---

## 3 · Live operational state (verified 2026-05-18 from this env)

### Ecosystem aggregator (`/api/ecosystem/snapshot`)
```
ecosystem_verdict = DEGRADED
counts.apps_focus = 3                  amaru / sentra / vessels — all OPE
counts.apps_operational = 3            3 / 3 focus OPE
counts.apps_archived = 5               counsel/carlota-jo/pulse/lexicon/terra
counts.apps_archived_operational = 3
counts.apps_archived_degraded = 2      counsel, terra (mounted, real)
counts.org_repos = 17                  live_orgs_repos_api (no caching lie)
counts.org_operational = 9             includes ouroboros, lutar-lean, sentra, amaru, a11oy, platform, agi-forecast, ouroboros-thesis, szl-trust
counts.org_daylight = 7                visible but empty / pre-release
counts.org_theater_flags = 1           vsp-otel (placeholder repo — honest)
counts.org_evidence_missing = 0
```

`ecosystem_verdict` is DEGRADED **because we refuse to lie about the
one theater-flagged repo (`vsp-otel`)**, not because anything in the
focus set is broken. Flip that repo to operational (or delete it) and
the headline turns green.

### Per-app modules
| App | Modules | Verdict |
|---|---|---|
| amaru   | 8/8   | OPERATIONAL |
| sentra  | 12/12 | OPERATIONAL |
| vessels | 15/15 | OPERATIONAL |

### Per-tab walks (subagent-audited this session)
- **Vessels**: 21 top-impact tabs walked, **0 true 404s**. Every API
  call resolves to a real mounted route across `vessels.ts`,
  `vessels-extended.ts`, `vessels-live.ts`, `vessels-cognitive.ts`.
- **Sentra**: 21 top-impact tabs walked. Five endpoints initially
  flagged as "missing" (documents/generate, nuro-mesh/*,
  consciousness/*, amaru/overwatch/*, atlas/artifacts) all return
  **401**, not 404 — they are mounted (`groups/ai.ts:97-130`,
  `amaru-proxy.ts:49`, `index.ts:713`) and gated by `authMiddleware`.
  That is correct behavior, not a gap.
- **Amaru / Conduit**: Sidecar `amaru-proxy.ts` independently verified.
  All five upstream endpoints (`/events`, `/receipts`, `/tripwires`,
  `/scheduler/wiring`, `/overwatch/snapshot`) proxy live to the running
  Amaru Python service.

### 17-repo public org × role mapping
```
SPINE (4):    ouroboros-thesis · ouroboros · lutar-lean · platform
FOCUS (4):    a11oy · sentra · amaru · vessels        ← Round 6 push
ARCHIVED (5): counsel · carlota-jo · pulse · lexicon · terra
SUPPORT (4):  szl-cookbook · agi-forecast · szl-brand · szl-trust · .github
THEATER (1):  vsp-otel  (placeholder, surfaced honestly)
```
(Counts to 18 because `.github` is a meta-repo, not a product.)

---

## 4 · What I recommend pushing (NOT yet pushed)

I am ready to push three precise corrections — **but pushing is
destructive** and I will only do so on your explicit go.

### Push #1 · `ouroboros-thesis` README badge bump
Replace the stale platform-tests badge:
- **From:** `platform-1%2C220%20tests%20%C2%B7%2076%20packages`
- **To:** the current count derived from `pnpm m ls` (207 packages)
  and a measured pass count from a real `pnpm -r test` run.

I have not run the full 8,004-declaration suite end-to-end yet because
it takes long. I'd want to do that on a CI runner and capture the
exact passing count before bumping the badge — **bumping to a
hand-counted number would itself be drift.** Recommendation: trigger
the CI job, read the result, push the bumped badge with the CI run
URL embedded in the commit message as evidence.

### Push #2 · `lutar-lean` status realignment
The README is already honest about the `sorry` count. The thesis
screenshot is what's overstated. Two clean options:

- **(a)** Add a CI badge that reports live `sorry` count (7 → 0
  countdown) so the screenshot and the README can never drift again.
- **(b)** Update your thesis screenshot to say "Λ_k uniqueness theorem
  *scaffolded* · 7 sorry remaining · Egyptian-exactness ✅ proved" so
  the funding deck matches the kernel.

Recommend **(a)** — code beats screenshots forever. I can add a
GitHub Action that runs `lake build`, counts `sorry` in
`Lutar/**/*.lean`, and writes a JSON shield endpoint that the README
badge reads. That's a real fix, not theater.

### Push #3 · Series-A README on `platform` repo
The `platform` repo (this codebase) has 636,844 KB / 207 packages and
no top-level "what this is and what's running" README aimed at a
Series-A reader. Today's `/api/ecosystem/snapshot` output is the
ground truth — I can generate a README that **renders from a live
snapshot at commit time** (CI step writes the JSON into the README
template) so it can never drift from the running system. Same anti-
drift posture as #5206 / #5207 on the landing page chips.

---

## 5 · What I will NOT do

- Will not change a single `sorry` to a placeholder proof to make the
  Lean kernel pretend it's signed off. The kernel is the referee.
- Will not pad the test count. 8,004 declarations ≠ 8,004 passing
  tests until a real CI run says so.
- Will not delete or hide the `vsp-otel` theater flag. The aggregator
  reporting DEGRADED is the system telling the truth.
- Will not push any of the three corrections above until you say go.
- Will not call `proposeFollowUpTasks` — chip-drift work is covered by
  #5206 / #5207.

---

## 6 · What I need from you to proceed

Three yes/no decisions:

1. **Push the badge correction to `ouroboros-thesis`** after I run a
   real `pnpm -r test` measurement? (Y/N)
2. **Add the live-sorry-count CI badge to `lutar-lean`**? (Y/N)
3. **Generate the snapshot-rendered Series-A README on `platform`**?
   (Y/N)

If yes on any, I'll prepare the exact diff and show it to you
**before** the push, then push only after you confirm.

I do not need any additional access — admin+push on all 17 repos is
already live in this environment.
