import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Globe,
  Loader2,
  MessageSquare,
  RefreshCw,
  SmilePlus,
  Star,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetchAdmin } from './api';

// ─── Feedback & NPS Panel ────────────────────────────────────────────────────

interface FeedbackAnalytics {
  nps: {
    score: number | null;
    avgScore: number | null;
    total: number;
    promoters: number;
    passives: number;
    detractors: number;
    promoterPct: number;
    passivePct: number;
    detractorPct: number;
  };
  npsOverTime: { week: string; avgScore: number; count: number }[];
  perAppNps: {
    appName: string | null;
    avgScore: number;
    count: number;
    promoters: number;
    detractors: number;
  }[];
  contextual: { total: number; positive: number; negative: number; neutral: number };
  sentimentBreakdown: { sentiment: string | null; count: number }[];
  recentComments: {
    id: number;
    type: string;
    score: number | null;
    sentiment: string | null;
    comment: string | null;
    appName: string | null;
    pageUrl: string | null;
    userRole: string | null;
    createdAt: string;
  }[];
}

function NpsScoreGauge({ score }: { score: number | null }) {
  if (score === null)
    return (
      <div className="text-center py-4">
        <div className="text-4xl font-black text-muted-foreground">—</div>
        <div className="text-xs text-muted-foreground mt-1">No data yet</div>
      </div>
    );
  const color = score >= 50 ? 'text-emerald-500' : score >= 0 ? 'text-amber-500' : 'text-red-500';
  const label =
    score >= 50 ? 'Excellent' : score >= 20 ? 'Good' : score >= 0 ? 'Needs work' : 'Critical';
  return (
    <div className="text-center py-2">
      <div className={cn('text-5xl font-black tabular-nums', color)}>
        {score > 0 ? '+' : ''}
        {score}
      </div>
      <div className={cn('text-xs font-semibold mt-1', color)}>{label}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">NPS Score</div>
    </div>
  );
}

function FeedbackPanel() {
  const [typeFilter, setTypeFilter] = useState<'all' | 'nps' | 'contextual'>('all');
  const [page, setPage] = useState(1);

  const { data: analytics, isLoading: analyticsLoading } = useStandardQuery<FeedbackAnalytics>({
    queryKey: ['feedback-analytics'],
    queryFn: () => apiFetchAdmin<FeedbackAnalytics>('/admin/feedback/analytics'),
    refetchInterval: 60000,
  });

  const { data: listData, isLoading: listLoading } = useStandardQuery<{
    data: FeedbackAnalytics['recentComments'];
    pagination: { total: number; page: number; limit: number; pages: number };
  }>({
    queryKey: ['feedback-list', typeFilter, page],
    queryFn: () =>
      apiFetchAdmin(
        `/admin/feedback/list?type=${typeFilter === 'all' ? '' : typeFilter}&page=${page}&limit=10`,
      ),
    refetchInterval: 60000,
  });

  const nps = analytics?.nps;
  const contextual = analytics?.contextual;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <SmilePlus className="w-4 h-4 text-primary" /> Feedback & NPS Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          User sentiment, NPS scores, and contextual feedback across all apps.
        </p>
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── NPS Overview ─── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
              <NpsScoreGauge score={nps?.score ?? null} />
              <div className="w-full mt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-600 font-medium">Promoters (9-10)</span>
                  <span className="text-foreground font-bold">
                    {nps?.promoters ?? 0}{' '}
                    <span className="text-muted-foreground font-normal">
                      ({nps?.promoterPct ?? 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${nps?.promoterPct ?? 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-600 font-medium">Passives (7-8)</span>
                  <span className="text-foreground font-bold">
                    {nps?.passives ?? 0}{' '}
                    <span className="text-muted-foreground font-normal">
                      ({nps?.passivePct ?? 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${nps?.passivePct ?? 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 font-medium">Detractors (0-6)</span>
                  <span className="text-foreground font-bold">
                    {nps?.detractors ?? 0}{' '}
                    <span className="text-muted-foreground font-normal">
                      ({nps?.detractorPct ?? 0}%)
                    </span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${nps?.detractorPct ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" /> Contextual Feedback
              </h3>
              <div className="space-y-2">
                {[
                  {
                    label: 'Positive',
                    value: contextual?.positive ?? 0,
                    total: contextual?.total ?? 0,
                    color: 'bg-emerald-500',
                    textColor: 'text-emerald-600',
                    icon: ThumbsUp,
                  },
                  {
                    label: 'Negative',
                    value: contextual?.negative ?? 0,
                    total: contextual?.total ?? 0,
                    color: 'bg-red-500',
                    textColor: 'text-red-600',
                    icon: ThumbsDown,
                  },
                  {
                    label: 'Neutral',
                    value: contextual?.neutral ?? 0,
                    total: contextual?.total ?? 0,
                    color: 'bg-muted-foreground',
                    textColor: 'text-muted-foreground',
                    icon: MessageSquare,
                  },
                ].map((s) => {
                  const pct = s.total > 0 ? Math.round((s.value / s.total) * 100) : 0;
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn('flex items-center gap-1 font-medium', s.textColor)}>
                          <Icon className="w-3 h-3" /> {s.label}
                        </span>
                        <span className="text-foreground font-bold">
                          {s.value}{' '}
                          <span className="text-muted-foreground font-normal">({pct}%)</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all', s.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-1 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  {contextual?.total ?? 0} total responses
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" /> NPS by App
              </h3>
              {!analytics?.perAppNps?.length ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No per-app data yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {(analytics.perAppNps ?? []).slice(0, 6).map((app) => {
                    const appNps =
                      app.count > 0
                        ? Math.round(((app.promoters - app.detractors) / app.count) * 100)
                        : null;
                    const npsColor =
                      appNps === null
                        ? 'text-muted-foreground'
                        : appNps >= 50
                          ? 'text-emerald-500'
                          : appNps >= 0
                            ? 'text-amber-500'
                            : 'text-red-500';
                    return (
                      <div
                        key={app.appName ?? 'unknown'}
                        className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                      >
                        <div>
                          <div className="text-xs font-medium text-foreground">
                            {app.appName ?? 'Unknown'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {app.count} responses · avg {app.avgScore}
                          </div>
                        </div>
                        <div className={cn('text-sm font-black tabular-nums', npsColor)}>
                          {appNps !== null ? (appNps > 0 ? `+${appNps}` : String(appNps)) : '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── Recent Comments ─── */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-primary" /> Recent Comments
              </h3>
            </div>
            {!analytics?.recentComments?.length ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No comments submitted yet.
              </p>
            ) : (
              <div className="space-y-3">
                {(analytics.recentComments ?? []).slice(0, 8).map((c) => {
                  const sentimentColor =
                    c.sentiment === 'positive'
                      ? 'text-emerald-600 bg-emerald-500/8 border-emerald-500/20'
                      : c.sentiment === 'negative'
                        ? 'text-red-600 bg-red-500/8 border-red-500/20'
                        : 'text-muted-foreground bg-muted/40 border-border';
                  const scoreColor =
                    c.score !== null
                      ? c.score >= 9
                        ? 'bg-emerald-500 text-white'
                        : c.score >= 7
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      : 'bg-muted text-muted-foreground';
                  return (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {c.type === 'nps' ? (
                          <span
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black',
                              scoreColor,
                            )}
                          >
                            {c.score}
                          </span>
                        ) : (
                          <span
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center border text-[10px] font-semibold',
                              sentimentColor,
                            )}
                          >
                            {c.sentiment === 'positive'
                              ? '👍'
                              : c.sentiment === 'negative'
                                ? '👎'
                                : '💬'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed">{c.comment}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {c.appName && (
                            <span className="text-[10px] font-medium text-primary bg-primary/8 px-1.5 py-0.5 rounded">
                              {c.appName}
                            </span>
                          )}
                          {c.userRole && (
                            <span className="text-[10px] text-muted-foreground">{c.userRole}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── All Feedback Table ─── */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <h3 className="text-xs font-semibold text-foreground">All Feedback</h3>
              <div className="flex items-center gap-1.5">
                {(['all', 'nps', 'contextual'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTypeFilter(t);
                      setPage(1);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors capitalize',
                      typeFilter === t
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {listLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
              </div>
            ) : !listData?.data?.length ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No feedback entries found.
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {listData.data.map((entry) => {
                    const scoreColor =
                      entry.score !== null
                        ? entry.score >= 9
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : entry.score >= 7
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-red-500/10 text-red-600 border-red-500/20'
                        : null;
                    const sentimentIcon =
                      entry.sentiment === 'positive'
                        ? '👍'
                        : entry.sentiment === 'negative'
                          ? '👎'
                          : '💬';
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {entry.type === 'nps' && entry.score !== null ? (
                            <span
                              className={cn(
                                'text-[10px] font-black px-1.5 py-0.5 rounded border',
                                scoreColor,
                              )}
                            >
                              {entry.score}
                            </span>
                          ) : (
                            <span className="text-sm">{sentimentIcon}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded',
                                entry.type === 'nps'
                                  ? 'bg-blue-500/10 text-blue-600'
                                  : 'bg-violet-500/10 text-violet-600',
                              )}
                            >
                              {entry.type}
                            </span>
                            {entry.appName && (
                              <span className="text-[10px] text-muted-foreground">
                                {entry.appName}
                              </span>
                            )}
                            {entry.userRole && (
                              <span className="text-[10px] text-muted-foreground">
                                · {entry.userRole}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.comment && (
                            <p className="text-xs text-foreground mt-1 leading-relaxed">
                              {entry.comment}
                            </p>
                          )}
                          {!entry.comment && (
                            <p className="text-xs text-muted-foreground mt-0.5 italic">
                              No comment
                            </p>
                          )}
                          {entry.pageUrl && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
                              {entry.pageUrl}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {listData.pagination && listData.pagination.pages > 1 && (
                  <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground">
                      {listData.pagination.total} total · page {listData.pagination.page} of{' '}
                      {listData.pagination.pages}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                      >
                        ← Prev
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(listData.pagination.pages, p + 1))}
                        disabled={page === listData.pagination.pages}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-40 transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { FeedbackPanel };
