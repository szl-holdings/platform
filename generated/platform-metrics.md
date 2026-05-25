# SZL Holdings — Platform Metrics
> Auto-generated 2026-05-25T05:15:41.043Z by `scripts/generate-platform-metrics.ts`
> **These numbers are code-derived. Do not hand-edit.**

## Repository Scale

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | 4,954 |
| React/TSX files (.tsx) | 1,673 |
| Total TS + TSX | 6,627 |
| Python files (.py) | 291 |
| CSS/SCSS files | 10 |
| Markdown docs | 2096 |
| Screenshot assets | 0 |

## Architecture

| Metric | Count |
|--------|-------|
| Active registered artifacts (canonical registry) | 16 |
| Artifact directories on disk (filtered) | 15 |
| Library packages (lib/) | 57 |
| Standalone packages (packages/) | 150 |
| Total packages | 207 |

### Artifact Registry

| Name | Kind |
|------|------|
| @workspace/a11oy | web |
| @workspace/a11oy-uds | web |
| @workspace/api-server | backend |
| carlota-jo | web |
| command | web |
| @workspace/conduit | web |
| counsel | web |
| @workspace/lexicon | web |
| mockup-sandbox | design |
| pulse | web |
| @workspace/rosie | web |
| @workspace/rosie-mobile | mobile |
| @workspace/sentra | web |
| @workspace/vessels | web |
| @workspace/vessels-pitch | web |

## API Surface

| Metric | Count |
|--------|-------|
| Route files (recursive) | 213 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 8,028 |
| Database table definitions (Drizzle pgTable) | 1273 |
| SQL migrations | 81 |

## Quality & CI

| Metric | Count |
|--------|-------|
| Test files (.test.ts/tsx, .spec.ts/tsx) | 727 |
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

*To regenerate: `pnpm metrics:generate` (or `tsx scripts/generate-platform-metrics.ts`)*
