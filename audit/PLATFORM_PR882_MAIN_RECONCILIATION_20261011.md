# PR #882 protected-main reconciliation — 2026-10-11

Evidence class: **MEASURED local source/lock checks**. Not hosted CI, a merge,
provider publication, runtime qualification or an independent external witness.

## Identity and scope

- Workcell: `SZL-20261011-PR882-RECONCILE`.
- Actor: Codex Platform reconciliation subagent; root agent owns remote writes.
- Incoming branch: `aa65e27bce6f124bde7084d4c34781297eadedc9`.
- Protected main: `952439b96efe5eccaf9474d831edb4dd46343d15`.
- Common base: `f2f8df6f89056e9104587674ccec0855dd5b177a`.
- Ordinary merge, no reset or force push. Existing dirty source checkout and
  unrelated `security/vuln-report.md` changes were preserved.
- Five content conflicts were resolved; screenshot catalog merged additively.
  Continuity implementation resolves exactly to protected-main bytes. Its
  suite adds one fresh index/object temporary-publication preservation control.
  Lock/workspace resolution retains the six vendor pins, six security floors,
  maintained braces mapping, and PR #882's higher DOMPurify floor `>=3.4.16`.

Protected main already removed the unused direct Expo development dependency
from mobile-shared and preserved optional-peer/type boundaries. This removes
the active Expo CLI/certificate/node-forge graph rather than renaming a
vulnerable dependency or suppressing its advisory. The braces backport retains
the existing contributor-source attribution and MIT license in
`packages/braces-safe/UPSTREAM.md`; it is not a newly published upstream fix.

The PR-only installed Expo/node-forge workflow was obsolete after that graph
removal. Only those controls are adapted: retained pristine-helper unit tests,
a parsed tracked-source/actual-lock retirement contract, its negative controls,
and the mandatory maintained-braces security suite. The node-forge patch and
historical helpers/proof packets remain historical source. Native dependency
audit, Grype, CodeQL, SBOM, secret/license scans, lockfile frozen checks, severity
thresholds, and aggregate Security Gate are not waived or weakened.

## Reproducibility and evidence

All commands below use Node `v24.19.0`; pnpm is the cached repository-pinned
`10.26.1`, not a newly downloaded package-manager runtime.

| Command actually run | Result / boundary |
| --- | --- |
| `git fetch --filter=blob:none --no-tags origin main codex/cyber-evidence-20261002` | exit 0; exact source refs read |
| `pnpm install --offline --frozen-lockfile --lockfile-only --ignore-scripts --config.manage-package-manager-versions=false` | exit 0; all 204 workspace projects; not installed-runtime proof |
| `node --test scripts/qa/check-retired-signing-graph.test.mjs` | exit 0; 133 controls |
| `node scripts/qa/check-retired-signing-graph.mjs` | exit 0; 207 tracked manifests; ten protected families have policy-conformant lock nodes; undici and tar explicitly policy-only |
| `node --test packages/braces-safe/test/security.test.cjs` | exit 0; 8 controls |
| `pnpm --filter @workspace/alloy-runtime-api... --filter @szl-holdings/mobile-shared... install --offline --frozen-lockfile --ignore-scripts --config.manage-package-manager-versions=false` | exit 1; cached store lacks `@vitest/pretty-format@4.1.11`; no scripts/downloads; not a passing install |
| Native continuity suite and mobile typecheck | NOT RUN at initial packet; completion requires a fresh append below |
| Whole-workspace typecheck/build, hosted exact-head checks, registry vulnerability scan | NOT RUN in this local merge preparation |

Initial restricted-network hydration reconstructed nine canonical signed Git
commits and 1,423 tree objects from read-only source data; each reconstructed
object had to reproduce its declared Git SHA before insertion. Thirteen overlap
blobs also reproduced their Git SHA. After explicit environment access changed,
normal native Git fetching resumed. Object insertion is not a fabricated
signature or an alternative to source tests. Local import packets remain with
the isolated checkout handoff; no credential or private key was exported.

## Security and claim review

The source/lock contract uses the existing declared `yaml` parser, not a bespoke
string-only YAML parser. It rejects parser errors/warnings, duplicate keys,
anchors/aliases, malformed graphs and JSON, unsupported lock versions, retired
package references at manifest/importer/package/snapshot/patch layers, stale
braces edges, altered canonical overrides, and lower actual node/edge versions.
Unused override policies remain explicit; this contract is not a vulnerability
scanner, a frozen installation, or compatibility/effect authority.

Continuity keeps authenticated first-start marker validation and discards stale
read bytes on publication-link/ctime churn before a bounded same-inode,
HMAC-verified reread. PID-shaped names are not an authentication substitute.
Final unindexed encrypted objects are retained for safe quiescent maintenance;
old age plus an index snapshot does not authorize deletion. Cross-host locking,
production identity, live inference and physical-purge parity remain unproven.

Screenshot disposition: **N/A** for new reconciliation-only edits, which are
non-UI. Inherited PR #882 UI changes remain; older screenshots retain their
original source/time boundary and are not relabeled as current runtime evidence.
Proof level: local source/lock only.
Independent agent review, signed publication, exact-head CI, protected merge,
Hugging Face parity, public product/proof readback and external runtime witness
remain separate required evidence.

## Bounded review follow-up plan — 2026-10-11

The replacement reconciliation writer owns only this isolated checkout; root
retains signing, remote writes, CI admission, and protected merge. Before the
follow-up patch, the saved importer-relative braces fix passed 138 controls and
the actual parsed inventory covered 207 tracked manifests. That result did not
cover the reviewer's newly identified retired declared-package-name bypass.

Plan: change only the retirement validator and its negative/positive controls
to reject present retired manifest package identities and malformed present
names, without scanning descriptions or requiring a name on valid templates.
Retain the saved four importer-braces negative groups and canonical relative-link
positive control. Re-run the contract and braces suite, attempt native focused
continuity/mobile checks, record every result, and freeze the exact Git tree.
The prepared merge of `952439b9` must be preserved before reconciling subsequently
advanced protected main; no new-main workflow or release controls are overwritten.

Pre-edit mobile baseline: repository-pinned pnpm `--filter
@szl-holdings/mobile-shared typecheck` returned exit 1 because `tsc` was not
installed/resolved in this isolated checkout. This is not a passing typecheck or
a source error diagnosis. Native dependency completion remains a separate gate.

Follow-up results actually run on the saved interim `952439b9` integration:

- `node --test scripts/qa/check-retired-signing-graph.test.mjs`: exit 0,
  **143/143** controls; zero failures, cancellations, or skips.
- `node scripts/qa/check-retired-signing-graph.mjs`: exit 0, **207** tracked
  manifests; ten protected families have conformant actual nodes and undici/tar
  remain explicitly policy-only. This is source/lock evidence, not a scanner.
- `node --test packages/braces-safe/test/security.test.cjs`: exit 0,
  **8/8** controls for the interim `0.1.0` derivative.
- An attempted `node --test scripts/qa/derive-pristine-node-forge.test.mjs`
  returned exit 1 because that filename does not exist. The retained helper
  suite is named `prepare-node-forge-pristine.test.mjs`; it was **NOT RUN** by
  this follow-up writer. No passing helper count is inferred from the failed command.
- Native continuity suite, completed mobile typecheck, whole-workspace checks,
  and hosted CI are **NOT RUN** on this follow-up candidate. Root stopped further
  old-tree dependency closure work because protected main advanced.

Fresh read-only Git fetch observed protected main
`5f9d0959114a269fe86e0cedab8f92ae4591a81e`. Its three-commit advance includes
runtime/admission hardening, new security/report/secret/license controls,
additional dependency pins and patch declarations, exact DOMPurify `3.4.16`, and
a stronger maintained braces derivative `0.2.0`. This interim merge is preserved
for ordinary history integration only; it is **not current-main qualification**.
Those new-main bytes must be normally merged, the retirement contract adapted
to their exact policies, and the focused/native/hosted checks repeated before
publication or protected admission. No current-main control is waived here.

## Current-main integration plan — 2026-10-11

Root signed the preserved interim tree as local commit
`b42901d5c7cbef391d488a117eefc275b52fa9c8`. A missing promisor object initially
blocked the next ordinary merge; a temporary process-scoped alternate object
directory pointing to the canonical sibling PR #903 checkout allowed root's
ordinary `5f9d0959` merge to reach seven real conflicts. This writer owns only
the PR #882 checkout again. The sibling is read-only and no remote is written.

Resolve the seven conflict paths explicitly: keep current-main workspace/lock
policies and historical node-forge patch; keep the PR's honest non-production
security design page; retain both screenshot histories and both gap registers;
select the exact current-main reproducibility workflow. That workflow retains
two isolated checkouts, 90-minute timeout, forced builds, complete nonempty
output manifests, and no PR path filter. Historical per-task capture helpers and
their prior proofs remain source, not active current-main orchestration proof.

Adapt only the retirement validator/test to exact current-main DOMPurify,
fast-copy, selector-parser and eight OTel driver policies and the private
braces-safe `0.2.0` identity. Preserve every newer scanner/report/artifact/secret/
license/admission control. Re-run focused source and native functional suites,
record actual failures or missing tools, freeze the tree, then hand immutable
review/signing/publication ownership back to root. No claim of hosted CI,
deployment, effect authority, current screenshots, or external witness is made.

## Current-main local result — 2026-10-11

All seven content conflicts were resolved under the plan above. Current-main
`repro-check.yml`, workspace and lock, braces-safe `0.2.0` source/metadata, and
historical node-forge patch are byte-identical to `5f9d0959`. Security workflow
comparison against that immutable main contains only the two added mandatory
validation steps (ten lines); no scanner, report, artifact, secret, license, or
aggregate-gate body changed. Both screenshot histories are retained as dated
evidence, not reattributed to this candidate. The security design page retains
the PR's honest non-production text and no fabricated action/score/proof feeds.

Commands actually run using Node `v24.19.0`:

- `node --test scripts/qa/check-retired-signing-graph.test.mjs`: exit 0,
  **204/204** controls; zero failures or skips. All earlier 143 controls remain;
  current-main pin groups and braces version identity add 61 controls.
- `node scripts/qa/check-retired-signing-graph.mjs`: exit 0, **207** tracked
  manifests, twenty protected families with conformant actual nodes;
  undici/tar remain policy-only. Scanner and installed-compatibility fields
  remain `NOT_RUN` rather than inferred passing.
- `node --test packages/braces-safe/test/*.test.cjs`: exit 0,
  **8/8** complete current package controls. This is bounded functional coverage,
  not an exhaustive advisory or consumer-compatibility certification.
- With existing Git-distributed GNU tar `1.35` prepended to this process's PATH,
  `node --test scripts/qa/prepare-node-forge-pristine.test.mjs`: exit 0,
  **25/25** controls. The earlier default Windows tar run failed 19 of 25 because
  that tar does not support `--quoting-style=escape`; no check was relaxed.
- From the owning `apps/alloy-runtime-api` working directory, direct cached
  Vitest `4.1.11` executed `run --config vitest.config.ts
  src/atelier-continuity-store.test.ts --maxWorkers 1`: exit 0,
  **27 passed, 1 skipped, 28 total**. The initial repository-root invocation
  found no tests and exited 1; it is not counted as passing.
- Direct TypeScript `6.0.3` ran `-p lib/mobile-shared/tsconfig.json --noEmit`:
  exit 1, unresolved installed Expo/mobile module declarations and consequent
  implicit-any diagnostics. A completed native mobile typecheck is **BLOCKED**
  by this incomplete local dependency closure, not silently marked passing.
- `git diff --cached --check 5f9d0959114a269fe86e0cedab8f92ae4591a81e`:
  exit 0. Sparse-index conflict paths were explicitly staged with `--sparse`;
  no sparse expansion, reset, forced push, or history rewrite occurred.

One missing old-HEAD blob for `.circleci/config.yml` was separately retrieved
through the canonical GitHub Git-blob API and inserted with native
`git hash-object -w --stdin`. Its 9,356 bytes reproduced exact Git SHA
`8167c1671b31cf52ffe5b823110085d838d6bf6b` before and after insertion.
This restores identical historical object content, not invented source or CI.
The temporary process alternate still points only to the sibling's canonical
Git object directory; the sibling source/index was not edited.

Frozen-source independent agent review, complete frozen installation, full
workspace typecheck/build/repro, hosted exact-head CI, signed publication,
protected merge, provider publication, deployment, current browser proof, and
external runtime witness remain separate gates. Root owns signing and all
remote writes after immutable handback.
