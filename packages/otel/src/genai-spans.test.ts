import * as api from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  type Sampler,
  SamplingDecision,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  OTEL_GENAI_ATTESTATION_ATTRS,
  OTEL_GENAI_ATTRS,
  OTEL_GENAI_OPERATION,
  OTEL_GENAI_PROVIDER,
  OTEL_MCP_ATTRS,
} from '@szl-holdings/telemetry-standards/genai';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  applyMcpAttributes,
  genAIAgentSpan,
  genAIInferenceClientSpan,
  genAIToolSpan,
  mcpSpan,
} from './genai-spans';

const exporter = new InMemorySpanExporter();
let samplerAttributes: api.Attributes = {};
const sampler = {
  shouldSample(_context, _traceId, _spanName, _spanKind, attributes) {
    samplerAttributes = { ...attributes };
    return { decision: SamplingDecision.RECORD_AND_SAMPLED };
  },
  toString: () => 'capture-initial-attributes',
} satisfies Sampler;
const provider = new BasicTracerProvider({
  sampler,
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

beforeAll(() => {
  api.trace.setGlobalTracerProvider(provider);
});

afterEach(() => {
  exporter.reset();
  samplerAttributes = {};
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
    expect(span.status.code).toBe(api.SpanStatusCode.UNSET);
    expect(samplerAttributes[OTEL_GENAI_ATTRS.PROVIDER_NAME]).toBe('openai');
    expect(samplerAttributes[OTEL_GENAI_ATTRS.REQUEST_MODEL]).toBe('gpt-5.6');
  });

  it('exports native internal agent and tool spans', async () => {
    await genAIAgentSpan(
      {
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
        jsonrpcRequestId: 'request-1',
        resourceUri: 'file:///tenant/document-987',
      },
      async () => undefined,
    );

    const [span] = exporter.getFinishedSpans();
    expect(span.name).toBe('resources/read');
    expect(span.kind).toBe(api.SpanKind.SERVER);
    expect(span.attributes[OTEL_MCP_ATTRS.RESOURCE_URI]).toBe('file:///tenant/document-987');
  });

  it('marks semantic and thrown failures as errors without leaking exception text', async () => {
    await genAIToolSpan(
      {
        toolName: 'policy_check',
        errorType: 'policy.denied',
      },
      async () => undefined,
    );

    await expect(
      genAIToolSpan(
        {
          toolName: 'runtime_check',
          contentCapturePolicy: { enabled: true, maxBytes: 256 },
          toolResult: '{"sensitive":"must-not-survive"}',
        },
        async () => {
          throw new TypeError('secret runtime detail');
        },
      ),
    ).rejects.toThrow('secret runtime detail');

    const [semanticFailure, thrownFailure] = exporter.getFinishedSpans();
    expect(semanticFailure?.status.code).toBe(api.SpanStatusCode.ERROR);
    expect(thrownFailure?.status.code).toBe(api.SpanStatusCode.ERROR);
    expect(thrownFailure?.attributes['error.type']).toBe('TypeError');
    expect(thrownFailure?.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.TOOL_CALL_RESULT);
    expect(JSON.stringify(thrownFailure?.events)).not.toContain('secret runtime detail');
  });

  it('adds MCP semantics to an existing tool span without creating a duplicate span', async () => {
    await genAIToolSpan({ toolName: 'verify_receipt' }, async (span) => {
      applyMcpAttributes(span, {
        role: 'client',
        methodName: 'tools/call',
        jsonrpcRequestId: 'request-2',
        toolName: 'verify_receipt',
        serverAddress: 'mcp.example.test',
      });
    });

    const spans = exporter.getFinishedSpans();
    expect(spans).toHaveLength(1);
    expect(spans[0]?.attributes[OTEL_MCP_ATTRS.METHOD_NAME]).toBe('tools/call');
    expect(spans[0]?.attributes[OTEL_GENAI_ATTRS.TOOL_NAME]).toBe('verify_receipt');
  });

  it('exports verified attestation correlation attributes to a real OTel span', async () => {
    await genAIToolSpan(
      {
        toolName: 'policy_check',
        attestation: {
          verified: true,
          evidenceTier: 'MEASURED',
          type: 'amd-sev-snp',
          quoteDigest: `sha384:${'c'.repeat(96)}`,
          measurement: `sha256:${'d'.repeat(64)}`,
          verifiedAt: '2026-07-27T20:30:00.000Z',
          verifier: 'local',
          receiptId: 'receipt-sev-001',
          receiptUrl: 'https://evidence.example.test/receipts/receipt-sev-001',
        },
      },
      async () => undefined,
    );

    const [span] = exporter.getFinishedSpans();
    expect(span?.attributes[OTEL_GENAI_ATTESTATION_ATTRS.VERIFIED]).toBe(true);
    expect(span?.attributes[OTEL_GENAI_ATTESTATION_ATTRS.TYPE]).toBe('amd-sev-snp');
    expect(span?.attributes[OTEL_GENAI_ATTESTATION_ATTRS.RECEIPT_ID]).toBe('receipt-sev-001');
    expect(samplerAttributes[OTEL_GENAI_ATTESTATION_ATTRS.MEASUREMENT]).toBe(
      `sha256:${'d'.repeat(64)}`,
    );
  });
});
