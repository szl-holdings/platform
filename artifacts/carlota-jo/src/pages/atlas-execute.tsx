import { type ApiFetchOptions } from "@szl-holdings/shared-ui/api-fetch";
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import {
  Zap, RefreshCw, CheckCircle, Clock, AlertTriangle, Shield, ChevronRight,
  Play, FileText, Activity, Layers, XCircle, Info, ChevronDown, ChevronUp, Star
} from "lucide-react";

const DOMAIN = "carlota-jo";
const ACCENT = "#d4af37";
const DOMAIN_LABEL = "Carlota Jo — Concierge Operations";
const WORKFLOW_KEY = "carlota-concierge-workflow";

const SIGNAL_TYPES = ["client-request", "property-ops-issue", "vendor-issue", "booking-request", "service-escalation", "maintenance-alert"];
const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
type Severity = typeof SEVERITIES[number];

const SEV_COLOR: Record<Severity, string> = {
  critical: "#ef4444", high: "#f59e0b", medium: "#f97316", low: "#3b82f6", info: "#6b7280"
};
const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b", running: "#3b82f6", completed: "#10b981", failed: "#ef4444",
  pending_approval: "#8b7ac8", paused: "#f97316", cancelled: "#6b7280",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? "#6b7280";
  return (
    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded font-mono"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

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

export default function CarlotaJoAtlasExecute() {
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
  const [newSignal, setNewSignal] = useState({ signalType: SIGNAL_TYPES[0], severity: "medium" as Severity, title: "", description: "", source: "concierge", confidence: 0.9 });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [sigRes, outRes] = await Promise.all([atlasApi<SignalsResponse>("/signals?limit=30"), atlasApi<OutcomesResponse>("/outcomes?limit=20")]);
      setSignals(sigRes.signals ?? []);
      setOutcomes(outRes.outcomes ?? []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to load"); }
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
      setNewSignal({ signalType: SIGNAL_TYPES[0], severity: "medium", title: "", description: "", source: "concierge", confidence: 0.9 });
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to ingest"); }
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
            <Star className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: ACCENT }}>
              {DOMAIN_LABEL} · ATLAS Execution
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Service Workflow Console</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Ingest client and vendor signals, trigger governed service workflows, and approve high-value vendor commitments.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="flex items-center gap-2 text-[11px] cursor-pointer select-none px-3 py-1.5 rounded-lg border transition-colors"
            style={isDryRun ? { color: ACCENT, borderColor: `${ACCENT}40`, background: `${ACCENT}12` } : { color: "rgba(0,0,0,0.5)", borderColor: "rgba(0,0,0,0.12)" }}>
            <input type="checkbox" className="sr-only" checked={isDryRun} onChange={e => setIsDryRun(e.target.checked)} />
            Dry Run
          </label>
          <button onClick={() => { load(); loadRuns(); }}
            className="flex items-center gap-1.5 text-[11px] border px-3 py-1.5 rounded-lg hover:opacity-80 transition-opacity"
            style={{ color: "rgba(0,0,0,0.5)", borderColor: "rgba(0,0,0,0.12)" }}>
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {pendingApproval && (
        <div className="rounded-xl border p-4 flex items-start gap-4" style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}10` }}>
          <Shield className="w-5 h-5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <div className="flex-1">
            <div className="text-[11px] font-bold mb-0.5" style={{ color: ACCENT }}>Principal Approval Required</div>
            <div className="text-[11px] text-black mb-1">{pendingApproval.reason ?? "This vendor commitment requires principal approval before the service workflow continues."}</div>
            {pendingApproval.role && (
              <div className="text-[10px] mb-2" style={{ color: "rgba(0,0,0,0.5)" }}>Required approver role: <span className="font-mono font-bold" style={{ color: ACCENT }}>{pendingApproval.role}</span></div>
            )}
            {approvalError && <div className="text-[10px] mt-1" style={{ color: "#b91c1c" }}>{approvalError}</div>}
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
          <button onClick={() => setError(null)} className="ml-auto text-[10px]" style={{ color: "rgba(0,0,0,0.4)" }}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Signals Panel */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            <div className="p-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
              <Activity className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-semibold text-black">Service Signals</span>
              <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(0,0,0,0.4)" }}>{signals.length} ingested</span>
            </div>
            {showIngestForm ? (
              <div className="p-3.5 border-b space-y-2" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
                <input
                  className="w-full text-[11px] bg-transparent border rounded-lg px-3 py-1.5 text-black placeholder-black/25 focus:outline-none"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                  placeholder="Signal title *"
                  value={newSignal.title}
                  onChange={e => setNewSignal(s => ({ ...s, title: e.target.value }))}
                />
                <textarea
                  className="w-full text-[11px] bg-transparent border rounded-lg px-3 py-1.5 text-black placeholder-black/25 focus:outline-none resize-none"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                  placeholder="Description"
                  rows={2}
                  value={newSignal.description}
                  onChange={e => setNewSignal(s => ({ ...s, description: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select className="text-[10px] bg-white border rounded-lg px-2 py-1.5 text-black focus:outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.15)" }}
                    value={newSignal.signalType} onChange={e => setNewSignal(s => ({ ...s, signalType: e.target.value }))}>
                    {SIGNAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select className="text-[10px] bg-white border rounded-lg px-2 py-1.5 text-black focus:outline-none"
                    style={{ borderColor: "rgba(0,0,0,0.15)" }}
                    value={newSignal.severity} onChange={e => setNewSignal(s => ({ ...s, severity: e.target.value as Severity }))}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={ingestSignal} disabled={ingesting || !newSignal.title.trim()}
                    className="flex-1 text-[11px] font-bold py-1.5 rounded-lg disabled:opacity-50"
                    style={{ background: ACCENT, color: "#fff" }}>
                    {ingesting ? "Ingesting…" : "Ingest Signal"}
                  </button>
                  <button onClick={() => setShowIngestForm(false)}
                    className="text-[11px] px-3 py-1.5 rounded-lg border"
                    style={{ color: "rgba(0,0,0,0.5)", borderColor: "rgba(0,0,0,0.12)" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3">
                <button onClick={() => setShowIngestForm(true)}
                  className="w-full text-[11px] font-medium py-1.5 rounded-lg border flex items-center justify-center gap-1.5 hover:opacity-80 transition-opacity"
                  style={{ color: ACCENT, borderColor: `${ACCENT}50`, background: `${ACCENT}10` }}>
                  + Log Service Signal
                </button>
              </div>
            )}
            <div className="divide-y divide-black/[0.06] max-h-80 overflow-y-auto">
              {loading && <div className="p-4 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>Loading…</div>}
              {!loading && signals.length === 0 && <div className="p-4 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>No signals yet.</div>}
              {signals.map(sig => {
                const sevColor = SEV_COLOR[sig.severity] ?? "#6b7280";
                const selected = selectedSignalIds.includes(sig.id);
                return (
                  <div key={sig.id} className="p-3 cursor-pointer hover:bg-black/3 transition-colors"
                    style={selected ? { background: `${ACCENT}12` } : {}}
                    onClick={() => toggleSignal(sig.id)}>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0"
                        style={selected ? { borderColor: ACCENT, background: ACCENT } : { borderColor: "rgba(0,0,0,0.2)" }}>
                        {selected && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: sevColor, background: `${sevColor}15` }}>{sig.severity}</span>
                          <span className="text-[9px] font-mono truncate" style={{ color: "rgba(0,0,0,0.35)" }}>{sig.signalType}</span>
                        </div>
                        <div className="text-[10px] font-medium text-black truncate">{sig.title}</div>
                        <div className="text-[9px] mt-0.5" style={{ color: "rgba(0,0,0,0.35)" }}>{sig.status} · {new Date(sig.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button onClick={() => executeWorkflow()} disabled={executing || selectedSignalIds.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: executing ? `${ACCENT}80` : ACCENT, color: "#fff" }}>
            <Play className="w-4 h-4" />
            {executing ? "Executing…" : isDryRun ? "Dry Run" : "Run Service Workflow"}
            {selectedSignalIds.length > 0 && !executing && <span className="text-xs opacity-80">({selectedSignalIds.length})</span>}
          </button>
        </div>

        {/* Runs Timeline */}
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <div className="p-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
            <Layers className="w-3.5 h-3.5" style={{ color: ACCENT }} />
            <span className="text-[11px] font-semibold text-black">Execution Runs</span>
            <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(0,0,0,0.4)" }}>{runs.length} total</span>
          </div>
          <div className="divide-y divide-black/[0.06] max-h-[440px] overflow-y-auto">
            {runs.length === 0 && <div className="p-6 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>No runs yet.</div>}
            {runs.map(run => (
              <div key={run.runId}>
                <div className="p-3.5 cursor-pointer hover:bg-black/3 transition-colors"
                  style={selectedRun?.runId === run.runId ? { background: `${ACCENT}08` } : {}}
                  onClick={() => { setSelectedRun(run); setExpandedRun(run.runId); }}>
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={run.status} />
                    <span className="text-[9px] font-mono truncate" style={{ color: "rgba(0,0,0,0.3)" }}>{run.runId.slice(0, 12)}…</span>
                    <button className="ml-auto p-0.5 hover:bg-black/10 rounded"
                      onClick={e => { e.stopPropagation(); setExpandedRun(v => v === run.runId ? null : run.runId); }}>
                      {expandedRun === run.runId ? <ChevronUp className="w-3 h-3" style={{ color: "rgba(0,0,0,0.3)" }} /> : <ChevronDown className="w-3 h-3" style={{ color: "rgba(0,0,0,0.3)" }} />}
                    </button>
                  </div>
                  <div className="text-[10px] font-medium text-black">{run.workflowId}</div>
                  {run.currentStep && <div className="flex items-center gap-1 mt-0.5 text-[9px]" style={{ color: "rgba(0,0,0,0.4)" }}><ChevronRight className="w-2.5 h-2.5" /> {run.currentStep}</div>}
                  {run.startedAt && <div className="text-[9px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>Started {new Date(run.startedAt).toLocaleTimeString()}</div>}
                </div>
                {expandedRun === run.runId && run.steps && run.steps.length > 0 && (
                  <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)" }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(0,0,0,0.35)" }}>Step Timeline</div>
                    {run.steps.map((step, i) => {
                      const sc = STATUS_COLOR[step.status] ?? "#6b7280";
                      return (
                        <div key={step.id} className="flex items-center gap-2.5">
                          <div className="relative flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full" style={{ background: sc }} />
                            {i < run.steps!.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(0,0,0,0.1)", minHeight: 12 }} />}
                          </div>
                          <div className="flex-1 pb-1">
                            <div className="text-[10px] text-black">{step.name}</div>
                            <div className="text-[9px]" style={{ color: sc }}>{step.status}</div>
                          </div>
                          {step.completedAt && <span className="text-[9px] font-mono" style={{ color: "rgba(0,0,0,0.3)" }}>{new Date(step.completedAt).toLocaleTimeString()}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evidence & Outcomes */}
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            <div className="p-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
              <Shield className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-semibold text-black">Evidence Chain</span>
              {selectedRun && <span className="ml-auto text-[9px] font-mono truncate" style={{ color: "rgba(0,0,0,0.3)" }}>run/{selectedRun.runId.slice(0, 8)}</span>}
            </div>
            <div className="divide-y divide-black/[0.06] max-h-52 overflow-y-auto">
              {!selectedRun && <div className="p-4 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>Select a run to view evidence</div>}
              {selectedRun && evidence.length === 0 && <div className="p-4 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>No evidence captured yet</div>}
              {evidence.map(ev => (
                <div key={ev.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-2.5 h-2.5 mt-0.5 shrink-0" style={{ color: "#10b981" }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-black">{ev.label}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(0,0,0,0.55)" }}>{ev.value}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(0,0,0,0.3)" }}>{ev.source} · {new Date(ev.capturedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden flex-1" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
            <div className="p-3.5 border-b flex items-center gap-2" style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.01)" }}>
              <FileText className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              <span className="text-[11px] font-semibold text-black">Service Outcomes</span>
              <span className="ml-auto text-[9px] font-mono" style={{ color: "rgba(0,0,0,0.4)" }}>{outcomes.length}</span>
            </div>
            <div className="divide-y divide-black/[0.06] max-h-52 overflow-y-auto">
              {outcomes.length === 0 && <div className="p-4 text-center text-[11px]" style={{ color: "rgba(0,0,0,0.4)" }}>No outcomes recorded</div>}
              {outcomes.map(oc => {
                const sc = STATUS_COLOR[oc.status] ?? "#6b7280";
                return (
                  <div key={oc.id} className="p-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded" style={{ color: sc, background: `${sc}15` }}>{oc.status}</span>
                      <span className="text-[9px] font-mono" style={{ color: "rgba(0,0,0,0.3)" }}>{new Date(oc.recordedAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-[10px] font-medium text-black">{oc.title}</div>
                    <div className="text-[9px] mt-0.5 leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>{oc.summary}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border p-3.5 flex items-start gap-2.5" style={{ borderColor: `${ACCENT}30`, background: `${ACCENT}08` }}>
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: ACCENT }} />
            <div className="text-[9px] leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
              Select service signals, then <strong className="text-black">Run Service Workflow</strong> to trigger the client triage, vendor sourcing, and delivery workflow. Vendor commitments ≥ $25K require principal approval.
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[9px] font-mono" style={{ color: "rgba(0,0,0,0.25)" }}>
        <Clock className="w-3 h-3" />
        <span>ATLAS {DOMAIN_LABEL} · Engine v1.0 · {new Date().toISOString()}</span>
        <span className="ml-auto">Policy: internal · Compliance: SLA-Standards</span>
      </div>
    </div>
  );
}
