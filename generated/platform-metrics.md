# SZL Holdings — Platform Metrics
> Auto-generated 2026-05-17T10:06:02.201Z by `scripts/audit/generate-platform-metrics.ts`
> **These numbers are code-derived. Do not hand-edit.**

## Repository Scale

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | 4,715 |
| React/TSX files (.tsx) | 1,800 |
| Total TS + TSX | 6,515 |
| Python files (.py) | 235 |
| CSS/SCSS files | 12 |
| Markdown docs | 2000 |
| Screenshot assets | 0 |

## Architecture

| Metric | Count |
|--------|-------|
| Artifact directories on disk (filtered) | 13 |
| Library packages (lib/) | 57 |
| Standalone packages (packages/) | 144 |
| Total packages | 201 |

### Artifact Registry

| Name | Kind |
|------|------|
| @workspace/a11oy | web |
| @workspace/api-server | backend |
| @workspace/carlota-jo | web |
| @workspace/command | web |
| @workspace/conduit | web |
| @workspace/counsel | web |
| @workspace/lexicon | web |
| mockup-sandbox | design |
| pulse | web |
| rosie | web |
| @workspace/sentra | web |
| @workspace/terra | web |
| @workspace/vessels | web |

## API Surface

| Metric | Count |
|--------|-------|
| Route files (recursive) | 211 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 7,781 |
| Database table definitions (Drizzle pgTable) | 1261 |
| SQL migrations | 76 |

## Quality & CI

| Metric | Count |
|--------|-------|
| Test files (.test.ts/tsx, .spec.ts/tsx) | 590 |
| GitHub CI workflows | 29 |

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
