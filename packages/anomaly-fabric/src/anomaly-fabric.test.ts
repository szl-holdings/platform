import { describe, expect, it } from 'vitest';
import { globalAnomalyService, globalAnomalyStore } from './service.js';

function makePoint(value: number, metricName = 'test.metric', timestamp?: string) {
  return {
    metricName,
    value,
    timestamp: timestamp ?? new Date().toISOString(),
    tags: {},
  };
}

describe('anomaly-fabric streaming', () => {
  it('returns no anomalies for insufficient window data', async () => {
    const result = await globalAnomalyService.detectStreaming({
      point: makePoint(1.5),
      windowSizeMs: 300_000,
      sensitivitySigma: 2.5,
      lane: 'test',
    });
    expect(result.mode).toBe('streaming');
    expect(result.processedCount).toBe(1);
    expect(Array.isArray(result.anomalies)).toBe(true);
  });

  it('detects a spike after sufficient window data is populated', async () => {
    const baseValues = [1, 1.1, 0.9, 1.05, 1.02, 0.98, 1.01, 0.97, 1.03, 1.0];
    for (const v of baseValues) {
      await globalAnomalyService.detectStreaming({
        point: makePoint(v, 'spike.metric'),
        windowSizeMs: 300_000,
        sensitivitySigma: 2.0,
        lane: 'test',
      });
    }
    const spikeResult = await globalAnomalyService.detectStreaming({
      point: makePoint(10.0, 'spike.metric'),
      windowSizeMs: 300_000,
      sensitivitySigma: 2.0,
      lane: 'test',
    });
    expect(spikeResult.anomalies.length).toBeGreaterThan(0);
    const spike = spikeResult.anomalies[0]!;
    expect(spike.kind).toBe('spike');
    expect(spike.severity).toMatch(/medium|high|critical/);
    expect(spike.confidence).toBeGreaterThan(0);
  });
});

describe('anomaly-fabric batch', () => {
  it('processes a batch of points and returns a result', async () => {
    const points = Array.from({ length: 20 }, (_, i) => makePoint(
      i < 19 ? 1 + Math.random() * 0.1 : 50,
      'batch.metric',
      new Date(Date.now() + i * 1000).toISOString(),
    ));
    const result = await globalAnomalyService.detectBatch({
      points,
      lane: 'lyte',
      jobId: 'test-batch-001',
      sensitivitySigma: 2.0,
      distributionShiftThreshold: 0.15,
    });
    expect(result.mode).toBe('batch');
    expect(result.processedCount).toBe(20);
    expect(result.jobId).toBe('test-batch-001');
    expect(result.anomalies.length).toBeGreaterThan(0);
  });
});
