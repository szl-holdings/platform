import { describe, expect, it } from 'vitest';
import { computeMerkleRoot } from '@workspace/ouroboros-anchor';
import { buildDailySummary, type VariableSnapshot } from '../forecast-summary';
import {
  FORECAST_REPLAY_CHAIN_ID,
  anchorForecastSummaries,
  forecastSummaryLeaf,
  verifyForecastSummaryInclusion,
} from '../forecast-anchor';

const snap = (n: number): VariableSnapshot => ({
  METR: { ok: true, value: n, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://api.github.com/repos/METR/public-tasks' },
  EPOCH: { ok: true, value: 700 + n, fetchedAt: '2026-05-16T00:00:00.000Z', sourceUrl: 'https://epoch.ai/data/notable_ai_models.csv' },
});

describe('forecast-anchor — round trip', () => {
  it('build → anchor → verify proves inclusion of every summary in the batch', async () => {
    const days = ['2026-05-14', '2026-05-15', '2026-05-16'];
    const summaries = days.map((d, i) => buildDailySummary(d, snap(i)));

    const entry = await anchorForecastSummaries(summaries);

    expect(entry.driver).toBe('LOCAL');
    expect(entry.chainId).toBe(FORECAST_REPLAY_CHAIN_ID);
    expect(entry.receipt).toMatch(/^local:/);
    expect(entry.leaves).toEqual(summaries.map(forecastSummaryLeaf));
    expect(entry.rootHash).toBe(computeMerkleRoot([...entry.leaves]));

    for (const s of summaries) {
      const v = verifyForecastSummaryInclusion(s, entry);
      expect(v.included).toBe(true);
      expect(v.rootMatches).toBe(true);
    }
  });

  it('rejects a summary whose hash is not in the chain', async () => {
    const a = buildDailySummary('2026-05-16', snap(1));
    const b = buildDailySummary('2026-05-16', snap(2));
    const entry = await anchorForecastSummaries([a]);

    const v = verifyForecastSummaryInclusion(b, entry);
    expect(v.included).toBe(false);
    if (!v.included) expect(v.reason).toBe('leaf-not-in-chain');
  });

  it('detects a tampered root', async () => {
    const a = buildDailySummary('2026-05-16', snap(1));
    const entry = await anchorForecastSummaries([a]);
    const tampered = { ...entry, rootHash: 'deadbeef'.repeat(8) };

    const v = verifyForecastSummaryInclusion(a, tampered);
    expect(v.included).toBe(false);
    if (!v.included) {
      expect(v.rootMatches).toBe(false);
      expect(v.reason).toBe('root-mismatch');
    }
  });

  it('rejects entries from a different chain namespace', async () => {
    const a = buildDailySummary('2026-05-16', snap(1));
    const entry = await anchorForecastSummaries([a], { driver: 'LOCAL' }, 'some.other.chain');
    const v = verifyForecastSummaryInclusion(a, entry);
    expect(v.included).toBe(false);
    if (!v.included) expect(v.reason).toBe('chain-id-mismatch');

    const ok = verifyForecastSummaryInclusion(a, entry, { expectedChainId: 'some.other.chain' });
    expect(ok.included).toBe(true);

    const skip = verifyForecastSummaryInclusion(a, entry, { expectedChainId: null });
    expect(skip.included).toBe(true);
  });

  it('refuses to anchor an empty batch', async () => {
    await expect(anchorForecastSummaries([])).rejects.toThrow(/empty/);
  });

  it('produces a deterministic root for the same ordered batch', async () => {
    const summaries = ['2026-05-14', '2026-05-15'].map((d, i) => buildDailySummary(d, snap(i)));
    const e1 = await anchorForecastSummaries(summaries);
    const e2 = await anchorForecastSummaries(summaries);
    expect(e1.rootHash).toBe(e2.rootHash);
  });
});
