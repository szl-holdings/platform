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
    green.
  - `curl.exe -sS https://api.github.com/repos/szl-holdings/evidence-doctrine`:
    exit `0`, HTTP `200`; response reported `private=false`, `visibility=public`,
    `default_branch=main`, and Apache-2.0.
  - `curl.exe -sS https://api.github.com/repos/szl-holdings/evidence-doctrine/commits/main`:
    exit `0`, HTTP `200`; current main was
    `71ab3b8a4538a106fe0a24146785456fcc8bbe1f` with
    `verification.verified=true`.
  - `curl.exe -sS https://raw.githubusercontent.com/szl-holdings/evidence-doctrine/main/README.md`:
    exit `0`, HTTP `200`; the response identified the project as a public reference
    implementation, not a certification, and stated that no D-SLSA DOI is
    authorized.
  - `curl.exe -sS https://zenodo.org/api/records/20490218`: exit `0`, HTTP
    `200`; the
    response identified Ouroboros Thesis v21, DOI
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

## Post-change verification

- `pnpm typecheck`: exit `124` at the bounded 60-second post-change window. The
  dependency verifier again attempted denied npm package and attestation
  metadata requests; Turbo typechecking did not begin. Root typecheck remains
  `UNVERIFIED`, not green.
- `node --experimental-vm-modules scripts/docs/check-docs-claims.js`: exit `0`;
  all `26/26` claim assertions passed after materializing every referenced
  source path.
- `node scripts/qa/scan-secrets.js .`: exit `0`; `CLEAN` for the materialized
  exact-source working tree, including every changed Markdown file.
- Proof-field assertion over this packet: exit `0`; all `14/14` required field
  names are present.
- Correction-link assertion: exit `0`; both the original and append-only
  correction packet paths resolve.
- `git diff --check`: exit `0`.
