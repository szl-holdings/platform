import { AdminAuditTrail, type AuditTrailEntry } from '@szl-holdings/shared-ui/admin-audit-trail';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import { postPolicyAppeal } from '@szl-holdings/shared-ui/policy-appeal-client';
import { type PolicyDecisionRecord, PolicyResult } from '@szl-holdings/shared-ui/policy-result';
import { ProofPanel, type ProofPanelData } from '@szl-holdings/shared-ui/proof-panel';
import {
  type PredictedVsActual,
  SimulationCockpit,
  type SimulationScenario,
} from '@szl-holdings/shared-ui/simulation-cockpit';
import { AlertCircle, CheckCircle, Clock, FileSearch, Loader2, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const ACCENT = LANE_ACCENT_HEX.aegis.primary;
const DOMAIN = 'aegis';

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
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-orange-400/50">
      <Loader2 className="w-6 h-6 animate-spin" />
      <span className="text-xs">Loading {label}…</span>
    </div>
  );
}

function ErrorPanel({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-orange-400/40">
      <AlertCircle className="w-6 h-6" />
      <span className="text-xs">Failed to load {label}</span>
      <button
        onClick={onRetry}
        className="text-xs text-orange-400/60 hover:text-orange-400 border border-orange-500/20 rounded px-3 py-1 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function useApiData<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(url, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((_err) => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [url, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

type ActiveView = 'proofs' | 'policy' | 'audit' | 'simulation';

export default function TrustProvenancePage() {
  const [activeView, setActiveView] = useState<ActiveView>('proofs');
  const [expandedProofId, setExpandedProofId] = useState<number | string | null>(null);

  const proofResult = useApiData<{ domain: string; records: ProofPanelData[]; total: number }>(
    `/api/proof-chain?domain=${DOMAIN}`,
  );
  const auditResult = useApiData<{ domain: string; entries: AuditTrailEntry[]; total: number }>(
    `/api/audit-log?domain=${DOMAIN}`,
  );
  const policyResult = useApiData<{
    domain: string;
    decisions: PolicyDecisionRecord[];
    total: number;
  }>(`/api/covenant/decisions?domain=${DOMAIN}`);
  const simulationResult = useApiData<SimulationData>(`/api/simulations/results?domain=${DOMAIN}`);

  const proofs = proofResult.data?.records ?? [];
  const auditEntries = auditResult.data?.entries ?? [];
  const policyDecisions = policyResult.data?.decisions ?? [];
  const simulation = simulationResult.data;

  const tabs: Array<{ id: ActiveView; label: string; icon: React.ReactNode }> = [
    { id: 'proofs', label: 'Proof Chains', icon: <FileSearch className="w-3.5 h-3.5" /> },
    { id: 'policy', label: 'Policy Results', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'audit', label: 'Audit Trail', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'simulation', label: 'Decision Cockpit', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-orange-50">Trust & Provenance Center</h1>
          <p className="text-xs text-orange-400/50">
            Proof chain visibility · Policy governance · Decision audit · Simulation cockpit
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Proof Records',
            value: proofResult.loading ? '…' : proofs.length,
            icon: FileSearch,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
          },
          {
            label: 'Policies Active',
            value: policyResult.loading ? '…' : policyDecisions.length,
            icon: Shield,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
          },
          {
            label: 'Pending Reviews',
            value: proofResult.loading
              ? '…'
              : proofs.filter((p) => p.reviewState === 'unreviewed').length,
            icon: Clock,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Audit Events',
            value: auditResult.loading ? '…' : auditEntries.length,
            icon: CheckCircle,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-[#09080f]/80 border border-orange-500/10 rounded-xl p-4 flex items-center gap-3"
          >
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-lg font-bold text-orange-50">{value}</div>
              <div className="text-[10px] text-orange-400/50">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[#09080f]/60 border border-orange-500/10 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeView === tab.id
                ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                : 'text-orange-400/50 hover:text-orange-400/80'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Proof Chains View */}
      {activeView === 'proofs' && (
        <div className="space-y-4">
          {proofResult.loading ? (
            <LoadingPanel label="proof records" />
          ) : proofResult.error ? (
            <ErrorPanel label="proof records" onRetry={proofResult.refetch} />
          ) : (
            <>
              <div className="text-xs text-orange-400/50 px-1">
                {proofs.length} proof records · Showing AI-generated content provenance, review
                states, and export safety indicators
              </div>
              {proofs.map((proof) => (
                <div key={proof.proofId}>
                  <div
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedProofId((prev) =>
                        prev === proof.proofId ? null : (proof.proofId ?? null),
                      )
                    }
                  >
                    <ProofPanel
                      proof={proof}
                      variant={expandedProofId === proof.proofId ? 'drawer' : 'inline'}
                      accentColor={ACCENT}
                      showActions
                      onReview={(_state) => {
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-orange-400/40 pt-2">
                <span>📌</span>
                <span>
                  Proof panels can be embedded inline in any AI output panel. Click a proof to
                  expand or collapse details.
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Policy Results View */}
      {activeView === 'policy' && (
        <div className="space-y-4">
          {policyResult.loading ? (
            <LoadingPanel label="policy decisions" />
          ) : policyResult.error ? (
            <ErrorPanel label="policy decisions" onRetry={policyResult.refetch} />
          ) : (
            <>
              <div className="text-xs text-orange-400/50 px-1">
                Recent policy evaluations — approval history, denial reasons, escalation paths, and
                remediation guidance
              </div>
              {policyDecisions.map((decision, i) => (
                <PolicyResult
                  key={decision.requestId ?? i}
                  decision={decision}
                  accentColor={ACCENT}
                  showDetails
                  onEscalate={() => {
                    void postPolicyAppeal({
                      requestId: decision.requestId,
                      action: 'escalate',
                    });
                  }}
                  onAppeal={(reason) => {
                    void postPolicyAppeal({
                      requestId: decision.requestId,
                      action: 'appeal',
                      justification: reason,
                    });
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Audit Trail View */}
      {activeView === 'audit' &&
        (auditResult.loading ? (
          <LoadingPanel label="audit trail" />
        ) : auditResult.error ? (
          <ErrorPanel label="audit trail" onRetry={auditResult.refetch} />
        ) : (
          <AdminAuditTrail
            entries={auditEntries}
            title="PARAGON Decision Audit Trail"
            accentColor={ACCENT}
            showFilters
            domainLabel="Security Operations"
          />
        ))}

      {/* Simulation Cockpit View */}
      {activeView === 'simulation' && (
        <div className="space-y-4">
          {simulationResult.loading ? (
            <LoadingPanel label="simulation results" />
          ) : simulationResult.error ? (
            <ErrorPanel label="simulation results" onRetry={simulationResult.refetch} />
          ) : simulation ? (
            <>
              <div className="text-xs text-orange-400/50 px-1">
                Incident response scenario analysis — Monte Carlo simulation with best/base/worst
                ranges and sensitivity drivers
              </div>
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
    </div>
  );
}
