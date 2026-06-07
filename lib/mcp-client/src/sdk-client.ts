/**
 * SdkMcpClientAdapter
 *
 * A thin browser-safe wrapper around the official `@modelcontextprotocol/sdk`
 * Client class. It lazily establishes a Streamable HTTP (MCP 2025) session to
 * the Alloy API server's `/api/mcp` endpoint on the first tool call, caches
 * the connection for the duration of the session, and tears it down when the
 * adapter is explicitly closed.
 *
 * This adapter preserves the simple `callTool(name, args)` → `McpCallResult`
 * interface used by McpStoreProvider so the React layer needs no changes.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface SdkToolCallResult {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
}

export interface SdkClientOptions {
  /** Base URL of the Alloy MCP endpoint, e.g. `https://host.replit.dev/api/mcp` */
  serverUrl: string;
  /** Client name reported during MCP initialize handshake */
  clientName?: string;
  /** Client version reported during MCP initialize handshake */
  clientVersion?: string;
  /** Request timeout in milliseconds (default: 30 000) */
  timeoutMs?: number;
}

/**
 * Lazily-initialized MCP SDK client for browser use.
 * One instance per MCP server; re-connects automatically if the transport closes.
 */
export class SdkMcpClientAdapter {
  private readonly opts: Required<SdkClientOptions>;
  private client: Client | null = null;
  private connectPromise: Promise<void> | null = null;

  constructor(opts: SdkClientOptions) {
    this.opts = {
      serverUrl: opts.serverUrl,
      clientName: opts.clientName ?? 'szl-mcp-client',
      clientVersion: opts.clientVersion ?? '2.0.0',
      timeoutMs: opts.timeoutMs ?? 30_000,
    };
  }

  /** Lazily initialise the SDK Client and perform the MCP handshake. */
  private async ensureConnected(): Promise<Client> {
    if (this.client) return this.client;
    if (this.connectPromise) {
      await this.connectPromise;
      return this.client!;
    }

    this.connectPromise = this._connect();
    await this.connectPromise;
    this.connectPromise = null;
    return this.client!;
  }

  private async _connect(): Promise<void> {
    const transport = new StreamableHTTPClientTransport(new URL(this.opts.serverUrl));

    const client = new Client({
      name: this.opts.clientName,
      version: this.opts.clientVersion,
    });

    transport.onclose = () => {
      // Clear the cached client so the next call triggers a fresh connection
      this.client = null;
    };

    await client.connect(transport);
    this.client = client;
  }

  /**
   * Call a tool via the official SDK Client.
   * Equivalent to the MCP `tools/call` JSON-RPC method.
   */
  async callTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<SdkToolCallResult> {
    const client = await this.ensureConnected();

    const result = await client.callTool(
      { name: toolName, arguments: args },
      undefined,
      { timeout: this.opts.timeoutMs },
    );

    return {
      content: result.content as SdkToolCallResult['content'],
      isError: result.isError as boolean | undefined,
    };
  }

  /**
   * List all tools available on the server.
   * Useful for probing the server's tool surface without calling a specific tool.
   */
  async listTools(): Promise<Array<{ name: string; description: string }>> {
    const client = await this.ensureConnected();
    const result = await client.listTools();
    return result.tools.map((t) => ({ name: t.name, description: t.description ?? '' }));
  }

  /**
   * Perform an MCP health check by calling `ping`.
   * Returns `true` if the server responded within the timeout.
   */
  async ping(): Promise<boolean> {
    try {
      const client = await this.ensureConnected();
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }

  /** Gracefully close the transport and release resources. */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // Ignore close errors — the connection may already be dead
      }
      this.client = null;
    }
  }
}

/**
 * Singleton adapter map: one adapter per server URL so multiple React trees
 * sharing the same server URL reuse the same underlying SDK Client session.
 */
const adapterCache = new Map<string, SdkMcpClientAdapter>();

export function getSdkMcpAdapter(serverUrl: string): SdkMcpClientAdapter {
  const existing = adapterCache.get(serverUrl);
  if (existing) return existing;
  const adapter = new SdkMcpClientAdapter({ serverUrl });
  adapterCache.set(serverUrl, adapter);
  return adapter;
}

/** Clear the singleton cache (useful for testing or logout flows). */
export function clearSdkMcpAdapterCache(): void {
  for (const adapter of adapterCache.values()) {
    void adapter.close();
  }
  adapterCache.clear();
}
