# Cyber local wiring proof — 2026-10-02

| Field | Record |
|---|---|
| `workcell_id` | `CYBER-LOCAL-WIRING-2026-10-02` |
| `agent` | Codex, with scoped implementation and read-only review agents |
| `objective` | Make the local cyber tool boundary and six buyer-lane source checks executable and fail closed, while correcting the repository's stale branch reference. |
| `plan_summary` | Block a vulnerability report whose advertised filters were not enforced; verify the reviewed lane contract against exact Git source bytes; reconcile local branch references with the observed remote default; record tests and remaining gates. |
| `base_revision` | `df984acc8b6fe00dfbc993a81a78d175d2b2b3af` |
| `proof_level` | Level 2, local source and test proof. No UI was changed, so screenshots are not applicable. This is not release proof. |
| `recorded_at` | `2026-10-02T23:39:17Z` |
| `recorded_by` | Codex |

## Patch and source identity

- `packages/tool-mesh/src/tools/security-tools.ts` disables
  `security.vulnerability-report` at the gateway. Direct handler calls validate
  input and then return `SECURITY_OPERATION_UNAVAILABLE` before any database
  import or query. The global advisory table lacked tenant, asset, and CVE
  fields, so a filtered response would have misrepresented its scope.
- `packages/tool-mesh/src/tool-mesh.test.ts` covers direct calls with and without
  requested filters, invalid input, and gateway denial even under a Guardian
  allow rule.
- `scripts/qa/verify-cross-lane-source.mjs` parses the six-lane TypeScript
  contract, compares working bytes with the exact Git HEAD blob, and checks
  SHA-256 `2b832f9b48547752e68f4d1ce74da1fab58f5ecbf4468b77099400e165495011`.
  Its JSON says `VERIFIED_LOCAL_SOURCE` only for that byte-identical contract.
  Every lane stays `DEMO`, `UNAVAILABLE`, and `BLOCKED` as declared in source;
  hosted CI, protected merge, publication, deployment, outside witness, and
  runtime readiness remain `UNKNOWN`. Missing, changed, or unparseable inputs
  fail closed with exit code 2.
- `ops/github/repo-metadata.json` and `ops/github/repo-settings.json` now name
  `main` and the four required checks observed in the active live ruleset.
  These JSON files are local references. Historical settings receipts retain
  their original values.
- `docs/operations/known-gaps.md`, `docs/operations/INDEX.md`, and
  `ops/github/README.md` describe this successor and its limits.

The source and test files copied into this isolated worktree were SHA-256
identical to the focused files tested in the prior shared checkout. The
six-lane source contract is unchanged from the declared base revision.

## Tests and read-backs

| Command or check | Result and limit |
|---|---|
| `corepack pnpm typecheck` from the shared checkout, before and after patch | Exit 1 before code checking: Turbo could not find a package-manager binary. No monorepo typecheck pass is claimed. |
| `corepack pnpm typecheck` from this sparse worktree after patch | Exit 1 before code checking: `turbo` is unavailable because this isolated checkout has no `node_modules`. |
| `node node_modules/vitest/vitest.mjs run src/tool-mesh.test.ts --maxWorkers=1` from `packages/tool-mesh` | Exit 0, 43/43 focused tests after the vulnerability-report change. |
| `node node_modules/vitest/vitest.mjs run --maxWorkers=1` from `packages/tool-mesh` | Exit 0, 115/115 package tests after the change. |
| `node node_modules/@biomejs/biome/bin/biome check packages/tool-mesh/src/tools/security-tools.ts packages/tool-mesh/src/tool-mesh.test.ts` | Exit 0, with five existing non-null assertion warnings. |
| `node node_modules/typescript/bin/tsc -p packages/tool-mesh/tsconfig.json --noEmit` | Exit 1 before and after patch with the same eight existing `TS6305` missing referenced declaration errors. |
| `node --test scripts/qa/verify-cross-lane-source.test.mjs` | Exit 0, 4/4 tests in the isolated worktree using the existing dependency cache through `NODE_PATH`. Includes missing, dirty, changed, dynamic, and invalid source cases. |
| `node scripts/qa/verify-cross-lane-source.mjs` | Exit 0, six declared lanes at exact base HEAD; `runtimeReadiness=UNKNOWN`. |
| `gh api repos/szl-holdings/platform --jq .default_branch` | Exit 0, `main` on 2026-10-02. |
| Active ruleset read-back `gh api repos/szl-holdings/platform/rulesets/22286649` | Exit 0; required contexts were `Runtime Audit (audit:full)`, `Security Gate (blocking)`, `E2E Gate`, and `severity-gate`. The ruleset was active at read-back. |
| `git diff --check` | Exit 0 at final local review. |
| `node --check` on both new verifier files | Exit 0. |
| SHA-256 comparison for the four copied tool and verifier files | Exit 0; all four files match the tested shared-checkout bytes. |

## Claims, security, and remaining gates

No UI surface changed, so `screenshot_refs` is not applicable. No secret,
credential, `.env` value, provider token, or private host identifier was added.
The runner makes no network call or external change. The claims check found no
new statement of production readiness, certification, a live SIEM/EDR feed,
actual containment, or customer operation. The known-gaps register is updated
to rev 32.

The next cyber admission gate needs a permitted tenant- and target-bound
source, a named operator, policy/approval identity, an effect attempt only if
authorized, and exact-target post-effect read-back. An asset inventory,
identity MFA configuration, central log feed, tabletop, and measured backup
restore were not established by this local source work. For the other five
buyer lanes, the script verifies only their source contracts; external
connectors and functional witnesses remain absent. Hosted exact-head CI,
protected merge, provider publication, deployment, and outside witness are
separate gates.
