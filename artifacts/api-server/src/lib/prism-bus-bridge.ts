import { prismBus, type PrismBusEvent } from "@szl-holdings/prism-bus";
import { publish, WS_CHANNELS } from "./websocket";
import { publishToSse } from "./sse-server";
import { logger } from "./logger";
import type { PrismDomain } from "@szl-holdings/prism-bus";

function broadcastToAll(channel: string, event: string, data: unknown, tenantId?: string | null): void {
  publish(channel, event, data, tenantId);
  publishToSse(channel, event, data, tenantId);
}

function domainToChannels(busEvent: PrismBusEvent): string[] {
  const domainMap: Partial<Record<PrismDomain, string[]>> = {
    aegis: [WS_CHANNELS.AEGIS_INCIDENTS, WS_CHANNELS.AEGIS_ALERT_FEED],
    vessels: [WS_CHANNELS.VESSEL_POSITIONS, WS_CHANNELS.VESSELS_FLEET_POSITIONS],
    lyte: [WS_CHANNELS.LYTE_METRICS, WS_CHANNELS.LYTE_METRICS_STREAM],
    terra: [WS_CHANNELS.TERRA_SIGNALS],
    global: [WS_CHANNELS.NOTIFICATIONS],
  };

  const eventTypeToChannels: Partial<Record<PrismBusEvent["type"], string[]>> = {
    workflow_triggered: [WS_CHANNELS.WORKFLOW_RUNS],
    workflow_completed: [WS_CHANNELS.WORKFLOW_RUNS],
    workflow_failed: [WS_CHANNELS.WORKFLOW_RUNS],
    approval_requested: [WS_CHANNELS.NOTIFICATIONS],
    approval_decided: [WS_CHANNELS.NOTIFICATIONS],
    execution_started: [WS_CHANNELS.JOB_QUEUE],
    execution_completed: [WS_CHANNELS.JOB_QUEUE],
    execution_failed: [WS_CHANNELS.JOB_QUEUE],
    cross_domain_correlation: [WS_CHANNELS.NOTIFICATIONS],
  };

  const fromDomain = domainMap[busEvent.domain] ?? [];
  const fromEventType = eventTypeToChannels[busEvent.type] ?? [];

  const channels = new Set([...fromDomain, ...fromEventType]);

  if (busEvent.type === "domain_signal" && busEvent.domain === "aegis") {
    channels.add(WS_CHANNELS.NEXUS_INTELLIGENCE_FEED);
  }

  return Array.from(channels);
}

let unsubscribe: (() => void) | null = null;
let bridgedCount = 0;

export function startPrismBusBridge(): void {
  if (unsubscribe) {
    logger.warn("Prism Bus bridge already started — skipping");
    return;
  }

  unsubscribe = prismBus.subscribe(
    "ws-bridge",
    "*",
    async (event: PrismBusEvent) => {
      try {
        const channels = domainToChannels(event);
        if (channels.length === 0) return;

        const wsEvent = event.type.replace(/_/g, "-");
        const payload = {
          id: event.id,
          type: event.type,
          domain: event.domain,
          sourceId: event.sourceId,
          severity: event.severity,
          payload: event.payload,
          timestamp: event.timestamp,
          correlationId: event.correlationId,
        };

        bridgedCount++;

        for (const channel of channels) {
          broadcastToAll(channel, wsEvent, payload, event.tenantId);
        }

        if (event.severity === "high" || event.severity === "critical") {
          broadcastToAll(WS_CHANNELS.NOTIFICATIONS, wsEvent, {
            ...payload,
            channel: channels[0],
            urgent: true,
          }, event.tenantId);
        }
      } catch (err) {
        logger.warn({ err, eventId: event.id }, "Prism Bus bridge error");
      }
    },
    "*"
  );

  logger.info("Prism Bus → WebSocket bridge started");
}

export function stopPrismBusBridge(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    logger.info("Prism Bus bridge stopped");
  }
}

export function getPrismBridgeStats() {
  return {
    active: unsubscribe !== null,
    bridgedCount,
  };
}
