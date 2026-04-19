import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Brain, CheckCircle2,
  ChevronLeft, ChevronRight, Circle, Clock, DollarSign, Eye, FileText,
  Globe, Layers, Shield, Star, Target, TrendingDown, TrendingUp,
  Users, Zap, X, Play, Check, Info, Briefcase, GitBranch,
  RefreshCw, Ticket, UserCheck, CheckCheck, BellOff, XCircle, ExternalLink,
  History,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { SiteNav } from "@/components/SiteNav";

const ACCENT = "#8b7ac8";
const BG_CARD = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.07)";

// ── Action Store (server-backed shared state, localStorage cache) ─────────────
//
// Risk owner assignments and decisions are persisted to the API server
// (/api/action-store) so every team member sees the same state. localStorage
// is used only as a cache for instant first paint while the server load is
// in flight.

const STORE_KEY = "szl:actionStore";
const STORE_URL = "/api/action-store";

type RiskActionState = { type: "playbook" | "ticket"; status: "running" | "done"; result?: string; ticketId?: string; ticketUrl?: string; at?: string; actor?: string };
type OppDecision = { decision: "accept" | "reject" | "snooze"; reason?: string; snoozeUntil?: string; at: string; actor?: string };
type RecDecision = { decision: "accept" | "reject" | "snooze"; reason?: string; snoozeUntil?: string; at: string; actor?: string };

const CURRENT_ACTOR = "You (Operator)";

interface ActionStore {
  riskOwners: Record<string, string>;
  riskActions: Record<string, RiskActionState>;
  oppDecisions: Record<string, OppDecision>;
  recDecisions: Record<string, RecDecision>;
}

type ActionStorePatch = Partial<{
  riskOwners: Record<string, string | null>;
  riskActions: Record<string, RiskActionState | null>;
  oppDecisions: Record<string, OppDecision | null>;
  recDecisions: Record<string, RecDecision | null>;
}>;

function emptyStore(): ActionStore {
  return { riskOwners: {}, riskActions: {}, oppDecisions: {}, recDecisions: {} };
}

function readCache(): ActionStore {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {}
  return emptyStore();
}

function writeCache(store: ActionStore) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
}

function applyPatchLocal(prev: ActionStore, patch: ActionStorePatch): ActionStore {
  const next: ActionStore = {
    riskOwners: { ...prev.riskOwners },
    riskActions: { ...prev.riskActions },
    oppDecisions: { ...prev.oppDecisions },
    recDecisions: { ...prev.recDecisions },
  };
  for (const key of ["riskOwners", "riskActions", "oppDecisions", "recDecisions"] as const) {
    const slice = patch[key];
    if (!slice) continue;
    for (const [id, value] of Object.entries(slice)) {
      if (value === null || value === undefined) {
        delete (next[key] as Record<string, unknown>)[id];
      } else {
        (next[key] as Record<string, unknown>)[id] = value;
      }
    }
  }
  return next;
}

// Polling cadence used as a safety net when the SSE stream is unavailable
// (e.g. the connection failed to open or the browser dropped it). While the
// stream is live, polling is paused so it stays effectively idle.
const POLL_INTERVAL_MS = 15000;
const STREAM_URL = `${STORE_URL}/stream`;

function storesEqual(a: ActionStore, b: ActionStore): boolean {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

function useActionStore() {
  const [store, setStore] = useState<ActionStore>(readCache);
  const pendingRef = useRef(0);
  const streamConnectedRef = useRef(false);

  const applyServer = useCallback((server: Partial<ActionStore>) => {
    const merged = { ...emptyStore(), ...server };
    setStore(prev => {
      if (storesEqual(prev, merged)) return prev;
      writeCache(merged);
      return merged;
    });
  }, []);

  const refresh = useCallback(async () => {
    if (pendingRef.current > 0) return;
    try {
      const r = await fetch(STORE_URL, { credentials: "include" });
      if (!r.ok) return;
      const json = await r.json();
      applyServer((json.data ?? json) as Partial<ActionStore>);
    } catch { /* keep cached store */ }
  }, [applyServer]);

  useEffect(() => {
    refresh();

    // Primary sync channel — Server-Sent Events push the full store within
    // ~100ms of any teammate's change. EventSource auto-reconnects on drop.
    let es: EventSource | null = null;
    try {
      es = new EventSource(STREAM_URL, { withCredentials: true });
      es.addEventListener("store", (ev: MessageEvent) => {
        streamConnectedRef.current = true;
        if (pendingRef.current > 0) return; // local optimistic write in flight
        try {
          const data = JSON.parse(ev.data) as Partial<ActionStore>;
          applyServer(data);
        } catch { /* ignore malformed frame */ }
      });
      es.onopen = () => { streamConnectedRef.current = true; };
      es.onerror = () => { streamConnectedRef.current = false; };
    } catch {
      streamConnectedRef.current = false;
    }

    // Polling safety net — only fires when the stream isn't currently
    // connected, so it stays idle during normal operation.
    const id = window.setInterval(() => {
      if (!streamConnectedRef.current) refresh();
    }, POLL_INTERVAL_MS);
    const onVis = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      if (es) es.close();
    };
  }, [refresh, applyServer]);

  const patch = useCallback((partial: ActionStorePatch) => {
    setStore(prev => {
      const next = applyPatchLocal(prev, partial);
      writeCache(next);
      return next;
    });
    pendingRef.current += 1;
    fetch(STORE_URL, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!json) return;
        const server = (json.data ?? json) as Partial<ActionStore>;
        const merged = { ...emptyStore(), ...server };
        setStore(merged);
        writeCache(merged);
      })
      .catch(() => { /* offline / network — local state retained */ })
      .finally(() => { pendingRef.current = Math.max(0, pendingRef.current - 1); });
  }, []);

  return { store, patch };
}

// ── Toast Notification ─────────────────────────────────────────────────────────

type ToastMsg = { id: number; text: string; type: "success" | "info" | "error" };

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map(t => (
          <m.div key={t.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.2 }}
            style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 1rem", borderRadius: "0.625rem", background: t.type === "success" ? "hsla(160,60%,8%,0.95)" : t.type === "error" ? "hsla(0,60%,8%,0.95)" : "hsla(265,30%,8%,0.95)", border: `1px solid ${t.type === "success" ? "#22c55e30" : t.type === "error" ? "#ef444430" : "#8b7ac830"}`, backdropFilter: "blur(8px)", maxWidth: "340px" }}>
            {t.type === "success" ? <CheckCircle2 style={{ width: 13, height: 13, color: "#22c55e", flexShrink: 0 }} /> : t.type === "error" ? <XCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} /> : <Info style={{ width: 13, height: 13, color: ACCENT, flexShrink: 0 }} />}
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", flex: 1, lineHeight: 1.4 }}>{t.text}</span>
            <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, flexShrink: 0 }}>
              <X style={{ width: 11, height: 11 }} />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = { current: 0 };
  const show = useCallback((text: string, type: ToastMsg["type"] = "success", duration = 4000) => {
    const id = ++idRef.current;
    setToasts(p => [...p, { id, text, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, show, dismiss };
}

// ── Data Models ────────────────────────────────────────────────────────────────

type DomainId = "aegis" | "terra" | "vessels" | "lyte" | "prism" | "carlota";
const DOMAINS: Record<DomainId, { name: string; color: string }> = {
  aegis:   { name: "Aegis",    color: "#6366f1" },
  terra:   { name: "Terra",    color: "#4d7c0f" },
  vessels: { name: "Vessels",  color: "#3b82f6" },
  lyte:    { name: "Lyte",     color: "#f59e0b" },
  prism:   { name: "PRISM",    color: "#a855f7" },
  carlota: { name: "Carlota",  color: "#c2a55a" },
};

const EXEC_HEALTH = {
  score: 76,
  delta: "+3 pts",
  trend: "up" as const,
  exposure: "$8.4M",
  topIssues: [
    { title: "Lyte API P95 breaching 2.4s SLA", severity: "high", domain: "lyte" as DomainId },
    { title: "Carlota Jo real-time feed stale 3h+", severity: "high", domain: "carlota" as DomainId },
    { title: "2 over-budget domains consuming $1.2M extra", severity: "medium", domain: "aegis" as DomainId },
  ],
  topOpps: [
    { title: "Lyte AI Signal Summarizer usage +34% — expand capacity", value: "$820K ARR uplift", domain: "lyte" as DomainId },
    { title: "Vessels Voyage Economics re-engagement possible", value: "$280K saved", domain: "vessels" as DomainId },
    { title: "Terra distress borough filter = retention lever", value: "$140K ARR", domain: "terra" as DomainId },
  ],
  blockedActions: [
    { title: "LP Q1 Update Report", reason: "Draft pending CFO sign-off", exposure: "$180M LP portfolio" },
    { title: "PRISM Webhook Deploy", reason: "Code review queue depth 12", exposure: "Enterprise blocker" },
    { title: "Carlota Jo Feed Reconnect", reason: "CRM credentials expired", exposure: "Churn risk" },
  ],
  changesYesterday: [
    "Vessels fleet uptime maintained 99.8% for 7th consecutive day",
    "Terra distress engine usage +21% — no borough filter yet deployed",
    "Aegis bundle grew 1.34MB vs 900KB budget — MITRE module root cause",
    "PRISM matter intake completion 88.3% — up 2.1% this week",
  ],
  changesLastWeek: [
    "Portfolio Health Score improved from 73 → 76 (+3 pts)",
    "Carlota Jo real-time data pipeline SLA breach — 4 occurrences",
    "Lyte API SLA degradation — 18.5% of readings over threshold",
    "Aegis client satisfaction NPS held at 82 — stable",
    "New: Terra Ownership Graph usage declining −22% — intervention needed",
  ],
};

const KPI_HEALTH_DATA = [
  { id: "k1", domain: "lyte" as DomainId, name: "API Latency P95", current: "2.4s", target: "2.0s", status: "breach", trend: "up" as const, causal: "Full table scan on distress_score query; index missing" },
  { id: "k2", domain: "aegis" as DomainId, name: "Security MTTR", current: "11m", target: "15m", status: "healthy", trend: "down" as const, causal: "Automated playbook firing 43% of incidents without analyst" },
  { id: "k3", domain: "vessels" as DomainId, name: "Fleet Uptime", current: "99.8%", target: "99.5%", status: "healthy", trend: "flat" as const, causal: "No anomalous port events in trailing 7 days" },
  { id: "k4", domain: "terra" as DomainId, name: "Deal Response Time", current: "18h", target: "24h", status: "healthy", trend: "down" as const, causal: "AI pre-triage routing reducing analyst queue depth" },
  { id: "k5", domain: "lyte" as DomainId, name: "Driver On-Time Rate", current: "88%", target: "92%", status: "breach", trend: "down" as const, causal: "Weather event clusters in DC corridor; 3 routes impacted" },
  { id: "k6", domain: "prism" as DomainId, name: "Contract Turnaround", current: "68h", target: "72h", status: "healthy", trend: "down" as const, causal: "AI review assistant reducing first-read time by 18%" },
  { id: "k7", domain: "carlota" as DomainId, name: "Data Freshness", current: "3.7h stale", target: "<1h", status: "breach", trend: "up" as const, causal: "CRM sync credentials expired; pipeline disconnected" },
  { id: "k8", domain: "aegis" as DomainId, name: "Patch Compliance", current: "96.4%", target: "95%", status: "healthy", trend: "flat" as const, causal: "Weekly automated patch cycle running on schedule" },
];

const RISK_REGISTER = [
  { id: "r1", title: "Carlota Jo real-time data SLA breach", domain: "carlota" as DomainId, probability: 0.9, impact: "High", level: "critical", owner: "Ops Lead", mitigation: "Reconnect CRM sync, add freshness watchdog", trend: "up" as const },
  { id: "r2", title: "Lyte API latency breach escalation", domain: "lyte" as DomainId, probability: 0.7, impact: "High", level: "high", owner: "Eng Team", mitigation: "Add index on distress_score + borough", trend: "up" as const },
  { id: "r3", title: "Aegis bundle over-budget degrading UX", domain: "aegis" as DomainId, probability: 0.6, impact: "Medium", level: "high", owner: "Frontend Lead", mitigation: "Code-split MITRE ATT&CK (280KB eager load)", trend: "flat" as const },
  { id: "r4", title: "Terra ownership graph declining usage", domain: "terra" as DomainId, probability: 0.5, impact: "Medium", level: "medium", owner: "Product Lead", mitigation: "UX review, add AI-guided walkthrough", trend: "down" as const },
  { id: "r5", title: "LP Q1 Report deadline exposure", domain: "terra" as DomainId, probability: 0.4, impact: "High", level: "medium", owner: "CFO", mitigation: "Fast-track CFO review session this week", trend: "flat" as const },
];

const OPP_REGISTER = [
  { id: "o1", title: "Lyte AI Signal Summarizer adoption acceleration", domain: "lyte" as DomainId, probability: 0.85, value: "$820K ARR", level: "high", action: "Expand capacity, add org-wide rollout incentive", owner: "Growth Lead" },
  { id: "o2", title: "Terra distress borough filter — retention lever", domain: "terra" as DomainId, probability: 0.8, value: "$140K ARR", level: "high", action: "Low-effort implementation; prioritize this sprint", owner: "Eng Team" },
  { id: "o3", title: "PRISM & Carlota Jo webhook enterprise unlock", domain: "prism" as DomainId, probability: 0.7, value: "Unblocks 3 enterprise deals", level: "high", action: "Implement using shared webhook-engine lib", owner: "Backend Lead" },
  { id: "o4", title: "Vessels Voyage Economics re-engagement", domain: "vessels" as DomainId, probability: 0.6, value: "$280K saved", level: "medium", action: "Charter rate benchmark feature re-activation", owner: "Product Lead" },
];

const POLICIES_SUMMARY = [
  { id: "p1", title: "Data Retention & Disposal", status: "active", owner: "Priya Nair", domains: ["All"], lastReview: "Apr 10", enforcement: "auto" },
  { id: "p2", title: "Cross-Domain Access Control", status: "active", owner: "James Okafor", domains: ["Aegis", "Vessels", "Terra"], lastReview: "Apr 8", enforcement: "auto" },
  { id: "p3", title: "AI Model Governance", status: "pending", owner: "Stephen Lutar", domains: ["Command", "Aegis"], lastReview: "Apr 14", enforcement: "manual" },
  { id: "p4", title: "Maritime Cybersecurity IR", status: "active", owner: "James Okafor", domains: ["Vessels", "Aegis"], lastReview: "Apr 5", enforcement: "auto" },
  { id: "p5", title: "RE Deal Approval Thresholds", status: "draft", owner: "Sofia Reyes", domains: ["Terra"], lastReview: "Apr 15", enforcement: "manual" },
];

const VALUE_LEDGER = [
  { id: "v1", type: "at-risk" as const, label: "Carlota Jo pipeline disconnection", amount: 380000, domain: "carlota" as DomainId, note: "Churn risk if feed stale > 24h" },
  { id: "v2", type: "at-risk" as const, label: "Lyte SLA penalties exposure", amount: 420000, domain: "lyte" as DomainId, note: "2 SLAs breaching, contractual penalties possible" },
  { id: "v3", type: "at-risk" as const, label: "Aegis bundle degradation — churn risk", amount: 280000, domain: "aegis" as DomainId, note: "UX degradation in high-usage MITRE module" },
  { id: "v4", type: "protected" as const, label: "Automated incident response savings", amount: 1200000, domain: "aegis" as DomainId, note: "43% of incidents closed auto, saving ~8h analyst time/day" },
  { id: "v5", type: "protected" as const, label: "Terra AI pre-triage — deal velocity", amount: 340000, domain: "terra" as DomainId, note: "18% faster response = fewer lost deals" },
  { id: "v6", type: "created" as const, label: "Lyte Signal Summarizer ARR uplift", amount: 820000, domain: "lyte" as DomainId, note: "+34% usage → upsell trigger" },
  { id: "v7", type: "created" as const, label: "Terra borough filter conversion value", amount: 140000, domain: "terra" as DomainId, note: "Estimated from user feedback NPS uplift" },
];

const WORKFLOW_PERF = [
  { id: "w1", name: "Carlota Jo Client Onboarding", domain: "carlota" as DomainId, steps: 8, completion: 84, avgMin: 22, bottleneck: "Step 4: Contract sign-off (avg 6m)", status: "active" },
  { id: "w2", name: "Aegis Incident Response", domain: "aegis" as DomainId, steps: 12, completion: 91, avgMin: 41, bottleneck: "Step 7: Escalation approval (avg 11m)", status: "active" },
  { id: "w3", name: "Vessels Inspection Workflow", domain: "vessels" as DomainId, steps: 6, completion: 77, avgMin: 18, bottleneck: "Step 5: Photo upload (avg 4m)", status: "active" },
  { id: "w4", name: "Terra Due Diligence", domain: "terra" as DomainId, steps: 10, completion: 68, avgMin: 55, bottleneck: "Step 6: Ownership verification (avg 18m)", status: "active" },
  { id: "w5", name: "PRISM Matter Intake", domain: "prism" as DomainId, steps: 7, completion: 88, avgMin: 14, bottleneck: "Step 3: Conflict check (avg 3m)", status: "active" },
  { id: "w6", name: "SZL LP Quarterly Update", domain: "lyte" as DomainId, steps: 9, completion: 55, avgMin: 90, bottleneck: "Not yet run — template ready", status: "pending" },
];

const AGENT_TRUST = [
  { id: "a1", agent: "Aegis Threat Correlator", domain: "aegis" as DomainId, trustScore: 94, accuracy: 91, actionsExecuted: 1840, humanOverrides: 12, status: "certified" },
  { id: "a2", agent: "Lyte Signal Summarizer", domain: "lyte" as DomainId, trustScore: 89, accuracy: 87, actionsExecuted: 3420, humanOverrides: 38, status: "certified" },
  { id: "a3", agent: "Terra Distress Ranker", domain: "terra" as DomainId, trustScore: 82, accuracy: 84, actionsExecuted: 640, humanOverrides: 22, status: "monitored" },
  { id: "a4", agent: "Vessels Route Risk Scorer", domain: "vessels" as DomainId, trustScore: 86, accuracy: 88, actionsExecuted: 762, humanOverrides: 15, status: "certified" },
  { id: "a5", agent: "PRISM Conflict Checker", domain: "prism" as DomainId, trustScore: 78, accuracy: 81, actionsExecuted: 210, humanOverrides: 42, status: "monitored" },
  { id: "a6", agent: "Carlota Brand Sentiment", domain: "carlota" as DomainId, trustScore: 71, accuracy: 74, actionsExecuted: 94, humanOverrides: 28, status: "probation" },
];

const MODULES = [
  { id: "exec", label: "Executive Overview", icon: Star },
  { id: "kpi", label: "KPI/SLO Health", icon: Activity },
  { id: "flow", label: "Business Flow", icon: GitBranch },
  { id: "risk", label: "Risk Register", icon: AlertTriangle },
  { id: "opp", label: "Opportunities", icon: TrendingUp },
  { id: "policy", label: "Policy & Compliance", icon: Shield },
  { id: "value", label: "Value Ledger", icon: DollarSign },
  { id: "workflow", label: "Workflow Performance", icon: Layers },
  { id: "agent", label: "Agent Trust", icon: Brain },
  { id: "log", label: "Decision Log", icon: History },
] as const;

type ModuleId = typeof MODULES[number]["id"];

// ── Live Data Types & Context ──────────────────────────────────────────────────

type LiveKpi = { id: string; domain: string; name: string; current: string; target: string; status: string; trend: "up" | "down" | "flat"; causal: string };
type LiveRisk = { id: string; title: string; domain: string; probability: number; impact: string; level: string; owner: string; mitigation: string; trend: "up" | "down" | "flat" };
type LiveOpp = { id: string; title: string; domain: string; probability: number; value: string; level: string; action: string; owner: string };
type LiveValueItem = { id: string; type: "at-risk" | "protected" | "created"; label: string; amount: number; domain: string; note: string };
type LivePolicy = { id: string; title: string; status: string; owner: string; domains: string[]; lastReview: string; enforcement: string };
type LiveAgent = { id: string; agent: string; domain: string; trustScore: number; accuracy: number; actionsExecuted: number; humanOverrides: number; status: string };
type LiveExecHealth = {
  score: number;
  delta: string;
  trend: "up" | "down";
  exposure: string;
  topIssues: { title: string; severity: string; domain: string }[];
  topOpps: { title: string; value: string; domain: string }[];
  blockedActions: { title: string; reason: string; exposure: string }[];
  changesYesterday: string[];
  changesLastWeek: string[];
};
type LiveBusinessState = {
  execHealth: LiveExecHealth;
  kpiHealth: LiveKpi[];
  riskRegister: LiveRisk[];
  oppRegister: LiveOpp[];
  valueLedger: LiveValueItem[];
  policiesSummary: LivePolicy[];
  agentTrust: LiveAgent[];
  summary: { compositeScore: number; slaBreaching: number; firingAlerts: number };
  generatedAt: string;
  dataSource: string;
};

const LiveCtx = createContext<LiveBusinessState | null>(null);
function useLive() { return useContext(LiveCtx); }

// ── Helper Components ──────────────────────────────────────────────────────────

function DomainTag({ domain }: { domain: DomainId }) {
  const d = DOMAINS[domain];
  return (
    <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: `${d.color}20`, color: d.color }}>
      {d.name}
    </span>
  );
}

function SeverityDot({ level }: { level: string }) {
  const color = level === "critical" ? "#ef4444" : level === "high" ? "#f97316" : level === "medium" ? "#f59e0b" : "#22c55e";
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}80`, flexShrink: 0 }} />;
}

function HealthBar({ value, target, breach }: { value: number; target: number; breach: boolean }) {
  const pct = Math.min((value / Math.max(target, 1)) * 100, 150);
  const color = breach ? "#ef4444" : "#22c55e";
  return (
    <div style={{ height: "4px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px", overflow: "hidden", width: "80px" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: "2px" }} />
    </div>
  );
}

function ScorePill({ score, max = 100 }: { score: number; max?: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <span style={{ fontSize: "12px", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>{score}<span style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>/{max}</span></span>
  );
}

function SectionCard({ title, icon: Icon, accent = ACCENT, children }: { title: string; icon: React.ElementType; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.875rem", overflow: "hidden" }}>
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "0.625rem" }}>
        <div style={{ width: 26, height: 26, borderRadius: "6px", background: `${accent}15`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon style={{ width: 13, height: 13, color: accent }} />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "1.25rem" }}>
        {children}
      </div>
    </div>
  );
}

// ── Module: Executive Overview ─────────────────────────────────────────────────

function ExecutiveOverviewModule({ executiveMode }: { executiveMode: boolean }) {
  const live = useLive();
  const health = live?.execHealth ?? EXEC_HEALTH;
  const [period, setPeriod] = useState<"24h" | "7d">("24h");
  const healthColor = health.score >= 80 ? "#22c55e" : health.score >= 65 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr", gap: "0.875rem", alignItems: "stretch" }}>
        <div style={{
          background: BG_CARD,
          border: `2px solid ${healthColor}35`,
          borderRadius: "1rem",
          padding: executiveMode ? "2rem 1.5rem" : "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: executiveMode ? "160px" : "130px",
        }}>
          <div style={{ fontSize: executiveMode ? "3.5rem" : "2.75rem", fontWeight: 900, color: healthColor, letterSpacing: "-0.05em", lineHeight: 1 }}>
            {health.score}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: healthColor, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.5rem" }}>
            {health.score >= 80 ? "Good" : health.score >= 65 ? "Moderate" : "At Risk"}
          </div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>Business Health</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "0.625rem", fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>
            <TrendingUp style={{ width: 11, height: 11 }} />
            {health.delta}
          </div>
        </div>

        <SectionCard title="Top Issues" icon={AlertTriangle} accent="#ef4444">
          {health.topIssues.map((issue, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: i < 2 ? "0.625rem" : 0 }}>
              <SeverityDot level={issue.severity} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4, flex: 1 }}>{issue.title}</span>
              {DOMAINS[issue.domain as DomainId] && <DomainTag domain={issue.domain as DomainId} />}
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Top Opportunities" icon={TrendingUp} accent="#22c55e">
          {health.topOpps.map((opp, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? "0.625rem" : 0 }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4, marginBottom: "2px" }}>{opp.title}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e" }}>{opp.value}</div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Blocked Actions" icon={AlertTriangle} accent="#f97316">
          {health.blockedActions.map((action, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? "0.625rem" : 0 }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{action.title}</div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{action.reason}</div>
              <div style={{ fontSize: "9px", color: "#f97316", marginTop: "1px" }}>{action.exposure}</div>
            </div>
          ))}
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.875rem", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              What Changed
            </span>
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {(["24h", "7d"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ fontSize: "9px", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: period === p ? "hsla(0,0%,100%,0.08)" : "transparent", border: `1px solid ${period === p ? "hsla(0,0%,100%,0.12)" : "transparent"}`, color: period === p ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.25)", cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          {(period === "24h" ? health.changesYesterday : health.changesLastWeek).map((change, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.375rem" }}>
              <ArrowRight style={{ width: 10, height: 10, color: "rgba(255,255,255,0.25)", flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{change}</span>
            </div>
          ))}
        </div>

        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.875rem", padding: "1rem" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            Financial Exposure
          </div>
          <div style={{ fontSize: "2.25rem", fontWeight: 900, color: "#ef4444", letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>
            {health.exposure}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "0.875rem" }}>Total value at risk this period</div>
          {health.topIssues.slice(0, 3).map((issue, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0", borderBottom: i < 2 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", flex: 1 }}>{issue.title.slice(0, 32)}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444" }}>{issue.severity === "high" ? "High" : "Med"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Module: KPI/SLO Health ─────────────────────────────────────────────────────

function KPISLOModule() {
  const live = useLive();
  const kpiData = (live?.kpiHealth ?? KPI_HEALTH_DATA) as typeof KPI_HEALTH_DATA;
  const [domainFilter, setDomainFilter] = useState<DomainId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "breach" | "healthy">("all");

  const filtered = kpiData.filter(k =>
    (domainFilter === "all" || k.domain === domainFilter) &&
    (statusFilter === "all" || k.status === statusFilter)
  );

  const breachCount = kpiData.filter(k => k.status === "breach").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {(["all", "breach", "healthy"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", background: statusFilter === s ? (s === "breach" ? "hsla(0,70%,14%,0.6)" : s === "healthy" ? "hsla(160,60%,14%,0.6)" : "hsla(0,0%,100%,0.08)") : "transparent", border: `1px solid ${statusFilter === s ? (s === "breach" ? "#ef444430" : s === "healthy" ? "#22c55e30" : "hsla(0,0%,100%,0.12)") : "transparent"}`, color: statusFilter === s ? (s === "breach" ? "#ef4444" : s === "healthy" ? "#22c55e" : "rgba(255,255,255,0.65)") : "rgba(255,255,255,0.25)", cursor: "pointer", textTransform: "capitalize" }}>
              {s} {s === "breach" ? `(${breachCount})` : ""}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.375rem", marginLeft: "auto", flexWrap: "wrap" }}>
          {(["all", ...Object.keys(DOMAINS)] as const).map(d => (
            <button key={d} onClick={() => setDomainFilter(d as DomainId | "all")} style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", background: domainFilter === d ? (d === "all" ? "hsla(0,0%,100%,0.06)" : `${DOMAINS[d as DomainId]?.color}20`) : "transparent", border: `1px solid ${domainFilter === d ? (d === "all" ? "hsla(0,0%,100%,0.12)" : `${DOMAINS[d as DomainId]?.color}30`) : "transparent"}`, color: domainFilter === d ? (d === "all" ? "rgba(255,255,255,0.65)" : DOMAINS[d as DomainId]?.color) : "rgba(255,255,255,0.25)", cursor: "pointer" }}>
              {d === "all" ? "All" : DOMAINS[d as DomainId]?.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {filtered.map((kpi, i) => {
          const domain = DOMAINS[kpi.domain as DomainId] ?? { name: kpi.domain, color: "#8b7ac8" };
          const isBreach = kpi.status === "breach";
          return (
            <div key={kpi.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "1rem", alignItems: "center", padding: "0.75rem 0.875rem", background: isBreach ? "hsla(0,70%,5%,0.3)" : "transparent", borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: isBreach ? "2px solid #ef444460" : `2px solid ${domain.color}40`, marginBottom: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{kpi.name}</span>
                  {DOMAINS[kpi.domain as DomainId] && <DomainTag domain={kpi.domain as DomainId} />}
                  {isBreach && <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", background: "hsla(0,70%,14%,0.6)", color: "#ef4444" }}>BREACH</span>}
                </div>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)", lineHeight: 1.4, display: "flex", alignItems: "center", gap: "4px" }}>
                  <Info style={{ width: 9, height: 9 }} />
                  {kpi.causal}
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: isBreach ? "#ef4444" : "#22c55e", letterSpacing: "-0.02em" }}>{kpi.current}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>target: {kpi.target}</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {kpi.trend === "up" ? <TrendingUp style={{ width: 12, height: 12, color: isBreach ? "#ef4444" : "#22c55e" }} /> : kpi.trend === "down" ? <TrendingDown style={{ width: 12, height: 12, color: isBreach ? "#22c55e" : "#ef4444" }} /> : <div style={{ width: 12, height: 1, background: "rgba(255,255,255,0.2)" }} />}
              </div>

              <div style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", background: isBreach ? "hsla(0,70%,14%,0.6)" : "hsla(160,60%,14%,0.6)", color: isBreach ? "#ef4444" : "#22c55e" }}>
                {isBreach ? "Breach" : "Healthy"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Module: Business Flow Explorer ────────────────────────────────────────────

function BusinessFlowModule() {
  const flows = [
    { id: "f1", name: "Security Incident → Remediation", domains: ["aegis" as DomainId], steps: ["Signal Detection", "AI Triage", "Analyst Review", "Playbook Execution", "Resolution"], throughput: "1,840/mo", avgCycle: "41 min", efficiency: 91 },
    { id: "f2", name: "Property Lead → Deal Close", domains: ["terra" as DomainId], steps: ["Lead Intake", "Distress Score", "Ownership Verify", "Deal Pitch", "Due Diligence", "Close"], throughput: "640/mo", avgCycle: "55 min", efficiency: 68 },
    { id: "f3", name: "Vessel Risk → Alert → Action", domains: ["vessels" as DomainId], steps: ["AIS Monitor", "Anomaly Detect", "Risk Score", "Compliance Check", "Alert Dispatch"], throughput: "762/mo", avgCycle: "18 min", efficiency: 77 },
    { id: "f4", name: "Matter Intake → Review → Close", domains: ["prism" as DomainId], steps: ["Intake Form", "Conflict Check", "Attorney Assign", "Review", "Billing"], throughput: "210/mo", avgCycle: "14 min", efficiency: 88 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {flows.map(flow => {
        const effColor = flow.efficiency >= 85 ? "#22c55e" : flow.efficiency >= 70 ? "#f59e0b" : "#ef4444";
        return (
          <div key={flow.id} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.75rem", padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{flow.name}</span>
              {flow.domains.map(d => <DomainTag key={d} domain={d} />)}
              <div style={{ marginLeft: "auto", display: "flex", gap: "1rem", fontSize: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{flow.throughput}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>avg {flow.avgCycle}</span>
                <span style={{ fontWeight: 700, color: effColor }}>{flow.efficiency}% complete</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
              {flow.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                  <div style={{ flex: 1, padding: "5px 8px", background: `hsla(0,0%,100%,${0.02 + i * 0.01})`, border: `1px solid hsla(0,0%,100%,0.06)`, borderRadius: "4px", fontSize: "9px", color: "rgba(255,255,255,0.5)", textAlign: "center", fontWeight: 500 }}>
                    {step}
                  </div>
                  {i < flow.steps.length - 1 && (
                    <ChevronRight style={{ width: 10, height: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Module: Risk Register ──────────────────────────────────────────────────────

type LinearTeamOption = { id: string; key: string; name: string };

function RiskRegisterModule() {
  const live = useLive();
  const risks = (live?.riskRegister ?? RISK_REGISTER) as typeof RISK_REGISTER;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);
  const [ownerInput, setOwnerInput] = useState("");
  const { store, patch } = useActionStore();
  const { toasts, show, dismiss } = useToasts();

  const [defaultTeamKey, setDefaultTeamKey] = useState<string | null>(null);
  const [teams, setTeams] = useState<LinearTeamOption[]>([]);
  const [teamsErr, setTeamsErr] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/linear/settings", { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (cancelled || !json) return;
        const data = (json.data ?? json) as { defaultTeamKey?: string | null };
        setDefaultTeamKey(data?.defaultTeamKey ?? null);
      })
      .catch(() => {});
    fetch("/api/linear/teams", { credentials: "include" })
      .then(async r => {
        const json = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok) {
          setTeamsErr(json?.error || `Could not load Linear teams (HTTP ${r.status})`);
          return;
        }
        const data = (json.data ?? json) as { teams?: LinearTeamOption[] };
        setTeams(data?.teams ?? []);
      })
      .catch(err => { if (!cancelled) setTeamsErr((err as Error).message); });
    return () => { cancelled = true; };
  }, []);

  async function handleSaveDefaultTeam(nextKey: string | null) {
    setSavingDefault(true);
    try {
      const r = await fetch("/api/linear/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultTeamKey: nextKey }),
      });
      const json = await r.json().catch(() => null);
      if (!r.ok) {
        const msg =
          r.status === 401 || r.status === 403
            ? "You need an admin role to change the default Linear team."
            : json?.error || `Could not save default team (HTTP ${r.status})`;
        show(msg, "error", 6000);
        return;
      }
      const data = (json.data ?? json) as { defaultTeamKey?: string | null };
      setDefaultTeamKey(data?.defaultTeamKey ?? null);
      show(
        nextKey
          ? `Default Linear team set to ${nextKey}.`
          : "Default Linear team cleared — falls back to the workspace's first team.",
        "success",
      );
    } catch (err) {
      show(`Could not save default team: ${(err as Error).message}`, "error", 6000);
    } finally {
      setSavingDefault(false);
    }
  }

  const defaultTeamLabel = (() => {
    if (!defaultTeamKey) return null;
    const t = teams.find(t => t.key.toLowerCase() === defaultTeamKey.toLowerCase());
    return t ? `${t.key} · ${t.name}` : defaultTeamKey;
  })();

  function handlePlaybook(riskId: string, riskTitle: string) {
    patch({ riskActions: { [riskId]: { type: "playbook", status: "running", at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show("Triggering credential rotation playbook…", "info", 2000);
    setTimeout(() => {
      patch({ riskActions: { [riskId]: { type: "playbook", status: "done", result: "Credentials rotated. Pipeline reconnected at 14:38. Freshness restored.", at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
      show("Playbook complete — Carlota CRM pipeline reconnected successfully.", "success");
    }, 2500);
  }

  async function handleTicket(riskId: string, risk: typeof RISK_REGISTER[number]) {
    const startedAt = new Date().toISOString();
    patch({ riskActions: { [riskId]: { type: "ticket", status: "running", at: startedAt, actor: CURRENT_ACTOR } } });
    show("Creating Linear ticket…", "info", 2000);

    const priorityMap: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
    const description = [
      `**Risk:** ${risk.title}`,
      `**Domain:** ${risk.domain}`,
      `**Severity:** ${risk.level} (impact ${risk.impact}, probability ${Math.round(risk.probability * 100)}%)`,
      `**Mitigation:** ${risk.mitigation}`,
      ``,
      `Created from SZL Holdings Business State (risk id: ${risk.id}).`,
    ].join("\n");

    try {
      const response = await fetch("/api/linear/create-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${risk.domain.toUpperCase()}] ${risk.title}`,
          description,
          priority: priorityMap[risk.level] ?? 3,
          assigneeName: risk.owner,
          labels: [`domain:${risk.domain}`, `severity:${risk.level}`, "szl-business-state"],
        }),
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.identifier) {
        const errMsg = json?.error || `Linear ticket creation failed (HTTP ${response.status})`;
        patch({ riskActions: { [riskId]: null } });
        show(errMsg, "error", 6000);
        return;
      }
      patch({
        riskActions: {
          [riskId]: { type: "ticket", status: "done", ticketId: json.identifier, ticketUrl: json.url, at: new Date().toISOString(), actor: CURRENT_ACTOR },
        },
      });
      show(`Linear ticket ${json.identifier} created — assigned to ${json.assignee?.name ?? risk.owner}.`, "success");
    } catch (err) {
      patch({ riskActions: { [riskId]: null } });
      show(`Could not reach Linear: ${(err as Error).message}`, "error", 6000);
    }
  }

  function handleSaveOwner(riskId: string) {
    if (!ownerInput.trim()) return;
    patch({ riskOwners: { [riskId]: ownerInput.trim() } });
    show(`Owner updated to "${ownerInput.trim()}" — synced to Command Portal.`, "success");
    setEditingOwner(null);
    setOwnerInput("");
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", padding: "0.625rem 0.875rem", marginBottom: "0.5rem", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
          <Ticket style={{ width: 12, height: 12, color: ACCENT }} />
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Linear routing</span>
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}>
            New tickets land in:{" "}
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>
              {defaultTeamLabel ?? (teams[0] ? `${teams[0].key} · ${teams[0].name} (workspace default)` : teamsErr ? "—" : "loading…")}
            </strong>
          </span>
          {teamsErr && <span style={{ fontSize: "10px", color: "#f97316" }}>· {teamsErr}</span>}
          <button
            onClick={() => setAdminOpen(o => !o)}
            style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 600, padding: "3px 9px", borderRadius: "4px", background: adminOpen ? `${ACCENT}25` : "hsla(0,0%,100%,0.04)", border: `1px solid ${adminOpen ? `${ACCENT}50` : BORDER}`, color: adminOpen ? ACCENT : "rgba(255,255,255,0.55)", cursor: "pointer" }}
          >
            {adminOpen ? "Close admin" : "Admin"}
          </button>
        </div>
        {adminOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", borderTop: `1px solid ${BORDER}`, paddingTop: "0.5rem" }}>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Default team</span>
            <select
              value={defaultTeamKey ?? ""}
              onChange={e => handleSaveDefaultTeam(e.target.value || null)}
              disabled={savingDefault || teams.length === 0}
              style={{ fontSize: "11px", background: "hsla(0,0%,100%,0.06)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "3px 6px", color: "rgba(255,255,255,0.85)", outline: "none", minWidth: "200px" }}
            >
              <option value="">— Workspace first team —</option>
              {teams.map(t => (
                <option key={t.id} value={t.key}>{t.key} · {t.name}</option>
              ))}
            </select>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
              Each ticket is also tagged with <code style={{ fontSize: "10px", padding: "0 4px", background: "hsla(0,0%,100%,0.05)", borderRadius: 3 }}>domain:&lt;name&gt;</code> and <code style={{ fontSize: "10px", padding: "0 4px", background: "hsla(0,0%,100%,0.05)", borderRadius: 3 }}>severity:&lt;level&gt;</code> when those labels exist in Linear.
            </span>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {risks.map((risk, i) => {
          const color = risk.level === "critical" ? "#ef4444" : risk.level === "high" ? "#f97316" : "#f59e0b";
          const isSelected = selectedId === risk.id;
          const riskAction = store.riskActions[risk.id];
          const effectiveOwner = store.riskOwners[risk.id] ?? risk.owner;
          const isEditingThisOwner = editingOwner === risk.id;

          return (
            <div key={risk.id} style={{ borderBottom: i < risks.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0.875rem", cursor: "pointer", borderLeft: `3px solid ${color}60` }}
                onClick={() => setSelectedId(isSelected ? null : risk.id)}
              >
                <SeverityDot level={risk.level} />
                <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", flex: 1 }}>{risk.title}</span>
                {DOMAINS[risk.domain as DomainId] && <DomainTag domain={risk.domain as DomainId} />}
                <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>P: {Math.round(risk.probability * 100)}%</span>
                {riskAction?.status === "done" && (
                  <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", background: "#22c55e20", color: "#22c55e" }}>
                    {riskAction.type === "playbook" ? "Resolved" : `Ticket ${riskAction.ticketId}`}
                  </span>
                )}
                <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${color}20`, color }}>{risk.level}</span>
                {isSelected ? <ChevronLeft style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)", transform: "rotate(90deg)" }} /> : <ChevronRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)" }} />}
              </div>
              {isSelected && (
                <div style={{ padding: "0 0.875rem 0.875rem 2rem" }}>
                  <div style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "2rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Owner</div>
                        {isEditingThisOwner ? (
                          <div style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
                            <input
                              value={ownerInput}
                              onChange={e => setOwnerInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleSaveOwner(risk.id); if (e.key === "Escape") { setEditingOwner(null); setOwnerInput(""); } }}
                              placeholder={effectiveOwner}
                              autoFocus
                              style={{ fontSize: "11px", background: "hsla(0,0%,100%,0.06)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "2px 6px", color: "rgba(255,255,255,0.8)", outline: "none", width: "120px" }}
                            />
                            <button onClick={() => handleSaveOwner(risk.id)} style={{ fontSize: "9px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "#22c55e", border: "none", color: "#fff", cursor: "pointer" }}>Save</button>
                            <button onClick={() => { setEditingOwner(null); setOwnerInput(""); }} style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{effectiveOwner}</span>
                            <button onClick={(e) => { e.stopPropagation(); setEditingOwner(risk.id); setOwnerInput(effectiveOwner); }} style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "3px", background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
                              <UserCheck style={{ width: 8, height: 8 }} /> Reassign
                            </button>
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Impact</div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{risk.impact}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Trend</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                          {risk.trend === "up" ? <TrendingUp style={{ width: 11, height: 11, color: "#ef4444" }} /> : risk.trend === "down" ? <TrendingDown style={{ width: 11, height: 11, color: "#22c55e" }} /> : <div style={{ width: 11, height: 1, background: "rgba(255,255,255,0.2)" }} />}
                          <span style={{ fontSize: "11px", color: risk.trend === "up" ? "#ef4444" : risk.trend === "down" ? "#22c55e" : "rgba(255,255,255,0.4)" }}>{risk.trend}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "3px" }}>Mitigation</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: "0.75rem" }}>{risk.mitigation}</div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: `1px solid ${BORDER}`, paddingTop: "0.625rem" }}>
                      {risk.id === "r1" && (
                        riskAction?.type === "playbook" && riskAction.status === "running" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "10px", color: "#f59e0b" }}>
                            <RefreshCw style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} />
                            Running credential rotation playbook…
                          </div>
                        ) : riskAction?.type === "playbook" && riskAction.status === "done" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "10px", color: "#22c55e" }}>
                            <CheckCircle2 style={{ width: 11, height: 11 }} />
                            {riskAction.result}
                          </div>
                        ) : riskAction?.type !== "ticket" ? (
                          <button onClick={() => handlePlaybook(risk.id, risk.title)} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, padding: "5px 12px", borderRadius: "6px", background: "#c2a55a20", border: "1px solid #c2a55a40", color: "#c2a55a", cursor: "pointer" }}>
                            <RefreshCw style={{ width: 10, height: 10 }} /> Rotate Credentials &amp; Reconnect
                          </button>
                        ) : null
                      )}
                      {(
                        riskAction?.type === "ticket" && riskAction.status === "running" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "10px", color: "#f59e0b" }}>
                            <RefreshCw style={{ width: 11, height: 11, animation: "spin 1s linear infinite" }} />
                            Creating Linear ticket…
                          </div>
                        ) : riskAction?.type === "ticket" && riskAction.status === "done" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "10px", color: "#22c55e" }}>
                            <CheckCircle2 style={{ width: 11, height: 11 }} />
                            {riskAction.ticketUrl ? (
                              <>Ticket <a href={riskAction.ticketUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#22c55e", fontWeight: 700 }}>{riskAction.ticketId}</a> created in Linear.</>
                            ) : (
                              <>Ticket <strong>{riskAction.ticketId}</strong> created — index migration queued.</>
                            )}
                          </div>
                        ) : (
                          <button onClick={() => handleTicket(risk.id, risk)} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 700, padding: "5px 12px", borderRadius: "6px", background: "#f59e0b20", border: "1px solid #f59e0b40", color: "#f59e0b", cursor: "pointer" }}>
                            <Ticket style={{ width: 10, height: 10 }} /> Create Linear Ticket
                          </button>
                        )
                      )}
                      <a href="/command" style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 600, padding: "5px 12px", borderRadius: "6px", background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT, cursor: "pointer", textDecoration: "none" }}>
                        <ExternalLink style={{ width: 10, height: 10 }} /> Escalate to Command
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ── Module: Opportunity Register ──────────────────────────────────────────────

function OpportunityModule() {
  const live = useLive();
  const opps = (live?.oppRegister ?? OPP_REGISTER) as typeof OPP_REGISTER;
  const { store, patch } = useActionStore();
  const { toasts, show, dismiss } = useToasts();
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [snoozeInput, setSnoozeInput] = useState<{ reason: string; duration: string }>({ reason: "", duration: "7d" });
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleAccept(oppId: string, title: string) {
    patch({ oppDecisions: { [oppId]: { decision: "accept", at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`"${title}" accepted — added to sprint backlog.`, "success");
  }

  function handleRejectSubmit(oppId: string, title: string) {
    if (!rejectReason.trim()) return;
    patch({ oppDecisions: { [oppId]: { decision: "reject", reason: rejectReason.trim(), at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`"${title}" rejected.`, "info");
    setRejectTarget(null);
    setRejectReason("");
  }

  function handleSnoozeSubmit(oppId: string, title: string) {
    patch({ oppDecisions: { [oppId]: { decision: "snooze", reason: snoozeInput.reason, snoozeUntil: snoozeInput.duration, at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`"${title}" snoozed for ${snoozeInput.duration}${snoozeInput.reason ? ` — ${snoozeInput.reason}` : ""}.`, "info");
    setSnoozeTarget(null);
    setSnoozeInput({ reason: "", duration: "7d" });
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {opps.map((opp, i) => {
          const color = opp.level === "high" ? "#22c55e" : "#0ea5e9";
          const decision = store.oppDecisions[opp.id];
          const isSnoozing = snoozeTarget === opp.id;
          const isRejecting = rejectTarget === opp.id;

          return (
            <div key={opp.id} style={{ borderBottom: i < opps.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: `3px solid ${color}50`, opacity: decision?.decision === "reject" ? 0.5 : 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start", padding: "0.875rem 0.875rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{opp.title}</span>
                    {DOMAINS[opp.domain as DomainId] && <DomainTag domain={opp.domain as DomainId} />}
                    {decision && (
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", background: decision.decision === "accept" ? "#22c55e20" : decision.decision === "reject" ? "#ef444420" : "#f59e0b20", color: decision.decision === "accept" ? "#22c55e" : decision.decision === "reject" ? "#ef4444" : "#f59e0b" }}>
                        {decision.decision === "accept" ? "Accepted" : decision.decision === "reject" ? "Rejected" : `Snoozed ${decision.snoozeUntil}`}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem" }}>{opp.action}</div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)", marginBottom: decision ? 0 : "0.625rem" }}>Owner: {opp.owner} · P: {Math.round(opp.probability * 100)}%</div>

                  {/* Action row */}
                  {!decision && !isSnoozing && !isRejecting && (
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                      <button onClick={() => handleAccept(opp.id, opp.title)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px", background: "#22c55e20", border: "1px solid #22c55e40", color: "#22c55e", cursor: "pointer" }}>
                        <CheckCheck style={{ width: 9, height: 9 }} /> Accept
                      </button>
                      <button onClick={() => { setSnoozeTarget(opp.id); setRejectTarget(null); }} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px", background: "#f59e0b10", border: "1px solid #f59e0b30", color: "#f59e0b", cursor: "pointer" }}>
                        <BellOff style={{ width: 9, height: 9 }} /> Snooze
                      </button>
                      <button onClick={() => { setRejectTarget(opp.id); setSnoozeTarget(null); }} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 600, padding: "3px 9px", borderRadius: "4px", background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                        <XCircle style={{ width: 9, height: 9 }} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Snooze form */}
                  {isSnoozing && (
                    <div style={{ marginTop: "0.5rem", padding: "0.625rem", background: "hsla(38,80%,5%,0.5)", border: "1px solid #f59e0b20", borderRadius: "0.5rem", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select value={snoozeInput.duration} onChange={e => setSnoozeInput(p => ({ ...p, duration: e.target.value }))} style={{ fontSize: "10px", background: "hsla(0,0%,100%,0.05)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "2px 6px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                          <option value="3d">3 days</option><option value="7d">7 days</option><option value="14d">14 days</option><option value="30d">30 days</option>
                        </select>
                        <input value={snoozeInput.reason} onChange={e => setSnoozeInput(p => ({ ...p, reason: e.target.value }))} placeholder="Reason (optional)" style={{ flex: 1, fontSize: "10px", background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "2px 6px", color: "rgba(255,255,255,0.7)", outline: "none" }} />
                        <button onClick={() => handleSnoozeSubmit(opp.id, opp.title)} style={{ fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", background: "#f59e0b", border: "none", color: "#000", cursor: "pointer" }}>Snooze</button>
                        <button onClick={() => setSnoozeTarget(null)} style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "4px", background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Reject form */}
                  {isRejecting && (
                    <div style={{ marginTop: "0.5rem", padding: "0.625rem", background: "hsla(0,60%,5%,0.5)", border: "1px solid #ef444420", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" autoFocus style={{ flex: 1, fontSize: "10px", background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "2px 6px", color: "rgba(255,255,255,0.7)", outline: "none" }} />
                      <button onClick={() => handleRejectSubmit(opp.id, opp.title)} disabled={!rejectReason.trim()} style={{ fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", background: rejectReason.trim() ? "#ef4444" : "#ef444450", border: "none", color: "#fff", cursor: rejectReason.trim() ? "pointer" : "default" }}>Reject</button>
                      <button onClick={() => setRejectTarget(null)} style={{ fontSize: "9px", padding: "3px 8px", borderRadius: "4px", background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>Cancel</button>
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color, letterSpacing: "-0.02em" }}>{opp.value}</div>
                  <div style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${color}20`, color, marginTop: "4px", display: "inline-block" }}>{opp.level}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Module: Policy & Compliance ────────────────────────────────────────────────

function PolicyComplianceModule() {
  const live = useLive();
  const policies = (live?.policiesSummary ?? POLICIES_SUMMARY) as typeof POLICIES_SUMMARY;
  const active = policies.filter(p => p.status === "active").length;
  const pending = policies.filter(p => p.status === "pending").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          { label: "Active", value: active, color: "#22c55e" },
          { label: "Pending", value: pending, color: "#f59e0b" },
          { label: "Drafts", value: policies.filter(p => p.status === "draft").length, color: "rgba(255,255,255,0.4)" },
        ].map(s => (
          <div key={s.label} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.625rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {policies.map((policy, i) => {
        const statusColor = policy.status === "active" ? "#22c55e" : policy.status === "pending" ? "#f59e0b" : "rgba(255,255,255,0.3)";
        return (
          <div key={policy.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", borderBottom: i < policies.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", flex: 1 }}>{policy.title}</span>
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {policy.domains.slice(0, 2).map(d => <span key={d} style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: "hsla(0,0%,100%,0.04)", color: "rgba(255,255,255,0.35)" }}>{d}</span>)}
            </div>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{policy.owner}</span>
            <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: `${statusColor}20`, color: statusColor }}>{policy.status}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Module: Value Ledger ───────────────────────────────────────────────────────

function ValueLedgerModule() {
  const live = useLive();
  const ledger = (live?.valueLedger ?? VALUE_LEDGER) as typeof VALUE_LEDGER;
  const atRisk = ledger.filter(v => v.type === "at-risk").reduce((s, v) => s + v.amount, 0);
  const protected_ = ledger.filter(v => v.type === "protected").reduce((s, v) => s + v.amount, 0);
  const created = ledger.filter(v => v.type === "created").reduce((s, v) => s + v.amount, 0);

  function fmt(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    return `$${(n / 1000).toFixed(0)}K`;
  }

  const typeConfig = {
    "at-risk":   { label: "At Risk", color: "#ef4444", bg: "hsla(0,70%,14%,0.5)", icon: TrendingDown },
    "protected": { label: "Protected", color: "#22c55e", bg: "hsla(160,60%,14%,0.5)", icon: Shield },
    "created":   { label: "Created", color: "#a78bfa", bg: "hsla(265,60%,14%,0.5)", icon: TrendingUp },
  } as const;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem", marginBottom: "1.25rem" }}>
        {([["at-risk", atRisk], ["protected", protected_], ["created", created]] as const).map(([type, total]) => {
          const cfg = typeConfig[type];
          const Icon = cfg.icon;
          return (
            <div key={type} style={{ background: cfg.bg, border: `1px solid ${cfg.color}25`, borderRadius: "0.75rem", padding: "1rem", textAlign: "center" }}>
              <Icon style={{ width: 16, height: 16, color: cfg.color, margin: "0 auto 0.375rem" }} />
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: cfg.color, letterSpacing: "-0.04em" }}>{fmt(total)}</div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: cfg.color, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>Value {cfg.label}</div>
            </div>
          );
        })}
      </div>

      {ledger.map((entry, i) => {
        const cfg = typeConfig[entry.type as keyof typeof typeConfig] ?? typeConfig["at-risk"];
        return (
          <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", borderBottom: i < ledger.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>{entry.label}</div>
              {entry.note && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{entry.note}</div>}
            </div>
            {DOMAINS[entry.domain as DomainId] && <DomainTag domain={entry.domain as DomainId} />}
            <span style={{ fontSize: "12px", fontWeight: 700, color: cfg.color, flexShrink: 0 }}>{fmt(entry.amount)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Module: Workflow Performance ───────────────────────────────────────────────

function WorkflowPerformanceModule() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {WORKFLOW_PERF.map((wf) => {
          const compColor = wf.completion >= 85 ? "#22c55e" : wf.completion >= 70 ? "#f59e0b" : "#ef4444";
          return (
            <div key={wf.id} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.75rem", padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", flex: 1 }}>{wf.name}</span>
                <DomainTag domain={wf.domain} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div style={{ flex: 1, height: "6px", background: "hsla(0,0%,100%,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${wf.completion}%`, background: compColor, borderRadius: "3px" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 800, color: compColor, minWidth: "32px", textAlign: "right" }}>{wf.completion}%</span>
              </div>
              <div style={{ display: "flex", gap: "1rem", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                <span>{wf.steps} steps</span>
                <span>avg {wf.avgMin}m</span>
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "flex-start", gap: "4px", fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                <AlertTriangle style={{ width: 9, height: 9, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                <span>{wf.bottleneck}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Module: Agent Trust & Eval ────────────────────────────────────────────────

function AgentTrustModule() {
  const live = useLive();
  const agents = (live?.agentTrust ?? AGENT_TRUST) as typeof AGENT_TRUST;
  const certified = agents.filter(a => a.status === "certified").length;
  const monitored = agents.filter(a => a.status === "monitored").length;
  const probation = agents.filter(a => a.status === "probation").length;

  function statusColor(s: string) {
    if (s === "certified") return "#22c55e";
    if (s === "monitored") return "#f59e0b";
    return "#ef4444";
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          { label: "Certified", value: certified, color: "#22c55e" },
          { label: "Monitored", value: monitored, color: "#f59e0b" },
          { label: "Probation", value: probation, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.625rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {agents.map((agent, i) => {
          const sc = statusColor(agent.status);
          return (
            <div key={agent.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "1rem", alignItems: "center", padding: "0.75rem 0.875rem", borderBottom: i < agents.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{agent.agent}</span>
                  {DOMAINS[agent.domain as DomainId] && <DomainTag domain={agent.domain as DomainId} />}
                </div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{agent.actionsExecuted.toLocaleString()} actions · {agent.humanOverrides} overrides</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: sc }}>{agent.trustScore}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>trust</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{agent.accuracy}%</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>accuracy</div>
              </div>
              <div style={{ width: "60px", height: "4px", background: "hsla(0,0%,100%,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${agent.trustScore}%`, background: sc, borderRadius: "2px" }} />
              </div>
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${sc}20`, color: sc }}>{agent.status}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Module: Decision Log ──────────────────────────────────────────────────────

type LogEntry = {
  key: string;
  at: string;
  category: "Risk" | "Opportunity" | "Recommendation";
  title: string;
  decision: string;
  decisionColor: string;
  reason?: string;
  detail?: string;
  actor: string;
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function DecisionLogModule() {
  const live = useLive();
  const { store } = useActionStore();
  const [filter, setFilter] = useState<"all" | "Risk" | "Opportunity" | "Recommendation">("all");

  const risks = (live?.riskRegister ?? RISK_REGISTER) as typeof RISK_REGISTER;
  const opps = (live?.oppRegister ?? OPP_REGISTER) as typeof OPP_REGISTER;
  const riskTitle = (id: string) => risks.find(r => r.id === id)?.title ?? id;
  const oppTitle = (id: string) => opps.find(o => o.id === id)?.title ?? id;

  const entries: LogEntry[] = [];

  Object.entries(store.riskActions ?? {}).forEach(([id, a]) => {
    if (!a.at) return;
    const decision = a.type === "playbook" ? (a.status === "done" ? "Playbook executed" : "Playbook started") : `Ticket ${a.ticketId ?? "created"}`;
    entries.push({
      key: `risk-${id}-${a.at}`,
      at: a.at,
      category: "Risk",
      title: riskTitle(id),
      decision,
      decisionColor: a.status === "done" ? "#22c55e" : "#f59e0b",
      detail: a.result,
      actor: a.actor ?? "—",
    });
  });

  Object.entries(store.oppDecisions ?? {}).forEach(([id, d]) => {
    if (!d.at) return;
    const label = d.decision === "accept" ? "Accepted" : d.decision === "reject" ? "Rejected" : `Snoozed ${d.snoozeUntil ?? ""}`.trim();
    const color = d.decision === "accept" ? "#22c55e" : d.decision === "reject" ? "#ef4444" : "#f59e0b";
    entries.push({
      key: `opp-${id}-${d.at}`,
      at: d.at,
      category: "Opportunity",
      title: oppTitle(id),
      decision: label,
      decisionColor: color,
      reason: d.reason,
      actor: d.actor ?? "—",
    });
  });

  Object.entries(store.recDecisions ?? {}).forEach(([id, d]) => {
    if (!d.at) return;
    const label = d.decision === "accept" ? "Accepted" : d.decision === "reject" ? "Rejected" : `Snoozed ${d.snoozeUntil ?? ""}`.trim();
    const color = d.decision === "accept" ? "#22c55e" : d.decision === "reject" ? "#ef4444" : "#f59e0b";
    entries.push({
      key: `rec-${id}-${d.at}`,
      at: d.at,
      category: "Recommendation",
      title: `Recommendation ${id}`,
      decision: label,
      decisionColor: color,
      reason: d.reason,
      actor: d.actor ?? "—",
    });
  });

  const sorted = entries
    .filter(e => filter === "all" || e.category === filter)
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const counts = {
    all: entries.length,
    Risk: entries.filter(e => e.category === "Risk").length,
    Opportunity: entries.filter(e => e.category === "Opportunity").length,
    Recommendation: entries.filter(e => e.category === "Recommendation").length,
  };

  const catColor: Record<LogEntry["category"], string> = {
    Risk: "#ef4444",
    Opportunity: "#0ea5e9",
    Recommendation: ACCENT,
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {(["all", "Risk", "Opportunity", "Recommendation"] as const).map(f => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: "10px",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "6px",
                background: active ? `${ACCENT}18` : "transparent",
                border: `1px solid ${active ? ACCENT + "40" : "hsla(0,0%,100%,0.08)"}`,
                color: active ? ACCENT : "rgba(255,255,255,0.45)",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f === "all" ? "All" : f}{" "}
              <span style={{ fontWeight: 800, color: active ? ACCENT : "rgba(255,255,255,0.3)" }}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
          <History style={{ width: 22, height: 22, color: "rgba(255,255,255,0.15)", margin: "0 auto 0.5rem", display: "block" }} />
          No decisions logged yet. Accept, reject, or snooze items in the Risk Register or Opportunities to see them here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sorted.map((e, i) => (
            <div
              key={e.key}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 90px 1fr auto auto",
                gap: "0.875rem",
                alignItems: "center",
                padding: "0.625rem 0.875rem",
                borderBottom: i < sorted.length - 1 ? `1px solid ${BORDER}` : "none",
                borderLeft: `3px solid ${catColor[e.category]}40`,
              }}
            >
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${catColor[e.category]}20`, color: catColor[e.category], textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {e.category}
              </span>
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${e.decisionColor}20`, color: e.decisionColor, textAlign: "center" }}>
                {e.decision}
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.title}
                </div>
                {(e.reason || e.detail) && (
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px", lineHeight: 1.4 }}>
                    {e.reason ? `Reason: ${e.reason}` : e.detail}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 4 }}>
                <UserCheck style={{ width: 10, height: 10 }} /> {e.actor}
              </span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 10, height: 10 }} /> {formatTime(e.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BusinessStatePage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("exec");
  const [executiveMode, setExecutiveMode] = useState(false);
  const [liveData, setLiveData] = useState<LiveBusinessState | null>(null);

  useEffect(() => {
    fetch("/api/command/business-state")
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setLiveData(json.data); })
      .catch(() => {});
  }, []);

  const activeModuleConfig = MODULES.find(m => m.id === activeModule)!;
  const ActiveIcon = activeModuleConfig.icon;

  const breachKPIs = liveData ? liveData.kpiHealth.filter(k => k.status === "breach").length : KPI_HEALTH_DATA.filter(k => k.status === "breach").length;
  const criticalRisks = liveData ? liveData.riskRegister.filter(r => r.level === "critical").length : RISK_REGISTER.filter(r => r.level === "critical").length;

  return (
    <LiveCtx.Provider value={liveData}>
    <div style={{ minHeight: "100vh", background: "#0a0b10", color: "rgba(255,255,255,0.87)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "1.5rem 2rem" }}>

        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
            <Link href="/command-center" style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>SZL Holdings</Link>
            <ChevronRight style={{ width: 10, height: 10, color: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>Business State</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.035em", lineHeight: 1.1, margin: 0 }}>
                Business State
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "0.375rem" }}>
                Enterprise health · Causal intelligence · Actionable command surface
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {breachKPIs > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 10px", borderRadius: "6px", background: "hsla(0,70%,14%,0.5)", border: "1px solid #ef444430" }}>
                  <AlertTriangle style={{ width: 11, height: 11, color: "#ef4444" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#ef4444" }}>{breachKPIs} SLA breach{breachKPIs > 1 ? "es" : ""}</span>
                </div>
              )}
              <button
                onClick={() => setExecutiveMode(!executiveMode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  background: executiveMode ? `${ACCENT}20` : "hsla(0,0%,100%,0.04)",
                  border: `1px solid ${executiveMode ? ACCENT + "40" : "hsla(0,0%,100%,0.08)"}`,
                  color: executiveMode ? ACCENT : "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                <Eye style={{ width: 12, height: 12 }} />
                {executiveMode ? "Executive Mode ON" : "Executive Mode"}
              </button>
            </div>
          </div>
        </div>

        {/* Executive Mode Banner */}
        {executiveMode && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: `${ACCENT}10`, border: `1px solid ${ACCENT}30`, borderRadius: "0.875rem", padding: "0.875rem 1.25rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <Eye style={{ width: 14, height: 14, color: ACCENT, flexShrink: 0 }} />
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
              <strong style={{ color: ACCENT }}>Executive Mode:</strong> Showing high-signal summary view. Causal explanations and sub-details are elevated for boardroom clarity.
            </span>
            <button onClick={() => setExecutiveMode(false)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
              <X style={{ width: 13, height: 13 }} />
            </button>
          </m.div>
        )}

        {/* Module Navigation */}
        <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto", marginBottom: "1.5rem", paddingBottom: "0.25rem" }}>
          {MODULES.map(m => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setActiveModule(m.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: isActive ? `${ACCENT}18` : "hsla(0,0%,100%,0.025)",
                  border: `1px solid ${isActive ? ACCENT + "40" : "hsla(0,0%,100%,0.06)"}`,
                  color: isActive ? ACCENT : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                <Icon style={{ width: 12, height: 12 }} />
                {m.label}
                {m.id === "kpi" && breachKPIs > 0 && <span style={{ fontSize: "9px", fontWeight: 800, color: "#ef4444", background: "hsla(0,70%,14%,0.6)", padding: "1px 5px", borderRadius: "8px" }}>{breachKPIs}</span>}
                {m.id === "risk" && criticalRisks > 0 && <span style={{ fontSize: "9px", fontWeight: 800, color: "#ef4444", background: "hsla(0,70%,14%,0.6)", padding: "1px 5px", borderRadius: "8px" }}>{criticalRisks}</span>}
              </button>
            );
          })}
        </div>

        {/* Active Module Panel */}
        <AnimatePresence mode="wait">
          <m.div
            key={activeModule}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "1rem", overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "7px", background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ActiveIcon style={{ width: 14, height: 14, color: ACCENT }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {activeModuleConfig.label}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "9px", color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  Live
                </span>
              </div>
              <div style={{ padding: "1.25rem 1.5rem" }}>
                {activeModule === "exec" && <ExecutiveOverviewModule executiveMode={executiveMode} />}
                {activeModule === "kpi" && <KPISLOModule />}
                {activeModule === "flow" && <BusinessFlowModule />}
                {activeModule === "risk" && <RiskRegisterModule />}
                {activeModule === "opp" && <OpportunityModule />}
                {activeModule === "policy" && <PolicyComplianceModule />}
                {activeModule === "value" && <ValueLedgerModule />}
                {activeModule === "workflow" && <WorkflowPerformanceModule />}
                {activeModule === "agent" && <AgentTrustModule />}
                {activeModule === "log" && <DecisionLogModule />}
              </div>
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
    </LiveCtx.Provider>
  );
}
