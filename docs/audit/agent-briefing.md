# Agent Briefing — In-Flight Tasks (post #4940)

**Author:** task #4940 (materialize-thesis-lineage)
**Audience:** agents picking up #4926, #4927, #4928, #4929, #4939
**Date:** 2026-05-16

Task #4940 landed the canonical TH1→TH8 thesis lineage across the seven
shipped artefacts and introduced infrastructure that the in-flight tasks
will rely on. This briefing tells you exactly what is now true so you
don't re-implement, re-validate, or fight conventions that have already
been set.

---

## 1. What #4940 actually shipped

### 1.1 Payload package extension
- `packages/payload/src/index.ts` now exports:
  - `THESIS_PAPERS` — typed array of 8 entries (TH1..TH8) with title,
    version, DOI URL, status, theorem list.
  - `THESIS_TIMELINE` — chronological event list.
  - `THESIS_LINEAGE` — `{ papers, timeline, audit }` rollup. `audit`
    mirrors the Lean `status.json` (`leanTheorems`, `leanSorriesOpen`,
    `leanSorriesClosed`, doctrine).
  - `ThesisPaper`, `ThesisTheorem`, `thesisPaperSummary()` helpers.
- Imports the canonical `packages/payload/raw/dev1_thesis/thesis_payload.json`
  (byte-locked, do not touch) and the Lean discharge mirror
  `packages/payload/proofs/lean_th8/status.json`.
- Package `main` still points at `src/index.ts` (no build step;
  consumers compile from source via the existing TS project refs).

### 1.2 Lean TH8 sorry discharge — partial, with honest gaps
- New: `packages/payload/proofs/lean_th8/`:
  - `LinearReceipt.proofs.lean` — **3 sorries closed with real proofs**:
    `consumeEntry_decrements`, `consumeEntry_none_iff`,
    `consume_unavailable_means_no_receipt`.
  - `GLR.proofs.lean` — partial closures for TH8a/TH8b/TH8c with
    documented gaps where they remain.
  - `status.json` — machine-readable mirror: **3 closed, 5 open**.
    Open: `at_most_one_consume` (needs `CtxLinearWellFormed`),
    `TH8a` (needs `passType_implies_count_pos`),
    `TH8b` (←closed, → blocked on axiom A12),
    `TH8c` adjunction (POPL 2027 scope, est. 3–4 weeks),
    `TH8_C3_entropy_monotonicity` (downstream of TH8b).
  - `README.md` — explains the discharge log.
- **No `lake`/Mathlib in the env**, so the proofs are not machine-verified
  here. `status.json` says so explicitly. Anyone wiring `lake build` into
  CI must treat the 5 open sorries as known-failing.

### 1.3 Surface integration (7 artifacts)
- Every shipped artifact's `GovernancePanels.tsx` (`conduit`, `vessels`,
  `counsel`, `sentra`, `terra`, `carlota-jo`, `a11oy`) now imports
  `THESIS_LINEAGE` / `THESIS_PAPERS` and renders a "Thesis lineage ·
  TH1→TH8" panel section. The block respects each artifact's existing
  visual system (dark/gold, light/serif, etc.) — do not restyle without
  checking the parent file.
- `artifacts/conduit/src/pages/thesis.tsx` is a **new** Amaru-branded
  page (TH1→TH8 ribbon). Routed at `/thesis` in
  `artifacts/conduit/src/App.tsx`.
- `artifacts/a11oy/src/pages/Thesis.tsx` and
  `artifacts/sentra/src/pages/thesis.tsx` had a TH1→TH8 ribbon block
  appended above their existing canonical-markdown views.

### 1.4 Forbidden-pattern guard
- `scripts/check-forbidden-patterns.mjs` scans `artifacts/`, `docs/`,
  `packages/payload/proofs/` for the 8 doctrine-forbidden patterns
  (loaded directly from `thesis_payload.json`).
- Pre-existing legacy hits in `docs/` are captured in
  `scripts/check-forbidden-patterns.baseline.json` (268 pairs). The
  guard fails CI on **new** hits only.
- To regenerate after legitimately removing legacy hits:
  `node scripts/check-forbidden-patterns.mjs --update-baseline`.

### 1.5 GitHub inventory ground truth
- `docs/audit/github-deep-scan.{md,json}` — live API scan of all
  szl-holdings repos, baseline diff included.
- **Live count is 17 org repos**, not 16. The +1 is `platform`
  (private). Public count remains 16. No new public repos, no
  archive/rename. Use the JSON as canonical for any tooling.

---

## 2. Conventions you must not break

1. **`packages/payload/raw/**` is byte-locked.** Read only. The doctrine
   compares hashes; modifying these files breaks every downstream surface.
2. **Forbidden patterns:** `Jr.`, `AlloyScape`, `Glass Wing`,
   `Glasswing`, `Mythos`, `Stephen Paul`, `Perplexity Computer`,
   `anonymous`. Use **Stephen P. Lutar** (no "Jr.", no "Paul"). The CI
   guard will catch new occurrences in your code.
3. **Thesis lineage is single-sourced from `@szl-holdings/payload`.**
   Do not inline TH1..TH8 strings, DOIs, or theorem counts in surfaces.
   Import `THESIS_PAPERS` / `THESIS_LINEAGE` and render from it.
4. **Lean `status.json` is the source of truth for sorry counts.** When
   you close additional proofs, update `status.json` in the same commit;
   audit panels read from it via the payload package.
5. **One-way doors stay shut.** Do not flip arXiv withdrawal, mint
   Zenodo DOIs, push tags to public org repos, or alter `LICENSE` files
   without a separate explicit task.

---

## 3. Task-specific notes

### #4926 / #4927 / #4928 / #4929 — surfaces & content tasks
- The `THESIS_LINEAGE` import path is `@szl-holdings/payload` (workspace
  package). Do not deep-import from `packages/payload/src/...`.
- A "Thesis lineage" panel block already exists in every shipped
  artifact's `GovernancePanels.tsx`. If your task adds a thesis-adjacent
  surface, *reuse the existing block* (extract it to a shared
  component under `packages/ui/` if you find yourself copy-pasting the
  same JSX a second time).
- If you add a new artifact, register it via the `artifacts` skill and
  add a "Thesis lineage" panel that imports from
  `@szl-holdings/payload` so the new surface participates in Λ₁₀.

### #4939 — Lean / proof-related work
- Do not delete the open `sorry`s in `GLR.proofs.lean` without a
  matching `status.json` update. The closure list is what the audit
  panels read.
- When closing `TH8b →`, the unblock requires axiom A12 (see the
  `gap_notes` field in `status.json`). Don't close it silently by
  asserting A12 as a lemma — keep the gap visible.
- `LinearReceipt.proofs.lean` proofs are written against the Mathlib
  API for `Multiset`/`Option`. If you add Mathlib namespaces, update
  the `README.md` import list so a future `lake build` works on first
  try.

---

## 4. Quick verification commands

```bash
# Forbidden-pattern guard (must exit 0):
node scripts/check-forbidden-patterns.mjs

# Confirm payload package type-checks (no build artefact written):
pnpm -F @szl-holdings/payload typecheck   # or: pnpm -w typecheck

# Confirm 7 surfaces still import the lineage:
rg -l "THESIS_LINEAGE|THESIS_PAPERS" artifacts/*/src
```

— end of briefing —

---

## V7 update — Fly-High V7 audit pack (post task #4970)

**Author:** task #4970 (v7-payload-ingest)
**Date:** 2026-05-16
**Audience:** in-flight tasks #4929, #4939, #4940, #4952 and any future
work touching doctrine surfaces.

Task #4970 ingested the Fly-High V7 audit pack (87 files, staged at
`packages/payload/raw_v7/`, schema `szl-holdings/fly-v7-replit-payload/v1`)
into `@szl-holdings/payload` as a `V7` namespace alongside V6. V6 stays
canonical for replay-root, the 13-DOI ledger, the 5 byte-identical
replays, and the Λ floor. V7 adds **doctrine refinements** and **five
specialist deliverables**.

### V7.1 What the package now exports

Import from `@szl-holdings/payload`:

- `V7` — rollup `{ manifest, doctrine, specialists, orgBaseline, prs }`.
- `V7_DOCTRINE` — pins `version: V6`, same `replayRoot`, plus the two
  V7 refinements: `mythosException` and `gitAuthorOverride`.
- `V7_SPECIALISTS` — `{ doctrineSweep, hygieneFix, bpFix, citationFix,
  prTriage }`. Headline numbers: 582 files scanned, 6 BP PUT payloads,
  13 CITATION.cff drafts, 68 open PRs triaged (12 MERGE / 18 CLOSE /
  0 STALE / 38 NEEDS-REVIEW).
- `V7_ORG_BASELINE` — live snapshot at V7 generation (16 repos, 0 CI
  failing, scorecard avg 6.62, 10/6 BP compliant/weak).
- `V7_PRS` — typed `readonly` array of all 68 triaged PRs with
  `category`, `priority`, `reason`, `ghCmd`, and resolved upstream `url`.
- `V7_PANEL_FACTS` — display strings rendered by the new "Latest audit"
  row in every GovernancePanel and by the Amaru V7 ribbon.
- `v7ForbiddenHits(text, context)` / `v7IsForbidden(text, context)` —
  doctrine-aware guard that honors the Mythos exception and the
  git-author override (context: `doc | code | ui | git_author |
  git_committer | commit_metadata`).

**Do not deep-import** from `packages/payload/raw_v7/`. Use the package.

### V7.2 Two doctrine refinements you must respect

1. **Mythos exception.** `Mythos` is **allowed** when it appears as part
   of the exact phrase `Claude Mythos Preview` (citing Anthropic's
   third-party model name). All other `Mythos` usage remains forbidden.
   The phrase is extracted at module-load from
   `V7_DOCTRINE.mythosException` — do not transcribe it.
2. **Git author override.** Historical `Stephen Paul Lutar Jr.` git
   `author`/`committer` metadata is explicitly approved by the user.
   `v7ForbiddenHits(text, context)` returns `[]` when context is
   `git_author`, `git_committer`, or `commit_metadata`. The literal
   string in `doc` / `code` / `ui` contexts continues to fail.

The pre-existing `scripts/check-forbidden-patterns.mjs` (from #4940) scans
file contents, not git metadata, so the override is a no-op there. If you
add new tooling that inspects git-author fields, use the typed guard.

### V7.3 New documents

- `docs/audit/v7-pr-triage.md` — human-reviewable rendering of all 68
  PRs grouped by tier.
- `docs/audit/v7-apply-runbook.md` — exact execution order for the 6
  V7 apply scripts (token scopes, one-way-door inventory, post-condition
  checks).
- `docs/audit/v7-pm-decisions.md` — the 3 PM-decision items the V7
  specialist explicitly refused to auto-resolve (Glasswing/Mythos in
  `platform/`, BP review-count deadlock, missing CODEOWNERS in
  `vsp-otel` / `agi-forecast`).

### V7.4 Surface integration

Every shipped artifact's `GovernancePanels.tsx` (`conduit`, `a11oy`,
`sentra`, `counsel`, `terra`, `vessels`, `carlota-jo`) now renders a
**"Latest audit"** row sourced from `V7_PANEL_FACTS.latestAuditText`.
The Amaru landing (`conduit`) additionally exposes a small V7 ribbon
chip on its governance ribbon.

### V7.5 Integrity coverage

- `packages/payload/scripts/verify-integrity-v7.mjs` — strict SHA-256 +
  size verification of every file under `raw_v7/` against
  `MANIFEST.files[]`. Mirrors the V6 verifier.
- `pnpm -F @szl-holdings/payload verify` — V6 (unchanged).
- `pnpm -F @szl-holdings/payload verify:v7` — V7.
- `pnpm -F @szl-holdings/payload verify:all` — both.
- `pnpm -F @szl-holdings/payload test` — contract test now includes a
  4th layer asserting V7 exports equal raw_v7 sources, plus
  unit tests for the Mythos exception and git-author override.

### V7.6 What V7 does NOT do

- It does not run any of the 6 apply scripts.
- It does not flip arXiv / Zenodo one-way doors.
- It does not modify `raw/` (V6) or `raw_v7/` (V7) byte contents.
- It does not auto-resolve any of the 3 PM-decision items.

These remain gated on Stephen.

