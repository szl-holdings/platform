# Frontier F2.1 proof — OpenTelemetry GenAI boundary

**Verified:** 2026-07-25
**Claim level:** code and package-test evidence only

## Scope

This slice implements an SDK-neutral compatibility layer for the current
OpenTelemetry GenAI Development conventions:

- GenAI inference client spans;
- agent invocation spans;
- tool execution spans;
- MCP client/server spans;
- GenAI and MCP event/metric names; and
- current provider identifiers.

`packages/otel/src/genai-spans.ts` applies those descriptions to real
OpenTelemetry API spans; the SDK-neutral layer remains independently testable.

The source definitions are pinned to upstream commit
`64cfaa612a1af8472b2f063374fbe3c9e6cea2ab`.

## Verification run

| Check | Result |
|---|---|
| Full workspace frozen install, pnpm 10.26.1 | PASS — 197 workspace projects |
| `pnpm --filter @szl-holdings/telemetry-standards test` | PASS — 80/80 tests |
| `pnpm --filter @szl-holdings/otel test` | PASS — 3/3 native-span tests |
| Strict isolated TypeScript check of changed source | PASS — no diagnostics |
| Biome check of changed TypeScript | PASS |
| Blank required identifier | PASS — builder throws |
| Negative token count | PASS — builder throws |
| Tool content without explicit opt-in | PASS — arguments and result omitted |
| MCP resource URI | PASS — attribute only; not placed in span name |

## Claim boundary

- OpenTelemetry marks these conventions **Development**.
- The implementation is not described as a reference implementation.
- No production collector, deployment endpoint, or exported production trace
  was verified in this slice.
- No conformance badge should count a vertical until the separate vertical
  conformance suite runs against a deployed commit and publishes a cited run.
