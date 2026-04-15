import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  Shield, AlertTriangle, Bell, Clock, CheckCircle2, XCircle, Activity,
  TrendingUp, TrendingDown, Minus, Users, Lock, Eye, Zap,
  ChevronRight, Circle, ArrowRight, UserCheck, Server, AlertOctagon,
  ClipboardCheck, BarChart3, RefreshCw, Hexagon, ShieldCheck, FileText,
  Radio,
} from "lucide-react";
import { Link } from "wouter";

const DS = {
  page: "#070A10",
  surface: "rgba(255,255,255,0.025)",
  elevated: "rgba(255,255,255,0.035)",
  border: "rgba(255,255,255,0.05)",
  borderMuted: "rgba(255,255,255,0.04)",
  text: { primary: "rgba(255,255,255,0.9)", secondary: "rgba(255,255,255,0.5)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" },
};

interface AegisIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  assignedAnalyst?: string | null;
  detectedAt?: string | Date;
}

interface AegisAlert {
  id: number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

interface LiveWorkflowAction {
  id: number;
  entityType: string;
  entityId: number;
  actionType: string;
  assignedTo?: string | null;
  status: string;
  notes?: string | null;
  triggeredBy?: string | null;
  createdAt: string;
}

interface LiveFinding {
  id: number;
  title: string;
  severity: string;
  status: string;
  remediationOwner?: string | null;
  createdAt: string;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono tabular-nums text-[10px]" style={{ color: DS.text.muted }}>UTC {time.toISOString().slice(11, 19)}</span>;
}

function PulsingDot({ color = "#ef4444" }: { color?: string }) {
  return (
    <span className="relative flex w-2 h-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

const SEV_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; accent: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/25", dot: "#ef4444", accent: "#ef4444" },
  high:     { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/25", dot: "#f97316", accent: "#f97316" },
  medium:   { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/25", dot: "#eab308", accent: "#eab308" },
  low:      { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/25", dot: "#3b82f6", accent: "#3b82f6" },
};

const STATUS_COLORS: Record<string, string> = {
  detection: "bg-red-500/10 text-red-300 border-red-500/20",
  triage: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  investigation: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  containment: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  remediation: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  closed: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  open: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  in_progress: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
};

const FALLBACK_POSTURE = { controlsImplemented: 84, controlsTotal: 120, mttd: "18m", mttr: "4h 12m", slaBreaches: 2 };

const FALLBACK_APPROVAL_QUEUE = [
  { id: "APR-001", action: "Isolate endpoint DC-PROD-03", type: "containment", requestedBy: "J. Chen", requestedAt: "12m ago", severity: "critical", gate: "approval_required" },
  { id: "APR-002", action: "Block outbound to 103.45.18.x", type: "network_block", requestedBy: "S. Park", requestedAt: "28m ago", severity: "high", gate: "approval_required" },
  { id: "APR-003", action: "Revoke OAuth tokens — svc-integration", type: "iam_action", requestedBy: "M. Rodriguez", requestedAt: "1h 4m ago", severity: "high", gate: "approval_required" },
];

const FALLBACK_DECISIONS = [
  { id: "DEC-041", title: "Lateral movement confirmed — APT29 TTP overlap", analyst: "J. Chen", confidence: 88, at: "34m ago", outcome: "escalated" },
  { id: "DEC-040", title: "Brute force — automated bot, not targeted", analyst: "L. Kim", confidence: 95, at: "2h ago", outcome: "closed" },
  { id: "DEC-039", title: "S3 exfil pattern — misconfig, not threat actor", analyst: "S. Park", confidence: 71, at: "3h ago", outcome: "remediation" },
];

const ACTION_TYPE_LABELS: Record<string, string> = {
  assign_owner: "Assign Owner", escalate: "Escalate", acknowledge: "Acknowledge",
  remediate: "Remediate", route_to_response: "Route to Response", create_ticket: "Create Ticket", notify: "Notify",
};

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function MetricCard({ label, value, sub, trend, color = "#3b82f6" }: { label: string; value: string; sub?: string; trend?: "up" | "down" | "stable"; color?: string }) {
  return (
    <div style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", padding: "1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}60, transparent)` }} />
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] mb-2" style={{ color: DS.text.tertiary }}>{label}</div>
      <div className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: DS.text.tertiary }}>{sub}</div>}
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-red-400" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-emerald-400" />}
          {trend === "stable" && <Minus className="w-3 h-3 text-blue-400" />}
          <span className="text-[10px]" style={{ color: DS.text.muted }}>30d trend</span>
        </div>
      )}
    </div>
  );
}

function PostureRing({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" className="rotate-[-90deg]">
        <circle cx="48" cy="48" r={r} strokeWidth="6" stroke="rgba(255,255,255,0.07)" fill="none" />
        <circle cx="48" cy="48" r={r} strokeWidth="6" stroke={color} fill="none" strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: DS.text.muted }}>posture</span>
      </div>
    </div>
  );
}

interface PostureSummary {
  riskScore: number | null;
  riskLevel: string;
  openIncidents: number;
  criticalAlerts: number;
  unresolvedFindings: number;
  totalAlerts: number;
  ztEnvironment?: string;
  ztPermissionClass?: string;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string; exportRestricted: boolean };
  fetchedAt: string;
  controlsImplemented?: number;
  controlsTotal?: number;
  mttd?: string;
  mttr?: string;
  slaBreaches?: number;
}

interface DecisionsPayload {
  decisions: LiveFinding[];
  pendingCount?: number;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string };
  fetchedAt: string;
}

interface PlaybooksPayload {
  playbooks: LiveWorkflowAction[];
  total?: number;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string };
  fetchedAt: string;
}

export default function CommandHome() {
  const { data: posture } = useQuery<PostureSummary>({ queryKey: ["command-posture"], queryFn: () => api.command.posture(), retry: false });
  const { data: incidents = [] } = useQuery<AegisIncident[]>({ queryKey: ["aegis-incidents"], queryFn: () => api.incidents.list() });
  const { data: alerts = [] } = useQuery<AegisAlert[]>({ queryKey: ["aegis-alerts"], queryFn: () => api.alerts.list() });
  const { data: decisionsData, isSuccess: decisionsLoaded } = useQuery<DecisionsPayload>({ queryKey: ["command-decisions"], queryFn: () => api.command.decisions(), retry: false });
  const { data: playbooksData, isSuccess: playbooksLoaded } = useQuery<PlaybooksPayload>({ queryKey: ["command-playbooks"], queryFn: () => api.command.playbooks(), retry: false });

  const activeIncidents = incidents.filter(i => i.status !== "closed");
  const criticalIncidents = activeIncidents.filter(i => i.severity === "critical");
  const newAlerts = alerts.filter(a => a.status === "new");

  const postureScore = posture?.riskScore != null ? Math.round(posture.riskScore) : 72;
  const liveOpenIncidents = posture?.openIncidents ?? activeIncidents.length;
  const liveCriticalAlerts = posture?.criticalAlerts ?? criticalIncidents.length;
  const unresolvedFindings = posture?.unresolvedFindings ?? 0;

  const envLabel = posture?.ztEnvironment ?? "PRODUCTION";
  const tenantLabel = posture?.ztPermissionClass ? `CLASS:${posture.ztPermissionClass.toUpperCase()}` : "ORG-DEFAULT";
  const sessionClass = posture ? "VERIFIED" : "UNVERIFIED";

  const pendingActions = useMemo(() => {
    if (!playbooksLoaded) return null;
    const actions = playbooksData?.playbooks ?? [];
    return actions.filter(a => a.status === "pending").map(a => ({
      id: `ACT-${a.id}`,
      action: `${ACTION_TYPE_LABELS[a.actionType] ?? a.actionType} — ${a.entityType} #${a.entityId}`,
      type: a.actionType,
      requestedBy: a.triggeredBy ?? "System",
      requestedAt: formatTimeAgo(a.createdAt),
      severity: a.actionType === "escalate" || a.actionType === "remediate" ? "critical" : "high",
      gate: "approval_required",
    }));
  }, [playbooksData, playbooksLoaded]);

  const recentDecisions = useMemo(() => {
    if (!decisionsLoaded) return null;
    return (decisionsData?.decisions ?? []).slice(0, 5).map(d => ({
      id: `FIND-${d.id}`,
      title: d.title,
      analyst: d.remediationOwner ?? "Analyst",
      confidence: 0,
      at: formatTimeAgo(d.createdAt),
      outcome: d.status,
    }));
  }, [decisionsData, decisionsLoaded]);

  const approvalQueue = pendingActions ?? FALLBACK_APPROVAL_QUEUE;
  const displayDecisions = recentDecisions ?? FALLBACK_DECISIONS;
  const usingLive = posture != null;

  return (
    <div className="flex flex-col h-full min-h-screen" style={{ backgroundColor: DS.page, color: "#e2e8f0" }}>

      {/* Topbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b relative overflow-hidden" style={{ borderColor: DS.border }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, ${postureScore >= 80 ? "#10b981" : postureScore >= 60 ? "#f59e0b" : "#ef4444"}40, transparent 60%)` }} />
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.25),rgba(139,92,246,0.18))", border: "1px solid rgba(59,130,246,0.2)" }}>
            <Hexagon className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Command Home</h1>
            <p className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: DS.text.muted }}>Aegis Cyber-Resilience Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400/80 bg-emerald-500/5">{envLabel}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400/80 bg-blue-500/5">{tenantLabel}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-violet-500/30 text-violet-400/80 bg-violet-500/5"><Lock className="w-2.5 h-2.5 inline mr-0.5" />{sessionClass}</span>
            {usingLive && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>}
          </div>
          <LiveClock />
        </div>
      </div>

      {/* Threat level strip */}
      <div style={{ padding: "0.5rem 1.5rem", borderBottom: `1px solid ${DS.border}`, display: "flex", alignItems: "center", gap: "1.5rem", overflow: "hidden", background: "rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <Radio className="w-3 h-3 text-red-400 animate-pulse" />
          <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: DS.text.tertiary }}>Threat Feed</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div style={{ display: "flex", gap: "3rem", animation: "scroll-left 30s linear infinite", whiteSpace: "nowrap" }}>
            {[
              { tag: "CRITICAL", msg: "APT29 lateral movement — DC-PROD-03 quarantine pending", color: "#ef4444" },
              { tag: "HIGH", msg: "Outbound C2 beacon detected — blocked at perimeter", color: "#f97316" },
              { tag: "HIGH", msg: "S3 exfil pattern — 3 buckets flagged for review", color: "#f97316" },
              { tag: "MEDIUM", msg: "Brute force campaign — 847 attempts in 2h window", color: "#eab308" },
              { tag: "INFO", msg: "Threat intel updated — 14 new IOCs added to block list", color: "#3b82f6" },
            ].map((item, i) => (
              <span key={i} style={{ fontSize: "10px", color: DS.text.secondary, flexShrink: 0 }}>
                <span style={{ color: item.color, fontWeight: 700, marginRight: "6px", fontFamily: "monospace" }}>[{item.tag}]</span>
                {item.msg}
              </span>
            ))}
          </div>
        </div>
        <style>{`@keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Row 1: Posture + 4 KPI cards */}
        <div className="grid grid-cols-12 gap-4">

          {/* Posture panel */}
          <div className="col-span-12 lg:col-span-3" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${postureScore >= 80 ? "#10b981" : postureScore >= 60 ? "#f59e0b" : "#ef4444"}, transparent)`, margin: "-1.25rem -1.25rem 1rem", borderRadius: "12px 12px 0 0" }} />
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: DS.text.tertiary }}>System Posture</span>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: DS.text.muted }} />
            </div>
            <div className="flex flex-col items-center gap-3">
              <PostureRing score={postureScore} />
              <div className="w-full space-y-2">
                {((): Array<{ label: string; value: string; color: string }> => {
                  const ctrlImpl = posture?.controlsImplemented ?? FALLBACK_POSTURE.controlsImplemented;
                  const ctrlTotal = posture?.controlsTotal ?? FALLBACK_POSTURE.controlsTotal;
                  const mttd = posture?.mttd ?? FALLBACK_POSTURE.mttd;
                  const mttr = posture?.mttr ?? FALLBACK_POSTURE.mttr;
                  const slaB = posture?.slaBreaches ?? FALLBACK_POSTURE.slaBreaches;
                  return [
                    { label: "Controls Active", value: `${ctrlImpl}/${ctrlTotal}`, color: "#10b981" },
                    { label: "MTTD", value: mttd, color: "#3b82f6" },
                    { label: "MTTR", value: mttr, color: "#3b82f6" },
                    { label: "SLA Breaches", value: String(slaB), color: slaB > 0 ? "#ef4444" : "#10b981" },
                  ];
                })().map(row => (
                  <div key={row.label} className="flex justify-between text-[10px]" style={{ borderBottom: `1px solid ${DS.borderMuted}`, paddingBottom: "0.375rem" }}>
                    <span style={{ color: DS.text.secondary }}>{row.label}</span>
                    <span className="font-mono font-bold" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 KPI metric cards */}
          <div className="col-span-12 lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Active Incidents" value={String(liveOpenIncidents || activeIncidents.length)} sub={`${liveCriticalAlerts || criticalIncidents.length} critical`} trend="down" color="#ef4444" />
            <MetricCard label="Priority Alerts" value={String(posture?.totalAlerts ?? newAlerts.length)} sub={`${liveCriticalAlerts} critical`} trend="up" color="#f97316" />
            <MetricCard label="Pending Approvals" value={String(approvalQueue.length)} sub="require action" trend="stable" color="#f59e0b" />
            <MetricCard label="Unresolved Findings" value={String(unresolvedFindings || 0)} sub={unresolvedFindings > 0 ? "open/confirmed" : "—"} trend="stable" color="#8b5cf6" />
          </div>
        </div>

        {/* Row 2: Incidents + Approval Queue + Findings count */}
        <div className="grid grid-cols-12 gap-4">

          {/* Active Incidents */}
          <div className="col-span-12 lg:col-span-5" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, #ef4444, transparent)" }} />
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: DS.borderMuted }}>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-white">Active Incidents</span>
                {(activeIncidents.length > 0 || liveOpenIncidents > 0) && <PulsingDot color="#ef4444" />}
              </div>
              <Link href="/incidents">
                <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
              {(activeIncidents.length > 0 ? activeIncidents.slice(0, 5) : ((): AegisIncident[] => [
                { id: 1, title: "Lateral Movement — DC-PROD-03", severity: "critical", status: "investigation", createdAt: new Date(Date.now() - 1200000).toISOString(), assignedAnalyst: "J. Chen", detectedAt: new Date(Date.now() - 1200000) },
                { id: 2, title: "C2 Beacon — APT29 Infrastructure", severity: "critical", status: "triage", createdAt: new Date(Date.now() - 3600000).toISOString(), assignedAnalyst: "S. Park", detectedAt: new Date(Date.now() - 3600000) },
                { id: 3, title: "Data Exfil Pattern — S3 Bucket", severity: "high", status: "investigation", createdAt: new Date(Date.now() - 7200000).toISOString(), assignedAnalyst: "M. Rodriguez", detectedAt: new Date(Date.now() - 7200000) },
                { id: 4, title: "Brute Force — Admin Portal", severity: "high", status: "containment", createdAt: new Date(Date.now() - 10800000).toISOString(), assignedAnalyst: null, detectedAt: new Date(Date.now() - 10800000) },
                { id: 5, title: "Unauth Access — Config Mgmt", severity: "medium", status: "triage", createdAt: new Date(Date.now() - 18000000).toISOString(), assignedAnalyst: "L. Kim", detectedAt: new Date(Date.now() - 18000000) },
              ])()).map((inc: AegisIncident) => {
                const sev = SEV_COLORS[inc.severity] ?? SEV_COLORS.medium;
                const age = Math.round((Date.now() - new Date(inc.detectedAt ?? inc.createdAt).getTime()) / 60000);
                const ageStr = age < 60 ? `${age}m` : `${Math.round(age / 60)}h`;
                return (
                  <Link key={inc.id} href="/incidents">
                    <div className="px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: sev.dot, boxShadow: inc.severity === "critical" ? `0 0 6px ${sev.dot}50` : "none" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: DS.text.primary }}>{inc.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border uppercase tracking-wider", STATUS_COLORS[inc.status])}>{inc.status}</span>
                            <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>{ageStr} ago</span>
                            {inc.assignedAnalyst ? (
                              <span className="text-[10px]" style={{ color: DS.text.secondary }}>→ {inc.assignedAnalyst}</span>
                            ) : (
                              <span className="text-[10px] text-amber-400/70">unassigned</span>
                            )}
                          </div>
                        </div>
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0", sev.bg, sev.text, sev.border)}>{inc.severity}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Approval Queue */}
          <div className="col-span-12 lg:col-span-4" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, #f59e0b, transparent)" }} />
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: DS.borderMuted }}>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white">Approval Queue</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">{approvalQueue.length}</span>
                {pendingActions && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>}
              </div>
              <Link href="/response-orchestration">
                <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
              {approvalQueue.map(item => {
                const sev = SEV_COLORS[item.severity] ?? SEV_COLORS.high;
                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-1 h-1 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: sev.dot }} />
                        <p className="text-[11px] font-medium leading-snug" style={{ color: DS.text.primary }}>{item.action}</p>
                      </div>
                      <span className={cn("text-[8px] font-mono px-1 py-0.5 rounded border shrink-0 uppercase", sev.bg, sev.text, sev.border)}>{item.severity}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400/80 uppercase tracking-wider">approval_required</span>
                      <span className="text-[10px]" style={{ color: DS.text.muted }}>{item.requestedBy} · {item.requestedAt}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">Approve</button>
                      <button className="flex-1 py-1.5 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">Reject</button>
                    </div>
                  </div>
                );
              })}
              {approvalQueue.length === 0 && <div className="px-4 py-6 text-center text-[11px]" style={{ color: DS.text.muted }}>No pending approvals</div>}
            </div>
          </div>

          {/* Unresolved Findings */}
          <div className="col-span-12 lg:col-span-3" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, #8b5cf6, transparent)" }} />
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: DS.borderMuted }}>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-white">Unresolved Findings</span>
              </div>
              <span className="text-[9px] font-mono" style={{ color: DS.text.muted }}>{unresolvedFindings}</span>
            </div>
            <div className="px-4 py-6">
              <div className="flex flex-col items-center gap-2">
                <div className="text-4xl font-bold font-mono tabular-nums" style={{ color: unresolvedFindings > 5 ? "#ef4444" : unresolvedFindings > 0 ? "#f59e0b" : "#10b981" }}>{unresolvedFindings}</div>
                <span className="text-[10px]" style={{ color: DS.text.tertiary }}>open or confirmed</span>
                <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ height: "100%", width: `${Math.min(unresolvedFindings * 10, 100)}%`, background: unresolvedFindings > 5 ? "#ef4444" : "#f59e0b", borderRadius: 2 }} />
                </div>
                <Link href="/decision-console">
                  <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1 mt-3">Decision Console <ChevronRight className="w-3 h-3" /></span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Recent Decisions + Quick Stats */}
        <div className="grid grid-cols-12 gap-4">

          {/* Recent Decisions */}
          <div className="col-span-12 lg:col-span-7" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, #3b82f6, transparent)" }} />
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: DS.borderMuted }}>
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-white">Recent Decisions</span>
                {recentDecisions && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>}
              </div>
              <Link href="/decision-console">
                <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1">Decision Console <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
              {displayDecisions.map(dec => (
                <div key={dec.id} className="px-4 py-3 flex items-start gap-4 hover:bg-white/[0.01] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium mb-1" style={{ color: DS.text.primary }}>{dec.title}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px]" style={{ color: DS.text.secondary }}>{dec.analyst}</span>
                      <span className="text-[10px]" style={{ color: DS.text.muted }}>{dec.at}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {dec.confidence > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="h-1 rounded-full bg-white/10 w-16 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${dec.confidence}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 tabular-nums">{dec.confidence}%</span>
                      </div>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider border border-blue-500/20 bg-blue-500/10 text-blue-300">{dec.outcome}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="col-span-12 lg:col-span-5" style={{ background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ height: 2, background: "linear-gradient(90deg, #3b82f6, transparent)" }} />
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: DS.borderMuted }}>
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-white">Quick Stats</span>
            </div>
            <div className="divide-y" style={{ borderColor: DS.borderMuted }}>
              {[
                { label: "Total Alerts (all)", value: posture?.totalAlerts ?? alerts.length, color: DS.text.primary },
                { label: "Open Incidents", value: liveOpenIncidents, color: "#ef4444" },
                { label: "Critical Alerts", value: liveCriticalAlerts, color: "#ef4444" },
                { label: "Unresolved Findings", value: unresolvedFindings, color: "#f59e0b" },
                { label: "Pending Actions", value: approvalQueue.length, color: "#f59e0b" },
              ].map(row => (
                <div key={row.label} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: DS.text.secondary }}>{row.label}</span>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 60, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min((Number(row.value) / 20) * 100, 100)}%`, background: row.color, borderRadius: 2 }} />
                    </div>
                    <span className="text-[11px] font-mono font-bold w-8 text-right" style={{ color: row.color }}>{row.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
