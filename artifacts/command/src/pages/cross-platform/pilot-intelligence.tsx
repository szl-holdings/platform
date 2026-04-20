import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Activity, AlertTriangle, ArrowLeft, CheckCircle, Clock, MinusCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'wouter';
import { apiUrl, fetchJson } from '../cognitive/shared';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const STATUS_META: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
  active: { color: '#22c55e', icon: CheckCircle, label: 'Active' },
  'at-risk': { color: '#f59e0b', icon: AlertTriangle, label: 'At Risk' },
  degraded: { color: '#ef4444', icon: AlertTriangle, label: 'Degraded' },
  inactive: { color: '#64748b', icon: MinusCircle, label: 'Inactive' },
};

interface DomainAccount {
  accountId: string;
  domain: string;
  name: string;
  icon: string;
  color: string;
  drillBase: string;
  status: string;
  totalRuns: number;
  weeklyRuns: number;
  passRate: number | null;
  errorCount: number;
  agents: string[];
  lastRunAt: string | null;
  dataSource: string;
}

interface PipelineStats {
  totalDomains: number;
  activeDomains: number;
  atRisk: number;
  inactive: number;
  totalRuns: number;
  weeklyRuns: number;
}

interface PilotsResponse {
  accounts: DomainAccount[];
  pipeline: PipelineStats;
  total: number;
  liveData: boolean;
  dataSource: string;
}

const STATUS_FILTERS = ['all', 'active', 'at-risk', 'degraded', 'inactive'] as const;

export function PilotIntelligencePage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const params = new URLSearchParams({ limit: '100' });
  if (statusFilter !== 'all') params.set('status', statusFilter);

  const { data, isLoading, error } = useStandardQuery<PilotsResponse>({
    queryKey: ['cross-platform', 'pilots', statusFilter],
    queryFn: () => fetchJson<PilotsResponse>(apiUrl(`/cross-platform/pilots?${params}`)),
    staleTime: 30_000,
  });

  const accounts = data?.accounts ?? [];
  const pipeline = data?.pipeline;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#080c14', color: 'rgba(255,255,255,0.85)' }}
    >
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`${BASE}/strategy/cross-platform`}
            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <ArrowLeft className="w-3 h-3" />
            Correlations
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>/</span>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: '#8b7ac8' }} />
            <span className="text-sm font-semibold">Product Portfolio Intelligence</span>
          </div>
        </div>
        <div
          className="text-[9px] font-mono px-2 py-1 rounded"
          style={{
            background: 'rgba(34,197,94,0.08)',
            color: '#22c55e',
            border: '1px solid rgba(34,197,94,0.15)',
          }}
        >
          LIVE · trace-graph
        </div>
      </div>

      {pipeline && (
        <div className="px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label: 'Products', value: pipeline.totalDomains, color: '#8b7ac8' },
              { label: 'Active', value: pipeline.activeDomains, color: '#22c55e' },
              { label: 'At Risk', value: pipeline.atRisk, color: '#f59e0b' },
              { label: 'Inactive', value: pipeline.inactive, color: '#64748b' },
              {
                label: 'Total Runs',
                value: pipeline.totalRuns.toLocaleString(),
                color: 'rgba(255,255,255,0.6)',
              },
              {
                label: '7-Day Runs',
                value: pipeline.weeklyRuns.toLocaleString(),
                color: '#0ea5e9',
              },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-base font-bold font-mono" style={{ color: m.color }}>
                  {m.value}
                </div>
                <div
                  className="text-[8px] uppercase tracking-wide"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="px-6 py-2 border-b flex items-center gap-2"
        style={{ borderColor: 'rgba(255,255,255,0.04)' }}
      >
        {STATUS_FILTERS.map((sf) => {
          const active = statusFilter === sf;
          const meta = sf === 'all' ? null : STATUS_META[sf];
          const color = meta?.color ?? '#8b7ac8';
          return (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className="px-2.5 py-1 rounded text-[10px] font-semibold capitalize tracking-wide transition-all"
              style={{
                background: active ? `${color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? color + '40' : 'rgba(255,255,255,0.07)'}`,
                color: active ? color : 'rgba(255,255,255,0.35)',
              }}
            >
              {sf}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(139,122,200,0.2)', borderTopColor: '#8b7ac8' }}
            />
          </div>
        )}
        {error && (
          <div className="text-center py-12 text-sm" style={{ color: '#ef4444' }}>
            Failed to load portfolio intelligence
          </div>
        )}
        {!isLoading && !error && accounts.length === 0 && (
          <div className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
            No products match this filter
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((acct) => {
            const sm = STATUS_META[acct.status] ?? STATUS_META['inactive'];
            const StatusIcon = sm.icon;
            const passColor =
              acct.passRate === null
                ? '#64748b'
                : acct.passRate >= 90
                  ? '#22c55e'
                  : acct.passRate >= 70
                    ? '#f59e0b'
                    : '#ef4444';

            return (
              <div
                key={acct.accountId}
                className="rounded-lg p-4 flex flex-col gap-3"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${acct.status === 'at-risk' || acct.status === 'degraded' ? `${sm.color}22` : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{acct.icon}</span>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: acct.color }}>
                        {acct.name}
                      </div>
                      <div
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.25)' }}
                      >
                        {acct.domain}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusIcon className="w-3 h-3" style={{ color: sm.color }} />
                    <span className="text-[10px] font-mono" style={{ color: sm.color }}>
                      {sm.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div
                      className="text-[8px] uppercase tracking-wide mb-0.5"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      30-Day Runs
                    </div>
                    <div
                      className="text-sm font-mono font-bold"
                      style={{
                        color:
                          acct.totalRuns > 0 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)',
                      }}
                    >
                      {acct.totalRuns.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div
                      className="text-[8px] uppercase tracking-wide mb-0.5"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      7-Day Runs
                    </div>
                    <div
                      className="text-sm font-mono font-bold"
                      style={{ color: acct.weeklyRuns > 0 ? '#0ea5e9' : 'rgba(255,255,255,0.25)' }}
                    >
                      {acct.weeklyRuns.toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div
                      className="text-[8px] uppercase tracking-wide mb-0.5"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      Pass Rate
                    </div>
                    <div className="text-sm font-mono font-bold" style={{ color: passColor }}>
                      {acct.passRate !== null ? `${acct.passRate}%` : '—'}
                    </div>
                  </div>
                  <div className="rounded p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div
                      className="text-[8px] uppercase tracking-wide mb-0.5"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      Errors
                    </div>
                    <div
                      className="text-sm font-mono font-bold"
                      style={{ color: acct.errorCount > 0 ? '#ef4444' : 'rgba(255,255,255,0.25)' }}
                    >
                      {acct.errorCount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {acct.totalRuns > 0 && acct.passRate !== null && (
                  <div>
                    <div
                      className="w-full h-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(acct.passRate, 100)}%`, background: passColor }}
                      />
                    </div>
                    <div
                      className="text-[8px] font-mono mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {acct.passRate}% pass rate
                    </div>
                  </div>
                )}

                <div
                  className="flex items-center justify-between pt-1"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
                    {acct.lastRunAt
                      ? `Last run ${new Date(acct.lastRunAt).toLocaleDateString()}`
                      : 'No runs recorded'}
                  </div>
                  {acct.agents.length > 0 && (
                    <div
                      className="text-[9px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                      {acct.agents.length} agent{acct.agents.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  <a
                    href={`${BASE}${acct.drillBase}`}
                    className="text-[9px] font-mono hover:opacity-70 transition-opacity"
                    style={{ color: acct.color }}
                  >
                    View →
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
