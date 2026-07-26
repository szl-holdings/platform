# Series A W1 Truth Lock — Proof Packet

Generated: 2026-07-25

## Context

The Series A payload contained stale estate counts and required every public
number to resolve to evidence or to fail closed as `UNAVAILABLE`. This change
adds a generated public-evidence artifact, validates its evidence labels,
rejects nearby hard-coded metric drift, documents secret-scan suppressions, and
removes the retired challenge name from current public READMEs.

The platform also retains `audit/source-of-truth.json` for reproducible tracked
tree counts. `SOURCE_OF_TRUTH.md` is the authority index between those two
machine-readable records; it does not duplicate either record's values.

No deployment, DNS, repository visibility, branch protection, license, history,
secret, or external publication was changed by this patch.

## Plan

1. Generate `artifacts/SOURCE_OF_TRUTH.json` from local evidence and authorized
   public APIs.
2. Preserve no previous value when a source is missing or unreachable.
3. Validate the schema, labels, freshness, and allowlist reasons.
4. Reject current metric literals that diverge from generated truth.
5. Verify the full workspace on Windows and repair portability failures rather
   than weakening a test.
6. Record every unresolved measurement and governance gap.

## Patch

- Added deterministic truth generation and validation under `tools/truth/`.
- Added a SHA-pinned `truth-drift` GitHub Actions workflow.
- Added `.truth-allowlist`; every entry requires an inline `# reason:`.
- Generated `security/ALLOWLIST-JUSTIFICATIONS.md` from the tracked secret-scan
  configurations and linked it from `SECURITY.md`.
- Replaced the hand-maintained root metric table with a source-of-truth index
  that defines the non-overlapping authority and failure rules for the
  repository-structure and public-evidence records.
- Corrected current public READMEs to use the neutral
  `legacy challenge-set` description.
- Repaired Windows command resolution and sandbox-process cleanup exposed by
  the full test graph.
- Repaired the strict documentation-claims gate to validate the current
  CSRF package, tracked route module, and canonical API evidence table instead
  of eleven files and sections that no longer exist.
- Recorded unavailable evidence and consolidation constraints in
  `docs/operations/known-gaps.md`.

## Test

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | PASS — all 198 workspace projects installed |
| `pnpm truth:generate` | PASS |
| `pnpm truth:generate -- --verify-local` | PASS |
| `pnpm truth:validate` | PASS |
| `pnpm claims:drift` | PASS |
| `node scripts/audit/validate-source-of-truth.js` | PASS — 46/46 checks |
| deterministic regeneration plus artifact diff | PASS |
| `pnpm typecheck` | PASS — 179/179 tasks |
| `pnpm test` | PASS — 109/109 tasks |
| `pnpm build` | PASS — 43/43 tasks |
| Python compile for modified governance/runtime files | PASS |
| strict documentation claims | PASS — 26/26 claims |
| repository secret scan | PASS — 0 findings |
| generated scanner-allowlist coverage | PASS — 98/98 rows |
| current non-historical public README retired-name scan | PASS — 0 hits |
| current non-historical public Markdown/HTML/TSX retired-name scan | PASS — 0 hits |
| `git diff --check` | PASS |

Task-graph totals are build-system tasks, not individual test-case counts.
Per-test counts remain `UNAVAILABLE` because no machine-readable
`artifacts/test-results.json` aggregate was produced.

## Screenshot

Not applicable. W1 changes generated evidence, validation, documentation, and
CI; no user interface was modified.

## Verify

The committed artifact reports:

| Metric | Value | Label |
|---|---:|---|
| Governed app manifests meeting the health/receipt definition | 0 | MEASURED |
| pnpm workspace projects | 198 | MEASURED |
| Runtime API endpoints | unavailable | UNAVAILABLE |
| CI workflows | 45 | MEASURED |
| Locked proven formulas | 8 | REPORTED |
| Hugging Face models | 15 | MEASURED |
| Hugging Face datasets | 26 | MEASURED |
| Hugging Face Spaces | 25 | MEASURED |
| Hugging Face collections | 12 | MEASURED |

Database tables, per-test counts, runtime API endpoints, Lean sorry count,
Lambda median, and receipt-chain depth are explicitly `UNAVAILABLE`; no stale
number is carried forward. Source route declarations are retained separately in
the repository-structure registry and are not represented as live endpoints.

## Proof and Remaining Gaps

- Generated truth: `artifacts/SOURCE_OF_TRUTH.json`
- Drift guard: `.github/workflows/truth-drift.yml`
- Claim allowlist: `.truth-allowlist`
- Suppression evidence: `security/ALLOWLIST-JUSTIFICATIONS.md`
- Canonical gaps: `docs/operations/known-gaps.md`

The live organization inventory measured 53 public repositories. Consolidation
to the recommended nine requires founder-approved visibility changes and
reversible archive receipts. The Hugging Face estate remains 15 models,
26 datasets, and 25 Spaces; this W1 patch audits it but does not privatize or
deploy any asset. Independent review remains a documented transition control
for the first qualified engineering or security hire; no review was fabricated.
