/**
 * Web Research Agent — retrieves evidence from SearchEngineMCP.
 *
 * Specialises in web search and external document indexes.
 */
import { searchEngineMCP } from '../mcp-classes/search-engine-mcp.js';
import type { SpecialistOutput } from '../evidence-merger.js';
import type { SpecialistAgent, SpecialistQuery } from './registry.js';
import { randomUUID } from 'node:crypto';

export class WebResearchAgent implements SpecialistAgent {
  readonly name = 'web-research-agent';
  readonly description = 'Retrieves evidence from web search and external document indexes via SearchEngineMCP';

  async run(query: SpecialistQuery): Promise<SpecialistOutput> {
    const result = await searchEngineMCP.query({
      query: query.query,
      topK: query.topK ?? 5,
      filters: query.filters,
    });

    return {
      specialistAgent: this.name,
      mcpClass: 'search-engine',
      chunks: result.chunks.map((c) => ({
        chunkId: c.chunkId ?? randomUUID(),
        content: c.content,
        source: c.source,
        score: c.score,
        metadata: { ...c.metadata, latencyMs: result.latencyMs },
      })),
    };
  }
}
