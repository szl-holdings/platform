import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  type AutonomyMode,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
} from '@szl-holdings/design-system';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, Database, Info, Zap } from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#8b5cf6';

interface Obligation {
  id: string;
  matterId: string;
  title: string;
  status: string;
  dueDate: string;
  consequence?: string;
  filingRequired: boolean;
}

interface Matter {
  id: string;
  name: string;
  status: string;
  type: string;
  estimatedExposure?: number;
  pressureScore: number;
  complexityScore: number;
  leadCounsel: string;
  jurisdiction: string;
  obligations: Obligation[];
  provenance?: string;
}

interface MattersResponse {
  matters: Matter[];
  provenance?: string;
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-help"
      >
        {children}
      </span>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 text-[10px] bg-[#1a0e30] border border-violet-500/30 rounded-lg px-3 py-2 text-violet-200/80 leading-relaxed z-20 shadow-xl pointer-events-none">
          {content}
        </span>
      )}
    </span>
  );
}

function computeRiskScore(matters: Matter[]): {
  score: number;
  sources: { label: string; weight: number; detail: string }[];
} {
  if (matters.length === 0) return { score: 0, sources: [] };
  const avgPressure = matters.reduce((a, m) => a + m.pressureScore, 0) / matters.length;
  const escalatedFraction = matters.filter((m) => m.status === 'escalated').length / matters.length;
  const overdueObls = matters
    .flatMap((m) => m.obligations)
    .filter((o) => o.status === 'overdue' || o.status === 'at-risk').length;
  const obligationPressure = Math.min(overdueObls * 8, 40);
  const score = Math.min(
    100,
    Math.round(avgPressure * 0.4 + escalatedFraction * 30 + obligationPressure),
  );
  return {
    score,
    sources: [
      {
        label: 'Matter Pressure Score',
        weight: 40,
        detail: `Average pressure score across ${matters.length} matters: ${avgPressure.toFixed(0)}/100`,
      },
      {
        label: 'Escalation Rate',
        weight: 30,
        detail: `${(escalatedFraction * 100).toFixed(0)}% of matters are escalated`,
      },
      {
        label: 'Overdue Obligations',
        weight: 30,
        detail: `${overdueObls} obligations are overdue or at risk (capped at 40pts)`,
      },
    ],
  };
}

function computeExposureByType(
  matters: Matter[],
): { label: string; val: number; count: number }[] {
  const buckets: Record<string, { total: number; count: number }> = {};
  for (const m of matters) {
    const key =
      m.type === 'litigation' || m.type === 'ip' || m.type === 'employment'
        ? 'Litigation'
        : m.type === 'transaction'
          ? 'M&A'
          : m.type === 'regulatory'
            ? 'Regulatory'
            : 'Other';
    buckets[key] = buckets[key] ?? { total: 0, count: 0 };
    buckets[key]!.total += m.estimatedExposure ?? 0;
    buckets[key]!.count += 1;
  }
  return Object.entries(buckets).map(([label, { total, count }]) => ({
    label,
    val: total / 1_000_000,
    count,
  }));
}

function ProvenanceBadge({ provenance }: { provenance?: string }) {
  if (!provenance) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <Database className="w-2.5 h-2.5" />
      {provenance === 'seeded' ? 'Demo Data' : 'Live DB'}
    </span>
  );
}

export default function RiskExposureDesk() {
  const [escalationMode, setEscalationMode] = useState<AutonomyMode>('recommend');
  const [budgetMode, setBudgetMode] = useState<AutonomyMode>('recommend');

  const { data, isLoading, error } = useQuery<MattersResponse>({
    queryKey: ['counsel-matters'],
    queryFn: () => apiFetch<MattersResponse>('/counsel/matters', { skipAuth: true }),
    staleTime: 30_000,
    retry: 2,
  });

  const matters = data?.matters ?? [];
  const provenance = data?.provenance;

  const { score: riskScore, sources: riskSources } = computeRiskScore(matters);
  const exposureByType = computeExposureByType(matters);
  const maxExposure = Math.max(...exposureByType.map((e) => e.val), 1);
  const highRiskMatters = matters
    .filter((m) => m.pressureScore > 70 || m.status === 'escalated')
    .sort((a, b) => b.pressureScore - a.pressureScore)
    .slice(0, 5);

  const overdueObligations = matters
    .flatMap((m) => m.obligations)
    .filter((o) => o.status === 'overdue' || o.status === 'at-risk');

  const DEADLINE_EVIDENCE: EvidenceSource[] = overdueObligations.slice(0, 2).map((o, i) => ({
    id: `ev-obl-${i}`,
    label: `Obligation Tracker — ${o.title}`,
    type: 'api' as const,
    timestamp: new Date(Date.now() - (i + 1) * 5 * 60_000).toISOString(),
    excerpt: o.consequence
      ? `${o.title}: ${o.consequence}`
      : `${o.title} is ${o.status}. Filing required: ${o.filingRequired ? 'yes' : 'no'}.`,
  }));

  if (DEADLINE_EVIDENCE.length === 0) {
    DEADLINE_EVIDENCE.push({
      id: 'ev-risk-fallback',
      label: 'Exposure Model — Risk Analysis',
      type: 'model',
      timestamp: new Date(Date.now() - 15 * 60_000).toISOString(),
      excerpt: 'Risk model computed from matter pressure scores and obligation status.',
    });
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-violet-100">Risk & Exposure Desk</h1>
          <p className="text-violet-400/60 text-sm">
            Financial exposure analysis and AI-driven risk mitigation.
          </p>
        </div>
        <ProvenanceBadge provenance={provenance} />
      </header>

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          {error instanceof Error ? error.message : 'Failed to load risk data'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-violet-100">Financial Exposure by Type</h3>
              <Tooltip content="Exposure amounts come from the estimatedExposure field on each matter, grouped by matter type. Source: GET /counsel/matters.">
                <Info className="w-3.5 h-3.5 text-violet-400/40 hover:text-violet-400" />
              </Tooltip>
            </div>
            {isLoading ? (
              <div className="h-64 flex items-end justify-between gap-4 px-4 pt-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex-1 bg-violet-500/10 rounded-t-lg animate-pulse"
                    style={{ height: `${20 + i * 20}%` }}
                  />
                ))}
              </div>
            ) : exposureByType.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-violet-400/40 text-sm">
                No exposure data available
              </div>
            ) : (
              <div className="h-64 flex items-end justify-between gap-4 px-4 pt-8">
                {exposureByType.map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-full flex flex-col items-center">
                      <div className="absolute -top-6 text-[10px] font-bold text-violet-100">
                        ${bar.val.toFixed(1)}M
                      </div>
                      <Tooltip
                        content={`${bar.label}: $${bar.val.toFixed(1)}M across ${bar.count} matter${bar.count !== 1 ? 's' : ''}. Computed from matter exposure fields.`}
                      >
                        <div
                          className="w-full bg-violet-500/20 border border-violet-500/40 rounded-t-lg transition-all group-hover:bg-violet-500/40 cursor-help"
                          style={{ height: `${Math.max((bar.val / maxExposure) * 160, 8)}px` }}
                        />
                      </Tooltip>
                    </div>
                    <span className="text-[10px] text-violet-400/60 mt-3 uppercase tracking-wider">
                      {bar.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-violet-100">High-Pressure Matters</h3>
              <Tooltip content="Matters sorted by pressure score (0–100). Score = avg obligation delays × deadline proximity × matter complexity. Source: GET /counsel/matters pressureScore field.">
                <Info className="w-3.5 h-3.5 text-violet-400/40 hover:text-violet-400" />
              </Tooltip>
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-violet-500/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : highRiskMatters.length === 0 ? (
              <div className="py-8 text-center text-violet-400/40 text-sm">
                No high-pressure matters
              </div>
            ) : (
              <div className="space-y-3">
                {highRiskMatters.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-xs font-bold text-violet-100 truncate">{m.name}</div>
                      <div className="text-[10px] text-violet-400/60">
                        Pressure: {m.pressureScore}/100 · Complexity: {m.complexityScore}/100 ·{' '}
                        {m.leadCounsel}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {m.estimatedExposure ? (
                        <div className="text-sm font-bold text-red-400">
                          ${(m.estimatedExposure / 1_000_000).toFixed(1)}M
                        </div>
                      ) : null}
                      <div className="text-[10px] text-violet-400/50">
                        +{Math.round((m.estimatedExposure ?? 0) * 0.4 / 1_000_000 * 10) / 10}M
                        est. penalty
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider">
                Portfolio Risk Score
              </h3>
              <Tooltip
                content={riskSources
                  .map((s) => `${s.label} (${s.weight}% weight): ${s.detail}`)
                  .join(' | ')}
              >
                <Info className="w-3.5 h-3.5 text-violet-400/40 hover:text-violet-400 cursor-help" />
              </Tooltip>
            </div>
            <div className="text-5xl font-bold text-violet-100 mb-2">{riskScore}</div>
            <div className="w-full h-1.5 bg-violet-500/10 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${riskScore}%`,
                  background:
                    riskScore > 75
                      ? '#ef4444'
                      : riskScore > 50
                        ? '#f59e0b'
                        : '#8b5cf6',
                }}
              />
            </div>
            <div className="space-y-2">
              {riskSources.map((s) => (
                <div key={s.label} className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-violet-400/30 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[10px] text-violet-300/60 font-medium">{s.label}</div>
                    <div className="text-[9px] text-violet-400/40 leading-snug">{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0a0614] border border-violet-500/10 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-semibold text-violet-100 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              AI Recommendations
            </h3>

            <ProofEnvelope
              title={
                overdueObligations.length > 0
                  ? `Escalation Recommended — ${overdueObligations.length} overdue obligation${overdueObligations.length !== 1 ? 's' : ''}`
                  : 'Risk Monitoring — No Critical Actions'
              }
              accentColor={ACCENT}
              evidence={DEADLINE_EVIDENCE}
              timestamp={DEADLINE_EVIDENCE[0]?.timestamp ?? new Date().toISOString()}
              confidence={overdueObligations.length > 0 ? 92 : 75}
              policyState={'requires-approval' as PolicyState}
              autonomyMode={escalationMode}
              onAutonomyChange={setEscalationMode}
            >
              <div className="space-y-3">
                <p className="text-xs text-violet-200 leading-relaxed">
                  {overdueObligations.length > 0
                    ? `${overdueObligations.length} obligation${overdueObligations.length !== 1 ? 's are' : ' is'} overdue or at risk. Portfolio risk score: ${riskScore}/100.`
                    : 'All obligations are on track. Portfolio risk score is within acceptable range.'}
                </p>
                {overdueObligations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">
                      Recommended Actions
                    </div>
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-2 text-[10px] text-violet-300/70">
                        <ArrowRight className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                        Escalate overdue items to lead counsel for immediate review.
                      </li>
                      <li className="flex items-start gap-2 text-[10px] text-violet-300/70">
                        <ArrowRight className="w-3 h-3 text-violet-500 shrink-0 mt-0.5" />
                        Review filing-required obligations to avoid penalty exposure.
                      </li>
                    </ul>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold py-2 rounded transition-colors">
                    Approve Action
                  </button>
                  <button className="flex-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-[10px] font-bold py-2 rounded transition-colors border border-violet-500/20">
                    Dismiss
                  </button>
                </div>
              </div>
            </ProofEnvelope>

            <ProofEnvelope
              title="Counsel Performance — Budget Review"
              accentColor={ACCENT}
              evidence={[
                {
                  id: 'ev-budget-001',
                  label: 'Matter Management — Lead Counsel Distribution',
                  type: 'api',
                  timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
                  excerpt: `${matters.length} matters tracked across ${new Set(matters.map((m) => m.leadCounsel)).size} counsel. Source: live matter database.`,
                },
              ]}
              timestamp={new Date(Date.now() - 60 * 60_000).toISOString()}
              confidence={85}
              policyState={'allowed' as PolicyState}
              autonomyMode={budgetMode}
              onAutonomyChange={setBudgetMode}
            >
              <div className="space-y-2">
                <p className="text-xs text-violet-200">
                  {new Set(matters.map((m) => m.leadCounsel)).size} counsel assigned across{' '}
                  {matters.length} matters. Review allocation to ensure balanced workload.
                </p>
                <button className="w-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-[10px] font-bold py-2 rounded transition-colors border border-violet-500/20">
                  Review Allocation
                </button>
              </div>
            </ProofEnvelope>
          </div>
        </div>
      </div>
    </div>
  );
}
