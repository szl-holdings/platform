import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { type McpConnectionState, type McpDomain, type McpServerConfig, type McpTool, type McpToolResult, BUILT_IN_MCP_TOOLS, DOMAIN_TOOLS } from './types';

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

const STORAGE_KEY = 'szl_mcp_servers';
const NATIVE_SERVER_ID = 'alloy-native';
const HF_MCP_SERVER_ID = 'huggingface-mcp';

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
    return raw ? JSON.parse(raw) : [];
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
    description: 'HuggingFace model hub — search models, datasets, papers, and spaces via MCP protocol',
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

  useEffect(() => {
    pingRef.current = setInterval(() => {
      fetch(`${mcpBaseUrl}/health`, { method: 'GET' })
        .then((r) => {
          setConnections((prev) => ({
            ...prev,
            [NATIVE_SERVER_ID]: {
              ...prev[NATIVE_SERVER_ID]!,
              status: r.ok ? 'connected' : 'error',
              lastPing: new Date(),
            },
          }));
        })
        .catch(() => {
          setConnections((prev) => ({
            ...prev,
            [NATIVE_SERVER_ID]: {
              ...prev[NATIVE_SERVER_ID]!,
              status: 'error',
              lastPing: new Date(),
            },
          }));
        });
    }, 30000);
    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [mcpBaseUrl]);

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
      try {
        const rpcBody = {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: toolName, arguments: args },
        };
        const resp = await fetch(server.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/event-stream',
          },
          body: JSON.stringify(rpcBody),
          signal: AbortSignal.timeout(30000),
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => 'Request failed');
          return { toolName, success: false, output: null, error: errText };
        }
        const rpc = await resp.json() as {
          jsonrpc: string;
          result?: { content?: Array<{ type: string; text: string }>; isError?: boolean; pendingApproval?: boolean; approvalId?: string; output?: unknown };
          error?: { code: number; message: string };
        };
        if (rpc.error) {
          return { toolName, success: false, output: null, error: rpc.error.message };
        }
        const result = rpc.result ?? {};
        if (result.pendingApproval) {
          return {
            toolName,
            success: true,
            output: result.output ?? null,
            pendingApproval: true,
            approvalId: result.approvalId,
          };
        }
        if (result.isError) {
          const text = result.content?.[0]?.text ?? 'Tool error';
          return { toolName, success: false, output: null, error: text };
        }
        const contentText = result.content?.[0]?.text;
        let output: unknown = result.output ?? result;
        if (contentText) {
          try { output = JSON.parse(contentText); } catch { output = contentText; }
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
