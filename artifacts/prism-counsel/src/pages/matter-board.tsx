import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Scale, AlertTriangle, Clock, Filter, ChevronDown, Lock, Shield, Eye } from "lucide-react";
import { SEED_MATTERS, getPressureColor, getPressureLabel, getStatusColor, getPrivilegeColor, formatCurrency, formatDeadline, daysUntil } from "@/data/matters";
import type { MatterStatus, MatterType, PrivilegeLevel } from "@/data/matters";

const ACCENT = "#a78bfa";

const STATUS_OPTIONS: { value: MatterStatus | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "escalated", label: "Escalated" },
  { value: "pending", label: "Pending" },
  { value: "on-hold", label: "On Hold" },
  { value: "closed", label: "Closed" },
];

const TYPE_OPTIONS: { value: MatterType | "all"; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "litigation", label: "Litigation" },
  { value: "ip", label: "Intellectual Property" },
  { value: "transaction", label: "Transaction" },
  { value: "regulatory", label: "Regulatory" },
  { value: "employment", label: "Employment" },
  { value: "contract", label: "Contract" },
  { value: "real-estate", label: "Real Estate" },
];

function PressureMeter({ score }: { score: number }) {
  const color = getPressureColor(score);
  const isCritical = score >= 90;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/30">Pressure</span>
        <span className={`font-mono font-bold ${isCritical ? "pressure-critical" : ""}`} style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className={`h-full rounded-full transition-all ${isCritical ? "pressure-critical" : ""}`}
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>{getPressureLabel(score)}</p>
    </div>
  );
}

export default function MatterBoard() {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<MatterStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<MatterType | "all">("all");
  const [sortBy, setSortBy] = useState<"pressure" | "deadline" | "exposure">("pressure");
  const [showFilters, setShowFilters] = useState(false);

  const totalExposure = SEED_MATTERS.reduce((s, m) => s + (m.estimatedExposure || 0), 0);
  const criticalCount = SEED_MATTERS.filter((m) => m.pressureScore >= 90).length;
  const overdueObligations = SEED_MATTERS.flatMap((m) => m.obligations).filter((o) => o.status === "overdue" || o.status === "at-risk").length;

  const filtered = useMemo(() => {
    let ms = SEED_MATTERS;
    if (statusFilter !== "all") ms = ms.filter((m) => m.status === statusFilter);
    if (typeFilter !== "all") ms = ms.filter((m) => m.type === typeFilter);
    return [...ms].sort((a, b) => {
      if (sortBy === "pressure") return b.pressureScore - a.pressureScore;
      if (sortBy === "deadline") return daysUntil(a.nextDeadline) - daysUntil(b.nextDeadline);
      return (b.estimatedExposure || 0) - (a.estimatedExposure || 0);
    });
  }, [statusFilter, typeFilter, sortBy]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold font-display text-white/90">Matter Board</h1>
          <p className="text-xs text-white/30 mt-0.5">{SEED_MATTERS.length} active matters · {criticalCount} critical</p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all"
        >
          <Filter className="w-3 h-3" />
          Filters
          <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Matters", value: String(SEED_MATTERS.length), sub: `${criticalCount} critical` },
          { label: "Aggregate Exposure", value: formatCurrency(totalExposure), sub: "across all matters" },
          { label: "At-Risk Obligations", value: String(overdueObligations), sub: "need attention now" },
          { label: "Next Deadline", value: formatDeadline(SEED_MATTERS.sort((a, b) => daysUntil(a.nextDeadline) - daysUntil(b.nextDeadline))[0].nextDeadline), sub: SEED_MATTERS.sort((a, b) => daysUntil(a.nextDeadline) - daysUntil(b.nextDeadline))[0].name.split(" — ")[0] },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
            <p className="text-xl font-semibold font-display" style={{ color: ACCENT }}>{s.value}</p>
            <p className="text-[10px] text-white/20 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-white/5" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MatterStatus | "all")}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none focus:border-purple-500/40"
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MatterType | "all")}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none focus:border-purple-500/40"
            >
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-white/30 uppercase tracking-wider">Sort</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "pressure" | "deadline" | "exposure")}
              className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white/70 focus:outline-none focus:border-purple-500/40"
            >
              <option value="pressure">Pressure Score</option>
              <option value="deadline">Next Deadline</option>
              <option value="exposure">Exposure</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((matter) => {
          const daysLeft = daysUntil(matter.nextDeadline);
          const pColor = getPressureColor(matter.pressureScore);
          const sColor = getStatusColor(matter.status);
          const privColor = getPrivilegeColor(matter.privilegeLevel);
          const openObligs = matter.obligations.filter((o) => o.status !== "complete");
          const atRisk = matter.obligations.filter((o) => o.status === "at-risk" || o.status === "overdue");

          return (
            <div
              key={matter.id}
              onClick={() => navigate(`/obligation-graph/${matter.id}`)}
              className="rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-xs font-semibold text-white/85 leading-snug truncate group-hover:text-white transition-colors">{matter.name}</p>
                  <p className="text-[10px] text-white/30 mt-0.5 font-mono">{matter.matterNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${sColor}20`, color: sColor }}>
                    {matter.status}
                  </span>
                  {matter.wall.enabled && (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full privilege-glow" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <Lock className="w-2 h-2" />
                      Wall
                    </span>
                  )}
                </div>
              </div>

              <PressureMeter score={matter.pressureScore} />

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Clock className={`w-2.5 h-2.5 shrink-0 ${daysLeft <= 3 ? "text-red-400" : daysLeft <= 7 ? "text-orange-400" : "text-white/30"}`} />
                  <span className={`font-medium ${daysLeft <= 3 ? "text-red-400" : daysLeft <= 7 ? "text-orange-400" : "text-white/40"}`}>
                    {formatDeadline(matter.nextDeadline)}
                  </span>
                  <span className="text-white/20 truncate">· {matter.nextDeadlineLabel}</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30">{openObligs.length} obligations open</span>
                    {atRisk.length > 0 && (
                      <span className="flex items-center gap-1 text-orange-400">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {atRisk.length} at risk
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${privColor}20`, color: privColor }}>
                    {matter.privilegeLevel}
                  </span>
                </div>

                {matter.estimatedExposure && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/20">Exposure</span>
                    <span className="font-mono text-white/60">{formatCurrency(matter.estimatedExposure)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/20">Lead Counsel</span>
                  <span className="text-white/50">{matter.leadCounsel}</span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/20">Jurisdiction</span>
                  <span className="text-white/40 truncate max-w-[140px] text-right">{matter.jurisdiction}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {matter.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.08)", color: "rgba(167,139,250,0.6)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg border border-white/5 text-[11px] text-white/20" style={{ background: "rgba(255,255,255,0.01)" }}>
        <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: ACCENT }} />
        All matters subject to attorney-client privilege. Access logged. Do not share outside approved parties.
        <Eye className="w-3 h-3 ml-auto shrink-0" style={{ color: ACCENT }} />
      </div>
    </div>
  );
}
