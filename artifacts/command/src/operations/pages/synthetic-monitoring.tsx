import { AlertTriangle, BarChart3, CheckCircle, Clock, Globe, Plus } from 'lucide-react';
import { useState } from 'react';

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

type CheckStatus = 'passing' | 'failing' | 'degraded';
type CheckType = 'http' | 'api' | 'ssl' | 'dns' | 'tcp';

interface Region {
  id: string;
  name: string;
  code: string;
  latencyMs?: number;
  status?: CheckStatus;
}

interface SyntheticCheck {
  id: string;
  name: string;
  type: CheckType;
  url: string;
  method: string;
  interval: number;
  status: CheckStatus;
  uptime30d: number;
  lastCheckMs: number;
  lastCheckTime: string;
  regions: (Region & { latencyMs: number; status: CheckStatus })[];
  assertionCount: number;
  tags: string[];
  alertPolicy: string;
  responseHistory: { t: string; ms: number; ok: boolean }[];
}

const REGIONS: Region[] = [
  { id: 'us-east-1', name: 'US East (Virginia)', code: 'IAD' },
  { id: 'us-west-2', name: 'US West (Oregon)', code: 'PDX' },
  { id: 'eu-west-1', name: 'EU West (Ireland)', code: 'DUB' },
  { id: 'ap-southeast-1', name: 'APAC (Singapore)', code: 'SIN' },
  { id: 'ap-northeast-1', name: 'APAC (Tokyo)', code: 'NRT' },
];

function makeCheck(
  id: string,
  name: string,
  type: CheckType,
  url: string,
  status: CheckStatus,
  uptime: number,
  p50: number,
): SyntheticCheck {
  const regionStatuses: CheckStatus[] =
    status === 'passing'
      ? ['passing', 'passing', 'passing', 'passing', 'passing']
      : status === 'failing'
        ? ['failing', 'failing', 'passing', 'failing', 'passing']
        : ['passing', 'degraded', 'passing', 'degraded', 'passing'];

  return {
    id,
    name,
    type,
    url,
    method: 'GET',
    interval: 60,
    status,
    uptime30d: uptime,
    lastCheckMs: p50 + Math.floor(Math.random() * 20 - 10),
    lastCheckTime: `${Math.floor(Math.random() * 59 + 1)}s ago`,
    regions: REGIONS.map((r, i) => ({
      ...r,
      latencyMs: Math.round(p50 * (0.7 + i * 0.15 + Math.random() * 0.2)),
      status: regionStatuses[i],
    })),
    assertionCount: Math.floor(Math.random() * 4) + 2,
    tags: [type, status === 'failing' ? 'alerting' : 'ok'],
    alertPolicy: 'Standard 5-min',
    responseHistory: Array.from({ length: 24 }, (_, i) => ({
      t: `${i}h`,
      ms: Math.round(
        p50 +
          Math.sin(i * 0.5) * 20 +
          Math.random() * 30 +
          (status === 'failing' && i > 20 ? 800 : 0),
      ),
      ok: status === 'failing' ? i < 20 || Math.random() > 0.5 : Math.random() > 0.02,
    })),
  };
}

const CHECKS: SyntheticCheck[] = [
  makeCheck('c1', 'API Gateway Health', 'http', 'https://api.szl.com/health', 'passing', 99.98, 45),
  makeCheck(
    'c2',
    'Payment API Checkout Flow',
    'api',
    'https://api.szl.com/v2/checkout',
    'degraded',
    99.41,
    280,
  ),
  makeCheck(
    'c3',
    'Auth Service Login',
    'api',
    'https://auth.szl.com/v1/login',
    'passing',
    99.99,
    82,
  ),
  makeCheck(
    'c4',
    'CDN Asset Delivery',
    'http',
    'https://assets.szl.com/app.js',
    'failing',
    97.23,
    95,
  ),
  makeCheck('c5', 'SSL Certificate Validity', 'ssl', 'https://api.szl.com', 'passing', 100, 12),
  makeCheck(
    'c6',
    'Search API Latency',
    'api',
    'https://api.szl.com/v1/search',
    'passing',
    99.87,
    180,
  ),
  makeCheck(
    'c7',
    'Order Status Webhook',
    'api',
    'https://api.szl.com/webhooks/orders',
    'passing',
    99.93,
    65,
  ),
];

const STATUS_CONFIG: Record<CheckStatus, { color: string; label: string; icon: any }> = {
  passing: { color: '#10b981', label: 'Passing', icon: CheckCircle },
  failing: { color: '#ef4444', label: 'Failing', icon: AlertTriangle },
  degraded: { color: GOLD, label: 'Degraded', icon: Clock },
};

const TYPE_CONFIG: Record<CheckType, { color: string; label: string }> = {
  http: { color: '#60a5fa', label: 'HTTP' },
  api: { color: GOLD, label: 'API' },
  ssl: { color: '#10b981', label: 'SSL' },
  dns: { color: '#a78bfa', label: 'DNS' },
  tcp: { color: '#38bdf8', label: 'TCP' },
};

function MiniHistogram({ history }: { history: SyntheticCheck['responseHistory'] }) {
  const maxMs = Math.max(...history.map((h) => h.ms));
  return (
    <div className="flex items-end gap-px h-8 w-full">
      {history.map((h, i) => (
        <div
          key={i}
          title={`${h.t}: ${h.ms}ms${!h.ok ? ' ✗' : ''}`}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.max(4, (h.ms / maxMs) * 28)}px`,
            background: !h.ok ? '#ef4444' : h.ms > 500 ? GOLD : '#10b981',
            opacity: 0.7,
          }}
        />
      ))}
    </div>
  );
}

function RegionMap({ check }: { check: SyntheticCheck }) {
  return (
    <div className="space-y-1.5">
      {check.regions.map((r) => {
        const sc = STATUS_CONFIG[r.status];
        return (
          <div
            key={r.id}
            className="flex items-center gap-3 p-2 rounded-lg"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid rgba(255,255,255,0.04)`,
            }}
          >
            <span className="text-[9px] font-mono w-8 shrink-0" style={{ color: sc.color }}>
              {r.code}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px]" style={{ color: DS.text.muted }}>
                  {r.name}
                </span>
                <span
                  className="text-[9px] font-mono"
                  style={{
                    color: r.latencyMs > 300 ? '#f97316' : r.latencyMs > 150 ? GOLD : '#10b981',
                  }}
                >
                  {r.latencyMs}ms
                </span>
              </div>
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (r.latencyMs / 600) * 100)}%`,
                    background: sc.color,
                  }}
                />
              </div>
            </div>
            <sc.icon className="w-3 h-3 shrink-0" style={{ color: sc.color }} />
          </div>
        );
      })}
    </div>
  );
}

export default function SyntheticMonitoring() {
  const [selected, setSelected] = useState<SyntheticCheck>(CHECKS[0]);
  const [tab, setTab] = useState<'overview' | 'regions' | 'history'>('overview');

  const passing = CHECKS.filter((c) => c.status === 'passing').length;
  const failing = CHECKS.filter((c) => c.status === 'failing').length;
  const degraded = CHECKS.filter((c) => c.status === 'degraded').length;
  const avgUptime = (CHECKS.reduce((a, c) => a + c.uptime30d, 0) / CHECKS.length).toFixed(2);

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-5" style={{ background: '#080c14' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>
              Synthetic Monitoring
            </h1>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>
            HTTP/API/SSL checks scheduled from 5 regions. Availability and latency monitoring before
            users notice degradation.
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium shrink-0"
          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}
        >
          <Plus className="w-3.5 h-3.5" /> New Check
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Passing', value: passing, color: '#10b981', icon: CheckCircle },
          { label: 'Failing', value: failing, color: '#ef4444', icon: AlertTriangle },
          { label: 'Degraded', value: degraded, color: GOLD, icon: Clock },
          { label: 'Avg Uptime (30d)', value: `${avgUptime}%`, color: '#3b82f6', icon: BarChart3 },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[9px] uppercase tracking-widest"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </span>
              <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
            </div>
            <div className="text-[20px] font-bold font-mono" style={{ color: k.color }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        <div className="space-y-2">
          <div
            className="text-[9px] uppercase tracking-widest px-1"
            style={{ color: DS.text.muted }}
          >
            Synthetic Checks
          </div>
          {CHECKS.map((check) => {
            const sc = STATUS_CONFIG[check.status];
            const tc = TYPE_CONFIG[check.type];
            return (
              <button
                key={check.id}
                onClick={() => setSelected(check)}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  background: selected.id === check.id ? `${sc.color}06` : DS.surface,
                  border: `1px solid ${selected.id === check.id ? `${sc.color}30` : DS.border}`,
                }}
              >
                <div className="flex items-start gap-2 mb-1.5">
                  <sc.icon className="w-3 h-3 shrink-0 mt-0.5" style={{ color: sc.color }} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[10px] font-semibold truncate"
                      style={{ color: DS.text.primary }}
                    >
                      {check.name}
                    </div>
                    <div
                      className="text-[8px] font-mono truncate mt-0.5"
                      style={{ color: DS.text.muted }}
                    >
                      {check.url}
                    </div>
                  </div>
                  <span
                    className="text-[7px] px-1 rounded font-mono shrink-0"
                    style={{ background: `${tc.color}12`, color: tc.color }}
                  >
                    {tc.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[9px]">
                  <span className="font-mono" style={{ color: sc.color }}>
                    {sc.label}
                  </span>
                  <span style={{ color: DS.text.muted }}>{check.uptime30d}% up</span>
                  <span
                    className="font-mono"
                    style={{ color: check.lastCheckMs > 300 ? '#f97316' : DS.text.secondary }}
                  >
                    {check.lastCheckMs}ms
                  </span>
                </div>
                <div className="mt-1.5">
                  <MiniHistogram history={check.responseHistory.slice(-12)} />
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: DS.border, background: DS.surface }}
        >
          <div className="p-4 border-b" style={{ borderColor: DS.border }}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                    style={{
                      background: `${TYPE_CONFIG[selected.type].color}12`,
                      color: TYPE_CONFIG[selected.type].color,
                    }}
                  >
                    {TYPE_CONFIG[selected.type].label}
                  </span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                    style={{
                      background: `${STATUS_CONFIG[selected.status].color}12`,
                      color: STATUS_CONFIG[selected.status].color,
                    }}
                  >
                    {STATUS_CONFIG[selected.status].label}
                  </span>
                  <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                    Every {selected.interval}s · {selected.assertionCount} assertions
                  </span>
                </div>
                <h2 className="text-[13px] font-semibold" style={{ color: DS.text.primary }}>
                  {selected.name}
                </h2>
                <div className="text-[9px] font-mono mt-0.5" style={{ color: DS.text.muted }}>
                  {selected.url}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="text-right">
                  <div
                    className="text-[13px] font-bold font-mono"
                    style={{
                      color:
                        selected.uptime30d > 99.9
                          ? '#10b981'
                          : selected.uptime30d > 99
                            ? GOLD
                            : '#ef4444',
                    }}
                  >
                    {selected.uptime30d}%
                  </div>
                  <div className="text-[8px]" style={{ color: DS.text.muted }}>
                    30d uptime
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[9px]" style={{ color: DS.text.muted }}>
              <span>
                Last check:{' '}
                <span style={{ color: DS.text.secondary }}>{selected.lastCheckMs}ms</span>
              </span>
              <span>{selected.lastCheckTime}</span>
              <span>
                Alert policy: <span style={{ color: GOLD }}>{selected.alertPolicy}</span>
              </span>
              {selected.tags
                .filter((t) => t !== 'ok')
                .map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded text-[7px] font-mono"
                    style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                  >
                    #{t}
                  </span>
                ))}
            </div>
          </div>

          <div className="flex border-b" style={{ borderColor: DS.border }}>
            {(['overview', 'regions', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 text-[10px] px-4 py-2 capitalize font-medium transition-all"
                style={{
                  color: tab === t ? GOLD : DS.text.muted,
                  borderBottom: `2px solid ${tab === t ? GOLD : 'transparent'}`,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-4">
            {tab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'P50 Latency',
                      value: `${selected.lastCheckMs}ms`,
                      color: selected.lastCheckMs > 300 ? '#f97316' : '#10b981',
                    },
                    {
                      label: 'P95 Latency',
                      value: `${Math.round(selected.lastCheckMs * 1.8)}ms`,
                      color: selected.lastCheckMs * 1.8 > 500 ? '#f97316' : GOLD,
                    },
                    {
                      label: 'P99 Latency',
                      value: `${Math.round(selected.lastCheckMs * 2.4)}ms`,
                      color: selected.lastCheckMs * 2.4 > 1000 ? '#ef4444' : GOLD,
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="p-3 rounded-lg text-center"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}
                    >
                      <div className="text-[14px] font-mono font-bold" style={{ color: m.color }}>
                        {m.value}
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: DS.text.muted }}>
                        {m.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div
                    className="text-[9px] uppercase tracking-widest mb-2"
                    style={{ color: DS.text.muted }}
                  >
                    24h Response Time
                  </div>
                  <MiniHistogram history={selected.responseHistory} />
                  <div
                    className="flex justify-between mt-1 text-[8px]"
                    style={{ color: DS.text.muted }}
                  >
                    <span>24h ago</span>
                    <span>Now</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[8px]">
                      <span className="w-2 h-2 rounded-sm" style={{ background: '#10b981' }} />
                      OK
                    </div>
                    <div className="flex items-center gap-1 text-[8px]">
                      <span className="w-2 h-2 rounded-sm" style={{ background: GOLD }} />
                      Slow
                    </div>
                    <div className="flex items-center gap-1 text-[8px]">
                      <span className="w-2 h-2 rounded-sm" style={{ background: '#ef4444' }} />
                      Error
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    className="text-[9px] uppercase tracking-widest mb-2"
                    style={{ color: DS.text.muted }}
                  >
                    SLA Report
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        period: '24h',
                        uptime: (
                          100 -
                          (selected.responseHistory.filter((h) => !h.ok).length /
                            selected.responseHistory.length) *
                            100
                        ).toFixed(2),
                      },
                      {
                        period: '7d',
                        uptime: (selected.uptime30d + (Math.random() - 0.5) * 0.1).toFixed(2),
                      },
                      { period: '30d', uptime: selected.uptime30d.toFixed(2) },
                      {
                        period: '90d',
                        uptime: (selected.uptime30d - Math.random() * 0.05).toFixed(2),
                      },
                    ].map((s) => {
                      const val = parseFloat(s.uptime);
                      const color = val > 99.9 ? '#10b981' : val > 99 ? GOLD : '#ef4444';
                      return (
                        <div
                          key={s.period}
                          className="p-2 rounded text-center"
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: `1px solid rgba(255,255,255,0.04)`,
                          }}
                        >
                          <div className="text-[11px] font-mono font-bold" style={{ color }}>
                            {s.uptime}%
                          </div>
                          <div className="text-[8px]" style={{ color: DS.text.muted }}>
                            {s.period} uptime
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {tab === 'regions' && (
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-3"
                  style={{ color: DS.text.muted }}
                >
                  Multi-Region Latency — {REGIONS.length} locations
                </div>
                <RegionMap check={selected} />
                <div
                  className="mt-4 p-3 rounded-lg text-[9px]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="font-mono font-bold mb-1" style={{ color: DS.text.secondary }}>
                    Latency Budget
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span style={{ color: '#10b981' }}>≤150ms</span>{' '}
                      <span style={{ color: DS.text.muted }}>Excellent</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span style={{ color: GOLD }}>≤300ms</span>{' '}
                      <span style={{ color: DS.text.muted }}>Acceptable</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span style={{ color: '#ef4444' }}>&gt;300ms</span>{' '}
                      <span style={{ color: DS.text.muted }}>Alert</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'history' && (
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-3"
                  style={{ color: DS.text.muted }}
                >
                  Response Time History (24h)
                </div>
                <div className="space-y-1">
                  {selected.responseHistory
                    .filter((_, i) => i % 4 === 0)
                    .map((h, i) => (
                      <div key={i} className="flex items-center gap-3 text-[9px]">
                        <span className="font-mono w-8 shrink-0" style={{ color: DS.text.muted }}>
                          {h.t}
                        </span>
                        <div
                          className="flex-1 h-3 rounded-sm overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, (h.ms / 800) * 100)}%`,
                              background: !h.ok ? '#ef4444' : h.ms > 300 ? GOLD : '#10b981',
                              opacity: 0.6,
                            }}
                          />
                        </div>
                        <span
                          className="font-mono w-14 text-right shrink-0"
                          style={{ color: !h.ok ? '#ef4444' : DS.text.secondary }}
                        >
                          {h.ms}ms
                        </span>
                        <span
                          className="w-3 shrink-0"
                          style={{ color: h.ok ? '#10b981' : '#ef4444' }}
                        >
                          {h.ok ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
