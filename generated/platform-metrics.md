# SZL Holdings — Platform Metrics
> Auto-generated 2026-04-22T04:14:40.950Z by `scripts/audit/generate-platform-metrics.ts`
> **These numbers are code-derived. Do not hand-edit.**

## Repository Scale

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | 3,097 |
| React/TSX files (.tsx) | 1,844 |
| Total TS + TSX | 4,941 |
| Python files (.py) | 31 |
| CSS/SCSS files | 16 |
| Markdown docs | 1411 |
| Screenshot assets | 0 |

## Architecture

| Metric | Count |
|--------|-------|
| Registered artifacts | 17 |
| Library packages (lib/) | 41 |
| Standalone packages (packages/) | 82 |
| Total packages | 123 |

### Artifact Registry

| Name | Kind |
|------|------|
| @workspace/aegis | web |
| @workspace/api-server | backend |
| @workspace/carlota-jo | web |
| @workspace/command | web |
| cortex-mobile | mobile |
| @workspace/counsel | web |
| imperium | web |
| @workspace/lyte-command-center | web |
| @workspace/mockup-sandbox | design |
| prism-counsel | web |
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
| Route files (recursive) | 131 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 4,659 |
| Database table definitions (Drizzle pgTable) | 920 |
| SQL migrations | 27 |

## Quality & CI

| Metric | Count |
|--------|-------|
| Test files (.test.ts/tsx, .spec.ts/tsx) | 256 |
| GitHub CI workflows | 22 |

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
