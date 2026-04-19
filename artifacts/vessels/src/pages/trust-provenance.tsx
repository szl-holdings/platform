import React, { useState, useEffect } from "react";
import { PolicyResult } from "@szl-holdings/shared-ui/policy-result";
import { AdminAuditTrail } from "@szl-holdings/shared-ui/admin-audit-trail";
import { SimulationCockpit } from "@szl-holdings/shared-ui/simulation-cockpit";
import { Anchor, Shield, FileSearch, Clock, Activity, AlertCircle, Loader2 } from "lucide-react";
import { PendingAutonomyApprovalsPanel } from "../components/pending-autonomy-approvals";
import { ProofPanel } from "@szl-holdings/shared-ui/proof-panel";
import { type ProofPanelData } from "@szl-holdings/shared-ui/proof-panel";
import { type PolicyDecisionRecord } from "@szl-holdings/shared-ui/policy-result";
import { type AuditTrailEntry } from "@szl-holdings/shared-ui/admin-audit-trail";
import { type SimulationScenario, type PredictedVsActual } from "@szl-holdings/shared-ui/simulation-cockpit";
import { postPolicyAppeal } from "@szl-holdings/shared-ui/policy-appeal-client";

const ACCENT = "#0ea5e9";
const DOMAIN = "vessels";

interface SimulationData {
  title: string;
  description: string;
  primaryMetricLabel: string;
  iterationsRun: number;
  confidenceLevel: number;
  lastRunAt: string;
  predictedVsActual: PredictedVsActual[];
  scenarios: SimulationScenario[];
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-sky-400/50">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-xs">Loading {label}…</span>
    </div>
  );
}

function ErrorPanel({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-sky-400/40">
      <AlertCircle className="w-6 h-6" />
      <span className="text-xs">Failed to load {label}</span>
      <button
        onClick={onRetry}
        className="text-xs text-sky-400/60 hover:text-sky-400 border border-sky-500/20 rounded px-3 py-1 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function useApiData<T>(url: string): { data: T | null; loading: boolean; error: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(url, { credentials: "include" })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then(json => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn(`[trust-provenance] fetch failed: ${url}`, err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [url, tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}

type View = "proofs" | "policy" | "audit" | "simulation" | "approvals";

export default function TrustProvenancePage() {
  const [view, setView] = useState<View>("simulation");

  const proofResult = useApiData<{ domain: string; records: ProofPanelData[]; total: number }>(`/api/proof-chain?domain=${DOMAIN}`);
  const auditResult = useApiData<{ domain: string; entries: AuditTrailEntry[]; total: number }>(`/api/audit-log?domain=${DOMAIN}`);
  const policyResult = useApiData<{ domain: string; decisions: PolicyDecisionRecord[]; total: number }>(`/api/covenant/decisions?domain=${DOMAIN}`);
  const simulationResult = useApiData<SimulationData>(`/api/simulations/results?domain=${DOMAIN}`);

  const proofs = proofResult.data?.records ?? [];
  const auditEntries = auditResult.data?.entries ?? [];
  const policyDecisions = policyResult.data?.decisions ?? [];
  const simulation = simulationResult.data;

  const tabs: Array<{ id: View; label: string }> = [
    { id: "simulation", label: "Voyage Cockpit" },
    { id: "approvals", label: "Pending Approvals" },
    { id: "proofs", label: "AI Proof Chains" },
    { id: "policy", label: "Policy Governance" },
    { id: "audit", label: "Audit Trail" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
          <Anchor className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-sky-50">Trust & Provenance Center</h1>
          <p className="text-xs text-sky-400/50">Voyage simulation · AI proof chains · Policy governance · Decision audit</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Proof Records", value: proofResult.loading ? "…" : proofs.length, icon: FileSearch, color: "text-sky-400" },
          { label: "Pending Reviews", value: proofResult.loading ? "…" : proofs.filter(p => p.reviewState === "unreviewed").length, icon: Clock, color: "text-orange-400" },
          { label: "Policies Active", value: policyResult.loading ? "…" : policyDecisions.length, icon: Shield, color: "text-purple-400" },
          { label: "Voyages Simulated", value: simulationResult.loading ? "…" : (simulation ? simulation.scenarios.length : 0), icon: Activity, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/80 border border-sky-500/10 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-sky-50">{value}</div>
              <div className="text-[10px] text-sky-400/50">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 bg-slate-900/60 border border-sky-500/10 rounded-xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              view === tab.id
                ? "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                : "text-sky-400/50 hover:text-sky-400/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "simulation" && (
        <div className="space-y-4">
          {simulationResult.loading ? (
            <LoadingPanel label="simulation results" />
          ) : simulationResult.error ? (
            <ErrorPanel label="simulation results" onRetry={simulationResult.refetch} />
          ) : simulation ? (
            <>
              <p className="text-xs text-sky-400/50 px-1">VES-2026-044 Rotterdam → Singapore — 3 routing scenarios with Monte Carlo P&L ranges</p>
              <SimulationCockpit
                title={simulation.title}
                description={simulation.description}
                scenarios={simulation.scenarios}
                primaryMetricLabel={simulation.primaryMetricLabel}
                iterationsRun={simulation.iterationsRun}
                confidenceLevel={simulation.confidenceLevel}
                lastRunAt={simulation.lastRunAt}
                accentColor={ACCENT}
                predictedVsActual={simulation.predictedVsActual}
              />
            </>
          ) : null}
        </div>
      )}

      {view === "approvals" && (
        <PendingAutonomyApprovalsPanel
          domain="vessels"
          accentColor={ACCENT}
          accentClasses={{
            text: "text-sky-300",
            textMuted: "text-sky-400/60",
            bg: "bg-sky-500/10",
            border: "border-sky-500/20",
            button: "text-sky-300",
          }}
        />
      )}

      {view === "proofs" && (
        <div className="space-y-4">
          {proofResult.loading ? (
            <LoadingPanel label="proof records" />
          ) : proofResult.error ? (
            <ErrorPanel label="proof records" onRetry={proofResult.refetch} />
          ) : (
            <>
              <p className="text-xs text-sky-400/50 px-1">AI-generated sanctions assessments, voyage P&L computations with full provenance metadata</p>
              {proofs.map(proof => (
                <ProofPanel key={proof.proofId} proof={proof} variant="drawer" accentColor={ACCENT} showActions />
              ))}
            </>
          )}
        </div>
      )}

      {view === "policy" && (
        <div className="space-y-4">
          {policyResult.loading ? (
            <LoadingPanel label="policy decisions" />
          ) : policyResult.error ? (
            <ErrorPanel label="policy decisions" onRetry={policyResult.refetch} />
          ) : (
            <>
              <p className="text-xs text-sky-400/50 px-1">Covenant policy evaluation results for sanctions alerts and trade freeze governance</p>
              {policyDecisions.map((d, i) => (
                <PolicyResult
                  key={d.requestId ?? i}
                  decision={d}
                  accentColor={ACCENT}
                  showDetails
                  onEscalate={() => {
                    void postPolicyAppeal({
                      requestId: d.requestId,
                      action: "escalate",
                    });
                  }}
                  onAppeal={(reason) => {
                    void postPolicyAppeal({
                      requestId: d.requestId,
                      action: "appeal",
                      justification: reason,
                    });
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {view === "audit" && (
        auditResult.loading ? (
          <LoadingPanel label="audit trail" />
        ) : auditResult.error ? (
          <ErrorPanel label="audit trail" onRetry={auditResult.refetch} />
        ) : (
          <AdminAuditTrail entries={auditEntries} title="Vessels Decision Audit Trail" accentColor={ACCENT} domainLabel="Maritime Intelligence" />
        )
      )}
    </div>
  );
}
