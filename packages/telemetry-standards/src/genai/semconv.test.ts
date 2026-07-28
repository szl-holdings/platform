import { describe, expect, it } from 'vitest';
import {
  createGenAIAgentSpan,
  createGenAIInferenceClientSpan,
  createGenAIToolSpan,
  createMcpSpan,
  OTEL_GENAI_ATTESTATION_ATTRS,
  OTEL_GENAI_ATTRS,
  OTEL_GENAI_EVENTS,
  OTEL_GENAI_METRICS,
  OTEL_GENAI_OPERATION,
  OTEL_GENAI_PROVIDER,
  OTEL_GENAI_SEMCONV,
  OTEL_GENAI_SPAN_TYPES,
  OTEL_MCP_ATTRS,
  OTEL_MCP_METRICS,
  OTEL_MCP_SPAN_TYPES,
} from './semconv.js';

describe('OpenTelemetry GenAI semantic-convention metadata', () => {
  it('pins the Development-status upstream source used by this compatibility layer', () => {
    expect(OTEL_GENAI_SEMCONV.status).toBe('development');
    expect(OTEL_GENAI_SEMCONV.sourceRepository).toBe(
      'https://github.com/open-telemetry/semantic-conventions-genai',
    );
    expect(OTEL_GENAI_SEMCONV.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(OTEL_GENAI_SEMCONV.coreSemanticConventionsVersion).toBe('1.43.0');
    expect(OTEL_GENAI_SEMCONV.verifiedAt).toBe('2026-07-25');
  });

  it('covers the six requested interoperability layers', () => {
    expect(OTEL_GENAI_SPAN_TYPES.INFERENCE_CLIENT).toBe('gen_ai.inference.client');
    expect(OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_INTERNAL).toBe('gen_ai.invoke_agent.internal');
    expect(OTEL_MCP_SPAN_TYPES.CLIENT).toBe('mcp.client');
    expect(OTEL_GENAI_EVENTS.EVALUATION_RESULT).toBe('gen_ai.evaluation.result');
    expect(OTEL_GENAI_METRICS.CLIENT_OPERATION_DURATION).toBe('gen_ai.client.operation.duration');
    expect(OTEL_GENAI_PROVIDER.OPENAI).toBe('openai');
    expect(OTEL_MCP_METRICS.SERVER_OPERATION_DURATION).toBe('mcp.server.operation.duration');
  });
});

describe('GenAI inference client spans', () => {
  it('uses current provider, operation, model, token, streaming, and error attributes', () => {
    const span = createGenAIInferenceClientSpan({
      providerName: OTEL_GENAI_PROVIDER.OPENAI,
      operationName: OTEL_GENAI_OPERATION.CHAT,
      requestModel: 'gpt-5.6',
      responseModel: 'gpt-5.6-2026-07-01',
      inputTokens: 500,
      outputTokens: 125,
      reasoningOutputTokens: 40,
      streaming: true,
      timeToFirstChunkSeconds: 0.19,
      serverAddress: 'api.openai.com',
    });

    expect(span).toMatchObject({
      semanticType: 'gen_ai.inference.client',
      name: 'chat gpt-5.6',
      kind: 'CLIENT',
      stability: 'development',
    });
    expect(span.attributes[OTEL_GENAI_ATTRS.PROVIDER_NAME]).toBe('openai');
    expect(span.attributes[OTEL_GENAI_ATTRS.USAGE_INPUT_TOKENS]).toBe(500);
    expect(span.attributes[OTEL_GENAI_ATTRS.USAGE_OUTPUT_TOKENS]).toBe(125);
    expect(span.attributes).not.toHaveProperty('gen_ai.system');
  });

  it('fails closed on empty required identifiers and invalid counters', () => {
    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: '',
        operationName: 'chat',
        requestModel: 'model',
      }),
    ).toThrow('providerName');

    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: 'openai',
        operationName: 'chat',
        requestModel: 'model',
        outputTokens: -1,
      }),
    ).toThrow('outputTokens');

    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: 'openai',
        operationName: 'chat',
        requestModel: 'model',
        outputTokens: 2.5,
      }),
    ).toThrow('integer');

    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: 'openai',
        operationName: 'chat',
        requestModel: 'model',
        outputTokens: 4,
        reasoningOutputTokens: 5,
      }),
    ).toThrow('must not exceed');

    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: 'openai',
        operationName: 'chat',
        requestModel: 'model',
        temperature: Number.POSITIVE_INFINITY,
      }),
    ).toThrow('finite');

    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: 'openai',
        operationName: 'chat',
        requestModel: 'model',
        serverPort: 443,
      }),
    ).toThrow('serverAddress');
  });
});

describe('agent and tool spans', () => {
  it('names an in-process agent invocation and emits canonical agent attributes', () => {
    const span = createGenAIAgentSpan({
      agentName: 'policy-reviewer',
    });

    expect(span.name).toBe('invoke_agent policy-reviewer');
    expect(span.kind).toBe('INTERNAL');
    expect(span.semanticType).toBe(OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_INTERNAL);
    expect(span.attributes[OTEL_GENAI_ATTRS.OPERATION_NAME]).toBe('invoke_agent');
    expect(span.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.PROVIDER_NAME);
    expect(span.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.AGENT_VERSION);
  });

  it('emits client-only provider, identity, and server attributes', () => {
    const span = createGenAIAgentSpan({
      kind: 'CLIENT',
      providerName: OTEL_GENAI_PROVIDER.ANTHROPIC,
      agentName: 'policy-reviewer',
      agentVersion: '2.1.0',
      serverAddress: 'agents.example.test',
      serverPort: 443,
    });

    expect(span.kind).toBe('CLIENT');
    expect(span.attributes[OTEL_GENAI_ATTRS.PROVIDER_NAME]).toBe('anthropic');
    expect(span.attributes[OTEL_GENAI_ATTRS.AGENT_VERSION]).toBe('2.1.0');
    expect(span.attributes[OTEL_GENAI_ATTRS.SERVER_PORT]).toBe(443);
  });

  it('keeps sensitive tool arguments and results opt-in', () => {
    const safeByDefault = createGenAIToolSpan({
      toolName: 'policy_check',
      toolArguments: '{"secret":"redacted"}',
      toolResult: '{"decision":"deny"}',
    });
    expect(safeByDefault.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS);
    expect(safeByDefault.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.TOOL_CALL_RESULT);

    const captured = createGenAIToolSpan({
      toolName: 'policy_check',
      contentCapturePolicy: { enabled: true, maxBytes: 256 },
      toolArguments: '{"secret":"hide","policy":"P-12"}',
      toolResult: '{"decision":"deny"}',
    });
    expect(captured.attributes[OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS]).toBe(
      '{"policy":"P-12","secret":"[REDACTED]"}',
    );
  });

  it('rejects malformed, non-object, and oversized captured content and omits failed results', () => {
    const policy = { enabled: true as const, maxBytes: 32 };
    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        contentCapturePolicy: policy,
        toolArguments: 'not-json',
      }),
    ).toThrow('valid JSON');
    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        contentCapturePolicy: policy,
        toolArguments: '[]',
      }),
    ).toThrow('JSON object');
    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        contentCapturePolicy: policy,
        toolArguments: JSON.stringify({ value: 'x'.repeat(64) }),
      }),
    ).toThrow('maxBytes');

    const failed = createGenAIToolSpan({
      toolName: 'policy_check',
      errorType: 'policy_denied',
      contentCapturePolicy: policy,
      toolResult: '{"decision":"deny"}',
    });
    expect(failed.attributes).not.toHaveProperty(OTEL_GENAI_ATTRS.TOOL_CALL_RESULT);
  });
});

describe('SZL experimental attestation attributes', () => {
  it('binds verified hardware evidence and a receipt pointer to a GenAI span', () => {
    const span = createGenAIToolSpan({
      toolName: 'high_consequence_action',
      attestation: {
        verified: true,
        evidenceTier: 'MEASURED',
        type: 'nvidia-cc',
        quoteDigest: `sha384:${'a'.repeat(96)}`,
        measurement: `sha384:${'b'.repeat(96)}`,
        verifiedAt: '2026-07-27T16:30:00-04:00',
        verifier: 'nras',
        receiptId: 'receipt-tee-001',
        receiptUrl: 'https://evidence.example.test/receipts/receipt-tee-001',
      },
    });

    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.VERIFIED]).toBe(true);
    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.EVIDENCE_TIER]).toBe('MEASURED');
    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.TYPE]).toBe('nvidia-cc');
    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.VERIFIED_AT]).toBe(
      '2026-07-27T20:30:00.000Z',
    );
    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.RECEIPT_ID]).toBe('receipt-tee-001');
  });

  it('emits an honest unverified state without hardware claims', () => {
    const span = createGenAIAgentSpan({
      agentName: 'policy-reviewer',
      attestation: {
        verified: false,
        evidenceTier: 'UNVERIFIED',
        receiptId: 'receipt-blocked-001',
        reasonCode: 'attestation_required',
      },
    });

    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.VERIFIED]).toBe(false);
    expect(span.attributes[OTEL_GENAI_ATTESTATION_ATTRS.REASON_CODE]).toBe('attestation_required');
    expect(span.attributes).not.toHaveProperty(OTEL_GENAI_ATTESTATION_ATTRS.TYPE);
    expect(span.attributes).not.toHaveProperty(OTEL_GENAI_ATTESTATION_ATTRS.MEASUREMENT);
  });

  it('rejects malformed proof digests and unsafe receipt URLs', () => {
    expect(() =>
      createGenAIInferenceClientSpan({
        providerName: 'openai',
        operationName: 'chat',
        requestModel: 'model',
        attestation: {
          verified: true,
          evidenceTier: 'MEASURED',
          type: 'nvidia-cc',
          quoteDigest: 'sha384:not-a-digest',
          measurement: `sha256:${'b'.repeat(64)}`,
          verifiedAt: '2026-07-27T20:30:00.000Z',
          verifier: 'nras',
          receiptId: 'receipt-tee-001',
        },
      }),
    ).toThrow('quoteDigest');

    expect(() =>
      createMcpSpan({
        role: 'client',
        methodName: 'tools/call',
        jsonrpcRequestId: 'request-4',
        toolName: 'verify_receipt',
        attestation: {
          verified: false,
          evidenceTier: 'UNVERIFIED',
          receiptId: 'receipt-blocked-002',
          receiptUrl: 'https://user:secret@example.test/receipt',
          reasonCode: 'verifier_unavailable',
        },
      }),
    ).toThrow('receiptUrl');
  });

  it('rejects evidence-tier upgrades and unsupported runtime values', () => {
    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        attestation: {
          verified: false,
          evidenceTier: 'MEASURED',
          receiptId: 'receipt-blocked-003',
          reasonCode: 'verifier_unavailable',
        } as never,
      }),
    ).toThrow('UNVERIFIED');

    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        attestation: {
          verified: true,
          evidenceTier: 'MEASURED',
          type: 'unsupported',
          quoteDigest: `sha384:${'a'.repeat(96)}`,
          measurement: `sha256:${'b'.repeat(64)}`,
          verifiedAt: '2026-07-27T20:30:00.000Z',
          verifier: 'local',
          receiptId: 'receipt-tee-002',
        } as never,
      }),
    ).toThrow('attestation.type');
  });

  it('rejects missing reason codes and calendar-invalid verification timestamps', () => {
    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        attestation: {
          verified: false,
          evidenceTier: 'UNVERIFIED',
          receiptId: 'receipt-blocked-004',
        } as never,
      }),
    ).toThrow('attestation.reasonCode');

    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        attestation: {
          verified: true,
          evidenceTier: 'MEASURED',
          type: 'nvidia-cc',
          quoteDigest: `sha384:${'a'.repeat(96)}`,
          measurement: `sha256:${'b'.repeat(64)}`,
          verifiedAt: '2026-02-31T20:30:00.000Z',
          verifier: 'local',
          receiptId: 'receipt-tee-003',
        },
      }),
    ).toThrow('attestation.verifiedAt');

    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        attestation: {
          verified: true,
          evidenceTier: 'MEASURED',
          type: 'nvidia-cc',
          quoteDigest: `sha384:${'a'.repeat(96)}`,
          measurement: `sha256:${'b'.repeat(64)}`,
          verifiedAt: '2026-07-27T20:30:00.000+14:01',
          verifier: 'local',
          receiptId: 'receipt-tee-004',
        },
      }),
    ).toThrow('attestation.verifiedAt');
  });

  it('accepts only the exact ISO 8601 end-of-day representation for hour 24', () => {
    const endOfDay = createGenAIToolSpan({
      toolName: 'policy_check',
      attestation: {
        verified: true,
        evidenceTier: 'MEASURED',
        type: 'nvidia-cc',
        quoteDigest: `sha384:${'a'.repeat(96)}`,
        measurement: `sha256:${'b'.repeat(64)}`,
        verifiedAt: '2026-07-27T24:00:00Z',
        verifier: 'local',
        receiptId: 'receipt-tee-005',
      },
    });
    expect(endOfDay.attributes[OTEL_GENAI_ATTESTATION_ATTRS.VERIFIED_AT]).toBe(
      '2026-07-28T00:00:00.000Z',
    );

    expect(() =>
      createGenAIToolSpan({
        toolName: 'policy_check',
        attestation: {
          verified: true,
          evidenceTier: 'MEASURED',
          type: 'nvidia-cc',
          quoteDigest: `sha384:${'a'.repeat(96)}`,
          measurement: `sha256:${'b'.repeat(64)}`,
          verifiedAt: '2026-07-27T24:00:00.001Z',
          verifier: 'local',
          receiptId: 'receipt-tee-006',
        },
      }),
    ).toThrow('attestation.verifiedAt');
  });
});

describe('MCP spans', () => {
  it('builds a client span with low-cardinality target naming', () => {
    const span = createMcpSpan({
      role: 'client',
      methodName: 'tools/call',
      jsonrpcRequestId: 'request-1',
      toolName: 'verify_receipt',
      protocolVersion: '2025-11-25',
      sessionId: 'session-1',
      serverAddress: 'mcp.example.test',
    });

    expect(span).toMatchObject({
      semanticType: OTEL_MCP_SPAN_TYPES.CLIENT,
      name: 'tools/call verify_receipt',
      kind: 'CLIENT',
    });
    expect(span.attributes[OTEL_MCP_ATTRS.METHOD_NAME]).toBe('tools/call');
    expect(span.attributes[OTEL_MCP_ATTRS.SERVER_ADDRESS]).toBe('mcp.example.test');
    expect(span.attributes[OTEL_GENAI_ATTRS.OPERATION_NAME]).toBe('execute_tool');
    expect(span.attributes[OTEL_GENAI_ATTRS.TOOL_NAME]).toBe('verify_receipt');
  });

  it('does not put a resource URI in the span name', () => {
    const span = createMcpSpan({
      role: 'server',
      methodName: 'resources/read',
      jsonrpcRequestId: 'request-2',
      resourceUri: 'file:///tenant/high-cardinality/document-123',
    });

    expect(span.name).toBe('resources/read');
    expect(span.attributes[OTEL_MCP_ATTRS.RESOURCE_URI]).toBe(
      'file:///tenant/high-cardinality/document-123',
    );
  });

  it('enforces request IDs, notifications, and typed MCP targets', () => {
    expect(() =>
      createMcpSpan({
        role: 'client',
        methodName: 'tools/call',
        toolName: 'verify_receipt',
      }),
    ).toThrow('jsonrpcRequestId');
    expect(() =>
      createMcpSpan({
        role: 'client',
        methodName: 'tools/call',
        jsonrpcRequestId: 'request-3',
      }),
    ).toThrow('toolName');
    expect(() =>
      createMcpSpan({
        role: 'client',
        methodName: 'notifications/progress',
        notification: true,
        jsonrpcRequestId: 'forbidden',
      }),
    ).toThrow('must be omitted');

    const notification = createMcpSpan({
      role: 'server',
      methodName: 'notifications/progress',
      notification: true,
      clientAddress: 'operator.example.test',
    });
    expect(notification.attributes).not.toHaveProperty(OTEL_MCP_ATTRS.JSONRPC_REQUEST_ID);
    expect(notification.attributes[OTEL_MCP_ATTRS.CLIENT_ADDRESS]).toBe('operator.example.test');
  });
});
