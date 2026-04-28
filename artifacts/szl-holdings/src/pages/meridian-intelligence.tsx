/**
 * Continuum Meridian Intelligence — Cognitive Observability OS
 *
 * Surfaces: Decision Weather, Forecast Tournament, Signal Debt,
 * Business Flight Recorder, MCP activation status, Agent Constellation
 * health, and Governance Audit views.
 */

import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  Cpu,
  Database,
  FileText,
  Globe,
  Lock,
  Server,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') + '/api';

const DS = {
  bg: '#070b12',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHover: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.07)',
  text: {
    primary: 'rgba(255,255,255,0.90)',
    secondary: 'rgba(255,255,255,0.55)',
    muted: 'rgba(255,255,255,0.28)',
  },
  accent: {
    blue: '#38bdf8',
    green: '#4ade80',
    amber: '#f59e0b',
    red: '#ef4444',
    purple: '#a78bfa',
    teal: '#2dd4bf',
  },
};

type Tab =
  | 'weather'
  | 'forecast'
  | 'signals'
  | 'recorder'
  | 'agents'
  | 'mcp'
  | 'governance';

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof Activity;
}

const NAV: NavItem[] = [
  { id: 'weather', label: 'Decision Weather', icon: Cloud },
  { id: 'forecast', label: 'Forecast Tournament', icon: BarChart3 },
  { id: 'signals', label: 'Signal Debt', icon: Activity },
  { id: 'recorder', label: 'Flight Recorder', icon: FileText },
  { id: 'agents', label: 'Agent Constellation', icon: Brain },
  { id: 'mcp', label: 'MCP Registry', icon: Globe },
  { id: 'governance', label: 'Governance', icon: Shield },
];

function useApi<T>(path: string): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}${path}`)
      .then((r) => r.json())
      .then((json) => {
        setData(json.data ?? json);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [path]);

  return { data, loading, error };
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'active' || status === 'healthy' || status === 'completed'
      ? DS.accent.green
      : status === 'inactive' || status === 'degraded'
        ? DS.accent.amber
        : status === 'pending_approval' || status === 'pending_auth'
          ? DS.accent.blue
          : DS.accent.red;
  return (
    <span
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colorMap: Record<string, string> = {
    critical: DS.accent.red,
    high: DS.accent.amber,
    medium: '#f97316',
    low: DS.accent.green,
    storm: DS.accent.red,
    warning: DS.accent.amber,
    caution: '#f97316',
    clear: DS.accent.green,
  };
  const color = colorMap[risk] ?? DS.text.secondary;
  return (
    <span
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}35`,
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {risk}
    </span>
  );
}

function ProbBar({ value, color }: { value: number; color?: string }) {
  const c = color ?? DS.accent.blue;
  return (
    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.round(value * 100)}%`,
          height: '100%',
          background: c,
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

function LoadingCard() {
  return (
    <div
      style={{
        background: DS.surface,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: DS.text.muted,
        fontSize: 13,
        gap: 8,
      }}
    >
      <Activity size={16} style={{ animation: 'spin 1s linear infinite' }} />
      Loading...
    </div>
  );
}

function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: DS.surface,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  sub,
  badge,
}: {
  icon: typeof Activity;
  title: string;
  sub?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={18} color={DS.accent.blue} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: DS.text.primary, margin: 0 }}>{title}</h2>
        {badge}
      </div>
      {sub && (
        <p style={{ fontSize: 12, color: DS.text.secondary, marginTop: 4, marginLeft: 28 }}>{sub}</p>
      )}
    </div>
  );
}

function DecisionWeatherTab() {
  const { data, loading } = useApi<{
    overallRisk: string;
    events: Array<{
      type: string;
      label: string;
      icon: string;
      currentProbability: number;
      severity: string;
      advisory: string;
      windows: Array<{ days: number; probability: number; trend: string }>;
    }>;
    generatedAt: string;
  }>('/meridian/decision-weather');

  if (loading) return <LoadingCard />;

  const overallColor =
    data?.overallRisk === 'storm'
      ? DS.accent.red
      : data?.overallRisk === 'warning'
        ? DS.accent.amber
        : data?.overallRisk === 'caution'
          ? '#f97316'
          : DS.accent.green;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: `linear-gradient(135deg, ${overallColor}0a 0%, transparent 100%)`,
          borderColor: `${overallColor}30`,
        }}
      >
        <Cloud size={28} color={overallColor} />
        <div>
          <div style={{ fontSize: 12, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Overall Business Risk
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: overallColor, textTransform: 'uppercase', marginTop: 2 }}>
            {data?.overallRisk ?? 'UNKNOWN'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 11, color: DS.text.muted }}>
          Updated {data?.generatedAt ? new Date(data.generatedAt).toLocaleTimeString() : '—'}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {data?.events.map((event) => {
          const sevColor =
            event.severity === 'critical'
              ? DS.accent.red
              : event.severity === 'high'
                ? DS.accent.amber
                : event.severity === 'medium'
                  ? '#f97316'
                  : DS.accent.green;
          return (
            <Card key={event.type}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>{event.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DS.text.primary }}>{event.label}</div>
                  <div style={{ fontSize: 11, color: DS.text.muted }}>Current: {Math.round(event.currentProbability * 100)}% probability</div>
                </div>
                <RiskBadge risk={event.severity} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <ProbBar value={event.currentProbability} color={sevColor} />
                <span style={{ fontSize: 12, fontWeight: 700, color: sevColor, minWidth: 36 }}>
                  {Math.round(event.currentProbability * 100)}%
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                {event.windows.map((w) => (
                  <div
                    key={w.days}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 11, color: DS.text.muted }}>{w.days}d</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: sevColor, marginTop: 2 }}>
                      {Math.round(w.probability * 100)}%
                    </div>
                    <div style={{ fontSize: 10, color: w.trend === 'rising' ? DS.accent.red : w.trend === 'falling' ? DS.accent.green : DS.text.muted, marginTop: 2 }}>
                      {w.trend === 'rising' ? '↑' : w.trend === 'falling' ? '↓' : '→'} {w.trend}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: DS.text.secondary, lineHeight: 1.5 }}>
                {event.advisory}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ForecastTournamentTab() {
  const { data, loading } = useApi<{
    sessions: Array<{
      id: string;
      metric: string;
      winner: string;
      rankings: Array<{ model: string; rank: number; averageQuality: number; wins: number }>;
      sessionAt: string;
      mode: string;
    }>;
    globalRankings: Array<{ model: string; rank: number; averageQuality: number; dominantDomain: string; wins: number }>;
  }>('/meridian/forecast');

  if (loading) return <LoadingCard />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionHeader
          icon={BarChart3}
          title="Global Tournament Rankings"
          sub="Calibrated backtest quality across all business metrics"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data?.globalRankings.map((r) => (
            <div
              key={r.model}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                background: r.rank === 1 ? 'rgba(56,189,248,0.07)' : 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                border: `1px solid ${r.rank === 1 ? 'rgba(56,189,248,0.2)' : DS.border}`,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: r.rank === 1 ? DS.accent.blue : 'rgba(255,255,255,0.07)',
                  color: r.rank === 1 ? '#fff' : DS.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                #{r.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: DS.text.primary }}>{r.model}</div>
                <div style={{ fontSize: 11, color: DS.text.muted }}>
                  Best at: {r.dominantDomain.replace(/_/g, ' ')} · {r.wins} wins
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ProbBar value={r.averageQuality} color={r.rank === 1 ? DS.accent.blue : DS.accent.green} />
                <span style={{ fontSize: 14, fontWeight: 700, color: r.rank === 1 ? DS.accent.blue : DS.text.primary, minWidth: 44, textAlign: 'right' }}>
                  {Math.round(r.averageQuality * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {data?.sessions.map((s) => (
          <Card key={s.id}>
            <div style={{ fontSize: 12, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              {s.metric.replace(/_/g, ' ')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircle2 size={14} color={DS.accent.green} />
              <span style={{ fontSize: 13, fontWeight: 600, color: DS.accent.green }}>Winner: {s.winner}</span>
              {s.mode === 'simulation' && (
                <span style={{ fontSize: 10, color: DS.text.muted, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>SIM</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {s.rankings.slice(0, 3).map((r) => (
                <div key={r.model} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: DS.text.muted, minWidth: 16 }}>#{r.rank}</span>
                  <span style={{ fontSize: 12, color: DS.text.secondary, flex: 1 }}>{r.model}</span>
                  <ProbBar value={r.averageQuality} />
                  <span style={{ fontSize: 11, color: DS.text.primary, minWidth: 36, textAlign: 'right' }}>
                    {Math.round(r.averageQuality * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SignalDebtTab() {
  const { data: graph, loading: gLoading } = useApi<{ nodes: Array<{ id: string; label: string; domain: string; source: string; quality: string; confidence: number; freshness: number }> ; healthScore: number; totalSignals: number }>('/meridian/signal-graph');
  const { data: debt, loading: dLoading } = useApi<{
    totalDebt: number;
    criticalItems: number;
    items: Array<{
      signalId: string;
      label: string;
      source: string;
      domain: string;
      debtType: string;
      debtScore: number;
      impact: string;
      staleDays?: number;
      recommendation: string;
    }>;
    topDomain: string;
  }>('/meridian/signal-debt');

  if (gLoading || dLoading) return <LoadingCard />;

  const healthColor = (graph?.healthScore ?? 0) > 0.75 ? DS.accent.green : (graph?.healthScore ?? 0) > 0.5 ? DS.accent.amber : DS.accent.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Graph Health Score', value: `${Math.round((graph?.healthScore ?? 0) * 100)}%`, color: healthColor, icon: Activity },
          { label: 'Total Signals', value: graph?.totalSignals ?? 0, color: DS.accent.blue, icon: Database },
          { label: 'Total Signal Debt', value: debt?.totalDebt ?? 0, color: DS.accent.amber, icon: AlertTriangle },
          { label: 'Critical Debt Items', value: debt?.criticalItems ?? 0, color: DS.accent.red, icon: XCircle },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <m.icon size={14} color={m.color} />
              <span style={{ fontSize: 11, color: DS.text.muted }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader icon={AlertTriangle} title="Signal Debt Items" sub={`Top domain: ${debt?.topDomain?.replace(/_/g, ' ') ?? '—'}`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {debt?.items.map((item) => {
            const impColor = item.impact === 'critical' ? DS.accent.red : item.impact === 'high' ? DS.accent.amber : item.impact === 'medium' ? '#f97316' : DS.accent.green;
            return (
              <div
                key={item.signalId}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.025)',
                  borderRadius: 10,
                  border: `1px solid ${DS.border}`,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    minWidth: 46,
                    height: 46,
                    borderRadius: 8,
                    background: `${impColor}15`,
                    border: `1px solid ${impColor}30`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800, color: impColor }}>{item.debtScore}</span>
                  <span style={{ fontSize: 9, color: impColor }}>DEBT</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DS.text.primary }}>{item.label}</span>
                    <RiskBadge risk={item.impact} />
                    <span style={{ fontSize: 10, color: DS.text.muted, textTransform: 'uppercase' }}>{item.debtType.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ fontSize: 11, color: DS.text.muted, marginTop: 2 }}>
                    {item.source} · {item.domain} {item.staleDays ? `· ${item.staleDays}d stale` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: DS.text.secondary, marginTop: 6, lineHeight: 1.5 }}>
                    {item.recommendation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function FlightRecorderTab() {
  const { data, loading } = useApi<{
    records: Array<{
      id: string;
      type: string;
      status: string;
      agent?: string;
      model?: string;
      tool?: string;
      action?: string;
      sources: string[];
      confidence?: number;
      latencyMs?: number;
      rollbackPath?: string;
      recordedAt: string;
    }>;
    summary: {
      modelCalls: number;
      forecasts: number;
      toolActions: number;
      approvalsPending: number;
      totalCost: number;
      avgLatencyMs: number;
    };
    totalRecords: number;
  }>('/meridian/flight-recorder?limit=20');

  if (loading) return <LoadingCard />;

  const s = data?.summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Model Calls', value: s?.modelCalls ?? 0, color: DS.accent.blue },
          { label: 'Forecasts', value: s?.forecasts ?? 0, color: DS.accent.purple },
          { label: 'Tool Actions', value: s?.toolActions ?? 0, color: DS.accent.teal },
          { label: 'Pending Approvals', value: s?.approvalsPending ?? 0, color: DS.accent.amber },
          { label: 'Avg Latency', value: `${s?.avgLatencyMs ?? 0}ms`, color: DS.text.primary },
          { label: 'Total Cost', value: `$${(s?.totalCost ?? 0).toFixed(4)}`, color: DS.accent.green },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 10, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader icon={FileText} title="Flight Log" sub={`${data?.totalRecords ?? 0} records`} />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['ID', 'Type', 'Agent / Tool', 'Sources', 'Status', 'Latency', 'Recorded'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      color: DS.text.muted,
                      fontWeight: 600,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: `1px solid ${DS.border}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.records.map((r) => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                  <td style={{ padding: '10px 10px', color: DS.text.muted, fontFamily: 'monospace', fontSize: 11 }}>{r.id}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ fontSize: 11, color: DS.accent.blue }}>{r.type.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ padding: '10px 10px', color: DS.text.secondary, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.agent ?? r.tool ?? '—'}
                  </td>
                  <td style={{ padding: '10px 10px', color: DS.text.muted, fontSize: 10 }}>
                    {r.sources.slice(0, 2).join(', ')}
                    {r.sources.length > 2 && ` +${r.sources.length - 2}`}
                  </td>
                  <td style={{ padding: '10px 10px' }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td style={{ padding: '10px 10px', color: DS.text.secondary, fontFamily: 'monospace', fontSize: 11 }}>
                    {r.latencyMs ? `${r.latencyMs}ms` : '—'}
                  </td>
                  <td style={{ padding: '10px 10px', color: DS.text.muted, fontSize: 11 }}>
                    {new Date(r.recordedAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function AgentConstellationTab() {
  const { data, loading } = useApi<{
    agents: Array<{
      id: string;
      name: string;
      description: string;
      primaryLane: string;
      approvalClass: string;
      status: string;
      capabilityCount: number;
      tags: string[];
    }>;
    total: number;
  }>('/meridian/agents');

  if (loading) return <LoadingCard />;

  const approvalColors: Record<string, string> = {
    auto: DS.accent.green,
    review: DS.accent.amber,
    admin_only: DS.accent.red,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Card style={{ flex: 1, display: 'flex', gap: 24, padding: '16px 24px' }}>
          <div>
            <div style={{ fontSize: 10, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Agents</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: DS.accent.blue }}>{data?.total}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Healthy</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: DS.accent.green }}>
              {data?.agents.filter((a) => a.status === 'healthy').length ?? 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Auto Approval</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: DS.accent.teal }}>
              {data?.agents.filter((a) => a.approvalClass === 'auto').length ?? 0}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {data?.agents.map((agent) => (
          <Card key={agent.id}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(56,189,248,0.1)',
                  border: '1px solid rgba(56,189,248,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Brain size={18} color={DS.accent.blue} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: DS.text.primary }}>{agent.name}</span>
                  <StatusBadge status={agent.status} />
                </div>
                <div style={{ fontSize: 11, color: DS.text.muted, marginTop: 2 }}>
                  Lane: {agent.primaryLane} · {agent.capabilityCount} capabilities
                </div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: DS.text.secondary, lineHeight: 1.6, marginBottom: 12 }}>
              {agent.description}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: approvalColors[agent.approvalClass] ?? DS.text.muted,
                  background: `${approvalColors[agent.approvalClass] ?? DS.text.muted}15`,
                  border: `1px solid ${approvalColors[agent.approvalClass] ?? DS.text.muted}30`,
                  padding: '2px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {agent.approvalClass.replace(/_/g, ' ')}
              </span>
              {agent.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  style={{ fontSize: 10, color: DS.text.muted, background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}
                >
                  {t}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function McpRegistryTab() {
  const { data, loading } = useApi<{
    total: number;
    active: number;
    inactive: number;
    servers: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      status: string;
      requiresOAuth: boolean;
      envKey?: string;
      notes?: string;
      capabilities: Array<{ id: string; name: string; operationType: string; requiresApproval: boolean }>;
    }>;
    governancePolicy: {
      operationsRequiringApproval: string[];
      readFirstEnforced: boolean;
    };
  }>('/meridian/mcp-registry');

  if (loading) return <LoadingCard />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Servers', value: data?.total ?? 0, color: DS.accent.blue },
          { label: 'Active', value: data?.active ?? 0, color: DS.accent.green },
          { label: 'Inactive', value: data?.inactive ?? 0, color: DS.text.muted },
        ].map((m) => (
          <Card key={m.label}>
            <div style={{ fontSize: 10, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{m.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 11, color: DS.text.muted }}>Read-First Enforced: </span>
            <span style={{ fontSize: 11, color: data?.governancePolicy?.readFirstEnforced ? DS.accent.green : DS.accent.red, fontWeight: 700 }}>
              {data?.governancePolicy?.readFirstEnforced ? 'YES' : 'NO'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: 11, color: DS.text.muted }}>Approval Required For: </span>
            <span style={{ fontSize: 11, color: DS.accent.amber }}>
              {data?.governancePolicy?.operationsRequiringApproval?.join(', ')}
            </span>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {data?.servers.map((server) => (
          <Card key={server.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: server.status === 'active' ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${server.status === 'active' ? 'rgba(74,222,128,0.2)' : DS.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Server size={16} color={server.status === 'active' ? DS.accent.green : DS.text.muted} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: DS.text.primary }}>{server.name}</span>
                  <StatusBadge status={server.status} />
                </div>
                <div style={{ fontSize: 11, color: DS.text.muted }}>{server.category} · {server.requiresOAuth ? 'OAuth' : server.envKey}</div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: DS.text.secondary, lineHeight: 1.5, marginBottom: 12 }}>
              {server.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {server.capabilities.map((cap) => (
                <div
                  key={cap.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                    color: DS.text.secondary,
                  }}
                >
                  {cap.operationType === 'read' ? (
                    <CheckCircle2 size={12} color={DS.accent.green} />
                  ) : (
                    <Lock size={12} color={DS.accent.amber} />
                  )}
                  <span>{cap.name}</span>
                  <span style={{ fontSize: 10, color: DS.text.muted }}>({cap.operationType})</span>
                  {cap.requiresApproval && (
                    <span style={{ fontSize: 10, color: DS.accent.amber, marginLeft: 'auto' }}>approval required</span>
                  )}
                </div>
              ))}
            </div>

            {server.notes && (
              <div style={{ marginTop: 10, fontSize: 11, color: DS.text.muted, lineHeight: 1.5, fontStyle: 'italic' }}>
                {server.notes}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function GovernanceTab() {
  const { data: founderIntent, loading: fiLoading } = useApi<{
    missionStatement: string;
    coreDoctrines: Array<{ dimension: string; value: string; weight: number }>;
    riskTolerances: Array<{ domain: string; maxAcceptableRisk: number; preferredMitigationStyle: string }>;
    prohibitedActions: string[];
    decisionPrinciples: string[];
    strategicPriorities: Array<{ priority: string; weight: number; timeframe: string }>;
  }>('/meridian/founder-intent');

  if (fiLoading) return <LoadingCard />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Card>
        <SectionHeader icon={Sparkles} title="Founder Intent Vector" sub="Governed strategy memory — supreme decision authority" />
        <div
          style={{
            background: 'rgba(167,139,250,0.06)',
            border: '1px solid rgba(167,139,250,0.15)',
            borderRadius: 10,
            padding: '16px 20px',
            fontSize: 13,
            color: DS.text.secondary,
            lineHeight: 1.7,
            marginBottom: 20,
            fontStyle: 'italic',
          }}
        >
          "{founderIntent?.missionStatement}"
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 12, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Core Doctrines
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {founderIntent?.coreDoctrines.map((d) => (
                <div key={d.dimension} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 4, background: d.weight === 1 ? DS.accent.blue : DS.accent.purple, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: DS.text.primary, marginBottom: 2 }}>
                      {d.dimension.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 11, color: DS.text.secondary, lineHeight: 1.5 }}>{d.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 12, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Decision Principles
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {founderIntent?.decisionPrinciples.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 12, color: DS.text.secondary }}>
                  <span style={{ color: DS.accent.teal, fontWeight: 700, flexShrink: 0 }}>→</span>
                  <span style={{ lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <h3 style={{ fontSize: 12, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Risk Tolerances
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {founderIntent?.riskTolerances.map((r) => {
              const riskColor = r.maxAcceptableRisk < 0.1 ? DS.accent.red : r.maxAcceptableRisk < 0.3 ? DS.accent.amber : DS.accent.green;
              return (
                <div key={r.domain} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: DS.text.secondary, minWidth: 100, textTransform: 'capitalize' }}>{r.domain}</span>
                  <ProbBar value={r.maxAcceptableRisk} color={riskColor} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: riskColor, minWidth: 36 }}>{Math.round(r.maxAcceptableRisk * 100)}%</span>
                  <span style={{ fontSize: 10, color: DS.text.muted }}>{r.preferredMitigationStyle}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 12, color: DS.text.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Prohibited Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {founderIntent?.prohibitedActions.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <XCircle size={12} color={DS.accent.red} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: DS.text.secondary, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function MeridianIntelligence() {
  const [activeTab, setActiveTab] = useState<Tab>('weather');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: DS.bg,
        color: DS.text.primary,
        fontFamily: '"Inter", system-ui, sans-serif',
      }}
    >
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ borderBottom: `1px solid ${DS.border}`, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #38bdf8 0%, #a78bfa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Brain size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Continuum Meridian</h1>
          <p style={{ fontSize: 11, color: DS.text.muted, margin: 0 }}>Cognitive Observability OS · Governed Intelligence Layer</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.accent.green, boxShadow: `0 0 8px ${DS.accent.green}` }} />
          <span style={{ fontSize: 11, color: DS.text.muted }}>Layer Active</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, padding: '12px 32px 0', borderBottom: `1px solid ${DS.border}` }}>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === id ? `2px solid ${DS.accent.blue}` : '2px solid transparent',
              color: activeTab === id ? DS.accent.blue : DS.text.secondary,
              fontSize: 13,
              fontWeight: activeTab === id ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1440 }}>
        {activeTab === 'weather' && <DecisionWeatherTab />}
        {activeTab === 'forecast' && <ForecastTournamentTab />}
        {activeTab === 'signals' && <SignalDebtTab />}
        {activeTab === 'recorder' && <FlightRecorderTab />}
        {activeTab === 'agents' && <AgentConstellationTab />}
        {activeTab === 'mcp' && <McpRegistryTab />}
        {activeTab === 'governance' && <GovernanceTab />}
      </div>
    </div>
  );
}
