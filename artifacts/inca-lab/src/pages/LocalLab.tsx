import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Cpu, Play, Shield, Zap, Download, CheckCircle, AlertTriangle,
  Activity, Lock, Globe, ChevronDown, ChevronUp, Info, BarChart3, Server
} from "lucide-react";

interface LocalModel {
  id: string;
  name: string;
  family: string;
  parameters: string;
  quantizations: {
    level: string;
    fileSizeGb: number;
    vramGb: number;
    tokensPerSec: number;
    qualityRetention: number;
    ttftMs: number;
    canRunInBrowser: boolean;
  }[];
  tasks: string[];
  description: string;
  downloadUrl: string;
  loaded?: boolean;
}

const LOCAL_MODELS: LocalModel[] = [
  {
    id: "llama-3-8b",
    name: "Llama 3 8B",
    family: "Llama",
    parameters: "8B",
    tasks: ["text-generation", "instruction-following", "reasoning"],
    description: "Versatile 8B general-purpose model. Runs in browser at Q4 — excellent balance of quality and speed for local inference.",
    downloadUrl: "https://huggingface.co/meta-llama/Meta-Llama-3-8B-Instruct",
    quantizations: [
      { level: "Q4_K_M", fileSizeGb: 4.9, vramGb: 5.5, tokensPerSec: 42, qualityRetention: 95.8, ttftMs: 280, canRunInBrowser: true },
      { level: "Q5_K_M", fileSizeGb: 5.7, vramGb: 6.5, tokensPerSec: 34, qualityRetention: 97.4, ttftMs: 340, canRunInBrowser: true },
      { level: "Q8_0", fileSizeGb: 8.5, vramGb: 9.5, tokensPerSec: 24, qualityRetention: 99.3, ttftMs: 480, canRunInBrowser: false },
      { level: "FP16", fileSizeGb: 16.0, vramGb: 18, tokensPerSec: 16, qualityRetention: 100, ttftMs: 640, canRunInBrowser: false },
    ],
  },
  {
    id: "phi-3-mini",
    name: "Phi-3 Mini",
    family: "Phi",
    parameters: "3.8B",
    tasks: ["text-generation", "code", "reasoning"],
    description: "Microsoft's compact 3.8B reasoning model. Best-in-class for its size. Ideal for privacy-sensitive browser inference.",
    downloadUrl: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct",
    quantizations: [
      { level: "Q4_K_M", fileSizeGb: 2.4, vramGb: 3.0, tokensPerSec: 68, qualityRetention: 94.1, ttftMs: 160, canRunInBrowser: true },
      { level: "Q8_0", fileSizeGb: 4.1, vramGb: 5.0, tokensPerSec: 44, qualityRetention: 99.0, ttftMs: 240, canRunInBrowser: true },
      { level: "FP16", fileSizeGb: 7.6, vramGb: 9.0, tokensPerSec: 28, qualityRetention: 100, ttftMs: 380, canRunInBrowser: false },
    ],
    loaded: true,
  },
  {
    id: "qwen3-0-6b",
    name: "Qwen3 0.6B",
    family: "Qwen",
    parameters: "0.6B",
    tasks: ["text-generation", "classification"],
    description: "Ultra-compact 0.6B model for edge deployment. Runs fully in browser via WebLLM with near-instant inference.",
    downloadUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct",
    quantizations: [
      { level: "Q4_K_M", fileSizeGb: 0.5, vramGb: 0.8, tokensPerSec: 142, qualityRetention: 91.2, ttftMs: 45, canRunInBrowser: true },
      { level: "Q8_0", fileSizeGb: 0.8, vramGb: 1.2, tokensPerSec: 98, qualityRetention: 97.8, ttftMs: 72, canRunInBrowser: true },
    ],
  },
  {
    id: "mistral-7b",
    name: "Mistral 7B v0.3",
    family: "Mistral",
    parameters: "7B",
    tasks: ["text-generation", "instruction-following"],
    description: "Mistral's highly efficient 7B model with sliding window attention. Apache 2.0 licensed for unrestricted commercial use.",
    downloadUrl: "https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3",
    quantizations: [
      { level: "Q4_K_M", fileSizeGb: 4.4, vramGb: 5.0, tokensPerSec: 46, qualityRetention: 95.2, ttftMs: 260, canRunInBrowser: true },
      { level: "Q5_K_M", fileSizeGb: 5.2, vramGb: 6.0, tokensPerSec: 38, qualityRetention: 97.1, ttftMs: 310, canRunInBrowser: false },
      { level: "FP16", fileSizeGb: 14.5, vramGb: 16, tokensPerSec: 18, qualityRetention: 100, ttftMs: 580, canRunInBrowser: false },
    ],
  },
];

const INFERENCE_LOGS = [
  { time: "14:22:01", model: "Phi-3 Mini (Q4_K_M)", tokens: 312, latencyMs: 2840, source: "browser" },
  { time: "14:21:44", model: "Phi-3 Mini (Q4_K_M)", tokens: 87, latencyMs: 620, source: "browser" },
  { time: "14:20:12", model: "Phi-3 Mini (Q4_K_M)", tokens: 524, latencyMs: 4180, source: "browser" },
  { time: "14:18:33", model: "Phi-3 Mini (Q4_K_M)", tokens: 201, latencyMs: 1540, source: "browser" },
];

function QualityBar({ value }: { value: number }) {
  const color = value >= 97 ? "#22c55e" : value >= 94 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{value}%</span>
    </div>
  );
}

export function LocalLab() {
  const [privacyMode, setPrivacyMode] = useState(true);
  const [gatewayFallback, setGatewayFallback] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LocalModel>(LOCAL_MODELS[1]!);
  const [selectedQuant, setSelectedQuant] = useState(0);
  const [prompt, setPrompt] = useState("Explain the tradeoffs of Q4 quantization vs FP16 for local inference.");
  const [inferenceOutput, setInferenceOutput] = useState<string | null>(null);
  const [inferring, setInferring] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set(["phi-3-mini"]));

  const quant = selectedModel.quantizations[selectedQuant]!;
  const tokensPerSec = quant.tokensPerSec;
  const fitsInBrowser = quant.canRunInBrowser;

  function runInference() {
    if (!loadedModels.has(selectedModel.id)) return;
    setInferring(true);
    setInferenceOutput(null);

    const fakeOutput = `[${selectedModel.name} · ${quant.level} · ${privacyMode ? "Local inference — no data leaves device" : "Local inference"}]

${prompt.includes("Q4") ? `Q4 quantization reduces model weights from 16-bit floats to 4-bit integers, achieving approximately 4× size reduction. This enables the ${selectedModel.name} (${selectedModel.parameters}) model to run on consumer hardware with ~${quant.vramGb}GB VRAM at ${quant.tokensPerSec} tokens/second.

Quality retention is ${quant.qualityRetention}% compared to FP16 baseline — perceptible quality loss occurs mainly on complex multi-step reasoning and exact arithmetic. For most conversational and instruction-following tasks, Q4_K_M is the recommended sweet spot.

FP16 preserves full model fidelity but requires ${selectedModel.quantizations[selectedModel.quantizations.length - 1]?.vramGb}GB VRAM — impractical for local consumer inference. The tradeoff: Q4 gives you ~${quant.tokensPerSec}t/s vs FP16's ~${selectedModel.quantizations[selectedModel.quantizations.length - 1]?.tokensPerSec}t/s with ${(100 - quant.qualityRetention).toFixed(1)}% quality delta for most use cases.` : `Running inference locally with ${selectedModel.name} at ${quant.level} quantization. Token throughput: ${tokensPerSec} tokens/second. No API calls made — all computation occurs within the secure local boundary.

Privacy mode is ${privacyMode ? "enabled" : "disabled"}. ${privacyMode ? "Zero data transmitted to external endpoints." : "Standard mode."}`}

[Inference complete — ${quant.ttftMs}ms TTFT — ${quant.tokensPerSec} tok/s]`;

    const chars = fakeOutput.split("");
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < chars.length) {
        setInferenceOutput(fakeOutput.slice(0, ++idx));
      } else {
        clearInterval(interval);
        setInferring(false);
      }
    }, 8);
  }

  function toggleLoad(modelId: string) {
    setLoadedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) next.delete(modelId);
      else next.add(modelId);
      return next;
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Local Lab</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Browser-side model inference via WebLLM/ONNX Runtime. Privacy-first mode keeps all data within your secure boundary. Configure as a Gateway fallback for sensitive workloads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <div className="inca-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", privacyMode ? "bg-emerald-500/15 border border-emerald-500/25" : "bg-secondary border border-border")}>
              <Lock className={cn("w-4 h-4", privacyMode ? "text-emerald-400" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Privacy-First Mode</div>
              <div className="text-xs text-muted-foreground">{privacyMode ? "No data leaves your environment" : "Standard local mode"}</div>
            </div>
          </div>
          <button
            onClick={() => setPrivacyMode(p => !p)}
            className={cn("w-10 h-5 rounded-full transition-all relative flex-shrink-0", privacyMode ? "bg-emerald-500" : "bg-secondary border border-border")}
          >
            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", privacyMode ? "left-5" : "left-0.5")} />
          </button>
        </div>

        <div className="inca-panel p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", gatewayFallback ? "bg-primary/15 border border-primary/25" : "bg-secondary border border-border")}>
              <Globe className={cn("w-4 h-4", gatewayFallback ? "text-primary" : "text-muted-foreground")} />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Gateway Fallback</div>
              <div className="text-xs text-muted-foreground">{gatewayFallback ? "Local models used as fallback in routing" : "Not registered as Gateway fallback"}</div>
            </div>
          </div>
          <button
            onClick={() => setGatewayFallback(p => !p)}
            className={cn("w-10 h-5 rounded-full transition-all relative flex-shrink-0", gatewayFallback ? "bg-primary" : "bg-secondary border border-border")}
          >
            <div className={cn("w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all", gatewayFallback ? "left-5" : "left-0.5")} />
          </button>
        </div>

        <div className="inca-panel p-4">
          <div className="text-xs text-muted-foreground mb-1">Active Local Model</div>
          {loadedModels.size > 0 ? (
            <>
              <div className="text-sm font-medium text-foreground">{selectedModel.name} · {quant.level}</div>
              <div className="text-xs text-muted-foreground">{quant.tokensPerSec} tok/s · {quant.vramGb}GB VRAM · {quant.fileSizeGb}GB model</div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No model loaded — select and load below</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Model Library</div>
            <div className="space-y-2">
              {LOCAL_MODELS.map((model) => {
                const isSelected = selectedModel.id === model.id;
                const isLoaded = loadedModels.has(model.id);
                return (
                  <div key={model.id} className={cn("border rounded-lg transition-all", isSelected ? "border-primary/35 bg-primary/5" : "border-border bg-transparent")}>
                    <button
                      className="w-full text-left p-3"
                      onClick={() => { setSelectedModel(model); setSelectedQuant(0); }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.parameters}</span>
                        {isLoaded && <span className="badge-running px-1.5 py-0.5 rounded text-xs">loaded</span>}
                        {model.quantizations.some(q => q.canRunInBrowser) && (
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">browser</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{model.family} · {model.tasks.slice(0, 2).join(", ")}</div>
                    </button>
                    {isSelected && (
                      <div className="px-3 pb-3 space-y-1">
                        {model.quantizations.map((q, idx) => (
                          <button
                            key={q.level}
                            onClick={() => setSelectedQuant(idx)}
                            className={cn(
                              "w-full text-left p-2 rounded-lg border text-xs transition-all flex items-center justify-between",
                              selectedQuant === idx ? "border-primary/35 bg-primary/8" : "border-border hover:border-primary/20"
                            )}
                          >
                            <span className="font-mono text-primary font-medium">{q.level}</span>
                            <span className="text-muted-foreground">{q.fileSizeGb}GB · {q.vramGb}GB VRAM</span>
                            <span className="text-muted-foreground">{q.tokensPerSec} t/s</span>
                            {q.canRunInBrowser && <span className="text-emerald-400 font-medium">browser ✓</span>}
                          </button>
                        ))}
                        <button
                          onClick={() => toggleLoad(model.id)}
                          className={cn(
                            "w-full mt-1 py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5",
                            isLoaded ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/15" : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/15"
                          )}
                        >
                          {isLoaded ? <><CheckCircle className="w-3 h-3" /> Unload Model</> : <><Download className="w-3 h-3" /> Load Model</>}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
              Quantization Tradeoff Analysis — {selectedModel.name}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-left text-muted-foreground font-medium">Level</th>
                    <th className="py-2 text-right text-muted-foreground font-medium">Size</th>
                    <th className="py-2 text-right text-muted-foreground font-medium">VRAM</th>
                    <th className="py-2 text-right text-muted-foreground font-medium">Speed</th>
                    <th className="py-2 text-right text-muted-foreground font-medium">TTFT</th>
                    <th className="py-2 text-left text-muted-foreground font-medium pl-3">Quality</th>
                    <th className="py-2 text-center text-muted-foreground font-medium">Browser</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedModel.quantizations.map((q, idx) => (
                    <tr key={q.level} className={cn("border-b border-border/30 transition-colors", selectedQuant === idx && "bg-primary/5")}>
                      <td className="py-2 font-mono text-primary font-medium">{q.level}</td>
                      <td className="py-2 text-right font-mono text-foreground">{q.fileSizeGb}GB</td>
                      <td className="py-2 text-right font-mono text-foreground">{q.vramGb}GB</td>
                      <td className="py-2 text-right font-mono text-foreground">{q.tokensPerSec} t/s</td>
                      <td className="py-2 text-right font-mono text-muted-foreground">{q.ttftMs}ms</td>
                      <td className="py-2 pl-3"><QualityBar value={q.qualityRetention} /></td>
                      <td className="py-2 text-center">{q.canRunInBrowser ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <span className="text-muted-foreground">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="inca-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                Local Inference — {selectedModel.name} ({quant.level})
              </div>
              {privacyMode && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  <Lock className="w-2.5 h-2.5" /> Privacy Mode
                </span>
              )}
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 resize-none font-mono mb-3"
              placeholder="Enter prompt..."
            />
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={runInference}
                disabled={inferring || !loadedModels.has(selectedModel.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  (inferring || !loadedModels.has(selectedModel.id)) ? "bg-secondary text-muted-foreground cursor-not-allowed border border-border" : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {inferring ? <Activity className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                {inferring ? "Inferring..." : !loadedModels.has(selectedModel.id) ? "Load model first" : "Run Locally"}
              </button>
              {fitsInBrowser ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Runs in browser</span>
              ) : (
                <span className="text-xs text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Requires local server</span>
              )}
              <span className="text-xs text-muted-foreground">{quant.tokensPerSec} tok/s · {quant.ttftMs}ms TTFT</span>
            </div>
            {inferenceOutput && (
              <div className="bg-secondary rounded-lg p-3 text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap border border-border animate-fade-in">
                {inferenceOutput}
              </div>
            )}
          </div>

          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Recent Local Inference Log</div>
            <div className="space-y-1.5">
              {INFERENCE_LOGS.map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-xs py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground font-mono">{log.time}</span>
                  <span className="text-foreground font-medium">{log.model}</span>
                  <span className="text-muted-foreground">{log.tokens} tokens</span>
                  <span className="text-muted-foreground">{log.latencyMs}ms</span>
                  <span className="ml-auto flex items-center gap-1 text-emerald-400">
                    <Lock className="w-2.5 h-2.5" /> {log.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
