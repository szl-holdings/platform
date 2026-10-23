# Pinned pnpm audit finding-count repair

## Scope and evidence boundary

MEASURED local parser regression and pinned package-manager observations on
2026-10-23. This source candidate corrects audit-report interpretation; it does
not remediate the vulnerabilities in its captured fixture or establish a
protected merge, deployment, independent runtime witness, or production state.

The plan was to preserve the existing severity policy, advisory identities,
versions and dependency paths while reconciling each legacy advisory's finding
records with the registry summary. No dependency manifest, lockfile, mitigation
registration, threshold, required workflow, or provider configuration changes
are part of this patch.

## Actual failure and captured input

Platform PR #949's normal branch refresh produced signed head
`76fc50680e2745545405ba6ff4769c8d2b7595d2`, with protected source
`55a404f12c81b79e673a95e074154dfd5e3c1361` as its second parent. Security run
[40036938833](https://github.com/szl-holdings/platform/actions/runs/40036938833)
failed because its report parser counted two High advisory map entries while
the registry summary contained four High findings. The job's 37 security
regression tests passed before the live report generation exited 1.

The CI artifact retained Markdown, not raw JSON. Therefore a separate local
read-only audit was run at `2026-10-23T23:02:20.9989715Z` using the exact-head
lockfile and the existing pinned pnpm executable:

```text
node <existing pnpm 10.26.1>/bin/pnpm.cjs --version
node <existing pnpm 10.26.1>/bin/pnpm.cjs audit --json --audit-level=high
```

The observed version was `10.26.1`; the audit exited 1. Node was `v24.19.0`.
No dependencies were installed. An earlier invocation of the ambient pnpm
11.25.0 was refused by the repository's engine restriction; its output was not
used as audit evidence. Package-manager pinning was retained.

| Item | SHA-256 |
|---|---|
| Exact-head pnpm-lock.yaml | `b6f349dd1f85b4119a6b5efc915276dae04c57ddac605b697cdc14e84622ad7e` |
| Captured raw audit JSON | `3432124557d5e913e772e8ae89f6d791caad6ac306d4ec5d860477ab51b20d9f` |
| Existing pnpm bin/pnpm.cjs entry | `b276da51dc8ca5b0d3ee3371695b50fc8b3244b281b091c63a3f082a88dadeb9` |

The raw response is retained byte-for-byte in
[`scripts/qa/fixtures/pnpm-audit-10.26.1-platform-20261023.json`](../scripts/qa/fixtures/pnpm-audit-10.26.1-platform-20261023.json).
Its specific `.gitattributes` entry prevents newline conversion so the regression
can verify the captured byte hash on both Windows and Linux. The fixture contains
public advisory data and public repository package paths; no credentials.

The pinned package manager's
[upstream audit implementation](https://github.com/pnpm/pnpm/blob/v10.26.1/lockfile/audit/src/index.ts)
posts the lockfile audit tree to the registry's legacy audit endpoint and returns
its JSON. This patch is grounded in that pinned implementation and the captured
response, not pnpm 11's different bulk-audit implementation.

## What the captured response establishes

| Severity | Advisory map entries | Contained finding records | Registry metadata |
|---|---:|---:|---:|
| Critical | 0 | 0 | 0 |
| High | 2 | 4 | 4 |
| Moderate | 5 | 11 | 11 |
| Low | 0 | 0 | 0 |

The High findings are:

- `zod`: versions `3.25.67`, `3.25.76`, and `4.4.3`,
  [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- `body-parser`: version `2.3.0`,
  [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828).

The original parser retained both advisory identities; it did not collapse them
by GHSA. Its error was incrementing the severity total once per advisory rather
than counting the nested finding records. The new parser retains all seven
advisory records and their original version/path detail. Missing High/Critical
detail and inconsistent metadata still fail closed. Repeated version/path
records within an advisory are also rejected rather than inflating coverage.

The captured response remains **BLOCKED** after parsing: four High findings are
unmitigated. Exit 1 with complete findings remains a valid audit execution; exit
0 while High findings are present still fails execution consistency. The patch
also uses detailed finding counts when describing lower-severity missing detail,
so eleven actual findings grouped under five advisories are not misreported as
six absent records.

Independent review identified a second count-unit mismatch in the candidate:
mitigation map size counts advisory records, while the legacy summary counts
findings. The corrected verdict weights only matched parsed blocking records by
their contained findings (npm-v7 records retain weight one). Unmatched mitigation
keys cannot lower the unresolved count. A SIMULATED two-finding test exercises
the real mitigation verifier with an exact patch digest, package/version match,
and registered behavior evidence; missing behavior evidence or an uncovered
version still denies admission. This fixture is a parser-policy regression, not
a claim that any real current dependency has been patched.

## Verification actually run

No full workspace installation or build was performed. The sparse checkout
reuses an already installed `yaml@2.9.0` package through a local junction. Before
cloning, the local resource check measured 9.97 GB free disk and 4.23 GB free RAM.

1. Before the patch:
   `node --test scripts/qa/generate-vuln-report.test.js` — **18 passed, 1 failed**.
   The failure is the existing Windows file-symlink `EPERM` in the symlink
   rejection regression.
2. After adding the three captured-input regressions but before changing parser
   code:
   `node --test --test-name-pattern='captured pnpm legacy audit' scripts/qa/generate-vuln-report.test.js`
   — **0 passed, 3 failed**, including the reproduced High summary mismatch.
3. After the parser patch, the same focused command — **3 passed, 0 failed**.
   These exercise complete-input interpretation with unchanged High denial,
   missing-advisory/finding and understated-summary rejection, and duplicate
   finding rejection even when metadata is increased to match.
4. Before the review fix:
   `node --test --test-name-pattern='an exact verified mitigation covers all' scripts/qa/generate-vuln-report.test.js`
   — **0 passed, 1 failed**, reproducing a false denial of an exact mitigation
   covering both findings under its single advisory record.
5. After the review fix:
   `node --test --test-name-pattern='captured pnpm legacy audit|an exact verified mitigation covers all' scripts/qa/generate-vuln-report.test.js`
   — **4 passed, 0 failed**.
6. Final full parser run:
   `node --test scripts/qa/generate-vuln-report.test.js` — **22 passed, 1 failed**.
   The only failure remains the same Windows symlink `EPERM`; no test was skipped
   or weakened.
7. `git diff --check` — passed.

`pnpm typecheck`, full workspace tests, container build, hosted Linux CI,
protected merge, and runtime deployment: **NOT RUN** for this candidate at this
proof-packet revision. No UI code changed, so no screenshot is applicable.
Hosted Linux CI and independent review remain required before integration.
