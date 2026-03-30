import { useState } from "react";
import { useLocation } from "wouter";
import { Search, Clock, X, Users, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  signals,
  narrativeInsights,
  severityColors,
  signalTypeLabels,
  type BusinessSignal,
  type SignalSeverity,
  type SignalType,
} from "@/lib/business-data";

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SignalDetail({ signal, onClose }: { signal: BusinessSignal; onClose: () => void }) {
  const c = severityColors[signal.severity];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-[#0d1117] border-l border-white/10 shadow-2xl overflow-y-auto custom-scrollbar"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-white/5 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase", c.text, c.bg, c.border)}>
                {signal.severity}
              </span>
              <span className="text-[10px] text-slate-500">{signalTypeLabels[signal.type]}</span>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[10px] text-slate-500 font-mono">{signal.id}</span>
            </div>
            <h2 className="font-display font-semibold text-base text-white leading-snug">{signal.title}</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors shrink-0 mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Summary</div>
            <p className="text-sm text-slate-300 leading-relaxed">{signal.summary}</p>
          </div>

          <div className={cn("p-3 rounded-lg border", c.border, c.bg)}>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wide mb-1.5">Why it matters</div>
            <p className="text-sm text-white/90 leading-relaxed">{signal.whyItMatters}</p>
          </div>

          {signal.anomaly && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Anomaly Detected</div>
              <p className="text-sm text-amber-300/90 leading-relaxed">{signal.anomaly}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Value at Risk</div>
              <div className={cn("text-lg font-display font-bold", c.text)}>{formatCurrency(signal.valueAtRisk)}</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Affected Function</div>
              <div className="text-sm font-medium text-white">{signal.affectedFunction}</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Owner</div>
              <div className="text-sm font-medium text-white">{signal.owner}</div>
              <div className="text-[10px] text-slate-500">{signal.ownerTeam}</div>
            </div>
            <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Detected</div>
              <div className="text-sm font-medium text-white">{timeAgo(signal.detectedAt)}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Recommended Action
            </div>
            <p className="text-sm text-white/90 leading-relaxed">{signal.recommendedAction}</p>
          </div>

          {signal.sourceData && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Source Data</div>
              <div className="text-xs text-slate-400 font-mono bg-white/[0.02] px-3 py-2 rounded border border-white/5">{signal.sourceData}</div>
            </div>
          )}

          {signal.timeline && signal.timeline.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Event Timeline</div>
              <div className="space-y-2">
                {signal.timeline.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 text-[11px]">
                    <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", i === 0 ? "bg-slate-300" : c.dot)} />
                    <div className="flex-1">
                      <div className="text-slate-300">{t.event}</div>
                      <div className="text-slate-600 font-mono">{new Date(t.time).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {signal.relatedSignals && signal.relatedSignals.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Related Signals</div>
              <div className="flex flex-wrap gap-2">
                {signal.relatedSignals.map(id => (
                  <span key={id} className="text-[10px] font-mono px-2 py-1 rounded border border-white/10 text-slate-400 bg-white/[0.02]">{id}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const SEVERITY_ORDER: Record<SignalSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, stable: 4 };

export default function SignalsFeed() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const initId = params.get("id") || null;

  const [selectedId, setSelectedId] = useState<string | null>(initId);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SignalSeverity | "all">("all");
  const [typeFilter, setTypeFilter] = useState<SignalType | "all">("all");
  const [showNarrative, setShowNarrative] = useState(true);

  const selectedSignal = selectedId ? signals.find(s => s.id === selectedId) || null : null;

  const filtered = signals
    .filter(s => severityFilter === "all" || s.severity === severityFilter)
    .filter(s => typeFilter === "all" || s.type === typeFilter)
    .filter(s =>
      search === "" ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.affectedFunction.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerTeam.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const critCount = signals.filter(s => s.severity === "critical" && s.status === "active").length;
  const highCount = signals.filter(s => s.severity === "high" && s.status === "active").length;
  const totalVaR = signals.filter(s => s.status === "active").reduce((sum, s) => sum + s.valueAtRisk, 0);

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)] max-w-[1400px]">
      <div className={cn("flex flex-col min-w-0 transition-all", selectedSignal ? "w-1/2" : "flex-1")}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">{filtered.length} signals</span>
            <span className="flex items-center gap-1 text-red-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />{critCount} critical</span>
            <span className="flex items-center gap-1 text-orange-400">{highCount} high</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-mono">${(totalVaR / 1_000_000).toFixed(1)}M at risk</span>
          </div>
          <button
            onClick={() => setShowNarrative(!showNarrative)}
            className={cn("text-[10px] px-2.5 py-1.5 rounded border transition-all", showNarrative ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-400" : "border-white/10 text-slate-500 hover:text-white")}
          >
            Narrative Rail
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search signals..."
              className="w-full pl-8 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as SignalSeverity | "all")}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as SignalType | "all")}
            className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/40"
          >
            <option value="all">All Types</option>
            <option value="approval_latency">Approval Latency</option>
            <option value="stalled_workflow">Stalled Workflow</option>
            <option value="ownership_gap">Ownership Gap</option>
            <option value="forecast_drift">Forecast Drift</option>
            <option value="handoff_failure">Handoff Failure</option>
            <option value="pipeline_hygiene">Pipeline Hygiene</option>
            <option value="revenue_leakage">Revenue Leakage</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
          {filtered.map(signal => {
            const c = severityColors[signal.severity];
            const isSelected = signal.id === selectedId;
            return (
              <button
                key={signal.id}
                onClick={() => setSelectedId(isSelected ? null : signal.id)}
                className={cn(
                  "w-full text-left rounded-xl p-4 border transition-all",
                  isSelected ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10",
                  signal.status === "acknowledged" && "opacity-70"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    c.dot,
                    signal.severity === "critical" && "animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]"
                  )} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-medium text-white/90 leading-snug mb-1.5">{signal.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5 line-clamp-2">{signal.summary}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase", c.text, c.bg, c.border)}>
                        {signal.severity}
                      </span>
                      <span className="text-[10px] text-slate-500">{signalTypeLabels[signal.type]}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] text-slate-500">{signal.affectedFunction}</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><Users className="w-2.5 h-2.5" />{signal.owner}</span>
                      <span className="ml-auto text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{timeAgo(signal.detectedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-slate-500 line-clamp-1">{signal.recommendedAction.slice(0, 70)}...</span>
                      <span className={cn("text-[11px] font-mono font-semibold shrink-0 ml-2", c.text)}>{formatCurrency(signal.valueAtRisk)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">No signals match your filters</div>
          )}
        </div>
      </div>

      {showNarrative && !selectedSignal && (
        <div className="w-80 shrink-0 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-violet-400" />
            <h2 className="font-display font-semibold text-sm text-white">Narrative Intelligence</h2>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">Operating intelligence translated from raw signals into decision-ready language.</p>
          {narrativeInsights.map(ins => {
            const c = severityColors[ins.severity];
            return (
              <div key={ins.id} className={cn("p-4 rounded-xl border", c.border, c.bg)}>
                <div className="mb-2">
                  <div className="text-[10px] text-slate-500 mb-1">{ins.function} · {timeAgo(ins.detectedAt)}</div>
                  <h3 className="text-[12px] font-semibold text-white/90 leading-snug mb-2">{ins.title}</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{ins.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px]">
                    <span className={cn("font-mono font-semibold", c.text)}>{formatCurrency(ins.valueAtRisk)}</span>
                    <span className="text-slate-600">·</span>
                    <span className={cn(ins.trend === "worsening" ? "text-red-400" : ins.trend === "stable" ? "text-amber-400" : "text-emerald-400")}>
                      {ins.trend}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedSignal && (
        <SignalDetail signal={selectedSignal} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
