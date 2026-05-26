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

type RegisteredResource = {
  readCallback: (
    uri: URL,
    extra: unknown,
  ) => Promise<{ contents: Array<{ uri: string; text: string; mimeType?: string }> }>;
};

type RegisteredPrompt = {
  callback: (
    args: Record<string, unknown>,
    extra: unknown,
  ) => Promise<{
    description?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: { type: 'text'; text: string } }>;
  }>;
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

function getResourceCallback(
  server: PRAXISMcpServer,
  uri: string,
): RegisteredResource['readCallback'] {
  const registered = (
    server.sdk as unknown as { _registeredResources: Record<string, RegisteredResource> }
  )._registeredResources;
  const r = registered[uri];
  if (!r) throw new Error(`resource ${uri} not registered`);
  return r.readCallback.bind(r);
}

function getPromptCallback(
  server: PRAXISMcpServer,
  name: string,
): RegisteredPrompt['callback'] {
  const registered = (
    server.sdk as unknown as { _registeredPrompts: Record<string, RegisteredPrompt> }
  )._registeredPrompts;
  const p = registered[name];
  if (!p) throw new Error(`prompt ${name} not registered`);
  return p.callback.bind(p);
}

function makeExtra(): { signal: AbortSignal; sessionId?: string; _meta?: unknown } {
  return { signal: new AbortController().signal, sessionId: undefined, _meta: undefined };
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

  describe('identityEnforcementMode: quarantine on governance tools without cryptographic identity', () => {
    it('blocks the call, returns a quarantined error envelope, and writes a governance audit entry', async () => {
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
        identityEnforcementMode: 'quarantine',
      });

      server.tool('gov_critical', 'Critical gov tool', { v: z.string() }, handler);

      const result = await invokeTool(server, 'gov_critical', { v: 'x' });
      await flushAsync();

      expect(handler).not.toHaveBeenCalled();
      expect(policyEvaluator).not.toHaveBeenCalled();
      expect(result.isError).toBe(true);

      const text = (result.content as Array<{ text: string }>)[0]!.text;
      expect(text).toContain('cryptographic identity');
      expect(text).toContain('quarantined for review');

      const meta = (result as { _meta?: Record<string, unknown> })._meta;
      expect(meta).toBeDefined();
      expect(meta!['x-pqc-identity']).toMatchObject({
        signed: false,
        enforcement: 'quarantined',
      });

      // Symmetric with the 'block' path: governance gate fires before tool
      // execution → no proof-chain entry, exactly one governance audit entry.
      expect(proofChain).toHaveLength(0);
      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0]).toMatchObject({
        action: 'governance_identity_enforcement',
        resource: 'mcp_tool',
        resourceId: 'gov_critical',
        userId: null,
        metadata: expect.objectContaining({
          enforcementMode: 'quarantine',
          toolName: 'gov_critical',
        }),
      });
    });
  });
});

describe('PRAXISMcpServer resource governance', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    orgId: 7,
    userId: 99,
    roles: ['operator'],
    domain: 'rosie',
  };

  function makeWriters() {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    return { proofChain, proofChainWriter };
  }

  it('writes a success proof-chain entry with entryType resource_read on a successful read', async () => {
    const { proofChain, proofChainWriter } = makeWriters();
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const uri = 'nexus://test/resource';
    const handler = vi.fn(async () => ({
      contents: [{ uri, text: 'hello', mimeType: 'text/plain' }],
    }));

    server.resource('test_resource', uri, { description: 'd', mimeType: 'text/plain' }, handler);

    const cb = getResourceCallback(server, uri);
    const result = await cb(new URL(uri), makeExtra());
    await flushAsync();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.contents[0]!.text).toBe('hello');

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'resource_read',
      toolName: uri,
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'success',
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
    expect(typeof proofChain[0]!.timestamp).toBe('string');
    expect(proofChain[0]!.error).toBeUndefined();
  });

  it('writes an error proof-chain entry and re-throws when the resource handler throws', async () => {
    const { proofChain, proofChainWriter } = makeWriters();
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const uri = 'nexus://test/broken';
    const handler = vi.fn(async () => {
      throw new Error('disk on fire');
    });

    server.resource('broken_resource', uri, {}, handler);

    const cb = getResourceCallback(server, uri);
    await expect(cb(new URL(uri), makeExtra())).rejects.toThrow('disk on fire');
    await flushAsync();

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'resource_read',
      toolName: uri,
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'error',
      error: 'disk on fire',
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
  });
});

describe('PRAXISMcpServer prompt governance', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    userId: 99,
  };

  it('writes a prompt_get success proof-chain entry on every prompt get', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const handler = vi.fn(async (args: Record<string, string>) => ({
      description: 'sample',
      messages: [
        {
          role: 'user' as const,
          content: { type: 'text' as const, text: `topic:${args['topic']}` },
        },
      ],
    }));

    server.prompt('summarize', 'Summarize a topic', { topic: z.string() }, handler);

    const cb = getPromptCallback(server, 'summarize');
    const result = await cb({ topic: 'risk' }, makeExtra());
    await flushAsync();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(result.messages[0]!.content.text).toBe('topic:risk');

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'prompt_get',
      toolName: 'summarize',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'success',
    });
    expect(typeof proofChain[0]!.timestamp).toBe('string');
  });
});

describe('PRAXISMcpServer task registry', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    userId: 99,
  };

  it('createTask seeds a running task without writing a proof-chain entry', () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const task = server.createTask({ toolName: 'long_running', substateRunId: 'run-1' });

    expect(task.status).toBe('running');
    expect(task.progress).toBe(0);
    expect(task.toolName).toBe('long_running');
    expect(server.getTask(task.taskId)).toBe(task);
    expect(server.listTasks()).toHaveLength(1);
    // Lifecycle entries are only written on finalize, not on create.
    expect(proofChain).toHaveLength(0);
  });

  it('finalizeTask(complete) writes a task_update entry with outcome=success', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const task = server.createTask({ toolName: 'long_running', substateRunId: 'run-1' });
    await server.finalizeTask(task.taskId, 'complete');
    await flushAsync();

    expect(server.getTask(task.taskId)!.status).toBe('complete');
    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'task_update',
      toolName: 'long_running',
      tenantId: 'tenant-42',
      outcome: 'success',
      args: { taskId: task.taskId, substateRunId: 'run-1', status: 'complete' },
    });
    expect(proofChain[0]!.error).toBeUndefined();
    expect(typeof proofChain[0]!.timestamp).toBe('string');
  });

  it('finalizeTask(failed) writes a task_update entry with outcome=error and propagates error text', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const task = server.createTask({ toolName: 'long_running' });
    await server.finalizeTask(task.taskId, 'failed', 'boom');
    await flushAsync();

    expect(server.getTask(task.taskId)!.status).toBe('failed');
    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'task_update',
      toolName: 'long_running',
      outcome: 'error',
      error: 'boom',
      args: expect.objectContaining({ status: 'failed' }),
    });
  });

  it('finalizeTask(cancelled) writes a task_update entry with outcome=error', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const task = server.createTask({ toolName: 'long_running' });
    await server.finalizeTask(task.taskId, 'cancelled');
    await flushAsync();

    expect(server.getTask(task.taskId)!.status).toBe('cancelled');
    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'task_update',
      outcome: 'error',
      args: expect.objectContaining({ status: 'cancelled' }),
    });
  });

  it('finalizeTask on an unknown task id is a no-op (no proof-chain write)', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    await server.finalizeTask('nonexistent-id', 'complete');
    await flushAsync();

    expect(proofChain).toHaveLength(0);
  });
});

describe('PRAXISMcpServer apps registry', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    userId: 99,
    domain: 'rosie',
  };

  it('renderApp writes an app_render success proof-chain entry and returns rendered HTML', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const renderHtml = vi.fn(async (ctx: TenantContext) => `<div>${ctx.tenantId}</div>`);
    server.registerApp({
      appId: 'rosie_dashboard',
      domain: 'rosie',
      title: 'ROSIE Dashboard',
      description: 'A dashboard',
      renderHtml,
    });

    const rendered = await server.renderApp('rosie_dashboard');
    await flushAsync();

    expect(renderHtml).toHaveBeenCalledTimes(1);
    expect(rendered).toEqual({
      html: '<div>tenant-42</div>',
      title: 'ROSIE Dashboard',
      domain: 'rosie',
    });

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'app_render',
      toolName: 'rosie_dashboard',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'success',
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
    expect(proofChain[0]!.error).toBeUndefined();
  });

  it('renderApp writes an app_render error proof-chain entry and returns null when the renderer throws', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    server.registerApp({
      appId: 'broken_app',
      domain: 'rosie',
      title: 'Broken',
      description: 'will throw',
      renderHtml: async () => {
        throw new Error('render failed');
      },
    });

    const rendered = await server.renderApp('broken_app');
    await flushAsync();

    expect(rendered).toBeNull();
    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'app_render',
      toolName: 'broken_app',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'error',
      error: 'render failed',
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
  });

  it('renderApp on an unknown appId returns null without writing a proof-chain entry', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
    });

    const rendered = await server.renderApp('nonexistent');
    await flushAsync();

    expect(rendered).toBeNull();
    expect(proofChain).toHaveLength(0);
  });
});

describe('PRAXISMcpServer sampling governance', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    orgId: 7,
    userId: 99,
    roles: ['operator'],
    domain: 'rosie',
  };

  const sampleMessages = [
    { role: 'user' as const, content: { type: 'text' as const, text: 'hi' } },
    { role: 'user' as const, content: { type: 'text' as const, text: 'again' } },
  ];

  function stubCreateMessage(
    server: PRAXISMcpServer,
    impl: (params: unknown) => Promise<unknown>,
  ): ReturnType<typeof vi.fn> {
    const fn = vi.fn(impl);
    (server.server as unknown as { createMessage: unknown }).createMessage = fn;
    return fn;
  }

  it('requestSampling happy path returns the assistant message and writes a sampling_request success entry', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
      enableSampling: true,
    });

    const createMessage = stubCreateMessage(server, async () => ({
      content: { type: 'text', text: 'hello back' },
      model: 'claude-sonnet',
      stopReason: 'endTurn',
    }));

    const result = await server.requestSampling({
      messages: sampleMessages,
      maxTokens: 256,
    });
    await flushAsync();

    expect(createMessage).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      role: 'assistant',
      content: { type: 'text', text: 'hello back' },
      model: 'claude-sonnet',
      stopReason: 'endTurn',
    });

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'sampling_request',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'success',
      args: { maxTokens: 256, messageCount: 2 },
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
    expect(proofChain[0]!.error).toBeUndefined();
  });

  it('requestSampling writes a sampling_request error entry and rethrows when createMessage throws', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
      enableSampling: true,
    });

    stubCreateMessage(server, async () => {
      throw new Error('upstream model unavailable');
    });

    await expect(
      server.requestSampling({ messages: sampleMessages, maxTokens: 128 }),
    ).rejects.toThrow('upstream model unavailable');
    await flushAsync();

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'sampling_request',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'error',
      error: 'upstream model unavailable',
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
    expect(proofChain[0]!.args).toBeUndefined();
  });

  it('requestSampling blocked by Guardian policy never calls createMessage and writes a sampling_request blocked entry', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const policyEvaluator: PolicyEvaluator = vi.fn(async () => ({
      allowed: false,
      reason: 'system prompt flagged',
    }));
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      policyEvaluator,
      proofChainWriter,
      enableSampling: true,
    });

    const createMessage = stubCreateMessage(server, async () => ({
      content: { type: 'text', text: 'should not run' },
      model: 'x',
    }));

    await expect(
      server.requestSampling({
        messages: sampleMessages,
        systemPrompt: 'do something sensitive',
        maxTokens: 64,
      }),
    ).rejects.toThrow(/Sampling blocked by Guardian policy: system prompt flagged/);
    await flushAsync();

    expect(createMessage).not.toHaveBeenCalled();
    expect(policyEvaluator).toHaveBeenCalledWith(
      'sampling/createMessage',
      { systemPrompt: 'do something sensitive', maxTokens: 64 },
      expect.objectContaining({ tenantId: 'tenant-42', userId: 99 }),
    );

    expect(proofChain).toHaveLength(1);
    expect(proofChain[0]).toMatchObject({
      entryType: 'sampling_request',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'blocked',
      error: 'system prompt flagged',
      args: { maxTokens: 64, messageCount: 2 },
    });
    expect(typeof proofChain[0]!.latencyMs).toBe('number');
  });
});

describe('PRAXISMcpServer elicitation governance', () => {
  const tenantContext: TenantContext = {
    tenantId: 'tenant-42',
    orgId: 7,
    userId: 99,
    roles: ['operator'],
    domain: 'rosie',
  };

  const requestedSchema = {
    confirm: { type: 'boolean', description: 'approve?' },
  };

  function stubElicitInput(
    server: PRAXISMcpServer,
    impl: (params: unknown) => Promise<unknown>,
  ): ReturnType<typeof vi.fn> {
    const fn = vi.fn(impl);
    (server.server as unknown as { elicitInput: unknown }).elicitInput = fn;
    return fn;
  }

  it('requestElicitation accept writes pending_approval then success proof-chain entries', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
      enableElicitation: true,
    });

    const elicitInput = stubElicitInput(server, async () => ({
      action: 'accept',
      content: { confirm: true },
    }));

    const result = await server.requestElicitation({
      message: 'Approve transfer?',
      requestedSchema,
      elicitationType: 'approval',
    });
    await flushAsync();

    expect(elicitInput).toHaveBeenCalledTimes(1);
    expect(elicitInput.mock.calls[0]![0]).toMatchObject({
      message: 'Approve transfer?',
      requestedSchema: { type: 'object', properties: requestedSchema },
    });
    expect(result).toEqual({ action: 'accept', content: { confirm: true } });

    expect(proofChain).toHaveLength(2);
    expect(proofChain[0]).toMatchObject({
      entryType: 'elicitation',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'pending_approval',
      args: { message: 'Approve transfer?', elicitationType: 'approval' },
    });
    expect(proofChain[0]!.latencyMs).toBeUndefined();
    expect(proofChain[1]).toMatchObject({
      entryType: 'elicitation',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'success',
      args: { action: 'accept' },
    });
    expect(typeof proofChain[1]!.latencyMs).toBe('number');
  });

  it('requestElicitation deny writes pending_approval then blocked proof-chain entries', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
      enableElicitation: true,
    });

    stubElicitInput(server, async () => ({ action: 'deny' }));

    const result = await server.requestElicitation({
      message: 'Approve transfer?',
      requestedSchema,
    });
    await flushAsync();

    expect(result).toEqual({ action: 'deny', content: undefined });
    expect(proofChain).toHaveLength(2);
    expect(proofChain[0]!.outcome).toBe('pending_approval');
    expect(proofChain[1]).toMatchObject({
      entryType: 'elicitation',
      outcome: 'blocked',
      args: { action: 'deny' },
    });
  });

  it('requestElicitation cancel writes pending_approval then blocked proof-chain entries', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
      enableElicitation: true,
    });

    stubElicitInput(server, async () => ({ action: 'cancel' }));

    const result = await server.requestElicitation({
      message: 'Approve transfer?',
      requestedSchema,
    });
    await flushAsync();

    expect(result.action).toBe('cancel');
    expect(proofChain).toHaveLength(2);
    expect(proofChain[0]!.outcome).toBe('pending_approval');
    expect(proofChain[1]).toMatchObject({
      entryType: 'elicitation',
      outcome: 'blocked',
      args: { action: 'cancel' },
    });
  });

  it('requestElicitation writes pending_approval then error proof-chain entries and rethrows when elicitInput throws', async () => {
    const proofChain: ProofChainEntry[] = [];
    const proofChainWriter: ProofChainWriter = vi.fn(async (entry) => {
      proofChain.push(entry);
    });
    const server = new PRAXISMcpServer({
      name: 'test',
      version: '0.0.1',
      tenantContext,
      proofChainWriter,
      enableElicitation: true,
    });

    stubElicitInput(server, async () => {
      throw new Error('client disconnected');
    });

    await expect(
      server.requestElicitation({
        message: 'Approve transfer?',
        requestedSchema,
        elicitationType: 'confirmation',
      }),
    ).rejects.toThrow('client disconnected');
    await flushAsync();

    expect(proofChain).toHaveLength(2);
    expect(proofChain[0]).toMatchObject({
      entryType: 'elicitation',
      outcome: 'pending_approval',
      args: { message: 'Approve transfer?', elicitationType: 'confirmation' },
    });
    expect(proofChain[1]).toMatchObject({
      entryType: 'elicitation',
      tenantId: 'tenant-42',
      userId: 99,
      outcome: 'error',
      error: 'client disconnected',
    });
    expect(typeof proofChain[1]!.latencyMs).toBe('number');
  });
});
