import { formatDate as formatSharedDate } from '@szl-holdings/shared-ui/utils';
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Globe,
  LinkIcon,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { apiFetchAdmin } from './api';

// ─── Revenue Analytics Panel ──────────────────────────────────────────────────

interface RevenueAnalytics {
  source: 'stripe' | 'database';
  stripeMode: 'live' | 'test' | 'mock';
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  canceledThisMonth: number;
  newSubscriptionsThisMonth: number;
  churnRate: number;
  totalLifetimeRevenue: number;
  recentInvoices: Array<{
    id: string;
    customerId: string;
    subscriptionId?: string;
    amount: number;
    currency: string;
    status: string;
    paidAt?: number;
    created: number;
    hostedInvoiceUrl?: string;
  }>;
}

function RevenuePanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetchAdmin<RevenueAnalytics>('/billing/revenue-analytics');
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleSyncPlans = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await apiFetchAdmin<{
        synced: number;
        plans: Array<{ slug: string; action: string }>;
      }>('/billing/sync-plans', {
        method: 'POST',
      });
      setSyncResult(`Synced ${res.synced} plan(s) from Stripe`);
    } catch (err) {
      setSyncResult(`Sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatCents = (cents: number, currency = 'usd') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);

  const formatDate = (ts: number) => formatSharedDate(new Date(ts * 1000));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500/60 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Failed to load revenue data</p>
        <p className="text-xs text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const d = data!;
  const modeColor =
    d.stripeMode === 'live' ? 'emerald' : d.stripeMode === 'test' ? 'amber' : 'zinc';
  const modeLabel =
    d.stripeMode === 'live' ? 'Live' : d.stripeMode === 'test' ? 'Test' : 'Demo / No Stripe Key';

  const kpis = [
    {
      label: 'MRR',
      value: formatCents(d.mrr),
      sub: `${formatCents(d.arr)} ARR`,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Active Subscriptions',
      value: d.activeSubscriptions,
      sub: d.trialingSubscriptions > 0 ? `+${d.trialingSubscriptions} trialing` : 'No trials',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Churn Rate (30d)',
      value: `${d.churnRate}%`,
      sub: `${d.canceledThisMonth} canceled`,
      color: d.churnRate > 5 ? 'text-red-400' : 'text-emerald-400',
      bg:
        d.churnRate > 5
          ? 'bg-red-500/10 border-red-500/20'
          : 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'New This Month',
      value: d.newSubscriptionsThisMonth,
      sub: d.pastDueSubscriptions > 0 ? `${d.pastDueSubscriptions} past due` : 'No past due',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Revenue Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time subscription and payment data{' '}
            {d.source === 'stripe' ? 'from Stripe' : 'from local database'}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[10px] font-medium px-2.5 py-1 rounded-full border',
              modeColor === 'emerald'
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                : modeColor === 'amber'
                  ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                  : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
            )}
          >
            {modeLabel}
          </span>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button
            onClick={handleSyncPlans}
            disabled={syncing || d.stripeMode === 'mock'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )}
            Sync Plans
          </button>
        </div>
      </div>

      {syncResult && (
        <div
          className={cn(
            'rounded-lg border px-4 py-3 text-xs',
            syncResult.includes('failed')
              ? 'border-red-500/20 bg-red-500/5 text-red-400'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
          )}
        >
          {syncResult}
        </div>
      )}

      {d.stripeMode === 'mock' && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-xs font-medium text-amber-500 mb-1">Stripe not connected</p>
          <p className="text-xs text-muted-foreground">
            Set the <code className="font-mono text-amber-400/80">STRIPE_SECRET_KEY</code> secret to
            see live revenue data from Stripe. Showing local database figures.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={cn('rounded-xl border p-4', kpi.bg)}>
            <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
            <p className={cn('text-2xl font-bold tracking-tight', kpi.color)}>{kpi.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Lifetime Revenue', value: formatCents(d.totalLifetimeRevenue) },
          { label: 'Trialing', value: d.trialingSubscriptions },
          {
            label: 'Past Due',
            value: d.pastDueSubscriptions,
            highlight: d.pastDueSubscriptions > 0,
          },
        ].map((item) => (
          <div
            key={item.label}
            className={cn(
              'rounded-xl border bg-card p-4',
              item.highlight ? 'border-red-500/30' : 'border-border',
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p
              className={cn(
                'text-lg font-semibold',
                item.highlight ? 'text-red-400' : 'text-foreground',
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {d.recentInvoices.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Recent Paid Invoices</h3>
          <div className="bg-card border border-border rounded-xl divide-y divide-border/50 overflow-hidden">
            {d.recentInvoices.slice(0, 10).map((inv) => (
              <div key={inv.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <code className="text-[10px] font-mono text-muted-foreground">{inv.id}</code>
                  <p className="text-xs text-foreground font-medium mt-0.5">
                    {formatCents(inv.amount, inv.currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {inv.paidAt ? formatDate(inv.paidAt) : formatDate(inv.created)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {inv.status}
                  </span>
                  {inv.hostedInvoiceUrl && (
                    <a
                      href={inv.hostedInvoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {d.recentInvoices.length === 0 && (
        <div className="rounded-xl border border-border bg-muted/10 p-6 text-center">
          <FileText className="w-7 h-7 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No recent invoices</p>
          <p className="text-xs text-muted-foreground">
            {d.stripeMode === 'mock'
              ? 'Connect Stripe to see real invoice history.'
              : 'Paid invoices will appear here once subscriptions are active.'}
          </p>
        </div>
      )}
    </div>
  );
}

export { RevenuePanel };
