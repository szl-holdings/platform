/**
 * @deprecated `@szl-holdings/tool-registry` is deprecated.
 * Use `@workspace/tool-mesh` as the canonical tool registry and gateway.
 * All capabilities (schema, gateway, rate limiting, timeouts, fallbacks,
 * guardian approval, observability, MCP bridging, execution tracking)
 * are consolidated in `@workspace/tool-mesh`.
 *
 * Migration:
 *   - ToolManifest     → import from "@workspace/tool-mesh"
 *   - InMemoryToolRegistry → import from "@workspace/tool-mesh"
 *   - ToolMeshGateway  → import from "@workspace/tool-mesh"
 *   - ToolMeshExecutor → import from "@workspace/tool-mesh/executor"
 *   - ToolMeshMcpBridge → import from "@workspace/tool-mesh/mcp-bridge"
 */

export {
  toolRegistry,
  ToolRegistry,
  enforceToolCallPolicy,
} from "./registry.js";
export type {
  ToolApprovalClass,
  ToolParameter,
  ToolDefinition,
  ToolHandler,
  ToolContext,
  ToolResult,
  ToolLookup,
  ToolCallPolicyResult,
} from "./registry.js";

export {
  mcpBridge,
  McpBridge,
} from "./mcp-bridge.js";
export type {
  McpToolDefinition,
  McpCallRequest,
  McpCallResult,
  McpServerInfo,
} from "./mcp-bridge.js";

export {
  toolExecutor,
  ToolExecutor,
} from "./executor.js";
export type { ExecutionRecord, ExecuteOptions } from "./executor.js";
