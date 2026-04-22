import { globalCollector } from '@workspace/cognitive-observability';
import { GuardianDecisionEngine } from '@workspace/guardian/decision-engine';
import { InMemoryTraceStore } from '@workspace/trace-graph/store';
import { TraceWriter } from '@workspace/trace-graph/writer';
import { describe, expect, it } from 'vitest';
import { ToolMeshExecutor } from './executor.js';
import { type ToolHandler, ToolMeshGateway } from './gateway.js';
import { type ToolManifest, ToolManifestSchema } from './manifest.js';
import { ToolMeshMcpBridge } from './mcp-bridge.js';
import { ToolRateLimiter } from './rate-limiter.js';
import { InMemoryToolRegistry } from './registry.js';
import { validateAgainstSchema } from './schema-validator.js';
import {
  DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
  documentRetrievalHandler,
} from './tools/document-retrieval.js';
import { FINANCE_TOOL_MANIFESTS } from './tools/finance-tools.js';
import { GRAPH_QUERY_TOOL_MANIFEST, graphQueryHandler } from './tools/graph-query.js';
import { SECURITY_TOOL_MANIFESTS } from './tools/security-tools.js';

function makeAllowGuardian(tier = 'supervised') {
  const guardian = new GuardianDecisionEngine();
  guardian.addRule({
    id: 'allow-all',
    name: 'Allow all',
    tier,
    conditions: [],
    action: 'allow',
    priority: 10,
    enabled: true,
    tags: [],
  });
  return guardian;
}

function makeGateway(
  registry: InMemoryToolRegistry,
  guardian = makeAllowGuardian(),
  rateLimiter = new ToolRateLimiter(),
) {
  const store = new InMemoryTraceStore();
  const writer = new TraceWriter(store);
  return { gateway: new ToolMeshGateway(registry, guardian, writer, rateLimiter), store };
}

describe('Schema enforcement — input validation', () => {
  it('rejects invocation when required field is missing', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'strict-tool',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);
    gateway.registerHandler('strict-tool', async () => ({ ok: true }));

    const result = await gateway.invoke('strict-tool', {}, { requestId: 'r1' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing required field/i);
  });

  it('accepts invocation when required fields are present', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'strict-tool-2',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);
    gateway.registerHandler('strict-tool-2', async () => ({ ok: true }));

    const result = await gateway.invoke('strict-tool-2', { query: 'test' }, { requestId: 'r2' });
    expect(result.success).toBe(true);
  });

  it('blocks invocation when manifest has no inputSchema (schema-bound enforcement)', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'no-schema-tool',
      inputSchema: undefined,
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);
    gateway.registerHandler('no-schema-tool', async () => ({ ok: true }));

    const result = await gateway.invoke('no-schema-tool', {}, { requestId: 'r3' });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing required inputSchema/);
  });
});

describe('Rate limiting enforcement', () => {
  it('blocks invocation when per-minute rate limit is exceeded', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'rate-limited-tool',
      rateLimits: { requestsPerMinute: 1 },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const rateLimiter = new ToolRateLimiter();
    const { gateway } = makeGateway(registry, makeAllowGuardian(), rateLimiter);
    gateway.registerHandler('rate-limited-tool', graphQueryHandler);

    await gateway.invoke('rate-limited-tool', { query: 'first' }, { requestId: 'r-rate-1' });
    const second = await gateway.invoke(
      'rate-limited-tool',
      { query: 'second' },
      { requestId: 'r-rate-2' },
    );

    expect(second.success).toBe(false);
    expect(second.error).toMatch(/rate limit/i);
    expect(second.rateLimitRetryAfterMs).toBeDefined();
  });

  it('allows invocation when under rate limit', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'generous-rate-tool',
      rateLimits: { requestsPerMinute: 100 },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);
    gateway.registerHandler('generous-rate-tool', graphQueryHandler);

    const result = await gateway.invoke(
      'generous-rate-tool',
      { query: 'test' },
      { requestId: 'r-rate-3' },
    );
    expect(result.success).toBe(true);
  });

  it('blocks when concurrency limit is reached', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'concurrency-tool',
      rateLimits: { concurrency: 1 },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const rateLimiter = new ToolRateLimiter();
    rateLimiter.increment('concurrency-tool');

    const { gateway } = makeGateway(registry, makeAllowGuardian(), rateLimiter);
    gateway.registerHandler('concurrency-tool', graphQueryHandler);

    const result = await gateway.invoke(
      'concurrency-tool',
      { query: 'test' },
      { requestId: 'r-conc-1' },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/concurrency limit/i);
  });
});

describe('Timeout enforcement', () => {
  it('fails invocation when handler exceeds timeoutMs', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'timeout-tool',
      timeoutMs: 50,
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);

    const slowHandler: ToolHandler = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return { result: 'too slow' };
    };
    gateway.registerHandler('timeout-tool', slowHandler);

    const result = await gateway.invoke(
      'timeout-tool',
      { query: 'test' },
      { requestId: 'r-timeout-1' },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/timed out/i);
  }, 2000);

  it('succeeds when handler completes within timeoutMs', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'fast-tool',
      timeoutMs: 5000,
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);
    gateway.registerHandler('fast-tool', graphQueryHandler);

    const result = await gateway.invoke(
      'fast-tool',
      { query: 'fast' },
      { requestId: 'r-timeout-2' },
    );
    expect(result.success).toBe(true);
  });
});

describe('Fallback chain execution', () => {
  it('invokes fallback tool when primary fails', async () => {
    const fallbackManifest: ToolManifest = ToolManifestSchema.parse({
      ...DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
      id: 'fallback-doc',
    });

    const primaryManifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'primary-fails',
      failureModes: [
        { type: 'error', fallbackToolId: 'fallback-doc', retryable: false, maxRetries: 0 },
      ],
    });

    const registry = new InMemoryToolRegistry();
    registry.register(primaryManifest);
    registry.register(fallbackManifest);
    const { gateway } = makeGateway(registry);

    const failingHandler: ToolHandler = async () => {
      throw new Error('Primary tool failed');
    };
    gateway.registerHandler('primary-fails', failingHandler);
    gateway.registerHandler('fallback-doc', documentRetrievalHandler);

    const result = await gateway.invoke(
      'primary-fails',
      { query: 'lease' },
      { requestId: 'r-fallback-1' },
    );
    expect(result.success).toBe(true);
    expect(result.fallbackToolId).toBe('fallback-doc');
  });

  it('returns failure when no fallback is configured', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'no-fallback-tool',
      failureModes: [],
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const { gateway } = makeGateway(registry);

    gateway.registerHandler('no-fallback-tool', async () => {
      throw new Error('tool crashed');
    });

    const result = await gateway.invoke(
      'no-fallback-tool',
      { query: 'test' },
      { requestId: 'r-fallback-2' },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/tool crashed/i);
  });
});

describe('Observability emission', () => {
  it('emits latency_ms metric on successful tool call', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'obs-tool',
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());
    gateway.registerHandler('obs-tool', graphQueryHandler);

    await gateway.invoke('obs-tool', { query: 'test' }, { requestId: 'r-obs-1' });

    const latencyMetric = globalCollector
      .snapshot()
      .find((m) => m.name === 'latency_ms' && m.labels.toolId === 'obs-tool');
    expect(latencyMetric).toBeDefined();
    expect(latencyMetric?.value).toBeGreaterThanOrEqual(0);
  });

  it('emits tool_error_rate=1 on tool failure', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'obs-fail-tool',
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());
    gateway.registerHandler('obs-fail-tool', async () => {
      throw new Error('deliberate failure');
    });

    await gateway.invoke('obs-fail-tool', { query: 'test' }, { requestId: 'r-obs-fail-1' });

    const errorMetric = globalCollector
      .snapshot()
      .find((m) => m.name === 'tool_error_rate' && m.labels.toolId === 'obs-fail-tool');
    expect(errorMetric).toBeDefined();
    expect(errorMetric?.value).toBe(1);
  });

  it('records trace with tool call detail on success', async () => {
    const registry = new InMemoryToolRegistry();
    registry.register(GRAPH_QUERY_TOOL_MANIFEST);

    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());
    gateway.registerHandler('graph-query', graphQueryHandler);

    const result = await gateway.invoke(
      'graph-query',
      { query: 'nodes' },
      { requestId: 'r-trace-1' },
    );
    expect(result.traceId).toBeDefined();
    const trace = store.get(result.traceId!);
    expect(trace).toBeDefined();
    expect(trace?.toolCalls).toHaveLength(1);
    expect(trace?.toolCalls[0]?.toolId).toBe('graph-query');
    expect(trace?.toolCalls[0]?.success).toBe(true);
  });
});

describe('Guardian approval path', () => {
  it('routes approval-required tools through guardian deny path with no rules', async () => {
    const registry = new InMemoryToolRegistry();
    for (const m of SECURITY_TOOL_MANIFESTS) registry.register(m);

    const denyingGuardian = new GuardianDecisionEngine();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, denyingGuardian, writer);

    const result = await gateway.invoke(
      'security.incident-containment',
      { incidentId: 'inc-1', containmentAction: 'isolate-host', justification: 'Active breach' },
      { requestId: 'r-guardian-1' },
    );

    expect(result.success).toBe(false);
    expect(['deny', 'require-approval']).toContain(result.decisionOutcome);
  });

  it('human-approval-mandatory tools are blocked without explicit guardian approval rule', async () => {
    const registry = new InMemoryToolRegistry();
    for (const m of FINANCE_TOOL_MANIFESTS) registry.register(m);

    const guardian = new GuardianDecisionEngine();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, guardian, writer);

    const result = await gateway.invoke(
      'finance.fund-transfer',
      {
        fromAccount: 'a1',
        toAccount: 'a2',
        amountUsd: 1000,
        currency: 'USD',
        justification: 'Test',
      },
      { requestId: 'r-guardian-2' },
    );

    expect(result.success).toBe(false);
  });
});

describe('Dry-run mode', () => {
  it('returns dry-run output without executing handler', async () => {
    const registry = new InMemoryToolRegistry();
    registry.register(GRAPH_QUERY_TOOL_MANIFEST);
    const { gateway } = makeGateway(registry);

    let handlerCalled = false;
    gateway.registerHandler('graph-query', async (input, manifest) => {
      handlerCalled = true;
      return graphQueryHandler(input, manifest);
    });

    const result = await gateway.invoke(
      'graph-query',
      { query: 'test' },
      { requestId: 'r-dry-1', dryRun: true },
    );

    expect(result.success).toBe(true);
    expect(handlerCalled).toBe(false);
    expect((result.output as Record<string, unknown>)?.dryRun).toBe(true);
  });
});

describe('ToolMeshExecutor', () => {
  it('records execution history', async () => {
    const executor = new ToolMeshExecutor();
    const record = {
      id: 'exec-1',
      toolId: 'graph-query',
      toolName: 'Graph Query',
      callerId: 'agent-1',
      input: { query: 'test' },
      output: { results: [] },
      success: true,
      dryRun: false,
      latencyMs: 42,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    executor.record(record);
    expect(executor.getRecord('exec-1')).toEqual(record);
  });

  it('summary reports correct success rate', () => {
    const executor = new ToolMeshExecutor();
    const base = {
      toolId: 't1',
      toolName: 'T1',
      callerId: 'c1',
      input: {},
      output: {},
      dryRun: false,
      latencyMs: 10,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    executor.record({ ...base, id: 'e1', success: true });
    executor.record({ ...base, id: 'e2', success: false, error: 'oops' });
    const s = executor.summary();
    expect(s.totalExecutions).toBe(2);
    expect(s.successRate).toBe(0.5);
    expect(s.byStatus.success).toBe(1);
    expect(s.byStatus.failure).toBe(1);
  });

  it('getHistory filters by toolId', () => {
    const executor = new ToolMeshExecutor();
    const base = {
      callerId: 'c1',
      input: {},
      output: {},
      success: true,
      dryRun: false,
      latencyMs: 5,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    executor.record({ ...base, id: 'e1', toolId: 'tool-a', toolName: 'Tool A' });
    executor.record({ ...base, id: 'e2', toolId: 'tool-b', toolName: 'Tool B' });
    const results = executor.getHistory({ toolId: 'tool-a' });
    expect(results).toHaveLength(1);
    expect(results[0]?.toolId).toBe('tool-a');
  });

  it('executeWithTimeout rejects when exceeded', async () => {
    const executor = new ToolMeshExecutor();
    const slowHandler: ToolHandler = () =>
      new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 500));

    await expect(
      executor.executeWithTimeout(
        slowHandler,
        {},
        {
          ...GRAPH_QUERY_TOOL_MANIFEST,
          id: 'slow',
          name: 'Slow',
        } as never,
        50,
      ),
    ).rejects.toThrow(/timed out/i);
  }, 2000);
});

describe('ToolMeshMcpBridge', () => {
  it('lists all registered tools as MCP tool definitions', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(GRAPH_QUERY_TOOL_MANIFEST);
    registry.register(DOCUMENT_RETRIEVAL_TOOL_MANIFEST);

    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());
    gateway.registerHandler('graph-query', graphQueryHandler);
    gateway.registerHandler('document-retrieval', documentRetrievalHandler);

    const bridge = new ToolMeshMcpBridge(registry, gateway);
    const tools = bridge.listTools();
    expect(tools).toHaveLength(2);
    const names = tools.map((t) => t.name);
    expect(names).toContain('graph-query');
    expect(names).toContain('document-retrieval');
  });

  it('getServerInfo returns valid MCP server info', () => {
    const registry = new InMemoryToolRegistry();
    registry.register(GRAPH_QUERY_TOOL_MANIFEST);
    const gateway = new ToolMeshGateway(
      registry,
      makeAllowGuardian(),
      new TraceWriter(new InMemoryTraceStore()),
      new ToolRateLimiter(),
    );
    const bridge = new ToolMeshMcpBridge(registry, gateway, 'test-server', '1.0.0');
    const info = bridge.getServerInfo();
    expect(info.name).toBe('test-server');
    expect(info.version).toBe('1.0.0');
    expect(info.protocolVersion).toBe('2024-11-05');
    expect(info.tools).toHaveLength(1);
  });

  it('call returns success result for valid tool', async () => {
    const registry = new InMemoryToolRegistry();
    registry.register(GRAPH_QUERY_TOOL_MANIFEST);
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());
    gateway.registerHandler('graph-query', graphQueryHandler);

    const bridge = new ToolMeshMcpBridge(registry, gateway);
    const result = await bridge.call(
      { name: 'graph-query', arguments: { query: 'nodes' } },
      { requestId: 'mcp-1' },
    );
    expect(result.isError).toBeFalsy();
    expect(result.content[0]?.type).toBe('text');
  });

  it('call returns error content for unknown tool', async () => {
    const registry = new InMemoryToolRegistry();
    const gateway = new ToolMeshGateway(
      registry,
      makeAllowGuardian(),
      new TraceWriter(new InMemoryTraceStore()),
      new ToolRateLimiter(),
    );
    const bridge = new ToolMeshMcpBridge(registry, gateway);

    const result = await bridge.call(
      { name: 'nonexistent', arguments: {} },
      { requestId: 'mcp-err-1' },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toMatch(/not found/i);
  });
});

describe('ToolRateLimiter', () => {
  it('allows calls when no limits configured', () => {
    const limiter = new ToolRateLimiter();
    const check = limiter.check('tool-x', {});
    expect(check.allowed).toBe(true);
  });

  it('resets state correctly', () => {
    const limiter = new ToolRateLimiter();
    limiter.increment('tool-x');
    limiter.increment('tool-x');
    limiter.reset('tool-x');
    const check = limiter.check('tool-x', { requestsPerMinute: 1 });
    expect(check.allowed).toBe(true);
  });

  it('tracks concurrency active count', () => {
    const limiter = new ToolRateLimiter();
    limiter.increment('tool-y');
    limiter.decrement('tool-y');
    const check = limiter.check('tool-y', { concurrency: 1 });
    expect(check.allowed).toBe(true);
  });

  it('minute and hour windows are tracked independently', () => {
    const limiter = new ToolRateLimiter();
    for (let i = 0; i < 5; i++) limiter.increment('dual-limit-tool');

    const minuteCheck = limiter.check('dual-limit-tool', { requestsPerMinute: 5 });
    expect(minuteCheck.allowed).toBe(false);
    expect(minuteCheck.reason).toMatch(/req\/min/);

    const hourCheck = limiter.check('dual-limit-tool', { requestsPerHour: 100 });
    expect(hourCheck.allowed).toBe(true);
  });

  it('returns retryAfterMs when rate limited', () => {
    const limiter = new ToolRateLimiter();
    limiter.increment('retry-tool');
    const check = limiter.check('retry-tool', { requestsPerMinute: 1 });
    expect(check.allowed).toBe(false);
    expect(check.retryAfterMs).toBeDefined();
    expect(check.retryAfterMs!).toBeGreaterThan(0);
    expect(check.retryAfterMs!).toBeLessThanOrEqual(60_000);
  });
});

describe('Schema validation — full type enforcement', () => {
  it('rejects wrong type for a required field', () => {
    const result = validateAgainstSchema(
      'typed-tool',
      { query: 123 },
      {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/expected type 'string'/);
  });

  it('accepts valid typed fields', () => {
    const result = validateAgainstSchema(
      'typed-tool',
      { query: 'test', maxResults: 5 },
      {
        type: 'object',
        properties: {
          query: { type: 'string' },
          maxResults: { type: 'integer' },
        },
        required: ['query'],
      },
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('enforces enum values', () => {
    const result = validateAgainstSchema(
      'enum-tool',
      { status: 'unknown' },
      {
        type: 'object',
        properties: { status: { type: 'string', enum: ['active', 'inactive'] } },
        required: ['status'],
      },
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not in allowed enum/);
  });

  it('enforces minimum numeric constraint', () => {
    const result = validateAgainstSchema(
      'min-tool',
      { count: -1 },
      {
        type: 'object',
        properties: { count: { type: 'number', minimum: 0 } },
        required: ['count'],
      },
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/less than minimum/);
  });

  it('returns valid:true when no inputSchema defined', () => {
    const result = validateAgainstSchema('no-schema', { anything: true }, undefined);
    expect(result.valid).toBe(true);
  });

  it('rejects non-object input when schema requires object', () => {
    const result = validateAgainstSchema('obj-tool', 'a string', {
      type: 'object',
      properties: {},
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/must be a JSON object/);
  });
});

describe('Gateway — schema-less tool hard rejection', () => {
  it('blocks invocation of a tool without inputSchema', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      id: 'no-schema-invokable',
      name: 'No Schema Tool',
      description: 'Tool intentionally missing inputSchema',
      policyTier: 'internal-workflow',
      domainTags: ['custom'],
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);

    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(
      registry,
      guardian,
      new TraceWriter(new InMemoryTraceStore()),
      new ToolRateLimiter(),
    );
    gateway.registerHandler('no-schema-invokable', async () => ({ ok: true }));

    const result = await gateway.invoke(
      'no-schema-invokable',
      { anything: true },
      { requestId: 'schema-less-1' },
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing required inputSchema/);
    expect(result.schemaErrors).toContain('inputSchema is absent');
  });
});

describe('MCP bridge — external tool execution via call()', () => {
  it('executes registered external tool via call()', async () => {
    const registry = new InMemoryToolRegistry();
    const guardian = makeAllowGuardian();
    const gateway = new ToolMeshGateway(
      registry,
      guardian,
      new TraceWriter(new InMemoryTraceStore()),
      new ToolRateLimiter(),
    );
    const bridge = new ToolMeshMcpBridge(registry, gateway);

    bridge.registerExternalTool({
      name: 'ext-calc',
      description: 'External calculator',
      inputSchema: { x: { type: 'number' }, y: { type: 'number' } },
      requiresApproval: false,
      handler: async (args) => ({ sum: (args.x as number) + (args.y as number) }),
    });

    const result = await bridge.call(
      { name: 'ext-calc', arguments: { x: 3, y: 4 } },
      { requestId: 'ext-call-1' },
    );
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('7');
  });

  it('blocks external tool execution when requiresApproval=true', async () => {
    const registry = new InMemoryToolRegistry();
    const bridge = new ToolMeshMcpBridge(registry, new ToolMeshGateway(registry));

    bridge.registerExternalTool({
      name: 'ext-guarded',
      description: 'Approval-gated external tool',
      inputSchema: {},
      requiresApproval: true,
      handler: async () => ({ executed: true }),
    });

    const result = await bridge.call(
      { name: 'ext-guarded', arguments: {} },
      { requestId: 'ext-call-2' },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/requires human approval/);
  });

  it('surfaces handler error from external tool as isError response', async () => {
    const registry = new InMemoryToolRegistry();
    const bridge = new ToolMeshMcpBridge(registry, new ToolMeshGateway(registry));

    bridge.registerExternalTool({
      name: 'ext-failing',
      description: 'External tool that always throws',
      inputSchema: {},
      requiresApproval: false,
      handler: async () => {
        throw new Error('upstream unavailable');
      },
    });

    const result = await bridge.call(
      { name: 'ext-failing', arguments: {} },
      { requestId: 'ext-call-3' },
    );
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toMatch(/upstream unavailable/);
  });
});

describe('MCP schema — correct properties/required extraction', () => {
  it('extracts properties from inputSchema correctly', () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'mcp-schema-tool',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          limit: { type: 'integer' },
        },
        required: ['query'],
      },
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const gateway = new ToolMeshGateway(
      registry,
      makeAllowGuardian(),
      new TraceWriter(new InMemoryTraceStore()),
      new ToolRateLimiter(),
    );
    const bridge = new ToolMeshMcpBridge(registry, gateway);

    const tools = bridge.listTools();
    const tool = tools.find((t) => t.name === 'mcp-schema-tool');
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.type).toBe('object');
    expect(tool?.inputSchema.properties).toHaveProperty('query');
    expect(tool?.inputSchema.properties).toHaveProperty('limit');
    expect(tool?.inputSchema.required).toContain('query');
    expect(tool?.inputSchema.properties).not.toHaveProperty('type');
    expect(tool?.inputSchema.properties).not.toHaveProperty('required');
  });

  it('handles tool with no inputSchema gracefully', () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      id: 'no-schema-mcp-tool',
      name: 'no-schema-mcp-tool',
      description: 'Tool without an inputSchema (schema is optional)',
      policyTier: 'internal-workflow',
      domainTags: ['custom'],
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);
    const bridge = new ToolMeshMcpBridge(registry, new ToolMeshGateway(registry));
    const tools = bridge.listTools();
    const tool = tools.find((t) => t.name === 'no-schema-mcp-tool');
    expect(tool).toBeDefined();
    expect(tool?.inputSchema.type).toBe('object');
    expect(tool?.inputSchema.properties).toEqual({});
    expect(tool?.inputSchema.required).toBeUndefined();
  });
});

describe('Fallback — routes through full gateway controls', () => {
  it('fallback tool is subject to guardian denial', async () => {
    const primaryManifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'gateway-primary',
      failureModes: [
        { type: 'error', fallbackToolId: 'gateway-fallback', retryable: false, maxRetries: 0 },
      ],
    });

    const fallbackManifest: ToolManifest = ToolManifestSchema.parse({
      ...DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
      id: 'gateway-fallback',
    });

    const registry = new InMemoryToolRegistry();
    registry.register(primaryManifest);
    registry.register(fallbackManifest);

    const denyGuardian = new GuardianDecisionEngine();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, denyGuardian, writer, new ToolRateLimiter());

    gateway.registerHandler('gateway-primary', async () => {
      throw new Error('primary fails');
    });
    gateway.registerHandler('gateway-fallback', documentRetrievalHandler);

    const result = await gateway.invoke(
      'gateway-primary',
      { query: 'test' },
      { requestId: 'r-fbc-1' },
    );

    expect(result.success).toBe(false);
    expect(result.fallbackToolId).toBeUndefined();
  });

  it('fallback tool succeeds when it passes guardian and other controls', async () => {
    const fallbackManifest: ToolManifest = ToolManifestSchema.parse({
      ...DOCUMENT_RETRIEVAL_TOOL_MANIFEST,
      id: 'ctrl-fallback',
    });

    const primaryManifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'ctrl-primary',
      failureModes: [
        { type: 'error', fallbackToolId: 'ctrl-fallback', retryable: false, maxRetries: 0 },
      ],
    });

    const registry = new InMemoryToolRegistry();
    registry.register(primaryManifest);
    registry.register(fallbackManifest);

    const guardian = makeAllowGuardian();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());

    gateway.registerHandler('ctrl-primary', async () => {
      throw new Error('primary fails');
    });
    gateway.registerHandler('ctrl-fallback', documentRetrievalHandler);

    const result = await gateway.invoke(
      'ctrl-primary',
      { query: 'lease' },
      { requestId: 'r-fbc-2' },
    );
    expect(result.success).toBe(true);
    expect(result.fallbackToolId).toBe('ctrl-fallback');
  });

  it('fallback stops at MAX_FALLBACK_DEPTH to prevent infinite loops', async () => {
    const manifest: ToolManifest = ToolManifestSchema.parse({
      ...GRAPH_QUERY_TOOL_MANIFEST,
      id: 'looping-tool',
      failureModes: [
        { type: 'error', fallbackToolId: 'looping-tool', retryable: false, maxRetries: 0 },
      ],
    });

    const registry = new InMemoryToolRegistry();
    registry.register(manifest);

    const guardian = makeAllowGuardian();
    const store = new InMemoryTraceStore();
    const writer = new TraceWriter(store);
    const gateway = new ToolMeshGateway(registry, guardian, writer, new ToolRateLimiter());
    gateway.registerHandler('looping-tool', async () => {
      throw new Error('always fails');
    });

    const result = await gateway.invoke(
      'looping-tool',
      { query: 'loop' },
      { requestId: 'r-loop-1' },
    );
    expect(result.success).toBe(false);
  }, 10000);
});
