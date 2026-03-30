import type { DoctrineLayer, NormalizedEvent } from "./types.js";

const MAX_EVENTS = 500;

type EventListener = (event: NormalizedEvent) => void;

class DoctrineEventBus {
  private events: NormalizedEvent[] = [];
  private listeners: Set<EventListener> = new Set();
  private appListeners: Map<string, Set<EventListener>> = new Map();
  private layerListeners: Map<DoctrineLayer, Set<EventListener>> = new Map();

  emit(event: Omit<NormalizedEvent, "id" | "timestamp"> & { id?: string; timestamp?: number }): NormalizedEvent {
    const normalized: NormalizedEvent = {
      ...event,
      id: event.id ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: event.timestamp ?? Date.now(),
    };

    this.events.unshift(normalized);
    if (this.events.length > MAX_EVENTS) {
      this.events.splice(MAX_EVENTS);
    }

    this.listeners.forEach((l) => l(normalized));

    const appSubs = this.appListeners.get(normalized.sourceApp);
    if (appSubs) appSubs.forEach((l) => l(normalized));

    const layerSubs = this.layerListeners.get(normalized.layer);
    if (layerSubs) layerSubs.forEach((l) => l(normalized));

    this._persistToApi(normalized);

    return normalized;
  }

  private _persistToApi(event: NormalizedEvent): void {
    if (typeof fetch === "undefined") return;
    fetch("/api/doctrine/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(event),
    }).catch(() => {
    });
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToApp(appId: string, listener: EventListener): () => void {
    if (!this.appListeners.has(appId)) {
      this.appListeners.set(appId, new Set());
    }
    this.appListeners.get(appId)!.add(listener);
    return () => this.appListeners.get(appId)?.delete(listener);
  }

  subscribeToLayer(layer: DoctrineLayer, listener: EventListener): () => void {
    if (!this.layerListeners.has(layer)) {
      this.layerListeners.set(layer, new Set());
    }
    this.layerListeners.get(layer)!.add(listener);
    return () => this.layerListeners.get(layer)?.delete(listener);
  }

  getEvents(options?: {
    limit?: number;
    sourceApp?: string;
    layer?: DoctrineLayer;
    severity?: NormalizedEvent["severity"];
    type?: NormalizedEvent["type"];
    since?: number;
  }): NormalizedEvent[] {
    let results = [...this.events];

    if (options?.sourceApp) {
      results = results.filter((e) => e.sourceApp === options.sourceApp);
    }
    if (options?.layer) {
      results = results.filter((e) => e.layer === options.layer);
    }
    if (options?.severity) {
      results = results.filter((e) => e.severity === options.severity);
    }
    if (options?.type) {
      results = results.filter((e) => e.type === options.type);
    }
    if (options?.since) {
      results = results.filter((e) => e.timestamp >= options.since!);
    }

    return results.slice(0, options?.limit ?? 100);
  }

  getEventsByApp(): Map<string, NormalizedEvent[]> {
    const byApp = new Map<string, NormalizedEvent[]>();
    for (const event of this.events) {
      if (!byApp.has(event.sourceApp)) byApp.set(event.sourceApp, []);
      byApp.get(event.sourceApp)!.push(event);
    }
    return byApp;
  }

  getEventsByLayer(): Map<DoctrineLayer, NormalizedEvent[]> {
    const byLayer = new Map<DoctrineLayer, NormalizedEvent[]>();
    for (const event of this.events) {
      if (!byLayer.has(event.layer)) byLayer.set(event.layer, []);
      byLayer.get(event.layer)!.push(event);
    }
    return byLayer;
  }

  correlate(options: { windowMs?: number; minApps?: number } = {}): CorrelatedEventGroup[] {
    const { windowMs = 300_000, minApps = 2 } = options;
    const now = Date.now();
    const recent = this.events.filter((e) => e.timestamp >= now - windowMs);

    const groups = new Map<string, CorrelatedEventGroup>();

    for (const event of recent) {
      const window = recent.filter(
        (e) =>
          e !== event &&
          Math.abs(e.timestamp - event.timestamp) <= 60_000 &&
          e.severity === event.severity
      );

      if (window.length >= minApps - 1) {
        const key = [event, ...window]
          .map((e) => e.sourceApp)
          .sort()
          .join("|");

        if (!groups.has(key)) {
          const allEvents = [event, ...window];
          const apps = [...new Set(allEvents.map((e) => e.sourceApp))];
          const layers = [...new Set(allEvents.map((e) => e.layer))] as DoctrineLayer[];
          groups.set(key, {
            id: `corr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            events: allEvents,
            sourceApps: apps,
            layers,
            severity: event.severity,
            windowMs,
            detectedAt: now,
          });
        }
      }
    }

    return [...groups.values()];
  }

  clear() {
    this.events = [];
  }
}

export interface CorrelatedEventGroup {
  id: string;
  events: NormalizedEvent[];
  sourceApps: string[];
  layers: DoctrineLayer[];
  severity: NormalizedEvent["severity"];
  windowMs: number;
  detectedAt: number;
}

export const doctrineEventBus = new DoctrineEventBus();

export function seedDoctrineEvents() {
  const apps: Array<{ id: string; layer: DoctrineLayer }> = [
    { id: "vessels", layer: "OBSERVE" },
    { id: "firestorm", layer: "UNDERSTAND" },
    { id: "inca", layer: "UNDERSTAND" },
    { id: "lyte", layer: "DECIDE" },
    { id: "alloy", layer: "EXECUTE" },
    { id: "msp", layer: "OBSERVE" },
    { id: "carlota-jo", layer: "EXECUTE" },
    { id: "terra", layer: "OBSERVE" },
    { id: "dreamscape", layer: "EXECUTE" },
    { id: "szl-holdings", layer: "OBSERVE" },
  ];

  const templates: Array<{
    type: NormalizedEvent["type"];
    severity: NormalizedEvent["severity"];
    titles: string[];
  }> = [
    {
      type: "observation",
      severity: "info",
      titles: [
        "Telemetry baseline established",
        "Signal correlation active",
        "Entity graph refreshed",
        "Watchlist scan complete",
      ],
    },
    {
      type: "anomaly",
      severity: "warning",
      titles: [
        "Behavioral drift detected",
        "Anomalous pattern identified",
        "Threshold exceeded — monitoring",
        "Signal spike above baseline",
      ],
    },
    {
      type: "alert",
      severity: "critical",
      titles: [
        "Critical threshold breached",
        "Incident escalated",
        "High-severity alert triggered",
        "Immediate attention required",
      ],
    },
    {
      type: "recommendation",
      severity: "info",
      titles: [
        "Optimization opportunity identified",
        "Proactive recommendation generated",
        "Risk mitigation suggestion available",
        "Playbook recommendation ready",
      ],
    },
    {
      type: "workflow",
      severity: "info",
      titles: [
        "Approval workflow initiated",
        "Escalation routed to owner",
        "Automated response triggered",
        "SLA checkpoint reached",
      ],
    },
    {
      type: "execution",
      severity: "info",
      titles: [
        "Automation executed successfully",
        "Connector sync completed",
        "DAG run completed",
        "Retry succeeded after failure",
      ],
    },
  ];

  const now = Date.now();
  for (let i = 0; i < 40; i++) {
    const app = apps[Math.floor(Math.random() * apps.length)]!;
    const template = templates[Math.floor(Math.random() * templates.length)]!;
    const titleArr = template.titles;
    const title = titleArr[Math.floor(Math.random() * titleArr.length)]!;

    doctrineEventBus.emit({
      type: template.type,
      sourceApp: app.id,
      layer: app.layer,
      severity: template.severity,
      title,
      description: `${title} — sourced from ${app.id} at the ${app.layer} layer.`,
      entitiesInvolved: [],
      timestamp: now - Math.floor(Math.random() * 7_200_000),
    });
  }
}
