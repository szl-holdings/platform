import { useState, useEffect, useRef } from "react";
import { cn } from "@workspace/shared-ui/utils";
import { DataProvenance, ActionLoop, RoleSelector } from "@workspace/shared-ui";
import type { DataProvenanceInfo } from "@workspace/shared-ui";
import { Link } from "wouter";
import {
  Shield, Server, Brain, AlertTriangle, Activity, Clock,
  ChevronRight, Zap, Target, Eye, Users, Flame,
  TrendingUp, Bell, Crosshair, Network, Radio,
  BarChart3, Bug, FileText, Ticket
} from "lucide-react";

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
    <span className="text-[10px] font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.3)" }}>
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
  low: "rgba(255,255,255,0.3)",
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
    detail: "CVE-2024-3400 on FW-EDGE-01 is a managed asset under Apex Logistics SLA. Unpatched state violates compliance framework NIST 800-53 SI-2.",
  },
];

export default function AegisUnifiedOverview() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | "all">("all");
  const [activeRole, setActiveRole] = useState("operator");

  const filteredFeed = activeWorkspace === "all"
    ? CROSS_MODULE_FEED
    : CROSS_MODULE_FEED.filter(f => f.module === activeWorkspace);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight font-display">Unified Operator Overview</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>One platform · Three workspaces · Shared intelligence layer</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            <span className="text-[9px] font-mono" style={{ color: "rgba(239,68,68,0.7)" }}>2 active incidents</span>
          </div>
        </div>
      </div>

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
        <DataProvenance
          compact
          provenance={{
            source: "Aegis SOC Engine",
            lastUpdated: new Date().toISOString(),
            freshness: "realtime",
            confidence: "high",
            dataState: "demo",
            owner: "Defense Operations",
          } as DataProvenanceInfo}
        />
      </div>

      {activeRole === "executive" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.04)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(239,68,68,0.5)" }}>Executive Briefing</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            2 active P1 incidents requiring executive awareness. Defense posture at 78/100 — elevated due to APT29 activity and unpatched firewall CVE. Command SLA breach on Northgate migration. MTTD trending down 18% this week — improvement driven by Labs neural explorer pre-detection.
          </div>
        </div>
      )}

      {activeRole === "analyst" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.04)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(139,92,246,0.5)" }}>Threat Hunting Focus</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Active APT29 indicators detected across 2 incidents. Labs neural explorer identified C2 beacon 8 minutes before SIEM — prioritize IOC correlation on T1071.001 and T1021.002 MITRE techniques. 142 IOC feeds tracked. Unpatched CVE-2024-3400 on edge firewall creates additional attack surface.
          </div>
        </div>
      )}

      {activeRole === "buyer" && (
        <div className="rounded-xl border p-4" style={{ borderColor: "rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.04)" }}>
          <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: "rgba(59,130,246,0.5)" }}>Product Demo View</div>
          <div className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            You're viewing Aegis — SZL's unified defense and intelligence platform. Three workspaces (Command, Defense, Labs) share a single intelligence layer with cross-module correlation. Every signal, incident, and SLA metric you see demonstrates the kind of operational visibility Aegis provides to managed security and IT operations teams.
          </div>
        </div>
      )}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="grid grid-cols-3 md:grid-cols-6">
          {[
            { label: "Open Incidents", value: "7", color: "#ef4444", pulse: true },
            { label: "Critical Alerts", value: "8", color: "#f97316" },
            { label: "SLA Risks", value: "3", color: "#f59e0b" },
            { label: "Managed Endpoints", value: "2.4K", color: "#3b82f6" },
            { label: "Active Investigations", value: "4", color: "#8b5cf6" },
            { label: "MTTD", value: "4.2m", color: "#10b981", sub: "↓ 18% this week" },
          ].map((c, i) => (
            <div key={c.label} className="px-3 py-3 text-center" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                <span className="text-base font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
                {c.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0" style={{ background: c.color }} />}
              </div>
              <div className="text-[8px] font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              {c.sub && <div className="text-[7px] mt-0.5" style={{ color: "#10b981" }}>{c.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveWorkspace("all")}
          className={cn("px-3 py-2 rounded-lg text-[11px] font-semibold transition-all border", activeWorkspace === "all" ? "bg-white/10 text-white border-white/20" : "text-white/30 hover:text-white/60 border-transparent hover:border-white/10")}
        >
          All Workspaces
        </button>
        {WORKSPACES.map((ws) => (
          <button
            key={ws.id}
            onClick={() => setActiveWorkspace(ws.id)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all border")}
            style={{
              color: activeWorkspace === ws.id ? ws.color : `${ws.color}50`,
              background: activeWorkspace === ws.id ? `${ws.color}15` : "transparent",
              borderColor: activeWorkspace === ws.id ? `${ws.color}30` : "transparent",
            }}
          >
            <ws.icon className="w-3 h-3" />
            {ws.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Cross-Platform Signal Feed</span>
              <span className="text-[10px] font-mono ml-auto" style={{ color: "rgba(255,255,255,0.2)" }}>{filteredFeed.length} signals</span>
            </div>
            <div className="space-y-0">
              {filteredFeed.map((sig, i) => {
                const Icon = sig.icon;
                return (
                  <div key={i} className="flex gap-3 py-2.5 group" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                    <div className="flex flex-col items-center shrink-0 pt-0.5">
                      <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${MODULE_COLORS[sig.module]}10`, border: `1px solid ${MODULE_COLORS[sig.module]}20` }}>
                        <Icon className="w-3 h-3" style={{ color: MODULE_COLORS[sig.module] }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-white/80 leading-relaxed">{sig.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>{sig.time} ago</span>
                        <span className="text-[8px] px-1 py-0.5 rounded uppercase tracking-wider font-medium" style={{
                          color: SEVERITY_COLORS[sig.severity],
                          background: `${SEVERITY_COLORS[sig.severity]}10`,
                        }}>{sig.severity}</span>
                        <span className="text-[8px] px-1 py-0.5 rounded capitalize" style={{
                          color: MODULE_COLORS[sig.module],
                          background: `${MODULE_COLORS[sig.module]}08`,
                        }}>{sig.module}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" style={{ color: "#ef4444" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Priority Work — {activeWorkspace === "all" ? "All Modules" : WORKSPACES.find(w => w.id === activeWorkspace)?.label}</span>
            </div>

            {(activeWorkspace === "all" ? (["defense", "command", "labs"] as Workspace[]) : [activeWorkspace]).map((ws) => {
              const items = PRIORITY_WORK[ws];
              const wsConf = WORKSPACES.find(w => w.id === ws)!;
              return (
                <div key={ws} className="rounded-xl border overflow-hidden" style={{ borderColor: `${wsConf.color}15`, background: "rgba(255,255,255,0.012)" }}>
                  <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${wsConf.color}10`, background: `${wsConf.color}05` }}>
                    <wsConf.icon className="w-3 h-3" style={{ color: wsConf.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: wsConf.color }}>{wsConf.label}</span>
                    <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>({items.length})</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                    {items.map((item) => (
                      <div key={item.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="shrink-0">
                          <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{item.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-white/80 truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.assignee ? (
                              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.assignee}</span>
                            ) : (
                              <span className="text-[9px] text-red-400/60">Unassigned</span>
                            )}
                            {item.technique && <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)" }}>{item.technique}</span>}
                          </div>
                        </div>
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                          item.severity === "P1" ? "text-red-400 bg-red-500/10" :
                          item.severity === "P2" ? "text-orange-400 bg-orange-500/10" :
                          item.severity === "P3" ? "text-amber-400 bg-amber-500/10" :
                          "text-violet-400 bg-violet-500/10"
                        )}>{item.severity}</span>
                        {item.score > 0 && (
                          <span className="text-sm font-bold font-mono" style={{ color: item.score >= 90 ? "#ef4444" : "#f97316" }}>{item.score}</span>
                        )}
                        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded",
                          item.status === "Investigating" || item.status === "In Progress" || item.status === "Running" || item.status === "Executing" ? "text-blue-400 bg-blue-500/10" :
                          item.status === "SLA Breach" ? "text-red-400 bg-red-500/10" :
                          item.status === "Awaiting Review" ? "text-amber-400 bg-amber-500/10" :
                          "text-white/30 bg-white/5"
                        )}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {WORKSPACES.map((ws) => {
              const href = ws.id === "defense" ? "/soc" : ws.id === "command" ? "/ops/dashboard" : "/intel/dashboard";
              return (
                <Link key={ws.id} href={href} className="group rounded-xl border p-3 transition-all hover:scale-[1.02] cursor-pointer" style={{
                  borderColor: `${ws.color}15`,
                  background: `linear-gradient(135deg, ${ws.color}06, transparent)`,
                }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ws.color}12`, border: `1px solid ${ws.color}20` }}>
                      <ws.icon className="w-4 h-4" style={{ color: ws.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold text-white">{ws.label}</div>
                      <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{ws.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: ws.color }} />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Network className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#8b5cf6" }}>Cross-Module Correlations</span>
            </div>
            {CROSS_CORRELATIONS.map((corr, i) => (
              <div key={i} className="py-2.5" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                <p className="text-[11px] font-semibold text-white/80 leading-tight">{corr.title}</p>
                <div className="flex gap-1 my-1.5">
                  {corr.modules.map(m => (
                    <span key={m} className="text-[8px] px-1.5 py-0.5 rounded capitalize font-medium" style={{
                      color: MODULE_COLORS[m],
                      background: `${MODULE_COLORS[m]}10`,
                      border: `1px solid ${MODULE_COLORS[m]}15`,
                    }}>{m}</span>
                  ))}
                </div>
                <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{corr.detail}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Module Health</span>
            </div>
            {WORKSPACES.map((ws, i) => {
              const health = ws.id === "defense" ? { score: 78, label: "Elevated Threat" } : ws.id === "command" ? { score: 91, label: "Nominal" } : { score: 85, label: "Active" };
              return (
                <div key={ws.id} className="py-2" style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.03)" : "none" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <ws.icon className="w-3 h-3" style={{ color: ws.color }} />
                      <span className="text-[10px] font-medium text-white/70">{ws.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold" style={{ color: health.score >= 90 ? "#10b981" : health.score >= 70 ? "#f59e0b" : "#ef4444" }}>{health.score}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${health.score}%`,
                      background: `linear-gradient(90deg, ${ws.color}80, ${ws.color})`,
                    }} />
                  </div>
                  <div className="text-[8px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>{health.label}</div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border p-3" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.012)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />
                <span className="text-[9px] uppercase tracking-wider font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Platform State</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                <span className="text-[9px] font-mono" style={{ color: "#10b981" }}>Simulation</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>MTTR</div>
                <div className="text-[10px] font-mono font-bold" style={{ color: "#10b981" }}>18m</div>
              </div>
              <div>
                <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>Posture</div>
                <div className="text-[10px] font-mono font-bold" style={{ color: "#f59e0b" }}>78/100</div>
              </div>
              <div>
                <div className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>Coverage</div>
                <div className="text-[10px] font-mono font-bold" style={{ color: "#3b82f6" }}>94%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ActionLoop
        title="Immediate Actions"
        actions={[
          { id: "1", label: "Contain lateral movement — DC-PROD-03", type: "remediate", severity: "critical" },
          { id: "2", label: "Escalate SLA breach — Northgate #4827", type: "escalate", severity: "high" },
          { id: "3", label: "Investigate APT29 C2 beacon", type: "investigate", severity: "critical" },
          { id: "4", label: "Approve patch deployment — FW-EDGE-01", type: "approve", severity: "high" },
          { id: "5", label: "Assign IR lead — INC-2847", type: "assign" },
        ]}
      />
    </div>
  );
}
