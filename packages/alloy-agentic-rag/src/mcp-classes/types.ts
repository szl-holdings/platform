/**
 * Shared types for MCP Server Classes.
 */
import type { MCPClass } from '@szl-holdings/contracts/agentic-rag';

export interface MCPCapabilityDescriptor {
  serverName: string;
  mcpClass: MCPClass;
  version: string;
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface MCPQueryInput {
  query: string;
  topK?: number;
  filters?: Record<string, unknown>;
  namespace?: string;
}

export interface MCPChunk {
  chunkId: string;
  content: string;
  source: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface MCPQueryResult {
  chunks: MCPChunk[];
  serverName: string;
  mcpClass: MCPClass;
  latencyMs: number;
  metadata?: Record<string, unknown>;
}

export interface MCPServer {
  descriptor: MCPCapabilityDescriptor;
  query(input: MCPQueryInput): Promise<MCPQueryResult>;
}
