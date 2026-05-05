import { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

interface ModelFamily {
  id: string;
  label: string;
  publisher: string;
  paramsB: number;
  contextLength: number;
  license: string;
  flavor: string;
  costPerMinute: number;
  recommendedFor: string[];
}

interface DatasetTemplate {
  id: string;
  label: string;
  samples: number;
  sourceClass: string;
}

interface ProvenanceTag {
  proofId: string;
  sourceClass: string;
  confidenceScore: number;
  exportSafetyState: 'green' | 'amber' | 'red';
  taggedAt: string;
}

interface MetricPoint {
  step: number;
  loss: number;
  evalLoss?: number;
  lr: number;
  timestamp: string;
}

interface MirrorEvalSummary {
  evalId: string;
  disposition: 'pass' | 'needs_more_evidence' | 'blocked';
  overallScore: number;
  scores: { dimension: string; score: number; rationale: string; flag?: string }[];
  flags: string[];
  evaluatedAt: string;
}

interface CovenantDecision {
  decision: 'approved' | 'rejected';
  approver: string;
  rationale: string;
  decidedAt: string;
  contractId: string;
}

interface FoundryRun {
  runId: string;
  tenantId: string;
  agentId: string;
  family: ModelFamily;
  baseModel: string;
  dataset: { id: string; label: string; samples: number; sourceClass: string };
  hyperparameters: { epochs: number; batchSize: number; learningRate: number; lora: boolean };
  hfJobId?: string;
  stage: string;
  createdAt: string;
  updatedAt: string;
  elapsedSeconds: number;
  estCostUsd: number;
  provenance: ProvenanceTag;
  metrics: MetricPoint[];
  mirrorEval?: MirrorEvalSummary;
  covenant?: CovenantDecision;
  modelCardSha?: string;
  publishedModelId?: string;
  notes?: string;
}

interface LineageGraph {
  nodes: { id: string; kind: string; label: string; state: string }[];
  edges: { from: string; to: string; label: string }[];
  proofPacketSha: string;
}

interface CostSummary {
  tenants: { tenantId: string; runs: number; totalUsd: number; totalMinutes: number }[];
  fleetUsd: number;
  fleetRuns: number;
}

const STAGE_COLORS: Record<string, string> = {
  queued:                 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  training:               'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  training_complete:      'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  mirror_eval_blocked:    'bg-red-500/15 text-red-300 border-red-500/30',
  covenant_pending:       'bg-amber-500/15 text-amber-300 border-amber-500/30',
  covenant_rejected:      'bg-red-500/15 text-red-300 border-red-500/30',
  published:              'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const SAFETY_COLORS: Record<string, string> = {
  green: 'text-emerald-300',
  amber: 'text-amber-300',
  red:   'text-red-300',
};

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

async function csrfHeaders(): Promise<Record<string, string>> {
  let token = readCookie('csrf_token');
  if (!token) {
    try {
      const r = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
      if (r.ok) token = (await r.json()).csrfToken ?? readCookie('csrf_token');
    } catch { /* ignore */ }
  }
  return token ? { 'X-CSRF-Token': token } : {};
}

function fmtUsd(n: number) { return `$${n.toFixed(4)}`; }
function fmtElapsed(s: number) {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function ModelFoundry() {
  const [families, setFamilies] = useState<ModelFamily[]>([]);
  const [datasets, setDatasets] = useState<DatasetTemplate[]>([]);
  const [runs, setRuns] = useState<FoundryRun[]>([]);
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<FoundryRun | null>(null);
  const [lineage, setLineage] = useState<LineageGraph | null>(null);
  const [modelCard, setModelCard] = useState<{ card: unknown; proofPacketSha: string } | null>(null);
  const [logs, setLogs] = useState<{ hfMode?: string; lines: Array<{ ts: string; level: string; message: string }> } | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<{
    id: string; label: string; samples: number; sourceClass: string;
    sha256: string; piiClean: boolean; proofId?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Launch form
  const [familyId, setFamilyId] = useState('smollm3-3b');
  const [datasetId, setDatasetId] = useState('vessels-risk-corpus');
  const [tenantId, setTenantId] = useState('vessels');
  const [agentId, setAgentId] = useState('vessels-risk-v3');
  const [epochs, setEpochs] = useState(3);
  const [batchSize, setBatchSize] = useState(8);
  const [lr, setLr] = useState(0.0002);
  const [useLora, setUseLora] = useState(true);
  const [notes, setNotes] = useState('');

  // Covenant form
  const [approver, setApprover] = useState('chief.governance@a11oy');
  const [rationale, setRationale] = useState('');

  const refreshRuns = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/model-foundry/runs`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setRuns(j.runs ?? []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshCosts = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/model-foundry/cost-summary`);
      if (r.ok) setCosts(await r.json());
    } catch { /* non-fatal */ }
  }, []);

  const refreshSelected = useCallback(async (id: string) => {
    try {
      const [runRes, lineageRes, cardRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/model-foundry/runs/${id}`),
        fetch(`${API_BASE}/model-foundry/runs/${id}/lineage`),
        fetch(`${API_BASE}/model-foundry/runs/${id}/model-card`),
        fetch(`${API_BASE}/model-foundry/runs/${id}/logs`),
      ]);
      if (runRes.ok)     setSelectedRun((await runRes.json()).run);
      if (lineageRes.ok) setLineage(await lineageRes.json());
      if (cardRes.ok)    setModelCard(await cardRes.json());
      if (logsRes.ok)    setLogs(await logsRes.json());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  // Initial catalog + runs load
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/model-foundry/families`);
        if (r.ok) {
          const j = await r.json();
          setFamilies(j.families ?? []);
          setDatasets(j.datasets ?? []);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    })();
    refreshRuns();
    refreshCosts();
  }, [refreshRuns, refreshCosts]);

  // Live polling
  useEffect(() => {
    const t = setInterval(() => {
      refreshRuns();
      refreshCosts();
      if (selectedRunId) refreshSelected(selectedRunId);
    }, 3000);
    return () => clearInterval(t);
  }, [refreshRuns, refreshCosts, refreshSelected, selectedRunId]);

  const launchRun = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/model-foundry/runs`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await csrfHeaders()) },
        body: JSON.stringify({
          tenantId, agentId, familyId,
          datasetId: uploadedDataset ? undefined : datasetId,
          customDataset: uploadedDataset ?? undefined,
          hyperparameters: { epochs, batchSize, learningRate: lr, lora: useLora },
          notes: notes || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setShowLaunch(false);
      setSelectedRunId(j.run.runId);
      refreshSelected(j.run.runId);
      refreshRuns();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const runMirrorEval = async () => {
    if (!selectedRunId) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/model-foundry/runs/${selectedRunId}/mirror-eval`, {
        method: 'POST',
        credentials: 'include',
        headers: await csrfHeaders(),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      refreshSelected(selectedRunId);
    } catch (e) { setError((e as Error).message); }
  };

  const decideCovenant = async (decision: 'approve' | 'reject') => {
    if (!selectedRunId) return;
    if (!rationale.trim()) { setError('Rationale required'); return; }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/model-foundry/runs/${selectedRunId}/covenant/${decision}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(await csrfHeaders()) },
        body: JSON.stringify({ approver, rationale }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      setRationale('');
      refreshSelected(selectedRunId);
      refreshRuns();
    } catch (e) { setError((e as Error).message); }
  };

  const lossCurve = useMemo(() => {
    const m = selectedRun?.metrics ?? [];
    if (m.length < 2) return null;
    const w = 600, h = 140, pad = 24;
    const xs = m.map((p) => p.step);
    const ys = m.map((p) => p.loss);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    const sx = (x: number) => pad + ((x - xMin) / (xMax - xMin || 1)) * (w - 2 * pad);
    const sy = (y: number) => h - pad - ((y - yMin) / (yMax - yMin || 1)) * (h - 2 * pad);
    return m.map((p, i) => `${i === 0 ? 'M' : 'L'} ${sx(p.step).toFixed(1)} ${sy(p.loss).toFixed(1)}`).join(' ');
  }, [selectedRun]);

  return (
    <div className="p-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-amber-300/80">FORGE · Model Foundry</div>
          <h1 className="text-2xl font-semibold mt-1">Governed fine-tuning pipeline</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            SmolFactory-style fine-tuning on HuggingFace Jobs compute, gated by FORGE governance:
            dataset provenance tags, MirrorEval pre-deployment checks, PCE covenant approval, and
            cryptographic model-card proof packets — all per-tenant cost-tracked.
          </p>
        </div>
        <button
          onClick={() => setShowLaunch(true)}
          className="px-4 py-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-sm font-medium"
          data-testid="button-launch-foundry-run"
        >
          + New Foundry Run
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 rounded border border-red-500/40 bg-red-500/10 text-red-300 text-sm" data-testid="text-error">
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Active runs" value={runs.filter((r) => r.stage === 'training' || r.stage === 'queued').length} />
        <Kpi label="Awaiting covenant" value={runs.filter((r) => r.stage === 'covenant_pending').length} />
        <Kpi label="Published models" value={runs.filter((r) => r.stage === 'published').length} />
        <Kpi label="Fleet cost (USD)" value={costs ? fmtUsd(costs.fleetUsd) : '—'} />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Run list */}
        <div className="col-span-12 lg:col-span-4 space-y-2 max-h-[70vh] overflow-y-auto">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1 px-1">Runs</div>
          {runs.length === 0 && (
            <div className="text-sm text-slate-500 italic px-3 py-6 border border-slate-700/40 rounded bg-slate-900/20 text-center">
              No foundry runs yet. Launch one to begin.
            </div>
          )}
          {runs.map((r) => (
            <button
              key={r.runId}
              onClick={() => { setSelectedRunId(r.runId); refreshSelected(r.runId); }}
              className={`w-full text-left px-3 py-2.5 rounded border transition ${
                selectedRunId === r.runId
                  ? 'border-amber-500/50 bg-amber-500/5'
                  : 'border-slate-700/40 bg-slate-900/30 hover:border-slate-600/60'
              }`}
              data-testid={`row-run-${r.runId}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-amber-200/80 truncate">{r.runId}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${STAGE_COLORS[r.stage] ?? 'border-slate-600 text-slate-300'}`}>
                  {r.stage}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-200 truncate">{r.family.label} → {r.agentId}</div>
              <div className="mt-0.5 text-xs text-slate-400 truncate">{r.dataset.label}</div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>{fmtElapsed(r.elapsedSeconds)}</span>
                <span>{fmtUsd(r.estCostUsd)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {!selectedRun && (
            <div className="border border-slate-700/40 rounded bg-slate-900/30 p-12 text-center text-sm text-slate-500">
              Select a run to inspect provenance, training metrics, MirrorEval gate, covenant status, model card, and lineage.
            </div>
          )}

          {selectedRun && (
            <>
              {/* Header card */}
              <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs text-amber-200/80">{selectedRun.runId}</div>
                    <div className="text-lg font-semibold mt-0.5">{selectedRun.family.label}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      base: {selectedRun.baseModel} · flavor: {selectedRun.family.flavor} · hf job: {selectedRun.hfJobId}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border font-mono ${STAGE_COLORS[selectedRun.stage] ?? 'border-slate-600 text-slate-300'}`}>
                    {selectedRun.stage}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <Mini label="Tenant" value={selectedRun.tenantId} />
                  <Mini label="Agent" value={selectedRun.agentId} />
                  <Mini label="Elapsed" value={fmtElapsed(selectedRun.elapsedSeconds)} />
                  <Mini label="Est. cost" value={fmtUsd(selectedRun.estCostUsd)} />
                </div>
              </div>

              {/* Provenance */}
              <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Dataset Provenance</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <Mini label="Dataset" value={selectedRun.dataset.label} />
                  <Mini label="Samples" value={selectedRun.dataset.samples.toLocaleString()} />
                  <Mini label="Source class" value={selectedRun.provenance.sourceClass} />
                  <Mini label="Confidence" value={selectedRun.provenance.confidenceScore.toFixed(2)} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Export safety:</span>
                  <span className={`font-mono uppercase ${SAFETY_COLORS[selectedRun.provenance.exportSafetyState]}`}>
                    ● {selectedRun.provenance.exportSafetyState}
                  </span>
                  <span className="text-slate-500 font-mono">proof: {selectedRun.provenance.proofId}</span>
                </div>
              </div>

              {/* Training metrics */}
              <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Training Metrics</div>
                  <div className="text-xs text-slate-500 font-mono">
                    step {selectedRun.metrics.at(-1)?.step ?? 0} · loss {selectedRun.metrics.at(-1)?.loss?.toFixed(4) ?? '—'}
                  </div>
                </div>
                {lossCurve ? (
                  <svg viewBox="0 0 600 140" className="w-full h-32">
                    <path d={lossCurve} fill="none" stroke="rgb(245 158 11)" strokeWidth="1.5" />
                  </svg>
                ) : (
                  <div className="text-xs text-slate-500 italic py-4 text-center">Awaiting first training step…</div>
                )}
              </div>

              {/* MirrorEval gate */}
              <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-wider text-slate-400">MirrorEval — Pre-Deployment Gate</div>
                  {(selectedRun.stage === 'training_complete' || selectedRun.stage === 'mirror_eval_blocked') && (
                    <button
                      onClick={runMirrorEval}
                      className="text-xs px-3 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-200"
                      data-testid="button-run-mirror-eval"
                    >
                      Run MirrorEval
                    </button>
                  )}
                </div>
                {!selectedRun.mirrorEval && (
                  <div className="text-xs text-slate-500 italic">
                    {selectedRun.stage === 'training' || selectedRun.stage === 'queued'
                      ? 'Available once training completes.'
                      : 'Not yet evaluated.'}
                  </div>
                )}
                {selectedRun.mirrorEval && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`text-xs font-mono px-2 py-1 rounded border ${
                        selectedRun.mirrorEval.disposition === 'pass'
                          ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                          : selectedRun.mirrorEval.disposition === 'blocked'
                          ? 'border-red-500/40 text-red-300 bg-red-500/10'
                          : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                      }`} data-testid="text-mirror-eval-disposition">
                        {selectedRun.mirrorEval.disposition.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        score {selectedRun.mirrorEval.overallScore.toFixed(2)} · {selectedRun.mirrorEval.evalId}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedRun.mirrorEval.scores.map((s) => (
                        <div key={s.dimension} className="border border-slate-700/30 rounded p-2 bg-slate-950/40">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 capitalize">{s.dimension.replace(/_/g, ' ')}</span>
                            <span className={`font-mono ${s.score >= 0.75 ? 'text-emerald-300' : s.score >= 0.5 ? 'text-amber-300' : 'text-red-300'}`}>
                              {s.score.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">{s.rationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Covenant gate */}
              <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">PCE Covenant Gate</div>
                {selectedRun.stage === 'covenant_pending' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-300">
                      MirrorEval cleared. Awaiting human covenant approval before publishing the tuned model to the resolver fleet.
                    </div>
                    <input
                      value={approver}
                      onChange={(e) => setApprover(e.target.value)}
                      placeholder="Approver"
                      className="w-full px-2 py-1 text-sm bg-slate-950/40 border border-slate-700/40 rounded font-mono"
                      data-testid="input-approver"
                    />
                    <textarea
                      value={rationale}
                      onChange={(e) => setRationale(e.target.value)}
                      placeholder="Rationale (required) — what does this model unlock, who is accountable, and what is the rollback plan?"
                      rows={3}
                      className="w-full px-2 py-1 text-sm bg-slate-950/40 border border-slate-700/40 rounded"
                      data-testid="textarea-rationale"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => decideCovenant('approve')}
                        className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs"
                        data-testid="button-covenant-approve"
                      >
                        Approve & Publish
                      </button>
                      <button
                        onClick={() => decideCovenant('reject')}
                        className="px-3 py-1.5 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-200 text-xs"
                        data-testid="button-covenant-reject"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
                {selectedRun.covenant && (
                  <div className="text-xs space-y-1">
                    <div>
                      <span className={`font-mono px-2 py-0.5 rounded border ${
                        selectedRun.covenant.decision === 'approved'
                          ? 'border-emerald-500/40 text-emerald-300'
                          : 'border-red-500/40 text-red-300'
                      }`}>
                        {selectedRun.covenant.decision.toUpperCase()}
                      </span>
                      <span className="ml-2 text-slate-400">by {selectedRun.covenant.approver}</span>
                    </div>
                    <div className="text-slate-400">{selectedRun.covenant.rationale}</div>
                    <div className="text-slate-500 font-mono text-[11px]">contract: {selectedRun.covenant.contractId}</div>
                  </div>
                )}
                {!selectedRun.covenant && selectedRun.stage !== 'covenant_pending' && (
                  <div className="text-xs text-slate-500 italic">Covenant becomes available after MirrorEval passes.</div>
                )}
              </div>

              {/* Model card */}
              {modelCard && (
                <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs uppercase tracking-wider text-slate-400">Model Card</div>
                    <div className="text-[11px] text-slate-500 font-mono" data-testid="text-proof-packet-sha">
                      proof packet sha256: {modelCard.proofPacketSha.slice(0, 16)}…{modelCard.proofPacketSha.slice(-8)}
                    </div>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono bg-slate-950/40 border border-slate-700/30 rounded p-3 overflow-x-auto max-h-64">
{JSON.stringify(modelCard.card, null, 2)}
                  </pre>
                </div>
              )}

              {/* HF Jobs log stream */}
              {logs && logs.lines && logs.lines.length > 0 && (
                <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4" data-testid="panel-hf-logs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs uppercase tracking-wider text-slate-400">HF Jobs Logs</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      mode: {logs.hfMode ?? 'simulated'} · {logs.lines.length} lines
                    </div>
                  </div>
                  <pre className="text-[11px] text-slate-300 font-mono bg-slate-950/40 border border-slate-700/30 rounded p-3 overflow-y-auto max-h-72 leading-relaxed">
{logs.lines.map((l) => `[${l.ts.slice(11, 19)}] ${l.level.padEnd(5)} ${l.message}`).join('\n')}
                  </pre>
                </div>
              )}

              {/* Lineage graph */}
              {lineage && (
                <div className="border border-slate-700/40 rounded bg-slate-900/40 p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">Provenance Lineage</div>
                  <div className="space-y-2">
                    {lineage.nodes.map((n, i) => (
                      <div key={n.id} className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-slate-500 w-20 uppercase">{n.kind.replace(/_/g, ' ')}</span>
                        <span className={`w-2 h-2 rounded-full ${
                          n.state === 'verified' || n.state === 'pass' || n.state === 'approved' || n.state === 'green' || n.state === 'published'
                            ? 'bg-emerald-400'
                            : n.state === 'pending' || n.state === 'amber' || n.state === 'training' || n.state === 'queued' || n.state === 'covenant_pending'
                            ? 'bg-amber-400'
                            : n.state === 'red' || n.state === 'rejected' || n.state === 'blocked'
                            ? 'bg-red-400'
                            : 'bg-slate-500'
                        }`} />
                        <span className="text-sm text-slate-200 flex-1">{n.label}</span>
                        {i < lineage.nodes.length - 1 && (
                          <span className="text-[10px] text-slate-600 font-mono">
                            ↓ {lineage.edges[i]?.label ?? ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Launch dialog */}
      {showLaunch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowLaunch(false)}>
          <div
            className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">Launch Foundry Run</h2>
            <p className="text-xs text-slate-400 mb-4">
              Provenance-tag the dataset, queue the HF Job, and gate publishing through MirrorEval + PCE covenant.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Tenant">
                <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="form-input" data-testid="input-tenant-id" />
              </Field>
              <Field label="Agent">
                <input value={agentId} onChange={(e) => setAgentId(e.target.value)} className="form-input" data-testid="input-agent-id" />
              </Field>
              <Field label="Model family">
                <select value={familyId} onChange={(e) => setFamilyId(e.target.value)} className="form-input" data-testid="select-family">
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>{f.label} ({f.paramsB}B · {f.flavor})</option>
                  ))}
                </select>
              </Field>
              <Field label="Dataset">
                {uploadedDataset ? (
                  <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs bg-emerald-950/30 border border-emerald-700/40 rounded" data-testid="badge-uploaded-dataset">
                    <div className="flex flex-col">
                      <span className="text-emerald-300">{uploadedDataset.label} ({uploadedDataset.samples.toLocaleString()})</span>
                      <span className="text-[10px] text-emerald-500/80 font-mono">sha {uploadedDataset.sha256.slice(0, 12)}… · pii {uploadedDataset.piiClean ? 'clean' : 'flagged'}</span>
                    </div>
                    <button type="button" onClick={() => setUploadedDataset(null)} className="text-[10px] text-slate-400 hover:text-slate-200" data-testid="button-clear-uploaded">clear</button>
                  </div>
                ) : (
                  <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} className="form-input" data-testid="select-dataset">
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id}>{d.label} ({d.samples.toLocaleString()})</option>
                    ))}
                  </select>
                )}
              </Field>
              <Field label="Or upload dataset (.jsonl ≤50MB)">
                <input
                  type="file"
                  accept=".jsonl,.json,.txt"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    setError(null);
                    try {
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('tenantId', tenantId);
                      fd.append('label', file.name);
                      fd.append('sourceClass', 'human-curated');
                      const res = await fetch(`${API_BASE}/model-foundry/datasets/upload`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { ...(await csrfHeaders()) },
                        body: fd,
                      });
                      const j = await res.json();
                      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
                      setUploadedDataset(j.customDataset ?? j.dataset ?? j);
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setUploading(false);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                  className="form-input text-xs"
                  data-testid="input-dataset-upload"
                />
              </Field>
              <Field label="Epochs">
                <input type="number" min={1} max={50} value={epochs} onChange={(e) => setEpochs(Number(e.target.value))} className="form-input" data-testid="input-epochs" />
              </Field>
              <Field label="Batch size">
                <input type="number" min={1} max={256} value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="form-input" data-testid="input-batch-size" />
              </Field>
              <Field label="Learning rate">
                <input type="number" step={0.0001} value={lr} onChange={(e) => setLr(Number(e.target.value))} className="form-input" data-testid="input-lr" />
              </Field>
              <Field label="Adapter">
                <label className="flex items-center gap-2 px-2 py-1.5 text-xs">
                  <input type="checkbox" checked={useLora} onChange={(e) => setUseLora(e.target.checked)} data-testid="checkbox-lora" />
                  LoRA (recommended)
                </label>
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Notes (optional)">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="form-input" data-testid="textarea-notes" />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowLaunch(false)} className="px-3 py-1.5 text-xs rounded border border-slate-700 text-slate-300 hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={launchRun}
                className="px-4 py-1.5 text-xs rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200"
                data-testid="button-confirm-launch"
              >
                Tag Provenance & Launch
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          padding: 6px 8px;
          font-size: 12px;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(51, 65, 85, 0.5);
          border-radius: 4px;
          color: #e2e8f0;
          font-family: ui-monospace, monospace;
        }
        .form-input:focus { outline: none; border-color: rgb(245 158 11 / 0.6); }
      `}</style>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-slate-700/40 rounded bg-slate-900/30 p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-xl font-semibold mt-1 font-mono">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-slate-200 font-mono truncate">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
