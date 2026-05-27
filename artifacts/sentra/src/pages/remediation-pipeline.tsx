// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  GitBranch,
  Hammer,
  Loader2,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  approveRemediation,
  contextualizeRemediation,
  evaluatePolicyRemediation,
  executeRemediation,
  getRemediationMetrics,
  ingestRemediationFinding,
  listRemediationCases,
  recommendRemediation,
  type RemediationCase,
  type RemediationMetrics,
  type RemediationStage,
  seedRemediationDemo,
  simulateRemediation,
  verifyRemediation,
  type IncidentSeverity,
} from '../lib/sentra-api';

const STAGE_ORDER: RemediationStage[] = [
  'ingested',
  'contextualized',
  'recommended',
  'simulated',
  'policy-gated',
  'approved',
  'executing',
  'verifying',
  'resolved',
];

const STAGE_LABEL: Record<RemediationStage, string> = {
  ingested: 'Ingested',
  contextualized: 'Contextualized',
  recommended: 'Recommended',
  simulated: 'Simulated',
  'policy-gated': 'Policy Gated',
  approved: 'Approved',
  executing: 'Executing',
  verifying: 'Verifying',
  resolved: 'Resolved',
  failed: 'Failed',
};

const STAGE_ICON: Record<RemediationStage, typeof Brain> = {
  ingested: AlertTriangle,
  contextualized: FileText,
  recommended: Brain,
  simulated: GitBranch,
  'policy-gated': Shield,
  approved: ShieldCheck,
  executing: Hammer,
  verifying: Target,
  resolved: CheckCircle2,
  failed: XCircle,
};

const SEV_COLOR: Record<IncidentSeverity, string> = {
  critical: '#f5f5f5',
  high: '#c9b787',
  medium: '#8a8a8a',
  low: '#5a5a5a',
};

function formatMttr(seconds: number | null): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86_400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86_400).toFixed(1)}d`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

interface IngestModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function IngestModal({ onClose, onCreated }: IngestModalProps) {
  const [form, setForm] = useState({
    cveId: '',
    title: '',
    description: '',
    severity: 'high' as IncidentSeverity,
    affectedAssets: '',
    source: 'manual',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.title.trim() || form.description.length < 10) {
      setError('Title and a description of at least 10 characters are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const res = await ingestRemediationFinding({
      cveId: form.cveId.trim() || undefined,
      title: form.title,
      description: form.description,
      severity: form.severity,
      affectedAssets: form.affectedAssets
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      source: form.source || 'manual',
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-[#c9b787]/30 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-sm font-bold text-slate-100">Ingest Vulnerability Finding</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">CVE ID</label>
              <input
                value={form.cveId}
                onChange={(e) => setForm({ ...form, cveId: e.target.value })}
                placeholder="CVE-2026-XXXXX"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Severity</label>
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. RCE in OpenSSH 9.2"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe the vulnerability and impact (≥10 chars)…"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">
                Affected Assets (comma-sep)
              </label>
              <input
                value={form.affectedAssets}
                onChange={(e) => setForm({ ...form, affectedAssets: e.target.value })}
                placeholder="host-1, host-2"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1">Source</label>
              <input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="manual / pillpintu / tenable"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 outline-none focus:border-[#c9b787]/40"
              />
            </div>
          </div>
          {error && (
            <div className="text-xs text-[#f5f5f5] bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-xs text-slate-400 hover:bg-slate-800 border border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={() => void submit()}
              disabled={saving}
              className="px-4 py-2 rounded bg-[#c9b787] hover:bg-[#c9b787]/90 text-black text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Ingest Finding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CaseDetailProps {
  remediation: RemediationCase;
  onChange: () => void;
}

function CaseDetail({ remediation, onChange }: CaseDetailProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(label);
    setError(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok && 'error' in res) setError(res.error ?? 'Failed');
    onChange();
  };

  const stage = remediation.stage;

  const Btn = ({
    label,
    icon: Icon,
    onClick,
    enabled,
    primary,
  }: {
    label: string;
    icon: typeof Brain;
    onClick: () => void;
    enabled: boolean;
    primary?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={!enabled || busy !== null}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium border transition-all',
        primary
          ? 'border-[#c9b787]/40 bg-[#c9b787]/10 text-[#c9b787] hover:bg-[#c9b787]/20'
          : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10',
        (!enabled || busy !== null) && 'opacity-40 cursor-not-allowed',
      )}
    >
      {busy === label ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {label}
    </button>
  );

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono text-slate-500">{remediation.id}</span>
            {remediation.cveId && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#c9b787]/30 text-[#c9b787]">
                {remediation.cveId}
              </span>
            )}
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase"
              style={{
                borderColor: `${SEV_COLOR[remediation.severity]}55`,
                color: SEV_COLOR[remediation.severity],
                background: `${SEV_COLOR[remediation.severity]}15`,
              }}
            >
              {remediation.severity}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-slate-400">
              source: {remediation.source}
            </span>
            <span className="text-[10px] text-slate-500">· detected {relTime(remediation.detectedAt)}</span>
          </div>
          <h3 className="text-sm font-semibold text-white truncate">{remediation.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{remediation.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500 uppercase">Stage</div>
          <div className="text-xs font-mono text-[#c9b787]">{STAGE_LABEL[stage]}</div>
          <div className="text-[10px] text-slate-500 mt-1">outcome: {remediation.outcome}</div>
        </div>
      </div>

      {remediation.affectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {remediation.affectedAssets.map((a) => (
            <span key={a} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {a}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Btn
          label="Contextualize"
          icon={FileText}
          enabled={stage === 'ingested'}
          onClick={() => void run('Contextualize', () => contextualizeRemediation(remediation.id))}
        />
        <Btn
          label="Recommend"
          icon={Brain}
          enabled={stage === 'contextualized' || stage === 'ingested'}
          onClick={() => void run('Recommend', () => recommendRemediation(remediation.id))}
        />
        <Btn
          label="Simulate"
          icon={GitBranch}
          enabled={stage === 'recommended'}
          onClick={() => void run('Simulate', () => simulateRemediation(remediation.id))}
        />
        <Btn
          label="Policy Gate"
          icon={Shield}
          enabled={stage === 'simulated'}
          onClick={() => void run('Policy Gate', () => evaluatePolicyRemediation(remediation.id))}
        />
        <Btn
          label="Approve"
          primary
          icon={ShieldCheck}
          enabled={stage === 'policy-gated'}
          onClick={() =>
            void run('Approve', () => approveRemediation(remediation.id, 'approved'))
          }
        />
        <Btn
          label="Reject"
          icon={XCircle}
          enabled={stage === 'policy-gated'}
          onClick={() =>
            void run('Reject', () =>
              approveRemediation(remediation.id, 'rejected', 'risk-accepted'),
            )
          }
        />
        <Btn
          label="Execute"
          primary
          icon={Hammer}
          enabled={stage === 'approved'}
          onClick={() => void run('Execute', () => executeRemediation(remediation.id, 'success'))}
        />
        <Btn
          label="Verify Resolved"
          primary
          icon={Target}
          enabled={stage === 'verifying'}
          onClick={() =>
            void run('Verify Resolved', () =>
              verifyRemediation(remediation.id, {
                method: 'rescan',
                vulnerabilityResolved: true,
                regressionDetected: false,
              }),
            )
          }
        />
        <Btn
          label="Verify Failed"
          icon={XCircle}
          enabled={stage === 'verifying'}
          onClick={() =>
            void run('Verify Failed', () =>
              verifyRemediation(remediation.id, {
                method: 'rescan',
                vulnerabilityResolved: false,
                regressionDetected: true,
                notes: 'Vulnerability still present after patch',
              }),
            )
          }
        />
      </div>

      {error && (
        <div className="text-[11px] text-[#f5f5f5] bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {remediation.recommendation && (
          <div className="rounded border border-white/10 bg-white/3 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-3 h-3 text-[#c9b787]" />
              <span className="text-[10px] uppercase font-mono text-slate-500">Recommendation</span>
              <span className="text-[10px] font-mono text-[#c9b787] ml-auto">
                {Math.round(remediation.recommendation.confidence * 100)}% conf
              </span>
            </div>
            <div className="text-[11px] text-slate-200 mb-1">{remediation.recommendation.action}</div>
            <div className="text-[10px] text-slate-500">{remediation.recommendation.rationale}</div>
            <div className="text-[10px] text-slate-600 mt-1">type: {remediation.recommendation.type}</div>
          </div>
        )}
        {remediation.simulation && (
          <div className="rounded border border-white/10 bg-white/3 p-3">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="w-3 h-3 text-[#c9b787]" />
              <span className="text-[10px] uppercase font-mono text-slate-500">Simulation</span>
              <span
                className="text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded"
                style={{
                  background: `${
                    remediation.simulation.blastRadius === 'high'
                      ? '#f5f5f5'
                      : remediation.simulation.blastRadius === 'medium'
                        ? '#c9b787'
                        : '#5a5a5a'
                  }20`,
                  color:
                    remediation.simulation.blastRadius === 'high'
                      ? '#f5f5f5'
                      : remediation.simulation.blastRadius === 'medium'
                        ? '#c9b787'
                        : '#a0a0a0',
                }}
              >
                blast: {remediation.simulation.blastRadius}
              </span>
            </div>
            <div className="text-[11px] text-slate-200">
              {remediation.simulation.affectedSystemCount} systems · ~
              {remediation.simulation.estimatedDowntimeMinutes}m downtime
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Rollback: {remediation.simulation.rollbackPlan}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">
              dependencies: {remediation.simulation.dependencyImpact.join(', ')}
            </div>
          </div>
        )}
        {remediation.policy && (
          <div className="rounded border border-white/10 bg-white/3 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-[#c9b787]" />
              <span className="text-[10px] uppercase font-mono text-slate-500">Covenant Policy</span>
              <span className="text-[10px] font-mono text-[#c9b787] ml-auto uppercase">
                {remediation.policy.requiredTier}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">{remediation.policy.tierReason}</div>
            {remediation.policy.decision && (
              <div className="text-[10px] text-slate-500 mt-1">
                Decision: <span className="text-slate-300">{remediation.policy.decision}</span>
                {remediation.policy.approvedBy && ` by ${remediation.policy.approvedBy}`}
              </div>
            )}
          </div>
        )}
        {remediation.execution && (
          <div className="rounded border border-white/10 bg-white/3 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hammer className="w-3 h-3 text-[#c9b787]" />
              <span className="text-[10px] uppercase font-mono text-slate-500">Execution</span>
              <span className="text-[10px] font-mono text-[#c9b787] ml-auto">
                {remediation.execution.result}
              </span>
            </div>
            <div className="text-[11px] text-slate-200 truncate">{remediation.execution.instructions}</div>
            <div className="text-[10px] text-slate-500 mt-1">
              Dispatched to {remediation.execution.dispatchedTo.length} target(s)
              {remediation.execution.executor && ` by ${remediation.execution.executor}`}
            </div>
          </div>
        )}
        {remediation.verification && (
          <div className="rounded border border-white/10 bg-white/3 p-3 md:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-3 h-3 text-[#c9b787]" />
              <span className="text-[10px] uppercase font-mono text-slate-500">Verification & Outcome</span>
              <span
                className="text-[10px] font-mono ml-auto px-1.5 py-0.5 rounded"
                style={{
                  background: remediation.verification.vulnerabilityResolved ? '#10b98120' : '#f5f5f520',
                  color: remediation.verification.vulnerabilityResolved ? '#10b981' : '#f5f5f5',
                }}
              >
                {remediation.verification.vulnerabilityResolved ? 'RESOLVED' : 'NOT RESOLVED'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300">
              Method: {remediation.verification.method}
              {remediation.verification.regressionDetected && (
                <span className="text-[#f5f5f5] ml-2">· REGRESSION DETECTED</span>
              )}
            </div>
            {remediation.verification.notes && (
              <div className="text-[10px] text-slate-500 mt-1">{remediation.verification.notes}</div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase font-mono text-slate-500 mb-2 flex items-center gap-2">
          <Activity className="w-3 h-3" />
          Proof Chain · Timeline ({remediation.timeline.length} events ·{' '}
          {remediation.proofChainIds.length} signed)
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
          {remediation.timeline.map((entry) => (
            <div key={entry.id} className="flex gap-3 text-[11px]">
              <div className="font-mono text-slate-500 w-16 shrink-0">{relTime(entry.timestamp)}</div>
              <div className="flex-1">
                <div className="text-slate-300">{entry.message}</div>
                <div className="text-[10px] text-slate-600 font-mono">
                  {entry.actor} · stage: {entry.stage}
                  {entry.proofId && (
                    <span className="ml-2 text-[#c9b787]">⛓ proof #{entry.proofId}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RemediationPipeline() {
  const [cases, setCases] = useState<RemediationCase[]>([]);
  const [metrics, setMetrics] = useState<RemediationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIngest, setShowIngest] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [stageFilter, setStageFilter] = useState<RemediationStage | 'all'>('all');

  const refresh = useCallback(async () => {
    const [casesRes, metricsRes] = await Promise.all([listRemediationCases(), getRemediationMetrics()]);
    setCases(casesRes.cases);
    setMetrics(metricsRes);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const seed = async () => {
    setSeeding(true);
    await seedRemediationDemo();
    await refresh();
    setSeeding(false);
  };

  const filtered = useMemo(
    () => (stageFilter === 'all' ? cases : cases.filter((c) => c.stage === stageFilter)),
    [cases, stageFilter],
  );

  const selected = useMemo(() => cases.find((c) => c.id === selectedId) ?? null, [cases, selectedId]);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-xs text-zinc-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading remediation pipeline…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#c9b787]" />
            <h1 className="text-lg font-semibold text-white">Remediation Pipeline</h1>
            <span className="text-[9px] px-2 py-0.5 rounded-full border border-[#c9b787]/30 bg-[#c9b787]/10 text-[#c9b787] font-mono uppercase">
              Patching Gap · Governed
            </span>
          </div>
          <p className="text-xs text-zinc-500 max-w-3xl">
            Vulnerability findings flow through the canonical nine-step decision loop —
            ingest → context → recommend → simulate → policy gate → execute → verify →
            outcome — with every transition cryptographically bound to the Proof Chain.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            className="px-3 py-1.5 rounded text-xs text-slate-400 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          {cases.length === 0 && (
            <button
              onClick={() => void seed()}
              disabled={seeding}
              className="px-3 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-800 border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              {seeding && <Loader2 className="w-3 h-3 animate-spin" />}
              Seed demo cases
            </button>
          )}
          <button
            onClick={() => setShowIngest(true)}
            className="px-3 py-1.5 rounded text-xs font-bold bg-[#c9b787] hover:bg-[#c9b787]/90 text-black flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" />
            Ingest Finding
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Open Cases', value: metrics?.open ?? 0, icon: Activity, color: '#c9b787' },
          { label: 'Resolved', value: metrics?.resolved ?? 0, icon: CheckCircle2, color: '#10b981' },
          { label: 'Failed', value: metrics?.failed ?? 0, icon: XCircle, color: '#f5f5f5' },
          {
            label: 'Success Rate',
            value: metrics ? `${Math.round(metrics.successRate * 100)}%` : '—',
            icon: Gauge,
            color: '#c9b787',
          },
          {
            label: 'MTTR',
            value: formatMttr(metrics?.meanTimeToRemediateSeconds ?? null),
            icon: Clock,
            color: '#8a8a8a',
          },
          {
            label: 'Pending Approval',
            value: metrics?.approvalBottleneck.pending ?? 0,
            sub:
              metrics && metrics.approvalBottleneck.oldestAgeMinutes > 0
                ? `oldest ${metrics.approvalBottleneck.oldestAgeMinutes}m`
                : '—',
            icon: Shield,
            color: '#c9b787',
          },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase">{m.label}</span>
                <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
              </div>
              <div className="text-xl font-bold text-white font-mono">{m.value}</div>
              {'sub' in m && m.sub && <div className="text-[10px] text-zinc-500 mt-0.5">{m.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Open findings by severity — Patching Gap dashboard requirement */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#c9b787]" />
          Open Findings by Severity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['critical', 'high', 'medium', 'low'] as const).map((sev) => {
            const total = metrics?.bySeverity[sev] ?? 0;
            const open = cases.filter(
              (c) => c.severity === sev && c.stage !== 'resolved' && c.stage !== 'failed',
            ).length;
            const tone =
              sev === 'critical'
                ? 'border-red-500/30 bg-red-500/5'
                : sev === 'high'
                  ? 'border-orange-500/30 bg-orange-500/5'
                  : sev === 'medium'
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'border-zinc-500/30 bg-zinc-500/5';
            const dot =
              sev === 'critical'
                ? 'text-red-400'
                : sev === 'high'
                  ? 'text-orange-400'
                  : sev === 'medium'
                    ? 'text-amber-400'
                    : 'text-zinc-400';
            return (
              <div key={sev} className={cn('rounded-xl border p-3', tone)}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn('text-[10px] uppercase font-mono', dot)}>{sev}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{total} total</span>
                </div>
                <div className="text-2xl font-bold text-white font-mono leading-none">{open}</div>
                <div className="text-[10px] text-zinc-500 mt-1">open</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage funnel */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#c9b787]" />
          Pipeline Stages
        </h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          <button
            onClick={() => setStageFilter('all')}
            className={cn(
              'shrink-0 rounded-xl border p-3 min-w-[100px] text-left transition-all',
              stageFilter === 'all' ? 'border-[#c9b787]/40 bg-[#c9b787]/5' : 'border-white/8 bg-white/3 hover:bg-white/5',
            )}
          >
            <div className="text-[10px] text-zinc-500 uppercase">All</div>
            <div className="text-sm font-bold text-white font-mono">{cases.length}</div>
          </button>
          {STAGE_ORDER.map((stage, i) => {
            const Icon = STAGE_ICON[stage];
            const count = metrics?.byStage[stage] ?? 0;
            return (
              <div key={stage} className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setStageFilter(stage)}
                  className={cn(
                    'rounded-xl border p-3 min-w-[120px] text-left transition-all',
                    stageFilter === stage
                      ? 'border-[#c9b787]/40 bg-[#c9b787]/5'
                      : 'border-white/8 bg-white/3 hover:bg-white/5',
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3 h-3 text-[#c9b787]" />
                    <span className="text-[10px] text-white">{STAGE_LABEL[stage]}</span>
                  </div>
                  <div className="text-sm font-bold text-white font-mono">{count}</div>
                </button>
                {i < STAGE_ORDER.length - 1 && <ArrowRight className="w-3 h-3 text-zinc-700" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cases list + detail */}
      {cases.length === 0 ? (
        <div className="rounded-xl border border-white/8 bg-white/3 p-8 text-center">
          <Zap className="w-8 h-8 text-[#c9b787] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No remediation cases yet</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-4">
            Ingest a vulnerability finding manually or push one to the
            <span className="font-mono text-[#c9b787] mx-1">/api/sentra/remediation/ingest</span>
            webhook to start the governed remediation lifecycle.
          </p>
          <button
            onClick={() => void seed()}
            disabled={seeding}
            className="px-4 py-2 rounded text-xs text-slate-200 hover:bg-slate-800 border border-slate-700 inline-flex items-center gap-2 disabled:opacity-50"
          >
            {seeding && <Loader2 className="w-3 h-3 animate-spin" />}
            Seed demo cases
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2 lg:max-h-[80vh] lg:overflow-y-auto pr-1">
            <div className="text-[10px] uppercase font-mono text-slate-500 px-1">
              Cases ({filtered.length})
            </div>
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition-all',
                  selectedId === c.id
                    ? 'border-[#c9b787]/40 bg-[#c9b787]/5'
                    : 'border-white/8 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-white truncate">{c.title}</span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: `${SEV_COLOR[c.severity]}20`,
                      color: SEV_COLOR[c.severity],
                    }}
                  >
                    {c.severity}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 flex-wrap">
                  <span className="font-mono">{c.id}</span>
                  {c.cveId && <span className="font-mono text-[#c9b787]">{c.cveId}</span>}
                  <span className="text-[#c9b787]">{STAGE_LABEL[c.stage]}</span>
                  <span className="ml-auto">{relTime(c.detectedAt)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-[11px] text-slate-500 px-1 py-3">No cases at this stage.</div>
            )}
          </div>
          <div className="lg:col-span-2">
            {selected ? (
              <CaseDetail remediation={selected} onChange={() => void refresh()} />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/3 p-8 text-center text-xs text-slate-500">
                Select a remediation case from the list to inspect its proof chain and advance its lifecycle.
              </div>
            )}
          </div>
        </div>
      )}

      {showIngest && (
        <IngestModal
          onClose={() => setShowIngest(false)}
          onCreated={() => {
            setShowIngest(false);
            void refresh();
          }}
        />
      )}
    </div>
  );
}
