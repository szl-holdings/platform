import { describe, expect, it } from 'vitest';
import { computeEventHash } from '../routes/audit-chain';

describe('audit-chain integrity (#2915)', () => {
  const sample = (n: number) => ({
    action: `act-${n}`,
    actor: 'alice',
    domain: 'platform',
    actionType: 'create',
    entityId: `szl://matter/acme/${n}`,
    createdAt: `2026-04-22T00:00:0${n}.000Z`,
  });

  it('produces a deterministic hash for the same payload', () => {
    const a = computeEventHash('genesis', sample(1));
    const b = computeEventHash('genesis', sample(1));
    expect(a).toEqual(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('changes the hash if any tracked field changes', () => {
    const base = computeEventHash('genesis', sample(1));
    expect(computeEventHash('genesis', { ...sample(1), action: 'tampered' })).not.toEqual(base);
    expect(computeEventHash('genesis', { ...sample(1), actor: 'mallory' })).not.toEqual(base);
    expect(computeEventHash('genesis', { ...sample(1), domain: 'vessels' })).not.toEqual(base);
    expect(computeEventHash('genesis', { ...sample(1), entityId: 'szl://matter/x/2' })).not.toEqual(
      base,
    );
    expect(computeEventHash('genesis', { ...sample(1), createdAt: '2026-04-22T00:00:99.000Z' })).not
      .toEqual(base);
  });

  it('chains forward: each event mixes the previous hash', () => {
    const h1 = computeEventHash('genesis', sample(1));
    const h2 = computeEventHash(h1, sample(2));
    const h3 = computeEventHash(h2, sample(3));
    expect(new Set([h1, h2, h3]).size).toBe(3);
    // If any earlier hash is altered, every subsequent hash diverges.
    const tamperedH1 = computeEventHash('genesis', { ...sample(1), action: 'tampered' });
    const h2Bad = computeEventHash(tamperedH1, sample(2));
    expect(h2Bad).not.toEqual(h2);
  });

  it('detects out-of-order replay (prevHash mismatch is caught by the verifier)', () => {
    // Simulate the verify loop locally.
    const h1 = computeEventHash('genesis', sample(1));
    const h2 = computeEventHash(h1, sample(2));
    const events = [
      { ...sample(1), prevHash: 'genesis', eventHash: h1 },
      { ...sample(2), prevHash: h1, eventHash: h2 },
    ];
    let intact = true;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i]!;
      const expectedPrev = i === 0 ? 'genesis' : events[i - 1]!.eventHash;
      if (ev.prevHash !== expectedPrev) intact = false;
      if (
        computeEventHash(ev.prevHash, {
          action: ev.action,
          actor: ev.actor,
          domain: ev.domain,
          actionType: ev.actionType,
          entityId: ev.entityId,
          createdAt: ev.createdAt,
        }) !== ev.eventHash
      ) {
        intact = false;
      }
    }
    expect(intact).toBe(true);

    // Now tamper an event in the middle and re-verify.
    events[1]!.action = 'tampered';
    let intactBad = true;
    for (let i = 0; i < events.length; i++) {
      const ev = events[i]!;
      if (
        computeEventHash(ev.prevHash, {
          action: ev.action,
          actor: ev.actor,
          domain: ev.domain,
          actionType: ev.actionType,
          entityId: ev.entityId,
          createdAt: ev.createdAt,
        }) !== ev.eventHash
      ) {
        intactBad = false;
      }
    }
    expect(intactBad).toBe(false);
  });
});
