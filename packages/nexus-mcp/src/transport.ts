/**
 * NEXUS MCP — Transport Factories
 *
 * Convenience factories for creating SDK transports used by
 * Substrate Gateway, API server, and Tool Mesh surfaces.
 */

export { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
export { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
export { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Re-export client-side transports for mcp-client usage
export { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
export { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
