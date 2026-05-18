import { describe, expect, it } from 'vitest';
import {
  InitializeRequestSchema,
  type InitializeResult,
  type JSONRPCRequest,
} from '@modelcontextprotocol/sdk/types.js';
import { PRAXISMcpServer } from './server.js';

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
