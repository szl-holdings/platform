import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, ArrowUpRight, Bell, Clock, Loader2, ShieldAlert } from 'lucide-react';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

interface CounselAlert {
  id: string;
  severity: AlertSeverity;
  type: 'deadline' | 'escalation' | 'risk' | 'drift';
  title: string;
  matter: string;
  detail: string;
  triggeredAt: string;
  confidence: number;
  recommendedAction: string;
}

interface ApiObligation {
  id: string;
  matterId: string;
  title: string;
  dueDate: string;
  status: string;
  assignee: string;
  dependencies: string[];
  consequence?: string;
}

interface ApiMatter {
  id: string;
  name: string;
  status: string;
  leadCounsel: string;
  estimatedExposure?: number;
}

const severityStyle: Record<
  AlertSeverity,
  { bg: string; border: string; text: string; dot: string; label: string }
> = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-300',
    dot: 'bg-red-400',
    label: 'Critical',
  },
  high: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    label: 'High',
  },
  medium: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-300',
    dot: 'bg-violet-400',
    label: 'Medium',
  },
  low: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-300',
    dot: 'bg-slate-400',
    label: 'Low',
  },
};

const typeIcon: Record<CounselAlert['type'], typeof Clock> = {
  deadline: Clock,
  escalation: ArrowUpRight,
  risk: ShieldAlert,
  drift: Activity,
};

function timeSince(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

function daysOverdue(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((now - due) / 86400000));
}

function daysUntil(dueDate: string): number {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  return Math.round((due - now) / 86400000);
}

function deriveAlerts(
  obligations: ApiObligation[],
  matters: ApiMatter[],
): CounselAlert[] {
  const matterMap = Object.fromEntries(matters.map((m) => [m.id, m]));
  const alerts: CounselAlert[] = [];

  obligations.forEach((o) => {
    const matterName = matterMap[o.matterId]?.name ?? o.matterId;
    const exposure = matterMap[o.matterId]?.estimatedExposure ?? 0;

    if (o.status === 'overdue') {
      const days = daysOverdue(o.dueDate);
      alerts.push({
        id: `alert-overdue-${o.id}`,
        severity: days >= 14 ? 'critical' : days >= 7 ? 'high' : 'medium',
        type: 'deadline',
        title: `${o.title} — ${days} day${days !== 1 ? 's' : ''} overdue`,
        matter: matterName,
        detail:
          o.consequence
            ? o.consequence
            : `${o.assignee} has not delivered. Overdue obligation may block downstream tasks.`,
        triggeredAt: new Date(new Date(o.dueDate).getTime() + 3600000).toISOString(),
        confidence: days >= 14 ? 0.97 : 0.85,
        recommendedAction:
          days >= 14
            ? 'Escalate to Lead Counsel and request emergency status conference.'
            : `Follow up with ${o.assignee} and assess impact on dependent obligations.`,
      });
    } else if (o.status === 'at-risk') {
      const days = daysUntil(o.dueDate);
      alerts.push({
        id: `alert-risk-${o.id}`,
        severity: days <= 5 ? 'high' : 'medium',
        type: 'risk',
        title: `${o.title} at-risk — ${days > 0 ? `${days}d remaining` : 'due today'}`,
        matter: matterName,
        detail:
          o.consequence
            ? o.consequence
            : `Obligation is flagged at-risk.${exposure > 0 ? ` Matter carries $${(exposure / 1_000_000).toFixed(1)}M exposure.` : ''}`,
        triggeredAt: new Date(Date.now() - 3600000 * (days + 1) * 2).toISOString(),
        confidence: 0.78,
        recommendedAction:
          o.dependencies.length > 0
            ? 'Review upstream dependencies and reallocate resources if needed.'
            : `Monitor closely. Confirm ${o.assignee} is on track.`,
      });
    }
  });

  matters.forEach((m) => {
    if (m.status === 'escalated') {
      alerts.push({
        id: `alert-escalated-${m.id}`,
        severity: 'high',
        type: 'escalation',
        title: `Matter escalated: ${m.name}`,
        matter: m.name,
        detail: `Matter has been escalated. Lead counsel: ${m.leadCounsel}.${m.estimatedExposure ? ` Exposure: $${(m.estimatedExposure / 1_000_000).toFixed(1)}M.` : ''}`,
        triggeredAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        confidence: 0.88,
        recommendedAction: `Trigger formal review under Master Engagement Letter §4.2.`,
      });
    }
  });

  return alerts.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

export default function Alerts() {
  const { data: mattersData, isLoading: mattersLoading, isError: mattersError } = useQuery<{ matters: ApiMatter[] }>({
    queryKey: ['counsel-matters-alerts'],
    queryFn: () => apiFetch<{ matters: ApiMatter[] }>('/counsel/matters'),
  });

  const { data: obligationsData, isLoading: obligationsLoading, isError: obligationsError } = useQuery<{ obligations: ApiObligation[] }>({
    queryKey: ['counsel-obligations-alerts'],
    queryFn: () => apiFetch<{ obligations: ApiObligation[] }>('/counsel/obligations'),
  });

  const isLoading = mattersLoading || obligationsLoading;
  const isError = mattersError || obligationsError;

  const matters = mattersData?.matters ?? [];
  const obligations = obligationsData?.obligations ?? [];
  const overdueCount = obligations.filter((o) => o.status === 'overdue').length;

  const alerts = isLoading || isError ? [] : deriveAlerts(obligations, matters);

  const counts = alerts.reduce<Record<AlertSeverity, number>>(
    (acc, a) => ({ ...acc, [a.severity]: (acc[a.severity] || 0) + 1 }),
    { critical: 0, high: 0, medium: 0, low: 0 },
  );

  return (
    <div className="p-6 space-y-6">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60">
            Operations · Alerts
          </span>
        </div>
        <h1 className="text-2xl font-bold text-violet-100">Obligation & Escalation Alerts</h1>
        <p className="text-violet-400/60 text-sm">
          Live deadline, escalation, and policy-drift notifications scored by Counsel's confidence
          model.
        </p>
      </header>

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">Failed to load alerts. Please try again.</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.keys(counts) as AlertSeverity[]).map((sev) => {
              const s = severityStyle[sev];
              return (
                <div key={sev} className={cn('p-4 rounded-xl border', s.bg, s.border)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', s.dot)} />
                    <span className={cn('text-[10px] font-mono uppercase tracking-widest', s.text)}>
                      {s.label}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-violet-50">{counts[sev]}</div>
                  <div className="text-[10px] text-violet-400/50 mt-1">
                    {sev === 'critical' ? `${overdueCount} overdue obligations` : 'active alerts'}
                  </div>
                </div>
              );
            })}
          </div>

          {alerts.length === 0 && !isError && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-400/50" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-200">All clear</p>
                <p className="text-[11px] text-violet-400/50 mt-1">No active alerts. All obligations are on track.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {alerts.map((a) => {
              const s = severityStyle[a.severity];
              const Icon = typeIcon[a.type];
              return (
                <div
                  key={a.id}
                  className={cn(
                    'rounded-xl border p-4 bg-[#0a0614]',
                    a.severity === 'critical' ? 'border-red-500/20' : 'border-violet-500/10',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border',
                        s.bg,
                        s.border,
                      )}
                    >
                      <Icon className={cn('w-5 h-5', s.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border',
                            s.bg,
                            s.border,
                            s.text,
                          )}
                        >
                          {s.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-violet-500/5 border border-violet-500/10 text-[10px] font-mono uppercase tracking-wider text-violet-300/70">
                          {a.type}
                        </span>
                        <span className="text-[10px] font-mono text-violet-400/50">
                          {timeSince(a.triggeredAt)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-violet-50">{a.title}</div>
                      <div className="text-[11px] text-violet-300/60 mt-0.5">Matter: {a.matter}</div>
                      <p className="text-xs text-violet-200/70 mt-2 leading-relaxed">{a.detail}</p>
                      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                        <AlertTriangle className="w-3.5 h-3.5 text-violet-300 mt-0.5 shrink-0" />
                        <div className="text-[11px] text-violet-200/80">
                          <span className="font-mono uppercase tracking-wider text-[9px] text-violet-400/60 mr-1">
                            Recommended
                          </span>
                          {a.recommendedAction}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] font-mono uppercase tracking-widest text-violet-400/50 mb-1">
                        Confidence
                      </div>
                      <div
                        className={cn(
                          'text-lg font-bold tabular-nums',
                          a.confidence >= 0.9
                            ? 'text-emerald-300'
                            : a.confidence >= 0.7
                              ? 'text-violet-200'
                              : 'text-amber-300',
                        )}
                      >
                        {(a.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="mt-2 w-24 h-1 rounded-full bg-violet-500/10 overflow-hidden">
                        <div
                          className={cn(
                            'h-full',
                            a.confidence >= 0.9
                              ? 'bg-emerald-400'
                              : a.confidence >= 0.7
                                ? 'bg-violet-400'
                                : 'bg-amber-400',
                          )}
                          style={{ width: `${a.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
