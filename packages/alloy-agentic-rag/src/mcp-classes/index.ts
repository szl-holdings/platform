/**
 * MCP Server Class taxonomy for the Alloy Agentic RAG platform.
 *
 * Three named server classes:
 *   LocalDataMCP    — structured/unstructured data local to the platform
 *                     (PostgreSQL/Drizzle, embeddings, knowledge graphs)
 *   SearchEngineMCP — web and external index search
 *   CloudEngineMCP  — cloud infrastructure APIs (S3, status pages, cloud metrics)
 *
 * Each class exposes a typed CapabilityDescriptor and a standard `query`
 * method. Adding a new class is a single file + registry entry.
 */
export * from './local-data-mcp.js';
export * from './search-engine-mcp.js';
export * from './cloud-engine-mcp.js';
export * from './types.js';
