import {
  Brain,
  Code,
  TrendingUp,
} from 'lucide-react';
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

type Severity = 'critical' | 'high' | 'medium' | 'info';

interface PerfRegression {
  id: string;
  endpoint: string;
  service: string;
  deploy: string;
  deployedAt: number;
  team: string;
  severity: Severity;
  metric: string;
  before: string;
  after: string;
  delta: string;
  likelyCause: string;
  suggestedFix: string;
  codeRef: string;
  status: 'open' | 'investigating' | 'fixed' | 'wont_fix';
}

const SEV_COLOR: Record<Severity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: GOLD,
  info: '#3b82f6',
};

const REGRESSIONS: PerfRegression[] = [
  {
    id: 'PERF-0821',
    endpoint: 'POST /api/v2/orders',
    service: 'order-processor',
    deploy: 'v2.15.0',
    deployedAt: Date.now() - 1000 * 60 * 45,
    team: 'Commerce',
    severity: 'critical',
    metric: 'P99 Latency',
    before: '94ms',
    after: '847ms',
    delta: '+800% vs baseline',
    likelyCause:
      'New inventory validation loop performs N+1 SQL queries per order line item. 12-item order = 13 queries vs previous 1 batch query.',
    suggestedFix:
      'Batch the inventory check into a single SELECT with IN clause. Pre-existing CartService.validateItems() supports batch mode — use it.',
    codeRef: 'order-processor/src/services/OrderService.ts:148',
    status: 'open',
  },
  {
    id: 'PERF-0820',
    endpoint: 'GET /api/v1/products/:id',
    service: 'catalog-service',
    deploy: 'v1.8.2',
    deployedAt: Date.now() - 1000 * 60 * 60 * 3,
    team: 'Catalog',
    severity: 'high',
    metric: 'P99 Latency',
    before: '12ms',
    after: '48ms',
    delta: '+300%',
    likelyCause:
      'Redis cache TTL reduced from 60s → 5s in v1.8.2 config change. Cache hit rate dropped from 94% → 41% causing increased DB reads.',
    suggestedFix:
      'Restore TTL to 60s minimum. Consider per-product invalidation on update instead of aggressive TTL reduction.',
    codeRef: 'catalog-service/src/config/cache.config.ts:34',
    status: 'investigating',
  },
  {
    id: 'PERF-0819',
    endpoint: 'POST /api/v1/auth/token',
    service: 'user-auth',
    deploy: 'v3.0.1',
    deployedAt: Date.now() - 1000 * 60 * 60 * 6,
    team: 'Identity',
    severity: 'medium',
    metric: 'P50 Latency',
    before: '8ms',
    after: '22ms',
    delta: '+175%',
    likelyCause:
      'JWT signing algorithm upgraded from RS256 → RS512. Signature computation is 2.3x more CPU intensive with no equivalent security benefit for internal tokens.',
    suggestedFix:
      'Revert internal token signing to RS256. Reserve RS512 for external partner tokens only where the security requirement justifies the cost.',
    codeRef: 'user-auth/src/jwt/TokenSigner.ts:67',
    status: 'open',
  },
  {
    id: 'PERF-0817',
    endpoint: 'GET /api/v2/reports/monthly',
    service: 'reporting-service',
    deploy: 'v2.3.0',
    deployedAt: Date.now() - 1000 * 60 * 60 * 24,
    team: 'Data',
    severity: 'medium',
    metric: 'Error Rate',
    before: '0.02%',
    after: '4.8%',
    delta: '+240× error rate',
    likelyCause:
      'New report format requires data from 3 new joins. These queries timeout at 30s on large tenant datasets. Missing index on reports.tenant_id + month.',
    suggestedFix:
      'Add composite index: CREATE INDEX CONCURRENTLY idx_reports_tenant_month ON reports(tenant_id, report_month). Estimated 95% query time reduction.',
    codeRef: 'reporting-service/migrations/0042_add_report_format.sql',
    status: 'fixed',
  },
  {
    id: 'PERF-0815',
    endpoint: 'GET /api/v1/users/profile',
    service: 'user-service',
    deploy: 'v4.1.0',
    deployedAt: Date.now() - 1000 * 60 * 60 * 48,
    team: 'Identity',
    severity: 'info',
    metric: 'Memory Usage',
    before: '48MB avg',
    after: '91MB avg',
    delta: '+89% per instance',
    likelyCause:
      'New profile avatar processing holds full image in memory during resize. For the 4% of users who have avatars, this doubles per-request memory.',
    suggestedFix:
      'Use streaming image processing (sharp) instead of loading full buffer. Reduces memory from O(n) to O(chunk) with no quality change.',
    codeRef: 'user-service/src/handlers/ProfileHandler.ts:212',
    status: 'open',
  },
];

const DEPLOY_HEALTH = [
  {
    deploy: 'v2.15.0',
    service: 'order-processor',
    regressions: 1,
    score: 42,
    risk: 'critical' as const,
  },
  {
    deploy: 'v1.8.2',
    service: 'catalog-service',
    regressions: 1,
    score: 71,
    risk: 'high' as const,
  },
  { deploy: 'v3.0.1', service: 'user-auth', regressions: 1, score: 78, risk: 'medium' as const },
  {
    deploy: 'v4.2.0',
    service: 'notification-service',
    regressions: 0,
    score: 98,
    risk: 'info' as const,
  },
];

function StatusBadge({ status }: { status: PerfRegression['status'] }) {
  const map = {
    open: ['#ef4444', 'Open'],
    investigating: [GOLD, 'Investigating'],
    fixed: ['#10b981', 'Fixed'],
    wont_fix: [DS.text.muted, "Won't Fix"],
  };
  const [color, label] = map[status];
  return (
    <span
      className="text-[8px] px-1.5 py-0.5 rounded font-mono"
      style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}
    >
      {label}
    </span>
  );
}

export default function DevFeedback() {
  const [selected, setSelected] = useState<PerfRegression>(REGRESSIONS[0]);

  const open = REGRESSIONS.filter(
    (r) => r.status === 'open' || r.status === 'investigating',
  ).length;
  const critical = REGRESSIONS.filter((r) => r.severity === 'critical').length;

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
            Observability-Driven Dev Feedback
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
            Production observability insights fed back to dev teams as automated performance
            regression analysis and fix suggestions
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Open Regressions', value: open, color: '#f97316' },
            { label: 'Critical', value: critical, color: '#ef4444' },
            { label: 'Deploys Analyzed', value: DEPLOY_HEALTH.length, color: DS.text.primary },
            { label: 'Fixed This Week', value: 3, color: '#10b981' },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg p-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: DS.text.muted }}
              >
                {k.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: k.color }}>
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Deploy health */}
        <div
          className="rounded-lg p-4"
          style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
        >
          <div
            className="text-[10px] uppercase tracking-widest font-medium mb-3"
            style={{ color: DS.text.muted }}
          >
            Deploy Observability Health
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEPLOY_HEALTH.map((d) => {
              const color = SEV_COLOR[d.risk];
              return (
                <div
                  key={d.deploy}
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${DS.border}` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[9px] font-mono font-bold"
                      style={{ color: DS.text.primary }}
                    >
                      {d.deploy}
                    </span>
                    <span className="text-[14px] font-bold font-mono" style={{ color }}>
                      {d.score}
                    </span>
                  </div>
                  <div className="text-[9px] mb-2" style={{ color: DS.text.muted }}>
                    {d.service}
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.score}%`, background: color }}
                    />
                  </div>
                  <div className="mt-1 text-[9px]" style={{ color }}>
                    {d.regressions === 0
                      ? '✓ No regressions'
                      : `${d.regressions} regression${d.regressions > 1 ? 's' : ''}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Regression list */}
          <div className="space-y-2">
            <div
              className="text-[9px] uppercase tracking-widest px-1 mb-2"
              style={{ color: DS.text.muted }}
            >
              Performance Regressions
            </div>
            {REGRESSIONS.map((r) => {
              const since = Math.floor((Date.now() - r.deployedAt) / 60000);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background: selected.id === r.id ? `${SEV_COLOR[r.severity]}08` : DS.surface,
                    border: `1px solid ${selected.id === r.id ? `${SEV_COLOR[r.severity]}30` : DS.border}`,
                  }}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: SEV_COLOR[r.severity] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-[10px] font-mono font-semibold truncate mb-0.5"
                        style={{ color: DS.text.primary }}
                      >
                        {r.endpoint}
                      </div>
                      <div className="flex items-center gap-2 text-[9px]">
                        <span style={{ color: SEV_COLOR[r.severity] }}>{r.delta}</span>
                        <span style={{ color: DS.text.muted }}>{r.service}</span>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="pl-4 text-[9px] font-mono" style={{ color: DS.text.muted }}>
                    {r.deploy} · {since}m ago
                  </div>
                </button>
              );
            })}
          </div>

          {/* Regression detail */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="p-4 border-b" style={{ borderColor: DS.border }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
                  {selected.id}
                </span>
                <span
                  className="text-[8px] px-1.5 py-0.5 rounded font-mono capitalize"
                  style={{
                    background: `${SEV_COLOR[selected.severity]}15`,
                    color: SEV_COLOR[selected.severity],
                  }}
                >
                  {selected.severity}
                </span>
                <StatusBadge status={selected.status} />
              </div>
              <div className="font-mono text-sm font-bold mb-1" style={{ color: DS.text.primary }}>
                {selected.endpoint}
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span style={{ color: DS.text.muted }}>
                  Service: <span style={{ color: DS.text.secondary }}>{selected.service}</span>
                </span>
                <span style={{ color: DS.text.muted }}>
                  Deploy:{' '}
                  <span className="font-mono" style={{ color: GOLD }}>
                    {selected.deploy}
                  </span>
                </span>
                <span style={{ color: DS.text.muted }}>
                  Team: <span style={{ color: DS.text.secondary }}>{selected.team}</span>
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Metric comparison */}
              <div>
                <div
                  className="text-[9px] uppercase tracking-widest mb-2"
                  style={{ color: DS.text.muted }}
                >
                  Metric Regression — {selected.metric}
                </div>
                <div
                  className="flex items-center gap-4 p-3 rounded-lg"
                  style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: '1px solid rgba(239,68,68,0.15)',
                  }}
                >
                  <div>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      Before {selected.deploy}
                    </div>
                    <div className="text-xl font-mono font-bold" style={{ color: '#10b981' }}>
                      {selected.before}
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5" style={{ color: '#ef4444' }} />
                  <div>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      After {selected.deploy}
                    </div>
                    <div className="text-xl font-mono font-bold" style={{ color: '#ef4444' }}>
                      {selected.after}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="text-[9px]" style={{ color: DS.text.muted }}>
                      Delta
                    </div>
                    <div
                      className="text-[13px] font-mono font-bold"
                      style={{ color: SEV_COLOR[selected.severity] }}
                    >
                      {selected.delta}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Root cause */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  <div
                    className="text-[9px] uppercase tracking-widest"
                    style={{ color: DS.text.muted }}
                  >
                    AI Root Cause Analysis
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(212,160,84,0.05)', border: `1px solid ${GOLD}20` }}
                >
                  <p className="text-[11px] leading-relaxed" style={{ color: DS.text.secondary }}>
                    {selected.likelyCause}
                  </p>
                </div>
              </div>

              {/* Suggested fix */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                  <div
                    className="text-[9px] uppercase tracking-widest"
                    style={{ color: DS.text.muted }}
                  >
                    Suggested Fix
                  </div>
                </div>
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.15)',
                  }}
                >
                  <p
                    className="text-[11px] leading-relaxed mb-2"
                    style={{ color: DS.text.secondary }}
                  >
                    {selected.suggestedFix}
                  </p>
                  <div
                    className="text-[9px] font-mono px-2 py-1 rounded"
                    style={{ background: 'rgba(255,255,255,0.03)', color: DS.text.muted }}
                  >
                    📄 {selected.codeRef}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded text-[10px] font-medium"
                  style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}20`, color: GOLD }}
                >
                  Create Jira Ticket
                </button>
                <button
                  className="flex-1 py-2 rounded text-[10px] font-medium"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10b981',
                  }}
                >
                  Mark Investigating
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
