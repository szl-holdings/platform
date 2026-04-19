import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { OpsLayout } from "../components/ops-layout";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Brain, CheckCircle2,
  ChevronRight, Clock, DollarSign, Eye, FileText, GitBranch, Globe, Layers,
  Shield, Star, Target, TrendingDown, TrendingUp, Users, Zap, X, Info,
  CheckCheck, BellOff, XCircle, UserCheck, RefreshCw, Ticket, History,
} from "lucide-react";
import { Link } from "wouter";

// ── Shared Action Store (server-backed, localStorage cache) ──────────────────
//
// Mirrors the SZL Holdings Business State store. Persists to the API server
// at /api/action-store so risk owner assignments and decisions are visible
// to every team member instead of only the local browser. localStorage is a
// cache used for instant first paint while the server load is in flight.

const STORE_KEY = "szl:actionStore";

type RecDecision = { decision: "accept" | "reject" | "snooze"; reason?: string; snoozeUntil?: string; at: string; actor?: string };

interface ActionStore {
  riskOwners: Record<string, string>;
  riskActions: Record<string, { type: string; status: string; result?: string; ticketId?: string; at?: string; actor?: string }>;
  oppDecisions: Record<string, { decision: string; reason?: string; snoozeUntil?: string; at: string; actor?: string }>;
  recDecisions: Record<string, RecDecision>;
}

type ActionStorePatch = Partial<{
  riskOwners: Record<string, string | null>;
  riskActions: Record<string, ActionStore["riskActions"][string] | null>;
  oppDecisions: Record<string, ActionStore["oppDecisions"][string] | null>;
  recDecisions: Record<string, RecDecision | null>;
}>;

const CURRENT_ACTOR = "You (Operator)";

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

function writeCache(s: ActionStore) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
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

function useActionStore() {
  const [store, setStore] = useState<ActionStore>(readCache);

  useEffect(() => {
    let cancelled = false;
    const url = `${BASE}/api/action-store`;
    fetch(url, { credentials: "include" })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (cancelled || !json) return;
        const server = (json.data ?? json) as Partial<ActionStore>;
        const merged = { ...emptyStore(), ...server };
        setStore(merged);
        writeCache(merged);
      })
      .catch(() => { /* keep cached store */ });
    return () => { cancelled = true; };
  }, []);

  const patch = useCallback((partial: ActionStorePatch) => {
    setStore(prev => {
      const next = applyPatchLocal(prev, partial);
      writeCache(next);
      return next;
    });
    fetch(`${BASE}/api/action-store`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    }).catch(() => { /* offline / network — local state retained */ });
  }, []);

  return { store, patch };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastMsg = { id: number; text: string; type: "success" | "info" | "error" };

function ToastContainer({ toasts, onDismiss }: { toasts: ToastMsg[]; onDismiss: (id: number) => void }) {
  return (
    <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.625rem 1rem", borderRadius: "0.625rem", background: t.type === "success" ? "hsla(160,60%,8%,0.95)" : t.type === "error" ? "hsla(0,60%,8%,0.95)" : "hsla(265,30%,8%,0.95)", border: `1px solid ${t.type === "success" ? "#22c55e30" : t.type === "error" ? "#ef444430" : "#8b7ac830"}`, backdropFilter: "blur(8px)", maxWidth: "360px" }}>
          {t.type === "success" ? <CheckCircle2 style={{ width: 13, height: 13, color: "#22c55e", flexShrink: 0 }} /> : t.type === "error" ? <XCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0 }} /> : <Info style={{ width: 13, height: 13, color: "#8b7ac8", flexShrink: 0 }} />}
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", flex: 1, lineHeight: 1.4 }}>{t.text}</span>
          <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}><X style={{ width: 11, height: 11 }} /></button>
        </div>
      ))}
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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG = "var(--color-bg-primary)";
const CARD = "var(--color-surface-base)";
const BORDER = "var(--color-surface-border)";
const ACCENT = "#8b7ac8";
const FG = "var(--color-fg-primary)";
const FG_MUT = "var(--color-fg-muted)";

// ── Domain config ──────────────────────────────────────────────────────────────
const DOMAINS = {
  aegis:   { name: "Aegis",   color: "#6366f1" },
  terra:   { name: "Terra",   color: "#4d7c0f" },
  vessels: { name: "Vessels", color: "#3b82f6" },
  lyte:    { name: "Lyte",    color: "#f59e0b" },
  prism:   { name: "PRISM",   color: "#a855f7" },
  carlota: { name: "Carlota", color: "#c2a55a" },
} as const;
type DomainKey = keyof typeof DOMAINS;

// ── Static data ────────────────────────────────────────────────────────────────

const STATE_BOARD_KPIS = [
  { id: "bs", label: "Business Health", value: 76, unit: "/100", delta: "+3", trend: "up", color: "#22c55e", causal: "SLA compliance improved after Lyte latency patch applied last week" },
  { id: "rv", label: "Value at Risk", value: "$8.4M", unit: "", delta: "−$420K", trend: "down", color: "#ef4444", causal: "Carlota pipeline outage + Lyte SLA penalties contributing" },
  { id: "vp", label: "Value Protected", value: "$1.54M", unit: "", delta: "+12%", trend: "up", color: "#22c55e", causal: "Automated incident response + AI pre-triage operational" },
  { id: "vc", label: "Value Created", value: "$960K", unit: "MTD", delta: "+34%", trend: "up", color: "#a78bfa", causal: "Lyte AI Signal Summarizer adoption surge driving ARR uplift" },
  { id: "kc", label: "KPI Compliance", value: "62.5%", unit: "", delta: "−1 SLA", trend: "down", color: "#f59e0b", causal: "5 of 8 SLAs healthy; 3 breaching across Lyte and Carlota" },
  { id: "aw", label: "Active Agents", value: 6, unit: " agents", delta: "1 on probation", trend: "flat", color: "#0ea5e9", causal: "Carlota Brand Sentiment agent trust score declining; review queued" },
];

const CAUSAL_EVENTS = [
  { id: "e1", time: "14:22", domain: "carlota" as DomainKey, title: "CRM Sync Pipeline Disconnected", description: "Real-time feed expired — 3h42m stale. Exceeds 1hr threshold. Root: credentials rotation missed.", severity: "critical", causedBy: [] as string[], causeOf: ["e4"] },
  { id: "e2", time: "13:18", domain: "lyte" as DomainKey, title: "API P95 Latency Breach (2.4s)", description: "Distress engine full table scan. Missing index on distress_score + borough fields.", severity: "high", causedBy: [] as string[], causeOf: ["e5"] },
  { id: "e3", time: "11:45", domain: "aegis" as DomainKey, title: "Aegis Bundle Size Threshold Warning", description: "Main bundle grew 8.3% this week (1.24MB → 1.34MB). MITRE ATT&CK module loaded eagerly.", severity: "medium", causedBy: [] as string[], causeOf: [] as string[] },
  { id: "e4", time: "10:30", domain: "carlota" as DomainKey, title: "Carlota Client Dashboard Showing Stale Data", description: "UI reflecting 3h+ stale data due to pipeline disconnect (e1). Client satisfaction risk.", severity: "high", causedBy: ["e1"], causeOf: [] as string[] },
  { id: "e5", time: "09:12", domain: "terra" as DomainKey, title: "Terra Distress Engine Slowdown Reported", description: "Users reporting slow load. Root: Lyte infrastructure latency ripple (e2) + own query issue.", severity: "medium", causedBy: ["e2"], causeOf: [] as string[] },
  { id: "e6", time: "08:55", domain: "vessels" as DomainKey, title: "Vessels Fleet Uptime: 99.8% (7th day)", description: "Fleet maintaining excellent uptime. Automated anomaly detection firing correctly.", severity: "none", causedBy: [] as string[], causeOf: [] as string[] },
];

const RECOMMENDATIONS = [
  { id: "r1", rank: 1, title: "Reconnect Carlota Jo CRM Pipeline", domain: "carlota" as DomainKey, impact: "high", effort: "low", why: "3h+ data staleness causing client dashboard corruption. Revenue at risk if sustained >24h.", signals: ["Drift: data freshness critical", "Client satisfaction risk", "Genome: Real-Time Stub"], action: "Rotate Credentials & Reconnect" },
  { id: "r2", rank: 2, title: "Add DB Index — Lyte Distress Engine", domain: "lyte" as DomainKey, impact: "high", effort: "low", why: "P95 at 2.4s vs 2s budget. Full table scan confirmed. Index on distress_score + borough = instant fix.", signals: ["SLA breach", "2.4s P95 vs 2s target", "Usage: 640 weekly rising"], action: "Add Index & Measure" },
  { id: "r3", rank: 3, title: "Code-Split Aegis MITRE ATT&CK Module", domain: "aegis" as DomainKey, impact: "medium", effort: "medium", why: "Bundle 49% over budget. 280KB eager-loaded. Splitting will restore FCP/TTI and relieve memory pressure.", signals: ["Bundle 1.34MB vs 900KB", "MITRE 280KB eager"], action: "Lazy Load Module" },
  { id: "r4", rank: 4, title: "Implement PRISM & Carlota Webhooks", domain: "prism" as DomainKey, impact: "medium", effort: "low", why: "Both apps rated Missing/Stub. Blocks enterprise integrations. Shared webhook-engine lib available.", signals: ["Genome: Webhooks missing/stub", "3 enterprise deals blocked"], action: "Ship Webhooks" },
];

const ACTIONS = [
  { id: "a1", title: "Carlota CRM Credential Rotation", domain: "carlota" as DomainKey, priority: "urgent", status: "pending", owner: "Ops Lead", approver: "CTO", due: "Today 17:00", exposure: "Client churn risk", description: "Expired CRM credentials preventing real-time data sync. Pipeline disconnected 3h42m." },
  { id: "a2", title: "Lyte Distress Engine Index Migration", domain: "lyte" as DomainKey, priority: "high", status: "pending", owner: "Backend Eng", approver: "Eng Lead", due: "Tomorrow 12:00", exposure: "SLA penalty liability", description: "Add compound index on (distress_score, borough) to resolve P95 latency breach." },
  { id: "a3", title: "LP Q1 Report — CFO Sign-off", domain: "terra" as DomainKey, priority: "high", status: "blocked", owner: "CFO", approver: "CEO", due: "Apr 20", exposure: "$180M LP portfolio", description: "Quarterly report blocked pending CFO review. Template complete, data verified.", blockedReason: "CFO review session not yet scheduled" },
  { id: "a4", title: "AI Model Governance Policy Approval", domain: "aegis" as DomainKey, priority: "medium", status: "pending", owner: "CISO", approver: "CEO", due: "Apr 25", exposure: "Compliance requirement", description: "Policy requires CISO then CEO approval. Legal review complete." },
  { id: "a5", title: "Vessels Charter Rate Benchmarks Re-activation", domain: "vessels" as DomainKey, priority: "low", status: "auto-executed", owner: "Product Lead", approver: "Auto", due: "Done", exposure: "Usage recovery", description: "Feature re-activated via automated rollout. Usage monitoring underway." },
];

const HEATMAP_RISKS = [
  { id: "hr1", title: "Carlota CRM Disconnect", domain: "carlota" as DomainKey, domainColor: "#c2a55a", probability: 0.92, impact: 0.85, level: "critical" as const, mitigation: "Rotate credentials, add freshness watchdog", owner: "Ops Lead" },
  { id: "hr2", title: "Lyte API SLA Breach", domain: "lyte" as DomainKey, domainColor: "#f59e0b", probability: 0.72, impact: 0.75, level: "high" as const, mitigation: "Add DB index on distress_score + borough", owner: "Eng Team" },
  { id: "hr3", title: "Aegis Bundle Over-Budget", domain: "aegis" as DomainKey, domainColor: "#6366f1", probability: 0.60, impact: 0.45, level: "high" as const, mitigation: "Lazy-load MITRE ATT&CK module", owner: "Frontend Lead" },
  { id: "hr4", title: "Terra Ownership Graph Decline", domain: "terra" as DomainKey, domainColor: "#4d7c0f", probability: 0.50, impact: 0.40, level: "medium" as const, mitigation: "AI-guided walkthrough + UX review", owner: "Product Lead" },
  { id: "hr5", title: "LP Q1 Report Deadline", domain: "terra" as DomainKey, domainColor: "#4d7c0f", probability: 0.42, impact: 0.80, level: "medium" as const, mitigation: "Fast-track CFO review session this week", owner: "CFO" },
];

const HEATMAP_OPPS = [
  { id: "ho1", title: "Lyte Signal Summarizer Expansion", domain: "lyte" as DomainKey, domainColor: "#f59e0b", probability: 0.85, valueScore: 0.90, level: "high" as const, action: "Expand capacity + org-wide rollout", owner: "Growth Lead" },
  { id: "ho2", title: "Terra Borough Filter Rollout", domain: "terra" as DomainKey, domainColor: "#4d7c0f", probability: 0.82, valueScore: 0.55, level: "high" as const, action: "Prioritize this sprint — low effort", owner: "Eng Team" },
  { id: "ho3", title: "PRISM Webhook Enterprise Unlock", domain: "prism" as DomainKey, domainColor: "#a855f7", probability: 0.70, valueScore: 0.75, level: "high" as const, action: "Ship webhook-engine integration", owner: "Backend Lead" },
  { id: "ho4", title: "Vessels Voyage Economics", domain: "vessels" as DomainKey, domainColor: "#3b82f6", probability: 0.60, valueScore: 0.50, level: "medium" as const, action: "Charter rate benchmark re-activation", owner: "Product Lead" },
];

const CROSS_DOMAIN_IMPACTS = [
  { source: "carlota", target: "lyte", label: "Stale data ops load", type: "risk" as const },
  { source: "lyte", target: "terra", label: "Latency ripple effect", type: "risk" as const },
  { source: "aegis", target: "vessels", label: "Threat intel sharing", type: "positive" as const },
  { source: "prism", target: "terra", label: "Deal compliance checks", type: "positive" as const },
  { source: "lyte", target: "aegis", label: "AI model ops dependency", type: "neutral" as const },
];

// ── Live Data Types & Context ──────────────────────────────────────────────────

type LiveKpiBoard = { id: string; label: string; value: string | number; unit: string; delta: string; trend: "up" | "down" | "flat"; color: string; causal: string };
type LiveCausalEvent = { id: string; time: string; domain: string; title: string; description: string; severity: string; causedBy: string[]; causeOf: string[] };
type LiveRecommendation = { id: string; rank: number; title: string; domain: string; impact: string; effort: string; why: string; signals: string[]; action: string };
type LiveAction = { id: string; title: string; domain: string; priority: string; status: string; owner: string; approver: string; due: string; exposure: string; description: string; blockedReason?: string };
type LiveHeatmapRisk = { id: string; title: string; domain: string; domainColor: string; probability: number; impact: number; level: string; mitigation: string; owner: string };
type LiveHeatmapOpp = { id: string; title: string; domain: string; domainColor: string; probability: number; valueScore: number; level: string; action: string; owner: string };
type LiveCrossDomainImpact = { source: string; target: string; label: string; type: "risk" | "positive" | "neutral" };
type LiveEnterpriseState = {
  stateBoardKpis: LiveKpiBoard[];
  causalEvents: LiveCausalEvent[];
  recommendations: LiveRecommendation[];
  actions: LiveAction[];
  heatmapRisks: LiveHeatmapRisk[];
  heatmapOpps: LiveHeatmapOpp[];
  crossDomainImpacts: LiveCrossDomainImpact[];
  generatedAt: string;
  dataSource: string;
};

const LiveCtx = createContext<LiveEnterpriseState | null>(null);
function useLive() { return useContext(LiveCtx); }

// ── Helper components ──────────────────────────────────────────────────────────

function DomainBadge({ domain }: { domain: string }) {
  const d = DOMAINS[domain as DomainKey];
  if (!d) return null;
  return (
    <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: `${d.color}20`, color: d.color, flexShrink: 0 }}>
      {d.name}
    </span>
  );
}

function SeverityIndicator({ severity }: { severity: string }) {
  const colors: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e", none: "#22c55e" };
  const color = colors[severity] ?? "#6b7280";
  return (
    <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}80`, flexShrink: 0, marginTop: 2 }} />
  );
}

function SmallCard({ children, accentColor }: { children: React.ReactNode; accentColor?: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "0.75rem", padding: "1.125rem", borderTop: accentColor ? `2px solid ${accentColor}70` : undefined }}>
      {children}
    </div>
  );
}

// ── Section: State Board KPIs ──────────────────────────────────────────────────

function StateBoardSection() {
  const live = useLive();
  const kpis = (live?.stateBoardKpis ?? STATE_BOARD_KPIS) as typeof STATE_BOARD_KPIS;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
      {kpis.map(kpi => (
        <div key={kpi.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "0.75rem", padding: "1rem", borderTop: `2px solid ${kpi.color}60` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: FG_MUT }}>{kpi.label}</span>
            {kpi.trend === "up" ? <TrendingUp style={{ width: 11, height: 11, color: "#22c55e" }} /> : kpi.trend === "down" ? <TrendingDown style={{ width: 11, height: 11, color: "#ef4444" }} /> : null}
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: kpi.color, letterSpacing: "-0.04em", lineHeight: 1 }}>
            {kpi.value}<span style={{ fontSize: "12px", fontWeight: 500, color: FG_MUT }}>{kpi.unit}</span>
          </div>
          <div style={{ marginTop: "0.375rem", fontSize: "10px", fontWeight: 600, color: kpi.trend === "up" ? "#22c55e" : kpi.trend === "down" ? "#ef4444" : FG_MUT }}>{kpi.delta}</div>
          <div style={{ marginTop: "0.5rem", padding: "0.375rem 0.5rem", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.375rem", display: "flex", gap: "4px", alignItems: "flex-start" }}>
            <Info style={{ width: 9, height: 9, color: FG_MUT, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: "9px", color: FG_MUT, lineHeight: 1.5 }}>{kpi.causal}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section: Causal Timeline ───────────────────────────────────────────────────

function CausalTimelineSection() {
  const live = useLive();
  const events = (live?.causalEvents ?? CAUSAL_EVENTS) as typeof CAUSAL_EVENTS;
  const [expanded, setExpanded] = useState<string[]>([]);

  return (
    <div style={{ position: "relative", paddingLeft: "1.25rem" }}>
      <div style={{ position: "absolute", left: "4px", top: 0, bottom: 0, width: "1px", background: `${BORDER}` }} />

      {events.map((event, i) => {
        const colors: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e", none: "#22c55e" };
        const color = colors[event.severity] ?? "#6b7280";
        const domain = DOMAINS[event.domain as DomainKey] ?? { name: event.domain, color: "#8b7ac8" };
        const isExp = expanded.includes(event.id);

        return (
          <div key={event.id} style={{ marginBottom: i < events.length - 1 ? "0.875rem" : 0, position: "relative" }}>
            <div style={{ position: "absolute", left: "-1.25rem", top: "4px", width: "9px", height: "9px", borderRadius: "50%", background: color, border: "2px solid #080c14", boxShadow: `0 0 7px ${color}60` }} />

            <div style={{ cursor: "pointer" }} onClick={() => setExpanded(prev => prev.includes(event.id) ? prev.filter(x => x !== event.id) : [...prev, event.id])}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "10px", color: FG_MUT, fontVariantNumeric: "tabular-nums" }}>{event.time}</span>
                <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 5px", borderRadius: "3px", background: `${domain.color}15`, color: domain.color }}>{domain.name}</span>
                {event.causeOf.length > 0 && (
                  <span style={{ fontSize: "9px", color: "#f97316", fontWeight: 600 }}>→ causes downstream</span>
                )}
              </div>
              <div style={{ marginTop: "0.25rem", fontSize: "12px", fontWeight: 600, color: FG }}>
                {event.title}
              </div>
            </div>

            {isExp && (
              <div style={{ marginTop: "0.5rem", padding: "0.625rem 0.75rem", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.5rem" }}>
                <p style={{ fontSize: "11px", color: FG_MUT, lineHeight: 1.6, margin: 0 }}>{event.description}</p>
                {event.causedBy.length > 0 && (
                  <div style={{ marginTop: "0.375rem", fontSize: "10px", color: FG_MUT }}>
                    <ArrowRight style={{ width: 9, height: 9, display: "inline", marginRight: "3px" }} />
                    Caused by: {event.causedBy.join(", ")}
                  </div>
                )}
                {event.causeOf.length > 0 && (
                  <div style={{ marginTop: "0.25rem", fontSize: "10px", color: "#f97316" }}>
                    <ArrowRight style={{ width: 9, height: 9, display: "inline", marginRight: "3px" }} />
                    Downstream effects: {event.causeOf.join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section: Recommendations ───────────────────────────────────────────────────

function RecommendationQueueSection() {
  const live = useLive();
  const recs = (live?.recommendations ?? RECOMMENDATIONS) as typeof RECOMMENDATIONS;
  const [expanded, setExpanded] = useState<string[]>([]);
  const { store, patch } = useActionStore();
  const { toasts, show, dismiss } = useToasts();
  const [snoozeTarget, setSnoozeTarget] = useState<string | null>(null);
  const [snoozeInput, setSnoozeInput] = useState<{ reason: string; duration: string }>({ reason: "", duration: "7d" });
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  function handleAccept(recId: string, title: string) {
    patch({ recDecisions: { [recId]: { decision: "accept", at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`Recommendation accepted — "${title}" queued for execution.`, "success");
  }

  function handleRejectSubmit(recId: string, title: string) {
    if (!rejectReason.trim()) return;
    patch({ recDecisions: { [recId]: { decision: "reject", reason: rejectReason.trim(), at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`Recommendation rejected.`, "info");
    setRejectTarget(null);
    setRejectReason("");
  }

  function handleSnoozeSubmit(recId: string, title: string) {
    patch({ recDecisions: { [recId]: { decision: "snooze", reason: snoozeInput.reason, snoozeUntil: snoozeInput.duration, at: new Date().toISOString(), actor: CURRENT_ACTOR } } });
    show(`Snoozed for ${snoozeInput.duration}${snoozeInput.reason ? ` — ${snoozeInput.reason}` : ""}.`, "info");
    setSnoozeTarget(null);
    setSnoozeInput({ reason: "", duration: "7d" });
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {recs.map((rec, i) => {
          const isExp = expanded.includes(rec.id);
          const impactColor = rec.impact === "high" ? "#22c55e" : "#f59e0b";
          const effortColor = rec.effort === "low" ? "#22c55e" : rec.effort === "medium" ? "#f59e0b" : "#ef4444";
          const decision = store.recDecisions[rec.id] as RecDecision | undefined;
          const isSnoozing = snoozeTarget === rec.id;
          const isRejecting = rejectTarget === rec.id;

          return (
            <div key={rec.id} style={{ borderBottom: i < recs.length - 1 ? `1px solid ${BORDER}` : "none", opacity: decision?.decision === "reject" ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem", cursor: "pointer" }} onClick={() => setExpanded(prev => prev.includes(rec.id) ? prev.filter(x => x !== rec.id) : [...prev, rec.id])}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: decision?.decision === "accept" ? "#22c55e20" : "hsla(0,0%,100%,0.04)", border: `1px solid ${decision?.decision === "accept" ? "#22c55e40" : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: decision?.decision === "accept" ? "#22c55e" : FG_MUT, flexShrink: 0 }}>
                  {decision?.decision === "accept" ? <CheckCheck style={{ width: 10, height: 10 }} /> : rec.rank}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: FG }}>{rec.title}</span>
                    <DomainBadge domain={rec.domain} />
                    {decision && (
                      <span style={{ fontSize: "9px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", background: decision.decision === "accept" ? "#22c55e20" : decision.decision === "reject" ? "#ef444420" : "#f59e0b20", color: decision.decision === "accept" ? "#22c55e" : decision.decision === "reject" ? "#ef4444" : "#f59e0b" }}>
                        {decision.decision === "accept" ? "Accepted" : decision.decision === "reject" ? `Rejected${decision.reason ? ` — ${decision.reason}` : ""}` : `Snoozed ${decision.snoozeUntil}`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "10px" }}>
                    <span style={{ color: impactColor, fontWeight: 600 }}>{rec.impact} impact</span>
                    <span style={{ color: effortColor, fontWeight: 600 }}>{rec.effort} effort</span>
                  </div>
                </div>
                <ChevronRight style={{ width: 12, height: 12, color: FG_MUT, transform: isExp ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
              </div>
              {isExp && (
                <div style={{ padding: "0 0.875rem 0.875rem 3.5rem" }}>
                  <p style={{ fontSize: "11px", color: FG_MUT, lineHeight: 1.6, marginBottom: "0.625rem" }}>
                    <strong style={{ color: FG }}>Why now:</strong> {rec.why}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.75rem" }}>
                    {rec.signals.map((s, si) => (
                      <span key={si} style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "4px", background: "hsla(0,0%,100%,0.03)", border: `1px solid ${BORDER}`, color: FG_MUT }}>{s}</span>
                    ))}
                  </div>

                  {/* Primary action button */}
                  {!decision && !isSnoozing && !isRejecting && (
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <button onClick={(e) => { e.stopPropagation(); handleAccept(rec.id, rec.title); }} style={{ fontSize: "10px", fontWeight: 700, padding: "5px 14px", borderRadius: "6px", background: ACCENT, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <CheckCheck style={{ width: 11, height: 11 }} /> Accept — {rec.action}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setSnoozeTarget(rec.id); setRejectTarget(null); }} style={{ fontSize: "10px", fontWeight: 600, padding: "5px 12px", borderRadius: "6px", background: "#f59e0b10", border: "1px solid #f59e0b30", color: "#f59e0b", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <BellOff style={{ width: 11, height: 11 }} /> Snooze
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setRejectTarget(rec.id); setSnoozeTarget(null); }} style={{ fontSize: "10px", fontWeight: 600, padding: "5px 12px", borderRadius: "6px", background: "transparent", border: `1px solid ${BORDER}`, color: FG_MUT, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
                        <XCircle style={{ width: 11, height: 11 }} /> Reject
                      </button>
                    </div>
                  )}

                  {/* Snooze form */}
                  {isSnoozing && (
                    <div style={{ padding: "0.625rem", background: "hsla(38,80%,5%,0.5)", border: "1px solid #f59e0b20", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <select value={snoozeInput.duration} onChange={e => setSnoozeInput(p => ({ ...p, duration: e.target.value }))} style={{ fontSize: "10px", background: "hsla(0,0%,100%,0.05)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "3px 8px", color: "rgba(255,255,255,0.7)", cursor: "pointer" }}>
                        <option value="3d">3 days</option><option value="7d">7 days</option><option value="14d">14 days</option><option value="30d">30 days</option>
                      </select>
                      <input value={snoozeInput.reason} onChange={e => setSnoozeInput(p => ({ ...p, reason: e.target.value }))} placeholder="Reason required…" autoFocus style={{ flex: 1, minWidth: "140px", fontSize: "10px", background: "hsla(0,0%,100%,0.04)", border: `1px solid ${snoozeInput.reason.trim() ? BORDER : "#f59e0b40"}`, borderRadius: "4px", padding: "3px 8px", color: "rgba(255,255,255,0.7)", outline: "none" }} />
                      <button onClick={() => handleSnoozeSubmit(rec.id, rec.title)} disabled={!snoozeInput.reason.trim()} style={{ fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "5px", background: snoozeInput.reason.trim() ? "#f59e0b" : "#f59e0b50", border: "none", color: "#000", cursor: snoozeInput.reason.trim() ? "pointer" : "default" }}>Snooze</button>
                      <button onClick={() => setSnoozeTarget(null)} style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "5px", background: "transparent", border: `1px solid ${BORDER}`, color: FG_MUT, cursor: "pointer" }}>Cancel</button>
                    </div>
                  )}

                  {/* Reject form */}
                  {isRejecting && (
                    <div style={{ padding: "0.625rem", background: "hsla(0,60%,5%,0.5)", border: "1px solid #ef444420", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" autoFocus style={{ flex: 1, fontSize: "10px", background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, borderRadius: "4px", padding: "3px 8px", color: "rgba(255,255,255,0.7)", outline: "none" }} />
                      <button onClick={() => handleRejectSubmit(rec.id, rec.title)} disabled={!rejectReason.trim()} style={{ fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "5px", background: rejectReason.trim() ? "#ef4444" : "#ef444450", border: "none", color: "#fff", cursor: rejectReason.trim() ? "pointer" : "default" }}>Reject</button>
                      <button onClick={() => setRejectTarget(null)} style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "5px", background: "transparent", border: `1px solid ${BORDER}`, color: FG_MUT, cursor: "pointer" }}>Cancel</button>
                    </div>
                  )}

                  {/* Already decided */}
                  {decision && !isSnoozing && !isRejecting && (
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: FG_MUT }}>
                        {decision.decision === "accept" ? "Accepted and queued." : decision.decision === "reject" ? `Rejected${decision.reason ? `: "${decision.reason}"` : ""}` : `Snoozed for ${decision.snoozeUntil}${decision.reason ? ` — ${decision.reason}` : ""}`}
                      </span>
                      <button onClick={() => patch({ recDecisions: { [rec.id]: null } })} style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "4px", background: "transparent", border: `1px solid ${BORDER}`, color: FG_MUT, cursor: "pointer" }}>Undo</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Section: Action Control Center ────────────────────────────────────────────

const RISK_ID_TO_ACTION_ID: Record<string, string> = {
  r1: "a1",
  r2: "a2",
};

function ActionControlSection() {
  const live = useLive();
  const actionsData = (live?.actions ?? ACTIONS) as typeof ACTIONS;
  const [actionStates, setActionStates] = useState<Record<string, string>>({});
  const { store } = useActionStore();
  const { toasts, show, dismiss } = useToasts();
  const pending = actionsData.filter(a => a.status === "pending").length;

  function handleApprove(id: string) {
    setActionStates(prev => ({ ...prev, [id]: "approved" }));
    show("Action approved and queued for execution.", "success");
  }
  function handleReject(id: string) {
    setActionStates(prev => ({ ...prev, [id]: "rejected" }));
    show("Action rejected.", "info");
  }

  function getEffectiveOwner(action: typeof ACTIONS[number]) {
    const riskId = Object.entries(RISK_ID_TO_ACTION_ID).find(([, aid]) => aid === action.id)?.[0];
    if (riskId && store.riskOwners[riskId]) return { owner: store.riskOwners[riskId], synced: true };
    return { owner: action.owner, synced: false };
  }

  function getSyncedRiskAction(action: typeof ACTIONS[number]) {
    const riskId = Object.entries(RISK_ID_TO_ACTION_ID).find(([, aid]) => aid === action.id)?.[0];
    if (!riskId) return null;
    return store.riskActions[riskId] ?? null;
  }

  const priorityColor = (p: string) => p === "urgent" ? "#ef4444" : p === "high" ? "#f97316" : p === "medium" ? "#f59e0b" : "#6b7280";

  return (
    <div>
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          { label: "Pending", count: pending, color: "#f59e0b" },
          { label: "Blocked", count: actionsData.filter(a => a.status === "blocked").length, color: "#f97316" },
          { label: "Auto-Executed", count: actionsData.filter(a => a.status === "auto-executed").length, color: ACCENT },
        ].map(s => (
          <div key={s.label} style={{ padding: "0.5rem 0.875rem", background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: "0.625rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "9px", color: s.color, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {actionsData.map((action, i) => {
          const overrideState = actionStates[action.id];
          const syncedRiskAction = getSyncedRiskAction(action);
          const effectiveStatus = syncedRiskAction?.status === "done" ? "resolved" : (overrideState ?? action.status);
          const pColor = priorityColor(action.priority);
          const stColors: Record<string, string> = { pending: "#f59e0b", approved: "#22c55e", rejected: "#ef4444", blocked: "#f97316", "auto-executed": ACCENT, resolved: "#22c55e" };
          const stColor = stColors[effectiveStatus] ?? "#6b7280";
          const ownerInfo = getEffectiveOwner(action);

          return (
            <div key={action.id} style={{ padding: "0.875rem 1rem", borderBottom: i < actionsData.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: `3px solid ${pColor}60` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: FG }}>{action.title}</span>
                    <DomainBadge domain={action.domain} />
                    <span style={{ marginLeft: "auto", fontSize: "9px", fontWeight: 700, padding: "1px 7px", borderRadius: "10px", background: `${stColor}18`, color: stColor, border: `1px solid ${stColor}25`, textTransform: "capitalize" }}>{effectiveStatus.replace("-", " ")}</span>
                  </div>
                  <p style={{ fontSize: "11px", color: FG_MUT, lineHeight: 1.5, marginBottom: "0.375rem" }}>{action.description}</p>

                  {/* Synced risk action result */}
                  {syncedRiskAction?.status === "done" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.625rem", background: "hsla(160,60%,5%,0.5)", border: "1px solid #22c55e20", borderRadius: "0.375rem", fontSize: "10px", color: "#22c55e", marginBottom: "0.375rem" }}>
                      <CheckCircle2 style={{ width: 11, height: 11, flexShrink: 0 }} />
                      {syncedRiskAction.type === "playbook"
                        ? `Playbook resolved: ${syncedRiskAction.result}`
                        : `Ticket ${syncedRiskAction.ticketId} created from Business State`}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "1rem", fontSize: "10px", color: FG_MUT, marginBottom: (action.status === "pending" && !overrideState && !syncedRiskAction?.status) ? "0.5rem" : 0, flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                      <UserCheck style={{ width: 9, height: 9 }} />
                      Owner: <span style={{ color: ownerInfo.synced ? "#22c55e" : FG }}>{ownerInfo.owner}</span>
                      {ownerInfo.synced && <span style={{ fontSize: "8px", color: "#22c55e", fontWeight: 600 }}>synced</span>}
                    </span>
                    {action.approver && <span>Approver: <span style={{ color: FG }}>{action.approver}</span></span>}
                    {action.due && <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Clock style={{ width: 9, height: 9 }} /><span style={{ color: action.due.includes("Today") ? "#f59e0b" : FG }}>{action.due}</span></span>}
                    {action.exposure && <span style={{ color: "#f97316" }}>{action.exposure}</span>}
                  </div>
                  {"blockedReason" in action && action.blockedReason && (
                    <div style={{ padding: "0.375rem 0.625rem", background: "hsla(24,80%,8%,0.6)", border: `1px solid #f9731620`, borderRadius: "0.375rem", fontSize: "10px", color: "#f97316", marginBottom: "0.5rem" }}>
                      Blocked: {action.blockedReason}
                    </div>
                  )}
                  {action.status === "pending" && !overrideState && !syncedRiskAction?.status && (
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem" }}>
                      <button onClick={() => handleApprove(action.id)} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, padding: "4px 12px", borderRadius: "6px", background: "#22c55e", border: "none", color: "#fff", cursor: "pointer" }}>
                        <CheckCircle2 style={{ width: 11, height: 11 }} /> Approve
                      </button>
                      <button onClick={() => handleReject(action.id)} style={{ fontSize: "10px", fontWeight: 600, padding: "4px 12px", borderRadius: "6px", background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, color: "#ef4444", cursor: "pointer" }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section: Cross-Domain Impact Map ──────────────────────────────────────────

function CrossDomainImpactMap() {
  const live = useLive();
  const impacts = live?.crossDomainImpacts ?? CROSS_DOMAIN_IMPACTS;
  const domainKeys = Object.keys(DOMAINS) as DomainKey[];

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.5rem 0.75rem", fontSize: "9px", fontWeight: 700, color: FG_MUT, textTransform: "uppercase", letterSpacing: "0.07em" }}>From ↓ / To →</th>
              {domainKeys.map(d => (
                <th key={d} style={{ textAlign: "center", padding: "0.5rem", fontSize: "9px", fontWeight: 700, color: DOMAINS[d].color }}>{DOMAINS[d].name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domainKeys.map((src) => (
              <tr key={src} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td style={{ padding: "0.5rem 0.75rem", fontSize: "10px", fontWeight: 700, color: DOMAINS[src].color, whiteSpace: "nowrap" }}>{DOMAINS[src].name}</td>
                {domainKeys.map(tgt => {
                  if (src === tgt) return <td key={tgt} style={{ textAlign: "center", padding: "0.5rem" }}><span style={{ fontSize: "8px", color: FG_MUT }}>—</span></td>;
                  const impact = impacts.find(x => x.source === src && x.target === tgt);
                  if (!impact) return <td key={tgt} style={{ textAlign: "center", padding: "0.5rem" }} />;
                  const color = impact.type === "risk" ? "#ef4444" : impact.type === "positive" ? "#22c55e" : "#f59e0b";
                  return (
                    <td key={tgt} style={{ textAlign: "center", padding: "0.5rem" }}>
                      <div title={impact.label} style={{ width: "36px", margin: "0 auto", padding: "2px 4px", borderRadius: "4px", background: `${color}15`, border: `1px solid ${color}30`, fontSize: "8px", color, fontWeight: 600, cursor: "default" }}>
                        {impact.type === "risk" ? "risk" : impact.type === "positive" ? "↑" : "~"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        {[
          { color: "#ef4444", label: "Risk / Negative dependency" },
          { color: "#22c55e", label: "Positive / Value flow" },
          { color: "#f59e0b", label: "Neutral / Watch" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "2px", background: color, opacity: 0.8 }} />
            <span style={{ fontSize: "10px", color: FG_MUT }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, color: FG_MUT, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem" }}>Active Impact Chains</div>
        {impacts.map((imp, i) => {
          const srcDomain = DOMAINS[imp.source as DomainKey];
          const tgtDomain = DOMAINS[imp.target as DomainKey];
          return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", fontSize: "11px" }}>
            <span style={{ color: srcDomain?.color ?? "#8b7ac8" }}>{srcDomain?.name ?? imp.source}</span>
            <ArrowRight style={{ width: 10, height: 10, color: imp.type === "risk" ? "#ef4444" : imp.type === "positive" ? "#22c55e" : "#f59e0b" }} />
            <span style={{ color: tgtDomain?.color ?? "#8b7ac8" }}>{tgtDomain?.name ?? imp.target}</span>
            <span style={{ color: FG_MUT }}>{imp.label}</span>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section: Risk / Opportunity Heatmap ──────────────────────────────────────

function riskLevelColor(level: string) {
  switch (level) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#f59e0b";
    default: return "#22c55e";
  }
}

function RiskOpportunityHeatmapSection() {
  const live = useLive();
  const heatRisks = (live?.heatmapRisks ?? HEATMAP_RISKS) as typeof HEATMAP_RISKS;
  const heatOpps = (live?.heatmapOpps ?? HEATMAP_OPPS) as typeof HEATMAP_OPPS;
  const [hovered, setHovered] = useState<string | null>(null);
  const [view, setView] = useState<"both" | "risks" | "opps">("both");
  const [selected, setSelected] = useState<string | null>(null);

  const selectedRisk = heatRisks.find(r => r.id === selected);
  const selectedOpp = heatOpps.find(o => o.id === selected);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: FG_MUT }}>
          Risk / Opportunity Matrix — Probability × Impact
        </div>
        <div className="flex gap-1">
          {(["both", "risks", "opps"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="text-[10px] font-semibold px-3 py-1 rounded-md transition-all"
              style={{
                background: view === v ? `${ACCENT}15` : "transparent",
                border: `1px solid ${view === v ? ACCENT + "35" : BORDER}`,
                color: view === v ? ACCENT : FG_MUT,
                cursor: "pointer",
              }}
            >
              {v === "both" ? "All" : v === "risks" ? "Risks" : "Opportunities"}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap canvas */}
      <div style={{ position: "relative", height: "280px", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.75rem", overflow: "visible", marginBottom: "1rem" }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(v => (
          <div key={v}>
            <div style={{ position: "absolute", left: `${v * 100}%`, top: 0, bottom: 0, width: "1px", background: "hsla(0,0%,100%,0.04)" }} />
            <div style={{ position: "absolute", bottom: `${v * 100}%`, left: 0, right: 0, height: "1px", background: "hsla(0,0%,100%,0.04)" }} />
          </div>
        ))}

        {/* Axis labels */}
        <div style={{ position: "absolute", top: "6px", left: "50%", transform: "translateX(-50%)", fontSize: "9px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Impact →
        </div>
        <div style={{ position: "absolute", bottom: "6px", right: "6px", fontSize: "9px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Probability →
        </div>

        {/* Risk background zones */}
        <div style={{ position: "absolute", right: 0, top: 0, width: "50%", height: "50%", background: "hsla(0,70%,10%,0.25)", borderTopRightRadius: "0.75rem" }} />
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "50%", height: "50%", background: "hsla(160,60%,10%,0.12)", borderBottomLeftRadius: "0.75rem" }} />

        {/* Zone labels */}
        <div style={{ position: "absolute", right: "8px", top: "8px", fontSize: "8px", fontWeight: 700, color: "rgba(239,68,68,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Critical Zone</div>
        <div style={{ position: "absolute", left: "8px", bottom: "8px", fontSize: "8px", fontWeight: 700, color: "rgba(34,197,94,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Safe Zone</div>

        {/* Risk dots */}
        {(view === "both" || view === "risks") && heatRisks.map(risk => {
          const x = risk.probability;
          const y = 1 - risk.impact;
          const color = riskLevelColor(risk.level);
          const isHov = hovered === risk.id;
          const isSel = selected === risk.id;

          return (
            <div
              key={risk.id}
              onMouseEnter={() => setHovered(risk.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(isSel ? null : risk.id)}
              style={{
                position: "absolute",
                left: `${x * 100}%`,
                top: `${y * 100}%`,
                transform: "translate(-50%, -50%)",
                width: isHov || isSel ? "16px" : "11px",
                height: isHov || isSel ? "16px" : "11px",
                borderRadius: "50%",
                background: color,
                boxShadow: `0 0 ${isHov || isSel ? 14 : 6}px ${color}80`,
                border: isSel ? `2px solid #fff` : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                zIndex: isHov || isSel ? 10 : 2,
              }}
            />
          );
        })}

        {/* Opportunity diamonds */}
        {(view === "both" || view === "opps") && heatOpps.map(opp => {
          const x = opp.probability;
          const y = 1 - opp.valueScore;
          const color = opp.level === "high" ? "#22c55e" : "#0ea5e9";
          const isHov = hovered === opp.id;
          const isSel = selected === opp.id;

          return (
            <div
              key={opp.id}
              onMouseEnter={() => setHovered(opp.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(isSel ? null : opp.id)}
              style={{
                position: "absolute",
                left: `${x * 100}%`,
                top: `${Math.max(2, Math.min(95, y * 100))}%`,
                transform: "translate(-50%, -50%) rotate(45deg)",
                width: isHov || isSel ? "14px" : "10px",
                height: isHov || isSel ? "14px" : "10px",
                borderRadius: "2px",
                background: color,
                boxShadow: `0 0 ${isHov || isSel ? 12 : 6}px ${color}80`,
                border: isSel ? `2px solid #fff` : "none",
                cursor: "pointer",
                transition: "all 0.15s ease",
                zIndex: isHov || isSel ? 10 : 2,
              }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>Critical risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>High risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>Medium risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div style={{ width: 10, height: 10, borderRadius: "2px", background: "#22c55e", transform: "rotate(45deg)" }} />
          <span className="text-[10px]" style={{ color: FG_MUT }}>Opportunity</span>
        </div>
        <div className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>Click a dot to inspect</div>
      </div>

      {/* Selected item detail */}
      {(selectedRisk || selectedOpp) && (
        <div style={{ background: "hsla(0,0%,100%,0.03)", border: `1px solid ${BORDER}`, borderRadius: "0.75rem", padding: "0.875rem", marginBottom: "1rem" }}>
          {selectedRisk && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: riskLevelColor(selectedRisk.level), flexShrink: 0 }} />
                <span className="text-sm font-bold" style={{ color: FG }}>{selectedRisk.title}</span>
                <DomainBadge domain={selectedRisk.domain} />
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: `${riskLevelColor(selectedRisk.level)}20`, color: riskLevelColor(selectedRisk.level) }}>{selectedRisk.level}</span>
              </div>
              <div className="flex gap-6 text-xs mb-2" style={{ color: FG_MUT }}>
                <span>Probability: <strong style={{ color: FG }}>{Math.round(selectedRisk.probability * 100)}%</strong></span>
                <span>Impact: <strong style={{ color: FG }}>{Math.round(selectedRisk.impact * 100)}%</strong></span>
                <span>Owner: <strong style={{ color: FG }}>{selectedRisk.owner}</strong></span>
              </div>
              {selectedRisk.mitigation && (
                <div className="text-[11px]" style={{ color: FG_MUT }}>
                  <span style={{ color: "#22c55e", fontWeight: 600 }}>Mitigation: </span>{selectedRisk.mitigation}
                </div>
              )}
            </div>
          )}
          {selectedOpp && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div style={{ width: 8, height: 8, borderRadius: "2px", background: "#22c55e", transform: "rotate(45deg)", flexShrink: 0 }} />
                <span className="text-sm font-bold" style={{ color: FG }}>{selectedOpp.title}</span>
                <DomainBadge domain={selectedOpp.domain} />
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: "#22c55e20", color: "#22c55e" }}>opportunity</span>
              </div>
              <div className="flex gap-6 text-xs mb-2" style={{ color: FG_MUT }}>
                <span>Probability: <strong style={{ color: FG }}>{Math.round(selectedOpp.probability * 100)}%</strong></span>
                <span>Value Score: <strong style={{ color: FG }}>{Math.round(selectedOpp.valueScore * 100)}%</strong></span>
                <span>Owner: <strong style={{ color: FG }}>{selectedOpp.owner}</strong></span>
              </div>
              {selectedOpp.action && (
                <div className="text-[11px]" style={{ color: FG_MUT }}>
                  <span style={{ color: ACCENT, fontWeight: 600 }}>Action: </span>{selectedOpp.action}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Risk table */}
      {(view === "both" || view === "risks") && (
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: FG_MUT }}>Risks</div>
          {heatRisks.map((risk, i) => (
            <div key={risk.id} className="flex items-center gap-3 py-2 cursor-pointer" style={{ borderBottom: i < heatRisks.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: `3px solid ${riskLevelColor(risk.level)}50`, paddingLeft: "0.75rem" }} onClick={() => setSelected(selected === risk.id ? null : risk.id)}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: riskLevelColor(risk.level), flexShrink: 0 }} />
              <span className="text-xs font-semibold flex-1" style={{ color: FG }}>{risk.title}</span>
              <DomainBadge domain={risk.domain} />
              <span className="text-[10px]" style={{ color: FG_MUT }}>P: {Math.round(risk.probability * 100)}%</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${riskLevelColor(risk.level)}20`, color: riskLevelColor(risk.level) }}>{risk.level}</span>
            </div>
          ))}
        </div>
      )}

      {/* Opportunity table */}
      {(view === "both" || view === "opps") && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: FG_MUT }}>Opportunities</div>
          {heatOpps.map((opp, i) => {
            const oppColor = opp.level === "high" ? "#22c55e" : "#0ea5e9";
            return (
              <div key={opp.id} className="flex items-center gap-3 py-2 cursor-pointer" style={{ borderBottom: i < heatOpps.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: `3px solid ${oppColor}50`, paddingLeft: "0.75rem" }} onClick={() => setSelected(selected === opp.id ? null : opp.id)}>
                <div style={{ width: 7, height: 7, borderRadius: "1px", background: oppColor, transform: "rotate(45deg)", flexShrink: 0 }} />
                <span className="text-xs font-semibold flex-1" style={{ color: FG }}>{opp.title}</span>
                <DomainBadge domain={opp.domain} />
                <span className="text-[10px]" style={{ color: FG_MUT }}>P: {Math.round(opp.probability * 100)}%</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${oppColor}20`, color: oppColor }}>{opp.level}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Section: Value at Risk / Protected widgets ────────────────────────────────

function ValueWidgets() {
  const widgets = [
    { label: "Value at Risk", value: "$8.4M", color: "#ef4444", icon: TrendingDown, breakdown: [
      { label: "Carlota data pipeline", amount: "$380K", domain: "carlota" as DomainKey },
      { label: "Lyte SLA penalties", amount: "$420K", domain: "lyte" as DomainKey },
      { label: "Aegis bundle degradation", amount: "$280K", domain: "aegis" as DomainKey },
    ]},
    { label: "Value Protected", value: "$1.54M", color: "#22c55e", icon: Shield, breakdown: [
      { label: "Automated incident response", amount: "$1.2M", domain: "aegis" as DomainKey },
      { label: "AI deal pre-triage (Terra)", amount: "$340K", domain: "terra" as DomainKey },
    ]},
    { label: "Value Created", value: "$960K", color: ACCENT, icon: TrendingUp, breakdown: [
      { label: "Lyte Signal Summarizer ARR", amount: "$820K", domain: "lyte" as DomainKey },
      { label: "Terra borough filter", amount: "$140K", domain: "terra" as DomainKey },
    ]},
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
      {widgets.map(w => {
        const Icon = w.icon;
        return (
          <div key={w.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: "0.75rem", padding: "1.125rem", borderTop: `2px solid ${w.color}50` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Icon style={{ width: 14, height: 14, color: w.color }} />
              <span style={{ fontSize: "10px", fontWeight: 700, color: FG_MUT, letterSpacing: "0.06em", textTransform: "uppercase" }}>{w.label}</span>
            </div>
            <div style={{ fontSize: "1.625rem", fontWeight: 900, color: w.color, letterSpacing: "-0.04em", marginBottom: "0.75rem" }}>{w.value}</div>
            {w.breakdown.map((b, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0", borderBottom: i < w.breakdown.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <DomainBadge domain={b.domain} />
                <span style={{ fontSize: "10px", color: FG_MUT, flex: 1 }}>{b.label}</span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: w.color }}>{b.amount}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Section: Decision Log ─────────────────────────────────────────────────────

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

function formatLogTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function DecisionLogSection() {
  const live = useLive();
  const { store } = useActionStore();
  const [filter, setFilter] = useState<"all" | "Risk" | "Opportunity" | "Recommendation">("all");

  const recs = (live?.recommendations ?? RECOMMENDATIONS) as typeof RECOMMENDATIONS;
  const risks = (live?.heatmapRisks ?? HEATMAP_RISKS) as typeof HEATMAP_RISKS;
  const opps = (live?.heatmapOpps ?? HEATMAP_OPPS) as typeof HEATMAP_OPPS;
  const recTitle = (id: string) => recs.find(r => r.id === id)?.title ?? `Recommendation ${id}`;
  const riskTitle = (id: string) => risks.find(r => r.id === id)?.title ?? `Risk ${id}`;
  const oppTitle = (id: string) => opps.find(o => o.id === id)?.title ?? `Opportunity ${id}`;

  const entries: LogEntry[] = [];

  Object.entries(store.riskActions ?? {}).forEach(([id, a]) => {
    if (!a.at) return;
    const decision = a.type === "playbook"
      ? (a.status === "done" ? "Playbook executed" : "Playbook started")
      : `Ticket ${a.ticketId ?? "created"}`;
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
      title: recTitle(id),
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
                border: `1px solid ${active ? ACCENT + "40" : BORDER}`,
                color: active ? ACCENT : FG_MUT,
                cursor: "pointer",
              }}
            >
              {f === "all" ? "All" : f}{" "}
              <span style={{ fontWeight: 800, color: active ? ACCENT : FG_MUT }}>{counts[f]}</span>
            </button>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: FG_MUT, fontSize: "12px" }}>
          <History style={{ width: 22, height: 22, color: FG_MUT, opacity: 0.4, margin: "0 auto 0.5rem", display: "block" }} />
          No decisions logged yet. Accept, reject, or snooze a recommendation to see it here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sorted.map((e, i) => (
            <div
              key={e.key}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 110px 1fr auto auto",
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
                <div style={{ fontSize: "12px", fontWeight: 600, color: FG, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.title}
                </div>
                {(e.reason || e.detail) && (
                  <div style={{ fontSize: "10px", color: FG_MUT, marginTop: "2px", lineHeight: 1.4 }}>
                    {e.reason ? `Reason: ${e.reason}` : e.detail}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "10px", color: FG_MUT, display: "flex", alignItems: "center", gap: 4 }}>
                <UserCheck style={{ width: 10, height: 10 }} /> {e.actor}
              </span>
              <span style={{ fontSize: "10px", color: FG_MUT, fontVariantNumeric: "tabular-nums", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock style={{ width: 10, height: 10 }} /> {formatLogTime(e.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: "board", label: "State Board", icon: Star },
  { id: "timeline", label: "Causal Timeline", icon: GitBranch },
  { id: "recs", label: "Recommendations", icon: Zap },
  { id: "actions", label: "Action Center", icon: Target },
  { id: "heatmap", label: "Risk / Opp Heatmap", icon: Activity },
  { id: "impact", label: "Impact Map", icon: Globe },
  { id: "value", label: "Value Ledger", icon: DollarSign },
  { id: "log", label: "Decision Log", icon: History },
] as const;

type TabId = typeof TABS[number]["id"];

export default function EnterpriseStatePage() {
  const [activeTab, setActiveTab] = useState<TabId>("board");
  const [liveData, setLiveData] = useState<LiveEnterpriseState | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/command/enterprise-state`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.data) setLiveData(json.data); })
      .catch(() => {});
  }, []);

  const pending = liveData ? liveData.actions.filter(a => a.status === "pending").length : ACTIONS.filter(a => a.status === "pending").length;

  return (
    <LiveCtx.Provider value={liveData}>
    <OpsLayout title="Enterprise State">
      <div className="flex flex-col gap-6">
        {/* Header note */}
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: `${ACCENT}08`, border: `1px solid ${ACCENT}25` }}>
          <Eye className="w-4 h-4" style={{ color: ACCENT, flexShrink: 0 }} />
          <div>
            <span className="text-sm font-bold" style={{ color: ACCENT }}>Enterprise State Board</span>
            <span className="text-xs ml-2" style={{ color: "var(--color-fg-muted)" }}>
              Unified business health, causal intelligence, and action command surface across all domains
            </span>
          </div>
          <div className="flex items-center gap-4 ml-auto text-xs" style={{ color: "var(--color-fg-muted)" }}>
            {pending > 0 && (
              <span className="font-bold" style={{ color: "#f59e0b" }}>{pending} pending actions</span>
            )}
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Live
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: isActive ? `${ACCENT}15` : "transparent",
                  border: `1px solid ${isActive ? ACCENT + "35" : "transparent"}`,
                  color: isActive ? ACCENT : "var(--color-fg-muted)",
                }}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                {tab.id === "actions" && pending > 0 && (
                  <span className="text-[9px] font-black" style={{ color: "#f59e0b", background: "hsla(38,80%,14%,0.6)", padding: "1px 5px", borderRadius: "8px" }}>
                    {pending}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active panel */}
        <div className="rounded-xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {activeTab === "board" && (
            <div className="p-5">
              <StateBoardSection />
            </div>
          )}
          {activeTab === "timeline" && (
            <div className="p-5">
              <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "var(--color-fg-muted)" }}>
                Causal Timeline — Events ordered by time with cross-domain causation chains
              </div>
              <CausalTimelineSection />
            </div>
          )}
          {activeTab === "recs" && (
            <div>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER }}>
                <Zap className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>
                  Recommendation Queue — Ranked by impact × urgency × effort
                </span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${ACCENT}15`, color: ACCENT }}>
                  {RECOMMENDATIONS.length} items
                </span>
              </div>
              <RecommendationQueueSection />
            </div>
          )}
          {activeTab === "actions" && (
            <div>
              <div className="px-5 py-3 border-b" style={{ borderColor: BORDER }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>
                  Action Control Center — Approvals, Executions & Blocked Actions
                </span>
              </div>
              <div className="p-5">
                <ActionControlSection />
              </div>
            </div>
          )}
          {activeTab === "heatmap" && (
            <div className="p-5">
              <RiskOpportunityHeatmapSection />
            </div>
          )}
          {activeTab === "impact" && (
            <div className="p-5">
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-fg-muted)" }}>
                Cross-Domain Impact Map — Dependencies, risk flows, and value chains between domains
              </div>
              <CrossDomainImpactMap />
            </div>
          )}
          {activeTab === "value" && (
            <div className="p-5">
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-fg-muted)" }}>
                Value Ledger — At Risk · Protected · Created
              </div>
              <ValueWidgets />
            </div>
          )}
          {activeTab === "log" && (
            <div>
              <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER }}>
                <History className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--color-fg-muted)" }}>
                  Decision Log — Audit trail of accept · reject · snooze actions
                </span>
              </div>
              <div className="p-5">
                <DecisionLogSection />
              </div>
            </div>
          )}
        </div>
      </div>
    </OpsLayout>
    </LiveCtx.Provider>
  );
}
