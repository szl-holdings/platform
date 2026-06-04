import { describe, expect, it } from 'vitest';
import { InMemoryVerifierStore, type VerifierTarget, verify } from '../index.js';

const target: VerifierTarget = { targetType: 'output', targetId: 'shared-target' };

function decisionForOrg(orgId: number | null, evaluatedAt: number) {
  const d = verify({ text: `result-${orgId}-${evaluatedAt}` }, target, { orgId });
  d.evaluatedAt = evaluatedAt;
  return d;
}

describe('InMemoryVerifierStore — org scoping', () => {
  it('list filters by orgIds and excludes other tenants and null-org rows', async () => {
    const store = new InMemoryVerifierStore();
    await store.save(decisionForOrg(1, 1000));
    await store.save(decisionForOrg(1, 1100));
    await store.save(decisionForOrg(2, 1200));
    await store.save(decisionForOrg(null, 1300));

    const own = await store.list({ orgIds: [1] });
    expect(own.total).toBe(2);
    expect(own.items.every((d) => d.orgId === 1)).toBe(true);

    const other = await store.list({ orgIds: [2] });
    expect(other.total).toBe(1);

    const both = await store.list({ orgIds: [1, 2] });
    expect(both.total).toBe(3);

    // Empty allow-list matches nothing (caller has no org memberships).
    const none = await store.list({ orgIds: [] });
    expect(none.total).toBe(0);

    // Undefined = no scoping; sees everything including null-org rows.
    const all = await store.list({});
    expect(all.total).toBe(4);
  });

  it('get returns undefined when the record belongs to a different org', async () => {
    const store = new InMemoryVerifierStore();
    const d = decisionForOrg(7, 1000);
    await store.save(d);

    expect(await store.get(d.verifierId, { orgIds: [7] })).toBeDefined();
    expect(await store.get(d.verifierId, { orgIds: [9] })).toBeUndefined();
    expect(await store.get(d.verifierId, { orgIds: [] })).toBeUndefined();
    // Cross-org caller: undefined scope sees the row.
    expect(await store.get(d.verifierId)).toBeDefined();
  });

  it('latestForTarget hides records owned by other orgs', async () => {
    const store = new InMemoryVerifierStore();
    await store.save(decisionForOrg(1, 1000));
    await store.save(decisionForOrg(2, 5000)); // newer but other tenant

    const latestForOrg1 = await store.latestForTarget('output', target.targetId, { orgIds: [1] });
    expect(latestForOrg1?.orgId).toBe(1);

    const latestForOrg9 = await store.latestForTarget('output', target.targetId, { orgIds: [9] });
    expect(latestForOrg9).toBeUndefined();
  });

  it('delete is a no-op (returns false) when the record belongs to a different org', async () => {
    const store = new InMemoryVerifierStore();
    const d = decisionForOrg(1, 1000);
    await store.save(d);

    const blocked = await store.delete(d.verifierId, { orgIds: [2] });
    expect(blocked).toBe(false);
    // Record still present from a cross-org perspective.
    expect(await store.get(d.verifierId)).toBeDefined();

    const ok = await store.delete(d.verifierId, { orgIds: [1] });
    expect(ok).toBe(true);
    expect(await store.get(d.verifierId)).toBeUndefined();
  });
});
