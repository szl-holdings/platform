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
