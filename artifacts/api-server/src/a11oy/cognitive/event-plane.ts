import { newId } from './types.js';
import type { RuntimeEvent, RuntimeEventType } from './types.js';

export type EventHandler = (event: RuntimeEvent) => void | Promise<void>;

const EVENT_STORE: RuntimeEvent[] = [];
const MAX_EVENTS = 10000;
const SUBSCRIBERS = new Map<RuntimeEventType | '*', Set<EventHandler>>();

function prune(): void {
  if (EVENT_STORE.length > MAX_EVENTS) {
    EVENT_STORE.splice(0, EVENT_STORE.length - MAX_EVENTS);
  }
}

export const EventPlane = {
  emit(opts: {
    tenantId: string;
    requestId?: string;
    routeDecisionId?: string;
    workerId?: string;
    proofChainId?: string;
    eventType: RuntimeEventType;
    payload?: Record<string, unknown>;
    correlationId?: string;
    causationId?: string;
  }): RuntimeEvent {
    const event: RuntimeEvent = {
      eventId: newId('ev'),
      tenantId: opts.tenantId,
      requestId: opts.requestId,
      routeDecisionId: opts.routeDecisionId,
      workerId: opts.workerId,
      proofChainId: opts.proofChainId,
      correlationId: opts.correlationId,
      causationId: opts.causationId,
      eventType: opts.eventType,
      payload: opts.payload ?? {},
      occurredAt: new Date().toISOString(),
    };

    EVENT_STORE.push(event);
    prune();

    const specificHandlers = SUBSCRIBERS.get(opts.eventType);
    if (specificHandlers) {
      for (const handler of specificHandlers) {
        Promise.resolve(handler(event)).catch(() => {});
      }
    }

    const wildcardHandlers = SUBSCRIBERS.get('*');
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        Promise.resolve(handler(event)).catch(() => {});
      }
    }

    return event;
  },

  subscribe(eventType: RuntimeEventType | '*', handler: EventHandler): () => void {
    let handlers = SUBSCRIBERS.get(eventType);
    if (!handlers) {
      handlers = new Set();
      SUBSCRIBERS.set(eventType, handlers);
    }
    handlers.add(handler);
    return () => {
      handlers!.delete(handler);
    };
  },

  replay(opts: {
    tenantId: string;
    fromEventId?: string;
    eventType?: RuntimeEventType;
    limit?: number;
  }): RuntimeEvent[] {
    let events = EVENT_STORE.filter((e) => e.tenantId === opts.tenantId);

    if (opts.fromEventId) {
      const idx = events.findIndex((e) => e.eventId === opts.fromEventId);
      if (idx >= 0) events = events.slice(idx + 1);
    }

    if (opts.eventType) {
      events = events.filter((e) => e.eventType === opts.eventType);
    }

    if (opts.limit) {
      events = events.slice(-opts.limit);
    }

    return events.map((e) => ({ ...e, isReplayed: true } as RuntimeEvent));
  },

  list(opts: {
    tenantId: string;
    eventType?: RuntimeEventType;
    requestId?: string;
    limit?: number;
    offset?: number;
  }): { events: RuntimeEvent[]; total: number } {
    let events = EVENT_STORE.filter((e) => {
      if (e.tenantId !== opts.tenantId) return false;
      if (opts.eventType && e.eventType !== opts.eventType) return false;
      if (opts.requestId && e.requestId !== opts.requestId) return false;
      return true;
    });

    const total = events.length;
    const offset = opts.offset ?? 0;
    const limit = opts.limit ?? 50;
    events = events.slice(offset, offset + limit);

    return { events, total };
  },

  stats(tenantId: string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of EVENT_STORE) {
      if (event.tenantId !== tenantId) continue;
      counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
    }
    return counts;
  },
};
