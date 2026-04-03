import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  Shield, AlertTriangle, Bell, Clock, CheckCircle2, XCircle, Activity,
  TrendingUp, TrendingDown, Minus, Users, Lock, Eye, Zap,
  ChevronRight, Circle, ArrowRight, UserCheck, Server, AlertOctagon,
  ClipboardCheck, BarChart3, RefreshCw, Hexagon, ShieldCheck, FileText
} from "lucide-react";
import { Link } from "wouter";

interface FirestormIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  assignedAnalyst?: string | null;
  detectedAt?: string | Date;
}

interface FirestormAlert {
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
  return <span className="font-mono tabular-nums text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>UTC {time.toISOString().slice(11, 19)}</span>;
}

function PulsingDot({ color = "#ef4444" }: { color?: string }) {
  return (
    <span className="relative flex w-2 h-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ backgroundColor: color }} />
    </span>
  );
}

const SEV_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-300", border: "border-red-500/25", dot: "#ef4444" },
  high:     { bg: "bg-orange-500/10", text: "text-orange-300", border: "border-orange-500/25", dot: "#f97316" },
  medium:   { bg: "bg-yellow-500/10", text: "text-yellow-300", border: "border-yellow-500/25", dot: "#eab308" },
  low:      { bg: "bg-blue-500/10", text: "text-blue-300", border: "border-blue-500/25", dot: "#3b82f6" },
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

const FALLBACK_POSTURE = {
  controlsImplemented: 84,
  controlsTotal: 120,
  mttd: "18m",
  mttr: "4h 12m",
  slaBreaches: 2,
};

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
  assign_owner: "Assign Owner",
  escalate: "Escalate",
  acknowledge: "Acknowledge",
  remediate: "Remediate",
  route_to_response: "Route to Response",
  create_ticket: "Create Ticket",
  notify: "Notify",
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
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
      <div className="text-[10px] font-mono uppercase tracking-[0.15em] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
      <div className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</div>}
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          {trend === "up" && <TrendingUp className="w-3 h-3 text-red-400" />}
          {trend === "down" && <TrendingDown className="w-3 h-3 text-emerald-400" />}
          {trend === "stable" && <Minus className="w-3 h-3 text-blue-400" />}
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>30d trend</span>
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
        <circle cx="48" cy="48" r={r} strokeWidth="6" stroke={color} fill="none"
          strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[8px] font-mono uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>posture</span>
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
  const { data: posture } = useQuery<PostureSummary>({
    queryKey: ["command-posture"],
    queryFn: () => api.command.posture(),
    retry: false,
  });

  const { data: incidents = [] } = useQuery<FirestormIncident[]>({
    queryKey: ["firestorm-incidents"],
    queryFn: () => api.incidents.list(),
  });
  const { data: alerts = [] } = useQuery<FirestormAlert[]>({
    queryKey: ["firestorm-alerts"],
    queryFn: () => api.alerts.list(),
  });

  const { data: decisionsData, isSuccess: decisionsLoaded } = useQuery<DecisionsPayload>({
    queryKey: ["command-decisions"],
    queryFn: () => api.command.decisions(),
    retry: false,
  });

  const { data: playbooksData, isSuccess: playbooksLoaded } = useQuery<PlaybooksPayload>({
    queryKey: ["command-playbooks"],
    queryFn: () => api.command.playbooks(),
    retry: false,
  });

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
    const pending = actions.filter(a => a.status === "pending");
    return pending.map(a => ({
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
    const decisions = decisionsData?.decisions ?? [];
    return decisions.slice(0, 5).map(d => ({
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
    <div className="flex flex-col h-full min-h-screen" style={{ backgroundColor: "#070A10", color: "#e2e8f0" }}>
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.15))" }}>
            <Hexagon className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">Command Home</h1>
            <p className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.3)" }}>Aegis Cyber-Resilience Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-400/80 bg-emerald-500/5">{envLabel}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400/80 bg-blue-500/5">{tenantLabel}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-violet-500/30 text-violet-400/80 bg-violet-500/5">
              <Lock className="w-2.5 h-2.5 inline mr-0.5" />{sessionClass}
            </span>
            {usingLive && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>
            )}
          </div>
          <LiveClock />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-3 bg-white/[0.025] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>System Posture</span>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
            </div>
            <div className="flex flex-col items-center gap-3">
              <PostureRing score={postureScore} />
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>Controls Active</span>
                  <span className="font-mono text-emerald-400">{FALLBACK_POSTURE.controlsImplemented}/{FALLBACK_POSTURE.controlsTotal}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>MTTD</span>
                  <span className="font-mono text-blue-300">{FALLBACK_POSTURE.mttd}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>MTTR</span>
                  <span className="font-mono text-blue-300">{FALLBACK_POSTURE.mttr}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span style={{ color: "rgba(255,255,255,0.45)" }}>SLA Breaches</span>
                  <span className={cn("font-mono", FALLBACK_POSTURE.slaBreaches > 0 ? "text-red-400" : "text-emerald-400")}>{FALLBACK_POSTURE.slaBreaches}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Active Incidents" value={String(liveOpenIncidents || activeIncidents.length)} sub={`${liveCriticalAlerts || criticalIncidents.length} critical`} trend="down" color="#ef4444" />
            <MetricCard label="Priority Alerts" value={String(posture?.totalAlerts ?? newAlerts.length)} sub={`${liveCriticalAlerts} critical`} trend="up" color="#f97316" />
            <MetricCard label="Pending Approvals" value={String(approvalQueue.length)} sub="require action" trend="stable" color="#f59e0b" />
            <MetricCard label="Unresolved Findings" value={String(unresolvedFindings || 0)} sub={unresolvedFindings > 0 ? "open/confirmed" : "—"} trend="stable" color="#8b5cf6" />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-5 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-white">Active Incidents</span>
                {(activeIncidents.length > 0 || liveOpenIncidents > 0) && <PulsingDot color="#ef4444" />}
              </div>
              <Link href="/incidents">
                <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {(activeIncidents.length > 0 ? activeIncidents.slice(0, 5) : ((): FirestormIncident[] => [
                { id: 1, title: "Lateral Movement — DC-PROD-03", severity: "critical", status: "investigation", createdAt: new Date(Date.now() - 1200000).toISOString(), assignedAnalyst: "J. Chen", detectedAt: new Date(Date.now() - 1200000) },
                { id: 2, title: "C2 Beacon — APT29 Infrastructure", severity: "critical", status: "triage", createdAt: new Date(Date.now() - 3600000).toISOString(), assignedAnalyst: "S. Park", detectedAt: new Date(Date.now() - 3600000) },
                { id: 3, title: "Data Exfil Pattern — S3 Bucket", severity: "high", status: "investigation", createdAt: new Date(Date.now() - 7200000).toISOString(), assignedAnalyst: "M. Rodriguez", detectedAt: new Date(Date.now() - 7200000) },
                { id: 4, title: "Brute Force — Admin Portal", severity: "high", status: "containment", createdAt: new Date(Date.now() - 10800000).toISOString(), assignedAnalyst: null, detectedAt: new Date(Date.now() - 10800000) },
                { id: 5, title: "Unauth Access — Config Mgmt", severity: "medium", status: "triage", createdAt: new Date(Date.now() - 18000000).toISOString(), assignedAnalyst: "L. Kim", detectedAt: new Date(Date.now() - 18000000) },
              ])()).map((inc: FirestormIncident) => {
                const sev = SEV_COLORS[inc.severity] ?? SEV_COLORS.medium;
                const age = Math.round((Date.now() - new Date(inc.detectedAt ?? inc.createdAt).getTime()) / 60000);
                const ageStr = age < 60 ? `${age}m` : `${Math.round(age / 60)}h`;
                return (
                  <Link key={inc.id} href={`/incidents`}>
                    <div className="px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", sev.bg)} style={{ backgroundColor: sev.dot }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/90 truncate">{inc.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("text-[9px] font-mono px-1 py-0.5 rounded border uppercase tracking-wider", STATUS_COLORS[inc.status])}>{inc.status}</span>
                            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{ageStr} ago</span>
                            {inc.assignedAnalyst ? (
                              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>→ {inc.assignedAnalyst}</span>
                            ) : (
                              <span className="text-[10px] text-amber-400/70">unassigned</span>
                            )}
                          </div>
                        </div>
                        <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase", sev.bg, sev.text, sev.border)}>{inc.severity}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white">Approval Queue</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">{approvalQueue.length}</span>
                {pendingActions && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>
                )}
              </div>
              <Link href="/response-orchestration">
                <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1">All <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {approvalQueue.map(item => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[11px] font-medium text-white/90 leading-snug">{item.action}</p>
                    <span className={cn("text-[8px] font-mono px-1 py-0.5 rounded border shrink-0 uppercase", SEV_COLORS[item.severity]?.bg, SEV_COLORS[item.severity]?.text, SEV_COLORS[item.severity]?.border)}>{item.severity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400/80 uppercase tracking-wider">approval_required</span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{item.requestedBy} · {item.requestedAt}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2.5">
                    <button className="flex-1 py-1 rounded text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                      Approve
                    </button>
                    <button className="flex-1 py-1 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {approvalQueue.length === 0 && (
                <div className="px-4 py-6 text-center text-[11px] text-white/30">No pending approvals</div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-white">Unresolved Findings</span>
              </div>
              <span className="text-[9px] font-mono text-white/30">{unresolvedFindings}</span>
            </div>
            <div className="px-4 py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl font-bold font-mono tabular-nums" style={{ color: unresolvedFindings > 5 ? "#ef4444" : unresolvedFindings > 0 ? "#f59e0b" : "#10b981" }}>
                  {unresolvedFindings}
                </div>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>open or confirmed</span>
                <Link href="/decision-console">
                  <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1 mt-2">Decision Console <ChevronRight className="w-3 h-3" /></span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-white">Recent Decisions</span>
                {recentDecisions && (
                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>
                )}
              </div>
              <Link href="/decision-console">
                <span className="text-[10px] text-blue-400/60 hover:text-blue-300 cursor-pointer flex items-center gap-1">Decision Console <ChevronRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {displayDecisions.map(dec => (
                <div key={dec.id} className="px-4 py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-white/90 mb-1">{dec.title}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{dec.analyst}</span>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{dec.at}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
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

          <div className="col-span-12 lg:col-span-5 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-white">Quick Stats</span>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-white/60">Total Alerts (all)</span>
                <span className="text-[11px] font-mono text-white/80">{posture?.totalAlerts ?? alerts.length}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-white/60">Open Incidents</span>
                <span className="text-[11px] font-mono text-white/80">{liveOpenIncidents}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-white/60">Critical Alerts</span>
                <span className="text-[11px] font-mono text-red-400">{liveCriticalAlerts}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-white/60">Unresolved Findings</span>
                <span className="text-[11px] font-mono text-amber-400">{unresolvedFindings}</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] text-white/60">Pending Actions</span>
                <span className="text-[11px] font-mono text-white/80">{approvalQueue.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
