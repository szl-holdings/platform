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
