import { Brain, Cpu, GitBranch, Layers, Zap, Activity, ArrowRight, Eye } from "lucide-react";

const architectures = [
  { name: "INCA-LLM-7B", type: "Transformer", params: "7.2B", layers: 32, heads: 32, dim: 4096, status: "production", accuracy: 94.2, latency: "45ms" },
  { name: "INCA-Vision-3B", type: "Vision Transformer", params: "3.1B", layers: 24, heads: 16, dim: 2048, status: "production", accuracy: 91.8, latency: "32ms" },
  { name: "INCA-Code-13B", type: "Transformer", params: "13.4B", layers: 40, heads: 40, dim: 5120, status: "staging", accuracy: 96.1, latency: "78ms" },
  { name: "INCA-Multi-1B", type: "Multi-Modal", params: "1.2B", layers: 16, heads: 12, dim: 1024, status: "research", accuracy: 88.5, latency: "28ms" },
];

const layerVisualization = [
  { name: "Embedding", type: "input", neurons: 4096, activation: "none", params: "16.7M" },
  { name: "Attention Block x32", type: "attention", neurons: 4096, activation: "softmax", params: "5.2B" },
  { name: "Feed-Forward x32", type: "ffn", neurons: 16384, activation: "SwiGLU", params: "1.8B" },
  { name: "Layer Norm", type: "norm", neurons: 4096, activation: "RMSNorm", params: "262K" },
  { name: "Output Head", type: "output", neurons: 32000, activation: "softmax", params: "131M" },
];

const statusColors: Record<string, string> = {
  production: "bg-emerald-500/10 text-emerald-400",
  staging: "bg-amber-500/10 text-amber-400",
  research: "bg-blue-500/10 text-blue-400",
};

export default function NeuralExplorer() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" /> Neural Architecture Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Layer-by-layer inspection, parameter counts, and topology comparison across model families</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {architectures.map((arch) => (
          <div key={arch.name} className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <Cpu className="w-5 h-5 text-primary" />
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColors[arch.status]}`}>{arch.status}</span>
            </div>
            <h3 className="font-display font-bold text-sm mb-1">{arch.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{arch.type} · {arch.params} parameters</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Layers:</span> <span className="font-medium">{arch.layers}</span></div>
              <div><span className="text-muted-foreground">Heads:</span> <span className="font-medium">{arch.heads}</span></div>
              <div><span className="text-muted-foreground">Accuracy:</span> <span className="font-medium text-emerald-400">{arch.accuracy}%</span></div>
              <div><span className="text-muted-foreground">Latency:</span> <span className="font-medium">{arch.latency}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" /> Model Cortex Visualization — INCA-LLM-7B
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {layerVisualization.map((layer, i) => (
            <div key={layer.name} className="flex items-center gap-2 shrink-0">
              <div className="rounded-lg border border-border bg-muted/50 p-4 min-w-[180px]">
                <div className="text-xs font-mono text-primary mb-1">{layer.type.toUpperCase()}</div>
                <div className="text-sm font-semibold">{layer.name}</div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div>Neurons: {layer.neurons.toLocaleString()}</div>
                  <div>Activation: {layer.activation}</div>
                  <div>Params: {layer.params}</div>
                </div>
              </div>
              {i < layerVisualization.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Compute Utilization
          </h2>
          <div className="space-y-4">
            {[
              { gpu: "A100-80GB #1", util: 94, mem: 72, temp: 78 },
              { gpu: "A100-80GB #2", util: 87, mem: 65, temp: 74 },
              { gpu: "A100-80GB #3", util: 42, mem: 38, temp: 62 },
              { gpu: "A100-80GB #4", util: 91, mem: 88, temp: 81 },
            ].map((g) => (
              <div key={g.gpu} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono">{g.gpu}</span>
                  <span className="text-muted-foreground">{g.temp}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-8">GPU</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${g.util > 80 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${g.util}%` }} />
                  </div>
                  <span className="text-[10px] w-8 text-right">{g.util}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-8">MEM</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${g.mem > 80 ? "bg-red-400" : "bg-blue-400"}`} style={{ width: `${g.mem}%` }} />
                  </div>
                  <span className="text-[10px] w-8 text-right">{g.mem}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-400" /> Research Pipelines
          </h2>
          <div className="space-y-3">
            {[
              { name: "Pre-training Pipeline", stage: "Data Processing", progress: 67, status: "running" },
              { name: "Fine-tuning Pipeline", stage: "Evaluation", progress: 92, status: "running" },
              { name: "RLHF Pipeline", stage: "Reward Model Training", progress: 34, status: "running" },
              { name: "Distillation Pipeline", stage: "Queued", progress: 0, status: "queued" },
            ].map((p) => (
              <div key={p.name} className="p-3 rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className={`text-xs ${p.status === "running" ? "text-emerald-400" : "text-muted-foreground"}`}>{p.status}</span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">Stage: {p.stage}</div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
