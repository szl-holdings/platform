import { logger } from "./logger.js";

export type AgentEventType =
  | "anomaly_detected"
  | "threat_identified"
  | "health_degraded"
  | "health_restored"
  | "route_anomaly"
  | "sanctions_match"
  | "dark_vessel_detected"
  | "insight_generated"
  | "alert_raised"
  | "metric_spike"
  | "correlation_found"
  | "scheduled_run_complete"
  | "scheduled_run_failed"
  | "cross_domain_signal";

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  sourceAgent: string;
  sourceDomain: string;
  payload: Record<string, unknown>;
  severity: "info" | "low" | "medium" | "high" | "critical";
  timestamp: number;
  correlationId?: string;
}

type EventHandler = (event: AgentEvent) => void | Promise<void>;

interface Subscription {
  id: string;
  agentId: string;
  eventTypes: AgentEventType[] | "*";
  handler: EventHandler;
}

const MAX_HISTORY = 500;

export class AgentEventBus {
  private subscriptions: Map<string, Subscription> = new Map();
  private history: AgentEvent[] = [];
  private eventCounts: Map<AgentEventType, number> = new Map();

  subscribe(agentId: string, eventTypes: AgentEventType[] | "*", handler: EventHandler): () => void {
    const id = `sub-${agentId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.subscriptions.set(id, { id, agentId, eventTypes, handler });
    logger.debug({ subscriptionId: id, agentId, eventTypes }, "Agent subscribed to event bus");
    return () => {
      this.subscriptions.delete(id);
    };
  }

  async publish(event: Omit<AgentEvent, "id" | "timestamp"> & { id?: string; timestamp?: number }): Promise<AgentEvent> {
    const full: AgentEvent = {
      ...event,
      id: event.id ?? `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now(),
    };

    this.history.unshift(full);
    if (this.history.length > MAX_HISTORY) {
      this.history.length = MAX_HISTORY;
    }

    this.eventCounts.set(full.type, (this.eventCounts.get(full.type) ?? 0) + 1);

    logger.info({ eventId: full.id, type: full.type, sourceAgent: full.sourceAgent, severity: full.severity }, "Agent event published");

    const handlers: Array<Promise<void>> = [];
    for (const sub of this.subscriptions.values()) {
      if (sub.agentId === full.sourceAgent) continue;
      const matches = sub.eventTypes === "*" || sub.eventTypes.includes(full.type);
      if (matches) {
        handlers.push(
          Promise.resolve(sub.handler(full)).catch(err => {
            logger.error({ err, subscriptionId: sub.id, eventId: full.id }, "Event handler error");
          })
        );
      }
    }

    if (handlers.length > 0) {
      Promise.all(handlers).catch(() => {});
    }
    return full;
  }

  getHistory(options: { limit?: number; type?: AgentEventType; sourceDomain?: string; since?: number } = {}): AgentEvent[] {
    let results = this.history;
    if (options.type) results = results.filter(e => e.type === options.type);
    if (options.sourceDomain) results = results.filter(e => e.sourceDomain === options.sourceDomain);
    if (options.since) results = results.filter(e => e.timestamp >= options.since!);
    return results.slice(0, options.limit ?? 50);
  }

  getStats() {
    const byType: Record<string, number> = {};
    for (const [type, count] of this.eventCounts) {
      byType[type] = count;
    }
    return {
      totalPublished: Array.from(this.eventCounts.values()).reduce((a, b) => a + b, 0),
      byType,
      subscriptionCount: this.subscriptions.size,
      historySize: this.history.length,
      subscribers: Array.from(this.subscriptions.values()).map(s => ({ id: s.id, agentId: s.agentId, eventTypes: s.eventTypes })),
    };
  }
}

export const agentEventBus = new AgentEventBus();
