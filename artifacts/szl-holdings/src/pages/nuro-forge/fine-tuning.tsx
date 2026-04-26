import { m } from 'framer-motion';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  DollarSign,
  GitBranch,
  Loader2,
  RefreshCw,
  Shield,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

type JobStatus =
  | 'pending'
  | 'preparing'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'validating'
  | 'registered';

type Lifecycle = 'staging' | 'canary' | 'active' | 'deprecated';

interface FTJob {
  jobId: string;
  agentId: string;
  provider: string;
  baseModel: string;
  status: JobStatus;
  datasetSize: number;
  datasetVersion: string;
  submittedAt: string;
  completedAt?: string;
  trainingCostUsd?: number;
  errorMessage?: string;
  fineTunedModelId?: string;
  promotedToLifecycle?: string;
  evalScores?: Record<string, unknown>;
}

interface FTModel {
  modelId: string;
  agentId: string;
  jobId: string;
  baseModel: string;
  provider: string;
  lifecycle: Lifecycle;
  evalPassRate: number;
  datasetVersion: string;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  registeredAt: string;
  promotedAt?: string;
}

interface CostSummary {
  totalCostUsd: number;
  totalJobs: number;
  succeededJobs: number;
  byAgent: Record<string, { jobs: number; cost: number }>;
  byProvider: Record<string, { jobs: number; cost: number }>;
}

interface Summary {
  overview: {
    totalJobs: number;
    activeModels: number;
    registeredDatasets: number;
    totalTrainingCostUsd: number;
  };
  jobStatusBreakdown: Record<string, number>;
  modelLifecycleBreakdown: Record<string, number>;
  recentJobs: FTJob[];
  supportedAgents: string[];
}

interface DatasetPreview {
  agentId: string;
  format: string;
  version: string;
  sampleCount: number;
  sourceBreakdown: Record<string, unknown>;
  preview: unknown[];
  exportedAt: string;
}

interface EvalComparison {
  modelId: string;
  agentId: string;
  lifecycle: Lifecycle;
  evalPassRate: number;
  fineTunedScores: { passRate: number; passed: number; failed: number; avgLatencyMs: number } | null;
  baseModelScores: { passRate: number; passed: number; failed: number; avgLatencyMs: number } | null;
  baseModel: string;
  comparison: Array<{ metric: string; base: unknown; fineTuned: unknown; delta: string }> | null;
}

interface ModelLineage {
  model: FTModel | null;
  baseModelName: string;
  jobHistory: Array<{ jobId: string; status: string; submittedAt: string; datasetVersion: string }>;
}

type Tab = 'overview' | 'jobs' | 'models' | 'dataset' | 'costs';

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: React.ElementType }> =
  {
    pending: { label: 'Pending', color: '#f59e0b', icon: Clock },
    preparing: { label: 'Preparing', color: '#6366f1', icon: Loader2 },
    running: { label: 'Running', color: '#3b82f6', icon: Zap },
    succeeded: { label: 'Succeeded', color: '#10b981', icon: CheckCircle2 },
    failed: { label: 'Failed', color: '#ef4444', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'rgba(255,255,255,0.3)', icon: XCircle },
    validating: { label: 'Validating', color: '#8b5cf6', icon: Shield },
    registered: { label: 'Registered', color: '#10b981', icon: CheckCircle2 },
  };

const LIFECYCLE_CONFIG: Record<Lifecycle, { label: string; color: string }> = {
  staging: { label: 'Staging', color: '#f59e0b' },
  canary: { label: 'Canary', color: '#3b82f6' },
  active: { label: 'Active', color: '#10b981' },
  deprecated: { label: 'Deprecated', color: 'rgba(255,255,255,0.25)' },
};

function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
    >
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function LifecycleBadge({ lifecycle }: { lifecycle: Lifecycle }) {
  const cfg = LIFECYCLE_CONFIG[lifecycle] ?? LIFECYCLE_CONFIG.staging;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
      style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg ${className}`}
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <SectionCard className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {label}
        </span>
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
      </div>
    </SectionCard>
  );
}

export default function FineTuningAdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [jobs, setJobs] = useState<FTJob[]>([]);
  const [models, setModels] = useState<FTModel[]>([]);
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [datasetPreview, setDatasetPreview] = useState<DatasetPreview | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [modelEvals, setModelEvals] = useState<Record<string, EvalComparison>>({});
  const [modelLineage, setModelLineage] = useState<Record<string, ModelLineage>>({});
  const [evalLoading, setEvalLoading] = useState<string | null>(null);
  const [lifecycleLoading, setLifecycleLoading] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadSummary = useCallback(async () => {
    const data = await apiRequest<Summary>('GET', '/api/fine-tuning/summary');
    setSummary(data);
    if (!selectedAgent && data.supportedAgents[0]) {
      setSelectedAgent(data.supportedAgents[0]);
    }
  }, [selectedAgent]);

  const loadJobs = useCallback(async () => {
    const data = await apiRequest<{ jobs: FTJob[] }>('GET', '/api/fine-tuning/jobs');
    setJobs(data.jobs);
  }, []);

  const loadModels = useCallback(async () => {
    const data = await apiRequest<{ models: FTModel[] }>('GET', '/api/fine-tuning/models');
    setModels(data.models);
  }, []);

  const loadCosts = useCallback(async () => {
    const data = await apiRequest<CostSummary>('GET', '/api/fine-tuning/costs');
    setCosts(data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadSummary(), loadJobs(), loadModels(), loadCosts()]);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fine-tuning data');
    } finally {
      setLoading(false);
    }
  }, [loadSummary, loadJobs, loadModels, loadCosts]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleModelSelect = async (modelId: string) => {
    const isOpen = expandedModel === modelId;
    setExpandedModel(isOpen ? null : modelId);
    if (isOpen || (modelEvals[modelId] && modelLineage[modelId])) return;
    setEvalLoading(modelId);
    try {
      const [evalData, lineageData] = await Promise.all([
        apiRequest<EvalComparison>(
          'GET',
          `/api/fine-tuning/models/${encodeURIComponent(modelId)}/evals`,
        ),
        apiRequest<ModelLineage>(
          'GET',
          `/api/fine-tuning/models/${encodeURIComponent(modelId)}/lineage`,
        ),
      ]);
      setModelEvals((prev) => ({ ...prev, [modelId]: evalData }));
      setModelLineage((prev) => ({ ...prev, [modelId]: lineageData }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model details');
    } finally {
      setEvalLoading(null);
    }
  };

  const handleDatasetPreview = async () => {
    if (!selectedAgent) return;
    setPreviewLoading(true);
    try {
      const data = await apiRequest<DatasetPreview>('POST', '/api/fine-tuning/datasets/preview', {
        agentId: selectedAgent,
        format: 'openai-jsonl',
        curate: true,
      });
      setDatasetPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleLifecycleChange = async (modelId: string, lifecycle: Lifecycle) => {
    setLifecycleLoading(modelId);
    try {
      await apiRequest('PATCH', `/api/fine-tuning/models/${encodeURIComponent(modelId)}/lifecycle`, {
        lifecycle,
      });
      await loadModels();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lifecycle');
    } finally {
      setLifecycleLoading(null);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    setCancelLoading(jobId);
    try {
      await apiRequest('POST', `/api/fine-tuning/jobs/${jobId}/cancel`);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job');
    } finally {
      setCancelLoading(null);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Brain },
    { id: 'jobs', label: 'Jobs', icon: Zap },
    { id: 'models', label: 'Model Registry', icon: GitBranch },
    { id: 'dataset', label: 'Dataset Preview', icon: Database },
    { id: 'costs', label: 'Cost Dashboard', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#070a10' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 mb-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)' }}
            >
              <Brain className="w-4 h-4" style={{ color: '#ec4899' }} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Fine-Tuning Pipeline
              </h1>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Job management · Model registry · Eval comparison · Cost tracking
              </p>
            </div>
          </div>
          <button
            onClick={() => void loadAll()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </m.div>

        {error && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-md mb-4 text-[11px]"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100">
              ×
            </button>
          </div>
        )}

        <div
          className="flex gap-1 mb-6 p-1 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all"
                style={{
                  background: tab === t.id ? 'rgba(236,72,153,0.12)' : 'transparent',
                  color: tab === t.id ? '#ec4899' : 'rgba(255,255,255,0.4)',
                  border: tab === t.id ? '1px solid rgba(236,72,153,0.2)' : '1px solid transparent',
                }}
              >
                <Icon className="w-3 h-3" />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading && !summary ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        ) : (
          <>
            {tab === 'overview' && summary && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    label="Total Jobs"
                    value={summary.overview.totalJobs}
                    color="#3b82f6"
                    icon={Zap}
                  />
                  <StatCard
                    label="Active Models"
                    value={summary.overview.activeModels}
                    color="#10b981"
                    icon={GitBranch}
                  />
                  <StatCard
                    label="Datasets"
                    value={summary.overview.registeredDatasets}
                    color="#8b5cf6"
                    icon={Database}
                  />
                  <StatCard
                    label="Total Cost"
                    value={`$${summary.overview.totalTrainingCostUsd.toFixed(4)}`}
                    color="#f59e0b"
                    icon={DollarSign}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard className="p-4">
                    <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Job Status Breakdown
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(summary.jobStatusBreakdown).map(([status, count]) => {
                        const cfg = STATUS_CONFIG[status as JobStatus];
                        return (
                          <div key={status} className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {cfg?.label ?? status}
                            </span>
                            <span
                              className="text-[11px] font-bold tabular-nums"
                              style={{ color: cfg?.color ?? 'rgba(255,255,255,0.4)' }}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                      {Object.keys(summary.jobStatusBreakdown).length === 0 && (
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          No jobs yet
                        </p>
                      )}
                    </div>
                  </SectionCard>

                  <SectionCard className="p-4">
                    <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Model Lifecycle Breakdown
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(summary.modelLifecycleBreakdown).map(([lc, count]) => {
                        const cfg = LIFECYCLE_CONFIG[lc as Lifecycle];
                        return (
                          <div key={lc} className="flex items-center justify-between">
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              {cfg?.label ?? lc}
                            </span>
                            <span
                              className="text-[11px] font-bold tabular-nums"
                              style={{ color: cfg?.color ?? 'rgba(255,255,255,0.4)' }}
                            >
                              {count}
                            </span>
                          </div>
                        );
                      })}
                      {Object.keys(summary.modelLifecycleBreakdown).length === 0 && (
                        <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                          No registered models
                        </p>
                      )}
                    </div>
                  </SectionCard>
                </div>

                <SectionCard className="p-4">
                  <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Supported Agents ({summary.supportedAgents.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.supportedAgents.map((agent) => (
                      <span
                        key={agent}
                        className="px-2 py-1 rounded text-[10px]"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                </SectionCard>

                {summary.recentJobs.length > 0 && (
                  <SectionCard className="p-4">
                    <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Recent Jobs
                    </h3>
                    <div className="space-y-2">
                      {summary.recentJobs.map((job) => (
                        <div key={job.jobId} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-3">
                            <StatusBadge status={job.status} />
                            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                              {job.agentId}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              {job.provider}
                            </span>
                          </div>
                          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            {new Date(job.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                <p className="text-[10px] text-right" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  Last refreshed {lastRefresh.toLocaleTimeString()} · Auto-poll every 60s on server
                </p>
              </m.div>
            )}

            {tab === 'jobs' && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {jobs.length === 0 ? (
                  <SectionCard className="p-8 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No fine-tuning jobs yet
                    </p>
                  </SectionCard>
                ) : (
                  jobs.map((job) => {
                    const isExpanded = expandedJob === job.jobId;
                    const canCancel = ['pending', 'preparing', 'running'].includes(job.status);
                    return (
                      <SectionCard key={job.jobId}>
                        <button
                          className="w-full flex items-center justify-between p-4 text-left"
                          onClick={() => setExpandedJob(isExpanded ? null : job.jobId)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            )}
                            <StatusBadge status={job.status} />
                            <span className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                              {job.agentId}
                            </span>
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              {job.provider} · {job.baseModel}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {job.trainingCostUsd != null && (
                              <span className="text-[10px]" style={{ color: '#f59e0b' }}>
                                ${job.trainingCostUsd.toFixed(4)}
                              </span>
                            )}
                            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                              {new Date(job.submittedAt).toLocaleDateString()}
                            </span>
                            {canCancel && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleCancelJob(job.jobId);
                                }}
                                disabled={cancelLoading === job.jobId}
                                className="px-2 py-0.5 rounded text-[10px] transition-opacity hover:opacity-80"
                                style={{
                                  background: 'rgba(239,68,68,0.1)',
                                  border: '1px solid rgba(239,68,68,0.2)',
                                  color: '#ef4444',
                                }}
                              >
                                {cancelLoading === job.jobId ? '…' : 'Cancel'}
                              </button>
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div
                            className="px-4 pb-4 pt-0 border-t"
                            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                          >
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                              {[
                                { label: 'Job ID', value: job.jobId },
                                { label: 'Dataset Version', value: job.datasetVersion },
                                { label: 'Dataset Size', value: `${job.datasetSize} samples` },
                                {
                                  label: 'Submitted',
                                  value: new Date(job.submittedAt).toLocaleString(),
                                },
                              ].map((f) => (
                                <div key={f.label}>
                                  <div className="text-[9px] mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                    {f.label}
                                  </div>
                                  <div className="text-[11px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                    {f.value}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {job.fineTunedModelId && (
                              <div className="mt-3">
                                <div className="text-[9px] mb-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                  Fine-Tuned Model ID
                                </div>
                                <div className="text-[11px] font-mono" style={{ color: '#10b981' }}>
                                  {job.fineTunedModelId}
                                </div>
                              </div>
                            )}

                            {job.errorMessage && (
                              <div
                                className="mt-3 px-3 py-2 rounded text-[11px]"
                                style={{
                                  background: 'rgba(239,68,68,0.06)',
                                  border: '1px solid rgba(239,68,68,0.15)',
                                  color: '#ef4444',
                                }}
                              >
                                {job.errorMessage}
                              </div>
                            )}

                            {job.evalScores && (
                              <div className="mt-3">
                                <div className="text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                  Eval Scores
                                </div>
                                <pre
                                  className="text-[10px] rounded px-2 py-2 overflow-x-auto"
                                  style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    color: 'rgba(255,255,255,0.5)',
                                  }}
                                >
                                  {JSON.stringify(job.evalScores, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </SectionCard>
                    );
                  })
                )}
              </m.div>
            )}

            {tab === 'models' && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {models.length === 0 ? (
                  <SectionCard className="p-8 text-center">
                    <GitBranch className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No registered models yet
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
                      Models appear here after passing the validation gate
                    </p>
                  </SectionCard>
                ) : (
                  models.map((model) => {
                    const isExpanded = expandedModel === model.modelId;
                    const evalData = modelEvals[model.modelId];
                    const lineageData = modelLineage[model.modelId];
                    return (
                      <SectionCard key={model.modelId}>
                        <button
                          className="w-full p-4 text-left"
                          onClick={() => void handleModelSelect(model.modelId)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                )}
                                <LifecycleBadge lifecycle={model.lifecycle} />
                                <span className="text-[12px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                  {model.agentId}
                                </span>
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                  {model.provider}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono break-all mb-2 pl-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {model.modelId}
                              </div>
                              <div className="flex items-center gap-4 flex-wrap pl-6">
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                  Base: <span style={{ color: 'rgba(255,255,255,0.5)' }}>{model.baseModel}</span>
                                </span>
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                  Pass Rate:{' '}
                                  <span style={{ color: '#10b981' }}>
                                    {(model.evalPassRate * 100).toFixed(1)}%
                                  </span>
                                </span>
                                {model.costPer1kInput != null && (
                                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    Cost/1k input:{' '}
                                    <span style={{ color: '#f59e0b' }}>${model.costPer1kInput.toFixed(4)}</span>
                                  </span>
                                )}
                                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                  Registered {new Date(model.registeredAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              {(
                                [
                                  { lifecycle: 'canary' as Lifecycle, label: '→ Canary' },
                                  { lifecycle: 'active' as Lifecycle, label: '→ Active' },
                                  { lifecycle: 'deprecated' as Lifecycle, label: 'Deprecate' },
                                ] as const
                              )
                                .filter((a) => a.lifecycle !== model.lifecycle)
                                .map((action) => (
                                  <button
                                    key={action.lifecycle}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void handleLifecycleChange(model.modelId, action.lifecycle);
                                    }}
                                    disabled={lifecycleLoading === model.modelId}
                                    className="px-2 py-0.5 rounded text-[10px] transition-opacity hover:opacity-80 text-left"
                                    style={{
                                      background:
                                        action.lifecycle === 'deprecated'
                                          ? 'rgba(239,68,68,0.08)'
                                          : 'rgba(255,255,255,0.04)',
                                      border:
                                        action.lifecycle === 'deprecated'
                                          ? '1px solid rgba(239,68,68,0.2)'
                                          : '1px solid rgba(255,255,255,0.08)',
                                      color:
                                        action.lifecycle === 'deprecated'
                                          ? '#ef4444'
                                          : LIFECYCLE_CONFIG[action.lifecycle].color,
                                    }}
                                  >
                                    {lifecycleLoading === model.modelId ? '…' : action.label}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            {evalLoading === model.modelId ? (
                              <div className="flex items-center gap-2 p-4">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                  Loading eval comparison and lineage…
                                </span>
                              </div>
                            ) : (
                              <div className="p-4 space-y-4">
                                {evalData && (
                                  <div>
                                    <h4 className="text-[11px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                      <TrendingUp className="w-3 h-3" />
                                      Base vs Fine-Tuned Eval Comparison
                                    </h4>
                                    {evalData.comparison && evalData.comparison.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-[11px]">
                                          <thead>
                                            <tr>
                                              {['Metric', `Base (${evalData.baseModel})`, 'Fine-Tuned', 'Delta'].map((h) => (
                                                <th
                                                  key={h}
                                                  className="text-left pb-2 pr-4"
                                                  style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
                                                >
                                                  {h}
                                                </th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {evalData.comparison.map((row) => {
                                              const deltaNum = parseFloat(String(row.delta));
                                              const deltaColor =
                                                isNaN(deltaNum) || row.delta === '—'
                                                  ? 'rgba(255,255,255,0.3)'
                                                  : deltaNum > 0
                                                    ? '#10b981'
                                                    : '#ef4444';
                                              return (
                                                <tr
                                                  key={row.metric}
                                                  style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}
                                                >
                                                  <td className="py-1.5 pr-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    {row.metric}
                                                  </td>
                                                  <td className="py-1.5 pr-4 font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                                    {row.base != null ? String(row.base) : '—'}
                                                  </td>
                                                  <td className="py-1.5 pr-4 font-mono tabular-nums" style={{ color: '#ec4899' }}>
                                                    {row.fineTuned != null ? String(row.fineTuned) : '—'}
                                                  </td>
                                                  <td className="py-1.5 font-mono tabular-nums font-semibold" style={{ color: deltaColor }}>
                                                    {row.delta}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        No eval comparison data available for this model
                                      </p>
                                    )}
                                  </div>
                                )}

                                {lineageData && (
                                  <div>
                                    <h4 className="text-[11px] font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                      <GitBranch className="w-3 h-3" />
                                      Training Lineage — {lineageData.baseModelName}
                                    </h4>
                                    {lineageData.jobHistory.length > 0 ? (
                                      <div className="relative pl-3">
                                        <div
                                          className="absolute left-0 top-2 bottom-2 w-px"
                                          style={{ background: 'rgba(255,255,255,0.06)' }}
                                        />
                                        {lineageData.jobHistory.map((jh, idx) => {
                                          const jhCfg = STATUS_CONFIG[jh.status as JobStatus];
                                          return (
                                            <div key={jh.jobId} className="relative flex items-start gap-3 pb-3">
                                              <div
                                                className="absolute -left-1 top-1 w-2 h-2 rounded-full flex-shrink-0"
                                                style={{
                                                  background: jhCfg?.color ?? 'rgba(255,255,255,0.2)',
                                                  border: '2px solid #070a10',
                                                }}
                                              />
                                              <div className="pl-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                                    {jh.jobId}
                                                  </span>
                                                  <span
                                                    className="text-[9px] px-1.5 py-0.5 rounded"
                                                    style={{
                                                      background: `${jhCfg?.color ?? 'rgba(255,255,255,0.2)'}18`,
                                                      color: jhCfg?.color ?? 'rgba(255,255,255,0.3)',
                                                    }}
                                                  >
                                                    {jh.status}
                                                  </span>
                                                  {idx === 0 && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>
                                                      latest
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                                  {new Date(jh.submittedAt).toLocaleString()} · dataset v{jh.datasetVersion}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        No job history available
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </SectionCard>
                    );
                  })
                )}
              </m.div>
            )}

            {tab === 'dataset' && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <SectionCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="text-[10px] block mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        Agent
                      </label>
                      <select
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                        className="rounded px-2 py-1 text-[12px]"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        {(summary?.supportedAgents ?? []).map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => void handleDatasetPreview()}
                      disabled={previewLoading || !selectedAgent}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-opacity hover:opacity-80 mt-4"
                      style={{
                        background: 'rgba(236,72,153,0.12)',
                        border: '1px solid rgba(236,72,153,0.2)',
                        color: '#ec4899',
                      }}
                    >
                      {previewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                      Preview Dataset
                    </button>
                  </div>
                </SectionCard>

                {datasetPreview && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { label: 'Agent', value: datasetPreview.agentId },
                        { label: 'Version', value: datasetPreview.version },
                        { label: 'Total Samples', value: datasetPreview.sampleCount },
                        { label: 'Format', value: datasetPreview.format },
                      ].map((f) => (
                        <SectionCard key={f.label} className="p-3">
                          <div className="text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {f.label}
                          </div>
                          <div className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                            {f.value}
                          </div>
                        </SectionCard>
                      ))}
                    </div>

                    {Object.keys(datasetPreview.sourceBreakdown ?? {}).length > 0 && (
                      <SectionCard className="p-4">
                        <h3 className="text-[11px] font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Source Breakdown
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(datasetPreview.sourceBreakdown).map(([src, count]) => (
                            <span
                              key={src}
                              className="px-2 py-1 rounded text-[10px]"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                color: 'rgba(255,255,255,0.5)',
                              }}
                            >
                              {src}: <strong>{String(count)}</strong>
                            </span>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    <SectionCard className="p-4">
                      <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        Sample Preview (first {datasetPreview.preview.length} of {datasetPreview.sampleCount})
                      </h3>
                      {datasetPreview.preview.map((sample, i) => (
                        <div
                          key={i}
                          className="mb-3 pb-3"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          <div className="text-[9px] mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                            Sample {i + 1}
                          </div>
                          <pre
                            className="text-[10px] overflow-x-auto rounded px-2 py-2"
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              color: 'rgba(255,255,255,0.45)',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {JSON.stringify(sample, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </SectionCard>
                  </div>
                )}

                {!datasetPreview && !previewLoading && (
                  <SectionCard className="p-10 text-center">
                    <Database className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
                    <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      Select an agent and click Preview Dataset
                    </p>
                  </SectionCard>
                )}
              </m.div>
            )}

            {tab === 'costs' && costs && (
              <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <StatCard
                    label="Total Training Cost"
                    value={`$${costs.totalCostUsd.toFixed(4)}`}
                    color="#f59e0b"
                    icon={DollarSign}
                  />
                  <StatCard
                    label="Total Jobs"
                    value={costs.totalJobs}
                    color="#3b82f6"
                    icon={Zap}
                  />
                  <StatCard
                    label="Succeeded"
                    value={costs.succeededJobs}
                    color="#10b981"
                    icon={TrendingUp}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SectionCard className="p-4">
                    <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Cost by Agent
                    </h3>
                    {Object.keys(costs.byAgent).length === 0 ? (
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        No cost data yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(costs.byAgent)
                          .sort((a, b) => b[1].cost - a[1].cost)
                          .map(([agent, data]) => (
                            <div key={agent} className="flex items-center justify-between">
                              <div>
                                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  {agent}
                                </span>
                                <span className="text-[10px] ml-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                  {data.jobs} job{data.jobs !== 1 ? 's' : ''}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono tabular-nums" style={{ color: '#f59e0b' }}>
                                ${data.cost.toFixed(4)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard className="p-4">
                    <h3 className="text-[11px] font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Cost by Provider
                    </h3>
                    {Object.keys(costs.byProvider).length === 0 ? (
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        No cost data yet
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(costs.byProvider).map(([provider, data]) => {
                          const pct =
                            costs.totalCostUsd > 0 ? (data.cost / costs.totalCostUsd) * 100 : 0;
                          return (
                            <div key={provider}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  {provider}
                                </span>
                                <span className="text-[11px] font-mono tabular-nums" style={{ color: '#f59e0b' }}>
                                  ${data.cost.toFixed(4)}
                                </span>
                              </div>
                              <div
                                className="h-1 rounded-full overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.04)' }}
                              >
                                <m.div
                                  className="h-full rounded-full"
                                  style={{ background: '#f59e0b' }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6 }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                </div>
              </m.div>
            )}

            {tab === 'costs' && !costs && (
              <SectionCard className="p-8 text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No cost data available yet
                </p>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
