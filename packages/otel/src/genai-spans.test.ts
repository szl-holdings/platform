import * as api from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  OTEL_GENAI_ATTRS,
  OTEL_GENAI_OPERATION,
  OTEL_GENAI_PROVIDER,
  OTEL_MCP_ATTRS,
} from '@szl-holdings/telemetry-standards/genai';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { genAIAgentSpan, genAIInferenceClientSpan, genAIToolSpan, mcpSpan } from './genai-spans';

const exporter = new InMemorySpanExporter();
const provider = new BasicTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

beforeAll(() => {
  api.trace.setGlobalTracerProvider(provider);
});

afterEach(() => {
  exporter.reset();
});

afterAll(async () => {
  await provider.shutdown();
  api.trace.disable();
});

describe('native OpenTelemetry GenAI wrappers', () => {
  it('exports a real inference client span with canonical attributes', async () => {
    const result = await genAIInferenceClientSpan(
      {
        providerName: OTEL_GENAI_PROVIDER.OPENAI,
        operationName: OTEL_GENAI_OPERATION.CHAT,
        requestModel: 'gpt-5.6',
        inputTokens: 300,
        outputTokens: 75,
      },
      async (span) => {
        expect(span.isRecording()).toBe(true);
        return 'ok';
      },
    );

    expect(result).toBe('ok');
    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe('chat gpt-5.6');
    expect(span.kind).toBe(api.SpanKind.CLIENT);
    expect(span.attributes[OTEL_GENAI_ATTRS.PROVIDER_NAME]).toBe('openai');
    expect(span.attributes[OTEL_GENAI_ATTRS.USAGE_INPUT_TOKENS]).toBe(300);
    expect(span.status.code).toBe(api.SpanStatusCode.OK);
  });

  it('exports native internal agent and tool spans', async () => {
    await genAIAgentSpan(
      {
        providerName: OTEL_GENAI_PROVIDER.ANTHROPIC,
        agentName: 'governance-reviewer',
      },
      async () => undefined,
    );
    await genAIToolSpan(
      {
        toolName: 'policy_check',
        toolArguments: '{"secret":"not-exported"}',
      },
      async () => undefined,
    );

    const spans = exporter.getFinishedSpans();
    expect(spans.map((span) => span.name)).toEqual([
      'invoke_agent governance-reviewer',
      'execute_tool policy_check',
    ]);
    expect(spans.every((span) => span.kind === api.SpanKind.INTERNAL)).toBe(true);
    expect(spans[1]?.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS);
  });

  it('exports an MCP server span without high-cardinality resource naming', async () => {
    await mcpSpan(
      {
        role: 'server',
        methodName: 'resources/read',
        resourceUri: 'file:///tenant/document-987',
      },
      async () => undefined,
    );

    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe('resources/read');
    expect(span.kind).toBe(api.SpanKind.SERVER);
    expect(span.attributes[OTEL_MCP_ATTRS.RESOURCE_URI]).toBe('file:///tenant/document-987');
  });
});
