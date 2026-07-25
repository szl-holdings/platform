# OpenTelemetry GenAI compatibility

**Status: IMPLEMENTED IN CODE / DEVELOPMENT UPSTREAM / PRODUCTION EXPORT UNVERIFIED**

SZL exposes a compatibility layer for the OpenTelemetry GenAI semantic
conventions in `packages/telemetry-standards/src/genai/semconv.ts`. It is based
on the upstream
[`open-telemetry/semantic-conventions-genai`](https://github.com/open-telemetry/semantic-conventions-genai)
repository at commit `64cfaa612a1af8472b2f063374fbe3c9e6cea2ab`,
verified on 2026-07-25.

The upstream conventions are **Development**, not stable. This implementation
does not make SZL an OpenTelemetry reference implementation and does not prove
that any production deployment currently exports these signals to a collector.

## Implemented boundary

| Layer | Implemented contract | Verification |
|---|---|---|
| GenAI client spans | Inference span builder; canonical provider, operation, model, usage, streaming, server, and error attributes | `semconv.test.ts` |
| Agent spans | Client/internal agent invocation span builder and canonical names | `semconv.test.ts` |
| MCP | Client/server span builder, MCP attributes, and four MCP metric names | `semconv.test.ts` |
| Events | Inference details, evaluation result, and client-operation exception names | `semconv.test.ts` |
| Metrics | Client, server, workflow, agent, and tool metric names | `semconv.test.ts` |
| Providers | Current provider values including OpenAI, Anthropic, Google, Azure, AWS, IBM, and others | `semconv.test.ts` |

The builders produce an SDK-neutral span description.
`packages/otel/src/genai-spans.ts` consumes those descriptions and starts real
OpenTelemetry API spans for inference, agent, tool, and MCP operations. A
deployment still has to configure an exporter and prove collector receipt in
its own environment.

## Privacy and cardinality defaults

- Prompt, tool-argument, and tool-result content is not captured unless a caller
  explicitly sets `captureContent: true`.
- An MCP resource URI is never used as a span-name target. Resource identifiers
  can be high-cardinality and may contain sensitive information.
- Required identifiers reject blank strings.
- Token counts, ports, and durations reject negative or non-finite values.
- `error.type` is intended to be low-cardinality. Free-form exception text does
  not belong in that attribute.

## Legacy migration table

Existing exports are retained for compatibility. New instrumentation should use
the current names below.

| Legacy or SZL-local name | Current boundary | Action |
|---|---|---|
| `gen_ai.system` | `gen_ai.provider.name` | Deprecated; emit the current name on new spans |
| `gen_ai.usage.prompt_tokens` | `gen_ai.usage.input_tokens` | Keep only for legacy consumers |
| `gen_ai.usage.completion_tokens` | `gen_ai.usage.output_tokens` | Keep only for legacy consumers |
| `agent.invoke` | `invoke_agent {gen_ai.agent.name}` | Use the current dynamic span name |
| `gen_ai.tool.call.type` | `gen_ai.tool.type` | Migrate new instrumentation |
| `agent_step` | `invoke_agent`, `plan`, or another documented operation | Select the actual operation boundary |

## Refresh procedure

1. Record the new upstream commit and verification date in
   `OTEL_GENAI_SEMCONV`.
2. Compare upstream `model/gen-ai` and `model/mcp` definitions.
3. Update constants, builders, this migration table, and tests in the same
   change.
4. Run the package tests and a repository typecheck.
5. Treat any renamed Development convention as a compatibility change, even
   when the package API remains additive.
