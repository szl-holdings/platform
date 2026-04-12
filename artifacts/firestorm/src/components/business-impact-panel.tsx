import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui";
import {
  DollarSign, Clock, AlertTriangle, Building2, ShieldAlert, TrendingDown,
  ChevronRight, FileText, Info, Zap, Activity, ArrowRight,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

interface BusinessImpact {
  incidentId: number;
  correlatedClient: {
    id: number;
    name: string;
    industry: string;
    tier: string;
    mrr: number;
    contractValue: number;
  } | null;
  slaStatus: {
    tier: string;
    responseTarget: string;
    resolutionTarget: string;
    breachThresholdMs: number;
    timeElapsedMs: number;
    timeRemainingMs: number;
    percentConsumed: number;
    breached: boolean;
    escalationTriggered: boolean;
  } | null;
  financialExposure: {
    revenueAtRisk: number;
    estimatedRemediationCost: number;
    slaBreachPenalty: number | null;
    totalExposure: number;
  };
  boardBrief: {
    headline: string;
    whatHappened: string;
    whoAffected: string;
    financialExposure: string;
    remediationStatus: string;
    timeline: string;
  } | null;
  correlationConfidence: number;
  generatedAt: string;
}

interface RevenueAtRisk {
  totalRevenueAtRisk: number;
  totalRemediationCost: number;
  totalExposure: number;
  activeIncidentCount: number;
  slaBreachedCount: number;
  criticalIncidentCount: number;
  impactedClients: number;
  breakdown: Array<{
    incidentId: number;
    incidentTitle: string;
    severity: string;
    clientName: string;
    revenueAtRisk: number;
    slaBreached: boolean;
  }>;
  computedAt: string;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMins = Math.floor(ms / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function SLACountdown({ slaStatus }: { slaStatus: NonNullable<BusinessImpact["slaStatus"]> }) {
  const [elapsed, setElapsed] = useState(slaStatus.timeElapsedMs);

  useEffect(() => {
    if (slaStatus.breached) return;
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [slaStatus.breached]);

  const remaining = Math.max(0, slaStatus.breachThresholdMs - elapsed);
  const pct = Math.min(100, (elapsed / slaStatus.breachThresholdMs) * 100);
  const breached = elapsed >= slaStatus.breachThresholdMs;
  const critical = pct > 80 && !breached;

  const barColor = breached ? "#ef4444" : critical ? "#f97316" : pct > 60 ? "#eab308" : "#10b981";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
          SLA Countdown
        </span>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase" style={{
          color: breached ? "#ef4444" : critical ? "#f97316" : "#10b981",
          borderColor: breached ? "rgba(239,68,68,0.3)" : critical ? "rgba(249,115,22,0.3)" : "rgba(16,185,129,0.3)",
          background: breached ? "rgba(239,68,68,0.08)" : critical ? "rgba(249,115,22,0.08)" : "rgba(16,185,129,0.08)",
        }}>
          {breached ? "BREACHED" : critical ? "CRITICAL" : "ON TRACK"}
        </span>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: barColor, transition: "width 0.3s ease" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" style={{ color: breached ? "#ef4444" : "rgba(255,255,255,0.4)" }} />
          <span className="text-[11px] font-mono tabular-nums" style={{ color: breached ? "#ef4444" : "rgba(255,255,255,0.6)" }}>
            {breached ? "SLA breached" : `${formatDuration(remaining)} remaining`}
          </span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
          Tier: {slaStatus.tier}
        </span>
      </div>
    </div>
  );
}

function BoardBriefModal({ brief, onClose }: { brief: NonNullable<BusinessImpact["boardBrief"]>; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: "#090C14", borderColor: "rgba(255,255,255,0.08)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-violet-400/60">Board Brief</span>
          </div>
          <h2 className="text-sm font-bold text-white leading-tight">{brief.headline}</h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          {[
            { label: "What Happened", content: brief.whatHappened },
            { label: "Who Is Affected", content: brief.whoAffected },
            { label: "Financial Exposure", content: brief.financialExposure },
            { label: "Remediation Status", content: brief.remediationStatus },
            { label: "Timeline", content: brief.timeline },
          ].map(({ label, content }) => (
            <div key={label}>
              <p className="text-[9px] font-mono uppercase tracking-[0.15em] mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{content}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="text-[9px] font-mono text-white/20">AUTO-GENERATED EXECUTIVE BRIEF</span>
          <button
            onClick={onClose}
            className="text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function BusinessImpactPanel({ incidentId, severity }: { incidentId: number; severity: string }) {
  const [showBoardBrief, setShowBoardBrief] = useState(false);

  const { data: impact, isLoading, isError } = useQuery<BusinessImpact>({
    queryKey: ["business-impact", incidentId],
    queryFn: () => apiFetch<BusinessImpact>(`/firestorm/incident-impact/${incidentId}`),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-3 rounded-full bg-white/5 w-32" />
        <div className="h-16 rounded-xl bg-white/5" />
        <div className="h-12 rounded-xl bg-white/5" />
      </div>
    );
  }

  if (isError || !impact) {
    return null;
  }

  const { correlatedClient, slaStatus, financialExposure, boardBrief, correlationConfidence } = impact;
  const isHighSeverity = severity === "critical" || severity === "high";

  return (
    <div className="space-y-4">
      {showBoardBrief && boardBrief && (
        <BoardBriefModal brief={boardBrief} onClose={() => setShowBoardBrief(false)} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: isHighSeverity ? "#ef4444" : "#f59e0b" }} />
          <span className="text-[9px] font-mono uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
            Business Impact
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-400/60">
            {Math.round(correlationConfidence * 100)}% confidence
          </span>
          {boardBrief && isHighSeverity && (
            <button
              onClick={() => setShowBoardBrief(true)}
              className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-lg transition-colors"
              style={{
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.2)",
                color: "#a78bfa",
              }}
            >
              <FileText className="w-2.5 h-2.5" /> Board Brief
            </button>
          )}
        </div>
      </div>

      {correlatedClient ? (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{correlatedClient.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{correlatedClient.industry}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{
                  background: correlatedClient.tier === "Platinum" ? "rgba(234,179,8,0.1)" : correlatedClient.tier === "Gold" ? "rgba(249,115,22,0.1)" : "rgba(100,116,139,0.1)",
                  color: correlatedClient.tier === "Platinum" ? "#ca8a04" : correlatedClient.tier === "Gold" ? "#ea580c" : "#94a3b8",
                }}>
                  {correlatedClient.tier}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-mono text-emerald-400">${correlatedClient.mrr.toLocaleString()}/mo</p>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>MRR</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <Info className="w-3.5 h-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>No managed client correlation identified</span>
        </div>
      )}

      {slaStatus && (
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <SLACountdown slaStatus={slaStatus} />
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Response Target</p>
              <p className="text-[11px] font-mono text-white/70">{slaStatus.responseTarget}</p>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Resolution Target</p>
              <p className="text-[11px] font-mono text-white/70">{slaStatus.resolutionTarget}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 space-y-2" style={{
        background: financialExposure.totalExposure > 100_000 ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.025)",
        border: `1px solid ${financialExposure.totalExposure > 100_000 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.05)"}`,
      }}>
        <div className="flex items-center gap-1.5 mb-3">
          <DollarSign className="w-3 h-3" style={{ color: financialExposure.totalExposure > 100_000 ? "#ef4444" : "#10b981" }} />
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Financial Exposure</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Revenue at Risk</span>
          <span className="text-[11px] font-mono font-semibold" style={{ color: "#f97316" }}>
            {formatCurrency(financialExposure.revenueAtRisk)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>Remediation Cost</span>
          <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>
            {formatCurrency(financialExposure.estimatedRemediationCost)}
          </span>
        </div>
        {financialExposure.slaBreachPenalty !== null && (
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>SLA Breach Penalty</span>
            <span className="text-[11px] font-mono text-red-400">
              {formatCurrency(financialExposure.slaBreachPenalty)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
          <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>Total Exposure</span>
          <span className="text-sm font-bold font-mono tabular-nums" style={{
            color: financialExposure.totalExposure > 500_000 ? "#ef4444" : financialExposure.totalExposure > 100_000 ? "#f97316" : "#10b981",
          }}>
            {formatCurrency(financialExposure.totalExposure)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function RevenueAtRiskTicker() {
  const { data } = useQuery<RevenueAtRisk>({
    queryKey: ["revenue-at-risk"],
    queryFn: () => apiFetch<RevenueAtRisk>("/firestorm/business-impact/revenue-at-risk"),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });

  if (!data || data.totalExposure === 0) return null;

  const critical = data.totalExposure > 1_000_000;
  const high = data.totalExposure > 250_000;

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        background: critical ? "rgba(239,68,68,0.05)" : high ? "rgba(249,115,22,0.05)" : "rgba(255,255,255,0.025)",
        borderColor: critical ? "rgba(239,68,68,0.18)" : high ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5" style={{ color: critical ? "#ef4444" : "#f97316" }} />
          <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.4)" }}>
            Revenue at Risk
          </span>
          {(data.slaBreachedCount > 0) && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              {data.slaBreachedCount} SLA BREACH
            </span>
          )}
        </div>
        <span className="text-[8px] font-mono text-white/20">LIVE</span>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-2xl font-bold font-mono tabular-nums" style={{
            color: critical ? "#ef4444" : high ? "#f97316" : "#10b981",
          }}>
            {formatCurrency(data.totalExposure)}
          </div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            across {data.activeIncidentCount} active incident{data.activeIncidentCount !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
            {data.impactedClients} client{data.impactedClients !== 1 ? "s" : ""} impacted
          </div>
          <div className="text-[10px] font-mono text-red-400/70">
            {data.criticalIncidentCount} critical
          </div>
        </div>
      </div>

      {data.breakdown.length > 0 && (
        <div className="space-y-1.5 border-t border-white/5 pt-3">
          {data.breakdown.slice(0, 3).map(item => (
            <div key={item.incidentId} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-1 rounded-full shrink-0" style={{
                  background: item.severity === "critical" ? "#ef4444" : item.severity === "high" ? "#f97316" : "#eab308",
                }} />
                <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {item.clientName}
                </span>
              </div>
              <span className="text-[10px] font-mono tabular-nums shrink-0 ml-2" style={{
                color: item.slaBreached ? "#ef4444" : "rgba(255,255,255,0.5)",
              }}>
                {formatCurrency(item.revenueAtRisk)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
