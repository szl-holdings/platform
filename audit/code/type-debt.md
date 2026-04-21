# Type Debt Report

Generated: 2026-04-20  
Phase: B (Code Quality & Database Audit)

## Summary

TypeScript settings in `tsconfig.base.json` are already at maximum strictness:
- `strict: true` (enables all strict-mode checks)
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

No opportunities remain to tighten compiler flags further. The baseline is already as strict as TypeScript allows.

## Fixed This Phase

| File | Error | Fix Applied |
|------|-------|-------------|
| `lib/mcp-client/src/McpOverlay.tsx:242` | `exactOptionalPropertyTypes` — passing `domain={domain}` where `domain?: string` but value may be `undefined` | Changed to `{...(domain !== undefined && { domain })}` spread pattern |

## Remaining Lint Warnings (Biome)

The `biome lint` run reports **10,348 warnings** across 5,269 files. All are at `warn` level (not `error`) and do not block the build. Rule breakdown:

| Rule | Level | Count (approx) | Description |
|------|-------|----------------|-------------|
| `suspicious/noExplicitAny` | warn | High | `any` typed values — spread across generated/adapter code |
| `correctness/noUnusedImports` | warn | High | Unused imports in artifact components and lib files |
| `correctness/noUnusedVariables` | warn | Medium | Unused local variables |
| `suspicious/noConsole` | warn | Medium | `console.log/warn/error` calls |
| `style/useImportType` | warn | Medium | `import X` where `import type X` should be used |

### Hotspot Files for `noExplicitAny`

Files with the most `any` usage (by grep):
- `lib/ai-engine/src/` — LLM adapter layer necessarily uses loose types at API boundaries
- `packages/cognitive-runtime/src/` — dynamic tool dispatch  
- `packages/agents-tools/src/` — plugin/tool manifest types
- `artifacts/api-server/src/routes/` — express request handlers with untyped `req.body`
- `lib/data-connectors/src/` — connector adapter layer (external API shapes not typed)

### Recommended Next Steps (Not Applied — Risky)

1. **API server route handlers**: Replace `any` on `req.body` with Zod-parsed request body types. Medium effort, high value. Covered by Phase C.
2. **Connector adapters**: Define typed response schemas for each connector. High effort.
3. **AI engine**: Use typed generics at the model boundary instead of `any`. Medium effort.
4. **Unused imports**: Run `biome lint --write` to auto-fix `noUnusedImports` across the codebase. Low risk but high churn (thousands of files touched — worth a dedicated cleanup PR).

## Formatting Violations

`biome format` reports **5,763 violations** (unformatted files). These are style-only issues — trailing commas, quote style, indent width. They do not affect correctness. A single `pnpm format` run would resolve all of them. This is left for a dedicated formatting PR to minimize diff noise.

## Packages Not in Root tsconfig.json References

The root `tsconfig.json` references 45 packages/libs. Packages NOT referenced (therefore not checked by `tsc --build` at root):

- All `artifacts/*` (each has its own `tsconfig.json` and Vite handles their typecheck)
- All `packages/db*` and `packages/db-schema` (use per-package `tsc --noEmit`)
- `lib/mcp-client` (fixed this phase)

These are checked via `turbo run typecheck` which delegates to each package's own `tsc --noEmit`.
