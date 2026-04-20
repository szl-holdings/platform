import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface PredictiveSignal {
  id: string;
  type:
    | 'capacity_exhaustion'
    | 'sla_breach'
    | 'anomaly_convergence'
    | 'business_impact'
    | 'threat_trajectory';
  title: string;
  description: string;
  confidenceScore: number;
  severity: 'critical' | 'warning' | 'info';
  timeToEventHours: number;
  affectedEntities: string[];
  businessImpactUsd?: number;
  recommendedActions: string[];
  trendData: number[];
  predictedAt: number;
}

interface CapacityForecast {
  service: string;
  currentLoad: number;
  forecastedLoad: number;
  hoursToExhaustion: number;
  trend: number[];
  color: string;
}

interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  probability: number;
  businessImpact: number;
  mitigationCost: number;
  riskScore: number;
}

const SEED_SIGNALS: PredictiveSignal[] = [
  {
    id: 'ps1',
    type: 'capacity_exhaustion',
    title: 'API Gateway capacity exhaustion projected in 3.8 hours',
    description:
      'Current request growth rate of 2.3% per hour will exceed 95% capacity threshold. Based on 72h trend analysis with 91% confidence.',
    confidenceScore: 91,
    severity: 'critical',
    timeToEventHours: 3.8,
    affectedEntities: ['api-gateway', 'lyte-core'],
    businessImpactUsd: 45000,
    recommendedActions: [
      'Scale compute allocation by 40%',
      'Enable request rate limiting',
      'Pre-provision failover capacity',
    ],
    trendData: [42, 45, 47, 50, 53, 57, 62, 68, 75, 83, 91, 95],
    predictedAt: Date.now() - 300000,
  },
  {
    id: 'ps2',
    type: 'sla_breach',
    title: 'SLA breach risk: Northgate Corp contract in 6.2 hours',
    description:
      'P99 latency trend line intersects SLA threshold in approximately 6 hours if no intervention. 78% confidence interval based on rolling 24h baseline.',
    confidenceScore: 78,
    severity: 'warning',
    timeToEventHours: 6.2,
    affectedEntities: ['api-gateway', 'northgate-tenant'],
    businessImpactUsd: 22000,
    recommendedActions: [
      'Notify account manager',
      'Implement priority queue for Northgate traffic',
      'Trigger SLA extension negotiation workflow',
    ],
    trendData: [18, 21, 24, 28, 33, 38, 44, 51, 59, 67, 76, 84],
    predictedAt: Date.now() - 600000,
  },
  {
    id: 'ps3',
    type: 'anomaly_convergence',
    title: '3 concurrent anomaly streams converging toward incident',
    description:
      'ML inference latency, error rate, and memory pressure anomalies are statistically correlated and converging. Pattern matches pre-incident state from 3 historical events.',
    confidenceScore: 84,
    severity: 'warning',
    timeToEventHours: 2.1,
    affectedEntities: ['ml-inference', 'alloy-engine'],
    recommendedActions: [
      'Preemptive service restart in low-traffic window',
      'Drain ML inference queue',
      'Alert on-call engineer',
    ],
    trendData: [12, 18, 24, 32, 40, 49, 58, 68, 77, 85, 90, 92],
    predictedAt: Date.now() - 120000,
  },
  {
    id: 'ps4',
    type: 'business_impact',
    title: 'Revenue impact acceleration: current trajectory → $180k/day loss',
    description:
      'Compound effect of 3 active degradations is accelerating. If not resolved in 4h, daily revenue impact estimated to reach $180k based on historical incident correlation models.',
    confidenceScore: 73,
    severity: 'warning',
    timeToEventHours: 4.0,
    businessImpactUsd: 180000,
    affectedEntities: ['revenue-stream-ai', 'revenue-stream-platform'],
    recommendedActions: [
      'Escalate to engineering leads',
      'Activate incident command center',
      'Prepare client communication',
    ],
    trendData: [20, 25, 32, 40, 50, 62, 75, 88, 100, 112, 130, 150],
    predictedAt: Date.now() - 900000,
  },
];

const CAPACITY_FORECASTS: CapacityForecast[] = [
  {
    service: 'API Gateway',
    currentLoad: 74,
    forecastedLoad: 97,
    hoursToExhaustion: 3.8,
    trend: [55, 59, 63, 67, 70, 72, 74],
    color: '#ef4444',
  },
  {
    service: 'ML Inference',
    currentLoad: 89,
    forecastedLoad: 99,
    hoursToExhaustion: 1.4,
    trend: [70, 74, 78, 82, 85, 87, 89],
    color: '#dc2626',
  },
  {
    service: 'Metrics Store',
    currentLoad: 61,
    forecastedLoad: 78,
    hoursToExhaustion: 12.5,
    trend: [52, 54, 56, 58, 59, 60, 61],
    color: '#d4a054',
  },
  {
    service: 'Signal Bus',
    currentLoad: 45,
    forecastedLoad: 55,
    hoursToExhaustion: 28.0,
    trend: [40, 41, 42, 43, 44, 44, 45],
    color: '#6b8f71',
  },
];

const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'w1',
    name: 'API Gateway doubles load',
    description: 'Simulating 2× traffic spike from major product launch campaign',
    probability: 35,
    businessImpact: 89000,
    mitigationCost: 2400,
    riskScore: 78,
  },
  {
    id: 'w2',
    name: 'ML inference model upgrade rollout',
    description: 'Deploying new model version with 20% higher compute requirements',
    probability: 65,
    businessImpact: 12000,
    mitigationCost: 800,
    riskScore: 42,
  },
  {
    id: 'w3',
    name: 'Primary DB failover event',
    description: 'Primary PostgreSQL instance fails, triggering replica promotion',
    probability: 8,
    businessImpact: 145000,
    mitigationCost: 0,
    riskScore: 91,
  },
];

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = 100,
    h = 32,
    w = 120;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(' ');
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={areaPoints} fill={`${color}15`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx={data[data.length - 1] !== undefined ? w : 0}
        cy={data.length > 0 ? h - (data[data.length - 1]! / max) * h : h}
        r="3"
        fill={color}
      />
    </svg>
  );
}

export default function PredictiveIntelligence() {
  const [signals, setSignals] = useState<PredictiveSignal[]>(SEED_SIGNALS);
  const [capacities, setCapacities] = useState<CapacityForecast[]>(CAPACITY_FORECASTS);
  const [tab, setTab] = useState<'signals' | 'capacity' | 'whatif'>('signals');

  useEffect(() => {
    const t = setInterval(() => {
      setCapacities((prev) =>
        prev.map((c) => ({
          ...c,
          currentLoad: Math.min(99, c.currentLoad + Math.random() * 0.3),
          trend: [...c.trend.slice(-6), Math.min(99, c.currentLoad + Math.random() * 0.3)],
          hoursToExhaustion: Math.max(0.1, c.hoursToExhaustion - 0.01),
        })),
      );
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const criticalSignals = signals.filter((s) => s.severity === 'critical').length;
  const totalImpact = signals
    .filter((s) => s.businessImpactUsd)
    .reduce((s, p) => s + (p.businessImpactUsd ?? 0), 0);
  const avgConfidence = signals.reduce((s, p) => s + p.confidenceScore, 0) / signals.length;
  const criticalCapacity = capacities.filter((c) => c.hoursToExhaustion < 6).length;

  const TABS = [
    { id: 'signals' as const, label: 'Predictive Signals' },
    { id: 'capacity' as const, label: 'Capacity Forecasting' },
    { id: 'whatif' as const, label: 'What-If Modeling' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
          <span
            className="text-[10px] font-bold uppercase tracking-widest font-mono"
            style={{ color: '#8b5cf6' }}
          >
            Lyte · Predictive Intelligence
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[8px] font-bold"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}
          >
            AI-FORECAST
          </span>
        </div>
        <h1 className="text-xl font-bold text-white">Predictive Intelligence Engine</h1>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Not just what IS happening — what WILL happen. Capacity exhaustion forecasting, business
          impact modeling, and proactive alerts before problems materialize.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Predictive Alerts', value: signals.length.toString(), color: '#8b5cf6' },
          {
            label: 'Critical Forecasts',
            value: criticalSignals.toString(),
            color: '#ef4444',
            pulse: criticalSignals > 0,
          },
          {
            label: 'Projected Impact',
            value: totalImpact >= 1000 ? `$${(totalImpact / 1000).toFixed(0)}k` : `$${totalImpact}`,
            color: GOLD,
          },
          {
            label: 'Services At Capacity Risk',
            value: criticalCapacity.toString(),
            color: criticalCapacity > 0 ? '#ef4444' : '#6b8f71',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-2xl font-bold font-mono" style={{ color: c.color }}>
                {c.value}
              </span>
              {(c as { pulse?: boolean }).pulse && (
                <span
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: c.color }}
                />
              )}
            </div>
            <div
              className="text-[9px] uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {c.label}
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-1 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs font-medium transition-colors"
            style={{
              color: tab === t.id ? 'white' : 'rgba(255,255,255,0.4)',
              borderBottom: tab === t.id ? '2px solid #8b5cf6' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'signals' && (
        <div className="space-y-4">
          {signals.map((s) => {
            const severityColor =
              s.severity === 'critical'
                ? '#ef4444'
                : s.severity === 'warning'
                  ? '#f59e0b'
                  : '#6b8f71';
            const typeIcons = {
              capacity_exhaustion: Target,
              sla_breach: Clock,
              anomaly_convergence: Activity,
              business_impact: TrendingUp,
              threat_trajectory: AlertTriangle,
            };
            const Icon = typeIcons[s.type];
            return (
              <div
                key={s.id}
                className="rounded-xl border p-5"
                style={{ borderColor: `${severityColor}20`, background: `${severityColor}04` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${severityColor}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: severityColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white mb-0.5">{s.title}</div>
                      <div
                        className="text-[10px] leading-relaxed"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        {s.description}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-[9px]" style={{ color: DS.text.muted }}>
                      Confidence
                    </div>
                    <div
                      className="text-lg font-bold font-mono"
                      style={{ color: s.confidenceScore > 85 ? severityColor : '#f59e0b' }}
                    >
                      {s.confidenceScore}%
                    </div>
                    <div
                      className="text-[9px] px-2 py-0.5 rounded-full font-mono"
                      style={{ background: `${severityColor}15`, color: severityColor }}
                    >
                      ⏱ {s.timeToEventHours.toFixed(1)}h
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <SparkLine data={s.trendData} color={severityColor} />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    {s.businessImpactUsd && (
                      <div
                        className="p-2 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)' }}
                      >
                        <div className="text-[9px]" style={{ color: DS.text.muted }}>
                          Business Impact
                        </div>
                        <div className="text-sm font-bold font-mono" style={{ color: GOLD }}>
                          ${(s.businessImpactUsd / 1000).toFixed(0)}k
                        </div>
                      </div>
                    )}
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="text-[9px]" style={{ color: DS.text.muted }}>
                        Affected
                      </div>
                      <div className="text-[10px] text-white/70">
                        {s.affectedEntities.join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    className="text-[9px] font-bold uppercase tracking-wider mb-2"
                    style={{ color: DS.text.muted }}
                  >
                    Recommended Actions
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.recommendedActions.map((a) => (
                      <span
                        key={a}
                        className="text-[9px] px-2 py-1 rounded-lg"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          color: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'capacity' && (
        <div className="space-y-4">
          {capacities.map((c) => {
            const urgencyColor =
              c.hoursToExhaustion < 2 ? '#ef4444' : c.hoursToExhaustion < 6 ? '#f59e0b' : '#6b8f71';
            return (
              <div
                key={c.service}
                className="rounded-xl border p-4"
                style={{ borderColor: `${urgencyColor}20`, background: `${urgencyColor}04` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-bold text-white">{c.service}</div>
                    <div className="text-[9px] mt-0.5 font-mono" style={{ color: DS.text.muted }}>
                      Exhaustion in {c.hoursToExhaustion.toFixed(1)}h at current growth rate
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold font-mono" style={{ color: urgencyColor }}>
                      {c.currentLoad.toFixed(1)}%
                    </div>
                    <div className="text-[9px]" style={{ color: DS.text.muted }}>
                      → {c.forecastedLoad}% in 4h
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div
                    className="flex justify-between text-[9px] mb-1"
                    style={{ color: DS.text.muted }}
                  >
                    <span>Current</span>
                    <span>Forecast (4h)</span>
                    <span>Limit</span>
                  </div>
                  <div
                    className="h-3 rounded-full relative"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="absolute h-full rounded-full transition-all duration-1000"
                      style={{ width: `${c.currentLoad}%`, background: `${urgencyColor}50` }}
                    />
                    <div
                      className="absolute h-full rounded-l-none rounded-r-full opacity-50"
                      style={{
                        left: `${c.currentLoad}%`,
                        width: `${c.forecastedLoad - c.currentLoad}%`,
                        background: `${urgencyColor}30`,
                        borderLeft: `1px dashed ${urgencyColor}60`,
                      }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{ left: '95%', background: '#ef4444', opacity: 0.6 }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <SparkLine data={c.trend} color={urgencyColor} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'whatif' && (
        <div className="space-y-4">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="text-xs font-bold text-white mb-1">What-If Scenario Modeling</div>
            <div className="text-[10px]" style={{ color: DS.text.muted }}>
              Explore business impact of hypothetical events before they occur. Models are based on
              historical incident data and current system state.
            </div>
          </div>
          {WHAT_IF_SCENARIOS.map((s) => {
            const riskColor =
              s.riskScore > 70 ? '#ef4444' : s.riskScore > 40 ? '#f59e0b' : '#6b8f71';
            return (
              <div
                key={s.id}
                className="rounded-xl border p-4"
                style={{ borderColor: `${riskColor}20`, background: `${riskColor}04` }}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white mb-1">{s.name}</div>
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {s.description}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-xl font-bold font-mono" style={{ color: riskColor }}>
                      {s.riskScore}
                    </div>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      Risk Score
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Probability', value: `${s.probability}%`, color: '#8b5cf6' },
                    {
                      label: 'Business Impact',
                      value:
                        s.businessImpact >= 1000
                          ? `$${(s.businessImpact / 1000).toFixed(0)}k`
                          : `$${s.businessImpact}`,
                      color: GOLD,
                    },
                    {
                      label: 'Mitigation Cost',
                      value:
                        s.mitigationCost === 0
                          ? 'None'
                          : `$${(s.mitigationCost / 1000).toFixed(1)}k`,
                      color: '#6b8f71',
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="text-center p-2 rounded-lg"
                      style={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="text-sm font-bold font-mono" style={{ color: m.color }}>
                        {m.value}
                      </div>
                      <div className="text-[8px]" style={{ color: DS.text.muted }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
