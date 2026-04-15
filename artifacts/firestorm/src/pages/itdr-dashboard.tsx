import { useState } from "react";
import { useLocation } from "wouter";
import { Users, AlertTriangle, Globe, Shield, Activity, Eye, ChevronDown, ChevronUp, Lock, Zap, Radio } from "lucide-react";

const RISK_COLOR: Record<string, string> = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#22c55e" };
const STATUS_COLOR: Record<string, string> = { "Investigating": "#f97316", "Contained": "#22c55e", "Active": "#ef4444", "Resolved": "#94a3b8" };

interface ITDRAlert {
  id: string;
  type: "impossible-travel" | "credential-stuffing" | "privilege-escalation" | "lateral-movement" | "anomalous-auth" | "account-takeover";
  title: string;
  identity: string;
  risk: "critical" | "high" | "medium" | "low";
  status: "Active" | "Investigating" | "Contained" | "Resolved";
  detail: string;
  timestamp: string;
  xdrLinked?: string;
  geo?: string[];
  mitre: string[];
}

const ALERTS: ITDRAlert[] = [
  {
    id: "ITDR-001", type: "impossible-travel", title: "Impossible Travel — Login from two continents in 47 minutes",
    identity: "sarah.chen@szl-corp.com", risk: "critical", status: "Active",
    detail: "User authenticated from London (08:12 UTC) then São Paulo (08:59 UTC). Physical travel time: ~14h. Likely account takeover or credential sharing.",
    timestamp: "12m ago", xdrLinked: "XDR-002", geo: ["GB", "BR"], mitre: ["T1078", "T1133"],
  },
  {
    id: "ITDR-002", type: "credential-stuffing", title: "Credential Stuffing — 847 failed attempts across 12 accounts",
    identity: "Multiple accounts", risk: "critical", status: "Investigating",
    detail: "High-velocity authentication failures originating from 34 distinct IPs across 6 ASNs. Pattern matches known credential stuffing tool signature. 3 accounts had successful logins following failures.",
    timestamp: "28m ago", geo: ["RU", "CN", "NG"], mitre: ["T1110.004", "T1078"],
  },
  {
    id: "ITDR-003", type: "privilege-escalation", title: "Privilege Escalation — Standard user assumed AdminRole",
    identity: "j.martinez@szl-corp.com", risk: "critical", status: "Active",
    detail: "Account with 'ReadOnly' baseline assumed AWS AdministratorAccess role via cross-account trust policy at 14:31 UTC. No approved change ticket. Correlated with lateral movement alert INC-2847.",
    timestamp: "3m ago", xdrLinked: "XDR-001", mitre: ["T1078.004", "T1548"],
  },
  {
    id: "ITDR-004", type: "anomalous-auth", title: "Off-hours Authentication — Senior VP at 03:17 local time",
    identity: "michael.kwan@szl-exec.com", risk: "high", status: "Investigating",
    detail: "Executive account authenticated at 03:17 local time from unregistered device. MFA approved via push. Device fingerprint not previously seen in last 180 days.",
    timestamp: "1h ago", mitre: ["T1078", "T1539"],
  },
  {
    id: "ITDR-005", type: "lateral-movement", title: "Service Account Lateral Movement — DC traversal",
    identity: "svc-backup@szl.local", risk: "high", status: "Contained",
    detail: "Service account authenticated to 7 domain controllers within 4 minutes via Kerberos. Ticket requests deviate from 90-day baseline. Associated with Operation Darkwing campaign.",
    timestamp: "6h ago", xdrLinked: "XDR-001", mitre: ["T1021.002", "T1550.003"],
  },
  {
    id: "ITDR-006", type: "account-takeover", title: "Suspected Account Takeover — Session token reuse",
    identity: "dev.pipeline@szl-ops.io", risk: "medium", status: "Resolved",
    detail: "CI/CD service account token used from IP range not associated with build infrastructure. Token was valid for 72h without rotation policy. Access to 3 source repositories confirmed.",
    timestamp: "1d ago", mitre: ["T1552.001", "T1534"],
  },
];

const AUTH_TIMELINE = [
  { hour: "00:00", events: 12, anomalies: 0 }, { hour: "03:00", events: 4, anomalies: 1 }, { hour: "06:00", events: 89, anomalies: 0 },
  { hour: "08:00", events: 341, anomalies: 2 }, { hour: "09:00", events: 892, anomalies: 4 }, { hour: "10:00", events: 1247, anomalies: 8 },
  { hour: "11:00", events: 1089, anomalies: 12 }, { hour: "12:00", events: 734, anomalies: 6 }, { hour: "13:00", events: 812, anomalies: 3 },
  { hour: "14:00", events: 1134, anomalies: 17 }, { hour: "15:00", events: 623, anomalies: 5 }, { hour: "18:00", events: 234, anomalies: 1 },
];

const MAX_EVENTS = Math.max(...AUTH_TIMELINE.map(d => d.events));

const TYPE_ICON: Record<string, typeof Users> = {
  "impossible-travel": Globe, "credential-stuffing": Lock, "privilege-escalation": Shield,
  "lateral-movement": Activity, "anomalous-auth": Eye, "account-takeover": AlertTriangle,
};

const TYPE_COLOR: Record<string, string> = {
  "impossible-travel": "#8b5cf6", "credential-stuffing": "#ef4444", "privilege-escalation": "#f97316",
  "lateral-movement": "#f59e0b", "anomalous-auth": "#06b6d4", "account-takeover": "#ec4899",
};

export default function ITDRDashboard() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>("ITDR-001");

  const activeCount = ALERTS.filter(a => a.status === "Active" || a.status === "Investigating").length;
  const criticalCount = ALERTS.filter(a => a.risk === "critical").length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Identity Threat Detection & Response
          </h1>
          <p className="text-xs text-white/40 mt-0.5">Auth pattern analysis · impossible travel · privilege escalation · credential stuffing · XDR integration</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20">
          <Radio className="w-3 h-3 animate-pulse" /> {activeCount} active threats
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Critical Identity Threats", value: criticalCount, color: "#ef4444" },
          { label: "Active Investigations", value: activeCount, color: "#f97316" },
          { label: "Auth Events (24h)", value: "8,211", color: "#8b5cf6" },
          { label: "Anomalies Detected", value: AUTH_TIMELINE.reduce((s, d) => s + d.anomalies, 0), color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
            <div className="text-xs text-white/40 mb-1">{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Auth timeline sparkline */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Authentication Event Timeline (24h)</span>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 opacity-60" /><span className="text-[9px] text-white/30">Auth events</span></div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[9px] text-white/30">Anomalies</span></div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-16">
          {AUTH_TIMELINE.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full rounded-sm" style={{ height: `${(d.events / MAX_EVENTS) * 100}%`, background: d.anomalies > 5 ? "rgba(239,68,68,0.5)" : "rgba(139,92,246,0.4)", minHeight: 2 }} />
              {d.anomalies > 0 && <div className="w-full rounded-sm" style={{ height: Math.min(d.anomalies * 2, 16), background: "#ef4444" }} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[8px] font-mono text-white/20">
          {AUTH_TIMELINE.filter((_, i) => i % 3 === 0).map(d => <span key={d.hour}>{d.hour}</span>)}
        </div>
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">Identity Threat Detections</div>
        {ALERTS.map(alert => {
          const Icon = TYPE_ICON[alert.type] ?? Users;
          const isExpanded = expandedId === alert.id;
          return (
            <div key={alert.id} className="rounded-xl border overflow-hidden" style={{ borderColor: isExpanded ? `${RISK_COLOR[alert.risk]}30` : "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left" onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${TYPE_COLOR[alert.type]}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: TYPE_COLOR[alert.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{alert.title}</span>
                    {alert.xdrLinked && <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">XDR: {alert.xdrLinked}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/30">
                    <span className="font-mono">{alert.identity}</span>
                    <span>{alert.timestamp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase" style={{ color: STATUS_COLOR[alert.status], background: `${STATUS_COLOR[alert.status]}15`, border: `1px solid ${STATUS_COLOR[alert.status]}25` }}>{alert.status}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase" style={{ color: RISK_COLOR[alert.risk], background: `${RISK_COLOR[alert.risk]}15` }}>{alert.risk}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-white/30" /> : <ChevronDown className="w-3.5 h-3.5 text-white/30" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-white/[0.04] space-y-3">
                  <p className="text-xs text-white/60 leading-relaxed">{alert.detail}</p>
                  <div className="flex flex-wrap gap-2">
                    {alert.mitre.map(m => (
                      <span key={m} className="text-[9px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded">{m}</span>
                    ))}
                    {alert.geo && alert.geo.map(g => (
                      <span key={g} className="text-[9px] font-mono bg-white/[0.04] text-white/40 px-1.5 py-0.5 rounded">{g}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {alert.status === "Active" && (
                      <button className="px-3 py-1.5 rounded-lg text-[11px] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                        <Lock className="w-3 h-3 inline mr-1" />Suspend Account
                      </button>
                    )}
                    <button className="px-3 py-1.5 rounded-lg text-[11px] border border-orange-500/25 text-orange-400 hover:bg-orange-500/10 transition-colors">
                      <Zap className="w-3 h-3 inline mr-1" />Force Re-Auth
                    </button>
                    <button onClick={() => navigate("/xdr-console")} className="px-3 py-1.5 rounded-lg text-[11px] border border-white/10 text-white/50 hover:bg-white/[0.04] transition-colors">
                      <Eye className="w-3 h-3 inline mr-1" />View in XDR
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
