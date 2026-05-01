/**
 * Unit tests for the three MCP server class adapters.
 */
import { describe, it, expect } from 'vitest';
import { LocalDataMCP } from '../mcp-classes/local-data-mcp.js';
import { SearchEngineMCP } from '../mcp-classes/search-engine-mcp.js';
import { CloudEngineMCP } from '../mcp-classes/cloud-engine-mcp.js';

const QUERY = 'What are the latest security incidents?';

describe('MCP Server Classes', () => {
  describe('LocalDataMCP', () => {
    const mcp = new LocalDataMCP();

    it('has correct mcpClass', () => {
      expect(mcp.descriptor.mcpClass).toBe('local-data');
    });

    it('has at least one tool defined', () => {
      expect(mcp.descriptor.tools.length).toBeGreaterThan(0);
    });

    it('returns MCPQueryResult with chunks', async () => {
      const result = await mcp.query({ query: QUERY, topK: 5 });
      expect(result.mcpClass).toBe('local-data');
      expect(result.serverName).toBeTruthy();
      expect(Array.isArray(result.chunks)).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('chunks have required fields', async () => {
      const result = await mcp.query({ query: QUERY });
      for (const chunk of result.chunks) {
        expect(chunk.chunkId).toBeTruthy();
        expect(chunk.content).toBeTruthy();
        expect(chunk.source).toBeTruthy();
        expect(typeof chunk.score).toBe('number');
      }
    });

    it('respects topK limit', async () => {
      const result = await mcp.query({ query: QUERY, topK: 1 });
      expect(result.chunks.length).toBeLessThanOrEqual(1);
    });
  });

  describe('SearchEngineMCP', () => {
    const mcp = new SearchEngineMCP();

    it('has correct mcpClass', () => {
      expect(mcp.descriptor.mcpClass).toBe('search-engine');
    });

    it('returns MCPQueryResult with chunks', async () => {
      const result = await mcp.query({ query: QUERY, topK: 5 });
      expect(result.mcpClass).toBe('search-engine');
      expect(Array.isArray(result.chunks)).toBe(true);
    });

    it('has web_search and index_search tools', () => {
      const toolNames = mcp.descriptor.tools.map((t) => t.name);
      expect(toolNames).toContain('web_search');
      expect(toolNames).toContain('index_search');
    });
  });

  describe('CloudEngineMCP', () => {
    const mcp = new CloudEngineMCP();

    it('has correct mcpClass', () => {
      expect(mcp.descriptor.mcpClass).toBe('cloud-engine');
    });

    it('returns MCPQueryResult with chunks', async () => {
      const result = await mcp.query({ query: QUERY, topK: 5 });
      expect(result.mcpClass).toBe('cloud-engine');
      expect(Array.isArray(result.chunks)).toBe(true);
    });

    it('has query_s3_objects, cloud_status, and cloud_metrics tools', () => {
      const toolNames = mcp.descriptor.tools.map((t) => t.name);
      expect(toolNames).toContain('query_s3_objects');
      expect(toolNames).toContain('cloud_status');
      expect(toolNames).toContain('cloud_metrics');
    });
  });
});
