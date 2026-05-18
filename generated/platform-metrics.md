# SZL Holdings — Platform Metrics
> Auto-generated 2026-05-18T19:05:03.065Z by `scripts/audit/generate-platform-metrics.ts`
> **These numbers are code-derived. Do not hand-edit.**

## Repository Scale

| Metric | Count |
|--------|-------|
| TypeScript files (.ts) | 4,893 |
| React/TSX files (.tsx) | 1,593 |
| Total TS + TSX | 6,486 |
| Python files (.py) | 291 |
| CSS/SCSS files | 9 |
| Markdown docs | 2078 |
| Screenshot assets | 0 |

## Architecture

| Metric | Count |
|--------|-------|
| Active registered artifacts (canonical registry) | 14 |
| Artifact directories on disk (filtered) | 13 |
| Library packages (lib/) | 57 |
| Standalone packages (packages/) | 147 |
| Total packages | 204 |

### Artifact Registry

| Name | Kind |
|------|------|
| @workspace/a11oy | web |
| @workspace/api-server | backend |
| carlota-jo | web |
| command | web |
| @workspace/conduit | web |
| counsel | web |
| @workspace/lexicon | web |
| mockup-sandbox | design |
| pulse | web |
| rosie | web |
| @workspace/sentra | web |
| @workspace/vessels | web |
| @workspace/vessels-pitch | web |

## API Surface

| Metric | Count |
|--------|-------|
| Route files (recursive) | 212 |
| Route handlers (GET/POST/PUT/PATCH/DELETE) | 7,921 |
| Database table definitions (Drizzle pgTable) | 1269 |
| SQL migrations | 79 |

## Quality & CI

| Metric | Count |
|--------|-------|
| Test files (.test.ts/tsx, .spec.ts/tsx) | 715 |
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
