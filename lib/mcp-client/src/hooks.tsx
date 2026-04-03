import { useState, useCallback } from "react";
import type { McpTool, McpToolResult, McpDomain } from "./types";
import { useMcpStore } from "./McpStoreProvider";

export interface UseMcpToolsReturn {
  tools: McpTool[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<McpToolResult>;
  isLoading: boolean;
  lastResult: McpToolResult | null;
  connectionStatus: "connected" | "disconnected" | "connecting" | "error";
}

export function useMcpTools(domain: McpDomain): UseMcpToolsReturn {
  const store = useMcpStore();
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<McpToolResult | null>(null);

  const tools = store.getToolsForDomain(domain);

  const nativeConnection = store.connections["alloy-native"];
  const connectionStatus = nativeConnection?.status ?? "disconnected";

  const callTool = useCallback(async (name: string, args: Record<string, unknown>): Promise<McpToolResult> => {
    setIsLoading(true);
    try {
      const result = await store.callTool(name, args);
      setLastResult(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [store]);

  return { tools, callTool, isLoading, lastResult, connectionStatus };
}
