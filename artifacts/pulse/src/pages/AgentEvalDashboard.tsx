import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Clock, Loader2, Minus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

type PromotionDecision = 'approve' | 'block' | 'pending_review';
type TrendDirection = 'improving' | 'stable' | 'degrading' | 'insufficient_data';

interface DimensionScores {
  semantic_accuracy: number;
  recommendation_quality: number;
  evidence_completeness: number;
  confidence_calibration: number;
  format_compliance: number;
  safety_flag: number;
}

interface RunRow {
  eval_id: string;
  model_version: string;
  completed_at: string;
  aggregate_score: number;
  pass_rate: number;
  safety_flag_score: number;
  regression_cases: number;
  recovered_cases: number;
  promotion_decision: PromotionDecision;
  promotion_approved: boolean;
  blocked_reasons: string[];
  pending_reasons: string[];
  dimension_scores: DimensionScores;
  run_type: string;
}

interface AgentTrendDTO {
  agent_id: string;
  label: string;
  trend: TrendDirection;
  latest_aggregate_score: number | null;
  average_aggregate_score: number | null;
  latest_model_version: string | null;
  latest_decision: PromotionDecision | null;
  promotion_report: string | null;
  runs: RunRow[];
}

interface LedgerSummary {
  total_eval_runs: number;
  promoted: number;
  blocked: number;
  avg_aggregate_score: number;
  avg_pass_rate: number;
  safety_violation_runs: number;
  by_agent: Record<string, { total: number; promoted: number; latest_score: number }>;
}

interface EvalTrendsResponse {
  thresholds: { aggregate_score: number; safety_flag: number };
  ledger_summary: LedgerSummary;
  agents: AgentTrendDTO[];
  generated_at: string;
}

const AGENT_COLORS: Record<string, string> = {
  'sentinel-maritime': '#5090e8',
  'helmsman-voyage': '#4eca8b',
  'guardian-security': '#e05050',
  'prism-ai': '#c8a84b',
};

const DIMENSION_LABELS: Record<string, string> = {
  semantic_accuracy: 'Semantic Accuracy',
  recommendation_quality: 'Rec. Quality',
  evidence_completeness: 'Evidence',
  confidence_calibration: 'Calibration',
  format_compliance: 'Format',
  safety_flag: 'Safety Flag',
};

const DIMENSION_WEIGHTS: Record<string, string> = {
  semantic_accuracy: '35%',
  recommendation_quality: '25%',
  evidence_completeness: '15%',
  confidence_calibration: '10%',
  format_compliance: '10%',
  safety_flag: '5%',
};

function DecisionBadge({ decision }: { decision: PromotionDecision }) {
  const configs = {
    approve: { label: 'APPROVED', bg: 'rgba(78,202,139,0.1)', border: 'rgba(78,202,139,0.3)', color: '#4eca8b' },
    pending_review: { label: 'PENDING', bg: 'rgba(200,168,75,0.1)', border: 'rgba(200,168,75,0.3)', color: '#c8a84b' },
    block: { label: 'BLOCKED', bg: 'rgba(224,80,80,0.1)', border: 'rgba(224,80,80,0.3)', color: '#e05050' },
  };
  const cfg = configs[decision];
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: 4,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {cfg.label}
    </span>
  );
}

function TrendBadge({ trend }: { trend: TrendDirection }) {
  if (trend === 'improving') return (
    <span style={{ color: '#4eca8b', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600 }}>
      <TrendingUp size={12} /> Improving
    </span>
  );
  if (trend === 'degrading') return (
    <span style={{ color: '#e05050', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600 }}>
      <TrendingDown size={12} /> Degrading
    </span>
  );
  if (trend === 'insufficient_data') return (
    <span style={{ color: '#8a96b0', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600 }}>
      <Minus size={12} /> Insufficient Data
    </span>
  );
  return (
    <span style={{ color: '#8a96b0', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600 }}>
      <Minus size={12} /> Stable
    </span>
  );
}

function ScoreBar({ value, max = 1, color }: { value: number; max?: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: 'var(--pulse-border)', borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${Math.round((value / max) * 100)}%`,
          background: color,
          borderRadius: 3,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

function AgentTrendCard({
  agent,
  onClick,
  selected,
}: {
  agent: AgentTrendDTO;
  onClick: () => void;
  selected: boolean;
}) {
  const color = AGENT_COLORS[agent.agent_id] ?? '#8a96b0';
  const latestRun = agent.runs[agent.runs.length - 1];
  const aggScore = latestRun?.aggregate_score ?? agent.latest_aggregate_score ?? 0;
  const passRate = latestRun?.pass_rate ?? 0;
  const safetyFlag = latestRun?.safety_flag_score ?? 1;
  const decision = latestRun?.promotion_decision ?? agent.latest_decision ?? 'pending_review';
  const scoreColor = aggScore >= 0.9 ? '#4eca8b' : aggScore >= 0.85 ? '#c8a84b' : '#e05050';

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: 8,
        background: selected ? 'rgba(200,168,75,0.04)' : 'var(--pulse-card)',
        border: `1px solid ${selected ? 'rgba(200,168,75,0.3)' : 'var(--pulse-border)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--pulse-text)' }}>{agent.label}</span>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--pulse-text-muted)', fontFamily: 'JetBrains Mono, monospace', paddingLeft: 16 }}>
            {agent.latest_model_version ?? '—'}
          </div>
        </div>
        <DecisionBadge decision={decision} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: '2.2rem', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
          {Math.round(aggScore * 100)}
          <span style={{ fontSize: '1rem', color: 'var(--pulse-text-muted)', fontWeight: 400 }}>%</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--pulse-text-muted)', marginTop: 2 }}>Aggregate Score</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--pulse-text-muted)', width: 64, flexShrink: 0 }}>Pass Rate</span>
          <ScoreBar value={passRate} color={color} />
          <span style={{ fontSize: '0.68rem', color: 'var(--pulse-text-dim)', width: 32, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(passRate * 100)}%
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--pulse-text-muted)', width: 64, flexShrink: 0 }}>Safety Flag</span>
          <ScoreBar value={safetyFlag} color={safetyFlag === 1.0 ? '#4eca8b' : '#e05050'} />
          <span style={{ fontSize: '0.68rem', color: 'var(--pulse-text-dim)', width: 32, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>
            {Math.round(safetyFlag * 100)}%
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <TrendBadge trend={agent.trend} />
        <span style={{ fontSize: '0.65rem', color: 'var(--pulse-text-muted)' }}>{agent.runs.length} runs</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0d1220', border: '1px solid #1a2035', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: '0.7rem', color: '#8a96b0', marginBottom: 6 }}>{String(label ?? '')}</div>
      {payload.map((p) => {
        const key = String(p.dataKey ?? p.name ?? '');
        const num = typeof p.value === 'number' ? p.value : Number(p.value ?? 0);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: String(p.color ?? '#fff') }} />
            <span style={{ fontSize: '0.73rem', color: '#e8edf8' }}>
              {key}: <strong>{Math.round(num * 100)}%</strong>
            </span>
          </div>
        );
      })}
    </div>
  );
};

function buildTrendChartData(agents: AgentTrendDTO[]) {
  const maxRuns = Math.max(0, ...agents.map((a) => a.runs.length));
  if (maxRuns === 0) return [];
  return Array.from({ length: maxRuns }, (_, i) => {
    const point: Record<string, unknown> = { run: `Run ${i + 1}` };
    for (const agent of agents) {
      const run = agent.runs[i];
      if (run) {
        point[agent.label] = run.aggregate_score;
        point[`${agent.label}__version`] = run.model_version;
      }
    }
    return point;
  });
}

function buildRegressionRows(agents: AgentTrendDTO[]) {
  const rows: Array<{
    label: string;
    agentLabel: string;
    model_version: string;
    completed_at: string;
    regression_cases: number;
    recovered_cases: number;
    decision: PromotionDecision;
  }> = [];
  for (const agent of agents) {
    for (const run of agent.runs) {
      if (run.regression_cases > 0 || run.recovered_cases > 0) {
        rows.push({
          label: new Date(run.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          agentLabel: agent.label,
          model_version: run.model_version,
          completed_at: run.completed_at,
          regression_cases: run.regression_cases,
          recovered_cases: run.recovered_cases,
          decision: run.promotion_decision,
        });
      }
    }
  }
  return rows.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
}

function StatusFrame({
  title,
  message,
  variant,
  onRetry,
}: {
  title: string;
  message: string;
  variant: 'loading' | 'error' | 'empty';
  onRetry?: () => void;
}) {
  const accent = variant === 'error' ? '#e05050' : variant === 'empty' ? '#8a96b0' : '#c8a84b';
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        border: '1px dashed var(--pulse-border)',
        borderRadius: 8,
        background: 'var(--pulse-card)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: accent }}>
        {variant === 'loading' ? (
          <Loader2 size={28} style={{ animation: 'spin 1.4s linear infinite' }} />
        ) : variant === 'error' ? (
          <AlertTriangle size={28} />
        ) : (
          <Minus size={28} />
        )}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--pulse-text-muted)', maxWidth: 480, margin: '0 auto 16px' }}>
        {message}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '6px 14px',
            borderRadius: 4,
            background: 'rgba(200,168,75,0.12)',
            border: '1px solid rgba(200,168,75,0.3)',
            color: '#c8a84b',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.04em',
          }}
        >
          <RefreshCw size={12} /> Retry
        </button>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function fetchEvalTrends(): Promise<EvalTrendsResponse> {
  return fetch('/api/pulse/eval-trends', { credentials: 'include' }).then(async (res) => {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    }
    return res.json() as Promise<EvalTrendsResponse>;
  });
}

export default function AgentEvalDashboard() {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<EvalTrendsResponse, Error>({
    queryKey: ['pulse', 'eval-trends'],
    queryFn: fetchEvalTrends,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 5 }}>
          AI Accuracy Scores
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)', marginBottom: 24 }}>
          Live eval trends, promotion gate status, and regression analysis across all deployed agent models
        </p>
        <StatusFrame
          variant="loading"
          title="Loading eval ledger…"
          message="Aggregating live agent eval runs from the platform pulse-evals service."
        />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 5 }}>
          AI Accuracy Scores
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)', marginBottom: 24 }}>
          Live eval trends, promotion gate status, and regression analysis across all deployed agent models
        </p>
        <StatusFrame
          variant="error"
          title="Couldn't load eval data"
          message={error?.message ?? 'An unknown error occurred while contacting the eval API.'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const { agents, ledger_summary, thresholds, generated_at } = data;
  const aggregateThreshold = thresholds.aggregate_score;

  if (agents.length === 0 || agents.every((a) => a.runs.length === 0)) {
    return (
      <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 5 }}>
          AI Accuracy Scores
        </h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)', marginBottom: 24 }}>
          Live eval trends, promotion gate status, and regression analysis across all deployed agent models
        </p>
        <StatusFrame
          variant="empty"
          title="No eval runs recorded yet"
          message="Once agent eval runs are executed against registered datasets they will appear here in real time."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const selected = agents.find((a) => a.agent_id === selectedAgentId) ?? agents[0]!;
  const trendChartData = buildTrendChartData(agents);
  const regressionRows = buildRegressionRows(agents);
  const dimensionRows = (() => {
    const latest = selected.runs[selected.runs.length - 1];
    if (!latest) return [];
    return Object.entries(latest.dimension_scores).map(([key, value]) => ({
      dimension: DIMENSION_LABELS[key] ?? key,
      weight: DIMENSION_WEIGHTS[key] ?? '',
      score: value,
      scoreLabel: `${Math.round(value * 100)}%`,
    }));
  })();

  const safetyViolations = ledger_summary.safety_violation_runs;
  const pendingRuns = Math.max(
    0,
    ledger_summary.total_eval_runs - ledger_summary.promoted - safetyViolations,
  );

  return (
    <div style={{ padding: '28px 28px 48px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 5 }}>
              AI Accuracy Scores
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--pulse-text-muted)' }}>
              Live eval trends, promotion gate status, and regression analysis across all deployed agent models
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                background: 'transparent',
                border: '1px solid var(--pulse-border)',
                color: 'var(--pulse-text-muted)',
                fontSize: '0.65rem',
                fontWeight: 600,
                cursor: isFetching ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              <RefreshCw size={11} style={isFetching ? { animation: 'spin 1.4s linear infinite' } : {}} />
              {isFetching ? 'Refreshing' : 'Refresh'}
            </button>
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                background: 'rgba(78,202,139,0.08)',
                border: '1px solid rgba(78,202,139,0.2)',
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#4eca8b',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4eca8b', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE · {new Date(generated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total Eval Runs', value: ledger_summary.total_eval_runs, color: 'var(--pulse-text)' },
          {
            label: 'Platform Avg Score',
            value: `${Math.round(ledger_summary.avg_aggregate_score * 100)}%`,
            color:
              ledger_summary.avg_aggregate_score >= 0.9
                ? '#4eca8b'
                : ledger_summary.avg_aggregate_score >= aggregateThreshold
                  ? '#c8a84b'
                  : '#e05050',
          },
          { label: 'Approved', value: ledger_summary.promoted, color: '#4eca8b' },
          { label: 'Awaiting / Blocked', value: `${pendingRuns} / ${ledger_summary.blocked - pendingRuns}`, color: ledger_summary.blocked - pendingRuns === 0 ? '#c8a84b' : '#e05050' },
          { label: 'Safety Violations', value: safetyViolations, color: safetyViolations === 0 ? '#4eca8b' : '#e05050' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '14px 16px',
              borderRadius: 7,
              background: 'var(--pulse-card)',
              border: '1px solid var(--pulse-border)',
            }}
          >
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: stat.color, lineHeight: 1.1, marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--pulse-text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Agent trend cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, Math.min(4, agents.length))}, 1fr)`, gap: 12, marginBottom: 24 }}>
        {agents.map((agent) => (
          <AgentTrendCard
            key={agent.agent_id}
            agent={agent}
            selected={selectedAgentId === agent.agent_id || (!selectedAgentId && agent.agent_id === agents[0]?.agent_id)}
            onClick={() => setSelectedAgentId(agent.agent_id === selectedAgentId ? null : agent.agent_id)}
          />
        ))}
      </div>

      {/* Trend line chart with real threshold reference line */}
      <div className="section-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 3 }}>
            Aggregate Score Trend — All Agents
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--pulse-text-muted)' }}>
            Eval run history across recent runs per agent · Promotion threshold {Math.round(aggregateThreshold * 100)}%
          </p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
            <XAxis dataKey="run" stroke="#546078" tick={{ fontSize: 11, fill: '#546078' }} />
            <YAxis
              stroke="#546078"
              tick={{ fontSize: 11, fill: '#546078' }}
              domain={[0.5, 1.0]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ fontSize: '0.72rem', color: '#8a96b0' }}>{v}</span>} />
            <ReferenceLine
              y={aggregateThreshold}
              stroke="#e05050"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Promotion gate ${Math.round(aggregateThreshold * 100)}%`,
                position: 'insideTopRight',
                fill: '#e05050',
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
              }}
              ifOverflow="extendDomain"
            />
            {agents.map((agent) => (
              <Line
                key={agent.agent_id}
                type="monotone"
                dataKey={agent.label}
                stroke={AGENT_COLORS[agent.agent_id] ?? '#8a96b0'}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Dimension breakdown */}
        <div className="section-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 3 }}>
              Dimension Breakdown — {selected.label}
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
              Latest eval run · {selected.latest_model_version ?? '—'}
            </p>
          </div>
          {dimensionRows.length === 0 ? (
            <div style={{ fontSize: '0.78rem', color: 'var(--pulse-text-muted)', padding: '12px 0' }}>
              No eval runs recorded for this agent.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dimensionRows.map((dim) => {
                const color = dim.score >= 0.9 ? '#4eca8b' : dim.score >= aggregateThreshold ? '#c8a84b' : '#e05050';
                return (
                  <div key={dim.dimension} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 140, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--pulse-text)' }}>{dim.dimension}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--pulse-text-muted)', marginLeft: 5 }}>{dim.weight}</span>
                    </div>
                    <ScoreBar value={dim.score} color={color} />
                    <span style={{ fontSize: '0.7rem', color, fontFamily: 'JetBrains Mono, monospace', width: 36, textAlign: 'right', fontWeight: 600 }}>
                      {dim.scoreLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Promotion gate status */}
        <div className="section-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 3 }}>
              Promotion Gate Status
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
              Latest model version gate result per agent
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agents.map((agent) => {
              const color = AGENT_COLORS[agent.agent_id] ?? '#8a96b0';
              const decision = agent.latest_decision ?? 'pending_review';
              const icon =
                decision === 'approve'
                  ? <CheckCircle size={13} color="#4eca8b" />
                  : decision === 'pending_review'
                    ? <Clock size={13} color="#c8a84b" />
                    : <AlertTriangle size={13} color="#e05050" />;
              return (
                <div
                  key={agent.agent_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 6,
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--pulse-border)',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--pulse-text)', marginBottom: 1 }}>
                      {agent.label}
                    </div>
                    <div style={{ fontSize: '0.63rem', color: 'var(--pulse-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {agent.latest_model_version ?? '—'} · {Math.round((agent.latest_aggregate_score ?? 0) * 100)}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {icon}
                    <DecisionBadge decision={decision} />
                  </div>
                </div>
              );
            })}
          </div>
          {selected.promotion_report && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--pulse-text-muted)', marginBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Latest gate report — {selected.label}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '10px 12px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--pulse-border)',
                  borderRadius: 6,
                  fontSize: '0.68rem',
                  color: 'var(--pulse-text-dim)',
                  fontFamily: 'JetBrains Mono, monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 160,
                  overflow: 'auto',
                }}
              >
                {selected.promotion_report}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Regression timeline */}
      <div className="section-card" style={{ padding: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 3 }}>
            Regression Timeline
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
            New failures and recovered cases across all model versions and agents
          </p>
        </div>
        {regressionRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--pulse-text-muted)', fontSize: '0.8rem' }}>
            No regressions or recoveries detected across recent eval runs
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pulse-border)' }}>
                  {['Date', 'Agent', 'Model Version', 'Gate', 'New Failures', 'Recovered'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        color: 'var(--pulse-text-muted)',
                        fontWeight: 600,
                        fontSize: '0.68rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regressionRows.map((row, idx) => (
                  <tr
                    key={`${row.model_version}-${row.agentLabel}-${idx}`}
                    style={{
                      borderBottom: '1px solid var(--pulse-border)',
                      background: idx % 2 === 0 ? 'rgba(0,0,0,0.1)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '8px 10px', color: 'var(--pulse-text-muted)' }}>{row.label}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--pulse-text)', fontWeight: 500 }}>{row.agentLabel}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--pulse-text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem' }}>
                      {row.model_version}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <DecisionBadge decision={row.decision} />
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {row.regression_cases > 0 ? (
                        <span style={{ color: '#e05050', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                          ↓ {row.regression_cases}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--pulse-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {row.recovered_cases > 0 ? (
                        <span style={{ color: '#4eca8b', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                          ↑ {row.recovered_cases}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--pulse-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dimension comparison bar chart */}
      <div className="section-card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--pulse-text)', marginBottom: 3 }}>
            Dimension Scores Across Agents
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--pulse-text-muted)' }}>
            Latest eval run dimension breakdown compared across all agents
          </p>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={Object.keys(DIMENSION_LABELS).map((dim) => {
              const point: Record<string, unknown> = { dimension: DIMENSION_LABELS[dim] };
              for (const agent of agents) {
                const latestRun = agent.runs[agent.runs.length - 1];
                if (latestRun) {
                  point[agent.label] = latestRun.dimension_scores[dim as keyof DimensionScores];
                }
              }
              return point;
            })}
            margin={{ top: 0, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
            <XAxis dataKey="dimension" stroke="#546078" tick={{ fontSize: 10, fill: '#546078' }} />
            <YAxis
              stroke="#546078"
              tick={{ fontSize: 10, fill: '#546078' }}
              domain={[0, 1.0]}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={(v) => <span style={{ fontSize: '0.7rem', color: '#8a96b0' }}>{v}</span>} />
            <ReferenceLine
              y={aggregateThreshold}
              stroke="#e05050"
              strokeDasharray="4 3"
              strokeWidth={1}
              ifOverflow="extendDomain"
            />
            {agents.map((agent) => (
              <Bar
                key={agent.agent_id}
                dataKey={agent.label}
                fill={AGENT_COLORS[agent.agent_id] ?? '#8a96b0'}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
