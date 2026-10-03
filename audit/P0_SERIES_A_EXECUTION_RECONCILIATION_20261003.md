# P0 Series A execution reconciliation — 2026-10-03

## Workcell and plan

- `workcell_id`: `P0-SERIES-A-PRODUCT-WIRING-20260811`
- `agent`: Codex
- `recorded_by`: Codex
- `recorded_at`: 2026-10-03
- `objective`: reconcile the resumed task with current protected source and
  verify the retained product contracts without restoring a superseded lane.
- `plan_summary`: read repository doctrine and current source, verify PR lineage,
  run the focused product/layout and documentation checks, reconcile the task,
  application status and known-gaps records, then commit and normally push a
  documentation-only successor for protected review.
- Planned files: this append-only packet,
  `.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md`, `docs/APP_STATUS.md`,
  and `docs/operations/known-gaps.md`.
- Success criteria: current source/PR identity is explicit; historical proof is
  retained; new claims have evidence classes; the patch adds no runtime, policy,
  dependency or UI changes; its source and documentation checks pass.

## Observed source and PR lineage

MEASURED by authenticated GitHub and Git readbacks on 2026-10-03:

- The retained PR #671 branch is pushed at
  `723df8b9a54ecd08b085755a6d88652a0685ee44`; the local and remote heads agree.
- The owner [closed #671 as superseded by #668](https://github.com/szl-holdings/platform/pull/671#issuecomment-5447415776)
  on 2026-08-28. Its audit branch is preserved and was not reopened.
- PR #668 merged at `6bde2b6f2e0a360f31a87c3e8228c141b062585e`.
  GitHub's comparison confirms that commit is an ancestor of current main.
- [PR #601](https://github.com/szl-holdings/platform/pull/601) subsequently merged
  on 2026-10-01 at `f2f8df6f89056e9104587674ccec0855dd5b177a`.
- Current main tree is `1c07dc9f7c0d3be1b3d4408c2edc19fe584fd2b9`;
  GitHub reports its merge signature `verified: true`, reason `valid`.
- The final #601 head has that same tree but GitHub reports its signature
  `verified: false`, reason `unsigned`. The verified merge does not relabel
  the branch head signed.
- This session's documentation branch is
  `codex/p0-series-a-proof-reconciliation-20261003`, based on that current main.

The #601 head `7aa2fc69451baa1ded0302557d7d05ad9cee3dba` has 53 successful
checks, three skipped checks and one failed Commitlint check. Typecheck, Lint,
E2E Gate, Security Gate and truth-drift passed. The failed
[Commitlint run](https://github.com/szl-holdings/platform/actions/runs/36916607658)
reports non-conventional historical merge subjects (`subject-empty`,
`type-empty`, `type-case` and `type-enum`). This is not an all-green PR record.
No history or gate was changed to hide it. These historical checks do not
qualify this documentation successor until its own checks finish.

## Validation and completion

The plan was recorded before the documentation patch. This patch updates the
task's latest product promotion, adds the qualified investor/developer routes
to the existing A11oy application entry, and appends the current known-gap
disposition. It adds no runtime, UI, dependency, workflow or gate changes.
Current product status remains Partial and fixture behavior remains DEMO.

### Commands and results

MEASURED local commands on the current protected source:

| Command | Exit | Result |
| --- | --- | --- |
| `node --version` | 0 | Node v24.19.0 |
| `node --test artifacts/a11oy/test/series-a-contract.test.mjs artifacts/a11oy/test/product-wiring-contract.test.mjs artifacts/a11oy/test/atelier-session-continuity-contract.test.mjs scripts/qa/series-a-proof-helpers.test.mjs scripts/qa/screenshot-layout-helpers.test.mjs` | 0 | 37 passed, zero failed/skipped, including nine browser layout regression fixtures |
| `node scripts/docs/check-docs-claims.js` | 0 | All 26 claims verified; passed before and after the documentation patch |
| `node scripts/audit/validate-source-of-truth.js` | 0 | All 66 checks passed |
| `node node_modules/tsx/dist/cli.mjs scripts/brand-check.ts` | 0 | Brand checker passed |
| `node node_modules/tsx/dist/cli.mjs scripts/check-banned-brand-strings.ts --changed-from origin/main` | 0 | No new violation; zero source files selected by this documentation-only delta |
| `node node_modules/tsx/dist/cli.mjs tools/truth/claims-drift.ts` | 0 | Claims drift PASS |
| `node --test scripts/ci/exact-head-screenshot-evidence.test.mjs` | 0 | 14 passed, four platform-dependent tests skipped on Windows, zero failed; hosted Linux remains a separate check |
| `pnpm typecheck` | 1 | BLOCKED: pnpm is not available on this shell's PATH; no dependency installation or substitute package-manager version was used |
| `git diff --check` | 0 | No whitespace errors |

Whole-workspace tests, a new product build, live product route QA and new
product screenshots were NOT RUN locally in this documentation-only pass.
No route or rendered UI was changed. The nine browser layout fixtures verify
the layout detector, not fresh product screenshots. Hosted #601 Typecheck,
Lint, E2E and Security results are separate observed provider records above.
Local disk was below 1.5 GB, so no new dependencies or browser were downloaded.

### Retained visual proof readback

MEASURED read-only `node -e $proofScript` using Node's `fs`, `crypto` and
`assert/strict` verified all 75 retained PNG SHA-256 values, PNG signatures,
widths, planned route/surface/heading/viewport bindings, source identities,
capture dates, command identities and owned origins. All 155 recorded
interaction states remain PASS; recorded browser/network/layout failure
arrays are empty. The 348-entry served-asset manifest totals 16,686,055 bytes
and hashes to
`6bd646fff443ae07a6ad551632a9b76611d8df3bae8c3926b0d366f68aec12a0`,
matching its recorded pre/post digests. These are retained-byte observations,
not a new browser or build run.

The byte-preserved September 30 sidecars hash to:

| Sidecar suffix | SHA-256 |
| --- | --- |
| `metadata.json.txt` | `9dcf8a60f8d745789c7ca325992b523a2e5c0d93125b755a4454cbd794aa6115` |
| `source-bound-metadata.json.txt` | `625f984fbbfc535cc86a397b088266330cb0746e7d5e7369bf2a569ff842d5c5` |
| `interactions.json.txt` | `5ab1584cb791bc751bad5440a1f424a8afb9016f7d4d7f0bb7a19f1b0318fcdd` |

Eight of the nine recorded source-input hashes match current protected blobs
and worktree bytes. The current lockfile hashes to
`004b20e2c5a7d1e89c9933599badbf6e00fbdabdfaba7b99fa689779fb20ad3b`;
the capture recorded
`9bcfe142d09cce0867b0bfb0e09c0ae030034f02da54aa4b187287ccd9b224ba`.
The captured Git object `683c13a1ec3ddfc0a347c103a242ae0c8a17ea46` is
absent in this shallow checkout, so fresh original-source immutable-blob
replay is UNAVAILABLE here. The September 30 packet's earlier blob checks
remain historical. Its images stay bound to that local captured source.

### Payload dispositions and non-claims

- Prior no-remote/no-push report: superseded by MEASURED local/remote head
  agreement at `723df8b9a54ecd08b085755a6d88652a0685ee44`.
- PR #671: owner-closed/superseded; preserved as audit ancestry, not reopened.
- Product implementation: MEASURED present in protected source through #601.
- #601 Commitlint failure: retained historical failure; no all-green claim.
- September 30 screenshots: retained, verified bytes; LOCAL_NON_AUTHORITATIVE
  for their original source; no claim that they qualify today's lockfile.
- Current hosted capture: UNAVAILABLE at this packet's initial publication;
  any new governed run requires its own source-bound receipt.
- Application status: Partial; linked fixtures DEMO; external mutations
  BLOCKED; qualifying authenticated operational Workcells UNAVAILABLE.
- Public claim check: new copy qualifies source and presentation separately
  from runtime; no customer, revenue, integration or certification claim added.
- Security check: MEASURED staged added-line scans found zero secret-pattern or
  retired-name hits; only the four planned Markdown paths are staged, with no
  `.env`, key, database dump, runtime, dependency or workflow file change.
  This bounded scan is not a whole-estate security certification.
- Known gaps: current product promotion is reconciled; provider, hosted capture,
  identity, durability, deployment and runtime obligations remain explicit.
- Proof level: Level 2 for this documentation/evidence reconciliation. The
  retained local product images are not upgraded to hosted release proof.

No merge, deployment, provider/model publication, database mutation, history
rewrite, external action authorization, customer outcome, production receipt
or independent runtime witness is claimed by this session.
