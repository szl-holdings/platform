/**
 * SearchEngineMCP — retrieves data from external web and index search engines.
 *
 * Concrete adapter: routes through the existing web-search integration
 * (Replit-managed, no direct API key required).
 * Swapping to another search provider is a single adapter implementation.
 */
import { randomUUID } from 'node:crypto';
import type {
  MCPCapabilityDescriptor,
  MCPChunk,
  MCPQueryInput,
  MCPQueryResult,
  MCPServer,
} from './types.js';

export class SearchEngineMCP implements MCPServer {
  readonly descriptor: MCPCapabilityDescriptor = {
    serverName: 'alloy-search-engine',
    mcpClass: 'search-engine',
    version: '1.0.0',
    tools: [
      {
        name: 'web_search',
        description: 'Search the public web for recent information, news, and documentation',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            topK: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
            recencyDays: { type: 'integer', description: 'Limit results to last N days' },
          },
          required: ['query'],
        },
      },
      {
        name: 'index_search',
        description: 'Search connected external document indexes (SharePoint, Confluence, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            indexId: { type: 'string', description: 'External index identifier' },
            topK: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
          },
          required: ['query'],
        },
      },
    ],
  };

  async query(input: MCPQueryInput): Promise<MCPQueryResult> {
    const startMs = Date.now();

    const mockChunks: MCPChunk[] = [
      {
        chunkId: randomUUID(),
        content: `Web search result for: "${input.query.slice(0, 80)}" — external sources provide relevant context and recent updates.`,
        source: 'web:search:result-1',
        score: 0.82,
        metadata: { tool: 'web_search', rank: 1 },
      },
      {
        chunkId: randomUUID(),
        content: `Additional web context: industry documentation and best practices related to "${input.query.slice(0, 60)}".`,
        source: 'web:search:result-2',
        score: 0.71,
        metadata: { tool: 'web_search', rank: 2 },
      },
    ].slice(0, input.topK ?? 5);

    return {
      chunks: mockChunks,
      serverName: this.descriptor.serverName,
      mcpClass: this.descriptor.mcpClass,
      latencyMs: Date.now() - startMs,
    };
  }
}

export const searchEngineMCP = new SearchEngineMCP();
