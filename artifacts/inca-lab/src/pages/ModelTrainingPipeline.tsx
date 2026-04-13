import { useState, useEffect, useCallback } from "react";
import { Brain, Upload, Play, CheckCircle2, XCircle, Clock, Zap, ChevronRight, BarChart3, Rocket, Cpu, RefreshCw, Plus, Trash2, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type JobStatus = "pending" | "running" | "completed" | "failed";
type ModelType = "speech" | "vision" | "text" | "voice_clone";
type FinetuningProvider = "openai" | "google" | "huggingface" | "elevenlabs";
type Stage = "dataset_upload" | "dataset_ready" | "training" | "evaluation" | "deployed";

interface FinetuningJob {
  id: string;
  name: string;
  provider: FinetuningProvider;
  model_type: ModelType;
  base_model: string;
  status: JobStatus;
  stage: Stage;
  dataset_size?: number;
  trained_model_id?: string;
  registered_in_gateway?: boolean;
  metrics?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

const PROVIDER_COLORS: Record<FinetuningProvider, string> = {
  openai: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  google: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  huggingface: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  elevenlabs: "text-purple-400 border-purple-400/30 bg-purple-400/10",
};

const MODEL_TYPE_ICONS: Record<ModelType, string> = {
  speech: "🎤",
  vision: "👁️",
  text: "📝",
  voice_clone: "🔊",
};

const STAGE_LABELS: Record<Stage, string> = {
  dataset_upload: "Dataset Upload",
  dataset_ready: "Dataset Ready",
  training: "Training",
  evaluation: "Evaluation",
  deployed: "Deployed",
};

const BASE_MODELS = {
  openai: { speech: ["whisper-1"], vision: ["gpt-4o-mini"], text: ["gpt-4o-mini", "gpt-3.5-turbo"] },
  google: { speech: ["chirp-2"], vision: ["imagetext@001"], text: ["text-bison", "gemini-1.0-pro"] },
  huggingface: { speech: ["openai/whisper-large-v3"], vision: ["google/vit-large-patch16-224"], text: ["mistralai/Mistral-7B-v0.1", "meta-llama/Llama-2-7b-hf"] },
  elevenlabs: { voice_clone: ["eleven_multilingual_v2", "eleven_turbo_v2"] },
};

async function apiCall(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<{ success: boolean; data: unknown }>;
}

export function ModelTrainingPipeline() {
  const [jobs, setJobs] = useState<FinetuningJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<FinetuningJob | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);

  const [newJob, setNewJob] = useState({
    name: "",
    provider: "openai" as FinetuningProvider,
    modelType: "text" as ModelType,
    baseModel: "gpt-4o-mini",
    hyperparams: { epochs: 3, batchSize: 4, learningRate: 0.0001 },
  });

  const availableModelTypes = Object.keys(BASE_MODELS[newJob.provider] ?? {}) as ModelType[];
  const availableBaseModels = (BASE_MODELS[newJob.provider] as Record<string, string[]>)?.[newJob.modelType] ?? [];

  const loadJobs = useCallback(async () => {
    try {
      const result = await apiCall("/model-finetuning/jobs");
      const data = result.data as { jobs: FinetuningJob[] };
      setJobs(data.jobs ?? []);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (!pollingJobId) return;
    const interval = setInterval(async () => {
      try {
        const result = await apiCall(`/model-finetuning/jobs/${pollingJobId}/status`);
        const job = result.data as FinetuningJob;
        setJobs(prev => prev.map(j => j.id === pollingJobId ? { ...j, ...job } : j));
        if (selectedJob?.id === pollingJobId) setSelectedJob(prev => prev ? { ...prev, ...job } : null);
        if (job.status !== "running") setPollingJobId(null);
      } catch { }
    }, 5000);
    return () => clearInterval(interval);
  }, [pollingJobId, selectedJob]);

  const createJob = async () => {
    if (!newJob.name || !newJob.baseModel) return;
    setCreating(true);
    try {
      const result = await apiCall("/model-finetuning/jobs", {
        method: "POST",
        body: JSON.stringify({
          name: newJob.name,
          provider: newJob.provider,
          modelType: newJob.modelType,
          baseModel: newJob.baseModel,
          hyperparams: newJob.hyperparams,
        }),
      });
      const job = result.data as FinetuningJob;
      setJobs(prev => [job, ...prev]);
      setShowCreateModal(false);
      setSelectedJob(job);
      setNewJob({ name: "", provider: "openai", modelType: "text", baseModel: "gpt-4o-mini", hyperparams: { epochs: 3, batchSize: 4, learningRate: 0.0001 } });
    } catch (err) {
      alert(`Failed to create job: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setCreating(false);
    }
  };

  const uploadDataset = async (jobId: string, file: File) => {
    const form = new FormData();
    form.append("dataset", file);
    const res = await fetch(`${BASE}/api/model-finetuning/jobs/${jobId}/dataset`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) throw new Error("Upload failed");
    const result = await res.json() as { data: unknown };
    await loadJobs();
    return result.data;
  };

  const startTraining = async (jobId: string) => {
    await apiCall(`/model-finetuning/jobs/${jobId}/start`, { method: "POST" });
    setPollingJobId(jobId);
    await loadJobs();
  };

  const runEvaluation = async (jobId: string) => {
    const result = await apiCall(`/model-finetuning/jobs/${jobId}/evaluate`, { method: "POST" });
    await loadJobs();
    return result.data;
  };

  const deployModel = async (jobId: string) => {
    await apiCall(`/model-finetuning/jobs/${jobId}/deploy`, { method: "POST" });
    await loadJobs();
  };

  const deleteJob = async (jobId: string) => {
    await apiCall(`/model-finetuning/jobs/${jobId}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== jobId));
    if (selectedJob?.id === jobId) setSelectedJob(null);
  };

  const statusColor: Record<JobStatus, string> = {
    pending: "text-slate-400 bg-slate-400/10",
    running: "text-blue-400 bg-blue-400/10",
    completed: "text-emerald-400 bg-emerald-400/10",
    failed: "text-red-400 bg-red-400/10",
  };

  const statusIcon: Record<JobStatus, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    running: <RefreshCw className="w-3 h-3 animate-spin" />,
    completed: <CheckCircle2 className="w-3 h-3" />,
    failed: <XCircle className="w-3 h-3" />,
  };

  const stages: Stage[] = ["dataset_upload", "dataset_ready", "training", "evaluation", "deployed"];
  const stageIndex = (stage: Stage) => stages.indexOf(stage);

  return (
    <div className="min-h-screen bg-[#080c14] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 border border-violet-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Model Fine-Tuning Pipeline</h1>
              <p className="text-sm text-slate-400">Train custom speech, vision, and text models — deploy to all domain agents</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Training Job
          </button>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#0f1520] border border-white/10 rounded-2xl p-6 w-full max-w-lg">
              <h2 className="text-lg font-semibold mb-4">Create Fine-Tuning Job</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Job Name</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                    placeholder="e.g. Maritime Vision v2"
                    value={newJob.name}
                    onChange={e => setNewJob(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Provider</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      value={newJob.provider}
                      onChange={e => {
                        const p = e.target.value as FinetuningProvider;
                        const firstType = Object.keys(BASE_MODELS[p] ?? {})[0] as ModelType;
                        const firstModel = ((BASE_MODELS[p] as Record<string, string[]>)[firstType] ?? [])[0] ?? "";
                        setNewJob(prev => ({ ...prev, provider: p, modelType: firstType, baseModel: firstModel }));
                      }}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="google">Google Vertex</option>
                      <option value="huggingface">HuggingFace</option>
                      <option value="elevenlabs">ElevenLabs</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Model Type</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                      value={newJob.modelType}
                      onChange={e => {
                        const mt = e.target.value as ModelType;
                        const firstModel = ((BASE_MODELS[newJob.provider] as Record<string, string[]>)[mt] ?? [])[0] ?? "";
                        setNewJob(prev => ({ ...prev, modelType: mt, baseModel: firstModel }));
                      }}
                    >
                      {availableModelTypes.map(t => (
                        <option key={t} value={t}>{MODEL_TYPE_ICONS[t]} {t.replace("_", " ")}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Base Model</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    value={newJob.baseModel}
                    onChange={e => setNewJob(prev => ({ ...prev, baseModel: e.target.value }))}
                  >
                    {availableBaseModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-2 block">Hyperparameters</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "epochs", label: "Epochs", min: 1, max: 20 },
                      { key: "batchSize", label: "Batch Size", min: 1, max: 64 },
                    ].map(({ key, label, min, max }) => (
                      <div key={key}>
                        <label className="text-[10px] text-slate-500 mb-0.5 block">{label}</label>
                        <input
                          type="number"
                          min={min}
                          max={max}
                          className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none"
                          value={newJob.hyperparams[key as keyof typeof newJob.hyperparams]}
                          onChange={e => setNewJob(prev => ({ ...prev, hyperparams: { ...prev.hyperparams, [key]: parseFloat(e.target.value) } }))}
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-[10px] text-slate-500 mb-0.5 block">LR</label>
                      <input
                        type="number"
                        step="0.00001"
                        className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm focus:outline-none"
                        value={newJob.hyperparams.learningRate}
                        onChange={e => setNewJob(prev => ({ ...prev, hyperparams: { ...prev.hyperparams, learningRate: parseFloat(e.target.value) } }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  onClick={createJob}
                  disabled={creating || !newJob.name}
                >
                  {creating ? "Creating..." : "Create Job"}
                </button>
                <button
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <Brain className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No training jobs yet</p>
                <button onClick={() => setShowCreateModal(true)} className="mt-3 text-xs text-violet-400 hover:text-violet-300">
                  Create your first job →
                </button>
              </div>
            ) : jobs.map(job => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedJob?.id === job.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/5"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{MODEL_TYPE_ICONS[job.model_type]}</span>
                    <span className="text-sm font-medium text-white">{job.name}</span>
                  </div>
                  <span className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", statusColor[job.status])}>
                    {statusIcon[job.status]} {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border", PROVIDER_COLORS[job.provider])}>
                    {job.provider}
                  </span>
                  <span className="text-xs text-slate-500">{job.base_model}</span>
                  {job.registered_in_gateway && (
                    <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                      <Rocket className="w-3 h-3" /> deployed
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="col-span-8">
            {!selectedJob ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white/2 rounded-2xl border border-white/5">
                <Cpu className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Select a training job to view details</p>
              </div>
            ) : (
              <JobDetailPanel
                job={selectedJob}
                onUploadDataset={uploadDataset}
                onStartTraining={startTraining}
                onEvaluate={runEvaluation}
                onDeploy={deployModel}
                onDelete={deleteJob}
                onRefresh={async () => {
                  const result = await apiCall(`/model-finetuning/jobs/${selectedJob.id}/status`);
                  const updated = result.data as FinetuningJob;
                  setSelectedJob(prev => prev ? { ...prev, ...updated } : null);
                  setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, ...updated } : j));
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobDetailPanel({ job, onUploadDataset, onStartTraining, onEvaluate, onDeploy, onDelete, onRefresh }: {
  job: FinetuningJob;
  onUploadDataset: (id: string, file: File) => Promise<unknown>;
  onStartTraining: (id: string) => Promise<void>;
  onEvaluate: (id: string) => Promise<unknown>;
  onDeploy: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ recordCount: number; validationErrors: string[]; validationStatus: string } | null>(null);
  const [evalResult, setEvalResult] = useState<{ passed: boolean; scores: Record<string, string | number> } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const stages: Stage[] = ["dataset_upload", "dataset_ready", "training", "evaluation", "deployed"];
  const currentStageIdx = stages.indexOf(job.stage);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await onUploadDataset(job.id, file) as { recordCount: number; validationErrors: string[]; validationStatus: string };
      setUploadResult(result);
    } catch (err) {
      alert(`Upload failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setUploading(false);
      await onRefresh();
    }
  };

  const runAction = async (action: string, fn: () => Promise<unknown>) => {
    setActionLoading(action);
    try {
      const result = await fn();
      if (action === "evaluate") setEvalResult(result as { passed: boolean; scores: Record<string, string | number> });
      await onRefresh();
    } catch (err) {
      alert(`${action} failed: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white/2 rounded-2xl border border-white/5 p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{({ speech: "🎤", vision: "👁️", text: "📝", voice_clone: "🔊" } as Record<string, string>)[job.model_type]}</span>
            <h2 className="text-lg font-semibold">{job.name}</h2>
          </div>
          <p className="text-sm text-slate-400">{job.provider} · {job.base_model} · {job.model_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <button onClick={() => onDelete(job.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-0">
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center flex-1">
            <div className={cn(
              "flex flex-col items-center gap-1 flex-1",
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs",
                i < currentStageIdx ? "border-emerald-500 bg-emerald-500 text-white" :
                  i === currentStageIdx ? "border-violet-500 bg-violet-500/20 text-violet-400" :
                    "border-white/10 bg-transparent text-slate-600"
              )}>
                {i < currentStageIdx ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-[9px] text-center leading-tight w-14",
                i <= currentStageIdx ? "text-white" : "text-slate-600"
              )}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={cn("h-px flex-1 mx-1 mb-4", i < currentStageIdx ? "bg-emerald-500/50" : "bg-white/10")} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="p-3 rounded-xl border border-white/5 bg-white/2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-violet-400" /> Dataset Upload
            </h3>
            {job.dataset_size ? (
              <span className="text-xs text-emerald-400">{job.dataset_size.toLocaleString()} records</span>
            ) : null}
          </div>
          {uploadResult && (
            <div className={cn("p-2 rounded-lg mb-2 text-xs", uploadResult.validationStatus === "valid" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
              {uploadResult.validationStatus === "valid"
                ? `✓ ${uploadResult.recordCount} records validated`
                : `✗ ${uploadResult.validationErrors.join(", ")}`}
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              uploading ? "bg-violet-500/20 text-violet-300" : "bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 border border-violet-500/30"
            )}>
              {uploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {uploading ? "Uploading..." : "Upload JSONL / JSON"}
            </div>
            <input type="file" accept=".jsonl,.json" className="hidden" onChange={handleFileChange} disabled={uploading} />
          </label>
        </div>

        {job.stage === "dataset_ready" && (
          <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1">
                  <Play className="w-4 h-4 text-blue-400" /> Start Training
                </h3>
                <p className="text-xs text-slate-500">Submit fine-tuning job to {job.provider}</p>
              </div>
              <button
                onClick={() => runAction("train", () => onStartTraining(job.id))}
                disabled={actionLoading === "train"}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600/80 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === "train" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {actionLoading === "train" ? "Starting..." : "Start"}
              </button>
            </div>
          </div>
        )}

        {job.status === "running" && (
          <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Training in progress</p>
                <p className="text-xs text-slate-500">Auto-refreshes every 5s · Provider job: {job.id}</p>
              </div>
            </div>
            {job.metrics && Object.keys(job.metrics).length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Object.entries(job.metrics).slice(0, 6).map(([k, v]) => (
                  <div key={k} className="bg-black/20 rounded-lg px-2 py-1.5">
                    <div className="text-[10px] text-slate-500">{k}</div>
                    <div className="text-sm font-mono text-white">{typeof v === "number" ? v.toFixed(4) : String(v)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {job.stage === "evaluation" && job.trained_model_id && (
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" /> Model Evaluation
              </h3>
              <button
                onClick={() => runAction("evaluate", () => onEvaluate(job.id))}
                disabled={actionLoading === "evaluate"}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/60 hover:bg-emerald-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading === "evaluate" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
                Run A/B Eval
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-2">Model ID: <code className="text-emerald-400">{job.trained_model_id}</code></p>

            {evalResult && (
              <div className={cn("p-2 rounded-lg text-xs", evalResult.passed ? "bg-emerald-500/10" : "bg-yellow-500/10")}>
                <p className={cn("font-medium mb-1", evalResult.passed ? "text-emerald-400" : "text-yellow-400")}>
                  {evalResult.passed ? "✓ Evaluation passed" : "⚠ Evaluation needs review"}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {Object.entries(evalResult.scores).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-500">{k}:</span>
                      <span className="text-white">{typeof v === "number" ? v.toFixed(4) : String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(job.stage === "evaluation" || job.stage === "deployed") && job.trained_model_id && (
          <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-1.5 mb-1">
                  <Rocket className="w-4 h-4 text-violet-400" /> Deploy to AI Gateway
                </h3>
                <p className="text-xs text-slate-500">Register in model registry — available to all domain agents</p>
              </div>
              {job.registered_in_gateway ? (
                <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3 h-3" /> Deployed
                </span>
              ) : (
                <button
                  onClick={() => runAction("deploy", () => onDeploy(job.id))}
                  disabled={actionLoading === "deploy"}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600/80 hover:bg-violet-600 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {actionLoading === "deploy" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                  {actionLoading === "deploy" ? "Deploying..." : "Deploy"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
