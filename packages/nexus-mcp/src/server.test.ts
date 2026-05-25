import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  InitializeRequestSchema,
  type CallToolResult,
  type InitializeResult,
  type JSONRPCRequest,
} from '@modelcontextprotocol/sdk/types.js';
import {
  PRAXISMcpServer,
  type AuditLogger,
  type PolicyEvaluator,
  type ProofChainEntry,
  type ProofChainWriter,
  type TenantContext,
} from './server.js';

type RegisteredTool = {
  handler: (
    args: Record<string, unknown>,
    extra: unknown,
  ) => Promise<CallToolResult>;
};

function getToolHandler(
  server: PRAXISMcpServer,
  name: string,
): RegisteredTool['handler'] {
  const registered = (
    server.sdk as unknown as { _registeredTools: Record<string, RegisteredTool> }
  )._registeredTools;
  const tool = registered[name];
  if (!tool) throw new Error(`tool ${name} not registered`);
  return tool.handler.bind(tool);
}

async function invokeTool(
  server: PRAXISMcpServer,
  name: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const cb = getToolHandler(server, name);
  return cb(args, { signal: new AbortController().signal });
}

/**
 * The governance wrappers fire proof-chain and audit writes via `void`
 * (intentionally — they must never block the tool response). Flush the
 * microtask queue so awaiting writers settle before assertions.
 */
async function flushAsync(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

type RequestHandler = (
  request: unknown,
  extra: { signal: AbortSignal; sessionId?: string; _meta?: unknown },
) => Promise<unknown>;

function makeInitializeRequest(clientCapabilities: Record<string, unknown>): JSONRPCRequest {
  return {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: clientCapabilities,
      clientInfo: { name: 'test-client', version: '0.0.0' },
    },
  };
}

function getInitializeHandler(server: PRAXISMcpServer): RequestHandler {
  const handlers = (
    server.server as unknown as { _requestHandlers: Map<string, RequestHandler> }
  )._requestHandlers;
  const handler = handlers.get('initialize');
  if (!handler) throw new Error('initialize handler not registered');
  return handler;
}

async function invokeInitialize(
  server: PRAXISMcpServer,
  clientCapabilities: Record<string, unknown>,
): Promise<InitializeResult> {
  const handler = getInitializeHandler(server);
  const raw = makeInitializeRequest(clientCapabilities);
  const parsed = InitializeRequestSchema.parse(raw);
  const controller = new AbortController();
  const result = (await handler(parsed, {
    signal: controller.signal,
    sessionId: undefined,
    _meta: undefined,
  })) as InitializeResult;
  return result;
}

describe('PRAXISMcpServer extension negotiation', () => {
  const advertised = {
    'x-szl-proof-chain': { version: '1' },
    'x-szl-guardian': { version: '2' },
  };

  it('intersects client-requested extensions with the server-advertised set', async () => {
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      extensions: advertised,
    });

    const result = await invokeInitialize(server, {
      extensions: { 'x-szl-proof-chain': {} },
    });

    expect(result.extensions).toEqual({
      'x-szl-proof-chain': advertised['x-szl-proof-chain'],
    });
    expect(result.protocolVersion).toBeDefined();
    expect(result.capabilities).toBeDefined();
  });

  it('omits unknown extensions the server does not advertise', async () => {
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      extensions: advertised,
    });

    const result = await invokeInitialize(server, {
      extensions: {
        'x-szl-proof-chain': {},
        'x-unknown-extension': { foo: 'bar' },
      },
    });

    expect(result.extensions).toEqual({
      'x-szl-proof-chain': advertised['x-szl-proof-chain'],
    });
    expect((result.extensions as Record<string, unknown>)['x-unknown-extension']).toBeUndefined();
  });

  it('returns the base initialize result unchanged when the client advertises no extensions', async () => {
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      extensions: advertised,
    });

    const result = await invokeInitialize(server, {});

    expect((result as Record<string, unknown>).extensions).toBeUndefined();
    expect(result.protocolVersion).toBeDefined();
    expect(result.capabilities).toBeDefined();
    expect(result.serverInfo).toBeDefined();
  });
});

describe('PRAXISMcpServer governance middleware', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    orgId: 7,
    userId: 99,
    roles: ['operator'],
    domain: 'rosie',
  };

  function makeWriters() {
    const proofChain: ProofChainEntry[] = [];
    const auditEntries: Parameters<AuditLogger>[0][] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const auditLogger: AuditLogger = vi.fn(async (entry) => {
      auditEntries.push(entry);
    });
    return { proofChain, auditEntries, proofChainWriter, auditLogger };
  }

  describe('Guardian policy denial', () => {
    it('short-circuits .tool() handlers, returns an error envelope, and writes a blocked proof-chain entry', async () => {
      const { proofChain, auditEntries, proofChainWriter, auditLogger } = makeWriters();
      const handler = vi.fn(async () => ({
        content: [{ type: 'text' as const, text: 'should-not-run' }],
      }));
      const policyEvaluator: PolicyEvaluator = vi.fn(async () => ({
        allowed: false,
        reason: 'tenant not entitled',
      }));

      const server = new PRAXISMcpServer({
        name: 'test',
        version: '0.0.1',
        tenantContext,
        policyEvaluator,
        proofChainWriter,
        auditLogger,
      });

      server.tool(
        'sensitive_op',
        'Performs a sensitive op',
        { value: z.string() },
        handler,
      );

      const result = await invokeTool(server, 'sensitive_op', { value: 'x' });
      await flushAsync();

      expect(handler).not.toHaveBeenCalled();
      expect(policyEvaluator).toHaveBeenCalledWith(
        'sensitive_op',
        { value: 'x' },
        expect.objectContaining({ tenantId: 'tenant-42', userId: 99 }),
      );
      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ text: string }>)[0]!.text;
      expect(text).toContain('Tool blocked by policy');
      expect(text).toContain('tenant not entitled');

      // Exactly one proof-chain write, marked blocked, with policy reason.
      expect(proofChain).toHaveLength(1);
      expect(proofChain[0]).toMatchObject({
        entryType: 'tool_call',
        toolName: 'sensitive_op',
        tenantId: 'tenant-42',
        userId: 99,
        outcome: 'blocked',
        error: 'tenant not entitled',
      });
      expect(typeof proofChain[0]!.latencyMs).toBe('number');
      expect(typeof proofChain[0]!.timestamp).toBe('string');

      // Policy denial returns before the audit-log write — no audit entry expected.
      expect(auditEntries).toHaveLength(0);
    });

    it('short-circuits .rawTool() handlers identically', async () => {
      const { proofChain, auditEntries, proofChainWriter, auditLogger } = makeWriters();
      const handler = vi.fn(async () => ({ ok: true }));
      const policyEvaluator: PolicyEvaluator = vi.fn(async () => ({
        allowed: false,
        reason: 'denied by guardian',
      }));

      const server = new PRAXISMcpServer({
        name: 'test',
        version: '0.0.1',
        tenantContext,
        policyEvaluator,
        proofChainWriter,
        auditLogger,
      });

      server.rawTool(
        'raw_sensitive',
        'raw sensitive',
        { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
        handler,
      );

      const result = await invokeTool(server, 'raw_sensitive', { name: 'x' });
      await flushAsync();

      expect(handler).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);
      expect((result.content as Array<{ text: string }>)[0]!.text).toContain('denied by guardian');
      expect(proofChain).toHaveLength(1);
      expect(proofChain[0]!.outcome).toBe('blocked');
      expect(auditEntries).toHaveLength(0);
    });
  });

  describe('Successful tool call', () => {
    it('writes both a proof-chain success entry and an audit-log entry with the expected fields', async () => {
      const { proofChain, auditEntries, proofChainWriter, auditLogger } = makeWriters();
      const policyEvaluator: PolicyEvaluator = vi.fn(async () => ({ allowed: true }));
      const handler = vi.fn(async (args: { value: string }) => ({
        content: [{ type: 'text' as const, text: `got:${args.value}` }],
      }));

      const server = new PRAXISMcpServer({
        name: 'test',
        version: '0.0.1',
        tenantContext,
        policyEvaluator,
        proofChainWriter,
        auditLogger,
      });

      server.tool('do_thing', 'Does a thing', { value: z.string() }, handler);

      const result = await invokeTool(server, 'do_thing', { value: 'hello' });
      await flushAsync();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(result.isError).toBeUndefined();
      expect((result.content as Array<{ text: string }>)[0]!.text).toBe('got:hello');

      expect(proofChain).toHaveLength(1);
      expect(proofChain[0]).toMatchObject({
        entryType: 'tool_call',
        toolName: 'do_thing',
        tenantId: 'tenant-42',
        userId: 99,
        args: { value: 'hello' },
        outcome: 'success',
      });
      expect(proofChain[0]!.error).toBeUndefined();
      expect(typeof proofChain[0]!.latencyMs).toBe('number');

      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0]).toMatchObject({
        action: 'mcp_tool_invoke',
        resource: 'mcp_tool',
        resourceId: 'do_thing',
        description: 'MCP tool invocation: do_thing',
        userId: 99,
        metadata: expect.objectContaining({
          toolName: 'do_thing',
          args: { value: 'hello' },
          outcome: 'success',
        }),
      });
      expect(typeof (auditEntries[0]!.metadata as { latencyMs: number }).latencyMs).toBe('number');
    });
  });

  describe('identityEnforcementMode: block on governance tools without cryptographic identity', () => {
    it('blocks the call, returns an error envelope with x-pqc-identity meta, and writes a governance audit entry', async () => {
      const { proofChain, auditEntries, proofChainWriter, auditLogger } = makeWriters();
      const handler = vi.fn(async () => ({
        content: [{ type: 'text' as const, text: 'should-not-run' }],
      }));
      const policyEvaluator: PolicyEvaluator = vi.fn(async () => ({ allowed: true }));

      const server = new PRAXISMcpServer({
        name: 'test',
        version: '0.0.1',
        tenantContext,
        policyEvaluator,
        proofChainWriter,
        auditLogger,
        governanceTools: ['gov_critical'],
        identityEnforcementMode: 'block',
        // cryptographicIdentity intentionally omitted
      });

      server.tool('gov_critical', 'Critical gov tool', { v: z.string() }, handler);

      const result = await invokeTool(server, 'gov_critical', { v: 'x' });
      await flushAsync();

      expect(handler).not.toHaveBeenCalled();
      expect(policyEvaluator).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);

      const text = (result.content as Array<{ text: string }>)[0]!.text;
      expect(text).toContain('cryptographic identity');
      expect(text).toContain('gov_critical');

      const meta = (result as { _meta?: Record<string, unknown> })._meta;
      expect(meta).toBeDefined();
      expect(meta!['x-pqc-identity']).toMatchObject({
        signed: false,
        enforcement: 'blocked',
      });

      // The enforcement path writes an audit entry but does NOT write a
      // proof-chain entry (governance gate fires before any tool execution).
      expect(proofChain).toHaveLength(0);
      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0]).toMatchObject({
        action: 'governance_identity_enforcement',
        resource: 'mcp_tool',
        resourceId: 'gov_critical',
        userId: null,
        metadata: expect.objectContaining({
          enforcementMode: 'block',
          toolName: 'gov_critical',
        }),
      });
    });

    it('allows non-governance tools to proceed even when no identity is configured', async () => {
      const { proofChain, proofChainWriter, auditLogger } = makeWriters();
      const handler = vi.fn(async () => ({
        content: [{ type: 'text' as const, text: 'ok' }],
      }));

      const server = new PRAXISMcpServer({
        name: 'test',
        version: '0.0.1',
        tenantContext,
        proofChainWriter,
        auditLogger,
        governanceTools: ['some_other_tool'],
        identityEnforcementMode: 'block',
      });

      server.tool('regular_tool', 'regular', {}, handler);

      const result = await invokeTool(server, 'regular_tool', {});
      await flushAsync();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(result.isError).toBeUndefined();
      expect(proofChain).toHaveLength(1);
      expect(proofChain[0]!.outcome).toBe('success');
    });
  });
});
