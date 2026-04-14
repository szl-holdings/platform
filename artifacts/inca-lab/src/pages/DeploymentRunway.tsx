import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, type BenchmarkEntry } from "../lib/api";
import { cn } from "../lib/utils";
import { Server, Cpu, CheckCircle, AlertCircle, Clock, Layers, Loader2 } from "lucide-react";

const QUANTIZATION_SPECS = {
  "4bit": { label: "4-bit GGUF", vramMultiplier: 0.6, speedup: 3.2, qualityLoss: 3, color: "#22c55e" },
  "8bit": { label: "8-bit GPTQ", vramMultiplier: 0.8, speedup: 2.1, qualityLoss: 1.5, color: "#60a5fa" },
  "fp16": { label: "FP16 (Half)", vramMultiplier: 1.0, speedup: 1.0, qualityLoss: 0, color: "#a78bfa" },
  "fp32": { label: "FP32 (Full)", vramMultiplier: 2.0, speedup: 0.6, qualityLoss: 0, color: "#f97316" },
};

const MODEL_PROFILES = [
  { id: "llama-70b", name: "Llama 3.3 70B", baseVram: 70, task: "General LLM", license: "llama3", apiCostMonth: 2400 },
  { id: "mistral-7b", name: "Mistral 7B v0.3", baseVram: 14, task: "General LLM", license: "apache-2.0", apiCostMonth: 480 },
  { id: "qwen-14b", name: "Qwen3 14B", baseVram: 28, task: "Code + Reasoning", license: "apache-2.0", apiCostMonth: 960 },
  { id: "codellama-34b", name: "CodeLlama 34B", baseVram: 68, task: "Code Generation", license: "llama2", apiCostMonth: 1800 },
  { id: "phi-3-7b", name: "Phi-3 Mini 7B", baseVram: 14, task: "Efficient reasoning", license: "MIT", apiCostMonth: 280 },
];

const GPU_PROFILES = [
  { name: "A100 80GB", vram: 80, costPerHour: 2.50, available: true },
  { name: "A100 40GB", vram: 40, costPerHour: 1.80, available: true },
  { name: "H100 80GB", vram: 80, costPerHour: 3.50, available: false },
  { name: "RTX 4090 24GB", vram: 24, costPerHour: 0.65, available: true },
  { name: "RTX 3090 24GB", vram: 24, costPerHour: 0.40, available: true },
  { name: "A10G 24GB", vram: 24, costPerHour: 0.75, available: true },
];

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f97316" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <div className="text-xs font-mono text-foreground w-8 text-right">{score}</div>
    </div>
  );
}

export function DeploymentRunway() {
  const [selectedModel, setSelectedModel] = useState(MODEL_PROFILES[0]!);
  const [selectedQuant, setSelectedQuant] = useState<keyof typeof QUANTIZATION_SPECS>("4bit");
  const [selectedGpu, setSelectedGpu] = useState(GPU_PROFILES[0]!);
  const [hoursPerDay, setHoursPerDay] = useState(16);

  const benchmarksQuery = useQuery({
    queryKey: ["inca-benchmarks"],
    queryFn: () => api.getModelBenchmarks(),
    staleTime: 120000,
  });
  const benchmarks: BenchmarkEntry[] = benchmarksQuery.data?.data ?? [];

  const quantSpec = QUANTIZATION_SPECS[selectedQuant];
  const vramNeeded = Math.ceil(selectedModel.baseVram * quantSpec.vramMultiplier);
  const fitsGpu = selectedGpu.vram >= vramNeeded;
  const gpusNeeded = fitsGpu ? 1 : Math.ceil(vramNeeded / selectedGpu.vram);
  const monthlyHours = hoursPerDay * 30;
  const selfHostedCost = selectedGpu.costPerHour * gpusNeeded * monthlyHours;
  const savings = selectedModel.apiCostMonth - selfHostedCost;
  const savingsPct = ((savings / selectedModel.apiCostMonth) * 100).toFixed(0);
  const readinessScore = Math.min(98, Math.max(20,
    (fitsGpu ? 40 : 10) +
    (selectedGpu.available ? 25 : 0) +
    ({ "4bit": 20, "8bit": 18, "fp16": 15, "fp32": 8 }[selectedQuant] ?? 10) +
    (savings > 0 ? 15 : 0)
  ));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Deployment Runway</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Self-hosted model readiness calculator. Compare API costs vs self-hosted, explore quantization profiles, and score deployment feasibility.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Configuration panel */}
        <div className="lg:col-span-1 space-y-4">
          {/* Model selector */}
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Select Model</div>
            <div className="space-y-1.5">
              {MODEL_PROFILES.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                    selectedModel.id === model.id
                      ? "border-primary/35 bg-primary/8"
                      : "border-border hover:border-primary/20 bg-transparent"
                  )}
                >
                  <div className="text-sm font-medium text-foreground">{model.name}</div>
                  <div className="text-xs text-muted-foreground">{model.task} · {model.baseVram}GB VRAM base · {model.license}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantization */}
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Quantization Profile</div>
            <div className="space-y-1.5">
              {(Object.entries(QUANTIZATION_SPECS) as [keyof typeof QUANTIZATION_SPECS, typeof QUANTIZATION_SPECS[keyof typeof QUANTIZATION_SPECS]][]).map(([key, spec]) => (
                <button
                  key={key}
                  onClick={() => setSelectedQuant(key)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border transition-all flex items-center justify-between",
                    selectedQuant === key ? "border-primary/35 bg-primary/8" : "border-border hover:border-primary/20"
                  )}
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{spec.label}</div>
                    <div className="text-xs text-muted-foreground">{spec.speedup}x speed · {spec.qualityLoss === 0 ? "lossless" : `-${spec.qualityLoss}% quality`}</div>
                  </div>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: spec.color }} />
                </button>
              ))}
            </div>
          </div>

          {/* GPU target */}
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">GPU Target</div>
            <div className="space-y-1.5">
              {GPU_PROFILES.map((gpu) => (
                <button
                  key={gpu.name}
                  onClick={() => setSelectedGpu(gpu)}
                  disabled={!gpu.available}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg border transition-all",
                    selectedGpu.name === gpu.name ? "border-primary/35 bg-primary/8" : "border-border hover:border-primary/20",
                    !gpu.available ? "opacity-40 cursor-not-allowed" : ""
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">{gpu.name}</div>
                    {!gpu.available && <span className="badge-warning text-xs px-1.5 py-0 rounded">unavailable</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">{gpu.vram}GB VRAM · ${gpu.costPerHour}/hr</div>
                </button>
              ))}
            </div>
          </div>

          {/* Usage hours */}
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Hours/Day Active</div>
            <input
              type="range"
              min={4}
              max={24}
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>4h</span>
              <span className="text-primary font-medium">{hoursPerDay}h/day</span>
              <span>24h</span>
            </div>
          </div>
        </div>

        {/* Analysis panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Readiness score */}
          <div className="inca-panel-active p-5 animate-scale-in">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Deployment Readiness</div>
                <div className="text-3xl font-display font-bold text-foreground">{readinessScore}<span className="text-lg text-muted-foreground">/100</span></div>
              </div>
              <div className={cn("px-3 py-1.5 rounded-lg text-sm font-medium border", readinessScore >= 80 ? "badge-running" : readinessScore >= 60 ? "badge-warning" : "badge-error")}>
                {readinessScore >= 80 ? "Ready to Deploy" : readinessScore >= 60 ? "Staging Ready" : "Needs Review"}
              </div>
            </div>
            <ReadinessBar score={readinessScore} />
          </div>

          {/* Hardware analysis */}
          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">Hardware Analysis</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">VRAM Required</div>
                </div>
                <div className={cn("text-lg font-display font-bold", fitsGpu ? "text-green-400" : "text-red-400")}>
                  {vramNeeded}GB
                </div>
                <div className="text-xs text-muted-foreground">{fitsGpu ? `Fits in ${selectedGpu.vram}GB` : `Needs ${gpusNeeded}× GPUs`}</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">GPU Configuration</div>
                </div>
                <div className="text-lg font-display font-bold text-foreground">{gpusNeeded}×</div>
                <div className="text-xs text-muted-foreground">{selectedGpu.name}</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Inference Speedup</div>
                </div>
                <div className="text-lg font-display font-bold text-foreground">{quantSpec.speedup}×</div>
                <div className="text-xs text-muted-foreground">vs FP32 baseline</div>
              </div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">Quality Impact</div>
                </div>
                <div className={cn("text-lg font-display font-bold", quantSpec.qualityLoss === 0 ? "text-green-400" : "text-amber-400")}>
                  {quantSpec.qualityLoss === 0 ? "None" : `-${quantSpec.qualityLoss}%`}
                </div>
                <div className="text-xs text-muted-foreground">{quantSpec.label}</div>
              </div>
            </div>
          </div>

          {/* Cost comparison */}
          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">Cost Comparison (Monthly)</div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">API Cost</div>
                <div className="text-xl font-display font-bold text-foreground">${selectedModel.apiCostMonth.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">per month</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Self-hosted</div>
                <div className="text-xl font-display font-bold text-foreground">${Math.round(selfHostedCost).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">at {hoursPerDay}h/day</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Monthly Savings</div>
                <div className={cn("text-xl font-display font-bold", savings > 0 ? "text-green-400" : "text-red-400")}>
                  {savings > 0 ? "+" : ""}${Math.round(savings).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">{savingsPct}% {savings > 0 ? "savings" : "overhead"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all duration-500"
                  style={{ width: `${Math.min(100, (selfHostedCost / selectedModel.apiCostMonth) * 100)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground w-24 text-right">{((selfHostedCost / selectedModel.apiCostMonth) * 100).toFixed(0)}% of API</div>
            </div>
          </div>

          {/* Deployment checklist */}
          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-3">Deployment Checklist</div>
            <div className="space-y-2">
              {[
                { label: "GPU available for target config", ok: selectedGpu.available },
                { label: "VRAM sufficient for model + quantization", ok: fitsGpu },
                { label: "Self-hosted cost < API cost", ok: savings > 0 },
                { label: "Quantization quality acceptable", ok: quantSpec.qualityLoss < 3 },
                { label: "License compatible (commercial use)", ok: selectedModel.license !== "llama2" },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2.5">
                  {ok
                    ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  }
                  <div className={cn("text-sm", ok ? "text-foreground" : "text-muted-foreground")}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark comparison */}
      <div className="mt-4 inca-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">Benchmark Comparison</div>
          {benchmarksQuery.isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Model</th>
                <th className="px-4 py-2 text-left text-muted-foreground font-medium">Provider</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">MMLU</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">HumanEval</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">Cost/1K</th>
                <th className="px-4 py-2 text-right text-muted-foreground font-medium">P50 Latency</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((b: BenchmarkEntry) => (
                <tr key={b.model} className="border-b border-border/30 hover:bg-secondary/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-foreground">{b.model}</td>
                  <td className="px-4 py-2.5 text-muted-foreground capitalize">{b.provider}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{b.mmlu}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{b.humaneval}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">${b.cost1kTokens}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{b.latencyP50}ms</td>
                </tr>
              ))}
              {benchmarks.length === 0 && !benchmarksQuery.isLoading && (
                <tr><td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">No benchmark data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
