import { describe, expect, it } from 'vitest';

import { runStagedDocumentPipeline } from '../staged-pipeline.js';
import type { DocumentIngestionRequest } from '../types.js';

function makeRequest(documentId: string, lane = 'counsel'): DocumentIngestionRequest {
  return {
    documentId,
    kind: 'filing',
    lane,
    fileName: `${documentId}.pdf`,
    mimeType: 'application/pdf',
    content: new TextEncoder().encode(`document content for ${documentId}`),
    tenantId: 'tenant-test',
  };
}

describe('runStagedDocumentPipeline — sequence-pipeline backbone', () => {
  it('emits one hashed pipeline.stage.v1 artefact per stage in order', async () => {
    const result = await runStagedDocumentPipeline(
      { request: makeRequest('doc-A') },
      { pipelineId: 'pipe-staged-A' },
    );
    expect(result.pipelineResult.pipelineId).toBe('pipe-staged-A');
    expect(result.pipelineResult.stages.map((s) => s.stageName)).toEqual([
      'ocr',
      'layout',
      'tables',
      'charts',
      'visual-ground',
      'qa',
      'episodic-map',
    ]);
    for (const stage of result.pipelineResult.stages) {
      expect(stage.receiptClass).toBe('pipeline.stage.v1');
      expect(stage.parentPipelineId).toBe('pipe-staged-A');
      expect(stage.inputsHash).toMatch(/^[0-9a-f]{64}$/);
      expect(stage.paramsHash).toMatch(/^[0-9a-f]{64}$/);
      expect(stage.outputsHash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('chains stage output → next stage input via hashes', async () => {
    const result = await runStagedDocumentPipeline(
      { request: makeRequest('doc-B') },
      { pipelineId: 'pipe-staged-B' },
    );
    for (let i = 1; i < result.pipelineResult.stages.length; i++) {
      expect(result.pipelineResult.stages[i]!.inputsHash).toBe(
        result.pipelineResult.stages[i - 1]!.outputsHash,
      );
    }
  });

  it('returns a unified DocumentPipelineResult on `document`', async () => {
    const result = await runStagedDocumentPipeline(
      { request: makeRequest('doc-C', 'vessels') },
      { pipelineId: 'pipe-staged-C' },
    );
    expect(result.document.documentId).toBe('doc-C');
    expect(result.document.lane).toBe('vessels');
    expect(result.document.provenance.stages.length).toBeGreaterThan(0);
    expect(result.document.provenance.pipelineVersion).toBe('0.2.0');
  });

  it('records visual-ground as a single stage when frame is supplied', async () => {
    const frameBytes = new TextEncoder().encode('synthetic frame bytes for visual ingest');
    const result = await runStagedDocumentPipeline(
      {
        request: makeRequest('doc-D'),
        visual: {
          frameBytes,
          labels: ['seal', 'placard'],
          rawDetections: [
            { label: 'seal', bbox: [0.1, 0.2, 0.3, 0.4], confidence: 0.9 },
            { label: 'placard', bbox: [0.5, 0.5, 0.7, 0.7], confidence: 0.85 },
          ],
        },
      },
      { pipelineId: 'pipe-staged-D' },
    );
    expect(result.visual).not.toBeNull();
    expect(result.visual!.detections).toHaveLength(2);
    expect(result.visual!.frameHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.document.chunks.some((c) => c.provenance.adapterProvider === 'seeing-eye')).toBe(true);
  });

  it('still emits an episodic-map stage receipt when recall is skipped', async () => {
    const result = await runStagedDocumentPipeline(
      { request: makeRequest('doc-E') },
      { pipelineId: 'pipe-staged-E' },
    );
    expect(result.episodicRecall).toBeNull();
    const episodic = result.pipelineResult.stages.find((s) => s.stageName === 'episodic-map');
    expect(episodic).toBeDefined();
    expect(episodic!.paramsHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('runs episodic recall with deterministic, reproducible top-K', async () => {
    const episodes = [
      { episodeId: 'e1', text: 'reefer return air defrost frost', occurredAt: '2026-02-01T00:00:00Z', scope: 'reefer', payload: { kind: 'mapping' } },
      { episodeId: 'e2', text: 'valve pressure fire suppression', occurredAt: '2025-11-01T00:00:00Z', scope: 'fire', payload: { kind: 'mapping' } },
      { episodeId: 'e3', text: 'reefer power draw nominal', occurredAt: '2026-04-01T00:00:00Z', scope: 'reefer', payload: { kind: 'mapping' } },
    ];
    const result = await runStagedDocumentPipeline(
      {
        request: makeRequest('doc-F'),
        episodicRecall: {
          queryText: 'reefer return air defrost',
          scope: 'reefer',
          episodes,
          now: new Date('2026-05-27T00:00:00Z'),
          topK: 2,
        },
      },
      { pipelineId: 'pipe-staged-F' },
    );
    expect(result.episodicRecall).not.toBeNull();
    expect(result.episodicRecall!.items).toHaveLength(2);
    expect(result.episodicRecall!.fusionRule).toBe('sqrt(content*temporal)');
    // Highest-fused must be the strict reefer/defrost match.
    expect(result.episodicRecall!.items[0]!.episodeId).toBe('e1');
  });
});
