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
  CheckCircle2,
  Clock,
  GitBranch,
  Link2,
  Lock,
  Printer,
  Shield,
  TrendingDown,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearch } from 'wouter';
import { type SignalItem, signalItems } from '@/data/seed';
import {
  getLatestTwinAuditForSignal,
  type TwinVerdict,
  useTwinAuditStore,
  writeTwinAuditEvent,
} from '@/data/twin-audit';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  revenue: <TrendingDown className="w-3 h-3" />,
  staffing: <Users className="w-3 h-3" />,
  infrastructure: <Activity className="w-3 h-3" />,
  security: <Lock className="w-3 h-3" />,
  market_timing: <Clock className="w-3 h-3" />,
};

const ACTION_COLORS: Record<DecisionTwinAction, { badge: string; ring: string; bg: string }> = {
  approve: {
    badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    ring: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
  },
  delay: {
    badge: 'text-red-400 bg-red-500/10 border-red-500/25',
    ring: 'border-red-500/30',
    bg: 'bg-red-500/5',
  },
  escalate: {
    badge: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    ring: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
  },
  reroute: {
    badge: 'text-sky-400 bg-sky-500/10 border-sky-500/25',
    ring: 'border-sky-500/30',
    bg: 'bg-sky-500/5',
  },
};

function RiskBar({ before, after }: { before: number; after: number }) {
  const improving = after <= before;
  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-amber-500/10 overflow-hidden relative">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-amber-500/30 transition-all"
          style={{ width: `${before}%` }}
        />
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${improving ? 'bg-emerald-400' : 'bg-red-400'}`}
          style={{ width: `${after}%` }}
        />
      </div>
      <span className="text-[9px] font-mono text-amber-400/40 w-8 text-right shrink-0">
        {after}/100
      </span>
    </div>
  );
}

// ─── PRISM Card ───────────────────────────────────────────────────────────────

function PRISMImpactCard({ scenario }: { scenario: DecisionTwinScenario }) {
  const [expandedDim, setExpandedDim] = useState<PRISMDimension | null>(null);
  const actionColors = ACTION_COLORS[scenario.action];
  const overallDelta = deltaLabel(scenario.overallDelta);
  const overallRisk = riskLabel(scenario.overallRiskAfter);

  return (
    <div
      className={`cockpit-panel border ${actionColors.ring} ${scenario.action === 'approve' ? 'border-l-2' : ''}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-mono px-2 py-0.5 rounded border ${actionColors.badge}`}
            >
              {DECISION_TWIN_ACTION_LABELS[scenario.action]}
            </span>
            {scenario.isDemo && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-amber-400/40 bg-amber-500/5 border-amber-500/15">
                DEMO
              </span>
            )}
          </div>
          <div className="text-right">
            <span className={`text-xs font-mono font-bold ${overallDelta.color}`}>
              {overallDelta.label}
            </span>
            <p className="text-[9px] text-amber-400/30 mt-0.5">overall risk</p>
          </div>
        </div>

        <p className="text-[10px] text-amber-100/60 leading-relaxed mb-3">{scenario.description}</p>

        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {scenario.prismImpacts.map((impact) => {
            const d = deltaLabel(impact.delta);
            const isExp = expandedDim === impact.dimension;
            return (
              <button
                key={impact.dimension}
                onClick={() => setExpandedDim(isExp ? null : impact.dimension)}
                className={`text-left rounded border p-2 transition-all ${
                  isExp
                    ? 'border-amber-500/30 bg-amber-500/8'
                    : 'border-amber-500/10 bg-amber-500/3 hover:border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-amber-400/50 ${isExp ? 'text-amber-300' : ''}`}>
                    {PRISM_ICONS[impact.dimension]}
                  </span>
                </div>
                <p className="text-[8px] font-mono text-amber-400/40 leading-tight mb-0.5 truncate">
                  {impact.dimension.replace('_', ' ').toUpperCase()}
                </p>
                <p className={`text-[10px] font-mono font-semibold ${d.color}`}>{d.label}</p>
                <RiskBar before={impact.riskBefore} after={impact.riskAfter} />
              </button>
            );
          })}
        </div>

        {expandedDim &&
          (() => {
            const impact = scenario.prismImpacts.find((d) => d.dimension === expandedDim);
            if (!impact) return null;
            const d = deltaLabel(impact.delta);
            return (
              <div className="rounded bg-amber-500/4 border border-amber-500/15 p-3 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono text-amber-400/40 uppercase">
                    {PRISM_DIMENSION_LABELS[expandedDim]}
                  </p>
                  <span className={`text-[9px] font-mono ${d.color}`}>
                    {impact.riskBefore} → {impact.riskAfter} ({d.label})
                  </span>
                </div>
                <p className="text-xs text-amber-100/70 leading-relaxed">{impact.summary}</p>
                <div className="flex items-center gap-2 text-[9px] font-mono text-amber-400/40">
                  <span>Confidence band:</span>
                  <span className="text-amber-300/60">
                    {Math.round(impact.confidenceBand.low * 100)}% —{' '}
                    {Math.round(impact.confidenceBand.mid * 100)}% —{' '}
                    {Math.round(impact.confidenceBand.high * 100)}%
                  </span>
                </div>
                <div className="space-y-1">
                  {impact.evidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Shield className="w-2.5 h-2.5 text-amber-400/30 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-mono text-amber-400/40">{ev.label}: </span>
                        <span className="text-[9px] text-amber-100/60">{ev.value}</span>
                        <span className="text-[8px] text-amber-400/25 ml-1">({ev.source})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

        <div className="flex items-center gap-3 text-[9px] font-mono text-amber-400/30">
          <span>
            Overall risk: {scenario.overallRiskBefore} →{' '}
            <span className={overallRisk.color}>{scenario.overallRiskAfter}</span>
          </span>
          <span>·</span>
          <span>
            Band: {Math.round(scenario.overallConfidence.low * 100)}–
            {Math.round(scenario.overallConfidence.high * 100)}%
          </span>
          <span>·</span>
          <span>Impact: {scenario.timeToImpact}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Compare Table ────────────────────────────────────────────────────────────

function ScenarioCompareTable({ scenarios }: { scenarios: DecisionTwinScenario[] }) {
  const dims = [
    'revenue',
    'staffing',
    'infrastructure',
    'security',
    'market_timing',
  ] as PRISMDimension[];

  return (
    <div className="cockpit-panel overflow-x-auto">
      <div className="p-4 border-b border-amber-500/10">
        <p className="text-[9px] font-mono text-amber-400/40 uppercase">
          Scenario Comparison — PRISM Dimension Deltas
        </p>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-amber-500/10">
            <th className="text-left p-3 text-[9px] font-mono text-amber-400/30 uppercase w-36">
              Dimension
            </th>
            {scenarios.map((s) => {
              const colors = ACTION_COLORS[s.action];
              return (
                <th key={s.action} className="p-3 text-center text-[9px] font-mono">
                  <span className={`px-2 py-0.5 rounded border ${colors.badge}`}>
                    {DECISION_TWIN_ACTION_LABELS[s.action]}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {dims.map((dim) => (
            <tr
              key={dim}
              className="border-b border-amber-500/8 hover:bg-amber-500/3 transition-colors"
            >
              <td className="p-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400/50">{PRISM_ICONS[dim]}</span>
                  <span className="text-[9px] text-amber-400/50">
                    {PRISM_DIMENSION_LABELS[dim]}
                  </span>
                </div>
              </td>
              {scenarios.map((s) => {
                const impact = s.prismImpacts.find((i) => i.dimension === dim);
                if (!impact)
                  return (
                    <td key={s.action} className="p-3 text-center text-amber-400/20">
                      —
                    </td>
                  );
                const d = deltaLabel(impact.delta);
                const isBest =
                  scenarios.reduce((best, curr) => {
                    const bImpact = best.prismImpacts.find((i) => i.dimension === dim);
                    const cImpact = curr.prismImpacts.find((i) => i.dimension === dim);
                    return (bImpact?.riskAfter ?? 999) > (cImpact?.riskAfter ?? 999) ? curr : best;
                  }, scenarios[0]!).action === s.action;

                return (
                  <td
                    key={s.action}
                    className={`p-3 text-center ${isBest ? 'bg-emerald-500/5' : ''}`}
                  >
                    <p className={`text-xs font-mono font-semibold ${d.color}`}>{d.label}</p>
                    <p className="text-[8px] text-amber-400/30 mt-0.5">
                      {impact.riskBefore}→{impact.riskAfter}
                    </p>
                    {isBest && (
                      <span className="text-[8px] text-emerald-400/60 font-mono">best</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="bg-amber-500/5">
            <td className="p-3 text-[9px] font-mono text-amber-400/40 uppercase">Overall Risk</td>
            {scenarios.map((s) => {
              const r = riskLabel(s.overallRiskAfter);
              const d = deltaLabel(s.overallDelta);
              const isBest = getBestScenario(scenarios)?.action === s.action;
              return (
                <td
                  key={s.action}
                  className={`p-3 text-center ${isBest ? 'bg-emerald-500/8' : ''}`}
                >
                  <p className={`text-sm font-mono font-bold ${r.color}`}>{s.overallRiskAfter}</p>
                  <p className={`text-[9px] font-mono ${d.color}`}>{d.label}</p>
                  {isBest && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/8 border-emerald-500/20 font-mono mt-1 inline-block">
                      RECOMMENDED
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Audit Panel ─────────────────────────────────────────────────────────────

function AuditPanel({
  signalId,
  scenarios,
}: {
  signalId: string;
  scenarios: DecisionTwinScenario[];
}) {
  const auditLog = useTwinAuditStore();
  const signalAudit = auditLog.filter((e) => e.signalId === signalId);
  const [selectedScenario, setSelectedScenario] = useState<DecisionTwinScenario | null>(null);
  const [verdict, setVerdict] = useState<TwinVerdict>('accepted');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!selectedScenario) return;
    writeTwinAuditEvent(
      selectedScenario.signalId,
      selectedScenario.id,
      selectedScenario.action,
      verdict,
      selectedScenario.prismImpacts,
      selectedScenario.overallRiskBefore,
      selectedScenario.overallRiskAfter,
      selectedScenario.overallDelta,
      { operator: 'Demo Operator', ...(note ? { modificationNote: note } : {}) },
    );
    setSubmitted(true);
    setNote('');
    setSelectedScenario(null);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="space-y-3">
      <div className="cockpit-panel p-4">
        <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-3">
          Record Decision Twin Outcome
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-[9px] font-mono text-amber-400/30 mb-1.5">SCENARIO</p>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((s) => {
                const colors = ACTION_COLORS[s.action];
                return (
                  <button
                    key={s.action}
                    onClick={() => setSelectedScenario(s)}
                    className={`p-2.5 rounded border text-left transition-all ${
                      selectedScenario?.action === s.action
                        ? `${colors.ring} ${colors.bg}`
                        : 'border-amber-500/10 bg-amber-500/3 hover:border-amber-500/20'
                    }`}
                  >
                    <span className={`text-[9px] font-mono ${colors.badge.split(' ')[0]}`}>
                      {DECISION_TWIN_ACTION_LABELS[s.action]}
                    </span>
                    <p className="text-[10px] text-amber-100/50 mt-0.5">
                      Risk: {s.overallRiskBefore}→{s.overallRiskAfter}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-mono text-amber-400/30 mb-1.5">VERDICT</p>
            <div className="flex gap-2">
              {(['accepted', 'rejected', 'modified'] as TwinVerdict[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVerdict(v)}
                  className={`flex-1 py-1.5 rounded border text-[10px] font-mono transition-all ${
                    verdict === v
                      ? v === 'accepted'
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                        : v === 'rejected'
                          ? 'text-red-400 bg-red-500/10 border-red-500/25'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                      : 'text-amber-400/40 bg-transparent border-amber-500/15 hover:border-amber-500/25'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-mono text-amber-400/30 mb-1.5">NOTE (optional)</p>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Decision rationale or modification detail..."
              className="w-full px-3 py-2 bg-amber-500/5 border border-amber-500/15 rounded text-xs text-amber-100 placeholder-amber-400/30 focus:outline-none focus:border-amber-500/30"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedScenario}
            className="w-full py-2 rounded border text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/15"
          >
            {submitted ? '✓ Audit event written to proof chain' : 'Write to Audit Log'}
          </button>
        </div>
      </div>

      {signalAudit.length > 0 && (
        <div className="cockpit-panel p-4">
          <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-3">
            Audit Trail ({signalAudit.length})
          </p>
          <div className="space-y-2">
            {signalAudit.map((ev) => {
              const verdictColor =
                ev.verdict === 'accepted'
                  ? 'text-emerald-400'
                  : ev.verdict === 'rejected'
                    ? 'text-red-400'
                    : 'text-amber-400';
              return (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 p-2.5 rounded bg-amber-500/3 border border-amber-500/10"
                >
                  <Shield className="w-3 h-3 text-amber-400/30 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-mono ${verdictColor}`}>
                        {ev.verdict.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-mono text-amber-400/40">
                        {DECISION_TWIN_ACTION_LABELS[ev.action]}
                      </span>
                      <span className="text-[8px] font-mono text-amber-400/20">
                        Risk: {ev.overallRiskBefore}→{ev.overallRiskAfter}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-amber-400/25 mt-0.5">
                      {ev.proofRef} · {ev.operator}
                    </p>
                    {ev.modificationNote && (
                      <p className="text-[9px] text-amber-100/40 mt-0.5">{ev.modificationNote}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Briefing Export ──────────────────────────────────────────────────────────

function generateBriefingHTML(
  sig: SignalItem,
  scenarios: DecisionTwinScenario[],
  best: DecisionTwinScenario | null,
): string {
  const dims = [
    'revenue',
    'staffing',
    'infrastructure',
    'security',
    'market_timing',
  ] as PRISMDimension[];
  const now = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Decision Twin Briefing — ${sig.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; background: #fff; color: #1a1a1a; padding: 40px; max-width: 860px; margin: 0 auto; }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
  .meta { font-size: 10px; color: #666; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 2px 8px; border: 1px solid; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 12px 0; }
  .card { border: 1px solid #ddd; border-radius: 6px; padding: 12px; }
  .card-title { font-size: 9px; text-transform: uppercase; color: #888; margin-bottom: 4px; letter-spacing: 0.06em; }
  .card-value { font-size: 20px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
  th { text-align: left; padding: 8px; border-bottom: 2px solid #333; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; }
  td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .dim-label { font-size: 9px; color: #666; text-transform: uppercase; }
  .improve { color: #059669; font-weight: 700; }
  .worsen  { color: #dc2626; font-weight: 700; }
  .neutral { color: #888; }
  .proof { font-size: 9px; color: #aaa; margin-top: 32px; border-top: 1px solid #eee; padding-top: 12px; }
  .evidence-item { font-size: 10px; margin: 3px 0; }
  .best-badge { background: #f0fdf4; border-color: #bbf7d0; color: #059669; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:4px;">
  <div>
    <p style="font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:#888; margin-bottom:2px;">LYTE — DECISION TWIN BRIEFING</p>
    <h1>${sig.title}</h1>
  </div>
  <div style="text-align:right;">
    <span class="badge" style="border-color:#333;">${sig.severity.toUpperCase()}</span>
    ${sig.confidence < 0.85 ? '<span class="badge" style="border-color:#ccc; color:#888; margin-left:4px;">DEMO DATA</span>' : ''}
  </div>
</div>
<p class="meta">Generated: ${now} · Signal: ${sig.proofRef} · Engine: Decision Twin v${DECISION_TWIN_ENGINE_VERSION} · Confidence: ${Math.round(sig.confidence * 100)}%</p>

<h2>Signal Summary</h2>
<p style="font-size:11px; line-height:1.6; margin-bottom:8px;">${sig.body}</p>
<p style="font-size:10px; color:#666;">Source: ${sig.source} · Entity: ${sig.linkedEntityLabel}</p>

<h2>Decision Impact — Scenario Comparison</h2>
<table>
  <thead>
    <tr>
      <th style="width:160px;">PRISM Dimension</th>
      ${scenarios.map((s) => `<th style="text-align:center;">${DECISION_TWIN_ACTION_LABELS[s.action]}${best?.action === s.action ? ' ★' : ''}</th>`).join('')}
    </tr>
  </thead>
  <tbody>
    ${dims
      .map(
        (dim) => `
    <tr>
      <td class="dim-label">${PRISM_DIMENSION_LABELS[dim]}</td>
      ${scenarios
        .map((s) => {
          const impact = s.prismImpacts.find((i) => i.dimension === dim);
          if (!impact) return `<td class="neutral">—</td>`;
          const improving = impact.delta < 0;
          const cls = improving ? 'improve' : impact.delta > 0 ? 'worsen' : 'neutral';
          return `<td class="${cls}" style="text-align:center;">${impact.delta < 0 ? '↓' : impact.delta > 0 ? '↑' : '—'}${Math.abs(impact.delta)}<br/><span style="font-size:9px;color:#999;">${impact.riskBefore}→${impact.riskAfter}</span></td>`;
        })
        .join('')}
    </tr>`,
      )
      .join('')}
    <tr style="background:#f9f9f9; font-weight:700;">
      <td class="dim-label">OVERALL RISK</td>
      ${scenarios
        .map((s) => {
          const improving = s.overallDelta < 0;
          const cls = improving ? 'improve' : s.overallDelta > 0 ? 'worsen' : 'neutral';
          return `<td class="${cls}" style="text-align:center;">${s.overallRiskAfter}/100${best?.action === s.action ? '<br/><span class="badge best-badge">BEST</span>' : ''}</td>`;
        })
        .join('')}
    </tr>
  </tbody>
</table>

${
  best
    ? `
<h2>Recommended Scenario: ${DECISION_TWIN_ACTION_LABELS[best.action]}</h2>
<p style="font-size:11px; line-height:1.6; margin-bottom:8px;">${best.description}</p>
<p style="font-size:10px; color:#666;">Time to impact: ${best.timeToImpact} · Confidence band: ${Math.round(best.overallConfidence.low * 100)}–${Math.round(best.overallConfidence.high * 100)}%</p>

<h2>Evidence for Recommended Scenario</h2>
${best.prismImpacts
  .map(
    (impact) => `
<p class="dim-label" style="margin-top:10px;">${PRISM_DIMENSION_LABELS[impact.dimension]}</p>
<p style="font-size:11px; line-height:1.5; margin:4px 0 6px;">${impact.summary}</p>
${impact.evidence.map((ev) => `<p class="evidence-item">• <strong>${ev.label}:</strong> ${ev.value} <span style="color:#aaa;">(${ev.source})</span></p>`).join('')}
`,
  )
  .join('')}`
    : ''
}

<p class="proof">Proof chain: ${sig.proofRef} · This briefing was generated by Lyte Decision Twin Engine v${DECISION_TWIN_ENGINE_VERSION}. All projections are probabilistic — confidence bands reflect model uncertainty. This is ${scenarios[0]?.isDemo ? 'demo data using scripted scenarios' : 'powered by live signal history'}.</p>
</body>
</html>`;
}

function exportBriefing(
  sig: SignalItem,
  scenarios: DecisionTwinScenario[],
  best: DecisionTwinScenario | null,
) {
  const html = generateBriefingHTML(sig, scenarios, best);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

// ─── Signal Selector ──────────────────────────────────────────────────────────

function SignalSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const SEV_COLORS: Record<string, string> = {
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-amber-400',
    low: 'text-sky-400',
  };

  return (
    <div className="cockpit-panel p-4">
      <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-3">Select Signal</p>
      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {signalItems.map((sig) => (
          <button
            key={sig.id}
            onClick={() => onSelect(sig.id)}
            className={`w-full text-left p-2.5 rounded border transition-all ${
              selectedId === sig.id
                ? 'border-amber-500/30 bg-amber-500/8'
                : 'border-amber-500/10 bg-amber-500/3 hover:border-amber-500/20'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className={`text-[9px] font-mono shrink-0 mt-0.5 ${SEV_COLORS[sig.severity]}`}>
                {sig.severity.toUpperCase().slice(0, 4)}
              </span>
              <p className="text-[10px] text-amber-100/80 leading-snug">{sig.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DecisionTwinPage() {
  const search = useSearch();

  function resolveInitialSignalId(): string {
    const params = new URLSearchParams(search);
    const fromUrl = params.get('signal');
    if (fromUrl && signalItems.some((s) => s.id === fromUrl)) return fromUrl;
    return signalItems[0]?.id;
  }

  const [selectedSignalId, setSelectedSignalId] = useState(resolveInitialSignalId);
  const [activeTab, setActiveTab] = useState<'cards' | 'compare' | 'audit'>('cards');
  const [shareCopied, setShareCopied] = useState(false);

  function handleShare() {
    const lyteBase = (import.meta.env.BASE_URL ?? '/lyte/').replace(/\/$/, '');
    const note =
      window.prompt('Optional note for the briefing recipient (leave blank to skip):', '') ?? '';
    const params = new URLSearchParams();
    if (best) params.set('action', best.action);
    params.set('v', DECISION_TWIN_ENGINE_VERSION);
    params.set('ts', new Date().toISOString());
    if (note.trim()) params.set('note', note.trim());
    if (best) {
      // Compact snapshot of the recommended scenario at share time so the briefing
      // can show the original numbers even if engine logic later changes.
      const snapshot = {
        action: best.action,
        overallRiskBefore: best.overallRiskBefore,
        overallRiskAfter: best.overallRiskAfter,
        overallDelta: best.overallDelta,
        overallConfidence: best.overallConfidence,
        timeToImpact: best.timeToImpact,
        isDemo: best.isDemo,
        prism: best.prismImpacts.map((p) => ({
          d: p.dimension,
          rb: p.riskBefore,
          ra: p.riskAfter,
          dl: p.delta,
          cb: p.confidenceBand,
        })),
      };
      try {
        params.set('s', btoa(unescape(encodeURIComponent(JSON.stringify(snapshot)))));
      } catch {
        /* ignore encoding failure */
      }
    }
    const url = `${window.location.origin}${lyteBase}/briefing/${selectedSignalId}?${params.toString()}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          setShareCopied(true);
          window.setTimeout(() => setShareCopied(false), 2000);
        },
        () => window.prompt('Copy this briefing link:', url),
      );
    } else {
      window.prompt('Copy this briefing link:', url);
    }
  }
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const fromUrl = params.get('signal');
    if (fromUrl && signalItems.some((s) => s.id === fromUrl)) {
      setSelectedSignalId(fromUrl);
    }
  }, [search]);

  const selectedSignal = signalItems.find((s) => s.id === selectedSignalId) ?? signalItems[0]!;
  const profile = useMemo(() => toSignalProfile(selectedSignal), [selectedSignal]);
  const scenarios = useMemo(() => runAllDecisionTwinScenarios(profile), [profile]);
  const best = useMemo(() => getBestScenario(scenarios), [scenarios]);
  const existingAudit = getLatestTwinAuditForSignal(selectedSignalId);

  const SEV_COLORS: Record<string, { text: string; border: string }> = {
    critical: { text: 'text-red-400', border: 'border-red-500/25' },
    high: { text: 'text-orange-400', border: 'border-orange-500/25' },
    medium: { text: 'text-amber-400', border: 'border-amber-500/25' },
    low: { text: 'text-sky-400', border: 'border-sky-500/25' },
  };
  const sevCfg = SEV_COLORS[selectedSignal.severity]!;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h1 className="text-lg font-semibold text-amber-100 font-display">Decision Twin</h1>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border text-amber-400/50 bg-amber-500/5 border-amber-500/15">
              ENGINE v{DECISION_TWIN_ENGINE_VERSION}
            </span>
          </div>
          <p className="text-xs text-amber-400/50">
            Causal what-if simulation — preview downstream impact across PRISM dimensions before
            acting
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-sky-500/8 border border-sky-500/25 text-sky-300 text-xs font-medium hover:bg-sky-500/12 transition-colors"
            title="Copy a shareable read-only briefing URL"
          >
            <Link2 className="w-3.5 h-3.5" />
            {shareCopied ? 'Link copied' : 'Share Briefing'}
          </button>
          <button
            onClick={() => exportBriefing(selectedSignal, scenarios, best!)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500/8 border border-amber-500/20 text-amber-300 text-xs font-medium hover:bg-amber-500/12 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Export Briefing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        <div className="space-y-4">
          <SignalSelector
            selectedId={selectedSignalId}
            onSelect={(id) => {
              setSelectedSignalId(id);
              setActiveTab('cards');
            }}
          />

          <div className={`cockpit-panel border ${sevCfg.border} p-4 space-y-2`}>
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-mono text-amber-400/40 uppercase">Selected Signal</p>
              <span className={`text-[9px] font-mono ${sevCfg.text}`}>
                {selectedSignal.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-100 leading-snug">
              {selectedSignal.title}
            </p>
            <p className="text-[10px] text-amber-100/60 leading-relaxed line-clamp-3">
              {selectedSignal.body}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="proof-badge">
                <Shield className="w-2 h-2" />
                {selectedSignal.proofRef}
              </span>
              {selectedSignal.confidence < 0.85 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-amber-400/40 bg-amber-500/5 border-amber-500/15">
                  DEMO DATA
                </span>
              )}
            </div>
            {existingAudit && (
              <div className="pt-1 border-t border-amber-500/10">
                <p className="text-[9px] font-mono text-amber-400/30">
                  Last action:{' '}
                  <span
                    className={
                      existingAudit.verdict === 'accepted'
                        ? 'text-emerald-400'
                        : existingAudit.verdict === 'rejected'
                          ? 'text-red-400'
                          : 'text-amber-400'
                    }
                  >
                    {existingAudit.verdict.toUpperCase()} —{' '}
                    {DECISION_TWIN_ACTION_LABELS[existingAudit.action]}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="cockpit-panel p-4">
            <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-2">
              Simulation Summary
            </p>
            <div className="space-y-1.5">
              {scenarios.map((s) => {
                const d = deltaLabel(s.overallDelta);
                const colors = ACTION_COLORS[s.action];
                return (
                  <div key={s.action} className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${colors.badge}`}
                    >
                      {DECISION_TWIN_ACTION_LABELS[s.action]}
                    </span>
                    <div className="text-right">
                      <span className={`text-[10px] font-mono font-semibold ${d.color}`}>
                        {d.label}
                      </span>
                      {best?.action === s.action && (
                        <span className="text-[8px] text-emerald-400/60 font-mono ml-1">★</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-1 border-b border-amber-500/10 pb-0">
            {(['cards', 'compare', 'audit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-amber-400/40 hover:text-amber-300'
                }`}
              >
                {tab === 'cards'
                  ? 'Impact Cards'
                  : tab === 'compare'
                    ? 'Scenario Compare'
                    : 'Audit & Actions'}
              </button>
            ))}
          </div>

          {activeTab === 'cards' && (
            <div className="space-y-3" ref={printRef}>
              <div className="grid grid-cols-2 gap-3">
                {scenarios.map((s) => (
                  <PRISMImpactCard key={s.action} scenario={s} />
                ))}
              </div>
              <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
                <p className="text-[9px] font-mono text-amber-400/40 mb-1.5">ENGINE NOTE</p>
                <p className="text-[10px] text-amber-100/50 leading-relaxed">
                  All projections are probabilistic. Confidence bands reflect model uncertainty and
                  historical pattern match quality.
                  {scenarios[0]?.isDemo &&
                    ' This signal uses scripted demo scenarios — live signal history not yet available.'}{' '}
                  Simulation engine v{DECISION_TWIN_ENGINE_VERSION}.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'compare' && (
            <div className="space-y-3">
              <ScenarioCompareTable scenarios={scenarios} />
              {best && (
                <div className="cockpit-panel border border-emerald-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-300">
                      Recommended: {DECISION_TWIN_ACTION_LABELS[best.action]}
                    </p>
                  </div>
                  <p className="text-xs text-amber-100/60 leading-relaxed">{best.description}</p>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="cockpit-panel p-3">
                      <p className="text-[9px] font-mono text-amber-400/40 mb-1">OVERALL RISK</p>
                      <p className="text-lg font-mono font-bold text-emerald-400">
                        {best.overallRiskAfter}/100
                      </p>
                      <p className="text-[9px] text-amber-400/30">from {best.overallRiskBefore}</p>
                    </div>
                    <div className="cockpit-panel p-3">
                      <p className="text-[9px] font-mono text-amber-400/40 mb-1">TIME TO IMPACT</p>
                      <p className="text-lg font-mono font-bold text-amber-300">
                        {best.timeToImpact}
                      </p>
                    </div>
                    <div className="cockpit-panel p-3">
                      <p className="text-[9px] font-mono text-amber-400/40 mb-1">CONFIDENCE BAND</p>
                      <p className="text-sm font-mono font-bold text-amber-300">
                        {Math.round(best.overallConfidence.low * 100)}–
                        {Math.round(best.overallConfidence.high * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <AuditPanel signalId={selectedSignalId} scenarios={scenarios} />
          )}
        </div>
      </div>
    </div>
  );
}
