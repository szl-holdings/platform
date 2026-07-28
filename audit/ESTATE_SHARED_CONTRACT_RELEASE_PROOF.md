# Estate shared-contract release proof

**State:** VERIFIED_LOCAL — protected CI and merge pending
**Date:** 2026-07-28
**Owner:** `szl-holdings/platform`

## Scope

This proof packet covers the deterministic cross-estate release identity in
`packages/estate-contract-release`. The release closes the exact source bytes
for the Platform design system, OpenAPI contract, present generated React/Zod
clients, and shared TypeScript contracts.

It does not claim npm/GitHub Packages publication, adoption by every estate
repository, or production deployment.

## Required checks

- `pnpm --filter @szl-holdings/estate-contract-release build`
- `pnpm --filter @szl-holdings/estate-contract-release typecheck`
- `pnpm --filter @szl-holdings/estate-contract-release test`
- `pnpm --filter @szl-holdings/api-spec test`
- `pnpm --filter @szl-holdings/design-system typecheck`
- `pnpm --filter @szl-holdings/shared-contracts typecheck`
- `git diff --check`

## Observed local evidence

After restoring the checkout from the committed frozen lockfile:

- the release build reproduced
  `sha256:e39ebc9dc25fa88d2bb5ee6c7a368c980b38272ceaca0588d40d42317ba0f4f0`;
- all four release integrity and negative-control tests passed;
- both API-spec code-generation tests passed;
- design-system and shared-contract TypeScript checks passed; and
- Biome and `git diff --check` passed on the added release package.
- the restored repository-wide typecheck passed all 182 tasks in
  23 minutes 56.944 seconds.

The first repository-wide typecheck attempt was made before dependency
restoration and failed because that checkout's `node_modules` was incomplete.
That was a local environment result, not a source-baseline failure. The
repository-wide post-install result above was directly observed; it is not
inferred from the targeted checks.

## Consumer rule

A consumer must pin an immutable protected Platform Git revision, download the
manifest from that revision, recompute all file, component, and release
digests, and record the accepted `release_id` in its own source-bound evidence.
Mutable `main` references fail the contract.
