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

## Follow-up plan: isolation diagnostics and terminal CI dispositions

Recorded before the follow-up patch on 2026-10-03:

- The exact-head workflow run `37105707193` fails in isolated dependency-root
  preparation before browser capture. Its log contains no diagnostic naming
  the failing assertion. The exact failing predicate and OS cause are UNKNOWN;
  no permission repair is justified by that log alone.
- Add named failure messages to the existing candidate source/runtime checks
  in `.github/workflows/exact-head-screenshot-evidence.yml`. Preserve each
  predicate, isolated identity, permission mode, read-only tooling boundary,
  source admission and evidence denial. Do not add tracing of environment
  values, weaken a guard or claim the hosted fault is fixed.
- Add regression coverage in
  `scripts/ci/exact-head-screenshot-evidence.test.mjs` for successful assertions,
  each rejected predicate, failed runtime inventory and writable runtime
  findings. Fixed test doubles establish SIMULATED guard/diagnostic behavior,
  not real user isolation; actual Linux execution is separately required.
- Document this diagnostic boundary in
  `docs/standards/exact-head-screenshot-evidence.md`, append measured results to
  this packet and append security/capture dispositions to the task and gap
  registers. No rendered UI or dependency graph is changed.
- Success criteria: diagnostics identify the guard while retaining fail-closed
  behavior; regression and claim checks pass; a signed forward commit is
  normally pushed to PR #883. A branch change does not alter the protected-main
  controller used by workflow dispatch. No merge or deployment is authorized.

### Follow-up measured results

MEASURED readbacks for the initial reconciliation head
`d4bc06f46a89f85c620c96d6e6407f12fa17c031`:

- Normal push succeeded and [PR #883](https://github.com/szl-holdings/platform/pull/883)
  was opened. GitHub's commit signature readback reports `isValid: true`,
  `state: VALID`, signer `stephenlutar2-hash`. Local SSH verification is good
  but principal trust is not pinned locally; provider verification is a
  separate measured result, not an independent out-of-band key attestation.
- All 55 PR checks completed: 50 SUCCESS, two SKIPPED, three FAILURE. Typecheck
  passed in 14m2s and Runtime Audit in 19m7s; A11oy E2E, accessibility,
  Lighthouse, source truth and functional checks also passed. This rollup
  qualifies only `d4bc06f`, not a later diagnostic commit.
- The dependency report from
  [Security Audit run 37105562351](https://github.com/szl-holdings/platform/actions/runs/37105562351)
  parses 2,005 dependencies with zero Critical, two High and one Low finding.
  Its downloaded Markdown SHA-256 is
  `c18c884ab23bfc55639e66b18cffb5d0afd9198c85e36e0ac934ed2cb36400c1`.
  The High findings are
  [Forge GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
  and [Braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
  Both official advisory records list no patched version, and fresh registry
  reads report latest `node-forge@1.4.0` and `braces@3.0.3`.
- Read-only lock graph traversal identifies Expo CLI/code-signing tooling from
  `lib/mobile-shared` as the Forge parent path and Micromatch/Jest/Metro as the
  Braces path. The
  [Grype run 37105562392](https://github.com/szl-holdings/platform/actions/runs/37105562392)
  independently blocks at its existing High threshold and uploads a Forge
  finding in `pnpm-lock.yaml`. The aggregate Security Gate correctly fails
  because the dependency scan fails; secret scanning, lockfile integrity and
  license reporting pass. No exposure or exploitation is claimed.
- Authorized command `gh workflow run exact-head-screenshot-evidence.yml
  --repo szl-holdings/platform --ref main -f
  candidate_sha=d4bc06f46a89f85c620c96d6e6407f12fa17c031 -f
  target_branch=codex/p0-series-a-proof-reconciliation-20261003 -f source_pr=883
  -f route=/a11oy/start` dispatched
  [run 37105707193](https://github.com/szl-holdings/platform/actions/runs/37105707193).
  Controller `f2f8df6f89056e9104587674ccec0855dd5b177a` passed the contract.
  Candidate dependency-root preparation exited 1 before candidate install or
  browser capture; promotion publication was SKIPPED. No admissible artifact
  was produced. `gh run view 37105707193 --repo szl-holdings/platform
  --log-failed` supplies no exact failing predicate. OS cause remains UNKNOWN.

The follow-up patch adds named assertion/inventory failures with unchanged
predicates, permissions and isolated identity. Messages say an assertion failed
because a nonzero `sudo` result alone does not prove the candidate can write.
No speculative chmod, runtime-path rewrite or security exception is added.

MEASURED follow-up local commands:

| Command | Exit | Result |
| --- | --- | --- |
| `node node_modules/typescript/bin/tsc -p artifacts/a11oy/tsconfig.json --noEmit --pretty false` | 0 | Focused A11oy typecheck passed on the reconciliation source; no TypeScript source is changed by the follow-up |
| `pnpm typecheck` | 1 | Repeated after the follow-up; same shell PATH blocker, no worse than baseline |
| `node --test scripts/ci/exact-head-screenshot-evidence.test.mjs` | 0 | 15 passed, five native-Windows skips, zero failures |
| `$env:SZL_DIAGNOSTICS_TEST_BASH='C:\Program Files\Git\bin\bash.exe'; node --test scripts/ci/exact-head-screenshot-evidence.test.mjs` | 0 | 16 passed, four real-POSIX skips, zero failures; all seven fixed diagnostic cases execute |
| `node --check scripts/ci/exact-head-screenshot-evidence.test.mjs` | 0 | Test syntax valid |
| `node node_modules/@biomejs/biome/bin/biome lint scripts/ci/exact-head-screenshot-evidence.test.mjs` | 0 | Focused lint passed |
| `node scripts/docs/check-docs-claims.js` | 0 | All 26 claims verified again |
| `git diff --check` | 0 | No whitespace errors |

An independent session agent also executes the extracted fixture/helper under
Git Bash: the success case exits zero; all six rejection cases exit one, print
their named failure and cannot reach the admission marker. That is a second
SIMULATED diagnostic check, not an independent hosted-isolation witness. The
four real POSIX tests remain for fresh Linux CI. No rendered UI changed, so
new local route/product screenshot capture is NOT RUN in this follow-up.

Payload disposition is now SECURITY BLOCKED (unpatched dependency advisories),
HOSTED CAPTURE BLOCKED (isolation preparation, exact cause UNKNOWN), and
DIAGNOSTIC SOURCE PATCHED (tests as scoped above). Protected controller
publication, real isolation and fresh browser artifacts remain separate
obligations. Historical images are preserved and not recataloged as current.
Fresh checks and signature readbacks of the forward commit are required;
the completed `d4bc06f` rollup does not substitute for them. No merge, deploy,
force-push, package removal, model publication or gate weakening is performed.
