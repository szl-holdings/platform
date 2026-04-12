import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronDown,
  ChevronRight, Clock, Filter, Globe, Radio, Shield, Ship,
  Zap, Building2, Scale, Users, X, Cpu, RefreshCw,
  Bot, Layers, Search, Wifi, WifiOff, Heart, Brain, Workflow
} from "lucide-react";

const BG = {
  page: "#060a10",
  surface: "#0a0f18",
  elevated: "#0d1320",
  panel: "#0c1119",
};
const BORDER = {
  subtle: "rgba(255,255,255,0.04)",
  muted: "rgba(255,255,255,0.06)",
  accent: "rgba(45,212,191,0.10)",
};
const TEXT = {
  primary: "rgba(255,255,255,0.88)",
  secondary: "rgba(255,255,255,0.52)",
  tertiary: "rgba(255,255,255,0.28)",
  muted: "rgba(255,255,255,0.14)",
};
const ELECTRIC = "#2dd4bf";
const ELECTRIC_DIM = "rgba(45,212,191,0.10)";

type Domain = "aegis" | "vessels" | "terra" | "prism" | "carlotajo" | "alloy";
type Severity = "critical" | "high" | "medium" | "low" | "info";
type ActionDecision = "approve" | "reject" | "escalate" | "delegate";
type WsStatus = "idle" | "connecting" | "connected" | "disconnected" | "error" | "auth_failed";

interface DomainConfig {
  id: Domain;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: typeof Shield;
  externalPath: string;
  wsChannels: string[];
  prismLens?: string;
}

const PRISM_LENSES = [
  { key: "P", label: "Pulse", color: "#d4a054", icon: Heart, desc: "Organizational health and baseline metrics" },
  { key: "R", label: "Risk", color: "#c45a4a", icon: AlertTriangle, desc: "Exposure, bottlenecks, and business damage potential" },
  { key: "I", label: "Intelligence", color: "#8b7ac8", icon: Brain, desc: "AI-driven synthesis and cross-domain correlation" },
  { key: "S", label: "Signals", color: "#c8953c", icon: Radio, desc: "Structured events indicating operational state changes" },
  { key: "M", label: "Motion", color: "#4a90b8", icon: Workflow, desc: "Velocity and integrity of governed workflows" },
];

const ARCHITECTURE_LAYERS = [
  { num: "01", label: "Why", desc: "Close the gap between signal and accountable action", active: true },
  { num: "02", label: "Lyte", desc: "The command layer — PRISM observability", active: true },
  { num: "03", label: "Alloy", desc: "The action spine — structured execution + HITL approval", active: true },
  { num: "04", label: "Packs", desc: "Domain-specific extensions (Aegis, Vessels, Terra, PRISM Counsel)", active: true },
  { num: "05", label: "Proof Chain", desc: "Immutable lineage: signal → recommendation → approval → execution", active: true },
  { num: "06", label: "Worldline", desc: "External intelligence — market and regulatory context", active: false },
  { num: "07", label: "GraphQL", desc: "Typed, tenant-scoped control plane", active: true },
  { num: "08", label: "Model Mesh", desc: "Governed AI model selection, inference, and validation", active: true },
  { num: "09", label: "Trust", desc: "Infrastructure-level approval gates (4-tier model)", active: true },
  { num: "10", label: "Moat", desc: "The compounding combination of all 10 properties", active: true },
];

const DOMAINS: Record<Domain, DomainConfig> = {
  aegis: {
    id: "aegis", label: "Aegis", shortLabel: "AEG",
    color: "#4f6ef7", bg: "rgba(79,110,247,0.08)", icon: Shield,
    externalPath: "/firestorm/", wsChannels: ["aegis-incidents"],
    prismLens: "Risk",
  },
  vessels: {
    id: "vessels", label: "Vessels", shortLabel: "VES",
    color: "#38bdf8", bg: "rgba(56,189,248,0.08)", icon: Ship,
    externalPath: "/vessels/", wsChannels: ["vessel-positions"],
    prismLens: "Signals",
  },
  terra: {
    id: "terra", label: "Terra", shortLabel: "TER",
    color: "#a07848", bg: "rgba(160,120,72,0.08)", icon: Building2,
    externalPath: "/terra/", wsChannels: ["terra-signals"],
    prismLens: "Intelligence",
  },
  prism: {
    id: "prism", label: "PRISM Counsel", shortLabel: "PRM",
    color: "#d4a054", bg: "rgba(212,160,84,0.08)", icon: Scale,
    externalPath: "/prism-counsel/", wsChannels: ["notifications", "workflow-runs"],
    prismLens: "Motion",
  },
  carlotajo: {
    id: "carlotajo", label: "Carlota Jo", shortLabel: "CLJ",
    color: "#c4956a", bg: "rgba(196,149,106,0.08)", icon: Users,
    externalPath: "/carlota-jo/", wsChannels: ["bookings"],
    prismLens: "Pulse",
  },
  alloy: {
    id: "alloy", label: "Alloy", shortLabel: "ALY",
    color: "#6c8ebf", bg: "rgba(108,142,191,0.08)", icon: Cpu,
    externalPath: "/alloy/", wsChannels: ["workflow-runs"],
    prismLens: "Motion",
  },
};

const DOMAIN_CHANNEL_MAP: Record<string, Domain | Domain[]> = {
  "aegis-incidents": "aegis",
  "vessel-positions": "vessels",
  "terra-signals": "terra",
  "workflow-runs": ["alloy", "prism"],
  "bookings": "carlotajo",
  "notifications": "prism",
};

function resolveDomainFromChannel(channel: string, data?: Record<string, unknown>): Domain | null {
  const mapping = DOMAIN_CHANNEL_MAP[channel];
  if (!mapping) return null;
  if (typeof mapping === "string") return mapping;
  if (data?.domain && typeof data.domain === "string") {
    const d = data.domain as Domain;
    if (DOMAINS[d]) return d;
  }
  return mapping[0];
}

const ALL_WS_CHANNELS = [
  "aegis-incidents", "vessel-positions", "terra-signals",
  "workflow-runs", "bookings", "notifications",
];

interface TimelineEvent {
  id: string;
  domain: Domain;
  title: string;
  detail: string;
  severity: Severity;
  timestamp: number;
  expanded?: boolean;
  actionRequired?: boolean;
  context?: Record<string, string>;
  deepLink?: string;
  liveWs?: boolean;
  proofChainRef?: string;
  prismLens?: string;
  contextLoading?: boolean;
  contextFetched?: boolean;
}

const DOMAIN_CONTEXT_ENDPOINTS: Record<Domain, string> = {
  aegis: "/firestorm/assessments",
  vessels: "/vessels",
  terra: "/terra/market-intelligence",
  prism: "/ai/mastra/action-engine/approvals",
  carlotajo: "/booking/appointments",
  alloy: "/alloy/workflows",
};

interface PendingAction {
  id: string;
  type: "trigger" | "plan";
  domain: Domain;
  title: string;
  requestedBy: string;
  urgency: Severity;
  age: string;
  aiRecommendation: string;
  stake: string;
  context: string;
  proofChainRef?: string;
}

interface SynthesisMessage {
  id: string;
  text: string;
  timestamp: number;
  domains: Domain[];
  streaming?: boolean;
  prismLenses?: string[];
}

type TimeRange = "1h" | "6h" | "24h" | "7d" | "all";

const SEED_EVENTS: TimelineEvent[] = [
  {
    id: "seed-001", domain: "aegis",
    title: "Elevated threat vector detected — CVE-2024-11482",
    detail: "Palo Alto Networks NGFW — CVSS 9.1 remote code execution. Affects 3 active tenant firewall clusters. Patch available. Aegis Risk Lens has classified this as a compounding exposure event because it intersects with ongoing Ashworth infrastructure dependencies.",
    severity: "critical", timestamp: Date.now() - 4 * 60 * 1000, actionRequired: true,
    context: { "PRISM Lens": "Risk — Exposure", "Affected Systems": "3 firewall clusters", "CVSS Score": "9.1 Critical", "Proof Chain": "pc-sig-28491" },
    deepLink: "/firestorm/intelligence/threats", prismLens: "Risk",
    proofChainRef: "pc-sig-28491",
  },
  {
    id: "seed-002", domain: "vessels",
    title: "M/V Horizon Star — Rotterdam port congestion delay",
    detail: "Estimated 18-hour delay at Port of Rotterdam due to dock worker action. PRISM Signal Layer has correlated this with the Ashworth delivery timeline — extending operational pressure window by 48 hours. Worldline intelligence confirms no alternative berth availability at Europoort.",
    severity: "high", timestamp: Date.now() - 11 * 60 * 1000, actionRequired: false,
    context: { "PRISM Lens": "Signals — Logistics", "Vessel": "M/V Horizon Star", "Port": "Rotterdam", "Worldline Intel": "No Europoort berth" },
    deepLink: "/vessels/fleet", prismLens: "Signals",
    proofChainRef: "pc-sig-28503",
  },
  {
    id: "seed-003", domain: "prism",
    title: "Ashworth filing deadline — 72 hours remaining",
    detail: "Delaware Chancery Court filing for Ashworth Partners LLC. Counsel requires authorization. $4.2M in dispute. PRISM Counsel's PRISM-G framework rates this: Posture=stable, Readiness=high, Integrity=verified, Strategy=counter-claim, Money=$4.2M, Governance=awaiting exec approval.",
    severity: "high", timestamp: Date.now() - 18 * 60 * 1000, actionRequired: true,
    context: { "PRISM-G Rating": "P:stable R:high I:verified S:counter M:$4.2M G:pending", "Deadline": "72 hours", "Proof Chain": "pc-legal-7741" },
    deepLink: "/prism-counsel/matters", prismLens: "Motion",
    proofChainRef: "pc-legal-7741",
  },
  {
    id: "seed-004", domain: "terra",
    title: "Warehouse availability signal — Rotterdam corridor",
    detail: "3 logistics facilities flagged near Rotterdam with 60-day lease availability. Terra Intelligence Lens has cross-referenced these with Vessels disruption data and Ashworth's logistics footprint. Distress pricing window: 14 days. Opportunity score: 87/100.",
    severity: "medium", timestamp: Date.now() - 35 * 60 * 1000, actionRequired: false,
    context: { "PRISM Lens": "Intelligence — Opportunity", "Location": "Rotterdam corridor", "Opportunity Score": "87/100", "Cross-Domain": "Vessels disruption + Ashworth logistics" },
    deepLink: "/terra/opportunities", prismLens: "Intelligence",
    proofChainRef: "pc-terra-9401",
  },
  {
    id: "seed-005", domain: "carlotajo",
    title: "Ashworth advisory session — rescheduled",
    detail: "Q2 strategic advisory session with Ashworth moved to next week. Pulse Lens detects a 12% drop in client engagement frequency over the last 30 days — this event confirms the trend. Agenda updated to include logistics disruption contingency planning.",
    severity: "info", timestamp: Date.now() - 52 * 60 * 1000, actionRequired: false,
    context: { "PRISM Lens": "Pulse — Client Health", "Client": "Ashworth Partners", "Engagement Trend": "−12% / 30d" },
    deepLink: "/carlota-jo/clients", prismLens: "Pulse",
  },
  {
    id: "seed-006", domain: "alloy",
    title: "Workflow: Ashworth risk recompute — completed",
    detail: "Multi-domain risk assessment orchestrated by Alloy (Action Spine, Layer 03). Queried Vessels, PRISM Counsel, and Terra domain packs. Synthesis: logistics delay + legal deadline creates compounded exposure window. Confidence: 87%. All inference steps recorded in Proof Chain.",
    severity: "info", timestamp: Date.now() - 74 * 60 * 1000, actionRequired: false,
    context: { "Architecture Layer": "03 — Alloy Action Spine", "Domains Queried": "vessels, prism, terra", "Confidence": "87%", "Proof Chain": "pc-orch-1741892" },
    deepLink: "/alloy/runs", prismLens: "Motion",
    proofChainRef: "pc-orch-1741892",
  },
];


const SEED_SYNTHESIS: SynthesisMessage[] = [
  {
    id: "syn-001",
    text: "Cross-domain correlation detected via PRISM Signal Fusion: Port congestion at Rotterdam (Vessels/Signals) directly intersects with the Ashworth matter filing deadline (PRISM Counsel/Motion). The logistics delay extends Ashworth's operational pressure window by 48 hours. Intelligence Lens recommends counsel factor this into the counter-claim strategy timeline. This is the kind of multi-domain correlation that monitoring tools like Datadog or Splunk cannot detect — they see infrastructure metrics, not business consequence chains.",
    timestamp: Date.now() - 8 * 60 * 1000, domains: ["vessels", "prism", "carlotajo"],
    prismLenses: ["Signals", "Motion", "Pulse"],
  },
  {
    id: "syn-002",
    text: "Opportunity convergence via Intelligence Lens: Terra is monitoring 3 A-class warehouse facilities in the Rotterdam corridor with 14-day distress pricing windows. These are directly adjacent to Ashworth's primary logistics nodes. The vessel disruption (Signals) creates a window where accelerated site acquisition stabilizes the supply chain — a decision that traditional alerting platforms would never surface because they don't fuse real estate intelligence with maritime logistics data. Alloy has pre-staged an execution plan awaiting approval.",
    timestamp: Date.now() - 3 * 60 * 1000, domains: ["terra", "vessels", "alloy"],
    prismLenses: ["Intelligence", "Signals", "Motion"],
  },
];

function getWsUrl(): string {
  if (typeof window === "undefined") return "ws://localhost/ws";
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function severityColor(s: Severity): string {
  switch (s) {
    case "critical": return "#c45a4a";
    case "high": return "#c8953c";
    case "medium": return "#d4a054";
    case "low": return "#22c55e";
    case "info": return "#6b7280";
  }
}

function severityBg(s: Severity): string {
  switch (s) {
    case "critical": return "rgba(196,90,74,0.10)";
    case "high": return "rgba(200,149,60,0.10)";
    case "medium": return "rgba(212,160,84,0.10)";
    case "low": return "rgba(34,197,94,0.08)";
    case "info": return "rgba(107,114,128,0.10)";
  }
}

function isWithinTimeRange(ts: number, range: TimeRange): boolean {
  if (range === "all") return true;
  const ms = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000 }[range];
  return ts >= Date.now() - ms;
}

function SeverityBadge({ s, small }: { s: Severity; small?: boolean }) {
  return (
    <span
      className={`uppercase tracking-widest font-mono font-semibold ${small ? "text-[7px] px-1 py-0.5" : "text-[8px] px-1.5 py-0.5"} rounded`}
      style={{ color: severityColor(s), background: severityBg(s) }}
    >
      {s}
    </span>
  );
}

function DomainTag({ d, small }: { d: Domain; small?: boolean }) {
  const cfg = DOMAINS[d];
  const Icon = cfg.icon;
  return (
    <span
      className={`flex items-center gap-1 ${small ? "text-[7px] px-1 py-0.5" : "text-[8px] px-1.5 py-0.5"} rounded font-mono font-bold uppercase tracking-wider`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}22` }}
    >
      <Icon className={small ? "w-2 h-2" : "w-2.5 h-2.5"} />
      {cfg.shortLabel}
    </span>
  );
}

function PrismLensTag({ lens }: { lens: string }) {
  const item = PRISM_LENSES.find(p => p.label === lens);
  if (!item) return null;
  return (
    <span
      className="text-[7px] px-1 py-0.5 rounded font-mono font-semibold uppercase tracking-wider flex items-center gap-0.5"
      style={{ color: item.color, background: `${item.color}14`, border: `1px solid ${item.color}1a` }}
    >
      <item.icon className="w-2 h-2" />
      {item.key}·{item.label}
    </span>
  );
}

async function fetchWsTicket(): Promise<string | null> {
  try {
    const resp = await apiFetch<{ ticket: string }>("/auth/ws-ticket", { method: "POST" });
    return resp.ticket;
  } catch {
    return null;
  }
}

function useNerveCenterWS(onEvent: (event: TimelineEvent) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const [wsStatus, setWsStatus] = useState<WsStatus>("idle");
  const [subscribedChannels, setSubscribedChannels] = useState<Set<string>>(new Set());

  const cleanup = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      wsRef.current.onopen = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setSubscribedChannels(new Set());
  }, []);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    cleanup();
    setWsStatus("connecting");

    const ticket = await fetchWsTicket();

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setWsStatus("connected");
      for (const ch of ALL_WS_CHANNELS) {
        const msg: Record<string, string> = { type: "subscribe", channel: ch };
        if (ticket) msg.token = ticket;
        ws.send(JSON.stringify(msg));
      }
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (ev) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(ev.data as string) as {
          type: string; channel?: string; event?: string;
          data?: unknown; code?: string; message?: string;
        };

        if (msg.type === "subscribed" && msg.channel) {
          setSubscribedChannels(prev => new Set([...prev, msg.channel!]));
          return;
        }

        if (msg.type === "error" && msg.code === "unauthorized") {
          setWsStatus("auth_failed");
          return;
        }

        if (msg.type === "message" && msg.channel && msg.data) {
          const domain = resolveDomainFromChannel(msg.channel, msg.data as Record<string, unknown>);
          if (!domain) return;
          const raw = msg.data as Record<string, unknown>;
          const severity: Severity = (raw.severity as Severity) ?? (raw.level as Severity) ?? "info";
          const title = String(raw.title ?? raw.name ?? raw.description ?? msg.event ?? `${DOMAINS[domain].label} event`);
          const detail = String(raw.detail ?? raw.body ?? raw.message ?? title);
          const prismLens = DOMAINS[domain].prismLens;

          const newEvent: TimelineEvent = {
            id: `ws-${msg.channel}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            domain,
            title,
            detail,
            severity,
            timestamp: typeof raw.timestamp === "number" ? raw.timestamp : Date.now(),
            actionRequired: severity === "critical" || severity === "high",
            context: raw.metadata && typeof raw.metadata === "object"
              ? Object.fromEntries(Object.entries(raw.metadata as Record<string, unknown>).slice(0, 4).map(([k, v]) => [k, String(v)]))
              : undefined,
            deepLink: DOMAINS[domain].externalPath,
            liveWs: true,
            prismLens,
          };
          onEvent(newEvent);
        }
      } catch { }
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setWsStatus("error");
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsStatus("disconnected");
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      reconnectRef.current = setTimeout(() => {
        if (mountedRef.current) connect();
      }, 8000);
    };
  }, [cleanup, onEvent]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect, cleanup]);

  return { wsStatus, subscribedChannels };
}

function useAISynthesisStream(events: TimelineEvent[]) {
  const [messages, setMessages] = useState<SynthesisMessage[]>(SEED_SYNTHESIS);
  const lastEventCountRef = useRef(events.length);
  const abortRef = useRef<AbortController | null>(null);

  const triggerSynthesis = useCallback(async (evts: TimelineEvent[]) => {
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const domains = [...new Set(evts.slice(0, 6).map(e => e.domain))];
    const lenses = [...new Set(evts.slice(0, 6).map(e => e.prismLens).filter(Boolean))] as string[];
    if (domains.length < 2) return;

    const msgId = `syn-live-${Date.now()}`;
    setMessages(prev => [{
      id: msgId,
      text: "",
      timestamp: Date.now(),
      domains: domains.slice(0, 3) as Domain[],
      streaming: true,
      prismLenses: lenses.slice(0, 3),
    }, ...prev.slice(0, 8)]);

    try {
      const query = [
        `You are the PRISM Intelligence Lens synthesizer for the Nerve Center. Analyze these cross-domain events and identify connections, risks, and correlations.`,
        `Use PRISM lens terminology (Pulse/Risk/Intelligence/Signals/Motion) to frame your analysis.`,
        `Highlight cross-domain signal fusion insights that traditional monitoring tools (Datadog, Splunk, Grafana) would miss because they only see infrastructure metrics, not business consequence chains.`,
        `Events:`,
        evts.slice(0, 6).map(e => `[${DOMAINS[e.domain].label}/${e.severity}/${e.prismLens ?? ""}] ${e.title}`).join("; "),
        `Respond in 2-3 concise sentences.`,
      ].join(" ");

      const apiBase = window.location.origin;
      const resp = await fetch(`${apiBase}/api/ai/orchestrator/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        credentials: "include",
        signal: ac.signal,
        body: JSON.stringify({ message: query }),
      });

      if (!resp.ok || !resp.body) throw new Error("SSE stream unavailable");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || ac.signal.aborted) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() ?? "";
        let streamDone = false;
        for (const line of parts) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: [DONE]")) {
            streamDone = true;
            break;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.error) throw new Error(json.error);
              const content = json.content ?? "";
              if (content) {
                fullText += content;
                setMessages(prev => prev.map(m =>
                  m.id === msgId ? { ...m, text: fullText } : m
                ));
              }
            } catch { }
          }
        }
        if (streamDone) break;
      }
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, streaming: false, text: fullText || m.text } : m
      ));
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      const fallbackText = `PRISM Intelligence Lens — cross-domain signal fusion: ${evts.slice(0, 3).map(e => `[${DOMAINS[e.domain].shortLabel}/${e.prismLens ?? ""}] ${e.title}`).join(" → ")}. Pattern analysis across ${lenses.join("/")} lenses suggests correlated impact that single-domain monitoring would miss. This is why business observability requires full-spectrum awareness — not just metrics dashboards.`;
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, text: fallbackText, streaming: false } : m
      ));
    }
  }, []);

  useEffect(() => {
    if (events.length <= lastEventCountRef.current) return;
    lastEventCountRef.current = events.length;
    const timer = setTimeout(() => triggerSynthesis(events), 3000);
    return () => clearTimeout(timer);
  }, [events.length, triggerSynthesis]);

  return messages;
}

function TimelineEventCard({ event, onExpand }: { event: TimelineEvent; onExpand: (id: string) => void }) {
  const cfg = DOMAINS[event.domain];
  const Icon = cfg.icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative overflow-hidden"
      style={{
        background: event.liveWs ? "rgba(45,212,191,0.04)" : BG.surface,
        border: `1px solid ${event.expanded ? cfg.color + "28" : event.liveWs ? "rgba(45,212,191,0.10)" : BORDER.subtle}`,
        borderRadius: "8px",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: `linear-gradient(180deg, ${cfg.color}80, ${cfg.color}20)` }} />
      <div className="pl-3 pr-3 pt-2.5 pb-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
            <Icon className="w-3 h-3" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <DomainTag d={event.domain} small />
                <SeverityBadge s={event.severity} small />
                {event.prismLens && <PrismLensTag lens={event.prismLens} />}
                {event.actionRequired && (
                  <span className="text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.10)" }}>
                    HITL Gate
                  </span>
                )}
                {event.liveWs && (
                  <span className="text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded animate-pulse" style={{ color: ELECTRIC, background: ELECTRIC_DIM }}>
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{formatAge(event.timestamp)} ago</span>
                <button onClick={() => onExpand(event.id)} className="w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-white/5">
                  <ChevronDown className="w-3 h-3 transition-transform" style={{ color: TEXT.tertiary, transform: event.expanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
              </div>
            </div>
            <p className="text-[11px] font-medium leading-snug" style={{ color: TEXT.primary }}>{event.title}</p>
            <AnimatePresence initial={false}>
              {event.expanded && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <p className="text-[10px] mt-2 leading-relaxed" style={{ color: TEXT.secondary }}>{event.detail}</p>
                  {event.contextLoading && (
                    <div className="mt-2 flex items-center gap-2 py-1.5 px-2 rounded" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color }} />
                      <span className="text-[8px]" style={{ color: TEXT.muted }}>Fetching domain context from {cfg.label} API…</span>
                    </div>
                  )}
                  {event.context && Object.keys(event.context).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {Object.entries(event.context).map(([k, v]) => (
                        <div key={k} className="rounded px-2 py-1" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                          <div className="text-[7px] uppercase tracking-wider mb-0.5" style={{ color: TEXT.muted }}>{k}</div>
                          <div className="text-[9px] font-mono" style={{ color: TEXT.secondary }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {event.deepLink && (
                      <a href={event.deepLink} className="flex items-center gap-1 text-[8px] hover:opacity-80 transition-opacity" style={{ color: cfg.color }}>
                        Open in {cfg.label} <ArrowUpRight className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {event.proofChainRef && (
                      <span className="flex items-center gap-1 text-[7px] font-mono" style={{ color: "hsl(145,62%,46%)" }}>
                        <Shield className="w-2 h-2" /> Proof: {event.proofChainRef}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InlineActionButtons({ actionId, actionType, onDecision }: {
  actionId: string;
  actionType: "trigger" | "plan";
  onDecision: (id: string, type: ActionDecision) => void;
}) {
  const [processing, setProcessing] = useState(false);

  async function handleInlineAction(type: "approve" | "reject") {
    setProcessing(true);
    try {
      const decision = type === "approve" ? "approved" : "rejected";
      if (actionType === "trigger") {
        await apiFetch(`/ai/mastra/action-engine/approvals/triggers/${actionId}`, {
          method: "POST",
          body: JSON.stringify({ decision, notes: `Quick ${type} via Action Bar` }),
        });
      } else if (actionType === "plan") {
        await apiFetch(`/ai/mastra/action-engine/nla/plans/${actionId}/approve`, {
          method: "POST",
          body: JSON.stringify({ decision, notes: `Quick ${type} via Action Bar` }),
        });
      }
      onDecision(actionId, type);
    } catch {
      setProcessing(false);
    }
  }

  return (
    <div className="flex items-center gap-0.5 ml-1">
      <button
        onClick={(e) => { e.stopPropagation(); handleInlineAction("approve"); }}
        disabled={processing}
        className="px-1.5 py-0.5 rounded text-[7px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}
        title="Quick Approve"
      >
        {processing ? "…" : "✓"}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); handleInlineAction("reject"); }}
        disabled={processing}
        className="px-1.5 py-0.5 rounded text-[7px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
        style={{ background: "rgba(196,90,74,0.12)", color: "#c45a4a" }}
        title="Quick Reject"
      >
        {processing ? "…" : "✗"}
      </button>
    </div>
  );
}

function ActionCard({ action, onDecision, currentUserId }: { action: PendingAction; onDecision: (id: string, type: ActionDecision) => void; currentUserId?: number }) {
  const [confirming, setConfirming] = useState<ActionDecision | null>(null);
  const [processing, setProcessing] = useState(false);
  const cfg = DOMAINS[action.domain];
  const Icon = cfg.icon;

  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(type: ActionDecision) {
    setProcessing(true);
    setError(null);
    try {
      if (type === "approve" || type === "reject") {
        const decision = type === "approve" ? "approved" : "rejected";
        if (action.type === "trigger") {
          await apiFetch(`/ai/mastra/action-engine/approvals/triggers/${action.id}`, {
            method: "POST",
            body: JSON.stringify({ decision, notes: `Executive ${type} via Nerve Center — Proof Chain: ${action.proofChainRef ?? "pending"}` }),
          });
        } else if (action.type === "plan") {
          await apiFetch(`/ai/mastra/action-engine/nla/plans/${action.id}/approve`, {
            method: "POST",
            body: JSON.stringify({ decision, notes: `Executive ${type} via Nerve Center — Proof Chain: ${action.proofChainRef ?? "pending"}` }),
          });
        }
      } else if (type === "escalate") {
        if (!currentUserId) throw new Error("User session not available — please reload the page.");
        await apiFetch(`/notifications`, {
          method: "POST",
          body: JSON.stringify({
            userId: currentUserId,
            type: "action_required",
            title: `Escalated: ${action.title}`,
            message: `Action escalated from Nerve Center. Domain: ${DOMAINS[action.domain].label}. Urgency: ${action.urgency}. Stake: ${action.stake}. Source: ${action.type}/${action.id}. Proof Chain: ${action.proofChainRef ?? "pending"}.`,
            channel: "in_app",
            actionUrl: `/nerve-center`,
          }),
        });
      } else if (type === "delegate") {
        await apiFetch(`/ai/orchestrator/agents/szl-orchestrator/run`, {
          method: "POST",
          body: JSON.stringify({
            task: `Delegate action to appropriate domain team: "${action.title}". Domain: ${DOMAINS[action.domain].label}. Context: ${action.context}. Create a delegation workflow and assign to the ${DOMAINS[action.domain].label} operations team.`,
            context: { sourceActionId: action.id, domain: action.domain, urgency: action.urgency, proofChain: action.proofChainRef },
          }),
        });
      }
      setProcessing(false);
      onDecision(action.id, type);
    } catch (err) {
      setProcessing(false);
      setConfirming(null);
      setError(err instanceof Error ? err.message : "Action failed — check connection and retry.");
    }
  }

  return (
    <motion.div
      layout initial={{ opacity: 1 }} exit={{ opacity: 0, x: 20, scale: 0.96 }}
      className="rounded-lg overflow-hidden"
      style={{ background: BG.surface, border: `1px solid ${action.urgency === "critical" ? "rgba(196,90,74,0.18)" : BORDER.muted}` }}
    >
      <div className="p-3">
        <div className="flex items-start gap-2.5 mb-2">
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.bg }}>
            <Icon className="w-3 h-3" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <DomainTag d={action.domain} small />
              <SeverityBadge s={action.urgency} small />
              <span className="text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: "hsl(145,62%,46%)", background: "rgba(72,187,120,0.10)" }}>
                Trust Layer 09
              </span>
              <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>
                <Clock className="w-2 h-2 inline mr-0.5" />{action.age} old
              </span>
            </div>
            <p className="text-[11px] font-medium leading-snug" style={{ color: TEXT.primary }}>{action.title}</p>
            <p className="text-[9px] mt-0.5" style={{ color: TEXT.muted }}>Requested by {action.requestedBy}</p>
          </div>
        </div>

        <div className="rounded p-2 mb-2" style={{ background: "rgba(139,122,200,0.06)", border: `1px solid rgba(139,122,200,0.12)` }}>
          <div className="flex items-start gap-1.5">
            <Brain className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: "#8b7ac8" }} />
            <div>
              <div className="text-[7px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "#8b7ac8" }}>Intelligence Lens Recommendation</div>
              <p className="text-[9px] leading-relaxed" style={{ color: "rgba(139,122,200,0.80)" }}>{action.aiRecommendation}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[8px]" style={{ color: TEXT.tertiary }}>
            Stake: <span className="font-mono" style={{ color: "#c8953c" }}>{action.stake}</span>
          </span>
          {action.proofChainRef && (
            <span className="text-[7px] font-mono flex items-center gap-0.5" style={{ color: "hsl(145,62%,46%)" }}>
              <Shield className="w-2 h-2" /> {action.proofChainRef}
            </span>
          )}
        </div>

        {error && (
          <div className="rounded p-2 mb-2 flex items-center gap-2" style={{ background: "rgba(196,90,74,0.08)", border: "1px solid rgba(196,90,74,0.18)" }}>
            <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: "#c45a4a" }} />
            <span className="text-[9px]" style={{ color: "#c45a4a" }}>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {confirming ? (
            <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="rounded p-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}` }}>
              <p className="text-[9px] mb-1" style={{ color: TEXT.secondary }}>
                Confirm <strong style={{ color: TEXT.primary }}>{confirming}</strong>?
                {confirming === "escalate" ? " This will create an escalation notification via the notifications API." :
                 confirming === "delegate" ? " This will create a delegation workflow via the AI orchestrator." :
                 " This decision will be recorded in the Proof Chain."}
              </p>
              <p className="text-[7px] mb-2 font-mono" style={{ color: "hsl(145,62%,46%)" }}>
                {confirming === "escalate" ? "Escalation via notifications channel — audited in Proof Chain" :
                 confirming === "delegate" ? "Delegation via Alloy orchestrator (Layer 03) — tracked workflow" :
                 "Immutable audit trail — Layer 05 (Proof Chain) + Layer 09 (Trust & Approvals)"}
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleConfirm(confirming)}
                  disabled={processing}
                  className="flex-1 py-1.5 rounded text-[9px] font-medium transition-all hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: confirming === "approve" ? "rgba(34,197,94,0.15)" : confirming === "reject" ? "rgba(196,90,74,0.15)" : confirming === "escalate" ? "rgba(245,158,11,0.15)" : "rgba(139,122,200,0.15)",
                    color: confirming === "approve" ? "#22c55e" : confirming === "reject" ? "#c45a4a" : confirming === "escalate" ? "#f59e0b" : "#8b7ac8",
                  }}
                >
                  {processing ? "Recording decision..." : `Confirm ${confirming}`}
                </button>
                <button
                  onClick={() => setConfirming(null)}
                  disabled={processing}
                  className="px-3 py-1.5 rounded text-[9px] transition-all hover:opacity-80"
                  style={{ background: BG.surface, color: TEXT.tertiary, border: `1px solid ${BORDER.subtle}` }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="grid grid-cols-4 gap-1">
              {([
                { type: "approve" as const, label: "Approve", bg: "rgba(34,197,94,0.10)", color: "#22c55e", border: "rgba(34,197,94,0.14)" },
                { type: "reject" as const, label: "Reject", bg: "rgba(196,90,74,0.10)", color: "#c45a4a", border: "rgba(196,90,74,0.14)" },
                { type: "escalate" as const, label: "Escalate", bg: "rgba(245,158,11,0.10)", color: "#f59e0b", border: "rgba(245,158,11,0.14)" },
                { type: "delegate" as const, label: "Delegate", bg: "rgba(139,122,200,0.10)", color: "#8b7ac8", border: "rgba(139,122,200,0.14)" },
              ]).map(btn => (
                <button
                  key={btn.type}
                  onClick={() => setConfirming(btn.type)}
                  className="py-1.5 rounded text-[8px] font-medium transition-all hover:opacity-80"
                  style={{ background: btn.bg, color: btn.color, border: `1px solid ${btn.border}` }}
                >
                  {btn.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SynthesisStream({ messages }: { messages: SynthesisMessage[] }) {
  return (
    <div className="space-y-2.5">
      {messages.map((msg, idx) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx === 0 ? 0 : 0.05 }}
          className="rounded-lg p-3"
          style={{ background: "rgba(139,122,200,0.04)", border: `1px solid ${idx === 0 ? "rgba(139,122,200,0.14)" : "rgba(139,122,200,0.06)"}` }}
        >
          <div className="flex items-start gap-2">
            <Brain className="w-3 h-3 mt-0.5 shrink-0" style={{ color: idx === 0 ? "#8b7ac8" : "rgba(139,122,200,0.40)" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                {msg.domains.slice(0, 3).map(d => <DomainTag key={d} d={d} small />)}
                {msg.prismLenses?.slice(0, 3).map(l => <PrismLensTag key={l} lens={l} />)}
                <span className="text-[7px] font-mono ml-auto" style={{ color: TEXT.muted }}>{formatAge(msg.timestamp)} ago</span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: idx === 0 ? "rgba(139,122,200,0.85)" : TEXT.secondary }}>
                {msg.text || <span className="italic" style={{ color: TEXT.muted }}>Intelligence Lens synthesizing cross-domain signals...</span>}
                {msg.streaming && <span className="inline-block ml-1 w-1.5 h-3 rounded-sm animate-pulse" style={{ background: "#8b7ac8" }} />}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

type FilterDomain = Domain | "all";
type FilterSeverity = Severity | "all";

interface ApiTriggerApproval {
  approvalId: string;
  triggerId: string;
  actionId: string;
  eventData: Record<string, unknown>;
  requestedBy: string;
  createdAt: string;
  decision?: "approved" | "rejected";
}

interface ApiPendingPlan {
  planId: string;
  actionId: string;
  command: string;
  parsed: {
    intent: string;
    domain: string;
    overallRisk: string;
    requiresApproval: boolean;
    approvalReason?: string;
    confidence: number;
  };
  status: string;
  triggeredBy: string;
  createdAt: string;
}

function inferDomainFromTrigger(triggerId: string, eventData: Record<string, unknown>): Domain {
  const combined = `${triggerId} ${JSON.stringify(eventData)}`.toLowerCase();
  if (combined.includes("aegis") || combined.includes("security") || combined.includes("threat")) return "aegis";
  if (combined.includes("vessel") || combined.includes("maritime") || combined.includes("fleet")) return "vessels";
  if (combined.includes("terra") || combined.includes("property") || combined.includes("real_estate")) return "terra";
  if (combined.includes("prism") || combined.includes("counsel") || combined.includes("legal")) return "prism";
  if (combined.includes("carlota") || combined.includes("booking") || combined.includes("advisory")) return "carlotajo";
  return "alloy";
}

function mapApiActionsToLocal(
  approvals: ApiTriggerApproval[],
  plans: ApiPendingPlan[],
): PendingAction[] {
  const result: PendingAction[] = [];

  for (const a of approvals.slice(0, 6)) {
    const domain = inferDomainFromTrigger(a.triggerId, a.eventData);
    const trigger = listTriggersMap.get(a.triggerId);
    const triggerName = trigger?.name ?? `Trigger: ${a.triggerId}`;
    const createdAtTs = new Date(a.createdAt).getTime();

    result.push({
      id: a.approvalId,
      type: "trigger",
      domain,
      title: triggerName,
      requestedBy: a.requestedBy ?? "System",
      urgency: "high",
      age: formatAge(createdAtTs),
      aiRecommendation: `Intelligence Lens: review trigger ${a.triggerId}. Event data: ${JSON.stringify(a.eventData).slice(0, 100)}. Trust Layer 09 requires explicit human decision.`,
      stake: `Trigger: ${a.triggerId}`,
      context: `Trigger ${a.triggerId} fired at ${new Date(a.createdAt).toLocaleTimeString()}.`,
      proofChainRef: `pc-trig-${a.approvalId.slice(-6)}`,
    });
  }

  for (const p of plans.slice(0, 4)) {
    const rawDomain = p.parsed?.domain ?? "";
    const domain: Domain = DOMAINS[rawDomain as Domain] ? (rawDomain as Domain) : "alloy";
    const risk = p.parsed?.overallRisk ?? "medium";
    const createdAtTs = new Date(p.createdAt).getTime();

    result.push({
      id: p.planId,
      type: "plan",
      domain,
      title: p.command ?? `NLA Plan: ${p.planId}`,
      requestedBy: p.triggeredBy ?? "Alloy NLA Engine (Layer 03)",
      urgency: risk === "high" || risk === "critical" ? (risk as Severity) : "medium",
      age: formatAge(createdAtTs),
      aiRecommendation: p.parsed?.approvalReason ?? `Model Mesh confidence: ${p.parsed?.confidence ? Math.round(p.parsed.confidence * 100) : "?"}%. Intent: ${p.parsed?.intent ?? "unknown"}. Trust Layer requires human approval.`,
      stake: `Risk: ${risk}`,
      context: `Plan ${p.planId}. Intent: ${p.parsed?.intent ?? "unknown"}.`,
      proofChainRef: `pc-plan-${p.planId.slice(-6)}`,
    });
  }

  return result;
}

const listTriggersMap = new Map<string, { name: string }>();

export default function NerveCenterPage() {
  const qc = useQueryClient();
  const { data: currentUser } = useQuery({
    queryKey: ["nerve-current-user"],
    queryFn: () => apiFetch<{ id: number }>("/auth/me"),
    staleTime: 300_000,
  });
  const [events, setEvents] = useState<TimelineEvent[]>(SEED_EVENTS);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [filterDomain, setFilterDomain] = useState<FilterDomain>("all");
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("all");
  const [filterActionRequired, setFilterActionRequired] = useState(false);
  const [filterTimeRange, setFilterTimeRange] = useState<TimeRange>("all");
  const [activePanel, setActivePanel] = useState<"timeline" | "actions" | "synthesis" | "pulse">("timeline");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showArchLayers, setShowArchLayers] = useState(false);
  const [liveWsCount, setLiveWsCount] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleNewWsEvent = useCallback((event: TimelineEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 49)]);
    setLiveWsCount(c => c + 1);
    if (event.actionRequired) qc.invalidateQueries({ queryKey: ["nerve-actions"] });
  }, [qc]);

  const { wsStatus, subscribedChannels } = useNerveCenterWS(handleNewWsEvent);

  const synthesis = useAISynthesisStream(events);

  const { data: approvalsData } = useQuery({
    queryKey: ["nerve-actions"],
    queryFn: async () => {
      try {
        const resp = await apiFetch<{ pendingApprovals: ApiTriggerApproval[]; pendingPlans: ApiPendingPlan[] }>("/ai/mastra/action-engine/approvals");
        return resp;
      } catch {
        return { pendingApprovals: [], pendingPlans: [] };
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  useEffect(() => {
    if (!approvalsData) return;
    const apiActions = mapApiActionsToLocal(
      approvalsData.pendingApprovals ?? [],
      approvalsData.pendingPlans ?? [],
    );
    setActions(apiActions.slice(0, 10));
  }, [approvalsData]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterDomain !== "all" && e.domain !== filterDomain) return false;
      if (filterSeverity !== "all" && e.severity !== filterSeverity) return false;
      if (filterActionRequired && !e.actionRequired) return false;
      if (!isWithinTimeRange(e.timestamp, filterTimeRange)) return false;
      return true;
    });
  }, [events, filterDomain, filterSeverity, filterActionRequired, filterTimeRange]);

  function toggleExpand(id: string) {
    setEvents(prev => {
      const target = prev.find(e => e.id === id);
      if (target && !target.expanded && !target.contextFetched) {
        const endpoint = DOMAIN_CONTEXT_ENDPOINTS[target.domain];
        const updated = prev.map(e => e.id === id ? { ...e, expanded: true, contextLoading: true } : e);
        apiFetch<Record<string, unknown>>(endpoint)
          .then(data => {
            const contextData: Record<string, string> = {};
            if (Array.isArray(data)) {
              contextData["Total Records"] = String(data.length);
              const recent = data[0];
              if (recent && typeof recent === "object") {
                const keys = Object.keys(recent).slice(0, 4);
                keys.forEach(k => {
                  const v = (recent as Record<string, unknown>)[k];
                  if (v != null && typeof v !== "object") contextData[k] = String(v);
                });
              }
            } else if (data && typeof data === "object") {
              Object.entries(data).slice(0, 5).forEach(([k, v]) => {
                if (v != null && typeof v !== "object") contextData[k] = String(v);
              });
            }
            setEvents(p => p.map(e => e.id === id ? {
              ...e,
              context: { ...(e.context ?? {}), ...contextData },
              contextLoading: false,
              contextFetched: true,
            } : e));
          })
          .catch(() => {
            setEvents(p => p.map(e => e.id === id ? { ...e, contextLoading: false, contextFetched: true } : e));
          });
        return updated;
      }
      return prev.map(e => e.id === id ? { ...e, expanded: !e.expanded } : e);
    });
  }

  function handleActionDecision(id: string, _type: ActionDecision) {
    const decidedAction = actions.find(a => a.id === id);
    setActions(prev => prev.filter(a => a.id !== id));
    if (decidedAction) {
      setEvents(prev => prev.map(e => {
        if (e.domain !== decidedAction.domain || !e.actionRequired) return e;
        if (decidedAction.proofChainRef && e.proofChainRef === decidedAction.proofChainRef) {
          return { ...e, actionRequired: false };
        }
        if (e.id === decidedAction.id) {
          return { ...e, actionRequired: false };
        }
        return e;
      }));
    }
    qc.invalidateQueries({ queryKey: ["nerve-actions"] });
  }

  const criticalCount = events.filter(e => e.severity === "critical").length;
  const actionRequiredCount = events.filter(e => e.actionRequired).length;
  const pendingActionsCount = actions.length;

  const tabPanels = [
    { id: "timeline" as const, label: "Signals", sublabel: "PRISM-S", icon: Radio, badge: filteredEvents.length, color: "#c8953c" },
    { id: "actions" as const, label: "Motion", sublabel: "PRISM-M", icon: Workflow, badge: pendingActionsCount, color: "#4a90b8", alert: pendingActionsCount > 0 },
    { id: "synthesis" as const, label: "Intelligence", sublabel: "PRISM-I", icon: Brain, badge: synthesis.length, color: "#8b7ac8" },
    { id: "pulse" as const, label: "Pulse", sublabel: "PRISM-P", icon: Heart, badge: events.filter(e => e.actionRequired).length, color: "#d4a054" },
  ];

  const WsIcon = wsStatus === "connected" ? Wifi : WifiOff;
  const wsColor = wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? ELECTRIC : wsStatus === "auth_failed" ? "#f59e0b" : "#c45a4a";

  return (
    <div className="min-h-screen" style={{ background: BG.page, color: TEXT.primary }}>
      <div
        className="sticky top-0 z-30 px-4 md:px-6 py-3"
        style={{ background: "rgba(6,10,16,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: ELECTRIC }} />
              <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: ELECTRIC }}>Nerve Center</span>
            </div>
            <div className="hidden md:block w-px h-4" style={{ background: BORDER.muted }} />
            <h1 className="hidden md:block text-sm font-semibold tracking-tight" style={{ color: TEXT.primary }}>Unified Command Surface</h1>
            <div className="hidden lg:flex items-center gap-1 ml-2">
              {PRISM_LENSES.map(l => (
                <span key={l.key} className="text-[7px] font-mono font-bold px-1 rounded" style={{ color: l.color, background: `${l.color}14` }}>
                  {l.key}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }} title={`WebSocket: ${wsStatus} — ${subscribedChannels.size}/${ALL_WS_CHANNELS.length} channels`}>
              <WsIcon className="w-2.5 h-2.5" style={{ color: wsColor }} />
              <span className="text-[8px] font-mono hidden sm:inline" style={{ color: wsColor }}>
                {wsStatus === "auth_failed" ? "no auth" : wsStatus}
              </span>
              {wsStatus === "connected" && (
                <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>{subscribedChannels.size}ch</span>
              )}
            </div>
            {liveWsCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: ELECTRIC_DIM, border: `1px solid rgba(45,212,191,0.12)` }}>
                <span className="text-[8px] font-mono" style={{ color: ELECTRIC }}>{liveWsCount} live</span>
              </div>
            )}
            {criticalCount > 0 && (
              <motion.div
                animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-1.5 px-2 py-1 rounded"
                style={{ background: "rgba(196,90,74,0.10)", border: "1px solid rgba(196,90,74,0.20)" }}
              >
                <AlertTriangle className="w-3 h-3" style={{ color: "#c45a4a" }} />
                <span className="text-[9px] font-mono font-bold" style={{ color: "#c45a4a" }}>{criticalCount} Critical</span>
              </motion.div>
            )}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
              <Zap className="w-2.5 h-2.5" style={{ color: "#d4a054" }} />
              <span className="text-[9px] font-mono" style={{ color: "#d4a054" }}>{actionRequiredCount} HITL</span>
            </div>
            <button
              onClick={() => setShowArchLayers(v => !v)}
              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded transition-all hover:opacity-80"
              style={{ background: showArchLayers ? "rgba(72,187,120,0.08)" : BG.surface, border: `1px solid ${showArchLayers ? "rgba(72,187,120,0.15)" : BORDER.subtle}`, color: showArchLayers ? "hsl(145,62%,46%)" : TEXT.tertiary }}
            >
              <Layers className="w-3 h-3" />
              <span className="text-[8px] font-mono">10L</span>
            </button>
            <button
              onClick={() => setShowFilterPanel(v => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-all hover:opacity-80"
              style={{ background: showFilterPanel ? ELECTRIC_DIM : BG.surface, border: `1px solid ${showFilterPanel ? "rgba(45,212,191,0.20)" : BORDER.subtle}`, color: showFilterPanel ? ELECTRIC : TEXT.secondary }}
            >
              <Filter className="w-3 h-3" />
              <span className="text-[9px] hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showArchLayers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "hsl(145,62%,46%)" }}>10-Layer Governed Pipeline</span>
                  <span className="text-[7px]" style={{ color: TEXT.muted }}>— what makes this architecture defensible</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {ARCHITECTURE_LAYERS.map(layer => (
                    <div
                      key={layer.num}
                      className="rounded px-2 py-1.5 flex items-center gap-1.5"
                      style={{
                        background: layer.active ? "rgba(72,187,120,0.06)" : BG.elevated,
                        border: `1px solid ${layer.active ? "rgba(72,187,120,0.12)" : BORDER.subtle}`,
                      }}
                      title={layer.desc}
                    >
                      <span className="text-[7px] font-mono font-bold" style={{ color: layer.active ? "hsl(145,62%,46%)" : TEXT.muted }}>{layer.num}</span>
                      <span className="text-[8px]" style={{ color: layer.active ? TEXT.secondary : TEXT.muted }}>{layer.label}</span>
                      {layer.active && <span className="w-1 h-1 rounded-full" style={{ background: "hsl(145,62%,46%)" }} />}
                    </div>
                  ))}
                </div>
                <p className="text-[8px] mt-2 leading-relaxed" style={{ color: TEXT.muted }}>
                  Every event, decision, and AI recommendation on this surface flows through these 10 layers.
                  This is not a monitoring dashboard — it is a governed command surface with immutable proof chain, HITL approval gates, and cross-domain signal fusion that no single-domain observability tool can replicate.
                </p>
              </div>
            </motion.div>
          )}

          {showFilterPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: `1px solid ${BORDER.subtle}` }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] uppercase tracking-wider w-16 shrink-0" style={{ color: TEXT.muted }}>Domain</span>
                  <div className="flex gap-1 flex-wrap">
                    {(["all", ...Object.keys(DOMAINS)] as FilterDomain[]).map(d => (
                      <button
                        key={d}
                        onClick={() => setFilterDomain(d)}
                        className="text-[8px] px-1.5 py-0.5 rounded capitalize transition-all"
                        style={{
                          background: filterDomain === d ? (d === "all" ? ELECTRIC_DIM : DOMAINS[d as Domain]?.bg) : BG.elevated,
                          color: filterDomain === d ? (d === "all" ? ELECTRIC : DOMAINS[d as Domain]?.color) : TEXT.muted,
                          border: `1px solid ${BORDER.subtle}`,
                        }}
                      >
                        {d === "all" ? "All" : DOMAINS[d as Domain]?.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] uppercase tracking-wider w-16 shrink-0" style={{ color: TEXT.muted }}>Severity</span>
                  <div className="flex gap-1 flex-wrap">
                    {(["all", "critical", "high", "medium", "low", "info"] as FilterSeverity[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setFilterSeverity(s)}
                        className="text-[8px] px-1.5 py-0.5 rounded capitalize transition-all"
                        style={{
                          background: filterSeverity === s ? (s === "all" ? ELECTRIC_DIM : severityBg(s as Severity)) : BG.elevated,
                          color: filterSeverity === s ? (s === "all" ? ELECTRIC : severityColor(s as Severity)) : TEXT.muted,
                          border: `1px solid ${BORDER.subtle}`,
                        }}
                      >
                        {s === "all" ? "All" : s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] uppercase tracking-wider w-16 shrink-0" style={{ color: TEXT.muted }}>Time Range</span>
                  <div className="flex gap-1 flex-wrap">
                    {(["1h", "6h", "24h", "7d", "all"] as TimeRange[]).map(r => (
                      <button
                        key={r}
                        onClick={() => setFilterTimeRange(r)}
                        className="text-[8px] px-1.5 py-0.5 rounded capitalize transition-all"
                        style={{
                          background: filterTimeRange === r ? ELECTRIC_DIM : BG.elevated,
                          color: filterTimeRange === r ? ELECTRIC : TEXT.muted,
                          border: `1px solid ${BORDER.subtle}`,
                        }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={filterActionRequired} onChange={e => setFilterActionRequired(e.target.checked)} className="w-3 h-3 rounded" style={{ accentColor: ELECTRIC }} />
                    <span className="text-[8px]" style={{ color: filterActionRequired ? ELECTRIC : TEXT.muted }}>HITL Gate Required Only</span>
                  </label>
                  {(filterDomain !== "all" || filterSeverity !== "all" || filterActionRequired || filterTimeRange !== "all") && (
                    <button onClick={() => { setFilterDomain("all"); setFilterSeverity("all"); setFilterActionRequired(false); setFilterTimeRange("all"); }} className="flex items-center gap-1 text-[8px] transition-all hover:opacity-80" style={{ color: TEXT.tertiary }}>
                      <X className="w-2.5 h-2.5" /> Clear all
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {actions.length > 0 && (
        <div className="px-4 py-2" style={{ background: "rgba(74,144,184,0.04)", borderBottom: `1px solid rgba(74,144,184,0.10)` }}>
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <Workflow className="w-3 h-3" style={{ color: "#4a90b8" }} />
              <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "#4a90b8" }}>
                Action Bar
              </span>
              <span className="text-[7px] font-mono px-1 rounded" style={{ background: "rgba(74,144,184,0.12)", color: "#4a90b8" }}>
                {actions.length}
              </span>
            </div>
            {actions.slice(0, 4).map(a => {
              const aCfg = DOMAINS[a.domain];
              const AIcon = aCfg.icon;
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded shrink-0"
                  style={{
                    background: a.urgency === "critical" ? "rgba(196,90,74,0.08)" : BG.surface,
                    border: `1px solid ${a.urgency === "critical" ? "rgba(196,90,74,0.18)" : BORDER.subtle}`,
                  }}
                >
                  <AIcon className="w-2.5 h-2.5" style={{ color: aCfg.color }} />
                  <span className="text-[8px] max-w-[120px] truncate cursor-pointer hover:underline" style={{ color: TEXT.secondary }} onClick={() => setActivePanel("actions")}>{a.title}</span>
                  <SeverityBadge s={a.urgency} small />
                  <InlineActionButtons actionId={a.id} actionType={a.type} onDecision={handleActionDecision} />
                </div>
              );
            })}
            {actions.length > 4 && (
              <button
                onClick={() => setActivePanel("actions")}
                className="text-[8px] px-2 py-1 rounded shrink-0 transition-all hover:opacity-80"
                style={{ color: "#4a90b8", background: "rgba(74,144,184,0.08)", border: "1px solid rgba(74,144,184,0.12)" }}
              >
                +{actions.length - 4} more
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 h-[calc(100vh-56px)] overflow-hidden">
        <div className="xl:col-span-2 flex flex-col" style={{ borderRight: `1px solid ${BORDER.subtle}` }}>
          <div className="flex items-center" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            {tabPanels.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivePanel(tab.id)}
                className="flex items-center gap-1.5 px-4 py-3 text-[10px] font-medium uppercase tracking-wider transition-colors relative"
                style={{
                  color: activePanel === tab.id ? tab.color : TEXT.muted,
                  borderBottom: activePanel === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                <tab.icon className="w-3 h-3" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="text-[7px] font-mono px-1 rounded" style={{ background: tab.alert ? "rgba(196,90,74,0.12)" : BG.elevated, color: tab.alert ? "#c45a4a" : TEXT.muted }}>
                  {tab.badge}
                </span>
              </button>
            ))}
          </div>

          <div ref={timelineRef} className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence mode="popLayout">
              {activePanel === "timeline" && (
                <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(200,149,60,0.04)", border: "1px solid rgba(200,149,60,0.10)" }}>
                    <Radio className="w-3 h-3 shrink-0" style={{ color: "#c8953c" }} />
                    <p className="text-[8px] leading-relaxed" style={{ color: "rgba(200,149,60,0.70)" }}>
                      PRISM Signals Layer — cross-system events flowing in real-time via WebSocket. Each signal carries domain context, PRISM lens classification, severity assessment, and proof chain reference. Unlike traditional monitoring dashboards that show infrastructure metrics, these are business consequence signals.
                    </p>
                  </div>
                  {filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Search className="w-8 h-8" style={{ color: TEXT.muted }} />
                      <p className="text-sm" style={{ color: TEXT.tertiary }}>No signals match the current filters</p>
                      <button onClick={() => { setFilterDomain("all"); setFilterSeverity("all"); setFilterActionRequired(false); setFilterTimeRange("all"); }} className="text-[10px]" style={{ color: ELECTRIC }}>
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredEvents.map(event => (
                      <TimelineEventCard key={event.id} event={event} onExpand={toggleExpand} />
                    ))
                  )}
                </motion.div>
              )}

              {activePanel === "actions" && (
                <motion.div key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(74,144,184,0.04)", border: "1px solid rgba(74,144,184,0.10)" }}>
                    <Workflow className="w-3 h-3 shrink-0" style={{ color: "#4a90b8" }} />
                    <p className="text-[8px] leading-relaxed" style={{ color: "rgba(74,144,184,0.70)" }}>
                      PRISM Motion Layer — governed execution queue. Every action here requires Human-in-the-Loop (HITL) approval through Trust Layer 09. AI recommends but never executes autonomously. Decisions are recorded immutably in Proof Chain (Layer 05). This is the operational gap that separates Lyte from every alerting tool on the market.
                    </p>
                  </div>
                  {actions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <CheckCircle2 className="w-8 h-8" style={{ color: "#22c55e" }} />
                      <p className="text-sm" style={{ color: TEXT.tertiary }}>All HITL approval gates resolved</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {actions.map(action => (
                        <ActionCard key={action.id} action={action} onDecision={handleActionDecision} currentUserId={currentUser?.id} />
                      ))}
                    </AnimatePresence>
                  )}
                </motion.div>
              )}

              {activePanel === "synthesis" && (
                <motion.div key="synthesis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center gap-2 mb-3 p-3 rounded-lg" style={{ background: "rgba(139,122,200,0.04)", border: `1px solid rgba(139,122,200,0.12)` }}>
                    <Brain className="w-3.5 h-3.5 shrink-0" style={{ color: "#8b7ac8" }} />
                    <div>
                      <p className="text-[9px] leading-relaxed" style={{ color: "rgba(139,122,200,0.75)" }}>
                        PRISM Intelligence Lens — cross-domain signal fusion via multi-agent orchestrator (Layer 08: Model Mesh).
                        This is where business observability diverges from infrastructure monitoring. Datadog tells you a server is slow.
                        Lyte tells you why it matters to the Ashworth deal, the Delaware filing deadline, and the Rotterdam logistics chain — simultaneously.
                      </p>
                    </div>
                  </div>
                  <SynthesisStream messages={synthesis} />
                </motion.div>
              )}

              {activePanel === "pulse" && (
                <motion.div key="pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(212,160,84,0.04)", border: "1px solid rgba(212,160,84,0.10)" }}>
                    <Heart className="w-3 h-3 shrink-0 animate-pulse" style={{ color: "#d4a054" }} />
                    <p className="text-[8px] leading-relaxed" style={{ color: "rgba(212,160,84,0.70)" }}>
                      PRISM Pulse Layer — organizational health and decision readiness. Items ranked by urgency x business impact x time sensitivity.
                      This is the "doctor" view — not just what happened, but what it means and what decision needs to be made, right now.
                    </p>
                  </div>
                  {events
                    .filter(e => e.actionRequired)
                    .sort((a, b) => {
                      const sevWeight: Record<string, number> = { critical: 10, high: 7, medium: 4, low: 2, info: 1 };
                      const urgFactor: Record<string, number> = { critical: 3, high: 2, medium: 1.5, low: 1, info: 0.5 };
                      const impactEstimate: Record<string, number> = { aegis: 8, vessels: 7, terra: 6, prism: 5, carlotajo: 4, alloy: 5 };
                      const ageMinutes = (Date.now() - a.timestamp) / 60000;
                      const ageMinutesB = (Date.now() - b.timestamp) / 60000;
                      const scoreA = (sevWeight[a.severity] ?? 1) * (urgFactor[a.severity] ?? 1) + (impactEstimate[a.domain] ?? 3) + (1 / Math.max(ageMinutes, 1)) * 10;
                      const scoreB = (sevWeight[b.severity] ?? 1) * (urgFactor[b.severity] ?? 1) + (impactEstimate[b.domain] ?? 3) + (1 / Math.max(ageMinutesB, 1)) * 10;
                      return scoreB - scoreA;
                    })
                    .slice(0, 8)
                    .map(event => {
                      const cfg = DOMAINS[event.domain];
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={event.id} layout
                          initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                          className="rounded-lg overflow-hidden"
                          style={{
                            background: event.severity === "critical" ? "rgba(196,90,74,0.06)" : BG.surface,
                            border: `1px solid ${event.severity === "critical" ? "rgba(196,90,74,0.18)" : BORDER.muted}`,
                          }}
                        >
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                  <SeverityBadge s={event.severity} small />
                                  <DomainTag d={event.domain} small />
                                  {event.prismLens && <PrismLensTag lens={event.prismLens} />}
                                  <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}><Clock className="w-2 h-2 inline mr-0.5" />{formatAge(event.timestamp)} ago</span>
                                </div>
                                <p className="text-[11px] font-semibold leading-snug" style={{ color: TEXT.primary }}>{event.title}</p>
                              </div>
                              <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                                <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                              </div>
                            </div>
                            <p className="text-[9px] leading-relaxed mb-2" style={{ color: TEXT.secondary }}>{event.detail}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px]" style={{ color: TEXT.muted }}>Requires executive decision</span>
                                {event.proofChainRef && (
                                  <span className="text-[7px] font-mono flex items-center gap-0.5" style={{ color: "hsl(145,62%,46%)" }}>
                                    <Shield className="w-2 h-2" /> {event.proofChainRef}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => { setActivePanel("actions"); }}
                                className="flex items-center gap-1 text-[8px] px-2 py-1 rounded transition-all hover:opacity-80"
                                style={{ background: "rgba(74,144,184,0.10)", color: "#4a90b8", border: "1px solid rgba(74,144,184,0.14)" }}
                              >
                                Go to Motion <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  {!events.some(e => e.actionRequired) && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <CheckCircle2 className="w-8 h-8" style={{ color: "#22c55e" }} />
                      <p className="text-sm" style={{ color: TEXT.tertiary }}>Organizational pulse clear — no open decision points</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden xl:flex flex-col">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" style={{ color: ELECTRIC }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TEXT.secondary }}>Domain Packs</span>
              <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>Layer 04</span>
            </div>
            <div className="flex items-center gap-1 text-[8px]" style={{ color: wsColor }}>
              <WsIcon className="w-2.5 h-2.5" />
              {wsStatus === "auth_failed" ? "public only" : wsStatus}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(139,122,200,0.04)", border: "1px solid rgba(139,122,200,0.10)" }}>
              <p className="text-[7px] font-mono uppercase tracking-wider mb-1.5" style={{ color: "#8b7ac8" }}>PRISM Framework — 5 Lenses</p>
              <div className="flex flex-col gap-1">
                {PRISM_LENSES.map(l => (
                  <div key={l.key} className="flex items-center gap-2">
                    <span className="text-[8px] font-mono font-bold w-4" style={{ color: l.color }}>{l.key}</span>
                    <span className="text-[8px]" style={{ color: TEXT.secondary }}>{l.label}</span>
                    <span className="text-[7px] ml-auto" style={{ color: TEXT.muted }}>{l.desc.slice(0, 35)}...</span>
                  </div>
                ))}
              </div>
            </div>

            {(Object.values(DOMAINS) as DomainConfig[]).map(cfg => {
              const domainEvents = events.filter(e => e.domain === cfg.id);
              const critEvents = domainEvents.filter(e => e.severity === "critical").length;
              const highEvents = domainEvents.filter(e => e.severity === "high").length;
              const latestEvent = domainEvents[0];
              const Icon = cfg.icon;
              const hasAlert = critEvents > 0;
              const hasPending = actions.some(a => a.domain === cfg.id);
              const isSubscribed = cfg.wsChannels.some(ch => subscribedChannels.has(ch));

              return (
                <div key={cfg.id} className="rounded-lg overflow-hidden" style={{ background: BG.surface, border: `1px solid ${hasAlert ? cfg.color + "28" : BORDER.subtle}` }}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: cfg.bg }}>
                          <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</p>
                          {cfg.prismLens && <p className="text-[7px] font-mono" style={{ color: TEXT.muted }}>PRISM: {cfg.prismLens}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isSubscribed && <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} title="WS subscribed" />}
                        {critEvents > 0 && <span className="text-[7px] font-mono px-1 rounded" style={{ color: "#c45a4a", background: "rgba(196,90,74,0.10)" }}>{critEvents} crit</span>}
                        {hasPending && <span className="text-[7px] font-mono px-1 rounded" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.10)" }}>HITL</span>}
                        <a href={cfg.externalPath} className="flex items-center gap-0.5 text-[7px] transition-all hover:opacity-80" style={{ color: TEXT.muted }}>
                          <ArrowUpRight className="w-2 h-2" />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {[
                        { k: "Events", v: String(domainEvents.length), c: TEXT.secondary },
                        { k: "Critical", v: String(critEvents), c: critEvents > 0 ? "#c45a4a" : "#22c55e" },
                        { k: "High", v: String(highEvents), c: highEvents > 0 ? "#c8953c" : TEXT.muted },
                      ].map(stat => (
                        <div key={stat.k} className="rounded p-1 text-center" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                          <div className="text-[11px] font-mono font-bold" style={{ color: stat.c }}>{stat.v}</div>
                          <div className="text-[7px] uppercase tracking-wider" style={{ color: TEXT.muted }}>{stat.k}</div>
                        </div>
                      ))}
                    </div>

                    {latestEvent && (
                      <div className="flex items-start gap-1.5">
                        <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: cfg.color }} />
                        <p className="text-[8px] leading-relaxed truncate" style={{ color: TEXT.tertiary }}>{latestEvent.title}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="rounded-lg p-3 mt-2" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
              <p className="text-[8px] uppercase tracking-wider mb-2" style={{ color: TEXT.muted }}>Cross-Domain Navigation</p>
              <div className="space-y-1">
                {[
                  { href: "/alloy/runs", label: "Alloy Workflow Runs", icon: RefreshCw, layer: "03" },
                  { href: "/alloy/signals", label: "Signal Feed", icon: Radio, layer: "02" },
                  { href: "/firestorm/posture", label: "Aegis Threat Board", icon: Shield, layer: "04" },
                  { href: "/vessels/fleet", label: "Fleet Command", icon: Ship, layer: "04" },
                  { href: "/terra/opportunities", label: "Terra Intelligence", icon: Building2, layer: "04" },
                  { href: "/prism-counsel/matters", label: "PRISM Counsel Matters", icon: Scale, layer: "04" },
                ].map(link => (
                  <a key={link.href} href={link.href} className="flex items-center gap-2 px-2 py-1.5 rounded transition-all hover:opacity-80" style={{ background: BG.elevated, border: `1px solid ${BORDER.subtle}` }}>
                    <link.icon className="w-2.5 h-2.5 shrink-0" style={{ color: TEXT.tertiary }} />
                    <span className="text-[9px]" style={{ color: TEXT.secondary }}>{link.label}</span>
                    <span className="text-[6px] font-mono ml-auto" style={{ color: TEXT.muted }}>L{link.layer}</span>
                    <ArrowUpRight className="w-2.5 h-2.5" style={{ color: TEXT.muted }} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
