import { describe, expect, it } from 'vitest';

import { rankExtractionConfidencePeaks } from '../extraction-peaks.js';
import type { DocumentChunk, DocumentPipelineResult } from '../types.js';

function chunk(documentId: string, idx: number, confidence: number): DocumentChunk {
  return {
    chunkId: `${documentId}-c${idx}`,
    documentId,
    stage: 'qa',
    page: 1,
    text: `chunk ${idx}`,
    confidence,
    contentType: 'qa-answer',
    evidenceRef: {
      documentId,
      chunkId: `${documentId}-c${idx}`,
      page: 1,
      retrievedAt: '2026-05-27T00:00:00Z',
    },
    provenance: {
      documentId,
      lane: 'counsel',
      kind: 'filing',
      stage: 'qa',
      adapterProvider: 'noop',
      confidence,
      generatedAt: '2026-05-27T00:00:00Z',
    },
  };
}

function fixtureDoc(documentId: string, confidences: number[]): DocumentPipelineResult {
  const chunks = confidences.map((c, i) => chunk(documentId, i, c));
  return {
    documentId,
    kind: 'filing',
    lane: 'counsel',
    ocr: { documentId, pages: [], totalPages: 0, provider: 'noop', processedAt: '' },
    layout: { documentId, blocks: [], sections: [], provider: 'noop', processedAt: '' },
    tables: { documentId, tables: [], provider: 'noop', processedAt: '' },
    charts: { documentId, charts: [], provider: 'noop', processedAt: '' },
    qa: { documentId, answers: [], provider: 'noop', processedAt: '' },
    chunks,
    provenance: {
      documentId, kind: 'filing', lane: 'counsel', fileName: '', mimeType: '',
      ingestedAt: '', pipelineVersion: '0.2.0', stages: [],
    },
    completedAt: '',
  };
}

describe('rankExtractionConfidencePeaks — locked fixture ranking', () => {
  // Three documents with different confidence shapes. The ranking must
  // surface the deepest *gap* (lowest confidence trough) first — that
  // is the document a reviewer should look at next.
  const docs = [
    // Mostly-confident with one sharp dip at index 3.
    fixtureDoc('doc-alpha',   [0.95, 0.93, 0.92, 0.30, 0.91, 0.94, 0.93]),
    // Steady-high — no notable trough.
    fixtureDoc('doc-bravo',   [0.92, 0.93, 0.92, 0.91, 0.93, 0.92, 0.94]),
    // Mild dip but with high noise around it.
    fixtureDoc('doc-charlie', [0.85, 0.82, 0.84, 0.65, 0.84, 0.83, 0.85]),
    // Very narrow but extreme trough — should rank above the mild dip.
    fixtureDoc('doc-delta',   [0.96, 0.95, 0.97, 0.10, 0.96, 0.95, 0.97]),
  ];

  it('ranks documents by trough prominence; locked fixture order', () => {
    const ranked = rankExtractionConfidencePeaks(docs, { mode: 'gap', topK: 4 });
    expect(ranked.map((r) => r.documentId)).toEqual([
      'doc-delta',
      'doc-alpha',
      'doc-charlie',
      // doc-bravo has no peak above threshold → absent.
    ]);
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[0]!.compositeScore).toBeGreaterThan(ranked[1]!.compositeScore);
    expect(ranked[1]!.compositeScore).toBeGreaterThan(ranked[2]!.compositeScore);
  });

  it('anchors each ranked peak to the chunk at the trough index', () => {
    const ranked = rankExtractionConfidencePeaks(docs, { mode: 'gap', topK: 4 });
    const delta = ranked.find((r) => r.documentId === 'doc-delta')!;
    expect(delta.anchorChunkId).toBe('doc-delta-c3');
    expect(delta.summary).toContain('doc-delta');
    expect(delta.summary).toContain('chunk=qa/');
  });

  it('is reproducible across calls (no Math.random; ties broken by docId)', () => {
    const a = rankExtractionConfidencePeaks(docs, { mode: 'gap', topK: 4 });
    const b = rankExtractionConfidencePeaks(docs, { mode: 'gap', topK: 4 });
    expect(a).toEqual(b);
  });
});
