import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart2,
  ChevronRight,
  CheckCircle2,
  FlaskConical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Shield,
  StopCircle,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface ExperimentVariant {
  id: number;
  key: string;
  name: string;
  isControl: boolean;
  trafficWeight: number;
  config: Record<string, unknown> | null;
}

interface Experiment {
  id: number;
  key: string;
  name: string;
  description: string | null;
  hypothesis: string | null;
  type: string;
  status: string;
  primaryMetric: string;
  isBandit: boolean;
  trafficAllocation: number;
  minSampleSize: number;
  startedAt: string | null;
  concludedAt: string | null;
  winnerId: number | null;
  stopReason: string | null;
  createdAt: string;
  variants: ExperimentVariant[];
}

interface VariantMetrics {
  variantId: number;
  variantKey: string;
  variantName: string;
  isControl: boolean;
  exposures: number;
  conversions: number;
  conversionRate: number;
  errorCount: number;
}

interface BayesianVariantResult {
  variantKey: string;
  posteriorMean?: number;
  probabilityToBeatControl: number | null;
  expectedLift: number | null;
  expectedLiftInterval: [number, number] | null;
  thompsonWeight: number;
}

interface Analysis {
  experimentId: number;
  variantMetrics: VariantMetrics[];
  bayesian: {
    analysisType: string;
    variants: BayesianVariantResult[];
    recommendedVariant: string | null;
    isBandit: boolean;
    banditWeights: Record<string, number>;
    minSampleSizeReached: boolean;
    sampleSizeRecommendation: number;
  };
  frequentist: {
    pValue: number;
    effectSize: number;
    winner: string;
  } | null;
  guardRailsStatus: {
    metric: string;
    status: 'ok' | 'warning' | 'violated';
    controlValue: number;
    variantValue: number;
    relativeDrop: number;
    threshold: number;
  }[];
  shouldAutoStop: boolean;
  autoStopReason: string | null;
}

interface Summary {
  total: number;
  running: number;
  concluded: number;
  paused: number;
  draft: number;
  stopped: number;
  bandit: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  running: { label: 'Running', color: 'text-[#6b8f71]', bg: 'bg-[#6b8f71]/10', icon: Play },
  paused: { label: 'Paused', color: 'text-[#d4a054]', bg: 'bg-[#d4a054]/10', icon: Pause },
  concluded: {
    label: 'Concluded',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    icon: Trophy,
  },
  draft: { label: 'Draft', color: 'text-muted-foreground', bg: 'bg-muted', icon: FlaskConical },
  stopped: {
    label: 'Stopped',
    color: 'text-[#c45a4a]',
    bg: 'bg-[#c45a4a]/10',
    icon: StopCircle,
  },
};

const TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  ml_model: 'ML Model',
  content: 'Content',
  pricing: 'Pricing',
  workflow: 'Workflow',
};

function ProbabilityBar({
  value,
  label,
  color = 'bg-primary',
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="font-mono font-semibold text-foreground">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function CreateExperimentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    key: '',
    name: '',
    description: '',
    type: 'product' as const,
    primaryMetric: 'conversion_rate',
    isBandit: false,
    trafficAllocation: 100,
    minSampleSize: 100,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const controlVariant = { key: 'control', name: 'Control', isControl: true, trafficWeight: 50 };
  const treatmentVariant = { key: 'treatment', name: 'Treatment A', isControl: false, trafficWeight: 50 };

  const handleCreate = async () => {
    if (!form.key || !form.name) {
      setError('Key and name are required');
      return;
    }
    if (!/^[a-z0-9_-]+$/.test(form.key)) {
      setError('Key must be lowercase alphanumeric with underscores/hyphens');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/experiments', {
        method: 'POST',
        body: JSON.stringify({ ...form, variants: [controlVariant, treatmentVariant] }),
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create experiment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">New Experiment</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="text-xs text-[#c45a4a] bg-[#c45a4a]/10 border border-[#c45a4a]/20 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                Key *
              </label>
              <input
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                placeholder="checkout_flow_v2"
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
              Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Checkout Flow Redesign"
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What are you testing and why?"
              rows={2}
              className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                Primary Metric
              </label>
              <input
                value={form.primaryMetric}
                onChange={(e) => setForm({ ...form, primaryMetric: e.target.value })}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                Traffic %
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.trafficAllocation}
                onChange={(e) => setForm({ ...form, trafficAllocation: parseInt(e.target.value) })}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">
                Min Samples
              </label>
              <input
                type="number"
                min={10}
                value={form.minSampleSize}
                onChange={(e) => setForm({ ...form, minSampleSize: parseInt(e.target.value) })}
                className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isBandit}
              onChange={(e) => setForm({ ...form, isBandit: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">
              <span className="font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#d4a054]" /> Multi-Armed Bandit (Thompson Sampling)
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Dynamically shifts traffic toward the better-performing variant
              </span>
            </span>
          </label>

          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              Default Variants (50/50 split)
            </div>
            <div className="flex gap-2">
              {[controlVariant, treatmentVariant].map((v) => (
                <div
                  key={v.key}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <div className="text-xs font-semibold">{v.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {v.isControl ? 'Control' : 'Treatment'} · 50% weight
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Experiment'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalysisPanel({ experimentId }: { experimentId: number }) {
  const { data, isLoading, refetch } = useStandardQuery<Analysis>({
    queryKey: ['experiment-analysis', experimentId],
    queryFn: () => apiFetch(`/experiments/${experimentId}/analysis`),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No analysis data yet — start the experiment to begin collecting results.
      </div>
    );
  }

  const { variantMetrics, bayesian, frequentist, guardRailsStatus, shouldAutoStop } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Analysis
        </span>
        <button
          onClick={() => refetch()}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {shouldAutoStop && (
        <div className="flex items-start gap-2 p-3 bg-[#c45a4a]/10 border border-[#c45a4a]/30 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-[#c45a4a] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-[#c45a4a]">Guard Rail Triggered</div>
            <div className="text-[10px] text-muted-foreground">{data.autoStopReason}</div>
          </div>
        </div>
      )}

      {bayesian.recommendedVariant && (
        <div className="flex items-start gap-2 p-3 bg-[#6b8f71]/10 border border-[#6b8f71]/30 rounded-lg">
          <Trophy className="w-3.5 h-3.5 text-[#6b8f71] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-[#6b8f71]">
              Recommended Winner: {bayesian.recommendedVariant}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ≥95% probability to beat control — ready to promote
            </div>
          </div>
        </div>
      )}

      {!bayesian.minSampleSizeReached && (
        <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Need ~{bayesian.sampleSizeRecommendation.toLocaleString()} more samples for reliable results
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
          Bayesian Results ({bayesian.analysisType === 'beta_binomial' ? 'Beta-Binomial' : 'Normal-Normal'})
        </div>
        {bayesian.variants.map((v) => (
          <div key={v.variantKey} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">{v.variantKey}</span>
              <span className="text-[10px] text-muted-foreground">
                Thompson: {((v.thompsonWeight ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            {v.probabilityToBeatControl !== null && (
              <ProbabilityBar
                value={v.probabilityToBeatControl}
                label="P(beat control)"
                color={v.probabilityToBeatControl >= 0.95 ? 'bg-[#6b8f71]' : v.probabilityToBeatControl >= 0.8 ? 'bg-[#d4a054]' : 'bg-primary'}
              />
            )}
            {v.expectedLift !== null && v.expectedLift !== 0 && (
              <div className="text-[10px] text-muted-foreground">
                Expected lift:{' '}
                <span
                  className={`font-semibold ${v.expectedLift > 0 ? 'text-[#6b8f71]' : 'text-[#c45a4a]'}`}
                >
                  {v.expectedLift > 0 ? '+' : ''}
                  {(v.expectedLift * 100).toFixed(1)}%
                </span>
                {v.expectedLiftInterval && (
                  <span className="ml-1 text-muted-foreground/60">
                    [{(v.expectedLiftInterval[0] * 100).toFixed(1)}%,{' '}
                    {(v.expectedLiftInterval[1] * 100).toFixed(1)}%]
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
          Sample Sizes
        </div>
        <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {variantMetrics.map((v) => (
            <div key={v.variantId} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{v.variantName}</span>
                {v.isControl && (
                  <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    CONTROL
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs font-mono">{v.exposures.toLocaleString()} exp.</div>
                <div className="text-[10px] text-muted-foreground">
                  {(v.conversionRate * 100).toFixed(2)}% conv.
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {frequentist && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
            Frequentist (Z-Test)
          </div>
          <div className="flex items-center gap-4 text-xs bg-muted/50 rounded-lg px-3 py-2">
            <span>
              p-value:{' '}
              <span
                className={`font-mono font-semibold ${frequentist.pValue < 0.05 ? 'text-[#6b8f71]' : 'text-muted-foreground'}`}
              >
                {frequentist.pValue.toFixed(4)}
              </span>
            </span>
            <span>
              Cohen's d:{' '}
              <span className="font-mono font-semibold">{frequentist.effectSize.toFixed(3)}</span>
            </span>
            <span
              className={`capitalize font-semibold ${
                frequentist.winner === 'treatment'
                  ? 'text-[#6b8f71]'
                  : frequentist.winner === 'control'
                    ? 'text-[#c45a4a]'
                    : 'text-muted-foreground'
              }`}
            >
              {frequentist.winner}
            </span>
          </div>
        </div>
      )}

      {guardRailsStatus.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold flex items-center gap-1">
            <Shield className="w-3 h-3" /> Guard Rails
          </div>
          {guardRailsStatus.map((g, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg border ${
                g.status === 'violated'
                  ? 'border-[#c45a4a]/30 bg-[#c45a4a]/10'
                  : g.status === 'warning'
                    ? 'border-[#d4a054]/30 bg-[#d4a054]/10'
                    : 'border-border bg-muted/30'
              }`}
            >
              <span className="font-medium">{g.metric}</span>
              <span
                className={
                  g.status === 'violated'
                    ? 'text-[#c45a4a]'
                    : g.status === 'warning'
                      ? 'text-[#d4a054]'
                      : 'text-[#6b8f71]'
                }
              >
                {g.status === 'ok' ? '✓ OK' : g.status === 'warning' ? '⚠ Warning' : '✗ Violated'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExperimentsPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: summary } = useStandardQuery<Summary>({
    queryKey: ['experiment-summary'],
    queryFn: () => apiFetch('/experiments/summary'),
    refetchInterval: 60_000,
  });

  const { data: experiments, isLoading, error } = useStandardQuery<Experiment[]>({
    queryKey: ['experiments', statusFilter],
    queryFn: () =>
      apiFetch(`/experiments${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
    refetchInterval: 30_000,
  });

  const selected = experiments?.find((e) => e.id === selectedId) ?? null;

  const lifecycleMutation = useStandardMutation({
    mutationFn: ({ id, action }: { id: number; action: string }) =>
      apiFetch(`/experiments/${id}/${action}`, { method: 'POST', body: '{}' }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['experiments'] });
      qc.invalidateQueries({ queryKey: ['experiment-summary'] });
      qc.invalidateQueries({ queryKey: ['experiment-analysis', selectedId] });
    },
  });

  const promoteMutation = useStandardMutation({
    mutationFn: ({ id, winnerId }: { id: number; winnerId: number }) =>
      apiFetch(`/experiments/${id}/promote`, {
        method: 'POST',
        body: JSON.stringify({ winnerId }),
      }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['experiments'] });
      qc.invalidateQueries({ queryKey: ['experiment-summary'] });
    },
  });

  const handleInvalidate = () => {
    qc.invalidateQueries({ queryKey: ['experiments'] });
    qc.invalidateQueries({ queryKey: ['experiment-summary'] });
  };

  const filtered = experiments ?? [];

  return (
    <div className="space-y-5">
      {showCreate && (
        <CreateExperimentModal onClose={() => setShowCreate(false)} onCreated={handleInvalidate} />
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            Experimentation
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Bayesian A/B testing with Thompson sampling and guard rails
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> New Experiment
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Running', value: summary?.running, color: 'text-[#6b8f71]', icon: Play },
          { label: 'Concluded', value: summary?.concluded, color: 'text-violet-400', icon: Trophy },
          { label: 'Total', value: summary?.total, color: 'text-foreground', icon: BarChart2 },
          { label: 'Bandit Mode', value: summary?.bandit, color: 'text-[#d4a054]', icon: Zap },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <Icon className={`w-3.5 h-3.5 ${color} mb-2`} />
            <div className={`text-2xl font-bold font-display ${color}`}>{value ?? '—'}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {['all', 'running', 'draft', 'paused', 'concluded', 'stopped'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors capitalize ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <AlertTriangle className="w-8 h-8 text-[#d4a054] mx-auto mb-2" />
          <p>Experiments require API connection</p>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_380px] gap-4">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground border border-border rounded-xl bg-card">
                No experiments found.{' '}
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-primary hover:underline"
                >
                  Create one
                </button>
              </div>
            ) : (
              filtered.map((exp) => {
                const cfg = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.draft;
                const StatusIcon = cfg.icon;
                const isSelected = selectedId === exp.id;
                return (
                  <button
                    key={exp.id}
                    onClick={() => setSelectedId(isSelected ? null : exp.id)}
                    className={`w-full text-left rounded-xl border p-4 transition-all duration-150 ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold truncate">{exp.name}</span>
                          {exp.isBandit && (
                            <span className="flex items-center gap-0.5 text-[9px] text-[#d4a054] bg-[#d4a054]/10 px-1.5 py-0.5 rounded font-semibold">
                              <Zap className="w-2.5 h-2.5" /> BANDIT
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {TYPE_LABELS[exp.type] ?? exp.type}
                          </span>
                        </div>
                        <code className="text-[10px] text-muted-foreground font-mono">
                          {exp.key}
                        </code>
                        {exp.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {exp.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>{exp.variants.length} variants</span>
                          <span>{exp.trafficAllocation}% traffic</span>
                          <span>≥{exp.minSampleSize.toLocaleString()} samples</span>
                          {exp.startedAt && (
                            <span>
                              Started {new Date(exp.startedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${cfg.color} ${cfg.bg}`}
                        >
                          <StatusIcon className="w-2.5 h-2.5" />
                          {cfg.label}
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selected ? (
            <div className="border border-border rounded-xl bg-card sticky top-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{selected.name}</div>
                    <code className="text-[10px] text-muted-foreground font-mono">{selected.key}</code>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {selected.status === 'draft' || selected.status === 'paused' ? (
                    <button
                      onClick={() => lifecycleMutation.mutate({ id: selected.id, action: 'start' })}
                      disabled={lifecycleMutation.isPending}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[#6b8f71] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" /> Start
                    </button>
                  ) : null}
                  {selected.status === 'running' ? (
                    <>
                      <button
                        onClick={() => lifecycleMutation.mutate({ id: selected.id, action: 'pause' })}
                        disabled={lifecycleMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold bg-[#d4a054] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                      <button
                        onClick={() => lifecycleMutation.mutate({ id: selected.id, action: 'conclude' })}
                        disabled={lifecycleMutation.isPending}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold border border-border text-muted-foreground rounded-lg hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Conclude
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">
                    Variants
                  </div>
                  <div className="space-y-1">
                    {selected.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between border border-border rounded-lg px-3 py-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium">{v.name}</span>
                            {v.isControl && (
                              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                CONTROL
                              </span>
                            )}
                            {selected.winnerId === v.id && (
                              <Trophy className="w-3 h-3 text-[#d4a054]" />
                            )}
                          </div>
                          <code className="text-[10px] text-muted-foreground font-mono">{v.key}</code>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{v.trafficWeight}w</span>
                          {!v.isControl &&
                            (selected.status === 'running' ||
                              selected.status === 'concluded') && (
                              <button
                                onClick={() =>
                                  promoteMutation.mutate({ id: selected.id, winnerId: v.id })
                                }
                                disabled={promoteMutation.isPending}
                                className="text-[10px] text-[#6b8f71] hover:underline disabled:opacity-50"
                              >
                                Promote
                              </button>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.stopReason && (
                  <div className="text-[10px] text-[#c45a4a] bg-[#c45a4a]/10 border border-[#c45a4a]/20 rounded-lg px-3 py-2">
                    Stopped: {selected.stopReason}
                  </div>
                )}

                {selected.status !== 'draft' && <AnalysisPanel experimentId={selected.id} />}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm">
              Select an experiment to view details
            </div>
          )}
        </div>
      )}
    </div>
  );
}
