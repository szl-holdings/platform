# D-SLSA Standalone Publication Proof Correction

This is an append-only correction to
[`DSLSA_STANDALONE_PUBLICATION_PROOF_2026-07-28.md`](./DSLSA_STANDALONE_PUBLICATION_PROOF_2026-07-28.md).
The original record is preserved because the Proof Ledger is immutable. This
packet supplies the fields omitted by Platform PR
[#538](https://github.com/szl-holdings/platform/pull/538) and binds the
correction to the exact current Platform source inspected below.

- `workcell_id`: `PLATFORM-DSLSA-PROOF-CORRECTION-2026-07-29`
- `agent`: `CodexSmith`
- `objective`: complete the audit record for the public D-SLSA standalone-source
  publication without changing the evaluator, public repository, DOI state,
  governance controls, or D1-D4 evidence boundaries.
- `plan_summary`:
  1. preserve the original proof packet;
  2. refresh the Platform and standalone-repository source identities;
  3. record the original publication patch and this corrective patch;
  4. execute the available package, public-claim, security, and documentation
     checks with numeric exit codes;
  5. record unavailable checks and residual evidence boundaries rather than
     inferring success.
- `patch_summary`:
  - Original publication patch: protected Platform merge
    `4fd8824f32d7eedc0cd341fd4f4d57722b9d45e9` added or updated 10 files
    (`181` insertions, `14` deletions). It added the standalone publication
    proof and portable package/workspace metadata, corrected the package
    README, self-assessment, D-SLSA v1.4 draft, and Zenodo metadata, indexed the
    public source, and updated the known-gaps register.
  - Corrective patch: add this append-only packet, index it from
    `docs/INDEX.md` and `audit/README.md`, and record the closed proof-process
    gap as `DSLSA-005` in `docs/operations/known-gaps.md`.
  - Runtime code, evaluator semantics, workflows, dependency versions,
    deployment state, repository visibility, protection rules, and public
    package publication are unchanged.
- `test_results`:
  - `git rev-parse HEAD`: exit `0`;
    `a85afe8f924969fbd2e9fdff316b691dc494b61b`, the Platform main head inspected
    before this corrective patch.
  - `pnpm install --frozen-lockfile --offline`: exit `124` after the bounded
    300-second setup window. The repository dependency verifier attempted npm
    package and attestation metadata requests that the offline environment
    denied. No install success is claimed.
  - `pnpm typecheck`: exit `1` before Turbo typechecking. The dependency
    verifier attempted installation and stopped at the non-interactive modules
    replacement boundary. This is a recorded setup failure, not a typecheck
    pass or a source failure.
  - `node --test packages/evidence-doctrine/src/index.test.ts`: exit `0`;
    `13/13` TypeScript evaluator tests passed.
  - `python packages/evidence-doctrine/python/test_evidence_doctrine.py`: exit
    `0`; `13/13` Python evaluator tests passed.
  - `tsc --noEmit -p packages/evidence-doctrine/tsconfig.json` through the
    checkout's root `.bin`: exit `2`; dependency setup had removed the
    `@types/node` link.
  - Direct TypeScript 6.0.3 compiler invocation with the already-installed
    exact `@types/node` store path and the same package `tsconfig.json`: exit
    `0`. This establishes the package typecheck independently of the broken
    workspace link; it does not turn the failed root setup or root typecheck
    green. The exact working directory, executable paths, type-root path, and
    arguments are recorded in
    [Exact TypeScript invocation](#exact-typescript-invocation).
  - The exact status-producing repository API command and parser in
    [Exact public-endpoint commands](#exact-public-endpoint-commands): exit
    `0`, HTTP `200`; response reported `private=false`, `visibility=public`,
    `default_branch=main`, and Apache-2.0.
  - The exact status-producing commit API command and parser in
    [Exact public-endpoint commands](#exact-public-endpoint-commands): exit
    `0`, HTTP `200`; current main was
    `71ab3b8a4538a106fe0a24146785456fcc8bbe1f` with
    `verification.verified=true`.
  - The exact status-producing raw README command and two-assertion parser in
    [Exact public-endpoint commands](#exact-public-endpoint-commands): exit
    `0`, HTTP `200`; the response identified the project as a public reference
    implementation, not a certification, and stated that no D-SLSA DOI is
    authorized.
  - The exact status-producing Zenodo command and parser in
    [Exact public-endpoint commands](#exact-public-endpoint-commands): exit
    `0`, HTTP `200`; the response identified Ouroboros Thesis v21, DOI
    `10.5281/zenodo.20490218`, and concept DOI
    `10.5281/zenodo.19944926`.
  - Post-change documentation, field-presence, secret-scan, and diff checks are
    recorded in [Post-change verification](#post-change-verification).
- `screenshot_refs`: `N/A`; this correction and the original publication patch
  do not modify a UI surface or route. A fabricated screenshot would not
  strengthen source-publication evidence.
- `verification_notes`:
  - The live unauthenticated repository response, exact current main commit,
    raw README, and Zenodo metadata were re-read on 2026-07-29.
  - The standalone main SHA remains
    `71ab3b8a4538a106fe0a24146785456fcc8bbe1f`; the DOI collision and D3/D4
    boundaries in the original packet remain accurate.
  - The evaluator's TypeScript and Python suites passed independently. The
    workspace installation and root typecheck did not pass and remain explicitly
    separate from the focused package evidence.
  - No check in this packet proves adoption, independent validation,
    certification, a D-SLSA DOI, a verified D3 decision bundle, or D4 hardware
    attestation.
- `public_claim_check`: `PASS` for the corrective diff. The packet preserves
  `PUBLIC REFERENCE IMPLEMENTATION / NOT A CERTIFICATION`, keeps the DOI
  unavailable, and does not promote D3 or D4.
- `security_check`: `PASS` for the corrective diff after the checks recorded
  below. No token, credential, private key, `.env` value, or authenticated
  publication action is included.
- `known_gaps_update`: `docs/operations/known-gaps.md` adds `DSLSA-005` as a
  resolved proof-process gap. `DSLSA-002`, `DSLSA-003`, and `DSLSA-004` remain
  open or partial without status inflation.
- `proof_level`: `4` (`Full Proof`). No UI changed, so the Level 3 screenshot
  prerequisite is explicitly `N/A`; public-claim, security, and known-gap
  checks are recorded.
- `recorded_at`: `2026-07-29T11:13:20-04:00`
- `recorded_by`: `CodexSmith`

## Exact public-endpoint commands

These commands were executed from Windows PowerShell without an authenticated
GitHub or Zenodo session. Each `curl.exe` invocation writes the response body
separately, fails on HTTP errors, and emits the observed HTTP status.

```powershell
$proofTmp = Join-Path $env:TEMP 'platform544-live'
New-Item -ItemType Directory -Force -Path $proofTmp | Out-Null

curl.exe -sS --fail-with-body `
  -o (Join-Path $proofTmp 'evidence-doctrine-repo.json') `
  -w 'HTTP_STATUS=%{http_code}\n' `
  https://api.github.com/repos/szl-holdings/evidence-doctrine
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$repo = Get-Content -LiteralPath (Join-Path $proofTmp 'evidence-doctrine-repo.json') -Raw |
  ConvertFrom-Json -ErrorAction Stop
[pscustomobject]@{
  private = $repo.private
  visibility = $repo.visibility
  default_branch = $repo.default_branch
  license = $repo.license.spdx_id
} | ConvertTo-Json -Compress

curl.exe -sS --fail-with-body `
  -o (Join-Path $proofTmp 'evidence-doctrine-main.json') `
  -w 'HTTP_STATUS=%{http_code}\n' `
  https://api.github.com/repos/szl-holdings/evidence-doctrine/commits/main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$commit = Get-Content -LiteralPath (Join-Path $proofTmp 'evidence-doctrine-main.json') -Raw |
  ConvertFrom-Json -ErrorAction Stop
[pscustomobject]@{
  sha = $commit.sha
  verified = $commit.commit.verification.verified
  reason = $commit.commit.verification.reason
} | ConvertTo-Json -Compress

curl.exe -sS --fail-with-body `
  -o (Join-Path $proofTmp 'evidence-doctrine-readme.md') `
  -w 'HTTP_STATUS=%{http_code}\n' `
  https://raw.githubusercontent.com/szl-holdings/evidence-doctrine/main/README.md
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$statusLine = @(Select-String -LiteralPath (Join-Path $proofTmp 'evidence-doctrine-readme.md') `
  -SimpleMatch 'PUBLIC REFERENCE IMPLEMENTATION / NOT A CERTIFICATION')
$doiLine = @(Select-String -LiteralPath (Join-Path $proofTmp 'evidence-doctrine-readme.md') `
  -SimpleMatch 'No D-SLSA DOI is currently authorized.')
$statusLine, $doiLine | ForEach-Object { $_.Line.Trim() }
if (($statusLine.Count -ne 1) -or ($doiLine.Count -ne 1)) { exit 1 }
'README_ASSERTIONS=2/2'

curl.exe -sS --fail-with-body `
  -o (Join-Path $proofTmp 'zenodo-20490218.json') `
  -w 'HTTP_STATUS=%{http_code}\n' `
  https://zenodo.org/api/records/20490218
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$zenodo = Get-Content -LiteralPath (Join-Path $proofTmp 'zenodo-20490218.json') -Raw |
  ConvertFrom-Json -ErrorAction Stop
[pscustomobject]@{
  id = $zenodo.id
  title = $zenodo.metadata.title
  version = $zenodo.metadata.version
  doi = $zenodo.doi
  conceptdoi = $zenodo.conceptdoi
} | ConvertTo-Json -Compress
```

All four `curl.exe` commands exited `0` and emitted `HTTP_STATUS=200`. The
parsers exited `0` with these relevant outputs:

```text
{"private":false,"visibility":"public","default_branch":"main","license":"Apache-2.0"}
{"sha":"71ab3b8a4538a106fe0a24146785456fcc8bbe1f","verified":true,"reason":"valid"}
README_ASSERTIONS=2/2
{"id":20490218,"title":"SZL Holdings Ouroboros Thesis v21 — The PURIQ-OS Substrate: an Honest, Audit-Ready Cybernetic Runtime for Verifiable Agentic AI","version":"21.0.0","doi":"10.5281/zenodo.20490218","conceptdoi":"10.5281/zenodo.19944926"}
```

## Exact TypeScript invocation

Working directory:
`C:\Users\steph\Documents\Codex\2026-07-28\cod\work\platform544-audit`.

```powershell
$node = 'C:\Users\steph\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$tsc = 'C:\Users\steph\Documents\Codex\2026-07-28\cod\work\platform_pr541_fix\node_modules\.pnpm\typescript@6.0.3\node_modules\typescript\bin\tsc'
$typeRoots = 'C:\Users\steph\Documents\Codex\2026-07-28\cod\work\platform_pr541_fix\node_modules\.pnpm\@types+node@25.3.5\node_modules\@types'
& $node $tsc --version
& $node $tsc --noEmit --typeRoots $typeRoots `
  -p packages/evidence-doctrine/tsconfig.json
```

Both commands exited `0`; the version command emitted `Version 6.0.3`.

## Post-change verification

- `pnpm typecheck`: exit `124` at the bounded 60-second post-change window. The
  dependency verifier again attempted denied npm package and attestation
  metadata requests; Turbo typechecking did not begin. Root typecheck remains
  `UNVERIFIED`, not green.
- Hosted Typecheck for initial exact corrective head
  `273ccbccc327398b7f20e74850fd7999a264e1ed`: GitHub Actions job
  [`90631398161`](https://github.com/szl-holdings/platform/actions/runs/30468165674/job/90631398161)
  exited successfully. This hosted result is recorded separately and does not
  relabel the unavailable local root typecheck as green.
- `node --experimental-vm-modules scripts/docs/check-docs-claims.js`: exit `0`;
  all `26/26` claim assertions passed after materializing every referenced
  source path.
- `node scripts/qa/scan-secrets.js .`: exit `0`; `CLEAN` for the materialized
  exact-source working tree, including every changed Markdown file.
- The exact proof-field and correction-link commands below exited `0` with
  `PROOF_FIELDS=14/14` and `CORRECTION_LINKS=2/2`.
- `git diff --check`: exit `0`.

```powershell
$packet = 'audit/frontier/DSLSA_STANDALONE_PUBLICATION_PROOF_CORRECTION_2026-07-29.md'
$required = @(
  'workcell_id', 'agent', 'objective', 'plan_summary', 'patch_summary',
  'test_results', 'screenshot_refs', 'verification_notes',
  'public_claim_check', 'security_check', 'known_gaps_update', 'proof_level',
  'recorded_at', 'recorded_by'
)
$packetText = Get-Content -LiteralPath $packet -Raw
$missing = @($required | Where-Object {
  $packetText -notmatch ('`' + [regex]::Escape($_) + '`')
})
if ($missing.Count -ne 0) { $missing; exit 1 }
"PROOF_FIELDS=$($required.Count)/$($required.Count)"

$links = @(
  'audit/frontier/DSLSA_STANDALONE_PUBLICATION_PROOF_2026-07-28.md',
  'audit/frontier/DSLSA_STANDALONE_PUBLICATION_PROOF_CORRECTION_2026-07-29.md'
)
$missingLinks = @($links | Where-Object {
  -not (Test-Path -LiteralPath $_ -PathType Leaf)
})
if ($missingLinks.Count -ne 0) { $missingLinks; exit 1 }
"CORRECTION_LINKS=$($links.Count)/$($links.Count)"
```

The correction's initial post-change commit is bound by the exact command:

```powershell
git rev-parse HEAD
```

It exited `0` and emitted
`273ccbccc327398b7f20e74850fd7999a264e1ed`. That signed+DCO commit is the
initial corrective packet inspected before this append-only reproducibility
repair; the repair commit is separately bound by Git and the pull request.
