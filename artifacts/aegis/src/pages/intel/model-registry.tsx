import { useState } from "react";
import { Database, Brain, CheckCircle2, Clock, AlertTriangle, Tag, GitBranch, Activity, Box, Upload, Shield } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const models = [
  { id: "MDL-001", name: "DeepForecaster", version: "3.2", framework: "PyTorch", status: "deployed", stage: "production", accuracy: 94.2, size: "2.4 GB", created: "2026-02-15", lastTrained: "2026-03-25", deployedAt: "2026-03-26", endpoints: 3, requests: "12.4K/hr" },
  { id: "MDL-002", name: "NeuralSentiment", version: "2.1", framework: "TensorFlow", status: "deployed", stage: "production", accuracy: 87.1, size: "1.8 GB", created: "2025-11-20", lastTrained: "2026-03-20", deployedAt: "2026-03-21", endpoints: 2, requests: "8.2K/hr" },
  { id: "MDL-003", name: "TimeSeriesNet", version: "4.0", framework: "PyTorch", status: "deployed", stage: "production", accuracy: 90.8, size: "3.1 GB", created: "2026-01-10", lastTrained: "2026-03-22", deployedAt: "2026-03-23", endpoints: 2, requests: "15.7K/hr" },
  { id: "MDL-004", name: "RiskAnalyzer", version: "1.8", framework: "Scikit-learn", status: "deployed", stage: "production", accuracy: 82.3, size: "450 MB", created: "2025-09-05", lastTrained: "2026-03-18", deployedAt: "2026-03-19", endpoints: 1, requests: "3.1K/hr" },
  { id: "MDL-005", name: "AnomalyDetector", version: "2.5", framework: "PyTorch", status: "deployed", stage: "production", accuracy: 88.9, size: "1.2 GB", created: "2025-12-01", lastTrained: "2026-03-27", deployedAt: "2026-03-28", endpoints: 4, requests: "22.8K/hr" },
  { id: "MDL-006", name: "AnomalyDetector", version: "2.6", framework: "PyTorch", status: "validating", stage: "staging", accuracy: 96.2, size: "1.3 GB", created: "2026-03-28", lastTrained: "2026-03-29", deployedAt: null, endpoints: 0, requests: "—" },
  { id: "MDL-007", name: "CausalInference", version: "1.3", framework: "JAX", status: "deployed", stage: "production", accuracy: 84.7, size: "890 MB", created: "2026-01-25", lastTrained: "2026-03-15", deployedAt: "2026-03-16", endpoints: 1, requests: "2.4K/hr" },
  { id: "MDL-008", name: "EnsembleStack", version: "2.0", framework: "Custom", status: "deployed", stage: "production", accuracy: 93.2, size: "5.8 GB", created: "2026-02-28", lastTrained: "2026-03-28", deployedAt: "2026-03-28", endpoints: 2, requests: "9.5K/hr" },
  { id: "MDL-009", name: "TimeSeriesNet", version: "4.1", framework: "PyTorch", status: "training", stage: "development", accuracy: null, size: "—", created: "2026-03-29", lastTrained: null, deployedAt: null, endpoints: 0, requests: "—" },
];

export default function ModelRegistry() {
  const [stageFilter, setStageFilter] = useState("all");
  const filtered = models.filter(m => stageFilter === "all" || m.stage === stageFilter);
  const deployedCount = models.filter(m => m.status === "deployed").length;
  const totalEndpoints = models.reduce((s, m) => s + m.endpoints, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Database className="w-6 h-6 text-primary" />
          Model Registry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Model registry with versioning, staging, and deployment tracking</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Models</p>
          <p className="text-2xl font-bold text-foreground">{models.length}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deployed</p>
          <p className="text-2xl font-bold text-emerald-400">{deployedCount}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Endpoints</p>
          <p className="text-2xl font-bold text-cyan-400">{totalEndpoints}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Frameworks</p>
          <p className="text-2xl font-bold text-foreground">{new Set(models.map(m => m.framework)).size}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["all", "production", "staging", "development"].map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
              stageFilter === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted/50"
            )}>{s}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(m => (
          <div key={m.id} className="bg-card/60 border border-border rounded-xl p-5 hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">v{m.version}</span>
                    <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">{m.framework}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.id} · {m.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                {m.accuracy !== null && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{m.accuracy}%</p>
                    <p className="text-[10px] text-muted-foreground">accuracy</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm font-mono text-foreground">{m.requests}</p>
                  <p className="text-[10px] text-muted-foreground">{m.endpoints} endpoints</p>
                </div>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                  m.status === "deployed" ? "bg-emerald-400/10 text-emerald-400" :
                  m.status === "validating" ? "bg-cyan-400/10 text-cyan-400" :
                  "bg-amber-400/10 text-amber-400"
                )}>{m.status}</span>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                  m.stage === "production" ? "bg-primary/10 text-primary" :
                  m.stage === "staging" ? "bg-amber-400/10 text-amber-400" :
                  "bg-muted text-muted-foreground"
                )}>{m.stage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
