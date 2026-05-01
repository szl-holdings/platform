/**
 * Cloud Ops Agent — retrieves evidence from CloudEngineMCP.
 *
 * Specialises in cloud infrastructure data: S3 objects, status pages,
 * and cloud metrics.
 */
import { cloudEngineMCP } from '../mcp-classes/cloud-engine-mcp.js';
import type { SpecialistOutput } from '../evidence-merger.js';
import type { SpecialistAgent, SpecialistQuery } from './registry.js';
import { randomUUID } from 'node:crypto';

export class CloudOpsAgent implements SpecialistAgent {
  readonly name = 'cloud-ops-agent';
  readonly description = 'Retrieves evidence from S3, cloud status pages, and cloud metrics via CloudEngineMCP';

  async run(query: SpecialistQuery): Promise<SpecialistOutput> {
    const result = await cloudEngineMCP.query({
      query: query.query,
      topK: query.topK ?? 5,
      filters: query.filters,
    });

    return {
      specialistAgent: this.name,
      mcpClass: 'cloud-engine',
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
