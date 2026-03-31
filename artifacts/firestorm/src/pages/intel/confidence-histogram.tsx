import { BarChart3, Brain, Target, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const histogramData = [
  { range: "0-10%", count: 2, color: "bg-red-500" },
  { range: "10-20%", count: 5, color: "bg-red-400" },
  { range: "20-30%", count: 8, color: "bg-orange-500" },
  { range: "30-40%", count: 12, color: "bg-orange-400" },
  { range: "40-50%", count: 18, color: "bg-amber-500" },
  { range: "50-60%", count: 32, color: "bg-amber-400" },
  { range: "60-70%", count: 48, color: "bg-yellow-400" },
  { range: "70-80%", count: 85, color: "bg-cyan-400" },
  { range: "80-90%", count: 124, color: "bg-emerald-400" },
  { range: "90-100%", count: 167, color: "bg-emerald-500" },
];

const modelBreakdown = [
  { name: "DeepForecaster v3.2", avgConfidence: 92.4, totalPredictions: 145, lowConfidence: 3 },
  { name: "NeuralSentiment v2.1", avgConfidence: 87.1, totalPredictions: 89, lowConfidence: 8 },
  { name: "TimeSeriesNet v4.0", avgConfidence: 90.8, totalPredictions: 112, lowConfidence: 5 },
  { name: "RiskAnalyzer v1.8", avgConfidence: 82.3, totalPredictions: 67, lowConfidence: 12 },
  { name: "AnomalyDetector v2.5", avgConfidence: 88.9, totalPredictions: 203, lowConfidence: 15 },
  { name: "CausalInference v1.3", avgConfidence: 84.7, totalPredictions: 45, lowConfidence: 6 },
  { name: "EnsembleStack v2.0", avgConfidence: 93.2, totalPredictions: 78, lowConfidence: 2 },
];

const maxCount = Math.max(...histogramData.map(d => d.count));
const totalPredictions = histogramData.reduce((s, d) => s + d.count, 0);
const highConfidence = histogramData.slice(7).reduce((s, d) => s + d.count, 0);

export default function ConfidenceHistogram() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary" />
          Confidence Histogram
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Prediction confidence distribution across active models</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Predictions</p>
          <p className="text-2xl font-bold text-foreground">{totalPredictions}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">High Confidence (70%+)</p>
          <p className="text-2xl font-bold text-emerald-400">{highConfidence}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg Confidence</p>
          <p className="text-2xl font-bold text-foreground">87.3%</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Low Confidence (&lt;50%)</p>
          <p className="text-2xl font-bold text-amber-400">{histogramData.slice(0, 5).reduce((s, d) => s + d.count, 0)}</p>
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-6">Confidence Distribution</h3>
        <div className="flex items-end gap-2 h-48">
          {histogramData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-foreground">{d.count}</span>
              <div className="w-full relative rounded-t-md overflow-hidden"
                style={{ height: `${(d.count / maxCount) * 100}%` }}>
                <div className={cn("absolute inset-0 rounded-t-md", d.color)} />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono -rotate-45 origin-top-left whitespace-nowrap">{d.range}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/60 border border-border rounded-xl p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Model Breakdown</h3>
        <div className="space-y-3">
          {modelBreakdown.map((m, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-48 shrink-0">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.totalPredictions} predictions</p>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all",
                    m.avgConfidence >= 90 ? "bg-emerald-400" :
                    m.avgConfidence >= 80 ? "bg-cyan-400" : "bg-amber-400"
                  )} style={{ width: `${m.avgConfidence}%` }} />
                </div>
              </div>
              <span className="text-sm font-mono text-foreground w-16 text-right">{m.avgConfidence}%</span>
              {m.lowConfidence > 10 && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {m.lowConfidence} low
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
