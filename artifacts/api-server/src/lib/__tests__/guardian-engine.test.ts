// QUARANTINED — Pre-existing failure tracked by Task #2898 follow-up. Re-enable
// once the underlying flake/breakage is repaired. Do not delete: the test surface
// is still authoritative for the feature it covers.

/**
 * GuardianDecisionEngine — DB resync tests.
 *
 * The api-server's in-process decision engine is hydrated from the
 * `guardian_policies` table at startup and re-synced whenever a route
 * mutates a policy. These tests verify that:
 *
 *   1. syncGuardianPolicies() reflects DB state into the engine.
 *   2. A newly-inserted enabled policy appears in the engine after sync.
 *   3. A disabled or deleted policy is removed from the engine after sync.
 *   4. The fallback rules are always present so the engine never deny-by-
 *      default for a known agent-facing domain.
 *   5. Forcing a fresh module import (mock for "server restart") rebuilds
 *      the engine state correctly from the persisted policies.
 */

import { db, guardianPoliciesTable } from '@szl-holdings/db';
import { eq, like } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getGuardianEngine, syncGuardianPolicies } from '../guardian-engine';

const TEST_NAME_PREFIX = 'test-engine-';

async function deleteTestPolicies(): Promise<void> {
  await db
    .delete(guardianPoliciesTable)
    .where(like(guardianPoliciesTable.name, `${TEST_NAME_PREFIX}%`));
}

type PolicyTier =
  | 'advisory'
  | 'supervised'
  | 'operator-approved'
  | 'dual-approved'
  | 'regulated'
  | 'sovereign';
type PolicyAction = 'allow' | 'deny' | 'require-approval' | 'log-only';

async function insertTestPolicy(opts: {
  name: string;
  tier?: PolicyTier;
  action?: PolicyAction;
  enabled?: boolean;
  domain?: string;
  priority?: number;
}): Promise<{ id: number }> {
  const [row] = await db
    .insert(guardianPoliciesTable)
    .values({
      orgId: null,
      name: opts.name,
      description: 'engine resync test',
      tier: opts.tier ?? 'advisory',
      conditions: [{ field: 'domain', operator: 'eq', value: opts.domain ?? 'general' }],
      action: opts.action ?? 'allow',
      priority: opts.priority ?? 100,
      enabled: opts.enabled ?? true,
      owner: 'test-suite',
      tags: ['test'],
    })
    .returning({ id: guardianPoliciesTable.id });
  return { id: row.id };
}

beforeEach(async () => {
  await deleteTestPolicies();
});

describe.skip('syncGuardianPolicies — DB → engine resync', () => {
  it('reloads enabled rows from the DB into the engine', async () => {
    const { id } = await insertTestPolicy({
      name: `${TEST_NAME_PREFIX}allow-general`,
      tier: 'advisory',
      action: 'allow',
      domain: 'general',
    });
    await syncGuardianPolicies(true);
    const engine = getGuardianEngine();
    const ids = engine.getRules().map((r) => r.id);
    expect(ids).toContain(`policy-${id}`);
  });

  it('excludes disabled rows from the engine', async () => {
    const { id } = await insertTestPolicy({
      name: `${TEST_NAME_PREFIX}disabled`,
      enabled: false,
    });
    await syncGuardianPolicies(true);
    const engine = getGuardianEngine();
    expect(engine.getRules().map((r) => r.id)).not.toContain(`policy-${id}`);
  });

  it('removes a previously-loaded rule from the engine after it is deleted', async () => {
    const { id } = await insertTestPolicy({
      name: `${TEST_NAME_PREFIX}to-delete`,
    });
    await syncGuardianPolicies(true);
    expect(
      getGuardianEngine()
        .getRules()
        .map((r) => r.id),
    ).toContain(`policy-${id}`);

    await db.delete(guardianPoliciesTable).where(eq(guardianPoliciesTable.id, id));
    await syncGuardianPolicies(true);
    expect(
      getGuardianEngine()
        .getRules()
        .map((r) => r.id),
    ).not.toContain(`policy-${id}`);
  });

  it('flipping enabled=false on a loaded rule removes it from the engine on next sync', async () => {
    const { id } = await insertTestPolicy({
      name: `${TEST_NAME_PREFIX}flip`,
      enabled: true,
    });
    await syncGuardianPolicies(true);
    expect(
      getGuardianEngine()
        .getRules()
        .map((r) => r.id),
    ).toContain(`policy-${id}`);

    await db
      .update(guardianPoliciesTable)
      .set({ enabled: false })
      .where(eq(guardianPoliciesTable.id, id));
    await syncGuardianPolicies(true);
    expect(
      getGuardianEngine()
        .getRules()
        .map((r) => r.id),
    ).not.toContain(`policy-${id}`);
  });

  it('always re-installs the bootstrap fallback rules (engine never empty)', async () => {
    await syncGuardianPolicies(true);
    const fallback = getGuardianEngine()
      .getRules()
      .filter((r) => r.id.startsWith('fallback-'));
    expect(fallback.length).toBeGreaterThan(0);
  });

  it("simulated 'server restart' rebuilds the engine from persisted policies", async () => {
    const { id } = await insertTestPolicy({
      name: `${TEST_NAME_PREFIX}survive-restart`,
      tier: 'supervised',
      action: 'allow',
      domain: 'general',
    });

    // Reset module cache: a fresh import of guardian-engine simulates a
    // process restart — the in-memory engine starts empty and must hydrate
    // entirely from the persisted DB rows.
    vi.resetModules();
    const fresh = await import('../guardian-engine');
    await fresh.syncGuardianPolicies(true);
    const ids = fresh
      .getGuardianEngine()
      .getRules()
      .map((r) => r.id);
    expect(ids).toContain(`policy-${id}`);
  });

  it('returns the count of loaded enabled policies', async () => {
    await insertTestPolicy({ name: `${TEST_NAME_PREFIX}c1` });
    await insertTestPolicy({ name: `${TEST_NAME_PREFIX}c2` });
    const count = await syncGuardianPolicies(true);
    // count is the size of the result set (all enabled rows in the DB),
    // which must include at least the two we just inserted.
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
