# Cross-repository conformance trust proof packet

- `workcell_id`: `PLATFORM-CONFORMANCE-TRUST-V2-2026-07-30`
- `agent`: `CodexSmith`
- `objective`: make the vertical conformance verifier capable of truthfully
  validating an A11oy-to-vertical boundary across independently deployed
  repositories, commits, and signing identities.
- `plan_summary`:
  1. refresh the live five-frontier preflight;
  2. preserve manifest v1 compatibility;
  3. introduce manifest v2 with separate root and target commit and trust
     inputs;
  4. add adversarial substitution tests;
  5. update operator documentation, the known-gaps register, and the retained
     npm artifact;
  6. publish through the normal protected Platform pull-request flow.
- `patch_summary`:
  - `packages/conformance/src/conformance.mjs` validates the A11oy root against
    its own exact commit and pinned trust root, then validates target receipts
    against the target commit and separately pinned trust root.
  - bundled target manifests move to
    `szl.vertical-conformance.manifest.v2`;
  - legacy v1 shared-commit, shared-signer evidence remains supported;
  - package and operator documentation records all seven v2 deployment inputs;
  - retained npm artifact verification now compares every directly packed
    source and generated-output byte with the repository build, not only
    metadata and inventory;
  - `@szl/verify@0.1.0` is rebuilt reproducibly from the corrected source;
  - the secret scanner now excludes installed dependency directories at every
    workspace depth while continuing to scan adjacent tracked source;
  - the known-gaps register records that the verifier defect is closed while
    live conformance remains `0/3 VERIFIED`.
- `test_results`:
  - pre-change focused Node suite: exit `0`, `24/24` passed;
  - post-change focused Node suite: exit `0`, `28/28` passed;
  - combined conformance, artifact, and frontier suite: exit `0`, `43/43`
    passed;
  - secret scanner regression suite: exit `0`, `15/15` passed; full repository
    scan: `CLEAN`;
  - `@szl/mcp-governor` prepack: exit `0`, `36/36` passed;
  - public npm artifact verifier: exit `0`, `7/7` passed, followed by exact
    retained-archive verification for both public packages;
  - two independent repository-pinned `pnpm@10.26.1` packs of each public
    package produced the retained SHA-256 values:
    `@szl/mcp-governor@0.1.0`
    `e277c70b3d5c61724bba4a00f22242f260f9dc3c715f3abc97d829b56616a9ac`;
    `@szl/verify@0.1.0`
    `ee0a5fac9bf99b42396fc45ca4e4f1d744a4eafd33534ef814f3829b67ad14d1`;
  - repository-pinned `pnpm@10.26.1` root typecheck: exit `0`, `182/182`
    Turbo tasks passed;
  - source-of-truth validation: exit `0`, `66/66` passed;
  - documentation claim validation: exit `0`, `26/26` passed;
  - live read-only frontier preflight at `2026-07-30T20:11:05.982Z`: exit `0`,
    overall `BLOCKED`, npm `404/404`, DOI `MISMATCH`, verticals `0/3`,
    TPM quote result unavailable, and hosted proof unavailable;
  - pre-change root typecheck attempt: exit `1` before useful compilation
    because bundled pnpm `11.9.0` rejected ignored build scripts and attempted
    to add placeholder `allowBuilds` policy to a repository pinned to pnpm
    `10.26.1`; the generated drift was removed and that attempt is not counted
    as a pass.
- `screenshot_refs`: `N/A`; no UI surface or route changed.
- `verification_notes`: manifest v2 rejects root-commit substitution and
  target-signer substitution. Receipt freshness, uniqueness, parent hashes,
  exact DSSE type, exact target commit, independent key fingerprints, DENY
  evidence, OTel structure, README labels, and product registration remain
  fail-closed gates.
- `public_claim_check`: live surfaces remain `0/3 VERIFIED`; this change is not
  represented as deployment evidence, npm publication, a DOI, hosted vendor
  proof, or hardware attestation.
- `security_check`: no token, credential, private key, `.env` value, account
  login, or trust root is committed. Trust inputs remain externally supplied
  public keys and independent SHA-256 fingerprints.
- `known_gaps_update`: revision 21 records the corrected verifier model and
  preserves the live A11oy root-evidence blocker.
- `proof_level`: `4` (`Full Proof`), with screenshot evidence explicitly not
  applicable.
- `recorded_at`: `2026-07-30T16:15:19-04:00`
- `recorded_by`: `CodexSmith`

## Baseline and live evidence

The live refresh observed that Killinchu and David Leads now report
`receipt_minted=true`, but neither deployment exposes the required top-level
JSON `/version` and `/evidence` contract. The A11oy deployment reports an exact
source revision but `receipt_minted=false` and returns JSON `404` for those two
paths. No A11oy root receipt was inferred or manufactured.

The previous verifier also required every receipt in a cross-surface chain to
claim the target Git SHA and verify under the target public key. That model
could pass a local fixture but could not distinguish an independently deployed
A11oy root from a target-generated substitute.

The previous npm artifact verifier could also accept a stale executable archive
when the metadata and inventory still matched. The corrected release command
first rebuilds the governor, then compares every packed package byte with the
current source or generated output.

## Verification boundary

This packet proves the source-level evaluator behavior covered by the recorded
tests. It does not prove that a live A11oy root exists, that a target has
deployed the producer contract, or that any of the five external frontiers is
operational. Live status changes only after exact endpoint, signer, commit,
and external-service evidence is retrieved and verified.
