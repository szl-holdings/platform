# Frontier F2.1 proof — OpenTelemetry GenAI boundary

**Verified:** 2026-07-27
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
`64cfaa612a1af8472b2f063374fbe3c9e6cea2ab`, which binds core semantic
conventions `v1.43.0`.

## Verification run

| Check | Result |
|---|---|
| Fresh full-workspace offline install | PARTIAL on Windows — dependency linking exceeded the bounded local run; verification reused the already-linked workspace dependency store |
| `@szl-holdings/telemetry-standards` Vitest suite | PASS — 87/87 tests |
| `@szl-holdings/otel` Vitest suite | PASS — 6/6 native-span tests |
| Strict isolated TypeScript check of changed source | PASS — no diagnostics |
| Biome check of changed TypeScript | PASS |
| Blank required identifier | PASS — builder throws |
| Invalid token/port/numeric semantics | PASS — builder throws |
| Tool content without an explicit bounded policy | PASS — arguments and result omitted |
| Malformed, non-object, or oversized tool content | PASS — builder throws |
| Common secret-key capture | PASS — value redacted |
| MCP resource URI | PASS — attribute only; not placed in span name |
| Sampling attributes | PASS — present when the span is created |
| Successful span status | PASS — remains `UNSET` |
| Semantic/thrown failure | PASS — `ERROR` plus low-cardinality `error.type`; raw message omitted |
| Existing GenAI tool + MCP | PASS — attributes applied without a duplicate span |

## Experimental attestation extension

The telemetry boundary now carries a fail-closed, experimental
`gen_ai.attestation.*` correlation contract:

- verified evidence requires a hardware type, algorithm-prefixed quote and
  measurement digests, a verification timestamp, a verifier, `MEASURED`, and a
  receipt pointer;
- unverified evidence emits `UNVERIFIED` plus a low-cardinality reason and
  omits hardware measurement claims;
- receipt URLs reject credentials, query parameters, fragments, and non-HTTPS
  origins; and
- the native OpenTelemetry wrapper attaches the correlation fields at span
  creation so they are available to head samplers.

This is an implemented local extension. It is not an upstream OpenTelemetry
standard and does not prove production collector or dashboard ingestion.

## Claim boundary

- OpenTelemetry marks these conventions **Development**.
- The implementation is not described as a reference implementation.
- GenAI/MCP events and metrics in this slice are **identifier constants only**;
  emission and collection are unverified.
- No production collector, deployment endpoint, or exported production trace
  was verified in this slice.
- No conformance badge should count a vertical until the separate vertical
  conformance suite runs against a deployed commit and publishes a cited run.
