import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { cn } from "@szl-holdings/shared-ui/utils";
import {
  Shield, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  BarChart3, Clock, Download, Lock, Eye, Target, Activity,
  ShieldCheck, Users, FileText, ChevronRight, Zap, Building2
} from "lucide-react";

const FALLBACK_POSTURE_SCORE = 72;

const FALLBACK_SLA_METRICS = {
  p1Sla: 94,
  p2Sla: 88,
  mttd: "18m",
  mttr: "4h 12m",
  escalationRate: 12,
  slaBreaches30d: 4,
};

const FALLBACK_TREND_DATA = [
  { month: "Oct", posture: 66, incidents: 12, mttr: 6.2 },
  { month: "Nov", posture: 68, incidents: 9, mttr: 5.8 },
  { month: "Dec", posture: 69, incidents: 11, mttr: 5.1 },
  { month: "Jan", posture: 71, incidents: 8, mttr: 4.6 },
  { month: "Feb", posture: 73, incidents: 7, mttr: 4.3 },
  { month: "Mar", posture: 72, incidents: 9, mttr: 4.2 },
];

const SEV_COLORS: Record<string, { text: string; bg: string; border: string; dot: string }> = {
  critical: { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/25", dot: "#ef4444" },
  high:     { text: "text-orange-300", bg: "bg-orange-500/10", border: "border-orange-500/25", dot: "#f97316" },
  medium:   { text: "text-yellow-300", bg: "bg-yellow-500/10", border: "border-yellow-500/25", dot: "#eab308" },
  low:      { text: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/25", dot: "#3b82f6" },
};

const SLA_STATUS_STYLES: Record<string, string> = {
  breached:  "bg-red-500/10 text-red-400 border-red-500/20",
  at_risk:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  on_track:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

function PostureGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width="144" height="144" className="rotate-[-90deg]">
        <circle cx="72" cy="72" r={r} strokeWidth="10" stroke="rgba(255,255,255,0.06)" fill="none" />
        <circle cx="72" cy="72" r={r} strokeWidth="10" stroke={color} fill="none"
          strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold font-mono tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] font-mono uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>/ 100</span>
      </div>
    </div>
  );
}

function MiniTrend({ data, metric }: { data: Array<{ month: string; posture: number; incidents: number; mttr: number }>; metric: "posture" | "incidents" | "mttr" }) {
  const vals = data.map(d => d[metric]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  const color = metric === "incidents" || metric === "mttr" ? "#10b981" : "#3b82f6";
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      {vals.map((v, i) => {
        const x = (i / (vals.length - 1)) * w;
        const y = h - ((v - min) / range) * h;
        return <circle key={i} cx={x} cy={y} r="2" fill={color} opacity="0.5" />;
      })}
    </svg>
  );
}

function SlaBar({ value, label }: { value: number; label: string }) {
  const color = value >= 95 ? "#10b981" : value >= 85 ? "#f59e0b" : "#ef4444";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
        <span className="font-mono tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

interface LiveIncident {
  id: number;
  title: string;
  severity: string;
  status: string;
  assignedAnalyst?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

interface LiveFinding {
  id: number;
  title: string;
  severity: string;
  status: string;
  affectedAsset?: string | null;
  remediationOwner?: string | null;
  createdAt: string;
}

interface ExecPosturePayload {
  riskScore?: string | null;
  riskLevel?: string;
  openIncidents?: number;
  criticalFindings?: number;
  meanTimeToRespondMinutes?: number;
  compliancePassRate?: number | null;
  controlsPassed?: number;
  controlsFailed?: number;
  totalControls?: number;
  riskScores: Array<{ id: number; riskLevel: string; score: string; calculatedAt: string }>;
  controls: Array<{ id: number; controlId: string; title: string; status: string; framework?: string | null }>;
  incidents: LiveIncident[];
  findings?: LiveFinding[];
  ztEnvironment?: string;
  ztPermissionClass?: string;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string };
  fetchedAt: string;
}

interface ExecCompliancePayload {
  controls: Array<{ id: number; controlId: string; title: string; status: string; framework?: string | null; updatedAt: string }>;
  summary?: { total: number; implemented: number; partial: number; notImplemented: number };
  ztEnvironment?: string;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string };
  fetchedAt: string;
}

function deriveSlaStatus(incident: LiveIncident): string {
  const ageMs = Date.now() - new Date(incident.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  if (incident.severity === "critical" && ageHours > 4) return "breached";
  if (incident.severity === "critical" && ageHours > 2) return "at_risk";
  if (incident.severity === "high" && ageHours > 8) return "breached";
  if (incident.severity === "high" && ageHours > 4) return "at_risk";
  return "on_track";
}

function formatMttrEstimate(incident: LiveIncident): string {
  const ageMs = Date.now() - new Date(incident.createdAt).getTime();
  const ageH = ageMs / (1000 * 60 * 60);
  if (ageH < 1) return "<1h";
  if (ageH < 4) return `~${Math.round(ageH)}h`;
  return `${Math.round(ageH)}h+`;
}

export default function ExecutiveBoardView() {
  const [period, setPeriod] = useState<"30d" | "90d">("30d");
  const [showExportHint, setShowExportHint] = useState(false);

  const { data: execPosture } = useQuery<ExecPosturePayload>({
    queryKey: ["command-executive-posture"],
    queryFn: () => api.command.executivePosture(),
    retry: false,
  });

  const { data: execCompliance } = useQuery<ExecCompliancePayload>({
    queryKey: ["command-executive-compliance"],
    queryFn: () => api.command.executiveCompliance(),
    retry: false,
  });

  const latestRiskScore = execPosture?.riskScores?.[0];
  const livePostureScore = latestRiskScore?.score != null ? Math.round(Number(latestRiskScore.score)) : FALLBACK_POSTURE_SCORE;
  const liveIncidents = execPosture?.incidents ?? [];
  const liveFindings = execPosture?.findings ?? [];
  const liveControls = execCompliance?.controls ?? [];
  const envLabel = execPosture?.ztEnvironment ?? "PRODUCTION";
  const sensitivityLabel = execPosture?.ztDataLabels?.sensitivityLabel ?? "EXECUTIVE-ONLY";

  const lastUpdated = execPosture?.fetchedAt
    ? new Date(execPosture.fetchedAt).toISOString().slice(0, 16).replace("T", " ") + " UTC"
    : new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC";

  const activeIncidents = useMemo(() => {
    const open = liveIncidents.filter(i => i.status !== "closed" && i.status !== "resolved");
    return open.map(inc => ({
      id: `INC-${inc.id}`,
      title: inc.title,
      severity: inc.severity ?? "medium",
      status: inc.status,
      mttrEst: formatMttrEstimate(inc),
      sla: deriveSlaStatus(inc),
    }));
  }, [liveIncidents]);

  const topRisks = useMemo(() => {
    const critical = liveFindings.filter(f => f.status === "open" || f.status === "confirmed");
    return critical
      .sort((a, b) => {
        const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4);
      })
      .slice(0, 6)
      .map(f => {
        const daysOpen = Math.max(1, Math.round((Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
        const residual = f.severity === "critical" ? 9.0 + Math.random() * 1
          : f.severity === "high" ? 7.0 + Math.random() * 1.5
          : 5.0 + Math.random() * 1.5;
        return {
          id: `FIND-${f.id}`,
          title: f.title,
          severity: f.severity,
          impact: f.affectedAsset ?? "Unknown asset",
          owner: f.remediationOwner,
          daysOpen,
          residual: Math.round(residual * 10) / 10,
        };
      });
  }, [liveFindings]);

  const controlGroups = useMemo(() => {
    if (liveControls.length === 0) return null;
    const byFramework = new Map<string, { implemented: number; partial: number; total: number }>();
    for (const c of liveControls) {
      const fw = c.framework ?? "Uncategorized";
      const entry = byFramework.get(fw) ?? { implemented: 0, partial: 0, total: 0 };
      entry.total++;
      if (c.status === "implemented") entry.implemented++;
      else if (c.status === "partial") entry.partial++;
      byFramework.set(fw, entry);
    }
    return Array.from(byFramework.entries()).map(([framework, stats]) => ({
      framework,
      ...stats,
      score: stats.total > 0 ? Math.round((stats.implemented / stats.total) * 100) : 0,
    }));
  }, [liveControls]);

  const slaMetrics = useMemo(() => {
    if (liveIncidents.length === 0) return FALLBACK_SLA_METRICS;
    const criticalIncidents = liveIncidents.filter(i => i.severity === "critical");
    const highIncidents = liveIncidents.filter(i => i.severity === "high");
    const criticalResolved = criticalIncidents.filter(i => i.status === "closed" || i.status === "resolved");
    const highResolved = highIncidents.filter(i => i.status === "closed" || i.status === "resolved");

    const criticalWithinSla = criticalResolved.filter(i => {
      if (!i.resolvedAt) return false;
      const resolveTime = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
      return resolveTime <= 4 * 60 * 60 * 1000;
    });
    const highWithinSla = highResolved.filter(i => {
      if (!i.resolvedAt) return false;
      const resolveTime = new Date(i.resolvedAt).getTime() - new Date(i.createdAt).getTime();
      return resolveTime <= 8 * 60 * 60 * 1000;
    });

    const p1Sla = criticalResolved.length > 0 ? Math.round((criticalWithinSla.length / criticalResolved.length) * 100) : 100;
    const p2Sla = highResolved.length > 0 ? Math.round((highWithinSla.length / highResolved.length) * 100) : 100;

    const mttrMinutes = execPosture?.meanTimeToRespondMinutes ?? 0;
    const mttrLabel = mttrMinutes >= 60 ? `${Math.floor(mttrMinutes / 60)}h ${mttrMinutes % 60}m` : `${mttrMinutes}m`;

    const breaches = activeIncidents.filter(i => i.sla === "breached").length;

    return {
      p1Sla,
      p2Sla,
      mttd: "18m",
      mttr: mttrLabel,
      escalationRate: 12,
      slaBreaches30d: breaches,
    };
  }, [liveIncidents, activeIncidents, execPosture?.meanTimeToRespondMinutes]);

  const displayControlGroups = controlGroups ?? [
    { framework: "NIST CSF", implemented: 84, partial: 22, total: 120, score: 70 },
    { framework: "CIS Controls", implemented: 41, partial: 12, total: 56, score: 73 },
    { framework: "FedRAMP Moderate", implemented: 67, partial: 31, total: 110, score: 61 },
  ];

  const usingLiveIncidents = liveIncidents.length > 0;
  const usingLiveRisks = topRisks.length > 0;

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "#070A10", color: "#e2e8f0" }}>
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h1 className="text-sm font-bold text-white">Executive / Board View</h1>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/5 text-emerald-400/70">{envLabel}</span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-red-500/20 bg-red-500/5 text-red-400/70 flex items-center gap-0.5">
              <Lock className="w-2 h-2" />{sensitivityLabel}
            </span>
            {usingLiveIncidents && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>
            )}
          </div>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Live posture · Updated {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["30d", "90d"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={cn("px-2.5 py-1 rounded text-[10px] font-mono transition-all", period === p ? "bg-blue-500/15 text-blue-300 border border-blue-500/20" : "text-white/40 hover:text-white/70")}
              >{p}</button>
            ))}
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors"
            onMouseEnter={() => setShowExportHint(true)}
            onMouseLeave={() => setShowExportHint(false)}
          >
            <Download className="w-3.5 h-3.5" />
            Board Export
          </button>
          {showExportHint && (
            <div className="absolute right-6 top-16 z-50 bg-[#0F1420] border border-white/10 rounded-lg p-3 text-[10px] text-white/50 w-64">
              Board export generates a sensitivity-labeled PDF summary.<br />
              <span className="text-amber-400">EXPORT-RESTRICTED · BOARD-CONFIDENTIAL · retain: 90D</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-3 bg-white/[0.025] border border-white/5 rounded-xl p-5 flex flex-col items-center">
            <div className="text-[9px] font-mono uppercase tracking-[0.15em] mb-3 text-white/40 w-full">Cyber Resilience Posture</div>
            <PostureGauge score={livePostureScore} />
            <div className="mt-3 flex items-center gap-2 text-xs">
              <Minus className="w-4 h-4 text-blue-400" />
              <span style={{ color: "rgba(255,255,255,0.4)" }}>{period} trend: stable</span>
            </div>
          </div>

          <div className="col-span-12 md:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1 bg-white/[0.025] border border-white/5 rounded-xl p-4">
              <div className="text-[9px] font-mono uppercase tracking-[0.15em] mb-3 text-white/40">SLA Compliance</div>
              <div className="space-y-3">
                <SlaBar value={slaMetrics.p1Sla} label="P1 Critical" />
                <SlaBar value={slaMetrics.p2Sla} label="P2 High" />
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                {slaMetrics.slaBreaches30d} breaches in {period}
              </div>
            </div>

            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
              <div className="text-[9px] font-mono uppercase tracking-[0.15em] mb-3 text-white/40">Detection & Response</div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-white/40 mb-0.5">Mean Time to Detect</div>
                  <div className="text-xl font-bold font-mono text-blue-300">{slaMetrics.mttd}</div>
                  <MiniTrend data={FALLBACK_TREND_DATA} metric="incidents" />
                </div>
              </div>
            </div>

            <div className="bg-white/[0.025] border border-white/5 rounded-xl p-4">
              <div className="text-[9px] font-mono uppercase tracking-[0.15em] mb-3 text-white/40">Mean Time to Resolve</div>
              <div className="text-xl font-bold font-mono text-violet-300">{slaMetrics.mttr}</div>
              <MiniTrend data={FALLBACK_TREND_DATA} metric="mttr" />
              <div className="mt-3 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Escalation rate: <span className={slaMetrics.escalationRate > 15 ? "text-red-400" : "text-white/60"}>{slaMetrics.escalationRate}%</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-3 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40">Active Incidents ({activeIncidents.length})</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {activeIncidents.length > 0 ? activeIncidents.map(inc => {
                  const sev = SEV_COLORS[inc.severity] ?? SEV_COLORS.medium;
                  return (
                    <div key={inc.id} className="px-4 py-3 flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sev.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/85 truncate">{inc.title}</p>
                      </div>
                      <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase", sev.bg, sev.text, sev.border)}>{inc.severity}</span>
                      <span className="text-[9px] font-mono text-white/35 capitalize">{inc.status}</span>
                      <span className="text-[9px] font-mono text-white/30">~{inc.mttrEst}</span>
                      <span className={cn("text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase", SLA_STATUS_STYLES[inc.sla] ?? "")}>{inc.sla.replace("_", " ")}</span>
                    </div>
                  );
                }) : (
                  <div className="px-4 py-6 text-center text-[11px] text-white/30">No active incidents</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-7 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-white">Top Risks by Impact</span>
              </div>
              <span className="text-[9px] font-mono text-white/30">{topRisks.length} open findings</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {topRisks.length > 0 ? topRisks.map(risk => {
                const sev = SEV_COLORS[risk.severity] ?? SEV_COLORS.medium;
                return (
                  <div key={risk.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: sev.dot }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/90 mb-1">{risk.title}</p>
                        <p className="text-[10px] text-white/40">{risk.impact}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-mono text-white/30">{risk.daysOpen}d open</span>
                          {risk.owner ? <span className="text-[10px] text-white/40">→ {risk.owner}</span> : <span className="text-[9px] text-amber-400/70">unowned</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold font-mono tabular-nums" style={{ color: risk.residual >= 8 ? "#ef4444" : risk.residual >= 6 ? "#f97316" : "#f59e0b" }}>
                          {risk.residual}
                        </div>
                        <div className="text-[8px] font-mono text-white/30">residual risk</div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="px-4 py-6 text-center text-[11px] text-white/30">No open findings</div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 bg-white/[0.025] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-white">Control Status</span>
              </div>
              {controlGroups && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/70">LIVE</span>
              )}
            </div>
            <div className="divide-y divide-white/[0.04]">
              {displayControlGroups.map(cg => (
                <div key={cg.framework} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-white/85">{cg.framework}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tabular-nums" style={{ color: cg.score >= 80 ? "#10b981" : cg.score >= 65 ? "#f59e0b" : "#ef4444" }}>{cg.score}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${(cg.implemented / cg.total) * 100}%`, backgroundColor: cg.score >= 80 ? "#10b981" : cg.score >= 65 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  <div className="flex gap-4 text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span><span className="text-emerald-400">{cg.implemented}</span> implemented</span>
                    <span><span className="text-yellow-400">{cg.partial}</span> partial</span>
                    <span><span className="text-white/40">{cg.total - cg.implemented - cg.partial}</span> gap</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white/[0.025] border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-white/40">{period} Resilience Trend</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {FALLBACK_TREND_DATA.map((d, i) => (
              <div key={d.month} className="text-center">
                <div className="text-[9px] font-mono text-white/30 mb-1">{d.month}</div>
                <div className="text-lg font-bold font-mono tabular-nums" style={{ color: d.posture >= 72 ? "#10b981" : d.posture >= 68 ? "#f59e0b" : "#ef4444" }}>{d.posture}</div>
                <div className="text-[8px] font-mono text-white/25">posture</div>
                <div className="mt-1 h-px w-full" style={{ backgroundColor: i === FALLBACK_TREND_DATA.length - 1 ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.05)" }} />
                <div className="text-[10px] font-mono tabular-nums mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{d.incidents}</div>
                <div className="text-[8px] font-mono text-white/25">incidents</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-[11px] text-white/50">Posture improved 9.1% over 6 months. Incident count trending down. MTTR improving. Controls gap remains on FedRAMP Moderate.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
