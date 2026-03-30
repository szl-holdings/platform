import { PREDICTIONS, formatCurrency } from "@workspace/shared-ui/core-observability-data";
import { GitBranch, ExternalLink, Info } from "lucide-react";

const EXPLAINABILITY: Record<string, {
  factors: { name: string; weight: number; direction: "positive" | "negative" }[];
  data_sources: string[];
  model_type: string;
  training_period: string;
  last_updated: string;
}> = {
  "pred-001": {
    factors: [
      { name: "Approval SLA breach (48h+)", weight: 42, direction: "negative" },
      { name: "Legal team capacity (94%)", weight: 28, direction: "negative" },
      { name: "Q1 close proximity (6 days)", weight: 18, direction: "negative" },
      { name: "Contract value tier (Enterprise)", weight: 9, direction: "negative" },
      { name: "Historical close rate Q1", weight: 3, direction: "positive" },
    ],
    data_sources: ["Beacon event stream", "HRIS capacity data", "CRM deal history", "Finance calendar"],
    model_type: "Gradient Boosted Regression + Rule Engine",
    training_period: "24 months",
    last_updated: "2026-03-29",
  },
  "pred-002": {
    factors: [
      { name: "Compliance step unowned (6 days)", weight: 51, direction: "negative" },
      { name: "Downstream workflow count (6)", weight: 27, direction: "negative" },
      { name: "Team reorg timeline match", weight: 15, direction: "negative" },
      { name: "Historical similar gaps", weight: 7, direction: "negative" },
    ],
    data_sources: ["Beacon ownership events", "Workflow DAG metadata", "HR transition records"],
    model_type: "Causal Graph Model",
    training_period: "18 months",
    last_updated: "2026-03-28",
  },
  "pred-003": {
    factors: [
      { name: "NPS drop (-42 points)", weight: 38, direction: "negative" },
      { name: "Usage decline (35%)", weight: 29, direction: "negative" },
      { name: "Competitive offer confirmed", weight: 22, direction: "negative" },
      { name: "No exec engagement logged", weight: 11, direction: "negative" },
    ],
    data_sources: ["NPS survey data", "Product usage analytics", "CRM activity log", "Competitor intelligence"],
    model_type: "Churn Propensity Neural Net",
    training_period: "36 months",
    last_updated: "2026-03-30",
  },
};

export default function ModelExplainability() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8b5cf6" }}>Nimbus · Model Explainability</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Model Explainability</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Why Nimbus made each prediction — factor weights, data sources, and confidence drivers.</p>
      </div>

      <div className="space-y-6">
        {PREDICTIONS.map(p => {
          const exp = EXPLAINABILITY[p.id];
          if (!exp) return null;

          return (
            <div key={p.id} className="rounded-xl border p-5" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.02)" }}>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-sm font-semibold text-white mb-0.5">{p.title}</div>
                  <div className="text-[10px] flex items-center gap-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                    <span>Model: {exp.model_type}</span>
                    <span>Training: {exp.training_period}</span>
                    <span>Updated: {exp.last_updated}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: p.confidence >= 80 ? "#10b981" : "#f59e0b" }}>{p.confidence}%</div>
                  <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>confidence</div>
                </div>
              </div>

              <div className="mb-5">
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Factor Weights</div>
                <div className="space-y-2">
                  {exp.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="text-[10px] w-48 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{f.name}</div>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="h-2 rounded-full transition-all" style={{
                          width: `${f.weight}%`,
                          background: f.direction === "negative" ? "rgba(239,68,68,0.7)" : "rgba(16,185,129,0.7)",
                        }} />
                      </div>
                      <div className="text-[10px] font-mono w-8 text-right" style={{ color: f.direction === "negative" ? "#ef4444" : "#10b981" }}>{f.weight}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Data Sources</div>
                <div className="flex flex-wrap gap-1.5">
                  {exp.data_sources.map((ds, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>{ds}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a href="/" className="text-[9px] px-2.5 py-1.5 rounded font-medium hover:opacity-80" style={{ color: "#8b5cf6", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  View Prediction
                </a>
                <a href="/lyte-command-center/" className="text-[9px] px-2.5 py-1.5 rounded font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <ExternalLink className="w-3 h-3" /> Route in Lyte
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
