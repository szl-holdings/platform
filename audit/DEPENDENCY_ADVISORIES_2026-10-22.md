# Platform 957: Storybook and DOMPurify security repair

Evidence class: MEASURED for the listed local commands and retrieved upstream
bytes. Source/CI, provider publication, runtime readiness and authority remain
separate. This packet is scoped to the dependency delta appended to PR 957.

## Context and plan

Starting candidate: `df84f130e2df6a7c982bc27a106a8824c7f0fd6b`.
Protected base: `b272323687a892513a85696a98ee1bc9b8af7317`.
The canonical owner assigned this repair to the continuation lane. Preserve
the existing replication implementation/history and append a signed commit.
Change only the vulnerable dependency graph, reproducibility-patch binding,
provenance, SBOM and directly related contracts/evidence.

## Upstream security changes

- Storybook and `@storybook/core` 8.6.18 were blocked by
  [GHSA-f2ph-cmg5-wxc8](https://github.com/storybookjs/storybook/security/advisories/GHSA-f2ph-cmg5-wxc8).
  The seven direct Storybook development dependencies now pin 8.6.19; the
  canonical resolver updates their transitive Storybook family accordingly.
- The fresh local audit then identified DOMPurify 3.4.16 findings
  [GHSA-cg2g-xh64-v4q7](https://github.com/cure53/DOMPurify/security/advisories/GHSA-cg2g-xh64-v4q7)
  and [GHSA-mrv2-3pqr-j5jr](https://github.com/cure53/DOMPurify/security/advisories/GHSA-mrv2-3pqr-j5jr).
  The existing override now selects the upstream 3.4.17 fix.
- npm tarball SHA-512 integrity was independently checked for core 8.6.19 and
  DOMPurify 3.4.17. Their immutable upstream commits are
  `117b95a45b27138796c151b7928ba7956ca6da45` and
  `a77a3e78b59f72fa4d1c83f22e121ad9cc7d3575` respectively.
- The retained manager-bundling patch is rebased onto exact core 8.6.19
  bytes. It changes only four existing minification settings, preserving
  syntax/whitespace minification and disabling identifier minification. It
  does not change upstream preview-origin validation. Old patch/license
  provenance remains available; the new patch is the sole active registration.
- No mitigation, threshold, scanner ignore, security workflow or policy was
  relaxed. The resolver also re-resolves two existing transitive edges:
  `@rollup/pluginutils@5.4.0` uses existing `picomatch@4.0.7`, and
  `react-docgen@7.1.1` uses existing `@babel/types@7.29.8`. Other non-Storybook
  snapshot changes are the two DOMPurify consumer references.

## Commands and measured results

1. `npx --yes --package pnpm@10.26.1 -- pnpm typecheck`, before and after:
   BLOCKED, exit 1, `turbo` is unavailable in this isolated checkout. No full
   workspace installation was attempted during the disk-capacity incident.
2. `npx --yes --package pnpm@10.26.1 -- pnpm install --lockfile-only --ignore-scripts`:
   exit 0. 204 workspace projects; no installed workspace dependency tree.
3. `git apply --check` and `git apply` against the integrity-verified core
   8.6.19 manager-builder files: exit 0. `node --check` on both resulting CJS
   and ESM files: exit 0. The original 8.6.18 patch failed context matching;
   that failure was retained before creating the correctly rebased patch.
4. `node scripts/qa/generate-sbom.js`: exit 0, 1807 components, one verified
   local patch, official vendored CycloneDX 1.4 schema validation. Final SBOM
   SHA-256 `d5e9be42387828c2b8aee920df37d06271bd0b9fc092fb4cf538574dd07946f0`.
5. `node --test scripts/qa/generate-sbom.test.mjs scripts/qa/generate-vuln-report.test.js scripts/qa/gate-grype-report.test.mjs scripts/qa/third-party-licenses.test.mjs`:
   54 passed, one failed, one skipped. The failure is Windows `EPERM` while
   creating the symlink in the existing adversarial parser test. The process
   exits 1; this is not represented as a passing complete local suite.
6. `npx --yes --package pnpm@10.26.1 -- pnpm audit --json --audit-level=high`:
   raw process exit 1 because findings remain. Strict normalization by the
   unchanged `generate-vuln-report.js` functions reports Critical 0, High 0,
   Moderate 11, Low 0; `auditExecutionFailure` returns null and the existing
   `auditBlockingVerdict` returns passed. This does not claim zero vulnerabilities.
7. `git diff --check`: exit 0.

Fresh exact-head hosted security, build, typecheck and required checks remain
the merge gates. No UI route or story content is changed, so a new UI screenshot
was NOT RUN. No staging request, runtime credential, fleet key, provider setting,
deployment or publication was changed by these local commands.

## Hosted admission follow-up

Exact-head runs at `e22c01147951460b258d2f01c78e74ba1ce40cc8` exposed three
remaining source bindings: the dependency-free Storybook contract still named
8.6.18; the secure dependency graph still admitted exactly DOMPurify 3.4.16;
and the license inventory had no exact 3.4.17 admission. These gates correctly
failed. The follow-up keeps their exact identity requirements and updates
only those bindings, including a negative regression for the formerly admitted
DOMPurify version across package nodes, snapshots, importer and consumer edges.

The integrity-verified DOMPurify 3.4.17 tarball includes the Apache-2.0 `LICENSE`
with SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`.
The exact engineering license admission selects that option, requires retaining
the bundled notices, and retains the prior policy's 2027-04-07 expiry boundary.
It is not represented as an independent review or legal approval.

MEASURED follow-up commands: the focused Storybook build contract passes 1/1;
`node scripts/qa/check-retired-signing-graph.mjs` passes against 207 source
manifests; its contract suite passes 207 tests and fails one existing Windows
symlink-permission test. License contracts pass 7/7, and direct policy checks
admit exact 3.4.17 while rejecting an unreviewed version and an expired review.
New exact-head hosted checks remain required; failed earlier runs are retained.
