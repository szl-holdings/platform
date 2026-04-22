import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
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

interface DEXUser {
  id: string;
  name: string;
  department: string;
  device: string;
  os: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  components: {
    appLoadTime: number;
    crashRate: number;
    networkQuality: number;
    loginSpeed: number;
    appAvailability: number;
  };
  topIssue: string;
}

const DEX_USERS: DEXUser[] = [
  {
    id: 'u1',
    name: 'Marcus Webb',
    department: 'Engineering',
    device: 'MacBook Pro M3',
    os: 'macOS 14.4',
    score: 91,
    trend: 'stable',
    components: {
      appLoadTime: 95,
      crashRate: 98,
      networkQuality: 88,
      loginSpeed: 91,
      appAvailability: 100,
    },
    topIssue: 'Occasional VPN latency spikes',
  },
  {
    id: 'u2',
    name: 'Priya Nair',
    department: 'Sales',
    device: 'Windows Laptop',
    os: 'Windows 11',
    score: 67,
    trend: 'down',
    components: {
      appLoadTime: 54,
      crashRate: 78,
      networkQuality: 72,
      loginSpeed: 63,
      appAvailability: 95,
    },
    topIssue: 'Salesforce app load time 4.2x above baseline',
  },
  {
    id: 'u3',
    name: 'Jordan Lee',
    department: 'Operations',
    device: 'MacBook Air M2',
    os: 'macOS 14.4',
    score: 82,
    trend: 'up',
    components: {
      appLoadTime: 89,
      crashRate: 94,
      networkQuality: 79,
      loginSpeed: 85,
      appAvailability: 98,
    },
    topIssue: 'Network quality degraded during peak hours',
  },
  {
    id: 'u4',
    name: 'Alex Chen',
    department: 'Finance',
    device: 'iPad Pro',
    os: 'iPadOS 17.4',
    score: 44,
    trend: 'down',
    components: {
      appLoadTime: 41,
      crashRate: 62,
      networkQuality: 55,
      loginSpeed: 34,
      appAvailability: 89,
    },
    topIssue: 'Finance app crashing 3x/day — iOS 17.4 compat issue',
  },
  {
    id: 'u5',
    name: 'Sam Torres',
    department: 'HR',
    device: 'Surface Pro',
    os: 'Windows 11',
    score: 88,
    trend: 'stable',
    components: {
      appLoadTime: 91,
      crashRate: 96,
      networkQuality: 85,
      loginSpeed: 90,
      appAvailability: 99,
    },
    topIssue: 'Minor SSO delay on cold start',
  },
  {
    id: 'u6',
    name: 'Dana Kim',
    department: 'Marketing',
    device: 'MacBook Pro M2',
    os: 'macOS 14.4',
    score: 76,
    trend: 'up',
    components: {
      appLoadTime: 82,
      crashRate: 88,
      networkQuality: 68,
      loginSpeed: 77,
      appAvailability: 97,
    },
    topIssue: 'Video conferencing quality degraded on home WiFi',
  },
];

const DEPT_SCORES = [
  { dept: 'Engineering', score: 91, users: 84, trend: 'up' as const },
  { dept: 'Sales', score: 62, users: 47, trend: 'down' as const },
  { dept: 'Operations', score: 81, users: 33, trend: 'stable' as const },
  { dept: 'Finance', score: 58, users: 28, trend: 'down' as const },
  { dept: 'HR', score: 87, users: 19, trend: 'stable' as const },
  { dept: 'Marketing', score: 75, users: 22, trend: 'up' as const },
];

const DEX_HISTORY = [88, 85, 87, 83, 79, 77, 76, 74, 75, 78, 81, 79, 77, 76];

function ScoreGauge({ score, size = 64 }: { score: number; size?: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? GOLD : '#ef4444';
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? GOLD : '#ef4444';
  return (
    <span className="font-mono font-bold text-base" style={{ color }}>
      {score}
    </span>
  );
}

function ComponentBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? GOLD : '#ef4444';
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[9px]" style={{ color: DS.text.muted }}>
          {label}
        </span>
        <span className="text-[9px] font-mono" style={{ color }}>
          {value}
        </span>
      </div>
      <div
        className="h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

const PROACTIVE_ACTIONS = [
  {
    id: 1,
    title: 'Salesforce App Optimisation',
    users: 12,
    impact: '+18 pts',
    urgency: 'high',
    desc: 'Batch query optimization to reduce P99 load time from 6.2s → 1.1s',
    auto: true,
  },
  {
    id: 2,
    title: 'Finance iPad Crash Fix',
    users: 4,
    impact: '+24 pts',
    urgency: 'critical',
    desc: 'Deploy iOS 17.4 compatibility patch for Finance module — crash resolved in test',
    auto: false,
  },
  {
    id: 3,
    title: 'VPN Split-Tunnel Config Push',
    users: 31,
    impact: '+9 pts',
    urgency: 'medium',
    desc: 'Route Microsoft 365 traffic direct — reduce VPN-induced latency by ~40%',
    auto: true,
  },
  {
    id: 4,
    title: 'Upgrade Zoom Client — Fleet-Wide',
    users: 89,
    impact: '+6 pts',
    urgency: 'low',
    desc: 'Zoom 6.1.2 fixes codec inefficiency causing video quality drops on WiFi',
    auto: true,
  },
];

export default function DEXScoring() {
  const [selected, setSelected] = useState<DEXUser>(DEX_USERS[0]);
  const [_ticker, setTicker] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const avgScore = Math.round(DEX_USERS.reduce((a, u) => a + u.score, 0) / DEX_USERS.length);
  const atRisk = DEX_USERS.filter((u) => u.score < 70).length;

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
              Digital Employee Experience (DEX)
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
              Real-time experience measurement across devices, apps, and networks
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: DS.text.muted }}>
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#10b981' }}
            />
            <span>Live · Updated 18s ago</span>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: 'Fleet DEX Score',
              value: `${avgScore}`,
              unit: '/100',
              color: GOLD,
              icon: Activity,
            },
            {
              label: 'At Risk Users',
              value: `${atRisk}`,
              unit: `/${DEX_USERS.length}`,
              color: '#ef4444',
              icon: AlertTriangle,
            },
            {
              label: 'Proactive Fixes Queued',
              value: '4',
              unit: '',
              color: '#3b82f6',
              icon: CheckCircle,
            },
            {
              label: 'Complaints Prevented',
              value: '37',
              unit: ' this wk',
              color: '#10b981',
              icon: TrendingDown,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg p-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[9px] uppercase tracking-widest"
                  style={{ color: DS.text.muted }}
                >
                  {k.label}
                </span>
                <k.icon className="w-3 h-3" style={{ color: k.color }} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono" style={{ color: k.color }}>
                  {k.value}
                </span>
                <span className="text-[10px]" style={{ color: DS.text.muted }}>
                  {k.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-4">
            {/* Department scores */}
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[10px] uppercase tracking-widest font-medium mb-3"
                style={{ color: DS.text.muted }}
              >
                Department Scores
              </div>
              <div className="space-y-2">
                {DEPT_SCORES.map((d) => {
                  const color = d.score >= 80 ? '#10b981' : d.score >= 60 ? GOLD : '#ef4444';
                  return (
                    <div key={d.dept} className="flex items-center gap-3">
                      <div className="w-20 text-[10px]" style={{ color: DS.text.secondary }}>
                        {d.dept}
                      </div>
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${d.score}%`,
                            background: color,
                            transition: 'width 1s ease',
                          }}
                        />
                      </div>
                      <div className="w-8 text-right">
                        <span className="text-[10px] font-mono font-bold" style={{ color }}>
                          {d.score}
                        </span>
                      </div>
                      <div className="w-4">
                        {d.trend === 'up' && (
                          <TrendingUp className="w-3 h-3" style={{ color: '#10b981' }} />
                        )}
                        {d.trend === 'down' && (
                          <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />
                        )}
                        {d.trend === 'stable' && (
                          <div
                            className="w-3 h-0.5 rounded"
                            style={{ background: DS.text.muted }}
                          />
                        )}
                      </div>
                      <div className="text-[9px] w-12 text-right" style={{ color: DS.text.muted }}>
                        {d.users} users
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User table */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div className="p-3 border-b" style={{ borderColor: DS.border }}>
                <span
                  className="text-[10px] uppercase tracking-widest font-medium"
                  style={{ color: DS.text.muted }}
                >
                  User Experience Detail
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                      {['User', 'Department', 'Device', 'DEX Score', 'Top Issue', ''].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-medium"
                          style={{ color: DS.text.muted }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEX_USERS.map((u) => {
                      const scoreColor =
                        u.score >= 80 ? '#10b981' : u.score >= 60 ? GOLD : '#ef4444';
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelected(u)}
                          className="cursor-pointer transition-colors"
                          style={{
                            borderBottom: `1px solid ${DS.border}`,
                            background: selected.id === u.id ? 'rgba(212,160,84,0.04)' : undefined,
                          }}
                        >
                          <td className="px-3 py-2">
                            <span className="font-medium" style={{ color: DS.text.primary }}>
                              {u.name}
                            </span>
                          </td>
                          <td className="px-3 py-2" style={{ color: DS.text.secondary }}>
                            {u.department}
                          </td>
                          <td className="px-3 py-2">
                            <span className="font-mono" style={{ color: DS.text.muted }}>
                              {u.device}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold" style={{ color: scoreColor }}>
                                {u.score}
                              </span>
                              {u.trend === 'down' && (
                                <TrendingDown className="w-3 h-3" style={{ color: '#ef4444' }} />
                              )}
                              {u.trend === 'up' && (
                                <TrendingUp className="w-3 h-3" style={{ color: '#10b981' }} />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 max-w-[200px]">
                            <span className="truncate block" style={{ color: DS.text.secondary }}>
                              {u.topIssue}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <ChevronRight className="w-3 h-3" style={{ color: DS.text.muted }} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Proactive actions */}
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[10px] uppercase tracking-widest font-medium mb-3"
                style={{ color: DS.text.muted }}
              >
                Proactive Optimization Queue
              </div>
              <div className="space-y-2">
                {PROACTIVE_ACTIONS.map((a) => {
                  const urgColor =
                    a.urgency === 'critical'
                      ? '#ef4444'
                      : a.urgency === 'high'
                        ? '#f97316'
                        : a.urgency === 'medium'
                          ? GOLD
                          : '#3b82f6';
                  return (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: `1px solid ${DS.border}`,
                      }}
                    >
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                        style={{ background: urgColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: DS.text.primary }}
                          >
                            {a.title}
                          </span>
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: `${urgColor}15`, color: urgColor }}
                          >
                            {a.urgency}
                          </span>
                          <span
                            className="text-[9px] font-mono ml-auto"
                            style={{ color: '#10b981' }}
                          >
                            {a.impact} DEX
                          </span>
                        </div>
                        <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                          {a.desc}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px]" style={{ color: DS.text.muted }}>
                            {a.users} users affected
                          </span>
                          {a.auto && (
                            <span
                              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                              style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
                            >
                              Auto-apply
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        className="px-2.5 py-1 rounded text-[9px] font-medium shrink-0"
                        style={{
                          background: a.auto ? 'rgba(59,130,246,0.08)' : 'rgba(212,160,84,0.08)',
                          border: `1px solid ${a.auto ? 'rgba(59,130,246,0.2)' : 'rgba(212,160,84,0.2)'}`,
                          color: a.auto ? '#3b82f6' : GOLD,
                        }}
                      >
                        {a.auto ? 'Apply' : 'Review'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* User detail */}
          <div className="space-y-3">
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-3"
                style={{ color: DS.text.muted }}
              >
                User Detail
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <ScoreGauge score={selected.score} size={56} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScoreBadge score={selected.score} />
                  </div>
                </div>
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: DS.text.primary }}>
                    {selected.name}
                  </div>
                  <div className="text-[10px]" style={{ color: DS.text.secondary }}>
                    {selected.department}
                  </div>
                  <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {selected.device} · {selected.os}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <ComponentBar label="App Load Time" value={selected.components.appLoadTime} />
                <ComponentBar label="Crash Rate" value={selected.components.crashRate} />
                <ComponentBar label="Network Quality" value={selected.components.networkQuality} />
                <ComponentBar label="Login Speed" value={selected.components.loginSpeed} />
                <ComponentBar
                  label="App Availability"
                  value={selected.components.appAvailability}
                />
              </div>
              <div
                className="mt-3 p-2 rounded"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.15)',
                }}
              >
                <div
                  className="text-[8px] uppercase tracking-widest mb-1"
                  style={{ color: '#ef4444' }}
                >
                  Top Issue
                </div>
                <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                  {selected.topIssue}
                </p>
              </div>
            </div>

            {/* Trend sparkline placeholder */}
            <div
              className="rounded-lg p-4"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{ color: DS.text.muted }}
              >
                Fleet DEX Trend — 14 days
              </div>
              <div className="flex items-end gap-1 h-16">
                {DEX_HISTORY.map((v, i) => {
                  const color = v >= 80 ? '#10b981' : v >= 70 ? GOLD : '#ef4444';
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-t transition-all duration-300"
                      style={{
                        height: `${(v / 100) * 100}%`,
                        background: i === DEX_HISTORY.length - 1 ? color : `${color}50`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px]" style={{ color: DS.text.muted }}>
                  14d ago
                </span>
                <span className="text-[8px]" style={{ color: DS.text.muted }}>
                  Today
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
