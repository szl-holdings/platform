import { useState, useEffect, useCallback } from "react";
import {
  Cpu, Database, Play, Plus, RefreshCw, ChevronRight, CheckCircle2, XCircle,
  Clock, TrendingUp, BarChart2, Layers, FlaskConical, Zap, Target, AlertCircle,
  ChevronDown, ChevronUp, ArrowRight, Upload, Eye
} from "lucide-react";
import { cn } from "../lib/utils";

const BASE_URL = import.meta.env.BASE_URL ?? "/inca-lab/";
const API_BASE = BASE_URL.replace(/\/$/, "").replace(/\/inca-lab$/, "") || "";

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  return data;
}

type Provider = "openai" | "together" | "fireworks" | "vertex";
type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

interface ForgeProvider {
  id: Provider;
  name: string;
  description: string;
  baseModels: string[];
  status: "available";
}

interface ForgeDataset {
  id: number;
  name: string;
  description: string;
  format: string;
  rowCount: number;
  sizeBytes: number;
  providerFormats: Record<string, boolean>;
  createdAt: string;
}

interface ForgeJob {
  id: number;
  name: string;
  provider: Provider;
  baseModel: string;
  datasetId: number;
  datasetName?: string;
  status: JobStatus;
  epochs: number;
  batchSize?: number;
  progress: number;
  costEstimateUsd: number;
  costActualUsd?: number;
  trainingLoss?: number;
  validationLoss?: number;
  fineTunedModelId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ForgeExperiment {
  id: number;
  name: string;
  jobIds: number[];
  baselineModel: string;
  winner?: string;
  results: Array<{
    jobId: number;
    provider: string;
    model: string;
    prompt: string;
    qualityScore: number;
    costUsd: number;
    latencyMs: number;
  }>;
  status: string;
  createdAt: string;
}

interface ParetoPoint {
  jobId: number;
  provider: string;
  model: string;
  qualityScore: number;
  costUsd: number;
  label: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: "#22c55e",
  together: "#f97316",
  fireworks: "#a855f7",
  vertex: "#60a5fa",
};

const STATUS_STYLES: Record<JobStatus, { color: string; bg: string; label: string }> = {
  queued: { color: "text-amber-400", bg: "bg-amber-400/10", label: "Queued" },
  running: { color: "text-blue-400", bg: "bg-blue-400/10", label: "Running" },
  completed: { color: "text-green-400", bg: "bg-green-400/10", label: "Completed" },
  failed: { color: "text-red-400", bg: "bg-red-400/10", label: "Failed" },
  cancelled: { color: "text-muted-foreground", bg: "bg-secondary", label: "Cancelled" },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Tab = "dashboard" | "datasets" | "jobs" | "experiments" | "pareto";

export function TrainingForge() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [providers, setProviders] = useState<ForgeProvider[]>([]);
  const [datasets, setDatasets] = useState<ForgeDataset[]>([]);
  const [jobs, setJobs] = useState<ForgeJob[]>([]);
  const [experiments, setExperiments] = useState<ForgeExperiment[]>([]);
  const [paretoFeed, setParetoFeed] = useState<ParetoPoint[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDatasetForm, setShowDatasetForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showExperimentForm, setShowExperimentForm] = useState(false);
  const [expandedJob, setExpandedJob] = useState<number | null>(null);
  const [expandedExperiment, setExpandedExperiment] = useState<number | null>(null);

  const [dsForm, setDsForm] = useState({ name: "", description: "", format: "jsonl", sampleData: "" });
  const [jobForm, setJobForm] = useState({ name: "", provider: "openai" as Provider, baseModel: "", datasetId: "", epochs: "3", batchSize: "4" });
  const [expForm, setExpForm] = useState({ name: "", jobIds: [] as number[], baselineModel: "gpt-4o", testPrompts: "Explain the key concepts from the training data.\nHow would you handle this edge case?" });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, dsRes, jobRes, expRes, feedRes, dashRes] = await Promise.all([
        apiFetch("/training-forge/providers"),
        apiFetch("/training-forge/datasets"),
        apiFetch("/training-forge/jobs"),
        apiFetch("/training-forge/experiments"),
        apiFetch("/training-forge/evolution-feed"),
        apiFetch("/training-forge/dashboard"),
      ]);
      if (provRes.data?.providers) setProviders(provRes.data.providers);
      if (dsRes.data?.datasets) setDatasets(dsRes.data.datasets);
      if (jobRes.data?.jobs) setJobs(jobRes.data.jobs);
      if (expRes.data?.experiments) setExperiments(expRes.data.experiments);
      if (feedRes.data?.feed) setParetoFeed(feedRes.data.feed);
      if (dashRes.data?.dashboard) setDashboard(dashRes.data.dashboard);
    } catch (e) {
      setError("Failed to load Training Forge data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (jobs.some(j => j.status === "running" || j.status === "queued")) {
        apiFetch("/training-forge/jobs").then(res => {
          if (res.data?.jobs) setJobs(res.data.jobs);
        }).catch(() => {});
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [jobs]);

  async function createDataset() {
    try {
      let rawData: unknown[] = [];
      try { rawData = JSON.parse(dsForm.sampleData); } catch {
        rawData = dsForm.sampleData.split("\n").filter(Boolean).map(line => {
          try { return JSON.parse(line); } catch { return { text: line }; }
        });
      }
      if (!Array.isArray(rawData)) rawData = [rawData];
      await apiFetch("/training-forge/datasets", {
        method: "POST",
        body: JSON.stringify({ name: dsForm.name, description: dsForm.description, format: dsForm.format, rawData }),
      });
      setShowDatasetForm(false);
      setDsForm({ name: "", description: "", format: "jsonl", sampleData: "" });
      loadAll();
    } catch { setError("Failed to create dataset"); }
  }

  async function launchJob() {
    try {
      await apiFetch("/training-forge/jobs", {
        method: "POST",
        body: JSON.stringify({ name: jobForm.name, provider: jobForm.provider, baseModel: jobForm.baseModel, datasetId: parseInt(jobForm.datasetId), epochs: parseInt(jobForm.epochs), batchSize: parseInt(jobForm.batchSize) }),
      });
      setShowJobForm(false);
      loadAll();
    } catch { setError("Failed to launch job"); }
  }

  async function createExperiment() {
    try {
      const prompts = expForm.testPrompts.split("\n").filter(Boolean);
      await apiFetch("/training-forge/experiments", {
        method: "POST",
        body: JSON.stringify({ name: expForm.name, jobIds: expForm.jobIds, baselineModel: expForm.baselineModel, testPrompts: prompts }),
      });
      setShowExperimentForm(false);
      loadAll();
    } catch { setError("Failed to create experiment"); }
  }

  const selectedProviderModels = providers.find(p => p.id === jobForm.provider)?.baseModels ?? [];
  const completedJobs = jobs.filter(j => j.status === "completed");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">ML Training Forge</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Unified multi-provider fine-tuning orchestration. Launch and monitor training jobs across OpenAI, Together AI, Fireworks, and Google Vertex from a single command center.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      <div className="flex gap-1 mb-5 p-1 bg-secondary rounded-lg w-fit flex-wrap">
        {(["dashboard", "datasets", "jobs", "experiments", "pareto"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all capitalize", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {t === "pareto" ? "Pareto / Evolution" : t}
          </button>
        ))}
        <button onClick={loadAll} disabled={loading} className="ml-1 p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {tab === "dashboard" && (
        <div className="space-y-5">
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Jobs", value: dashboard.jobs?.total ?? 0, icon: Cpu, sub: `${dashboard.jobs?.running ?? 0} running` },
                { label: "Completed", value: dashboard.jobs?.completed ?? 0, icon: CheckCircle2, sub: `$${parseFloat(dashboard.jobs?.total_cost ?? "0").toFixed(2)} spent` },
                { label: "Datasets", value: dashboard.datasets?.total ?? 0, icon: Database, sub: `${dashboard.datasets?.total_rows ?? 0} total rows` },
                { label: "Experiments", value: dashboard.experiments?.total ?? 0, icon: FlaskConical, sub: "cross-provider comparisons" },
              ].map(card => (
                <div key={card.label} className="inca-panel p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-xs text-muted-foreground">{card.label}</div>
                    <card.icon className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                  <div className="text-2xl font-semibold text-foreground">{card.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Provider Ecosystem</div>
              <div className="space-y-2">
                {providers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 bg-secondary rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PROVIDER_COLORS[p.id] || "#888" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0">{p.baseModels.length} models</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="inca-panel p-4">
              <div className="text-sm font-medium text-foreground mb-3">Recent Training Jobs</div>
              <div className="space-y-2">
                {jobs.slice(0, 5).map(job => {
                  const style = STATUS_STYLES[job.status];
                  return (
                    <div key={job.id} className="flex items-center gap-3">
                      <div className={cn("text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0", style.bg, style.color)}>{style.label}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-foreground truncate">{job.name}</div>
                        <div className="text-xs text-muted-foreground">{job.provider} · {job.baseModel.split("/").pop()}</div>
                      </div>
                      {job.status === "running" && (
                        <div className="text-xs text-blue-400 flex-shrink-0">{Math.round(job.progress)}%</div>
                      )}
                    </div>
                  );
                })}
                {jobs.length === 0 && <div className="text-xs text-muted-foreground">No training jobs yet. Launch your first job.</div>}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setTab("datasets"); setShowDatasetForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors">
              <Upload className="w-4 h-4" /> Upload Dataset
            </button>
            <button onClick={() => { setTab("jobs"); setShowJobForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Play className="w-4 h-4" /> Launch Training Job
            </button>
          </div>
        </div>
      )}

      {tab === "datasets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{datasets.length} dataset{datasets.length !== 1 ? "s" : ""}</div>
            <button onClick={() => setShowDatasetForm(!showDatasetForm)} className="flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New Dataset
            </button>
          </div>

          {showDatasetForm && (
            <div className="inca-panel p-4 border border-primary/20">
              <div className="text-sm font-medium text-foreground mb-3">Upload Training Dataset</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <input value={dsForm.name} onChange={e => setDsForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="My Training Dataset" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Format</label>
                  <select value={dsForm.format} onChange={e => setDsForm(f => ({ ...f, format: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    {["jsonl", "csv", "alpaca", "sharegpt", "oasst"].map(fmt => <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <input value={dsForm.description} onChange={e => setDsForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="Optional description..." />
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Training Data (JSON array or JSONL)</label>
                <textarea
                  value={dsForm.sampleData}
                  onChange={e => setDsForm(f => ({ ...f, sampleData: e.target.value }))}
                  rows={6}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary/40 resize-none"
                  placeholder={`[{"input": "What is...", "output": "..."}, ...]`}
                />
              </div>
              <div className="text-xs text-muted-foreground mb-3">Auto-format conversion to OpenAI messages, Together AI, Fireworks, and Vertex formats applied on upload.</div>
              <div className="flex gap-2">
                <button onClick={createDataset} disabled={!dsForm.name || !dsForm.sampleData} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Upload Dataset</button>
                <button onClick={() => setShowDatasetForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {datasets.map(ds => (
              <div key={ds.id} className="inca-panel p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm text-foreground">{ds.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{ds.description || "No description"}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">{ds.rowCount} rows</span>
                      <span className="text-xs text-muted-foreground">{formatBytes(ds.sizeBytes)}</span>
                      <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded">{ds.format.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <div className="text-xs text-muted-foreground">Provider formats</div>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {Object.entries(ds.providerFormats || {}).map(([p, ok]) => (
                        <span key={p} className={cn("text-xs px-1.5 py-0.5 rounded font-mono", ok ? "bg-green-500/10 text-green-400" : "bg-secondary text-muted-foreground/50")}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {datasets.length === 0 && !showDatasetForm && (
              <div className="inca-panel p-8 text-center text-muted-foreground text-sm">
                No datasets uploaded yet. Upload your first training dataset to get started.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "jobs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{jobs.length} training job{jobs.length !== 1 ? "s" : ""}</div>
            <button onClick={() => setShowJobForm(!showJobForm)} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Play className="w-3.5 h-3.5" /> Launch Job
            </button>
          </div>

          {showJobForm && (
            <div className="inca-panel p-4 border border-primary/20">
              <div className="text-sm font-medium text-foreground mb-3">Launch Fine-Tuning Job</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Job Name</label>
                  <input value={jobForm.name} onChange={e => setJobForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="e.g. Maritime Risk v2" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Provider</label>
                  <select value={jobForm.provider} onChange={e => setJobForm(f => ({ ...f, provider: e.target.value as Provider, baseModel: "" }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Base Model</label>
                  <select value={jobForm.baseModel} onChange={e => setJobForm(f => ({ ...f, baseModel: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    <option value="">Select model...</option>
                    {selectedProviderModels.map(m => <option key={m} value={m}>{m.split("/").pop()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dataset</label>
                  <select value={jobForm.datasetId} onChange={e => setJobForm(f => ({ ...f, datasetId: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40">
                    <option value="">Select dataset...</option>
                    {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Epochs</label>
                  <input type="number" value={jobForm.epochs} onChange={e => setJobForm(f => ({ ...f, epochs: e.target.value }))} min="1" max="10" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Batch Size</label>
                  <input type="number" value={jobForm.batchSize} onChange={e => setJobForm(f => ({ ...f, batchSize: e.target.value }))} min="1" max="32" className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={launchJob} disabled={!jobForm.name || !jobForm.provider || !jobForm.baseModel || !jobForm.datasetId} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Play className="w-3.5 h-3.5 inline mr-1.5" /> Launch Training
                </button>
                <button onClick={() => setShowJobForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {jobs.map(job => {
              const style = STATUS_STYLES[job.status];
              const isExpanded = expandedJob === job.id;
              return (
                <div key={job.id} className="inca-panel overflow-hidden">
                  <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={() => setExpandedJob(isExpanded ? null : job.id)}>
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${PROVIDER_COLORS[job.provider] || "#888"}18`, border: `1px solid ${PROVIDER_COLORS[job.provider] || "#888"}33` }}>
                      <Cpu className="w-4 h-4" style={{ color: PROVIDER_COLORS[job.provider] || "#888" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="font-medium text-sm text-foreground truncate">{job.name}</div>
                        <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0", style.bg, style.color)}>{style.label}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{job.provider} · {job.baseModel.split("/").pop()} · {job.epochs} epoch{job.epochs !== 1 ? "s" : ""}</div>
                      {job.status === "running" && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Training progress</span>
                            <span className="text-blue-400">{Math.round(job.progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${job.progress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <div className="text-xs text-muted-foreground">${(job.costActualUsd ?? job.costEstimateUsd).toFixed(4)}</div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 grid grid-cols-3 gap-3">
                      {[
                        { label: "Training Loss", value: job.trainingLoss?.toFixed(4) ?? "—" },
                        { label: "Val Loss", value: job.validationLoss?.toFixed(4) ?? "—" },
                        { label: "Cost", value: `$${(job.costActualUsd ?? job.costEstimateUsd).toFixed(4)}` },
                        { label: "Dataset", value: job.datasetName || `#${job.datasetId}` },
                        { label: "Batch Size", value: String(job.batchSize ?? 4) },
                        { label: "Fine-tuned ID", value: job.fineTunedModelId?.split(":").slice(-1)[0] ?? "—" },
                      ].map(item => (
                        <div key={item.label} className="bg-secondary rounded-lg p-2.5">
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="text-sm font-mono text-foreground mt-0.5 truncate">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {jobs.length === 0 && !showJobForm && (
              <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No training jobs yet. Upload a dataset and launch your first fine-tuning job.</div>
            )}
          </div>
        </div>
      )}

      {tab === "experiments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{experiments.length} experiment{experiments.length !== 1 ? "s" : ""}</div>
            <button onClick={() => setShowExperimentForm(!showExperimentForm)} disabled={completedJobs.length === 0} className="flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/25 text-primary rounded-lg text-sm font-medium hover:bg-primary/25 transition-colors disabled:opacity-50">
              <FlaskConical className="w-3.5 h-3.5" /> New Experiment
            </button>
          </div>

          {completedJobs.length === 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
              Complete at least one training job to run cross-provider comparison experiments.
            </div>
          )}

          {showExperimentForm && (
            <div className="inca-panel p-4 border border-primary/20">
              <div className="text-sm font-medium text-foreground mb-3">Create Cross-Provider Experiment</div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Experiment Name</label>
                <input value={expForm.name} onChange={e => setExpForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" placeholder="e.g. Maritime vs Legal Domain Transfer" />
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Select Completed Jobs to Compare</label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {completedJobs.map(job => (
                    <label key={job.id} className="flex items-center gap-2 p-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80">
                      <input type="checkbox" checked={expForm.jobIds.includes(job.id)} onChange={e => setExpForm(f => ({ ...f, jobIds: e.target.checked ? [...f.jobIds, job.id] : f.jobIds.filter(id => id !== job.id) }))} className="accent-primary" />
                      <span className="text-xs text-foreground">{job.name}</span>
                      <span className="text-xs text-muted-foreground">({job.provider})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Test Prompts (one per line)</label>
                <textarea value={expForm.testPrompts} onChange={e => setExpForm(f => ({ ...f, testPrompts: e.target.value }))} rows={4} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-primary/40 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={createExperiment} disabled={!expForm.name || expForm.jobIds.length === 0} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Run Experiment</button>
                <button onClick={() => setShowExperimentForm(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {experiments.map(exp => {
              const isExpanded = expandedExperiment === exp.id;
              const uniqueModels = [...new Set(exp.results.map(r => r.model))];
              return (
                <div key={exp.id} className="inca-panel overflow-hidden">
                  <div className="p-4 cursor-pointer flex items-start justify-between" onClick={() => setExpandedExperiment(isExpanded ? null : exp.id)}>
                    <div>
                      <div className="font-medium text-sm text-foreground">{exp.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{uniqueModels.length} models compared · {exp.results.length} total outputs</div>
                      {exp.winner && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Target className="w-3 h-3 text-amber-400" />
                          <span className="text-xs text-amber-400">Winner: <span className="font-mono">{exp.winner.split(":").pop()}</span></span>
                        </div>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                      {uniqueModels.map(model => {
                        const modelResults = exp.results.filter(r => r.model === model);
                        const avgQuality = modelResults.reduce((s, r) => s + r.qualityScore, 0) / modelResults.length;
                        const avgCost = modelResults.reduce((s, r) => s + r.costUsd, 0) / modelResults.length;
                        const avgLatency = modelResults.reduce((s, r) => s + r.latencyMs, 0) / modelResults.length;
                        const provider = modelResults[0]?.provider || "unknown";
                        const isWinner = exp.winner === model;

                        return (
                          <div key={model} className={cn("p-3 rounded-lg border", isWinner ? "border-amber-400/30 bg-amber-400/5" : "border-border bg-secondary")}>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[provider] || "#888" }} />
                              <div className="text-xs font-mono text-foreground">{model.split(":").pop()}</div>
                              {isWinner && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 font-medium">Winner</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Quality", value: (avgQuality * 100).toFixed(1) + "%" },
                                { label: "Cost", value: "$" + avgCost.toFixed(4) },
                                { label: "Latency", value: Math.round(avgLatency) + "ms" },
                              ].map(m => (
                                <div key={m.label} className="text-center">
                                  <div className="text-xs text-muted-foreground">{m.label}</div>
                                  <div className="text-sm font-mono text-foreground">{m.value}</div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${avgQuality * 100}%`, backgroundColor: PROVIDER_COLORS[provider] || "#888" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {experiments.length === 0 && !showExperimentForm && (
              <div className="inca-panel p-8 text-center text-muted-foreground text-sm">No experiments yet. Complete jobs and run a cross-provider comparison experiment.</div>
            )}
          </div>
        </div>
      )}

      {tab === "pareto" && (
        <div className="space-y-4">
          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-1">Cost / Quality Pareto Curve</div>
            <div className="text-xs text-muted-foreground mb-4">Each point represents a completed fine-tuning job. The efficient frontier (upper-left) represents the best quality-per-dollar tradeoffs. Results automatically feed back into the Alloy Evolution Engine.</div>
            {paretoFeed.length > 0 ? (
              <div className="relative bg-secondary rounded-xl p-4 overflow-hidden" style={{ height: "280px" }}>
                <div className="absolute top-2 left-8 text-xs text-muted-foreground">Quality Score</div>
                <div className="absolute bottom-8 right-2 text-xs text-muted-foreground rotate-90">Cost (USD)</div>

                <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="xMidYMid meet">
                  <line x1="40" y1="0" x2="40" y2="210" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />
                  <line x1="40" y1="210" x2="600" y2="210" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />

                  {[0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
                    <g key={v}>
                      <line x1="40" y1={210 - v * 200} x2="600" y2={210 - v * 200} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
                      <text x="32" y={215 - v * 200} textAnchor="end" fill="currentColor" fillOpacity="0.4" fontSize="9">{(v * 100).toFixed(0)}%</text>
                    </g>
                  ))}

                  {(() => {
                    const maxCost = Math.max(...paretoFeed.map(p => p.costUsd), 0.01);
                    return paretoFeed.map((point, i) => {
                      const cx = 40 + (point.costUsd / maxCost) * 540;
                      const cy = 210 - point.qualityScore * 200;
                      const color = PROVIDER_COLORS[point.provider] || "#888";
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r="5" fill={color} fillOpacity="0.8" />
                          <text x={cx + 8} y={cy + 4} fontSize="9" fill="currentColor" fillOpacity="0.6">{point.provider}</text>
                        </g>
                      );
                    });
                  })()}
                </svg>

                <div className="absolute bottom-2 left-8 right-4 flex items-center gap-3 flex-wrap">
                  {Object.entries(PROVIDER_COLORS).map(([p, c]) => (
                    <div key={p} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                      <span className="text-xs text-muted-foreground">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-secondary rounded-xl p-8 text-center text-muted-foreground text-sm">Complete training jobs to see the cost/quality Pareto frontier.</div>
            )}
          </div>

          <div className="inca-panel p-4">
            <div className="text-sm font-medium text-foreground mb-1">Alloy Evolution Feed</div>
            <div className="text-xs text-muted-foreground mb-3">Completed fine-tuning results are automatically ingested by the Alloy Evolution Engine to breed better prompt strategies.</div>
            {paretoFeed.length > 0 ? (
              <div className="space-y-2">
                {paretoFeed.slice(0, 8).map((point, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-secondary rounded-lg">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PROVIDER_COLORS[point.provider] || "#888" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-foreground truncate">{point.model?.split(":").pop() || point.label}</div>
                      <div className="text-xs text-muted-foreground">{point.provider}</div>
                    </div>
                    <div className="text-xs text-foreground">{(point.qualityScore * 100).toFixed(1)}% quality</div>
                    <div className="text-xs text-muted-foreground">${point.costUsd.toFixed(4)}</div>
                    <ArrowRight className="w-3 h-3 text-primary flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 text-center">No evolution feed entries yet. Complete training jobs to populate this feed.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
