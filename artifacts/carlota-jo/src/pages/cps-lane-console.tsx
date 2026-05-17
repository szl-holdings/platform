import { useEffect, useState } from 'react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  HeartHandshake,
  RotateCcw,
  Shield,
  Zap,
  XCircle,
} from 'lucide-react';

const PAYLOAD_ID = 'cps-carlota-client-protection';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ApprovalTier = 'auto' | 'operator' | 'supervisor' | 'executive' | 'dual-executive';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface CpsSignal {
  id: string;
  type: string;
  severity: RiskLevel;
  description: string;
}

interface CpsDetect {
  triggered: boolean;
  signals: CpsSignal[];
  confidence: number;
}

interface CpsDecide {
  action: string;
  riskLevel: RiskLevel;
  reasoning: string;
}

interface CpsProof {
  id: string;
  signature: string;
  generatedAt: string;
  residualRisk: string;
  classification: string;
  sections?: { act?: unknown[] };
}

interface CpsRun {
  id: string;
  payloadId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  detect: CpsDetect | null;
  decide: CpsDecide | null;
  proofBundle: CpsProof | null;
}

interface CpsApproval {
  id: string;
  runId: string;
  tier: ApprovalTier;
  status: ApprovalStatus;
  deadlineAt: string;
  respondedAt?: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string }> = {
  completed: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Completed' },
  'awaiting-approval': { icon: Clock, color: 'text-amber-400', label: 'Awaiting Approval' },
  acting: { icon: Zap, color: 'text-blue-400', label: 'Acting' },
  detecting: { icon: Eye, color: 'text-blue-300', label: 'Detecting' },
  deciding: { icon: Activity, color: 'text-blue-300', label: 'Deciding' },
  recovering: { icon: RotateCcw, color: 'text-cyan-400', label: 'Recovering' },
  'rolled-back': { icon: RotateCcw, color: 'text-orange-400', label: 'Rolled Back' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  blocked: { icon: AlertTriangle, color: 'text-red-400', label: 'Blocked' },
  pending: { icon: Clock, color: 'text-slate-400', label: 'Pending' },
};

const cpsApi = {
  runs: {
    list: (params?: { payloadId?: string }) => {
      const q = new URLSearchParams();
      if (params?.payloadId) q.set('payloadId', params.payloadId);
      return apiFetch<CpsRun[]>(`/cps/runs${q.toString() ? `?${q}` : ''}`);
    },
    execute: (payloadId: string) =>
      apiFetch<CpsRun>('/cps/runs', { method: 'POST', body: JSON.stringify({ payloadId }) }),
    proofBundle: (id: string) => apiFetch<CpsProof>(`/cps/runs/${id}/proof-bundle`),
  },
  approvals: {
    list: (params?: { status?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      return apiFetch<CpsApproval[]>(`/cps/approvals${q.toString() ? `?${q}` : ''}`);
    },
    respond: (id: string, approved: boolean, reason?: string) =>
      apiFetch<CpsApproval>(`/cps/approvals/${id}`, {
        method: 'POST',
        body: JSON.stringify({ approved, reason }),
      }),
  },
};

export default function CarlotaCpsLaneConsole() {
  const [runs, setRuns] = useState<CpsRun[]>([]);
  const [approvals, setApprovals] = useState<CpsApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proofBundles, setProofBundles] = useState<Record<string, CpsProof>>({});
  const [executing, setExecuting] = useState(false);
  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'runs' | 'approvals' | 'transcripts'>('runs');

  async function loadData() {
    setLoading(true);
    const [runsData, approvalsData] = await Promise.allSettled([
      cpsApi.runs.list({ payloadId: PAYLOAD_ID }),
      cpsApi.approvals.list({ status: 'pending' }),
    ]);
    const laneRuns = runsData.status === 'fulfilled' ? runsData.value : [];
    setRuns(laneRuns);
    if (approvalsData.status === 'fulfilled') {
      const laneRunIds = new Set(laneRuns.map((r) => r.id));
      setApprovals(approvalsData.value.filter((a) => laneRunIds.has(a.runId)));
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleExecute() {
    setExecuting(true);
    try {
      const run = await cpsApi.runs.execute(PAYLOAD_ID);
      setRuns((prev) => [run, ...prev]);
    } catch { /* handled */ }
    setExecuting(false);
  }

  async function handleViewProof(runId: string) {
    if (proofBundles[runId]) return;
    try {
      const bundle = await cpsApi.runs.proofBundle(runId);
      setProofBundles((prev) => ({ ...prev, [runId]: bundle }));
    } catch { /* handled */ }
  }

  function downloadTrustTranscript(runId: string) {
    const bundle = proofBundles[runId];
    if (!bundle) return;
    const transcript = {
      type: 'trust-transcript',
      runId,
      generatedAt: bundle.generatedAt,
      signature: bundle.signature,
      actions: bundle.sections?.act ?? [],
      residualRisk: bundle.residualRisk,
      note: 'This trust transcript certifies the actions taken on your behalf by the Carlota Jo advisory platform.',
    };
    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trust-transcript-${runId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleApprovalRespond(id: string, approved: boolean) {
    setProcessingApprovalId(id);
    try {
      await cpsApi.approvals.respond(id, approved);
      const newStatus: ApprovalStatus = approved ? 'approved' : 'rejected';
      setApprovals((prev) => prev.map((a) =>
        a.id === id ? { ...a, status: newStatus, respondedAt: new Date().toISOString() } : a,
      ));
    } catch { /* handled */ }
    setProcessingApprovalId(null);
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const completedWithProof = runs.filter((r) => r.status === 'completed' && r.proofBundle);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartHandshake className="w-5 h-5 text-rose-400" />
            <h1 className="text-2xl font-display font-bold text-slate-100">Client-Protection Interceptor</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-rose-500/30 text-rose-400 bg-rose-500/10">
              CPS · Client Protection
            </span>
          </div>
          <p className="text-slate-400 text-sm">
            Privacy breach · SLA risk · Reputation risk — per-action trust transcripts
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {pendingApprovals.length > 0 && (
            <div className="text-[10px] font-mono px-3 py-1 rounded-full border border-amber-500/30 text-amber-400 bg-amber-500/10">
              {pendingApprovals.length} consent gate{pendingApprovals.length > 1 ? 's' : ''} pending
            </div>
          )}
          <button
            onClick={handleExecute}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            {executing ? 'Executing…' : 'Run Detection'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Runs', value: runs.length, color: 'text-slate-200' },
          { label: 'Completed', value: runs.filter((r) => r.status === 'completed').length, color: 'text-emerald-400' },
          { label: 'Consent Gates', value: pendingApprovals.length, color: 'text-amber-400' },
          { label: 'Transcripts', value: completedWithProof.length, color: 'text-rose-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-[10px] text-slate-500 font-mono uppercase">{stat.label}</div>
            <div className={cn('text-2xl font-display font-bold mt-1', stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-white/10">
        {(['runs', 'approvals', 'transcripts'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            )}
          >
            {tab === 'approvals'
              ? `Consent Gates${pendingApprovals.length > 0 ? ` (${pendingApprovals.length})` : ''}`
              : tab === 'transcripts'
                ? `Trust Transcripts${completedWithProof.length > 0 ? ` (${completedWithProof.length})` : ''}`
                : 'Run History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-500 font-mono text-sm animate-pulse">
          Loading CPS data…
        </div>
      ) : activeTab === 'runs' ? (
        <div className="space-y-2">
          {runs.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-slate-500">
              No runs yet. Click "Run Detection" to scan for client protection signals.
            </div>
          )}
          {runs.map((run) => {
            const cfg = STATUS_CONFIG[run.status] ?? STATUS_CONFIG['pending'];
            const StatusIcon = cfg.icon;
            const expanded = expandedId === run.id;

            return (
              <div key={run.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => {
                    setExpandedId(expanded ? null : run.id);
                    if (!expanded && run.proofBundle) handleViewProof(run.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon className={cn('w-4 h-4 flex-shrink-0', cfg.color)} />
                    <span className="font-mono text-xs text-slate-400">{run.id?.slice(0, 8)}</span>
                    <span className={cn('text-xs font-mono px-2 py-0.5 rounded border', cfg.color,
                      run.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20'
                        : run.status === 'awaiting-approval' ? 'bg-amber-500/10 border-amber-500/20'
                        : 'bg-rose-500/10 border-rose-500/20')}>{cfg.label}</span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                    </span>
                    {run.proofBundle && <FileText className="w-3.5 h-3.5 text-rose-500/60" title="Trust transcript available" />}
                  </div>
                  {run.decide?.reasoning && (
                    <p className="text-xs text-slate-500 mt-2 ml-7 line-clamp-1">{run.decide.reasoning}</p>
                  )}
                </div>

                {expanded && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {run.detect && (
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Detection</div>
                        <div className="text-xs text-slate-300">
                          {run.detect.triggered
                            ? `${run.detect.signals?.length ?? 0} protection signal(s) — confidence ${((run.detect.confidence ?? 0) * 100).toFixed(0)}%`
                            : 'No client protection signals detected'}
                        </div>
                        {run.detect.signals?.map((s) => (
                          <div key={s.id} className="mt-1 ml-2 text-xs text-slate-400">
                            • {s.description} <span className={cn('ml-1 font-mono',
                              s.severity === 'critical' ? 'text-red-400' : s.severity === 'high' ? 'text-orange-400' : 'text-yellow-400'
                            )}>[{s.severity}]</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {run.decide && (
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Decision</div>
                        <div className="text-xs text-slate-300">{run.decide.reasoning}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : activeTab === 'approvals' ? (
        <div className="space-y-3">
          {pendingApprovals.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-slate-500">
              No consent gates pending — all concierge actions have been authorized.
            </div>
          )}
          {pendingApprovals.map((approval) => {
            const deadlineDate = new Date(approval.deadlineAt);
            const isUrgent = deadlineDate.getTime() - Date.now() < 60 * 60 * 1000;
            const isProcessing = processingApprovalId === approval.id;

            return (
              <div key={approval.id} className={cn(
                'bg-white/5 border border-white/10 rounded-lg p-5',
                isUrgent && 'border-amber-500/30',
              )}>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">Run {approval.runId?.slice(0, 8)}</span>
                      <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded border',
                        approval.tier === 'executive' ? 'text-red-400 bg-red-500/10 border-red-500/20'
                          : approval.tier === 'supervisor' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-400 bg-rose-500/10 border-rose-500/20')}
                      >client consent: {approval.tier}</span>
                      {isUrgent && <span className="text-[10px] text-red-400 font-mono">⚠ Urgent</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Consent deadline: {deadlineDate.toLocaleString()}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApprovalRespond(approval.id, true)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />Consent Given
                      </button>
                      <button
                        onClick={() => handleApprovalRespond(approval.id, false)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-xs rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3 h-3 inline mr-1" />Withhold Consent
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Trust transcripts are generated for each completed protection action and shared with the client portal.
          </p>
          {completedWithProof.length === 0 && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-slate-500">
              No trust transcripts yet. Transcripts are generated automatically after each completed run.
            </div>
          )}
          {completedWithProof.map((run) => {
            const proof = proofBundles[run.id];
            return (
              <div key={run.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-rose-400" />
                  <div className="flex-1">
                    <div className="text-sm text-slate-200 font-medium">Trust Transcript · {run.id?.slice(0, 8)}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewProof(run.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-slate-600/40 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    {proof && (
                      <button
                        onClick={() => downloadTrustTranscript(run.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Share with Client
                      </button>
                    )}
                  </div>
                </div>
                {proof && (
                  <div className="mt-3 bg-black/20 rounded p-3 text-xs font-mono text-slate-400">
                    <div>Signature: {proof.signature?.slice(0, 32)}…</div>
                    <div>Residual Risk: {proof.residualRisk}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
