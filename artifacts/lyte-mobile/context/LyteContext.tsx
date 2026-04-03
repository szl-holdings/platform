import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface LyteSignal {
  id: string;
  source: string;
  severity: Severity;
  title: string;
  status: string;
  body?: string;
  receivedAt: string;
  correlationReason?: string;
  recommendedAction?: string;
  metadata?: Record<string, unknown>;
}

export interface LyteIncident {
  id: number;
  title: string;
  severity: Severity;
  status: string;
  impactArea?: string;
  createdAt: string;
}

export interface LyteAction {
  id: number;
  title: string;
  state: string;
  priority?: string;
  urgency?: string;
  assignedTo?: string;
  dueAt?: string;
  description?: string;
  valueAtRisk?: string;
  escalationTimeline?: EscalationEvent[];
  metadata?: Record<string, unknown>;
}

export interface EscalationEvent {
  timestamp: string;
  actor: string;
  action: string;
  notes?: string;
}

export interface PlatformHealth {
  name: string;
  slug: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  uptime: number;
  errorRate: number;
  p95Latency: number;
  alertCount: number;
  slaCompliance: number;
}

interface RawSignalResponse {
  data?: RawSignal[];
  signals?: RawSignal[];
}

interface RawSignal {
  id: string | number;
  source?: string;
  severity?: string;
  title?: string;
  name?: string;
  status?: string;
  body?: string;
  value?: string;
  receivedAt?: string;
  correlationReason?: string;
  recommendedAction?: string;
  metadata?: Record<string, unknown>;
}

interface RawActionResponse {
  data?: RawAction[];
}

interface RawAction {
  id: number;
  title?: string;
  state?: string;
  priority?: string;
  urgency?: string;
  assignedTo?: string;
  dueAt?: string;
  description?: string;
  valueAtRisk?: string;
  escalationTimeline?: EscalationEvent[];
  metadata?: Record<string, unknown>;
}

interface RawIncidentResponse {
  data?: RawIncident[];
}

interface RawIncident {
  id: number;
  title?: string;
  severity?: string;
  status?: string;
  impactArea?: string;
  createdAt?: string;
}

interface RawHealthResponse {
  platforms?: PlatformHealth[];
}

export interface FetchError {
  endpoint: string;
  status?: number;
  message: string;
}

interface LyteContextValue {
  signals: LyteSignal[];
  incidents: LyteIncident[];
  actions: LyteAction[];
  platforms: PlatformHealth[];
  isConnected: boolean;
  isLoading: boolean;
  criticalCount: number;
  activeAlertCount: number;
  lastErrors: FetchError[];
  reload: () => void;
}

const LyteContext = createContext<LyteContextValue>({
  signals: [],
  incidents: [],
  actions: [],
  platforms: [],
  isConnected: false,
  isLoading: true,
  criticalCount: 0,
  activeAlertCount: 0,
  lastErrors: [],
  reload: () => {},
});

const BASE_PLATFORMS: PlatformHealth[] = [
  { name: "Lyte Command Center", slug: "lyte-command-center", status: "unknown", uptime: 0, errorRate: 0, p95Latency: 0, alertCount: 0, slaCompliance: 0 },
  { name: "Aegis Defense", slug: "firestorm", status: "unknown", uptime: 0, errorRate: 0, p95Latency: 0, alertCount: 0, slaCompliance: 0 },
  { name: "Vessels Maritime", slug: "vessels", status: "unknown", uptime: 0, errorRate: 0, p95Latency: 0, alertCount: 0, slaCompliance: 0 },
  { name: "Terra Real Estate", slug: "terra", status: "unknown", uptime: 0, errorRate: 0, p95Latency: 0, alertCount: 0, slaCompliance: 0 },
  { name: "SZL Holdings", slug: "szl-holdings", status: "unknown", uptime: 0, errorRate: 0, p95Latency: 0, alertCount: 0, slaCompliance: 0 },
  { name: "API Server", slug: "api-server", status: "unknown", uptime: 0, errorRate: 0, p95Latency: 0, alertCount: 0, slaCompliance: 0 },
];

function coerceSeverity(raw?: string): Severity {
  const valid: Severity[] = ["critical", "high", "medium", "low", "info"];
  const lower = (raw ?? "").toLowerCase();
  return valid.includes(lower as Severity) ? (lower as Severity) : "info";
}

function getBaseUrl(): string {
  return process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
    : "";
}

function normalizeSignals(data: RawSignal[]): LyteSignal[] {
  return data.map(s => ({
    id: String(s.id),
    source: s.source ?? "system",
    severity: coerceSeverity(s.severity),
    title: s.title ?? s.name ?? "Unnamed Signal",
    status: s.status ?? "new",
    body: s.body ?? s.value,
    receivedAt: s.receivedAt ?? new Date().toISOString(),
    correlationReason: s.correlationReason,
    recommendedAction: s.recommendedAction ?? (s.metadata?.recommendedAction as string | undefined),
    metadata: s.metadata,
  }));
}

export function LyteProvider({ children }: { children: React.ReactNode }) {
  const { buildHeaders, buildWsAuthMessage, isReady } = useAuth();
  const [signals, setSignals] = useState<LyteSignal[]>([]);
  const [incidents, setIncidents] = useState<LyteIncident[]>([]);
  const [actions, setActions] = useState<LyteAction[]>([]);
  const [platforms, setPlatforms] = useState<PlatformHealth[]>(BASE_PLATFORMS);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastErrors, setLastErrors] = useState<FetchError[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchEndpoint = useCallback(
    async <T,>(path: string): Promise<{ data: T | null; error: FetchError | null }> => {
      const base = getBaseUrl();
      const url = `${base}${path}`;
      try {
        const res = await fetch(url, { headers: buildHeaders() });
        if (!res.ok) {
          return {
            data: null,
            error: { endpoint: path, status: res.status, message: `HTTP ${res.status}` },
          };
        }
        const json = (await res.json()) as T;
        return { data: json, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error";
        return { data: null, error: { endpoint: path, message } };
      }
    },
    [buildHeaders]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const errors: FetchError[] = [];

    const [signalsResult, incidentsResult, actionsResult, liveSignalsResult, healthResult] =
      await Promise.all([
        fetchEndpoint<RawSignalResponse | RawSignal[]>("/api/lyte/signals?limit=50"),
        fetchEndpoint<RawIncidentResponse | RawIncident[]>("/api/lyte/incidents?limit=20"),
        fetchEndpoint<RawActionResponse | RawAction[]>("/api/lyte/actions?limit=30"),
        fetchEndpoint<RawSignalResponse>("/api/lyte/live/signals"),
        fetchEndpoint<RawHealthResponse | PlatformHealth[]>("/api/lyte/health"),
      ]);

    if (signalsResult.error) {
      errors.push(signalsResult.error);
    } else if (signalsResult.data !== null) {
      const val = signalsResult.data;
      const raw: RawSignal[] = Array.isArray(val)
        ? val
        : Array.isArray((val as RawSignalResponse).data)
        ? (val as RawSignalResponse).data!
        : [];
      setSignals(normalizeSignals(raw));
    }

    if (incidentsResult.error) {
      errors.push(incidentsResult.error);
    } else if (incidentsResult.data !== null) {
      const val = incidentsResult.data;
      const raw: RawIncident[] = Array.isArray(val)
        ? val
        : Array.isArray((val as RawIncidentResponse).data)
        ? (val as RawIncidentResponse).data!
        : [];
      setIncidents(raw.map(i => ({
        id: i.id,
        title: i.title ?? "Untitled Incident",
        severity: coerceSeverity(i.severity),
        status: i.status ?? "open",
        impactArea: i.impactArea,
        createdAt: i.createdAt ?? new Date().toISOString(),
      })));
    }

    if (actionsResult.error) {
      errors.push(actionsResult.error);
    } else if (actionsResult.data !== null) {
      const val = actionsResult.data;
      const raw: RawAction[] = Array.isArray(val)
        ? val
        : Array.isArray((val as RawActionResponse).data)
        ? (val as RawActionResponse).data!
        : [];
      setActions(raw.map(a => ({
        id: a.id,
        title: a.title ?? "Untitled Action",
        state: a.state ?? "open",
        priority: a.priority,
        urgency: a.urgency,
        assignedTo: a.assignedTo,
        dueAt: a.dueAt,
        description: a.description,
        valueAtRisk: a.valueAtRisk,
        escalationTimeline: a.escalationTimeline,
        metadata: a.metadata,
      })));
    }

    if (liveSignalsResult.data !== null) {
      const val = liveSignalsResult.data;
      const rawLive: RawSignal[] = Array.isArray(val.signals)
        ? val.signals
        : Array.isArray(val.data)
        ? val.data!
        : [];
      if (rawLive.length > 0) {
        const mapped = normalizeSignals(rawLive);
        setSignals(prev => {
          const ids = new Set(prev.map(s => s.id));
          return [...prev, ...mapped.filter(s => !ids.has(s.id))];
        });
      }
    }

    if (healthResult.error) {
      errors.push(healthResult.error);
    } else if (healthResult.data !== null) {
      const val = healthResult.data;
      const fetched: PlatformHealth[] = Array.isArray(val)
        ? val
        : Array.isArray((val as RawHealthResponse).platforms)
        ? (val as RawHealthResponse).platforms!
        : [];
      if (fetched.length > 0) {
        setPlatforms(fetched);
      }
    }

    setLastErrors(errors);
    setIsLoading(false);
  }, [fetchEndpoint]);

  const connectWebSocket = useCallback(() => {
    if (Platform.OS === "web") return;
    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    if (!domain) return;
    try {
      const wsUrl = `wss://${domain}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

      ws.onopen = () => {
        setIsConnected(true);
        const authMsg = buildWsAuthMessage();
        if (authMsg) ws.send(authMsg);
      };
      ws.onclose = (event) => {
        setIsConnected(false);
        if (event.code !== 1000) {
          reconnectTimer = setTimeout(connectWebSocket, 5000);
        }
      };
      ws.onerror = () => {
        ws.close();
      };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { channel?: string };
          if (msg.channel === "lyte-metrics") {
            fetchData();
          }
        } catch {
          console.warn("[LyteContext] Unparseable WebSocket message received");
        }
      };
    } catch (err) {
      console.warn("[LyteContext] WebSocket connection failed:", err instanceof Error ? err.message : err);
    }
  }, [buildWsAuthMessage, fetchData]);

  const reload = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isReady) return;
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData, isReady]);

  useEffect(() => {
    if (!isReady) return;
    connectWebSocket();
    return () => {
      wsRef.current?.close(1000, "unmounted");
    };
  }, [connectWebSocket, isReady]);

  const criticalCount = signals.filter(
    s => s.severity === "critical" && s.status !== "resolved"
  ).length;
  const activeAlertCount = actions.filter(
    a => !["resolved", "dismissed"].includes(a.state)
  ).length;

  return (
    <LyteContext.Provider
      value={{ signals, incidents, actions, platforms, isConnected, isLoading, criticalCount, activeAlertCount, lastErrors, reload }}
    >
      {children}
    </LyteContext.Provider>
  );
}

export function useLyte() {
  return useContext(LyteContext);
}
