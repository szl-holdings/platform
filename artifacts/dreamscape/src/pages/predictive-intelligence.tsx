import { PREDICTIONS, formatCurrency, getSeverityColor, GOLDEN_FLOW_CORRELATION_ID } from "@workspace/shared-ui/core-observability-data";
import { Brain, ExternalLink, ArrowRight, Activity, Zap } from "lucide-react";

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "#10b981" : value >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-mono font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function PredictiveIntelligence() {
  const highConf = PREDICTIONS.filter(p => p.confidence >= 80);
  const medConf = PREDICTIONS.filter(p => p.confidence >= 60 && p.confidence < 80);
  const lowConf = PREDICTIONS.filter(p => p.confidence < 60);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8b5cf6" }}>Alloy · Predictive Intelligence</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Predictive Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Confidence-weighted predictions derived from Beacon detections, Lyte signals, and historical patterns.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Predictions", value: PREDICTIONS.length, color: "#8b5cf6" },
          { label: "High Confidence (≥80%)", value: highConf.length, color: "#10b981" },
          { label: "Avg Confidence", value: `${Math.round(PREDICTIONS.reduce((s, p) => s + p.confidence, 0) / PREDICTIONS.length)}%`, color: "#8b5cf6" },
          { label: "Total Value Modeled", value: formatCurrency(PREDICTIONS.reduce((s, p) => s + p.impact_estimate, 0)), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {PREDICTIONS.map(p => (
          <div key={p.id} className="rounded-xl border p-5" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.03)" }}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                    color: p.confidence >= 80 ? "#10b981" : p.confidence >= 60 ? "#f59e0b" : "#ef4444",
                    background: p.confidence >= 80 ? "rgba(16,185,129,0.12)" : p.confidence >= 60 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                    border: `1px solid ${p.confidence >= 80 ? "rgba(16,185,129,0.25)" : p.confidence >= 60 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)"}`,
                  }}>{p.confidence >= 80 ? "HIGH CONFIDENCE" : p.confidence >= 60 ? "MEDIUM" : "LOW"}</span>
                  <span className="text-[9px] font-medium uppercase px-1 py-0.5 rounded" style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}>{p.category}</span>
                  {p.correlation_id === GOLDEN_FLOW_CORRELATION_ID && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}>Golden Flow</span>
                  )}
                </div>
                <div className="text-sm font-semibold text-white mb-1">{p.title}</div>
                <div className="text-[11px] leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{p.rationale}</div>
                <div className="text-[10px] font-medium" style={{ color: "#10b981" }}>Recommended: {p.recommended_action}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-lg font-bold mb-0.5" style={{ color: "#f59e0b" }}>{formatCurrency(p.impact_estimate)}</div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>modeled impact</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Confidence Score</div>
              <ConfidenceBar value={p.confidence} />
            </div>

            {p.driving_signals.length > 0 && (
              <div className="mb-4">
                <div className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>Signal Inputs from Beacon</div>
                <div className="flex flex-wrap gap-1.5">
                  {p.driving_signals.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: "#0ea5e9", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <a href="/lyte-command-center/" className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                Route in Lyte <ArrowRight className="w-3 h-3" />
              </a>
              <a href="/alloy/" className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                Execute in AlloyScape <ArrowRight className="w-3 h-3" />
              </a>
              <a href="/explainability" className="text-[9px] px-2.5 py-1.5 rounded-lg font-medium hover:opacity-80" style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                Why? →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
