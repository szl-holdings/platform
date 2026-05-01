/**
 * Knowledge Agent — retrieves evidence from LocalDataMCP.
 *
 * Specialises in platform-local data: the Postgres knowledge base,
 * entity graph, and the Alloy vector/embedding store.
 */
import { localDataMCP } from '../mcp-classes/local-data-mcp.js';
import type { SpecialistOutput } from '../evidence-merger.js';
import type { SpecialistAgent, SpecialistQuery } from './registry.js';
import { randomUUID } from 'node:crypto';

export class KnowledgeAgent implements SpecialistAgent {
  readonly name = 'knowledge-agent';
  readonly description = 'Retrieves evidence from the platform knowledge base, entity graph, and vector store via LocalDataMCP';

  async run(query: SpecialistQuery): Promise<SpecialistOutput> {
    const result = await localDataMCP.query({
      query: query.query,
      topK: query.topK ?? 10,
      filters: query.filters,
    });

    return {
      specialistAgent: this.name,
      mcpClass: 'local-data',
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
