# SZL Holdings — Platform Metrics
> Auto-generated 2026-04-27T03:50:50.019Z by `scripts/audit/generate-platform-metrics.ts`
> **These numbers are code-derived. Do not hand-edit.**

## Repository Scale

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | 3,801 |
| React/TSX files (.tsx) | 2,434 |
| Total TS + TSX | 6,235 |
| Python files (.py) | 145 |
| CSS/SCSS files | 19 |
| Markdown docs | 1679 |
| Screenshot assets | 0 |

## Architecture

| Metric | Count |
|--------|-------|
| Artifact directories on disk | 19 (15 formally registered; 4 unregistered: conduit, pluginmesh, helios, artifacts/audit evidence dir) |
| Library packages (lib/) | 51 |
| Standalone packages (packages/) | 101 |
| Total packages | 201 (MEASURED; `artifacts/SOURCE_OF_TRUTH.json`) |

### Artifact Registry

| Name | Kind |
|------|------|
| @workspace/a11oy | web |
| @workspace/aegis | web |
| @workspace/api-server | backend |
| audit | web |
| @workspace/carlota-jo | web |
| @workspace/command | web |
| @workspace/conduit | web |
| @workspace/counsel | web |
| @workspace/helios | web |
| @workspace/lyte-command-center | web |
| @workspace/mockup-sandbox | design |
| @workspace/pluginmesh | web |
| @workspace/pulse | web |
| @workspace/sentra | web |
| @workspace/szl-demo-video | video |
| @workspace/szl-holdings | web |
| @workspace/szl-holdings-mobile | mobile |
| @workspace/terra | web |
| @workspace/vessels | web |

## API Surface

| Metric | Count |
|--------|-------|
| Route files (recursive) | 180 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 6,063 |
| Database table definitions (Drizzle pgTable) | 1047 |
| SQL migrations | 59 |

## Quality & CI

| Metric | Count |
|--------|-------|
| Test files (.test.ts/tsx, .spec.ts/tsx) | 387 |
| GitHub CI workflows | 45 (MEASURED; `artifacts/SOURCE_OF_TRUTH.json`) |

## Platform Primitives

| Primitive | Package | Status |
|-----------|---------|--------|
| Outcome Graph | `lib/outcome-graph` | implemented |
| Proof Chain | `lib/proof-chain` | implemented |
| Decision Replay | `packages/replay-core` | implemented |
| Trace Graph | `packages/trace-graph` | implemented |
| Policy Engine (Covenant) | `lib/covenant-policy` | implemented |
| Policy Enforcer (Guardian) | `packages/guardian` | implemented |
| Event Fabric (Signal Mesh) | `packages/signal-mesh` | implemented |
| Event Bus (PRISM Bus) | `lib/prism-bus` | implemented |
| Simulation Engine (Monte Carlo) | `lib/monte-carlo` | implemented |
| Skill Forge Runtime | `lib/forge-runtime` | implemented |
| Skill Library | `packages/skill-library` | implemented |
| Document Engine | `lib/shared-ui` | implemented |

**Primitives implemented: 12 / 12**

---

*To regenerate: `npx tsx scripts/audit/generate-platform-metrics.ts`*
