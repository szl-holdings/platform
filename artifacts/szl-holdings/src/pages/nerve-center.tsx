import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  Activity, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, Clock, Filter, Globe, Radio, Shield, Ship,
  Zap, Building2, Scale, Users, X, Cpu, RefreshCw,
  Bot, Layers, Search, Wifi, WifiOff, Heart, Brain, Workflow,
  Network, FileText, GitBranch, Maximize2, LayoutDashboard,
} from "lucide-react";
import { LivingGraph, LENS_CONFIGS, type LensId, type GraphNode } from "./nerve-center/living-graph";
import { CommandPostureRing } from "./nerve-center/command-posture-ring";
import { SituationRooms } from "./nerve-center/situation-rooms";
import { ExecutiveDailyBrief } from "./nerve-center/executive-daily-brief";
import { DecisionTrace } from "./nerve-center/decision-trace";
import { AnomalyDetection } from "./nerve-center/anomaly-detection";
import {
  type Domain, type DomainConfig,
  DOMAINS, DOMAIN_CHANNEL_MAP, resolveDomainFromChannel,
} from "@/lib/domain-config";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG = {
  page: "#080c14",
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

// ── Types ─────────────────────────────────────────────────────────────────────
type Severity = "critical" | "high" | "medium" | "low" | "info";
type ActionDecision = "approve" | "reject" | "escalate" | "delegate";
type WsStatus = "idle" | "connecting" | "connected" | "disconnected" | "error" | "auth_failed";
type SidePanel = "brief" | "trace" | "anomaly" | "situations" | "signals" | "motion" | "intelligence" | "pulse";
type FilterDomain = Domain | "all";
type FilterSeverity = Severity | "all";
type TimeRange = "1h" | "6h" | "24h" | "7d" | "all";

// ── Domain / lens config ──────────────────────────────────────────────────────
const PRISM_LENSES = [
  { key: "P", label: "Pulse", color: "#d4a054", icon: Heart, desc: "Organizational health and baseline metrics" },
  { key: "R", label: "Risk", color: "#c45a4a", icon: AlertTriangle, desc: "Exposure, bottlenecks, and business damage potential" },
  { key: "I", label: "Intelligence", color: "#8b7ac8", icon: Brain, desc: "AI-driven synthesis and cross-domain correlation" },
  { key: "S", label: "Signals", color: "#c8953c", icon: Radio, desc: "Structured events indicating operational state changes" },
  { key: "M", label: "Motion", color: "#4a90b8", icon: Workflow, desc: "Velocity and integrity of governed workflows" },
];

const ALL_WS_CHANNELS = [
  "aegis-incidents", "vessel-positions", "terra-signals",
  "workflow-runs", "bookings", "notifications",
];

// ── Timeline / action interfaces ──────────────────────────────────────────────
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

// ── Seed data ─────────────────────────────────────────────────────────────────
const DOMAIN_CONTEXT_ENDPOINTS: Record<Domain, string> = {
  aegis: "/firestorm/assessments",
  vessels: "/vessels",
  terra: "/terra/market-intelligence",
  prism: "/ai/mastra/action-engine/approvals",
  carlotajo: "/booking/appointments",
  alloy: "/alloy/workflows",
};

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
    text: "Cross-domain correlation detected via PRISM Signal Fusion: Port congestion at Rotterdam (Vessels/Signals) directly intersects with the Ashworth matter filing deadline (PRISM Counsel/Motion). The logistics delay extends Ashworth's operational pressure window by 48 hours. Intelligence Lens recommends counsel factor this into the counter-claim strategy timeline.",
    timestamp: Date.now() - 8 * 60 * 1000, domains: ["vessels", "prism", "carlotajo"],
    prismLenses: ["Signals", "Motion", "Pulse"],
  },
  {
    id: "syn-002",
    text: "Opportunity convergence via Intelligence Lens: Terra is monitoring 3 A-class warehouse facilities in the Rotterdam corridor with 14-day distress pricing windows. These are directly adjacent to Ashworth's primary logistics nodes. The vessel disruption (Signals) creates a window where accelerated site acquisition stabilizes the supply chain. Alloy has pre-staged an execution plan awaiting approval.",
    timestamp: Date.now() - 3 * 60 * 1000, domains: ["terra", "vessels", "alloy"],
    prismLenses: ["Intelligence", "Signals", "Motion"],
  },
];

// ── Utility functions ─────────────────────────────────────────────────────────
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

// ── Sub-components ────────────────────────────────────────────────────────────
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

// ── WS hook ───────────────────────────────────────────────────────────────────
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
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
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
            domain, title, detail, severity,
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

    ws.onerror = () => { if (mountedRef.current) setWsStatus("error"); };
    ws.onclose = () => {
      if (!mountedRef.current) return;
      setWsStatus("disconnected");
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      reconnectRef.current = setTimeout(() => { if (mountedRef.current) connect(); }, 8000);
    };
  }, [cleanup, onEvent]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => { mountedRef.current = false; cleanup(); };
  }, [connect, cleanup]);

  return { wsStatus, subscribedChannels };
}

// ── AI synthesis stream ───────────────────────────────────────────────────────
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
      id: msgId, text: "", timestamp: Date.now(),
      domains: domains.slice(0, 3) as Domain[], streaming: true,
      prismLenses: lenses.slice(0, 3),
    }, ...prev.slice(0, 8)]);

    try {
      const query = [
        "You are the PRISM Intelligence Lens synthesizer for the Nerve Center. Analyze these cross-domain events and identify connections, risks, and correlations.",
        "Use PRISM lens terminology (Pulse/Risk/Intelligence/Signals/Motion) to frame your analysis.",
        "Events:",
        evts.slice(0, 6).map(e => `[${DOMAINS[e.domain].label}/${e.severity}/${e.prismLens ?? ""}] ${e.title}`).join("; "),
        "Respond in 2-3 concise sentences.",
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
          if (trimmed.startsWith("data: [DONE]")) { streamDone = true; break; }
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.error) throw new Error(json.error);
              const content = json.content ?? "";
              if (content) {
                fullText += content;
                setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: fullText } : m));
              }
            } catch { }
          }
        }
        if (streamDone) break;
      }
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, streaming: false, text: fullText || m.text } : m));
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      const fallbackText = `PRISM Intelligence Lens — cross-domain signal fusion: ${evts.slice(0, 3).map(e => `[${DOMAINS[e.domain].shortLabel}/${e.prismLens ?? ""}] ${e.title}`).join(" → ")}. Pattern analysis across ${lenses.join("/")} lenses suggests correlated impact that single-domain monitoring would miss.`;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: fallbackText, streaming: false } : m));
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

// ── Action helpers ────────────────────────────────────────────────────────────
const listTriggersMap = new Map<string, { name: string }>();

function inferDomainFromTrigger(triggerId: string, eventData: Record<string, unknown>): Domain {
  const combined = `${triggerId} ${JSON.stringify(eventData)}`.toLowerCase();
  if (combined.includes("aegis") || combined.includes("security") || combined.includes("threat")) return "aegis";
  if (combined.includes("vessel") || combined.includes("maritime") || combined.includes("fleet")) return "vessels";
  if (combined.includes("terra") || combined.includes("property") || combined.includes("real_estate")) return "terra";
  if (combined.includes("prism") || combined.includes("counsel") || combined.includes("legal")) return "prism";
  if (combined.includes("carlota") || combined.includes("booking") || combined.includes("advisory")) return "carlotajo";
  return "alloy";
}

function mapApiActionsToLocal(approvals: ApiTriggerApproval[], plans: ApiPendingPlan[]): PendingAction[] {
  const result: PendingAction[] = [];
  for (const a of approvals.slice(0, 6)) {
    const domain = inferDomainFromTrigger(a.triggerId, a.eventData);
    const trigger = listTriggersMap.get(a.triggerId);
    result.push({
      id: a.approvalId, type: "trigger", domain,
      title: trigger?.name ?? `Trigger: ${a.triggerId}`,
      requestedBy: a.requestedBy ?? "System", urgency: "high",
      age: formatAge(new Date(a.createdAt).getTime()),
      aiRecommendation: `Intelligence Lens: review trigger ${a.triggerId}. Trust Layer 09 requires explicit human decision.`,
      stake: `Trigger: ${a.triggerId}`,
      context: `Trigger ${a.triggerId} fired at ${new Date(a.createdAt).toLocaleTimeString()}.`,
      proofChainRef: `pc-trig-${a.approvalId.slice(-6)}`,
    });
  }
  for (const p of plans.slice(0, 4)) {
    const rawDomain = p.parsed?.domain ?? "";
    const domain: Domain = DOMAINS[rawDomain as Domain] ? (rawDomain as Domain) : "alloy";
    const risk = p.parsed?.overallRisk ?? "medium";
    result.push({
      id: p.planId, type: "plan", domain,
      title: p.command ?? `NLA Plan: ${p.planId}`,
      requestedBy: p.triggeredBy ?? "Alloy NLA Engine (Layer 03)",
      urgency: risk === "high" || risk === "critical" ? (risk as Severity) : "medium",
      age: formatAge(new Date(p.createdAt).getTime()),
      aiRecommendation: p.parsed?.approvalReason ?? `Model Mesh confidence: ${p.parsed?.confidence ? Math.round(p.parsed.confidence * 100) : "?"}%. Intent: ${p.parsed?.intent ?? "unknown"}.`,
      stake: `Risk: ${risk}`,
      context: `Plan ${p.planId}. Intent: ${p.parsed?.intent ?? "unknown"}.`,
      proofChainRef: `pc-plan-${p.planId.slice(-6)}`,
    });
  }
  return result;
}

// ── Inline action buttons (quick approve/reject in Action Bar) ────────────────
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
      } else {
        await apiFetch(`/ai/mastra/action-engine/nla/plans/${actionId}/approve`, {
          method: "POST",
          body: JSON.stringify({ decision, notes: `Quick ${type} via Action Bar` }),
        });
      }
      onDecision(actionId, type);
    } catch { setProcessing(false); }
  }
  return (
    <div className="flex items-center gap-0.5 ml-1">
      <button onClick={(e) => { e.stopPropagation(); handleInlineAction("approve"); }} disabled={processing}
        className="px-1.5 py-0.5 rounded text-[7px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
        style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
        {processing ? "…" : "✓"}
      </button>
      <button onClick={(e) => { e.stopPropagation(); handleInlineAction("reject"); }} disabled={processing}
        className="px-1.5 py-0.5 rounded text-[7px] font-medium transition-all hover:opacity-80 disabled:opacity-40"
        style={{ background: "rgba(196,90,74,0.12)", color: "#c45a4a" }}>
        {processing ? "…" : "✗"}
      </button>
    </div>
  );
}

// ── Full action card (in Motion tab) ─────────────────────────────────────────
function ActionCard({ action, onDecision, currentUserId }: {
  action: PendingAction;
  onDecision: (id: string, type: ActionDecision) => void;
  currentUserId?: number;
}) {
  const [confirming, setConfirming] = useState<ActionDecision | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cfg = DOMAINS[action.domain];
  const Icon = cfg.icon;

  async function handleConfirm(type: ActionDecision) {
    setProcessing(true); setError(null);
    try {
      if (type === "approve" || type === "reject") {
        const decision = type === "approve" ? "approved" : "rejected";
        if (action.type === "trigger") {
          await apiFetch(`/ai/mastra/action-engine/approvals/triggers/${action.id}`, {
            method: "POST",
            body: JSON.stringify({ decision, notes: `Executive ${type} via Nerve Center — Proof Chain: ${action.proofChainRef ?? "pending"}` }),
          });
        } else {
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
            userId: currentUserId, type: "action_required",
            title: `Escalated: ${action.title}`,
            message: `Action escalated from Nerve Center. Domain: ${DOMAINS[action.domain].label}. Urgency: ${action.urgency}. Stake: ${action.stake}. Proof Chain: ${action.proofChainRef ?? "pending"}.`,
            channel: "in_app", actionUrl: `/nerve-center`,
          }),
        });
      } else if (type === "delegate") {
        await apiFetch(`/ai/orchestrator/agents/szl-orchestrator/run`, {
          method: "POST",
          body: JSON.stringify({
            task: `Delegate action to appropriate domain team: "${action.title}". Domain: ${DOMAINS[action.domain].label}. Context: ${action.context}.`,
            context: { sourceActionId: action.id, domain: action.domain, urgency: action.urgency, proofChain: action.proofChainRef },
          }),
        });
      }
      setProcessing(false);
      onDecision(action.id, type);
    } catch (err) {
      setProcessing(false); setConfirming(null);
      setError(err instanceof Error ? err.message : "Action failed — check connection and retry.");
    }
  }

  return (
    <motion.div layout initial={{ opacity: 1 }} exit={{ opacity: 0, x: 20, scale: 0.96 }}
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
              <span className="text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: "hsl(145,62%,46%)", background: "rgba(72,187,120,0.10)" }}>Trust Layer 09</span>
              <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}><Clock className="w-2 h-2 inline mr-0.5" />{action.age} old</span>
            </div>
            <p className="text-[11px] font-medium leading-snug" style={{ color: TEXT.primary }}>{action.title}</p>
            <p className="text-[9px] mt-0.5" style={{ color: TEXT.muted }}>Requested by {action.requestedBy}</p>
          </div>
        </div>

        <div className="rounded p-2 mb-2" style={{ background: "rgba(139,122,200,0.06)", border: "1px solid rgba(139,122,200,0.12)" }}>
          <div className="flex items-start gap-1.5">
            <Brain className="w-2.5 h-2.5 shrink-0 mt-0.5" style={{ color: "#8b7ac8" }} />
            <div>
              <div className="text-[7px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "#8b7ac8" }}>Intelligence Lens Recommendation</div>
              <p className="text-[9px] leading-relaxed" style={{ color: "rgba(139,122,200,0.80)" }}>{action.aiRecommendation}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[8px]" style={{ color: TEXT.tertiary }}>Stake: <span className="font-mono" style={{ color: "#c8953c" }}>{action.stake}</span></span>
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
            <motion.div key="confirm" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              className="rounded p-2" style={{ background: BG.elevated, border: `1px solid ${BORDER.muted}` }}>
              <p className="text-[9px] mb-1" style={{ color: TEXT.secondary }}>
                Confirm <strong style={{ color: TEXT.primary }}>{confirming}</strong>?{" "}
                {confirming === "escalate" ? "This will create an escalation notification." :
                 confirming === "delegate" ? "This will create a delegation workflow via the AI orchestrator." :
                 "This decision will be recorded in the Proof Chain."}
              </p>
              <div className="flex gap-1.5">
                <button onClick={() => handleConfirm(confirming)} disabled={processing}
                  className="flex-1 py-1.5 rounded text-[9px] font-medium transition-all hover:opacity-80 disabled:opacity-50"
                  style={{
                    background: confirming === "approve" ? "rgba(34,197,94,0.15)" : confirming === "reject" ? "rgba(196,90,74,0.15)" : confirming === "escalate" ? "rgba(245,158,11,0.15)" : "rgba(139,122,200,0.15)",
                    color: confirming === "approve" ? "#22c55e" : confirming === "reject" ? "#c45a4a" : confirming === "escalate" ? "#f59e0b" : "#8b7ac8",
                  }}>
                  {processing ? "Recording decision..." : `Confirm ${confirming}`}
                </button>
                <button onClick={() => setConfirming(null)} disabled={processing}
                  className="px-3 py-1.5 rounded text-[9px] transition-all hover:opacity-80"
                  style={{ background: BG.surface, color: TEXT.tertiary, border: `1px solid ${BORDER.subtle}` }}>
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
                <button key={btn.type} onClick={() => setConfirming(btn.type)}
                  className="py-1.5 rounded text-[8px] font-medium transition-all hover:opacity-80"
                  style={{ background: btn.bg, color: btn.color, border: `1px solid ${btn.border}` }}>
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

// ── Timeline event card ───────────────────────────────────────────────────────
function TimelineEventCard({ event, onExpand }: { event: TimelineEvent; onExpand: (id: string) => void }) {
  const cfg = DOMAINS[event.domain];
  const Icon = cfg.icon;
  return (
    <motion.div layout initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
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
                  <span className="text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.10)" }}>HITL Gate</span>
                )}
                {event.liveWs && (
                  <span className="text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded animate-pulse" style={{ color: ELECTRIC, background: ELECTRIC_DIM }}>Live</span>
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

// ── Synthesis stream ──────────────────────────────────────────────────────────
function SynthesisStream({ messages }: { messages: SynthesisMessage[] }) {
  return (
    <div className="space-y-2.5">
      {messages.map((msg, idx) => (
        <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx === 0 ? 0 : 0.05 }}
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

// ── Side panel tab config ─────────────────────────────────────────────────────
const LENS_IDS: LensId[] = ["all", "financial", "operational", "growth", "sentiment", "compliance", "talent", "market"];

// ── Main page component ───────────────────────────────────────────────────────
export default function NerveCenter() {
  const qc = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["nerve-current-user"],
    queryFn: () => apiFetch<{ id: number }>("/auth/me"),
    staleTime: 300_000,
  });

  // Living Graph state
  const [activeLens, setActiveLens] = useState<LensId>("all");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [graphFullscreen, setGraphFullscreen] = useState(false);

  // Panel state
  const [activePanel, setActivePanel] = useState<SidePanel>("situations");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  // Signal stream state
  const [events, setEvents] = useState<TimelineEvent[]>(SEED_EVENTS);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [filterDomain, setFilterDomain] = useState<FilterDomain>("all");
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>("all");
  const [filterActionRequired, setFilterActionRequired] = useState(false);
  const [filterTimeRange, setFilterTimeRange] = useState<TimeRange>("all");
  const [liveWsCount, setLiveWsCount] = useState(0);

  // WS connection
  const handleNewWsEvent = useCallback((event: TimelineEvent) => {
    setEvents(prev => [event, ...prev.slice(0, 49)]);
    setLiveWsCount(c => c + 1);
    if (event.actionRequired) qc.invalidateQueries({ queryKey: ["nerve-actions"] });
  }, [qc]);

  const { wsStatus, subscribedChannels } = useNerveCenterWS(handleNewWsEvent);
  const synthesis = useAISynthesisStream(events);

  // Fetch pending actions from API
  const { data: approvalsData } = useQuery({
    queryKey: ["nerve-actions"],
    queryFn: async () => {
      try {
        return await apiFetch<{ pendingApprovals: ApiTriggerApproval[]; pendingPlans: ApiPendingPlan[] }>("/ai/mastra/action-engine/approvals");
      } catch {
        return { pendingApprovals: [], pendingPlans: [] };
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

  useEffect(() => {
    if (!approvalsData) return;
    setActions(mapApiActionsToLocal(approvalsData.pendingApprovals ?? [], approvalsData.pendingPlans ?? []).slice(0, 10));
  }, [approvalsData]);

  const filteredEvents = useMemo(() => events.filter(e => {
    if (filterDomain !== "all" && e.domain !== filterDomain) return false;
    if (filterSeverity !== "all" && e.severity !== filterSeverity) return false;
    if (filterActionRequired && !e.actionRequired) return false;
    if (!isWithinTimeRange(e.timestamp, filterTimeRange)) return false;
    return true;
  }), [events, filterDomain, filterSeverity, filterActionRequired, filterTimeRange]);

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
                Object.keys(recent).slice(0, 4).forEach(k => {
                  const v = (recent as Record<string, unknown>)[k];
                  if (v != null && typeof v !== "object") contextData[k] = String(v);
                });
              }
            } else if (data && typeof data === "object") {
              Object.entries(data).slice(0, 5).forEach(([k, v]) => {
                if (v != null && typeof v !== "object") contextData[k] = String(v);
              });
            }
            setEvents(p => p.map(e => e.id === id ? { ...e, context: { ...(e.context ?? {}), ...contextData }, contextLoading: false, contextFetched: true } : e));
          })
          .catch(() => setEvents(p => p.map(e => e.id === id ? { ...e, contextLoading: false, contextFetched: true } : e)));
        return updated;
      }
      return prev.map(e => e.id === id ? { ...e, expanded: !e.expanded } : e);
    });
  }

  function handleActionDecision(id: string, _type: ActionDecision) {
    const decided = actions.find(a => a.id === id);
    setActions(prev => prev.filter(a => a.id !== id));
    if (decided) {
      setEvents(prev => prev.map(e => {
        if (e.domain !== decided.domain || !e.actionRequired) return e;
        if (decided.proofChainRef && e.proofChainRef === decided.proofChainRef) return { ...e, actionRequired: false };
        if (e.id === decided.id) return { ...e, actionRequired: false };
        return e;
      }));
    }
    qc.invalidateQueries({ queryKey: ["nerve-actions"] });
  }

  const handleHighlightNodes = useCallback((nodeIds: Set<string>) => setHighlightedNodes(nodeIds), []);
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const lensConfig = LENS_CONFIGS[activeLens];
  const criticalCount = events.filter(e => e.severity === "critical").length;
  const pendingActionsCount = actions.length;
  const WsIcon = wsStatus === "connected" ? Wifi : WifiOff;
  const wsColor = wsStatus === "connected" ? "#22c55e" : wsStatus === "connecting" ? ELECTRIC : wsStatus === "auth_failed" ? "#f59e0b" : "#c45a4a";

  // Side panel tabs
  const SIDE_TABS: { id: SidePanel; label: string; icon: React.ReactNode; badge?: string; alert?: boolean }[] = [
    { id: "situations", label: "Situations", icon: <AlertTriangle className="w-3.5 h-3.5" />, badge: "2 Active" },
    { id: "signals", label: "Signals", icon: <Radio className="w-3.5 h-3.5" />, badge: String(filteredEvents.length) },
    { id: "motion", label: "Motion", icon: <Workflow className="w-3.5 h-3.5" />, badge: String(pendingActionsCount), alert: pendingActionsCount > 0 },
    { id: "intelligence", label: "Intel", icon: <Brain className="w-3.5 h-3.5" />, badge: String(synthesis.length) },
    { id: "brief", label: "Brief", icon: <FileText className="w-3.5 h-3.5" />, badge: "EDB" },
    { id: "trace", label: "Trace", icon: <GitBranch className="w-3.5 h-3.5" />, badge: "$4.2K/hr" },
    { id: "anomaly", label: "Anomaly", icon: <Activity className="w-3.5 h-3.5" />, badge: "3" },
  ];

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: BG.page }}>
      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" style={{ color: "#4B8BDB" }} />
            <div>
              <span className="text-sm font-bold text-white tracking-tight">Nerve Center</span>
              <span className="ml-2 text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(75,139,219,0.6)" }}>Executive Intelligence OS</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 ml-4">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: wsStatus === "connected" ? "#10b981" : wsColor }} />
            <span className="text-[9px] font-medium" style={{ color: wsStatus === "connected" ? "#10b981" : wsColor }}>
              {wsStatus === "connected" ? "Live" : wsStatus}
            </span>
            <span className="text-[9px] ml-2" style={{ color: "rgba(255,255,255,0.2)" }}>7 domains · 247 signals/24h</span>
            {wsStatus === "connected" && subscribedChannels.size > 0 && (
              <span className="text-[8px] font-mono ml-1" style={{ color: TEXT.muted }}>{subscribedChannels.size}ch</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Lens switcher */}
          <div className="hidden lg:flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/[0.06]">
            {LENS_IDS.map(lens => {
              const cfg = LENS_CONFIGS[lens];
              const isActive = activeLens === lens;
              return (
                <button key={lens} onClick={() => setActiveLens(lens)}
                  className="text-[8px] px-2 py-1 rounded-md font-bold uppercase tracking-widest transition-all"
                  style={{
                    background: isActive ? `${cfg.color}20` : "transparent",
                    color: isActive ? cfg.color : "rgba(255,255,255,0.3)",
                    border: isActive ? `1px solid ${cfg.color}40` : "1px solid transparent",
                  }}
                >
                  {lens === "all" ? "ALL" : lens.slice(0, 3).toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Critical alert */}
          {criticalCount > 0 && (
            <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: "rgba(196,90,74,0.10)", border: "1px solid rgba(196,90,74,0.20)" }}>
              <AlertTriangle className="w-3 h-3" style={{ color: "#c45a4a" }} />
              <span className="text-[9px] font-mono font-bold" style={{ color: "#c45a4a" }}>{criticalCount} Critical</span>
            </motion.div>
          )}

          {liveWsCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: ELECTRIC_DIM, border: "1px solid rgba(45,212,191,0.12)" }}>
              <span className="text-[8px] font-mono" style={{ color: ELECTRIC }}>{liveWsCount} live</span>
            </div>
          )}

          <button onClick={() => setGraphFullscreen(f => !f)}
            className="p-1.5 rounded-lg border hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            title="Toggle fullscreen graph">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Action Bar (HITL approvals) ─────────────────────────────────────── */}
      {actions.length > 0 && (
        <div className="px-4 py-2 shrink-0" style={{ background: "rgba(74,144,184,0.04)", borderBottom: "1px solid rgba(74,144,184,0.10)" }}>
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <Workflow className="w-3 h-3" style={{ color: "#4a90b8" }} />
              <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: "#4a90b8" }}>Action Bar</span>
              <span className="text-[7px] font-mono px-1 rounded" style={{ background: "rgba(74,144,184,0.12)", color: "#4a90b8" }}>{actions.length}</span>
            </div>
            {actions.slice(0, 4).map(a => {
              const aCfg = DOMAINS[a.domain];
              const AIcon = aCfg.icon;
              return (
                <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 rounded shrink-0"
                  style={{ background: a.urgency === "critical" ? "rgba(196,90,74,0.08)" : BG.surface, border: `1px solid ${a.urgency === "critical" ? "rgba(196,90,74,0.18)" : BORDER.subtle}` }}>
                  <AIcon className="w-2.5 h-2.5" style={{ color: aCfg.color }} />
                  <span className="text-[8px] max-w-[120px] truncate cursor-pointer hover:underline" style={{ color: TEXT.secondary }}
                    onClick={() => { setActivePanel("motion"); setRightPanelOpen(true); }}>{a.title}</span>
                  <SeverityBadge s={a.urgency} small />
                  <InlineActionButtons actionId={a.id} actionType={a.type} onDecision={handleActionDecision} />
                </div>
              );
            })}
            {actions.length > 4 && (
              <button onClick={() => { setActivePanel("motion"); setRightPanelOpen(true); }}
                className="text-[8px] px-2 py-1 rounded shrink-0 transition-all hover:opacity-80"
                style={{ color: "#4a90b8", background: "rgba(74,144,184,0.08)", border: "1px solid rgba(74,144,184,0.12)" }}>
                +{actions.length - 4} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel: Posture Ring + Lens info */}
        {leftPanelOpen && !graphFullscreen && (
          <aside
            className="w-56 shrink-0 flex flex-col border-r"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.7)" }}
          >
            <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>Command Posture</span>
                <button onClick={() => setLeftPanelOpen(false)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
              <CommandPostureRing activeLens={activeLens} />
            </div>

            <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>Active Lens</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: lensConfig.color }} />
                <span className="text-[11px] font-semibold text-white">{lensConfig.label}</span>
              </div>
              <p className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{lensConfig.label} analysis active</p>
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>PRISM Lenses</div>
              <div className="flex flex-col gap-1">
                {PRISM_LENSES.map(l => (
                  <div key={l.key} className="flex items-center gap-2 py-1">
                    <span className="text-[8px] font-mono font-bold w-4" style={{ color: l.color }}>{l.key}</span>
                    <l.icon className="w-2.5 h-2.5 shrink-0" style={{ color: l.color }} />
                    <span className="text-[8px]" style={{ color: TEXT.secondary }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Collapsed left panel toggle */}
        {!leftPanelOpen && !graphFullscreen && (
          <button
            onClick={() => setLeftPanelOpen(true)}
            className="w-8 shrink-0 flex items-center justify-center border-r hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {/* Center: Living Graph */}
        <div className="flex-1 min-w-0 relative">
          <LivingGraph
            activeLens={activeLens}
            highlightedNodeIds={highlightedNodes}
            onNodeClick={handleNodeClick}
          />

          {/* Selected node overlay */}
          {selectedNode && (() => {
            const DOMAIN_COLORS: Record<string, string> = {
              vessels: "#38bdf8", terra: "#86efac", aegis: "#818cf8",
              prism: "#fbbf24", lyte: "#2dd4bf", alloy: "#c084fc", people: "#fb923c",
            };
            const nodeColor = DOMAIN_COLORS[selectedNode.domain] ?? "#a78bfa";
            return (
              <div
                className="absolute bottom-4 left-4 rounded-xl p-3 max-w-xs"
                style={{ background: "rgba(8,12,20,0.92)", border: `1px solid ${nodeColor}30`, backdropFilter: "blur(16px)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: nodeColor }} />
                  <span className="text-[10px] font-bold" style={{ color: nodeColor }}>{selectedNode.label}</span>
                  <button onClick={() => setSelectedNode(null)} className="ml-auto w-4 h-4 flex items-center justify-center rounded hover:bg-white/10" style={{ color: TEXT.muted }}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
                <p className="text-[9px]" style={{ color: TEXT.secondary }}>{selectedNode.domain} · {selectedNode.type}</p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <div className="rounded px-1.5 py-1" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-[7px]" style={{ color: TEXT.muted }}>heat</div>
                    <div className="text-[9px] font-mono" style={{ color: TEXT.primary }}>{(selectedNode.heat * 100).toFixed(0)}%</div>
                  </div>
                  <div className="rounded px-1.5 py-1" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-[7px]" style={{ color: TEXT.muted }}>lens weight</div>
                    <div className="text-[9px] font-mono" style={{ color: TEXT.primary }}>{(selectedNode.lensWeights[activeLens] * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right panel */}
        {rightPanelOpen && !graphFullscreen && (
          <aside
            className="w-80 shrink-0 flex flex-col border-l"
            style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.7)" }}
          >
            {/* Tab header */}
            <div className="flex items-center border-b shrink-0 overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center flex-1 min-w-0">
                {SIDE_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePanel(tab.id)}
                    className="flex items-center gap-1 px-2.5 py-2 text-[8px] font-medium uppercase tracking-wide transition-colors shrink-0 relative"
                    style={{
                      color: activePanel === tab.id ? ELECTRIC : "rgba(255,255,255,0.3)",
                      borderBottom: activePanel === tab.id ? `2px solid ${ELECTRIC}` : "2px solid transparent",
                      marginBottom: "-1px",
                    }}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline ml-0.5">{tab.label}</span>
                    {tab.badge && (
                      <span className="ml-0.5 text-[7px] px-1 rounded font-mono"
                        style={{ background: tab.alert ? "rgba(196,90,74,0.15)" : "rgba(255,255,255,0.06)", color: tab.alert ? "#c45a4a" : TEXT.muted }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={() => setRightPanelOpen(false)} className="w-8 h-8 flex items-center justify-center hover:bg-white/5 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {activePanel === "situations" && <SituationRooms onHighlightNodes={handleHighlightNodes} />}
              {activePanel === "brief" && <ExecutiveDailyBrief />}
              {activePanel === "trace" && <DecisionTrace />}
              {activePanel === "anomaly" && <AnomalyDetection />}

              {activePanel === "signals" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ background: "rgba(200,149,60,0.04)", border: "1px solid rgba(200,149,60,0.10)" }}>
                    <Radio className="w-3 h-3 shrink-0" style={{ color: "#c8953c" }} />
                    <p className="text-[8px] leading-relaxed" style={{ color: "rgba(200,149,60,0.70)" }}>
                      PRISM Signals Layer — real-time cross-domain events with HITL classifications, proof chain refs, and domain context.
                    </p>
                  </div>
                  {/* Filter row */}
                  <div className="flex items-center gap-1 flex-wrap mb-2">
                    {(["all", ...Object.keys(DOMAINS)] as FilterDomain[]).map(d => (
                      <button key={d} onClick={() => setFilterDomain(d)}
                        className="text-[7px] px-1.5 py-0.5 rounded capitalize transition-all"
                        style={{
                          background: filterDomain === d ? (d === "all" ? ELECTRIC_DIM : DOMAINS[d as Domain]?.bg) : BG.elevated,
                          color: filterDomain === d ? (d === "all" ? ELECTRIC : DOMAINS[d as Domain]?.color) : TEXT.muted,
                          border: `1px solid ${BORDER.subtle}`,
                        }}>
                        {d === "all" ? "All" : DOMAINS[d as Domain]?.shortLabel}
                      </button>
                    ))}
                    {filterDomain !== "all" && (
                      <button onClick={() => setFilterDomain("all")} className="text-[7px] px-1 py-0.5 rounded" style={{ color: TEXT.muted, border: `1px solid ${BORDER.subtle}` }}>
                        <X className="w-2 h-2" />
                      </button>
                    )}
                  </div>
                  {filteredEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Search className="w-6 h-6" style={{ color: TEXT.muted }} />
                      <p className="text-[10px]" style={{ color: TEXT.tertiary }}>No signals match filters</p>
                    </div>
                  ) : (
                    filteredEvents.map(event => <TimelineEventCard key={event.id} event={event} onExpand={toggleExpand} />)
                  )}
                </div>
              )}

              {activePanel === "motion" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ background: "rgba(74,144,184,0.04)", border: "1px solid rgba(74,144,184,0.10)" }}>
                    <Workflow className="w-3 h-3 shrink-0" style={{ color: "#4a90b8" }} />
                    <p className="text-[8px] leading-relaxed" style={{ color: "rgba(74,144,184,0.70)" }}>
                      PRISM Motion Layer — governed execution queue. Every action requires Human-in-the-Loop (HITL) approval through Trust Layer 09. Decisions are recorded immutably in Proof Chain (Layer 05).
                    </p>
                  </div>
                  {actions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <CheckCircle2 className="w-6 h-6" style={{ color: "#22c55e" }} />
                      <p className="text-[10px]" style={{ color: TEXT.tertiary }}>All HITL approval gates resolved</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {actions.map(action => (
                        <ActionCard key={action.id} action={action} onDecision={handleActionDecision} currentUserId={currentUser?.id} />
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              )}

              {activePanel === "intelligence" && (
                <div>
                  <div className="flex items-center gap-2 mb-3 p-2 rounded-lg" style={{ background: "rgba(139,122,200,0.04)", border: "1px solid rgba(139,122,200,0.12)" }}>
                    <Brain className="w-3 h-3 shrink-0" style={{ color: "#8b7ac8" }} />
                    <p className="text-[8px] leading-relaxed" style={{ color: "rgba(139,122,200,0.70)" }}>
                      PRISM Intelligence Lens — cross-domain signal fusion via multi-agent orchestrator. AI synthesis that single-domain monitoring tools cannot replicate.
                    </p>
                  </div>
                  <SynthesisStream messages={synthesis} />
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Collapsed right panel toggle */}
        {!rightPanelOpen && !graphFullscreen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="w-8 shrink-0 flex items-center justify-center border-l hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.2)" }}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
