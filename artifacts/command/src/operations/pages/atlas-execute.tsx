import { type ApiFetchOptions } from "@szl-holdings/shared-ui/api-fetch";
import { useState, useEffect, useCallback, type ReactElement } from "react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import {
  Zap, RefreshCw, CheckCircle, Clock, AlertTriangle, Shield, ChevronRight,
  Play, FileText, Activity, Layers, XCircle, Info, ChevronDown, ChevronUp, Scale
} from "lucide-react";

const DOMAIN = "counsel";
const ACCENT = "#6366f1";
const DOMAIN_LABEL = "PRISM Counsel — Legal Intelligence";
const WORKFLOW_KEY = "prism-matter-execution";

const SIGNAL_TYPES = ["filing-deadline", "compliance-event", "court-order", "matter-update", "regulatory-notice", "discovery-request"];
const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
type Severity = typeof SEVERITIES[number];

interface Signal { id: string; signalType: string; severity: Severity; title: string; description: string; status: string; createdAt: string; confidence: number; source: string; }
interface Run { runId: string; workflowId: string; status: string; currentStep?: string; startedAt?: string; completedAt?: string; steps?: Array<{ id: string; name: string; status: string; startedAt?: string; completedAt?: string }>; }
interface Evidence { id: string; workflowId: string; label: string; value: string; source: string; capturedAt: string; }
interface Outcome { id: string; workflowId: string; title: string; summary: string; status: string; recordedAt: string; businessImpact?: { financialImpactUsd?: number; operationalSeverity?: string; entitiesAffected?: number }; }
interface ExecuteResult { run: Run; requiresApproval: boolean; approvalRequest?: { reason?: string; requiredApproverRole?: string }; dryRunSummary?: { stepsSimulated: number; estimatedDurationMs: number }; }

interface SignalsResponse { signals: Signal[]; total: number; }
interface OutcomesResponse { outcomes: Outcome[]; total: number; }
interface RunsResponse { runs: Run[]; }
interface EvidenceResponse { evidence: Evidence[]; }

function atlasApi<T>(path: string, opts?: ApiFetchOptions): Promise<T> {
  return apiFetch<T>(`/${DOMAIN}/atlas${path}`, opts);
}

const SEV_COLOR: Record<Severity, string> = { info: "#64748b", low: "#22c55e", medium: "#f59e0b", high: "#f97316", critical: "#ef4444" };
const STATUS_ICON: Record<string, ReactElement> = {
  completed: <CheckCircle className="w-3 h-3" style={{ color: "#22c55e" }} />,
  failed: <XCircle className="w-3 h-3" style={{ color: "#ef4444" }} />,
  running: <Activity className="w-3 h-3" style={{ color: ACCENT }} />,
  pending: <Clock className="w-3 h-3" style={{ color: "#64748b" }} />,
};

export default function PrismAtlasExecute() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>([]);
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{ runId: string; reason?: string; role?: string } | null>(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [showIngestForm, setShowIngestForm] = useState(false);
  const [newSignal, setNewSignal] = useState({ signalType: SIGNAL_TYPES[0], severity: "high" as Severity, title: "", description: "", source: "counsel", confidence: 0.85 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sigRes, outRes] = await Promise.all([atlasApi<SignalsResponse>("/signals?limit=30"), atlasApi<OutcomesResponse>("/outcomes?limit=20")]);
      setSignals(sigRes.signals ?? []);
      setOutcomes(outRes.outcomes ?? []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load data"); }
    finally { setLoading(false); }
  }, []);

  const loadRuns = useCallback(async () => {
    try { const res = await atlasApi<RunsResponse>("/runs"); setRuns(res.runs ?? []); } catch (_) {}
  }, []);

  useEffect(() => { load(); loadRuns(); }, [load, loadRuns]);

  const loadEvidence = useCallback(async (workflowId?: string) => {
    try { const qs = workflowId ? `?workflowId=${workflowId}` : ""; const res = await atlasApi<EvidenceResponse>(`/evidence${qs}`); setEvidence(res.evidence ?? []); } catch (_) {}
  }, []);

  useEffect(() => { if (selectedRun) loadEvidence(selectedRun.runId); }, [selectedRun, loadEvidence]);

  const ingestSignal = async () => {
    if (!newSignal.title.trim()) return;
    setIngesting(true);
    try {
      await atlasApi<Signal>("/signals", { method: "POST", body: JSON.stringify(newSignal), headers: { "Content-Type": "application/json" } });
      setShowIngestForm(false);
      setNewSignal({ signalType: SIGNAL_TYPES[0], severity: "high", title: "", description: "", source: "counsel", confidence: 0.85 });
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to ingest signal"); }
    finally { setIngesting(false); }
  };

  const executeWorkflow = async () => {
    if (selectedSignalIds.length === 0 && !pendingApproval) return;
    setExecuting(true); setError(null);
    try {
      const res = await atlasApi<ExecuteResult>("/execute", {
        method: "POST",
        body: JSON.stringify({ workflowKey: WORKFLOW_KEY, signalIds: selectedSignalIds.length > 0 ? selectedSignalIds : undefined, isDryRun }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.requiresApproval && res.approvalRequest) {
        setPendingApproval({ runId: res.run.runId, reason: res.approvalRequest.reason, role: res.approvalRequest.requiredApproverRole });
      } else { setPendingApproval(null); }
      setSelectedRun(res.run); setExpandedRun(res.run.runId);
      await loadRuns();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Execution failed"); }
    finally { setExecuting(false); }
  };

  const toggleSignal = (id: string) => setSelectedSignalIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              {DOMAIN_LABEL} · ATLAS Execution
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Workflow Execution Console</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Ingest legal matter signals, run governed workflows, review execution evidence, and approve pending legal actions.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none px-3 py-1.5 rounded-lg border transition-colors"
            style={isDryRun ? { color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}12` } : { color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
            <input type="checkbox" className="sr-only" checked={isDryRun} onChange={e => setIsDryRun(e.target.checked)} />
            Dry Run
          </label>
          <button onClick={() => { load(); loadRuns(); }}
            className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.08)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {pendingApproval && (
        <div className="rounded-xl border p-4 flex items-start gap-4" style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}>
          <Shield className="w-5 h-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <div className="flex-1">
            <div className="text-[11px] font-bold mb-0.5" style={{ color: ACCENT }}>Counsel Approval Required</div>
            <div className="text-[11px] text-white mb-1">{pendingApproval.reason ?? "This legal workflow requires counsel approval before execution continues."}</div>
            {pendingApproval.role && (
              <div className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Required approver role: <span className="font-mono font-bold" style={{ color: ACCENT }}>{pendingApproval.role}</span></div>
            )}
            {approvalError && <div className="text-[10px] mt-1" style={{ color: "#f87171" }}>{approvalError}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={async () => {
              if (!pendingApproval) return;
              setApprovalError(null);
              try {
                await atlasApi<{ status: string }>(`/runs/${pendingApproval.runId}/approve`, { method: "POST", headers: { "Content-Type": "application/json" } });
                setPendingApproval(null); await loadRuns();
              } catch (e) { setApprovalError(e instanceof Error ? e.message : "Failed to approve run"); }
            }}
              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg" style={{ background: ACCENT, color: "#fff" }}>
              <CheckCircle className="w-3 h-3" /> Approve
            </button>
            <button onClick={async () => {
              if (!pendingApproval) return;
              try {
                await atlasApi<{ status: string }>(`/runs/${pendingApproval.runId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" } });
                setPendingApproval(null); await loadRuns();
              } catch (e) { setApprovalError(e instanceof Error ? e.message : "Failed to reject run"); }
            }}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border"
              style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
              <XCircle className="w-3 h-3" /> Reject
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border p-3 flex items-center gap-3" style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}>
          <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#ef4444" }} />
          <span className="text-[11px]" style={{ color: "#ef4444" }}>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                <span className="text-[11px] font-bold uppercase tracking-widest font-mono text-white">Matter Signals</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${ACCENT}20`, color: ACCENT }}>{signals.length}</span>
              </div>
              <button onClick={() => setShowIngestForm(v => !v)}
                className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: `${ACCENT}20`, color: ACCENT }}>
                <Zap className="w-3 h-3" /> Ingest Signal
              </button>
            </div>

            {showIngestForm && (
              <div className="rounded-lg border p-3 space-y-3" style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}08` }}>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Signal Type</label>
                    <select value={newSignal.signalType} onChange={e => setNewSignal(s => ({ ...s, signalType: e.target.value }))}
                      className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {SIGNAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Severity</label>
                    <select value={newSignal.severity} onChange={e => setNewSignal(s => ({ ...s, severity: e.target.value as Severity }))}
                      className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }}>
                      {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <input value={newSignal.title} onChange={e => setNewSignal(s => ({ ...s, title: e.target.value }))}
                  placeholder="Matter title or event description…"
                  className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }} />
                <textarea value={newSignal.description} onChange={e => setNewSignal(s => ({ ...s, description: e.target.value }))}
                  placeholder="Details, docket numbers, parties, relevant context…"
                  rows={2}
                  className="w-full text-[11px] rounded-lg px-2 py-1.5 outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)" }} />
                <div className="flex gap-2">
                  <button onClick={ingestSignal} disabled={ingesting || !newSignal.title.trim()}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: ACCENT, color: "#fff" }}>
                    {ingesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Ingest
                  </button>
                  <button onClick={() => setShowIngestForm(false)} className="text-[11px] px-3 py-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.4)" }}>Cancel</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center gap-2 py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /><span className="text-[11px]">Loading signals…</span>
              </div>
            ) : signals.length === 0 ? (
              <div className="flex items-center gap-2 py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Info className="w-3.5 h-3.5" /><span className="text-[11px]">No signals yet. Ingest a matter event to begin.</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {signals.map(sig => (
                  <label key={sig.id} className="flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors"
                    style={{ background: selectedSignalIds.includes(sig.id) ? `${ACCENT}15` : "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                    <input type="checkbox" checked={selectedSignalIds.includes(sig.id)} onChange={() => toggleSignal(sig.id)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${SEV_COLOR[sig.severity]}20`, color: SEV_COLOR[sig.severity] }}>{sig.severity}</span>
                        <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{sig.signalType}</span>
                      </div>
                      <div className="text-[11px] font-medium text-white truncate">{sig.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Confidence: {Math.round(sig.confidence * 100)}% · {sig.source}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                {selectedSignalIds.length > 0 ? `${selectedSignalIds.length} signal${selectedSignalIds.length > 1 ? "s" : ""} selected` : "Select signals to include in workflow"}
              </span>
              <button onClick={() => executeWorkflow()}
                disabled={executing || selectedSignalIds.length === 0}
                className="ml-auto flex items-center gap-1.5 text-[11px] font-bold px-4 py-1.5 rounded-lg disabled:opacity-40 transition-colors"
                style={{ background: ACCENT, color: "#fff" }}>
                {executing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {isDryRun ? "Dry Run" : "Execute Workflow"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-bold uppercase tracking-widest font-mono text-white">Run Timeline</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${ACCENT}20`, color: ACCENT }}>{runs.length}</span>
            </div>
            {runs.length === 0 ? (
              <div className="flex items-center gap-2 py-4" style={{ color: "rgba(255,255,255,0.3)" }}>
                <Info className="w-3.5 h-3.5" /><span className="text-[11px]">No runs yet. Execute a workflow to see the timeline.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {runs.map(run => (
                  <div key={run.runId} className="rounded-lg border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <button onClick={() => { setExpandedRun(e => e === run.runId ? null : run.runId); setSelectedRun(run); }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors">
                      {STATUS_ICON[run.status] ?? <Clock className="w-3 h-3" style={{ color: "#64748b" }} />}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-mono font-bold text-white truncate">{run.runId.slice(-12)}</div>
                        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{run.workflowId} · {run.status}</div>
                      </div>
                      {expandedRun === run.runId ? <ChevronUp className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown className="w-3 h-3" style={{ color: "rgba(255,255,255,0.3)" }} />}
                    </button>
                    {expandedRun === run.runId && run.steps && run.steps.length > 0 && (
                      <div className="px-3 pb-3 space-y-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        {run.steps.map(step => (
                          <div key={step.id} className="flex items-center gap-2 py-1">
                            {STATUS_ICON[step.status] ?? <Clock className="w-3 h-3" style={{ color: "#64748b" }} />}
                            <span className="text-[10px] text-white">{step.name}</span>
                            <span className="text-[10px] ml-auto font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>{step.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-bold uppercase tracking-widest font-mono text-white">Evidence Chain</span>
            </div>
            {evidence.length === 0 ? (
              <div className="text-[11px] py-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                {selectedRun ? "No evidence captured for this run." : "Select a run to view evidence."}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {evidence.map(ev => (
                  <div key={ev.id} className="rounded-lg p-2.5 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="text-[10px] font-bold font-mono" style={{ color: ACCENT }}>{ev.label}</div>
                    <div className="text-[11px] text-white">{ev.value}</div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{ev.source}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <div className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-bold uppercase tracking-widest font-mono text-white">Outcomes</span>
            </div>
            {outcomes.length === 0 ? (
              <div className="text-[11px] py-3" style={{ color: "rgba(255,255,255,0.3)" }}>No outcomes recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {outcomes.map(oc => (
                  <div key={oc.id} className="rounded-lg p-2.5 space-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-white">{oc.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto font-mono" style={{ background: `${ACCENT}20`, color: ACCENT }}>{oc.status}</span>
                    </div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>{oc.summary}</div>
                    {oc.businessImpact?.financialImpactUsd != null && (
                      <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                        ${oc.businessImpact.financialImpactUsd.toLocaleString()} impact
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
