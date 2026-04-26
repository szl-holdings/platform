/**
 * @workspace/nexus-mcp — NEXUS MCP SDK Foundation
 *
 * Official @modelcontextprotocol/sdk foundation wrapped with SZL governance:
 * Guardian policy evaluation, proof chain audit writes, tenant isolation,
 * role enforcement, and the full 2025 spec innovation layer.
 *
 * Usage:
 *   import { NexusMcpServer } from '@workspace/nexus-mcp';
 *   const server = new NexusMcpServer({ name: 'my-server', version: '1.0.0' });
 *   server.rawTool('my_tool', 'description', schema, handler);
 *   await server.connect(transport);
 */

export { NexusMcpServer } from './server.js';
export type {
  TenantContext,
  GuardianPolicyResult,
  ProofChainEntry,
  PolicyEvaluator,
  ProofChainWriter,
  AuditLogger,
  NexusMcpServerConfig,
  NexusTask,
  NexusApp,
  DiscoveryEventType,
  ToolContent,
} from './server.js';
export { textContent, errorContent } from './server.js';

// Transport re-exports
export { SSEServerTransport, StdioServerTransport, StreamableHTTPServerTransport } from './transport.js';
export { SSEClientTransport, StreamableHTTPClientTransport } from './transport.js';

// Capability helpers
export { createDomainApps } from './capabilities/domain-apps.js';
export { buildTenantInstructions } from './capabilities/instructions.js';
export { buildTenantRoots } from './capabilities/roots.js';

// Re-export core SDK types consumers may need
export { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
