import { useState } from "react";
import { BarChart3, Clock, TrendingUp, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useReviewMetrics } from "../../hooks/use-prism-review";

const DEMO_METRICS = {
  period: { days: 30, since: new Date(Date.now() - 30 * 86400000).toISOString() },
  avgReviewAgeHours: 14.2,
  throughputPerDay: 3.4,
  totalClosed: 103,
  approved: 74,
  rejected: 17,
  backlogSize: 22,
  backlogByType: {
    draft_review: 8,
    chronology_review: 4,
    evidence_review: 3,
    contradiction_review: 3,
    low_confidence_extraction_review: 2,
    safe_to_send_review: 1,
    safe_to_export_review: 1,
  },
  slaBreachCount: 5,
  avgContradictionResolutionHours: 28.5,
  avgLowConfidenceResolutionHours: 9.8,
  avgExportReadyTurnaroundHours: 3.2,
  avgApprovalWaitTimeHours: 18.4,
};

const TYPE_LABELS: Record<string, string> = {
  draft_review: "Draft Review",
  chronology_review: "Chronology",
  evidence_review: "Evidence",
  contradiction_review: "Contradiction",
  low_confidence_extraction_review: "Low Confidence",
  safe_to_send_review: "Safe to Send",
  safe_to_export_review: "Safe to Export",
  recovery_lien_review: "Recovery/Lien",
  approval_preparation_review: "Approval Prep",
};

function MetricCard({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: any }) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-slate-100">{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function BacklogBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  const color = pct >= 40 ? "#c45a4a" : pct >= 20 ? "#d4a054" : "#4a90b8";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[10px] text-slate-400 w-36 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-5 text-right">{count}</span>
    </div>
  );
}

export default function ReviewMetricsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useReviewMetrics(days);
  const m = data ?? DEMO_METRICS;
  const isLive = !!data;

  const maxBacklog = Math.max(...(Object.values(m.backlogByType ?? {}) as number[]));

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#d4a054]" />
            <h1 className="text-lg font-semibold text-slate-100">Review Metrics</h1>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isLive ? "bg-[#4a90b8]/10 text-[#4a90b8]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>
              {isLive ? "LIVE" : "DEMO"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Review throughput, backlog, SLA compliance, and resolution metrics</p>
        </div>
        <div className="flex gap-1">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${days === d ? "bg-[#d4a054]/15 text-[#d4a054]" : "text-slate-500 hover:text-slate-300"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Avg Review Age" value={`${m.avgReviewAgeHours}h`} sub="Hours from creation" color="#d4a054" icon={Clock} />
            <MetricCard label="Throughput" value={`${m.throughputPerDay}/day`} sub={`${m.totalClosed} closed in ${m.period.days}d`} color="#4a90b8" icon={TrendingUp} />
            <MetricCard label="Approved" value={m.approved} sub={`of ${m.totalClosed} closed items`} color="#4a90b8" icon={CheckCircle} />
            <MetricCard label="SLA Breaches" value={m.slaBreachCount} sub={`in last ${m.period.days} days`} color="#c45a4a" icon={AlertTriangle} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Rejection Rate" value={`${Math.round((m.rejected / Math.max(m.totalClosed, 1)) * 100)}%`} sub={`${m.rejected} items rejected`} color="#c45a4a" icon={XCircle} />
            <MetricCard label="Approval Wait" value={m.avgApprovalWaitTimeHours ? `${m.avgApprovalWaitTimeHours}h` : "—"} sub="Avg time to approval" color="#d4a054" icon={Clock} />
            <MetricCard label="Export Turnaround" value={m.avgExportReadyTurnaroundHours ? `${m.avgExportReadyTurnaroundHours}h` : "—"} sub="Approval to export" color="#4a90b8" icon={TrendingUp} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Backlog by Review Type</h3>
              <div className="space-y-0">
                {(Object.entries(m.backlogByType ?? {}) as [string, number][]).sort(([, a], [, b]) => b - a).map(([type, count]) => (
                  <BacklogBar key={type} label={TYPE_LABELS[type] ?? type} count={count} max={maxBacklog} />
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Total backlog</span>
                <span className="text-[10px] font-mono text-slate-300">{m.backlogSize}</span>
              </div>
            </div>

            <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Resolution Times</h3>
              <div className="space-y-3">
                {[
                  { label: "Contradiction Resolution", value: m.avgContradictionResolutionHours, color: "#c45a4a" },
                  { label: "Low-Confidence Resolution", value: m.avgLowConfidenceResolutionHours, color: "#d4a054" },
                  { label: "Export-Ready Turnaround", value: m.avgExportReadyTurnaroundHours, color: "#4a90b8" },
                  { label: "Approval Wait Time", value: m.avgApprovalWaitTimeHours, color: "#8b7ac8" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 flex-1">{s.label}</span>
                    {s.value ? (
                      <span className="text-[11px] font-mono" style={{ color: s.color }}>{s.value}h</span>
                    ) : (
                      <span className="text-[10px] text-slate-600">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
