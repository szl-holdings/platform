# A11oy Atelier Workcell — 2026-08-26

- **Workcell ID:** `A11OY-ATELIER-20260826`
- **Owner:** Stephen P. Lutar (solo builder)
- **Base:** `szl-holdings/platform@7383a30fffeb44c7e8a3fa2c27e176ee450607fd`
- **Branch:** `feat/a11oy-atelier-20260826`
- **Status:** In progress

## Intent

Ship an original A11oy-owned, provider-neutral intelligence workbench. A11oy owns orchestration, deterministic policy admission, tenant-scoped session memory, provider disclosure, immutable evidence receipts, API, CLI, and UI. Third-party inference remains explicitly attributed and interchangeable.

## Planned patch

1. Add `@szl-holdings/a11oy-atelier` with strict contracts, default-deny capabilities, xAI API and local Grok Build adapters, receipt generation, health reporting, and tests.
2. Mount authenticated tenant-scoped routes at `/api/a11oy/v1/atelier` in `alloy-runtime-api`; append Proof Ledger records and working-memory session turns.
3. Add the `a11oy-atelier` CLI with `ask` and `doctor` commands.
4. Add the original `A11oy Atelier — Evidence-Bound Intelligence` page and navigation entry to the A11oy artifact.
5. Document all new environment variables and evidence boundaries.

## Success criteria

- Provider/model/request identifiers are disclosed in every successful response receipt.
- Tools, search, durable storage, and subagents are denied unless a future reviewed policy explicitly enables them.
- Missing provider configuration fails closed; no mock result is presented as live inference.
- Tenant session turns cannot cross tenant boundaries.
- No provider binary, model weight, secret, vendor source, or copied trade dress is committed.
- Core, API, CLI, UI, route, brand, and security tests pass or are truthfully recorded.
- A locally authenticated Grok Build witness is labeled local-only and is not treated as deployed xAI API proof.

## Baseline

- Frozen install: `PASS` with pnpm `10.26.1`; 1,723 packages linked from the existing store, zero downloads.
- Root `pnpm typecheck`: `INCOMPLETE` after a time-bounded uncached run; no errors observed before interruption. Target seams completed successfully before interruption: policy engine, evidence ledger, memory core/fabric, A11oy CLI, alloy-runtime-api, a11oy-runtime, design system, and A11oy artifact.

## Proof disposition

This file is the pre-patch Workcell plan. Final commands, exit codes, screenshots, hashes, runtime witness, claim checks, and known limits will be appended to a separate Proof Packet after verification.
