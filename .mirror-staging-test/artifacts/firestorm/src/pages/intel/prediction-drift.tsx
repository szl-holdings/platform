import { useState } from "react";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle2, BarChart3, Clock, Target } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const driftData = [
  { model: "DeepForecaster v3.2", metric: "MAE", current: 0.032, baseline: 0.028, drift: 14.3, status: "warning", history: [2.1, 2.4, 2.8, 3.0, 3.2, 3.1, 3.2] },
  { model: "NeuralSentiment v2.1", metric: "F1-Score", current: 0.871, baseline: 0.892, drift: -2.4, status: "stable", history: [89.2, 88.9, 88.5, 87.8, 87.4, 87.2, 87.1] },
  { model: "TimeSeriesNet v4.0", metric: "RMSE", current: 0.045, baseline: 0.041, drift: 9.8, status: "stable", history: [4.1, 4.2, 4.1, 4.3, 4.4, 4.5, 4.5] },
  { model: "RiskAnalyzer v1.8", metric: "AUC-ROC", current: 0.823, baseline: 0.891, drift: -7.6, status: "critical", history: [89.1, 88.2, 87.0, 85.5, 84.1, 83.2, 82.3] },
  { model: "AnomalyDetector v2.5", metric: "Precision", current: 0.912, baseline: 0.918, drift: -0.7, status: "stable", history: [91.8, 91.7, 91.5, 91.4, 91.3, 91.2, 91.2] },
  { model: "CausalInference v1.3", metric: "R²", current: 0.847, baseline: 0.872, drift: -2.9, status: "warning", history: [87.2, 86.8, 86.2, 85.7, 85.1, 84.9, 84.7] },
  { model: "EnsembleStack v2.0", metric: "MAPE", current: 0.058, baseline: 0.052, drift: 11.5, status: "warning", history: [5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8] },
];

const timeLabels = ["7d", "6d", "5d", "4d", "3d", "2d", "1d"];

function MiniSparkline({ data, status }: { data: number[]; status: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 32;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const color = status === "critical" ? "#f87171" : status === "warning" ? "#fbbf24" : "#34d399";

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PredictionDrift() {
  const stableCount = driftData.filter(d => d.status === "stable").length;
  const warningCount = driftData.filter(d => d.status === "warning").length;
  const criticalCount = driftData.filter(d => d.status === "critical").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Activity className="w-6 h-6 text-primary" />
          Prediction Drift Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Model drift detection and degradation alerting before it impacts predictions</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-400/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stableCount}</p>
            <p className="text-xs text-muted-foreground">Stable Models</p>
          </div>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{warningCount}</p>
            <p className="text-xs text-muted-foreground">Warning</p>
          </div>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-400/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{criticalCount}</p>
            <p className="text-xs text-muted-foreground">Critical Drift</p>
          </div>
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Model</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Metric</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Baseline</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Current</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Drift</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Trend (7d)</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {driftData.map((d, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{d.model}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{d.metric}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{d.baseline}</td>
                <td className="p-4 text-sm text-foreground font-mono">{d.current}</td>
                <td className="p-4">
                  <span className={cn("flex items-center gap-1 text-sm font-mono",
                    Math.abs(d.drift) <= 3 ? "text-emerald-400" :
                    Math.abs(d.drift) <= 10 ? "text-amber-400" : "text-red-400"
                  )}>
                    {d.drift > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {d.drift > 0 ? "+" : ""}{d.drift}%
                  </span>
                </td>
                <td className="p-4"><MiniSparkline data={d.history} status={d.status} /></td>
                <td className="p-4">
                  <span className={cn("px-2 py-1 rounded-full text-xs font-medium capitalize",
                    d.status === "stable" ? "bg-emerald-400/10 text-emerald-400" :
                    d.status === "warning" ? "bg-amber-400/10 text-amber-400" :
                    "bg-red-400/10 text-red-400"
                  )}>{d.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
