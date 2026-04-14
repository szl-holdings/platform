import { useState, useEffect, useRef } from "react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { DataProvenance, ActionLoop, RoleSelector } from "@szl-holdings/shared-ui";
import type { DataProvenanceInfo } from "@szl-holdings/shared-ui";
import { Link } from "wouter";
import {
  Shield, Server, Brain, AlertTriangle, Activity, Clock,
  ChevronRight, Zap, Target, Eye, Users, Flame,
  TrendingUp, Bell, Crosshair, Network, Radio,
  BarChart3, Bug, FileText, Ticket, CheckCircle, Hexagon,
  GitBranch, Lock, Search, ListChecks, UserCheck, Grid,
} from "lucide-react";
import { PackBanner } from "@/components/pack-banner";

const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  borderMuted: "rgba(255,255,255,0.03)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" },
};

const WORKSPACES = [
  { id: "command" as const, label: "Command", icon: Server, color: "#3b82f6", desc: "Managed Operations" },
  { id: "defense" as const, label: "Defense", icon: Shield, color: "#ef4444", desc: "Security Operations" },
  { id: "labs" as const, label: "Labs", icon: Brain, color: "#8b5cf6", desc: "Intelligence Engine" },
];

type Workspace = "command" | "defense" | "labs";

function AnimatedCounter({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = ref.current;
    const diff = value - start;
    if (Math.abs(diff) < 0.01) return;
    let cancelled = false;
    const startTime = performance.now();
    const step = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(step);
      else ref.current = value;
    };
    requestAnimationFrame(step);
    return () => { cancelled = true; };
  }, [value]);
  return <>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}</>;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-[10px] font-mono tabular-nums" style={{ color: DS.text.muted }}>
      UTC {time.toISOString().slice(11, 19)}
    </span>
  );
}

const CROSS_MODULE_FEED = [
  { time: "2m", module: "defense", severity: "critical", text: "Lateral movement detected on DC-PROD-03 — MITRE T1021.002", icon: Crosshair },
  { time: "5m", module: "command", severity: "high", text: "SLA breach — Northgate ticket #4827 past 4h response target", icon: Ticket },
  { time: "8m", module: "defense", severity: "critical", text: "C2 beacon traffic to known APT29 infrastructure detected", icon: Radio },
  { time: "12m", module: "labs", severity: "high", text: "Churn model v3.2 flagged TechCorp — 88% probability, declining usage", icon: TrendingUp },
  { time: "18m", module: "defense", severity: "high", text: "Brute force attempt — 847 failed logins from 103.45.x.x", icon: AlertTriangle },
  { time: "22m", module: "command", severity: "medium", text: "3 managed endpoints entering maintenance window — patch cycle", icon: Server },
  { time: "31m", module: "labs", severity: "medium", text: "Neural explorer detected anomalous pattern in Q1 threat cluster", icon: Brain },
  { time: "45m", module: "defense", severity: "high", text: "Unpatched CVE-2024-3400 on Palo Alto FW-EDGE-01", icon: Bug },
];

const MODULE_COLORS: Record<string, string> = {
  defense: "#ef4444",
  command: "#3b82f6",
  labs: "#8b5cf6",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: DS.text.tertiary,
};

const PRIORITY_WORK = {
  defense: [
    { id: "INC-2847", title: "Lateral Movement — DC-PROD-03", severity: "P1", score: 96, status: "Investigating", assignee: "J. Chen", technique: "T1021.002" },
    { id: "INC-2846", title: "C2 Beacon — APT29 Infrastructure", severity: "P1", score: 91, status: "Assigned", assignee: "S. Park", technique: "T1071.001" },
    { id: "ALT-5821", title: "Data Exfiltration Pattern — S3 Bucket", severity: "P2", score: 84, status: "Queued", assignee: "M. Rodriguez", technique: "T1567.002" },
    { id: "VLN-1204", title: "CVE-2024-3400 — Palo Alto Firewall", severity: "P2", score: 78, status: "Open", assignee: null, technique: "CVE" },
  ],
  command: [
    { id: "TKT-4827", title: "Northgate — Server Migration Delay", severity: "P1", score: 0, status: "SLA Breach", assignee: "K. Wilson", technique: "" },
    { id: "TKT-4831", title: "TechCorp — VPN Tunnel Instability", severity: "P2", score: 0, status: "In Progress", assignee: "R. Davis", technique: "" },
    { id: "TKT-4835", title: "Apex Logistics — Endpoint Deployment", severity: "P3", score: 0, status: "Scheduled", assignee: "A. Thompson", technique: "" },
  ],
  labs: [
    { id: "EXP-047", title: "Threat Cluster Correlation — Q1 APT", severity: "Active", score: 0, status: "Running", assignee: "Neural Explorer", technique: "" },
    { id: "MDL-v3.2", title: "Churn Prediction Model — Validation", severity: "Review", score: 0, status: "Awaiting Review", assignee: "Data Team", technique: "" },
    { id: "AGT-012", title: "Agent Workflow — Compliance Scan", severity: "Active", score: 0, status: "Executing", assignee: "Quipu Agent", technique: "" },
  ],
};

const CROSS_CORRELATIONS = [
  {
    title: "Incident INC-2847 impacts managed client Northgate",
    modules: ["defense", "command"],
    detail: "Lateral movement on DC-PROD-03 is a managed Northgate asset. Service impact: server migration ticket #4827 may be compromised.",
  },
  {
    title: "Labs intelligence feeding Defense containment",
    modules: ["labs", "defense"],
    detail: "Neural explorer pattern analysis identified the APT29 C2 beacon 8 minutes before SIEM alert — accelerating response by estimated 12 minutes.",
  },
  {
    title: "Compliance gap correlates with active vulnerability",
    modules: ["defense", "command"],
    detail: "CVE-2024-3400 on FW-EDGE-01 is a managed asset under Apex Logistics SLA. Unpatched state violates NIST 800-53 SI-2.",
  },
];

/* MITRE ATT&CK heat map — simplified tactic/technique grid */
const MITRE_TACTICS = [
  { id: "TA0001", label: "Recon", color: "#f59e0b", hits: 1 },
  { id: "TA0002", label: "Resource Dev", color: "#f59e0b", hits: 0 },
  { id: "TA0003", label: "Initial Access", color: "#f97316", hits: 2 },
  { id: "TA0004", label: "Execution", color: "#ef4444", hits: 3 },
  { id: "TA0005", label: "Persistence", color: "#ef4444", hits: 2 },
  { id: "TA0006", label: "Priv Esc", color: "#f97316", hits: 1 },
  { id: "TA0007", label: "Defense Ev", color: "#f97316", hits: 2 },
  { id: "TA0008", label: "Cred Access", color: "#ef4444", hits: 3 },
  { id: "TA0009", label: "Discovery", color: "#f59e0b", hits: 1 },
  { id: "TA0010", label: "Lateral Mv", color: "#ef4444", hits: 4 },
  { id: "TA0011", label: "Collection", color: "#f97316", hits: 2 },
  { id: "TA0040", label: "Impact", color: "#f59e0b", hits: 1 },
  { id: "TA0042", label: "C2", color: "#ef4444", hits: 3 },
  { id: "TA0010b", label: "Exfiltration", color: "#f97316", hits: 2 },
];

function MitreHeatMap() {
  const maxHits = Math.max(...MITRE_TACTICS.map(t => t.hits));
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, #ef4444, #f97316, #f59e0b, transparent)" }} />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.borderMuted }}>
        <Grid className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(239,68,68,0.7)" }}>MITRE ATT&CK Tactic Heat Map</span>
        <span className="text-[9px] font-mono ml-auto" style={{ color: DS.text.muted }}>Active detections · rolling 24h</span>
      </div>
      <div className="p-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {MITRE_TACTICS.map(t => {
            const intensity = maxHits > 0 ? t.hits / maxHits : 0;
            const bg = t.hits === 0 ? "rgba(255,255,255,0.02)" : `${t.color}${Math.round(intensity * 30 + 10).toString(16).padStart(2, "0")}`;
            const border = t.hits > 0 ? `${t.color}30` : DS.borderMuted;
            return (
              <div key={t.id} className="relative rounded p-1.5 text-center transition-all hover:scale-105 cursor-pointer" style={{ background: bg, border: `1px solid ${border}` }} title={`${t.label}: ${t.hits} detection${t.hits !== 1 ? "s" : ""}`}>
                <div className="text-[7px] font-mono" style={{ color: t.hits > 0 ? t.color : DS.text.muted, marginBottom: 1 }}>{t.label}</div>
                {t.hits > 0 ? (
                  <div className="text-[11px] font-bold tabular-nums" style={{ color: t.color }}>{t.hits}</div>
                ) : (
                  <div className="text-[9px]" style={{ color: DS.text.muted }}>—</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-2.5">
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} className="flex items-center gap-1">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: n === 0 ? "rgba(255,255,255,0.02)" : `rgba(239,68,68,${n * 0.18 + 0.07})`, border: `1px solid ${n === 0 ? DS.borderMuted : "rgba(239,68,68,0.2)"}` }} />
              <span className="text-[7px] font-mono" style={{ color: DS.text.muted }}>{n === 0 ? "None" : n}</span>
            </div>
          ))}
          <span className="text-[7px] font-mono ml-auto" style={{ color: DS.text.muted }}>hits per tactic</span>
        </div>
      </div>
    </div>
  );
}

/* Threat timeline with severity lanes */
function ThreatTimeline({ feed }: { feed: typeof CROSS_MODULE_FEED }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
      <div style={{ height: 2, background: "linear-gradient(90deg, #ef4444, transparent)" }} />
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.borderMuted }}>
        <Activity className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.secondary }}>Threat Timeline</span>
        <div className="flex items-center gap-2 ml-auto">
          {["critical", "high", "medium"].map(sev => (
            <div key={sev} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SEVERITY_COLORS[sev] }} />
              <span className="text-[7px] font-mono capitalize" style={{ color: DS.text.muted }}>{sev}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-2">
        {/* Severity lanes */}
        <div className="space-y-1 mb-3">
          {(["critical", "high", "medium"] as const).map(sev => {
            const items = feed.filter(f => f.severity === sev);
            return (
              <div key={sev} className="flex items-center gap-2">
                <span className="text-[7px] font-mono uppercase w-12 shrink-0 text-right" style={{ color: SEVERITY_COLORS[sev] }}>{sev}</span>
                <div className="flex-1 h-5 rounded" style={{ background: `${SEVERITY_COLORS[sev]}08`, border: `1px solid ${SEVERITY_COLORS[sev]}15`, position: "relative", overflow: "hidden" }}>
                  {items.map((item, idx) => {
                    const timeNum = parseFloat(item.time.replace("m", "")) / 60;
                    const left = Math.min(timeNum * 100, 95);
                    return (
                      <div key={idx} title={item.text} className="absolute top-0 bottom-0 w-1 rounded-sm cursor-pointer hover:opacity-80 transition-opacity" style={{ left: `${left}%`, background: SEVERITY_COLORS[sev], opacity: 0.8 }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[7px] font-mono" style={{ color: DS.text.muted }}>
          <span>Now</span><span>15m</span><span>30m</span><span>45m</span><span>60m+</span>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
        {feed.slice(0, 5).map((sig, i) => {
          const Icon = sig.icon;
          return (
            <div key={i} className="flex gap-3 px-4 py-2 hover:bg-white/[0.015] transition-colors">
              <div className="flex items-start shrink-0 pt-0.5 gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full mt-0.5 shrink-0" style={{ background: SEVERITY_COLORS[sig.severity], boxShadow: sig.severity === "critical" ? `0 0 6px ${SEVERITY_COLORS[sig.severity]}50` : "none" }} />
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: `${MODULE_COLORS[sig.module]}10`, border: `1px solid ${MODULE_COLORS[sig.module]}20` }}>
                  <Icon className="w-2.5 h-2.5" style={{ color: MODULE_COLORS[sig.module] }} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium leading-snug" style={{ color: DS.text.primary }}>{sig.text}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>{sig.time} ago</span>
                  <span className="text-[7px] px-1 py-0.5 rounded uppercase font-semibold" style={{ color: SEVERITY_COLORS[sig.severity], background: `${SEVERITY_COLORS[sig.severity]}10` }}>{sig.severity}</span>
                  <span className="text-[7px] px-1 py-0.5 rounded capitalize" style={{ color: MODULE_COLORS[sig.module], background: `${MODULE_COLORS[sig.module]}08` }}>{sig.module}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const INVESTIGATION_STEPS = [
  { id: "detection", label: "Threat Detected & Triaged", icon: AlertTriangle, color: "#ef4444", status: "complete" as const, detail: "SIEM alert fired at 14:22 UTC. Labs neural explorer pre-detected pattern 8min prior. Confidence: 96/100." },
  { id: "context", label: "Context Enriched", icon: Search, color: "#f97316", status: "complete" as const, detail: "APT29 TTP overlap confirmed. Asset DC-PROD-03 maps to managed client Northgate. Correlated with INC-2846 (C2 beacon)." },
  { id: "containment", label: "Containment Pending HITL Approval", icon: Lock, color: "#3b82f6", status: "active" as const, detail: "Recommended action: isolate DC-PROD-03 via EDR. Playbook PB-22 ready. Requires analyst approval before execution." },
  { id: "response", label: "Policy & Response Routing", icon: GitBranch, color: "#10b981", status: "pending" as const, detail: "Post-approval: trigger SOAR playbook PB-22, update case INC-2847, notify Northgate CISO." },
  { id: "audit", label: "Audit Log", icon: Lock, color: DS.text.tertiary, status: "pending" as const, detail: "All actions immutably logged with analyst ID, timestamp, and policy version. SIEM integration active." },
];

function GuidedInvestigationWorkflow() {
  const [expanded, setExpanded] = useState<string | null>("containment");
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: DS.borderMuted, background: "rgba(255,255,255,0.02)" }}>
        <ListChecks className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.secondary }}>Guided Investigation — INC-2847</span>
        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ color: "rgba(245,158,11,0.6)", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>Demo Scenario</span>
        <span className="ml-auto text-[8px] px-2 py-0.5 rounded font-mono uppercase font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>P1 · Awaiting HITL</span>
      </div>
      <div className="p-4">
        <div className="space-y-0">
          {INVESTIGATION_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isExpanded = expanded === step.id;
            const isActive = step.status === "active";
            const isComplete = step.status === "complete";
            return (
              <div key={step.id} className="relative">
                {i < INVESTIGATION_STEPS.length - 1 && (
                  <div className="absolute left-[13px] top-8 w-[1px] h-full" style={{ background: isComplete ? `${step.color}30` : "rgba(255,255,255,0.05)" }} />
                )}
                <button onClick={() => setExpanded(isExpanded ? null : step.id)} className="w-full flex items-start gap-3 py-2.5 px-1 rounded-lg transition-all hover:bg-white/[0.02] text-left">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: isComplete ? `${step.color}20` : isActive ? `${step.color}12` : "rgba(255,255,255,0.04)", border: `1px solid ${isComplete ? `${step.color}35` : isActive ? `${step.color}25` : "rgba(255,255,255,0.06)"}` }}>
                    {isComplete ? <CheckCircle className="w-3 h-3" style={{ color: step.color }} /> : isActive ? <Icon className="w-3 h-3 animate-pulse" style={{ color: step.color }} /> : <Icon className="w-3 h-3" style={{ color: "rgba(255,255,255,0.2)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium" style={{ color: isComplete ? "rgba(255,255,255,0.7)" : isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)" }}>{step.label}</span>
                      {isActive && <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase font-semibold animate-pulse" style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}20` }}>Active</span>}
                      {isComplete && <span className="text-[8px] px-1.5 py-0.5 rounded-full uppercase font-semibold" style={{ background: `${step.color}10`, color: `${step.color}80` }}>Done</span>}
                    </div>
                    {isExpanded && <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{step.detail}</p>}
                  </div>
                  <ChevronRight className={cn("w-3 h-3 shrink-0 mt-0.5 transition-transform", isExpanded && "rotate-90")} style={{ color: "rgba(255,255,255,0.15)" }} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AegisUnifiedOverview() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | "all">("all");
  const [activeRole, setActiveRole] = useState("operator");

  const filteredFeed = activeWorkspace === "all"
    ? CROSS_MODULE_FEED
    : CROSS_MODULE_FEED.filter(f => f.module === activeWorkspace);

  const criticalCount = filteredFeed.filter(f => f.severity === "critical").length;
  const highCount = filteredFeed.filter(f => f.severity === "high").length;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-lg font-bold text-white tracking-tight font-display">Unified Operator Overview</h1>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <span className="text-[9px] font-mono" style={{ color: "rgba(239,68,68,0.7)" }}>2 active incidents</span>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.tertiary }}>One platform · Three workspaces · Shared intelligence layer</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
        </div>
      </div>

      {/* Role + Provenance row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <RoleSelector
          currentRole={activeRole}
          onRoleChange={setActiveRole}
          roles={[
            { id: "executive", label: "Executive", description: "Strategic risk overview, portfolio impact" },
            { id: "operator", label: "SOC Operator", description: "Active incidents, SLA tracking, triage queue" },
            { id: "analyst", label: "Analyst", description: "Threat hunting, IOC investigation, forensics" },
            { id: "admin", label: "Admin", description: "System health, configuration, audit" },
            { id: "buyer", label: "Buyer / Demo", description: "Product capabilities overview" },
          ]}
        />
        <DataProvenance compact provenance={{ source: "Aegis SOC Engine", lastUpdated: new Date().toISOString(), freshness: "realtime", confidence: "high", dataState: "demo", owner: "Defense Operations" } as DataProvenanceInfo} />
      </div>

      {/* Role context bars */}
      {activeRole === "executive" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(239,68,68,0.5)" }}>Executive Briefing</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>2 active P1 incidents requiring executive awareness. Defense posture at 78/100 — elevated due to APT29 activity and unpatched firewall CVE. Command SLA breach on Northgate migration. MTTD trending down 18% this week — improvement driven by Labs neural explorer pre-detection.</div>
        </div>
      )}
      {activeRole === "analyst" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.04)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(139,92,246,0.5)" }}>Threat Hunting Focus</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>Active APT29 indicators detected across 2 incidents. Labs neural explorer identified C2 beacon 8 minutes before SIEM — prioritize IOC correlation on T1071.001 and T1021.002 MITRE techniques. 142 IOC feeds tracked. Unpatched CVE-2024-3400 on edge firewall creates additional attack surface.</div>
        </div>
      )}
      {activeRole === "buyer" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.04)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(59,130,246,0.5)" }}>Product Demo View</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>You're viewing Aegis — SZL's unified defense and intelligence platform. Three workspaces (Command, Defense, Labs) share a single intelligence layer with cross-module correlation. Every signal, incident, and SLA metric demonstrates the kind of operational visibility Aegis provides.</div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: DS.border, background: DS.surface }}>
        <div style={{ height: 2, background: "linear-gradient(90deg, #ef4444, #f97316, #3b82f6, transparent)" }} />
        <div className="grid grid-cols-3 md:grid-cols-6">
          {[
            { label: "Open Incidents", value: "7", color: "#ef4444", pulse: true },
            { label: "Critical Alerts", value: "8", color: "#f97316" },
            { label: "SLA Risks", value: "3", color: "#f59e0b" },
            { label: "Managed Endpoints", value: "2.4K", color: "#3b82f6" },
            { label: "Active Investigations", value: "4", color: "#8b5cf6" },
            { label: "MTTD", value: "4.2m", color: "#10b981", sub: "↓ 18% this week" },
          ].map((c, i) => (
            <div key={c.label} className="px-3 py-3 text-center" style={{ borderLeft: i > 0 ? `1px solid ${DS.borderMuted}` : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-base font-bold font-mono tabular-nums" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[8px] font-medium uppercase tracking-wider" style={{ color: DS.text.muted }}>{c.label}</div>
              {c.sub && <div className="text-[7px] mt-0.5" style={{ color: "#10b981" }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Workspace filter */}
      <div className="flex gap-2">
        <button onClick={() => setActiveWorkspace("all")} className={cn("px-3 py-2 rounded-lg text-[11px] font-semibold transition-all border", activeWorkspace === "all" ? "bg-white/10 text-white border-white/20" : "text-white/30 hover:text-white/60 border-transparent hover:border-white/10")}>
          All Workspaces
        </button>
        {WORKSPACES.map((ws) => (
          <button key={ws.id} onClick={() => setActiveWorkspace(ws.id)} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all border")} style={{ color: activeWorkspace === ws.id ? ws.color : `${ws.color}50`, background: activeWorkspace === ws.id ? `${ws.color}15` : "transparent", borderColor: activeWorkspace === ws.id ? `${ws.color}30` : "transparent" }}>
            <ws.icon className="w-3 h-3" />
            {ws.label}
          </button>
        ))}
      </div>

      {/* MITRE ATT&CK Heat Map — new addition */}
      <MitreHeatMap />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">

          {/* Threat Timeline — new addition */}
          <ThreatTimeline feed={filteredFeed} />

          {/* Priority Work */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.secondary }}>Priority Work — {activeWorkspace === "all" ? "All Modules" : WORKSPACES.find(w => w.id === activeWorkspace)?.label}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>{criticalCount} critical</span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ color: "#f97316", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}>{highCount} high</span>
              </div>
            </div>

            {(activeWorkspace === "all" ? (["defense", "command", "labs"] as Workspace[]) : [activeWorkspace]).map((ws) => {
              const items = PRIORITY_WORK[ws];
              const wsConf = WORKSPACES.find(w => w.id === ws)!;
              return (
                <div key={ws} className="rounded-xl border overflow-hidden" style={{ borderColor: `${wsConf.color}15`, background: DS.surface }}>
                  <div style={{ height: 2, background: `linear-gradient(90deg, ${wsConf.color}60, transparent)` }} />
                  <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${wsConf.color}10`, background: `${wsConf.color}05` }}>
                    <wsConf.icon className="w-3 h-3" style={{ color: wsConf.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: wsConf.color }}>{wsConf.label}</span>
                    <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>({items.length})</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
                    {items.map((item) => (
                      <div key={item.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="shrink-0">
                          <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{item.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium truncate" style={{ color: "rgba(255,255,255,0.8)" }}>{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.assignee ? <span className="text-[9px]" style={{ color: DS.text.tertiary }}>{item.assignee}</span> : <span className="text-[9px] text-red-400/60">Unassigned</span>}
                            {item.technique && <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ color: DS.text.tertiary, background: "rgba(255,255,255,0.04)" }}>{item.technique}</span>}
                          </div>
                        </div>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase", item.severity === "P1" ? "text-red-400 bg-red-500/10" : item.severity === "P2" ? "text-orange-400 bg-orange-500/10" : item.severity === "P3" ? "text-amber-400 bg-amber-500/10" : "text-violet-400 bg-violet-500/10")}>{item.severity}</span>
                        {item.score > 0 && <span className="text-sm font-bold font-mono" style={{ color: item.score >= 90 ? "#ef4444" : "#f97316" }}>{item.score}</span>}
                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded", item.status === "Investigating" || item.status === "In Progress" || item.status === "Running" || item.status === "Executing" ? "text-blue-400 bg-blue-500/10" : item.status === "SLA Breach" ? "text-red-400 bg-red-500/10" : item.status === "Awaiting Review" ? "text-amber-400 bg-amber-500/10" : "text-white/30 bg-white/5")}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <GuidedInvestigationWorkflow />
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {WORKSPACES.map((ws) => {
              const href = ws.id === "defense" ? "/soc" : ws.id === "command" ? "/ops/dashboard" : "/intel/dashboard";
              return (
                <Link key={ws.id} href={href} className="group rounded-xl border p-3 transition-all hover:scale-[1.01] cursor-pointer" style={{ borderColor: `${ws.color}15`, background: `linear-gradient(135deg, ${ws.color}06, transparent)` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ws.color}12`, border: `1px solid ${ws.color}20` }}>
                      <ws.icon className="w-4 h-4" style={{ color: ws.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white">{ws.label}</div>
                      <div className="text-[9px]" style={{ color: DS.text.tertiary }}>{ws.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: ws.color }} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Cross-Module Correlations */}
          <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8b5cf6" }}>Cross-Module Correlations</span>
            </div>
            {CROSS_CORRELATIONS.map((corr, i) => (
              <div key={i} className="py-2.5" style={{ borderTop: i > 0 ? `1px solid ${DS.borderMuted}` : "none" }}>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.8)" }}>{corr.title}</p>
                <div className="flex gap-1 mb-1.5">
                  {corr.modules.map(m => (
                    <span key={m} className="text-[8px] px-1.5 py-0.5 rounded capitalize font-medium" style={{ color: MODULE_COLORS[m], background: `${MODULE_COLORS[m]}10`, border: `1px solid ${MODULE_COLORS[m]}15` }}>{m}</span>
                  ))}
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: DS.text.tertiary }}>{corr.detail}</p>
              </div>
            ))}
          </div>

          {/* Module Health */}
          <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: DS.text.secondary }}>Module Health</span>
            </div>
            {WORKSPACES.map((ws, i) => {
              const health = ws.id === "defense" ? { score: 78, label: "Elevated Threat" } : ws.id === "command" ? { score: 91, label: "Nominal" } : { score: 85, label: "Active" };
              const healthColor = health.score >= 90 ? "#10b981" : health.score >= 70 ? "#f59e0b" : "#ef4444";
              return (
                <div key={ws.id} className="py-2" style={{ borderTop: i > 0 ? `1px solid ${DS.borderMuted}` : "none" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <ws.icon className="w-3 h-3" style={{ color: ws.color }} />
                      <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{ws.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold" style={{ color: healthColor }}>{health.score}%</span>
                      <span className="text-[7px]" style={{ color: DS.text.muted }}>{health.label}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${health.score}%`, background: `linear-gradient(90deg, ${ws.color}80, ${ws.color})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
