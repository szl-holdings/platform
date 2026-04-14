import type { PrismDomain } from "./context.js";

export type PrismBusEventType =
  | "context_updated"
  | "tool_called"
  | "tool_result"
  | "workflow_triggered"
  | "workflow_completed"
  | "workflow_failed"
  | "approval_requested"
  | "approval_decided"
  | "evidence_captured"
  | "artifact_created"
  | "connector_state_changed"
  | "domain_signal"
  | "cross_domain_correlation"
  | "execution_started"
  | "execution_completed"
  | "execution_failed"
  | "policy_decision";

export interface PrismBusEvent {
  id: string;
  type: PrismBusEventType;
  domain: PrismDomain;
  sourceId: string;
  payload: Record<string, unknown>;
  severity: "info" | "low" | "medium" | "high" | "critical";
  timestamp: number;
  correlationId?: string;
  tenantId?: string | null;
  userId?: string | null;
}

type PrismBusEventHandler = (event: PrismBusEvent) => void | Promise<void>;

interface PrismBusSubscription {
  id: string;
  subscriberId: string;
  eventTypes: PrismBusEventType[] | "*";
  domains?: PrismDomain[] | "*";
  handler: PrismBusEventHandler;
}

const PRISM_BUS_MAX_HISTORY = 1000;

export class PrismEventBus {
  private subscriptions = new Map<string, PrismBusSubscription>();
  private history: PrismBusEvent[] = [];
  private counters = new Map<PrismBusEventType, number>();

  subscribe(
    subscriberId: string,
    eventTypes: PrismBusEventType[] | "*",
    handler: PrismBusEventHandler,
    domains?: PrismDomain[] | "*"
  ): () => void {
    const id = `prism-sub-${subscriberId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.subscriptions.set(id, { id, subscriberId, eventTypes, domains, handler });
    return () => {
      this.subscriptions.delete(id);
    };
  }

  async publish(
    event: Omit<PrismBusEvent, "id" | "timestamp"> & { id?: string; timestamp?: number }
  ): Promise<PrismBusEvent> {
    const full: PrismBusEvent = {
      ...event,
      id: event.id ?? `prism-evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now(),
    };

    this.history.unshift(full);
    if (this.history.length > PRISM_BUS_MAX_HISTORY) {
      this.history.length = PRISM_BUS_MAX_HISTORY;
    }

    this.counters.set(full.type, (this.counters.get(full.type) ?? 0) + 1);

    const handlers: Array<Promise<void>> = [];
    for (const sub of this.subscriptions.values()) {
      const typeMatch = sub.eventTypes === "*" || sub.eventTypes.includes(full.type);
      const domainMatch =
        !sub.domains ||
        sub.domains === "*" ||
        sub.domains.includes(full.domain) ||
        sub.domains.includes("global" as PrismDomain);

      if (typeMatch && domainMatch) {
        handlers.push(
          Promise.resolve(sub.handler(full)).catch(() => {})
        );
      }
    }

    if (handlers.length > 0) {
      Promise.all(handlers).catch(() => {});
    }

    return full;
  }

  getHistory(options: {
    limit?: number;
    type?: PrismBusEventType;
    domain?: PrismDomain;
    since?: number;
    correlationId?: string;
  } = {}): PrismBusEvent[] {
    let results = this.history;
    if (options.type) results = results.filter(e => e.type === options.type);
    if (options.domain) results = results.filter(e => e.domain === options.domain);
    if (options.since) results = results.filter(e => e.timestamp >= options.since!);
    if (options.correlationId) results = results.filter(e => e.correlationId === options.correlationId);
    return results.slice(0, options.limit ?? 100);
  }

  getStats() {
    const byType: Record<string, number> = {};
    for (const [type, count] of this.counters) {
      byType[type] = count;
    }
    return {
      totalPublished: Array.from(this.counters.values()).reduce((a, b) => a + b, 0),
      byType,
      subscriptionCount: this.subscriptions.size,
      historySize: this.history.length,
    };
  }
}

export const prismBus = new PrismEventBus();
