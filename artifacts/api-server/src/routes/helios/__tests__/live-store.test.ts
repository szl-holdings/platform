/**
 * Frontier Intelligence live-store unit tests.
 *
 * Pins the contract relied on by the Scanner Admin UI:
 *   - ingestSignals correctly bumps lastRun, signalsToday, and totalSignals
 *   - signalsToday is counted against Signal.scanner short tag (e.g. `arxiv`)
 *     even though the scanner id is namespaced (`scanner-arxiv`)
 *   - recordScannerError flips status to degraded without throwing
 *   - setScannerEnabled flips status to idle when disabled
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  getScanner,
  getScanners,
  getSignals,
  ingestSignals,
  recordScannerError,
  setScannerEnabled,
} from '../live-store';
import type { Signal } from '../types';

function makeSignal(scannerTag: string, idSuffix: string): Signal {
  return {
    id: `sig-test-${idSuffix}`,
    kind: 'capability',
    scanner: scannerTag,
    title: `Test signal ${idSuffix}`,
    summary: 'Synthetic test signal',
    soWhat: 'n/a',
    sourceUrl: 'https://example.invalid/test',
    sourceName: 'Test',
    confidence: 0.5,
    impactScore: 0.5,
    entities: [],
    claims: [],
    affectedAgents: [],
    createdAt: new Date().toISOString(),
  };
}

describe('helios live-store', () => {
  beforeEach(() => {
    // The store is a module-level singleton; tests below use unique signal
    // ids so they don't collide across the suite.
  });

  it('counts signalsToday using the short scanner tag, not the namespaced id', () => {
    const baseTotal = getScanner('scanner-arxiv')?.totalSignals ?? 0;

    const result = ingestSignals('scanner-arxiv', [
      makeSignal('arxiv', 'arxiv-a'),
      makeSignal('arxiv', 'arxiv-b'),
    ]);

    expect(result.added).toBe(2);
    expect(result.scanner).toBeDefined();
    // Critical regression check: previously this was 0 because the counter
    // compared against `scanner-arxiv` (the id) instead of `arxiv` (the
    // tag stored on Signal.scanner). Today's two freshly-ingested signals
    // must show up in signalsToday.
    expect(result.scanner!.signalsToday).toBeGreaterThanOrEqual(2);
    expect(result.scanner!.totalSignals).toBe(baseTotal + 2);
    expect(result.scanner!.lastRun).toBeTruthy();
    expect(result.scanner!.status).toBe('healthy');
  });

  it('dedupes signals by id on re-ingest', () => {
    ingestSignals('scanner-github', [makeSignal('github', 'gh-1')]);
    const second = ingestSignals('scanner-github', [
      makeSignal('github', 'gh-1'), // duplicate
      makeSignal('github', 'gh-2'),
    ]);
    expect(second.added).toBe(1);
    const signals = getSignals().filter(s => s.id === 'sig-test-gh-1');
    expect(signals).toHaveLength(1);
  });

  it('returns null when ingesting against an unknown scanner', () => {
    const result = ingestSignals('scanner-does-not-exist', [makeSignal('nope', 'x')]);
    expect(result.added).toBe(0);
    expect(result.scanner).toBeNull();
  });

  it('records scanner errors as degraded without losing signal data', () => {
    const before = getSignals().length;
    const updated = recordScannerError('scanner-arxiv', 'boom');
    expect(updated?.status).toBe('degraded');
    expect(updated?.errorMessage).toBe('boom');
    expect(getSignals().length).toBe(before); // fallback baseline preserved
  });

  it('flips scanner to idle when disabled and restores health when re-enabled', () => {
    const disabled = setScannerEnabled('scanner-arxiv', false);
    expect(disabled?.enabled).toBe(false);
    expect(disabled?.status).toBe('idle');
    const enabled = setScannerEnabled('scanner-arxiv', true);
    expect(enabled?.enabled).toBe(true);
    expect(enabled?.status).toBe('healthy');
  });

  it('initialises with seeded scanners and signals so the UI is never blank', () => {
    expect(getScanners().length).toBeGreaterThan(0);
    expect(getSignals().length).toBeGreaterThan(0);
  });
});
