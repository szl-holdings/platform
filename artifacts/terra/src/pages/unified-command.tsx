import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  Activity,
  ArrowRight,
  Clock,
  ExternalLink,
  Eye,
  GitBranch,
  Navigation,
  Ship,
  Zap,
} from 'lucide-react';

interface LyteAction {
  priority?: string;
  valueAtRisk?: number | string;
  title?: string;
  name?: string;
  category?: string;
  actionType?: string;
}

interface VesselEvent {
  severity?: string;
  consequenceImpactCents?: number | string;
  financialImpact?: number | string;
  title?: string;
  name?: string;
  eventType?: string;
  type?: string;
}

interface TerraSignal {
  signalType?: string;
  type?: string;
  status?: string;
  estimatedValue?: number | string;
  severity?: string;
  title?: string;
  name?: string;
}

interface Recommendation {
  id: string;
  domain: string;
  priority: string;
  text: string;
}

interface WorkflowRun {
  id: string;
  name: string;
  domain: string;
  status: string;
  completedAt: string | null;
}

const DOMAIN_LINKS = [
  {
    id: 'lyte',
    label: 'KORA',
    description: 'Business Observability',
    color: '#06b6d4',
    href: '/command/operations/',
    icon: Zap,
  },
  {
    id: 'vessels',
    label: 'SEXTANT',
    description: 'Maritime Command',
    color: '#3b82f6',
    href: '/vessels/',
    icon: Ship,
  },
  {
    id: 'terra',
    label: 'TERRA',
    description: 'Broker Platform',
    color: '#a07848',
    href: '/terra/',
    icon: Navigation,
  },
  {
    id: 'continuum',
    label: 'Counsel',
    description: 'Intelligence Engine',
    color: '#60a5fa',
    href: '/continuum/',
    icon: GitBranch,
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  lyte: 'text-amber-400',
  vessels: 'text-sky-400',
  terra: 'text-orange-400',
  continuum: 'text-cyan-400',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  watch: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

function formatCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
}

function formatTimeSince(isoDate: string | null): string {
  if (!isoDate) return 'Running';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function UnifiedCommandDashboard() {
  const {
    data: rawLyteActions,
    isPending: lyteLoading,
    isError: lyteError,
  } = useStandardQuery({
    queryKey: ['unified-lyte-actions'],
    queryFn: () => apiFetch<LyteAction[]>('/lyte/actions?state=new'),
  });

  const {
    data: rawVesselEvents,
    isPending: vesselLoading,
    isError: vesselError,
  } = useStandardQuery({
    queryKey: ['unified-vessel-events'],
    queryFn: () => apiFetch<VesselEvent[]>('/vessels/events?status=open'),
  });

  const {
    data: rawTerraSignals,
    isPending: terraLoading,
    isError: terraError,
  } = useStandardQuery({
    queryKey: ['unified-terra-signals'],
    queryFn: () => apiFetch<TerraSignal[]>('/terra/signals'),
  });

  const isLoading = lyteLoading || vesselLoading || terraLoading;
  const lyteActions: LyteAction[] = rawLyteActions ?? [];
  const vesselEvents: VesselEvent[] = rawVesselEvents ?? [];
  const terraSignals: TerraSignal[] = rawTerraSignals ?? [];

  const data = {
    lyte: {
      openActions: lyteActions.length,
      escalated: lyteActions.filter((a) => a.priority === 'critical' || a.priority === 'urgent')
        .length,
      valueAtRisk: lyteActions.reduce((sum, a) => sum + (Number(a.valueAtRisk) || 0), 0),
      topActions: lyteActions.slice(0, 3).map((a) => ({
        title: a.title ?? a.name ?? 'Untitled action',
        priority: a.priority ?? 'medium',
        category: a.category ?? a.actionType ?? '',
        valueAtRisk: Number(a.valueAtRisk) || 0,
      })),
    },
    vessels: {
      criticalEvents: vesselEvents.filter((e) => e.severity === 'critical').length,
      openExceptions: vesselEvents.length,
      consequenceImpact: vesselEvents.reduce(
        (sum, e) => sum + Number(e.consequenceImpactCents ?? e.financialImpact ?? 0) / 100,
        0,
      ),
      topEvents: vesselEvents.slice(0, 3).map((e) => ({
        title: e.title ?? e.name ?? 'Untitled event',
        severity: e.severity ?? 'warning',
        type: e.eventType ?? e.type ?? '',
        impact: Number(e.consequenceImpactCents ?? 0) / 100,
      })),
    },
    terra: {
      activeListings: terraSignals.filter((s) => s.signalType === 'listing' || s.type === 'listing')
        .length,
      stalledDeals: terraSignals.filter((s) => s.signalType === 'stall' || s.status === 'stalled')
        .length,
      pipelineValue: terraSignals.reduce((sum, s) => sum + Number(s.estimatedValue ?? 0), 0),
      topSignals: terraSignals.slice(0, 3).map((s) => ({
        title: s.title ?? s.name ?? 'Untitled signal',
        severity: s.severity ?? 'warning',
        type: s.signalType ?? s.type ?? '',
        impact: Number(s.estimatedValue ?? 0),
      })),
    },
    workflows: { recentRuns: [] as WorkflowRun[] },
    recommendations: [
      ...lyteActions.slice(0, 2).map((a, i) => ({
        id: `lyte-${String((a as Record<string,unknown>).id ?? i)}`,
        domain: 'lyte' as const,
        priority: (a.priority as string) ?? 'high',
        text: (a.title ?? (a as Record<string,unknown>).name ?? 'KORA action requires attention') as string,
      })),
      ...vesselEvents.slice(0, 1).map((e, i) => ({
        id: `vessel-${String((e as Record<string,unknown>).id ?? i)}`,
        domain: 'vessels' as const,
        priority: (e.severity as string) ?? 'medium',
        text: (e.title ?? (e as Record<string,unknown>).name ?? 'Vessel event requires review') as string,
      })),
      ...terraSignals.slice(0, 1).map((s, i) => ({
        id: `terra-${String((s as Record<string,unknown>).id ?? i)}`,
        domain: 'terra' as const,
        priority: (s.severity as string) ?? 'medium',
        text: (s.title ?? (s as Record<string,unknown>).name ?? 'Terra signal detected') as string,
      })),
    ],
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Eye className="w-6 h-6 text-sky-400" />
            Unified Command
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cross-domain intelligence — highest priority items across KORA, SEXTANT, and TERRA
          </p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500">
          {isLoading ? (
            <>
              <Clock className="w-3 h-3 animate-spin text-slate-500" />
              Loading…
            </>
          ) : (lyteError || vesselError || terraError) ? (
            <>
              <Activity className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400">Partial data</span>
            </>
          ) : (
            <>
              <Activity className="w-3 h-3 text-emerald-400" />
              Live
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {DOMAIN_LINKS.map(({ id, label, description, color, href, icon: Icon }) => (
          <a
            key={id}
            href={href}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:opacity-80"
            style={{ borderColor: `${color}40`, background: `${color}10`, color }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className="text-[10px] opacity-60">{description}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-xl border p-4 cursor-pointer hover:opacity-90 transition-all"
          style={{ borderColor: '#f59e0b40', background: '#f59e0b08' }}
          onClick={() => (window.location.href = '/command/operations/')}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">KORA — Business Command</span>
            {lyteError && <span className="ml-auto text-[10px] text-amber-600 font-normal">API error</span>}
            {lyteLoading && <span className="ml-auto text-[10px] text-slate-500 font-normal">Loading…</span>}
          </div>
          {lyteError && !lyteLoading ? (
            <div className="text-[11px] text-amber-600/70 py-4 text-center">KORA data unavailable — API error</div>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-2xl font-bold text-amber-400">{data.lyte.openActions}</div>
              <div className="text-[10px] text-slate-500">Open Actions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{data.lyte.escalated}</div>
              <div className="text-[10px] text-slate-500">Escalated</div>
            </div>
          </div>
          <div className="text-xs text-amber-400 font-medium">
            {formatCurrency(data.lyte.valueAtRisk)} value at risk
          </div>
          <div className="mt-3 space-y-1.5">
            {data.lyte.topActions.map((action, i) => (
              <div key={i} className="text-[10px] flex items-center gap-1.5 text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${action.priority === 'urgent' ? 'bg-red-400' : 'bg-orange-400'}`} />
                <span className="truncate">{action.title}</span>
                <span className="ml-auto text-amber-400/80 flex-shrink-0">{formatCurrency(action.valueAtRisk)}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        <div
          className="rounded-xl border p-4 cursor-pointer hover:opacity-90 transition-all"
          style={{ borderColor: '#4d8fcc40', background: '#4d8fcc08' }}
          onClick={() => (window.location.href = '/vessels/')}
        >
          <div className="flex items-center gap-2 mb-3">
            <Ship className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-semibold text-sky-400">SEXTANT — Maritime Command</span>
            {vesselError && <span className="ml-auto text-[10px] text-sky-600 font-normal">API error</span>}
            {vesselLoading && <span className="ml-auto text-[10px] text-slate-500 font-normal">Loading…</span>}
          </div>
          {vesselError && !vesselLoading ? (
            <div className="text-[11px] text-sky-600/70 py-4 text-center">SEXTANT data unavailable — API error</div>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <div className="text-2xl font-bold text-red-400">{data.vessels.criticalEvents}</div>
              <div className="text-[10px] text-slate-500">Critical Events</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">{data.vessels.openExceptions}</div>
              <div className="text-[10px] text-slate-500">Open Exceptions</div>
            </div>
          </div>
          <div className="text-xs text-sky-400 font-medium">
            {formatCurrency(data.vessels.consequenceImpact)} consequence impact
          </div>
          <div className="mt-3 space-y-1.5">
            {data.vessels.topEvents.map((ev, i) => (
              <div key={i} className="text-[10px] flex items-center gap-1.5 text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.severity === 'critical' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <span className="truncate">{ev.title}</span>
                {ev.impact > 0 && <span className="ml-auto text-sky-400/80 flex-shrink-0">{formatCurrency(ev.impact)}</span>}
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        <div
          className="rounded-xl border p-4 cursor-pointer hover:opacity-90 transition-all"
          style={{ borderColor: '#a0784840', background: '#a0784808' }}
          onClick={() => (window.location.href = '/terra/')}
        >
          <div className="flex items-center gap-2 mb-3">
            <Navigation className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">TERRA — Broker Platform</span>
            {terraError && <span className="ml-auto text-[10px] text-orange-600 font-normal">API error</span>}
            {terraLoading && <span className="ml-auto text-[10px] text-slate-500 font-normal">Loading…</span>}
          </div>
          {terraError && !terraLoading ? (
            <div className="text-[11px] text-orange-600/70 py-4 text-center">TERRA data unavailable — API error</div>
          ) : (
          <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <div className="text-2xl font-bold text-orange-400">{data.terra.activeListings}</div>
              <div className="text-[10px] text-slate-500">Active Listings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{data.terra.stalledDeals}</div>
              <div className="text-[10px] text-slate-500">Stalled Deals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{formatCurrency(data.terra.pipelineValue)}</div>
              <div className="text-[10px] text-slate-500">Pipeline</div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {data.terra.topSignals.map((s, i) => (
              <div key={i} className="text-[10px] flex items-center gap-1.5 text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.severity === 'critical' ? 'bg-red-400' : 'bg-orange-400'}`} />
                <span className="truncate">{s.title}</span>
                {s.impact > 0 && <span className="ml-auto text-orange-400/80 flex-shrink-0">{formatCurrency(s.impact)}</span>}
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">AI Recommendation Feed</span>
          </div>
          <div className="space-y-3">
            {data.recommendations.length === 0 && (
              <p className="text-[11px] text-slate-500 py-2">No recommendations available — connect domain APIs to generate live recommendations.</p>
            )}
            {data.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${DOMAIN_COLORS[rec.domain] ? `bg-${rec.domain === 'lyte' ? 'amber' : rec.domain === 'vessels' ? 'sky' : 'orange'}-500/10` : ''}`}
                >
                  {rec.domain === 'lyte' ? (
                    <Zap className="w-3 h-3 text-amber-400" />
                  ) : rec.domain === 'vessels' ? (
                    <Ship className="w-3 h-3 text-sky-400" />
                  ) : (
                    <Navigation className="w-3 h-3 text-orange-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[rec.priority] || ''}`}
                    >
                      {rec.priority}
                    </span>
                    <span
                      className={`text-[10px] font-medium capitalize ${DOMAIN_COLORS[rec.domain] || 'text-slate-400'}`}
                    >
                      {rec.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-white">Recent Workflow Runs</span>
            <a
              href="/continuum"
              className="ml-auto text-[10px] text-cyan-400 flex items-center gap-1 hover:opacity-80"
            >
              View All <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="space-y-2.5">
            {data.workflows.recentRuns.length === 0 && (
              <p className="text-[11px] text-slate-500 py-2">No recent workflow runs — workflow history will appear here once runs complete.</p>
            )}
            {data.workflows.recentRuns.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${wf.status === 'completed' ? 'bg-emerald-400' : wf.status === 'in_progress' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-400'}`}
                  />
                  <div>
                    <div className="text-xs text-white font-medium">{wf.name}</div>
                    <div
                      className={`text-[10px] capitalize ${DOMAIN_COLORS[wf.domain] || 'text-slate-400'}`}
                    >
                      {wf.domain}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 flex-shrink-0">
                  {wf.status === 'in_progress' ? (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Running
                    </span>
                  ) : (
                    <span>{formatTimeSince(wf.completedAt)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <div className="text-[10px] text-slate-500 mb-2 font-medium uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'View KORA Action Queue', href: '/command/operations/action-queue' },
                { label: 'SEXTANT Exceptions', href: '/vessels/exceptions' },
                { label: 'TERRA Listings', href: '/terra/listings' },
                { label: 'Counsel Workflows', href: '/continuum/' },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="text-[10px] px-2 py-1 rounded border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-1"
                >
                  {label}
                  <ArrowRight className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
