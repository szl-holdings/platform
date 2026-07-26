/**
 * @workspace/nexus-mcp — PRAXIS MCP SDK Foundation
 *
 * Official @modelcontextprotocol/sdk foundation wrapped with SZL governance:
 * Guardian policy evaluation, proof chain audit writes, tenant isolation,
 * role enforcement, and the full 2025 spec innovation layer.
 *
 * Usage:
 *   import { PRAXISMcpServer } from '@workspace/nexus-mcp';
 *   const server = new PRAXISMcpServer({ name: 'my-server', version: '1.0.0' });
 *   server.rawTool('my_tool', 'description', schema, handler);
 *   await server.connect(transport);
 */

export { Client as McpClient } from '@modelcontextprotocol/sdk/client/index.js';
// Re-export core SDK types consumers may need
export { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// Capability helpers
export { createDomainApps } from './capabilities/domain-apps.js';
export { buildTenantInstructions } from './capabilities/instructions.js';
export { buildTenantRoots } from './capabilities/roots.js';
export type {
  AuditLogger,
  DiscoveryEventType,
  GuardianPolicyResult,
  PolicyEvaluator,
  PRAXISApp,
  PRAXISMcpServerConfig,
  PRAXISTask,
  ProofChainEntry,
  ProofChainWriter,
  TenantContext,
  ToolContent,
} from './server.js';
export {
  errorContent,
  evaluateGuardianPolicyFailClosed,
  PRAXISMcpServer,
  textContent,
} from './server.js';
// Transport re-exports
export {
  SSEClientTransport,
  SSEServerTransport,
  StdioServerTransport,
  StreamableHTTPClientTransport,
  StreamableHTTPServerTransport,
} from './transport.js';
