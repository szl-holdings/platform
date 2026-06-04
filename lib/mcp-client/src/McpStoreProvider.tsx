/**
 * McpStoreProvider
 *
 * React context provider for the SZL MCP client layer. Manages server
 * registry, connection health, and tool invocation. Tool calls to the native
 * Alloy server now use the official `@modelcontextprotocol/sdk` Client via
 * `SdkMcpClientAdapter` (Streamable HTTP transport, MCP 2025). External
 * servers fall back to a lightweight JSON-RPC fetch path.
 *
 * Public interface (hooks, types) is unchanged — callers need no migration.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  type McpConnectionState,
  type McpDomain,
  type McpServerConfig,
  type McpTool,
  type McpToolResult,
  BUILT_IN_MCP_TOOLS,
  DOMAIN_TOOLS,
} from './types';
import { clearSdkMcpAdapterCache, getSdkMcpAdapter } from './sdk-client';

// ─── Context shape (public API — unchanged) ───────────────────────────────────

interface McpStoreContextValue {
  servers: McpServerConfig[];
  connections: Record<string, McpConnectionState>;
  toolCatalog: McpTool[];
  addServer: (config: McpServerConfig) => void;
  removeServer: (id: string) => void;
  testConnection: (config: McpServerConfig) => Promise<boolean>;
  getToolsForDomain: (domain: McpDomain) => McpTool[];
  callTool: (
    toolName: string,
    args: Record<string, unknown>,
    serverId?: string,
  ) => Promise<McpToolResult>;
  isEnabled: boolean;
  mcpBaseUrl: string;
}

const McpStoreContext = createContext<McpStoreContextValue | null>(null);

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'szl_mcp_servers';
const NATIVE_SERVER_ID = 'alloy-native';
const HF_MCP_SERVER_ID = 'huggingface-mcp';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

function loadServers(): McpServerConfig[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as McpServerConfig[]) : [];
  } catch {
    return [];
  }
}

function saveServers(servers: McpServerConfig[]): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
    }
  } catch {}
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function McpStoreProvider({
  children,
  domain,
}: {
  children: React.ReactNode;
  domain?: McpDomain;
}) {
  const baseUrl = getBaseUrl();
  const mcpBaseUrl = `${baseUrl}/api/mcp`;

  const nativeServer: McpServerConfig = {
    id: NATIVE_SERVER_ID,
    name: 'Counsel MCP Server',
    url: mcpBaseUrl,
    transport: 'http',
    description: 'Native SZL Counsel MCP server — built-in tools and enterprise capabilities',
    isNative: true,
    isConnected: true,
  };

  const hfMcpServer: McpServerConfig = {
    id: HF_MCP_SERVER_ID,
    name: 'HuggingFace MCP',
    url: `${baseUrl}/api/hf-mcp`,
    transport: 'http',
    description:
      'HuggingFace model hub — search models, datasets, papers, and spaces via MCP protocol',
    isNative: true,
    isConnected: true,
  };

  const [servers, setServers] = useState<McpServerConfig[]>(() => {
    const saved = loadServers().filter((s) => !s.isNative);
    return [nativeServer, hfMcpServer, ...saved];
  });

  const [connections, setConnections] = useState<Record<string, McpConnectionState>>({
    [NATIVE_SERVER_ID]: {
      status: 'connected',
      serverUrl: mcpBaseUrl,
      serverName: 'Counsel MCP Server',
      lastPing: new Date(),
    },
    [HF_MCP_SERVER_ID]: {
      status: 'connected',
      serverUrl: `${baseUrl}/api/hf-mcp`,
      serverName: 'HuggingFace MCP',
      lastPing: new Date(),
    },
  });

  const [toolCatalog, _setToolCatalog] = useState<McpTool[]>(BUILT_IN_MCP_TOOLS);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Health polling — now using SDK adapter ping for native server ──────────

  useEffect(() => {
    pingRef.current = setInterval(async () => {
      // Use the SDK adapter's ping() for the native server — this exercises the
      // full MCP protocol handshake path rather than a bare HTTP GET.
      const adapter = getSdkMcpAdapter(mcpBaseUrl);
      const ok = await adapter.ping().catch(() => false);

      setConnections((prev) => ({
        ...prev,
        [NATIVE_SERVER_ID]: {
          ...prev[NATIVE_SERVER_ID]!,
          status: ok ? 'connected' : 'error',
          lastPing: new Date(),
        },
      }));
    }, 30_000);

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      // Clean up SDK adapters on unmount to avoid dangling SSE connections
      clearSdkMcpAdapterCache();
    };
  }, [mcpBaseUrl]);

  // ── Server management ─────────────────────────────────────────────────────

  const addServer = useCallback((config: McpServerConfig) => {
    setServers((prev) => {
      const next = [...prev.filter((s) => s.id !== config.id), { ...config, isNative: false }];
      saveServers(next.filter((s) => !s.isNative));
      return next;
    });
    setConnections((prev) => ({
      ...prev,
      [config.id]: { status: 'connecting', serverUrl: config.url, serverName: config.name },
    }));
  }, []);

  const removeServer = useCallback((id: string) => {
    if (id === NATIVE_SERVER_ID || id === HF_MCP_SERVER_ID) return;
    setServers((prev) => {
      const next = prev.filter((s) => s.id !== id);
      saveServers(next.filter((s) => !s.isNative));
      return next;
    });
    setConnections((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const testConnection = useCallback(async (config: McpServerConfig): Promise<boolean> => {
    // For native-style servers that speak Streamable HTTP, use the SDK adapter
    if (config.transport === 'http') {
      try {
        const adapter = getSdkMcpAdapter(config.url);
        return await adapter.ping();
      } catch {
        // Fall through to legacy health-check
      }
    }
    // Legacy fallback: bare HTTP GET /health or POST tools/list
    try {
      const resp = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: {} }),
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return false;
      const body = await resp.json() as { result?: unknown; error?: unknown };
      return !body.error;
    } catch {
      return false;
    }
  }, []);

  const getToolsForDomain = useCallback(
    (d: McpDomain): McpTool[] => {
      const allowed = DOMAIN_TOOLS[d];
      if (!allowed || allowed.length === 0) return toolCatalog;
      return toolCatalog.filter((t) => allowed.includes(t.name));
    },
    [toolCatalog],
  );

  // ── Tool invocation ───────────────────────────────────────────────────────
  //
  // For the native Alloy server: use the official SDK Client via
  // SdkMcpClientAdapter — sends proper Streamable HTTP MCP 2025 traffic.
  //
  // For external servers that don't speak Streamable HTTP (or when the SDK
  // adapter fails): fall back to a direct JSON-RPC POST so legacy servers
  // remain reachable.

  const callTool = useCallback(
    async (
      toolName: string,
      args: Record<string, unknown>,
      serverId?: string,
    ): Promise<McpToolResult> => {
      const targetServerId = serverId ?? NATIVE_SERVER_ID;
      const server = servers.find((s) => s.id === targetServerId) ?? servers[0];
      if (!server) {
        return { toolName, success: false, output: null, error: 'No MCP server available' };
      }

      // ── SDK path: native or http-transport servers ───────────────────────
      if (server.transport === 'http' || server.isNative) {
        try {
          const adapter = getSdkMcpAdapter(server.url);
          const sdkResult = await adapter.callTool(toolName, args);

          if (sdkResult.isError) {
            const errorText = sdkResult.content
              .map((c) => c.text ?? JSON.stringify(c))
              .join('\n');
            return { toolName, success: false, output: null, error: errorText };
          }

          // Unwrap content — prefer parsed JSON, fall back to raw text
          const text = sdkResult.content.map((c) => c.text ?? JSON.stringify(c)).join('\n');
          let output: unknown = text;
          try {
            output = JSON.parse(text);
          } catch {
            // keep raw string
          }

          // Surface approval-pending state if encoded in the result
          if (
            output &&
            typeof output === 'object' &&
            (output as { pendingApproval?: boolean }).pendingApproval
          ) {
            const o = output as { pendingApproval: boolean; approvalId?: string; output?: unknown };
            return {
              toolName,
              success: true,
              output: o.output ?? null,
              pendingApproval: true,
              approvalId: o.approvalId,
            };
          }

          return { toolName, success: true, output };
        } catch (sdkErr) {
          // SDK call failed — fall through to raw JSON-RPC fetch fallback
          const msg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
          // If it's a hard error (not just transport), return it directly
          if (!msg.includes('fetch') && !msg.includes('network')) {
            return { toolName, success: false, output: null, error: msg };
          }
        }
      }

      // ── Fallback: raw JSON-RPC POST (external / non-streamable servers) ──
      try {
        const resp = await fetch(`${server.url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: { name: toolName, arguments: args },
          }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => 'Request failed');
          return { toolName, success: false, output: null, error: errText };
        }
        const data = (await resp.json()) as {
          result?: { content?: Array<{ text?: string }>; isError?: boolean };
          error?: { message?: string };
          pendingApproval?: boolean;
          approvalId?: string;
          output?: unknown;
        };
        if (data.error) {
          return { toolName, success: false, output: null, error: data.error.message ?? 'Error' };
        }
        if (data.pendingApproval) {
          return {
            toolName,
            success: true,
            output: data.output ?? null,
            pendingApproval: true,
            approvalId: data.approvalId,
          };
        }
        const resultContent = data.result?.content ?? [];
        const text = resultContent.map((c) => c.text ?? '').join('\n');
        let output: unknown = text;
        try {
          output = JSON.parse(text);
        } catch {
          // keep raw string
        }
        return { toolName, success: true, output };
      } catch (err) {
        return {
          toolName,
          success: false,
          output: null,
          error: err instanceof Error ? err.message : 'Tool call failed',
        };
      }
    },
    [servers],
  );

  return (
    <McpStoreContext.Provider
      value={{
        servers,
        connections,
        toolCatalog,
        addServer,
        removeServer,
        testConnection,
        getToolsForDomain,
        callTool,
        isEnabled: true,
        mcpBaseUrl,
      }}
    >
      {children}
    </McpStoreContext.Provider>
  );
}

export function useMcpStore(): McpStoreContextValue {
  const ctx = useContext(McpStoreContext);
  if (!ctx) throw new Error('useMcpStore must be used within McpStoreProvider');
  return ctx;
}
