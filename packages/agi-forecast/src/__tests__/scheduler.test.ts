import { describe, expect, it } from 'vitest';
import { publicVariables } from '../gauge-registry';
import {
  PUBLIC_INGESTORS,
  runAllPublicIngestors,
  type IngestorFn,
} from '../scheduler';
import type { IngestResult } from '../ingestors/_fetch';

function ok(value: number, source = 'https://example.invalid/ok'): IngestResult<number> {
  return { ok: true, value, fetchedAt: new Date().toISOString(), sourceUrl: source };
}

function fail(error: string, source = 'https://example.invalid/fail'): IngestResult<number> {
  return { ok: false, error, fetchedAt: new Date().toISOString(), sourceUrl: source };
}

function stubAll(value: number): Record<string, IngestorFn> {
  const map: Record<string, IngestorFn> = {};
  for (const v of publicVariables()) {
    map[v.id] = async () => ok(value, v.source);
  }
  return map;
}

describe('runAllPublicIngestors', () => {
  it('returns a status entry for every PUBLIC_ONLY variable', async () => {
    const result = await runAllPublicIngestors({ ingestors: stubAll(7) });
    const ids = publicVariables().map((v) => v.id).sort();
    const statusIds = result.statuses.map((s) => s.id).sort();
    expect(statusIds).toEqual(ids);
    expect(result.statuses.every((s) => s.ok && s.value === 7)).toBe(true);
  });

  it('isolates per-ingestor failures (failures do not block siblings)', async () => {
    const stubs = stubAll(1);
    // Force the first PUBLIC_ONLY variable to fail, and the second to throw.
    const ids = publicVariables().map((v) => v.id);
    stubs[ids[0]] = async () => fail('synthetic network error');
    stubs[ids[1]] = async () => {
      throw new Error('synthetic throw');
    };
    const result = await runAllPublicIngestors({ ingestors: stubs });
    const byId = Object.fromEntries(result.statuses.map((s) => [s.id, s]));
    expect(byId[ids[0]].ok).toBe(false);
    expect(byId[ids[0]].error).toMatch(/synthetic network error/);
    expect(byId[ids[1]].ok).toBe(false);
    expect(byId[ids[1]].error).toMatch(/synthetic throw/);
    // All other ingestors still succeeded.
    const survivors = result.statuses.filter((s) => !ids.slice(0, 2).includes(s.id));
    expect(survivors.every((s) => s.ok)).toBe(true);
  });

  it('produces a deterministic daily summary tagged with the run date', async () => {
    const pinned = new Date('2025-03-14T12:00:00.000Z');
    const result = await runAllPublicIngestors({
      ingestors: stubAll(42),
      now: () => pinned,
    });
    expect(result.date).toBe('2025-03-14');
    expect(result.summary.id).toBe('forecast.summary@2025-03-14');
    expect(result.summary.ingestionPolicy).toBe('PUBLIC_ONLY');
    expect(typeof result.summary.receiptHash).toBe('string');
    expect(result.summary.receiptHash).toHaveLength(64);
  });

  it('throws if a PUBLIC_ONLY variable lacks a registered ingestor (drift guard)', async () => {
    const stubs = stubAll(1);
    const firstId = publicVariables()[0].id;
    delete stubs[firstId];
    await expect(runAllPublicIngestors({ ingestors: stubs })).rejects.toThrow(
      /no ingestor registered/i,
    );
  });

  it('PUBLIC_INGESTORS covers every PUBLIC_ONLY variable in the registry', () => {
    for (const v of publicVariables()) {
      expect(PUBLIC_INGESTORS[v.id]).toBeDefined();
    }
  });
});
