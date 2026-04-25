import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { ACCENT, apiUrl, DOMAIN_COLORS, fetchJson } from './shared';

type Phase = 'perceive' | 'reason' | 'plan' | 'act' | 'reflect';
const PHASES: Phase[] = ['perceive', 'reason', 'plan', 'act', 'reflect'];

const PHASE_ICONS: Record<Phase, string> = {
  perceive: '👁',
  reason: '🧠',
  plan: '📐',
  act: '⚡',
  reflect: '🔍',
};

const PHASE_COLORS: Record<Phase, string> = {
  perceive: '#0ea5e9',
  reason: '#a855f7',
  plan: '#f59e0b',
  act: '#22c55e',
  reflect: '#8b7ac8',
};

interface PhaseSnapshot {
  phase: Phase;
  model: string;
  tools: string[];
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  summary: string;
  delta?: string;
  regressionFlag?: boolean;
}

interface TraceRun {
  id: string;
  label: string;
  domain: string;
  taskDescription: string;
  startedAt: string;
  totalCostUsd: number;
  totalLatencyMs: number;
  outcome: 'success' | 'partial' | 'failed';
  phases: PhaseSnapshot[];
  priorRunId?: string;
}

interface ApiTrace {
  traceId: string;
  domain?: string;
  agentId?: string;
  status?: string;
  startedAt?: string;
  completedAt?: string;
  objective?: string;
  latencyMs?: number;
  costUsd?: number;
  totalTokens?: number;
  modelsUsed?: string[];
  toolCalls?: { toolName: string; latencyMs?: number }[];
  reflections?: { reflectionId: string; summary?: string }[];
  errors?: unknown[];
}

interface ApiTracesResponse {
  data: ApiTrace[] | { traces: ApiTrace[]; total: number; limit: number; offset: number };
  meta?: { total?: number };
}

interface ApiOperatorComment {
  commentId: string;
  operatorId: string;
  spanId?: string;
  content: string;
  createdAt: string;
  tags?: string[];
}

interface ApiTraceDetailResponse {
  data: {
    trace: ApiTrace & {
      operatorComments?: ApiOperatorComment[];
      spans?: {
        spanId: string;
        name: string;
        latencyMs?: number;
        attributes?: Record<string, unknown>;
      }[];
    };
    entityIds?: string[];
  };
}

const PAGE_SIZE = 50;

const SEEDED_TRACES: TraceRun[] = [
  {
    id: 'trace-aegis-20250416-001',
    label: 'Aegis — Ransomware Lateral Movement v2',
    domain: 'aegis',
    taskDescription:
      'Detect and contain ransomware lateral movement across 14 endpoints detected at 08:14 UTC. Classify threat, escalate to SOC-T2, propose containment.',
    startedAt: '2025-04-16T08:14:22Z',
    totalCostUsd: 0.00341,
    totalLatencyMs: 4820,
    outcome: 'success',
    priorRunId: 'trace-aegis-20250415-009',
    phases: [
      {
        phase: 'perceive',
        model: 'gpt-4o-2024-11-20',
        tools: ['alert_ingest', 'endpoint_telemetry_pull', 'threat_intel_lookup'],
        inputTokens: 1840,
        outputTokens: 312,
        costUsd: 0.00062,
        latencyMs: 820,
        summary:
          'Ingested 14 endpoint alerts, retrieved lateral movement telemetry (SMB traffic anomaly, credential spray across 3 subnets). Matched against 2 active CVEs in threat intel feed.',
        delta: '+3 new alerts vs prior run',
        regressionFlag: false,
      },
      {
        phase: 'reason',
        model: 'gpt-4o-2024-11-20',
        tools: ['threat_classifier', 'blast_radius_estimator'],
        inputTokens: 2210,
        outputTokens: 590,
        costUsd: 0.00091,
        latencyMs: 1100,
        summary:
          'Classified as CRITICAL — ransomware precursor pattern (Conti TTP match 87%). Estimated blast radius: 14 endpoints, 3 shared drives, 1 domain controller. Confidence: high.',
        delta: 'Confidence improved from 79% → 87% vs prior run',
        regressionFlag: false,
      },
      {
        phase: 'plan',
        model: 'gpt-4o-2024-11-20',
        tools: ['playbook_selector', 'containment_planner', 'escalation_router'],
        inputTokens: 1680,
        outputTokens: 430,
        costUsd: 0.00073,
        latencyMs: 890,
        summary:
          'Selected SOC-T2 escalation playbook. Planned network segment isolation for affected subnets. Queued credential reset for 14 accounts. Routed approval request to on-call analyst.',
        delta: 'Segment isolation step added (missing in prior run)',
        regressionFlag: false,
      },
      {
        phase: 'act',
        model: 'gpt-4o-2024-11-20',
        tools: ['network_isolate', 'soc_escalate', 'ticket_create'],
        inputTokens: 820,
        outputTokens: 180,
        costUsd: 0.00048,
        latencyMs: 1240,
        summary:
          'Executed network isolation on 2 subnets (pending analyst approval for 3rd). Created SOC-T2 escalation ticket INC-2025-19841. Notified on-call analyst via PagerDuty.',
        delta: '3rd subnet isolation now requires approval (new policy gate)',
        regressionFlag: true,
      },
      {
        phase: 'reflect',
        model: 'gpt-4o-2024-11-20',
        tools: ['outcome_verifier', 'ground_truth_compare'],
        inputTokens: 960,
        outputTokens: 250,
        costUsd: 0.00067,
        latencyMs: 770,
        summary:
          'Verified isolation applied successfully. Ground truth match: 91% vs operator decision. One discrepancy: operator applied immediate domain controller lockout (not recommended by agent). Flagged for calibration.',
        delta: 'GT match improved from 67% → 91% vs prior run',
        regressionFlag: false,
      },
    ],
  },
  {
    id: 'trace-vessels-20250416-003',
    label: 'Vessels — Cyclone Avoidance Reroute',
    domain: 'vessels',
    taskDescription:
      'MV Pacific Horizon approaching Typhoon Mawar track. Optimize routing via Cape of Good Hope or Malacca with fuel and schedule P&L tradeoffs.',
    startedAt: '2025-04-16T07:48:10Z',
    totalCostUsd: 0.00198,
    totalLatencyMs: 3210,
    outcome: 'partial',
    priorRunId: 'trace-vessels-20250414-007',
    phases: [
      {
        phase: 'perceive',
        model: 'gpt-4o-2024-11-20',
        tools: ['weather_feed_pull', 'vessel_position_api', 'cargo_manifest_fetch'],
        inputTokens: 1220,
        outputTokens: 280,
        costUsd: 0.00042,
        latencyMs: 640,
        summary:
          'Retrieved typhoon track data (NHC+JMA), vessel position (lat 18.4°N, lng 121.2°E), cargo manifest (bulk grain, 48,200 MT), charter party constraints.',
        delta: 'Same data sources as prior run',
        regressionFlag: false,
      },
      {
        phase: 'reason',
        model: 'gpt-4o-2024-11-20',
        tools: ['route_risk_scorer', 'fuel_cost_calculator'],
        inputTokens: 1540,
        outputTokens: 420,
        costUsd: 0.00058,
        latencyMs: 810,
        summary:
          'Typhoon avoidance: Cape route adds 4.2 days, $312K fuel premium. Malacca route: 1.8 days delay, piracy risk LOW (current MMC advisory). Recommended Malacca with 48hr early departure.',
        delta: 'Malacca piracy risk rating changed LOW→MEDIUM vs prior run (new advisory)',
        regressionFlag: true,
      },
      {
        phase: 'plan',
        model: 'gpt-4o-2024-11-20',
        tools: ['voyage_plan_generator', 'port_agent_notify'],
        inputTokens: 980,
        outputTokens: 310,
        costUsd: 0.00044,
        latencyMs: 720,
        summary:
          'Generated revised voyage plan: depart 36hr early, Malacca Strait, ETA Singapore revised to Apr 21. Notified port agent. Queued charterer amendment for captain approval.',
        delta: 'ETA 6hr earlier than prior run plan',
        regressionFlag: false,
      },
      {
        phase: 'act',
        model: 'gpt-4o-2024-11-20',
        tools: ['voyage_plan_commit', 'charterer_notify'],
        inputTokens: 540,
        outputTokens: 140,
        costUsd: 0.00028,
        latencyMs: 480,
        summary:
          'Committed voyage plan update. Captain override: selected Cape route despite agent recommendation (concerns about Malacca congestion). Outcome marked PARTIAL — override logged.',
        delta: 'Operator override rate increased',
        regressionFlag: false,
      },
      {
        phase: 'reflect',
        model: 'gpt-4o-2024-11-20',
        tools: ['outcome_verifier'],
        inputTokens: 460,
        outputTokens: 130,
        costUsd: 0.00026,
        latencyMs: 560,
        summary:
          'Override documented. Cape route selected adds est. $298K vs agent plan. Reason flagged: agent did not weight port congestion risk sufficiently. Calibration note created.',
        delta: 'New calibration note for port congestion weighting',
        regressionFlag: false,
      },
    ],
  },
  {
    id: 'trace-terra-20250415-002',
    label: 'Terra — Portfolio NAV Stress Test',
    domain: 'terra',
    taskDescription:
      '200bps interest rate shock scenario — compute cap rate impact, NAV delta, and reallocation recommendations for 12-asset office/industrial portfolio.',
    startedAt: '2025-04-15T14:20:00Z',
    totalCostUsd: 0.00277,
    totalLatencyMs: 5140,
    outcome: 'success',
    phases: [
      {
        phase: 'perceive',
        model: 'claude-3-5-sonnet-20241022',
        tools: ['portfolio_fetch', 'macro_data_pull', 'appraisal_cache_read'],
        inputTokens: 1640,
        outputTokens: 340,
        costUsd: 0.00058,
        latencyMs: 940,
        summary:
          'Loaded 12 assets (8 office, 4 industrial), current cap rates (avg 5.8%), NOI data, debt structure. Retrieved Fed curve shift scenario data.',
        regressionFlag: false,
      },
      {
        phase: 'reason',
        model: 'claude-3-5-sonnet-20241022',
        tools: ['cap_rate_stress_model', 'nav_calculator', 'dcf_engine'],
        inputTokens: 2280,
        outputTokens: 680,
        costUsd: 0.00092,
        latencyMs: 1420,
        summary:
          '200bps shock → avg cap rate 7.8% (+200bps). Total NAV decline: -$142M (-18.4%). Office assets worst impacted (-23%), industrial resilient (-9%). 3 assets cross LTV covenant threshold.',
        regressionFlag: false,
      },
      {
        phase: 'plan',
        model: 'claude-3-5-sonnet-20241022',
        tools: ['reallocation_optimizer', 'disposition_ranker'],
        inputTokens: 1420,
        outputTokens: 490,
        costUsd: 0.00071,
        latencyMs: 1100,
        summary:
          'Recommended disposition of 2 office assets (CBD Portland, suburban Dallas) to reduce LTV exposure. Industrial reallocation proposal: acquire 2 logistics assets in Sun Belt. IRR-neutral at 6.2% cap.',
        regressionFlag: false,
      },
      {
        phase: 'act',
        model: 'claude-3-5-sonnet-20241022',
        tools: ['report_generator', 'lender_notify_draft'],
        inputTokens: 820,
        outputTokens: 220,
        costUsd: 0.00032,
        latencyMs: 980,
        summary:
          'Generated executive stress test report (PDF, 14 pages). Drafted lender notification for 3 covenant-breach assets. Queued for CFO approval before send.',
        regressionFlag: false,
      },
      {
        phase: 'reflect',
        model: 'claude-3-5-sonnet-20241022',
        tools: ['accuracy_checker'],
        inputTokens: 660,
        outputTokens: 190,
        costUsd: 0.00024,
        latencyMs: 700,
        summary:
          'Report validated against prior appraisal data. NAV calculation cross-checked: within $2M of analyst estimate. Output accepted without modification.',
        regressionFlag: false,
      },
    ],
  },
];

function apiTraceToTraceRun(t: ApiTrace): TraceRun {
  const tools = (t.toolCalls ?? []).map((tc) => tc.toolName);
  const phases: PhaseSnapshot[] = PHASES.map((phase, i) => {
    const phaseTools = tools.filter((_, ti) => ti % PHASES.length === i);
    const reflection = t.reflections?.[i];
    return {
      phase,
      model: t.modelsUsed?.[0] ?? 'gpt-4o-2024-11-20',
      tools: phaseTools.length > 0 ? phaseTools : [`${phase}_tool`],
      inputTokens: Math.floor(((t.totalTokens ?? 500) * 0.65) / PHASES.length),
      outputTokens: Math.floor(((t.totalTokens ?? 500) * 0.35) / PHASES.length),
      costUsd: (t.costUsd ?? 0.001) / PHASES.length,
      latencyMs: Math.floor((t.latencyMs ?? 1000) / PHASES.length),
      summary:
        reflection?.summary ?? `${phase} phase executed for objective: ${t.objective ?? 'unknown'}`,
      regressionFlag: i === 3 && (t.errors?.length ?? 0) > 0,
    };
  });

  const status = t.status;
  return {
    id: t.traceId,
    label: `${(t.domain ?? 'unknown').toUpperCase()} — ${t.objective?.slice(0, 48) ?? t.traceId.slice(0, 24)}`,
    domain: t.domain ?? 'unknown',
    taskDescription: t.objective ?? `Agent trace ${t.traceId}`,
    startedAt: t.startedAt ?? new Date().toISOString(),
    totalCostUsd: t.costUsd ?? 0.001,
    totalLatencyMs: t.latencyMs ?? 1000,
    outcome: status === 'completed' ? 'success' : status === 'failed' ? 'failed' : 'partial',
    phases,
  };
}

const OUTCOME_STYLE: Record<string, { color: string; label: string }> = {
  success: { color: '#22c55e', label: 'SUCCESS' },
  partial: { color: '#f59e0b', label: 'PARTIAL' },
  failed: { color: '#ef4444', label: 'FAILED' },
};

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 10, color: '#475569' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: color ?? '#e2e8f0' }}>{value}</span>
    </div>
  );
}

function PhaseStep({
  snapshot,
  index,
  isActive,
  onClick,
}: {
  snapshot: PhaseSnapshot;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const c = PHASE_COLORS[snapshot.phase];
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${isActive ? `${c}80` : 'rgba(255,255,255,0.07)'}`,
        background: isActive ? `${c}10` : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        width: '100%',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${c}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {PHASE_ICONS[snapshot.phase]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isActive ? c : '#94a3b8',
              textTransform: 'capitalize',
            }}
          >
            {snapshot.phase}
          </span>
          <span style={{ fontSize: 9, color: '#475569' }}>#{index + 1}</span>
          {snapshot.regressionFlag && (
            <span
              style={{
                fontSize: 9,
                color: '#ef4444',
                background: '#ef444420',
                padding: '1px 5px',
                borderRadius: 3,
                fontWeight: 700,
              }}
            >
              REGRESSION
            </span>
          )}
        </div>
        <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
          {snapshot.latencyMs}ms · ${snapshot.costUsd.toFixed(5)}
        </div>
      </div>
    </button>
  );
}

function PhaseDetail({
  snapshot,
  traceId,
  liveComments = [],
}: {
  snapshot: PhaseSnapshot;
  traceId: string;
  liveComments?: ApiOperatorComment[];
}) {
  const [comment, setComment] = useState('');
  const [savedComment, setSavedComment] = useState<string | null>(null);
  const c = PHASE_COLORS[snapshot.phase];
  const qc = useQueryClient();

  const commentMutation = useStandardMutation({
    mutationFn: (text: string) =>
      fetchJson<unknown>(apiUrl(`/traces/${traceId}/comment`), {
        method: 'POST',
        body: JSON.stringify({ spanId: snapshot.phase, content: text, operatorId: 'operator' }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cognitive', 'traces'] });
      qc.invalidateQueries({ queryKey: ['cognitive', 'trace-detail', traceId] });
    },
  });

  function handleSaveComment() {
    if (!comment.trim()) return;
    setSavedComment(comment);
    commentMutation.mutate(comment);
    setComment('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${c}40`,
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ fontSize: 18 }}>{PHASE_ICONS[snapshot.phase]}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: c, textTransform: 'capitalize' }}>
            {snapshot.phase}
          </span>
          {snapshot.regressionFlag && (
            <span
              style={{
                fontSize: 10,
                color: '#ef4444',
                background: '#ef444418',
                border: '1px solid #ef444440',
                padding: '2px 8px',
                borderRadius: 4,
                fontWeight: 700,
                marginLeft: 'auto',
              }}
            >
              ⚠ REGRESSION MARKER
            </span>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>
          {snapshot.summary}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            padding: '12px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 12,
          }}
        >
          <StatPill
            label="Model"
            value={snapshot.model.replace('gpt-4o-', '4o-').replace('claude-3-5-sonnet-', 'cs-')}
          />
          <StatPill label="Latency" value={`${snapshot.latencyMs}ms`} color="#0ea5e9" />
          <StatPill
            label="Tokens"
            value={`${snapshot.inputTokens + snapshot.outputTokens}`}
            color="#a855f7"
          />
          <StatPill label="Cost" value={`$${snapshot.costUsd.toFixed(5)}`} color="#f59e0b" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 10,
              color: '#475569',
              marginBottom: 6,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Tools Called
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {snapshot.tools.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 10,
                  color: '#94a3b8',
                  background: 'rgba(255,255,255,0.06)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#475569' }}>In tokens</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
            >
              <div
                style={{
                  width: `${Math.min(100, snapshot.inputTokens / 30)}%`,
                  height: '100%',
                  background: '#0ea5e9',
                  borderRadius: 2,
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', width: 34 }}>
              {snapshot.inputTokens}
            </span>
          </div>
          <span style={{ fontSize: 10, color: '#475569' }}>Out tokens</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}
            >
              <div
                style={{
                  width: `${Math.min(100, snapshot.outputTokens / 10)}%`,
                  height: '100%',
                  background: '#a855f7',
                  borderRadius: 2,
                }}
              />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', width: 34 }}>
              {snapshot.outputTokens}
            </span>
          </div>
        </div>
      </div>

      {snapshot.delta && (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '10px 14px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#475569',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Snapshot Delta vs Prior Run
          </div>
          <div style={{ fontSize: 12, color: snapshot.regressionFlag ? '#f59e0b' : '#94a3b8' }}>
            {snapshot.delta}
          </div>
        </div>
      )}

      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#475569',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 8,
          }}
        >
          Operator Comments
        </div>
        {liveComments
          .filter((lc) => !lc.spanId || lc.spanId === snapshot.phase)
          .map((lc) => (
            <div key={lc.commentId} style={{ marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#e2e8f0',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '8px 10px',
                }}
              >
                {lc.content}
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 3 }}>
                {lc.operatorId} · {new Date(lc.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        {savedComment ? (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 12,
                color: '#e2e8f0',
                background: `${ACCENT}12`,
                border: `1px solid ${ACCENT}30`,
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 6,
              }}
            >
              {savedComment}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setSavedComment(null)}
                style={{
                  fontSize: 10,
                  color: '#475569',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              {commentMutation.isSuccess && (
                <span style={{ fontSize: 10, color: '#22c55e' }}>✓ Saved to trace</span>
              )}
              {commentMutation.isError && (
                <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠ Saved locally (API error)</span>
              )}
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add observation, flag issue, or note calibration opportunity…"
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '8px 10px',
                color: '#e2e8f0',
                fontSize: 12,
                resize: 'vertical',
                minHeight: 64,
                fontFamily: 'system-ui, sans-serif',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSaveComment}
              disabled={commentMutation.isPending}
              style={{
                marginTop: 6,
                background: commentMutation.isPending ? '#334155' : ACCENT,
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                padding: '5px 14px',
                fontSize: 11,
                fontWeight: 600,
                cursor: commentMutation.isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {commentMutation.isPending ? 'Saving…' : 'Save Comment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CognitiveTraces() {
  const initialTraceId =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('trace') ?? SEEDED_TRACES[0]?.id)
      : SEEDED_TRACES[0]?.id;
  const [selectedTraceId, setSelectedTraceId] = useState<string>(initialTraceId);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [filterDomain, setFilterDomain] = useState('all');
  const [page, setPage] = useState(0);

  const offset = page * PAGE_SIZE;
  const tracesQuery = useStandardQuery<ApiTracesResponse>({
    queryKey: ['cognitive', 'traces', page],
    queryFn: () =>
      fetchJson<ApiTracesResponse>(apiUrl(`/traces?limit=${PAGE_SIZE}&offset=${offset}`)),
    retry: 1,
    staleTime: 30_000,
  });

  const traceDetailQuery = useStandardQuery<ApiTraceDetailResponse>({
    queryKey: ['cognitive', 'trace-detail', selectedTraceId],
    queryFn: () =>
      fetchJson<ApiTraceDetailResponse>(apiUrl(`/traces/${encodeURIComponent(selectedTraceId)}`)),
    retry: 0,
    staleTime: 30_000,
    enabled:
      !!selectedTraceId &&
      !selectedTraceId.startsWith('trace-aegis-2025') &&
      !selectedTraceId.startsWith('trace-vessels-2025') &&
      !selectedTraceId.startsWith('trace-terra-2025'),
  });
  const traceDetail = traceDetailQuery.data?.data?.trace;
  const operatorComments = traceDetail?.operatorComments ?? [];

  // The traces endpoint returns either a bare array (legacy) or
  // { traces, total, limit, offset } (paginated). Normalize both shapes.
  const apiPayload = tracesQuery.data?.data;
  const apiTraces: ApiTrace[] = Array.isArray(apiPayload) ? apiPayload : (apiPayload?.traces ?? []);
  const totalTraces: number = Array.isArray(apiPayload)
    ? apiPayload.length
    : (apiPayload?.total ?? 0);

  const liveTraces: TraceRun[] = apiTraces.map(apiTraceToTraceRun);
  // Only fall back to seeded sample traces when the API hasn't successfully
  // returned anything yet (loading or errored). Once we have a successful
  // paginated response we trust it, including a legitimately empty page —
  // otherwise paging past the last entry would silently switch to demo data.
  const apiResponded = tracesQuery.isSuccess;
  const showSeeded = !apiResponded && liveTraces.length === 0;
  const traces: TraceRun[] = showSeeded ? SEEDED_TRACES : liveTraces;
  const isLiveData = apiResponded;
  const totalPages = Math.max(1, Math.ceil(totalTraces / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = isLiveData && offset + PAGE_SIZE < totalTraces;

  const traceIdsKey = traces.map((t) => t.id).join('|');
  useEffect(() => {
    if (traces.length > 0 && !traces.find((t) => t.id === selectedTraceId)) {
      setSelectedTraceId(traces[0]?.id);
      setActivePhaseIndex(0);
    }
  }, [traceIdsKey, selectedTraceId]);

  const domains = ['all', ...Array.from(new Set(traces.map((t) => t.domain)))];
  const filtered =
    filterDomain === 'all' ? traces : traces.filter((t) => t.domain === filterDomain);

  if (traces.length === 0) {
    return (
      <div
        style={{
          background: '#080c14',
          minHeight: '100vh',
          color: '#e2e8f0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <EcosystemNav
          currentAppId="command"
          currentAppName="Unified Command"
          accentColor={ACCENT}
        />
        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Trace Replay</span>
              <span
                style={{
                  fontSize: 11,
                  color: ACCENT,
                  background: `${ACCENT}18`,
                  padding: '2px 10px',
                  borderRadius: 20,
                  border: `1px solid ${ACCENT}40`,
                  fontWeight: 600,
                }}
              >
                COGNITIVE
              </span>
              {tracesQuery.isLoading && (
                <span style={{ fontSize: 10, color: '#475569' }}>Loading live traces…</span>
              )}
              {!tracesQuery.isLoading && !tracesQuery.isError && (
                <span
                  style={{
                    fontSize: 10,
                    color: '#22c55e',
                    background: '#22c55e15',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}
                >
                  ● LIVE
                </span>
              )}
              {tracesQuery.isError && (
                <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠ API unavailable</span>
              )}
            </div>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
              No traces available yet. Once agents start running, their reasoning traces will appear
              here.
            </p>
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '60px 20px',
              textAlign: 'center',
              color: '#475569',
              fontSize: 13,
            }}
          >
            {tracesQuery.isLoading ? 'Loading…' : 'No traces recorded for this tenant yet.'}
          </div>
        </div>
      </div>
    );
  }

  const baseTrace = traces.find((t) => t.id === selectedTraceId) ?? traces[0]!;
  // Only overlay live detail when it matches the trace currently rendered —
  // pagination/filter swaps can leave selectedTraceId stale until the
  // sync effect runs, so guard against showing telemetry for the wrong run.
  const detailMatches = traceDetail && traceDetail.traceId === baseTrace.id;
  const selectedTrace: TraceRun = detailMatches
    ? {
        ...baseTrace,
        totalCostUsd: traceDetail?.costUsd ?? baseTrace.totalCostUsd,
        totalLatencyMs: traceDetail?.latencyMs ?? baseTrace.totalLatencyMs,
      }
    : baseTrace;
  const liveCommentsForSelected = detailMatches ? operatorComments : [];
  const currentPhase = selectedTrace.phases[activePhaseIndex];
  const outcome = OUTCOME_STYLE[selectedTrace.outcome] ?? OUTCOME_STYLE.partial;
  const regressionCount = selectedTrace.phases.filter((p) => p.regressionFlag).length;

  return (
    <div
      style={{
        background: '#080c14',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Trace Replay</span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}18`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              COGNITIVE
            </span>
            {tracesQuery.isLoading && (
              <span style={{ fontSize: 10, color: '#475569' }}>Loading live traces…</span>
            )}
            {isLiveData && (
              <span
                style={{
                  fontSize: 10,
                  color: '#22c55e',
                  background: '#22c55e15',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                ● LIVE
              </span>
            )}
            {tracesQuery.isError && (
              <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠ Showing sample traces</span>
            )}
          </div>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Step through agent execution phases — perceive, reason, plan, act, reflect — with
            snapshot deltas, model telemetry, and regression markers vs prior runs.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Traces', value: traces.length, color: ACCENT },
            {
              label: 'Phases Logged',
              value: traces.reduce((s, t) => s + t.phases.length, 0),
              color: '#0ea5e9',
            },
            {
              label: 'Regression Flags',
              value: traces.reduce(
                (s, t) => s + t.phases.filter((p) => p.regressionFlag).length,
                0,
              ),
              color: '#ef4444',
            },
            {
              label: 'Avg Cost / Trace',
              value: `$${(traces.reduce((s, t) => s + t.totalCostUsd, 0) / (traces.length || 1)).toFixed(5)}`,
              color: '#f59e0b',
            },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '14px 18px',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Traces</span>
              <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                {domains.map((d) => (
                  <button
                    key={d}
                    onClick={() => setFilterDomain(d)}
                    style={{
                      background: filterDomain === d ? ACCENT : 'rgba(255,255,255,0.05)',
                      color: filterDomain === d ? '#fff' : '#94a3b8',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            {isLiveData && totalTraces > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 6,
                }}
              >
                <button
                  onClick={() => {
                    if (hasPrev) {
                      setPage((p) => Math.max(0, p - 1));
                      setActivePhaseIndex(0);
                    }
                  }}
                  disabled={!hasPrev || tracesQuery.isFetching}
                  style={{
                    background: hasPrev ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    color: hasPrev ? '#e2e8f0' : '#475569',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: hasPrev && !tracesQuery.isFetching ? 'pointer' : 'not-allowed',
                  }}
                  title="Newer page"
                >
                  ← Newer
                </button>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  Page {page + 1} of {totalPages} · {totalTraces.toLocaleString()} total
                </span>
                <button
                  onClick={() => {
                    if (hasNext) {
                      setPage((p) => p + 1);
                      setActivePhaseIndex(0);
                    }
                  }}
                  disabled={!hasNext || tracesQuery.isFetching}
                  style={{
                    background: hasNext ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                    color: hasNext ? '#e2e8f0' : '#475569',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: hasNext && !tracesQuery.isFetching ? 'pointer' : 'not-allowed',
                  }}
                  title="Older page"
                >
                  Older →
                </button>
              </div>
            )}
            {isLiveData && filtered.length === 0 && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px dashed rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '16px 14px',
                  color: '#64748b',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                No traces on this page.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((trace) => {
                const isSelected = selectedTrace.id === trace.id;
                const tc = DOMAIN_COLORS[trace.domain] ?? DOMAIN_COLORS.default;
                const regFlags = trace.phases.filter((p) => p.regressionFlag).length;
                return (
                  <button
                    key={trace.id}
                    onClick={() => {
                      setSelectedTraceId(trace.id);
                      setActivePhaseIndex(0);
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: isSelected ? `${ACCENT}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? `${ACCENT}60` : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isSelected ? '#e2e8f0' : '#94a3b8',
                        marginBottom: 3,
                        lineHeight: 1.4,
                      }}
                    >
                      {trace.label}
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: tc,
                          background: `${tc}15`,
                          padding: '1px 6px',
                          borderRadius: 3,
                          fontWeight: 700,
                        }}
                      >
                        {trace.domain.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: OUTCOME_STYLE[trace.outcome]?.color ?? '#94a3b8',
                          fontWeight: 700,
                        }}
                      >
                        {OUTCOME_STYLE[trace.outcome]?.label ?? 'UNKNOWN'}
                      </span>
                      {regFlags > 0 && (
                        <span style={{ fontSize: 9, color: '#ef4444' }}>
                          ⚠ {regFlags} regression{regFlags > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>
                      {new Date(trace.startedAt).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '14px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
                    {selectedTrace.label}
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    {selectedTrace.taskDescription}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                  <StatPill
                    label="Total Latency"
                    value={`${(selectedTrace.totalLatencyMs / 1000).toFixed(2)}s`}
                    color="#0ea5e9"
                  />
                  <StatPill
                    label="Total Cost"
                    value={`$${selectedTrace.totalCostUsd.toFixed(5)}`}
                    color="#f59e0b"
                  />
                  <StatPill label="Outcome" value={outcome.label} color={outcome.color} />
                  {regressionCount > 0 && (
                    <StatPill label="Regressions" value={regressionCount} color="#ef4444" />
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {selectedTrace.phases.map((phase, i) => {
                  const c = PHASE_COLORS[phase.phase];
                  const isLast = i === selectedTrace.phases.length - 1;
                  return (
                    <React.Fragment key={i}>
                      <button
                        onClick={() => setActivePhaseIndex(i)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: `1px solid ${activePhaseIndex === i ? `${c}80` : 'rgba(255,255,255,0.08)'}`,
                          background: activePhaseIndex === i ? `${c}15` : 'rgba(255,255,255,0.03)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: 12 }}>{PHASE_ICONS[phase.phase]}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: activePhaseIndex === i ? c : '#64748b',
                            textTransform: 'capitalize',
                          }}
                        >
                          {phase.phase}
                        </span>
                        {phase.regressionFlag && (
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#ef4444',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                      {!isLast && <span style={{ color: '#334155', fontSize: 12 }}>→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedTrace.phases.map((phase, i) => (
                  <PhaseStep
                    key={i}
                    snapshot={phase}
                    index={i}
                    isActive={activePhaseIndex === i}
                    onClick={() => setActivePhaseIndex(i)}
                  />
                ))}
              </div>
              {currentPhase && (
                <PhaseDetail
                  snapshot={currentPhase}
                  traceId={selectedTrace.id}
                  liveComments={liveCommentsForSelected}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
