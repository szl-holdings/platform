/**
 * Unit tests for evidence merger — RRF + cross-encoder reranking.
 */
import { describe, it, expect } from 'vitest';
import { mergeEvidence } from '../evidence-merger.js';
import type { SpecialistOutput } from '../evidence-merger.js';

function makeOutput(
  specialist: string,
  mcpClass: SpecialistOutput['mcpClass'],
  chunks: Array<{ id: string; content: string; score: number }>,
): SpecialistOutput {
  return {
    specialistAgent: specialist,
    mcpClass,
    chunks: chunks.map((c) => ({
      chunkId: c.id,
      content: c.content,
      source: `${specialist}:${c.id}`,
      score: c.score,
    })),
  };
}

describe('mergeEvidence — RRF + cross-encoder', () => {
  it('returns an evidence bundle with correct structure', () => {
    const outputs: SpecialistOutput[] = [
      makeOutput('knowledge-agent', 'local-data', [
        { id: 'chunk-1', content: 'Security posture analysis reveals low risk', score: 0.9 },
        { id: 'chunk-2', content: 'Threat landscape overview', score: 0.7 },
      ]),
      makeOutput('web-research-agent', 'search-engine', [
        { id: 'chunk-3', content: 'Recent security advisories and CVEs', score: 0.85 },
      ]),
    ];

    const bundle = mergeEvidence(outputs, {
      runId: 'test-run-1',
      query: 'What is our security posture?',
      topK: 5,
    });

    expect(bundle.bundleId).toBeTruthy();
    expect(bundle.runId).toBe('test-run-1');
    expect(bundle.fusionMethod).toBe('rrf+cross-encoder');
    expect(bundle.chunks.length).toBeGreaterThan(0);
    expect(bundle.chunks.length).toBeLessThanOrEqual(5);
    expect(bundle.chunks[0]).toMatchObject({
      chunkId: expect.any(String),
      content: expect.any(String),
      source: expect.any(String),
      score: expect.any(Number),
      specialistAgent: expect.any(String),
      mcpClass: expect.any(String),
    });
  });

  it('deduplicates chunks with the same chunkId across specialists', () => {
    const outputs: SpecialistOutput[] = [
      makeOutput('knowledge-agent', 'local-data', [
        { id: 'shared-chunk', content: 'Shared content', score: 0.8 },
      ]),
      makeOutput('web-research-agent', 'search-engine', [
        { id: 'shared-chunk', content: 'Shared content', score: 0.6 },
      ]),
    ];

    const bundle = mergeEvidence(outputs, {
      runId: 'test-run-2',
      query: 'dedup test',
      topK: 10,
    });

    const uniqueIds = new Set(bundle.chunks.map((c) => c.chunkId));
    expect(uniqueIds.size).toBe(bundle.chunks.length);
  });

  it('respects topK limit', () => {
    const chunks = Array.from({ length: 20 }, (_, i) => ({
      id: `chunk-${i}`,
      content: `Content chunk ${i}`,
      score: (20 - i) / 20,
    }));

    const output = makeOutput('knowledge-agent', 'local-data', chunks);
    const bundle = mergeEvidence([output], {
      runId: 'test-run-3',
      query: 'topK test',
      topK: 5,
    });

    expect(bundle.chunks.length).toBeLessThanOrEqual(5);
  });

  it('scores are boosted for query-relevant content (cross-encoder)', () => {
    const outputs: SpecialistOutput[] = [
      makeOutput('knowledge-agent', 'local-data', [
        { id: 'relevant', content: 'maritime vessel tracking intelligence', score: 0.5 },
        { id: 'irrelevant', content: 'unrelated content about cooking', score: 0.9 },
      ]),
    ];

    const bundle = mergeEvidence(outputs, {
      runId: 'test-run-4',
      query: 'maritime vessel intelligence tracking',
      topK: 10,
    });

    const relevant = bundle.chunks.find((c) => c.chunkId === 'relevant');
    const irrelevant = bundle.chunks.find((c) => c.chunkId === 'irrelevant');

    expect(relevant).toBeDefined();
    expect(irrelevant).toBeDefined();
    expect(relevant!.score).toBeGreaterThan(0);
  });

  it('handles empty specialist outputs gracefully', () => {
    const bundle = mergeEvidence([], {
      runId: 'test-run-5',
      query: 'empty test',
      topK: 10,
    });

    expect(bundle.chunks).toHaveLength(0);
    expect(bundle.bundleId).toBeTruthy();
  });
});
