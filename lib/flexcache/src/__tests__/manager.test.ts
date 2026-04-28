import { describe, expect, it } from 'vitest';
import { isManagedKey, patternToRegExp } from '../config';
import { FlexCacheManager, memoryOnlyManager } from '../manager';
import { computeScore } from '../profiler';

describe('patternToRegExp', () => {
  it('matches glob wildcards', () => {
    expect(patternToRegExp('graph:*').test('graph:agent-viz')).toBe(true);
    expect(patternToRegExp('graph:*').test('agent:foo')).toBe(false);
    expect(patternToRegExp('a?c').test('abc')).toBe(true);
    expect(patternToRegExp('a?c').test('abbc')).toBe(false);
  });
  it('escapes special chars', () => {
    expect(patternToRegExp('foo.bar').test('foo.bar')).toBe(true);
    expect(patternToRegExp('foo.bar').test('fooXbar')).toBe(false);
  });
});

describe('isManagedKey', () => {
  it('returns true when no patterns are set', () => {
    expect(isManagedKey('any', [], [])).toBe(true);
  });
  it('respects include patterns', () => {
    expect(isManagedKey('graph:x', ['graph:*'], [])).toBe(true);
    expect(isManagedKey('agent:x', ['graph:*'], [])).toBe(false);
  });
  it('exclude wins over include', () => {
    expect(isManagedKey('graph:secret', ['graph:*'], ['*:secret'])).toBe(false);
  });
});

describe('FlexCacheManager.get', () => {
  it('caches the loader result on the second call', async () => {
    const m = memoryOnlyManager({ discoveryIters: 0, strategy: 'greedy' });
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { n: calls };
    };
    const a = await m.get('k', loader);
    const b = await m.get('k', loader);
    expect(a.cold).toBe(true);
    expect(b.cold).toBe(false);
    expect(b.tier).toBe('hot');
    expect(b.value).toEqual({ n: 1 });
    expect(calls).toBe(1);
  });

  it('respects the discovery window', async () => {
    const m = memoryOnlyManager({ discoveryIters: 5, strategy: 'greedy' });
    let calls = 0;
    const loader = async () => ({ n: ++calls });
    // Inside the discovery window, strategy returns cold → no admission
    await m.get('k', loader);
    await m.get('k', loader);
    expect(calls).toBe(2);
  });

  it('bypasses cache for excluded keys', async () => {
    const m = memoryOnlyManager({
      discoveryIters: 0,
      excludePatterns: ['no-cache:*'],
    });
    let calls = 0;
    await m.get('no-cache:x', async () => ++calls);
    await m.get('no-cache:x', async () => ++calls);
    expect(calls).toBe(2);
  });

  it('counts hits, misses, and reports stats', async () => {
    const m = memoryOnlyManager({ discoveryIters: 0, strategy: 'greedy' });
    await m.get('k', async () => 1);
    await m.get('k', async () => 1);
    await m.get('k2', async () => 2);
    const s = await m.stats();
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(2);
    expect(s.hotHits).toBe(1);
    expect(s.coldLoads).toBe(2);
    expect(s.totalKeysProfiled).toBe(2);
  });

  it('applies TTL', async () => {
    const m = memoryOnlyManager({
      discoveryIters: 0,
      strategy: 'greedy',
      ttlMs: 5,
    });
    let calls = 0;
    await m.get('k', async () => ++calls);
    await new Promise((r) => setTimeout(r, 15));
    await m.get('k', async () => ++calls);
    expect(calls).toBe(2);
  });

  it('falls through to loader when disabled', async () => {
    const m = memoryOnlyManager({ enabled: false });
    let calls = 0;
    await m.get('k', async () => ++calls);
    await m.get('k', async () => ++calls);
    expect(calls).toBe(2);
  });
});

describe('strategy: adaptive', () => {
  it('respects hot capacity', async () => {
    const m = new FlexCacheManager(
      {
        discoveryIters: 0,
        strategy: 'adaptive',
        maxHotEntries: 2,
        warmBackend: 'memory',
      },
    );
    for (let i = 0; i < 5; i += 1) {
      await m.get(`k${i}`, async () => i);
    }
    const s = await m.stats();
    expect(s.hotSize).toBeLessThanOrEqual(2);
  });
});

describe('events', () => {
  it('emits admit / promote events', async () => {
    const m = memoryOnlyManager({ discoveryIters: 0, strategy: 'greedy' });
    const events: string[] = [];
    m.subscribe((e) => events.push(`${e.from}->${e.to}:${e.reason}`));
    await m.get('k', async () => 1);
    expect(events.some((e) => e.includes('admit'))).toBe(true);
  });
});

describe('single-flight (in-flight dedup)', () => {
  it('coalesces concurrent loads for the same key', async () => {
    const m = memoryOnlyManager({ discoveryIters: 0, strategy: 'greedy' });
    let calls = 0;
    const loader = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 25));
      return calls;
    };
    const [a, b, c] = await Promise.all([
      m.get('k', loader),
      m.get('k', loader),
      m.get('k', loader),
    ]);
    expect(calls).toBe(1);
    // First caller did the load; the rest piggy-backed on the same promise.
    expect(a.value).toBe(1);
    expect(b.value).toBe(1);
    expect(c.value).toBe(1);
  });
});

describe('TTL purge', () => {
  it('actively deletes stale hot entries on read', async () => {
    const m = memoryOnlyManager({
      discoveryIters: 0,
      strategy: 'greedy',
      ttlMs: 5,
    });
    await m.get('k', async () => 1);
    let s = await m.stats();
    expect(s.hotSize).toBe(1);
    await new Promise((r) => setTimeout(r, 15));
    await m.get('k', async () => 2);
    s = await m.stats();
    // Stale was purged then a fresh write replaced it; still exactly one.
    expect(s.hotSize).toBe(1);
  });
});

describe('profile persistence', () => {
  it('exports and re-imports profiles', async () => {
    const m1 = memoryOnlyManager({ discoveryIters: 0 });
    await m1.get('k', async () => 1);
    const profiles = m1.exportProfile();
    expect(profiles.length).toBe(1);

    const m2 = memoryOnlyManager({ discoveryIters: 0 });
    m2.importProfile(profiles);
    expect(m2.profiles().length).toBe(1);
    expect(m2.profiles()[0].key).toBe('k');
  });
});

describe('computeScore', () => {
  it('returns higher score for more frequently called keys', () => {
    const base = {
      key: 'a',
      calls: 1,
      loaderInvocations: 1,
      loaderLatencyMs: 10,
      lastServedTier: 'cold' as const,
      lastBytes: 100,
      score: 0,
      firstSeenAt: 0,
      lastSeenAt: 0,
    };
    const a = computeScore({ ...base, calls: 1 });
    const b = computeScore({ ...base, calls: 100 });
    expect(b).toBeGreaterThan(a);
  });
  it('penalises larger payloads', () => {
    const base = {
      key: 'a',
      calls: 10,
      loaderInvocations: 5,
      loaderLatencyMs: 50,
      lastServedTier: 'cold' as const,
      lastBytes: 100,
      score: 0,
      firstSeenAt: 0,
      lastSeenAt: 0,
    };
    const small = computeScore({ ...base, lastBytes: 100 });
    const large = computeScore({ ...base, lastBytes: 10_000_000 });
    expect(small).toBeGreaterThan(large);
  });
});
