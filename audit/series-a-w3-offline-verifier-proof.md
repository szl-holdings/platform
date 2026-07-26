# Series A W3 offline verifier proof packet

- **workcell_id:** `series-a-w3-offline-verifier-2026-07-26`
- **agent:** CodexSmith
- **objective:** Make `@szl/verify` fail closed offline while preserving honest
  receipt compatibility and adding ECDSA P-256 verification.
- **plan_summary:** Inspect the existing KHIPU payload and surface-conformance
  contracts; separate verified, invalid, and indeterminate outcomes; require an
  external trust root for success; add Ed25519 and ECDSA P-256 fixtures; record
  schema gaps without inventing receipt semantics.
- **patch_summary:** Added explicit `verified`, `invalid`, and `indeterminate`
  outcomes; required an external public key or fingerprint for `verified`;
  added Ed25519 and ECDSA P-256 verification; fixed the CLI to the exact KHIPU
  payload type; preserved exit codes 0/1/2; and added generated known-good,
  tampered, wrong-key, wrong-type, unpinned, malformed-key, and malformed-JSON
  fixtures without committing private key material.
- **baseline:** The replacement worktree was installed from the frozen lockfile.
  Root `pnpm typecheck` reached the unrelated `@szl-holdings/constellation`
  package, then exited 1 because its referenced `atlas-core/dist/index.d.ts`
  had not been built; no verifier diagnostic was reported.
- **test_results:**
  - `pnpm --filter @szl/verify test` — exit 0; all focused tests passed.
  - `biome check` on the three changed JavaScript modules — exit 0.
  - `oxlint` on the three changed JavaScript modules — exit 0.
  - `node --experimental-vm-modules scripts/docs/check-docs-claims.js` —
    exit 0; all documentation claims verified.
  - `git diff --check` — exit 0.
- **screenshot_refs:** Not applicable; no UI surface changed.
- **public_claim_check:** The verifier reports only envelope, payload-type, JSON,
  signature, and pinned-identity evidence. It does not claim artifact, policy,
  freshness, or chain completeness.
- **security_check:** No key material, credentials, package publication,
  visibility, license, workflow, ruleset, or deployment changes.
- **known_gaps_update:** Portable artifact-digest and policy-digest validation
  remains open because no canonical KHIPU schema in the repository defines
  those semantics.
- **proof_level:** Level 2 — Standard Proof; security-sensitive library and CLI,
  no UI.
