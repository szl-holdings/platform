# Atelier continuity hard-link read race — local Proof Packet

- `workcell_id`: `P1_ATELIER_CTIME_RACE_20261003`
- `agent`: CodexSmith
- `recorded_at`: 2026-10-03T07:59:53Z
- `objective`: Repair the concurrent initialization failure observed in PR #884's Vitest job without weakening authenticated index reads.
- `source_base`: `main@f2f8df6f89056e9104587674ccec0855dd5b177a`
- `proof_level`: 1, pending executable unit and typecheck results on the repair branch.

## Plan and patch

The plan was to change only the encrypted local store's authenticated-read handling and its tests. A published index is first created as a hard link to a completed temporary file. Removing that temporary link can change the inode's `ctime` while a second store reads it. The patch permits one retry only when the same inode remains, size and modification time are stable, ownership and mode are unchanged, and link count drops from two to one. Both reads must authenticate successfully and have identical byte digests. Missing or replaced files, changed bytes, and repeated metadata changes still raise an integrity error.

The tests force that hard-link timing and cover a successful stable retry, repeated metadata change, inode replacement with identical bytes, and changed authentication bytes on retry. Existing tests also cover index replacement, growth during read, and index authentication failure. These tests are source changes; they have not yet executed successfully in this local checkout.

## Verification record

| Command or action | Local result |
| --- | --- |
| `node --version` | Exit 0; `v24.19.0`. |
| `corepack pnpm typecheck` before editing | Exit 1; `turbo` absent in the fresh worktree. No baseline typecheck result. |
| `corepack pnpm typecheck` after editing | Exit 1 with the same missing `turbo` command. Typecheck result remains **UNAVAILABLE**. |
| `corepack pnpm install --offline --frozen-lockfile --ignore-scripts --filter @workspace/alloy-runtime-api...` | Exit 1; `express@5.2.1` tarball missing from the offline store. |
| `corepack pnpm install --frozen-lockfile --ignore-scripts --filter @workspace/alloy-runtime-api...` | Stopped during dependency linking after 919 of 920 packages because free disk space fell sharply. Installation did not complete. |
| Existing sibling Vitest runner against `src/atelier-continuity-store.test.ts` | Exit 1 before collection: missing `@szl-holdings/a11oy-atelier`; zero tests executed. Behavioral result **UNAVAILABLE**. |
| Existing sibling TypeScript compiler against `apps/alloy-runtime-api/tsconfig.json` | Interrupted after no diagnostic output; typecheck result **UNAVAILABLE**. |
| Existing sibling Biome `check` on the two changed TypeScript files | Exit 0; two files checked, no fixes needed. |
| `git diff --check` | Exit 0. |
| Read-only peer review of the final two-file patch | No actionable P1/P2 found; review is not an executable test. |

The interrupted dependency install left an ignored, incomplete `node_modules` directory in this isolated worktree. An exact-path recursive cleanup was rejected by command policy and was not retried. It is not part of the commit.

## Scope and claims

- `screenshot_refs`: Not applicable; no UI surface or route changed.
- `verification_notes`: Static checks passed. The behavioral repair remains **UNKNOWN** until the new branch's unit and typecheck jobs run.
- `public_claim_check`: No public-facing capability or operational claim changed.
- `security_check`: No credential, environment file, database operation, or trust-gate change is included.
- `known_gaps_update`: No readiness gap is closed. A11oy remains Partial in `docs/APP_STATUS.md`; the single-host encrypted continuity boundary in `docs/operations/known-gaps.md` remains in force.
