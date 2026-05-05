import { useStandardQuery } from '@szl-holdings/api-client-react';
import { AlloyKernelPanel } from '@/components/AlloyKernelPanel';
import {
  type AutonomyMode,
  type ProofEvidenceSource as EvidenceSource,
  type PolicyState,
  ProofEnvelope,
} from '@szl-holdings/design-system';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useMutation } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Clock, FileWarning, Loader2, Scale, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#8b5cf6';

interface NarrativeSignal {
  signalId: string;
  type: string;
  severity: string;
  occurredAt: string;
  freshness: number;
  confidence: number;
  tags: string[];
  rawPayload: Record<string, unknown>;
  entityRefs: { entityId: string; displayName: string }[];
}

interface NarrativeEvidence {
  evidenceId: string;
  type: string;
  summary: string;
  confidence: number;
  freshness: number;
  observedAt: string;
  signalId?: string;
}

interface NarrativeRecommendation {
  recommendationId: string;
  title: string;
  summary: string;
  rationale: string;
  suggestedAction: string;
  confidence: number;
  freshness: number;
  projectedImpact: string;
  projectedRisk: string;
  projectedImpactUsd: number;
  projectedRiskReductionPct: number;
  generatedAt: string;
  evidenceIds: string[];
  signalIds: string[];
  tags: string[];
}

interface NarrativePayload {
  id: string;
  title: string;
  org: string;
  fetchedAt: string;
  scenario: { name: string; summary: string; peakRiskExposureUsd: number };
  signals: NarrativeSignal[];
  evidenceItems: NarrativeEvidence[];
  recommendation: NarrativeRecommendation;
}

const SIGNAL_ICONS: Record<string, typeof Scale> = {
  'threshold-breach': Clock,
  anomaly: FileWarning,
  'market-signal': AlertTriangle,
};

function severityClass(sev: string): string {
  if (sev === 'critical') return 'text-red-300 border-red-500/40 bg-red-500/10';
  if (sev === 'high') return 'text-orange-300 border-orange-500/40 bg-orange-500/10';
  if (sev === 'medium') return 'text-amber-300 border-amber-500/40 bg-amber-500/10';
  return 'text-violet-300 border-violet-500/40 bg-violet-500/10';
}

interface PCEExecuteResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalTier?: string;
  blockedReason?: string;
  contractId?: string;
  executedAt: string;
}

export default function DecisionCenter() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('recommend');
  const [pceResult, setPceResult] = useState<PCEExecuteResult | null>(null);

  const pceMutation = useMutation({
    mutationFn: async (payload: { matterId: string; actionId: string; actionDescription: string; signalIds: string[] }) => {
      return apiFetch<{ data: PCEExecuteResult }>('/counsel/decision-center/execute', {
        method: 'POST',
        body: JSON.stringify({ ...payload, riskLevel: 'high' }),
      });
    },
    onSuccess: (res) => {
      const r = (res as unknown as { data: PCEExecuteResult }).data ?? (res as unknown as PCEExecuteResult);
      setPceResult(r);
    },
  });

  const { data, isLoading, error } = useStandardQuery<NarrativePayload>({
    queryKey: ['narratives', 'counsel-deadline'],
    queryFn: () => apiFetch<NarrativePayload>('/narratives/counsel-deadline', { skipAuth: true }),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-violet-100">Decision Center</h1>
        <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-12 text-center text-violet-400/60 text-sm">
          Connecting to signal mesh…
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold text-violet-100">Decision Center</h1>
        <div className="bg-[#0a0614] border border-red-500/20 rounded-xl p-6 text-sm text-red-300">
          Signal mesh unavailable:{' '}
          {error instanceof Error ? error.message : 'Failed to fetch narrative payload.'}
        </div>
      </div>
    );
  }

  const { recommendation, signals, evidenceItems, scenario, fetchedAt } = data;

  const evidenceSources: EvidenceSource[] = evidenceItems.map((ev) => ({
    id: ev.evidenceId,
    label: ev.summary,
    type: ev.type === 'regulatory-rule' ? 'document' : ev.type === 'market-data' ? 'model' : 'api',
    timestamp: ev.observedAt,
    excerpt: `${ev.summary} (confidence ${(ev.confidence * 100).toFixed(0)}%, freshness ${(ev.freshness * 100).toFixed(0)}%)`,
  }));

  const policyState: PolicyState = 'requires-approval';

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-violet-100">Decision Center</h1>
          <p className="text-violet-400/60 text-sm mt-1">
            {scenario.name} — live signal mesh recommendation
          </p>
        </div>
        <div className="px-4 py-2 rounded border border-violet-500/40 bg-violet-500/10 flex items-center gap-3">
          <Activity className="w-5 h-5 text-violet-400 animate-pulse" />
          <div className="text-right">
            <div className="text-[10px] text-violet-300 font-mono uppercase tracking-widest">
              Live Mesh
            </div>
            <div className="text-sm font-bold text-violet-100">
              {signals.length} signals · {evidenceItems.length} evidence
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProofEnvelope
            title={recommendation.title}
            accentColor={ACCENT}
            evidence={evidenceSources}
            timestamp={recommendation.generatedAt}
            confidence={recommendation.confidence}
            policyState={policyState}
            policyReason="Counsel escalation requires partner review under matter authority policy."
            autonomyMode={autonomyMode}
            onAutonomyChange={setAutonomyMode}
            domain="counsel.matter-escalation"
            actionLabel={recommendation.suggestedAction}
          >
            <div className="space-y-4">
              <p className="text-sm text-violet-100/90 leading-relaxed">{recommendation.summary}</p>
              <div className="p-4 rounded bg-[#0a0614] border border-violet-500/10">
                <div className="text-[10px] uppercase tracking-widest text-violet-400/60 mb-1">
                  Rationale
                </div>
                <p className="text-xs text-violet-200/70 leading-relaxed">
                  {recommendation.rationale}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded border border-emerald-500/20 bg-emerald-500/5">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">
                    Projected Impact
                  </div>
                  <div className="text-lg font-bold text-emerald-300">
                    ${(recommendation.projectedImpactUsd / 1_000_000).toFixed(1)}M preserved
                  </div>
                  <p className="text-[11px] text-violet-200/60 mt-1 leading-snug">
                    {recommendation.projectedImpact}
                  </p>
                </div>
                <div className="p-3 rounded border border-red-500/20 bg-red-500/5">
                  <div className="text-[10px] uppercase tracking-widest text-red-400 mb-1">
                    Risk if Inaction
                  </div>
                  <div className="text-lg font-bold text-red-300">
                    {recommendation.projectedRiskReductionPct}% risk reduction at stake
                  </div>
                  <p className="text-[11px] text-violet-200/60 mt-1 leading-snug">
                    {recommendation.projectedRisk}
                  </p>
                </div>
              </div>

              <div className="border-t border-violet-500/10 pt-4">
                <div className="text-[10px] uppercase tracking-widest text-violet-400/60 mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  A11oy PCE Gate — Precision Consent Engine
                </div>
                {pceResult ? (
                  <div className={`rounded-lg border p-4 ${pceResult.allowed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {pceResult.allowed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs font-bold ${pceResult.allowed ? 'text-emerald-300' : 'text-red-300'}`}>
                        {pceResult.allowed ? 'PCE GATE PASSED' : 'PCE GATE BLOCKED'}
                      </span>
                    </div>
                    {pceResult.requiresApproval && (
                      <p className="text-[11px] text-amber-300 mb-1">Approval required — tier: {pceResult.approvalTier ?? 'executive'}</p>
                    )}
                    {pceResult.blockedReason && (
                      <p className="text-[11px] text-red-300/80">{pceResult.blockedReason}</p>
                    )}
                    {pceResult.contractId && (
                      <p className="text-[10px] font-mono text-violet-400/50 mt-1">Contract: {pceResult.contractId}</p>
                    )}
                    <p className="text-[10px] text-violet-400/40 mt-1 font-mono">
                      Evaluated {new Date(pceResult.executedAt).toLocaleTimeString()}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      pceMutation.mutate({
                        matterId: data?.id ?? 'counsel-decision',
                        actionId: `counsel:decision:${recommendation.recommendationId}`,
                        actionDescription: `${recommendation.suggestedAction} — ${recommendation.title}`,
                        signalIds: signals.map((s) => s.signalId),
                      })
                    }
                    disabled={pceMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-violet-600/20 border border-violet-500/30 text-xs font-semibold text-violet-200 hover:bg-violet-600/35 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {pceMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    {pceMutation.isPending ? 'Evaluating through A11oy PCE…' : 'Execute via A11oy PCE Gate'}
                  </button>
                )}
                {pceMutation.isError && (
                  <p className="text-[11px] text-red-400 mt-2">PCE gate error — {(pceMutation.error as Error)?.message}</p>
                )}
              </div>
            </div>
          </ProofEnvelope>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-violet-100 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-violet-400" />
              Live Signal Stream — {signals.length} clustered
            </h3>
            <div className="space-y-3">
              {signals.map((s) => {
                const Icon = SIGNAL_ICONS[s.type] ?? Scale;
                return (
                  <div
                    key={s.signalId}
                    className="p-3 rounded bg-violet-500/5 border border-violet-500/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <Icon className="w-4 h-4 text-violet-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-violet-100 truncate">
                            {String(s.rawPayload.eventType ?? s.type)}
                          </div>
                          <div className="text-[11px] text-violet-400/60 mt-0.5">
                            {s.entityRefs.map((e) => e.displayName).join(', ') || '—'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border ${severityClass(s.severity)}`}
                        >
                          {s.severity}
                        </span>
                        <span className="text-[10px] text-violet-400/60 font-mono">
                          {new Date(s.occurredAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 font-mono uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <div className="text-[10px] uppercase tracking-widest text-violet-400/60 mb-2">
              Scenario
            </div>
            <div className="text-sm font-bold text-violet-100 mb-2">{scenario.name}</div>
            <p className="text-xs text-violet-200/70 leading-relaxed">{scenario.summary}</p>
          </div>
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5 space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-violet-400/60">
                Peak Exposure
              </div>
              <div className="text-2xl font-bold text-red-300">
                ${(scenario.peakRiskExposureUsd / 1_000_000).toFixed(1)}M
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-violet-400/60">
                AI Confidence
              </div>
              <div className="text-2xl font-bold text-violet-100">
                {(recommendation.confidence * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-violet-400/60">
                Suggested Action
              </div>
              <div className="text-sm font-bold text-violet-100 uppercase">
                {recommendation.suggestedAction}
              </div>
            </div>
            <div className="pt-3 border-t border-violet-500/10 text-[10px] text-violet-400/60 font-mono">
              Mesh fetched {new Date(fetchedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <AlloyKernelPanel />
    </div>
  );
}
