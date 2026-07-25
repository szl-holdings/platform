# Frontier F1 — Regulatory Evidence Proof Packet

**Date:** 2026-07-25
**Branch:** `agent/eu-ai-act-evidence`
**Scope:** EU AI Act Articles 9-15 evidence map, additive receipt schema v2,
Article 12 export, and ISO/IEC 42001 gap analysis.

## Context

The Frontier brief requested an 8-day regulatory wedge and asserted that Annex
III high-risk obligations would become enforceable on 2 August 2026. The
European Commission's 24 July 2026 implementation page now gives 2 December
2027 for specified high-risk areas and 2 August 2028 for product-integrated
high-risk systems following the AI Omnibus. Publishing the superseded deadline
would violate the repository's public-claim doctrine.

## Plan

1. Correct the timing before publishing an obligation map.
2. Map Articles 9-15 using only `SATISFIED`, `PARTIAL`, and `NOT ADDRESSED`,
   with repository evidence and explicit gaps.
3. Add a backward-compatible mesh receipt v2 contract with four regulatory
   mapping families.
4. Implement a time-bounded Article 12 export that fails closed when a selected
   receipt lacks a Rekor inclusion proof.
5. Sign the export manifest with Ed25519 and include a dependency-free offline
   verifier.
6. Publish an ISO/IEC 42001 Clause 4-10 gap analysis that does not claim
   certification.

## Patch

- `docs/compliance/EU_AI_ACT_ART_12.md`
- `docs/compliance/ISO_42001_GAP.md`
- `packages/anatomy-contracts/schema/mesh-receipt.v2.json`
- `packages/anatomy-contracts/schema/regulatory-mapping.v1.json`
- `packages/anatomy-contracts/src/schemas.ts`
- `packages/anatomy-contracts/src/index.ts`
- `packages/a11oy-cli/src/article12.ts`
- `packages/a11oy-cli/src/cli.ts`

## Verification

| Check | Result |
|---|---|
| Anatomy contract tests | PASS — 15/15 |
| Article 12 archive tests | PASS — 4/4 |
| v1 receipt accepted by v1 and v2 schemas | PASS |
| Complete four-framework regulatory mapping | PASS |
| Invalid retention/NIST/OWASP values rejected | PASS |
| Article/date filtering | PASS |
| Missing Rekor proof fails closed | PASS |
| Ed25519 manifest signature verification | PASS |
| Evidence-file tamper detection | PASS |
| Bundled `tar -xf` + `node verify.mjs` path | PASS |
| Strict isolated TypeScript checks for changed core modules | PASS |
| Full workspace/package-manager typecheck | BLOCKED locally by the repository's frozen-lock configuration mismatch; CI required |
| UI screenshot | N/A — no UI change |

## Claim boundary

- No SZL system is classified as Annex III high-risk by this patch.
- Article 12 remains **PARTIAL**, not `SATISFIED`.
- Archive signing proves the manifest and evidence-file integrity. It does not
  manufacture or validate a receipt-level DSSE signature.
- ISO/IEC 42001 certification is not claimed.
- No deployment, database, repository visibility, or branch-protection setting
  changes are included.

## Review gate

Keep the stacked PR draft until its base truth-lock PR is merged, required
checks complete, and an independent reviewer accepts the legal/technical claim
boundaries. Do not bypass branch protection or self-approve.
