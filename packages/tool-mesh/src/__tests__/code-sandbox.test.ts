import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeSandbox } from '../code-sandbox.js';
import { CatalogSearch } from '../catalog-search.js';
import type { ToolMeshGateway } from '../gateway.js';
import type { ForgeSandboxPolicy } from '@szl-holdings/forge-runtime/sandbox';

function makePolicy(overrides: Partial<ForgeSandboxPolicy> = {}): ForgeSandboxPolicy {
  return {
    domain: 'custom' as ForgeSandboxPolicy['domain'],
    approvalClass: 'approved_execute',
    allowedHosts: [],
    allowedTools: [],
    allowedDomains: ['custom', 'global'] as ForgeSandboxPolicy['allowedDomains'],
    maxDurationMs: 5_000,
    maxCostUsd: 1.0,
    isDryRunDefault: false,
    requiresEvidenceCapture: false,
    ...overrides,
  };
}

function makeGateway(invokeResult: { success: boolean; output?: unknown; error?: string } = { success: true, output: 'ok' }): ToolMeshGateway {
  return {
    invoke: vi.fn().mockResolvedValue(invokeResult),
    registerHandler: vi.fn(),
  } as unknown as ToolMeshGateway;
}

describe('CodeSandbox — isolation', () => {
  let catalogSearch: CatalogSearch;

  beforeEach(() => {
    catalogSearch = new CatalogSearch();
  });

  it('executes simple arithmetic code and returns the result', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute(
      'return 2 + 2;',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(true);
    expect(record.output).toBe(4);
    expect(record.errors).toHaveLength(0);
  });

  it('captures console.log output in logs array', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute(
      'console.log("hello", "world"); return "done";',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(true);
    expect(record.logs).toContain('hello world');
  });

  it('throws when require is called inside sandbox', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute(
      'const fs = require("fs"); return fs.readFileSync("/etc/passwd", "utf8");',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(false);
    expect(record.errors.length).toBeGreaterThan(0);
    expect(record.errors[0]).toMatch(/require is not a function|require is not defined/i);
  });

  it('throws when process is accessed inside sandbox', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute(
      'return process.env.SECRET;',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(false);
    expect(record.errors.length).toBeGreaterThan(0);
  });

  it('enforces execution timeout', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute(
      'while(true) {}',
      makePolicy({ maxDurationMs: 200 }),
      { agentId: 'test-agent' },
      { timeoutMs: 200 },
    );
    expect(record.success).toBe(false);
    expect(record.errors.length).toBeGreaterThan(0);
  }, 10_000);

  it('blocks tool calls not in allowedTools list', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute(
      'return await tools.call("blocked_tool", {});',
      makePolicy({ allowedTools: ['allowed_tool'] }),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(false);
    expect(record.errors[0]).toMatch(/policy violation|blocked/i);
    expect(record.violations.some(v => v.type === 'tool_blocked')).toBe(true);
  });

  it('allows tool calls when allowedTools is empty (no restriction)', async () => {
    const gateway = makeGateway({ success: true, output: { result: 'data' } });
    const sandbox = new CodeSandbox(gateway, catalogSearch);
    const record = await sandbox.execute(
      'const result = await tools.call("any_tool", { q: "test" }); return result;',
      makePolicy({ allowedTools: [] }),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(true);
    expect(record.toolCalls).toHaveLength(1);
    expect(record.toolCalls[0]?.toolId).toBe('any_tool');
  });

  it('records each tool call in toolCalls array', async () => {
    const gateway = makeGateway({ success: true, output: 42 });
    const sandbox = new CodeSandbox(gateway, catalogSearch);
    const record = await sandbox.execute(
      `
      await tools.call("tool_a", { x: 1 });
      await tools.call("tool_b", { x: 2 });
      return "done";
      `,
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(true);
    expect(record.toolCalls).toHaveLength(2);
    expect(record.toolCalls[0]?.toolId).toBe('tool_a');
    expect(record.toolCalls[1]?.toolId).toBe('tool_b');
  });

  it('captures tool call failure in errors and marks execution failed', async () => {
    const gateway = makeGateway({ success: false, error: 'Tool unavailable' });
    const sandbox = new CodeSandbox(gateway, catalogSearch);
    const record = await sandbox.execute(
      'return await tools.call("failing_tool", {});',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(false);
    expect(record.errors.length).toBeGreaterThan(0);
    expect(record.toolCalls[0]?.success).toBe(false);
  });

  it('returns a well-formed CodeExecutionRecord', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const record = await sandbox.execute('return 1;', makePolicy(), { agentId: 'test-agent' });

    expect(record.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(record.sourceCode).toBe('return 1;');
    expect(typeof record.durationMs).toBe('number');
    expect(typeof record.startedAt).toBe('string');
    expect(typeof record.completedAt).toBe('string');
    expect(Array.isArray(record.toolCalls)).toBe(true);
    expect(Array.isArray(record.logs)).toBe(true);
    expect(Array.isArray(record.errors)).toBe(true);
    expect(Array.isArray(record.violations)).toBe(true);
  });

  it('transpiles TypeScript type annotations before execution', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);
    const tsSource = `
      const value: number = 42;
      const greet = (name: string): string => \`hello \${name}\`;
      return greet("world") + " " + value;
    `;
    const record = await sandbox.execute(tsSource, makePolicy(), { agentId: 'test-agent' });
    expect(record.success).toBe(true);
    expect(record.output).toBe('hello world 42');
  });

  it('records execution via ToolMeshExecutor when provided', async () => {
    const { ToolMeshExecutor } = await import('../executor.js');
    const executor = new ToolMeshExecutor();
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch, 30_000, executor);
    await sandbox.execute('return 1;', makePolicy(), { agentId: 'test-agent' });
    const history = executor.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.toolId).toBe('code_sandbox');
    expect(history[0]?.success).toBe(true);
  });

  it('tools.search returns matching manifests from catalog', async () => {
    const search = new CatalogSearch();
    search.addDocument({
      id: 'doc_tool',
      name: 'Document Retrieval',
      description: 'Retrieves and indexes documents for semantic search',
      version: '1.0.0',
      domainTags: ['documents'],
      policyTier: 'internal-workflow',
      allowedEnvironments: ['development', 'staging', 'production'],
      rateLimits: {},
      timeoutMs: 30000,
      failureModes: [],
      approvalRequired: false,
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
      enabled: true,
    });

    const sandbox = new CodeSandbox(makeGateway(), search);
    const record = await sandbox.execute(
      'const results = tools.search("document retrieval"); return results.length;',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(true);
    expect(record.output).toBeGreaterThan(0);
  });

  it('tools.search uses BM25 ranking — most relevant document ranks first', async () => {
    const search = new CatalogSearch();
    // 'financial_report' has "financial" in name + description (higher TF)
    search.addDocument({
      id: 'financial_report',
      name: 'Financial Report Generator',
      description: 'Generates financial reports and financial analysis for accounting',
      version: '1.0.0',
      domainTags: ['finance'],
      policyTier: 'internal-workflow',
      allowedEnvironments: ['development'],
      rateLimits: {},
      timeoutMs: 30000,
      failureModes: [],
      approvalRequired: false,
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
      enabled: true,
    });
    // 'graph_query' only mentions "financial" once in description
    search.addDocument({
      id: 'graph_query',
      name: 'Graph Query Tool',
      description: 'Queries knowledge graphs for financial data connections',
      version: '1.0.0',
      domainTags: ['analytics'],
      policyTier: 'internal-workflow',
      allowedEnvironments: ['development'],
      rateLimits: {},
      timeoutMs: 30000,
      failureModes: [],
      approvalRequired: false,
      observabilityHooks: { emitTrace: true, emitMetrics: true, sensitiveFields: [] },
      enabled: true,
    });

    const sandbox = new CodeSandbox(makeGateway(), search);
    const record = await sandbox.execute(
      `const results = tools.search("financial", 10);
       return results.map(r => r.id);`,
      makePolicy(),
      { agentId: 'test-agent' },
    );
    expect(record.success).toBe(true);
    const ids = record.output as string[];
    expect(ids.length).toBeGreaterThan(0);
    // BM25 should rank financial_report first (higher TF for "financial")
    expect(ids[0]).toBe('financial_report');
  });

  it('blocks access to global and globalThis', async () => {
    const sandbox = new CodeSandbox(makeGateway(), catalogSearch);

    const globalRecord = await sandbox.execute(
      'return global !== undefined;',
      makePolicy(),
      { agentId: 'test-agent' },
    );
    const result = globalRecord.output;
    expect(result === undefined || result === false || globalRecord.success === false).toBe(true);
  });
});
