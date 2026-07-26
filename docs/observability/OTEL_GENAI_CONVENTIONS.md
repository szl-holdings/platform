# OpenTelemetry GenAI compatibility

**Status: IMPLEMENTED IN CODE / DEVELOPMENT UPSTREAM / PRODUCTION EXPORT UNVERIFIED**

SZL exposes a compatibility layer for the OpenTelemetry GenAI semantic
conventions in `packages/telemetry-standards/src/genai/semconv.ts`. It is based
on the upstream
[`open-telemetry/semantic-conventions-genai`](https://github.com/open-telemetry/semantic-conventions-genai)
repository at commit `64cfaa612a1af8472b2f063374fbe3c9e6cea2ab`,
verified on 2026-07-25. That snapshot binds the GenAI repository to core
semantic conventions `v1.43.0`.

The upstream conventions are **Development**, not stable. This implementation
does not make SZL an OpenTelemetry reference implementation and does not prove
that any production deployment currently exports these signals to a collector.

## Implemented boundary

| Layer | Implemented contract | Verification |
|---|---|---|
| GenAI client spans | Inference span builder; canonical provider, operation, model, usage, streaming, server, and error attributes | `semconv.test.ts` |
| Agent spans | Separate client/internal agent contracts and canonical names | `semconv.test.ts` |
| MCP | Client/server span builder, typed tool/prompt targets, request/notification rules, and an apply-to-existing-span path | `semconv.test.ts`, `genai-spans.test.ts` |
| Events | Identifier constants only; event emission is not implemented | `semconv.test.ts` |
| Metrics | Identifier constants only; instruments and export are not implemented | `semconv.test.ts` |
| Providers | Current provider values including OpenAI, Anthropic, Google, Azure, AWS, IBM, and others | `semconv.test.ts` |

The builders produce an SDK-neutral span description.
`packages/otel/src/genai-spans.ts` consumes those descriptions and starts real
OpenTelemetry API spans for inference, agent, tool, and MCP operations. A
deployment still has to configure an exporter and prove collector receipt in
its own environment.

## Privacy and cardinality defaults

- Prompt, tool-argument, and tool-result content is not captured unless a caller
  supplies an explicit `contentCapturePolicy`.
- Captured tool arguments/results must be JSON objects, are deterministically
  serialized, redact common secret keys, and are capped at 16 KiB. Failed tool
  executions never capture a result.
- An MCP resource URI is never used as a span-name target. Resource identifiers
  can be high-cardinality and may contain sensitive information.
- Required identifiers reject blank strings.
- Token counts and ports require integers; ports require a logical address;
  temperature and top-p reject non-finite values.
- `error.type` is intended to be low-cardinality. Free-form exception text does
  not belong in that attribute.
- Sampling-relevant attributes are attached when the span is created. Success
  leaves span status `UNSET`; semantic or thrown failures set `ERROR`.
- When a GenAI tool span already represents an MCP tool execution, use
  `applyMcpAttributes` instead of emitting a duplicate MCP span.

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
