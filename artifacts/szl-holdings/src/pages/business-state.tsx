import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Brain, CheckCircle2,
  ChevronLeft, ChevronRight, Circle, Clock, DollarSign, Eye, FileText,
  Globe, Layers, Shield, Star, Target, TrendingDown, TrendingUp,
  Users, Zap, X, Play, Check, Info, Briefcase, GitBranch,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { SiteNav } from "@/components/SiteNav";

const ACCENT = "#8b7ac8";
const BG_CARD = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.07)";

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
] as const;

type ModuleId = typeof MODULES[number]["id"];

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
  const [period, setPeriod] = useState<"24h" | "7d">("24h");
  const healthColor = EXEC_HEALTH.score >= 80 ? "#22c55e" : EXEC_HEALTH.score >= 65 ? "#f59e0b" : "#ef4444";

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
            {EXEC_HEALTH.score}
          </div>
          <div style={{ fontSize: "10px", fontWeight: 700, color: healthColor, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "0.5rem" }}>
            {EXEC_HEALTH.score >= 80 ? "Good" : EXEC_HEALTH.score >= 65 ? "Moderate" : "At Risk"}
          </div>
          <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "0.25rem" }}>Business Health</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "0.625rem", fontSize: "12px", fontWeight: 700, color: "#22c55e" }}>
            <TrendingUp style={{ width: 11, height: 11 }} />
            {EXEC_HEALTH.delta}
          </div>
        </div>

        <SectionCard title="Top Issues" icon={AlertTriangle} accent="#ef4444">
          {EXEC_HEALTH.topIssues.map((issue, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: i < 2 ? "0.625rem" : 0 }}>
              <SeverityDot level={issue.severity} />
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4, flex: 1 }}>{issue.title}</span>
              <DomainTag domain={issue.domain} />
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Top Opportunities" icon={TrendingUp} accent="#22c55e">
          {EXEC_HEALTH.topOpps.map((opp, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? "0.625rem" : 0 }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)", lineHeight: 1.4, marginBottom: "2px" }}>{opp.title}</div>
              <div style={{ fontSize: "10px", fontWeight: 700, color: "#22c55e" }}>{opp.value}</div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Blocked Actions" icon={AlertTriangle} accent="#f97316">
          {EXEC_HEALTH.blockedActions.map((action, i) => (
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
          {(period === "24h" ? EXEC_HEALTH.changesYesterday : EXEC_HEALTH.changesLastWeek).map((change, i) => (
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
            {EXEC_HEALTH.exposure}
          </div>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: "0.875rem" }}>Total value at risk this period</div>
          {[
            { label: "Carlota data pipeline", amount: "$380K", color: "#f59e0b" },
            { label: "Lyte SLA penalties", amount: "$420K", color: "#ef4444" },
            { label: "Aegis UX degradation", amount: "$280K", color: "#f97316" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0", borderBottom: i < 2 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", flex: 1 }}>{item.label}</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: item.color }}>{item.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Module: KPI/SLO Health ─────────────────────────────────────────────────────

function KPISLOModule() {
  const [domainFilter, setDomainFilter] = useState<DomainId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "breach" | "healthy">("all");

  const filtered = KPI_HEALTH_DATA.filter(k =>
    (domainFilter === "all" || k.domain === domainFilter) &&
    (statusFilter === "all" || k.status === statusFilter)
  );

  const breachCount = KPI_HEALTH_DATA.filter(k => k.status === "breach").length;

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
          const domain = DOMAINS[kpi.domain];
          const isBreach = kpi.status === "breach";
          return (
            <div key={kpi.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "1rem", alignItems: "center", padding: "0.75rem 0.875rem", background: isBreach ? "hsla(0,70%,5%,0.3)" : "transparent", borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: isBreach ? "2px solid #ef444460" : `2px solid ${domain.color}40`, marginBottom: 0 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{kpi.name}</span>
                  <DomainTag domain={kpi.domain} />
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

function RiskRegisterModule() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {RISK_REGISTER.map((risk, i) => {
        const color = risk.level === "critical" ? "#ef4444" : risk.level === "high" ? "#f97316" : "#f59e0b";
        const isSelected = selectedId === risk.id;
        return (
          <div key={risk.id} style={{ borderBottom: i < RISK_REGISTER.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 0.875rem", cursor: "pointer", borderLeft: `3px solid ${color}60` }}
              onClick={() => setSelectedId(isSelected ? null : risk.id)}
            >
              <SeverityDot level={risk.level} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)", flex: 1 }}>{risk.title}</span>
              <DomainTag domain={risk.domain} />
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>P: {Math.round(risk.probability * 100)}%</span>
              <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${color}20`, color }}>{risk.level}</span>
              {isSelected ? <ChevronLeft style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)", transform: "rotate(90deg)" }} /> : <ChevronRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.3)" }} />}
            </div>
            {isSelected && (
              <div style={{ padding: "0 0.875rem 0.875rem 2rem" }}>
                <div style={{ padding: "0.75rem", background: "hsla(0,0%,100%,0.02)", border: `1px solid ${BORDER}`, borderRadius: "0.5rem" }}>
                  <div style={{ display: "flex", gap: "2rem", marginBottom: "0.5rem" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginBottom: "2px" }}>Owner</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{risk.owner}</div>
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
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{risk.mitigation}</div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Module: Opportunity Register ──────────────────────────────────────────────

function OpportunityModule() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {OPP_REGISTER.map((opp, i) => {
        const color = opp.level === "high" ? "#22c55e" : "#0ea5e9";
        return (
          <div key={opp.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start", padding: "0.875rem 0.875rem", borderBottom: i < OPP_REGISTER.length - 1 ? `1px solid ${BORDER}` : "none", borderLeft: `3px solid ${color}50` }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{opp.title}</span>
                <DomainTag domain={opp.domain} />
              </div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "0.25rem" }}>{opp.action}</div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>Owner: {opp.owner} · P: {Math.round(opp.probability * 100)}%</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color, letterSpacing: "-0.02em" }}>{opp.value}</div>
              <div style={{ fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: `${color}20`, color, marginTop: "4px", display: "inline-block" }}>{opp.level}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Module: Policy & Compliance ────────────────────────────────────────────────

function PolicyComplianceModule() {
  const active = POLICIES_SUMMARY.filter(p => p.status === "active").length;
  const pending = POLICIES_SUMMARY.filter(p => p.status === "pending").length;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          { label: "Active", value: active, color: "#22c55e" },
          { label: "Pending", value: pending, color: "#f59e0b" },
          { label: "Drafts", value: POLICIES_SUMMARY.filter(p => p.status === "draft").length, color: "rgba(255,255,255,0.4)" },
        ].map(s => (
          <div key={s.label} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: "0.625rem", padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {POLICIES_SUMMARY.map((policy, i) => {
        const statusColor = policy.status === "active" ? "#22c55e" : policy.status === "pending" ? "#f59e0b" : "rgba(255,255,255,0.3)";
        return (
          <div key={policy.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.875rem", borderBottom: i < POLICIES_SUMMARY.length - 1 ? `1px solid ${BORDER}` : "none" }}>
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
  const atRisk = VALUE_LEDGER.filter(v => v.type === "at-risk").reduce((s, v) => s + v.amount, 0);
  const protected_ = VALUE_LEDGER.filter(v => v.type === "protected").reduce((s, v) => s + v.amount, 0);
  const created = VALUE_LEDGER.filter(v => v.type === "created").reduce((s, v) => s + v.amount, 0);

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

      {VALUE_LEDGER.map((entry, i) => {
        const cfg = typeConfig[entry.type];
        return (
          <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", borderBottom: i < VALUE_LEDGER.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>{entry.label}</div>
              {entry.note && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{entry.note}</div>}
            </div>
            <DomainTag domain={entry.domain} />
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
  const certified = AGENT_TRUST.filter(a => a.status === "certified").length;
  const monitored = AGENT_TRUST.filter(a => a.status === "monitored").length;
  const probation = AGENT_TRUST.filter(a => a.status === "probation").length;

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
        {AGENT_TRUST.map((agent, i) => {
          const sc = statusColor(agent.status);
          return (
            <div key={agent.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto", gap: "1rem", alignItems: "center", padding: "0.75rem 0.875rem", borderBottom: i < AGENT_TRUST.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{agent.agent}</span>
                  <DomainTag domain={agent.domain} />
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function BusinessStatePage() {
  const [activeModule, setActiveModule] = useState<ModuleId>("exec");
  const [executiveMode, setExecutiveMode] = useState(false);

  const activeModuleConfig = MODULES.find(m => m.id === activeModule)!;
  const ActiveIcon = activeModuleConfig.icon;

  const breachKPIs = KPI_HEALTH_DATA.filter(k => k.status === "breach").length;
  const criticalRisks = RISK_REGISTER.filter(r => r.level === "critical").length;

  return (
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
              </div>
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
