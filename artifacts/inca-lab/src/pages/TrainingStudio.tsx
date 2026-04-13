import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Beaker, Play, Plus, CheckCircle, AlertCircle, Clock, TrendingDown, TrendingUp,
  DollarSign, Cpu, Database, ChevronRight, Loader2, RefreshCw, Upload, Check, BarChart3,
  Package, Zap, Target
} from "lucide-react";

type TrainingStatus = "queued" | "running" | "completed" | "failed";
type Provider = "together" | "openai" | "replicate";

interface TrainingRun {
  id: string;
  name: string;
  baseModel: string;
  method: "lora" | "qlora" | "full";
  provider: Provider;
  domain: string;
  dataset: string;
  datasetSize: number;
  status: TrainingStatus;
  progress: number;
  epochs: number;
  currentEpoch: number;
  trainLoss?: number;
  valLoss?: number;
  costAccrued: number;
  estimatedCost: number;
  startedAt?: string;
  completedAt?: string;
  baselineScore?: number;
  fineTunedScore?: number;
  promotedToRegistry?: boolean;
}

const TRAINING_RUNS: TrainingRun[] = [
  {
    id: "tr-maritime-lora-001", name: "Maritime Risk LoRA v2", baseModel: "meta-llama/Llama-3.1-8B-Instruct",
    method: "lora", provider: "together", domain: "maritime", dataset: "Alloy Maritime Risk Dataset",
    datasetSize: 12400, status: "completed", progress: 100, epochs: 5, currentEpoch: 5,
    trainLoss: 0.142, valLoss: 0.168, costAccrued: 18.40, estimatedCost: 18.40,
    startedAt: "2025-12-08T10:00:00Z", completedAt: "2025-12-08T14:30:00Z",
    baselineScore: 71.2, fineTunedScore: 89.4, promotedToRegistry: true,
  },
  {
    id: "tr-legal-qlora-001", name: "Legal Document QLoRA", baseModel: "mistralai/Mistral-7B-Instruct-v0.3",
    method: "qlora", provider: "together", domain: "legal", dataset: "Alloy Legal Corpus v3",
    datasetSize: 8200, status: "running", progress: 63, epochs: 4, currentEpoch: 3,
    trainLoss: 0.198, costAccrued: 9.20, estimatedCost: 14.60,
    startedAt: "2025-12-12T09:00:00Z",
  },
  {
    id: "tr-security-full-001", name: "Security Threat Full Fine-tune", baseModel: "gpt-4o-mini-2024-07-18",
    method: "full", provider: "openai", domain: "security", dataset: "Alloy Threat Intel Dataset",
    datasetSize: 5100, status: "queued", progress: 0, epochs: 3, currentEpoch: 0,
    costAccrued: 0, estimatedCost: 42.00,
  },
  {
    id: "tr-realestate-lora-001", name: "Property Analysis LoRA", baseModel: "codellama/CodeLlama-34b-Instruct-hf",
    method: "lora", provider: "replicate", domain: "real-estate", dataset: "Alloy Property Dataset v2",
    datasetSize: 3800, status: "failed", progress: 28, epochs: 4, currentEpoch: 1,
    trainLoss: 0.521, costAccrued: 4.20, estimatedCost: 22.00,
    startedAt: "2025-12-10T14:00:00Z",
  },
];

const DOMAIN_DATASETS = {
  maritime: ["Alloy Maritime Risk Dataset (12.4K)", "AIS Anomaly Corpus (8.1K)", "Sanctions Routing Dataset (5.5K)"],
  legal: ["Alloy Legal Corpus v3 (8.2K)", "Contract Obligation Dataset (4.8K)", "Deadline Extraction Pairs (3.1K)"],
  security: ["Alloy Threat Intel Dataset (5.1K)", "OFAC Entity Corpus (7.4K)", "CVE Description Dataset (9.2K)"],
  defense: ["Alloy Defense Signal Dataset (3.4K)", "APT Attribution Corpus (2.8K)"],
  "real-estate": ["Alloy Property Dataset v2 (3.8K)", "Distressed Asset Corpus (2.2K)", "Market Trend Dataset (4.1K)"],
};

const PROVIDER_MODELS: Record<Provider, string[]> = {
  together: ["meta-llama/Llama-3.1-8B-Instruct", "meta-llama/Llama-3.1-70B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3", "Qwen/Qwen2-72B-Instruct"],
  openai: ["gpt-4o-mini-2024-07-18", "gpt-3.5-turbo-0125", "davinci-002"],
  replicate: ["codellama/CodeLlama-34b-Instruct-hf", "mistralai/Mistral-7B-Instruct-v0.2", "meta/llama-3-70b-instruct"],
};

const PROVIDER_COLOR: Record<Provider, string> = {
  together: "#7c3aed",
  openai: "#22c55e",
  replicate: "#f97316",
};

const STATUS_CONFIG: Record<TrainingStatus, { label: string; color: string; icon: React.ComponentType<{className?: string}> }> = {
  queued: { label: "Queued", color: "#60a5fa", icon: Clock },
  running: { label: "Running", color: "#f97316", icon: Loader2 },
  completed: { label: "Completed", color: "#22c55e", icon: CheckCircle },
  failed: { label: "Failed", color: "#f43f5e", icon: AlertCircle },
};

const METHOD_LABELS = { lora: "LoRA", qlora: "QLoRA", full: "Full Fine-tune" };

function LossSparkline({ loss }: { loss: number }) {
  const points = Array.from({ length: 12 }, (_, i) => loss + (0.6 - i * 0.05) * (1 - i / 12)).map((v, i) => `${i * 22},${100 - Math.min(100, v * 150)}`).join(" ");
  return (
    <svg width="132" height="30" className="opacity-70">
      <polyline fill="none" stroke="#7c3aed" strokeWidth="1.5" points={points} />
    </svg>
  );
}

function RunCard({ run, onPromote, onView }: { run: TrainingRun; onPromote: (id: string) => void; onView: (run: TrainingRun) => void }) {
  const status = STATUS_CONFIG[run.status]!;
  const StatusIcon = status.icon;
  const improvement = run.fineTunedScore && run.baselineScore
    ? ((run.fineTunedScore - run.baselineScore) / run.baselineScore * 100).toFixed(1)
    : null;

  return (
    <div className="inca-panel p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">{run.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 rounded border font-medium" style={{ background: `${PROVIDER_COLOR[run.provider]}15`, color: PROVIDER_COLOR[run.provider], borderColor: `${PROVIDER_COLOR[run.provider]}30` }}>
              {run.provider}
            </span>
            <span className="text-xs text-muted-foreground">{METHOD_LABELS[run.method]}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <StatusIcon className={cn("w-4 h-4", run.status === "running" && "animate-spin")} style={{ color: status.color }} />
          <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Epoch {run.currentEpoch}/{run.epochs}</span>
          <span>{run.progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${run.progress}%`, backgroundColor: status.color }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center py-2 border-y border-border/40">
        <div>
          <div className="text-xs font-mono font-bold text-foreground">{run.trainLoss?.toFixed(3) ?? "—"}</div>
          <div className="text-xs text-muted-foreground">Train Loss</div>
        </div>
        <div>
          <div className="text-xs font-mono font-bold text-foreground">{run.valLoss?.toFixed(3) ?? "—"}</div>
          <div className="text-xs text-muted-foreground">Val Loss</div>
        </div>
        <div>
          <div className="text-xs font-mono font-bold text-foreground">${run.costAccrued.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">/${run.estimatedCost.toFixed(2)} est</div>
        </div>
      </div>

      {run.status === "completed" && run.fineTunedScore && run.baselineScore && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="text-muted-foreground">Benchmark: </span>
            <span className="text-foreground font-mono">{run.baselineScore}%</span>
            <span className="text-muted-foreground"> → </span>
            <span className="text-emerald-400 font-mono font-bold">{run.fineTunedScore}%</span>
            <span className="text-emerald-400 ml-1">(+{improvement}%)</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {run.status === "completed" && !run.promotedToRegistry && (
          <button
            onClick={() => onPromote(run.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Package className="w-3 h-3" /> Promote to Registry
          </button>
        )}
        {run.promotedToRegistry && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
            <Check className="w-3 h-3" /> In Registry
          </div>
        )}
        {(run.status === "queued" || run.status === "running") && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs">
            <Loader2 className={cn("w-3 h-3", run.status === "running" && "animate-spin")} />
            {run.status === "running" ? "Training…" : "Waiting in queue"}
          </div>
        )}
        <button
          onClick={() => onView(run)}
          className="px-3 py-1.5 bg-secondary text-muted-foreground hover:text-foreground rounded-lg text-xs transition-colors flex items-center gap-1"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function RunDetailModal({ run, onClose, onPromote }: { run: TrainingRun; onClose: () => void; onPromote: (id: string) => void }) {
  const [tab, setTab] = useState<"overview" | "eval" | "config">("overview");
  const status = STATUS_CONFIG[run.status]!;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Beaker className="w-5 h-5 text-primary" />
          <div>
            <div className="font-display font-semibold text-foreground">{run.name}</div>
            <div className="text-xs text-muted-foreground">{run.provider} · {METHOD_LABELS[run.method]} · {run.domain}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded border font-medium" style={{ background: `${status.color}15`, color: status.color, borderColor: `${status.color}30` }}>{status.label}</span>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
          </div>
        </div>

        <div className="flex gap-1 px-5 pt-4 border-b border-border">
          {(["overview", "eval", "config"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-all", tab === t ? "bg-secondary text-foreground border-t border-x border-border" : "text-muted-foreground hover:text-foreground")}>
              {t === "eval" ? "Evaluation" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Base Model", value: run.baseModel },
                  { label: "Provider", value: run.provider },
                  { label: "Method", value: METHOD_LABELS[run.method] },
                  { label: "Domain", value: run.domain },
                  { label: "Dataset", value: run.dataset },
                  { label: "Dataset Size", value: `${run.datasetSize.toLocaleString()} samples` },
                  { label: "Train Loss", value: run.trainLoss?.toFixed(4) ?? "—" },
                  { label: "Cost Accrued", value: `$${run.costAccrued.toFixed(2)} / $${run.estimatedCost.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-foreground font-mono truncate">{value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === "eval" && (
            <div className="space-y-4">
              {run.fineTunedScore && run.baselineScore ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Baseline</div>
                      <div className="text-xl font-display font-bold text-foreground">{run.baselineScore}%</div>
                      <div className="text-xs text-muted-foreground">domain benchmark</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Fine-tuned</div>
                      <div className="text-xl font-display font-bold text-emerald-400">{run.fineTunedScore}%</div>
                      <div className="text-xs text-muted-foreground">domain benchmark</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Improvement</div>
                      <div className="text-xl font-display font-bold text-emerald-400">
                        +{((run.fineTunedScore - run.baselineScore) / run.baselineScore * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">relative gain</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Entity Recognition", base: 68.4, tuned: 91.2 },
                      { label: "Risk Classification", base: 74.1, tuned: 93.7 },
                      { label: "Temporal Reasoning", base: 71.8, tuned: 88.6 },
                    ].map(({ label, base, tuned }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{label}</span>
                          <span className="text-emerald-400">{tuned}% (+{(tuned - base).toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500/60 transition-all" style={{ width: `${tuned}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Target className="w-8 h-8 mx-auto mb-2" />
                  <div className="text-sm">Evaluation will run after training completes</div>
                </div>
              )}
            </div>
          )}

          {tab === "config" && (
            <div className="space-y-3">
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-emerald-400 border border-border leading-relaxed whitespace-pre">
{`{
  "method": "${run.method}",
  "base_model": "${run.baseModel}",
  "provider": "${run.provider}",
  "epochs": ${run.epochs},
  "learning_rate": 2e-4,
  "batch_size": 16,
  "gradient_accumulation": 4,
  "warmup_steps": 100,
  "lora_rank": 16,
  "lora_alpha": 32,
  "dataset": "${run.dataset}",
  "dataset_size": ${run.datasetSize},
  "domain": "${run.domain}"
}`}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          {run.status === "completed" && !run.promotedToRegistry && (
            <button
              onClick={() => { onPromote(run.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Package className="w-4 h-4" /> Promote to Model Registry
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function NewRunModal({ onClose }: { onClose: (run?: Partial<TrainingRun>) => void }) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<Provider>("together");
  const [method, setMethod] = useState<"lora" | "qlora" | "full">("lora");
  const [domain, setDomain] = useState("maritime");
  const [dataset, setDataset] = useState("");
  const [model, setModel] = useState(PROVIDER_MODELS.together[0]!);
  const [submitted, setSubmitted] = useState(false);

  function handleProviderChange(p: Provider) {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0]!);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => onClose()}>
      <div className="bg-card border border-border rounded-xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Beaker className="w-5 h-5 text-primary" />
          <div className="font-display font-semibold text-foreground">Launch Training Run</div>
          <button onClick={() => onClose()} className="ml-auto text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
        </div>
        {!submitted ? (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Run Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="My Domain LoRA v1" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["together", "openai", "replicate"] as Provider[]).map(p => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={cn("py-2 rounded-lg border text-xs font-medium capitalize transition-all", provider === p ? "border-primary/35 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
                >
                  {p}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Base Model</label>
              <select value={model} onChange={e => setModel(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary/40">
                {PROVIDER_MODELS[provider].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["lora", "qlora", "full"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn("py-2 rounded-lg border text-xs font-medium transition-all", method === m ? "border-primary/35 bg-primary/8 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
                >
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Domain</label>
              <select value={domain} onChange={e => { setDomain(e.target.value); setDataset(""); }} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                {Object.keys(DOMAIN_DATASETS).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Training Dataset</label>
              <select value={dataset} onChange={e => setDataset(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                <option value="">Select dataset...</option>
                {(DOMAIN_DATASETS[domain as keyof typeof DOMAIN_DATASETS] ?? []).map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { if (name && dataset) setSubmitted(true); }}
                disabled={!name || !dataset}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Launch Training
              </button>
              <button onClick={() => onClose()} className="px-4 py-2.5 bg-secondary text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Beaker className="w-6 h-6 text-primary" />
            </div>
            <div className="font-semibold text-foreground mb-1">Training Job Queued</div>
            <div className="text-sm text-muted-foreground mb-1">{name}</div>
            <div className="text-xs text-muted-foreground">Provider: {provider} · {METHOD_LABELS[method]} on {model.split("/").pop()}</div>
            <button onClick={() => onClose({ name, provider, method, domain })} className="mt-5 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TrainingStudio() {
  const [runs, setRuns] = useState<TrainingRun[]>(TRAINING_RUNS);
  const [selectedRun, setSelectedRun] = useState<TrainingRun | null>(null);
  const [showNewRun, setShowNewRun] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TrainingStatus | "all">("all");
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());

  function handlePromote(id: string) {
    setRuns(prev => prev.map(r => r.id === id ? { ...r, promotedToRegistry: true } : r));
    setPromotedIds(prev => new Set([...prev, id]));
    setTimeout(() => setPromotedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 3000);
  }

  const filtered = statusFilter === "all" ? runs : runs.filter(r => r.status === statusFilter);
  const completedRuns = runs.filter(r => r.status === "completed").length;
  const totalCost = runs.reduce((s, r) => s + r.costAccrued, 0);
  const avgImprovement = runs.filter(r => r.fineTunedScore && r.baselineScore)
    .reduce((s, r) => s + ((r.fineTunedScore! - r.baselineScore!) / r.baselineScore!) * 100, 0)
    / runs.filter(r => r.fineTunedScore).length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {selectedRun && <RunDetailModal run={selectedRun} onClose={() => setSelectedRun(null)} onPromote={handlePromote} />}
      {showNewRun && (
        <NewRunModal onClose={(run) => {
          setShowNewRun(false);
          if (run?.name) {
            const newRun: TrainingRun = {
              id: `tr-${Date.now()}`,
              name: run.name!,
              baseModel: "meta-llama/Llama-3.1-8B-Instruct",
              method: run.method ?? "lora",
              provider: (run.provider as Provider) ?? "together",
              domain: run.domain ?? "maritime",
              dataset: "Alloy Dataset",
              datasetSize: 5000,
              status: "queued",
              progress: 0,
              epochs: 4,
              currentEpoch: 0,
              costAccrued: 0,
              estimatedCost: 18.00,
            };
            setRuns(prev => [newRun, ...prev]);
          }
        }} />
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-5 rounded-full bg-primary" />
            <h1 className="text-xl font-display font-semibold text-foreground">Training Studio</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-3.5">
            Provider-routed fine-tuning — LoRA/QLoRA via Together AI, full fine-tuning via OpenAI, custom via Replicate.
          </p>
        </div>
        <button
          onClick={() => setShowNewRun(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Training Run
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-primary">{runs.length}</div>
          <div className="text-xs text-muted-foreground">Total Runs</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">{completedRuns}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-foreground">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Total Cost</div>
        </div>
        <div className="kpi-tile p-3 text-center">
          <div className="text-xl font-display font-bold text-emerald-400">
            {isNaN(avgImprovement) ? "—" : `+${avgImprovement.toFixed(1)}%`}
          </div>
          <div className="text-xs text-muted-foreground">Avg Improvement</div>
        </div>
      </div>

      {promotedIds.size > 0 && (
        <div className="mb-4 px-4 py-3 bg-primary/10 border border-primary/25 rounded-lg text-sm text-primary flex items-center gap-2">
          <Package className="w-4 h-4" /> Fine-tuned model promoted to Model Registry with full provenance chain.
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {(["all", "running", "queued", "completed", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize", statusFilter === f ? "bg-primary/15 text-primary border border-primary/25" : "bg-secondary text-muted-foreground hover:text-foreground border border-transparent")}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(run => (
          <RunCard key={run.id} run={run} onPromote={handlePromote} onView={setSelectedRun} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Beaker className="w-8 h-8 mb-3" />
            <div className="text-sm">No training runs in this state</div>
          </div>
        )}
      </div>
    </div>
  );
}
