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
  | "policy_decision"
  | "protocol_request"
  | "protocol_crossing"
  | "protocol_governance_checkpoint"
  | "agent_discovery";

export type ProtocolLayer = "mcp" | "a2a" | "anp" | "acp";

export interface ProtocolMetadata {
  protocol: ProtocolLayer;
  agentId?: string;
  taskId?: string;
  did?: string;
  trustLevel?: "trusted" | "verified" | "anonymous";
  crossingFromProtocol?: ProtocolLayer;
  crossingToProtocol?: ProtocolLayer;
  governanceRequired?: boolean;
}

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
  protocol?: ProtocolMetadata;
}

type PrismBusEventHandler = (event: PrismBusEvent) => void | Promise<void>;

interface PrismBusSubscription {
  id: string;
  subscriberId: string;
  eventTypes: PrismBusEventType[] | "*";
  domains?: PrismDomain[] | "*";
  protocols?: ProtocolLayer[] | "*";
  handler: PrismBusEventHandler;
}

const PRISM_BUS_MAX_HISTORY = 1000;

export interface BridgeRule {
  fromProtocol: ProtocolLayer;
  toProtocol: ProtocolLayer;
  /** Specific event type to match, or "*" to match all event types from this protocol. */
  eventType: PrismBusEventType | "*";
  handler: (event: PrismBusEvent, targetProtocol: ProtocolLayer) => PrismBusEvent | null;
}

export class PrismEventBus {
  private subscriptions = new Map<string, PrismBusSubscription>();
  private history: PrismBusEvent[] = [];
  private counters = new Map<PrismBusEventType, number>();
  private protocolCounters = new Map<ProtocolLayer, number>();
  private bridgeRules: BridgeRule[] = [];
  private crossingHistory: Array<{ from: ProtocolLayer; to: ProtocolLayer; eventId: string; timestamp: number }> = [];

  subscribe(
    subscriberId: string,
    eventTypes: PrismBusEventType[] | "*",
    handler: PrismBusEventHandler,
    domains?: PrismDomain[] | "*",
    protocols?: ProtocolLayer[] | "*",
  ): () => void {
    const id = `prism-sub-${subscriberId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.subscriptions.set(id, { id, subscriberId, eventTypes, domains, protocols, handler });
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

    if (full.protocol?.protocol) {
      const proto = full.protocol.protocol;
      this.protocolCounters.set(proto, (this.protocolCounters.get(proto) ?? 0) + 1);
    }

    const handlers: Array<Promise<void>> = [];
    for (const sub of this.subscriptions.values()) {
      const typeMatch = sub.eventTypes === "*" || sub.eventTypes.includes(full.type);
      const domainMatch =
        !sub.domains ||
        sub.domains === "*" ||
        sub.domains.includes(full.domain) ||
        sub.domains.includes("global" as PrismDomain);

      const protocolMatch =
        !sub.protocols ||
        sub.protocols === "*" ||
        !full.protocol?.protocol ||
        sub.protocols.includes(full.protocol.protocol);

      if (typeMatch && domainMatch && protocolMatch) {
        handlers.push(
          Promise.resolve(sub.handler(full)).catch(() => {})
        );
      }
    }

    if (handlers.length > 0) {
      Promise.all(handlers).catch(() => {});
    }

    await this.applyBridgeRules(full);

    return full;
  }

  registerBridgeRule(rule: BridgeRule): void {
    this.bridgeRules.push(rule);
  }

  private async applyBridgeRules(event: PrismBusEvent): Promise<void> {
    if (!event.protocol?.protocol) return;

    for (const rule of this.bridgeRules) {
      if (rule.fromProtocol !== event.protocol.protocol) continue;
      if (rule.eventType !== "*" && rule.eventType !== event.type) continue;

      const bridgedEvent = rule.handler(event, rule.toProtocol);
      if (!bridgedEvent) continue;

      bridgedEvent.protocol = {
        ...bridgedEvent.protocol,
        protocol: rule.toProtocol,
        crossingFromProtocol: rule.fromProtocol,
        crossingToProtocol: rule.toProtocol,
      };

      this.crossingHistory.push({
        from: rule.fromProtocol,
        to: rule.toProtocol,
        eventId: event.id,
        timestamp: Date.now(),
      });

      this.history.unshift(bridgedEvent);
      if (this.history.length > PRISM_BUS_MAX_HISTORY) {
        this.history.length = PRISM_BUS_MAX_HISTORY;
      }

      const bridgeHandlers: Array<Promise<void>> = [];
      for (const sub of this.subscriptions.values()) {
        const typeMatch = sub.eventTypes === "*" || sub.eventTypes.includes(bridgedEvent.type);
        const domainMatch =
          !sub.domains ||
          sub.domains === "*" ||
          sub.domains.includes(bridgedEvent.domain) ||
          sub.domains.includes("global" as PrismDomain);
        const protocolMatch =
          !sub.protocols || sub.protocols === "*" || sub.protocols.includes(rule.toProtocol);
        if (typeMatch && domainMatch && protocolMatch) {
          bridgeHandlers.push(
            Promise.resolve(sub.handler(bridgedEvent)).catch(() => {})
          );
        }
      }
      if (bridgeHandlers.length > 0) {
        Promise.all(bridgeHandlers).catch(() => {});
      }
    }
  }

  publishProtocolEvent(
    type: PrismBusEventType,
    protocol: ProtocolLayer,
    domain: PrismDomain,
    payload: Record<string, unknown>,
    options?: {
      agentId?: string;
      taskId?: string;
      did?: string;
      trustLevel?: "trusted" | "verified" | "anonymous";
      correlationId?: string;
      severity?: PrismBusEvent["severity"];
    }
  ): Promise<PrismBusEvent> {
    return this.publish({
      type,
      domain,
      sourceId: options?.agentId ?? `${protocol}-gateway`,
      payload,
      severity: options?.severity ?? "info",
      correlationId: options?.correlationId,
      protocol: {
        protocol,
        agentId: options?.agentId,
        taskId: options?.taskId,
        did: options?.did,
        trustLevel: options?.trustLevel,
      },
    });
  }

  getHistory(options: {
    limit?: number;
    type?: PrismBusEventType;
    domain?: PrismDomain;
    since?: number;
    correlationId?: string;
    protocol?: ProtocolLayer;
  } = {}): PrismBusEvent[] {
    let results = this.history;
    if (options.type) results = results.filter(e => e.type === options.type);
    if (options.domain) results = results.filter(e => e.domain === options.domain);
    if (options.since) results = results.filter(e => e.timestamp >= options.since!);
    if (options.correlationId) results = results.filter(e => e.correlationId === options.correlationId);
    if (options.protocol) results = results.filter(e => e.protocol?.protocol === options.protocol);
    return results.slice(0, options.limit ?? 100);
  }

  getCrossings(limit = 50): Array<{ from: ProtocolLayer; to: ProtocolLayer; eventId: string; timestamp: number }> {
    return this.crossingHistory.slice(-limit).reverse();
  }

  getStats() {
    const byType: Record<string, number> = {};
    for (const [type, count] of this.counters) {
      byType[type] = count;
    }

    const byProtocol: Record<string, number> = {};
    for (const [proto, count] of this.protocolCounters) {
      byProtocol[proto] = count;
    }

    return {
      totalPublished: Array.from(this.counters.values()).reduce((a, b) => a + b, 0),
      byType,
      byProtocol,
      crossingCount: this.crossingHistory.length,
      subscriptionCount: this.subscriptions.size,
      historySize: this.history.length,
    };
  }
}

export const prismBus = new PrismEventBus();

prismBus.registerBridgeRule({
  fromProtocol: "mcp",
  toProtocol: "a2a",
  eventType: "tool_result",
  handler: (event, targetProtocol) => ({
    ...event,
    id: `bridge-${event.id}`,
    type: "workflow_triggered" as PrismBusEventType,
    payload: {
      ...event.payload,
      bridgedFrom: "mcp",
      bridgedTo: targetProtocol,
      originalEventId: event.id,
      bridgeTimestamp: Date.now(),
    },
  }),
});

prismBus.registerBridgeRule({
  fromProtocol: "a2a",
  toProtocol: "anp",
  eventType: "workflow_completed",
  handler: (event, targetProtocol) => ({
    ...event,
    id: `bridge-anp-${event.id}`,
    type: "artifact_created" as PrismBusEventType,
    payload: {
      ...event.payload,
      "@context": ["https://w3id.org/anp/v1"],
      "@type": "BroadcastArtifact",
      bridgedFrom: "a2a",
      bridgedTo: targetProtocol,
      originalEventId: event.id,
    },
  }),
});
