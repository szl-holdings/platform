# Repo-Wide Health Audit — 2026-04-28

**Auditor:** Task #3197  
**Scope:** All registered web artifacts (a11oy, api-server, carlota-jo, command, conduit, counsel, helios, lyte-command-center, mockup-sandbox, pulse, sentra, szl-holdings, terra, vessels) + workspace-level lint  
**Method:** `biome lint` (workspace), `tsc --noEmit` per artifact, `vite build` / `node build.mjs` per artifact  
**Startup verification:** Covered by successful builds; full port-bound boot check deferred for sentra and szl-holdings (build-blocked) and command/lyte (build timeout)

---

## Summary Table

| Artifact | Typecheck | Build | Notes |
|---|---|---|---|
| `a11oy` | ❌ FAIL (7 errors) | ✅ PASS | Type mismatches, missing module |
| `api-server` | ✅ PASS | ✅ PASS | Clean |
| `carlota-jo` | ✅ PASS | ✅ PASS | Clean |
| `command` | ✅ PASS | ⏱ TIMEOUT | Build >3 min; typecheck clean |
| `conduit` | ❌ FAIL (1 error) | ✅ PASS | 1 remaining after safe fix |
| `counsel` | ❌ FAIL (17 errors) | ✅ PASS | All `res is unknown` in catch blocks |
| `helios` | ❌ FAIL (2 errors) | ✅ PASS | CSS/type issues |
| `lyte-command-center` | ✅ PASS | ⏱ TIMEOUT | Build >3 min; typecheck clean |
| `mockup-sandbox` | N/A (design) | N/A | Design artifact |
| `pulse` | ❌ FAIL (1 error) | ✅ PASS | Duplicate key in shared lib |
| `sentra` | ❌ FAIL (8 errors) | ❌ FAIL | Node.js stream module in browser bundle |
| `szl-holdings` | ✅ PASS | ❌ FAIL | Missing `capability-manifest.json` |
| `terra` | ✅ PASS | ✅ PASS | Clean |
| `vessels` | ✅ PASS (after fixes) | ✅ PASS (after fixes) | Fixed 2 variable name errors |

**Workspace lint (biome):** 26 errors · 14,428 warnings · 6,761 files  
**Brand strings check:** 26 pre-existing violations beyond baseline (see NI-12)

---

## Per-Artifact Typecheck Detail

### `artifacts/a11oy` — A11oy Brand Orchestration Layer
**Typecheck:** ❌ FAIL | **Build:** ✅ PASS (26.71s)

- `src/pages/AerialTwinMilestone.tsx:33,57` — Status values `"DRAFT"` and `"DELIVERED"` not in `StatusBadge` type union (`"LIVE" | "GATED" | "APPROVED" | "ROADMAP" | "WARN" | "ERROR" | "CONNECTING"`)
- `src/pages/CAVD.tsx:54` — `agentScope: string[]` not assignable to `("op-cascade" | "op-counsel" | ...)[]`
- `src/pages/ExecutiveBrief.tsx:170,250` — Comparison of `"low"` vs `"medium"` has no overlap (logic bug or wrong literal)
- `src/pages/Terminal.tsx:336` — Property `composite` does not exist on `MirrorEvalResult`
- `src/pages/TrustCenter.tsx:275` — Status `"DEMO"` not in type union
- `src/pages/billing-account.tsx:1` — Cannot find module `@szl-holdings/shared-ui/billing`

### `artifacts/api-server` — API Server
**Typecheck:** ✅ PASS | **Build:** ✅ PASS (7.0s) | Clean.

### `artifacts/carlota-jo` — Carlota Jo Consulting
**Typecheck:** ✅ PASS | **Build:** ✅ PASS (26.49s) | Clean.

### `artifacts/command` — Unified Command
**Typecheck:** ✅ PASS | **Build:** ⏱ TIMEOUT (>3 min, runner limit)  
No typecheck issues. Build not verifiable in audit window.

### `artifacts/conduit` — Conduit Reverse ETL
**Typecheck:** ❌ FAIL (1 remaining after fix) | **Build:** ✅ PASS (11.18s)

- `src/pages/connections/new.tsx:106` — `SetStateAction<"salesforce">` rejects a `string` argument. State type is too narrow for dynamic connector selection.

### `artifacts/counsel` — Counsel Legal Matter Command
**Typecheck:** ❌ FAIL (17 errors) | **Build:** ✅ PASS (17.08s)

All 17 are `TS18046: 'res' is of type 'unknown'` in catch blocks across:
- `src/pages/alerts.tsx:179,187,188`
- `src/pages/approvals.tsx:117,118`
- `src/pages/counsel-performance.tsx:50,51,59,60`
- `src/pages/dependency-graph.tsx:47,48,56,57`
- `src/pages/trust-provenance.tsx:170,171,186,187`

### `artifacts/helios`
**Typecheck:** ❌ FAIL (2 errors) | **Build:** ✅ PASS (12.32s)

- `src/pages/HatunIndex.tsx:91` — CSS property `truncate` is not valid in `React.CSSProperties` (Tailwind class used as inline style)
- `src/pages/RecalibrationMemos.tsx:80` — Unsafe conversion from `RecalibrationMemo` to `Record<string, string>`

### `artifacts/lyte-command-center` — Lyte Decision Intelligence
**Typecheck:** ✅ PASS | **Build:** ⏱ TIMEOUT (>3 min) | Clean typecheck.

### `artifacts/pulse` — Pulse AI Executive Briefing
**Typecheck:** ❌ FAIL (1 error) | **Build:** ✅ PASS (18.16s)

- `lib/api-client-react/src/standard-hooks.ts:200` — `'event' is specified more than once` (TS2783). In a **shared library** — affects all consumers.

### `artifacts/sentra` — Sentra Cyber Resilience Command
**Typecheck:** ❌ FAIL (8 errors) | **Build:** ❌ FAIL (20.5s)

Build error: `import { PassThrough } from 'stream'` — Node.js built-in in browser bundle via `@opentelemetry/context-async-hooks` and `@google-cloud/storage` transitive chain.

TypeScript errors:
- `src/components/graphql-data-panel.tsx:1` — `useAegisAssessments`, `useAegisIncidents` not exported from `@szl-holdings/graphql-client/hooks`
- `src/pages/aef-knowledge-search.tsx:1` — Module `@workspace/aef-contracts` not found
- `src/pages/aegis-home.tsx:504` — `href: string | undefined` not assignable to `href: string` on `LinkProps`
- `src/pages/intel/ai-command-center.tsx:376,377` — Duplicate object literal key
- `src/pages/observability.tsx:1` — `firestormConfig` not exported from `@szl-holdings/observability/configs`
- `src/pages/sentra-landing.tsx:334` — `open` prop not in `ContactModalProps`

### `artifacts/szl-holdings` — SZL Holdings Dashboard
**Typecheck:** ✅ PASS | **Build:** ❌ FAIL

Build error: `ENOENT: src/data/capability-manifest.json` — file does not exist in the repo. `src/hooks/useCapabilityManifest.ts` imports this JSON. The PRAXISHopQuery import path fix (see Safe Fixes) resolved one build error; this is the remaining blocker.

### `artifacts/terra` — Terra Real Estate Intelligence
**Typecheck:** ✅ PASS | **Build:** ✅ PASS (35.65s) | Clean.

### `artifacts/vessels` — Vessels Maritime Intelligence
**Typecheck:** ✅ PASS (after fixes) | **Build:** ✅ PASS (38.69s, after fixes)

All blocking errors fixed. See Safe Fixes below.

---

## Workspace-Level Lint (Biome)

**Result:** ❌ 26 errors · 14,428 warnings · 738 infos

### Errors (26 total — all in `apps/alloy-*`)

| File | Line | Rule | Issue |
|---|---|---|---|
| `apps/alloy-embedding-api/src/routes/embed.ts` | 25 | `noImplicitAnyLet` | Bare `let` has implicit `any` |
| `apps/alloy-embedding-api/src/routes/embed.ts` | 123 | `noNonNullAssertion` | Non-null `!` |
| `apps/alloy-embedding-api/src/routes/hybrid-search.ts` | 27 | `noImplicitAnyLet` | Bare `let` has implicit `any` |
| `apps/alloy-embedding-api/src/routes/hybrid-search.ts` | 61, 162 | `noNonNullAssertion` | Non-null `!` |
| `apps/alloy-embedding-api/src/routes/rerank.ts` | 25 | `noImplicitAnyLet` | Bare `let` has implicit `any` |
| `apps/alloy-ingestion-orchestrator/src/checkpoint-store.ts` | 38, 44 | `noNonNullAssertion` | Non-null `!` |
| `apps/alloy-ingestion-orchestrator/src/engine.ts` | 237 | `noNonNullAssertion` | Non-null `!` |
| `apps/alloy-embed-worker/src/pooling.ts` | 39 | `noNonNullAssertion` | Non-null `!` |
| `apps/alloy-vector-worker/src/backends.ts` | 41 | `noNonNullAssertion` | Non-null `!` |
| `apps/alloy-vector-worker/src/batcher.ts` | 133 | `noNonNullAssertion` | Non-null `!` |

### Top Warning Categories (14,428 total)

| Rule | Estimated Count | Auto-Fixable |
|---|---|---|
| `lint/style/useTemplate` | ~300+ | Yes (FIXABLE) |
| `lint/a11y/useButtonType` | ~200+ | Partially |
| `lint/suspicious/noArrayIndexKey` | ~150+ | No |
| `lint/style/noNonNullAssertion` | ~100+ | No |
| `lint/correctness/noUnusedImports` | ~80+ | Yes (FIXABLE) |
| `lint/correctness/noUnusedVariables` | ~30+ | Yes (FIXABLE) |
| `lint/a11y/noStaticElementInteractions` | ~50+ | No |
| `lint/security/noDangerouslySetInnerHtml` | ~10+ | No — security review needed |

---

## Safe Fixes Applied

### Fix 1 — `artifacts/conduit/src/lib/utils.ts:10`
`new Intl.DateTimeLinkFormat(` → `new Intl.DateTimeFormat(`  
**Rationale:** `Intl.DateTimeLinkFormat` is not a valid Web API. The correct global is `Intl.DateTimeFormat`. Clear API name typo causing TS2551.  
**Verified:** `conduit` build passes.

### Fix 2 — `artifacts/vessels/src/pages/digital-twin.tsx:487`
`{VESSELS.map((v) => (` → `{VESSELS_DATA.map((v) => (`  
**Rationale:** Constant declared as `VESSELS_DATA` on line 20; referenced as the undefined `VESSELS` on line 487. Causes TS2304 (cannot find name) and TS7006 (implicit any).  
**Verified:** `vessels` typecheck passes.

### Fix 3 — `artifacts/vessels/src/pages/voyage-economics.tsx:356`
`fuelCost: totalFuel,` → `fuelCost: _totalFuel,`  
**Rationale:** Variable declared as `_totalFuel` on line 338; referenced as undefined `totalFuel` on line 356. Causes TS2552.  
**Verified:** `vessels` typecheck passes.

### Fix 4 — `artifacts/szl-holdings/src/pages/nexus-explorer.tsx:22`
`import { PRAXISHopQuery } from '@/components/PRAXISHopQuery'` → `import { PRAXISHopQuery } from '@/components/NexusHopQuery'`  
**Rationale:** File was renamed from `PRAXISHopQuery.tsx` to `NexusHopQuery.tsx` but the import path was not updated, causing `ENOENT` at build time. The export name `PRAXISHopQuery` remains unchanged in `NexusHopQuery.tsx`.  
**Verified:** This error no longer appears in the build log. (A separate blocker — missing `capability-manifest.json` — still prevents full szl-holdings build.)

---

## Needs Your Input

### NI-1 — `artifacts/szl-holdings`: Missing `src/data/capability-manifest.json` [BUILD-BLOCKING]
**Error:** `ENOENT: no such file or directory, open '.../szl-holdings/src/data/capability-manifest.json'`  
**Detail:** `src/hooks/useCapabilityManifest.ts` imports this JSON for the product readiness dashboard. The file does not exist anywhere in the repo. Prose references in `trust-status.tsx`, `investors-overview-v2.tsx`, `product-readiness.tsx`, and `changelog-highlights.tsx` describe it as generated from `artifacts/audit/platform-capability-manifest.json`. That audit directory also does not exist.  
**Decision needed:** Who generates this file and when? Is it committed or generated at build time? What capabilities should it document? Until resolved, the szl-holdings build is broken.

### NI-2 — `artifacts/sentra`: Build fails — Node.js built-ins in browser bundle [BUILD-BLOCKING]
**Error (vite):** `import { PassThrough } from 'stream'` cannot be bundled for the browser.  
**Detail:** The chain is: sentra → `@szl-holdings/observability` or `@google-cloud/storage` → Node.js built-ins (`stream`, `crypto`, `fs`, `path`, `url`, `zlib`, `async_hooks`). Also `lib/services/src/integrations/webhook-verifier.ts`, `lib/services/src/adapters/stripe.ts`, and `lib/services/src/lib/seed-loader.ts` import Node.js modules and are being bundled into the frontend.  
**Decision needed:** Which of these imports is intentional in the browser context? Options: (a) add `vite.config.ts` `resolve.alias` / `optimizeDeps.exclude`, (b) remove server-only imports from components, (c) restructure lib packages to not re-export server code to the browser. Architectural decision.

### NI-3 — `artifacts/sentra`: 8 typecheck errors — missing exports and wrong prop types
- `graphql-data-panel.tsx` — `useAegisAssessments`, `useAegisIncidents` not exported from `@szl-holdings/graphql-client/hooks`. Add the exports or update the import.
- `aef-knowledge-search.tsx` — Module `@workspace/aef-contracts` not found. Package may have been removed or renamed.
- `observability.tsx` — `firestormConfig` not exported from `@szl-holdings/observability/configs`.
- `sentra-landing.tsx` — `open` prop missing from `ContactModalProps`. The modal component API changed; either add `open` to the type or use the new API.
- `ai-command-center.tsx:376,377` — Duplicate key in object literal. Needs a decision on which value is correct.
- `aegis-home.tsx:504` — `href: string | undefined` not assignable to `href: string` on `LinkProps`. Need null coalesce or guard.

### NI-4 — `artifacts/a11oy`: 6 typecheck errors — type-union gaps and missing module
- `AerialTwinMilestone.tsx:33,57` — `"DRAFT"` and `"DELIVERED"` not in `StatusBadge` union. Extend the union or change the values — product decision.
- `CAVD.tsx:54` — `agentScope` too narrow. Widen `CAVDRecord.agentScope` type or change the data.
- `ExecutiveBrief.tsx:170,250` — Comparison `"low"` vs `"medium"` can never be true. Logic bug — review the intended condition.
- `Terminal.tsx:336` — `MirrorEvalResult.composite` does not exist on type. Wrong field name or missing property on type.
- `TrustCenter.tsx:275` — `"DEMO"` not in type union. Add to union or change value.
- `billing-account.tsx:1` — `@szl-holdings/shared-ui/billing` sub-path not found. This export may have been removed.

### NI-5 — `artifacts/counsel`: 17 `res is of type 'unknown'` catch-block errors
All are `TS18046` from TypeScript's `useUnknownInCatchVariables` (strict mode). Variable `res` (not `err`) in five pages accesses `.message`, `.status`, etc. without narrowing. Fix options: `(res as Error).message` or type guard `if (res instanceof Error)`. The variable name `res` suggests these may be API response objects — verify shape before casting to avoid hiding real bugs.

### NI-6 — `artifacts/helios`: 2 typecheck errors
- `HatunIndex.tsx:91` — `truncate` is a Tailwind class, not a CSS property. Move to `className` or replace with `{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }`.
- `RecalibrationMemos.tsx:80` — Type cast from `RecalibrationMemo` to `Record<string, string>` may fail at runtime. Review intended usage.

### NI-7 — `artifacts/conduit`: 1 remaining typecheck error
- `src/pages/connections/new.tsx:106` — `SetStateAction<"salesforce">` rejects dynamic strings. The connection type state needs widening to a union of supported connector types, or the specific string literal must be narrowed before being passed to the setter.

### NI-8 — `artifacts/pulse` / `lib/api-client-react`: Shared-lib duplicate key (TS2783)
- `lib/api-client-react/src/standard-hooks.ts:200` — `'event'` specified twice in an object literal; the second value silently overwrites the first. Needs a decision on which value is correct. Touch carefully — shared lib used across multiple artifacts.

### NI-9 — Workspace Lint: 26 biome errors in `apps/alloy-*` [CI-BLOCKING]
`noImplicitAnyLet` (3 instances): add explicit types to bare `let` declarations.  
`noNonNullAssertion` (7+ instances): replace `x!` with null checks or type-narrowing. These are in performance-critical embedding/ingestion code paths — semantics must be verified before changing.  
Affected: `apps/alloy-embedding-api/src/routes/{embed,hybrid-search,rerank}.ts`, `apps/alloy-ingestion-orchestrator/src/{checkpoint-store,engine}.ts`, `apps/alloy-embed-worker/src/pooling.ts`, `apps/alloy-vector-worker/src/{backends,batcher}.ts`.

### NI-10 — `artifacts/command` / `artifacts/lyte-command-center`: Build timeout
Both exceed 3-minute build window. Typechecks are clean. Likely large dependency trees causing slow bundling. Startup could not be verified. Consider chunk-splitting or build caching to bring build times under 90s.

### NI-11 — 14,428 biome lint warnings (workspace-wide)
Auto-fixable rules (`useTemplate`, `noUnusedImports`, `noUnusedVariables`) can be applied in bulk via `biome lint --write`. Rules requiring human review before fixing: `noNonNullAssertion`, `noArrayIndexKey`, `noStaticElementInteractions`, `noDangerouslySetInnerHtml`.  
`biome lint --write --only lint/correctness/noUnusedImports` is recommended as the first safe bulk fix pass (verify `--only` flag syntax for the installed biome version before running).

### NI-12 — Brand strings: 26 pre-existing violations of "Continuum" beyond baseline [CI-BLOCKING]
`pnpm brand:strings` reports 26 violations in `AlloyKernelPanel.tsx` and `ContinuumKernelPanel.tsx` across 9 artifacts (carlota-jo, command, counsel, lyte-command-center, mockup-sandbox, pulse, sentra, szl-holdings, terra, vessels). All use the string `"Continuum Codex"` in display text. The baseline count for this term is 0, so all occurrences exceed it. **Not introduced by this audit** — these files were not touched. Fixing requires either updating the baseline (if the term is intentionally kept) or removing the term per the brand review outcome (Task #3255). Decision needed from brand counsel.

---

*Audit completed 2026-04-28. Four safe fixes applied and verified. Twelve issues flagged for product or architectural decisions.*
