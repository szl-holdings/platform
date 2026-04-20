import { describe, expect, it } from 'vitest';
import { type PrismBusEvent, PrismEventBus } from '../bus.js';

function basePayload(): Omit<PrismBusEvent, 'id' | 'timestamp'> {
  return {
    type: 'tool_called',
    domain: 'vessels',
    sourceId: 'test-source',
    payload: { foo: 'bar' },
    severity: 'info',
  };
}

describe('PrismEventBus', () => {
  it('publishes an event and returns a fully-populated event', async () => {
    const bus = new PrismEventBus();
    const evt = await bus.publish(basePayload());
    expect(evt.id).toBeTruthy();
    expect(typeof evt.timestamp).toBe('number');
    expect(evt.type).toBe('tool_called');
    expect(evt.domain).toBe('vessels');
  });

  it('delivers events to matching subscribers and not to non-matching ones', async () => {
    const bus = new PrismEventBus();
    const matched: PrismBusEvent[] = [];
    const wrongType: PrismBusEvent[] = [];
    const wrongDomain: PrismBusEvent[] = [];
    const wildcard: PrismBusEvent[] = [];

    bus.subscribe(
      'a',
      ['tool_called'],
      (e) => {
        matched.push(e);
      },
      ['vessels'],
    );
    bus.subscribe('b', ['workflow_completed'], (e) => {
      wrongType.push(e);
    });
    bus.subscribe(
      'c',
      ['tool_called'],
      (e) => {
        wrongDomain.push(e);
      },
      ['aegis'],
    );
    bus.subscribe(
      'd',
      '*',
      (e) => {
        wildcard.push(e);
      },
      '*',
    );

    await bus.publish(basePayload());

    // Allow async handler microtasks to flush
    await Promise.resolve();

    expect(matched).toHaveLength(1);
    expect(wrongType).toHaveLength(0);
    expect(wrongDomain).toHaveLength(0);
    expect(wildcard).toHaveLength(1);
  });

  it('returns an unsubscribe function that removes the subscription', async () => {
    const bus = new PrismEventBus();
    const seen: PrismBusEvent[] = [];
    const off = bus.subscribe('x', '*', (e) => {
      seen.push(e);
    });
    await bus.publish(basePayload());
    off();
    await bus.publish(basePayload());
    expect(seen).toHaveLength(1);
    expect(bus.getStats().subscriptionCount).toBe(0);
  });

  it("treats subscribers tagged with the 'global' domain as receiving any domain", async () => {
    const bus = new PrismEventBus();
    const seen: PrismBusEvent[] = [];
    bus.subscribe(
      'g',
      ['tool_called'],
      (e) => {
        seen.push(e);
      },
      ['global'],
    );
    await bus.publish({ ...basePayload(), domain: 'aegis' });
    await bus.publish({ ...basePayload(), domain: 'terra' });
    expect(seen).toHaveLength(2);
  });

  it('records history newest-first and filters it correctly', async () => {
    const bus = new PrismEventBus();
    const t0 = Date.now();
    await bus.publish({ ...basePayload(), correlationId: 'c1', timestamp: t0 });
    await bus.publish({ ...basePayload(), type: 'workflow_completed', timestamp: t0 + 1 });
    await bus.publish({
      ...basePayload(),
      domain: 'aegis',
      correlationId: 'c1',
      timestamp: t0 + 2,
    });

    const all = bus.getHistory();
    expect(all).toHaveLength(3);
    expect(all[0]!.timestamp).toBeGreaterThanOrEqual(all[2]!.timestamp);

    expect(bus.getHistory({ type: 'workflow_completed' })).toHaveLength(1);
    expect(bus.getHistory({ domain: 'aegis' })).toHaveLength(1);
    expect(bus.getHistory({ correlationId: 'c1' })).toHaveLength(2);
    expect(bus.getHistory({ since: t0 + 1 })).toHaveLength(2);
    expect(bus.getHistory({ limit: 1 })).toHaveLength(1);
  });

  it('counts events per type and reports stats', async () => {
    const bus = new PrismEventBus();
    await bus.publish(basePayload());
    await bus.publish(basePayload());
    await bus.publish({ ...basePayload(), type: 'policy_decision' });
    bus.subscribe('s', '*', () => {});

    const stats = bus.getStats();
    expect(stats.totalPublished).toBe(3);
    expect(stats.byType['tool_called']).toBe(2);
    expect(stats.byType['policy_decision']).toBe(1);
    expect(stats.subscriptionCount).toBe(1);
    expect(stats.historySize).toBe(3);
  });

  it('swallows async subscriber rejections so publish still resolves', async () => {
    const bus = new PrismEventBus();
    bus.subscribe('bad', '*', async () => {
      throw new Error('boom');
    });
    const seen: PrismBusEvent[] = [];
    bus.subscribe('good', '*', (e) => {
      seen.push(e);
    });
    const evt = await bus.publish(basePayload());
    expect(evt.id).toBeTruthy();
    await Promise.resolve();
    expect(seen).toHaveLength(1);
  });
});
