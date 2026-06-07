# Dependency Rationalization
**Generated:** 2026-04-26  
**Phase:** Rehaul 4/9 — Workspace, Dependency & Build Stabilization

---

## Cyclic Dependency — RESOLVED

### `lib/forge-runtime` ↔ `packages/tool-mesh`

**Before:**
```
lib/forge-runtime/package.json > dependencies > @workspace/tool-mesh: workspace:*
packages/tool-mesh/package.json > dependencies > @szl-holdings/forge-runtime: workspace:*
```

**After:**
- `@workspace/tool-mesh` removed from `lib/forge-runtime` dependencies entirely.
- `packages/tool-mesh` still depends on `@szl-holdings/forge-runtime` (that direction is fine; forge-runtime no longer depends back).

**Rationale:** `lib/forge-runtime/src/code-handler.ts` used only a single dynamic `await import('@workspace/tool-mesh')`. Dynamic imports do not need a static `package.json` declaration to resolve at runtime under pnpm hoisting. Removing the static dep breaks the build-graph cycle without affecting runtime behavior.

---

## pnpm dedupe

`pnpm dedupe` was run post-fix. No packages were deduplicated (lockfile was already consistent). The workspace uses a `catalog:` for all shared deps and explicit `overrides` in `pnpm-workspace.yaml` for common version conflicts (esbuild, rollup, lightningcss, tailwindcss/oxide, react/react-dom). No further version pinning was needed.

---

## Version Conflicts Documented (Pre-Existing, Not Resolved This Phase)

| Package | Conflict | Status |
|---------|----------|--------|
| `vitest` | Root and workers use `catalog: vitest@3.2.4`; root devDep is `^4.1.2` | **Known peer warning** — `@vitest/ui@4.1.2` vs `vitest@3.2.4` in workers. Not breaking; workers run their own local vitest. |
| `@types/react` / `@types/react-dom` | Managed via `pnpm.overrides` to enforce catalog version | **PASS** — no conflicts. |
| `react` / `react-dom` | Managed via `$react` / `$react-dom` workspace protocol overrides | **PASS** — no conflicts. |
| `esbuild` | Pinned to `0.27.3` via overrides; all optional platform binaries excluded | **PASS** |
| `vite` | Pinned to `7.3.2` via `pnpm.overrides` | **PASS** |

---

## Packages Quarantined / Excluded

The following are already excluded from the workspace graph via `pnpm-workspace.yaml`:

```yaml
- '!artifacts/imperium'
- '!artifacts/stephen-site'
```

No additional packages were quarantined this phase. Packages under `packages/` that appear inactive were retained because they are referenced by active artifacts and cannot be safely removed without a full import audit. The `packages/_archive/` pattern was not needed.

---

## packages/ Active vs. Inactive Assessment

101 directories under `packages/`. All participate in the turbo build graph either directly or transitively. No fully orphaned packages were found — all have at least one upstream consumer via `workspace:*` declarations.

**High-confidence active packages:** Those appearing in turbo's `build` or `test` scope: `forge`, `tool-mesh`, `trace-graph`, `constellation`, `guardian`, `decision-engine`, `policy-engine`, `action-engine`, `verifier`, `aef-*`, `agents-*`, `cognitive-*`, `contracts`, `auth-shared`, `env`, `brand-registry`, `design-system`, `db`, `shared-contracts`.

**Low-signal packages** (no test script, no build output, but imported downstream): `nexus-mcp`, `simulation`, `run-ledger`, `sandbox-runtime`, `omnia-shell`, `platform-metrics-registry`, `storybook`. These should be reviewed in a dedicated dead-code pass (see Rehaul 5/9+ for security and 6/9 for smoke tests).

---

## tsconfig Inheritance

All active packages surveyed have a `tsconfig.json` that extends either:
- `../../tsconfig.base.json` (from `packages/*/tsconfig.json`)
- `../tsconfig.base.json` (from `lib/*/tsconfig.json`)

The root `tsconfig.json` uses composite project references for all lib/ and packages/ entries. No packages were found using an inconsistent or missing base config.

---

## exports Field Status

All actively-built packages (`aef-*`, `forge`, `tool-mesh`, `trace-graph`, `guardian`, etc.) have valid `exports` fields with both `types` and `import` conditions. Packages that don't build to `dist/` use `src/*.ts` exports directly (consistent with the workspace's `moduleResolution: bundler` TypeScript config).
