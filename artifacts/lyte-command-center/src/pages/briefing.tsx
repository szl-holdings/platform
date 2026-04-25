import {
  DECISION_TWIN_ACTION_LABELS,
  DECISION_TWIN_ENGINE_VERSION,
  type DecisionTwinAction,
  type DecisionTwinScenario,
  deltaLabel,
  getBestScenario,
  PRISM_DIMENSION_LABELS,
  type PRISMDimension,
  riskLabel,
  runAllDecisionTwinScenarios,
  type SignalProfile,
} from '@workspace/simulation';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock,
  GitBranch,
  Link2,
  Lock,
  Printer,
  Shield,
  Square,
  TrendingDown,
  Users,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useRoute, useSearch } from 'wouter';
import { type SignalItem, signalItems } from '@/data/seed';
import { useBriefingAudio } from '@/lib/use-briefing-audio';

const BASE = (import.meta.env.BASE_URL ?? '/lyte/').replace(/\/$/, '');

function toSignalProfile(sig: SignalItem): SignalProfile {
  const stalledDays =
    sig.type === 'approval_chain_stall'
      ? 47
      : sig.type === 'deliverable_overdue'
        ? 22
        : sig.type === 'ownership_gap'
          ? 28
          : undefined;
  const financialExposureUsd =
    sig.type === 'revenue_risk'
      ? 4_200_000
      : sig.type === 'workflow_bottleneck'
        ? 7_800_000
        : sig.type === 'policy_violation'
          ? 3_400_000
          : sig.type === 'budget_leakage'
            ? 340_000
            : sig.type === 'approval_chain_stall'
              ? 1_800_000
              : undefined;
  return {
    id: sig.id,
    severity: sig.severity,
    type: sig.type,
    confidence: sig.confidence,
    hasOwnershipGap: sig.type === 'ownership_gap' || sig.type === 'approval_chain_stall',
    isPolicyBlocked: sig.policyState === 'blocked',
    hasBuyerEngagementRisk: sig.type === 'buyer_engagement_decay',
    isSecurityRelated: sig.type === 'policy_violation' || sig.type === 'escalation_blocked',
    ...(stalledDays !== undefined ? { stalledDays } : {}),
    ...(financialExposureUsd !== undefined ? { financialExposureUsd } : {}),
    affectedStakeholders: 3,
  };
}

const PRISM_ICONS: Record<PRISMDimension, React.ReactNode> = {
  revenue: <TrendingDown className="w-3.5 h-3.5" />,
  staffing: <Users className="w-3.5 h-3.5" />,
  infrastructure: <Activity className="w-3.5 h-3.5" />,
  security: <Lock className="w-3.5 h-3.5" />,
  market_timing: <Clock className="w-3.5 h-3.5" />,
};

const ACTION_BADGE: Record<DecisionTwinAction, string> = {
  approve: 'text-emerald-700 bg-emerald-50 border-emerald-200 print:bg-white',
  delay: 'text-red-700 bg-red-50 border-red-200 print:bg-white',
  escalate: 'text-amber-700 bg-amber-50 border-amber-200 print:bg-white',
  reroute: 'text-sky-700 bg-sky-50 border-sky-200 print:bg-white',
};

function ScenarioCard({ scenario, isBest }: { scenario: DecisionTwinScenario; isBest: boolean }) {
  const overall = deltaLabel(scenario.overallDelta);
  const after = riskLabel(scenario.overallRiskAfter);
  return (
    <section
      className={`rounded-lg border bg-white p-5 break-inside-avoid ${
        isBest ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${ACTION_BADGE[scenario.action]}`}
          >
            {DECISION_TWIN_ACTION_LABELS[scenario.action]}
          </span>
          {isBest && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 inline-flex items-center gap-1 print:bg-white">
              <CheckCircle2 className="w-3 h-3" /> RECOMMENDED
            </span>
          )}
          {scenario.isDemo && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-500 print:bg-white">
              DEMO DATA
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className={`text-sm font-mono font-bold ${overall.color}`}>{overall.label}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">overall risk</p>
        </div>
      </header>

      <p className="text-xs text-slate-600 leading-relaxed mb-4">{scenario.description}</p>

      <div className="space-y-3">
        {scenario.prismImpacts.map((impact) => {
          const d = deltaLabel(impact.delta);
          return (
            <div
              key={impact.dimension}
              className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">{PRISM_ICONS[impact.dimension]}</span>
                  <p className="text-[10px] font-mono uppercase tracking-wide text-slate-500">
                    {PRISM_DIMENSION_LABELS[impact.dimension]}
                  </p>
                </div>
                <p className={`text-[11px] font-mono font-semibold ${d.color}`}>
                  {impact.riskBefore} → {impact.riskAfter} ({d.label})
                </p>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed mb-1.5">{impact.summary}</p>
              <p className="text-[10px] font-mono text-slate-400 mb-1">
                Confidence band:{' '}
                <span className="text-slate-600">
                  {Math.round(impact.confidenceBand.low * 100)}% —{' '}
                  {Math.round(impact.confidenceBand.mid * 100)}% —{' '}
                  {Math.round(impact.confidenceBand.high * 100)}%
                </span>
              </p>
              <ul className="space-y-0.5">
                {impact.evidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px]">
                    <Shield className="w-2.5 h-2.5 text-slate-400 shrink-0 mt-[3px]" />
                    <span>
                      <span className="font-mono text-slate-500">{ev.label}:</span>{' '}
                      <span className="text-slate-700">{ev.value}</span>{' '}
                      <span className="text-slate-400">({ev.source})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <footer className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
        <span>
          Overall risk: {scenario.overallRiskBefore} →{' '}
          <span className={after.color}>{scenario.overallRiskAfter}</span>
        </span>
        <span>
          Band {Math.round(scenario.overallConfidence.low * 100)}–
          {Math.round(scenario.overallConfidence.high * 100)}%
        </span>
        <span>Impact: {scenario.timeToImpact}</span>
      </footer>
    </section>
  );
}

export default function BriefingPage() {
  const [, params] = useRoute('/briefing/:id');
  const search = useSearch();
  const [copied, setCopied] = useState(false);
  const { state: audioState, play: playBrief, stop: stopBrief, isAvailable: audioAvailable } = useBriefingAudio();

  const signalId = params?.id ?? '';
  const signal = signalItems.find((s) => s.id === signalId);

  const profile = useMemo(() => (signal ? toSignalProfile(signal) : null), [signal]);
  const scenarios = useMemo(() => (profile ? runAllDecisionTwinScenarios(profile) : []), [profile]);
  const best = useMemo(() => (scenarios.length ? getBestScenario(scenarios) : null), [scenarios]);

  const queryState = useMemo(() => {
    const params = new URLSearchParams(search);
    let snapshot: any = null;
    const sParam = params.get('s');
    if (sParam) {
      try {
        snapshot = JSON.parse(decodeURIComponent(escape(atob(sParam))));
      } catch {
        snapshot = null;
      }
    }
    return {
      pinnedAction: params.get('action') as DecisionTwinAction | null,
      sharedVersion: params.get('v') ?? '',
      sharedAt: params.get('ts') ?? '',
      note: params.get('note') ?? '',
      snapshot,
    };
  }, [search]);

  const generatedAt = useMemo(
    () =>
      queryState.sharedAt
        ? new Date(queryState.sharedAt).toLocaleString()
        : new Date().toLocaleString(),
    [queryState.sharedAt],
  );
  const note = queryState.note;
  const versionDrift =
    queryState.sharedVersion && queryState.sharedVersion !== DECISION_TWIN_ENGINE_VERSION;
  const pinned = queryState.pinnedAction
    ? (scenarios.find((s) => s.action === queryState.pinnedAction) ?? best)
    : best;

  useEffect(() => {
    document.title = signal ? `Briefing — ${signal.title}` : 'Decision Twin Briefing — Not found';
  }, [signal]);

  if (!signal) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">Briefing not available</h1>
          <p className="text-sm text-slate-600">
            No signal was found for ID{' '}
            <code className="px-1 py-0.5 bg-slate-200 rounded">{signalId}</code>. The link may be
            from a different deployment or the signal has been retired.
          </p>
          <Link
            href="/decision-twin"
            className="inline-flex items-center gap-2 text-sm text-amber-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Decision Twin
          </Link>
        </div>
      </div>
    );
  }

  const SEV_LABEL: Record<string, string> = {
    critical: 'text-red-700 border-red-300 bg-red-50',
    high: 'text-orange-700 border-orange-300 bg-orange-50',
    medium: 'text-amber-700 border-amber-300 bg-amber-50',
    low: 'text-sky-700 border-sky-300 bg-sky-50',
  };

  function copyShareLink() {
    const url = `${window.location.origin}${BASE}/briefing/${signalId}${note ? `?note=${encodeURIComponent(note)}` : ''}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        window.prompt('Copy this briefing link:', url);
      });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 18mm 15mm; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href="/decision-twin"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Decision Twin
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
            >
              <Link2 className="w-3.5 h-3.5" />
              {copied ? 'Link copied' : 'Copy share link'}
            </button>
            {audioAvailable && (
              audioState === 'playing' ? (
                <button
                  type="button"
                  onClick={stopBrief}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-red-300 bg-red-50 hover:bg-red-100 text-red-700"
                >
                  <Square className="w-3.5 h-3.5" /> Stop Audio
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => signal && playBrief({
                    briefId: signalId,
                    domain: 'lyte',
                    headline: signal.title,
                    situation: `Severity ${signal.severity}. Confidence ${Math.round(signal.confidence * 100)}%.`,
                    recommendations: best ? [`${DECISION_TWIN_ACTION_LABELS[best.action]}: ${best.description.slice(0, 120)}`] : [],
                  })}
                  disabled={!signal || audioState === 'loading'}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-700 disabled:opacity-50"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {audioState === 'loading' ? 'Preparing…' : 'Listen'}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-0">
        <header className="flex items-start justify-between gap-4 mb-6 pb-5 border-b border-slate-200">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded bg-amber-100 border border-amber-300 flex items-center justify-center print:bg-white">
                <GitBranch className="w-3.5 h-3.5 text-amber-700" />
              </div>
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-slate-500">
                Lyte · Decision Twin Briefing
              </p>
            </div>
            <h1 className="text-2xl font-semibold leading-tight text-slate-900 mb-2">
              {signal.title}
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed mb-3">{signal.body}</p>
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono text-slate-500">
              <span
                className={`px-2 py-0.5 rounded border ${SEV_LABEL[signal.severity]} print:bg-white`}
              >
                {signal.severity.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded border border-slate-300 bg-white inline-flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {signal.proofRef}
              </span>
              <span>Source: {signal.source}</span>
              <span>·</span>
              <span>Entity: {signal.linkedEntityLabel}</span>
              <span>·</span>
              <span>Confidence: {Math.round(signal.confidence * 100)}%</span>
              {signal.confidence < 0.85 && (
                <span className="px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-500 print:bg-white">
                  DEMO DATA
                </span>
              )}
            </div>
            {note && (
              <p className="mt-3 text-xs text-slate-700 italic border-l-2 border-amber-300 pl-3">
                "{note}"
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Engine</p>
            <p className="text-xs font-mono text-slate-700">v{DECISION_TWIN_ENGINE_VERSION}</p>
            <p className="text-[10px] font-mono text-slate-400 mt-2">Generated</p>
            <p className="text-xs text-slate-700">{generatedAt}</p>
          </div>
        </header>

        {versionDrift && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] font-mono text-amber-800 print:bg-white">
            <strong>Engine version drift:</strong> shared at v{queryState.sharedVersion}, current v
            {DECISION_TWIN_ENGINE_VERSION}. Live numbers below may differ from the originally shared
            briefing — snapshot values shown alongside where available.
          </div>
        )}

        {pinned && (
          <section className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-5 print:bg-white print:border-slate-300">
            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 mb-1">
              {queryState.pinnedAction ? 'Pinned by sender' : 'Recommended scenario'}
            </p>
            <h2 className="text-lg font-semibold text-emerald-900 mb-1">
              {DECISION_TWIN_ACTION_LABELS[pinned.action]}
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{pinned.description}</p>
            <p className="text-[11px] font-mono text-slate-600 mt-2">
              Time to impact: {pinned.timeToImpact} · Confidence band{' '}
              {Math.round(pinned.overallConfidence.low * 100)}–
              {Math.round(pinned.overallConfidence.high * 100)}%
            </p>
            {queryState.snapshot && versionDrift && (
              <p className="text-[10px] font-mono text-amber-700 mt-2 border-t border-emerald-200 pt-2">
                Snapshot at share time: {queryState.snapshot.overallRiskBefore} →{' '}
                {queryState.snapshot.overallRiskAfter} · band{' '}
                {Math.round((queryState.snapshot.overallConfidence?.low ?? 0) * 100)}–
                {Math.round((queryState.snapshot.overallConfidence?.high ?? 0) * 100)}%
              </p>
            )}
          </section>
        )}

        <section className="mb-6">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3">
            PRISM impact — all scenarios
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3">
            {scenarios.map((s) => (
              <ScenarioCard key={s.action} scenario={s} isBest={best?.action === s.action} />
            ))}
          </div>
        </section>

        <footer className="mt-8 pt-4 border-t border-slate-200 text-[10px] font-mono text-slate-500 leading-relaxed">
          <p>
            Proof chain: {signal.proofRef} · This briefing was generated by Lyte Decision Twin
            Engine v{DECISION_TWIN_ENGINE_VERSION}. All projections are probabilistic — confidence
            bands reflect model uncertainty.{' '}
            {scenarios[0]?.isDemo
              ? 'Demo data using scripted scenarios.'
              : 'Powered by live signal history.'}
          </p>
          <p className="mt-1">
            Shareable link:{' '}
            <span className="text-slate-700">
              {BASE}/briefing/{signalId}
              {note ? `?note=${encodeURIComponent(note)}` : ''}
            </span>
          </p>
        </footer>
      </main>
    </div>
  );
}
