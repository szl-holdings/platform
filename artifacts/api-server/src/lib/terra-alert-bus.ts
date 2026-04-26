/**
 * Terra Alert Bus — in-process cross-domain signal bus.
 *
 * Provides a lightweight publish/subscribe mechanism for sourcing and climate
 * signals emitted by Terra routes. Consumers (e.g. mission runbooks, Pulse)
 * can subscribe via `subscribe()` or poll recent events via `getRecentEvents()`.
 *
 * Events are capped at MAX_EVENTS to bound memory use.
 */

export type AlertDomain = 'terra' | 'aegis' | 'vessels' | 'sentra' | string;

export interface AlertBusEvent {
  id: string;
  rule: string;
  domain: AlertDomain;
  payload: Record<string, unknown>;
  publishedAt: string;
}

type AlertSubscriber = (event: AlertBusEvent) => void;

const MAX_EVENTS = 500;

const events: AlertBusEvent[] = [];
const subscribers: AlertSubscriber[] = [];

let seq = 0;

function nextId(): string {
  return `alert-${Date.now()}-${++seq}`;
}

/**
 * Publish an alert event to the bus.
 * Notifies all current subscribers synchronously, then stores the event.
 */
export function publish(
  rule: string,
  domain: AlertDomain,
  payload: Record<string, unknown>,
): AlertBusEvent {
  const event: AlertBusEvent = {
    id: nextId(),
    rule,
    domain,
    payload,
    publishedAt: new Date().toISOString(),
  };

  for (const sub of subscribers) {
    try {
      sub(event);
    } catch {
    }
  }

  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }

  return event;
}

/**
 * Subscribe to all future events. Returns an unsubscribe function.
 */
export function subscribe(fn: AlertSubscriber): () => void {
  subscribers.push(fn);
  return () => {
    const idx = subscribers.indexOf(fn);
    if (idx !== -1) subscribers.splice(idx, 1);
  };
}

/**
 * Return the most recent N events, optionally filtered by domain or rule prefix.
 */
export function getRecentEvents(opts?: {
  limit?: number;
  domain?: AlertDomain;
  rulePrefix?: string;
}): AlertBusEvent[] {
  const limit = opts?.limit ?? 50;
  let result = [...events];
  if (opts?.domain) result = result.filter((e) => e.domain === opts.domain);
  if (opts?.rulePrefix) result = result.filter((e) => e.rule.startsWith(opts.rulePrefix!));
  return result.slice(-limit).reverse();
}

/**
 * Return total count of events published since server start.
 */
export function getEventCount(): number {
  return seq;
}
