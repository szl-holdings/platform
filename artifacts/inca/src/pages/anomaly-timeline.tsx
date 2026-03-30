import { AlertTriangle, Activity, Clock, Zap, Eye, Brain, Shield, TrendingUp } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const anomalies = [
  { id: "ANO-001", timestamp: "2026-03-29T14:32:00", title: "Unusual spike in API latency", severity: "high", model: "AnomalyDetector v2.5", confidence: 0.94, impact: "Performance degradation detected across 3 endpoints", resolution: "Auto-scaled resources, latency normalized", status: "resolved" },
  { id: "ANO-002", timestamp: "2026-03-29T13:15:00", title: "Data distribution shift in user features", severity: "medium", model: "DistributionMonitor v1.2", confidence: 0.87, impact: "Feature vectors drifting from training distribution", resolution: null, status: "investigating" },
  { id: "ANO-003", timestamp: "2026-03-29T11:48:00", title: "Prediction confidence drop cluster", severity: "high", model: "ConfidenceTracker v2.0", confidence: 0.91, impact: "12 predictions showing <70% confidence in last hour", resolution: null, status: "open" },
  { id: "ANO-004", timestamp: "2026-03-29T10:22:00", title: "Training data quality anomaly", severity: "critical", model: "DataQuality v3.1", confidence: 0.96, impact: "Corrupted records detected in batch ingestion pipeline", resolution: "Bad batch quarantined, pipeline restarted", status: "resolved" },
  { id: "ANO-005", timestamp: "2026-03-29T08:55:00", title: "Model ensemble disagreement spike", severity: "medium", model: "EnsembleMonitor v1.0", confidence: 0.82, impact: "Revenue ensemble models diverging beyond normal variance", resolution: "Weights rebalanced automatically", status: "resolved" },
  { id: "ANO-006", timestamp: "2026-03-28T22:10:00", title: "Unexpected traffic pattern", severity: "low", model: "TrafficAnalyzer v2.3", confidence: 0.78, impact: "After-hours API usage 340% above baseline", resolution: "Identified as scheduled batch job from partner", status: "resolved" },
  { id: "ANO-007", timestamp: "2026-03-28T18:30:00", title: "GPU utilization anomaly", severity: "medium", model: "InfraMonitor v1.5", confidence: 0.89, impact: "GPU cluster 2 showing asymmetric workload distribution", resolution: "Job scheduler rebalanced across nodes", status: "resolved" },
  { id: "ANO-008", timestamp: "2026-03-28T15:45:00", title: "Feature correlation breakdown", severity: "high", model: "CorrelationTracker v1.1", confidence: 0.92, impact: "Key feature pair correlation dropped from 0.85 to 0.42", resolution: "Upstream data source schema change identified", status: "resolved" },
];

export default function AnomalyTimeline() {
  const openCount = anomalies.filter(a => a.status !== "resolved").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <Eye className="w-6 h-6 text-primary" />
            Anomaly Timeline
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Chronological view of detected anomalies across all models and systems</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {openCount} unresolved
        </span>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {anomalies.map((a, i) => {
            const date = new Date(a.timestamp);
            const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            return (
              <div key={a.id} className="relative pl-16">
                <div className={cn(
                  "absolute left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center -translate-x-1/2",
                  a.severity === "critical" ? "bg-red-400/20 border-red-400" :
                  a.severity === "high" ? "bg-orange-400/20 border-orange-400" :
                  a.severity === "medium" ? "bg-amber-400/20 border-amber-400" :
                  "bg-blue-400/20 border-blue-400"
                )}>
                  <div className={cn("w-2 h-2 rounded-full",
                    a.severity === "critical" ? "bg-red-400" :
                    a.severity === "high" ? "bg-orange-400" :
                    a.severity === "medium" ? "bg-amber-400" : "bg-blue-400"
                  )} />
                </div>
                <div className="absolute left-0 top-0 text-right w-12">
                  <p className="text-xs font-mono text-muted-foreground">{timeStr}</p>
                  <p className="text-[10px] text-muted-foreground/60">{dateStr}</p>
                </div>
                <div className={cn(
                  "bg-card/60 border rounded-xl p-4 transition-all hover:border-primary/20",
                  a.status !== "resolved" ? "border-border" : "border-border/50"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{a.id}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider",
                      a.severity === "critical" ? "bg-red-400/10 text-red-400" :
                      a.severity === "high" ? "bg-orange-400/10 text-orange-400" :
                      a.severity === "medium" ? "bg-amber-400/10 text-amber-400" :
                      "bg-blue-400/10 text-blue-400"
                    )}>{a.severity}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize",
                      a.status === "resolved" ? "bg-emerald-400/10 text-emerald-400" :
                      a.status === "investigating" ? "bg-amber-400/10 text-amber-400" :
                      "bg-cyan-400/10 text-cyan-400"
                    )}>{a.status}</span>
                    <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                      <Brain className="w-3 h-3" /> {a.model} · {(a.confidence * 100).toFixed(0)}% conf
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{a.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{a.impact}</p>
                  {a.resolution && (
                    <p className="text-xs text-emerald-400/80 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> {a.resolution}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
