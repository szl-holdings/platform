import { describe, expect, it } from 'vitest';
import {
  createGenAIAgentSpan,
  createGenAIInferenceClientSpan,
  createGenAIToolSpan,
  createMcpSpan,
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
  });
});

describe('agent and tool spans', () => {
  it('names an in-process agent invocation and emits canonical agent attributes', () => {
    const span = createGenAIAgentSpan({
      providerName: OTEL_GENAI_PROVIDER.ANTHROPIC,
      agentName: 'policy-reviewer',
      agentVersion: '2.1.0',
    });

    expect(span.name).toBe('invoke_agent policy-reviewer');
    expect(span.kind).toBe('INTERNAL');
    expect(span.semanticType).toBe(OTEL_GENAI_SPAN_TYPES.INVOKE_AGENT_INTERNAL);
    expect(span.attributes[OTEL_GENAI_ATTRS.OPERATION_NAME]).toBe('invoke_agent');
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
      captureContent: true,
      toolArguments: '{"policy":"P-12"}',
      toolResult: '{"decision":"deny"}',
    });
    expect(captured.attributes[OTEL_GENAI_ATTRS.TOOL_CALL_ARGUMENTS]).toBe('{"policy":"P-12"}');
  });
});

describe('MCP spans', () => {
  it('builds a client span with low-cardinality target naming', () => {
    const span = createMcpSpan({
      role: 'client',
      methodName: 'tools/call',
      target: 'verify_receipt',
      protocolVersion: '2025-11-25',
      sessionId: 'session-1',
      peerAddress: 'mcp.example.test',
    });

    expect(span).toMatchObject({
      semanticType: OTEL_MCP_SPAN_TYPES.CLIENT,
      name: 'tools/call verify_receipt',
      kind: 'CLIENT',
    });
    expect(span.attributes[OTEL_MCP_ATTRS.METHOD_NAME]).toBe('tools/call');
    expect(span.attributes[OTEL_MCP_ATTRS.SERVER_ADDRESS]).toBe('mcp.example.test');
  });

  it('does not put a resource URI in the span name', () => {
    const span = createMcpSpan({
      role: 'server',
      methodName: 'resources/read',
      resourceUri: 'file:///tenant/high-cardinality/document-123',
    });

    expect(span.name).toBe('resources/read');
    expect(span.attributes[OTEL_MCP_ATTRS.RESOURCE_URI]).toBe(
      'file:///tenant/high-cardinality/document-123',
    );
  });
});
