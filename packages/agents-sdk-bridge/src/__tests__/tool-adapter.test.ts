import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SzlToolAdapter, adaptToolManifest } from '../tool-adapter.js';
import { defaultToolRegistry, type ToolManifest } from '@workspace/tool-mesh';

function makeManifest(overrides: Partial<ToolManifest> = {}): ToolManifest {
  return {
    id: 'test-tool',
    name: 'Test Tool',
    version: '1.0.0',
    description: 'A test tool for unit testing',
    domainTags: ['analytics'],
    policyTier: 'internal-workflow',
    allowedEnvironments: ['development', 'staging', 'production'],
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The query' },
      },
      required: ['query'],
    },
    outputSchema: undefined,
    rateLimits: {},
    timeoutMs: 30000,
    failureModes: [],
    approvalRequired: false,
    observabilityHooks: {
      emitTrace: true,
      emitMetrics: true,
      sensitiveFields: [],
    },
    enabled: true,
    ...overrides,
  };
}

function makeMockGateway(output: unknown = 'tool result', success = true) {
  return {
    invoke: vi
      .fn()
      .mockResolvedValue({ success, output, error: success ? undefined : String(output) }),
  };
}

describe('SzlToolAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('adaptToolManifest', () => {
    it('converts a manifest to a SDK FunctionTool with correct name (hyphens → underscores per SDK) and description', () => {
      const manifest = makeManifest();
      const gateway = makeMockGateway('result');

      const tool = adaptToolManifest(manifest, gateway as any);

      expect(tool.type).toBe('function');
      // The SDK's tool() normalizes hyphens to underscores in function names
      // (OpenAI API requirement: function names must match ^[a-zA-Z0-9_-]{1,64}$,
      // but the SDK also replaces hyphens for compatibility)
      expect(tool.name).toBe('test_tool');
      expect(tool.description).toBe('A test tool for unit testing');
    });

    it('generates a valid JSON Schema from the manifest inputSchema', () => {
      const manifest = makeManifest({
        inputSchema: {
          type: 'object',
          properties: {
            vessel: { type: 'string' },
            limit: { type: 'number' },
          },
          // Both fields required so SDK strict mode doesn't require nullable for optional fields
          required: ['vessel', 'limit'],
        },
      });

      const gateway = makeMockGateway('ok');
      const tool = adaptToolManifest(manifest, gateway as any);

      const params = tool.parameters as any;
      expect(params.type).toBe('object');
      expect(params.properties).toHaveProperty('vessel');
      expect(params.properties).toHaveProperty('limit');
      expect(params.required).toContain('vessel');
    });

    it('invokes the gateway with parsed JSON input', async () => {
      const gateway = makeMockGateway('vessel data');
      const manifest = makeManifest({
        id: 'maritime_data',
        inputSchema: {
          type: 'object',
          properties: {
            vessel: { type: 'string', description: 'Vessel IMO number' },
          },
          required: ['vessel'],
        },
      });
      const tool = adaptToolManifest(manifest, gateway as any, { agentId: 'helmsman' });

      const result = await tool.invoke({} as any, '{"vessel":"IMO1234"}');

      expect(gateway.invoke).toHaveBeenCalledWith(
        'maritime_data',
        expect.objectContaining({ vessel: 'IMO1234' }),
        expect.objectContaining({ agentId: 'helmsman' }),
      );
      expect(result).toBe('vessel data');
    });

    it('returns an error string when the gateway fails (SDK error function converts throws to strings)', async () => {
      const gateway = makeMockGateway('rate limited', false);
      const manifest = makeManifest({
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The query' },
          },
          required: ['query'],
        },
      });
      const tool = adaptToolManifest(manifest, gateway as any);

      // The SDK's default toolErrorFunction catches errors from execute() and returns
      // them as a string (rather than re-throwing), so the invoke() resolves — not rejects.
      const result = await tool.invoke({} as any, '{"query":"test"}');
      expect(result).toContain('rate limited');
    });

    it('stringifies non-string output from the gateway', async () => {
      const gateway = makeMockGateway({ count: 42 });
      const manifest = makeManifest({
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The query' },
          },
          required: ['query'],
        },
      });
      const tool = adaptToolManifest(manifest, gateway as any);

      const result = await tool.invoke({} as any, '{"query":"test"}');
      expect(result).toBe('{"count":42}');
    });

    it('sets needsApproval based on manifest.approvalRequired', async () => {
      const manifest = makeManifest({ approvalRequired: true });
      const gateway = { invoke: vi.fn() };
      const tool = adaptToolManifest(manifest, gateway as any);

      const needsApproval = await tool.needsApproval({} as any, {} as any);
      expect(needsApproval).toBe(true);
    });
  });

  describe('SzlToolAdapter.adaptByIds', () => {
    it('logs a warning and returns empty array for unknown tool IDs', () => {
      const gateway = makeMockGateway();
      const adapter = new SzlToolAdapter({ gateway: gateway as any });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = adapter.adaptByIds(['nonexistent-tool-xyz']);
      expect(result).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent-tool-xyz'));

      warnSpy.mockRestore();
    });

    it('returns adapted tools for registered manifests', () => {
      const gateway = makeMockGateway();
      const manifest = makeManifest({ id: 'known_tool_123' });
      defaultToolRegistry.register(manifest);

      const adapter = new SzlToolAdapter({ gateway: gateway as any });
      const tools = adapter.adaptByIds(['known_tool_123']);

      expect(tools).toHaveLength(1);
      // SDK normalizes hyphens → underscores; already underscored IDs remain as-is
      expect(tools[0].name).toBe('known_tool_123');

      defaultToolRegistry.unregister('known_tool_123');
    });
  });

  describe('SzlToolAdapter.adaptAll', () => {
    it('returns a list of adapted tools', () => {
      const gateway = makeMockGateway();
      const adapter = new SzlToolAdapter({ gateway: gateway as any });
      const manifests = [
        makeManifest({ id: 'tool_a', name: 'Tool A', description: 'Alpha tool' }),
        makeManifest({ id: 'tool_b', name: 'Tool B', description: 'Beta tool' }),
      ];

      const tools = adapter.adaptAll(manifests);

      expect(tools).toHaveLength(2);
      expect(tools.map((t) => t.name)).toContain('tool_a');
      expect(tools.map((t) => t.name)).toContain('tool_b');
    });
  });
});
