import { useStandardQuery } from '@szl-holdings/api-client-react';
import { type ActivationStep, ActivationBanner, useActivationState } from '@szl-holdings/shared-ui/onboarding';
import { cn } from '@szl-holdings/shared-ui/utils';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  BarChart3,
  BookmarkIcon,
  CheckCircle,
  Flame,
  Handshake,
  MapPin,
  Target,
  type TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback } from 'react';
import { useLocation } from 'wouter';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? '';
const API = '/api';

function fetchJson(path: string) {
  return fetch(`${API}${path}`)
    .then((r) => r.json())
    .then((d) => d.data ?? d);
}

function useOverview() {
  return useStandardQuery({
    queryKey: ['terra-broker-overview'],
    queryFn: () => fetchJson('/terra/broker/overview'),
    refetchInterval: 60000,
  });
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: typeof TrendingUp;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-terra-surface/60 p-4',
        highlight ? 'border-terra-primary/30' : 'border-terra-border',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-terra-text-muted uppercase tracking-wider">
          {label}
        </p>
        <div className={cn('p-1.5 rounded-lg', color)}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <p
        className={cn(
          'text-2xl font-display font-bold',
          highlight ? 'text-terra-primary' : 'text-terra-text',
        )}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-terra-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function BarRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-terra-text-secondary w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-terra-border rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-terra-text w-8 text-right">{value}</span>
    </div>
  );
}

const SCORE_COLORS: Record<string, string> = {
  '85-100': 'bg-emerald-500',
  '70-84': 'bg-blue-500',
  '55-69': 'bg-amber-500',
  '40-54': 'bg-orange-500',
  '0-39': 'bg-slate-500',
};

const SCORE_TEXT_COLORS: Record<string, string> = {
  '85-100': 'text-emerald-400',
  '70-84': 'text-blue-400',
  '55-69': 'text-amber-400',
  '40-54': 'text-orange-400',
  '0-39': 'text-slate-400',
};

export default function BrokerOverviewPage() {
  const { data, isLoading, error } = useOverview();
  const [, navigate] = useLocation();

  const activation = useActivationState({ apiBaseUrl: `${BASE}/api`, pollIntervalMs: 60_000 });

  const handleNavigate = useCallback(
    (href: string) => {
      const base = BASE.replace(/\/$/, '');
      navigate(href.startsWith(base) ? href.slice(base.length) || '/' : href);
    },
    [navigate],
  );

  const activationSteps: ActivationStep[] = [
    {
      id: 'connect-terra-data',
      label: 'Connect a property data source',
      description: 'Import MLS, public records, or distress lists to power the intelligence engine',
      completed: activation.signalSourceConnected,
      href: `${BASE}/settings/integrations`,
    },
    {
      id: 'configure-alerts',
      label: 'Configure distress alerts',
      description: 'Set thresholds for AVM variance, tax delinquency, and pre-foreclosure signals',
      completed: activation.workflowDeployed,
      href: `${BASE}/alerts`,
    },
    {
      id: 'invite-team',
      label: 'Invite a broker or analyst',
      description: 'Bring your team into TERRA to collaborate on deal flow',
      completed: activation.teamMemberInvited,
      href: `${BASE}/settings/team`,
    },
  ];

  const metrics = data?.metrics ?? {};
  const topBoroughs: Array<{ borough: string; count: number; avgScore: number }> =
    data?.topBoroughs ?? [];
  const scoreDist: Array<{ range: string; count: number }> = data?.scoreDistribution ?? [];
  const maxBoroughCount = Math.max(...topBoroughs.map((b: any) => b.count), 1);
  const maxScoreCount = Math.max(...scoreDist.map((s: any) => s.count), 1);

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-terra-text">Broker Overview</h1>
            <p className="text-sm text-terra-text-secondary mt-1">
              Distress intelligence pipeline — NYC / NYS brokerage command summary
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-terra-text-muted bg-terra-surface border border-terra-border px-3 py-1.5 rounded-lg">
            <Activity className="w-3 h-3" />
            Live — refreshes every 60s
          </div>
        </div>
      </motion.div>

      {!activation.isLoading && (
        <ActivationBanner
          steps={activationSteps}
          accentColor="#3d8a5e"
          storageKey="terra_activation_banner"
          variant="banner"
          onNavigate={handleNavigate}
        />
      )}

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-terra-border bg-terra-surface/40 p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-terra-border" />
                  <div className="h-2.5 bg-terra-border/60 rounded w-20" />
                </div>
                <div className="h-7 bg-terra-border rounded w-16 mb-1" />
                <div className="h-2 bg-terra-border/40 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded-xl border border-terra-border bg-terra-surface/40 animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <p className="text-sm text-red-400">
            Failed to load broker overview. Ensure the API is running.
          </p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <MetricCard
              label="Distress Opportunities"
              value={metrics.totalDistressOpportunities ?? 0}
              sub="Active in engine"
              icon={Flame}
              color="bg-orange-500"
              highlight
            />
            <MetricCard
              label="Saved Opportunities"
              value={metrics.savedOpportunities ?? 0}
              sub="Investor queue"
              icon={BookmarkIcon}
              color="bg-blue-500"
            />
            <MetricCard
              label="Leads in CRM"
              value={metrics.totalLeads ?? 0}
              sub="Active leads"
              icon={Users}
              color="bg-violet-500"
            />
            <MetricCard
              label="Converted Leads"
              value={metrics.convertedLeads ?? 0}
              sub={`${metrics.leadConversionRate ?? 0}% conversion rate`}
              icon={CheckCircle}
              color="bg-emerald-500"
            />
            <MetricCard
              label="Active Deals"
              value={metrics.totalDeals ?? 0}
              sub="In pipeline"
              icon={Handshake}
              color="bg-amber-500"
            />
            <MetricCard
              label="Closed Deals"
              value={metrics.closedDeals ?? 0}
              sub="All time"
              icon={Award}
              color="bg-terra-primary"
            />
            <MetricCard
              label="Pipeline Conversion"
              value={`${metrics.leadConversionRate ?? 0}%`}
              sub="Lead → Converted"
              icon={Target}
              color="bg-rose-500"
            />
            <MetricCard
              label="Borough Coverage"
              value={topBoroughs.length}
              sub="Active boroughs"
              icon={MapPin}
              color="bg-cyan-500"
            />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-terra-border bg-terra-surface/50 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-terra-primary" />
                <h2 className="text-sm font-display font-bold text-terra-text">Top Boroughs</h2>
                <span className="text-[10px] text-terra-text-muted ml-auto">by distress count</span>
              </div>
              {topBoroughs.length === 0 ? (
                <p className="text-xs text-terra-text-muted py-4 text-center">
                  No boroughs indexed — import property records to begin
                </p>
              ) : (
                <div className="space-y-1">
                  {topBoroughs.map((b: any) => (
                    <div key={b.borough}>
                      <BarRow
                        label={b.borough}
                        value={b.count}
                        max={maxBoroughCount}
                        color="bg-terra-primary"
                      />
                      <div className="ml-28 -mt-0.5 mb-1 text-[9px] text-terra-text-muted font-mono">
                        avg score {b.avgScore}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-xl border border-terra-border bg-terra-surface/50 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-display font-bold text-terra-text">
                  Score Distribution
                </h2>
                <span className="text-[10px] text-terra-text-muted ml-auto">
                  opportunity scores
                </span>
              </div>
              {scoreDist.length === 0 ? (
                <p className="text-xs text-terra-text-muted py-4 text-center">
                  No score data yet — import property records to populate
                </p>
              ) : (
                <div className="space-y-3">
                  {scoreDist.map((s: any) => (
                    <div key={s.range} className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-xs font-mono font-bold w-16 flex-shrink-0',
                          SCORE_TEXT_COLORS[s.range] ?? 'text-terra-text-muted',
                        )}
                      >
                        {s.range}
                      </span>
                      <div className="flex-1 h-5 bg-terra-border rounded overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded transition-all flex items-center pl-2',
                            SCORE_COLORS[s.range] ?? 'bg-slate-500',
                          )}
                          style={{
                            width: `${Math.max(4, Math.round((s.count / maxScoreCount) * 100))}%`,
                          }}
                        >
                          <span className="text-[9px] text-white font-bold">{s.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-terra-border bg-terra-surface/50 p-5"
          >
            <h2 className="text-sm font-display font-bold text-terra-text mb-4">
              Conversion Funnel
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                {
                  label: 'Distress Properties',
                  value: metrics.totalDistressOpportunities ?? 0,
                  color: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
                },
                { label: '→', value: null, color: '' },
                {
                  label: 'Leads',
                  value: metrics.totalLeads ?? 0,
                  color: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
                },
                { label: '→', value: null, color: '' },
                {
                  label: 'Converted',
                  value: metrics.convertedLeads ?? 0,
                  color: 'bg-violet-500/20 border-violet-500/30 text-violet-400',
                },
                { label: '→', value: null, color: '' },
                {
                  label: 'Deals',
                  value: metrics.totalDeals ?? 0,
                  color: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
                },
                { label: '→', value: null, color: '' },
                {
                  label: 'Closed',
                  value: metrics.closedDeals ?? 0,
                  color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
                },
              ].map((item, i) =>
                item.value === null ? (
                  <span key={i} className="text-terra-text-muted text-lg font-light">
                    {item.label}
                  </span>
                ) : (
                  <div
                    key={i}
                    className={cn(
                      'border rounded-xl px-4 py-3 flex-1 min-w-[100px] text-center',
                      item.color,
                    )}
                  >
                    <p className="text-xl font-display font-bold">{item.value}</p>
                    <p className="text-[10px] mt-0.5 opacity-80">{item.label}</p>
                  </div>
                ),
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
