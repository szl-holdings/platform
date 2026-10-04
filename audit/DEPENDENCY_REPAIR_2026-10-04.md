# Dependency repair — 2026-10-04

## Scope and acceptance

Owner-directed build repair at protected base
`f2f8df6f89056e9104587674ccec0855dd5b177a`.

Update the DOMPurify security floor and the corresponding lockfile resolution
to the published 3.4.16 patch. Keep the High/Critical policy and the empty
Grype exception list unchanged. Validate the lockfile, affected sanitizer
consumers, and vulnerability-report controls. No interface or runtime
qualification changes are intended by this dependency patch.

Files planned: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and this proof record.

## Baseline evidence

The native Grype job from run
<https://github.com/szl-holdings/platform/actions/runs/37124879441>
reported DOMPurify 3.4.13 / GHSA-p98j-92pf-mc4p (Low, fixed in 3.4.16),
braces 3.0.3 / GHSA-vfj7-8cjw-p6xm (High), and node-forge 1.4.0 /
GHSA-86w9-cpqp-85rv (High).

Official GitHub advisories and npm registry metadata were reread on
2026-10-04. The registry's current latest versions remain braces 3.0.3 and
node-forge 1.4.0; both reviewed advisories list no published patched version.
This patch does not claim to resolve those two High findings or clear the
release gate. The existing scanner threshold and no-exception policy remain
in force.

- <https://github.com/advisories/GHSA-vfj7-8cjw-p6xm>
- <https://github.com/advisories/GHSA-86w9-cpqp-85rv>
- <https://github.com/advisories/GHSA-p98j-92pf-mc4p>

Baseline `pnpm typecheck` with the repository's pinned pnpm 10.26.1 executed
134 tasks, with 103 successful before the database typecheck was terminated
with exit 137. This is a failed local baseline, not a passing typecheck or
a diagnosed source regression. The initial environment pnpm 11 wrapper
attempted an install and failed on unapproved dependency build scripts;
its unrequested workspace configuration changes were restored before edits.

## Verification

The patch changes the DOMPurify override floor from `>=3.4.13` to
`>=3.4.16`. Pinned pnpm 10.26.1 regenerated only the corresponding
12 lockfile lines: resolution, integrity, and the jspdf/posthog-js links.

| Check | Result |
| --- | --- |
| Pinned pnpm 10.26.1 lockfile-only resolution | Passed. No unrelated lockfile churn. |
| `CI=true npm exec --yes --package=pnpm@10.26.1 -- pnpm install --frozen-lockfile --ignore-scripts` | Passed; 1,722 packages installed. Dependency build scripts were not executed. |
| Pinned `pnpm audit --json` after the update | Completed; 2,005 dependencies, two High findings, zero Critical/Moderate/Low. The two remaining High findings are the pre-existing braces/node-forge advisories above. |
| `node node_modules/typescript/bin/tsc -b lib/observability/tsconfig.json` | Passed, exit 0, for the affected posthog-js consumer. |
| `node --test scripts/qa/generate-vuln-report.test.js` | Passed, 6/6 report-control tests. |
| `git diff --check` | Passed. |

The bounded full-workspace attempt,
`CI=true npm exec --yes --package=pnpm@10.26.1 -- pnpm exec turbo run typecheck --concurrency=2`,
stopped after 65 successful tasks when the evidence-doctrine task's nested
pnpm lookup received `ERR_PNPM_META_FETCH_FAIL` / `EAI_AGAIN` from
`registry.npmjs.org`. No TypeScript diagnostic appeared before that failure.
This is an incomplete full-workspace verification, not a passing typecheck
or proof that the complete workspace is no worse than baseline. The normal
hosted gates still need to run against this candidate.

The patch removes the DOMPurify finding from the observed npm audit. It does
not remove either remaining High finding, alter `.grype.yaml`, change
exception policy, or establish release readiness. Publication remains gated
by the repository's existing checks.

Screenshot: not applicable; no rendered interface is changed.
