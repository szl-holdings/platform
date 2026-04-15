import { useState } from "react";
import { Boxes, Play, GitBranch, TrendingUp, TrendingDown, BarChart3, Brain, Settings, Plus, Trash2 } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

interface Scenario {
  id: string;
  name: string;
  description: string;
  variables: { name: string; baseline: number; modified: number; unit: string }[];
  predictedOutcome: string;
  confidence: number;
  impact: "positive" | "negative" | "neutral";
  delta: string;
}

const scenarios: Scenario[] = [
  {
    id: "SC-001", name: "Aggressive Growth", description: "Increase marketing spend by 40% with expanded sales team",
    variables: [
      { name: "Marketing Budget", baseline: 250000, modified: 350000, unit: "$" },
      { name: "Sales Headcount", baseline: 12, modified: 18, unit: "people" },
      { name: "Customer Acquisition Cost", baseline: 480, modified: 420, unit: "$" },
    ],
    predictedOutcome: "Revenue increase to $3.1M", confidence: 0.82, impact: "positive", delta: "+29%",
  },
  {
    id: "SC-002", name: "Cost Optimization", description: "Reduce infrastructure costs through right-sizing and automation",
    variables: [
      { name: "Cloud Spend", baseline: 85000, modified: 62000, unit: "$/mo" },
      { name: "Automation Coverage", baseline: 45, modified: 78, unit: "%" },
      { name: "Team Size", baseline: 8, modified: 6, unit: "engineers" },
    ],
    predictedOutcome: "27% cost reduction, margin +4.2pp", confidence: 0.89, impact: "positive", delta: "-27% costs",
  },
  {
    id: "SC-003", name: "Market Downturn", description: "Simulated 15% market contraction scenario",
    variables: [
      { name: "Market Size", baseline: 100, modified: 85, unit: "% of current" },
      { name: "Churn Rate", baseline: 3.2, modified: 5.8, unit: "%" },
      { name: "New MRR", baseline: 120000, modified: 78000, unit: "$/mo" },
    ],
    predictedOutcome: "Revenue decline to $1.8M, 8-month runway", confidence: 0.76, impact: "negative", delta: "-25%",
  },
  {
    id: "SC-004", name: "Product-Led Growth", description: "Shift to PLG with freemium tier and self-serve onboarding",
    variables: [
      { name: "Free Tier Users", baseline: 0, modified: 15000, unit: "users" },
      { name: "Conversion Rate", baseline: 0, modified: 3.5, unit: "%" },
      { name: "Support Cost", baseline: 45000, modified: 62000, unit: "$/mo" },
    ],
    predictedOutcome: "525 new paid users, +$630K ARR by Q4", confidence: 0.71, impact: "positive", delta: "+$630K",
  },
];

export default function ScenarioBuilder() {
  const [selected, setSelected] = useState<string>(scenarios[0].id);
  const active = scenarios.find(s => s.id === selected)!;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Boxes className="w-6 h-6 text-primary" />
          Scenario Builder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Parameter ranges, counterfactual simulations, and outcome distributions side-by-side</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {scenarios.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className={cn("bg-card/60 border rounded-xl p-4 text-left transition-all",
              selected === s.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
            )}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-muted-foreground">{s.id}</span>
              <span className={cn("w-2 h-2 rounded-full",
                s.impact === "positive" ? "bg-emerald-400" :
                s.impact === "negative" ? "bg-red-400" : "bg-amber-400"
              )} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{s.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Predicted Outcome</p>
          <p className="text-lg font-bold text-foreground">{active.predictedOutcome}</p>
          <span className={cn("inline-flex items-center gap-1 mt-2 text-sm font-medium",
            active.impact === "positive" ? "text-emerald-400" :
            active.impact === "negative" ? "text-red-400" : "text-amber-400"
          )}>
            {active.impact === "positive" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {active.delta}
          </span>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Model Confidence</p>
          <p className="text-3xl font-bold text-foreground">{(active.confidence * 100).toFixed(0)}%</p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full",
              active.confidence >= 0.85 ? "bg-emerald-400" :
              active.confidence >= 0.75 ? "bg-cyan-400" : "bg-amber-400"
            )} style={{ width: `${active.confidence * 100}%` }} />
          </div>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Variables Modified</p>
          <p className="text-3xl font-bold text-foreground">{active.variables.length}</p>
          <p className="text-xs text-muted-foreground mt-1">parameters adjusted from baseline</p>
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Variable Adjustments</h3>
        <div className="space-y-4">
          {active.variables.map((v, i) => {
            const change = ((v.modified - v.baseline) / v.baseline * 100).toFixed(1);
            const isIncrease = v.modified > v.baseline;
            return (
              <div key={i} className="flex items-center gap-6 py-3 border-b border-border/50 last:border-0">
                <div className="w-48 shrink-0">
                  <p className="text-sm font-medium text-foreground">{v.name}</p>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-right w-32">
                    <p className="text-xs text-muted-foreground">Baseline</p>
                    <p className="text-sm font-mono text-foreground">{v.baseline.toLocaleString()} {v.unit}</p>
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="h-px flex-1 bg-border" />
                    <span className={cn("px-3 py-1 rounded-full text-xs font-mono mx-2",
                      isIncrease ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                    )}>
                      {isIncrease ? "+" : ""}{change}%
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="w-32">
                    <p className="text-xs text-muted-foreground">Modified</p>
                    <p className="text-sm font-mono text-foreground font-semibold">{v.modified.toLocaleString()} {v.unit}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
