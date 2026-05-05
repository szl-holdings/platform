/**
 * Unit tests for hf-failover-resolver
 *
 * Verifies the null/string[]/throw authority semantics:
 *   null    → model confirmed NOT in registry; caller MAY use static defaults
 *   []      → model IS in registry; DB is authoritative (no fallbacks allowed
 *             to revert to static HF_TASK_FAILOVERS — retired, missing, or
 *             unassigned chain all produce [])
 *   [...]   → operator-configured fallback list; use verbatim
 *   throws  → DB error during lookup; caller MUST NOT silently use static
 *             defaults; propagated so inference call fails with clear signal
 *
 * These tests directly exercise the authority boundary required by the HF
 * inference governance contract.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Hoisted table stubs ────────────────────────────────────────────────────────

const { hfModelRegistryTable, hfFailoverChainsTable } = vi.hoisted(() => ({
  hfModelRegistryTable: {
    __t: 'hfModelRegistryTable',
    failoverChainId: 'failoverChainId',
    modelId: 'modelId',
  } as unknown,
  hfFailoverChainsTable: {
    __t: 'hfFailoverChainsTable',
    id: 'id',
    isActive: 'isActive',
    fallbackModelIds: 'fallbackModelIds',
  } as unknown,
}));

// ── Stores ────────────────────────────────────────────────────────────────────

let registryStore: Array<{ modelId: string; failoverChainId: number | null }> = [];
let chainsStore: Array<{
  id: number;
  isActive: boolean;
  fallbackModelIds: string[];
}> = [];
let dbShouldThrow = false;

// ── DB mock ───────────────────────────────────────────────────────────────────

vi.mock('@szl-holdings/db', () => {
  type Cond = { $type: string; col?: string; val?: unknown };
  function evalCond(cond: Cond, row: Record<string, unknown>): boolean {
    if (cond.$type === 'and') return true;
    if (cond.$type === 'eq') return row[cond.col as string] === cond.val;
    return true;
  }

  const makeChain = (data: () => unknown[]) => ({
    where: (cond?: unknown) =>
      makeChain(() =>
        cond
          ? data().filter((r) => evalCond(cond as Cond, r as Record<string, unknown>))
          : data(),
      ),
    limit: (n: number) => makeChain(() => data().slice(0, n)),
    then: (
      onFulfilled: (v: unknown[]) => unknown,
      onRejected?: (e: unknown) => unknown,
    ) => {
      if (dbShouldThrow) {
        const err = new Error('DB connection refused');
        return Promise.reject(err).catch(onRejected ?? ((e) => Promise.reject(e)));
      }
      return Promise.resolve(data()).then(onFulfilled, onRejected);
    },
  });

  return {
    hfModelRegistryTable,
    hfFailoverChainsTable,
    db: {
      select: (_proj?: unknown) => ({
        from: (table: unknown) => {
          if (table === hfModelRegistryTable)
            return makeChain(() => [...registryStore]);
          if (table === hfFailoverChainsTable)
            return makeChain(() => [...chainsStore]);
          return makeChain(() => []);
        },
      }),
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ $type: 'eq', col, val }),
}));

// ── Import resolver after mocks ───────────────────────────────────────────────

const { resolveHfFailoverChain } = await import('../hf-failover-resolver.js');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('resolveHfFailoverChain — authority semantics', () => {
  beforeEach(() => {
    registryStore = [];
    chainsStore = [];
    dbShouldThrow = false;
  });

  it('returns null when model is not in the registry', async () => {
    const result = await resolveHfFailoverChain('Qwen/Qwen3-8B');
    expect(result).toBeNull();
  });

  it('returns [] when model is in registry but has no failoverChainId', async () => {
    registryStore.push({ modelId: 'Qwen/Qwen3-8B', failoverChainId: null });

    const result = await resolveHfFailoverChain('Qwen/Qwen3-8B');
    expect(result).toEqual([]);
  });

  it('returns [] (not null) when model is in registry with a retired chain — DB is authoritative, static must not override', async () => {
    registryStore.push({ modelId: 'Qwen/Qwen3-8B', failoverChainId: 5 });
    chainsStore.push({ id: 5, isActive: false, fallbackModelIds: ['Qwen/Qwen3-0.6B'] });

    const result = await resolveHfFailoverChain('Qwen/Qwen3-8B');
    // Must be [] not null — retired chain is still DB-authoritative.
    // A null return would allow the caller to silently revert to static
    // HF_TASK_FAILOVERS, defeating operator governance intent.
    expect(result).toEqual([]);
    expect(result).not.toBeNull();
  });

  it('returns [] (not null) when the chain row is missing from hf_failover_chains', async () => {
    registryStore.push({ modelId: 'Qwen/Qwen3-8B', failoverChainId: 99 });
    // chain 99 not present in chainsStore

    const result = await resolveHfFailoverChain('Qwen/Qwen3-8B');
    expect(result).toEqual([]);
    expect(result).not.toBeNull();
  });

  it('returns the configured fallback list when model has an active chain', async () => {
    registryStore.push({ modelId: 'Qwen/Qwen3-8B', failoverChainId: 1 });
    chainsStore.push({
      id: 1,
      isActive: true,
      fallbackModelIds: ['Qwen/Qwen3-0.6B', 'gpt-4o-mini'],
    });

    const result = await resolveHfFailoverChain('Qwen/Qwen3-8B');
    expect(result).toEqual(['Qwen/Qwen3-0.6B', 'gpt-4o-mini']);
  });

  it('returns an empty array (not null) for an active chain with no fallbacks configured', async () => {
    registryStore.push({ modelId: 'Qwen/Qwen3-8B', failoverChainId: 2 });
    chainsStore.push({ id: 2, isActive: true, fallbackModelIds: [] });

    const result = await resolveHfFailoverChain('Qwen/Qwen3-8B');
    expect(result).toEqual([]);
    expect(result).not.toBeNull();
  });

  it('throws on DB error — must NOT silently return null and fall through to static defaults', async () => {
    // Simulates a transient DB failure (connection refused, pool exhausted, etc.)
    // The resolver must propagate the error so the caller's route handler returns
    // 500 rather than silently reverting to static HF_TASK_FAILOVERS, which
    // would bypass the operator-governed chain for registered models.
    dbShouldThrow = true;

    await expect(resolveHfFailoverChain('Qwen/Qwen3-8B')).rejects.toThrow(
      'DB connection refused',
    );
  });
});
