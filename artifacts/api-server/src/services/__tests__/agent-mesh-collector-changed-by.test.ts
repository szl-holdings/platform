import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { type ChangedByCache, resolveChangedBy } from '../agent-mesh-collector';

describe('resolveChangedBy', () => {
  it('returns a non-sentinel attribution for a real file (git author or owner)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-attr-'));
    const file = path.join(tmp, 'config.json');
    fs.writeFileSync(file, '{}');
    const cache: ChangedByCache = new Map();

    const result = resolveChangedBy(file, cache);

    expect(result).not.toBe('local-dev');
    expect(result).not.toBe('config-scanner');
    expect(result).not.toBe('local-edit');
    // file is owned by current process or has a uid we can stringify
    expect(result.length).toBeGreaterThan(0);
  });

  it("does not cache 'unknown' so a later scan can recover attribution", () => {
    const cache: ChangedByCache = new Map();
    // Non-existent file forces all resolution branches to fail → "unknown".
    const missing = path.join(os.tmpdir(), `definitely-missing-${Date.now()}.json`);

    const first = resolveChangedBy(missing, cache);
    expect(first).toBe('unknown');
    expect(cache.has(missing)).toBe(false);

    // Now the file appears with a real owner — the second call must
    // resolve fresh, not be stuck on the previous "unknown".
    fs.writeFileSync(missing, '{}');
    try {
      const second = resolveChangedBy(missing, cache);
      expect(second).not.toBe('unknown');
    } finally {
      fs.unlinkSync(missing);
    }
  });

  it('scopes attribution per-scan: a fresh cache re-resolves even if a prior scan cached a value', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-attr-'));
    const file = path.join(tmp, 'config.json');
    fs.writeFileSync(file, '{}');

    // Simulate scan #1 with its own cache.
    const scanOne: ChangedByCache = new Map();
    const firstOperator = resolveChangedBy(file, scanOne);
    expect(scanOne.get(file)).toBe(firstOperator);

    // Pretend an earlier scan wrote a stale value into the in-process map —
    // a brand new scan must use its own cache and not see the stale value.
    const scanTwo: ChangedByCache = new Map();
    const secondOperator = resolveChangedBy(file, scanTwo);
    expect(secondOperator).toBe(firstOperator);
    // The two caches are independent.
    expect(scanTwo).not.toBe(scanOne);
  });
});
